'use client'

import { createContext, useContext } from 'react'

export interface OrgInfo {
  id: string
  name: string
  email: string
}

const OrgContext = createContext<OrgInfo | null>(null)

// Real signed-in org/user info — org.name comes from the `organizations` row
// tied to this account, org.email from the Supabase auth user. Fetched
// server-side once in app/dashboard/layout.tsx and threaded down through this
// context so any client component under the dashboard (header, home page,
// settings, ...) can read it without re-fetching or prop-drilling.
export function OrgProvider({
  org,
  children,
}: {
  org: OrgInfo
  children: React.ReactNode
}) {
  return <OrgContext.Provider value={org}>{children}</OrgContext.Provider>
}

export function useOrg(): OrgInfo {
  const ctx = useContext(OrgContext)
  if (!ctx) {
    throw new Error('useOrg must be used within an OrgProvider (i.e. under the dashboard layout)')
  }
  return ctx
}
