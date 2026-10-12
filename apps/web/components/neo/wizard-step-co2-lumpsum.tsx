"use client"

import { useFormContext, useWatch } from "react-hook-form"
import {
  ControlledCountInput,
  ControlledDateField,
  ControlledRadioInline,
  ControlledSelectField,
  ControlledTextField,
  FieldLabel,
  StaticField,
} from "@/components/neo/wizard-fields"
import {
  co2Delta,
  companyCodes,
  materialGroups,
  plants,
  purchGroups,
  purchOrgs,
  vehicleLines,
} from "@/lib/neo-wizard"
import type { WizardValues } from "@/lib/neo-schemas"

export function Co2Step() {
  const { control } = useFormContext<WizardValues>()
  const co2Start = useWatch({ control, name: "co2Start" }) ?? ""
  const co2End = useWatch({ control, name: "co2End" }) ?? ""
  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-4">
      <ControlledTextField<WizardValues>
        id="co2start"
        label="Co2e Start Position (kg)"
        name="co2Start"
        control={control}
        placeholder="Co2e Start Position (kg)"
        inputMode="decimal"
      />
      <ControlledTextField<WizardValues>
        id="co2end"
        label="Co2e End Position (kg)"
        name="co2End"
        control={control}
        placeholder="Co2e End Position (kg)"
        inputMode="decimal"
      />
      <div>
        <FieldLabel hint="End minus start position">Co2e Delta (kg)</FieldLabel>
        <p className="flex h-8 items-center text-xs text-neutral-500">
          {co2Delta(co2Start, co2End) === "-"
            ? "-"
            : co2Delta(co2Start, co2End)}
        </p>
      </div>
      <ControlledDateField<WizardValues>
        label="Co2e Change Date"
        name="co2Change"
        control={control}
      />
    </div>
  )
}

export function LumpSumStep() {
  const { control } = useFormContext<WizardValues>()
  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-4">
      <ControlledSelectField<WizardValues>
        label="Material Group"
        name="materialGroup"
        control={control}
        options={materialGroups}
        placeholder="-- Please Select Material Group --"
      />
      <ControlledSelectField<WizardValues>
        label="Vehicle Line"
        name="vehicleLine"
        control={control}
        options={vehicleLines}
        placeholder="-- Please Select Vehicle Line --"
      />

      <div>
        <FieldLabel>Manual Invoice Required</FieldLabel>
        <ControlledRadioInline<WizardValues>
          name="manualInvoice"
          control={control}
          options={["Yes", "No"]}
        />
      </div>
      <ControlledCountInput<WizardValues>
        id="mino"
        label="Manual Invoice Number"
        name="manualInvoiceNo"
        control={control}
        max={255}
        placeholder="Manual Invoice Number"
      />

      <ControlledSelectField<WizardValues>
        label="Purchasing Org"
        name="purchOrg"
        control={control}
        options={purchOrgs}
        placeholder="-- Please Select Purchasing Org --"
      />
      <ControlledSelectField<WizardValues>
        label="Purchasing Group"
        name="purchGroup"
        control={control}
        options={purchGroups}
        placeholder="-- Please Select Purchasing Group --"
      />

      <ControlledSelectField<WizardValues>
        label="Company Code"
        name="companyCode"
        control={control}
        options={companyCodes}
        placeholder="-- Please Select Company Code --"
      />
      <ControlledSelectField<WizardValues>
        label="Plant"
        name="plant"
        control={control}
        options={plants}
        placeholder="-- Please Select Plant --"
      />

      <StaticField label="Cost Centre" value="" />
      <StaticField label="Account Code" value="" />

      <ControlledCountInput<WizardValues>
        id="saplsp"
        label="SAP LSP Reference"
        name="sapLsp"
        control={control}
        max={255}
        placeholder="SAP LSP Reference"
      />
      <ControlledCountInput<WizardValues>
        id="podesc"
        label="PO Description"
        name="poDesc"
        control={control}
        max={40}
        placeholder="PO Description"
      />
    </div>
  )
}
