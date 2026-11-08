/**
 * Additive backfill for the payment rollout.
 *
 * Prisma `db push` creates new Mongo fields but does not backfill existing
 * documents. This script only sets missing defaults and creates the partial
 * unique phone index that MongoDB needs for optional phone numbers. It never
 * deletes or rewrites existing business data.
 *
 * Run once after deploying the schema:
 *   npm run db:backfill-payments
 */
import prisma from '../src/utils/database';
import { Prisma } from '@prisma/client';

type CommandResponse = { ok?: number; n?: number; nModified?: number };

async function setMissing(collection: string, filter: Record<string, unknown>, set: Record<string, unknown>) {
  const result = (await prisma.$runCommandRaw({
    update: collection,
    updates: [{ q: filter, u: { $set: set }, multi: true }],
  } as unknown as Prisma.InputJsonObject)) as CommandResponse;
  return result.nModified ?? result.n ?? 0;
}

async function main() {
  const results: Record<string, number> = {};

  results.bookingAppliedIds = await setMissing(
    'Booking',
    { appliedPaymentIds: { $exists: false } },
    { appliedPaymentIds: [] },
  );
  results.technicianBookingAppliedIds = await setMissing(
    'TechnicianBooking',
    { appliedPaymentIds: { $exists: false } },
    { appliedPaymentIds: [] },
  );
  results.eventRequestPaymentState = await setMissing(
    'EventRequest',
    {
      $or: [
        { paymentStatus: { $exists: false } },
        { advancePaidAmount: { $exists: false } },
        { appliedPaymentIds: { $exists: false } },
      ],
    },
    { paymentStatus: 'PENDING', advancePaidAmount: 0, appliedPaymentIds: [] },
  );
  results.paymentProvider = await setMissing(
    'Payment',
    { $or: [{ provider: { $exists: false } }, { refundAmount: { $exists: false } }] },
    { provider: 'razorpay', refundAmount: 0 },
  );
  results.technicianPaymentProvider = await setMissing(
    'TechnicianPayment',
    { $or: [{ provider: { $exists: false } }, { refundAmount: { $exists: false } }] },
    { provider: 'razorpay', refundAmount: 0 },
  );

  // The old schema declared `phone String? @unique`, which MongoDB cannot
  // enforce when multiple users have no phone. Replace it with a partial index
  // that only applies to actual strings.
  try {
    await prisma.$runCommandRaw({ dropIndexes: 'User', index: 'User_phone_key' } as unknown as Prisma.InputJsonObject);
  } catch {
    // Index was never created (the previous db push failed on it).
  }

  const duplicates = (await prisma.$runCommandRaw({
    aggregate: 'User',
    pipeline: [
      { $match: { phone: { $type: 'string' } } },
      { $group: { _id: '$phone', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ],
    cursor: {},
  } as unknown as Prisma.InputJsonObject)) as { cursor?: { firstBatch?: unknown[] } };
  const duplicateCount = duplicates.cursor?.firstBatch?.length ?? 0;
  if (duplicateCount > 0) {
    throw new Error(
      `Cannot create the partial phone index: ${duplicateCount} duplicate non-null phone value(s) exist. Resolve them first.`,
    );
  }

  try {
    await prisma.$runCommandRaw({
      createIndexes: 'User',
      indexes: [
        {
          key: { phone: 1 },
          name: 'User_phone_partial_key',
          unique: true,
          partialFilterExpression: { phone: { $type: 'string' } },
        },
      ],
    } as unknown as Prisma.InputJsonObject);
    results.partialPhoneIndex = 1;
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 85 || code === 86) {
      results.partialPhoneIndex = 0; // already exists
    } else {
      throw error;
    }
  }

  console.log('✅ Payment backfill complete');
  for (const [name, count] of Object.entries(results)) {
    console.log(`   ${name}: ${count}`);
  }
}

main()
  .catch(error => {
    console.error('❌ Payment backfill failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
