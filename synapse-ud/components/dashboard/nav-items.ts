import {
  LayoutDashboard,
  Sparkles,
  Clock,
  Bookmark,
  Building2,
  CreditCard,
  Settings,
  HelpCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const primaryNav: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'New Analysis', href: '/dashboard/analyze', icon: Sparkles },
  { label: 'Analysis History', href: '/dashboard/history', icon: Clock },
  { label: 'Saved Reports', href: '/dashboard/reports', icon: Bookmark },
  { label: 'Companies', href: '/dashboard/companies', icon: Building2 },
]

export const secondaryNav: NavItem[] = [
  { label: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Help', href: '/dashboard/help', icon: HelpCircle },
]
