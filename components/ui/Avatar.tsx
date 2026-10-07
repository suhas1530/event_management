'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shape?: 'circle' | 'square'
}

const sizeClasses = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
  '2xl': 'size-24 text-xl',
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', shape = 'circle', ...props }, ref) => {
    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl'

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden bg-muted font-medium',
          sizeClasses[size],
          shapeClass,
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt || ''} className="h-full w-full object-cover" />
        ) : fallback ? (
          fallback
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/20 text-primary">
            {alt?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export const AvatarGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { max?: number }>(
  ({ className, max = 5, children, ...props }, ref) => {
    const childArray = Array.isArray(children) ? children : [children]
    const visibleChildren = childArray.slice(0, max)
    const remainingCount = childArray.length - max

    return (
      <div ref={ref} className={cn('flex -space-x-2', className)} {...props}>
        {visibleChildren.map((child, index) => (
          <span key={index} className="relative z-[auto]">
            {child}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className={cn(
            'relative z-0 flex items-center justify-center border-2 border-background',
            sizeClasses.md,
            'rounded-full bg-muted text-muted-foreground font-medium'
          )}>
            +{remainingCount}
          </span>
        )}
      </div>
    )
  }
)

AvatarGroup.displayName = 'AvatarGroup'