'use client'

import { useState } from 'react'
import { ChevronDown, Mail, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOrg } from '@/lib/org-context'
import { createSupportTicket } from '@/lib/api'

const faqs = [
  {
    question: 'What data sources does SYNAPSE analyze?',
    answer:
      'SYNAPSE analyzes corporate sustainability reports, regulatory filings, verified news media, NGO reports, and structured ESG datasets. Every verdict cites the exact sources used in the analysis.',
  },
  {
    question: 'How accurate are the analyses?',
    answer:
      'Every conclusion is evidence-grounded and includes supporting evidence, counter-evidence, and a confidence score. We prioritize transparent reasoning over black-box scores so your team can audit every decision.',
  },
  {
    question: 'Can I download reports as PDF?',
    answer:
      'Yes, all reports can be exported as PDF documents. Use the download button on any analysis results page to save a formatted report for sharing or archival.',
  },
  {
    question: 'How often are company datasets updated?',
    answer:
      'Our company database and ESG datasets are updated daily. Most publicly available information about companies is available for analysis within 24 hours of publication.',
  },
  {
    question: 'What is the difference between verdicts?',
    answer:
      'Likely Genuine means claims are well-substantiated. Potential Greenwashing indicates claims exceed available evidence. Needs Further Investigation means more data is required for a confident verdict.',
  },
  {
    question: 'Can I share analyses with my team?',
    answer:
      'Yes, with the Professional plan and above, all team members have access to shared analysis history and reports. You can also download individual analyses to share externally.',
  },
  {
    question: 'Is there an API for programmatic access?',
    answer:
      'Yes, Enterprise plan customers have access to our API. You can manage API keys in the Settings page to enable programmatic analysis and data retrieval.',
  },
  {
    question: 'What happens if I reach my monthly analysis limit?',
    answer:
      'Your account will show a usage warning when approaching the limit. Once reached, you can still view past analyses but cannot run new ones until your plan renews or you upgrade.',
  },
]

export default function HelpPage() {
  const org = useOrg()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [formData, setFormData] = useState({ email: org.email, subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketError, setTicketError] = useState('')

  async function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setTicketError('')
    try {
      await createSupportTicket(formData)
      setSubmitted(true)
      setFormData({ email: org.email, subject: '', message: '' })
    } catch (err) {
      setTicketError(err instanceof Error ? err.message : 'Failed to submit ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-12 p-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Help & Support</h1>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions or contact our support team.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
          <h3 className="font-semibold text-foreground mb-2">Documentation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Read our comprehensive guides and tutorials.
          </p>
          <Button variant="outline" size="sm">
            View Docs
          </Button>
        </Card>

        <Card className="p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
          <h3 className="font-semibold text-foreground mb-2">API Reference</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Explore our API documentation and examples.
          </p>
          <Button variant="outline" size="sm">
            View API
          </Button>
        </Card>

        <Card className="p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
          <h3 className="font-semibold text-foreground mb-2">Status Page</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Check our system status and incidents.
          </p>
          <Button variant="outline" size="sm">
            Check Status
          </Button>
        </Card>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <button
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="w-full text-left"
            >
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <ChevronDown
                  className={`size-5 shrink-0 text-muted-foreground transition-transform mt-0.5 ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {faq.question}
                  </h3>
                  {openFaq === idx && (
                    <p className="mt-3 text-sm leading-relaxed text-foreground">
                      {faq.answer}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Submit a Support Ticket
        </h2>
        <Card className="p-8">
          {submitted && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
              <CheckCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                We received your ticket. Our team will follow up by email — there&apos;s no
                automated confirmation email for this yet.
              </span>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmitTicket}>
            <div>
              <Label htmlFor="email" className="mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                required
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="subject" className="mb-2">
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="What can we help you with?"
                value={formData.subject}
                required
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="message" className="mb-2">
                Message
              </Label>
              <textarea
                id="message"
                rows={6}
                placeholder="Please describe your issue in detail..."
                value={formData.message}
                required
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {ticketError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {ticketError}
              </p>
            )}

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={submitting}>
                <Send className="size-4" />
                {submitting ? 'Sending...' : 'Send Ticket'}
              </Button>
              <Button type="button" variant="outline" className="flex-1">
                <Mail className="size-4" />
                Email Support
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Additional Support */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold text-foreground mb-2">
          Need immediate assistance?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Our support team is available Monday-Friday, 9 AM - 6 PM ET.
        </p>
        <div className="flex gap-3">
          <Button variant="default" size="sm">
            Chat with Support
          </Button>
          <Button variant="outline" size="sm">
            Schedule Call
          </Button>
        </div>
      </Card>
    </div>
  )
}
