"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export type WorkflowChange = { reference: string | null; seq: number }

type Store = {
  pendingApprovals: PendingApprovalItem[]
  myApprovals: ApprovalDecisionRow[]
  notifications: NotificationItem[]
  unreadCount: number
  lastChange: WorkflowChange
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
  const routerRef = useRef(router)
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([])
  const [myApprovals, setMyApprovals] = useState<ApprovalDecisionRow[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [lastChange, setLastChange] = useState<WorkflowChange>({ reference: null, seq: 0 })
  const loadRef = useRef<() => void>(() => {})

  const refresh = useCallback(() => loadRef.current(), [])

  useEffect(() => {
    routerRef.current = router
  }, [router])

  useEffect(() => {
    let cancelled = false
    let inFlight = false
    let queued = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const fetchAll = async () => {
      try {
        const [pendingRes, decidedRes, notificationsRes] = await Promise.all([
          fetch(backendPath("/approvals/pending"), { cache: "no-store" }),
          fetch(backendPath("/approvals/decided"), { cache: "no-store" }),
          fetch(backendPath("/notifications"), { cache: "no-store" }),
        ])
        if (pendingRes.status === 401) {
          if (!cancelled) routerRef.current.refresh()
          return
        }
        if (cancelled) return
        if (pendingRes.ok) {
          setPendingApprovals((await pendingRes.json()) as PendingApprovalItem[])
        }
        if (decidedRes.ok) {
          setMyApprovals((await decidedRes.json()) as ApprovalDecisionRow[])
        }
        if (notificationsRes.ok) {
          const body = (await notificationsRes.json()) as { items: NotificationItem[] }
          setNotifications(body.items ?? [])
        }
      } catch {
        /* backend unavailable: keep the last known data */
      }
    }

    const load = async () => {
      if (inFlight) {
        queued = true
        return
      }
      inFlight = true
      await fetchAll()
      inFlight = false
      if (queued && !cancelled) {
        queued = false
        void load()
      }
    }

    const schedule = () => {
      if (cancelled) return
      clearTimeout(timer)
      timer = setTimeout(() => void load(), 300)
    }

    loadRef.current = () => void load()
    void load()

    const source = new EventSource(backendPath("/events/stream"))
    let dropped = false
    source.addEventListener("notification", schedule)
    source.addEventListener("workflow", (event: MessageEvent) => {
      const data = safeParse(event.data)
      const reference = typeof data?.reference === "string" ? data.reference : null
      setLastChange((prev) => ({ reference, seq: prev.seq + 1 }))
      schedule()
    })
    source.onerror = () => {
      dropped = true
    }
    source.onopen = () => {
      if (dropped) {
        dropped = false
        schedule()
      }
    }

    return () => {
      cancelled = true
      clearTimeout(timer)
      source.close()
    }
  }, [])

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
      lastChange,
      refresh,
      completeTask,
      markAllNotificationsRead,
    }
  }, [
    pendingApprovals,
    myApprovals,
    notifications,
    lastChange,
    refresh,
    completeTask,
    markAllNotificationsRead,
  ])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function safeParse(text: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(text)
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export function useAftermarketStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error("useAftermarketStore must be used inside AftermarketStoreProvider")
  return s
}
