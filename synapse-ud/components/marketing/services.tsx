import {
  ShieldCheck,
  FileText,
  Database,
  Search,
  BarChart3,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { services } from '@/lib/mock-data'

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck,
  FileText,
  Database,
  Search,
  BarChart3,
  Users,
}

export function Services() {
  return (
    <section id="features" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Capabilities
          </p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to interrogate ESG claims
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            A complete intelligence layer that turns disclosures and external
            evidence into defensible, auditable conclusions.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = iconMap[service.icon]
            return (
              <div
                key={service.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-[0_12px_40px_-16px_rgba(20,22,27,0.16)]"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
