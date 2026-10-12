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

export default function TasksPage() {
  const { pendingApprovals, completeTask } = useNeoStore()
  const [query, setQuery] = useState("")
  const [requestType, setRequestType] = useState("__any")
  const [scope, setScope] = useState("all")
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = pendingApprovals.filter((t) => {
    if (scope === "action" && !t.canAct) return false
    if (scope === "awaiting" && t.canAct) return false
    if (requestType !== "__any" && t.requestType !== requestType) return false
    if (query) {
      const q = query.toLowerCase()
      const haystack = `${t.taskName} ${t.requestId ?? ""} ${t.description ?? ""} ${
        t.raisedByName ?? ""
      }`
      if (!haystack.toLowerCase().includes(q)) return false
    }
    return true
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
      setError(e instanceof Error ? e.message : "Failed to complete task")
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-neutral-100">
      <NeoHeader active="tasks" />

      <main className="flex-1 space-y-0 px-6 py-3">
        {error && (
          <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        )}
        <div className="border border-neutral-200 bg-white px-3 py-2">
          <div className="grid grid-cols-2 items-center gap-x-3 gap-y-1.5 lg:grid-cols-4">
            <form
              className="flex items-center gap-1.5"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Tasks"
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
              label="SHOW |"
              value={scope}
              onChange={(v) => setScope(v ?? "all")}
              options={["Action required", "Awaiting others"]}
            />
            <MiniSelect
              label="REQUEST TYPE |"
              value={requestType}
              onChange={(v) => setRequestType(v ?? "__any")}
              options={["Claim", "Mandate"]}
            />
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
                onClick={() => {
                  setQuery("")
                  setRequestType("__any")
                  setScope("all")
                }}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-t-0 border-neutral-200 bg-white">
          <Table className="min-w-[1200px] text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {[
                  "Task",
                  "Request ID",
                  "Request Type",
                  "Description",
                  "Vendor",
                  "Raised By",
                  "Created On",
                  "Status",
                  "Actions",
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
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="py-8 text-center text-xs text-neutral-500">
                    Nothing is waiting for a decision right now.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((t) => (
                  <TableRow key={t.taskId} className="align-top">
                    <TableCell className="max-w-64 px-2 py-2.5 whitespace-normal font-medium text-emerald-800">
                      {t.taskName}
                    </TableCell>
                    <TableCell className="px-2 py-2.5">{t.requestId ?? "—"}</TableCell>
                    <TableCell className="px-2 py-2.5">{t.requestType}</TableCell>
                    <TableCell className="max-w-72 px-2 py-2.5 whitespace-normal text-neutral-600">
                      {t.description ?? "—"}
                    </TableCell>
                    <TableCell className="px-2 py-2.5 uppercase">
                      {t.vendorName ?? "—"}
                    </TableCell>
                    <TableCell className="px-2 py-2.5">
                      {t.raisedByName ?? "—"}
                    </TableCell>
                    <TableCell className="px-2 py-2.5 whitespace-nowrap">
                      {fmt(t.createdOn)}
                    </TableCell>
                    <TableCell className="px-2 py-2.5 whitespace-nowrap">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-bold",
                          t.canAct
                            ? "bg-amber-100 text-amber-900"
                            : "bg-neutral-100 text-neutral-600"
                        )}
                      >
                        {t.canAct ? "ACTION REQUIRED" : "AWAITING APPROVAL"}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2.5 whitespace-nowrap">
                      {t.canAct ? (
                        <span className="flex gap-1">
                          <Button
                            size="sm"
                            className="h-6 bg-emerald-800 px-2 text-[11px] font-bold text-white hover:bg-emerald-700"
                            disabled={acting === t.taskId}
                            onClick={() => decide(t.taskId, "APPROVED")}
                          >
                            APPROVE
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 border-red-200 px-2 text-[11px] font-bold text-red-600 hover:bg-red-50"
                            disabled={acting === t.taskId}
                            onClick={() => decide(t.taskId, "REJECTED")}
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
