import { howItWorks } from '@/lib/mock-data'

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            How it Works
          </p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From company name to investment insight
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Six transparent steps take you from a question to an evidence-backed
            verdict you can defend.
          </p>
        </div>

        <ol className="mt-12 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {howItWorks.map((item) => (
            <li key={item.step} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-background font-mono text-sm font-semibold text-primary">
                  {String(item.step).padStart(2, '0')}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
