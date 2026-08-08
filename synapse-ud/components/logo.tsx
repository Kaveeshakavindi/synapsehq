import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  href = '/',
}: {
  className?: string
  href?: string
}) {
  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2 font-heading', className)}
      aria-label="SYNAPSE home"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="6" cy="6" r="2.2" />
          <circle cx="18" cy="7" r="2.2" />
          <circle cx="7" cy="18" r="2.2" />
          <circle cx="17" cy="17" r="2.2" />
          <path d="M8 6.6 15.8 6.9M7.4 8 7 15.8M8.6 7.2 16 15.8M8.7 17.2 15 17.1M16.5 9 17 15" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-foreground">
        SYNAPSE
      </span>
    </Link>
  )
}
