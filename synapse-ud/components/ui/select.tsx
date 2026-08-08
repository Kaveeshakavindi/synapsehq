'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends Omit<React.ComponentProps<'select'>, 'onChange'> {
  placeholder?: string
  onValueChange?: (value: string) => void
}

function Select({
  className,
  placeholder,
  children,
  value,
  onValueChange,
  ...props
}: SelectProps) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          'flex h-11 w-full appearance-none rounded-lg border border-input bg-card px-3.5 pr-10 text-sm text-foreground outline-none transition-colors',
          'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25',
          'disabled:pointer-events-none disabled:opacity-50',
          value === '' && 'text-muted-foreground',
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}

export { Select }