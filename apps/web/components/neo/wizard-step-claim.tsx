"use client"

import { useFormContext, useWatch } from "react-hook-form"
import {
  ControlledAreaField,
  ControlledCountInput,
  ControlledDateField,
  ControlledRadioCards,
  ControlledRadioInline,
  ControlledSelectField,
  ControlledTextField,
  ControlledCheckRow,
  FieldLabel,
  StaticField,
} from "@/components/neo/wizard-fields"
import {
  commodityAreas,
  fiscalYears,
  levers,
  nonStandardFlags,
  notificationMethods,
  strategicBuyers,
  systems,
  toGbp,
  transactionDrivers,
  transactionTypeBreakdownOptions,
  vendorOptions,
  calendarisedForecastLocal,
  calendarisedForecastGbp,
} from "@/lib/neo-wizard"
import { likelihoods, maturityStatuses } from "@/lib/neo-wizard"
import type { WizardValues } from "@/lib/neo-schemas"

export function ClaimDetailsStep() {
  const { control, setValue } = useFormContext<WizardValues>()
  const vendor = useWatch({ control, name: "vendor" }) ?? ""
  const dt2Vendor = useWatch({ control, name: "dt2Vendor" }) ?? ""
  const showAllVendors = useWatch({ control, name: "showAllVendors" }) ?? false
  const showAllDt2 = useWatch({ control, name: "showAllDt2" }) ?? false
  const transactionType = useWatch({ control, name: "transactionType" }) ?? ""
  const annualForecastLocal =
    useWatch({ control, name: "annualForecastLocal" }) ?? ""
  const description = useWatch({ control, name: "description" }) ?? ""
  const vendorCurrency = useWatch({ control, name: "vendorCurrency" }) ?? "USD"
  const budgetExchangeRate =
    useWatch({ control, name: "budgetExchangeRate" }) ?? "1.27"
  const vendorName = vendor || "-"
  const dt2Name = dt2Vendor || "-"

  const fetchVendorDetails = async () => {
    // TODO: call /api/lookups/vendors/{vendorCode} and populate currency/exchange rate
    try {
      if (vendor.includes("ARLINGTON")) {
        setValue("vendorCurrency", "USD")
      } else if (vendor.includes("TRELLEBORG")) {
        setValue("vendorCurrency", "EUR")
      }
    } catch (error) {
      console.error("Error fetching vendor details:", error)
    }
  }
  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-4">
      <div className="col-span-2 grid grid-cols-2 gap-x-10">
        <div>
          <FieldLabel required>Supplier Claim Type</FieldLabel>
          <ControlledRadioCards<WizardValues, "Risk" | "Opportunity">
            name="claimType"
            control={control}
            options={["Risk", "Opportunity"]}
          />
        </div>
        <div>
          <FieldLabel>Confidential?</FieldLabel>
          <ControlledRadioInline<WizardValues>
            name="confidential"
            control={control}
            options={["Yes", "No"]}
          />
        </div>
      </div>

      <ControlledSelectField<WizardValues>
        label="Fiscal Year"
        required
        name="fiscalYear"
        control={control}
        options={fiscalYears}
        allowAny={false}
      />
      <div>
        <FieldLabel required hint="Any selection made here should be supported with relevant document uploaded onto the next step. Note: Emails to be converted into PDFs and then uploaded">
          Method of Notification
        </FieldLabel>
        <ControlledRadioInline<WizardValues>
          name="notification"
          control={control}
          options={notificationMethods}
        />
      </div>

      <ControlledSelectField<WizardValues>
        label="Vendor"
        required
        hint="Click 'Get Details' button to fetch and populate vendor details with associated currency"
        name="vendor"
        control={control}
        options={vendorOptions(showAllVendors)}
        placeholder="-- Please Select Vendor --"
      />
      <div className="grid grid-cols-3 items-end gap-x-4">
        <ControlledCheckRow<WizardValues>
          name="showAllVendors"
          control={control}
          label="Show all Vendor(s)"
        />
        <button
          type="button"
          onClick={fetchVendorDetails}
          disabled={!vendor}
          className="h-8 rounded bg-emerald-700 px-2 text-xs font-medium text-white disabled:bg-neutral-300"
        >
          Get Vendor Details
        </button>
        <StaticField label="Vendor Name" value={vendorName} />
      </div>

      <ControlledSelectField<WizardValues>
        label="DT2 Vendor"
        hint="Direct-to-tier-2 vendor, if applicable"
        name="dt2Vendor"
        control={control}
        options={vendorOptions(showAllDt2)}
        placeholder="-- Please Select DT2 Vendor --"
      />
      <div className="grid grid-cols-2 gap-x-10">
        <ControlledCheckRow<WizardValues>
          name="showAllDt2"
          control={control}
          label="Show all DT2 Vendor(s)"
        />
        <StaticField label="DT2 Vendor Name" value={dt2Name} />
      </div>

      <div className="col-span-2 grid grid-cols-4 gap-x-10">
        <div>
          <FieldLabel required>Transaction Type</FieldLabel>
          <ControlledRadioInline<WizardValues>
            name="transactionType"
            control={control}
            options={["Lump Sum", "POA"]}
          />
        </div>
        {transactionType === "Lump Sum" && (
          <>
            <ControlledDateField<WizardValues>
              label="Transaction Start Date"
              required
              name="transactionStart"
              control={control}
            />
            <ControlledDateField<WizardValues>
              label="Transaction End Date"
              required
              name="transactionEnd"
              control={control}
            />
            <div>
              <FieldLabel hint="NON_STANDARD_ACCOUNTING_ID ref">
                Non-Standard Transaction Flag
              </FieldLabel>
              <ControlledRadioInline<WizardValues>
                name="nonStandardFlag"
                control={control}
                options={["Prepayment", "Loans", "Deposits"]}
              />
            </div>
          </>
        )}
        {transactionType === "POA" && (
          <>
            <ControlledDateField<WizardValues>
              label="Effective Date"
              required
              hint="Give the effective date when POA is commencing"
              name="transactionStart"
              control={control}
            />
            <div>
              <FieldLabel required hint="Select the transaction type breakdown for this POA">
                Transaction Type Breakdown
              </FieldLabel>
              <ControlledRadioInline<WizardValues>
                name="transactionTypeBreakdown"
                control={control}
                options={transactionTypeBreakdownOptions}
              />
            </div>
            <div />
          </>
        )}
      </div>

      <div className="col-span-2">
        <FieldLabel hint="Currency, Non Design or Raw Material driver for this claim">
          Transaction Drivers
        </FieldLabel>
        <ControlledRadioInline<WizardValues>
          name="transactionDrivers"
          control={control}
          options={transactionDrivers}
        />
      </div>

      <div className="col-span-2">
        <ControlledSelectField<WizardValues>
          label="Lever"
          required
          hint="Select the right option from the drop down which specifies the driver for the line item that is getting added as part of the request Eg: Price claim etc"
          name="lever"
          control={control}
          options={levers}
          placeholder="-- Please Select Lever --"
        />
      </div>

      <ControlledCountInput<WizardValues>
        id="mya"
        label="MYA Reference"
        hint="Useful while doing a productivity agreement or sourcing contribution agreement"
        name="myaRef"
        control={control}
        max={255}
        placeholder="MYA Reference"
      />
      <ControlledCountInput<WizardValues>
        id="scpa"
        label="SCPA Reference"
        hint="Useful while doing a productivity agreement or sourcing contribution agreement"
        name="scpaRef"
        control={control}
        max={255}
        placeholder="SCPA Reference"
      />

      <ControlledDateField<WizardValues>
        label="Goods Receipt Date"
        hint="Specifically for a payment to land on a specific date that is later than the 60 day standard payment terms. Note: Anything earlier, then prompt payment to be done"
        name="goodsReceipt"
        control={control}
      />
      <ControlledDateField<WizardValues>
        label="Implementation Date"
        required
        hint="Date by which all these transactions should happen"
        name="implementation"
        control={control}
      />

      <div>
        <ControlledAreaField<WizardValues>
          id="desc"
          label="Description"
          required
          hint="Describe the risk or opportunity in detail (min 100 characters). Any selection made above should be supported with relevant documents uploaded in next step."
          name="description"
          control={control}
          placeholder="Description (minimum 100 characters)"
          max={2000}
        />
        {description.length < 100 && (
          <p className="mt-1 text-[11px] font-medium text-orange-600">
            Minimum 100 characters required
          </p>
        )}
      </div>
      <ControlledSelectField<WizardValues>
        label="System"
        required
        hint="Select the appropriate option for the request raised"
        name="system"
        control={control}
        options={systems}
        placeholder="-- Please Select System --"
      />

      <ControlledSelectField<WizardValues>
        label="Associated Strategic Buyer"
        name="strategicBuyer"
        control={control}
        options={strategicBuyers}
        placeholder="-- Please Select Associated Strategic Buyer --"
      />
      <ControlledSelectField<WizardValues>
        label="Global Commodity Lead Area"
        name="commodityArea"
        control={control}
        options={commodityAreas}
        placeholder="-- Please Select Global Commodity Lead Area --"
      />

      <ControlledSelectField<WizardValues>
        label="Maturity Status"
        required
        hint="Select the right option. Note: 'Placeholder' option atleast be selected for the claim to be listed on the home page"
        name="maturity"
        control={control}
        options={maturityStatuses}
        placeholder="-- Please Select Maturity Status --"
      />
      <div />
      <ControlledSelectField<WizardValues>
        label="Likelihood"
        required
        hint="Select based on how the claim would go ahead (e.g., Signed Contract - select 'PROBABLE')"
        name="likelihood"
        control={control}
        options={likelihoods}
        placeholder="-- Please Select Likelihood --"
      />
      <div />

      <StaticField label="Currency" value={vendorCurrency} />
      <StaticField 
        label="Budget Exchange Rate" 
        value={budgetExchangeRate}
        hint="Information is obtained from MONEX integration that gets updated daily"
      />

      <ControlledTextField<WizardValues>
        id="afl"
        label="Annual Forecast Local (-)"
        required
        hint="Manual input of information by user in local currency"
        name="annualForecastLocal"
        control={control}
        placeholder="Annual Forecast Local (-)"
        inputMode="decimal"
      />
      <StaticField
        label="Annual Forecast (£)"
        value={toGbp(annualForecastLocal, budgetExchangeRate)}
        hint="Gets autopopulated"
      />

      <ControlledTextField<WizardValues>
        id="gcl"
        label="Gross Claim Local (-)"
        required
        hint="Declare what the original claim from the supplier was versus your expected settlement"
        name="grossClaimLocal"
        control={control}
        placeholder="Gross Claim Local (-)"
        inputMode="decimal"
      />
      <div />

      <StaticField
        label="Calendarised Forecast Local"
        value={calendarisedForecastLocal(annualForecastLocal)}
        hint="Note: Calculations happen in the background and gets autopopulated in the UI based on the input given by the user in the mandatory fields"
      />
      <StaticField
        label="Calendarised Forecast (£)"
        value={calendarisedForecastGbp(annualForecastLocal, budgetExchangeRate)}
        hint="Note: Calculations happen in the background and gets autopopulated in the UI based on the input given by the user in the mandatory fields"
      />
    </div>
  )
}
