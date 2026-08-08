'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  Lock,
  Building2,
  BadgeCheck,
  LoaderCircle,
  CheckCircle,
  AlertTriangle,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Step = 'form' | 'verifying' | 'rejected'

export default function SignupPage() {
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm: '',
    org: '',
    tin: '',
  })
  const [error, setError] = useState<string | null>(null)

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // 1. Create the auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          org_name: form.org, // stored as user_metadata, handy for emails/dashboards
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = signUpData.user?.id
    if (!userId) {
      setError('Something went wrong creating your account. Please try again.')
      setLoading(false)
      return
    }

    // signup page — after supabase.auth.signUp() succeeds
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: signUpData.user?.id,
        name: form.org,
        tin: form.tin,
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.detail ?? 'Failed to submit organization details.')
      setLoading(false)
      return
    }
    setStep('verifying')
  }

  if (step === 'verifying') {
    return (
      <AuthShell>
        <StatusCard
          icon={<Lock />}
          iconBg="bg-secondary"
          title="Verification in Progress"
        >
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Your organization has been submitted for verification. This
            typically takes up to{' '}
            <span className="font-semibold text-foreground">3 business days</span>.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            You will receive an email at{' '}
            <span className="font-mono text-foreground">
              {form.email || 'your company address'}
            </span>{' '}
            once verification is complete. Please confirm your email address to
            activate your account.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-3 text-xs font-medium text-muted-foreground">
            <ClipboardCheck className="size-4 text-primary" />
            Reviewing organization {form.org || 'details'}
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/"
              className={cn(buttonVariants({ size: 'lg' }), 'h-11 w-full text-base')}
            >
              Return Home
            </Link>
          </div>
        </StatusCard>
      </AuthShell>
    )
  }

  if (step === 'rejected') {
    return (
      <AuthShell>
        <StatusCard
          icon={<AlertTriangle className="size-8 text-destructive" />}
          iconBg="bg-destructive/10"
          title="Verification Unsuccessful"
        >
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            We were unable to verify your organization. Please review your submitted
            information or contact our support team for assistance.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="#"
              className={cn(buttonVariants({ size: 'lg' }), 'h-11 w-full text-base')}
            >
              Contact Support
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="h-11 w-full text-base"
              onClick={() => setStep('form')}
            >
              Review Information
            </Button>
          </div>
        </StatusCard>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_12px_50px_-24px_rgba(20,22,27,0.25)]">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
            <BadgeCheck className="size-6" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground">
            Verify your company profile
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <Field
            id="email"
            label="Company Email"
            icon={<Mail className="size-4" />}
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(v) => update('email', v)}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="password"
              label="Password"
              icon={<Lock className="size-4" />}
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(v) => update('password', v)}
              required
            />
            <Field
              id="confirm"
              label="Confirm Password"
              icon={<Lock className="size-4" />}
              type="password"
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={(v) => update('confirm', v)}
              required
            />
          </div>
          <Field
            id="org"
            label="Organization Name"
            icon={<Building2 className="size-4" />}
            placeholder="Acme Capital Partners"
            value={form.org}
            onChange={(v) => update('org', v)}
            required
          />
          <Field
            id="tin"
            label="Company TIN Number"
            icon={<ClipboardCheck className="size-4" />}
            placeholder="12-3456789"
            value={form.tin}
            onChange={(v) => update('tin', v)}
            required
          />

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-2 h-11 w-full text-base" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Verify Company Profile'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

function Field({
  id,
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
}: {
  id: string
  label: string
  icon: React.ReactNode
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="pl-9"
        />
      </div>
    </div>
  )
}

function StatusCard({
  icon,
  iconBg,
  title,
  children,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[0_12px_50px_-24px_rgba(20,22,27,0.25)]">
      <div
        className={cn(
          'mx-auto flex size-16 items-center justify-center rounded-2xl',
          iconBg,
        )}
      >
        {icon}
      </div>
      <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      <div className="mt-3">{children}</div>
    </div>
  )
}