"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CalendarDays,
  ChevronDown,
  Info,
  Save,
  Undo2,
  X,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Textarea } from "@workspace/ui/components/textarea"
import { CcrTopNav } from "@/components/aftermarket/ccr-top-nav"
import { CcrWizardHeader } from "@/components/aftermarket/ccr-wizard-header"
import { FieldError } from "@/components/aftermarket/wizard-fields"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  demoPartDetails,
  vendorCatalog,
  vendorPartsCatalog,
} from "@/lib/ccr-data"
import {
  buyingTypeOptions,
  partDetailsSchema,
  type PartDetailsInput,
  type PartDetailsValues,
} from "@/lib/ccr-schemas"
import { cn } from "@workspace/ui/lib/utils"

function fmtDisplay(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function Tip({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="text-emerald-700"
            aria-label={label}
          >
            <Info className="size-3" />
          </button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function PartDetailsForm() {
  const router = useRouter()
  const params = useSearchParams()
  const kind = params.get("kind") === "alb" ? "alb" : "standard"
  const draft = params.get("draft") === "1"
  const vendorsParam = params.get("vendors") ?? ""
  const partsParam = params.get("parts") ?? ""
  const vendorCodes = vendorsParam ? vendorsParam.split(",").filter(Boolean) : []
  const partNumbers = partsParam ? partsParam.split(",").filter(Boolean) : []
  const [activeVendor, setActiveVendor] = useState(vendorCodes[0] ?? "")
  const [openSection, setOpenSection] = useState(true)
  const [selectAllDate, setSelectAllDate] = useState("")
  const [triedValidate, setTriedValidate] = useState(false)

  const vendors = vendorCatalog.filter((v) => vendorCodes.includes(v.code))
  const effectiveVendor = activeVendor || vendorCodes[0] || ""
  const vendorInfo = vendors.find((v) => v.code === effectiveVendor)
  const parts = useMemo(
    () =>
      vendorPartsCatalog.filter(
        (p) =>
          p.vendorCode === effectiveVendor && partNumbers.includes(p.partNumber)
      ),
    [effectiveVendor, partNumbers]
  )

  const form = useForm<PartDetailsInput, unknown, PartDetailsValues>({
    resolver: zodResolver(partDetailsSchema),
    defaultValues: {
      selectAllStartDate: "",
      partRows: parts.map((p) => ({
        partNumber: p.partNumber,
        newNetPrice: "",
        newPer: "",
        newMoq: "",
        newOrderMultiple: "",
        newLeadTime: "",
        buyingType: "General",
        buyingTypeQty: "",
        startDate: "",
      })),
      justification: "",
    },
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: "partRows",
  })

  const watchedRows = form.watch("partRows") ?? []
  const justification = form.watch("justification") ?? ""

  const applySelectAllDate = (date: string) => {
    setSelectAllDate(date)
    form.setValue("selectAllStartDate", date)
    parts.forEach((_, i) => {
      form.setValue(`partRows.${i}.startDate`, date, {
        shouldValidate: triedValidate,
      })
    })
  }

  const fillDemo = () => {
    const demoText =
      demoPartDetails[parts[0]?.partNumber ?? ""]?.justification ?? ""
    parts.forEach((p, i) => {
      const demo = demoPartDetails[p.partNumber]
      if (demo) {
        form.setValue(`partRows.${i}.newNetPrice`, demo.newNetPrice, {
          shouldValidate: false,
        })
        form.setValue(`partRows.${i}.startDate`, demo.startDate, {
          shouldValidate: false,
        })
      }
    })
    if (parts.length > 0) {
      const d = demoPartDetails[parts[0]?.partNumber ?? ""]
      if (d) {
        applySelectAllDate(d.startDate)
        form.setValue("justification", demoText, { shouldValidate: true })
      }
    }
    setTriedValidate(false)
  }

  const carryParams = () => {
    const search = new URLSearchParams({
      kind,
      vendors: vendorsParam,
      parts: partsParam,
    })
    if (draft) search.set("draft", "1")
    return search.toString()
  }

  const backHref = `/create-ccr/select-parts?${carryParams()}`

  const rowErrors = (index: number) =>
    triedValidate || form.formState.errors.partRows?.[index]?.startDate
      ? form.formState.errors.partRows?.[index]?.startDate?.message
      : undefined

  const goNext = (asDraft: boolean) => {
    setTriedValidate(true)
    form.handleSubmit(
      (values) => {
        const search = new URLSearchParams({
          kind,
          vendors: vendorsParam,
          parts: partsParam,
          justification: values.justification,
          rows: values.partRows
            .map((r) => `${r.partNumber}:${r.startDate}:${r.newNetPrice}`)
            .join("|"),
        })
        if (asDraft || draft) search.set("draft", "1")
        router.push(`/create-ccr/documents?${search.toString()}`)
      },
      () => {}
    )()
  }

  return (
    <div className="min-h-svh bg-white">
      <CcrTopNav active="home" />

      <main className="px-4 py-3">
        <CcrWizardHeader
          title="Create Commercial Change Request"
          kind={kind}
          activeStep={2}
        />

        {vendors.length === 0 || parts.length === 0 ? (
          <p className="mt-6 rounded-sm bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-900">
            No vendor parts were carried from the previous step.{" "}
            <Link href={backHref} className="font-bold underline">
              Go back and select parts first.
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

            <button
              type="button"
              onClick={() => setOpenSection((o) => !o)}
              className="mt-3 flex w-full items-center justify-between bg-emerald-800 px-3 py-1.5 text-left text-[12px] font-bold text-white"
            >
              <span>
                {effectiveVendor}
                {vendorInfo ? ` - ${vendorInfo.name}` : ""} - EUR
              </span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  openSection && "rotate-180"
                )}
              />
            </button>

            {openSection && (
              <>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <label
                    htmlFor="select-all-start"
                    className="text-[12px] font-semibold text-neutral-700"
                  >
                    Select All Start Date
                  </label>
                  <div className="relative">
                    <Input
                      id="select-all-start"
                      type="date"
                      value={selectAllDate}
                      onChange={(e) => applySelectAllDate(e.target.value)}
                      className="h-7 w-44 border-neutral-300 pr-8 text-[12px]"
                    />
                    <CalendarDays className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-neutral-400" />
                  </div>
                  {parts.some(
                    (p) => demoPartDetails[p.partNumber]
                  ) && (
                    <button
                      type="button"
                      onClick={fillDemo}
                      className="rounded-sm border border-emerald-800 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50"
                    >
                      Fill demo values
                    </button>
                  )}
                </div>

                <div className="mt-2 overflow-x-auto border border-neutral-200">
                  <Table className="min-w-[1500px] text-[12px]">
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        <TableHead className="min-w-44 px-2 py-1.5 font-semibold text-neutral-700">
                          Validation Error
                        </TableHead>
                        <TableHead className="px-2 py-1.5 font-semibold whitespace-nowrap text-neutral-700">
                          Part Number
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold text-neutral-700">
                          Current?
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          Net Price
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          New Net Price
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold text-neutral-700">
                          PER
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          New PER
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold text-neutral-700">
                          MOQ
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          <span className="inline-flex items-center gap-1">
                            New MOQ <Tip label="New minimum order quantity" />
                          </span>
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          <span className="inline-flex items-center gap-1">
                            Current Order Multiple (OM){" "}
                            <Tip label="Current order multiple" />
                          </span>
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          <span className="inline-flex items-center gap-1">
                            New Current Order Multiple (OM){" "}
                            <Tip label="New order multiple" />
                          </span>
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          Lead Time
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          New Lead Time
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          <span className="inline-flex items-center gap-1">
                            Buying Type <Tip label="Buying type" />
                          </span>
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          <span className="inline-flex items-center gap-1">
                            Buying Type Qty <Tip label="Buying type quantity" />
                          </span>
                        </TableHead>
                        <TableHead className="px-2 py-1.5 text-center font-semibold whitespace-nowrap text-neutral-700">
                          <span className="inline-flex items-center gap-1">
                            Start Date <Tip label="Effective start date" />
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, i) => {
                        const part = parts[i]
                        const err = rowErrors(i)
                        const startDate = watchedRows[i]?.startDate ?? ""
                        return (
                          <TableRow key={field.id}>
                            <TableCell className="px-2 py-1.5">
                              {err ? (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-red-700">
                                  <X className="size-3" /> :{err}
                                </span>
                              ) : (
                                <span className="text-neutral-300">—</span>
                              )}
                            </TableCell>
                            <TableCell className="px-2 py-1.5 font-semibold whitespace-nowrap">
                              {part?.partNumber}
                            </TableCell>
                            <TableCell className="px-2 py-1.5 text-center text-red-700">
                              <X className="mx-auto size-3.5" />
                            </TableCell>
                            <TableCell className="px-2 py-1.5 text-center whitespace-nowrap">
                              <span className="bg-sky-100 px-1 font-semibold text-sky-900">
                                {part?.netPrice}
                              </span>
                            </TableCell>
                            <TableCell className="px-2 py-1.5">
                              <Controller
                                name={`partRows.${i}.newNetPrice`}
                                control={form.control}
                                render={({ field: f }) => (
                                  <Input
                                    value={f.value ?? ""}
                                    onChange={(e) =>
                                      f.onChange(e.target.value)
                                    }
                                    className="h-7 w-20 border-neutral-300 text-[12px]"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1.5 text-center">
                              {part?.per}
                            </TableCell>
                            <TableCell className="px-2 py-1.5">
                              <Controller
                                name={`partRows.${i}.newPer`}
                                control={form.control}
                                render={({ field: f }) => (
                                  <Input
                                    value={f.value ?? ""}
                                    onChange={(e) =>
                                      f.onChange(e.target.value)
                                    }
                                    className="h-7 w-16 border-neutral-300 text-[12px]"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1.5 text-center">
                              {part?.moq}
                            </TableCell>
                            <TableCell className="px-2 py-1.5">
                              <Controller
                                name={`partRows.${i}.newMoq`}
                                control={form.control}
                                render={({ field: f }) => (
                                  <Input
                                    value={f.value ?? ""}
                                    onChange={(e) =>
                                      f.onChange(e.target.value)
                                    }
                                    className="h-7 w-16 border-neutral-300 text-[12px]"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1.5 text-center">
                              {part?.currentOrderMultiple}
                            </TableCell>
                            <TableCell className="px-2 py-1.5">
                              <Controller
                                name={`partRows.${i}.newOrderMultiple`}
                                control={form.control}
                                render={({ field: f }) => (
                                  <Input
                                    value={f.value ?? ""}
                                    onChange={(e) =>
                                      f.onChange(e.target.value)
                                    }
                                    className="h-7 w-16 border-neutral-300 text-[12px]"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1.5 text-center whitespace-nowrap">
                              {part?.leadTime}
                            </TableCell>
                            <TableCell className="px-2 py-1.5">
                              <Controller
                                name={`partRows.${i}.newLeadTime`}
                                control={form.control}
                                render={({ field: f }) => (
                                  <Input
                                    value={f.value ?? ""}
                                    onChange={(e) =>
                                      f.onChange(e.target.value)
                                    }
                                    className="h-7 w-20 border-neutral-300 text-[12px]"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1.5">
                              <Controller
                                name={`partRows.${i}.buyingType`}
                                control={form.control}
                                render={({ field: f }) => (
                                  <Select
                                    value={f.value ?? "General"}
                                    onValueChange={(v) =>
                                      f.onChange(
                                        v as (typeof buyingTypeOptions)[number]
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-7 w-24 border-neutral-300 text-[12px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {buyingTypeOptions.map((o) => (
                                        <SelectItem key={o} value={o}>
                                          {o}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1.5">
                              <Controller
                                name={`partRows.${i}.buyingTypeQty`}
                                control={form.control}
                                render={({ field: f }) => (
                                  <Input
                                    value={f.value ?? ""}
                                    onChange={(e) =>
                                      f.onChange(e.target.value)
                                    }
                                    className="h-7 w-20 border-neutral-300 text-[12px]"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1.5">
                              <Controller
                                name={`partRows.${i}.startDate`}
                                control={form.control}
                                render={({ field: f }) => (
                                  <Input
                                    type="date"
                                    value={f.value ?? ""}
                                    onChange={(e) =>
                                      f.onChange(e.target.value)
                                    }
                                    title={
                                      startDate
                                        ? fmtDisplay(startDate)
                                        : "dd/mm/yyyy"
                                    }
                                    className="h-7 w-32 border-neutral-300 text-[12px]"
                                  />
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <p className="mt-1 text-[11px] text-neutral-500">
                  « ‹ 1 - {parts.length} of {parts.length} › »
                </p>

                <div className="mt-3">
                  <label
                    htmlFor="justification"
                    className="text-[12px] font-semibold text-neutral-700"
                  >
                    Justification <span className="text-red-700">*</span>
                  </label>
                  <Controller
                    name="justification"
                    control={form.control}
                    render={({ field }) => (
                      <Textarea
                        id="justification"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="mt-1 border-neutral-300 text-[12px]"
                      />
                    )}
                  />
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">
                      Provide a detailed justification for the change request.
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {justification.length}/2000
                    </span>
                  </div>
                  <FieldError
                    message={form.formState.errors.justification?.message}
                  />
                </div>
              </>
            )}

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
                <button
                  type="button"
                  onClick={() => goNext(true)}
                  className="inline-flex items-center gap-1 rounded-sm border border-emerald-800 px-2.5 py-1 text-[11px] font-bold tracking-wide text-emerald-800 hover:bg-emerald-50"
                >
                  <Save className="size-3" /> SAVE AS DRAFT
                </button>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-sm border-emerald-800 px-2.5 text-[11px] font-bold text-emerald-800"
                >
                  VALIDATE AND NEXT
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}

export default function PartDetailsPage() {
  return (
    <Suspense>
      <PartDetailsForm />
    </Suspense>
  )
}
