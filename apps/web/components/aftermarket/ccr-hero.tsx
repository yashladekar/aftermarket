"use client"

import Link from "next/link"
import { Download, Plus, RefreshCw } from "lucide-react"
import { useAftermarketSession } from "@/components/aftermarket/session-provider"

const primaryActions = [
  { label: "RAISE NEW COMMERCIAL CHANGE REQUEST", icon: Plus, href: "/create-ccr" },
  { label: "CREATE SUPPLIER SPEND FORECAST", icon: Plus, href: "/mandate-request" },
  { label: "REASSIGN CCR APPROVALS", icon: RefreshCw, href: "/tasks" },
]

const secondaryActions = [
  { label: "DOWNLOAD CREATE CCR TEMPLATE", icon: Download, href: "#" },
  { label: "CREATE CCR FROM TEMPLATE", icon: Plus, href: "/create-ccr" },
]

export function CcrHero() {
  const session = useAftermarketSession()
  const userName = session?.name ?? "Demo User"

  return (
    <section className="relative overflow-hidden bg-neutral-900 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 90% at 18% 50%, rgba(255,255,255,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 40% 70% at 32% 40%, rgba(255,255,255,0.08) 0%, transparent 60%),
            linear-gradient(105deg, #0c0c0d 0%, #17181a 45%, #232428 70%, #101011 100%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-2/3 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent 0 26px, rgba(255,255,255,0.06) 26px 28px)",
        }}
      />

      <div className="relative flex flex-wrap items-center gap-x-8 gap-y-4 px-4 py-5">
        <div className="flex max-w-xl flex-wrap gap-2">
          {primaryActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-800 px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-white hover:bg-emerald-700"
            >
              <a.icon className="size-3.5" />
              {a.label}
            </Link>
          ))}
          {secondaryActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-800 px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-white hover:bg-emerald-700"
            >
              <a.icon className="size-3.5" />
              {a.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto text-right text-[13px] leading-snug">
          <p className="font-medium">Hello, {userName}.</p>
          <p className="font-semibold">
            Welcome to Aftermarket Commercial Change Management
          </p>
        </div>
      </div>
    </section>
  )
}
