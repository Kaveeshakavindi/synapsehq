'use client'

import Link from 'next/link'
import { Eye, Download, Bookmark, Trash2 } from 'lucide-react'
import { CompanyAvatar } from './company-avatar'
import { VerdictBadge } from './verdict-badge'
import { ConfidenceBadge } from './metrics'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import type { HistoryEntry } from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'

export function HistoryTable({
  entries,
  variant = 'full',
}: {
  entries: HistoryEntry[]
  variant?: 'full' | 'compact'
}) {
  const full = variant === 'full'

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Company</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Topic</th>
              <th className="px-5 py-3 font-medium">Verdict</th>
              <th className="hidden px-5 py-3 font-medium md:table-cell">Confidence</th>
              <th className="px-5 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                  {e.date}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <CompanyAvatar name={e.company} size="sm" />
                    <span className="font-medium">{e.company}</span>
                  </div>
                </td>
                <td className="hidden px-5 py-3.5 text-muted-foreground sm:table-cell">
                  {e.topic}
                </td>
                <td className="px-5 py-3.5">
                  <VerdictBadge verdict={e.verdict} />
                </td>
                <td className="hidden px-5 py-3.5 md:table-cell">
                  <ConfidenceBadge value={e.confidence} showBar />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/dashboard/results?company=${encodeURIComponent(e.company)}&topic=${encodeURIComponent(e.topic)}`}
                      className={cn(buttonVariants({ variant: full ? 'outline' : 'ghost', size: 'sm' }))}
                    >
                      <Eye className="size-3.5" />
                      View
                    </Link>
                    {full && (
                      <>
                        <Button variant="ghost" size="icon-sm" aria-label="Download report">
                          <Download className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Bookmark"
                          className={e.bookmarked ? 'text-primary' : ''}
                        >
                          <Bookmark className={cn('size-3.5', e.bookmarked && 'fill-current')} />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Delete">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
