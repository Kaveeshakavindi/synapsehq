'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SubscriptionCardProps {
  title: string
  value: string | React.ReactNode
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function SubscriptionCard({
  title,
  value,
  description,
  action,
}: SubscriptionCardProps) {
  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
      <p className="text-2xl font-bold text-foreground mb-2">{value}</p>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Card>
  )
}
