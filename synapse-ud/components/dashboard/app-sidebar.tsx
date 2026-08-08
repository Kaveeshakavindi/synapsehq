'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Logo } from '@/components/logo'
import { primaryNav, secondaryNav, type NavItem } from './nav-items'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}) {
  const { icon: Icon, label, href } = item
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="size-4.5 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      title={collapsed ? 'Logout' : undefined}
      className={cn(
        'group flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <LogOut className="size-4.5 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">Logout</span>}
    </button>
  )
}

export function AppSidebar({
  collapsed,
  onNavigate,
  org,
}: {
  collapsed: boolean
  onNavigate?: () => void
  org: { name: string; email: string }
}) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div
        className={cn(
          'flex h-16 items-center border-b border-sidebar-border px-4',
          collapsed && 'justify-center px-0',
        )}
      >
        {collapsed ? (
          <Link href="/" aria-label="SYNAPSE home" className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="6" cy="6" r="2.2" />
              <circle cx="18" cy="7" r="2.2" />
              <circle cx="7" cy="18" r="2.2" />
              <circle cx="17" cy="17" r="2.2" />
              <path d="M8 6.6 15.8 6.9M7.4 8 7 15.8M8.6 7.2 16 15.8M8.7 17.2 15 17.1M16.5 9 17 15" />
            </svg>
          </Link>
        ) : (
          <Logo href="/" />
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {primaryNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        <div className="my-2 border-t border-sidebar-border" />

        {secondaryNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        <LogoutButton collapsed={collapsed} />
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 font-heading text-sm font-semibold text-primary">
              {org.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-sm font-semibold text-primary">
              {org.name?.[0]?.toUpperCase() ?? '?'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{org.name}</p>
              <p className="truncate text-xs text-muted-foreground">{org.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}