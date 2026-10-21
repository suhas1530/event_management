'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  ChevronDown,
  Heart,
  Home,
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
import { mobileNavLinks, navLinks, siteConfig, type NavItem } from '@/lib/site-config'
import { verticals } from '@/lib/brand'
import { Separator } from '@/components/ui/Separator'
import Logo from '@/components/brand/Logo'
import LocationSelector, { LocationList } from '@/components/layout/LocationSelector'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useLocation } from '@/lib/location'

interface NavbarProps {
  /** Pages that render their own full-bleed hero start transparent at the top. */
  transparentAtTop?: boolean
}

/**
 * The account menu deliberately mirrors the two verticals: everything that
 * belongs to an event lives under "My Events", everything booked as a doorstep
 * service under "My Home Services" (the dashboard opens on the matching tab).
 */
const ACCOUNT_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard?tab=events', label: 'My Events', icon: Sparkles },
  { href: '/dashboard?tab=home', label: 'My Home Services', icon: Wrench },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function Navbar({ transparentAtTop = false }: NavbarProps) {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const { location, setLocation } = useLocation()

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [canHover, setCanHover] = useState(false)
  const [unread, setUnread] = useState(0)

  const profileRef = useRef<HTMLDivElement>(null)

  /* Scroll state — header blurs in once the user leaves the top of the page. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Only open nav dropdowns on hover where hover actually exists. */
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setCanHover(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /* Close transient UI on navigation. */
  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
    setOpenMenu(null)
  }, [pathname])

  /* Lock body scroll while the mobile drawer is open. */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  /* Escape closes the drawer / dropdowns. */
  useEffect(() => {
    if (!mobileOpen && !profileOpen && !openMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMobileOpen(false)
      setProfileOpen(false)
      setOpenMenu(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, profileOpen, openMenu])

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
    const base = href.split('?')[0].split('#')[0]
    if (base === '/') return pathname === '/'
    return pathname.startsWith(base)
  }

  const isItemActive = (item: NavItem) =>
    isActive(item.href) || Boolean(item.children?.some(child => isActive(child.href)))

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
          // While transparent it sits on the statically-dark hero, so its own
          // tokens must resolve to the immersive dark palette in both themes.
          !isSolid && 'immersive',
          isSolid
            ? 'border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70'
            : 'border-b border-transparent bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1380px] items-center justify-between gap-3 px-5 sm:px-6 sm:h-[72px] lg:px-6 xl:px-10">
          <Logo size="sm" tone="dark" />

          {/* Desktop nav */}
          <nav className="hidden lg:block" aria-label="Main">
            <ul className="flex items-center gap-0.5" role="list">
              {navLinks.map(item =>
                item.children ? (
                  <li
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => canHover && setOpenMenu(item.label)}
                    onMouseLeave={() => canHover && setOpenMenu(current => (current === item.label ? null : current))}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenMenu(current => (current === item.label ? null : item.label))}
                      aria-expanded={openMenu === item.label}
                      aria-haspopup="menu"
                      className={cn(
                        'inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring xl:px-3.5',
                        isItemActive(item) ? 'text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn('size-3.5 transition-transform duration-200', openMenu === item.label && 'rotate-180')}
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence>
                      {openMenu === item.label && (
                        <motion.div
                          role="menu"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute left-0 top-full z-[var(--z-popover)] mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-2xl"
                        >
                          {item.children.map(child => (
                            <Link
                              key={child.href}
                              href={child.href}
                              role="menuitem"
                              className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                            >
                              <span className="text-sm text-foreground/90">{child.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {child.href === '/become-a-professional'
                                  ? 'Join as a vetted home-service professional'
                                  : 'List and run events with Heptome'}
                              </span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={cn(
                        'relative inline-flex items-center whitespace-nowrap rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring xl:px-3.5',
                        isActive(item.href) ? 'text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 lg:flex">
            {/* Location is only worth the pixels once there is room for it. */}
            <LocationSelector className="hidden xl:block" />

            {/* Theme switcher — visible at every breakpoint that shows actions. */}
            <ThemeToggle />

            {isAuthenticated && (
              <Link
                href="/notifications"
                className="relative rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 py-1.5 pl-1.5 pr-3 text-sm text-foreground/90 transition-colors duration-200 hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="absolute right-0 top-full z-[var(--z-popover)] mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
                    >
                      <div className="border-b border-border-subtle px-4 py-3">
                        <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <div className="p-1.5">
                        {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            role="menuitem"
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/90 transition-colors duration-150 hover:bg-muted/60 hover:text-foreground focus-visible:bg-muted/60 focus-visible:text-foreground focus-visible:outline-none"
                          >
                            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
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
                  className="rounded-lg px-2.5 py-2.5 text-[0.8125rem] font-medium text-foreground/90 transition-colors duration-200 hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Log in
                </Link>
                <Link
                  href={verticals.home.planHref}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 py-2.5 text-[0.8125rem] font-semibold text-primary-foreground transition-all duration-200 ease-out hover:-translate-y-px hover:bg-primary-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
                >
                  <Wrench className="size-3.5" aria-hidden="true" />
                  Book a Home Service
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
            className="-mr-1 rounded-lg p-2 text-foreground/90 transition-colors duration-200 hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
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
              className="fixed inset-y-0 right-0 z-[var(--z-modal)] flex w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-5 sm:h-[72px]">
                <Logo size="sm" tone="dark" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                {/* Where the customer is — stated up-front so home-service
                    coverage is never a surprise mid-booking. */}
                <LocationList
                  location={location}
                  onSelect={setLocation}
                  tone="dark"
                  variant="flat"
                />

                <Separator className="my-5" />

                <ul className="space-y-1" role="list">
                  {mobileNavLinks.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={isActive(link.href) ? 'page' : undefined}
                        className={cn(
                          'block rounded-lg px-4 py-3 transition-colors duration-200',
                          isActive(link.href) ? 'bg-primary/10 text-accent' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        )}
                      >
                        <span className="flex items-center gap-2 text-[0.9375rem] font-medium">
                          {link.href === '/' && <Home className="size-4" aria-hidden="true" />}
                          {link.label}
                        </span>
                        {link.hint && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground/80">{link.hint}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>

                {isAuthenticated && (
                  <>
                    <Separator className="my-5" />
                    <p className="mb-2 px-4 text-label text-muted-foreground/80">Your account</p>
                    <ul className="space-y-1" role="list">
                      {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                        <li key={href}>
                          <Link
                            href={href}
                            className="flex items-center gap-3 rounded-lg px-4 py-3 text-[0.9375rem] text-foreground/90 transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
                          >
                            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            {label}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          href="/notifications"
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-[0.9375rem] text-foreground/90 transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
                        >
                          <Bell className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          Notifications
                          {unread > 0 && (
                            <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[0.625rem] font-bold text-primary-foreground">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </Link>
                      </li>
                    </ul>
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-border-subtle p-4">
                {/* Theme switcher travels with the drawer. */}
                <div className="mb-2.5">
                  <ThemeToggle variant="drawer" />
                </div>
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
                    {/* Both verticals get a first-class CTA — neither is buried. */}
                    <Link
                      href={verticals.events.planHref}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Sparkles className="size-4" aria-hidden="true" />
                      {verticals.events.ctaLabel}
                    </Link>
                    <Link
                      href={verticals.home.planHref}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 px-4 py-3 text-sm font-semibold text-foreground/90 transition-colors duration-200 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Wrench className="size-4" aria-hidden="true" />
                      {verticals.home.ctaLabel}
                    </Link>
                    <Link
                      href="/login"
                      className="flex w-full items-center justify-center rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground/90 transition-colors duration-200 hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Log in
                    </Link>
                  </div>
                )}
                <p className="mt-3 text-center text-xs text-muted-foreground/80">
                  {siteConfig.coverage.city} · doorstep services
                </p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
