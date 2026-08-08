// lib/map-analysis.ts

import { RawAnalyzeResponse, Citation } from './api'

export interface UIAnalysis {
  company: string
  topic: string
  verdict?: string
  confidence?: number
  summary: string[]
  evidence: { source: string; publication: string; confidence: number; snippet: string }[]
  refutingEvidence: { source: string; publication: string; confidence: number; snippet: string }[]
  keyFindings: string[]
}

function citationToEvidence(c: Citation) {
  return {
    source: c.source ?? 'Unknown source',
    publication: (c.metadata?.publication as string) ?? '',
    confidence: c.score ? Math.round(c.score * 100) : 0,
    snippet: c.content ?? '',
  }
}

export function mapToUIAnalysis(
  raw: RawAnalyzeResponse,
  company: string,
  topic: string
): UIAnalysis {
  const supporting = raw.retrieved_documents?.supportive_sources ?? []
  const refuting = raw.retrieved_documents?.counterfactual_sources ?? []
  const companyDocs = raw.retrieved_documents?.company_reports ?? []

  return {
    company,
    topic,
    verdict: raw.verdict,
    confidence: raw.confidence,
    summary: raw.explanation ? raw.explanation.split('\n\n').filter(Boolean) : [],
    evidence: supporting.map(citationToEvidence),
    refutingEvidence: refuting.map(citationToEvidence),
    keyFindings: companyDocs.map((c) => c.content ?? '').filter(Boolean),
  }
}