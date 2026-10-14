"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { CcrTopNav } from "@/components/aftermarket/ccr-top-nav"
import { useCcrApi, type BackendCcrRow } from "@/lib/ccr-api"
import { fmtCcrDate } from "@/lib/ccr-data"
import { useAftermarketStore } from "@/lib/aftermarket-store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export default function AllRequestsPage() {
  const { request } = useCcrApi()
  const { pendingApprovals, completeTask, lastChange } = useAftermarketStore()
  const [rows, setRows] = useState<BackendCcrRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const pendingByRef = useMemo(() => {
    const map = new Map<string, (typeof pendingApprovals)[number]>()
    for (const task of pendingApprovals) {
      if (task.requestId && task.canAct && !map.has(task.requestId)) map.set(task.requestId, task)
    }
    return map
  }, [pendingApprovals])

  const decide = async (reference: string, decision: "APPROVED" | "REJECTED") => {
    const task = pendingByRef.get(reference)
    if (!task) return
    setActing(reference)
    setError(null)
    try {
      await completeTask(task.taskId, decision)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete approval")
    } finally {
      setActing(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await request<BackendCcrRow[]>("/ccrs")
        if (!cancelled) setRows(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load requests")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [request, pendingApprovals, lastChange.seq])

  return (
    <div className="min-h-svh bg-neutral-100">
      <CcrTopNav active="all-requests" />
      <main className="px-4 py-3">
        <h2 className="py-1 text-center text-[13px] font-bold text-neutral-800">All Requests</h2>
        {error && (
          <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>
        )}
        <div className="mb-2 text-[11px] text-neutral-500">
          Requests waiting for your decision show APPROVE and REJECT. A rejection by finance cancels the request.
        </div>
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <Table className="min-w-[1000px] text-[12px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["Reference", "Status", "Vendor Code", "Vendor Name", "CCR Type", "Date Requested", "Last Updated", "Priority", "Action"].map(
                  (h) => (
                    <TableHead key={h} className="px-2 py-2 font-semibold text-neutral-700">
                      {h}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="py-8 text-center text-neutral-500">
                    Loading requests…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="py-8 text-center text-neutral-500">
                    No requests to show.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.reference}>
                    <TableCell className="px-2 py-2 font-bold text-emerald-800">{row.reference}</TableCell>
                    <TableCell className="px-2 py-2">{row.status}</TableCell>
                    <TableCell className="px-2 py-2">{row.vendorCode}</TableCell>
                    <TableCell className="px-2 py-2 uppercase">{row.vendorName}</TableCell>
                    <TableCell className="px-2 py-2">{row.ccrType}</TableCell>
                    <TableCell className="px-2 py-2 whitespace-nowrap">{fmtCcrDate(row.dateRequested ?? "")}</TableCell>
                    <TableCell className="px-2 py-2 whitespace-nowrap">{fmtCcrDate(row.lastUpdated ?? "")}</TableCell>
                    <TableCell className="px-2 py-2">{row.priority}</TableCell>
                    <TableCell className="px-2 py-2 whitespace-nowrap">
                      {pendingByRef.has(row.reference) ? (
                        <span className="flex gap-1">
                          <Button
                            size="sm"
                            className="h-6 bg-emerald-800 px-2 text-[11px] font-bold text-white hover:bg-emerald-700"
                            disabled={acting === row.reference}
                            onClick={() => decide(row.reference, "APPROVED")}
                          >
                            APPROVE
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 border-red-200 px-2 text-[11px] font-bold text-red-600 hover:bg-red-50"
                            disabled={acting === row.reference}
                            onClick={() => decide(row.reference, "REJECTED")}
                          >
                            REJECT
                          </Button>
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}
