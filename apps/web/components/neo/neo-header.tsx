"use client"

import Link from "next/link"
import { Bell, ChevronDown, House, ListTodo, Stamp, Network } from "lucide-react"
import { logoutAction } from "@/app/actions/auth"
import { useNeoSession } from "@/components/neo/session-provider"
import { cn } from "@workspace/ui/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useNeoStore } from "@/lib/neo-store"

const tabs = [
  { key: "home", label: "HOME", icon: House, href: "/" },
  { key: "tasks", label: "TASKS", icon: ListTodo, href: "/tasks" },
  {
    key: "approval",
    label: "APPROVAL REQUESTS",
    icon: Stamp,
    href: "/approval-requests",
  },
] as const

export function NeoHeader({ active }: { active?: string }) {
  const current = active ?? "home"
  const session = useNeoSession()
  const { notifications, unreadCount, markAllNotificationsRead } = useNeoStore()
  const userName = session?.name ?? "Buyer Officer"
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <header className="bg-white">
      <div className="flex items-stretch justify-between border-b border-neutral-200 px-6">
        <nav className="flex items-stretch">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-5 py-2 text-[11px] font-semibold tracking-wide",
                current === tab.key
                  ? "bg-black text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-black"
              )}
            >
              <tab.icon className="size-4" strokeWidth={1.75} />
              {tab.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex flex-col items-center justify-center gap-1 px-5 py-2 text-[11px] font-semibold tracking-wide text-neutral-500 outline-none hover:bg-neutral-100 hover:text-black data-[popup-open]:bg-neutral-100 data-[popup-open]:text-black">
              <Network className="size-4" strokeWidth={1.75} />
              <span className="flex items-center gap-0.5">
                MANAGEMENT
                <ChevronDown className="size-3" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>User Management</DropdownMenuItem>
              <DropdownMenuItem>Master Data</DropdownMenuItem>
              <DropdownMenuItem>Reports</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2 py-2 text-xs text-neutral-600">
          <span className="font-medium">
            Material Cost Risk &amp; Opportunity Lifecycle
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative flex size-6 items-center justify-center rounded-full border border-neutral-300 outline-none hover:bg-neutral-100"
              aria-label="Notifications"
            >
              <Bell className="size-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-[11px] font-bold text-neutral-700">
                  NOTIFICATIONS
                </span>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-emerald-800 hover:underline"
                  onClick={() => markAllNotificationsRead()}
                >
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 && (
                <p className="px-2 py-3 text-xs text-neutral-500">
                  No notifications yet.
                </p>
              )}
              {notifications.slice(0, 10).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start gap-0.5"
                >
                  <span className="text-xs font-semibold text-neutral-900">
                    {n.title}
                  </span>
                  <span className="text-[11px] whitespace-normal text-neutral-500">
                    {n.body}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-6 items-center justify-center rounded-full border border-neutral-300 text-[10px] font-semibold outline-none hover:bg-neutral-100"
              aria-label="Account"
            >
              {initials || "BO"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold text-neutral-900">
                  {userName}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {session?.email ?? ""}
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => {
                  logoutAction().catch(() => {})
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
