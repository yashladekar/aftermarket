"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, CircleAlert, Info, Save, SquarePen, Undo2, X } from "lucide-react"
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
import { CcrWizardHeader } from "@/components/aftermarket/ccr-wizard-header"
import { FieldError } from "@/components/aftermarket/wizard-fields"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  demoPartNumbers,
  type VendorPart,
} from "@/lib/ccr-data"
import { useCcrCatalog } from "@/lib/use-ccr-catalog"
import {
  selectPartsDefaults,
  selectPartsSchema,
  type SelectPartsInput,
  type SelectPartsValues,
} from "@/lib/ccr-schemas"
import { cn } from "@workspace/ui/lib/utils"

function filterParts(parts: VendorPart[], search: string): VendorPart[] {
  const q = search.trim().toLowerCase()
  if (!q) return parts
  return parts.filter((p) =>
    `${p.partNumber} ${p.description}`.toLowerCase().includes(q)
  )
}

function SelectPartsForm() {
  const router = useRouter()
  const params = useSearchParams()
  const kind = params.get("kind") === "alb" ? "alb" : "standard"
  const draft = params.get("draft") === "1"
  const partsParam = params.get("parts") ?? ""
  const initialParts = partsParam
    ? partsParam.split(",").filter(Boolean)
    : []
  const vendorsParam = params.get("vendors") ?? ""
  const vendorCodes = vendorsParam ? vendorsParam.split(",").filter(Boolean) : []
  const [activeVendor, setActiveVendor] = useState(vendorCodes[0] ?? "")

  const form = useForm<SelectPartsInput, unknown, SelectPartsValues>({
    resolver: zodResolver(selectPartsSchema),
    defaultValues: { ...selectPartsDefaults, selectedPartNumbers: initialParts },
  })

  const partSearch = form.watch("partSearch") ?? ""
  const selectAll = form.watch("selectAll") ?? false
  const selectedNumbers = form.watch("selectedPartNumbers") ?? []
  const selected = new Set(selectedNumbers)
  const [open, setOpen] = useState(false)
  const [triedNext, setTriedNext] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { vendors: vendorCatalog, parts: vendorPartsCatalog } = useCcrCatalog()

  const vendors = vendorCatalog.filter((v) => vendorCodes.includes(v.code))
  const effectiveVendor = activeVendor || vendorCodes[0] || ""
  const vendorParts = vendorPartsCatalog.filter(
    (p) => p.vendorCode === effectiveVendor
  )
  const matches = filterParts(vendorParts, partSearch)
  const selectedForVendor = vendorParts.filter((p) =>
    selected.has(p.partNumber)
  )

  const demoParts = vendorParts.filter((p) =>
    demoPartNumbers.includes(p.partNumber)
  )

  const fillDemoParts = () => {
    const current = form.getValues("selectedPartNumbers") ?? []
    const next = Array.from(
      new Set([...current, ...demoParts.map((p) => p.partNumber)])
    )
    form.setValue("selectedPartNumbers", next, { shouldValidate: true })
    form.setValue("partSearch", "", { shouldValidate: false })
    setOpen(false)
    setTriedNext(false)
  }

  useEffect(() => {
    if (selectAll) return
    const remaining = selectedNumbers.filter((n) =>
      vendorParts.some((p) => p.partNumber === n)
    )
    if (remaining.length === 0 && selectedForVendor.length > 0) {
      form.setValue("selectedPartNumbers", [], { shouldValidate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveVendor])

  const toggleSelectAll = (on: boolean) => {
    form.setValue("selectAll", on)
    if (on) {
      const others = selectedNumbers.filter(
        (n) => !vendorParts.some((p) => p.partNumber === n)
      )
      const all = [
        ...others,
        ...vendorParts.map((p) => p.partNumber),
      ]
      form.setValue("selectedPartNumbers", Array.from(new Set(all)), {
        shouldValidate: true,
      })
    }
  }

  const pickPart = (partNumber: string) => {
    const current = form.getValues("selectedPartNumbers") ?? []
    if (current.includes(partNumber)) return
    form.setValue("selectedPartNumbers", [...current, partNumber], {
      shouldValidate: true,
    })
    form.setValue("partSearch", "", { shouldValidate: false })
    setOpen(false)
  }

  const removePart = (partNumber: string) => {
    const current = form.getValues("selectedPartNumbers") ?? []
    const next = current.filter((n) => n !== partNumber)
    form.setValue("selectedPartNumbers", next, { shouldValidate: false })
    if (selectedForVendor.length <= 1) {
      form.setValue("selectAll", false)
    }
  }

  const carryParams = (extra: Record<string, string>) => {
    const search = new URLSearchParams({
      kind,
      vendors: vendorsParam,
    })
    if (partsParam) search.set("parts", partsParam)
    Object.entries(extra).forEach(([k, v]) => search.set(k, v))
    return search.toString()
  }

  const backHref = `/create-ccr/select-vendors?${carryParams({})}`

  const missingForVendor =
    triedNext && effectiveVendor && selectedForVendor.length === 0

  const goNext = (asDraft: boolean) => {
    setTriedNext(true)
    if (!asDraft && effectiveVendor && selectedForVendor.length === 0) {
      return
    }
    form.handleSubmit((values) => {
      const search = new URLSearchParams({
        kind,
        vendors: vendorsParam,
        parts: values.selectedPartNumbers.join(","),
      })
      if (asDraft || draft) search.set("draft", "1")
      router.push(`/create-ccr/part-details?${search.toString()}`)
    })()
  }

  return (
    <div className="min-h-svh bg-white">
      <CcrTopNav active="home" />

      <main className="px-4 py-3">
        <CcrWizardHeader
          title="Create Commercial Change Request"
          kind={kind}
          activeStep={1}
        />

        {vendors.length === 0 ? (
          <p className="mt-6 rounded-sm bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-900">
            No vendors were carried from the previous step.{" "}
            <Link href={backHref} className="font-bold underline">
              Go back and select a vendor first.
            </Link>
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              goNext(false)
            }}
          >
            {vendors.length > 1 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {vendors.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => setActiveVendor(v.code)}
                    className={cn(
                      "min-w-48 border-b-2 px-4 py-1 text-[12px] font-bold",
                      effectiveVendor === v.code
                        ? "border-emerald-800 text-neutral-900"
                        : "border-transparent text-neutral-400 hover:text-neutral-700"
                    )}
                  >
                    {v.code}
                  </button>
                ))}
              </div>
            )}

            {vendors.length === 1 && (
              <p className="mt-4 text-center text-[12px] font-bold text-neutral-800">
                {vendors[0]?.code}{" "}
                <CircleAlert className="inline size-3 text-red-700" />
              </p>
            )}

            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="text-[12px] font-semibold text-neutral-700">
                  Select Vendor Parts{" "}
                  <span className="text-red-700">*</span>
                </span>
                <Controller
                  name="partSearch"
                  control={form.control}
                  render={({ field }) => (
                    <div className="relative">
                      <div className="mt-1 flex min-h-8 flex-wrap items-center gap-1 rounded-sm border border-neutral-300 bg-white px-1.5 py-1 focus-within:border-emerald-700">
                        {selectedForVendor.map((p) => (
                          <span
                            key={p.partNumber}
                            className="inline-flex max-w-full items-center gap-1 bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-700"
                          >
                            <span className="truncate">{p.partNumber}</span>
                            <button
                              type="button"
                              onClick={() => removePart(p.partNumber)}
                              onMouseDown={(e) => e.preventDefault()}
                              aria-label={`Remove ${p.partNumber}`}
                              className="font-bold text-red-800 hover:text-red-600"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                        <Input
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
                          placeholder="Select one or more parts ..."
                          autoComplete="off"
                          className="h-6 min-w-28 flex-1 border-0 bg-transparent px-1 text-[12px] shadow-none focus-visible:ring-0"
                        />
                      </div>
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Toggle part list"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setOpen((o) => !o)}
                        className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-neutral-500 hover:bg-neutral-100"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                      {open && (
                        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-sm border border-neutral-300 bg-white shadow-md">
                          {matches.length === 0 && (
                            <p className="px-2 py-3 text-center text-[12px] text-neutral-500">
                              No parts found.
                            </p>
                          )}
                          {matches.map((p) => (
                            <button
                              key={p.partNumber}
                              type="button"
                              disabled={selected.has(p.partNumber)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => pickPart(p.partNumber)}
                              className={cn(
                                "block w-full px-2 py-1.5 text-left text-[12px]",
                                selected.has(p.partNumber)
                                  ? "cursor-not-allowed bg-emerald-800 font-semibold text-white"
                                  : "text-neutral-700 hover:bg-emerald-800 hover:text-white"
                              )}
                            >
                              {p.partNumber} — {p.description}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                />
                <FieldError
                  message={form.formState.errors.partSearch?.message}
                />
                {demoParts.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-neutral-500">
                      Quick pick demo:
                    </span>
                    <button
                      type="button"
                      onClick={fillDemoParts}
                      className="rounded-sm border border-emerald-800 px-2 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50"
                    >
                      {demoParts.map((p) => p.partNumber).join(", ")}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-start justify-end pt-5">
                <Controller
                  name="selectAll"
                  control={form.control}
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-neutral-600">
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={(v) => toggleSelectAll(v === true)}
                      />
                      Select all parts
                    </label>
                  )}
                />
              </div>
            </div>

            {missingForVendor ? (
              <p
                role="alert"
                className="mt-3 flex items-center gap-1.5 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-800"
              >
                <CircleAlert className="size-3.5" />
                Please select parts for vendor : {effectiveVendor}
              </p>
            ) : null}

            <div className="mt-4 border border-neutral-200">
              <div className="overflow-x-auto">
                <Table className="min-w-[1200px] text-[12px]">
                  <TableHeader>
                    <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                      <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                        Material Number
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                        Part Desctiption
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                        WERS
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                        Manufacturer Part Number
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                        Incoterms 1
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                        Net Price
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                        Per
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                        MOQ
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                        <span className="inline-flex items-center gap-1">
                          Current Order Multiple
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type="button"
                                  className="text-emerald-700"
                                  aria-label="Current order multiple help"
                                >
                                  <Info className="size-3" />
                                </button>
                              }
                            />
                            <TooltipContent>
                              Minimum multiple the current order must follow
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                        Lead Time
                      </TableHead>
                      <TableHead className="w-10 px-2 py-1.5" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedForVendor.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={11}
                          className="py-6 text-center text-[12px] text-neutral-500"
                        >
                          No Items available
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedForVendor.map((p) => (
                        <TableRow key={p.partNumber}>
                          <TableCell className="px-2 py-1.5 font-semibold whitespace-nowrap">
                            {p.materialNumber}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-normal text-neutral-600">
                            {p.description}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {p.wers}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {p.manufacturerPartNumber}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {p.incoterms}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {p.netPrice}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {p.per}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {p.moq}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {p.currentOrderMultiple}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {p.leadTime}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => removePart(p.partNumber)}
                              className="font-bold text-red-800 hover:text-red-600"
                              aria-label={`Remove ${p.partNumber}`}
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
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-3">
              <div className="flex items-center gap-2">
                <Link
                  href="/create-ccr"
                  className="inline-flex items-center gap-1 rounded-sm border border-red-900/60 px-2.5 py-1 text-[11px] font-bold tracking-wide text-red-900 hover:bg-red-50"
                >
                  <X className="size-3" /> CANCEL
                </Link>
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1 rounded-sm border border-emerald-800 px-2.5 py-1 text-[11px] font-bold tracking-wide text-emerald-800 hover:bg-emerald-50"
                >
                  <Undo2 className="size-3" /> BACK
                </Link>
              </div>
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
        )}
      </main>
    </div>
  )
}

export default function SelectPartsPage() {
  return (
    <Suspense>
      <SelectPartsForm />
    </Suspense>
  )
}
