'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import Navbar from './Navbar'
import Footer from './Footer'

interface SiteShellProps {
  children: ReactNode
  /** Pages with a full-bleed hero can start with a transparent header. */
  transparentHeader?: boolean
  /** Hide the footer (rarely needed — e.g. immersive wizards). */
  hideFooter?: boolean
  /** Extra classes on the scrolling region. */
  className?: string
}

/**
 * The single layout wrapper for every public and customer-facing page.
 *
 * All pages previously rolled their own header/footer, which is what made the
 * product feel like a set of unrelated screens. Mounting the same Navbar and
 * Footer here is what gives the platform one design language (Part 45).
 */
export default function SiteShell({
  children,
  transparentHeader = false,
  hideFooter = false,
  className,
}: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar transparentAtTop={transparentHeader} />

      {/* Offset for the fixed header (h-16 / sm:h-[72px]). Pages with a
          transparent header own their top padding so the hero sits underneath. */}
      {!transparentHeader && (
        <div aria-hidden="true" className="h-16 sm:h-[72px]" />
      )}

      <main id="main" className={cn('flex-1', className)}>
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  )
}