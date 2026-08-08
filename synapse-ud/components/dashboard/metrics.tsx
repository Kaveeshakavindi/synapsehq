import { cn } from '@/lib/utils'

function confidenceTone(value: number) {
  if (value >= 80) return 'text-success'
  if (value >= 65) return 'text-foreground'
  return 'text-warning'
}

function confidenceBar(value: number) {
  if (value >= 80) return 'bg-success'
  if (value >= 65) return 'bg-primary'
  return 'bg-warning'
}

export function ConfidenceBadge({
  value,
  showBar = false,
  className,
}: {
  value: number
  showBar?: boolean
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {showBar ? (
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <span
            className={cn('block h-full rounded-full', confidenceBar(value))}
            style={{ width: `${value}%` }}
          />
        </span>
      ) : null}
      <span className={cn('font-mono text-sm font-medium tabular-nums', confidenceTone(value))}>
        {value}%
      </span>
    </span>
  )
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
}: {
  value: number
  max?: number
  className?: string
  barClassName?: string
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn('h-full rounded-full bg-primary transition-all duration-500', barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
