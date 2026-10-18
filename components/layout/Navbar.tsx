'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  CalendarDays,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { notificationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { navLinks, siteConfig } from '@/lib/site-config'
import { Separator } from '@/components/ui/Separator'

interface NavbarProps {
  /** Pages that render their own full-bleed hero start transparent at the top. */
  transparentAtTop?: boolean
}

export default function Navbar({ transparentAtTop = false }: NavbarProps) {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  const profileRef = useRef<HTMLDivElement>(null)

  /* Scroll state — header blurs in once the user leaves the top of the page. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Close transient UI on navigation. */
  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [pathname])

  /* Lock body scroll while the mobile drawer is open. */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  /* Escape closes the drawer / dropdown. */
  useEffect(() => {
    if (!mobileOpen && !profileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMobileOpen(false)
      setProfileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, profileOpen])

  /* Dismiss the profile dropdown on outside click. */
  useEffect(() => {
    if (!profileOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [profileOpen])

  /* Unread notification count. */
  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0)
      return
    }
    let cancelled = false
    notificationsApi
      .list({ limit: 1 })
      .then(res => {
        if (!cancelled) setUnread(res.unreadCount ?? 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, pathname])

  const isSolid = scrolled || !transparentAtTop

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    // Anchor links are only "current" on their own page.
    const base = href.split('#')[0]
    return base !== '/' && pathname.startsWith(base)
  }

  const accountLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/bookings', label: 'My Bookings', icon: CalendarDays },
    { href: '/event-requests', label: 'Event Requests', icon: Sparkles },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[var(--z-fixed)] transition-all duration-300 ease-out',
          isSolid
            ? 'border-b border-white/10 bg-[#0b0b0d]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0b0b0d]/70'
            : 'border-b border-transparent bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1380px] items-center justify-between gap-4 px-5 sm:h-[72px] lg:px-10">
          {/* Logo */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
            aria-label={`${siteConfig.name} — home`}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary transition-transform duration-300 ease-out group-hover:scale-105">
              <Wrench className="size-4 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="font-serif text-xl leading-none tracking-tight text-white">
              avān<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:block" aria-label="Main">
            <ul className="flex items-center gap-0.5" role="list">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className={cn(
                      'relative inline-flex items-center rounded-lg px-3.5 py-2 text-[0.8125rem] font-medium transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive(link.href)
                        ? 'text-primary'
                        : 'text-white/55 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated && (
              <Link
                href="/notifications"
                className="relative rounded-lg p-2 text-white/55 transition-colors duration-200 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
              >
                <Bell className="size-[18px]" aria-hidden="true" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 flex min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[0.5625rem] font-bold leading-4 text-primary-foreground">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3 text-sm text-white/75 transition-colors duration-200 hover:border-primary/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-7 items-center justify-center rounded-md bg-primary/20 text-[0.8125rem] font-semibold text-primary">
                    {user?.name?.[0]?.toUpperCase() ?? <User className="size-4" aria-hidden="true" />}
                  </span>
                  <span className="max-w-[7rem] truncate">{user?.name?.split(' ')[0]}</span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full z-[var(--z-popover)] mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#141417] shadow-2xl"
                    >
                      <div className="border-b border-white/8 px-4 py-3">
                        <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                        <p className="truncate text-xs text-white/40">{user?.email}</p>
                      </div>
                      <div className="p-1.5">
                        {accountLinks.map(({ href, label, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            role="menuitem"
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/65 transition-colors duration-150 hover:bg-white/5 hover:text-white focus-visible:bg-white/5 focus-visible:text-white focus-visible:outline-none"
                          >
                            <Icon className="size-4 shrink-0 text-white/40" aria-hidden="true" />
                            {label}
                          </Link>
                        ))}
                      </div>
                      <Separator />
                      <div className="p-1.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void logout()}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-destructive transition-colors duration-150 hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none"
                        >
                          <LogOut className="size-4 shrink-0" aria-hidden="true" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2.5 text-[0.8125rem] font-medium text-white/70 transition-colors duration-200 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Log in
                </Link>
                <Link
                  href="/plan-event"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[0.8125rem] font-semibold text-primary-foreground transition-all duration-200 ease-out hover:-translate-y-px hover:bg-primary-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Plan Your Event
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="-mr-1 rounded-lg p-2 text-white/70 transition-colors duration-200 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            {mobileOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[var(--z-dropdown)] bg-black/65 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.nav
              id="mobile-nav"
              aria-label="Mobile"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-[var(--z-modal)] flex w-full max-w-sm flex-col border-l border-white/10 bg-[#0e0e11] shadow-2xl lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/8 px-5 sm:h-[72px]">
                <span className="font-serif text-xl leading-none text-white">
                  avān<span className="text-primary">.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                <ul className="space-y-1" role="list">
                  {navLinks.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={isActive(link.href) ? 'page' : undefined}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-4 py-3 text-[0.9375rem] font-medium transition-colors duration-200',
                          isActive(link.href)
                            ? 'bg-primary/10 text-primary'
                            : 'text-white/65 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {isAuthenticated && (
                  <>
                    <Separator className="my-5" />
                    <p className="mb-2 px-4 text-label text-white/35">Your account</p>
                    <ul className="space-y-1" role="list">
                      {accountLinks.map(({ href, label, icon: Icon }) => (
                        <li key={href}>
                          <Link
                            href={href}
                            className="flex items-center gap-3 rounded-lg px-4 py-3 text-[0.9375rem] text-white/65 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                          >
                            <Icon className="size-4 shrink-0 text-white/40" aria-hidden="true" />
                            {label}
                            {href === '/notifications' && unread > 0 && (
                              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[0.625rem] font-bold text-primary-foreground">
                                {unread > 9 ? '9+' : unread}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-white/8 p-4">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 py-3 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Sign out
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <Link
                      href="/plan-event"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Sparkles className="size-4" aria-hidden="true" />
                      Plan Your Event
                    </Link>
                    <Link
                      href="/login"
                      className="flex w-full items-center justify-center rounded-lg border border-white/12 px-4 py-3 text-sm font-medium text-white/75 transition-colors duration-200 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Log in
                    </Link>
                  </div>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}