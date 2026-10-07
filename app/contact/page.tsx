import type { Metadata } from 'next'
import SiteShell from '@/components/layout/SiteShell'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Talk to the avān. team about home services, event planning, billing or partnerships. We reply within one business day.',
}

export default function ContactPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-[1380px] px-5 py-16 sm:py-20 lg:px-10">
        <ContactForm />
      </div>
    </SiteShell>
  )
}