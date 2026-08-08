// app/pending/page.tsx
import { AuthShell } from '@/components/auth/auth-shell'
import { Lock } from 'lucide-react'

export default function PendingPage() {
  return (
    <AuthShell>
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[0_12px_50px_-24px_rgba(20,22,27,0.25)]">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-secondary">
          <Lock className="size-8" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-foreground">
          Verification in Progress
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your organization is still under review. You'll get access to your
          dashboard once verification is complete.
        </p>
      </div>
    </AuthShell>
  )
}