'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import type { DashboardStats, Booking } from '@/lib/api'
import {
  CalendarDays, TrendingUp, Users, CheckCircle2, Clock,
  XCircle, ArrowRight, Loader2, BarChart3, IndianRupee
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'text-blue-300 bg-blue-500/10',
  PENDING_REVIEW: 'text-yellow-300 bg-yellow-500/10',
  QUOTED: 'text-purple-300 bg-purple-500/10',
  PAYMENT_PENDING: 'text-red-300 bg-red-500/10',
  CONFIRMED: 'text-[#d7b98b] bg-[#d7b98b]/10',
  COMPLETED: 'text-green-400 bg-green-500/15',
  CANCELLED: 'text-white/30 bg-white/5',
}
const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Requested', PENDING_REVIEW: 'Under Review', QUOTED: 'Quoted',
  PAYMENT_PENDING: 'Payment Due', CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled', REJECTED: 'Rejected',
}

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`
  return `₹${n}`
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/8 ${className}`} />
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [revenue, setRevenue] = useState<Array<{ date: string; amount: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      adminApi.dashboard(),
      adminApi.bookings({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
      adminApi.revenueAnalytics('30d'),
    ]).then(([s, b, r]) => {
      setStats(s)
      setRecentBookings(b.data)
      setRevenue(r)
    }).catch(e => setError((e as { error?: string })?.error ?? 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24"><Loader2 className="size-8 animate-spin text-[#d7b98b]" /></div>
  )
  if (error) return (
    <div className="py-20 text-center"><p className="text-red-400">{error}</p></div>
  )

  const maxRevenue = Math.max(...revenue.map(r => r.amount), 1)

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">Operations</p>
        <h1 className="mt-1 font-serif text-4xl text-white">Dashboard</h1>
      </div>

      {/* KPI grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: fmt(stats?.revenue.total ?? 0), sub: `${stats?.revenue.growth && stats.revenue.growth > 0 ? '+' : ''}${stats?.revenue.growth ?? 0}% this month`, icon: IndianRupee, accent: true },
          { label: 'Total Bookings', value: stats?.bookings.total ?? 0, sub: `${stats?.bookings.pending ?? 0} pending action`, icon: CalendarDays },
          { label: 'Customers', value: stats?.customers.total ?? 0, sub: `+${stats?.customers.newThisMonth ?? 0} this month`, icon: Users },
          { label: 'Upcoming Events', value: stats?.upcomingEvents ?? 0, sub: 'Confirmed', icon: CheckCircle2 },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <div key={label} className="border border-white/10 bg-[#111114] p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
              <Icon className={`size-4 ${accent ? 'text-[#d7b98b]' : 'text-white/20'}`} />
            </div>
            <p className={`text-3xl font-light ${accent ? 'text-[#d7b98b]' : 'text-white'}`}>{value}</p>
            <p className="mt-1 text-xs text-white/30">{sub}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Requested', value: stats?.bookings.pending ?? 0, color: 'text-blue-300' },
          { label: 'Confirmed', value: stats?.bookings.confirmed ?? 0, color: 'text-[#d7b98b]' },
          { label: 'Completed', value: stats?.bookings.completed ?? 0, color: 'text-green-400' },
          { label: 'Cancelled', value: stats?.bookings.cancelled ?? 0, color: 'text-white/30' },
          { label: 'AI Designs', value: stats?.aiDesigns ?? 0, color: 'text-purple-300' },
          { label: 'This Month', value: fmt(stats?.revenue.thisMonth ?? 0), color: 'text-[#d7b98b]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-white/8 p-4 text-center">
            <p className={`text-2xl font-light ${color}`}>{value}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-white/30">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Revenue chart */}
        <div className="border border-white/10 bg-[#111114] p-5 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Revenue — last 30 days</p>
            <p className="text-sm text-[#d7b98b]">{fmt(stats?.revenue.thisMonth ?? 0)}</p>
          </div>
          {revenue.length > 0 ? (
            <div className="flex items-end gap-1" style={{ height: 120 }}>
              {revenue.slice(-20).map((r, i) => (
                <div key={i} className="group relative flex-1">
                  <div
                    className="w-full bg-[#d7b98b]/40 transition-all hover:bg-[#d7b98b]"
                    style={{ height: `${Math.max(4, (r.amount / maxRevenue) * 120)}px` }}
                  />
                  <div className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap bg-[#0b0b0d] px-2 py-1 text-[9px] text-white group-hover:block">
                    {fmt(r.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-xs text-white/30">No revenue data yet</p>
          )}
        </div>

        {/* Booking status pills */}
        <div className="border border-white/10 bg-[#111114] p-5 lg:col-span-2">
          <p className="mb-5 text-[10px] uppercase tracking-[0.2em] text-white/40">Booking status</p>
          <div className="space-y-3">
            {[
              { label: 'Pending review', count: stats?.bookings.pending ?? 0, color: 'bg-yellow-500' },
              { label: 'Confirmed', count: stats?.bookings.confirmed ?? 0, color: 'bg-[#d7b98b]' },
              { label: 'Completed', count: stats?.bookings.completed ?? 0, color: 'bg-green-500' },
              { label: 'Cancelled', count: stats?.bookings.cancelled ?? 0, color: 'bg-white/20' },
            ].map(({ label, count, color }) => {
              const total = stats?.bookings.total || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-white/50">{label}</span>
                    <span className="text-white/40">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/8">
                    <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent bookings table */}
      <div className="mt-8 border border-white/10 bg-[#111114]">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Recent bookings</p>
          <Link href="/admin/bookings" className="text-[10px] uppercase tracking-[0.15em] text-[#d7b98b] hover:underline">
            View all →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="py-10 text-center text-xs text-white/30">No bookings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.15em] text-white/30">
                  <th className="px-5 py-3 text-left">Booking ID</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Event</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentBookings.map(b => (
                  <tr key={b.id} className="transition hover:bg-white/3">
                    <td className="px-5 py-3.5 font-mono text-xs text-white/50">{b.bookingNumber}</td>
                    <td className="px-5 py-3.5 text-white/80">{b.user?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-white/60">{b.event?.title ?? '—'}</td>
                    <td className="px-5 py-3.5 text-white/40">{fmtDate(b.eventDate)}</td>
                    <td className="px-5 py-3.5 text-right text-white/60">{b.totalAmount > 0 ? fmt(b.totalAmount) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-1 text-[9px] uppercase tracking-[0.1em] ${STATUS_COLORS[b.status] ?? 'text-white/30 bg-white/5'}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <Link href={`/admin/bookings/${b.id}`} className="text-[#d7b98b] hover:underline">
                        <ArrowRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
