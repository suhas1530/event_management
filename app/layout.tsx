import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import Providers from './providers'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: { default: 'avān. — Your moment, perfectly designed.', template: '%s | avān.' },
  description: 'Premium event planning for the moments that matter. Discover, design and celebrate with avān.',
  keywords: ['event planning', 'wedding planner', 'birthday party', 'corporate events', 'event management India'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://avan.events',
    siteName: 'avān.',
    title: 'avān. — Your moment, perfectly designed.',
    description: 'Premium event planning for the moments that matter.',
  },
  twitter: { card: 'summary_large_image', title: 'avān.', description: 'Premium event planning for the moments that matter.' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0b0d',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${cormorant.variable} ${dmSans.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
