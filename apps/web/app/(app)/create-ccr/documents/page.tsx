"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useRef, useState } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CircleCheckBig,
  CloudUpload,
  FileSpreadsheet,
  Info,
  Save,
  Undo2,
  X,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
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
import { CcrTopNav } from "@/components/aftermarket/ccr-top-nav"
import { CcrWizardHeader } from "@/components/aftermarket/ccr-wizard-header"
import { FieldError } from "@/components/aftermarket/wizard-fields"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { vendorCatalog } from "@/lib/ccr-data"
import {
  permittedDocExtensions,
  supportDocFileTypes,
  supportDocumentsDefaults,
  supportDocumentsSchema,
  type SupportDocumentsInput,
  type SupportDocumentsValues,
} from "@/lib/ccr-schemas"

const ACCEPT = permittedDocExtensions
  .map((e) => `.${e}`)
  .join(",")

function formatSize(bytes: number): string {
  if (!bytes || Number.isNaN(bytes)) return ""
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(2)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".")
  if (i < 0) return ""
  return name.slice(i + 1).toLowerCase()
}

function DocumentsForm() {
  const router = useRouter()
  const params = useSearchParams()
  const kind = params.get("kind") === "alb" ? "alb" : "standard"
  const draft = params.get("draft") === "1"
  const vendorsParam = params.get("vendors") ?? ""
  const partsParam = params.get("parts") ?? ""
  const justification = params.get("justification") ?? ""
  const rowsParam = params.get("rows") ?? ""
  const vendorCodes = vendorsParam ? vendorsParam.split(",").filter(Boolean) : []
  const defaultVendor = vendorCodes[0] ?? ""

  const form = useForm<SupportDocumentsInput, unknown, SupportDocumentsValues>({
    resolver: zodResolver(supportDocumentsSchema),
    defaultValues: supportDocumentsDefaults,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "files",
  })

  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [triedNext, setTriedNext] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const files = form.watch("files") ?? []

  const vendors = vendorCatalog.filter((v) => vendorCodes.includes(v.code))

  const vendorsMissingQuote = vendorCodes.filter(
    (code) =>
      !files.some((f) => f.vendorCode === code && f.fileType === "Quote")
  )

  const addDemoFiles = () => {
    const picked = files.map((f) => f.key)
    const demo = [
      {
        key: "demo-quote",
        name: "Demo Supplier Quote.xlsx",
        extension: "xlsx",
        sizeLabel: "234.64 KB",
        sizeBytes: 240269,
        fileType: "Quote" as const,
        vendorCode: defaultVendor || "MRDFN",
      },
      {
        key: "demo-allocation",
        name: "Demo Buyer and Supplier Allocation.xlsx",
        extension: "xlsx",
        sizeLabel: "28.25 KB",
        sizeBytes: 28928,
        fileType: "Others" as const,
        vendorCode: defaultVendor || "MRDFN",
      },
    ].filter((d) => !picked.includes(d.key))
    demo.forEach((d) => append(d))
    setError(null)
  }

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list)
    if (incoming.length === 0) return
    const bad = incoming.find(
      (f) =>
        !(
          permittedDocExtensions as readonly string[]
        ).includes(extensionOf(f.name))
    )
    if (bad) {
      setError(
        `File type not allowed: ${bad.name}. Permitted types include ${permittedDocExtensions.join(", ")}.`
      )
      return
    }
    setError(null)
    incoming.forEach((f, i) => {
      const ext = extensionOf(f.name)
      append({
        key: `${Date.now()}-${i}-${f.name}`,
        name: f.name,
        extension: ext,
        sizeLabel: formatSize(f.size),
        sizeBytes: f.size,
        fileType: "Others",
        vendorCode: defaultVendor,
      })
    })
  }

  const carryParams = () => {
    const search = new URLSearchParams({
      kind,
      vendors: vendorsParam,
      parts: partsParam,
    })
    if (justification) search.set("justification", justification)
    if (rowsParam) search.set("rows", rowsParam)
    if (draft) search.set("draft", "1")
    return search.toString()
  }

  const backHref = `/create-ccr/part-details?${carryParams()}`

  const docsParam = (asDraft: boolean) => {
    const search = new URLSearchParams({
      kind,
      vendors: vendorsParam,
      parts: partsParam,
    })
    if (justification) search.set("justification", justification)
    if (rowsParam) search.set("rows", rowsParam)
    const values = form.getValues()
    const uploaded = values.files ?? []
    if (uploaded.length > 0) {
      search.set(
        "docs",
        uploaded
          .map((f) => `${f.name}:${f.fileType}:${f.vendorCode}`)
          .join("|")
      )
    }
    if (asDraft || draft) search.set("draft", "1")
    return search.toString()
  }

  const goNext = (asDraft: boolean) => {
    if (!asDraft) setTriedNext(true)
    if (!asDraft && vendorsMissingQuote.length > 0) return
    return form.handleSubmit(() => {
      router.push(`/create-ccr/document-vendor-parts?${docsParam(asDraft)}`)
    })()
  }

  return (
    <div className="min-h-svh bg-white">
      <CcrTopNav active="home" />

      <main className="px-4 py-3">
        <CcrWizardHeader
          title="Create Commercial Change Request"
          kind={kind}
          activeStep={3}
        />

        {vendors.length === 0 ? (
          <p className="mt-6 rounded-sm bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-900">
            No vendors were carried from the previous steps.{" "}
            <Link href="/create-ccr/select-vendors" className="font-bold underline">
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
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div
                    key={f.key}
                    className="flex items-center gap-2 border border-neutral-200 px-2 py-1.5"
                  >
                    <FileSpreadsheet className="size-5 shrink-0 text-emerald-800" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-neutral-800">
                        {f.name}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {(f.extension ?? "").toUpperCase()} - {f.sizeLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label={`Remove ${f.name}`}
                      className="font-bold text-neutral-700 hover:text-red-700"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}

                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload supporting files"
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      inputRef.current?.click()
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    addFiles(e.dataTransfer.files)
                  }}
                  onPaste={(e) => {
                    const pasted = Array.from(
                      e.clipboardData?.files ?? []
                    )
                    if (pasted.length > 0) {
                      e.preventDefault()
                      addFiles(pasted)
                    }
                  }}
                  className={
                    "flex cursor-pointer items-center gap-2 border px-2 py-2 text-[12px] text-neutral-500 " +
                    (dragOver
                      ? "border-emerald-700 bg-emerald-50"
                      : "border-emerald-800 bg-white")
                  }
                >
                  <span className="text-[11px] font-bold tracking-wide text-emerald-800">
                    UPLOAD
                  </span>
                  <CloudUpload className="size-4 text-neutral-500" />
                  <span>Drop or paste files here</span>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files)
                      e.target.value = ""
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={addDemoFiles}
                  className="rounded-sm border border-emerald-800 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50"
                >
                  Add demo files
                </button>
                {error && (
                  <p
                    role="alert"
                    className="text-[11px] font-medium text-red-700"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[12px] font-semibold text-neutral-700">
                  Instructions
                </p>
                <p className="mt-1 text-[12px] text-neutral-500">
                  Permitted file types include{" "}
                  {permittedDocExtensions.join(", ")}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-1 text-[12px] font-semibold text-neutral-700">
                Files To Import
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className="text-emerald-700"
                        aria-label="Files to import help"
                      >
                        <Info className="size-3" />
                      </button>
                    }
                  />
                  <TooltipContent>
                    Assign a file type and vendor code to each file
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="mt-1 overflow-x-auto border border-neutral-200">
                <Table className="min-w-[900px] text-[12px]">
                  <TableHeader>
                    <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                      <TableHead className="px-2 py-1.5 font-semibold text-neutral-700">
                        File
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold text-neutral-700">
                        File Type
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold text-neutral-700">
                        Vendor Code
                      </TableHead>
                      <TableHead className="px-2 py-1.5 font-semibold text-neutral-700">
                        File Extension
                      </TableHead>
                      <TableHead className="px-2 py-1.5 text-right font-semibold text-neutral-700">
                        Size
                      </TableHead>
                      <TableHead className="w-8 px-2 py-1.5" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={6}
                          className="py-6 text-center text-[12px] text-neutral-500"
                        >
                          No Items available
                        </TableCell>
                      </TableRow>
                    ) : (
                      fields.map((field, i) => {
                        const row = files[i]
                        return (
                          <TableRow key={field.id}>
                            <TableCell className="px-2 py-1.5 whitespace-normal">
                              {row?.name}
                            </TableCell>
                            <TableCell className="px-2 py-1.5">
                              <Controller
                                name={`files.${i}.fileType`}
                                control={form.control}
                                render={({ field: f }) => (
                                  <Select
                                    value={f.value ?? "Others"}
                                    onValueChange={(v) =>
                                      f.onChange(
                                        v as (typeof supportDocFileTypes)[number]
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-7 w-36 border-neutral-300 text-[12px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {supportDocFileTypes.map((o) => (
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
                                name={`files.${i}.vendorCode`}
                                control={form.control}
                                render={({ field: f }) => (
                                  <Select
                                    value={f.value ?? defaultVendor}
                                    onValueChange={(v) => f.onChange(v ?? "")}
                                  >
                                    <SelectTrigger className="h-7 w-28 border-neutral-300 text-[12px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {vendorCodes.map((code) => (
                                        <SelectItem key={code} value={code}>
                                          {code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1.5">
                              <span className="inline-flex items-center gap-1">
                                <CircleCheckBig className="size-3.5 text-emerald-700" />
                                {row?.extension}
                              </span>
                            </TableCell>
                            <TableCell className="px-2 py-1.5 text-right whitespace-nowrap">
                              {row?.sizeLabel}
                            </TableCell>
                            <TableCell className="px-2 py-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => remove(i)}
                                aria-label={`Remove ${row?.name}`}
                                className="font-bold text-red-800 hover:text-red-600"
                              >
                                <X className="size-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <FieldError
                message={form.formState.errors.files?.message as string | undefined}
              />
            </div>

            {triedNext && vendorsMissingQuote.length > 0 ? (
              <p
                role="alert"
                className="mt-3 border-l-2 border-red-700 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-800"
              >
                <span className="mr-1 inline-flex size-4 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white">
                  !
                </span>
                A quote must be uploaded for vendor codes:{" "}
                {vendorsMissingQuote.join(", ")}
              </p>
            ) : null}

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
                  NEXT
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <Suspense>
      <DocumentsForm />
    </Suspense>
  )
}
