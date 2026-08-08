'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, CheckCircle, CreditCard, ArrowRight } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { plans } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { checkout } from '@/lib/api'

const plan = plans.find((p) => p.id === 'professional')!

export default function CheckoutPage() {
  const [status, setStatus] = useState<'form' | 'processing' | 'confirmed'>(
    'form',
  )
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('processing')
    // Billing is simulated server-side (see backend decision notes) — the
    // card fields above are UI-only for continuity and are never sent
    // anywhere. Only the plan selection reaches the backend.
    try {
      await checkout(plan.id)
      setStatus('confirmed')
    } catch (err) {
      setStatus('form')
      setError(
        err instanceof Error && err.message === 'Not authenticated'
          ? 'Please log in before subscribing.'
          : err instanceof Error
            ? err.message
            : 'Checkout failed.'
      )
    }
  }

  if (status === 'confirmed') {
    return (
      <AuthShell>
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[0_12px_50px_-24px_rgba(20,22,27,0.25)]">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#16a34a]/10">
            <CheckCircle className="size-8 text-success" />
          </div>
          <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-foreground">
            Payment successful
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your {plan.name} subscription is now active. A receipt has been sent to
            your company email.
          </p>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'mt-6 h-11 w-full text-base',
            )}
          >
            Continue to Login
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell width="lg">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
              Subscription
            </p>
            <h2 className="mt-3 font-heading text-lg font-semibold text-foreground">
              {plan.name} Plan
            </h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-heading text-3xl font-bold text-foreground">
                {plan.price}
              </span>
              <span className="text-sm text-muted-foreground">
                {plan.period} billed monthly
              </span>
            </div>

            <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm text-foreground"
                >
                  <CheckCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{plan.price}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between pt-2 font-semibold text-foreground">
                <span>Due today</span>
                <span>{plan.price}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
                Billing details
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Lock className="size-3.5 text-success" />
                Secure
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name on card</Label>
                <Input id="name" placeholder="Jordan Analyst" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="card">Card number</Label>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="card"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    required
                    className="pl-9 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="exp">Expiry</Label>
                  <Input id="exp" placeholder="MM / YY" required className="font-mono" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" placeholder="123" required className="font-mono" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="country">Billing country</Label>
                <Input id="country" placeholder="United States" required />
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={status === 'processing'}
                className="mt-2 h-11 w-full text-base"
              >
                {status === 'processing'
                  ? 'Processing...'
                  : `Pay ${plan.price} and subscribe`}
              </Button>

              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                No real payment is processed yet — billing is simulated for
                this preview. You can cancel your subscription at any time
                from your dashboard.
              </p>
            </form>
          </div>
        </div>
      </div>
    </AuthShell>
  )
}
