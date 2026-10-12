"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowUpDown,
  CircleCheck,
  CircleDot,
  Eye,
  MoveRight,
  Pencil,
} from "lucide-react"
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
import { useNeoStore } from "@/lib/neo-store"
import { cn } from "@workspace/ui/lib/utils"

const headers = [
  "",
  "Line ID",
  "Parent Id",
  "Supplier Claim Type",
  "Transaction Type",
  "Fiscal Year",
  "CoC",
  "Confidential",
  "Vendor Name",
  "Description",
  "Reporting Value (£)",
  "Status",
  "Created On",
  "Implementation Date",
  "Is Reserve",
]

export type HomeFilters = {
  query: string
  claimType: string
  createdOn: string
  fiscalYear: string
  buyerCode: string
  pmCode: string
  coc: string
  vendorName: string
  implementationDate: string
  status: string
  isReserve: string
}

export const emptyHomeFilters: HomeFilters = {
  query: "",
  claimType: "__any",
  createdOn: "__any",
  fiscalYear: "__any",
  buyerCode: "__any",
  pmCode: "__any",
  coc: "__any",
  vendorName: "__any",
  implementationDate: "__any",
  status: "__any",
  isReserve: "__any",
}

export function claimMatches(
  row: {
    lineId: string
    supplierClaimType: string
    fiscalYear: string
    coc: string
    vendorName: string
    description: string
    reportingValue: string
    status: string
    createdOn: string
    implementationDate: string
    isReserve: boolean
    buyerCode: string
    pmCode: string
  },
  f: HomeFilters
) {
  const any = (v: string) => v === "__any" || v === "" || v === "Any"
  if (f.query) {
    const q = f.query.toLowerCase()
    const hay =
      `${row.lineId} ${row.vendorName} ${row.description} ${row.supplierClaimType}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  if (!any(f.claimType) && row.supplierClaimType !== f.claimType) return false
  if (!any(f.createdOn)) {
    const day = row.createdOn.split(" ").slice(0, 3).join(" ")
    if (!day.toLowerCase().includes(f.createdOn.toLowerCase())) return false
  }
  if (!any(f.fiscalYear) && row.fiscalYear !== f.fiscalYear) return false
  if (!any(f.buyerCode) && row.buyerCode !== f.buyerCode) return false
  if (!any(f.pmCode) && row.pmCode !== f.pmCode) return false
  if (!any(f.coc) && row.coc !== f.coc) return false
  if (!any(f.vendorName) && row.vendorName !== f.vendorName) return false
  if (!any(f.implementationDate)) {
    if (
      !row.implementationDate
        .toLowerCase()
        .includes(f.implementationDate.toLowerCase())
    )
      return false
  }
  if (!any(f.status) && row.status !== f.status) return false
  if (!any(f.isReserve)) {
    const want = f.isReserve === "Yes"
    if (row.isReserve !== want) return false
  }
  return true
}

export function NeoClaimsTable({ filters }: { filters: HomeFilters }) {
  const { claims } = useNeoStore()
  const rows = useMemo(
    () => claims.filter((r) => claimMatches(r, filters)),
    [claims, filters]
  )
  return (
    <div className="overflow-x-auto border border-t-0 border-neutral-200 bg-white">
      <Table className="min-w-[1400px] text-xs">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {headers.map((h, i) => (
              <TableHead
                key={h || `blank-${i}`}
                className="px-2 py-2 text-[11px] font-semibold whitespace-nowrap text-neutral-600"
              >
                {i === 1 ? (
                  <span className="inline-flex items-center gap-1">
                    {h}
                    <ArrowUpDown className="size-3 text-neutral-400" />
                  </span>
                ) : (
                  h
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={headers.length}
                className="py-8 text-center text-xs text-neutral-500"
              >
                No claims match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.lineId} className="align-top">
                <TableCell className="px-2 py-2.5">
                  <div className="flex flex-col gap-1.5">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Link
                            href={`/claims/${encodeURIComponent(row.lineId)}`}
                            className="text-emerald-700 hover:text-emerald-900"
                            aria-label={`Open ${row.lineId}`}
                          >
                            <MoveRight className="size-4" />
                          </Link>
                        }
                      />
                      <TooltipContent>Open claim</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Link
                            href={`/claims/${encodeURIComponent(row.lineId)}`}
                            className="text-emerald-700 hover:text-emerald-900"
                            aria-label={`Edit ${row.lineId}`}
                          >
                            <Pencil className="size-4" />
                          </Link>
                        }
                      />
                      <TooltipContent>Edit claim</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Link
                            href={`/claims/${encodeURIComponent(row.lineId)}`}
                            className="text-emerald-700 hover:text-emerald-900"
                            aria-label={`View ${row.lineId}`}
                          >
                            <Eye className="size-4" />
                          </Link>
                        }
                      />
                      <TooltipContent>View claim</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2.5 font-bold whitespace-nowrap text-emerald-800">
                  <Link
                    href={`/claims/${encodeURIComponent(row.lineId)}`}
                    className="hover:underline"
                  >
                    {row.lineId.split("-")[0]}-
                    <br />
                    {row.lineId.split("-")[1]}
                  </Link>
                </TableCell>
                <TableCell className="px-2 py-2.5">{row.parentId}</TableCell>
                <TableCell className="px-2 py-2.5 whitespace-nowrap">
                  {row.supplierClaimType}
                </TableCell>
                <TableCell className="px-2 py-2.5 whitespace-nowrap">
                  {row.transactionType}
                </TableCell>
                <TableCell className="px-2 py-2.5 whitespace-nowrap">
                  {row.fiscalYear.split("-")[0]}-
                  <br />
                  {row.fiscalYear.split("-")[1]}
                </TableCell>
                <TableCell className="px-2 py-2.5 whitespace-nowrap">
                  {row.coc}
                </TableCell>
                <TableCell className="px-2 py-2.5 text-center">
                  {row.confidential && (
                    <CircleDot className="inline size-4 text-red-500" />
                  )}
                </TableCell>
                <TableCell className="px-2 py-2.5 whitespace-normal uppercase">
                  {row.vendorName}
                </TableCell>
                <TableCell className="max-w-44 px-2 py-2.5 whitespace-normal">
                  {row.description}{" "}
                  <Link
                    href={`/claims/${encodeURIComponent(row.lineId)}`}
                    className="font-medium text-red-500 hover:underline"
                  >
                    more
                  </Link>
                </TableCell>
                <TableCell
                  className={cn(
                    "px-2 py-2.5 whitespace-nowrap",
                    row.reportingNegative && "text-red-500"
                  )}
                >
                  {row.reportingValue}
                </TableCell>
                <TableCell className="px-2 py-2.5 whitespace-nowrap">
                  {row.status}
                </TableCell>
                <TableCell className="px-2 py-2.5 whitespace-nowrap">
                  {row.createdOn.split(" ").slice(0, 3).join(" ")}
                  <br />
                  {row.createdOn.split(" ").slice(3).join(" ")}
                </TableCell>
                <TableCell className="px-2 py-2.5 whitespace-nowrap">
                  {row.implementationDate}
                </TableCell>
                <TableCell className="px-2 py-2.5 text-center">
                  {row.isReserve ? (
                    <CircleCheck className="inline size-4 text-emerald-600" />
                  ) : (
                    <CircleDot className="inline size-4 text-red-500" />
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function useHomeFiltersState() {
  return useState<HomeFilters>(emptyHomeFilters)
}
