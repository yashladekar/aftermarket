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

type Store = {
  pendingApprovals: PendingApprovalItem[]
  myApprovals: ApprovalDecisionRow[]
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
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([])
  const [myApprovals, setMyApprovals] = useState<ApprovalDecisionRow[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [pendingRes, decidedRes, notificationsRes] =
          await Promise.all([
            fetch(backendPath("/approvals/pending")),
            fetch(backendPath("/approvals/decided")),
            fetch(backendPath("/notifications")),
          ])
        if (pendingRes.status === 401) {
          if (!cancelled) router.refresh()
          return
        }
        if (pendingRes.ok) {
          const rows = (await pendingRes.json()) as PendingApprovalItem[]
          if (!cancelled) setPendingApprovals(rows ?? [])
        }
        if (decidedRes.ok) {
          const rows = (await decidedRes.json()) as ApprovalDecisionRow[]
          if (!cancelled) setMyApprovals(rows ?? [])
        }
        if (notificationsRes.ok) {
          const body = (await notificationsRes.json()) as {
            items: NotificationItem[]
          }
          if (!cancelled) setNotifications(body.items ?? [])
        }
      } catch {
        /* backend unavailable: keep empty */
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
    return {
      pendingApprovals,
      myApprovals,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      refresh,
      completeTask,
      markAllNotificationsRead,
    }
  }, [
    pendingApprovals,
    myApprovals,
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
