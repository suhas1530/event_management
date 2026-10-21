import ThemeToggle from '@/components/ui/ThemeToggle'

/**
 * Auth group layout — the sign-in flow deliberately has no marketing navbar,
 * so the theme switcher lives in the same top-right corner as the admin login.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      {children}
    </div>
  )
}
