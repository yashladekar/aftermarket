"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronDown, Info, Save, Undo2, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { vendorPartsCatalog } from "@/lib/ccr-data"
import {
  docPartTagsSchema,
  type DocPartTagsInput,
  type DocPartTagsValues,
} from "@/lib/ccr-schemas"
import { cn } from "@workspace/ui/lib/utils"

type CarriedDoc = {
  key: string
  name: string
  fileType: string
  vendorCode: string
}

function parseDocsParam(docsParam: string, vendorsParam: string): CarriedDoc[] {
  if (!docsParam) return []
  const vendorCodes = vendorsParam ? vendorsParam.split(",").filter(Boolean) : []
  return docsParam
    .split("|")
    .filter(Boolean)
    .map((entry, i) => {
      const [name = "", fileType = "Others", vendorCode = ""] =
        entry.split(":")
      return {
        key: `doc-${i}-${name}`,
        name,
        fileType,
        vendorCode: vendorCode || vendorCodes[0] || "",
      }
    })
}

function TagEditor({
  doc,
  parts,
  selected,
  onChange,
}: {
  doc: CarriedDoc
  parts: { partNumber: string }[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const set = new Set(selected)

  const toggle = (partNumber: string) => {
    if (set.has(partNumber)) {
      onChange(selected.filter((p) => p !== partNumber))
    } else {
      onChange([...selected, partNumber])
    }
  }

  const selectAll = () => {
    if (selected.length === parts.length) onChange([])
    else onChange(parts.map((p) => p.partNumber))
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150)
        }}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current)
        }}
        aria-label={`Select parts for ${doc.name}`}
        className="flex w-full items-center justify-between gap-1 rounded-sm border border-emerald-800 bg-white px-2 py-1 text-left text-[12px] text-neutral-700"
      >
        <span className="truncate">
          {selected.length === 0 ? "" : selected.join(", ")}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-emerald-800">
          <span className="flex size-3.5 items-center justify-center rounded-full border border-emerald-800 text-[10px] font-bold">
            {selected.length}
          </span>
          <ChevronDown className="size-3.5" />
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 max-h-56 w-64 overflow-y-auto rounded-sm border border-neutral-300 bg-white shadow-md">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={selectAll}
            className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-[12px] text-neutral-500 hover:bg-neutral-100"
          >
            {selected.length === parts.length && parts.length > 0 ? (
              <Check className="size-3.5 text-emerald-800" />
            ) : (
              <span className="size-3.5" />
            )}
            Select All
          </button>
          {parts.map((p) => {
            const active = set.has(p.partNumber)
            return (
              <button
                key={p.partNumber}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggle(p.partNumber)}
                className={cn(
                  "flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-[12px]",
                  active
                    ? "bg-emerald-800 font-semibold text-white"
                    : "text-neutral-700 hover:bg-emerald-800 hover:text-white"
                )}
              >
                {active ? (
                  <Check className="size-3.5" />
                ) : (
                  <span className="size-3.5" />
                )}
                {p.partNumber}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DocumentVendorPartsForm() {
  const router = useRouter()
  const params = useSearchParams()
  const kind = params.get("kind") === "alb" ? "alb" : "standard"
  const draft = params.get("draft") === "1"
  const vendorsParam = params.get("vendors") ?? ""
  const partsParam = params.get("parts") ?? ""
  const justification = params.get("justification") ?? ""
  const rowsParam = params.get("rows") ?? ""
  const docsParam = params.get("docs") ?? ""

  const docs = useMemo(
    () => parseDocsParam(docsParam, vendorsParam),
    [docsParam, vendorsParam]
  )
  const partNumbers = useMemo(
    () => (partsParam ? partsParam.split(",").filter(Boolean) : []),
    [partsParam]
  )
  const parts = useMemo(
    () => vendorPartsCatalog.filter((p) => partNumbers.includes(p.partNumber)),
    [partNumbers]
  )

  const form = useForm<DocPartTagsInput, unknown, DocPartTagsValues>({
    resolver: zodResolver(docPartTagsSchema),
    defaultValues: {
      tags: docs.map((d) => ({ docKey: d.key, partNumbers: [] })),
    },
  })

  const watchedTags = form.watch("tags") ?? []
  const [triedNext, setTriedNext] = useState(false)

  const setPartsForDoc = (index: number, next: string[]) => {
    form.setValue(`tags.${index}.partNumbers`, next, {
      shouldValidate: false,
    })
  }

  const tagAllDemo = () => {
    docs.forEach((d, i) => {
      const vendorParts = parts.filter((p) => p.vendorCode === d.vendorCode)
      const scoped = vendorParts.length > 0 ? vendorParts : parts
      form.setValue(
        `tags.${i}.partNumbers`,
        scoped.map((p) => p.partNumber),
        { shouldValidate: false }
      )
    })
    setTriedNext(false)
  }

  const untaggedParts = partNumbers.filter(
    (n) =>
      !watchedTags.some((t) => (t.partNumbers ?? []).includes(n))
  )
  const showBanner = triedNext && untaggedParts.length > 0

  const carryParams = () => {
    const search = new URLSearchParams({
      kind,
      vendors: vendorsParam,
      parts: partsParam,
    })
    if (justification) search.set("justification", justification)
    if (rowsParam) search.set("rows", rowsParam)
    search.set("docs", docsParam)
    if (draft) search.set("draft", "1")
    return search.toString()
  }

  const backHref = `/create-ccr/documents?${carryParams()}`

  const tagParam = () =>
    watchedTags
      .map((t) => `${t.docKey}=${(t.partNumbers ?? []).join(",")}`)
      .join("|")

  const goNext = (asDraft: boolean) => {
    setTriedNext(true)
    if (!asDraft && untaggedParts.length > 0) return
    form.handleSubmit(() => {
      const search = new URLSearchParams({
        kind,
        vendors: vendorsParam,
        parts: partsParam,
      })
      if (justification) search.set("justification", justification)
      if (rowsParam) search.set("rows", rowsParam)
      search.set("docs", docsParam)
      const tags = tagParam()
      if (tags) search.set("tags", tags)
      if (asDraft || draft) search.set("draft", "1")
      router.push(`/create-ccr/stakeholders?${search.toString()}`)
    })()
  }

  return (
    <div className="min-h-svh bg-white">
      <CcrTopNav active="home" />

      <main className="px-4 py-3">
        <CcrWizardHeader
          title="Create Commercial Change Request"
          kind={kind}
          activeStep={4}
        />

        {docs.length === 0 ? (
          <p className="mt-6 rounded-sm bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-900">
            No documents were carried from the previous step.{" "}
            <Link href={backHref} className="font-bold underline">
              Go back and upload documents first.
            </Link>
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              goNext(false)
            }}
          >
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[12px] font-semibold text-neutral-700">
                Select Parts
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className="text-emerald-700"
                        aria-label="Select parts help"
                      >
                        <Info className="size-3" />
                      </button>
                    }
                  />
                  <TooltipContent>
                    Tag each document to the parts it supports
                  </TooltipContent>
                </Tooltip>
              </div>
              <button
                type="button"
                onClick={tagAllDemo}
                className="rounded-sm border border-emerald-800 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50"
              >
                Tag demo parts to all docs
              </button>
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
                    <TableHead className="w-72 px-2 py-1.5 font-semibold text-neutral-700">
                      Parts
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc, i) => (
                    <TableRow key={doc.key}>
                      <TableCell className="px-2 py-1.5 whitespace-normal">
                        {doc.name}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 whitespace-nowrap">
                        {doc.fileType}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 whitespace-nowrap">
                        {doc.vendorCode}
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <TagEditor
                          doc={doc}
                          parts={parts}
                          selected={watchedTags[i]?.partNumbers ?? []}
                          onChange={(next) => setPartsForDoc(i, next)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {showBanner ? (
              <p
                role="alert"
                className="mt-3 border-l-2 border-red-700 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-800"
              >
                <span className="mr-1 inline-flex size-4 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white">
                  !
                </span>
                All parts must be tagged to a quote.
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

export default function DocumentVendorPartsPage() {
  return (
    <Suspense>
      <DocumentVendorPartsForm />
    </Suspense>
  )
}
