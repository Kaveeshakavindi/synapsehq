'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsSection } from '@/components/dashboard/settings-section'
import { useOrg } from '@/lib/org-context'
import { createClient } from '@/lib/supabase/client'
import {
  getSubscription,
  getNotificationPreferences,
  updateNotificationPreferences,
  updateOrganization,
  deleteOrganization,
  type NotificationPreferences,
} from '@/lib/api'

const notificationFields: Array<{
  key: keyof NotificationPreferences
  label: string
  description: string
}> = [
  { key: 'analysis_complete', label: 'Analysis Complete', description: 'Notify me when an analysis is finished' },
  { key: 'weekly_digest', label: 'Weekly Digest', description: 'Receive a weekly summary of your activity' },
  { key: 'usage_alerts', label: 'Usage Alerts', description: 'Alert me when approaching usage limits' },
  { key: 'team_updates', label: 'Team Updates', description: 'Notify me of team member changes' },
]

export default function SettingsPage() {
  const org = useOrg()
  const router = useRouter()

  const [name, setName] = useState(org.name)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState('')

  const [plan, setPlan] = useState<string | null>(null)

  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null)
  const [notifError, setNotifError] = useState('')

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    getSubscription().then((s) => setPlan(s.plan)).catch(() => {})
    getNotificationPreferences(org.id).then(setNotifications).catch(() => {})
  }, [org.id])

  const handleSaveName = async () => {
    setNameSaving(true)
    setNameError('')
    try {
      await updateOrganization(org.id, { name })
      // Re-runs the server layout so the sidebar/header (both fed by
      // OrgProvider from a server-side fetch) pick up the new name too.
      router.refresh()
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Failed to update name.')
    } finally {
      setNameSaving(false)
    }
  }

  const handleToggleNotification = async (key: keyof NotificationPreferences) => {
    if (!notifications) return
    const next = { ...notifications, [key]: !notifications[key] }
    setNotifications(next) // optimistic
    setNotifError('')
    try {
      await updateNotificationPreferences(org.id, next)
    } catch (err) {
      setNotifications(notifications) // revert
      setNotifError(err instanceof Error ? err.message : 'Failed to save preference.')
    }
  }

  const handleDeleteOrganization = async () => {
    if (
      !window.confirm(
        'Delete your organization? Your account will lose access to the dashboard immediately. This cannot be undone from here.'
      )
    ) {
      return
    }
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteOrganization(org.id)
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete organization.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8 p-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-lg text-muted-foreground">
          Manage your organization and account settings.
        </p>
      </div>

      {/* Organization Information */}
      <SettingsSection
        title="Organization Information"
        description="Details about your organization."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="org-name" className="mb-2">
              Organization Name
            </Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="org-plan" className="mb-2">
              Current Plan
            </Label>
            <Input
              id="org-plan"
              value={plan ? plan[0].toUpperCase() + plan.slice(1) : 'Loading...'}
              readOnly
              className="bg-muted capitalize"
            />
          </div>
        </div>
        {nameError && <p className="text-sm text-destructive">{nameError}</p>}
        {name !== org.name && (
          <Button size="sm" disabled={nameSaving} onClick={handleSaveName}>
            {nameSaving ? 'Saving...' : 'Save Name'}
          </Button>
        )}
      </SettingsSection>

      {/* Password */}
      <SettingsSection
        title="Password"
        description="Change your account password."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="current-password" className="mb-2">
              Current Password
            </Label>
            <Input
              id="current-password"
              type="password"
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label htmlFor="new-password" className="mb-2">
              New Password
            </Label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="mb-2">
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
            />
          </div>
          <Button>Update Password</Button>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        title="Notifications"
        description="Control how you receive notifications."
      >
        <div className="space-y-4">
          {notifError && <p className="text-sm text-destructive">{notifError}</p>}
          {notificationFields.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={notifications ? notifications[item.key] : true}
                disabled={!notifications}
                onChange={() => handleToggleNotification(item.key)}
                className="size-4 rounded border border-border"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <Card className="border-destructive/20 p-6">
        <h3 className="text-lg font-semibold text-destructive mb-4">
          Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          These actions cannot be undone. Please proceed with caution.
        </p>
        {deleteError && <p className="text-sm text-destructive mb-4">{deleteError}</p>}
        <Button
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive/10"
          disabled={deleting}
          onClick={handleDeleteOrganization}
        >
          {deleting ? 'Deleting...' : 'Delete Organization'}
        </Button>
      </Card>
    </div>
  )
}
