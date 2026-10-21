'use client'

import { type ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { ThemeProvider } from '@/lib/theme-context'

export { ToastProvider, useToast }

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}