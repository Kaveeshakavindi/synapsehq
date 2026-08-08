import Link from 'next/link'
import { Check } from 'lucide-react'
import { plans } from '@/lib/mock-data'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Plans for every team size
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Start with what you need today and scale as your analysis volume grows.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative flex h-full flex-col rounded-2xl border bg-card p-7',
                plan.highlighted
                  ? 'border-primary shadow-[0_20px_60px_-24px_rgba(0,0,0,0.3)] lg:-mt-4 lg:mb-4'
                  : 'border-border',
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-bold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {plan.tagline}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/signup?plan=${plan.id}`}
                className={cn(
                  buttonVariants({
                    variant: plan.highlighted ? 'default' : 'outline',
                    size: 'lg',
                  }),
                  'mt-8 h-11 w-full text-base',
                )}
              >
                Choose Plan
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
