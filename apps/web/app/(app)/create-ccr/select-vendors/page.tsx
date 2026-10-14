"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RefreshCw, Save, SquarePen, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { CcrTopNav } from "@/components/aftermarket/ccr-top-nav"
import { FieldError } from "@/components/aftermarket/wizard-fields"
import {
  ccrWizardSteps,
  demoVendorCodes,
  preferredVendorCodes,
  type VendorOption,
} from "@/lib/ccr-data"
import { useCcrCatalog } from "@/lib/use-ccr-catalog"
import {
  selectVendorsDefaults,
  selectVendorsSchema,
  type CreateCcrTypeValues,
  type SelectVendorsInput,
  type SelectVendorsValues,
} from "@/lib/ccr-schemas"
import { cn } from "@workspace/ui/lib/utils"

function filterVendors(
  options: VendorOption[],
  search: string,
  all: boolean
): VendorOption[] {
  const pool = all
    ? options
    : options.filter((v) => preferredVendorCodes.includes(v.code))
  const q = search.trim().toLowerCase()
  if (q.length < 3) return []
  return pool.filter((v) =>
    `${v.code} - ${v.name}`.toLowerCase().includes(q)
  )
}

function SelectVendorsForm() {
  const router = useRouter()
  const params = useSearchParams()
  const kind = params.get("kind") === "alb" ? "alb" : "standard"
  const kindLabel: CreateCcrTypeValues["ccrKind"] = kind

  const form = useForm<SelectVendorsInput, unknown, SelectVendorsValues>({
    resolver: zodResolver(selectVendorsSchema),
    defaultValues: selectVendorsDefaults,
  })

  const vendorSearch = form.watch("vendorSearch") ?? ""
  const searchAll = form.watch("searchAllVendors") ?? false
  const selectedCodes = form.watch("selectedVendorCodes") ?? []
  const selected = new Set(selectedCodes)
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { vendors: vendorCatalog } = useCcrCatalog()

  const query = vendorSearch.trim()
  const matches = filterVendors(vendorCatalog, vendorSearch, searchAll)

  const demoVendors = vendorCatalog.filter((v) =>
    demoVendorCodes.includes(v.code)
  )

  const fillDemo = () => {
    form.setValue("selectedVendorCodes", [...demoVendorCodes], {
      shouldValidate: true,
    })
    form.setValue("vendorCode", demoVendorCodes[0] ?? "")
    form.setValue("vendorSearch", "", { shouldValidate: false })
    setOpen(false)
  }

  const selectedVendors = vendorCatalog.filter((v) =>
    selectedCodes.includes(v.code)
  )

  const pickVendor = (code: string) => {
    const current = form.getValues("selectedVendorCodes") ?? []
    if (current.includes(code)) return
    form.setValue("selectedVendorCodes", [...current, code], {
      shouldValidate: true,
    })
    form.setValue("vendorCode", code)
    form.setValue("vendorSearch", "", { shouldValidate: false })
    setOpen(false)
  }

  const removeVendor = (code: string) => {
    const current = form.getValues("selectedVendorCodes") ?? []
    form.setValue(
      "selectedVendorCodes",
      current.filter((c) => c !== code),
      { shouldValidate: true }
    )
  }

  const goNext = (draft: boolean) =>
    form.handleSubmit((values) => {
      const search = new URLSearchParams({
        kind,
        vendors: values.selectedVendorCodes.join(","),
      })
      if (draft) search.set("draft", "1")
      router.push(`/create-ccr/select-parts?${search.toString()}`)
    })()

  return (
    <div className="min-h-svh bg-white">
      <CcrTopNav active="home" />

      <main className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <h1 className="text-[15px] font-bold text-neutral-900">
            Create Commercial Change Request
            {kindLabel === "alb" ? " (ALB)" : ""}
          </h1>
          <RefreshCw className="size-3.5 text-neutral-700" />
        </div>

        <div className="mt-2">
          <div className="flex h-0.5 w-full">
            <span className="h-full w-1/7 bg-emerald-800" />
            <span className="h-full flex-1 bg-neutral-200" />
          </div>
          <ol className="mt-1 flex items-start text-[11px]">
            {ccrWizardSteps.map((step, i) => (
              <li
                key={step}
                className={cn(
                  "flex-1 px-1 text-center",
                  i === 0
                    ? "font-semibold text-neutral-900"
                    : "text-neutral-400"
                )}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            goNext(false)
          }}
        >
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="vendor-search"
                className="text-[12px] font-semibold text-neutral-700"
              >
                Vendor <span className="text-red-700">*</span>
              </label>
              <Controller
                name="vendorSearch"
                control={form.control}
                render={({ field }) => (
                  <div className="relative">
                    <div className="mt-1 flex min-h-8 flex-wrap items-center gap-1 rounded-sm border border-neutral-300 bg-white px-1.5 py-1 focus-within:border-emerald-700">
                      {selectedVendors.map((v) => (
                        <span
                          key={v.code}
                          className="inline-flex max-w-full items-center gap-1 bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-700"
                        >
                          <span className="truncate">
                            {v.code} - {v.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeVendor(v.code)}
                            onMouseDown={(e) => e.preventDefault()}
                            aria-label={`Remove ${v.code}`}
                            className="font-bold text-red-800 hover:text-red-600"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                      <Input
                        id="vendor-search"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          field.onChange(e.target.value)
                          setOpen(true)
                        }}
                        onFocus={() => {
                          if (blurTimer.current)
                            clearTimeout(blurTimer.current)
                          setOpen(true)
                        }}
                        onBlur={() => {
                          blurTimer.current = setTimeout(
                            () => setOpen(false),
                            150
                          )
                        }}
                        autoComplete="off"
                        className="h-6 min-w-28 flex-1 border-0 bg-transparent px-1 text-[12px] shadow-none focus-visible:ring-0"
                      />
                    </div>
                    {open && (
                      <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-sm border border-neutral-300 bg-white shadow-md">
                        {query.length > 0 && query.length < 3 ? (
                          <p className="px-2 py-3 text-center text-[12px] text-neutral-500">
                            Enter at least 3 characters to search.
                          </p>
                        ) : (
                          <>
                            {matches.length === 0 && (
                              <p className="px-2 py-3 text-center text-[12px] text-neutral-500">
                                No vendors found.
                              </p>
                            )}
                            {matches.map((v) => (
                              <button
                                key={v.code}
                                type="button"
                                disabled={selected.has(v.code)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pickVendor(v.code)}
                                className={cn(
                                  "block w-full px-2 py-1.5 text-left text-[12px]",
                                  selected.has(v.code)
                                    ? "cursor-not-allowed bg-emerald-800 font-semibold text-white"
                                    : "text-neutral-700 hover:bg-emerald-800 hover:text-white"
                                )}
                              >
                                {v.code} - {v.name}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Start typing a vendor code or name, enter at least 3
                characters and vendor with input will be displayed.
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-neutral-500">
                  Quick pick demo:
                </span>
                {demoVendors.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={fillDemo}
                    disabled={selected.has(v.code)}
                    className="rounded-sm border border-emerald-800 px-2 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {v.code} - {v.name}
                  </button>
                ))}
              </div>
              <FieldError
                message={form.formState.errors.vendorSearch?.message}
              />
              <FieldError
                message={form.formState.errors.selectedVendorCodes?.message}
              />
            </div>

            <div className="flex items-start justify-end pt-5">
              <Controller
                name="searchAllVendors"
                control={form.control}
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-neutral-600">
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                    Search all vendors
                  </label>
                )}
              />
            </div>
          </div>

          <div className="mt-4 border border-neutral-200">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead className="px-2 py-1.5 font-semibold text-neutral-700">
                    Vendor Code
                  </TableHead>
                  <TableHead className="px-2 py-1.5 font-semibold text-neutral-700">
                    Vendor Name
                  </TableHead>
                  <TableHead className="w-10 px-2 py-1.5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedVendors.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={3}
                      className="py-6 text-center text-[12px] text-neutral-500"
                    >
                      No Vendors selected. Select vendor above.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedVendors.map((v) => (
                    <TableRow key={v.code}>
                      <TableCell className="px-2 py-1.5 font-semibold">
                        {v.code}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 uppercase">
                        {v.name}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeVendor(v.code)}
                          className="font-bold text-red-800 hover:text-red-600"
                          aria-label={`Remove ${v.code}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-3">
            <Link
              href="/create-ccr"
              className="inline-flex items-center gap-1 rounded-sm border border-red-900/60 px-2.5 py-1 text-[11px] font-bold tracking-wide text-red-900 hover:bg-red-50"
            >
              <X className="size-3" /> CANCEL
            </Link>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => goNext(true)}
                className="h-7 rounded-sm border-emerald-800 px-2.5 text-[11px] font-bold text-emerald-800"
              >
                <Save className="size-3" /> SAVE AS DRAFT
              </Button>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-7 rounded-sm border-emerald-800 px-2.5 text-[11px] font-bold text-emerald-800"
              >
                <SquarePen className="size-3" /> NEXT
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function SelectVendorsPage() {
  return (
    <Suspense>
      <SelectVendorsForm />
    </Suspense>
  )
}
