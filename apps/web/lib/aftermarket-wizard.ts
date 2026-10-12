export type WizardStepKey =
  | "core"
  | "claim"
  | "documents"
  | "co2"
  | "lumpsum"
  | "parts"

export const wizardSteps: { key: WizardStepKey; label: string }[] = [
  { key: "core", label: "Core Data" },
  { key: "claim", label: "Supplier Claim Details" },
  { key: "documents", label: "Documents Upload" },
  { key: "co2", label: "CO2 Data" },
  { key: "lumpsum", label: "Lump Sum Data" },
  { key: "parts", label: "Parts Data" },
]

export type UploadedDoc = {
  name: string
  type: string
  description: string
}

export type WizardForm = {
  onBehalf: boolean
  buyerCode: string
  claimType: "" | "Risk" | "Opportunity"
  confidential: "" | "Yes" | "No"
  fiscalYear: string
  notification: string
  vendor: string
  showAllVendors: boolean
  dt2Vendor: string
  showAllDt2: boolean
  transactionType: "" | "Lump Sum" | "POA"
  transactionDrivers: string
  transactionStart: Date | undefined
  transactionEnd: Date | undefined
  nonStandardFlag: string
  lever: string
  myaRef: string
  scpaRef: string
  goodsReceipt: Date | undefined
  implementation: Date | undefined
  description: string
  system: string
  strategicBuyer: string
  commodityArea: string
  maturity: "" | "0 - Placeholder" | "1 - Claim Initiated" | "2 - Negotiation" | "3 - Deal Agreed in Principle" | "4 - Deal Signed"
  likelihood: "" | "Closed" | "Contractual" | "Possible" | "Probable" | "Remote"
  annualForecastLocal: string
  grossClaimLocal: string
  docs: UploadedDoc[]
  co2Start: string
  co2End: string
  co2Change: Date | undefined
  materialGroup: string
  vehicleLine: string
  manualInvoice: string
  manualInvoiceNo: string
  purchOrg: string
  purchGroup: string
  companyCode: string
  plant: string
  sapLsp: string
  poDesc: string
  systemUpdate: "WIPS" | "EMC"
  claimTitle: string
  wipsClaimNumber: string
  parts: string[]
  showAllParts: boolean
  partPlants: Record<string, string>
  partDetails: PartDetail[]
  allPct: string
  allAbs: string
  generated: boolean
}

export const initialWizardForm: WizardForm = {
  onBehalf: false,
  buyerCode: "",
  claimType: "",
  confidential: "",
  fiscalYear: "2024-2025",
  notification: "",
  vendor: "",
  showAllVendors: false,
  dt2Vendor: "",
  showAllDt2: false,
  transactionType: "",
  transactionDrivers: "",
  transactionStart: undefined,
  transactionEnd: undefined,
  nonStandardFlag: "",
  lever: "",
  myaRef: "",
  scpaRef: "",
  goodsReceipt: undefined,
  implementation: undefined,
  description: "",
  system: "",
  strategicBuyer: "",
  commodityArea: "",
  maturity: "",
  likelihood: "",
  annualForecastLocal: "",
  grossClaimLocal: "",
  docs: [],
  co2Start: "",
  co2End: "",
  co2Change: undefined,
  materialGroup: "",
  vehicleLine: "",
  manualInvoice: "",
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
  parts: [],
  showAllParts: false,
  partPlants: {},
  partDetails: [],
  allPct: "",
  allAbs: "",
  generated: false,
}

export const buyerCodes = [
  "0041",
  "1616",
  "2376",
  "2465",
  "0784AJ",
  "0784BE",
  "0784BM",
  "0784CE",
  "0784EH",
  "0784IC",
  "ZZOX",
  "ZZ1X",
]

export const buyerNames: Record<string, string> = {
  ZZOX: "Buyer Officer",
  ZZ1X: "Purchasing Manager",
}

const coreVendors = [
  "GIFTA - ARLINGTON AUTOMOTIVE LIMITED",
  "TRELLEBORG SEALING SOLUTIONS",
  "SCHAEFFLER TECHNOLOGIES AG & CO.KG",
  "VIBRACOUSTIC SPAIN SAU",
]

const extraVendors = [
  "BOSCH AUTOMOTIVE PRODUCTS",
  "CONTINENTAL ENGINEERING SERVICES",
  "DENSO INTERNATIONAL EUROPE",
  "MAGNA STEYR FAHRZEUGTECHNIK",
  "VALEO CLIMATE CONTROL",
]

export function vendorOptions(showAll: boolean) {
  return showAll ? [...coreVendors, ...extraVendors] : coreVendors
}

export const fiscalYears = ["2024-2025", "2025-2026", "2023-2024"]

export const notificationMethods = [
  "Signed Contract",
  "Letter",
  "Email",
  "Verbal",
  "None",
]

export const transactionDrivers = ["Currency", "Non Design", "Raw Material"]

export const transactionTypeBreakdownOptions = [
  "AIM",
  "EMC/BAC/LTD",
  "Price Claim",
  "Price Correction",
  "Resource",
  "FINA",
]

export const nonStandardFlags = ["Prepayment", "Loans", "Deposits"]

export const levers = [
  "Auto Materials",
  "Amortisation(Screed) Opps",
  "Cartel Recovery",
  "Commercial PPAP Activities(QAF & PSW Validation)",
  "Distress",
  "Duties and Customs",
  "EMA Sourcing",
  "End of life",
]

export const systems = [
  "Air Intake System",
  "Body Mechanisms",
  "Chassis Systems",
  "Electrical Distribution",
  "Thermal Management",
]

export const strategicBuyers = [
  "Strategic Buyer - Chassis",
  "Strategic Buyer - Body",
  "Strategic Buyer - Electrical",
]

export const commodityAreas = [
  "Chassis Commodity",
  "Body Commodity",
  "Electrical Commodity",
  "Powertrain Commodity",
]

export const maturityStatuses = [
  "0 - Placeholder",
  "1 - Claim Initiated",
  "2 - Negotiation",
  "3 - Deal Agreed in Principle",
  "4 - Deal Signed",
]

export const likelihoods = [
  "Closed",
  "Contractual",
  "Possible",
  "Probable",
  "Remote",
]

export const fileTypes = [
  "Email from Supplier",
  "Quote",
  "Purchase Order",
  "Letter from Supplier",
  "NDA",
  "Other",
]

export const materialGroups = [
  "Raw Materials",
  "Stampings",
  "Castings",
  "Fasteners",
  "Electronics",
]

export const vehicleLines = ["Range Rover", "Defender", "Discovery", "Jaguar XF"]

export const purchOrgs = ["UK Purchasing", "EU Purchasing", "Global Purchasing"]

export const purchGroups = ["PG-100 Chassis", "PG-200 Body", "PG-300 Electrical"]

export const companyCodes = ["JLR UK Ltd", "JLR Slovakia", "JLR India"]

export const partsCompanyCodes = ["GB03 - Jaguar Land Rover Limited"]

export const plants = [
  "Castle Bromwich Assembly",
  "Castle Bromwich KD",
  "Castle Bromwich KD, Magna Steyr - Graz",
  "Magna Steyr - Graz",
  "Halewood KD",
  "Solihull Assembly",
]

const corePartNumbers = [
  "02C2D19768",
  "02C2C34128",
  "02NCA2246AB",
  "L8B29K335CC",
]

const extraPartNumbers = ["MR8D220146AA", "L8B29K336CC", "02C2C34129"]

export const partNumbers = corePartNumbers

export function partNumberOptions(showAll: boolean) {
  return showAll ? [...corePartNumbers, ...extraPartNumbers] : corePartNumbers
}

export type PartDetail = {
  part: string
  plant: string
  currentPrice: string
  currentPriceChanged: boolean
  currentCurrency: string
  description: string
  newPrice: string
  newCurrency: string
  runout: "" | "Yes" | "No"
  runoutDate?: Date | undefined
  atpRef: string
}

export const initialPartDetail = (part: string, plant: string): PartDetail => ({
  part,
  plant,
  currentPrice: "56.89",
  currentPriceChanged: false,
  currentCurrency: "EUR",
  description: "",
  newPrice: "",
  newCurrency: "EUR",
  runout: "",
  runoutDate: undefined,
  atpRef: "",
})

export function absoluteChange(d: PartDetail) {
  const c = parseFloat(d.currentPrice)
  const n = parseFloat(d.newPrice)
  if (!Number.isFinite(c) || !Number.isFinite(n)) return "-"
  return Math.abs(c - n).toLocaleString("en-GB", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

export function pctChange(d: PartDetail) {
  const c = parseFloat(d.currentPrice)
  const n = parseFloat(d.newPrice)
  if (!Number.isFinite(c) || !Number.isFinite(n) || c === 0) return "-"
  return (((n - c) / Math.abs(c)) * 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function priceSign(d: PartDetail) {
  const c = parseFloat(d.currentPrice)
  const n = parseFloat(d.newPrice)
  if (!Number.isFinite(c) || !Number.isFinite(n) || c === n) return "—"
  return n < c ? "−" : "+"
}

export const budgetFxRate = "1.27"
export const claimCurrency = "USD"

export function toGbp(local: string, exchangeRate: string = budgetFxRate) {
  const n = parseFloat(local.replace(/,/g, ""))
  const rate = parseFloat(exchangeRate)
  if (!Number.isFinite(n) || !Number.isFinite(rate)) return "-"
  return (n / rate).toLocaleString("en-GB", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

/**
 * Calculate Calendarised Forecast Local
 * Represents the claim amount adjusted for the calendar year based on mandatory fields.
 * Currently mirrors Annual Forecast Local (can be enhanced with date-based pro-rating).
 */
export function calendarisedForecastLocal(annualForecast: string): string {
  const n = parseFloat(annualForecast.replace(/,/g, ""))
  if (!Number.isFinite(n)) return "-"
  return n.toLocaleString("en-GB", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

/**
 * Calculate Calendarised Forecast in GBP from the local calendarised forecast.
 */
export function calendarisedForecastGbp(
  annualForecast: string,
  exchangeRate: string = budgetFxRate
): string {
  const n = parseFloat(annualForecast.replace(/,/g, ""))
  const rate = parseFloat(exchangeRate)
  if (!Number.isFinite(n) || !Number.isFinite(rate)) return "-"
  return (n / rate).toLocaleString("en-GB", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

export function co2Delta(start: string, end: string) {
  const s = parseFloat(start)
  const e = parseFloat(end)
  if (!Number.isFinite(s) || !Number.isFinite(e)) return "-"
  return (e - s).toLocaleString("en-GB", { maximumFractionDigits: 2 })
}
