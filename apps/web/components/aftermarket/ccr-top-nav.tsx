"use client"

import Link from "next/link"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { useAftermarketSession } from "@/components/aftermarket/session-provider"
import { cn } from "@workspace/ui/lib/utils"

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
          <span className="cursor-pointer text-neutral-500 hover:text-neutral-900">
            ALL REQUESTS
          </span>
          <span className="cursor-pointer text-neutral-500 hover:text-neutral-900">
            MANAGEMENT
          </span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* <span className="hidden max-w-64 truncate text-[13px] font-medium text-neutral-700 lg:block">
            Aftermarket Commercial Change Manage...
          </span> */}
          <ChevronDown className="size-3.5 text-neutral-500" />
          <span
            className="flex size-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-700"
            title={userName}
          >
            {initials || "DU"}
          </span>
        </div>
      </div>
    </header>
  )
}
