'use client'

import { Select } from '@/components/ui/select'

interface FilterOption {
  value: string
  label: string
}

interface FilterBarProps {
  filters: Array<{
    label: string
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
  }>
}

export function FilterBar({ filters }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((filter) => (
        <div key={filter.label} className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            {filter.label}
          </label>
          <Select value={filter.value} onValueChange={filter.onChange}>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ))}
    </div>
  )
}
