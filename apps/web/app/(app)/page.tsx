"use client"

import { useState } from "react"
import { CcrTopNav } from "@/components/aftermarket/ccr-top-nav"
import { CcrHero } from "@/components/aftermarket/ccr-hero"
import {
  CcrSidebar,
  type CcrSidebarKey,
} from "@/components/aftermarket/ccr-sidebar"
import { CcrWorkQueue } from "@/components/aftermarket/ccr-work-queue"

export default function Page() {
  const [sidebar, setSidebar] = useState<CcrSidebarKey>("queue")

  return (
    <div className="min-h-svh bg-neutral-100">
      <CcrTopNav active="home" />
      <CcrHero />

      <div className="flex items-stretch gap-3 px-4 py-3">
        <CcrSidebar active={sidebar} onSelect={setSidebar} />
        <main className="min-w-0 flex-1">
          <CcrWorkQueue />
        </main>
      </div>
    </div>
  )
}
