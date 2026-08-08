'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, BarChart3, Bookmark, TrendingUpIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { UsageCard } from '@/components/dashboard/usage-card'
import { HistoryTable } from '@/components/dashboard/history-table'
import { getDashboardSummary, getSubscription, type DashboardSummary, type SubscriptionOut } from '@/lib/api'
import { formatConfidence, toVerdictFromJudgment, type HistoryEntry } from '@/lib/dashboard-data'
import { useOrg } from '@/lib/org-context'

export default function DashboardHome() {
  const org = useOrg()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([getDashboardSummary(), getSubscription()])
      .then(([s, sub]) => {
        if (cancelled) return
        setSummary(s)
        setSubscription(sub)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (error || !summary || !subscription) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">
          Couldn&apos;t load your dashboard: {error || 'Unknown error.'}
        </p>
      </div>
    )
  }

  const recentEntries: HistoryEntry[] = summary.recent_analyses.map((a) => ({
    id: a.id,
    date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    company: a.company,
    topic: a.topic,
    verdict: toVerdictFromJudgment(a.judgment),
    confidence: a.confidence == null ? 0 : Math.round(a.confidence * 100),
  }))

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-foreground">{org.name}</h1>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium capitalize text-primary">
            <TrendingUp className="size-4" />
            {subscription.plan} Plan
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly Analyses"
          value={`${subscription.usage.analyses_used}/${subscription.usage.analyses_limit}`}
          icon={BarChart3}
        />
        <StatCard
          label="Companies Analyzed"
          value={String(summary.companies_analyzed_count)}
          icon={TrendingUpIcon}
        />
        <StatCard
          label="Saved Reports"
          value={String(summary.saved_reports_count)}
          icon={Bookmark}
        />
        <StatCard
          label="Average Confidence"
          value={formatConfidence(summary.avg_confidence)}
          icon={TrendingUp}
        />
      </div>

      {/* Usage Card */}
      <UsageCard
        used={subscription.usage.analyses_used}
        limit={subscription.usage.analyses_limit}
        plan={subscription.plan}
        renewalDate={subscription.renewal_date}
      />

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">New Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Start a fresh ESG analysis.
              </p>
            </div>
            <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
          </div>
          <Button className="w-full mt-auto">
            <Link href="/dashboard/analyze">
              Analyze Now
            </Link>
          </Button>
        </Card>

        <Card className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Saved Reports</h3>
              <p className="text-sm text-muted-foreground">
                View {summary.saved_reports_count} saved reports.
              </p>
            </div>
            <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
          </div>
          <Button variant="outline" className="w-full mt-auto" >
            <Link href="/dashboard/reports">
              View Reports
            </Link>
          </Button>
        </Card>

        <Card className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Analysis History</h3>
              <p className="text-sm text-muted-foreground">
                Browse {summary.analyses_count} past analyses.
              </p>
            </div>
            <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
          </div>
          <Button variant="outline" className="w-full mt-auto" >
            <Link href="/dashboard/history">
              View History
            </Link>
          </Button>
        </Card>
      </div>

      {/* Recent Analyses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Analyses</h2>
          <Button variant="outline" size="sm" >
            <Link href="/dashboard/history">View all</Link>
          </Button>
        </div>
        {recentEntries.length > 0 ? (
          <HistoryTable entries={recentEntries} />
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No analyses yet — run your first one from Analyze.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
