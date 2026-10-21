import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter, Space_Grotesk } from 'next/font/google'
import Providers from './providers'
import './globals.css'
import { brand } from '@/lib/brand'
import { siteConfig } from '@/lib/site-config'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${brand.name} — ${brand.headline}`, template: `%s | ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  keywords: [
    'event planning',
    'wedding planner',
    'corporate events',
    'venue booking',
    'home services',
    'home cleaning',
    'AC repair',
    'plumbing',
    'electrician',
    'Bengaluru',
  ],
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: brand.name,
    title: `${brand.name} — ${brand.headline}`,
    description: brand.tagline,
  },
  twitter: {
    card: 'summary_large_image',
    title: brand.name,
    description: brand.tagline,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#17151D',
}

/** Runs before first paint: applies the stored theme (or dark default).
 *  The key is inlined because the provider is a client module and its
 *  constant cannot be referenced as a value from a server component. */
const themeBootstrap = `(function(){try{var t=localStorage.getItem('heptome-theme');if(t!=='light'&&t!=='dark'){t='dark';}var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.dataset.theme=t;}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={`${cormorant.variable} ${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
