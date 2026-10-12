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

const optionalNumeric = (label: string) =>
  z
    .string()
    .regex(/^\d+(\.\d{1,5})?$/, `${label} must be a valid number`)
    .or(z.literal(""))
    .default("")

export const partChangeRowSchema = z
  .object({
    partNumber: z.string().min(1),
    newNetPrice: optionalNumeric("New Net Price"),
    newPer: optionalNumeric("New PER"),
    newMoq: optionalNumeric("New MOQ"),
    newOrderMultiple: optionalNumeric("New Current Order Multiple (OM)"),
    newLeadTime: optionalNumeric("New Lead Time"),
    buyingType: z.enum(["General", "Blanket", "Spot"]).default("General"),
    buyingTypeQty: optionalNumeric("Buying Type Qty"),
    startDate: z.string().min(1, "Start Date is required."),
  })
  .superRefine((v, ctx) => {
    const newValues = [
      v.newNetPrice,
      v.newPer,
      v.newMoq,
      v.newOrderMultiple,
      v.newLeadTime,
      v.buyingTypeQty,
    ].filter((s) => (s ?? "").trim() !== "")
    if (newValues.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Enter at least one new value for the part.",
        path: ["newNetPrice"],
      })
    }
    if (v.buyingType !== "General" && (v.buyingTypeQty ?? "").trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Buying Type Qty is required for Blanket/Spot.",
        path: ["buyingTypeQty"],
      })
    }
    if ((v.startDate ?? "").trim() !== "") {
      const today = new Date("2026-10-12T00:00:00Z").getTime()
      const start = new Date(`${v.startDate}T00:00:00Z`).getTime()
      if (!Number.isNaN(start) && start < today) {
        ctx.addIssue({
          code: "custom",
          message: "Start Date cannot be in the past.",
          path: ["startDate"],
        })
      }
    }
  })

export const partDetailsSchema = z.object({
  selectAllStartDate: z.string().default(""),
  partRows: z
    .array(partChangeRowSchema)
    .min(1, "Select at least one part to continue"),
  justification: z
    .string()
    .min(1, "Justification is required")
    .max(2000, "Justification must be 2000 characters or less"),
})

export type PartChangeRowValues = z.infer<typeof partChangeRowSchema>
export type PartDetailsValues = z.infer<typeof partDetailsSchema>
export type PartDetailsInput = z.input<typeof partDetailsSchema>

export const buyingTypeOptions = ["General", "Blanket", "Spot"] as const

export const supportDocFileTypes = [
  "Quote",
  "Cost Breakdown",
  "Allocation",
  "Others",
] as const

export const permittedDocExtensions = [
  "xls",
  "xlsx",
  "jpeg",
  "jpg",
  "png",
  "doc",
  "docx",
  "pdf",
  "msg",
] as const

export const supportDocumentEntrySchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1, "File name is required").max(255),
  extension: z.string().default(""),
  sizeLabel: z.string().default(""),
  sizeBytes: z.number().nonnegative().default(0),
  fileType: z.enum(supportDocFileTypes).default("Others"),
  vendorCode: z.string().min(1, "Vendor code is required"),
})

export const supportDocumentsSchema = z.object({
  files: z.array(supportDocumentEntrySchema).default([]),
})

export type SupportDocumentEntry = z.infer<typeof supportDocumentEntrySchema>
export type SupportDocumentsValues = z.infer<typeof supportDocumentsSchema>
export type SupportDocumentsInput = z.input<typeof supportDocumentsSchema>

export const supportDocumentsDefaults: SupportDocumentsValues = {
  files: [],
}

export const docPartTagSchema = z.object({
  docKey: z.string().min(1),
  partNumbers: z.array(z.string().min(1)).default([]),
})

export const docPartTagsSchema = z.object({
  tags: z.array(docPartTagSchema).default([]),
})

export type DocPartTag = z.infer<typeof docPartTagSchema>
export type DocPartTagsValues = z.infer<typeof docPartTagsSchema>
export type DocPartTagsInput = z.input<typeof docPartTagsSchema>

export const stakeholderContactTypes = ["Internal", "External"] as const

export const stakeholderEntrySchema = z
  .object({
    contactType: z.enum(stakeholderContactTypes).default("External"),
    name: z.string().max(120, "Name must be 120 characters or less").default(""),
    email: z
      .string()
      .max(160, "Email must be 160 characters or less")
      .default(""),
    vendorCodes: z.array(z.string().min(1)).default([]),
  })
  .superRefine((v, ctx) => {
    const hasAny =
      v.name.trim() !== "" ||
      v.email.trim() !== "" ||
      v.vendorCodes.length > 0
    if (!hasAny) return
    if (v.name.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Name is required",
        path: ["name"],
      })
    }
    if (v.email.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Email Address is required",
        path: ["email"],
      })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid email address",
        path: ["email"],
      })
    }
    if (v.vendorCodes.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one vendor",
        path: ["vendorCodes"],
      })
    }
  })

export const stakeholdersSchema = z.object({
  stakeholders: z.array(stakeholderEntrySchema).default([]),
})

export type StakeholderEntry = z.infer<typeof stakeholderEntrySchema>
export type StakeholdersValues = z.infer<typeof stakeholdersSchema>
export type StakeholdersInput = z.input<typeof stakeholdersSchema>

export const stakeholdersDefaults: StakeholdersValues = {
  stakeholders: [],
}

export const onBehalfReasons = [
  "Supplier Does Not Have Covisint Access",
  "Supplier Does Not Want To Use Appian",
  "Supplier Requires Onboarding",
  "Short Term Access Issue",
  "Escalation",
  "Other",
] as const

export const summarySchema = z.object({
  onBehalfReason: z.string().min(1, "Select a reason for raising on behalf of supplier"),
})

export type SummaryValues = z.infer<typeof summarySchema>
export type SummaryInput = z.input<typeof summarySchema>

export const summaryDefaults: SummaryValues = {
  onBehalfReason: "",
}
