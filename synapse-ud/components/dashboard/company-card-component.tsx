'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompanyAvatar } from './company-avatar'
import type { CompanyOption } from '@/lib/api'

interface CompanyCardProps {
  company: CompanyOption
  onAnalyze: () => void
}

export function CompanyCardComponent({ company, onAnalyze }: CompanyCardProps) {
  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <CompanyAvatar name={company.name} className="size-12" />
      </div>

      <h3 className="font-semibold text-lg text-foreground mb-1">
        {company.name}
      </h3>
      {/* ticker/industry are always null today — source CSV has neither
          column (see CompanyOption's data-gap comment). Hide rather than
          render "null". */}
      {company.ticker && (
        <p className="text-xs text-muted-foreground mb-3">{company.ticker}</p>
      )}
      {company.industry && (
        <p className="text-sm text-muted-foreground mb-1">{company.industry}</p>
      )}

      <p className="text-sm mb-4">
        <span className="font-medium text-foreground">{company.topics.length}</span>{' '}
        <span className="text-muted-foreground">ESG topics tracked</span>
      </p>

      <Button
        variant="default"
        className="w-full mt-auto"
        onClick={onAnalyze}
      >
        Analyze
      </Button>
    </Card>
  )
}
