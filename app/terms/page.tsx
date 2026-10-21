import type { Metadata } from 'next'
import LegalPage from '@/components/layout/LegalPage'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms that govern your use of Heptome — bookings, event requests, payments, cancellations and responsibilities for customers and technicians.',
}

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      updated="2026-01-15"
      intro="These terms explain the agreement between you and Heptome when you use our platform to book home services or plan an event. By creating an account or placing a booking, you accept them."
      sections={[
        {
          heading: 'About this agreement',
          paragraphs: [
            'Heptome operates a marketplace connecting customers with verified technicians for home services, and with event managers for the planning and execution of events. When you place a booking, your contract for the service itself is between you and the technician or event manager delivering it. We operate the platform, the payment flow and the quality standards that hold all parties to the same rules.',
            'These terms apply to every visitor and registered user of the platform. Where a specific booking includes additional commitments — for example, a signed event proposal — those commitments supplement, and do not replace, these terms.',
          ],
        },
        {
          heading: 'Eligibility and accounts',
          paragraphs: [
            'You must be at least 18 years old to create an account or enter a binding booking agreement.',
            'You are responsible for keeping your credentials secure and for all activity under your account. Tell us immediately if you suspect unauthorised access. We may suspend accounts that are used fraudulently, for unlawful purposes, or in a way that harms other users or our team.',
          ],
        },
        {
          heading: 'Technician bookings',
          paragraphs: [
            'When you book a technician, you provide a service address, a time slot and a description of the work. The estimate shown before confirmation is based on that information and the selected service.',
            'If, after inspection, the technician determines the work requires a different service or additional parts, they must quote the change and obtain your approval before proceeding. We do not permit work to be added to your invoice without your agreement.',
          ],
          bullets: [
            'Access to the service location must be available at the confirmed time.',
            'You are responsible for securing valuables and moving personal items that may obstruct the work.',
            'Permitting entry to a property you do not own requires the owner’s or occupant’s consent.',
          ],
        },
        {
          heading: 'Event requests and proposals',
          paragraphs: [
            'Event planning on this platform is requirement-first. You submit what you are planning — event type, date, guest count, location, services required, budget and any additional notes — and an event manager reviews it before quoting.',
            'A proposal is a quotation, not an invoice. Nothing is charged until you approve a proposal and payment falls due. Until you approve, you may request changes or withdraw your request at no cost.',
            'Where you approve a proposal, the scope, line items and totals shown in that proposal version form the agreed scope of work. Any change outside that scope is re-quoted.',
          ],
        },
        {
          heading: 'Pricing, payment and taxes',
          paragraphs: [
            'All prices are shown in Indian Rupees (₹). Prices include applicable taxes unless a proposal explicitly states otherwise.',
            'Payment obligations for event planning arise only on proposal approval. For technician bookings, the payment method selected at checkout applies — including cash on service, where payment is made directly to the technician.',
            'If a proposal becomes stale before you respond, we may re-validate availability and pricing. We will always notify you before any revised figure takes effect.',
          ],
        },
        {
          heading: 'Cancellations and rescheduling',
          paragraphs: [
            'Either side can cancel a booking. The cancellation window, and any charge that applies within it, is displayed before you confirm the cancellation — so you always see the consequence before acting.',
            'Where we cancel for reasons within our control — technician no-show, inability to serve your area, or a system failure on our part — no cancellation charge applies and we will help you rebook at the earliest alternative slot.',
            'Refunds, where applicable, are returned to the original payment method. Settlement timelines depend on your bank or payment provider.',
          ],
        },
        {
          heading: 'Ratings and reviews',
          paragraphs: [
            'Ratings are published only for completed bookings, so reviews reflect work actually delivered.',
            'Reviews must describe your own experience. Reviews that are abusive, defamatory, contain personal information about third parties, or are written to pressure a refund may be removed.',
          ],
        },
        {
          heading: 'Acceptable use',
          paragraphs: ['You agree not to use the platform to:'],
          bullets: [
            'Request services for fraudulent, unlawful or harmful purposes.',
            'Attempt to access another user’s account, bookings or personal data.',
            'Interfere with the platform’s operation, including by automating requests or scraping content.',
            'Misrepresent the service address, requirements or budget in a way that misleads a technician or event manager.',
          ],
        },
        {
          heading: 'Liability',
          paragraphs: [
            'We provide the platform, the booking flow and the coordination between parties. We do not manufacture the services themselves, and our liability for any service performed by an independent technician or event manager is limited to the value of that booking.',
            'We are not liable for indirect or consequential losses, including lost profit or lost opportunity. Nothing in these terms excludes liability that cannot lawfully be excluded, including for fraud or gross negligence.',
          ],
        },
        {
          heading: 'Intellectual property',
          paragraphs: [
            'The Heptome name, logo, interface and underlying software are our property. Reference images, designs and event concepts you submit remain yours; by uploading them you grant us a limited licence to host and display them as part of delivering your request.',
          ],
        },
        {
          heading: 'Changes to these terms',
          paragraphs: [
            'We may update these terms as the platform evolves. Material changes will be communicated through the platform or by email before they take effect. Continuing to use the platform after a change takes effect constitutes acceptance of the updated terms.',
          ],
        },
        {
          heading: 'Governing law',
          paragraphs: [
            'These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts at the registered office of the operating entity, subject to any mandatory consumer-protection provisions that apply to you.',
          ],
        },
      ]}
    />
  )
}