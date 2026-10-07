'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  description?: string
  side?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg' | 'full'
  showClose?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-[90vw]',
}

export function Drawer({
  isOpen,
  onClose,
  children,
  title,
  description,
  side = 'right',
  size = 'md',
  showClose = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) onClose()
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeOnEscape, onClose])

  if (!isOpen) return null

  const drawerContent = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[var(--z-modal-backdrop)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 200 }}
        onClick={closeOnOverlayClick ? onClose : undefined}
        role="presentation"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      </motion.div>
    </AnimatePresence>
  )

  const drawerPanel = (
    <AnimatePresence>
      <motion.div
        className={cn(
          'fixed inset-y-0 z-[var(--z-modal)] w-full',
          side === 'right' ? 'right-0' : 'left-0',
          sizeClasses[size]
        )}
        initial={{ x: side === 'right' ? '100%' : '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: side === 'right' ? '100%' : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        aria-describedby={description ? 'drawer-description' : undefined}
      >
        <div className="flex flex-col h-full bg-card border-l border-r border-card-border shadow-2xl">
          {(title || showClose) && (
            <div className="flex items-start justify-between gap-4 border-b border-card-border px-6 py-4">
              <div>
                {title && (
                  <h2 id="drawer-title" className="text-h4 text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="drawer-description" className="mt-1 text-body-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-lg"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(<>{drawerContent}{drawerPanel}</>, document.body)
}