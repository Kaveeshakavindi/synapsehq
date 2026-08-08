import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const metadata: Metadata = {
  title: 'Dashboard — SYNAPSE',
  description:
    'Analyze ESG claims and detect greenwashing with evidence-grounded AI reasoning.',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, status')
    .eq('user_id', user.id)
    // Soft-deleted orgs (DELETE /organizations/{id} on the backend) must not
    // let the user back into the dashboard — that endpoint only sets
    // deleted_at, it doesn't remove the row, so this query has to filter it
    // out explicitly or "delete organization" would silently do nothing
    // from the frontend's perspective.
    .is('deleted_at', null)
    .single()

  if (!org) {
    redirect('/signup')
  }

  if (org.status === 'pending') {
    redirect('/pending')
  }

  if (org.status === 'rejected') {
    redirect('/rejected')
  }

  return (
    <DashboardShell org={{ id: org.id, name: org.name, email: user.email ?? '' }}>
      {children}
    </DashboardShell>
  )
}