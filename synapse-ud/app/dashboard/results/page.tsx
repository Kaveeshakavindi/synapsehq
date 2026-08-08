'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bookmark, Download, Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { VerdictBadge } from '@/components/dashboard/verdict-badge'
import { ConfidenceBadge } from '@/components/dashboard/confidence-badge'
import { EvidencePanel } from '@/components/dashboard/evidence-panel'
import { EmptyState } from '@/components/dashboard/empty-state'
import {
  getAnalysisByQuery,
  bookmarkAnalysis,
  unbookmarkAnalysis,
  downloadAnalysis,
  shareAnalysis,
  type AnalysisDetail,
  type Citation,
} from '@/lib/api'
import { toVerdict, type EvidenceItem, type EvidenceKind } from '@/lib/dashboard-data'

function citationsToEvidence(citations: Citation[], kind: EvidenceKind): EvidenceItem[] {
  return citations
    .filter((c) => c.source || c.content)
    .map((c, i) => ({
      id: `${kind}-${i}`,
      kind,
      source: c.metadata?.title || c.source || 'Unknown source',
      publication: c.metadata?.company || (kind === 'company' ? 'Company Disclosure' : 'External Source'),
      date: c.metadata?.date || c.metadata?.year || '',
      snippet: c.content || '',
      // Citation.score is always null today (see EvidenceItem's comment) —
      // pass through as-is rather than inventing a number.
      confidence: c.score == null ? null : Math.round(c.score * 100),
      url: c.source || '',
    }))
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const company = searchParams.get('company') || ''
  const topic = searchParams.get('topic') || ''

  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookmarkBusy, setBookmarkBusy] = useState(false)
  const [downloadBusy, setDownloadBusy] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    if (!company || !topic) return
    let cancelled = false
    setLoading(true)
    setError('')
    getAnalysisByQuery(company, topic)
      .then((detail) => {
        if (!cancelled) setAnalysis(detail)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load analysis.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [company, topic])

  if (!company || !topic) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <EmptyState
          title="No Analysis Selected"
          description="Please run an analysis to view results."
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <EmptyState
          title="Couldn't load this analysis"
          description={error || `No analysis found for ${company} — ${topic}.`}
        />
      </div>
    )
  }

  const handleBookmarkToggle = async () => {
    setBookmarkBusy(true)
    try {
      if (analysis.bookmarked) await unbookmarkAnalysis(analysis.id)
      else await bookmarkAnalysis(analysis.id)
      setAnalysis({ ...analysis, bookmarked: !analysis.bookmarked })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark.')
    } finally {
      setBookmarkBusy(false)
    }
  }

  const handleDownload = async () => {
    setDownloadBusy(true)
    try {
      await downloadAnalysis(analysis.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.')
    } finally {
      setDownloadBusy(false)
    }
  }

  const handleShare = async () => {
    setShareBusy(true)
    setShareMessage('')
    try {
      const { share_url } = await shareAnalysis(analysis.id)
      const fullUrl = `${window.location.origin}${share_url}`
      await navigator.clipboard.writeText(fullUrl)
      // No public unauthenticated viewer exists yet — the link only works
      // for a teammate who's logged in and belongs to this org.
      setShareMessage('Link copied — share with teammates who have access.')
      setTimeout(() => setShareMessage(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link.')
    } finally {
      setShareBusy(false)
    }
  }

  const evidence: EvidenceItem[] = [
    ...citationsToEvidence(analysis.retrieved_documents.supportive_sources, 'supporting'),
    ...citationsToEvidence(analysis.retrieved_documents.counterfactual_sources, 'counter'),
    ...citationsToEvidence(analysis.retrieved_documents.company_reports, 'company'),
  ]

  return (
    <div className="space-y-0 p-0">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-full px-8 py-6">
          <div className="mb-4">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
              Analysis
            </span>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{analysis.company}</h1>
              <p className="text-lg text-muted-foreground">{analysis.topic}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label={analysis.bookmarked ? 'Remove bookmark' : 'Save'}
                disabled={bookmarkBusy}
                onClick={handleBookmarkToggle}
              >
                <Bookmark className={`size-5 ${analysis.bookmarked ? 'fill-primary text-primary' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" aria-label="Download" disabled={downloadBusy} onClick={handleDownload}>
                <Download className="size-5" />
              </Button>
              <Button variant="outline" size="icon" aria-label="Share" disabled={shareBusy} onClick={handleShare}>
                <Share2 className="size-5" />
              </Button>
            </div>
          </div>
          {shareMessage && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-success">
              <Check className="size-4" /> {shareMessage}
            </p>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto grid max-w-full grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Left Content */}
        <div className="lg:col-span-2 border-r border-border">
          <div className="space-y-8 p-8">
            {/* Verdict Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Verdict</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <VerdictBadge verdict={toVerdict(analysis.greenwashing_status)} />
                {analysis.confidence != null && (
                  <ConfidenceBadge value={Math.round(analysis.confidence * 100)} />
                )}
              </div>
            </div>

            {/* Summary */}
            {analysis.company_claim_summary && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Claim Summary</h2>
                <p className="text-foreground leading-relaxed">{analysis.company_claim_summary}</p>
              </div>
            )}

            {/* Key Findings */}
            {analysis.key_findings.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Key Findings</h2>
                <ul className="space-y-3">
                  {analysis.key_findings.map((finding, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-foreground">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reasoning */}
            {analysis.reason_for_judgement.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Reasoning</h2>
                <div className="space-y-3 text-foreground leading-relaxed text-sm">
                  {analysis.reason_for_judgement.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Summary */}
            {(analysis.summary_support_evidence || analysis.summary_counter_evidence) && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Evidence Summary</h2>
                {analysis.summary_support_evidence && (
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Supporting</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.summary_support_evidence}
                    </p>
                  </div>
                )}
                {analysis.summary_counter_evidence && (
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Refuting</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.summary_counter_evidence}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation — always null today, the LLM prompt schema
                doesn't produce one yet. Hide rather than show an empty card. */}
            {analysis.recommendation && (
              <Card className="p-6 bg-primary/5 border-primary/20">
                <h3 className="font-semibold text-foreground mb-3">Final Recommendation</h3>
                <p className="text-foreground leading-relaxed">{analysis.recommendation}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Right Panel - Evidence */}
        <div className="min-h-screen lg:col-span-1 border-t lg:border-t-0 border-border">
          <div className="sticky top-16 p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Evidence</h2>
            <EvidencePanel evidence={evidence} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsContent />
    </Suspense>
  )
}
