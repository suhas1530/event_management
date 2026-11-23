import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter, Manrope, Space_Grotesk } from 'next/font/google'
import Providers from './providers'
import './globals.css'
import { brand } from '@/lib/brand'
import { siteConfig } from '@/lib/site-config'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  preload: false,
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})
/* Manrope carries headings and UI display type; Inter carries body copy.
   Space Grotesk is retained solely as the brand wordmark face so the existing
   Heptome logo is pixel-for-pixel unchanged. Cormorant stays as the editorial
   serif accent that is part of the current visual identity. */
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['400', '500', '600', '700'],
  preload: false,
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
  colorScheme: 'light dark',
  // A single theme-color meta is kept in sync by the bootstrap script and the
  // provider, so browser chrome follows the chosen mode rather than the OS
  // alone. Media-specific static tags would fight an explicit override.
}

/** Runs before first paint: stored choice first, otherwise the OS preference.
 *  `system` is a real persisted mode, so the inline script resolves it against
 *  `prefers-color-scheme` and records both the resolved theme and the mode.
 *  The key is inlined because the provider is a client module and its constant
 *  cannot be referenced as a value from a server component. */
const themeBootstrap = `(function(){var stored=null;try{stored=localStorage.getItem('heptome-theme');}catch(e){}var mode=stored==='light'||stored==='dark'||stored==='system'?stored:'system';var dark=mode==='dark';if(mode==='system'){try{dark=!!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);}catch(e){dark=false;}}var r=document.documentElement;r.classList.toggle('dark',dark);r.dataset.theme=dark?'dark':'light';r.dataset.themeMode=mode;var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m);}m.setAttribute('content',dark?'#171b19':'#f8f6f2');})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={`${cormorant.variable} ${inter.variable} ${manrope.variable} ${spaceGrotesk.variable} bg-background text-foreground antialiased`}>
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
