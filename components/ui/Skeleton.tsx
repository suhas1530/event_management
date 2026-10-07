'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'avatar' | 'button' | 'input'
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, variant = 'text', width, height, ...props }: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'aspect-video rounded-xl',
    avatar: 'size-10 rounded-full',
    button: 'h-10 w-24 rounded-lg',
    input: 'h-10 w-full rounded-lg',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variantStyles[variant],
        className
      )}
      style={{ width, height }}
      {...props}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-2', className)} {...props} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-4', className)} {...props} aria-hidden="true">
      <Skeleton variant="card" />
      <div className="space-y-2 px-1">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4, className, ...props }: { rows?: number; columns?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-3', className)} {...props} aria-hidden="true">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 text-label text-muted-foreground border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" width={i === 0 ? '30%' : '20%'} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 px-4 py-3 border-b border-border-subtle">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={`${row}-${col}`} variant="text" width={col === 0 ? '30%' : '20%'} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ items = 5, className, ...props }: { items?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-4', className)} {...props} aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonGrid({ items = 6, columns = 3, className, ...props }: { items?: number; columns?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`grid gap-5 sm:grid-cols-2 lg:grid-cols-${columns}`, className)} {...props} aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  )
}