'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchInput } from '@/components/dashboard/search-input'
import { ReportCard } from '@/components/dashboard/report-card'
import { listReports, unbookmarkAnalysis, downloadAnalysis, type AnalysisListItem } from '@/lib/api'
import { toVerdictFromJudgment } from '@/lib/dashboard-data'

export default function SavedReportsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [reports, setReports] = useState<AnalysisListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    listReports(search || undefined)
      .then((res) => {
        if (!cancelled) setReports(res.items)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reports.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [search])

  const handleUnbookmark = async (id: string) => {
    setPendingId(id)
    try {
      await unbookmarkAnalysis(id)
      setReports((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove bookmark.')
    } finally {
      setPendingId(null)
    }
  }

  const handleDownload = async (id: string) => {
    setPendingId(id)
    try {
      await downloadAnalysis(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Saved Reports</h1>
        <p className="text-lg text-muted-foreground">
          {reports.length} analysis reports saved for later review.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <SearchInput
          placeholder="Search reports..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : reports.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={{
                id: report.id,
                company: report.company,
                topic: report.topic,
                savedDate: new Date(report.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
                confidence: report.confidence == null ? null : Math.round(report.confidence * 100),
                verdict: toVerdictFromJudgment(report.judgment),
              }}
              busy={pendingId === report.id}
              onOpen={() =>
                router.push(
                  `/dashboard/results?company=${encodeURIComponent(report.company)}&topic=${encodeURIComponent(report.topic)}`
                )
              }
              onDownload={handleDownload}
              onUnbookmark={handleUnbookmark}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">
            {search ? 'No reports found matching your search.' : 'No saved reports yet.'}
          </p>
          {!search && (
            <p className="text-sm text-muted-foreground">
              Save reports from your analyses to view them here.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
