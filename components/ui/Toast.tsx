'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ToastProps {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  onClose: (id: string) => void
  duration?: number
}

const typeStyles = {
  success: 'bg-success text-success-foreground',
  error: 'bg-destructive text-destructive-foreground',
  info: 'bg-primary text-primary-foreground',
  warning: 'bg-warning text-warning-foreground',
}

const typeIcons = {
  success: (
    <svg className="size-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="size-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="size-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7.5 4.75a.75.75 0 001.5 0v-4.5a.75.75 0 00-1.5 0v4.5zm0-9a.75.75 0 100 1.5h.253a5.252 5.252 0 01.043 10.5H10.5a.75.75 0 000 1.5h.253a6.752 6.752 0 00.043-13.5H10.5z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="size-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.525-1.516 2.525H3.72c-1.347 0-2.189-1.358-1.515-2.525L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
}

export function Toast({ id, message, type, onClose, duration = 5000 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onClose(id), 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [id, onClose, duration])

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'flex items-center gap-3 min-w-[280px] max-w-md px-5 py-3.5 text-sm font-medium rounded-xl shadow-2xl',
        typeStyles[type]
      )}
      role="alert"
      aria-live="polite"
    >
      {typeIcons[type]}
      <p className="flex-1">{message}</p>
      <button type="button"
        onClick={() => {
          setVisible(false)
          setTimeout(() => onClose(id), 300)
        }}
        className="flex-shrink-0 p-0.5 opacity-70 hover:opacity-100 transition-opacity focus-ring rounded"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastProps['type'] }>
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[var(--z-toast)] flex -translate-x-1/2 flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook for using toasts
import { createContext, useContext, useCallback } from 'react'

interface ToastContextValue {
  toast: (message: string, type?: ToastProps['type'], duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastContainerProps['toasts']>([])

  const toast = useCallback((message: string, type: ToastProps['type'] = 'info', duration = 5000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration + 300)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}