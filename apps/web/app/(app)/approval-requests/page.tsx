"use client"

import { useState } from "react"
import { Download, ListFilter, RotateCcw, Search } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
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
import { NeoHeader } from "@/components/neo/neo-header"
import { useNeoStore } from "@/lib/neo-store"
import { cn } from "@workspace/ui/lib/utils"

function MiniSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string | null) => void
  options: string[]
}) {
  return (
    <div className="flex items-center gap-1 text-[11px]">
      <span className="font-semibold whitespace-nowrap text-neutral-500 uppercase">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 flex-1 border-0 bg-transparent px-1 text-[11px] shadow-none">
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__any">Any</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function fmt(value?: string | null): string {
  if (!value) {
    return "—"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    .toUpperCase()
}

const initialFilters = { query: "", requestType: "__any", decision: "__any" }

export default function ApprovalRequestsPage() {
  const { pendingApprovals, myApprovals, completeTask } = useNeoStore()
  const [view, setView] = useState<"pending" | "mine">("pending")
  const [f, setF] = useState(initialFilters)
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const matchesSearch = (text: string) =>
    !f.query || text.toLowerCase().includes(f.query.toLowerCase())

  const pendingRows = pendingApprovals.filter((a) => {
    if (f.requestType !== "__any" && a.requestType !== f.requestType) return false
    return matchesSearch(
      `${a.requestId ?? ""} ${a.requestType} ${a.description ?? ""} ${
        a.vendorName ?? ""
      } ${a.raisedByName ?? ""} ${a.taskName}`
    )
  })

  const decidedRows = myApprovals.filter((a) => {
    if (f.requestType !== "__any" && a.requestType !== f.requestType) return false
    if (f.decision !== "__any" && a.decision !== f.decision) return false
    return matchesSearch(
      `${a.requestId} ${a.requestType} ${a.taskName} ${a.actorName ?? ""} ${
        a.comment ?? ""
      }`
    )
  })

  const decide = async (
    taskId: string,
    decision: "APPROVED" | "REJECTED"
  ) => {
    setActing(taskId)
    setError(null)
    try {
      await completeTask(taskId, decision)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete approval")
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-neutral-100">
      <NeoHeader active="approval" />

      <main className="flex-1 space-y-0 px-6 py-3">
        {error && (
          <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button className="h-8 flex-1 bg-emerald-800 text-[11px] font-bold text-white hover:bg-emerald-700">
            ⟳ CREATE AD-HOC APPROVAL REQUEST
          </Button>
          <Button className="h-8 flex-1 bg-emerald-800 text-[11px] font-bold text-white hover:bg-emerald-700">
            + CREATE TRADING DIVISION REQUEST
          </Button>
          <div className="ml-auto flex gap-2">
            <Button
              variant={view === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("pending")}
              className={cn(
                "h-8 text-[11px] font-bold",
                view === "pending"
                  ? "bg-emerald-800 text-white hover:bg-emerald-700"
                  : "border-emerald-700 text-emerald-700"
              )}
            >
              PENDING APPROVALS ({pendingApprovals.length})
            </Button>
            <Button
              variant={view === "mine" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("mine")}
              className={cn(
                "h-8 text-[11px] font-bold",
                view === "mine"
                  ? "bg-emerald-800 text-white hover:bg-emerald-700"
                  : "border-emerald-700 text-emerald-700"
              )}
            >
              MY APPROVALS ({myApprovals.length})
            </Button>
          </div>
        </div>

        <div className="mt-2 border border-neutral-200 bg-white px-3 py-2">
          <div className="grid grid-cols-2 items-center gap-x-3 gap-y-1.5 lg:grid-cols-4">
            <form
              className="flex items-center gap-1.5"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={f.query}
                  onChange={(e) => setF({ ...f, query: e.target.value })}
                  placeholder="Search Requests"
                  className="h-7 border-neutral-300 pl-7 text-[11px]"
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
            <MiniSelect
              label="REQUEST TYPE |"
              value={f.requestType}
              onChange={(v) => setF({ ...f, requestType: v ?? "__any" })}
              options={["Claim", "Mandate"]}
            />
            {view === "mine" && (
              <MiniSelect
                label="DECISION |"
                value={f.decision}
                onChange={(v) => setF({ ...f, decision: v ?? "__any" })}
                options={["APPROVED", "REJECTED"]}
              />
            )}
            <div className="flex items-center justify-end gap-1">
              <Button size="icon-sm" variant="outline" className="size-7" type="button" title="Export">
                <Download className="size-3.5" />
              </Button>
              <Button size="icon-sm" variant="outline" className="size-7" type="button" title="Column chooser">
                <ListFilter className="size-3.5" />
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                className="size-7"
                type="button"
                title="Reset"
                onClick={() => setF(initialFilters)}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-t-0 border-neutral-200 bg-white">
          {view === "pending" ? (
            <Table className="min-w-[1300px] text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "Request ID",
                    "Request Type",
                    "Description",
                    "Vendor",
                    "Value (£)",
                    "Raised By",
                    "Received",
                    "Approval Step",
                    "Action",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="px-2 py-2 text-[11px] font-semibold whitespace-nowrap text-neutral-600"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9} className="py-8 text-center text-xs text-neutral-500">
                      No approvals are waiting right now.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingRows.map((a) => (
                    <TableRow key={a.taskId} className="align-top">
                      <TableCell className="px-2 py-2.5 font-bold text-emerald-800">
                        {a.requestId ?? "—"}
                      </TableCell>
                      <TableCell className="px-2 py-2.5">{a.requestType}</TableCell>
                      <TableCell className="max-w-72 px-2 py-2.5 whitespace-normal text-neutral-600">
                        {a.description ?? "—"}
                      </TableCell>
                      <TableCell className="px-2 py-2.5 uppercase">
                        {a.vendorName ?? "—"}
                      </TableCell>
                      <TableCell className="px-2 py-2.5">{a.value ?? "—"}</TableCell>
                      <TableCell className="px-2 py-2.5">
                        {a.raisedByName ?? "—"}
                      </TableCell>
                      <TableCell className="px-2 py-2.5 whitespace-nowrap">
                        {fmt(a.createdOn)}
                      </TableCell>
                      <TableCell className="px-2 py-2.5 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {a.taskName}
                          {!a.canAct && (
                            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600">
                              WAITING
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-2.5 whitespace-nowrap">
                        {a.canAct ? (
                          <span className="flex gap-1">
                            <Button
                              size="sm"
                              className="h-6 bg-emerald-800 px-2 text-[11px] font-bold text-white hover:bg-emerald-700"
                              disabled={acting === a.taskId}
                              onClick={() => decide(a.taskId, "APPROVED")}
                            >
                              APPROVE
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 border-red-200 px-2 text-[11px] font-bold text-red-600 hover:bg-red-50"
                              disabled={acting === a.taskId}
                              onClick={() => decide(a.taskId, "REJECTED")}
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
          ) : (
            <Table className="min-w-[1100px] text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "Request ID",
                    "Request Type",
                    "Approval Step",
                    "Decision",
                    "Decided By",
                    "Decided On",
                    "Comment",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="px-2 py-2 text-[11px] font-semibold whitespace-nowrap text-neutral-600"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {decidedRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                      No approvals recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  decidedRows.map((a) => (
                    <TableRow key={a.taskId} className="align-top">
                      <TableCell className="px-2 py-2.5 font-bold text-emerald-800">
                        {a.requestId}
                      </TableCell>
                      <TableCell className="px-2 py-2.5">{a.requestType}</TableCell>
                      <TableCell className="px-2 py-2.5">{a.taskName}</TableCell>
                      <TableCell className="px-2 py-2.5">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-bold",
                            a.decision === "APPROVED"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {a.decision}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-2.5">
                        {a.actorName ?? a.actorId ?? "—"}
                      </TableCell>
                      <TableCell className="px-2 py-2.5 whitespace-nowrap">
                        {fmt(a.decidedOn)}
                      </TableCell>
                      <TableCell className="max-w-72 px-2 py-2.5 whitespace-normal text-neutral-600">
                        {a.comment || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  )
}
