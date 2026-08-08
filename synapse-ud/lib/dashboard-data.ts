export type Verdict =
  | 'Likely Genuine'
  | 'Potential Greenwashing'
  | 'Needs Further Investigation'

export type EvidenceKind = 'supporting' | 'counter' | 'company'

export interface Company {
  id: string
  name: string
  industry: string
  ticker?: string
  esgRating: string
  lastAnalyzed: string
  saved?: boolean
}

export interface EvidenceItem {
  id: string
  kind: EvidenceKind
  source: string
  publication: string
  date: string
  snippet: string
  // Citation.score (synapse_core/pipeline.py's citations()) is always null
  // today — retrieval never populates it. Null here means "unknown", not
  // "0% match"; render accordingly.
  confidence: number | null
  url: string
}

export interface ComparisonRow {
  claim: string
  supporting: string
  counter: string
  assessment: string
}

export interface AnalysisResult {
  id: string
  companyId: string
  company: string
  topic: string
  verdict: Verdict
  confidence: number
  date: string
  summary: string[]
  keyFindings: string[]
  reasoning: {
    evidenceConsidered: string
    contradictions: string
    riskAssessment: string
    investmentImplications: string
  }
  comparison: ComparisonRow[]
  recommendation: string
  evidence: EvidenceItem[]
  bookmarked?: boolean
}

export interface HistoryEntry {
  id: string
  date: string
  company: string
  topic: string
  verdict: Verdict
  confidence: number
  bookmarked?: boolean
}

export interface SavedReport {
  id: string
  company: string
  topic: string
  savedDate: string
  confidence: number
  verdict: Verdict
}

export interface Invoice {
  id: string
  date: string
  amount: string
  status: 'Paid' | 'Pending' | 'Failed'
  plan: string
}


// Plan/billing fields here are still mock — there's no real subscription
// backend yet. Identity (name/email) is NOT read from here anymore; use
// useOrg() from '@/lib/org-context' for the signed-in org's real name/email.
export const organization = {
  plan: 'Professional',
  planPrice: '$499',
  renewalDate: 'March 14, 2026',
}

export const usage = {
  used: 12,
  limit: 50,
  companiesAnalyzed: 34,
  savedReports: 9,
  averageConfidence: 84,
}

export const companies: Company[] = [
  { id: 'tesla', name: 'Tesla', ticker: 'TSLA', industry: 'Automotive', esgRating: 'BB', lastAnalyzed: 'Feb 2, 2026', saved: true },
  { id: 'apple', name: 'Apple', ticker: 'AAPL', industry: 'Technology', esgRating: 'A', lastAnalyzed: 'Jan 28, 2026', saved: true },
  { id: 'microsoft', name: 'Microsoft', ticker: 'MSFT', industry: 'Technology', esgRating: 'AA', lastAnalyzed: 'Jan 22, 2026', saved: true },
  { id: 'shell', name: 'Shell', ticker: 'SHEL', industry: 'Energy', esgRating: 'CCC', lastAnalyzed: 'Feb 5, 2026', saved: true },
  { id: 'bp', name: 'BP', ticker: 'BP', industry: 'Energy', esgRating: 'B', lastAnalyzed: 'Feb 4, 2026' },
  { id: 'amazon', name: 'Amazon', ticker: 'AMZN', industry: 'E-Commerce', esgRating: 'BBB', lastAnalyzed: 'Jan 30, 2026' },
  { id: 'google', name: 'Google', ticker: 'GOOGL', industry: 'Technology', esgRating: 'A', lastAnalyzed: 'Jan 19, 2026' },
  { id: 'nestle', name: 'Nestlé', ticker: 'NSRGY', industry: 'Consumer Goods', esgRating: 'BB', lastAnalyzed: 'Feb 1, 2026' },
]

export const companyNames = companies.map((c) => c.name)

function ev(
  id: string,
  kind: EvidenceKind,
  source: string,
  publication: string,
  date: string,
  snippet: string,
  confidence: number,
  url: string,
): EvidenceItem {
  return { id, kind, source, publication, date, snippet, confidence, url }
}



// Map raw API greenwashing_status values (see synapse_core/prompt.py's
// "<Greenwashing | NotGreenwashing>" field) to the badge's Verdict union.
// Only the full analysis detail (GET /analyses/{id}, /analyses/by-query) has
// greenwashing_status — use this on the results page.
export function toVerdict(status: string | null): Verdict {
  switch (status) {
    case 'Greenwashing':
      return 'Potential Greenwashing'
    case 'NotGreenwashing':
    case 'Not Greenwashing':
    case 'Genuine':
      return 'Likely Genuine'
    case 'Uncertain':
    case 'Inconclusive':
      return 'Needs Further Investigation'
    default:
      return 'Needs Further Investigation' // safe fallback for unknown/null status
  }
}

// List views — GET /dashboard/summary's recent_analyses and GET /analyses'
// items — only carry `judgment`, not the full `greenwashing_status` (that's
// only on the stored AnalyzeResponse's detail view). Derive a Verdict from
// judgment instead, mirroring the correlation in synapse_core/prompt.py's
// worked examples: "Credible" pairs with a genuine claim, "False"/
// "Misleading" with greenwashing, "Unsupported" with a call that needs more
// evidence rather than a hard genuine/greenwashing verdict.
export function toVerdictFromJudgment(judgment: string | null): Verdict {
  switch (judgment) {
    case 'Credible':
      return 'Likely Genuine'
    case 'False':
    case 'Misleading':
      return 'Potential Greenwashing'
    case 'Unsupported':
    default:
      return 'Needs Further Investigation'
  }
}

// Backend confidence is a 0.0-1.0 float (or null if the LLM never returned
// one and there's no judgment to fall back to — see app/routers/analyze.py).
// UI components expect a 0-100 number; render "—" rather than "0%" when null.
export function formatConfidence(confidence: number | null): string {
  return confidence == null ? '—' : `${Math.round(confidence * 100)}%`
}

const sharedEvidence: EvidenceItem[] = [
  ev('e1', 'supporting', 'Corporate Sustainability Report 2025', 'Company Disclosure', 'Nov 2025', 'The company reports a 42% reduction in Scope 1 and 2 emissions since 2019, verified by an independent third-party auditor.', 91, 'https://example.com/reports/sustainability-2025'),
  ev('e2', 'supporting', 'CDP Climate Disclosure', 'CDP', 'Oct 2025', 'Received an A- leadership score for climate transparency and target-setting, ranking above sector median.', 84, 'https://example.com/cdp/climate-2025'),
  ev('e3', 'supporting', 'SBTi Target Validation', 'Science Based Targets initiative', 'Sep 2025', 'Near-term emissions reduction targets were formally validated as consistent with a 1.5°C pathway.', 88, 'https://example.com/sbti/validation'),
  ev('e4', 'counter', 'Investigative Report: Offset Quality', 'Reuters', 'Dec 2025', 'Roughly 30% of the carbon offsets counted toward net-zero claims come from projects with contested additionality.', 76, 'https://example.com/news/offset-quality'),
  ev('e5', 'counter', 'NGO Analysis of Scope 3', 'Climate Watchdog', 'Nov 2025', 'Scope 3 emissions, which represent the majority of the footprint, are excluded from headline reduction figures.', 82, 'https://example.com/ngo/scope3-analysis'),
  ev('e6', 'counter', 'Regulatory Filing Discrepancy', 'SEC EDGAR', 'Aug 2025', 'Emissions figures in investor filings differ modestly from those in the public sustainability report.', 68, 'https://example.com/sec/filing'),
  ev('e7', 'company', 'Annual Report 2025', 'Company Disclosure', 'Jan 2026', 'Management reaffirms commitment to net-zero operations by 2040 with interim milestones every five years.', 90, 'https://example.com/reports/annual-2025'),
  ev('e8', 'company', 'Investor ESG Briefing', 'Company Disclosure', 'Dec 2025', 'Capital allocation slide shows 28% of 2026 capex directed toward low-carbon initiatives.', 79, 'https://example.com/reports/investor-briefing'),
]

export const analysisResults: AnalysisResult[] = [
  {
    id: 'a-tesla-carbon',
    companyId: 'tesla',
    company: 'Tesla',
    topic: 'Carbon Emissions',
    verdict: 'Likely Genuine',
    confidence: 89,
    date: 'Feb 2, 2026',
    summary: [
      'Tesla\u2019s carbon-related disclosures are broadly consistent with independent evidence. Verified reductions in operational emissions, validated science-based targets, and transparent methodology indicate a credible decarbonization program rather than superficial marketing.',
      'The primary area of caution concerns the treatment of Scope 3 emissions and reliance on a subset of carbon offsets with contested additionality. These do not undermine the core claim but warrant monitoring for investors weighting long-horizon climate risk.',
    ],
    keyFindings: [
      'Operational (Scope 1 and 2) emissions reductions are third-party verified.',
      'Near-term targets are validated by the Science Based Targets initiative.',
      'A minority of offsets rely on projects with questionable additionality.',
      'Scope 3 disclosure lags the quality of Scope 1 and 2 reporting.',
    ],
    reasoning: {
      evidenceConsidered: 'We reviewed the 2025 sustainability report, CDP disclosure, SBTi validation letter, regulatory filings, and independent journalism. Supporting evidence was weighted higher where it was externally audited or validated by a recognized standards body.',
      contradictions: 'A modest discrepancy exists between emissions figures reported in investor filings and the public sustainability report. Independent reporting also flags offset-quality concerns that the company\u2019s own materials do not fully address.',
      riskAssessment: 'Residual ESG risk is moderate and concentrated in Scope 3 and offset dependence. There is limited evidence of intentional misrepresentation, reducing the likelihood of a greenwashing enforcement event.',
      investmentImplications: 'The disclosure quality supports inclusion in climate-aligned portfolios, with a recommendation to monitor Scope 3 progress and offset composition at each reporting cycle.',
    },
    comparison: [
      { claim: '42% reduction in operational emissions', supporting: 'Third-party audited sustainability report', counter: 'Excludes majority Scope 3 footprint', assessment: 'Substantiated for stated scope' },
      { claim: 'On track for net-zero by 2040', supporting: 'SBTi-validated near-term targets', counter: 'Long-dated with limited interim enforcement', assessment: 'Credible but unverified long-term' },
      { claim: 'High-quality carbon offsets', supporting: 'Disclosed offset registry references', counter: 'Reuters flags contested additionality', assessment: 'Partially substantiated' },
    ],
    recommendation: 'The claim is assessed as Likely Genuine with 89% confidence. The decarbonization narrative is evidence-grounded and largely verifiable. We recommend maintaining exposure while tracking Scope 3 disclosure quality and offset composition as the primary forward-looking risk indicators.',
    evidence: sharedEvidence,
    bookmarked: true,
  },
  {
    id: 'a-shell-netzero',
    companyId: 'shell',
    company: 'Shell',
    topic: 'Net Zero',
    verdict: 'Potential Greenwashing',
    confidence: 74,
    date: 'Feb 5, 2026',
    summary: [
      'Shell\u2019s net-zero messaging materially outpaces the evidence in its own disclosures. Headline commitments are undercut by continued expansion of fossil fuel production and heavy reliance on future offsets and unproven technology.',
      'While some operational improvements are genuine, the gap between marketed ambition and capital allocation elevates the risk that net-zero claims function as reputational positioning rather than a funded transition plan.',
    ],
    keyFindings: [
      'Capital expenditure remains predominantly allocated to hydrocarbons.',
      'Net-zero pathway leans heavily on offsets and future carbon capture.',
      'Interim targets were revised downward relative to prior guidance.',
      'Scope 3 emissions dominate the footprint and lack firm reduction commitments.',
    ],
    reasoning: {
      evidenceConsidered: 'We evaluated the energy transition strategy, capital allocation disclosures, regulatory filings, and independent NGO and media analysis. Marketing language was compared directly against funded commitments.',
      contradictions: 'Public net-zero commitments conflict with disclosed production growth and a capex mix weighted toward fossil fuels. Interim targets were softened while headline ambition was maintained.',
      riskAssessment: 'ESG and regulatory risk is elevated. Several jurisdictions are increasing scrutiny of net-zero advertising claims, raising the probability of enforcement or reputational events.',
      investmentImplications: 'The mismatch warrants caution for climate-aligned mandates. Engagement or exclusion may be appropriate depending on mandate strictness and transition-credibility thresholds.',
    },
    comparison: [
      { claim: 'Committed to net-zero by 2050', supporting: 'Published transition strategy', counter: 'Capex still fossil-fuel weighted', assessment: 'Weakly substantiated' },
      { claim: 'Investing heavily in renewables', supporting: 'Renewable project announcements', counter: 'Minority share of total capex', assessment: 'Overstated' },
      { claim: 'Reducing absolute emissions', supporting: 'Some operational efficiency gains', counter: 'Scope 3 growth offsets progress', assessment: 'Not substantiated at group level' },
    ],
    recommendation: 'The claim is assessed as Potential Greenwashing with 74% confidence. The ambition-to-action gap is significant and concentrated in capital allocation. We recommend heightened scrutiny, active engagement on Scope 3 commitments, and caution before treating net-zero messaging as decision-grade.',
    evidence: sharedEvidence.map((e) => ({ ...e, id: 's-' + e.id })),
  },
  {
    id: 'a-amazon-renewable',
    companyId: 'amazon',
    company: 'Amazon',
    topic: 'Renewable Energy',
    verdict: 'Needs Further Investigation',
    confidence: 61,
    date: 'Jan 30, 2026',
    summary: [
      'Amazon\u2019s renewable energy claims are partially supported but rely on accounting conventions that make independent verification difficult. Renewable procurement is substantial, yet the link between purchased certificates and actual grid decarbonization is unclear.',
      'The evidence is mixed rather than contradictory. Additional disclosure on hourly matching and regional sourcing would be required to move the assessment in either direction.',
    ],
    keyFindings: [
      'Large-scale renewable power purchase agreements are documented.',
      'Reliance on unbundled certificates complicates impact verification.',
      'Regional and temporal matching data is not fully disclosed.',
      'Data-center load growth may outpace renewable additions.',
    ],
    reasoning: {
      evidenceConsidered: 'We reviewed procurement disclosures, third-party energy analyses, and regulatory filings. Weighting favored data that could tie renewable claims to verifiable grid outcomes.',
      contradictions: 'No direct contradiction was found, but material information gaps prevent a confident verdict. Aggregate renewable figures may mask regional shortfalls.',
      riskAssessment: 'Risk is indeterminate pending disclosure. The primary concern is optimistic accounting rather than evidence of misrepresentation.',
      investmentImplications: 'Insufficient basis for a definitive rating. We recommend targeted engagement to obtain hourly-matching and regional sourcing data before adjusting exposure.',
    },
    comparison: [
      { claim: '100% renewable electricity', supporting: 'Documented PPAs at scale', counter: 'Relies on unbundled certificates', assessment: 'Unverifiable as stated' },
      { claim: 'Powering operations sustainably', supporting: 'Renewable capacity additions', counter: 'Load growth may outpace supply', assessment: 'Incomplete evidence' },
    ],
    recommendation: 'The claim is assessed as Needs Further Investigation with 61% confidence. The renewable program is real but the impact is not yet independently verifiable. We recommend engagement to secure granular sourcing data before drawing an investment conclusion.',
    evidence: sharedEvidence.map((e) => ({ ...e, id: 'am-' + e.id })),
  },
]

export function getAnalysis(company: string, topic: string): AnalysisResult {
  const match = analysisResults.find(
    (r) => r.company.toLowerCase() === company.toLowerCase() && r.topic.toLowerCase() === topic.toLowerCase(),
  )
  if (match) return match
  const base = analysisResults[0]
  return { ...base, company, topic, id: `a-${company}-${topic}`.toLowerCase().replace(/\s+/g, '-') }
}

export const history: HistoryEntry[] = [
  { id: 'h1', date: 'Feb 5, 2026', company: 'Shell', topic: 'Net Zero', verdict: 'Potential Greenwashing', confidence: 74 },
  { id: 'h2', date: 'Feb 4, 2026', company: 'BP', topic: 'Climate', verdict: 'Potential Greenwashing', confidence: 71 },
  { id: 'h3', date: 'Feb 2, 2026', company: 'Tesla', topic: 'Carbon Emissions', verdict: 'Likely Genuine', confidence: 89, bookmarked: true },
  { id: 'h4', date: 'Jan 30, 2026', company: 'Amazon', topic: 'Renewable Energy', verdict: 'Needs Further Investigation', confidence: 61 },
  { id: 'h5', date: 'Jan 28, 2026', company: 'Apple', topic: 'Supply Chain', verdict: 'Likely Genuine', confidence: 86, bookmarked: true },
  { id: 'h6', date: 'Jan 22, 2026', company: 'Microsoft', topic: 'Carbon Emissions', verdict: 'Likely Genuine', confidence: 92 },
  { id: 'h7', date: 'Jan 19, 2026', company: 'Google', topic: 'Water', verdict: 'Needs Further Investigation', confidence: 64 },
  { id: 'h8', date: 'Jan 15, 2026', company: 'Nestlé', topic: 'Labor Practices', verdict: 'Potential Greenwashing', confidence: 69 },
]

export const savedReports: SavedReport[] = [
  { id: 'r1', company: 'Tesla', topic: 'Carbon Emissions', savedDate: 'Feb 2, 2026', confidence: 89, verdict: 'Likely Genuine' },
  { id: 'r2', company: 'Apple', topic: 'Supply Chain', savedDate: 'Jan 28, 2026', confidence: 86, verdict: 'Likely Genuine' },
  { id: 'r3', company: 'Microsoft', topic: 'Carbon Emissions', savedDate: 'Jan 22, 2026', confidence: 92, verdict: 'Likely Genuine' },
  { id: 'r4', company: 'Shell', topic: 'Net Zero', savedDate: 'Feb 5, 2026', confidence: 74, verdict: 'Potential Greenwashing' },
  { id: 'r5', company: 'Amazon', topic: 'Renewable Energy', savedDate: 'Jan 30, 2026', confidence: 61, verdict: 'Needs Further Investigation' },
  { id: 'r6', company: 'Google', topic: 'Water', savedDate: 'Jan 19, 2026', confidence: 64, verdict: 'Needs Further Investigation' },
]

export const invoices: Invoice[] = [
  { id: 'INV-2026-002', date: 'Feb 14, 2026', amount: '$499.00', status: 'Paid', plan: 'Professional (Monthly)' },
  { id: 'INV-2026-001', date: 'Jan 14, 2026', amount: '$499.00', status: 'Paid', plan: 'Professional (Monthly)' },
  { id: 'INV-2025-012', date: 'Dec 14, 2025', amount: '$499.00', status: 'Paid', plan: 'Professional (Monthly)' },
  { id: 'INV-2025-011', date: 'Nov 14, 2025', amount: '$499.00', status: 'Paid', plan: 'Professional (Monthly)' },
]

export const notifications = [
  { id: 'n1', title: 'Shell analysis complete', detail: 'Net Zero \u2014 Potential Greenwashing', time: '10m ago', unread: true },
  { id: 'n2', title: 'Monthly usage at 24%', detail: '12 of 50 analyses used', time: '2h ago', unread: true },
  { id: 'n3', title: 'Invoice paid', detail: 'INV-2026-002 \u2014 $499.00', time: '1d ago', unread: false },
]
