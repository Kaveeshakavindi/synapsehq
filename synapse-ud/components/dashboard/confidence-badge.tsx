'use client'

interface ConfidenceBadgeProps {
  value: number
  className?: string
}

export function ConfidenceBadge({ value, className }: ConfidenceBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium ${className}`}>
      <span className="text-foreground">{value}%</span>
      <div className="flex gap-0.5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1 rounded-full ${
              i < Math.round((value / 100) * 3)
                ? 'bg-primary'
                : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
