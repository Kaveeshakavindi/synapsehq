'use client'

import { useState } from 'react'
import { EvidenceCard } from './evidence-card'
import type { EvidenceItem } from '@/lib/dashboard-data'

interface EvidencePanelProps {
  evidence: EvidenceItem[]
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const [activeTab, setActiveTab] = useState<'supporting' | 'counter' | 'company'>('supporting')

  const supporting = evidence.filter((e) => e.kind === 'supporting')
  const counter = evidence.filter((e) => e.kind === 'counter')
  const company = evidence.filter((e) => e.kind === 'company')

  const tabData = {
    supporting: { label: 'Supporting', items: supporting },
    counter: { label: 'Counter', items: counter },
    company: { label: 'Company Reports', items: company },
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border">
      <div className="sticky top-0 border-b border-border bg-card rounded-t-lg">
        <div className="flex gap-1 p-4">
          {Object.entries(tabData).map(([key, tab]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-60">({tab.items.length})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {tabData[activeTab].items.length > 0 ? (
            tabData[activeTab].items.map((item) => (
              <EvidenceCard key={item.id} evidence={item} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No {tabData[activeTab].label.toLowerCase()} evidence
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
