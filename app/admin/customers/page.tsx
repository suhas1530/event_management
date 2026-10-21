'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import type { User } from '@/lib/api'
import { Search, ArrowRight, Loader2, Users } from 'lucide-react'

function fmtDate(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<(User & { _count?: { bookings: number } })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page, limit: 20 }
    if (search) params.search = search
    adminApi.customers(params).then(res => {
      setCustomers(res.data as any)
      setTotalPages(res.pagination.totalPages)
      setTotal(res.pagination.total)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [page, search])

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Operations</p>
          <h1 className="mt-1 font-serif text-4xl text-foreground">Customers</h1>
          <p className="mt-1 text-xs text-muted-foreground/80">{total} registered</p>
        </div>
      </div>

      <div className="mb-5 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/80" aria-hidden="true" />
        <input aria-label="Search customers" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name, email, phone…"
          className="w-full border border-border bg-muted/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-[#d5ae79] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-gold-text" /></div>
      ) : customers.length === 0 ? (
        <div className="py-20 text-center"><Users className="mx-auto mb-4 size-10 text-muted-foreground/80" /><p className="text-sm text-muted-foreground">No customers found</p></div>
      ) : (
        <>
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-center">Bookings</th>
                  <th className="px-5 py-3 text-left">Verified</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-left">Last login</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map(c => (
                  <tr key={c.id} className="transition hover:bg-muted/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 flex-shrink-0 items-center justify-center bg-[#d5ae79]/10 text-xs text-[#d5ae79]">
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-foreground/90">{c.name}</p>
                          <p className="text-xs text-muted-foreground/80">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{c.phone ?? '—'}</td>
                    <td className="px-5 py-3.5"><span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/80">{c.role}</span></td>
                    <td className="px-5 py-3.5 text-center text-muted-foreground">{(c as any)._count?.bookings ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[9px] ${c.isEmailVerified ? 'text-green-400' : 'text-muted-foreground/80'}`}>
                        {c.isEmailVerified ? '✓ Email' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[9px] uppercase tracking-[0.1em] ${c.isActive !== false ? 'text-green-400' : 'text-red-400'}`}>
                        {c.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground/80">{fmtDate(c.createdAt)}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground/80">{fmtDate(c.lastLoginAt)}</td>
                    <td className="px-3 py-3.5">
                      <Link href={`/admin/customers/${c.id}`} className="text-gold-text hover:text-[#e8cfa9]">
                        <ArrowRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="border border-border px-4 py-2 text-xs text-muted-foreground disabled:opacity-30 hover:border-[#d5ae79]">← Prev</button>
              <span className="text-xs text-muted-foreground/80">Page {page} of {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="border border-border px-4 py-2 text-xs text-muted-foreground disabled:opacity-30 hover:border-[#d5ae79]">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
