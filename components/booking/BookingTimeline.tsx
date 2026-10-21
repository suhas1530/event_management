import type { TimelineEntry } from '@/lib/api'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

interface BookingTimelineProps {
  timeline: TimelineEntry[]
  currentStatus?: string
}

const ALL_STEPS = [
  { status: 'REQUESTED', label: 'Booking Requested', desc: 'Request received by our team' },
  { status: 'PENDING_REVIEW', label: 'Planner Reviewing', desc: 'Our planner is reviewing your request' },
  { status: 'QUOTED', label: 'Quote Prepared', desc: 'Detailed quote prepared for your event' },
  { status: 'CUSTOMER_APPROVAL', label: 'Awaiting Approval', desc: 'Your approval is needed to proceed' },
  { status: 'PAYMENT_PENDING', label: 'Payment Pending', desc: 'Complete payment to confirm booking' },
  { status: 'CONFIRMED', label: 'Booking Confirmed', desc: 'Your event is locked in!' },
  { status: 'IN_PROGRESS', label: 'Event Day', desc: 'Your celebration is happening' },
  { status: 'COMPLETED', label: 'Completed', desc: 'Thank you for celebrating with Heptome.' },
]

const STATUS_ORDER: Record<string, number> = Object.fromEntries(ALL_STEPS.map((s, i) => [s.status, i]))

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function BookingTimeline({ timeline, currentStatus }: BookingTimelineProps) {
  const currentIdx = currentStatus ? (STATUS_ORDER[currentStatus] ?? -1) : -1

  // Build a map of status → timeline entry for annotation
  const entryByStatus = new Map<string, TimelineEntry>(
    timeline.filter(e => STATUS_ORDER[e.status] !== undefined).map(e => [e.status, e])
  )

  return (
    <div className="relative" role="list" aria-label="Booking progress">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-muted" aria-hidden="true" />

      <ol className="space-y-0">
        {ALL_STEPS.map((step, idx) => {
          const done = idx < currentIdx
          const active = idx === currentIdx
          const pending = idx > currentIdx
          const entry = entryByStatus.get(step.status)

          return (
            <li key={step.status} className="relative flex gap-6 pb-8 last:pb-0" role="listitem">
              {/* Icon */}
              <div className={`relative z-10 flex size-8 flex-shrink-0 items-center justify-center transition-all ${
                done ? 'bg-[#d5ae79]' : active ? 'border-2 border-[#d5ae79] bg-card' : 'border border-border bg-background'
              }`}>
                {done ? (
                  <CheckCircle2 className="size-4 text-foreground" aria-label="Completed" />
                ) : active ? (
                  <Clock className="size-3.5 text-gold-text animate-pulse" aria-label="Current step" />
                ) : (
                  <Circle className="size-3.5 text-muted-foreground/80" aria-label="Pending" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <p className={`text-sm font-medium ${done || active ? 'text-foreground' : 'text-muted-foreground/80'}`}>
                  {step.label}
                </p>
                <p className={`mt-0.5 text-xs ${done || active ? 'text-muted-foreground' : 'text-muted-foreground/80'}`}>
                  {entry?.description ?? step.desc}
                </p>
                {entry && (
                  <p className="mt-1 text-[10px] text-gold-text/70">
                    {fmtDate(entry.createdAt)} at {fmtTime(entry.createdAt)}
                  </p>
                )}
                {active && (
                  <span className="mt-2 inline-block bg-[#d5ae79]/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[#d5ae79]">
                    Current
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
