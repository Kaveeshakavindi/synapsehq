import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BadgeCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>

          <h1 className="mt-6 text-pretty font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Make Smart Investment Decisions
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Use evidence-grounded AI to detect greenwashing, validate ESG claims,
            and analyze sustainability disclosures with transparent reasoning and
            verifiable evidence.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-6 text-base')}
            >
              Sign Up
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#pricing"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'h-11 px-6 text-base',
              )}
            >
              View Plans
            </Link>
          </div>

          <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">
            Trusted by investment analysts, sustainability teams, financial
            institutions, and enterprise organizations.
          </p>
        </div>

        <div className="relative">
          <div >
            <Image
              src="/hero.png"
              alt="SYNAPSE dashboard showing an ESG greenwashing verdict with supporting evidence and confidence score"
              width={1200}
              height={900}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
