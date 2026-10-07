import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeIndianRupee,
  CalendarHeart,
  CreditCard,
  HelpCircle,
  MapPin,
  SearchX,
  ShieldCheck,
  UserCog,
  Wrench,
} from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import { PageHeader, Section } from '@/components/shared/Primitives'
import { buttonClass } from '@/lib/button-styles'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Help Center',
  description:
    'Answers about booking technicians, event requests, proposals, payments, cancellations and your account on avān.',
}

const TOPICS = [
  {
    icon: Wrench,
    title: 'Technician bookings',
    body: 'Choosing a service, scheduling a slot, rescheduling, and tracking your technician on the day.',
    link: { label: 'Browse services', href: '/services' },
  },
  {
    icon: CalendarHeart,
    title: 'Event planning',
    body: 'Submitting requirements, receiving a proposal, requesting changes, and approving your plan.',
    link: { label: 'Plan an event', href: '/plan-event' },
  },
  {
    icon: BadgeIndianRupee,
    title: 'Payments & pricing',
    body: 'How quotes are built, when payment is due, accepted methods, and cancellations.',
    link: { label: 'View bookings', href: '/bookings' },
  },
  {
    icon: UserCog,
    title: 'Account & profile',
    body: 'Updating your details, changing your password, notifications, and saved preferences.',
    link: { label: 'Your profile', href: '/profile' },
  },
]

const FAQS: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: 'Booking a technician',
    items: [
      {
        q: 'How do I book a professional for my home?',
        a: 'Go to Book a Technician, pick your service, describe the problem, choose a date and time slot, and review the price before you confirm. You will get a booking reference like TECH-2026-XXXXXX and you can track every status change from your dashboard.',
      },
      {
        q: 'How is the final price calculated?',
        a: 'The estimate you see at review is based on the service and quantity you selected. If the technician finds additional work once they arrive, they will quote it and get your approval before starting — nothing is added to your bill without confirmation.',
      },
      {
        q: 'Can I reschedule or cancel a booking?',
        a: 'Yes. Open the booking from your dashboard and use Reschedule or Cancel. Cancellation charges, if any, depend on how close to the slot you cancel, and the applicable amount is always shown before you confirm.',
      },
      {
        q: 'Are technicians verified?',
        a: 'Every technician completes identity and skill verification before they can accept jobs, and their rating is calculated only from completed bookings. You can see the rating on the service page before you book.',
      },
    ],
  },
  {
    group: 'Planning an event',
    items: [
      {
        q: 'How does event planning work here?',
        a: 'It starts with your requirements, not a package. You tell us what you are planning, when, where, how many guests, what you need arranged, and your approximate budget. An event manager reviews it and sends back a customised proposal.',
      },
      {
        q: 'Do I have to choose a package?',
        a: 'No. Packages are optional references. The proposal you receive is built around your guest count, venue, dates and budget, and every line item is itemised so you can see exactly what you are paying for.',
      },
      {
        q: 'What happens after I submit a request?',
        a: 'You receive a request reference (EVT-REQ-2026-XXXXX) and the request moves through four stages: Request submitted, Expert review, Customised proposal, then Your approval. You can see the current stage on your dashboard at any time.',
      },
      {
        q: 'Can I request changes to a proposal?',
        a: 'Yes. Use Request changes on the proposal and tell your manager what to adjust. Your request is attached to that proposal version, and you will receive a revised version to review.',
      },
    ],
  },
  {
    group: 'Payments & account',
    items: [
      {
        q: 'When am I charged for an event?',
        a: 'Payment is due only after you approve your customised proposal. Until then nothing is charged — you are reviewing a plan, not committing to it.',
      },
      {
        q: 'Which payment methods are accepted?',
        a: 'You can choose cash on service for technician bookings. For events, payment methods configured by our team are shown at the payment step of your booking.',
      },
      {
        q: 'How do I change my password?',
        a: 'Open Profile from the account menu, then use the security section to set a new password. You will stay signed in on your current device.',
      },
      {
        q: 'How do I manage notifications?',
        a: 'Open Notifications from your account menu to see every booking and proposal update. Marking items as read keeps the unread badge tidy.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <SiteShell>
      {/* Hero */}
      <div className="mx-auto w-full max-w-[1380px] px-5 pb-4 pt-16 sm:pt-20 lg:px-10">
        <PageHeader
          align="center"
          eyebrow="Help center"
          title="How can we help?"
          description="The answers to the questions we are asked most. If you still need a hand, our support desk is one message away."
          actions={
            <>
              <Link href="/contact" className={buttonClass('primary', 'md')}>
                <HelpCircle className="size-4" aria-hidden="true" />
                Contact support
              </Link>
              <a href={`mailto:${siteConfig.contact.email}`} className={buttonClass('secondary', 'md')}>
                {siteConfig.contact.email}
              </a>
            </>
          }
        />
      </div>

      {/* Help topics */}
      <Section eyebrow="Browse by topic" title="Start with a category" spacing="sm">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TOPICS.map(({ icon: Icon, title, body, link }) => (
            <article
              key={title}
              className="group flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[0.04]"
            >
              <span className="mb-5 grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-[0.9375rem] font-semibold text-white/90">{title}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-6 text-white/45">{body}</p>
              <Link
                href={link.href}
                className="mt-5 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-primary transition-colors duration-200 hover:text-primary-hover focus-visible:outline-none focus-visible:text-primary-hover"
              >
                {link.label}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </Section>

      {/* FAQ accordion */}
      <Section id="faqs" eyebrow="FAQs" title="Frequently asked questions" spacing="lg">
        <div className="mx-auto max-w-3xl">
          <Accordion className="rounded-2xl border border-white/8 bg-white/[0.02] px-5 sm:px-7">
            {FAQS.map(group => (
              <div key={group.group}>
                <p className="pb-1 pt-7 text-label text-primary first:pt-0">{group.group}</p>
                <Accordion type="single">
                  {group.items.map(item => (
                    <AccordionItem key={item.q} value={item.q}>
                      <AccordionTrigger>{item.q}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-pretty text-sm leading-7 text-white/50">{item.a}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* Still stuck */}
      <Section spacing="lg" className="border-t border-white/8 bg-white/[0.01]">
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
          {[
            { icon: SearchX, title: 'Still stuck?', body: 'Send us the details and we will investigate personally.', action: { label: 'Send a message', href: '/contact' } },
            { icon: CreditCard, title: 'Billing question', body: 'Invoices, payment status and refunds for any booking.', action: { label: 'View bookings', href: '/bookings' } },
            { icon: MapPin, title: 'Service area', body: 'We currently operate on-site across India. Enter your city to check.', action: { label: 'Check services', href: '/services' } },
          ].map(({ icon: Icon, title, body, action }) => (
            <div key={title} className="flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <Icon className="mb-4 size-5 text-primary" aria-hidden="true" />
              <h3 className="text-[0.9375rem] font-semibold text-white/90">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-white/45">{body}</p>
              <Link
                href={action.href}
                className="mt-5 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-primary hover:text-primary-hover"
              >
                {action.label}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Trust note */}
      <div className="mx-auto w-full max-w-[1380px] px-5 pb-20 lg:px-10">
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:gap-5 sm:p-7">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <p className="text-pretty text-sm leading-6 text-white/50">
            Every booking on avān. is covered by our service guarantee. If something does not go to plan,
            tell us within 24 hours and we will make it right.
          </p>
        </div>
      </div>
    </SiteShell>
  )
}