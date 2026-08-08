import { createClient } from '@/lib/supabase/client'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// auth
export async function apiFetch(path: string, options: RequestInit = {}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`API error (${res.status}): ${errorBody}`)
  }
  // DELETE endpoints (unbookmark, delete analysis/org) return 204 with no
  // body — res.json() on an empty body throws, so short-circuit here.
  if (res.status === 204) {
    return null
  }
  return res.json()
}

// Triggers a browser download for endpoints that return a file attachment
// (GET /analyses/{id}/download, GET /subscription/invoices/{id}/download —
// both currently return HTML, not PDF; see backend decision notes) instead
// of JSON. Same auth pattern as apiFetch, but reads a blob and saves it via
// a throwaway <a download> instead of parsing JSON.
export async function downloadFile(path: string): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`API error (${res.status}): ${errorBody}`)
  }
  const disposition = res.headers.get('content-disposition') ?? ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] ?? 'download.html'
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export interface AnalyzeRequest {
  company: string
  topic: string
}

// Matches app/schemas/analysis.py AnalyzeResponse
export interface Citation {
  source: string | null
  content: string | null
  score: number | null
  metadata: Record<string, any> | null
}

export interface RawAnalyzeResponse {
  company_claim_summary?: string | null
  object_property?: string | null
  judgment?: string | null
  summary_counter_evidence?: string | null
  greenwashing_status?: string | null
  reason_for_judgement?: string[]
  summary_support_evidence?: string | null
  retrieved_documents?: {
    company_reports?: Citation[]
    counterfactual_sources?: Citation[]
    supportive_sources?: Citation[]
  }
  error?: string | null
  raw_content?: string | null
}

export class AnalyzeError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AnalyzeError'
    this.status = status
  }
}

// lib/api.ts
export interface AnalyzeResponse {
  company_claim_summary: string | null
  object_property: string | null
  judgment: string | null
  summary_counter_evidence: string | null
  greenwashing_status: string | null
  reason_for_judgement: string[]
  summary_support_evidence: string | null
  retrieved_documents: {
    company_reports: Citation[]
    counterfactual_sources: Citation[]
    supportive_sources: Citation[]
  }
  error: string | null
  raw_content: string | null
}

function normalizeAnalyzeResponse(raw: RawAnalyzeResponse): AnalyzeResponse {
  return {
    company_claim_summary: raw.company_claim_summary ?? null,
    object_property: raw.object_property ?? null,
    judgment: raw.judgment ?? null,
    summary_counter_evidence: raw.summary_counter_evidence ?? null,
    greenwashing_status: raw.greenwashing_status ?? null,
    reason_for_judgement: raw.reason_for_judgement ?? [],
    summary_support_evidence: raw.summary_support_evidence ?? null,
    retrieved_documents: {
      company_reports: raw.retrieved_documents?.company_reports ?? [],
      counterfactual_sources: raw.retrieved_documents?.counterfactual_sources ?? [],
      supportive_sources: raw.retrieved_documents?.supportive_sources ?? [],
    },
    error: raw.error ?? null,
    raw_content: raw.raw_content ?? null,
  }
}

export async function analyzeClaim(payload: AnalyzeRequest, token: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new AnalyzeError(body.detail ?? `Request failed with status ${response.status}`, response.status)
  }
  const raw: RawAnalyzeResponse = await response.json()
  return normalizeAnalyzeResponse(raw)
}

// Matches app/schemas/company.py's CompanyOptions.
export interface CompanyOption {
  name: string
  topics: string[]
  // Data gap: source CSV has no ticker/industry columns, so the backend
  // always returns these as null today. Render conditionally, don't show
  // "null".
  ticker: string | null
  industry: string | null
}

// Backs the Analyze page's company/topic dropdowns and the Companies
// directory. Reference data (not user data), so no auth token required —
// matches GET /companies on the backend, which isn't gated by
// get_current_user either.
export async function getCompanyOptions(): Promise<CompanyOption[]> {
  const response = await fetch(`${API_BASE_URL}/companies`)
  if (!response.ok) {
    const body = await response.text()
    throw new AnalyzeError(`Failed to load companies (${response.status}): ${body}`, response.status)
  }
  return response.json()
}

// ─────────────────────────────────────────────────────────────────────────
// Dashboard summary — GET /dashboard/summary
// ─────────────────────────────────────────────────────────────────────────

export interface RecentAnalysis {
  id: string
  company: string
  topic: string
  judgment: string | null
  confidence: number | null
  created_at: string
}

export interface DashboardSummary {
  analyses_count: number
  companies_analyzed_count: number
  saved_reports_count: number
  avg_confidence: number | null
  recent_analyses: RecentAnalysis[]
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch('/dashboard/summary')
}

// ─────────────────────────────────────────────────────────────────────────
// Analyses — GET/DELETE /analyses, bookmark, download, share
// ─────────────────────────────────────────────────────────────────────────

export interface AnalysisListItem {
  id: string
  company: string
  topic: string
  judgment: string | null
  confidence: number | null
  created_at: string
  bookmarked: boolean
}

export interface AnalysisListResponse {
  items: AnalysisListItem[]
  total: number
  page: number
  page_size: number
}

export interface AnalysisListParams {
  search?: string
  company?: string
  verdict?: string // matches `judgment` server-side, not the display Verdict label
  sort?: string
  page?: number
  page_size?: number
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export async function listAnalyses(params: AnalysisListParams = {}): Promise<AnalysisListResponse> {
  return apiFetch(`/analyses${buildQuery({ ...params })}`)
}

export interface AnalysisDetail {
  id: string
  company: string
  topic: string
  company_claim_summary: string | null
  object_property: string | null
  judgment: string | null
  summary_counter_evidence: string | null
  greenwashing_status: string | null
  reason_for_judgement: string[]
  summary_support_evidence: string | null
  retrieved_documents: {
    company_reports: Citation[]
    counterfactual_sources: Citation[]
    supportive_sources: Citation[]
  }
  error: string | null
  raw_content: string | null
  confidence: number | null
  created_at: string
  bookmarked: boolean
  key_findings: string[]
  // Always null today — not part of the LLM's output schema yet. Hide the
  // UI section rather than rendering an empty callout.
  recommendation: string | null
}

export async function getAnalysisById(id: string): Promise<AnalysisDetail> {
  return apiFetch(`/analyses/${id}`)
}

export async function getAnalysisByQuery(company: string, topic: string): Promise<AnalysisDetail> {
  return apiFetch(`/analyses/by-query${buildQuery({ company, topic })}`)
}

export async function deleteAnalysis(id: string): Promise<void> {
  await apiFetch(`/analyses/${id}`, { method: 'DELETE' })
}

export async function bookmarkAnalysis(id: string): Promise<void> {
  await apiFetch(`/analyses/${id}/bookmark`, { method: 'POST' })
}

export async function unbookmarkAnalysis(id: string): Promise<void> {
  await apiFetch(`/analyses/${id}/bookmark`, { method: 'DELETE' })
}

export async function downloadAnalysis(id: string): Promise<void> {
  await downloadFile(`/analyses/${id}/download`)
}

export interface ShareResponse {
  share_url: string
  expires_at: string
}

export async function shareAnalysis(id: string): Promise<ShareResponse> {
  return apiFetch(`/analyses/${id}/share`, { method: 'POST' })
}

// ─────────────────────────────────────────────────────────────────────────
// Reports — GET /reports (bookmarked analyses only)
// ─────────────────────────────────────────────────────────────────────────

export async function listReports(search?: string): Promise<AnalysisListResponse> {
  return apiFetch(`/reports${buildQuery({ search })}`)
}

// ─────────────────────────────────────────────────────────────────────────
// Subscription / billing — fully simulated backend, no real processor
// ─────────────────────────────────────────────────────────────────────────

export interface SubscriptionUsage {
  analyses_used: number
  analyses_limit: number
  queries_remaining: number
  reports_saved: number
}

export interface SubscriptionOut {
  plan: string
  status: string
  renewal_date: string | null
  usage: SubscriptionUsage
}

export async function getSubscription(): Promise<SubscriptionOut> {
  return apiFetch('/subscription')
}

export interface InvoiceOut {
  id: string
  date: string
  plan: string
  amount: number
  status: string
  download_url: string
}

export async function listInvoices(): Promise<InvoiceOut[]> {
  return apiFetch('/subscription/invoices')
}

export async function downloadInvoice(id: string): Promise<void> {
  await downloadFile(`/subscription/invoices/${id}/download`)
}

export interface CheckoutResponse {
  plan: string
  status: string
  renewal_date: string | null
}

// No card fields — billing is simulated server-side (see backend decision
// notes). Never send raw card data to any endpoint.
export async function checkout(plan: string): Promise<CheckoutResponse> {
  return apiFetch('/checkout', { method: 'POST', body: JSON.stringify({ plan }) })
}

export async function upgradeSubscription(plan: string): Promise<CheckoutResponse> {
  return apiFetch('/subscription/upgrade', { method: 'POST', body: JSON.stringify({ plan }) })
}

export async function cancelSubscription(): Promise<CheckoutResponse> {
  return apiFetch('/subscription/cancel', { method: 'POST' })
}

// ─────────────────────────────────────────────────────────────────────────
// Support tickets — DB-only on the backend, no email is sent
// ─────────────────────────────────────────────────────────────────────────

export interface SupportTicketOut {
  id: string
  email: string
  subject: string
  status: string
}

export async function createSupportTicket(payload: {
  email: string
  subject: string
  message: string
}): Promise<SupportTicketOut> {
  return apiFetch('/support/tickets', { method: 'POST', body: JSON.stringify(payload) })
}

// ─────────────────────────────────────────────────────────────────────────
// Organization settings
// ─────────────────────────────────────────────────────────────────────────

export interface OrganizationOut {
  id: string
  user_id: string
  name: string
  tin: string
  status: string
}

export async function updateOrganization(id: string, payload: { name?: string }): Promise<OrganizationOut> {
  return apiFetch(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteOrganization(id: string): Promise<void> {
  await apiFetch(`/organizations/${id}`, { method: 'DELETE' })
}

export interface NotificationPreferences {
  analysis_complete: boolean
  weekly_digest: boolean
  usage_alerts: boolean
  team_updates: boolean
}

export async function getNotificationPreferences(orgId: string): Promise<NotificationPreferences> {
  return apiFetch(`/organizations/${orgId}/notifications`)
}

export async function updateNotificationPreferences(
  orgId: string,
  prefs: NotificationPreferences,
): Promise<NotificationPreferences> {
  return apiFetch(`/organizations/${orgId}/notifications`, {
    method: 'PUT',
    body: JSON.stringify(prefs),
  })
}