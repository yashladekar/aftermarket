"use client"

import Link from "next/link"
import {
  Check,
  CircleDot,
  Clock,
  Hourglass,
  ListFilter,
  UserCheck,
} from "lucide-react"
import { useNeoStore } from "@/lib/neo-store"
import { useNeoSession } from "@/components/neo/session-provider"

const kpiDefs = [
  { key: "open", label: "OPEN" },
  { key: "draft", label: "DRAFT" },
  { key: "awaiting", label: "AWAITING ENQUIRY" },
  { key: "completed", label: "COMPLETED" },
  { key: "pending", label: "PENDING APPROVALS" },
  { key: "mine", label: "MY APPROVALS" },
] as const

const kpiIcons: Record<string, typeof CircleDot> = {
  open: CircleDot,
  draft: Clock,
  awaiting: ListFilter,
  completed: Check,
  pending: Hourglass,
  mine: UserCheck,
}

export function NeoHero() {
  const { claims, pendingApprovals, myApprovals } = useNeoStore()
  const session = useNeoSession()
  const awaiting = claims.filter(
    (c) => c.status === "Awaiting Manager" || c.status === "Awaiting Finance"
  ).length
  const values: Record<string, string> = {
    open: String(
      claims.filter(
        (c) => !c.status || c.status === "Forecast" || c.status === "Awaiting Manager" || c.status === "Awaiting Finance"
      ).length
    ),
    draft: String(claims.filter((c) => c.status === "Draft").length),
    awaiting: String(awaiting),
    completed: String(claims.filter((c) => c.status === "Completed").length),
    pending: String(pendingApprovals.length),
    mine: String(myApprovals.length),
  }

  return (
    <section className="bg-black text-white">
      <div className="relative flex items-center justify-center px-6 py-10">
        <div className="flex items-center gap-8">
          <div className="flex size-24 items-center justify-center rounded-full border-2 border-amber-200/70">
            <div className="flex size-16 items-center justify-center rounded-full border border-amber-200/50">
              <div className="grid size-8 grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      i === 4
                        ? "bg-amber-200"
                        : "border border-amber-200/70"
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <h1 className="text-7xl font-black tracking-[0.35em]">NEO</h1>

          <div className="text-sm font-semibold tracking-[0.25em] text-amber-200/90">
            <p>Negotiation</p>
            <p className="mt-1">Enterprise</p>
            <p className="mt-1">Online</p>
          </div>
        </div>

        <p className="absolute right-6 bottom-3 text-xs text-neutral-300">
          Hello, {session?.name ?? "there"}
        </p>
      </div>

      <div className="flex items-stretch gap-2 border-t border-neutral-800 bg-neutral-950 px-6 py-3">
        <Link
          href="/create-claim"
          className="flex flex-1 items-center justify-center gap-1.5 bg-emerald-800 px-4 py-2.5 text-xs font-bold tracking-wide text-white hover:bg-emerald-700"
        >
          <span className="text-sm leading-none">+</span> CREATE CLAIM
        </Link>
        <Link
          href="/mandate-request"
          className="flex flex-1 items-center justify-center gap-1.5 bg-emerald-800 px-4 py-2.5 text-xs font-bold tracking-wide text-white hover:bg-emerald-700"
        >
          <span className="text-sm leading-none">♦</span> LINK CLAIMS
        </Link>

        <div className="grid flex-[3] grid-cols-6 divide-x divide-neutral-800">
          {kpiDefs.map((kpi) => {
            const Icon = kpiIcons[kpi.key] ?? CircleDot
            return (
              <div
                key={kpi.key}
                className="group flex flex-col items-start gap-1 px-4 py-1 text-left"
              >
                <span className="text-[10px] font-semibold tracking-wider text-neutral-400 group-hover:text-neutral-200">
                  {kpi.label}
                </span>
                <span className="flex items-center gap-1.5 text-lg font-bold">
                  <Icon className="size-4 text-neutral-400" />
                  {values[kpi.key]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
