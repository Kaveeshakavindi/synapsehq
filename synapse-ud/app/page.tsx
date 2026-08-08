import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { Hero } from '@/components/marketing/hero'
import { Services } from '@/components/marketing/services'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { Pricing } from '@/components/marketing/pricing'
import { Faq } from '@/components/marketing/faq'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Services />
        <HowItWorks />
        <Pricing />
        <Faq />

        <section className="border-t border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-12">
              <h2 className="mx-auto max-w-2xl text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Bring evidence-grounded ESG intelligence to your team
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Verify your organization today and start analyzing greenwashing risk
                with full transparency.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-6 text-base')}
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
