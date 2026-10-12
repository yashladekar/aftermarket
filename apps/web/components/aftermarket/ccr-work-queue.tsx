"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
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
  dummyCcrs,
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
import { FieldError } from "@/components/aftermarket/wizard-fields"

const ROW_OPTIONS = [10, 25, 50] as const

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
  const form = useForm<WorkQueueFilterInput, unknown, WorkQueueFilters>({
    resolver: zodResolver(workQueueFilterSchema),
    defaultValues: workQueueFilterDefaults,
  })
  const [applied, setApplied] = useState<WorkQueueFilters>(
    workQueueFilterDefaults
  )
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [page, setPage] = useState(1)

  const onSubmit = form.handleSubmit((values) => {
    setApplied(values)
    setPage(1)
  })

  const reset = () => {
    form.reset(workQueueFilterDefaults)
    setApplied(workQueueFilterDefaults)
    setPage(1)
  }

  const rows = useMemo(() => {
    const q = (s: string) => s.trim().toLowerCase()
    const vendorQ = q(applied.vendorQuery)
    const partQ = q(applied.partQuery)
    const codeQ = q(applied.codeRefQuery)
    const now = new Date("2026-10-12T00:00:00Z").getTime()
    const daysFor: Record<string, number> = {
      "Last 7 days": 7,
      "Last 30 days": 30,
      "Last 90 days": 90,
    }

    return dummyCcrs
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
        if (applied.ccrType !== "Any" && r.ccrType !== applied.ccrType)
          return false
        if (applied.priority !== "Any" && r.priority !== applied.priority)
          return false
        if (applied.dateRequested !== "Any") {
          const days = daysFor[applied.dateRequested] ?? 0
          const ageDays =
            (now - new Date(`${r.dateRequested}T00:00:00Z`).getTime()) /
            86400000
          if (ageDays > days) return false
        }
        return true
      })
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }, [applied])

  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage))
  const safePage = Math.min(page, pageCount)
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
            value={form.watch("ccrType") ?? "Any"}
            onChange={(v) =>
              form.setValue("ccrType", v as WorkQueueFilters["ccrType"])
            }
            options={ccrTypeOptions}
            className="min-w-44"
          />
          <FilterSelect
            label="PRIORITY |"
            value={form.watch("priority") ?? "Any"}
            onChange={(v) =>
              form.setValue("priority", v as WorkQueueFilters["priority"])
            }
            options={["Any", "High", "Medium", "Low"]}
          />
          <FilterSelect
            label="DATE REQUESTED |"
            value={form.watch("dateRequested") ?? "Any"}
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
                  setRowsPerPage(n)
                  setPage(1)
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
            >
              <Download className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-7"
              title="Column chooser"
            >
              <ListFilter className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-7"
              title="Reset filters"
              onClick={reset}
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
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                Reference
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                Status
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                Vendor Code
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                Vendor Name
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                Ultimate Signoff Level
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                Date Requested
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                <span className="inline-flex items-center gap-1">
                  Last Updated <InfoTip label="Last update timestamp" />
                </span>
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                <span className="inline-flex items-center gap-1">
                  Recent Update <InfoTip label="Latest change on the CCR" />
                </span>
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                <span className="inline-flex items-center gap-1">
                  Net Price Change <InfoTip label="Net price changed" />
                </span>
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                <span className="inline-flex items-center gap-1">
                  Lead Time Change <InfoTip label="Lead time changed" />
                </span>
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                <span className="inline-flex items-center gap-1">
                  MOQ Change <InfoTip label="Minimum order quantity changed" />
                </span>
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                <span className="inline-flex items-center gap-1">
                  ATB <InfoTip label="Above the bar approval" />
                </span>
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                <span className="inline-flex items-center gap-1">
                  BB <InfoTip label="Below the bar items" />
                </span>
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                <span className="inline-flex items-center gap-1">
                  Missing Ref Data <InfoTip label="Reference data incomplete" />
                </span>
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                Supply Issue
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                Priority &#8593;
              </TableHead>
              <TableHead className="px-2 py-2 font-semibold text-neutral-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={17}
                  className="py-8 text-center text-[12px] text-neutral-500"
                >
                  No CCRs match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row: CcrRow) => (
                <TableRow key={row.reference} className="align-top">
                  <TableCell className="px-2 py-2 font-bold whitespace-nowrap text-emerald-800">
                    {row.reference}
                  </TableCell>
                  <TableCell className="px-2 py-2 whitespace-nowrap text-neutral-600">
                    {row.status}
                  </TableCell>
                  <TableCell className="px-2 py-2 whitespace-nowrap">
                    {row.vendorCode}
                  </TableCell>
                  <TableCell className="px-2 py-2 whitespace-normal uppercase">
                    {row.vendorName}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    {row.signoffLevel}
                  </TableCell>
                  <TableCell className="px-2 py-2 whitespace-nowrap">
                    {fmtCcrDate(row.dateRequested)}
                  </TableCell>
                  <TableCell className="px-2 py-2 whitespace-nowrap">
                    {fmtCcrDate(row.lastUpdated)}
                  </TableCell>
                  <TableCell className="max-w-44 px-2 py-2 whitespace-normal text-neutral-600">
                    {row.recentUpdate}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <BoolCell value={row.netPriceChange} />
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <BoolCell value={row.leadTimeChange} />
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <BoolCell value={row.moqChange} />
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <BoolCell value={row.atb} />
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <BoolCell value={row.bb} />
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    {row.missingRefData ? (
                      <span className="rounded-sm bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                        Yes
                      </span>
                    ) : (
                      <span className="text-[12px] text-neutral-700">No</span>
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    {row.supplyOk ? (
                      <CircleCheck className="inline size-4 text-emerald-700" />
                    ) : (
                      <TriangleAlert className="inline size-4 fill-red-500 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <PriorityCell priority={row.priority} />
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex size-6 items-center justify-center rounded text-neutral-500 outline-none hover:bg-neutral-100"
                        aria-label={`Actions for ${row.reference}`}
                      >
                        <EllipsisVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Open CCR</DropdownMenuItem>
                        <DropdownMenuItem>View parts</DropdownMenuItem>
                        <DropdownMenuItem>Reassign approval</DropdownMenuItem>
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  )
}
