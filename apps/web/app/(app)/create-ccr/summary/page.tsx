"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Send, Undo2, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { CcrTopNav } from "@/components/aftermarket/ccr-top-nav"
import { CcrWizardHeader } from "@/components/aftermarket/ccr-wizard-header"
import { FieldError } from "@/components/aftermarket/wizard-fields"
import { vendorCatalog } from "@/lib/ccr-data"
import {
  onBehalfReasons,
  summaryDefaults,
  summarySchema,
  type SummaryInput,
  type SummaryValues,
} from "@/lib/ccr-schemas"

function SummaryForm() {
  const router = useRouter()
  const params = useSearchParams()
  const kind = params.get("kind") === "alb" ? "alb" : "standard"
  const draft = params.get("draft") === "1"
  const vendorsParam = params.get("vendors") ?? ""
  const partsParam = params.get("parts") ?? ""
  const justification = params.get("justification") ?? ""
  const rowsParam = params.get("rows") ?? ""
  const docsParam = params.get("docs") ?? ""
  const tagsParam = params.get("tags") ?? ""
  const stakeholdersParam = params.get("stakeholders") ?? ""
  const vendorCodes = vendorsParam ? vendorsParam.split(",").filter(Boolean) : []
  const partNumbers = partsParam ? partsParam.split(",").filter(Boolean) : []

  const vendors = vendorCatalog.filter((v) => vendorCodes.includes(v.code))

  const docs = useMemo(() => {
    if (!docsParam) return []
    return docsParam
      .split("|")
      .filter(Boolean)
      .map((entry) => {
        const [name = "", fileType = "Others"] = entry.split(":")
        return { name, fileType }
      })
  }, [docsParam])

  const quotes = docs.filter((d) => d.fileType === "Quote")
  const supporting = docs.filter((d) => d.fileType !== "Quote")

  const form = useForm<SummaryInput, unknown, SummaryValues>({
    resolver: zodResolver(summarySchema),
    defaultValues: summaryDefaults,
  })

  const carryParams = () => {
    const search = new URLSearchParams({
      kind,
      vendors: vendorsParam,
      parts: partsParam,
    })
    if (justification) search.set("justification", justification)
    if (rowsParam) search.set("rows", rowsParam)
    if (docsParam) search.set("docs", docsParam)
    if (tagsParam) search.set("tags", tagsParam)
    if (stakeholdersParam) search.set("stakeholders", stakeholdersParam)
    if (draft) search.set("draft", "1")
    return search.toString()
  }

  const backHref = `/create-ccr/stakeholders?${carryParams()}`

  const submit = (asDraft: boolean) =>
    form.handleSubmit(
      (values) => {
        const search = new URLSearchParams({
          kind,
          vendors: vendorsParam,
          parts: partsParam,
          onBehalf: values.onBehalfReason,
        })
        if (asDraft || draft) search.set("draft", "1")
        router.push(`/ccr-demo-submitted?${search.toString()}`)
      },
      () => {
        if (asDraft) {
          const search = new URLSearchParams({
            kind,
            vendors: vendorsParam,
            parts: partsParam,
          })
          search.set("draft", "1")
          router.push(`/ccr-demo-submitted?${search.toString()}`)
        }
      }
    )()

  return (
    <div className="min-h-svh bg-white">
      <CcrTopNav active="home" />

      <main className="px-4 py-3">
        <CcrWizardHeader
          title="Create Commercial Change Request"
          kind={kind}
          activeStep={6}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(false)
          }}
        >
          <p className="mx-auto mt-4 max-w-2xl border-l-2 border-emerald-800 bg-sky-50 px-3 py-2 text-[12px] leading-snug text-neutral-700">
            <span className="font-bold">Please Note :</span> All requested
            changes submitted via this portal are provisional and subject to
            JLR validation and approval. Except for changes approved by JLR,
            suppliers remain responsible to supply in accordance with existing
            contracts and commercial terms and standard performance metrics
            continue to apply.
          </p>

          <div className="mt-4 overflow-x-auto border border-neutral-200">
            <table className="w-full min-w-[800px] text-[12px]">
              <thead>
                <tr className="bg-neutral-50">
                  {["Vendor", "Parts", "Quote Documents", "Supporting Documents"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-1.5 text-center font-semibold text-neutral-700"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.code} className="border-t border-neutral-200 align-top">
                    <td className="px-3 py-2 text-center font-bold text-emerald-800">
                      {v.code} - {v.name}
                    </td>
                    <td className="px-3 py-2">
                      <ul className="list-disc pl-5 text-neutral-700">
                        {partNumbers.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-3 py-2">
                      <ul className="list-disc pl-5 text-neutral-700">
                        {quotes.length === 0 ? (
                          <li className="list-none text-neutral-400">—</li>
                        ) : (
                          quotes.map((q) => <li key={q.name}>{q.name}</li>)
                        )}
                      </ul>
                    </td>
                    <td className="px-3 py-2">
                      <ul className="list-disc pl-5 text-neutral-700">
                        {supporting.length === 0 ? (
                          <li className="list-none text-neutral-400">—</li>
                        ) : (
                          supporting.map((s) => <li key={s.name}>{s.name}</li>)
                        )}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 max-w-xl">
            <label
              htmlFor="on-behalf"
              className="text-[12px] font-bold text-neutral-900"
            >
              Reason for raising on behalf of supplier{" "}
              <span className="text-red-700">*</span>
            </label>
            <Controller
              name="onBehalfReason"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v ?? "")}
                >
                  <SelectTrigger
                    id="on-behalf"
                    className="mt-1 h-8 w-full border-neutral-300 text-[12px]"
                  >
                    <SelectValue placeholder="-- Select a On Behalf Of Supplier Reason --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none" disabled>
                      -- Select a On Behalf Of Supplier Reason --
                    </SelectItem>
                    {onBehalfReasons.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError
              message={form.formState.errors.onBehalfReason?.message}
            />
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
                onClick={() => submit(true)}
                className="h-7 rounded-sm border-emerald-800 px-2.5 text-[11px] font-bold text-emerald-800"
              >
                <Save className="size-3" /> SAVE AS DRAFT
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-7 rounded-sm bg-emerald-800 px-2.5 text-[11px] font-bold text-white hover:bg-emerald-700"
              >
                <Send className="size-3" /> SUBMIT
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function SummaryPage() {
  return (
    <Suspense>
      <SummaryForm />
    </Suspense>
  )
}
