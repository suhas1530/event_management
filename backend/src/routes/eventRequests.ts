import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, NotFoundError, AuthorizationError, ValidationError } from '../middleware/errorHandler';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import prisma from '../utils/database';

const router = Router();
const paramsSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) });
const eventRequestStatusSchema = z.enum([
  'REQUIREMENT_SUBMITTED', 'UNDER_REVIEW', 'EVENT_MANAGER_ASSIGNED', 'REQUIREMENT_DISCUSSION',
  'PROPOSAL_PREPARING', 'PROPOSAL_SENT', 'CUSTOMER_REVIEWING', 'CHANGES_REQUESTED',
  'PROPOSAL_APPROVED', 'ADVANCE_PAYMENT_PENDING', 'ADVANCE_PAYMENT_RECEIVED', 'EVENT_CONFIRMED',
  'PLANNING_IN_PROGRESS', 'EVENT_PREPARATION', 'EVENT_DAY', 'EVENT_COMPLETED', 'FINAL_PAYMENT', 'COMPLETED',
]);
const requestSchema = z.object({
  eventType: z.string().min(1).max(80),
  eventDate: z.string().datetime().optional().nullable(),
  guestCount: z.number().int().positive().optional().nullable(),
  city: z.string().max(120).optional(),
  budgetLabel: z.string().max(120).optional(),
  requirements: z.record(z.unknown()),
  referenceImages: z.array(z.string().max(750_000).regex(/^data:image\/(jpeg|png|webp|gif);base64,/, 'Reference must be a supported image')).max(5).optional(),
});

function validateRequestConstraints(req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) {
  if (JSON.stringify(req.body.requirements).length > 50_000) {
    return next(new ValidationError('Requirements must be 50 KB or less'));
  }
  if (req.body.eventDate && new Date(req.body.eventDate).getTime() < Date.now()) {
    return next(new ValidationError('Event date must be in the future'));
  }
  next();
}

function createRequestNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(10000 + Math.random() * 90000);
  return `EVT-REQ-${year}-${suffix}`;
}

router.post('/', authMiddleware, validateBody(requestSchema.extend({ status: z.enum(['DRAFT', 'REQUIREMENT_SUBMITTED']).default('DRAFT') })), validateRequestConstraints, asyncHandler(async (req, res) => {
  const data = req.body;
  const eventRequest = await prisma.eventRequest.create({
    data: {
      requestNumber: createRequestNumber(),
      customerId: req.user!.id,
      eventType: data.eventType,
      eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      guestCount: data.guestCount ?? undefined,
      city: data.city,
      budgetLabel: data.budgetLabel,
      requirements: data.requirements,
      referenceImages: data.referenceImages ?? [],
      status: data.status,
    },
  });
  res.status(201).json(eventRequest);
}));

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const where = ['ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'].includes(req.user!.role)
    ? {}
    : { customerId: req.user!.id };
  const requests = await prisma.eventRequest.findMany({
    where,
    select: {
      id: true, requestNumber: true, customerId: true, eventType: true, eventDate: true,
      guestCount: true, city: true, budgetLabel: true, status: true, assignedManagerId: true,
      createdAt: true, updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
}));

router.get('/:id', authMiddleware, validateParams(paramsSchema), asyncHandler(async (req, res) => {
  const eventRequest = await prisma.eventRequest.findUnique({
    where: { id: req.params.id },
    include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!eventRequest) throw new NotFoundError('Event request not found');
  if (eventRequest.customerId !== req.user!.id && !['ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'].includes(req.user!.role)) {
    throw new AuthorizationError();
  }
  res.json(eventRequest);
}));

router.get('/:id/proposals', authMiddleware, validateParams(paramsSchema), asyncHandler(async (req, res) => {
  const eventRequest = await prisma.eventRequest.findUnique({ where: { id: req.params.id } });
  if (!eventRequest) throw new NotFoundError('Event request not found');
  if (eventRequest.customerId !== req.user!.id && !['ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'].includes(req.user!.role)) {
    throw new AuthorizationError();
  }
  const proposals = await prisma.eventProposal.findMany({ where: { requestId: req.params.id }, orderBy: { version: 'desc' } });
  res.json(proposals);
}));

router.post('/:id/proposals/:proposalId/approve', authMiddleware, validateParams(paramsSchema.extend({ proposalId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), asyncHandler(async (req, res) => {
  const eventRequest = await prisma.eventRequest.findUnique({ where: { id: req.params.id } });
  if (!eventRequest) throw new NotFoundError('Event request not found');
  if (eventRequest.customerId !== req.user!.id) throw new AuthorizationError();
  const proposal = await prisma.eventProposal.findFirst({ where: { id: req.params.proposalId, requestId: eventRequest.id } });
  if (!proposal || proposal.status !== 'SENT') throw new NotFoundError('Available proposal not found');
  const updatedProposal = await prisma.eventProposal.update({ where: { id: proposal.id }, data: { status: 'APPROVED' } });
  await prisma.eventRequest.update({ where: { id: eventRequest.id }, data: { status: 'ADVANCE_PAYMENT_PENDING' } });
  res.json(updatedProposal);
}));

router.post('/:id/proposals/:proposalId/request-changes', authMiddleware, validateParams(paramsSchema.extend({ proposalId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), validateBody(z.object({ message: z.string().min(5).max(2000) })), asyncHandler(async (req, res) => {
  const eventRequest = await prisma.eventRequest.findUnique({ where: { id: req.params.id } });
  if (!eventRequest) throw new NotFoundError('Event request not found');
  if (eventRequest.customerId !== req.user!.id) throw new AuthorizationError();
  const proposal = await prisma.eventProposal.findFirst({ where: { id: req.params.proposalId, requestId: eventRequest.id } });
  if (!proposal || proposal.status !== 'SENT') throw new NotFoundError('Available proposal not found');
  const updatedProposal = await prisma.eventProposal.update({ where: { id: proposal.id }, data: { status: 'CHANGES_REQUESTED', changeRequests: [...proposal.changeRequests, req.body.message] } });
  await prisma.eventRequest.update({ where: { id: eventRequest.id }, data: { status: 'CHANGES_REQUESTED' } });
  res.json(updatedProposal);
}));

router.patch('/:id', authMiddleware, validateParams(paramsSchema), validateBody(requestSchema), validateRequestConstraints, asyncHandler(async (req, res) => {
  const existing = await prisma.eventRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError('Event request not found');
  if (existing.customerId !== req.user!.id) throw new AuthorizationError();
  if (!['DRAFT', 'REQUIREMENT_SUBMITTED', 'UNDER_REVIEW'].includes(existing.status)) {
    throw new AuthorizationError('Requirements can no longer be edited after proposal work has started');
  }

  const data = req.body;
  const eventRequest = await prisma.eventRequest.update({
    where: { id: existing.id },
    data: {
      eventType: data.eventType,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      guestCount: data.guestCount ?? null,
      city: data.city,
      budgetLabel: data.budgetLabel,
      requirements: data.requirements,
      referenceImages: data.referenceImages ?? [],
    },
  });
  res.json(eventRequest);
}));

router.post('/:id/submit', authMiddleware, validateParams(paramsSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.eventRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError('Event request not found');
  if (existing.customerId !== req.user!.id) throw new AuthorizationError();
  if (existing.status !== 'DRAFT') throw new AuthorizationError('This event request has already been submitted');

  const eventRequest = await prisma.eventRequest.update({
    where: { id: existing.id },
    data: { status: 'REQUIREMENT_SUBMITTED' },
  });
  res.json(eventRequest);
}));

router.patch('/:id/status', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'), validateParams(paramsSchema), validateBody(z.object({ status: eventRequestStatusSchema })), asyncHandler(async (req, res) => {
  const eventRequest = await prisma.eventRequest.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });
  res.json(eventRequest);
}));

export default router;