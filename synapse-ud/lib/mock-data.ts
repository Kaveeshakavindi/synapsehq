export type PlanId = 'starter' | 'professional' | 'enterprise'

export type Plan = {
  id: PlanId
  name: string
  price: string
  period: string
  tagline: string
  features: string[]
  highlighted?: boolean
}

export const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$149',
    period: '/mo',
    tagline: 'For small teams getting started with ESG intelligence.',
    features: ['50 analyses / month', 'Basic reports', 'Email support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$499',
    period: '/mo',
    tagline: 'For growing analyst teams that need full evidence reports.',
    features: [
      '500 analyses / month',
      'Full evidence reports',
      'Team collaboration',
      'Saved reports',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    tagline: 'For institutions requiring scale, control, and integrations.',
    features: [
      'Unlimited analyses',
      'API access',
      'Multi-team management',
      'Dedicated support',
      'Custom integrations',
    ],
  },
]

export const services = [
  {
    icon: 'ShieldCheck',
    title: 'AI Greenwashing Detection',
    description: 'Detect misleading ESG claims using evidence-grounded reasoning.',
  },
  {
    icon: 'FileText',
    title: 'ESG Intelligence',
    description:
      'Analyze sustainability reports, media articles, and corporate disclosures.',
  },
  {
    icon: 'Database',
    title: 'Evidence Retrieval',
    description:
      'Every conclusion includes supporting evidence, counter-evidence, and explainable reasoning.',
  },
  {
    icon: 'Search',
    title: 'Contradiction Detection',
    description:
      'Find inconsistencies between company reports and external evidence.',
  },
  {
    icon: 'BarChart3',
    title: 'ESG Risk Monitoring',
    description: 'Track ESG-related developments across companies over time.',
  },
  {
    icon: 'Users',
    title: 'Enterprise Collaboration',
    description: 'Organization-wide access with shared analysis history.',
  },
] as const

export const howItWorks = [
  {
    step: 1,
    title: 'Select Company',
    description: 'Choose from thousands of tracked public and private companies.',
  },
  {
    step: 2,
    title: 'Choose ESG Topic',
    description: 'Pick a focus area like carbon emissions, labor, or governance.',
  },
  {
    step: 3,
    title: 'AI Analysis',
    description: 'Our models evaluate disclosures against external evidence.',
  },
  {
    step: 4,
    title: 'Evidence Retrieval',
    description: 'Supporting and contradicting sources are gathered and cited.',
  },
  {
    step: 5,
    title: 'Transparent Verdict',
    description: 'A clear verdict with confidence and full reasoning is produced.',
  },
  {
    step: 6,
    title: 'Investment Insight',
    description: 'Turn findings into evidence-grounded investment decisions.',
  },
]

export const faqs = [
  {
    question: 'How does company verification work?',
    answer:
      'When you sign up, we validate your organization using your company TIN and registered details. This protects the integrity of our enterprise network and ensures every account belongs to a legitimate organization.',
  },
  {
    question: 'How long does approval take?',
    answer:
      'TIN verification typically completes within 3 business days. You will receive an email at your registered company address the moment a decision is made.',
  },
  {
    question: 'What data sources are used?',
    answer:
      'SYNAPSE analyzes corporate sustainability reports, regulatory filings, verified news media, NGO reports, and structured ESG datasets. Every verdict cites the exact sources used.',
  },
  {
    question: 'How accurate are the analyses?',
    answer:
      'Every conclusion is evidence-grounded and includes supporting evidence, counter-evidence, and a confidence score. We prioritize transparent reasoning over black-box scores so your team can audit every decision.',
  },
  {
    question: 'How is payment handled?',
    answer:
      'Once your organization is verified, we email a secure payment link. Billing is handled through Stripe and can be managed at any time from your dashboard.',
  },
]

export const companyNames = [
  'Apple Inc.',
  'Microsoft Corporation',
  'Amazon.com Inc.',
  'Google (Alphabet Inc.)',
  'Tesla Inc.',
  'Meta Platforms Inc.',
  'Nvidia Corporation',
  'Berkshire Hathaway',
  'Oracle Corporation',
  'JPMorgan Chase & Co.',
  'Visa Inc.',
  'Walmart Inc.',
  'Coca-Cola Company',
  'Procter & Gamble',
  'Boeing Company',
  'Toyota Motor',
  'Shell PLC',
  'LVMH Moët Hennessy',
  'Nestlé SA',
  'Unilever PLC',
]

export const esgTopics = [
  'Carbon Emissions',
  'Climate',
  'Human Rights',
  'Governance',
  'Renewable Energy',
  'Supply Chain',
  'Net Zero',
  'Biodiversity',
  'Labor Practices',
  'Diversity',
  'Ethics',
  'Water',
  'Waste',
]
