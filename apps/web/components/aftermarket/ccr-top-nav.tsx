"use client"

import Link from "next/link"
import Image from "next/image"
import { Bell, ChevronDown } from "lucide-react"
import { logoutAction } from "@/app/actions/auth"
import { useAftermarketSession } from "@/components/aftermarket/session-provider"
import { useAftermarketStore } from "@/lib/aftermarket-store"
import { cn } from "@workspace/ui/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

function BrandMark() {
  return (
    <Image
      src="/JLR_Primary_logo_BLK.jpg"
      alt="JLR"
      width={35}
      height={30}
      className="h-7 w-9 object-contain"
    />
  )
}

export function CcrTopNav({ active = "home" }: { active?: string }) {
  const session = useAftermarketSession()
  const { notifications, unreadCount, markAllNotificationsRead } = useAftermarketStore()
  const userName = session?.name ?? "Demo User"
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="bg-white">
      <div className="flex items-center gap-4 border-b border-neutral-200 px-4 py-2">
        <BrandMark />
        <nav className="flex items-center gap-6 text-[13px] font-semibold tracking-wide">
          <Link
            href="/"
            className={cn(
              "border-b-2 pb-1",
              active === "home"
                ? "border-emerald-800 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            )}
          >
            HOME
          </Link>
          <Link
            href="/all-requests"
            className={cn(
              "border-b-2 pb-1",
              active === "all-requests"
                ? "border-emerald-800 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            )}
          >
            ALL REQUESTS
          </Link>
          <span className="cursor-pointer text-neutral-500 hover:text-neutral-900">
            MANAGEMENT
          </span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ChevronDown className="size-3.5 text-neutral-500" />
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
                <span className="text-[11px] font-bold text-neutral-700">NOTIFICATIONS</span>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-emerald-800 hover:underline"
                  onClick={() => markAllNotificationsRead()}
                >
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 && (
                <p className="px-2 py-3 text-xs text-neutral-500">No notifications yet.</p>
              )}
              {notifications.slice(0, 10).map((n) => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-semibold text-neutral-900">{n.title}</span>
                  <span className="text-[11px] whitespace-normal text-neutral-500">{n.body}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-700 outline-none hover:bg-neutral-300"
              aria-label="Account"
              title={userName}
            >
              {initials || "DU"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold text-neutral-900">{userName}</p>
                <p className="text-[11px] text-neutral-500">{session?.email ?? ""}</p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-100"
                >
                  Sign out
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
