import { cn } from '@/lib/utils'

const palette = [
  'bg-primary/10 text-primary',
  'bg-success/10 text-success',
  'bg-warning/10 text-warning',
  'bg-chart-4/10 text-chart-4',
  'bg-chart-5/10 text-chart-5',
]

function toneFor(name?: string) {
  let sum = 0
  const safeName = name || 'Unknown'
  for (let i = 0; i < safeName.length; i++) sum += safeName.charCodeAt(i)
  return palette[sum % palette.length]
}

export function CompanyAvatar({
  name,
  size = 'md',
  className,
}: {
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const initials = (name || 'Unknown')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const sizes = {
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-12 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl border border-border font-heading font-semibold',
        sizes[size],
        toneFor(name),
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
