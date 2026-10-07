'use client'

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type AccordionValue = string | string[]

/* ------------------------------------------------------------------ */
/* Contexts                                                            */
/* ------------------------------------------------------------------ */

interface AccordionContextValue {
  type: 'single' | 'multiple'
  toggle: (itemValue: string) => void
  isOpen: (itemValue: string) => boolean
  baseId: string
}

const AccordionContext = createContext<AccordionContextValue | null>(null)
const AccordionItemContext = createContext<string | null>(null)

function useAccordion(component: string): AccordionContextValue {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error(`<${component}> must be used within <Accordion>`)
  return ctx
}

function useAccordionItem(component: string): string {
  const ctx = useContext(AccordionItemContext)
  if (ctx === null) throw new Error(`<${component}> must be used within <AccordionItem>`)
  return ctx
}

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export interface AccordionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Allow several panels to stay open at once. */
  type?: 'single' | 'multiple'
  /** Controlled open panels. */
  value?: AccordionValue
  /** Initial open panels when uncontrolled. */
  defaultValue?: AccordionValue
  onValueChange?: (value: AccordionValue) => void
  children: ReactNode
}

function toArray(value: AccordionValue | undefined): string[] {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, type = 'single', value, defaultValue, onValueChange, children, ...props }, ref) => {
    const baseId = useId()
    const [uncontrolled, setUncontrolled] = useState<string[]>(() => toArray(defaultValue))
    const isControlled = value !== undefined
    const open = isControlled ? toArray(value) : uncontrolled

    const toggle = useCallback(
      (itemValue: string) => {
        setUncontrolled(prev => {
          const wasOpen = prev.includes(itemValue)
          const next =
            type === 'multiple'
              ? wasOpen
                ? prev.filter(v => v !== itemValue)
                : [...prev, itemValue]
              : wasOpen
                ? []
                : [itemValue]
          onValueChange?.(type === 'multiple' ? next : (next[0] ?? ''))
          return next
        })
      },
      [type, onValueChange]
    )

    const ctx = useMemo<AccordionContextValue>(
      () => ({ type, toggle, isOpen: (v: string) => open.includes(v), baseId }),
      [type, toggle, open, baseId]
    )

    return (
      <AccordionContext.Provider value={ctx}>
        <div ref={ref} className={cn(className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = 'Accordion'

/* ------------------------------------------------------------------ */
/* Item                                                                */
/* ------------------------------------------------------------------ */

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  children: ReactNode
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={value}>
      <div
        ref={ref}
        className={cn('border-b border-border-subtle last:border-b-0', className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
)
AccordionItem.displayName = 'AccordionItem'

/* ------------------------------------------------------------------ */
/* Trigger                                                             */
/* ------------------------------------------------------------------ */

export interface AccordionTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { toggle, isOpen, baseId } = useAccordion('AccordionTrigger')
    const itemValue = useAccordionItem('AccordionTrigger')
    const expanded = isOpen(itemValue)

    return (
      <button
        ref={ref}
        type="button"
        id={`${baseId}-trigger-${itemValue}`}
        aria-expanded={expanded}
        aria-controls={`${baseId}-panel-${itemValue}`}
        onClick={() => toggle(itemValue)}
        className={cn(
          'flex w-full items-center justify-between gap-4 py-4 text-left text-label-lg font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className
        )}
        {...props}
      >
        <span>{children}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out',
            expanded && 'rotate-180 text-primary'
          )}
          aria-hidden="true"
        />
      </button>
    )
  }
)
AccordionTrigger.displayName = 'AccordionTrigger'

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, baseId } = useAccordion('AccordionContent')
    const itemValue = useAccordionItem('AccordionContent')
    const expanded = isOpen(itemValue)

    return (
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            ref={ref}
            id={`${baseId}-panel-${itemValue}`}
            role="region"
            aria-labelledby={`${baseId}-trigger-${itemValue}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div {...props} className={cn('pb-5 pt-1', className)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)
AccordionContent.displayName = 'AccordionContent'