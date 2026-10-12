"use client"

import { useState } from "react"
import {
  Briefcase,
  Building,
  ChartColumn,
  ClipboardList,
  Database,
  ListTodo,
  NotebookTabs,
  PenLine,
  ChevronsLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export type CcrSidebarKey =
  | "queue"
  | "tasks"
  | "portfolio"
  | "drafts"
  | "forecasts"
  | "extraction"

const items: { key: CcrSidebarKey; label: string; icon: typeof Briefcase }[] = [
  { key: "queue", label: "Work Queue", icon: Briefcase },
  { key: "tasks", label: "Tasks", icon: ListTodo },
  { key: "portfolio", label: "View Supplier Portfolio", icon: Building },
  { key: "drafts", label: "Draft CCRs", icon: PenLine },
  { key: "forecasts", label: "Supplier Spend Forecasts", icon: ChartColumn },
  { key: "extraction", label: "Data Extraction", icon: Database },
]

export function CcrSidebar({
  active,
  onSelect,
}: {
  active: CcrSidebarKey
  onSelect?: (key: CcrSidebarKey) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col bg-white",
        collapsed ? "w-11" : "w-52"
      )}
    >
      <div className="flex items-center gap-2 bg-emerald-800 px-3 py-2 text-white">
        <ClipboardList className="size-4 shrink-0" />
        {!collapsed && (
          <span className="text-[13px] font-bold">Work Queue</span>
        )}
      </div>

      <nav className="flex flex-1 flex-col py-1">
        {items.slice(1).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect?.(item.key)}
            title={item.label}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 text-left text-[13px]",
              active === item.key
                ? "font-semibold text-emerald-900"
                : "text-neutral-700 hover:bg-neutral-100",
              collapsed && "justify-center px-0"
            )}
          >
            <item.icon className="size-4 shrink-0 text-neutral-500" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}

        {!collapsed && (
          <div className="mt-2 flex items-center gap-2 px-3 py-1 text-[11px] text-neutral-400">
            <NotebookTabs className="size-3.5" />
            <span>My views</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="mt-auto flex items-center justify-center py-2 text-neutral-500 hover:bg-neutral-100"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </button>
      </nav>
    </aside>
  )
}
