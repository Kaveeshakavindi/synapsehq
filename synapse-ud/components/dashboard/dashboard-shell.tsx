'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { AppSidebar } from './app-sidebar'
import { DashboardHeader } from './dashboard-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OrgProvider } from '@/lib/org-context'

export function DashboardShell({
  children,
  org,
}: {
  children: React.ReactNode
  org: { id: string; name: string; email: string }
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <OrgProvider org={org}>
      <div className="flex min-h-screen bg-background">
        <aside
          className={cn(
            'sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border transition-[width] duration-200 lg:block',
            collapsed ? 'w-[72px]' : 'w-[260px]',
          )}
        >
          <AppSidebar collapsed={collapsed} org={org} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-foreground/40"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[260px] border-r border-sidebar-border bg-sidebar">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-4 z-10"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </Button>
              <AppSidebar collapsed={false} org={org} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            onToggleSidebar={() => setCollapsed((v) => !v)}
            onOpenMobile={() => setMobileOpen(true)}
          />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </OrgProvider>
  )
}