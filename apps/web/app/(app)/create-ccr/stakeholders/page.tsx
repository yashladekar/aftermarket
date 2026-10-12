"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useRef, useState } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Check,
  ChevronDown,
  CirclePlus,
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
import { CcrTopNav } from "@/components/aftermarket/ccr-top-nav"
import { CcrWizardHeader } from "@/components/aftermarket/ccr-wizard-header"
import { FieldError } from "@/components/aftermarket/wizard-fields"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { demoStakeholders } from "@/lib/ccr-data"
import {
  stakeholderContactTypes,
  stakeholdersDefaults,
  stakeholdersSchema,
  type StakeholdersInput,
  type StakeholdersValues,
} from "@/lib/ccr-schemas"
import { cn } from "@workspace/ui/lib/utils"

function VendorMultiSelect({
  value,
  onChange,
  options,
  error,
}: {
  value: string[]
  onChange: (next: string[]) => void
  options: string[]
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const set = new Set(value)

  const toggle = (code: string) => {
    if (set.has(code)) onChange(value.filter((c) => c !== code))
    else onChange([...value, code])
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
        aria-label="Select one or more Vendor"
        className={cn(
          "flex min-h-8 w-full items-center justify-between gap-1 rounded-sm border bg-white px-2 py-1 text-left text-[12px] text-neutral-700",
          error ? "border-red-500" : "border-neutral-300"
        )}
      >
        <span className="truncate">
          {value.length === 0 ? "-- Select one or more Vendor --" : value.join(", ")}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-neutral-500" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-sm border border-neutral-300 bg-white shadow-md">
          {options.map((code) => {
            const active = set.has(code)
            return (
              <button
                key={code}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggle(code)}
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
                {code}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StakeholdersForm() {
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
  const vendorCodes = vendorsParam ? vendorsParam.split(",").filter(Boolean) : []

  const form = useForm<StakeholdersInput, unknown, StakeholdersValues>({
    resolver: zodResolver(stakeholdersSchema),
    defaultValues: stakeholdersDefaults,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stakeholders",
  })

  const addStakeholder = () =>
    append({
      contactType: "External",
      name: "",
      email: "",
      vendorCodes: [],
    })

  const addDemo = () => {
    demoStakeholders.forEach((d) => {
      append({
        contactType: d.contactType,
        name: d.name,
        email: d.email,
        vendorCodes: d.vendorCodes.filter((c) => vendorCodes.includes(c)),
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
    if (docsParam) search.set("docs", docsParam)
    if (tagsParam) search.set("tags", tagsParam)
    if (draft) search.set("draft", "1")
    return search.toString()
  }

  const backHref = `/create-ccr/document-vendor-parts?${carryParams()}`

  const stakeholderParam = () =>
    (form.getValues("stakeholders") ?? [])
      .filter((s) => (s.name ?? "").trim() !== "" || (s.email ?? "").trim() !== "")
      .map(
        (s) =>
          `${s.contactType}:${s.name}:${s.email}:${(s.vendorCodes ?? []).join(",")}`
      )
      .join("|")

  const goNext = (asDraft: boolean) =>
    form.handleSubmit(() => {
      const search = new URLSearchParams({
        kind,
        vendors: vendorsParam,
        parts: partsParam,
      })
      if (justification) search.set("justification", justification)
      if (rowsParam) search.set("rows", rowsParam)
      if (docsParam) search.set("docs", docsParam)
      if (tagsParam) search.set("tags", tagsParam)
      const holders = stakeholderParam()
      if (holders) search.set("stakeholders", holders)
      if (asDraft || draft) search.set("draft", "1")
      router.push(`/create-ccr/summary?${search.toString()}`)
    })()

  return (
    <div className="min-h-svh bg-white">
      <CcrTopNav active="home" />

      <main className="px-4 py-3">
        <CcrWizardHeader
          title="Create Commercial Change Request"
          kind={kind}
          activeStep={5}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault()
            goNext(false)
          }}
        >
          <p className="mt-4 bg-sky-50 px-3 py-2 text-[12px] text-neutral-700">
            <span className="font-bold">Information :</span> Add/Update
            additional contacts to be able to view this CCR and to be copied
            on all comms and notifications throughout the progress of this
            CCR.
          </p>

          {fields.map((field, i) => (
            <section key={field.id} className="mt-3">
              <div className="flex items-center justify-between bg-emerald-800 px-3 py-1.5 text-[12px] font-bold text-white">
                <span>Email {i + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove stakeholder ${i + 1}`}
                  className="hover:text-red-200"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 border border-t-0 border-neutral-200 px-3 py-2 md:grid-cols-4">
                <div>
                  <span className="flex items-center gap-1 text-[12px] font-semibold text-neutral-700">
                    User Contact Type
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            className="text-emerald-700"
                            aria-label="User contact type help"
                          >
                            <Info className="size-3" />
                          </button>
                        }
                      />
                      <TooltipContent>
                        Internal or external contact
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <Controller
                    name={`stakeholders.${i}.contactType`}
                    control={form.control}
                    render={({ field: f }) => (
                      <Select
                        value={f.value ?? "External"}
                        onValueChange={(v) =>
                          f.onChange(
                            v as (typeof stakeholderContactTypes)[number]
                          )
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 w-full border-neutral-300 text-[12px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stakeholderContactTypes.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`holder-name-${i}`}
                    className="text-[12px] font-semibold text-neutral-700"
                  >
                    Name
                  </label>
                  <Controller
                    name={`stakeholders.${i}.name`}
                    control={form.control}
                    render={({ field: f }) => (
                      <Input
                        id={`holder-name-${i}`}
                        value={f.value ?? ""}
                        onChange={(e) => f.onChange(e.target.value)}
                        className="mt-1 h-8 border-neutral-300 text-[12px]"
                      />
                    )}
                  />
                  <FieldError
                    message={
                      form.formState.errors.stakeholders?.[i]?.name?.message
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor={`holder-email-${i}`}
                    className="text-[12px] font-semibold text-neutral-700"
                  >
                    Email Address
                  </label>
                  <Controller
                    name={`stakeholders.${i}.email`}
                    control={form.control}
                    render={({ field: f }) => (
                      <Input
                        id={`holder-email-${i}`}
                        type="email"
                        value={f.value ?? ""}
                        onChange={(e) => f.onChange(e.target.value)}
                        className="mt-1 h-8 border-neutral-300 text-[12px]"
                      />
                    )}
                  />
                  <FieldError
                    message={
                      form.formState.errors.stakeholders?.[i]?.email?.message
                    }
                  />
                </div>
                <div>
                  <span className="text-[12px] font-semibold text-neutral-700">
                    Vendors <span className="text-red-700">*</span>
                  </span>
                  <div className="mt-1">
                    <Controller
                      name={`stakeholders.${i}.vendorCodes`}
                      control={form.control}
                      render={({ field: f }) => (
                        <VendorMultiSelect
                          value={f.value ?? []}
                          onChange={(next) => f.onChange(next)}
                          options={vendorCodes}
                          error={
                            form.formState.errors.stakeholders?.[i]?.vendorCodes
                              ?.message
                          }
                        />
                      )}
                    />
                  </div>
                  <FieldError
                    message={
                      form.formState.errors.stakeholders?.[i]?.vendorCodes
                        ?.message as string | undefined
                    }
                  />
                </div>
              </div>
            </section>
          ))}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={addStakeholder}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-800 hover:underline"
            >
              <CirclePlus className="size-3.5" /> Add Stakeholder
            </button>
            <button
              type="button"
              onClick={addDemo}
              className="rounded-sm border border-emerald-800 px-2 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50"
            >
              Add demo stakeholder
            </button>
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
                NEXT
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function StakeholdersPage() {
  return (
    <Suspense>
      <StakeholdersForm />
    </Suspense>
  )
}
