'use client'

import { useEffect, useState } from 'react'
import { Bookmark, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { VerdictBadge } from '@/components/dashboard/verdict-badge'
import { analyzeClaim, getCompanyOptions, type CompanyOption } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { toVerdict } from '@/lib/dashboard-data'

const loadingMessages = [
  'Collecting company disclosures...',
  'Retrieving supporting evidence...',
  'Retrieving counter evidence...',
  'Evaluating contradictions...',
  'Building reasoning...',
  'Generating verdict...',
  'Preparing report...',
]

interface RetrievedDoc {
  source: string | null
  content: string | null
  score: number | null
  metadata: Record<string, any> | null
}

interface AnalysisResult {
  company_claim_summary: string | null
  object_property: string | null
  judgment: string | null
  summary_counter_evidence: string | null
  greenwashing_status: string | null
  reason_for_judgement: string[]
  summary_support_evidence: string | null
  retrieved_documents: {
    company_reports: RetrievedDoc[]
    counterfactual_sources: RetrievedDoc[]
    supportive_sources: RetrievedDoc[]
  }
  error: string | null
  raw_content: string | null
}

export default function AnalyzePage() {
  const [company, setCompany] = useState('')
  const [topic, setTopic] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState('')

  useEffect(() => {
    let cancelled = false
    setOptionsLoading(true)
    setOptionsError('')
    getCompanyOptions()
      .then((options) => {
        if (!cancelled) setCompanies(options)
      })
      .catch((err) => {
        if (!cancelled) {
          setOptionsError(err instanceof Error ? err.message : 'Failed to load companies.')
        }
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const companyNames = companies.map((c) => c.name)
  const availableTopics = companies.find((c) => c.name === company)?.topics ?? []

  const handleCompanyChange = (value: string) => {
    setCompany(value)
    setTopic('') // reset topic since old selection may not be valid for new company
  }

  const handleAnalyze = async () => {
    if (!company || !topic) return

    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token ?? null
    if (!token) {
      setError('You must be logged in to run an analysis.')
      return
    }

    setError('')
    setIsLoading(true)
    setCurrentMessage(0)
    setAnalysis(null)
    try {
      const result = await analyzeClaim({ company, topic }, token)
      if (result.error) {
        setError(result.error)
      } else {
        setAnalysis(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderEvidenceList = (docs: RetrievedDoc[]) => {
    const items = docs.filter((d) => d.source || d.content)
    if (items.length === 0) return null
    return (
      <div className="space-y-3">
        {items.map((doc, i) => (
          <Card key={i} className="p-4 border border-slate-200">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {doc.source ?? 'Unknown source'}
                  </p>
                  {doc.metadata?.publication && (
                    <p className="text-xs text-muted-foreground">
                      {doc.metadata.publication}
                    </p>
                  )}
                </div>
                {doc.score != null && (
                  <span className="text-xs bg-slate-100 text-foreground px-2 py-1 rounded">
                    {Math.round(doc.score * 100)}% match
                  </span>
                )}
              </div>
              {doc.content && (
                <p className="text-sm text-foreground">{doc.content}</p>
              )}
              {doc.source && (
                <Button variant="outline" size="sm" className="mt-2" >
                  <a href={doc.source} target="_blank" rel="noopener noreferrer">
                    Open Source
                  </a>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    // h-full collapses to the content's own height here (the parent <main> has
    // no fixed height of its own), so the right panel's overflow-y-auto never
    // actually clips — the whole document grows and scrolls instead, taking
    // the left form along with it. Anchor to the viewport, minus the sticky
    // h-16 dashboard header, so this row has a real fixed height and only the
    // right panel scrolls internally.
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel - Form */}
      <div className="w-2/5 border-r border-slate-200 p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Analyze Greenwashing</h1>
            <p className="text-sm text-muted-foreground">
              Evaluate ESG claims using evidence-grounded AI reasoning.
            </p>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-foreground mb-3">
              Company
            </label>
            <Select
              value={company}
              onValueChange={handleCompanyChange}
              disabled={isLoading || optionsLoading || !!optionsError}
            >
              <option value="">
                {optionsLoading ? 'Loading companies...' : 'Select a company...'}
              </option>
              {companyNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-foreground mb-3">
              ESG Topic
            </label>
            <Select
              value={topic}
              onValueChange={setTopic}
              disabled={isLoading || optionsLoading || !!optionsError || !company}
            >
              <option value="">
                {company ? 'Select a topic...' : 'Select a company first'}
              </option>
              {availableTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          {optionsError && (
            <p className="text-sm text-red-600">
              Couldn&apos;t load companies: {optionsError}
            </p>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={handleAnalyze}
            disabled={!company || !topic || isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>

      {/* Right Panel - Results or Empty State */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 border-2 border-slate-300 border-t-black rounded-full animate-spin mx-auto" />
              <p className="text-foreground font-medium">
                {loadingMessages[currentMessage]}
              </p>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{company}</h2>
                <p className="text-lg text-muted-foreground">{topic}</p>
                <VerdictBadge
                  verdict={toVerdict(analysis.greenwashing_status)}
                  size="lg"
                  className="mt-3"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" aria-label="Save">
                  <Bookmark className="size-5" />
                </Button>
                <Button variant="outline" size="icon" aria-label="Download">
                  <Download className="size-5" />
                </Button>
                <Button variant="outline" size="icon" aria-label="Share">
                  <Share2 className="size-5" />
                </Button>
              </div>
            </div>


            {/* Claim Summary */}
            {analysis.company_claim_summary && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Claim Summary</h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {analysis.company_claim_summary}
                </p>
              </div>
            )}

            {/* Reason */}
            {analysis.reason_for_judgement?.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Reason</h3>
                <div className="space-y-3 text-foreground leading-relaxed text-sm">
                  {analysis.reason_for_judgement.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Supporting Evidence */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Supporting Evidence</h3>
              {analysis.summary_support_evidence && (
                <p className="text-sm text-muted-foreground">
                  {analysis.summary_support_evidence}
                </p>
              )}
              {renderEvidenceList(analysis.retrieved_documents.supportive_sources)}
            </div>

            {/* Refuting Evidence */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Refuting Evidence</h3>
              {analysis.summary_counter_evidence && (
                <p className="text-sm text-muted-foreground">
                  {analysis.summary_counter_evidence}
                </p>
              )}
              {renderEvidenceList(analysis.retrieved_documents.counterfactual_sources)}
            </div>

            {/* Company Disclosure Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Company Disclosure Summary</h3>
              {renderEvidenceList(analysis.retrieved_documents.company_reports)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Analysis Result</h3>
              <p className="text-muted-foreground">
                Select a company and ESG topic, then click Analyze to begin.
              </p>
            </div>
          </div>
        )}
      </div>
    </div >
  )
}