"use client"

import { Download, ListFilter, RotateCcw, Search } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { filterOptions } from "@/lib/neo-data"
import { cn } from "@workspace/ui/lib/utils"
import {
  emptyHomeFilters,
  type HomeFilters,
} from "@/components/neo/neo-claims-table"

function FilterSelect({
  label,
  value,
  onChange,
  options,
  wide,
}: {
  label: string
  value: string
  onChange: (v: string | null) => void
  options: string[]
  wide?: boolean
}) {
  return (
    <div className="flex items-center gap-1 text-[11px]">
      <span className="font-semibold whitespace-nowrap text-neutral-500 uppercase">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            "h-7 flex-1 border-0 bg-transparent px-1 text-[11px] shadow-none",
            wide && "min-w-44"
          )}
        >
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__any">Any</SelectItem>
          {options
            .filter((o) => o !== "Any")
            .map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function NeoFilters({
  filters,
  onChange,
  claims,
}: {
  filters: HomeFilters
  onChange: (f: HomeFilters) => void
  claims: { createdOn: string; implementationDate: string }[]
}) {
  const set = (key: keyof HomeFilters) => (v: string | null) =>
    onChange({ ...filters, [key]: v ?? "__any" })

  const createdOptions = Array.from(
    new Set(claims.map((c) => c.createdOn.split(" ").slice(0, 3).join(" ")))
  )
  const implOptions = Array.from(
    new Set(claims.map((c) => c.implementationDate))
  )

  return (
    <div className="border border-neutral-200 bg-white px-3 py-2">
      <div className="grid grid-cols-2 items-center gap-x-3 gap-y-1.5 lg:grid-cols-4">
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-neutral-400" />
            <Input
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              placeholder="Search Risk Opportunities"
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

        <FilterSelect
          label="SUPPLIER CLAIM TYPE |"
          value={filters.claimType}
          onChange={set("claimType")}
          options={filterOptions.supplierClaimType}
          wide
        />
        <FilterSelect
          label="CREATED ON |"
          value={filters.createdOn}
          onChange={set("createdOn")}
          options={createdOptions}
          wide
        />
        <div className="flex items-center gap-1">
          <FilterSelect
            label="FISCAL YEAR |"
            value={filters.fiscalYear}
            onChange={set("fiscalYear")}
            options={filterOptions.fiscalYear}
          />
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="outline"
              className="size-7"
              title="Export"
              type="button"
            >
              <Download className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              className="size-7"
              title="Column chooser"
              type="button"
            >
              <ListFilter className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              className="size-7"
              title="Reset filters"
              type="button"
              onClick={() => onChange(emptyHomeFilters)}
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>
        </div>

        <FilterSelect
          label="BUYER CODE |"
          value={filters.buyerCode}
          onChange={set("buyerCode")}
          options={filterOptions.buyerCode}
        />
        <FilterSelect
          label="PM CODE |"
          value={filters.pmCode}
          onChange={set("pmCode")}
          options={filterOptions.pmCode}
        />
        <FilterSelect
          label="COC |"
          value={filters.coc}
          onChange={set("coc")}
          options={filterOptions.coc}
        />
        <FilterSelect
          label="VENDOR NAME |"
          value={filters.vendorName}
          onChange={set("vendorName")}
          options={filterOptions.vendorName}
          wide
        />

        <FilterSelect
          label="IMPLEMENTATION DATE |"
          value={filters.implementationDate}
          onChange={set("implementationDate")}
          options={implOptions}
        />
        <FilterSelect
          label="STATUS |"
          value={filters.status}
          onChange={set("status")}
          options={filterOptions.status}
        />
        <FilterSelect
          label="IS RESERVE |"
          value={filters.isReserve}
          onChange={set("isReserve")}
          options={filterOptions.isReserve}
        />
      </div>
    </div>
  )
}
