'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  PanelLeft,
  Bell,
  ChevronDown,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { organization, notifications } from '@/lib/dashboard-data'
import { useOrg } from '@/lib/org-context'
import { cn } from '@/lib/utils'

function Backdrop({ onClose }: { onClose: () => void }) {
  return <button className="fixed inset-0 z-40 cursor-default" aria-hidden="true" tabIndex={-1} onClick={onClose} />
}

export function DashboardHeader({
  onToggleSidebar,
  onOpenMobile,
}: {
  onToggleSidebar: () => void
  onOpenMobile: () => void
}) {
  const [openMenu, setOpenMenu] = useState<'notifications' | 'profile' | null>(null)
  const unread = notifications.filter((n) => n.unread).length
  const org = useOrg()
  const initials = org.name?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-card/80 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobile}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="size-5" />
      </Button>

      <div className="ml-auto flex items-center gap-1.5">
        <span className="mr-1 hidden items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
          {organization.plan} Plan
        </span>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            onClick={() => setOpenMenu(openMenu === 'notifications' ? null : 'notifications')}
          >
            <span className="relative">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-2 rounded-full bg-primary ring-2 ring-card" />
              )}
            </span>
          </Button>
          {openMenu === 'notifications' && (
            <>
              <Backdrop onClose={() => setOpenMenu(null)} />
              <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="text-sm font-semibold">Notifications</span>
                  <span className="text-xs text-muted-foreground">{unread} unread</span>
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-0">
                      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.unread ? 'bg-primary' : 'bg-border')} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{n.detail}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground/70">{n.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted"
            onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
            aria-label="Account menu"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary font-heading text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight">{org.name}</span>
              <span className="block truncate text-xs leading-tight text-muted-foreground">{org.email}</span>
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </button>
          {openMenu === 'profile' && (
            <>
              <Backdrop onClose={() => setOpenMenu(null)} />
              <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-popover">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-medium">{org.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{org.email}</p>
                </div>
                <div className="p-1.5">
                  {[
                    { label: 'Billing', href: '/dashboard/subscription', icon: CreditCard },
                    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
                  ].map(({ label, href, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-border" />
                  <Link
                    href="/login"
                    onClick={() => setOpenMenu(null)}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
