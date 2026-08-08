'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchInput } from '@/components/dashboard/search-input'
import { CompanyCardComponent } from '@/components/dashboard/company-card-component'
import { getCompanyOptions, type CompanyOption } from '@/lib/api'

export default function CompaniesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getCompanyOptions()
      .then((options) => {
        if (!cancelled) setCompanies(options)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load companies.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ticker/industry are always null right now (source data gap — see
  // CompanyOption), so search is scoped to name until that's closed.
  const filtered = companies.filter((company) =>
    company.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Companies</h1>
        <p className="text-lg text-muted-foreground">
          Browse tracked companies and analyze their ESG claims.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <SearchInput
          placeholder="Search by company name..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">Couldn&apos;t load companies: {error}</p>
      ) : (
        <>
          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {filtered.length} of {companies.length} companies
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((company) => (
                <CompanyCardComponent
                  key={company.name}
                  company={company}
                  onAnalyze={() => router.push('/dashboard/analyze')}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground mb-4">No companies found matching your search.</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
