"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import {
  CircleCheck,
  Download,
  ListFilter,
  RefreshCw,
  Search,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { CcrTopNav } from "@/components/aftermarket/ccr-top-nav"
import { useCcrApi, type BackendCcrDetail } from "@/lib/ccr-api"
import { useCcrCatalog } from "@/lib/use-ccr-catalog"
import { cn } from "@workspace/ui/lib/utils"

const detailTabs = [
  "Summary",
  "Parts",
  "Planners",
  "IM Forecasts",
  "MOQ Cost Options",
  "Pricing Review",
  "Space Impact",
  "Internal Chat",
  "Buyer-Supplier Chat",
  "Supporting Documents",
  "CCR Activity Log",
] as const

function CcrDetailView() {
  const params = useSearchParams()
  const reference = params.get("ref") ?? ""
  const vendorsParam = params.get("vendors") ?? ""
  const partsParam = params.get("parts") ?? ""
  const vendorCodes = vendorsParam.split(",").filter(Boolean)
  const partNumbers = partsParam.split(",").filter(Boolean)
  const [activeTab, setActiveTab] =
    useState<(typeof detailTabs)[number]>("Summary")
  const [query, setQuery] = useState("")
  const { getCcr } = useCcrApi()
  const { vendors: vendorCatalog, parts: vendorPartsCatalog } = useCcrCatalog()
  const [detail, setDetail] = useState<BackendCcrDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reference) return
    let cancelled = false
    const load = async () => {
      try {
        const row = await getCcr(reference)
        if (!cancelled) setDetail(row)
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load CCR")
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [getCcr, reference])

  const title = detail?.reference ?? reference ?? "CCR"
  const status = detail?.status ?? "Submitted"
  const vendor =
    vendorCatalog.find((v) => v.code === (detail?.vendorCode ?? vendorCodes[0])) ??
    (vendorCodes[0]
      ? { code: vendorCodes[0], name: detail?.vendorName ?? "" }
      : undefined)
  const effectiveParts =
    detail?.partRefs?.length || partNumbers.length
      ? vendorPartsCatalog.filter((p) =>
          (detail?.partRefs?.length ? detail.partRefs : partNumbers).includes(
            p.partNumber
          )
        )
      : vendorPartsCatalog.filter((p) => p.vendorCode === vendor?.code).slice(0, 5)
  const matches = effectiveParts.filter((p) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${p.partNumber} ${p.description}`.toLowerCase().includes(q)
  })

  return (
    <div className="min-h-svh bg-neutral-100">
      <CcrTopNav active="home" />

      <div className="flex items-center justify-between bg-neutral-700 px-4 py-2 text-white">
        <h1 className="text-[15px] font-bold">
          {title} - {status}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-sm bg-white text-[11px] font-bold text-neutral-700"
          >
            RE-ASSIGN CCR
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-sm bg-white text-[11px] font-bold text-neutral-700"
          >
            MANAGE SUPPLY ISSUE FLAG
          </Button>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-white px-4 py-1.5 text-[12px]">
        {detailTabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={cn(
              "rounded-sm px-1.5 py-0.5",
              activeTab === t
                ? "bg-emerald-800 font-bold text-white"
                : "text-emerald-800 hover:bg-emerald-50"
            )}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="space-y-3 px-4 py-3">
        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
            {error}
          </p>
        )}
        <p className="border-l-2 border-emerald-600 bg-emerald-50 px-3 py-2 text-[12px] leading-snug text-neutral-700">
          CCR {title} was submitted and routed to the Manager for first
          approval. Once approved it moves on to Finance.
        </p>

        <section className="bg-white">
          <h2 className="bg-neutral-200 px-3 py-1.5 text-[13px] font-bold text-neutral-800">
            CCR Details
          </h2>
          <div className="grid grid-cols-3 gap-px bg-neutral-200 sm:grid-cols-5 lg:grid-cols-9">
            {[
              { label: "Status", value: status },
              { label: "Vendor", value: vendor?.code ?? "—" },
              { label: "Parts", value: String(matches.length || effectiveParts.length) },
              { label: "Justification", value: detail?.justification ? "Provided" : "—" },
              { label: "On Behalf Reason", value: detail?.onBehalfReason || params.get("onBehalf") || "—" },
              { label: "Signoff", value: detail?.signoffLevel ?? "—" },
              { label: "Workflow", value: detail?.currentTaskKey ?? detail?.workflowState ?? "—" },
              { label: "Recent Update", value: detail?.recentUpdate ?? "CCR Submitted" },
              { label: "Reference", value: title },
            ].map((f) => (
              <div key={f.label} className="bg-white px-2 py-2">
                <p className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                  {f.label}
                </p>
                <p className="mt-0.5 truncate text-[12px] font-bold text-neutral-800" title={f.value}>
                  {f.value || "—"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="bg-white">
              <h3 className="bg-neutral-200 px-3 py-1.5 text-[13px] font-bold text-neutral-800">
                Vendor
              </h3>
              <div className="space-y-1 px-3 py-2 text-[12px]">
                <p className="flex items-center gap-1.5 font-semibold">
                  <span className="flex size-4 items-center justify-center rounded-sm bg-emerald-100 text-[10px] text-emerald-800">
                    ▦
                  </span>
                  {vendor?.code ?? "—"}
                </p>
                <p className="flex items-center gap-1.5 text-neutral-600 uppercase">
                  <span className="flex size-4 items-center justify-center rounded-sm bg-emerald-100 text-[10px] text-emerald-800">
                    ▦
                  </span>
                  {vendor?.name ?? detail?.vendorName ?? "—"}
                </p>
              </div>
            </div>
            <div className="bg-white">
              <h3 className="bg-neutral-200 px-3 py-1.5 text-[13px] font-bold text-neutral-800">
                Justification
              </h3>
              <p className="px-3 py-2 text-[12px] text-neutral-700">
                {detail?.justification || "—"}
              </p>
            </div>
          </div>

          <div className="bg-white lg:col-span-3">
            <h3 className="bg-neutral-200 px-3 py-1.5 text-[13px] font-bold text-neutral-800">
              Part Details
            </h3>
            <div className="flex flex-wrap items-center gap-2 px-3 py-2">
              <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search CCR Parts"
                    className="h-7 w-64 border-neutral-300 pl-7 text-[11px]"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  type="submit"
                  className="h-7 border-emerald-700 px-2 text-[11px] font-bold text-emerald-700"
                >
                  SEARCH
                </Button>
              </form>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="size-7"
                  title="Export"
                  type="button"
                >
                  <Download className="size-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="size-7"
                  title="Column chooser"
                  type="button"
                >
                  <ListFilter className="size-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="size-7"
                  title="Reset"
                  type="button"
                  onClick={() => setQuery("")}
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[800px] text-[12px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {[
                      "Material Number",
                      "WERS Number",
                      "Material Group",
                      "Manufacturer Part Number",
                      "Part Description",
                      "Supply Issue?",
                      "Supply Issue Comment",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="px-2 py-1.5 text-[11px] font-semibold whitespace-nowrap text-neutral-600"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((p) => (
                    <TableRow key={p.partNumber}>
                      <TableCell className="px-2 py-1.5 font-semibold">
                        {p.partNumber}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 whitespace-nowrap">
                        {p.partNumber.slice(0, 4)}A{p.partNumber.slice(4, 8)}B
                      </TableCell>
                      <TableCell className="px-2 py-1.5 whitespace-nowrap">
                        10TRADED
                      </TableCell>
                      <TableCell className="px-2 py-1.5 whitespace-nowrap">
                        {p.manufacturerPartNumber}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 whitespace-normal uppercase">
                        {p.description}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-center">
                        <CircleCheck className="inline size-4 text-emerald-700" />
                      </TableCell>
                      <TableCell className="px-2 py-1.5" />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="px-3 py-2 text-[13px] font-bold text-neutral-800">
              Justification
            </p>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-[12px] font-semibold text-emerald-800 hover:underline"
          >
            ← Back to Work Queue
          </Link>
          <span className="text-[11px] text-neutral-500">
            {detail
              ? `Loaded from backend · ${detail.workflowState ?? ""} ${detail.currentTaskKey ?? ""}`.trim()
              : "Loading from backend…"}
          </span>
        </div>
      </main>
    </div>
  )
}

export default function CcrDetailPage() {
  return (
    <Suspense>
      <CcrDetailView />
    </Suspense>
  )
}
