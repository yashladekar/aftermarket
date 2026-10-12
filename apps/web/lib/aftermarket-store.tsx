"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { backendPath } from "@/lib/constants"
import type { ClaimRow } from "@/lib/aftermarket-data"
import { claims as seedClaims } from "@/lib/aftermarket-data"

export type PendingApprovalItem = {
  taskId: string
  taskName: string
  taskKey: string
  requestId: string | null
  requestType: string
  description: string | null
  vendorName: string | null
  value: string | null
  raisedById: string | null
  raisedByName: string | null
  createdOn: string | null
  canAct: boolean
  candidateGroups: string[]
}

export type ApprovalDecisionRow = {
  taskId: string
  requestId: string
  requestType: string
  taskName: string
  decision: string
  comment: string | null
  actorId: string | null
  actorName: string | null
  decidedOn: string | null
}

export type ApprovalRow = {
  id: string
  requestType: string
  category: string
  level: string
  overall: string
  clearing: string
  doa: string
  valueVat: string
  initialTotal: string
  risks: string
  risksNegative?: boolean
  opportunities: string
  vendorCode: string
  vendorName: string
  coc: string
  raiser: string
  stakeholders: string
  daysPending: string
  openEnquiries: string
  actionOutside: string
  ageDate: string
}

export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  refType?: string | null
  refId?: string | null
  createdOn?: string
}

export type MandateClaim = {
  lineId: string
  supplierClaimType: string
  createdOn: string
  fiscalYear: string
  buyerCode: string
  buyerName: string
  pmCode: string
  pmName: string
  coc: string
  vendorCode: string
  vendorName: string
  dt2VendorCode: string
  description: string
  implementationDate: string
  reportingValue: string
  status: string
  nonStandard: string
  isReserve: boolean
}

export type MandateForm = {
  problem: string
  details: string
  fbp: string
  reds: string
  proposedChanges: string
  mainRisk: string
  category: string
  audit: string
  stakeholders: string
  ariba: string
}

export const initialMandateForm: MandateForm = {
  problem: "",
  details: "",
  fbp: "FBP Officer",
  reds: "",
  proposedChanges: "",
  mainRisk: "",
  category: "",
  audit: "",
  stakeholders: "",
  ariba: "",
}

type BackendClaim = {
  lineId: string
  parentId?: string
  supplierClaimType?: string
  transactionType?: string
  fiscalYear?: string
  coc?: string
  confidential?: boolean
  vendorName?: string
  vendorCode?: string
  description?: string
  reportingValue?: string
  reportingNegative?: boolean
  status?: string
  createdOn?: string
  implementationDate?: string
  reserve?: boolean
  buyerCode?: string
  buyerName?: string
  pmCode?: string
  pmName?: string
}

type BackendApproval = {
  id: string
  requestType?: string
  category?: string
  level?: string
  overall?: string
  clearing?: string
  doa?: string
  valueVat?: string
  initialTotal?: string
  risks?: string
  risksNegative?: boolean
  opportunities?: string
  vendorCode?: string
  vendorName?: string
  coc?: string
  raiser?: string
  stakeholders?: string
  daysPending?: string
  openEnquiries?: string
  actionOutside?: string
  ageDate?: string
}

function fmtDateTime(value?: string) {
  if (!value) return ""
  try {
    return new Date(value)
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
      .toUpperCase()
  } catch {
    return value
  }
}

function fmtDateOnly(value?: string) {
  if (!value) return ""
  if (!/\d{4}-\d{2}-\d{2}/.test(value)) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase()
}

function toClaimRow(c: BackendClaim): ClaimRow {
  return {
    lineId: c.lineId,
    parentId: c.parentId ?? "",
    supplierClaimType: c.supplierClaimType ?? "",
    transactionType: c.transactionType ?? "",
    fiscalYear: c.fiscalYear ?? "2024-2025",
    coc: c.coc ?? "ZZ COC Test",
    confidential: c.confidential ?? false,
    vendorName: c.vendorName ?? "",
    vendorCode: c.vendorCode ?? "",
    description: c.description ?? "",
    reportingValue: c.reportingValue ?? "0.0000",
    reportingNegative: c.reportingNegative,
    status: c.status ?? "Draft",
    createdOn: fmtDateTime(c.createdOn),
    implementationDate: fmtDateOnly(c.implementationDate),
    isReserve: c.reserve ?? false,
    buyerCode: c.buyerCode ?? "ZZ0X",
    buyerName: c.buyerName ?? "Buyer Officer",
    pmCode: c.pmCode ?? "ZZ1X",
    pmName: c.pmName ?? "Purchasing Manager",
  }
}

function toApprovalRow(a: BackendApproval): ApprovalRow {
  return {
    id: a.id,
    requestType: a.requestType ?? "Mandate",
    category: a.category ?? "",
    level: a.level ?? "Local Clearing House",
    overall: a.overall ?? "",
    clearing: a.clearing ?? "",
    doa: a.doa ?? "",
    valueVat: a.valueVat ?? "",
    initialTotal: a.initialTotal ?? "-",
    risks: a.risks ?? "",
    risksNegative: a.risksNegative,
    opportunities: a.opportunities ?? "",
    vendorCode: a.vendorCode ?? "",
    vendorName: a.vendorName ?? "",
    coc: a.coc ?? "",
    raiser: a.raiser ?? "",
    stakeholders: a.stakeholders ?? "",
    daysPending: a.daysPending ?? "0",
    openEnquiries: a.openEnquiries ?? "",
    actionOutside: a.actionOutside ?? "",
    ageDate: a.ageDate ?? "",
  }
}

type Store = {
  claims: ClaimRow[]
  addClaim: (c: ClaimRow) => void
  nextLineId: () => string
  pendingApprovals: PendingApprovalItem[]
  myApprovals: ApprovalDecisionRow[]
  version: number
  approvals: ApprovalRow[]
  addApproval: (a: ApprovalRow) => void
  notifications: NotificationItem[]
  unreadCount: number
  refresh: () => void
  completeTask: (
    taskId: string,
    decision: "APPROVED" | "REJECTED",
    comment?: string
  ) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
}

const Ctx = createContext<Store | null>(null)

export function AftermarketStoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [backendClaims, setBackendClaims] = useState<ClaimRow[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([])
  const [myApprovals, setMyApprovals] = useState<ApprovalDecisionRow[]>([])
  const [backendApprovals, setBackendApprovals] = useState<ApprovalRow[]>([])
  const [version, setVersion] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [extra, setExtra] = useState<ClaimRow[]>([])
  const [extraApprovals, setExtraApprovals] = useState<ApprovalRow[]>([])
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [claimsRes, pendingRes, decidedRes, approvalsRes, notificationsRes] =
          await Promise.all([
            fetch(backendPath("/claims")),
            fetch(backendPath("/approvals/pending")),
            fetch(backendPath("/approvals/decided")),
            fetch(backendPath("/mandates/approvals/view")),
            fetch(backendPath("/notifications")),
          ])
        if (claimsRes.status === 401) {
          if (!cancelled) router.refresh()
          return
        }
        if (claimsRes.ok) {
          const rows = (await claimsRes.json()) as BackendClaim[]
          if (!cancelled) setBackendClaims(rows.map(toClaimRow))
        }
        if (pendingRes.ok) {
          const rows = (await pendingRes.json()) as PendingApprovalItem[]
          if (!cancelled) setPendingApprovals(rows ?? [])
        }
        if (decidedRes.ok) {
          const rows = (await decidedRes.json()) as ApprovalDecisionRow[]
          if (!cancelled) setMyApprovals(rows ?? [])
        }
        if (approvalsRes.ok) {
          const rows = (await approvalsRes.json()) as BackendApproval[]
          if (!cancelled) setBackendApprovals(rows.map(toApprovalRow))
        }
        if (notificationsRes.ok) {
          const body = (await notificationsRes.json()) as {
            items: NotificationItem[]
          }
          if (!cancelled) setNotifications(body.items ?? [])
        }
        if (!cancelled) setVersion((v) => v + 1)
      } catch {
        /* backend unavailable: seed fallback stays */
      }
    }
    load()
    const timer = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [tick, router])

  const completeTask = useCallback(
    async (
      taskId: string,
      decision: "APPROVED" | "REJECTED",
      comment?: string
    ) => {
      const response = await fetch(backendPath(`/tasks/${taskId}/complete`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment: comment ?? null }),
      })
      if (!response.ok) throw new Error("Failed to complete task")
      refresh()
    },
    [refresh]
  )

  const markAllNotificationsRead = useCallback(async () => {
    await fetch(backendPath("/notifications/read-all"), { method: "POST" })
    setNotifications((items) => items.map((n) => ({ ...n, read: true })))
  }, [])

  const value = useMemo<Store>(() => {
    const claims = [...extra, ...backendClaims, ...seedClaims]
    return {
      claims,
      addClaim: (c) => setExtra((e) => [...e, c]),
      nextLineId: () => {
        const nums = claims.map((c) =>
          parseInt(c.lineId.split("-")[1] ?? "0", 10)
        )
        const max = Math.max(0, ...nums.filter((n) => Number.isFinite(n)))
        return `MCI-${String(max + 1).padStart(5, "0")}`
      },
      pendingApprovals,
      myApprovals,
      version,
      approvals: [...backendApprovals, ...extraApprovals],
      addApproval: (a) => setExtraApprovals((e) => [a, ...e]),
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      refresh,
      completeTask,
      markAllNotificationsRead,
    }
  }, [
    extra,
    extraApprovals,
    backendClaims,
    pendingApprovals,
    myApprovals,
    version,
    backendApprovals,
    notifications,
    refresh,
    completeTask,
    markAllNotificationsRead,
  ])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAftermarketStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error("useAftermarketStore must be used inside AftermarketStoreProvider")
  return s
}
