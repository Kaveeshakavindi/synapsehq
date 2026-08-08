'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SubscriptionCard } from '@/components/dashboard/subscription-card'
import {
  getSubscription,
  listInvoices,
  upgradeSubscription,
  cancelSubscription,
  downloadInvoice,
  type SubscriptionOut,
  type InvoiceOut,
} from '@/lib/api'

// Must stay in sync with Backend/app/routers/subscription.py's PLAN_LIMITS —
// that's the authoritative list of plans the backend will accept.
const PLAN_OPTIONS = [
  { id: 'free', label: 'Free', price: '$0/mo' },
  { id: 'professional', label: 'Professional', price: '$49/mo' },
  { id: 'enterprise', label: 'Enterprise', price: '$199/mo' },
]

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionOut | null>(null)
  const [invoices, setInvoices] = useState<InvoiceOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [busyPlan, setBusyPlan] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([getSubscription(), listInvoices()])
      .then(([sub, inv]) => {
        setSubscription(sub)
        setInvoices(inv)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load subscription.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpgrade = async (planId: string) => {
    setBusyPlan(planId)
    setError('')
    try {
      await upgradeSubscription(planId)
      setShowPlanPicker(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change plan.')
    } finally {
      setBusyPlan(null)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You can resubscribe any time.')) return
    setCancelling(true)
    setError('')
    try {
      await cancelSubscription()
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription.')
    } finally {
      setCancelling(false)
    }
  }

  const handleDownloadInvoice = async (id: string) => {
    setDownloadingId(id)
    try {
      await downloadInvoice(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">Couldn&apos;t load your subscription: {error}</p>
      </div>
    )
  }

  const { usage } = subscription
  const pct = usage.analyses_limit > 0 ? Math.round((usage.analyses_used / usage.analyses_limit) * 100) : 0

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Subscription</h1>
        <p className="text-lg text-muted-foreground">
          Manage your plan, usage, and billing.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Current Plan */}
      <Card className="p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <SubscriptionCard
            title="Current Plan"
            value={<span className="capitalize">{subscription.plan}</span>}
            description={subscription.status}
          />
          <SubscriptionCard
            title="Renewal Date"
            value={
              subscription.renewal_date
                ? new Date(subscription.renewal_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'
            }
          />
        </div>
      </Card>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Monthly Usage</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Analyses Used
            </p>
            <p className="text-3xl font-bold text-foreground">
              {usage.analyses_used} / {usage.analyses_limit}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{pct}% of monthly limit</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Queries Remaining
            </p>
            <p className="text-3xl font-bold text-foreground">{usage.queries_remaining}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Reports Saved
            </p>
            <p className="text-3xl font-bold text-foreground">{usage.reports_saved}</p>
          </Card>
        </div>
      </div>

      {/* Actions — simulated billing, no real payment processor (see
          backend decision notes). Upgrade writes a plan change + a paid
          invoice directly; there's no Stripe checkout to redirect to. */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button size="lg" onClick={() => setShowPlanPicker((v) => !v)}>
            {showPlanPicker ? 'Close' : 'Upgrade Plan'}
          </Button>
          <Button variant="outline" size="lg" disabled={cancelling} onClick={handleCancel}>
            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        </div>
        {showPlanPicker && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              {PLAN_OPTIONS.map((p) => (
                <Button
                  key={p.id}
                  variant={p.id === subscription.plan ? 'default' : 'outline'}
                  disabled={busyPlan !== null || p.id === subscription.plan}
                  onClick={() => handleUpgrade(p.id)}
                >
                  {busyPlan === p.id ? 'Applying...' : `${p.label} — ${p.price}`}
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Billing History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Billing History</h2>
        {invoices.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No invoices yet.
          </Card>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left font-semibold text-foreground p-4">
                    Invoice
                  </th>
                  <th className="text-left font-semibold text-foreground p-4">
                    Date
                  </th>
                  <th className="text-left font-semibold text-foreground p-4">
                    Plan
                  </th>
                  <th className="text-left font-semibold text-foreground p-4">
                    Amount
                  </th>
                  <th className="text-left font-semibold text-foreground p-4">
                    Status
                  </th>
                  <th className="text-left font-semibold text-foreground p-4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, idx) => (
                  <tr
                    key={invoice.id}
                    className={`border-b border-border ${
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    }`}
                  >
                    <td className="p-4 font-mono text-sm text-foreground">
                      {invoice.id.slice(0, 8)}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-foreground capitalize">{invoice.plan}</td>
                    <td className="p-4 font-medium text-foreground">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        disabled={downloadingId === invoice.id}
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        {downloadingId === invoice.id ? 'Downloading...' : 'Download'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
