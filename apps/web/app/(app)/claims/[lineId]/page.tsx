"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleDot } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Textarea } from "@workspace/ui/components/textarea"
import { NeoHeader } from "@/components/neo/neo-header"
import { FieldError } from "@/components/neo/wizard-fields"
import { noteSchema, type NoteValues } from "@/lib/neo-schemas"
import { useNeoStore } from "@/lib/neo-store"
import { useApi } from "@/lib/neo-api"
import { cn } from "@workspace/ui/lib/utils"

const tabs = [
  "Summary",
  "Calculations",
  "CO2",
  "Inflation",
  "Parts",
  "Finance",
  "Approval Requests",
  "Attachments",
  "Tasks",
  "Notes",
  "Activity Log",
] as const

const phases = [
  "Creation",
  "Supplier Negotiations",
  "Approvals",
  "Awaiting Implementation",
  "Implemented",
  "Cancelled",
]

const activityLabels: Record<string, string> = {
  CLAIM_CREATED: "Claim created",
  WORKFLOW_STARTED: "Workflow started",
  TASK_APPROVED: "Approved",
  TASK_REJECTED: "Rejected",
  WORKFLOW_APPROVED: "Claim approved",
  WORKFLOW_REJECTED: "Claim rejected",
  EVENT_SUBMITTED: "Submitted",
  EVENT_MANAGER_APPROVAL_REQUESTED: "Sent to manager for approval",
  EVENT_MANAGER_REMINDER: "Manager reminded",
  EVENT_MANAGER_ESCALATION: "Manager escalation",
  EVENT_FINANCE_APPROVAL_REQUESTED: "Sent to finance for approval",
  EVENT_FINAL_OUTCOME: "Outcome recorded",
  BOOKING_CONFIRMED: "Implementation confirmed",
  NOTE_ADDED: "Note added",
  ATTACHMENT_ADDED: "Attachment added",
  RECONCILED: "Workflow state reconciled",
}

function activityLabel(action: string): string {
  return activityLabels[action] ?? action.replaceAll("_", " ")
}

function statusLabel(status: string): string {
  switch (status) {
    case "Draft":
      return "Draft"
    case "Forecast":
      return "Submitted"
    case "Awaiting Manager":
      return "Awaiting Manager Approval"
    case "Awaiting Finance":
      return "Awaiting Finance Approval"
    case "Completed":
      return "Approved"
    case "Rejected":
      return "Rejected"
    default:
      return status || "Draft"
  }
}

function phaseReached(status: string, index: number): boolean {
  const current = (() => {
    switch (status) {
      case "Draft":
        return 0
      case "Forecast":
        return 1
      case "Awaiting Manager":
      case "Awaiting Finance":
        return 2
      case "Completed":
        return 4
      case "Rejected":
        return 5
      default:
        return 0
    }
  })()
  if (status === "Rejected") {
    return index <= 2 || index === 5
  }
  return index <= current
}

function taskState(task: ClaimTaskItem): string {
  if (task.status === "Open") {
    return "Open"
  }
  if (task.decision === "APPROVED") {
    return "Approved"
  }
  if (task.decision === "REJECTED") {
    return "Rejected"
  }
  return "Completed"
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-4 flex items-center gap-1 text-sm font-bold text-emerald-900">
      <span className="text-[10px]">﹀</span> {children}
    </h3>
  )
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-neutral-800">{label}</p>
      <p className="mt-0.5 text-xs text-neutral-500">{value || "-"}</p>
    </div>
  )
}

type BackendNote = { id: string; note: string }
type BackendAttachment = {
  id: string
  fileName: string
  fileType: string
  description: string
}
type BackendActivity = {
  action: string
  description: string
  actorId?: string | null
  actorName?: string | null
  createdOn: string
}

type ClaimTaskItem = {
  taskId: string
  name: string
  taskKey: string
  status: string
  assigneeId?: string | null
  assigneeName?: string | null
  decision?: string | null
  createdOn?: string | null
  completedOn?: string | null
}

type ClaimDecisionItem = {
  taskId: string
  taskKey: string
  taskName: string
  decision: string
  comment?: string | null
  actorId?: string | null
  actorName?: string | null
  decidedOn?: string | null
}

export default function ClaimDetailPage() {
  const params = useParams()
  const router = useRouter()
  const lineId = decodeURIComponent(String(params.lineId ?? ""))
  const { claims, refresh, version } = useNeoStore()
  const { request } = useApi()
  const claim = claims.find((c) => c.lineId === lineId)
  const workflowStatus = claim?.status ?? ""
  const [tab, setTab] = useState<(typeof tabs)[number]>("Summary")
  const [notes, setNotes] = useState<string[]>([])
  const [backendNotes, setBackendNotes] = useState<BackendNote[]>([])
  const [attachments, setAttachments] = useState<BackendAttachment[]>([])
  const [activity, setActivity] = useState<BackendActivity[]>([])
  const [claimTasks, setClaimTasks] = useState<ClaimTaskItem[]>([])
  const [claimDecisions, setClaimDecisions] = useState<ClaimDecisionItem[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState("Other")
  const [fileDesc, setFileDesc] = useState("")
  const [tabError, setTabError] = useState<string | null>(null)
  const noteForm = useForm<NoteValues>({
    resolver: zodResolver(noteSchema) as never,
    defaultValues: { note: "" },
    mode: "onTouched",
  })

  useEffect(() => {
    if (!lineId) return
    let cancelled = false
    const encoded = encodeURIComponent(lineId)
    const load = async () => {
      try {
        const [n, at, a, t, d] = await Promise.all([
          request<BackendNote[]>(`/api/claims/${encoded}/notes`),
          request<BackendAttachment[]>(`/api/claims/${encoded}/attachments`),
          request<BackendActivity[]>(`/api/claims/${encoded}/audit`),
          request<ClaimTaskItem[]>(`/api/claims/${encoded}/tasks`),
          request<ClaimDecisionItem[]>(`/api/claims/${encoded}/decisions`),
        ])
        if (!cancelled) {
          setBackendNotes(n ?? [])
          setAttachments(at ?? [])
          setActivity(a ?? [])
          setClaimTasks(t ?? [])
          setClaimDecisions(d ?? [])
        }
      } catch {
        /* backend unavailable: local fallback stays */
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lineId, request, workflowStatus, version])
  if (!claim) {
    return (
      <div className="flex min-h-svh flex-col bg-neutral-100">
        <NeoHeader active="home" />
        <main className="flex-1 px-6 py-10 text-center">
          <p className="text-sm text-neutral-600">
            Claim {lineId} not found.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </main>
      </div>
    )
  }

  const label = claim.supplierClaimType || "Risk"
  const financeTask = claimTasks.find((task) => task.taskKey?.includes("finance"))
  const financeStatus = financeTask
    ? financeTask.status === "Open"
      ? "Pending"
      : financeTask.decision === "REJECTED"
        ? "Rejected"
        : "Approved"
    : "Not Required"

  const upload = async () => {
    if (!file) return
    setTabError(null)
    const form = new FormData()
    form.append("file", file)
    form.append("fileType", fileType)
    form.append("description", fileDesc)
    try {
      const saved = await request<BackendAttachment>(
        `/api/claims/${encodeURIComponent(lineId)}/attachments`,
        { method: "POST", body: form }
      )
      setAttachments((a) => [...a, saved])
      setFile(null)
      setFileDesc("")
      refresh()
    } catch (e) {
      setTabError(e instanceof Error ? e.message : "Upload failed")
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-neutral-100">
      <NeoHeader active="home" />

      <div className="flex items-center justify-between bg-emerald-800 px-6 py-2.5 text-white">
        <h1 className="text-lg font-semibold">
          {label} - {claim.lineId}
        </h1>
        <div className="flex gap-2">
          <Link
            href="/create-claim"
            className="rounded border border-white/60 px-2 py-1 text-[11px] font-semibold hover:bg-white/10"
          >
            UPDATE CLAIM
          </Link>
          <Link
            href={`/mandate-request?claim=${encodeURIComponent(claim.lineId)}`}
            className="rounded border border-white/60 px-2 py-1 text-[11px] font-semibold hover:bg-white/10"
          >
            REQUEST FOR MANDATE
          </Link>
          <button
            type="button"
            className="rounded border border-white/60 px-2 py-1 text-[11px] font-semibold hover:bg-white/10"
          >
            BULK UPLOAD PARTS
          </button>
          <button
            type="button"
            className="rounded border border-white/60 px-2 py-1 text-[11px] font-semibold hover:bg-white/10"
          >
            •••
          </button>
        </div>
      </div>

      <nav className="flex gap-4 overflow-x-auto border-b border-neutral-200 bg-white px-6 text-xs">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap py-2",
              t === tab
                ? "rounded bg-emerald-800 px-2 font-semibold text-white"
                : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="flex-1 px-6 py-4">
        <div className="rounded bg-white px-6 py-5 shadow-sm">
          {tab === "Summary" && (
            <div>
              <p className="text-[11px] text-neutral-500">Phase</p>
              <div className="mt-2 mb-1 flex items-center">
                {phases.map((p, i) => (
                  <div key={p} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "size-2 rotate-45 border border-emerald-800",
                          phaseReached(claim.status, i) && "bg-emerald-800"
                        )}
                      />
                      <span className="mt-1 text-[10px] whitespace-nowrap text-neutral-500">
                        {p}
                      </span>
                    </div>
                    {i < phases.length - 1 && (
                      <span
                        className={cn(
                          "mx-1 mb-5 h-0.5 flex-1",
                          phaseReached(claim.status, i) &&
                            phaseReached(claim.status, i + 1)
                            ? "bg-emerald-800"
                            : "bg-neutral-200"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-x-10">
                <div>
                  <p className="text-[11px] font-bold text-neutral-800">
                    Workflow Status
                  </p>
                  <p className="text-xs text-neutral-500">
                    {statusLabel(claim.status)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-neutral-800">
                    Current Step
                  </p>
                  <p className="text-xs text-neutral-500">
                    {claimTasks.find((t) => t.status === "Open")?.name ??
                      "No open task"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-neutral-800">
                    Finance Status
                  </p>
                  <p className="text-xs text-neutral-500">{financeStatus}</p>
                </div>
              </div>

              <SectionTitle>Core Data</SectionTitle>
              <div className="mt-2 grid grid-cols-2 gap-x-10 gap-y-3">
                <Kv label="Buyer Code" value={claim.buyerCode} />
                <Kv label="Buyer Name" value={claim.buyerName} />
                <Kv label="PM Code" value={claim.pmCode} />
                <Kv label="PM Name" value={claim.pmName} />
              </div>

              <SectionTitle>Claim Details</SectionTitle>
              <div className="mt-2 grid grid-cols-2 gap-x-10 gap-y-3">
                <Kv label="Supplier Claim Type" value={label} />
                <div>
                  <p className="text-[11px] font-bold text-neutral-800">
                    Confidential?
                  </p>
                  <p className="mt-0.5">
                    <CircleDot className="size-4 text-red-500" />
                  </p>
                </div>
                <Kv label="Fiscal Year" value={claim.fiscalYear} />
                <Kv label="Method of Notification" value="None" />
              </div>

              <SectionTitle>Vendor Details</SectionTitle>
              <div className="mt-2 grid grid-cols-1 gap-y-3">
                <Kv label="Vendor ⓘ" value={claim.vendorCode} />
                <Kv label="DT2 Vendor ⓘ" value="-" />
              </div>

              <SectionTitle>Basic Details</SectionTitle>
              <div className="mt-2 grid grid-cols-3 gap-x-10 gap-y-3">
                <Kv label="Transaction Type" value={claim.transactionType} />
                <Kv label="Effective Date" value={claim.implementationDate} />
                <Kv label="Transaction Type Breakdown" value="-" />
                <Kv label="Transaction Drivers" value="-" />
              </div>
            </div>
          )}

          {tab === "Calculations" && (
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              <Kv label="Reporting Value (£)" value={claim.reportingValue} />
              <Kv label="Status" value={claim.status} />
              <Kv label="Fiscal Year" value={claim.fiscalYear} />
              <Kv label="Implementation Date" value={claim.implementationDate} />
            </div>
          )}

          {tab === "CO2" && (
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              <Kv label="Co2e Start Position (kg)" value="-" />
              <Kv label="Co2e End Position (kg)" value="-" />
              <Kv label="Co2e Delta (kg)" value="-" />
              <Kv label="Co2e Change Date" value="-" />
            </div>
          )}

          {tab === "Inflation" && (
            <p className="text-xs text-neutral-500">
              No inflation records for this claim.
            </p>
          )}

          {tab === "Parts" && (
            <p className="text-xs text-neutral-500">
              No part details captured for this claim yet. Use Bulk Upload
              Parts to add them.
            </p>
          )}

          {tab === "Finance" && (
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              <Kv label="Currency" value="USD" />
              <Kv label="Budget Exchange Rate" value="1.27" />
              <Kv label="Annual Forecast (£)" value={claim.reportingValue} />
              <Kv label="Calendarised Forecast (£)" value={claim.reportingValue} />
            </div>
          )}

          {tab === "Approval Requests" && (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Approval Step</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Decided By</TableHead>
                    <TableHead>Decided On</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claimDecisions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-4 text-center text-xs text-neutral-500">
                        No approvals recorded for this claim yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {claimDecisions.map((d) => (
                    <TableRow key={d.taskId}>
                      <TableCell className="font-semibold">
                        {d.taskName}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-bold",
                            d.decision === "APPROVED"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {d.decision}
                        </span>
                      </TableCell>
                      <TableCell>{d.actorName ?? d.actorId ?? "—"}</TableCell>
                      <TableCell>{fmt(d.decidedOn)}</TableCell>
                      <TableCell className="whitespace-normal">
                        {d.comment || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {tab === "Attachments" && (
            <div>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <p className="mb-1 text-[11px] font-bold text-neutral-700">
                    File
                  </p>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="text-xs text-neutral-600"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-bold text-neutral-700">
                    File Type
                  </p>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="h-8 rounded border border-neutral-300 px-2 text-xs"
                  >
                    {[
                      "Email from Supplier",
                      "Quote",
                      "Purchase Order",
                      "Letter from Supplier",
                      "NDA",
                      "Other",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-[11px] font-bold text-neutral-700">
                    Description
                  </p>
                  <input
                    value={fileDesc}
                    onChange={(e) => setFileDesc(e.target.value)}
                    placeholder="Description (max 2000)"
                    maxLength={2000}
                    className="h-8 w-full rounded border border-neutral-300 px-2 text-xs"
                  />
                </div>
                <Button size="sm" type="button" onClick={upload} disabled={!file}>
                  Upload
                </Button>
              </div>
              {tabError && (
                <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {tabError}
                </p>
              )}
              <div className="mt-3 overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>File Type</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attachments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="py-4 text-center text-xs text-neutral-500">
                          No items available
                        </TableCell>
                      </TableRow>
                    )}
                    {attachments.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.fileName}</TableCell>
                        <TableCell>{d.fileType}</TableCell>
                        <TableCell>{d.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {tab === "Tasks" && (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Completed On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claimTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-4 text-center text-xs text-neutral-500">
                        No workflow tasks for this claim yet. Submit the claim to start approvals.
                      </TableCell>
                    </TableRow>
                  )}
                  {claimTasks.map((t) => (
                    <TableRow key={t.taskId}>
                      <TableCell className="font-semibold">{t.name}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-bold",
                            taskState(t) === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : taskState(t) === "Open"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-100 text-emerald-900"
                          )}
                        >
                          {taskState(t).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>{t.assigneeName ?? "—"}</TableCell>
                      <TableCell>{fmt(t.createdOn)}</TableCell>
                      <TableCell>{fmt(t.completedOn)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {tab === "Notes" && (
            <div>
              <form
                className="flex gap-2"
                onSubmit={noteForm.handleSubmit(async (v) => {
                  const text = v.note.trim()
                  try {
                    const saved = await request<BackendNote>(
                      `/api/claims/${encodeURIComponent(lineId)}/notes`,
                      { method: "POST", body: JSON.stringify({ note: text }) }
                    )
                    setBackendNotes((n) => [...n, saved])
                    refresh()
                  } catch {
                    setNotes((n) => [text, ...n])
                  }
                  noteForm.reset()
                })}
              >
                <div className="flex-1">
                  <Textarea
                    {...noteForm.register("note")}
                    placeholder="Add a note (max 1000 characters)"
                    maxLength={1000}
                    className="text-xs"
                    aria-invalid={!!noteForm.formState.errors.note}
                  />
                  <FieldError
                    message={noteForm.formState.errors.note?.message}
                  />
                </div>
                <Button size="sm" type="submit">
                  Add
                </Button>
              </form>
              <ul className="mt-3 space-y-2">
                {backendNotes.length === 0 && notes.length === 0 && (
                  <li className="text-xs text-neutral-500">No notes yet.</li>
                )}
                {backendNotes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded border border-neutral-200 px-3 py-2 text-xs"
                  >
                    {n.note}
                  </li>
                ))}
                {notes.map((n, i) => (
                  <li
                    key={`local-${i}`}
                    className="rounded border border-neutral-200 px-3 py-2 text-xs"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === "Activity Log" && (
            <ul className="space-y-2 text-xs text-neutral-600">
              {activity.length === 0 && (
                <>
                  <li>Created on {claim.createdOn}</li>
                  <li>Implementation date {claim.implementationDate}</li>
                </>
              )}
              {activity.map((a) => (
                <li
                  key={`${a.action}-${a.createdOn}`}
                  className="flex flex-wrap items-baseline gap-1.5"
                >
                  <span className="font-semibold text-neutral-800">
                    {activityLabel(a.action)}
                  </span>
                  {a.description &&
                    a.description !== a.action &&
                    a.description !== activityLabel(a.action) &&
                    !/^[A-Z0-9_]+$/.test(a.description) && (
                      <span className="text-neutral-500">· {a.description}</span>
                    )}
                  {a.actorName && (
                    <span className="text-neutral-400">· {a.actorName}</span>
                  )}
                  <span className="text-neutral-400">· {fmt(a.createdOn)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
