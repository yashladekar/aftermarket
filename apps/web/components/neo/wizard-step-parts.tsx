"use client"

import { useState } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { format } from "date-fns"
import { CalendarDays, Check, CheckCircle2, CircleX, Info, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
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
import {
  ControlledCheckRow,
  ControlledCountInput,
  ControlledRadioInline,
  ControlledSelectField,
  FieldError,
  FieldLabel,
} from "@/components/neo/wizard-fields"
import {
  absoluteChange,
  initialPartDetail,
  partNumberOptions,
  partsCompanyCodes,
  pctChange,
  plants,
  priceSign,
} from "@/lib/neo-wizard"
import type { WizardValues } from "@/lib/neo-schemas"
import { cn } from "@workspace/ui/lib/utils"

function PlantSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string
  onChange: (plant: string) => void
  options: string[]
  disabled?: boolean
}) {
  return (
    <div>
      <Select
        value={value || null}
        onValueChange={(v) => onChange(v ?? "")}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 w-full text-xs">
          <SelectValue placeholder="-- Please Select Plant --" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function MultiPicker({
  label,
  selected,
  onToggle,
  options,
  placeholder,
}: {
  label?: string
  selected: string[]
  onToggle: (v: string) => void
  options: string[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className={cn(
                "h-8 w-full justify-between text-xs font-normal",
                selected.length === 0 && "text-neutral-400"
              )}
            >
              <span className="truncate">
                {selected.length === 0 ? placeholder : selected.join(", ")}
              </span>
              <span className="ml-2 flex size-4 items-center justify-center rounded-full bg-emerald-700 text-[10px] text-white">
                {selected.length > 0 ? <Check className="size-3" /> : null}
              </span>
            </Button>
          }
        />
        <PopoverContent align="start" className="w-80 p-0">
          <Command>
            <CommandInput placeholder="Search" />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o}
                    value={o}
                    onSelect={() => onToggle(o)}
                    className="text-xs"
                  >
                    {o}
                    {selected.includes(o) && (
                      <Check className="ml-auto size-3.5 text-emerald-700" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function CellInput({
  value,
  onChange,
  placeholder,
  className,
  error,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  error?: string
}) {
  return (
    <div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={cn(
          "h-7 min-w-24 text-xs",
          error && "border-red-500",
          className
        )}
      />
      {error && (
        <p role="alert" className="mt-0.5 text-[10px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function RunoutDateCell({
  value,
  onChange,
  enabled,
}: {
  value: Date | undefined
  onChange: (d: Date | undefined) => void
  enabled: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={!enabled}
            className={cn(
              "h-7 w-28 justify-start px-2 text-xs font-normal",
              !value && "text-neutral-400"
            )}
          >
            {value ? format(value, "dd/MM/yyyy") : "-"}
            <CalendarDays className="ml-auto size-3.5 text-neutral-500" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}

export function PartsStep() {
  const { control, setValue, getValues, clearErrors } = useFormContext<WizardValues>()
  const claimType = useWatch({ control, name: "claimType" })
  const isRisk = claimType === "Risk"
  const parts = useWatch({ control, name: "parts" }) ?? []
  const showAllParts = useWatch({ control, name: "showAllParts" }) ?? false
  const partPlants = useWatch({ control, name: "partPlants" }) ?? {}
  const partPlantsSelectAll =
    useWatch({ control, name: "partPlantsSelectAll" }) ?? {}
  const selectedPlants = useWatch({ control, name: "selectedPlants" }) ?? []
  const selectAllPlants = useWatch({ control, name: "selectAllPlants" }) ?? false
  const generated = useWatch({ control, name: "generated" }) ?? false
  const allPct = useWatch({ control, name: "allPct" }) ?? ""
  const allAbs = useWatch({ control, name: "allAbs" }) ?? ""
  const { fields: detailFields, replace } = useFieldArray({
    control,
    name: "partDetails",
  })

  const togglePart = (p: string) => {
    const next = parts.includes(p)
      ? parts.filter((x) => x !== p)
      : [...parts, p]
    setValue("parts", next, { shouldValidate: true })
    setValue("generated", false)
    clearErrors("parts")
  }

  const togglePlant = (p: string) => {
    const next = selectedPlants.includes(p)
      ? selectedPlants.filter((x) => x !== p)
      : [...selectedPlants, p]
    setValue("selectedPlants", next, { shouldValidate: true })
    setValue("generated", false)
    clearErrors("selectedPlants")
  }

  const toggleSelectAllPlantsGlobal = (checked: boolean) => {
    setValue("selectAllPlants", checked)
    const next: Record<string, boolean> = {}
    parts.forEach((p) => {
      next[p] = checked
    })
    setValue("partPlantsSelectAll", next, { shouldValidate: true })
    setValue("generated", false)
    clearErrors("partPlants")
  }

  const toggleRowSelectAll = (p: string, checked: boolean) => {
    setValue(
      "partPlantsSelectAll",
      { ...partPlantsSelectAll, [p]: checked },
      { shouldValidate: true }
    )
    setValue("generated", false)
    clearErrors("partPlants")
  }

  const removePart = (p: string) => {
    setValue(
      "parts",
      parts.filter((x) => x !== p),
      { shouldValidate: true }
    )
    const nextPlants = { ...partPlants }
    delete nextPlants[p]
    setValue("partPlants", nextPlants, { shouldValidate: true })
    const nextSelectAll = { ...partPlantsSelectAll }
    delete nextSelectAll[p]
    setValue("partPlantsSelectAll", nextSelectAll)
    setValue("generated", false)
    clearErrors(["parts", "partPlants"])
  }

  const resetSelection = () => {
    setValue("parts", [], { shouldValidate: true })
    setValue("partPlants", {})
    setValue("partPlantsSelectAll", {})
    setValue("selectedPlants", [], { shouldValidate: true })
    setValue("selectAllPlants", false)
    replace([])
    setValue("generated", false)
    clearErrors(["parts", "partPlants", "selectedPlants", "partDetails"])
  }

  const fetchPartDetails = async () => {
    // TODO: call SAP lookup using partsCompanyCode + selectedPlants + parts
    const nextPartPlants = { ...partPlants }
    const nextSelectAll = { ...partPlantsSelectAll }
    parts.forEach((p) => {
      if (selectAllPlants) {
        nextSelectAll[p] = true
      } else if (!nextPartPlants[p] && selectedPlants[0]) {
        nextPartPlants[p] = selectedPlants[0]
      }
    })
    setValue("partPlants", nextPartPlants, { shouldValidate: true })
    setValue("partPlantsSelectAll", nextSelectAll, { shouldValidate: true })
  }

  const plantLabelFor = (p: string) =>
    partPlantsSelectAll[p]
      ? selectedPlants.length
        ? selectedPlants.join(", ")
        : "All Plants"
      : (partPlants[p] ?? "")

  const setDetail = (idx: number, patch: Record<string, unknown>) => {
    const current = getValues("partDetails")
    const row = current[idx]
    if (!row) return
    setValue(`partDetails.${idx}` as never, { ...row, ...patch } as never, {
      shouldValidate: true,
    })
  }

  const generate = () => {
    const current = getValues("partDetails")
    const details: ReturnType<typeof initialPartDetail>[] = []
    parts.forEach((p) => {
      // "Select All Plants" fans a single part out into one row per selected plant
      const plantsForRow =
        isRisk && partPlantsSelectAll[p]
          ? selectedPlants.length
            ? selectedPlants
            : [plants[0]]
          : [partPlants[p] || selectedPlants[0] || plants[0]]
      plantsForRow.forEach((plantName) => {
        const prev = current.find((d) => d.part === p && d.plant === plantName)
        details.push(
          prev ?? {
            ...initialPartDetail(p, plantName),
            description: p === "L8B29K335CC" ? "TUB ASY-FUL" : "Test",
          }
        )
      })
    })
    replace(details)
    setValue("generated", true, { shouldValidate: true })
  }

  const applyAllPct = (pctRaw: string) => {
    setValue("allPct", pctRaw, { shouldValidate: true })
    const pct = parseFloat(pctRaw)
    if (!Number.isFinite(pct)) return
    const current = getValues("partDetails")
    setValue(
      "partDetails",
      current.map((d) => {
        const c = parseFloat(d.currentPrice)
        if (!Number.isFinite(c)) return d
        return {
          ...d,
          newPrice: (c * (1 - pct / 100)).toLocaleString("en-GB", {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          }),
        }
      }),
      { shouldValidate: true }
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-4">
      {isRisk ? (
        <>
          <div className="col-span-2">
            <ControlledSelectField<WizardValues>
              label="Company Code"
              required
              hint="Enter the company code. Note: It is always GB03 for JLR"
              name="partsCompanyCode"
              control={control}
              options={partsCompanyCodes}
              allowAny={false}
            />
            <p className="mt-0.5 text-[10px] text-neutral-400">
              Please select GB03.
            </p>
          </div>
          <ControlledCountInput<WizardValues>
            id="nafref"
            label="NAF Reference"
            name="nafReference"
            control={control}
            max={255}
            placeholder="NAF Reference"
          />

          <div className="col-span-2 flex items-start gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              If you wish to introduce plant specific pricing for certain
              parts, please do this by raising a request with Transaction
              Driver of &apos;ATP&apos;.
            </span>
          </div>

          <div className="col-span-2">
            <MultiPicker
              label="Plants"
              selected={selectedPlants}
              onToggle={togglePlant}
              options={plants}
              placeholder="-- Please Select Plant --"
            />
            <p className="mt-0.5 text-[10px] text-neutral-400">
              Please select the plants to extract part details from SAP
            </p>
          </div>

          <div className="col-span-2 grid grid-cols-[1fr_auto] items-start gap-x-6">
            <MultiPicker
              label="Select Parts"
              selected={parts}
              onToggle={togglePart}
              options={partNumberOptions(true)}
              placeholder="-- Please Select Part --"
            />
            <div>
              <FieldLabel>Select All Plants</FieldLabel>
              <div className="flex h-8 items-center">
                <Checkbox
                  checked={selectAllPlants}
                  onCheckedChange={(v) =>
                    toggleSelectAllPlantsGlobal(v as boolean)
                  }
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <FieldLabel>System to Update</FieldLabel>
            <ControlledRadioInline<WizardValues>
              name="systemUpdate"
              control={control}
              options={["WIPS", "EMC"]}
            />
          </div>
          <ControlledCountInput<WizardValues>
            id="claimtitle"
            label="Claim Title"
            required
            name="claimTitle"
            control={control}
            max={255}
            placeholder="claim title"
          />

          <MultiPicker
            label="Part"
            selected={parts}
            onToggle={togglePart}
            options={partNumberOptions(showAllParts)}
            placeholder="-- Please Select Part --"
          />
          <ControlledCheckRow<WizardValues>
            name="showAllParts"
            control={control}
            label="Show all Part(s)"
          />
        </>
      )}

      {parts.length > 0 && (
        <div className="col-span-2">
          {isRisk ? (
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold text-neutral-700">
                Part to Plant Mapping
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                disabled={selectedPlants.length === 0}
                onClick={fetchPartDetails}
              >
                GET PART DETAILS
              </Button>
            </div>
          ) : (
            <p className="mb-1 text-[11px] font-bold text-neutral-700">
              Select Plant
            </p>
          )}
          <div className="border border-neutral-200">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-neutral-600">
                    {isRisk ? "Part Number" : "Part Number(s)"}
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-600">
                    {isRisk ? "Plants" : "Plant"}
                  </TableHead>
                  {isRisk && (
                    <>
                      <TableHead className="text-center text-[11px] font-semibold text-neutral-600">
                        Select All Plants
                      </TableHead>
                      <TableHead className="w-10" />
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((p) => {
                  const rowSelectAll = isRisk && !!partPlantsSelectAll[p]
                  return (
                    <TableRow key={p} className="hover:bg-transparent">
                      <TableCell>{p}</TableCell>
                      <TableCell>
                        {rowSelectAll ? (
                          <p className="text-xs text-neutral-600">
                            {plantLabelFor(p)}
                          </p>
                        ) : (
                          <PlantSelect
                            value={partPlants[p] ?? ""}
                            onChange={(plant) => {
                              const next = plant
                                ? { ...partPlants, [p]: plant }
                                : { ...partPlants }
                              if (!plant) delete next[p]
                              setValue("partPlants", next, {
                                shouldValidate: true,
                              })
                              setValue("generated", false)
                              clearErrors("partPlants")
                            }}
                            options={
                              isRisk && selectedPlants.length
                                ? selectedPlants
                                : plants
                            }
                          />
                        )}
                      </TableCell>
                      {isRisk && (
                        <>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={rowSelectAll}
                              onCheckedChange={(v) =>
                                toggleRowSelectAll(p, v as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removePart(p)}
                              aria-label={`Remove ${p}`}
                            >
                              <X className="size-3.5 text-red-500" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <FieldError
            message={(() => {
              const missing = parts.find(
                (p) => !partPlantsSelectAll[p] && !partPlants[p]
              )
              return missing
                ? `Select a plant for part ${missing}`
                : undefined
            })()}
          />
          <div className="mt-1 flex items-center justify-end gap-2">
            <span className="text-[11px] text-neutral-500">
              {parts.length} items
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={resetSelection}
            >
              RESET SELECTION
            </Button>
            <Button size="sm" className="h-7 text-[11px]" onClick={generate}>
              GENERATE PART DETAILS
            </Button>
          </div>
        </div>
      )}


      {generated && detailFields.length > 0 && (
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-x-10">
            <div>
              <FieldLabel hint="Enter the percentage and price difference from the current price listing">
                All % Difference
              </FieldLabel>
              <Input
                value={allPct}
                onChange={(e) => applyAllPct(e.target.value)}
                placeholder="All % Difference"
                inputMode="decimal"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <FieldLabel hint="Enter the percentage and price difference from the current price listing">
                All Absolute Price Change
              </FieldLabel>
              <Input
                value={allAbs}
                onChange={(e) =>
                  setValue("allAbs", e.target.value, { shouldValidate: true })
                }
                placeholder="All Absolute Price Change"
                inputMode="decimal"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <p className="mt-4 mb-1 text-[11px] font-bold text-neutral-700">
            Part Details
          </p>
          <div className="overflow-x-auto border border-neutral-200">
            <Table className="min-w-[1500px] text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[
                    "Part Number(s)",
                    "Plant",
                    "Current Price",
                    "Current Price Changed?",
                    "Current Value Currency",
                    "Description",
                    "New Part price",
                    "New Part price currency",
                    "Absolute Part Price Change",
                    "Part Price Change Sign",
                    "% Difference",
                    "Runout",
                    "Runout Date",
                    "ATP Reference",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="px-2 py-2 text-[11px] font-semibold whitespace-nowrap text-neutral-600"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailFields.map((field, i) => {
                  const d = getValues("partDetails")[i]
                  if (!d) return null
                  return (
                    <TableRow key={field.id} className="align-top">
                      <TableCell className="px-2 py-1.5 whitespace-nowrap">
                        {d.part}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 whitespace-nowrap">
                        {d.plant}
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <CellInput
                          value={d.currentPrice}
                          onChange={(v) =>
                            setDetail(i, {
                              currentPrice: v,
                              currentPriceChanged: true,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-center">
                        {d.currentPriceChanged ? (
                          <CheckCircle2 className="inline size-4 text-emerald-600" />
                        ) : (
                          <CircleX className="inline size-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <CellInput
                          value={d.currentCurrency}
                          onChange={(v) => setDetail(i, { currentCurrency: v })}
                          className="min-w-16"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <CellInput
                          value={d.description}
                          onChange={(v) => setDetail(i, { description: v })}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <CellInput
                          value={d.newPrice}
                          onChange={(v) => setDetail(i, { newPrice: v })}
                          placeholder="New Part pric"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <CellInput
                          value={d.newCurrency}
                          onChange={(v) => setDetail(i, { newCurrency: v })}
                          className="min-w-16"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <CellInput
                          value={
                            d.newPrice ? absoluteChange(d) : "Absolute Part"
                          }
                          onChange={() => {}}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-center text-lg font-bold text-red-600">
                        {priceSign(d)}
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <CellInput
                          value={d.newPrice ? pctChange(d) : "% Difference"}
                          onChange={() => {}}
                          className="min-w-20"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <ControlledRadioInline<WizardValues>
                          name={`partDetails.${i}.runout` as never}
                          control={control}
                          options={["Yes", "No"]}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <RunoutDateCell
                          value={d.runoutDate}
                          onChange={(dt) => setDetail(i, { runoutDate: dt })}
                          enabled={d.runout === "Yes"}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <CellInput
                          value={d.atpRef}
                          onChange={(v) => setDetail(i, { atpRef: v })}
                          placeholder="ATP Referenc"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <p className="mt-1 text-right text-[11px] text-neutral-500">
            {detailFields.length} items
          </p>
        </div>
      )}
    </div>
  )
}

