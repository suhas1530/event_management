import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
  label?: string
}

export default function LoadingSpinner({ size = 'md', fullPage = false, label }: LoadingSpinnerProps) {
  const sizes = { sm: 'size-4', md: 'size-7', lg: 'size-12' }
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className={`animate-spin text-[#d7b98b] ${sizes[size]}`} />
      {label && <p className="text-xs uppercase tracking-[0.2em] text-white/30">{label}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">{spinner}</div>
    )
  }

  return spinner
}
