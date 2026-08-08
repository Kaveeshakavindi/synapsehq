'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Trash2, Eye, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SearchInput } from '@/components/dashboard/search-input'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { VerdictBadge } from '@/components/dashboard/verdict-badge'
import { ConfidenceBadge } from '@/components/dashboard/confidence-badge'
import {
  listAnalyses,
  getCompanyOptions,
  deleteAnalysis,
  bookmarkAnalysis,
  unbookmarkAnalysis,
  downloadAnalysis,
  type AnalysisListItem,
  type CompanyOption,
} from '@/lib/api'
import { toVerdictFromJudgment } from '@/lib/dashboard-data'

const PAGE_SIZE = 20

// The backend can only filter by exact `judgment` (Credible/False/
// Misleading/Unsupported) — see GET /analyses' `verdict` param. The 3-way
// "Likely Genuine / Potential Greenwashing / Needs Further Investigation"
// Verdict badge is a many-to-one derived label (toVerdictFromJudgment), so
// it can't be sent back as a single filter value. Filter by judgment
// directly instead.
const judgments = ['Credible', 'False', 'Misleading', 'Unsupported']

export default function HistoryPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [selectedJudgment, setSelectedJudgment] = useState('all')

  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [items, setItems] = useState<AnalysisListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    getCompanyOptions().then(setCompanies).catch(() => {})
  }, [])

  const load = (nextPage: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')
    listAnalyses({
      search: search || undefined,
      company: selectedCompany === 'all' ? undefined : selectedCompany,
      verdict: selectedJudgment === 'all' ? undefined : selectedJudgment,
      page: nextPage,
      page_size: PAGE_SIZE,
    })
      .then((res) => {
        setItems((prev) => (append ? [...prev, ...res.items] : res.items))
        setTotal(res.total)
        setPage(res.page)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history.'))
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }

  useEffect(() => {
    load(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCompany, selectedJudgment])

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

  const handleBookmarkToggle = async (item: AnalysisListItem) => {
    setPendingId(item.id)
    try {
      if (item.bookmarked) await unbookmarkAnalysis(item.id)
      else await bookmarkAnalysis(item.id)
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, bookmarked: !i.bookmarked } : i))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark.')
    } finally {
      setPendingId(null)
    }
  }

  const handleDelete = async (item: AnalysisListItem) => {
    // No soft-delete safety net on the backend for analyses (unlike
    // organizations) — this is permanent, hence the confirm.
    if (!window.confirm(`Delete the analysis of ${item.company} — ${item.topic}? This can't be undone.`)) {
      return
    }
    setPendingId(item.id)
    try {
      await deleteAnalysis(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setTotal((prev) => Math.max(prev - 1, 0))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete analysis.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Analysis History</h1>
        <p className="text-lg text-muted-foreground">
          Browse and manage all your past analyses.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 space-y-4">
        <SearchInput
          placeholder="Search by company or topic..."
          value={search}
          onChange={setSearch}
        />
        <FilterBar
          filters={[
            {
              label: 'Company',
              options: [
                { value: 'all', label: 'All Companies' },
                ...companies.map((c) => ({ value: c.name, label: c.name })),
              ],
              value: selectedCompany,
              onChange: setSelectedCompany,
            },
            {
              label: 'Judgment',
              options: [
                { value: 'all', label: 'All Judgments' },
                ...judgments.map((j) => ({ value: j, label: j })),
              ],
              value: selectedJudgment,
              onChange: setSelectedJudgment,
            },
          ]}
        />
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {items.length} of {total} analyses
          </div>

          {/* Table */}
          {items.length > 0 ? (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left font-semibold text-foreground p-4">Date</th>
                    <th className="text-left font-semibold text-foreground p-4">Company</th>
                    <th className="text-left font-semibold text-foreground p-4">Topic</th>
                    <th className="text-left font-semibold text-foreground p-4">Verdict</th>
                    <th className="text-left font-semibold text-foreground p-4">Confidence</th>
                    <th className="text-left font-semibold text-foreground p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-border ${
                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                      } hover:bg-muted/50 transition-colors`}
                    >
                      <td className="p-4 text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-4 font-medium text-foreground">{item.company}</td>
                      <td className="p-4 text-foreground">{item.topic}</td>
                      <td className="p-4">
                        <VerdictBadge verdict={toVerdictFromJudgment(item.judgment)} />
                      </td>
                      <td className="p-4">
                        {item.confidence == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <ConfidenceBadge value={Math.round(item.confidence * 100)} />
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              router.push(
                                `/dashboard/results?company=${encodeURIComponent(item.company)}&topic=${encodeURIComponent(item.topic)}`
                              )
                            }
                            aria-label="View"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Download"
                            disabled={pendingId === item.id}
                            onClick={() => handleDownload(item.id)}
                          >
                            <Download className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={item.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                            disabled={pendingId === item.id}
                            onClick={() => handleBookmarkToggle(item)}
                          >
                            <Bookmark
                              className={`size-4 ${
                                item.bookmarked ? 'fill-primary text-primary' : ''
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label="Delete"
                            disabled={pendingId === item.id}
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No analyses found matching your filters.</p>
            </Card>
          )}

          {items.length < total && (
            <div className="flex justify-center">
              <Button variant="outline" disabled={loadingMore} onClick={() => load(page + 1, true)}>
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
