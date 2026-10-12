import { z } from "zod"

export const workQueueFilterSchema = z.object({
  vendorQuery: z.string().max(60, "Vendor search must be 60 characters or less").default(""),
  partQuery: z.string().max(60, "Part search must be 60 characters or less").default(""),
  codeRefQuery: z.string().max(60, "Search must be 60 characters or less").default(""),
  ccrType: z
    .enum(["Any", "Price Change", "Commercial Terms", "Logistics Change", "Quality Hold"])
    .default("Any"),
  priority: z.enum(["Any", "High", "Medium", "Low"]).default("Any"),
  dateRequested: z
    .enum(["Any", "Last 7 days", "Last 30 days", "Last 90 days"])
    .default("Any"),
})

export type WorkQueueFilters = z.infer<typeof workQueueFilterSchema>
export type WorkQueueFilterInput = z.input<typeof workQueueFilterSchema>

export const workQueueFilterDefaults: WorkQueueFilters = {
  vendorQuery: "",
  partQuery: "",
  codeRefQuery: "",
  ccrType: "Any",
  priority: "Any",
  dateRequested: "Any",
}

export const createCcrTypeSchema = z.object({
  ccrKind: z.enum(["standard", "alb"], {
    message: "Select the type of CCR you wish to create",
  }),
})

export type CreateCcrTypeValues = z.infer<typeof createCcrTypeSchema>
export type CreateCcrTypeInput = z.input<typeof createCcrTypeSchema>

export const createCcrTypeDefaults: CreateCcrTypeValues = {
  ccrKind: "standard",
}

export const selectVendorsSchema = z.object({
  vendorSearch: z
    .string()
    .max(80, "Vendor search must be 80 characters or less")
    .default(""),
  vendorCode: z.string().default(""),
  searchAllVendors: z.boolean().default(false),
  selectedVendorCodes: z
    .array(z.string().min(1))
    .min(1, "Select at least one vendor to continue"),
})

export type SelectVendorsValues = z.infer<typeof selectVendorsSchema>
export type SelectVendorsInput = z.input<typeof selectVendorsSchema>

export const selectVendorsDefaults: SelectVendorsValues = {
  vendorSearch: "",
  vendorCode: "",
  searchAllVendors: true,
  selectedVendorCodes: [],
}

export const selectPartsSchema = z.object({
  partSearch: z
    .string()
    .max(80, "Part search must be 80 characters or less")
    .default(""),
  selectAll: z.boolean().default(false),
  selectedPartNumbers: z.array(z.string().min(1)).default([]),
})

export type SelectPartsValues = z.infer<typeof selectPartsSchema>
export type SelectPartsInput = z.input<typeof selectPartsSchema>

export const selectPartsDefaults: SelectPartsValues = {
  partSearch: "",
  selectAll: false,
  selectedPartNumbers: [],
}
