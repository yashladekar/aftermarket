"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { useFormContext, useWatch } from "react-hook-form"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Button } from "@workspace/ui/components/button"
import {
  FieldError,
  FieldLabel,
} from "@/components/neo/wizard-fields"
import { buyerCodes, buyerNames } from "@/lib/neo-wizard"
import type { WizardValues } from "@/lib/neo-schemas"
import { cn } from "@workspace/ui/lib/utils"

function BuyerPicker({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <FieldLabel>Buyer Code</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className={cn(
                "h-8 w-full max-w-md justify-start text-xs font-normal",
                !value && "text-neutral-400",
                error && "border-red-500"
              )}
            >
              {value || "-- Please Select Buyer Code --"}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-72 p-0">
          <Command>
            <CommandInput placeholder="Search" />
            <CommandList>
              <CommandEmpty>No buyer found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__none"
                  onSelect={() => {
                    onChange("")
                    setOpen(false)
                  }}
                  className="bg-emerald-800 text-xs font-semibold text-white data-selected:bg-emerald-800 data-selected:text-white"
                >
                  -- Please Select Buyer Code --
                </CommandItem>
                {buyerCodes.map((c) => (
                  <CommandItem
                    key={c}
                    value={c}
                    onSelect={() => {
                      onChange(c)
                      setOpen(false)
                    }}
                    className="text-xs"
                  >
                    {c}
                    {value === c && <Check className="ml-auto size-3.5" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FieldError message={error} />
    </div>
  )
}

export function CoreDataStep() {
  const {
    control,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<WizardValues>()
  const buyerCode = useWatch({ control, name: "buyerCode" }) ?? ""
  const onBehalf = useWatch({ control, name: "onBehalf" }) ?? false
  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-4">
      <div className="col-span-2">
        <p className="mb-1 text-[11px] font-bold text-neutral-700">
          On Behalf of Another Buyer
        </p>
        <Checkbox
          checked={onBehalf}
          onCheckedChange={(v) => setValue("onBehalf", v as boolean)}
        />
      </div>

      <BuyerPicker
        value={buyerCode}
        onChange={(v) => {
          setValue("buyerCode", v, { shouldValidate: true })
          clearErrors("buyerCode")
        }}
        error={errors.buyerCode?.message as string | undefined}
      />
      <div>
        <p className="mb-1 text-[11px] font-bold text-neutral-700">Buyer Name</p>
        <p className="flex h-8 items-center text-xs text-neutral-500">
          {buyerCode ? (buyerNames[buyerCode] ?? "Buyer Officer") : ""}
        </p>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-bold text-neutral-700">Buyer Code</p>
        <p className="flex h-8 items-center text-xs text-neutral-600">
          {buyerCode || "ZZOX"}
        </p>
      </div>
      <div />

      <div>
        <p className="mb-1 text-[11px] font-bold text-neutral-700">PM Code</p>
        <p className="flex h-8 items-center text-xs text-neutral-600">ZZ1X</p>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-bold text-neutral-700">PM Name</p>
        <p className="flex h-8 items-center text-xs text-neutral-500">
          Purchasing Manager
        </p>
      </div>
    </div>
  )
}
