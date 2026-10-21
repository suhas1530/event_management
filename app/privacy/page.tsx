import type { Metadata } from 'next'
import LegalPage from '@/components/layout/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Heptome collects, uses, stores and protects your personal data — account details, bookings, event requirements and payment records.',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="2026-01-15"
      intro="This policy explains what personal data Heptome collects, why we collect it, how long we keep it, and the choices available to you. We collect only what we need to deliver a booking you have asked for."
      sections={[
        {
          heading: 'Information we collect',
          paragraphs: ['We collect the following categories of information:'],
          bullets: [
            'Account data — your name, email address, phone number, and (optionally) a profile photo you choose to upload.',
            'Booking data — the service address, time slot, problem description, pricing choices and payment method you select for each booking.',
            'Event requirement data — event type, date, guest count, location, budget range, the services you ask us to arrange, any additional notes, and reference images you choose to upload.',
            'Communication data — messages you send to event managers or our support team, and notifications we deliver to you.',
            'Technical data — your IP address, device and browser type, and pages visited, collected through server logs for security and performance.',
          ],
        },
        {
          heading: 'How we use your information',
          paragraphs: ['We use your data only for purposes that serve your booking:'],
          bullets: [
            'To match you with an appropriate technician or event manager.',
            'To process payments and issue invoices or receipts.',
            'To send booking updates, proposal notifications and service reminders.',
            'To provide customer support and resolve disputes.',
            'To meet legal, tax and regulatory obligations.',
            'To detect fraud, abuse and security incidents, and to improve the reliability of the platform.',
          ],
        },
        {
          heading: 'What we do not do',
          paragraphs: [
            'We do not sell your personal information. We do not rent, trade or share your data with third parties for their own marketing.',
            'We do not share the contents of your event requirements — including reference images — with anyone outside the event manager assigned to your request, except where required by law.',
          ],
        },
        {
          heading: 'Who we share it with',
          paragraphs: [
            'We share only the minimum necessary with the parties who deliver your service:',
          ],
          bullets: [
            'The assigned technician receives your service address, contact details and slot — enough to complete the job.',
            'The assigned event manager receives your event requirements so they can build your proposal.',
            'Payment processors receive the minimum required to complete a transaction.',
            'We may disclose information where required by law, or to protect the safety of users, technicians or our staff.',
          ],
        },
        {
          heading: 'How long we keep it',
          paragraphs: [
            'Account data is retained for as long as your account is active. Booking and payment records are retained for the period required by tax and accounting law, even if you close your account.',
            'If you request account deletion, we remove or anonymise your personal data, except for records we are legally required to retain.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: ['Depending on where you live, you may have the right to:'],
          bullets: [
            'Access a copy of the personal data we hold about you.',
            'Correct information that is inaccurate or incomplete.',
            'Request deletion of your account and personal data.',
            'Withdraw consent for optional communications.',
            'Object to or restrict certain processing of your data.',
          ],
        },
        {
          heading: 'Security',
          paragraphs: [
            'Passwords are stored using a memory-hard hash and are never stored in plain text. Data in transit is protected with TLS, and access to production data is limited to staff who need it.',
            'No system is perfectly secure. If a breach affects your information, we will notify you and the relevant authority as required by law.',
          ],
        },
        {
          heading: 'Cookies and local storage',
          paragraphs: [
            'We use essential local storage to keep you signed in and to remember your preferences. We do not use advertising cookies or third-party tracking pixels on this platform.',
          ],
        },
        {
          heading: 'Children',
          paragraphs: [
            'This platform is not intended for anyone under 18. We do not knowingly collect personal information from children, and if we learn that we have, we delete it.',
          ],
        },
        {
          heading: 'Changes and contact',
          paragraphs: [
            'We will update this policy when our practices change and will revise the date shown at the top. For any privacy question, or to exercise a right listed above, contact us and we will respond within 30 days.',
          ],
        },
      ]}
    />
  )
}