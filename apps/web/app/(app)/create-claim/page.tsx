"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Check, Circle, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { NeoHeader } from "@/components/neo/neo-header"
import { CoreDataStep } from "@/components/neo/wizard-step-core"
import { ClaimDetailsStep } from "@/components/neo/wizard-step-claim"
import { DocumentsStep } from "@/components/neo/wizard-step-documents"
import { Co2Step, LumpSumStep } from "@/components/neo/wizard-step-co2-lumpsum"
import { PartsStep } from "@/components/neo/wizard-step-parts"
import {
  wizardSteps,
  type WizardStepKey,
} from "@/lib/neo-wizard"
import {
  stepSchemas,
  wizardSchema,
  type WizardValues,
} from "@/lib/neo-schemas"
import { useNeoStore } from "@/lib/neo-store"
import { useApi } from "@/lib/neo-api"
import type { ClaimRow } from "@/lib/neo-data"
import { cn } from "@workspace/ui/lib/utils"

function fmtDate(d: Date | undefined) {
  return d ? format(d, "dd MMM yyyy").toUpperCase() : ""
}

function toWizardDefaults(): WizardValues {
  return {
    onBehalf: false,
    buyerCode: "",
    claimType: undefined as unknown as WizardValues["claimType"],
    confidential: "No",
    fiscalYear: "2024-2025",
    notification: "",
    vendor: "",
    showAllVendors: false,
    dt2Vendor: "",
    showAllDt2: false,
    transactionType: undefined as unknown as WizardValues["transactionType"],
    transactionDrivers: "",
    transactionStart: undefined as unknown as WizardValues["transactionStart"],
    transactionEnd: undefined as unknown as WizardValues["transactionEnd"],
    transactionTypeBreakdown: "",
    nonStandardFlag: "",
    lever: "",
    myaRef: "",
    scpaRef: "",
    goodsReceipt: undefined as unknown as WizardValues["goodsReceipt"],
    implementation: undefined as unknown as WizardValues["implementation"],
    description: "",
    system: "",
    strategicBuyer: "",
    commodityArea: "",
    maturity: undefined as unknown as WizardValues["maturity"],
    likelihood: undefined as unknown as WizardValues["likelihood"],
    vendorCurrency: "USD",
    budgetExchangeRate: "1.27",
    annualForecastLocal: "",
    grossClaimLocal: "",
    docs: [],
    co2Start: "",
    co2End: "",
    co2Change: undefined as unknown as WizardValues["co2Change"],
    materialGroup: "",
    vehicleLine: "",
    manualInvoice: "No",
    manualInvoiceNo: "",
    purchOrg: "",
    purchGroup: "",
    companyCode: "",
    plant: "",
    sapLsp: "",
    poDesc: "",
    systemUpdate: "WIPS",
    claimTitle: "",
    wipsClaimNumber: "",
    partsCompanyCode: "GB03 - Jaguar Land Rover Limited",
    nafReference: "",
    selectedPlants: [],
    selectAllPlants: false,
    parts: [],
    showAllParts: false,
    partPlants: {},
    partPlantsSelectAll: {},
    partDetails: [],
    allPct: "",
    allAbs: "",
    generated: false,
  }
}

function WizardTitle() {
  const claimType = useWatch<WizardValues>({ name: "claimType" }) as
    | string
    | undefined
  const title = claimType
    ? `Create New ${claimType}`
    : "Create New Risk/Opportunity"
  return <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
}

function CreateClaimWizard() {
  const router = useRouter()
  const { addClaim, nextLineId, refresh } = useNeoStore()
  const { request } = useApi()
  const [step, setStep] = useState<WizardStepKey>("core")
  const [saved, setSaved] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const methods = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema) as never,
    defaultValues: toWizardDefaults(),
    mode: "onTouched",
  })

  const idx = wizardSteps.findIndex((s) => s.key === step)
  const isFirst = idx === 0
  const isLast = idx === wizardSteps.length - 1

  const validateStep = async (key: WizardStepKey) => {
    const schema = stepSchemas[key]
    const values = methods.getValues()
    const result = await schema.safeParseAsync(values)
    if (result.success) {
      methods.clearErrors()
      return true
    }
    methods.clearErrors()
    for (const issue of result.error.issues) {
      methods.setError(issue.path.join(".") as never, {
        type: "manual",
        message: issue.message,
      })
    }
    return false
  }

  const go = async (dir: 1 | -1) => {
    if (dir === 1) {
      const ok = await validateStep(step)
      if (!ok) return
    }
    const next = wizardSteps[idx + dir]
    if (next) {
      setStep(next.key)
      setSaved(null)
    }
  }

  const jump = async (key: WizardStepKey) => {
    if (key === step) return
    const targetIdx = wizardSteps.findIndex((s) => s.key === key)
    if (targetIdx > idx) {
      const ok = await validateStep(step)
      if (!ok) return
    }
    setStep(key)
    setSaved(null)
  }

  const buildRow = (values: WizardValues, status: string): ClaimRow => ({
    lineId: nextLineId(),
    parentId: "",
    supplierClaimType: values.claimType,
    transactionType: values.transactionType,
    fiscalYear: values.fiscalYear || "2024-2025",
    coc: "ZZ COC Test",
    confidential: values.confidential !== "No",
    vendorName: values.vendor
      ? values.vendor.replace(/^GJFTA - /, "")
      : "ARLINGTON AUTOMOTIVE LIMITED",
    vendorCode: values.vendor || "GJFTA - ARLINGTON AUTOMOTIVE LIMITED",
    description: values.description
      ? `${values.description.slice(0, 22)}...`
      : "testtesttesttesttest...",
    reportingValue: values.annualForecastLocal
      ? Number(values.annualForecastLocal.replace(/,/g, "") || 0).toLocaleString(
          "en-GB",
          { minimumFractionDigits: 4 }
        )
      : "0.0000",
    reportingNegative: values.claimType === "Risk",
    status,
    createdOn: format(new Date(), "dd MMM yyyy h:mm a").toUpperCase(),
    implementationDate: fmtDate(values.implementation) || "20 JUN 2024",
    isReserve: false,
    buyerCode: values.buyerCode || "ZZ0X",
    buyerName: "Buyer Officer",
    pmCode: "ZZ1X",
    pmName: "Purchasing Manager",
  })

  const submit = async (asDraft: boolean) => {
    setSubmitError(null)
    if (!asDraft) {
      const result = await wizardSchema.safeParseAsync(methods.getValues())
      if (!result.success) {
        methods.clearErrors()
        for (const issue of result.error.issues) {
          methods.setError(issue.path.join(".") as never, {
            type: "manual",
            message: issue.message,
          })
        }
        const firstBad = wizardSteps.find((s) =>
          result.error.issues.some((i) =>
            Object.keys(stepSchemas[s.key].shape).includes(String(i.path[0]))
          )
        )
        if (firstBad) setStep(firstBad.key)
        return
      }
      setSubmitting(true)
      try {
        const created = await request<{ lineId: string }>(`/api/claims`, {
          method: "POST",
          body: JSON.stringify(result.data),
        })
        await request(`/api/claims/${encodeURIComponent(created.lineId)}/submit`, {
          method: "POST",
        })
        refresh()
        router.push(`/claims/${encodeURIComponent(created.lineId)}`)
      } catch (e) {
        const row = buildRow(result.data, "Forecast")
        addClaim(row)
        refresh()
        setSubmitError(
          e instanceof Error
            ? `Backend unavailable, saved locally: ${e.message}`
            : "Backend unavailable, saved locally."
        )
        router.push(`/claims/${encodeURIComponent(row.lineId)}`)
      } finally {
        setSubmitting(false)
      }
      return
    }
    const values = methods.getValues()
    setSubmitting(true)
    try {
      const created = await request<{ lineId: string }>(`/api/claims`, {
        method: "POST",
        body: JSON.stringify(values),
      })
      refresh()
      router.push(`/claims/${encodeURIComponent(created.lineId)}`)
    } catch {
      const row = buildRow(values, "Draft")
      addClaim(row)
      refresh()
      router.push(`/claims/${encodeURIComponent(row.lineId)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="flex min-h-svh flex-col bg-neutral-100">
        <NeoHeader active="home" />

        <main className="flex-1 px-6 py-4">
          <div className="flex min-h-[70vh] flex-col bg-white shadow-sm">
            <div className="border-b border-neutral-200 px-6 py-4">
              <WizardTitle />
              <p className="mt-0.5 text-xs text-neutral-500">
                Enter all the details in order to create a new Risk or
                Opportunity
              </p>
            </div>

          <div className="flex flex-1">
            <aside className="w-44 shrink-0 border-r border-neutral-200 py-3">
              {wizardSteps.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => jump(s.key)}
                  className={cn(
                    "flex w-full items-center gap-2 border-l-2 px-4 py-2 text-left text-xs",
                    s.key === step
                      ? "border-emerald-700 font-semibold text-neutral-900"
                      : "border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                  )}
                >
                  {i < idx ? (
                    <Check className="size-3.5 text-emerald-700" />
                  ) : (
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        s.key === step ? "bg-emerald-700" : "bg-neutral-300"
                      )}
                    />
                  )}
                  {s.label}
                </button>
              ))}
            </aside>

            <div className="flex-1 px-8 py-5">
              {step === "core" && <CoreDataStep />}
              {step === "claim" && <ClaimDetailsStep />}
              {step === "documents" && <DocumentsStep />}
              {step === "co2" && <Co2Step />}
              {step === "lumpsum" && <LumpSumStep />}
              {step === "parts" && <PartsStep />}

              {saved && (
                <p className="mt-4 rounded bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                  {saved}
                </p>
              )}
              {submitError && (
                <p className="mt-4 rounded bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  {submitError}
                </p>
              )}
            </div>
          </div>

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
              {!isFirst && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-neutral-500"
                  onClick={() => go(-1)}
                >
                  <ArrowLeft className="size-3.5" /> PREVIOUS
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {!isLast ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-neutral-600"
                  onClick={() => go(1)}
                >
                  <ArrowRight className="size-3.5" /> NEXT
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-emerald-800 text-xs font-bold text-white hover:bg-emerald-700"
                  onClick={() => submit(false)}
                  disabled={submitting}
                >
                  <Check className="size-3.5" />{" "}
                  {submitting ? "SUBMITTING…" : "SUBMIT"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-neutral-600"
                disabled={submitting}
                onClick={() => {
                  if (isLast) submit(true)
                  else {
                    const v = methods.getValues()
                    setSaved(
                      `Draft saved at step "${wizardSteps[idx].label}" (${v.docs.length} document(s), ${v.parts.length} part(s)).`
                    )
                  }
                }}
              >
                <Circle className="size-3.5" /> SAVE AS DRAFT
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
    </FormProvider>
  )
}

export default function CreateClaimPage() {
  return <CreateClaimWizard />
}
