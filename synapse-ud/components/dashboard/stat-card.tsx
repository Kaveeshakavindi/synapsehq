import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
}: {
  label: string
  value: string
  icon: LucideIcon
  trend?: 'up' | 'down'
  trendLabel?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 font-heading text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </div>
      {trendLabel ? (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {trend === 'down' ? (
            <ArrowDownRight className="size-3.5 text-destructive" aria-hidden="true" />
          ) : (
            <ArrowUpRight className="size-3.5 text-success" aria-hidden="true" />
          )}
          <span className={cn(trend === 'down' ? 'text-destructive' : 'text-success')}>
            {trendLabel}
          </span>
        </div>
      ) : null}
    </Card>
  )
}
