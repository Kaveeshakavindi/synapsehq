import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ProgressBar } from './metrics'
import { cn } from '@/lib/utils'

export function UsageCard({
  used,
  limit,
  plan,
  renewalDate,
}: {
  used: number
  limit: number
  plan: string
  renewalDate: string | null
}) {
  const remaining = Math.max(limit - used, 0)
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap className="size-4" aria-hidden="true" />
            </span>
            <h2 className="font-heading text-base font-semibold">Monthly Usage</h2>
            <span className="ml-auto rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize lg:hidden">
              {plan}
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold tabular-nums">
              {used}
            </span>
            <span className="text-sm text-muted-foreground">
              / {limit} analyses used
            </span>
          </div>

          <div className="mt-3">
            <ProgressBar value={used} max={limit} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {remaining} analyses remaining this cycle
            {renewalDate ? ` · resets ${new Date(renewalDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 lg:flex-col lg:items-end">
          <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize lg:inline-flex">
            {plan} Plan
          </span>
          <div className="text-right lg:mt-2">
            <span className="font-heading text-lg font-bold tabular-nums">{pct}%</span>
            <span className="ml-1 text-xs text-muted-foreground">of quota</span>
          </div>
          <Link
            href="/dashboard/subscription"
            className={cn(buttonVariants({ size: 'lg' }), 'h-10 px-4')}
          >
            Upgrade
          </Link>
        </div>
      </div>
    </Card>
  )
}
