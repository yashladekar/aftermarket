export type CcrPriority = "High" | "Medium" | "Low"

export type CcrRow = {
  reference: string
  status: string
  vendorCode: string
  vendorName: string
  signoffLevel: string
  dateRequested: string
  lastUpdated: string
  recentUpdate: string
  netPriceChange: boolean
  leadTimeChange: boolean
  moqChange: boolean
  atb: boolean
  bb: boolean
  missingRefData: boolean
  supplyOk: boolean
  priority: CcrPriority
  ccrType: string
  partRefs: string[]
}

export function fmtCcrDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export const ccrTypeOptions = [
  "Price Change",
  "Commercial Terms",
  "Logistics Change",
  "Quality Hold",
] as const

export type VendorOption = {
  code: string
  name: string
}

export const vendorCatalog: VendorOption[] = [
  { code: "MRDFN", name: "MERIDIAN FASTENERS LTD" },
  { code: "HLPOL", name: "HALSTEAD POLYMERS PLC" },
  { code: "EVDLS", name: "EASTVALE DRIVELINE SYSTEMS GMBH" },
  { code: "NWSSL", name: "NORTHWICK SEALING SOLUTIONS LTD" },
  { code: "CFDCO", name: "CALDER FRICTION COMPONENTS LTD" },
  { code: "ASHEL", name: "ASHBOURNE ELECTRICAL LTD" },
  { code: "KSTAL", name: "KESTREL ALLOY WHEELS LTD" },
  { code: "DNMGS", name: "DUNMORE GLASS SYSTEMS LTD" },
  { code: "BRKWD", name: "BROOKWOOD CASTINGS LTD" },
  { code: "THRNC", name: "THORNCROFT HYDRAULICS LTD" },
  { code: "WLMBY", name: "WILMBURY INTERIORS GMBH" },
  { code: "FENGR", name: "FENWICK GEARS & TRANSMISSION LTD" },
]

export const preferredVendorCodes = ["MRDFN", "HLPOL", "EVDLS", "NWSSL", "CFDCO"]

export const demoVendorCodes = ["MRDFN"]

export const demoPartNumbers = ["5201140783", "5201140784"]

export const demoPartDetails: Record<
  string,
  { newNetPrice: string; startDate: string; justification: string }
> = {
  "5201140783": {
    newNetPrice: "0.9120",
    startDate: "2026-11-01",
    justification:
      "Demo CCR: supplier advised a unit price uplift on fixings from November due to higher alloy surcharges. Two MRDFN parts in scope, MOQ and lead time unchanged, requesting validation so the forecast can be updated.",
  },
  "5201140784": {
    newNetPrice: "0.9780",
    startDate: "2026-11-01",
    justification:
      "Demo CCR: supplier advised a unit price uplift on fixings from November due to higher alloy surcharges. Two MRDFN parts in scope, MOQ and lead time unchanged, requesting validation so the forecast can be updated.",
  },
}

export const demoStakeholders = [
  {
    contactType: "External",
    name: "Alex Morgan",
    email: "alex.morgan@example-supplier.co.uk",
    vendorCodes: ["MRDFN"],
  },
] as const

export const demoCcrDetail = {
  reference: "CCR-MRDFN-1042",
  status: "Pending Validation",
  currency: "EUR",
  governance: "No",
  vorQty: "",
  boQty: "",
  isATB: "No",
  isBB: "No",
  supplyIssue: "No",
  createdBy: "Demo Buyer",
  createdOn: "12/10/2026",
  buyerCode: "DM01",
  buyerEmail: "demo.buyer@example.co.uk",
  materialInventoryImpact: "GBP 0.00",
  materialCostImpact: "GBP -52,212.44",
  materialLeadTimeImpact: "GBP 0.00",
  materialStorageImpact: "",
  totalImpact: "GBP -52,212.44",
  forecastWarning:
    "SUBMIT FOR APPROVAL NOT ALLOWED: Forecast Request is Pending. There are few parts which reason codes have not been set",
}

export const ccrWizardSteps = [
  "Select Vendors",
  "Select Parts",
  "Enter Part Change Details",
  "Upload Supporting Documents",
  "Select Documents Vendor Parts",
  "Add Additional Stakeholders",
  "Summary",
] as const

export type VendorPart = {
  vendorCode: string
  partNumber: string
  description: string
  materialNumber: string
  wers: string
  manufacturerPartNumber: string
  incoterms: string
  netPrice: string
  per: string
  moq: string
  currentOrderMultiple: string
  leadTime: string
}

function vp(
  vendorCode: string,
  partNumber: string,
  description: string,
  manufacturerPartNumber: string,
  netPrice: string,
  leadTime: string
): VendorPart {
  return {
    vendorCode,
    partNumber,
    description,
    materialNumber: partNumber,
    wers: "W7A",
    manufacturerPartNumber,
    incoterms: "DAP",
    netPrice,
    per: "1",
    moq: "50",
    currentOrderMultiple: "10",
    leadTime,
  }
}

export const vendorPartsCatalog: VendorPart[] = [
  vp("MRDFN", "5201140783", "Hex flange bolt M8 x 30", "MF-52140", "0.8450", "14 days"),
  vp("MRDFN", "5201140784", "Hex flange bolt M8 x 35", "MF-52141", "0.9120", "14 days"),
  vp("MRDFN", "5201140811", "Wheel stud M14 x 1.5", "MF-52207", "1.2740", "21 days"),
  vp("HLPOL", "6108823451", "Coolant hose assembly", "HP-61021", "8.4600", "21 days"),
  vp("HLPOL", "6108823519", "Air intake duct", "HP-61088", "12.1300", "28 days"),
  vp("HLPOL", "6108823520", "Air intake duct clip kit", "HP-61089", "2.5400", "28 days"),
  vp("EVDLS", "7305561290", "Propshaft centre bearing", "EV-73011", "24.9000", "35 days"),
  vp("EVDLS", "7305561402", "Rear drive coupling", "EV-73019", "41.7500", "35 days"),
  vp("NWSSL", "4402091765", "Crankshaft front seal", "NW-44051", "3.2800", "14 days"),
  vp("NWSSL", "4402091766", "Crankshaft rear seal", "NW-44052", "3.6100", "14 days"),
  vp("NWSSL", "4402091889", "Camshaft seal kit", "NW-44077", "5.9400", "21 days"),
  vp("CFDCO", "8804319927", "Front brake pad set", "CF-88031", "18.2500", "21 days"),
  vp("CFDCO", "8804320054", "Rear brake pad set", "CF-88042", "16.9800", "21 days"),
  vp("ASHEL", "3107754208", "Wiring harness branch", "AS-31055", "9.7200", "28 days"),
  vp("KSTAL", "1509936274", "Alloy wheel 20 inch", "KS-15011", "132.4000", "42 days"),
  vp("KSTAL", "1509936330", "Alloy wheel 21 inch", "KS-15018", "148.9000", "42 days"),
  vp("DNMGS", "9901625380", "Windscreen glass assembly", "DN-99012", "86.3000", "35 days"),
  vp("BRKWD", "7703412055", "Suspension knuckle casting", "BW-77034", "54.6000", "42 days"),
  vp("THRNC", "6605187741", "Hydraulic pump unit", "TH-66051", "97.8500", "35 days"),
  vp("WLMBY", "2804469137", "Door trim panel insert", "WL-28044", "11.3700", "28 days"),
  vp("FENGR", "1902275062", "Transfer box gear set", "FE-19022", "63.2000", "42 days"),
]

export const dummyCcrs: CcrRow[] = [
  {
    reference: "CCR-MRDFN-1042",
    status: "Pending Validation",
    vendorCode: "MRDFN",
    vendorName: "MERIDIAN FASTENERS LTD",
    signoffLevel: "--",
    dateRequested: "2026-09-22",
    lastUpdated: "2026-09-22",
    recentUpdate: "CCR Created",
    netPriceChange: true,
    leadTimeChange: false,
    moqChange: false,
    atb: false,
    bb: false,
    missingRefData: true,
    supplyOk: true,
    priority: "High",
    ccrType: "Price Change",
    partRefs: ["5201140783", "5201140784"],
  },
  {
    reference: "CCR-HLPOL-0871",
    status: "Pending Validation",
    vendorCode: "HLPOL",
    vendorName: "HALSTEAD POLYMERS PLC",
    signoffLevel: "--",
    dateRequested: "2026-06-22",
    lastUpdated: "2026-06-23",
    recentUpdate: "Reference data updated for Part 6108823451",
    netPriceChange: false,
    leadTimeChange: false,
    moqChange: false,
    atb: false,
    bb: false,
    missingRefData: true,
    supplyOk: true,
    priority: "Medium",
    ccrType: "Logistics Change",
    partRefs: ["6108823451"],
  },
  {
    reference: "CCR-EVDLS-0933",
    status: "Pending Validation",
    vendorCode: "EVDLS",
    vendorName: "EASTVALE DRIVELINE SYSTEMS GMBH",
    signoffLevel: "--",
    dateRequested: "2026-09-30",
    lastUpdated: "2026-09-30",
    recentUpdate: "CCR Created",
    netPriceChange: true,
    leadTimeChange: false,
    moqChange: false,
    atb: false,
    bb: false,
    missingRefData: true,
    supplyOk: true,
    priority: "Medium",
    ccrType: "Price Change",
    partRefs: ["7305561290"],
  },
  {
    reference: "CCR-NWSSL-0518",
    status: "Draft",
    vendorCode: "NWSSL",
    vendorName: "NORTHWICK SEALING SOLUTIONS LTD",
    signoffLevel: "Level 1",
    dateRequested: "2026-10-02",
    lastUpdated: "2026-10-05",
    recentUpdate: "Part price updated for Part 4402091765",
    netPriceChange: true,
    leadTimeChange: true,
    moqChange: false,
    atb: true,
    bb: false,
    missingRefData: false,
    supplyOk: true,
    priority: "Low",
    ccrType: "Commercial Terms",
    partRefs: ["4402091765", "4402091766"],
  },
  {
    reference: "CCR-CFDCO-1204",
    status: "Awaiting Review",
    vendorCode: "CFDCO",
    vendorName: "CALDER FRICTION COMPONENTS LTD",
    signoffLevel: "Level 2",
    dateRequested: "2026-09-14",
    lastUpdated: "2026-10-01",
    recentUpdate: "MOQ updated for Part 8804319927",
    netPriceChange: false,
    leadTimeChange: false,
    moqChange: true,
    atb: false,
    bb: true,
    missingRefData: false,
    supplyOk: true,
    priority: "High",
    ccrType: "Price Change",
    partRefs: ["8804319927"],
  },
  {
    reference: "CCR-ASHEL-0660",
    status: "Pending Validation",
    vendorCode: "ASHEL",
    vendorName: "ASHBOURNE ELECTRICAL LTD",
    signoffLevel: "--",
    dateRequested: "2026-08-28",
    lastUpdated: "2026-09-19",
    recentUpdate: "Lead time updated for Part 3107754208",
    netPriceChange: false,
    leadTimeChange: true,
    moqChange: false,
    atb: false,
    bb: false,
    missingRefData: true,
    supplyOk: false,
    priority: "High",
    ccrType: "Logistics Change",
    partRefs: ["3107754208"],
  },
  {
    reference: "CCR-KSTAL-0795",
    status: "Pending Approval",
    vendorCode: "KSTAL",
    vendorName: "KESTREL ALLOY WHEELS LTD",
    signoffLevel: "Level 2",
    dateRequested: "2026-09-05",
    lastUpdated: "2026-10-08",
    recentUpdate: "CCR Created",
    netPriceChange: true,
    leadTimeChange: false,
    moqChange: true,
    atb: true,
    bb: true,
    missingRefData: false,
    supplyOk: true,
    priority: "Medium",
    ccrType: "Commercial Terms",
    partRefs: ["1509936274"],
  },
  {
    reference: "CCR-DNMGS-0412",
    status: "Draft",
    vendorCode: "DNMGS",
    vendorName: "DUNMORE GLASS SYSTEMS LTD",
    signoffLevel: "--",
    dateRequested: "2026-10-06",
    lastUpdated: "2026-10-09",
    recentUpdate: "Reference data updated for Part 9901625380",
    netPriceChange: false,
    leadTimeChange: false,
    moqChange: false,
    atb: false,
    bb: false,
    missingRefData: true,
    supplyOk: true,
    priority: "Low",
    ccrType: "Quality Hold",
    partRefs: ["9901625380"],
  },
  {
    reference: "CCR-MRDFN-1057",
    status: "Awaiting Review",
    vendorCode: "MRDFN",
    vendorName: "MERIDIAN FASTENERS LTD",
    signoffLevel: "Level 1",
    dateRequested: "2026-09-27",
    lastUpdated: "2026-10-04",
    recentUpdate: "Part price updated for Part 5201140811",
    netPriceChange: true,
    leadTimeChange: false,
    moqChange: false,
    atb: false,
    bb: true,
    missingRefData: false,
    supplyOk: true,
    priority: "Medium",
    ccrType: "Price Change",
    partRefs: ["5201140811"],
  },
  {
    reference: "CCR-HLPOL-0899",
    status: "Pending Validation",
    vendorCode: "HLPOL",
    vendorName: "HALSTEAD POLYMERS PLC",
    signoffLevel: "--",
    dateRequested: "2026-10-10",
    lastUpdated: "2026-10-10",
    recentUpdate: "CCR Created",
    netPriceChange: false,
    leadTimeChange: true,
    moqChange: true,
    atb: false,
    bb: false,
    missingRefData: true,
    supplyOk: true,
    priority: "Low",
    ccrType: "Logistics Change",
    partRefs: ["6108823519", "6108823520"],
  },
  {
    reference: "CCR-EVDLS-0951",
    status: "Pending Approval",
    vendorCode: "EVDLS",
    vendorName: "EASTVALE DRIVELINE SYSTEMS GMBH",
    signoffLevel: "Level 3",
    dateRequested: "2026-08-15",
    lastUpdated: "2026-10-02",
    recentUpdate: "MOQ updated for Part 7305561402",
    netPriceChange: true,
    leadTimeChange: true,
    moqChange: true,
    atb: true,
    bb: false,
    missingRefData: false,
    supplyOk: false,
    priority: "High",
    ccrType: "Commercial Terms",
    partRefs: ["7305561402"],
  },
  {
    reference: "CCR-NWSSL-0533",
    status: "Pending Validation",
    vendorCode: "NWSSL",
    vendorName: "NORTHWICK SEALING SOLUTIONS LTD",
    signoffLevel: "--",
    dateRequested: "2026-09-18",
    lastUpdated: "2026-09-25",
    recentUpdate: "Reference data updated for Part 4402091889",
    netPriceChange: false,
    leadTimeChange: false,
    moqChange: false,
    atb: false,
    bb: false,
    missingRefData: true,
    supplyOk: true,
    priority: "Low",
    ccrType: "Quality Hold",
    partRefs: ["4402091889"],
  },
  {
    reference: "CCR-CFDCO-1219",
    status: "Awaiting Review",
    vendorCode: "CFDCO",
    vendorName: "CALDER FRICTION COMPONENTS LTD",
    signoffLevel: "Level 1",
    dateRequested: "2026-10-01",
    lastUpdated: "2026-10-07",
    recentUpdate: "Part price updated for Part 8804320054",
    netPriceChange: true,
    leadTimeChange: false,
    moqChange: false,
    atb: true,
    bb: false,
    missingRefData: false,
    supplyOk: true,
    priority: "Medium",
    ccrType: "Price Change",
    partRefs: ["8804320054"],
  },
  {
    reference: "CCR-KSTAL-0810",
    status: "Draft",
    vendorCode: "KSTAL",
    vendorName: "KESTREL ALLOY WHEELS LTD",
    signoffLevel: "--",
    dateRequested: "2026-10-11",
    lastUpdated: "2026-10-11",
    recentUpdate: "CCR Created",
    netPriceChange: false,
    leadTimeChange: false,
    moqChange: true,
    atb: false,
    bb: false,
    missingRefData: false,
    supplyOk: true,
    priority: "Low",
    ccrType: "Logistics Change",
    partRefs: ["1509936330"],
  },
]
