"use client"

import { NeoHeader } from "@/components/neo/neo-header"
import { NeoHero } from "@/components/neo/neo-hero"
import { NeoFilters } from "@/components/neo/neo-filters"
import {
  NeoClaimsTable,
  useHomeFiltersState,
} from "@/components/neo/neo-claims-table"
import { useNeoStore } from "@/lib/neo-store"

export default function Page() {
  const [filters, setFilters] = useHomeFiltersState()
  const { claims } = useNeoStore()
  return (
    <div className="min-h-svh bg-neutral-100">
      <NeoHeader active="home" />
      <NeoHero />

      <main className="space-y-0 px-6 py-3">
        <NeoFilters filters={filters} onChange={setFilters} claims={claims} />
        <NeoClaimsTable filters={filters} />
      </main>
    </div>
  )
}
