"use client"

import { AftermarketHeader } from "@/components/aftermarket/aftermarket-header"
import { AftermarketHero } from "@/components/aftermarket/aftermarket-hero"
import { AftermarketFilters } from "@/components/aftermarket/aftermarket-filters"
import {
  AftermarketClaimsTable,
  useHomeFiltersState,
} from "@/components/aftermarket/aftermarket-claims-table"
import { useAftermarketStore } from "@/lib/aftermarket-store"

export default function Page() {
  const [filters, setFilters] = useHomeFiltersState()
  const { claims } = useAftermarketStore()
  return (
    <div className="min-h-svh bg-neutral-100">
      <AftermarketHeader active="home" />
      <AftermarketHero />

      <main className="space-y-0 px-6 py-3">
        <AftermarketFilters filters={filters} onChange={setFilters} claims={claims} />
        <AftermarketClaimsTable filters={filters} />
      </main>
    </div>
  )
}
