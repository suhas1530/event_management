'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  KeyRound,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Wrench,
} from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import EmptyState from '@/components/shared/EmptyState'
import { PageHeader, buttonClass } from '@/components/shared/Primitives'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: 'Customer',
  TECHNICIAN: 'Technician',
  EVENT_MANAGER: 'Event manager',
  VENDOR: 'Vendor',
  ADMIN: 'Administrator',
  SUPER_ADMIN: 'Super administrator',
}

const inputClass =
  'mt-2 w-full rounded-lg border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/25'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser, logout } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileErrors, setProfileErrors] = useState<{ name?: string; phone?: string }>({})

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    setName(user.name ?? '')
    setPhone(user.phone ?? '')
  }, [user])

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    const errors: { name?: string; phone?: string } = {}
    if (name.trim().length < 2) errors.name = 'Please enter your full name.'
    if (phone.trim() && phone.trim().replace(/\D/g, '').length < 7) errors.phone = 'Enter a valid phone number.'
    setProfileErrors(errors)
    if (Object.keys(errors).length) return

    setSavingProfile(true)
    try {
      await authApi.updateProfile({ name: name.trim(), phone: phone.trim() || undefined })
      await refreshUser()
      toast('Profile updated.', 'success')
    } catch (err) {
      toast((err as { error?: string })?.error ?? 'We could not save your profile.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!currentPassword) errors.currentPassword = 'Enter your current password.'
    if (newPassword.length < 8) errors.newPassword = 'Use at least 8 characters.'
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'
    setPasswordErrors(errors)
    if (Object.keys(errors).length) return

    setSavingPassword(true)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast('Password changed.', 'success')
    } catch (err) {
      toast((err as { error?: string })?.error ?? 'We could not change your password.', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  if (authLoading) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-4xl px-5 py-16 lg:px-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </SiteShell>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-2xl px-5 py-24">
          <EmptyState
            icon={UserIcon}
            title="Sign in to view your profile"
            description="Your name, contact details and account security live here."
            action={{ label: 'Log in', href: '/login' }}
            secondaryAction={{ label: 'Create an account', href: '/register' }}
          />
        </div>
      </SiteShell>
    )
  }

  const initials = user.name
    ?.split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:py-16 lg:px-8">
        <PageHeader eyebrow="Your account" title="Profile" description="Keep your contact details current so we can reach you about bookings." />

        {/* Identity card */}
        <div className="mt-10 flex flex-col gap-6 rounded-2xl border border-border-subtle bg-muted/50 p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="relative shrink-0">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-supplied avatar URL, cannot be optimised ahead of time
              <img
                src={user.avatar}
                alt=""
                className="size-20 rounded-2xl object-cover ring-1 ring-white/10"
              />
            ) : (
              <span className="grid size-20 place-items-center rounded-2xl bg-primary/15 font-serif text-2xl text-primary ring-1 ring-primary/25">
                {initials || <UserIcon className="size-7" aria-hidden="true" />}
              </span>
            )}
            <span className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-lg border border-border bg-popover text-muted-foreground" title="Profile photo">
              <Camera className="size-4" aria-hidden="true" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-medium text-foreground/90">{user.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-primary ring-1 ring-inset ring-primary/25">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground/90 transition-colors duration-200 hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive sm:self-auto"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Personal details */}
          <section className="rounded-2xl border border-border-subtle bg-muted/50 p-6 sm:p-7">
            <h2 className="flex items-center gap-2.5 text-base font-medium text-foreground/90">
              <UserIcon className="size-[18px] text-primary" aria-hidden="true" />
              Personal details
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Used on your bookings and invoices.</p>

            <form onSubmit={saveProfile} className="mt-6 space-y-5" noValidate>
              <div>
                <label htmlFor="name" className="text-label text-muted-foreground">
                  Full name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  aria-invalid={profileErrors.name ? 'true' : undefined}
                  aria-describedby={profileErrors.name ? 'name-error' : undefined}
                  className={cn(inputClass, profileErrors.name ? 'border-red-400/60' : 'border-border focus:border-primary/60')}
                />
                {profileErrors.name && <FieldError id="name-error">{profileErrors.name}</FieldError>}
              </div>

              <div>
                <label htmlFor="email" className="text-label text-muted-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  value={user.email}
                  disabled
                  readOnly
                  className={cn(inputClass, 'cursor-not-allowed border-border-subtle text-muted-foreground')}
                />
                <p className="mt-1.5 text-xs text-muted-foreground/80">Email cannot be changed.</p>
              </div>

              <div>
                <label htmlFor="phone" className="text-label text-muted-foreground">
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  aria-invalid={profileErrors.phone ? 'true' : undefined}
                  aria-describedby={profileErrors.phone ? 'phone-error' : undefined}
                  className={cn(inputClass, profileErrors.phone ? 'border-red-400/60' : 'border-border focus:border-primary/60')}
                />
                {profileErrors.phone && <FieldError id="phone-error">{profileErrors.phone}</FieldError>}
              </div>

              <button type="submit" disabled={savingProfile} className={buttonClass('primary', 'md', 'w-full')}>
                {savingProfile && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Save changes
              </button>
            </form>
          </section>

          {/* Security */}
          <section className="rounded-2xl border border-border-subtle bg-muted/50 p-6 sm:p-7">
            <h2 className="flex items-center gap-2.5 text-base font-medium text-foreground/90">
              <KeyRound className="size-[18px] text-primary" aria-hidden="true" />
              Password &amp; security
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Choose a password you do not use anywhere else.</p>

            <form onSubmit={savePassword} className="mt-6 space-y-5" noValidate>
              <PasswordField
                id="currentPassword"
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                error={passwordErrors.currentPassword}
                autoComplete="current-password"
              />
              <PasswordField
                id="newPassword"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                error={passwordErrors.newPassword}
                autoComplete="new-password"
              />
              <PasswordField
                id="confirmPassword"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={passwordErrors.confirmPassword}
                autoComplete="new-password"
              />
              <button type="submit" disabled={savingPassword} className={buttonClass('primary', 'md', 'w-full')}>
                {savingPassword && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Change password
              </button>
            </form>
          </section>
        </div>

        {/* Shortcuts */}
        <section className="mt-6 rounded-2xl border border-border-subtle bg-muted/50 p-6 sm:p-7">
          <h2 className="flex items-center gap-2.5 text-base font-medium text-foreground/90">
            <ShieldCheck className="size-[18px] text-primary" aria-hidden="true" />
            Your activity
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { href: '/bookings', label: 'Event bookings', icon: Sparkles },
              { href: '/dashboard', label: 'Technician jobs', icon: Wrench },
              { href: '/notifications', label: 'Notifications', icon: UserIcon },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3.5 text-sm text-foreground/90 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  )
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-300">
      <AlertCircle className="size-3.5" aria-hidden="true" />
      {children}
    </p>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="text-label text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(inputClass, error ? 'border-red-400/60' : 'border-border focus:border-primary/60')}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  )
}