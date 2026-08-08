'use client'

import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfidenceBadge } from './confidence-badge'
import type { EvidenceItem } from '@/lib/dashboard-data'

interface EvidenceCardProps {
  evidence: EvidenceItem
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {evidence.source}
          </p>
          <p className="text-sm font-medium text-foreground mt-1 line-clamp-2">
            {evidence.publication}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{evidence.date}</p>
        </div>
        {evidence.confidence != null && <ConfidenceBadge value={evidence.confidence} />}
      </div>
      <p className="text-sm leading-relaxed text-foreground mb-4">
        {evidence.snippet}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        asChild
      >
        <a href={evidence.url} target="_blank" rel="noopener noreferrer">
          Open Source
          <ExternalLink className="size-3" />
        </a>
      </Button>
    </Card>
  )
}
