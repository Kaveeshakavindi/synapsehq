import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Verdict } from '@/lib/dashboard-data'

const config: Record<
  Verdict,
  { className: string; Icon: typeof CheckCircle2 }
> = {
  'Likely Genuine': {
    className: 'bg-success/10 text-success border-success/20',
    Icon: CheckCircle2,
  },
  'Potential Greenwashing': {
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    Icon: AlertTriangle,
  },
  'Needs Further Investigation': {
    className: 'bg-warning/10 text-warning border-warning/25',
    Icon: HelpCircle,
  },
}

export function VerdictBadge({
  verdict,
  size = 'sm',
  className,
}: {
  verdict: Verdict
  size?: 'sm' | 'lg'
  className?: string
}) {
  const { className: tone, Icon } = config[verdict]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1.5 text-sm',
        tone,
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} aria-hidden="true" />
      {verdict}
    </span>
  )
}
