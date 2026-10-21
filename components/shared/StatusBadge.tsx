/**
 * Status system (Part 32).
 *
 * Every status in the product maps to one of five semantic tones, so a status
 * always looks the same no matter which screen renders it. Colour is never the
 * only signal — each badge also carries a text label and an icon.
 *
 *   success  → Completed, Confirmed, Paid, Approved
 *   warning  → Pending, Awaiting Approval, Changes Requested
 *   error    → Cancelled, Failed, Rejected, Overdue
 *   info     → Assigned, In Progress, On The Way
 *   neutral  → Draft, Submitted, Under Review
 */

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'text-emerald-300 bg-emerald-500/12 ring-emerald-500/25',
  warning: 'text-amber-300 bg-amber-500/12 ring-amber-500/25',
  error: 'text-red-300 bg-red-500/12 ring-red-500/25',
  info: 'text-sky-300 bg-sky-500/12 ring-sky-500/25',
  neutral: 'text-muted-foreground bg-muted/60 ring-white/12',
}

/** Raw enum value → human label + tone. */
const STATUS_MAP: Record<string, { label: string; tone: StatusTone }> = {
  // ── Event bookings ──
  DRAFT: { label: 'Draft', tone: 'neutral' },
  REQUESTED: { label: 'Submitted', tone: 'neutral' },
  PENDING_REVIEW: { label: 'Under review', tone: 'neutral' },
  QUOTED: { label: 'Proposal ready', tone: 'info' },
  CUSTOMER_APPROVAL: { label: 'Awaiting approval', tone: 'warning' },
  CHANGES_REQUESTED: { label: 'Changes requested', tone: 'warning' },
  PAYMENT_PENDING: { label: 'Payment due', tone: 'warning' },
  CONFIRMED: { label: 'Confirmed', tone: 'success' },
  IN_PROGRESS: { label: 'In progress', tone: 'info' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'error' },
  REJECTED: { label: 'Rejected', tone: 'error' },

  // ── Technician bookings ──
  PENDING: { label: 'Pending', tone: 'warning' },
  TECHNICIAN_ASSIGNED: { label: 'Technician assigned', tone: 'info' },
  TECHNICIAN_CONFIRMED: { label: 'Technician confirmed', tone: 'info' },
  TECHNICIAN_ON_THE_WAY: { label: 'On the way', tone: 'info' },
  TECHNICIAN_ARRIVED: { label: 'Arrived', tone: 'info' },
  SERVICE_STARTED: { label: 'In progress', tone: 'info' },
  SERVICE_COMPLETED: { label: 'Completed', tone: 'success' },
  PAYMENT_COMPLETED: { label: 'Paid', tone: 'success' },
  REVIEW_SUBMITTED: { label: 'Reviewed', tone: 'success' },

  // ── Event requests (full set from backend/src/routes/eventRequests.ts) ──
  REQUIREMENT_SUBMITTED: { label: 'Requirement submitted', tone: 'neutral' },
  UNDER_REVIEW: { label: 'Under review', tone: 'neutral' },
  EVENT_MANAGER_ASSIGNED: { label: 'Manager assigned', tone: 'info' },
  REQUIREMENT_DISCUSSION: { label: 'Requirements discussion', tone: 'info' },
  PROPOSAL_PREPARING: { label: 'Proposal preparing', tone: 'info' },
  PROPOSAL_SENT: { label: 'Proposal sent', tone: 'info' },
  CUSTOMER_REVIEWING: { label: 'Awaiting your review', tone: 'warning' },
  PROPOSAL_APPROVED: { label: 'Proposal approved', tone: 'success' },
  ADVANCE_PAYMENT_PENDING: { label: 'Advance payment due', tone: 'warning' },
  ADVANCE_PAYMENT_RECEIVED: { label: 'Advance paid', tone: 'success' },
  EVENT_CONFIRMED: { label: 'Event confirmed', tone: 'success' },
  PLANNING_IN_PROGRESS: { label: 'Planning in progress', tone: 'info' },
  EVENT_PREPARATION: { label: 'Event preparation', tone: 'info' },
  EVENT_DAY: { label: 'Event day', tone: 'info' },
  EVENT_COMPLETED: { label: 'Event completed', tone: 'success' },
  FINAL_PAYMENT: { label: 'Final payment due', tone: 'warning' },

  // ── Proposals / generic ──
  SENT: { label: 'Sent', tone: 'info' },
  EXPIRED: { label: 'Expired', tone: 'error' },
  APPROVED: { label: 'Approved', tone: 'success' },
  PAID: { label: 'Paid', tone: 'success' },

  // ── Payments / generic ──
  FAILED: { label: 'Failed', tone: 'error' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
  SUBMITTED: { label: 'Submitted', tone: 'neutral' },
}

/** Fallback for statuses we have not mapped yet. */
function humanise(raw: string): string {
  return raw
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

export function resolveStatus(status: string): { label: string; tone: StatusTone } {
  const key = status?.toUpperCase?.() ?? ''
  return STATUS_MAP[key] ?? { label: humanise(key) || 'Unknown', tone: 'neutral' }
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
  /** Override the tone when a screen needs a different emphasis. */
  tone?: StatusTone
  className?: string
}

export default function StatusBadge({ status, size = 'md', tone, className }: StatusBadgeProps) {
  const resolved = resolveStatus(status)
  const finalTone = tone ?? resolved.tone
  const sizing = size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium uppercase tracking-[0.12em] ring-1 ring-inset ${sizing} ${TONE_CLASSES[finalTone]} ${className ?? ''}`}
    >
      {/* Status dot: a non-colour cue so the badge is not colour-only. */}
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {resolved.label}
    </span>
  )
}