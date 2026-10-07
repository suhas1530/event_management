'use client'

import { type ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider, useToast } from '@/components/ui/Toast'

export { ToastProvider, useToast }

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  )
}