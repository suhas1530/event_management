'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { tokenStore } from '@/lib/api'
import ThemeToggle from '@/components/ui/ThemeToggle'
import {
  LayoutDashboard, CalendarDays, Users, Wrench,
  BarChart3, LogOut, Menu, X, Sparkles, ChevronRight, Shield
} from 'lucide-react'

/**
 * Admin navigation.
 *
 * Every entry must point at a route that exists under `app/admin/`. Dead links
 * are worse than a short menu, so anything without a page (and without a
 * supporting admin API endpoint) is deliberately absent rather than stubbed.
 */
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Bookings',
    items: [
      { href: '/admin/bookings', label: 'Event Bookings', icon: CalendarDays },
      { href: '/admin/event-requests', label: 'Event Requests', icon: Sparkles },
      { href: '/admin/technicians', label: 'Tech Bookings', icon: Wrench },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [adminName, setAdminName] = useState('Admin')
  const [adminRole, setAdminRole] = useState('ADMIN')

  useEffect(() => {
    if (pathname === '/admin/login') return
    const token = tokenStore.getAdmin()
    if (!token) { router.replace('/admin/login'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setAdminName(payload.name ?? 'Admin')
      setAdminRole(payload.role ?? 'ADMIN')
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        tokenStore.clearAdmin()
        router.replace('/admin/login')
      }
    } catch {
      tokenStore.clearAdmin()
      router.replace('/admin/login')
    }
  }, [pathname, router])

  if (pathname === '/admin/login') return <>{children}</>

  function logout() {
    tokenStore.clearAdmin()
    router.push('/admin/login')
  }

  function isActive(href: string) {
    if (href === '/admin/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-62 flex-col border-r border-border-subtle bg-card transition-transform duration-300 lg:relative lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: '15.5rem' }}>
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <Link href="/admin/dashboard" onClick={() => setOpen(false)}
            className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center bg-[#d5ae79]">
              <Shield className="size-3.5 text-[#0b0b0d]" />
            </div>
            <div>
              <span className="font-serif text-lg text-foreground">Heptome<span className="text-primary">.</span></span>
              <span className="ml-2 text-[8px] uppercase tracking-[0.2em] text-muted-foreground/80">Admin</span>
            </div>
          </Link>
          <button type="button" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <div className="flex flex-col gap-5">
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[9px] uppercase tracking-[0.25em] text-muted-foreground/80">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href)
                    return (
                      <Link key={href} href={href} onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                          active
                            ? 'bg-[#d5ae79]/10 text-[#d5ae79]'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground/90'
                        }`}>
                        <Icon className="size-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{label}</span>
                        {active && <ChevronRight className="size-3 flex-shrink-0" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border-subtle p-4">
          <ThemeToggle variant="drawer" className="mb-3 border-border-subtle bg-background/40 px-3 py-2 text-xs" />
          <div className="mb-3 flex items-center gap-3 px-1">
            <div className="flex size-8 flex-shrink-0 items-center justify-center bg-[#d5ae79]/20 text-sm font-medium text-[#d5ae79]">
              {adminName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-foreground/90">{adminName}</p>
              <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/80">{adminRole.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" target="_blank"
              className="flex-1 py-1.5 text-center text-[9px] uppercase tracking-[0.15em] text-muted-foreground/80 hover:text-gold-text">
              View site
            </Link>
            <button onClick={logout}
              className="flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground/80 transition hover:text-red-400" type="button">
              <LogOut className="size-3" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center bg-[#d5ae79]">
              <Shield className="size-3 text-[#0b0b0d]" />
            </div>
            <span className="font-serif text-lg text-foreground">
              Heptome<span className="text-primary">.</span>
            </span>
          </div>
          <Link href="/" className="text-[10px] text-muted-foreground/80 hover:text-muted-foreground">
            Site →
          </Link>
        </header>

        <main className="flex-1 overflow-auto p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
