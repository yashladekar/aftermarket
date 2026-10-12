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
