'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Skeleton } from './Skeleton'

interface Column<T> {
  key: string
  header: string
  render: (row: T, index: number) => ReactNode
  className?: string
  headerClassName?: string
  sortable?: boolean
}

interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string) => void
  loading?: boolean
  emptyMessage?: string
  rowClassName?: (row: T, index: number) => string
  striped?: boolean
  hoverable?: boolean
  className?: string
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  sortBy,
  sortOrder,
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  rowClassName,
  striped = true,
  hoverable = true,
  className,
  ...props
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="overflow-x-auto" {...props}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-label text-muted-foreground">
              {columns.map(col => (
                <th key={col.key} className={cn('px-4 py-3 text-left', col.headerClassName)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border-subtle">
                {columns.map((col, j) => (
                  <td key={j} className={cn('px-4 py-3', col.className)}>
                    <Skeleton variant="text" width={j === 0 ? '40%' : '60%'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" {...props}>
        <div className="mb-4 size-10 text-muted" aria-hidden="true">📭</div>
        <p className="text-body text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)} {...props}>
      <table className="w-full text-sm" role="grid">
        <thead>
          <tr className="border-b border-border text-label text-muted-foreground">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn('px-4 py-3 text-left', col.headerClassName, col.sortable && 'cursor-pointer select-none hover:text-foreground')}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                scope="col"
              >
                <div className="flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    sortOrder === 'asc' ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row)}
              className={cn(
                'transition-colors',
                striped && rowIndex % 2 === 1 && 'bg-muted/30',
                hoverable && 'hover:bg-muted/50',
                rowClassName?.(row, rowIndex)
              )}
            >
              {columns.map((col, colIndex) => (
                <td key={col.key} className={cn('px-4 py-3.5', col.className)}>
                  {col.render(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showPageNumbers?: boolean
  maxPageNumbers?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showPageNumbers = true,
  maxPageNumbers = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = showPageNumbers ? getPageNumbers(currentPage, totalPages, maxPageNumbers) : []

  return (
    <nav className={cn('flex items-center justify-center gap-2', className)} aria-label="Pagination">
      <button type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn-secondary btn-sm"
        aria-label="Previous page"
      >
        Previous
      </button>

      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {pages.map((page, i) => (
            page === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
            ) : (
              <button type="button"
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                aria-current={page === currentPage ? 'page' : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </button>
            )
          ))}
        </div>
      )}

      <button type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn-secondary btn-sm"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  )
}

function getPageNumbers(current: number, total: number, max: number): (number | 'ellipsis')[] {
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1)

  const half = Math.floor(max / 2)
  let start = Math.max(1, current - half)
  let end = Math.min(total, start + max - 1)

  if (end - start + 1 < max) {
    start = Math.max(1, end - max + 1)
  }

  const pages: (number | 'ellipsis')[] = []

  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('ellipsis')
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (end < total) {
    if (end < total - 1) pages.push('ellipsis')
    pages.push(total)
  }

  return pages
}

// Re-export Skeleton for Table loading state
export { Skeleton } from './Skeleton'