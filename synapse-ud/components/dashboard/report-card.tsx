'use client'

import { Bookmark, Download } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VerdictBadge } from './verdict-badge'
import { ConfidenceBadge } from './confidence-badge'
import type { Verdict } from '@/lib/dashboard-data'

interface ReportCardProps {
  report: {
    id: string
    company: string
    topic: string
    savedDate: string
    confidence: number | null
    verdict: Verdict
  }
  onOpen: (id: string) => void
  onDownload: (id: string) => void
  onUnbookmark: (id: string) => void
  busy?: boolean
}

export function ReportCard({ report, onOpen, onDownload, onUnbookmark, busy }: ReportCardProps) {
  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-lg text-foreground">
          {report.company}
        </h3>
        <button
          className="text-primary hover:text-muted-foreground transition-colors disabled:opacity-50"
          aria-label="Remove bookmark"
          disabled={busy}
          onClick={() => onUnbookmark(report.id)}
        >
          <Bookmark className="size-5 fill-primary" />
        </button>
      </div>
      <div className="flex-1 mb-4">
        <p className="text-sm text-muted-foreground mb-4">{report.topic}</p>
        <p className="text-xs text-muted-foreground">
          Analyzed {report.savedDate}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <VerdictBadge verdict={report.verdict} />
        {report.confidence != null && <ConfidenceBadge value={report.confidence} />}
      </div>

      <div className="flex gap-2">
        <Button
          variant="default"
          className="flex-1"
          onClick={() => onOpen(report.id)}
        >
          Open Report
        </Button>
        <Button variant="outline" size="icon" disabled={busy} onClick={() => onDownload(report.id)}>
          <Download className="size-4" />
        </Button>
      </div>
    </Card>
  )
}
