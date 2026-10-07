'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
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

  const modalContent = (
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

  const modalDialog = (
    <AnimatePresence>
      <motion.div
        className={cn(
          'fixed left-1/2 top-1/2 z-[var(--z-modal)] w-full -translate-x-1/2 -translate-y-1/2',
          sizeClasses[size]
        )}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        <div className="bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden">
          {(title || showClose) && (
            <div className="flex items-start justify-between gap-4 border-b border-card-border px-6 py-4">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-h4 text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-body-sm text-muted-foreground">
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
          <div className="p-6">{children}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(<>{modalContent}{modalDialog}</>, document.body)
}

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'primary'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-body text-muted-foreground">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={variant === 'destructive' ? 'btn-destructive' : 'btn-primary'}
        >
          {loading ? 'Confirming…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}