"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Check, Circle, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { NeoHeader } from "@/components/neo/neo-header"
import {
  ControlledAreaField,
  ControlledCountInput,
  ControlledRadioInline,
  ControlledSelectField,
} from "@/components/neo/wizard-fields"
import { initialMandateForm } from "@/lib/neo-store"
import { useApi } from "@/lib/neo-api"
import { mandateSchema, type MandateValues } from "@/lib/neo-schemas"
import { useNeoStore } from "@/lib/neo-store"
import { cn } from "@workspace/ui/lib/utils"

const riskFactors = [
  "Commercial",
  "Technical",
  "Schedule",
  "Quality",
  "Financial",
]

const categories = ["Prompt Payment", "Inflation", "Settlement", "Other"]

const audits = ["Internal", "External", "None"]

function MandateWizard() {
  const router = useRouter()
  const params = useSearchParams()
  const preselected = params.get("claim")
  const { claims, approvals, addApproval, refresh } = useNeoStore()
  const { request } = useApi()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [step, setStep] = useState<0 | 1>(0)
  const [selected, setSelected] = useState<string[]>(
    preselected ? [preselected] : ["MCI-00160"]
  )
  const methods = useForm<MandateValues>({
    resolver: zodResolver(mandateSchema) as never,
    defaultValues: initialMandateForm as MandateValues,
    mode: "onTouched",
  })
  const { control, handleSubmit, clearErrors } = methods

  const linked = useMemo(
    () =>
      claims.filter((c) => selected.includes(c.lineId)).map((c) => ({
        lineId: c.lineId,
        supplierClaimType: c.supplierClaimType || "Opportunity",
        createdOn: c.createdOn,
        fiscalYear: c.fiscalYear,
        buyerCode: c.buyerCode,
        buyerName: c.buyerName,
        pmCode: c.pmCode,
        pmName: c.pmName,
        coc: c.coc,
        vendorCode: "GJFTA",
        vendorName: c.vendorName,
        dt2VendorCode: "GJFTA",
        description: c.description,
        implementationDate: c.implementationDate,
        reportingValue: "118,110.2362",
        status: c.status || "Forecast",
        nonStandard: "",
        isReserve: c.isReserve,
      })),
    [claims, selected]
  )

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    )

  const submit = (draft: boolean) => {
    const run = async (values: MandateValues) => {
      setSubmitError(null)
      const payload = { ...values, claimIds: selected }
      try {
        const created = await request<{ number: string }>(`/api/mandates`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
        if (!draft) {
          await request(`/api/mandates/${created.number}/submit`, {
            method: "POST",
          })
        }
        refresh()
        router.push("/approval-requests")
        return
      } catch (e) {
        if (!draft) {
          setSubmitError(
            e instanceof Error ? e.message : "Failed to submit mandate"
          )
          return
        }
      }
      const nums = approvals.map((a) => parseInt(a.id, 10))
      const max = Math.max(63, ...nums.filter((n) => Number.isFinite(n)))
      const id = String(max + 1)
      addApproval({
        id,
        requestType: "Mandate",
        category: values.category || "Prompt Payment",
        level: "Local Clearing House",
        overall: draft
          ? "Draft Mandate Request"
          : "Awaiting DOA Approval Mandate Request",
        clearing: "",
        doa: draft ? "Draft" : "Submitted",
        valueVat: "",
        initialTotal: "-",
        risks: "(50,000.0000)",
        risksNegative: true,
        opportunities: "0.0000",
        vendorCode: "GJFTA",
        vendorName: linked[0]?.vendorName ?? "",
      coc: "ZZ COC Test",
      raiser: "Buyer Officer",
      stakeholders: values.stakeholders,
      daysPending: "0",
      openEnquiries: "",
      actionOutside: "",
      ageDate: "",
    })
    router.push("/approval-requests")
    }
    if (draft) {
      const values = methods.getValues()
      run(values)
      return
    }
    clearErrors()
    handleSubmit(run)()
  }

  return (
    <FormProvider {...methods}>
    <div className="flex min-h-svh flex-col bg-neutral-100">
      <NeoHeader active="home" />

      <main className="flex-1 px-6 py-4">
        <div className="flex min-h-[70vh] flex-col bg-white shadow-sm">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h1 className="text-xl font-semibold text-neutral-900">
              Create Mandate Request
            </h1>
          </div>

          <div className="flex items-center px-6 pt-3 text-[11px] text-neutral-500">
            <button
              type="button"
              onClick={() => setStep(0)}
              className={cn(step === 0 && "font-bold text-neutral-900")}
            >
              Select Claims
            </button>
            <span className="mx-4 h-0.5 flex-1 bg-emerald-800" />
            <button
              type="button"
              onClick={() => selected.length > 0 && setStep(1)}
              className={cn(step === 1 && "font-bold text-neutral-900")}
            >
              Add Request Details
            </button>
          </div>

          <div className="flex-1 px-6 py-4">
            {step === 0 && (
              <div>
                <p className="mb-1 text-[11px] font-bold text-neutral-700">
                  Linked Claims
                </p>
                <div className="overflow-x-auto border border-neutral-200">
                  <Table className="min-w-[1400px] text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        {[
                          "Line ID",
                          "Supplier Claim Type",
                          "Created On",
                          "Fiscal Year",
                          "Buyer Code",
                          "Buyer Name",
                          "PM Code",
                          "PM Name",
                          "CoC",
                          "Vendor Code",
                          "Vendor Name",
                          "DT2 Vendor Code",
                          "Description",
                          "Implementation Date",
                          "Reporting Value (£)",
                          "Status",
                          "Non Standard Accounting",
                          "Is Reserve",
                        ].map((h) => (
                          <TableHead
                            key={h}
                            className="text-[11px] font-semibold whitespace-nowrap text-neutral-600"
                          >
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((c) => (
                        <TableRow key={c.lineId}>
                          <TableCell>
                            <Checkbox
                              checked={selected.includes(c.lineId)}
                              onCheckedChange={() => toggle(c.lineId)}
                            />
                          </TableCell>
                          <TableCell className="font-bold whitespace-nowrap text-emerald-800">
                            {c.lineId}
                          </TableCell>
                          <TableCell>
                            {c.supplierClaimType || "Opportunity"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {c.createdOn}
                          </TableCell>
                          <TableCell>{c.fiscalYear}</TableCell>
                          <TableCell>ZZ0X</TableCell>
                          <TableCell>Buyer Officer</TableCell>
                          <TableCell>ZZ1X</TableCell>
                          <TableCell>Purchasing Manager</TableCell>
                          <TableCell>ZZ COC Test</TableCell>
                          <TableCell>GJFTA</TableCell>
                          <TableCell className="whitespace-normal uppercase">
                            {c.vendorName}
                          </TableCell>
                          <TableCell>GJFTA</TableCell>
                          <TableCell className="max-w-40 whitespace-normal">
                            {c.description}{" "}
                            <span className="font-medium text-emerald-700">
                              more
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {c.implementationDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-emerald-800">
                            118,110.2362
                          </TableCell>
                          <TableCell>{c.status || "Forecast"}</TableCell>
                          <TableCell />
                          <TableCell className="text-center">
                            {c.isReserve ? "✓" : "⊗"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                <div className="col-span-2">
                  <ControlledAreaField<MandateValues>
                    id="problem"
                    label="Problem Statement"
                    required
                    hint="What problem does this mandate solve?"
                    name="problem"
                    control={control}
                    placeholder="Problem Statement"
                    max={2000}
                  />
                </div>
                <div className="col-span-2">
                  <ControlledAreaField<MandateValues>
                    id="details"
                    label="Details of Request"
                    required
                    hint="Full details of the mandate request"
                    name="details"
                    control={control}
                    placeholder="Details of Request"
                    max={2000}
                  />
                </div>

                <div>
                  <p className="mb-1 text-[11px] font-bold text-neutral-700">
                    FBP CDSID
                  </p>
                  <p className="flex h-8 items-center text-xs text-neutral-500">
                    FBP Officer
                  </p>
                </div>
                <ControlledCountInput<MandateValues>
                  id="reds"
                  label="REDS Score"
                  name="reds"
                  control={control}
                  max={255}
                  placeholder="REDS Score"
                />

                <div>
                  <p className="mb-1 text-[11px] font-bold text-neutral-700">
                    Any Proposed changes to GT&C?*
                  </p>
                  <ControlledRadioInline<MandateValues>
                    name="proposedChanges"
                    control={control}
                    options={["Yes", "No"]}
                  />
                </div>
                <ControlledSelectField<MandateValues>
                  label="Main Risk Factor"
                  name="mainRisk"
                  control={control}
                  options={riskFactors}
                  placeholder="-- Select one or more Main Risk Factor --"
                />

                <ControlledSelectField<MandateValues>
                  label="Category"
                  required
                  name="category"
                  control={control}
                  options={categories}
                  placeholder="-- Select a Category --"
                />
                <ControlledSelectField<MandateValues>
                  label="Audit"
                  required
                  name="audit"
                  control={control}
                  options={audits}
                  placeholder="-- Select a Audit --"
                />

                <ControlledCountInput<MandateValues>
                  id="stake"
                  label="Other stakeholders"
                  name="stakeholders"
                  control={control}
                  max={255}
                  placeholder="Other stakeholders"
                />
                <ControlledCountInput<MandateValues>
                  id="ariba"
                  label="Ariba Reference (Contracts MYA's SCPA's)"
                  name="ariba"
                  control={control}
                  max={255}
                  placeholder="Ariba Reference (Contracts MYA's SCPA's)"
                />

                <div className="col-span-2">
                  <h3 className="flex items-center gap-1 text-sm font-bold text-emerald-900">
                    <span className="text-[10px]">﹀</span> Mandate Values
                  </h3>
                  <div className="mt-2 overflow-x-auto border border-neutral-200">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference Number</TableHead>
                          <TableHead>Supplier Claim Type</TableHead>
                          <TableHead>Transaction Type</TableHead>
                          <TableHead>Non-Standard Transaction Flag</TableHead>
                          <TableHead>Mandate Value (£)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linked.map((l) => (
                          <TableRow key={l.lineId}>
                            <TableCell>{l.lineId}</TableCell>
                            <TableCell>{l.supplierClaimType}</TableCell>
                            <TableCell>Lump Sum</TableCell>
                            <TableCell>{l.nonStandard}</TableCell>
                            <TableCell>118110.2362</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {submitError && (
            <p className="mx-6 mb-2 rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {submitError}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => router.push("/")}
              >
                <X className="size-3.5" /> CANCEL
              </Button>
              {step === 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-neutral-500"
                  onClick={() => setStep(0)}
                >
                  ← PREVIOUS
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-neutral-600"
                onClick={() => submit(true)}
              >
                <Circle className="size-3.5" /> SAVE AS DRAFT
              </Button>
              {step === 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-neutral-600"
                  disabled={selected.length === 0}
                  onClick={() => setStep(1)}
                >
                  <ArrowRight className="size-3.5" /> NEXT
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-emerald-800 text-xs font-bold text-white hover:bg-emerald-700"
                  onClick={() => submit(false)}
                >
                  <Check className="size-3.5" /> SUBMIT
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
    </FormProvider>
  )
}

export default function MandateRequestPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
      <MandateWizard />
    </Suspense>
  )
}
