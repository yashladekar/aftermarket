"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CircleCheck,
  Download,
  EllipsisVertical,
  Info,
  ListFilter,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import {
  ccrTypeOptions,
  fmtCcrDate,
  type CcrPriority,
  type CcrRow,
} from "@/lib/ccr-data"
import {
  workQueueFilterDefaults,
  workQueueFilterSchema,
  type WorkQueueFilterInput,
  type WorkQueueFilters,
} from "@/lib/ccr-schemas"
import { useCcrApi } from "@/lib/ccr-api"
import { useAftermarketStore } from "@/lib/aftermarket-store"
import { FieldError } from "@/components/aftermarket/wizard-fields"

const ROW_OPTIONS = [10, 25, 50] as const
const workQueueQueryParsers = {
  vendorQuery: parseAsString.withDefault(""),
  partQuery: parseAsString.withDefault(""),
  codeRefQuery: parseAsString.withDefault(""),
  ccrType: parseAsStringEnum(["Any", ...ccrTypeOptions]).withDefault("Any"),
  priority: parseAsStringEnum(["Any", "High", "Medium", "Low"]).withDefault(
    "Any"
  ),
  dateRequested: parseAsStringEnum([
    "Any",
    "Last 7 days",
    "Last 30 days",
    "Last 90 days",
  ]).withDefault("Any"),
  page: parseAsInteger.withDefault(1),
  rowsPerPage: parseAsInteger.withDefault(10),
}

type CcrColumnKey =
  | "reference"
  | "status"
  | "vendorCode"
  | "vendorName"
  | "signoff"
  | "dateRequested"
  | "lastUpdated"
  | "recentUpdate"
  | "netPrice"
  | "leadTime"
  | "moq"
  | "atb"
  | "bb"
  | "missingRef"
  | "supply"
  | "priority"

const columnDefs: { key: CcrColumnKey; label: string; locked?: boolean }[] = [
  { key: "reference", label: "Reference", locked: true },
  { key: "status", label: "Status" },
  { key: "vendorCode", label: "Vendor Code" },
  { key: "vendorName", label: "Vendor Name" },
  { key: "signoff", label: "Ultimate Signoff Level" },
  { key: "dateRequested", label: "Date Requested" },
  { key: "lastUpdated", label: "Last Updated" },
  { key: "recentUpdate", label: "Recent Update" },
  { key: "netPrice", label: "Net Price Change" },
  { key: "leadTime", label: "Lead Time Change" },
  { key: "moq", label: "MOQ Change" },
  { key: "atb", label: "ATB" },
  { key: "bb", label: "BB" },
  { key: "missingRef", label: "Missing Ref Data" },
  { key: "supply", label: "Supply Issue" },
  { key: "priority", label: "Priority" },
]

function toCsvCell(value: string | boolean): string {
  const text = typeof value === "boolean" ? (value ? "Yes" : "No") : value
  return `"${text.replace(/"/g, '""')}"`
}

function exportRowsCsv(rows: CcrRow[], visible: Set<CcrColumnKey>) {
  const cols = columnDefs.filter((c) => visible.has(c.key) || c.locked)
  const get = (row: CcrRow, key: CcrColumnKey): string | boolean => {
    switch (key) {
      case "reference":
        return row.reference
      case "status":
        return row.status
      case "vendorCode":
        return row.vendorCode
      case "vendorName":
        return row.vendorName
      case "signoff":
        return row.signoffLevel
      case "dateRequested":
        return fmtCcrDate(row.dateRequested)
      case "lastUpdated":
        return fmtCcrDate(row.lastUpdated)
      case "recentUpdate":
        return row.recentUpdate
      case "netPrice":
        return row.netPriceChange
      case "leadTime":
        return row.leadTimeChange
      case "moq":
        return row.moqChange
      case "atb":
        return row.atb
      case "bb":
        return row.bb
      case "missingRef":
        return row.missingRefData
      case "supply":
        return row.supplyOk ? "OK" : "Issue"
      case "priority":
        return row.priority
    }
  }
  const lines = [
    [...cols.map((c) => c.label), "Actions"].map(toCsvCell).join(","),
    ...rows.map((row) =>
      [...cols.map((c) => get(row, c.key)), ""].map(toCsvCell).join(",")
    ),
  ]
  const blob = new Blob([lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "my-work-queue.csv"
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function InfoTip({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="text-emerald-700"
            aria-label={label}
          >
            <Info className="size-3" />
          </button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  label: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-1 text-[11px]", className)}>
      <span className="font-semibold whitespace-nowrap text-neutral-500 uppercase">
        {label}
      </span>
      <Select value={value} onValueChange={(v) => onChange(v ?? "Any")}>
        <SelectTrigger className="h-7 min-w-20 flex-1 border border-neutral-300 bg-white px-1.5 text-[11px] shadow-none">
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Any">Any</SelectItem>
          {options
            .filter((o) => o !== "Any")
            .map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function BoolCell({ value }: { value: boolean }) {
  return (
    <span className="text-[12px] text-neutral-700">{value ? "Yes" : "No"}</span>
  )
}

const priorityOrder: Record<CcrPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
}

function PriorityCell({ priority }: { priority: CcrPriority }) {
  return (
    <span className="inline-flex items-center justify-center">
      <TriangleAlert
        className={cn(
          "size-4",
          priority === "High" ? "fill-red-500 text-red-500" : "text-emerald-700"
        )}
        aria-label={`${priority} priority`}
      />
    </span>
  )
}

export function CcrWorkQueue() {
  const router = useRouter()
  const [query, setQuery] = useQueryStates(workQueueQueryParsers)
  const form = useForm<WorkQueueFilterInput, unknown, WorkQueueFilters>({
    resolver: zodResolver(workQueueFilterSchema),
    defaultValues: workQueueFilterDefaults,
  })
  const { reset: resetForm } = form
  const { listCcrs } = useCcrApi()
  const { pendingApprovals, completeTask } = useAftermarketStore()
  const [actingTask, setActingTask] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const pendingByRef = useMemo(() => {
    const map = new Map<string, (typeof pendingApprovals)[number]>()
    for (const task of pendingApprovals) {
      if (task.requestId && !map.has(task.requestId)) map.set(task.requestId, task)
    }
    return map
  }, [pendingApprovals])
  const decide = async (reference: string, decision: "APPROVED" | "REJECTED") => {
    const task = pendingByRef.get(reference)
    if (!task) return
    setActingTask(task.taskId)
    setActionError(null)
    try {
      await completeTask(task.taskId, decision)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to complete approval")
    } finally {
      setActingTask(null)
    }
  }
  const [backendRows, setBackendRows] = useState<CcrRow[]>([])
  const [backendError, setBackendError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const rowsPerPage = ROW_OPTIONS.includes(
    query.rowsPerPage as (typeof ROW_OPTIONS)[number]
  )
    ? query.rowsPerPage
    : ROW_OPTIONS[0]
  const page = Math.max(1, query.page)
  const [visibleColumns, setVisibleColumns] = useState<Set<CcrColumnKey>>(
    () => new Set(columnDefs.map((c) => c.key))
  )
  const ccrTypeValue = useWatch({ control: form.control, name: "ccrType" })
  const priorityValue = useWatch({ control: form.control, name: "priority" })
  const dateRequestedValue = useWatch({
    control: form.control,
    name: "dateRequested",
  })

  useEffect(() => {
    resetForm({
      vendorQuery: query.vendorQuery,
      partQuery: query.partQuery,
      codeRefQuery: query.codeRefQuery,
      ccrType: query.ccrType,
      priority: query.priority,
      dateRequested: query.dateRequested,
    })
  }, [
    resetForm,
    query.vendorQuery,
    query.partQuery,
    query.codeRefQuery,
    query.ccrType,
    query.priority,
    query.dateRequested,
  ])

  const onSubmit = form.handleSubmit((values) => {
    void setQuery({ ...values, page: 1 }, { history: "push" })
  })

  const toggleColumn = (key: CcrColumnKey, on: boolean) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })
  }

  const resetFilters = () => {
    resetForm(workQueueFilterDefaults)
    void setQuery(
      { ...workQueueFilterDefaults, page: 1 },
      { history: "push" }
    )
  }

  const show = (key: CcrColumnKey) => visibleColumns.has(key)
  const visibleCount = columnDefs.filter((c) => show(c.key)).length + 1

  const rows = useMemo(() => {
    const q = (s: string) => s.trim().toLowerCase()
    const vendorQ = q(query.vendorQuery)
    const partQ = q(query.partQuery)
    const codeQ = q(query.codeRefQuery)
    const now = new Date("2026-10-12T00:00:00Z").getTime()
    const daysFor: Record<string, number> = {
      "Last 7 days": 7,
      "Last 30 days": 30,
      "Last 90 days": 90,
    }

    return backendRows
      .filter((r) => {
        if (
          vendorQ &&
          !`${r.vendorName} ${r.vendorCode}`.toLowerCase().includes(vendorQ)
        )
          return false
        if (partQ && !r.partRefs.some((p) => p.toLowerCase().includes(partQ)))
          return false
        if (
          codeQ &&
          !`${r.vendorCode} ${r.reference}`.toLowerCase().includes(codeQ)
        )
          return false
        if (query.ccrType !== "Any" && r.ccrType !== query.ccrType)
          return false
        if (query.priority !== "Any" && r.priority !== query.priority)
          return false
        if (query.dateRequested !== "Any") {
          const days = daysFor[query.dateRequested] ?? 0
          const ageDays =
            (now - new Date(`${r.dateRequested}T00:00:00Z`).getTime()) /
            86400000
          if (ageDays > days) return false
        }
        return true
      })
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }, [
    backendRows,
    query.vendorQuery,
    query.partQuery,
    query.codeRefQuery,
    query.ccrType,
    query.priority,
    query.dateRequested,
  ])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setBackendError(null)
      try {
        const params = new URLSearchParams()
        if (query.vendorQuery) params.set("vendorQuery", query.vendorQuery)
        if (query.partQuery) params.set("partQuery", query.partQuery)
        if (query.codeRefQuery) params.set("codeRefQuery", query.codeRefQuery)
        if (query.ccrType !== "Any") params.set("ccrType", query.ccrType)
        if (query.priority !== "Any") params.set("priority", query.priority)
        if (query.dateRequested !== "Any")
          params.set("dateRequested", query.dateRequested)
        const rows = await listCcrs(params)
        if (!cancelled) setBackendRows(rows)
      } catch (e) {
        if (!cancelled)
          setBackendError(
            e instanceof Error ? e.message : "Failed to load CCRs"
          )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [
    listCcrs,
    query.vendorQuery,
    query.partQuery,
    query.codeRefQuery,
    query.ccrType,
    query.priority,
    query.dateRequested,
    pendingApprovals,
  ])

  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage))
  const safePage = Math.min(page, pageCount)
  useEffect(() => {
    const nextRowsPerPage = ROW_OPTIONS.includes(
      query.rowsPerPage as (typeof ROW_OPTIONS)[number]
    )
      ? query.rowsPerPage
      : ROW_OPTIONS[0]
    if (query.page !== safePage || query.rowsPerPage !== nextRowsPerPage) {
      void setQuery(
        { page: safePage, rowsPerPage: nextRowsPerPage },
        { history: "replace" }
      )
    }
  }, [pageCount, query.page, query.rowsPerPage, safePage, setQuery])
  const visible = rows.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  )

  const register = form.register

  return (
    <section className="bg-white px-3 py-2">
      <h2 className="py-1 text-center text-[13px] font-bold text-neutral-800">
        My Work Queue
      </h2>
      {(backendError || actionError) && (
        <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {actionError ?? backendError}
        </p>
      )}

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <div>
            <div className="mb-0.5 flex items-center gap-1 text-[12px] font-semibold text-neutral-700">
              Filter by Vendors
              <InfoTip label="Type part of a vendor name or code" />
            </div>
            <Input
              {...register("vendorQuery")}
              placeholder="Search a vendor"
              className="h-7 border-neutral-300 text-[12px]"
            />
            <FieldError message={form.formState.errors.vendorQuery?.message} />
          </div>
          <div>
            <div className="mb-0.5 flex items-center gap-1 text-[12px] font-semibold text-neutral-700">
              Filter by Part
              <InfoTip label="Type part of a part number" />
            </div>
            <Input
              {...register("partQuery")}
              placeholder="Search a part"
              className="h-7 border-neutral-300 text-[12px]"
            />
            <FieldError message={form.formState.errors.partQuery?.message} />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-neutral-400" />
            <Input
              {...register("codeRefQuery")}
              placeholder="Search Vendor Code & CCR Ref."
              className="h-7 border-neutral-300 pl-7 text-[12px]"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-7 border-emerald-700 px-3 text-[11px] font-bold text-emerald-700"
          >
            SEARCH
          </Button>

          <FilterSelect
            label="CCR TYPE |"
            value={ccrTypeValue ?? "Any"}
            onChange={(v) =>
              form.setValue("ccrType", v as WorkQueueFilters["ccrType"])
            }
            options={ccrTypeOptions}
            className="min-w-44"
          />
          <FilterSelect
            label="PRIORITY |"
            value={priorityValue ?? "Any"}
            onChange={(v) =>
              form.setValue("priority", v as WorkQueueFilters["priority"])
            }
            options={["Any", "High", "Medium", "Low"]}
          />
          <FilterSelect
            label="DATE REQUESTED |"
            value={dateRequestedValue ?? "Any"}
            onChange={(v) =>
              form.setValue("dateRequested", v as WorkQueueFilters["dateRequested"])
            }
            options={["Any", "Last 7 days", "Last 30 days", "Last 90 days"]}
            className="min-w-48"
          />

          <div className="ml-auto flex items-center gap-1">
            <span className="mr-1 text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
              Rows per page
            </span>
            {ROW_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  void setQuery({ rowsPerPage: n, page: 1 }, { history: "push" })
                }}
                className={cn(
                  "min-w-6 px-1 py-0.5 text-[11px] font-bold",
                  rowsPerPage === n
                    ? "bg-emerald-800 text-white"
                    : "text-neutral-500 hover:bg-neutral-100"
                )}
              >
                {n}
              </button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="ml-1 size-7"
              title="Export"
              onClick={() => exportRowsCsv(rows, visibleColumns)}
            >
              <Download className="size-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background text-neutral-600 outline-none hover:bg-muted"
                title="Column chooser"
                aria-label="Column chooser"
              >
                <ListFilter className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {columnDefs.map((c) => (
                  <DropdownMenuItem
                    key={c.key}
                    closeOnClick={false}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      checked={show(c.key)}
                      disabled={c.locked}
                      onCheckedChange={(v) =>
                        toggleColumn(c.key, v === true)
                      }
                    />
                    <span className="text-xs">{c.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-7"
              title="Reset filters"
              onClick={resetFilters}
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </div>
        <FieldError message={form.formState.errors.codeRefQuery?.message} />
      </form>

      <div className="mt-2 overflow-x-auto border-t border-neutral-200">
        <Table className="min-w-[1500px] text-[12px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {show("reference") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  Reference
                </TableHead>
              )}
              {show("status") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  Status
                </TableHead>
              )}
              {show("vendorCode") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  Vendor Code
                </TableHead>
              )}
              {show("vendorName") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  Vendor Name
                </TableHead>
              )}
              {show("signoff") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  Ultimate Signoff Level
                </TableHead>
              )}
              {show("dateRequested") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  Date Requested
                </TableHead>
              )}
              {show("lastUpdated") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    Last Updated <InfoTip label="Last update timestamp" />
                  </span>
                </TableHead>
              )}
              {show("recentUpdate") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    Recent Update <InfoTip label="Latest change on the CCR" />
                  </span>
                </TableHead>
              )}
              {show("netPrice") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    Net Price Change <InfoTip label="Net price changed" />
                  </span>
                </TableHead>
              )}
              {show("leadTime") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    Lead Time Change <InfoTip label="Lead time changed" />
                  </span>
                </TableHead>
              )}
              {show("moq") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    MOQ Change <InfoTip label="Minimum order quantity changed" />
                  </span>
                </TableHead>
              )}
              {show("atb") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    ATB <InfoTip label="Above the bar approval" />
                  </span>
                </TableHead>
              )}
              {show("bb") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    BB <InfoTip label="Below the bar items" />
                  </span>
                </TableHead>
              )}
              {show("missingRef") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    Missing Ref Data <InfoTip label="Reference data incomplete" />
                  </span>
                </TableHead>
              )}
              {show("supply") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  Supply Issue
                </TableHead>
              )}
              {show("priority") && (
                <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                  Priority &#8593;
                </TableHead>
              )}
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleCount}
                  className="py-8 text-center text-[12px] text-neutral-500"
                >
                  Loading CCRs…
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleCount}
                  className="py-8 text-center text-[12px] text-neutral-500"
                >
                  No CCRs match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row: CcrRow) => (
                <TableRow key={row.reference} className="align-top">
                  {show("reference") && (
                    <TableCell className="px-2 py-2 font-bold whitespace-nowrap text-emerald-800">
                      {row.reference}
                    </TableCell>
                  )}
                  {show("status") && (
                    <TableCell className="px-2 py-2 whitespace-nowrap text-neutral-600">
                      {row.status}
                    </TableCell>
                  )}
                  {show("vendorCode") && (
                    <TableCell className="px-2 py-2 whitespace-nowrap">
                      {row.vendorCode}
                    </TableCell>
                  )}
                  {show("vendorName") && (
                    <TableCell className="px-2 py-2 whitespace-normal uppercase">
                      {row.vendorName}
                    </TableCell>
                  )}
                  {show("signoff") && (
                    <TableCell className="px-2 py-2 text-center">
                      {row.signoffLevel}
                    </TableCell>
                  )}
                  {show("dateRequested") && (
                    <TableCell className="px-2 py-2 whitespace-nowrap">
                      {fmtCcrDate(row.dateRequested)}
                    </TableCell>
                  )}
                  {show("lastUpdated") && (
                    <TableCell className="px-2 py-2 whitespace-nowrap">
                      {fmtCcrDate(row.lastUpdated)}
                    </TableCell>
                  )}
                  {show("recentUpdate") && (
                    <TableCell className="max-w-44 px-2 py-2 whitespace-normal text-neutral-600">
                      {row.recentUpdate}
                    </TableCell>
                  )}
                  {show("netPrice") && (
                    <TableCell className="px-2 py-2 text-center">
                      <BoolCell value={row.netPriceChange} />
                    </TableCell>
                  )}
                  {show("leadTime") && (
                    <TableCell className="px-2 py-2 text-center">
                      <BoolCell value={row.leadTimeChange} />
                    </TableCell>
                  )}
                  {show("moq") && (
                    <TableCell className="px-2 py-2 text-center">
                      <BoolCell value={row.moqChange} />
                    </TableCell>
                  )}
                  {show("atb") && (
                    <TableCell className="px-2 py-2 text-center">
                      <BoolCell value={row.atb} />
                    </TableCell>
                  )}
                  {show("bb") && (
                    <TableCell className="px-2 py-2 text-center">
                      <BoolCell value={row.bb} />
                    </TableCell>
                  )}
                  {show("missingRef") && (
                    <TableCell className="px-2 py-2 text-center">
                      {row.missingRefData ? (
                        <span className="rounded-sm bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                          Yes
                        </span>
                      ) : (
                        <span className="text-[12px] text-neutral-700">No</span>
                      )}
                    </TableCell>
                  )}
                  {show("supply") && (
                    <TableCell className="px-2 py-2 text-center">
                      {row.supplyOk ? (
                        <CircleCheck className="inline size-4 text-emerald-700" />
                      ) : (
                        <TriangleAlert className="inline size-4 fill-red-500 text-red-500" />
                      )}
                    </TableCell>
                  )}
                  {show("priority") && (
                    <TableCell className="px-2 py-2 text-center">
                      <PriorityCell priority={row.priority} />
                    </TableCell>
                  )}
                  <TableCell className="px-2 py-2 text-center">
                    {pendingByRef.get(row.reference)?.canAct && (
                      <span className="mr-1 inline-flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 bg-emerald-800 px-2 text-[11px] font-bold text-white hover:bg-emerald-700"
                          disabled={actingTask === pendingByRef.get(row.reference)?.taskId}
                          onClick={() => decide(row.reference, "APPROVED")}
                        >
                          APPROVE
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 border-red-200 px-2 text-[11px] font-bold text-red-600 hover:bg-red-50"
                          disabled={actingTask === pendingByRef.get(row.reference)?.taskId}
                          onClick={() => decide(row.reference, "REJECTED")}
                        >
                          REJECT
                        </Button>
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex size-6 items-center justify-center rounded text-neutral-500 outline-none hover:bg-neutral-100"
                        aria-label={`Actions for ${row.reference}`}
                      >
                        <EllipsisVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/ccr-demo-submitted?ref=${encodeURIComponent(row.reference)}`
                            )
                          }
                        >
                          Open CCR
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/ccr-demo-submitted?ref=${encodeURIComponent(row.reference)}`
                            )
                          }
                        >
                          View parts
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/tasks")}>
                          Reassign approval
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 px-1 py-2 text-[11px] text-neutral-500">
        <span>
          Showing {(safePage - 1) * rowsPerPage + (visible.length ? 1 : 0)}-
          {(safePage - 1) * rowsPerPage + visible.length} of {rows.length}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[11px]"
            disabled={safePage <= 1}
            onClick={() =>
              void setQuery({ page: Math.max(1, safePage - 1) }, { history: "push" })
            }
          >
            Prev
          </Button>
          <span className="px-1 font-semibold text-neutral-700">
            {safePage} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[11px]"
            disabled={safePage >= pageCount}
            onClick={() =>
              void setQuery({ page: Math.min(pageCount, safePage + 1) }, { history: "push" })
            }
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  )
}
