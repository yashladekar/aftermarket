export type ClaimRow = {
  lineId: string
  parentId: string
  supplierClaimType: string
  transactionType: string
  fiscalYear: string
  coc: string
  confidential: boolean
  vendorName: string
  vendorCode: string
  description: string
  reportingValue: string
  reportingNegative?: boolean
  status: string
  createdOn: string
  implementationDate: string
  isReserve: boolean
  buyerCode: string
  buyerName: string
  pmCode: string
  pmName: string
}

export const kpis = [
  { key: "open", label: "OPEN", value: "1" },
  { key: "draft", label: "DRAFT", value: "0" },
  { key: "awaiting", label: "AWAITING ENQUIRY", value: "0" },
  { key: "completed", label: "COMPLETED", value: "1" },
  { key: "pending", label: "PENDING APPROVALS", value: "0" },
  { key: "mine", label: "MY APPROVALS", value: "60" },
] as const

export const claims: ClaimRow[] = [
  {
    lineId: "MCI-00160",
    parentId: "",
    supplierClaimType: "Opportunity",
    transactionType: "POA",
    fiscalYear: "2024-2025",
    coc: "ZZ COC Test",
    confidential: true,
    vendorName: "ARLINGTON AUTOMOTIVE LIMITED",
    vendorCode: "GJFTA - ARLINGTON AUTOMOTIVE LIMITED",
    description: "testtesttesttesttest...",
    reportingValue: "0.0000",
    status: "Forecast",
    createdOn: "10 JUN 2024 12:21 AM",
    implementationDate: "20 JUN 2024",
    isReserve: false,
    buyerCode: "ZZ0X",
    buyerName: "Buyer Officer",
    pmCode: "ZZ1X",
    pmName: "Purchasing Manager",
  },
  {
    lineId: "MCI-00159",
    parentId: "",
    supplierClaimType: "",
    transactionType: "",
    fiscalYear: "2024-2025",
    coc: "ZZ COC Test",
    confidential: true,
    vendorName: "TRELLEBORG SEALING SOLUTIONS",
    vendorCode: "TRELLEBORG SEALING SOLUTIONS",
    description: "testtesttesttesttest...",
    reportingValue: "-",
    status: "",
    createdOn: "09 JUN 2024 10:53 PM",
    implementationDate: "20 JUN 2024",
    isReserve: false,
    buyerCode: "ZZ0X",
    buyerName: "Buyer Officer",
    pmCode: "ZZ1X",
    pmName: "Purchasing Manager",
  },
  {
    lineId: "MCI-00158",
    parentId: "",
    supplierClaimType: "Risk",
    transactionType: "Lump Sum",
    fiscalYear: "2024-2025",
    coc: "Body Mechanisms",
    confidential: true,
    vendorName: "SCHAEFFLER TECHNOLOGIES AG & CO.KG",
    vendorCode: "SCHAEFFLER TECHNOLOGIES AG & CO.KG",
    description: "testtesttesttesttest...",
    reportingValue: "(1,301,5184)",
    reportingNegative: true,
    status: "Forecast",
    createdOn: "06 JUN 2024 2:50 PM",
    implementationDate: "26 JUN 2024",
    isReserve: true,
    buyerCode: "ZZ0X",
    buyerName: "Buyer Officer",
    pmCode: "ZZ1X",
    pmName: "Purchasing Manager",
  },
  {
    lineId: "MCI-00157",
    parentId: "",
    supplierClaimType: "Risk",
    transactionType: "POA",
    fiscalYear: "2024-2025",
    coc: "ZZ COC Test",
    confidential: true,
    vendorName: "SCHAEFFLER TECHNOLOGIES AG & CO.KG",
    vendorCode: "SCHAEFFLER TECHNOLOGIES AG & CO.KG",
    description: "testtesttesttesttest...",
    reportingValue: "0.0000",
    status: "Forecast",
    createdOn: "04 JUN 2024 11:35 AM",
    implementationDate: "19 JUN 2024",
    isReserve: true,
    buyerCode: "ZZ0X",
    buyerName: "Buyer Officer",
    pmCode: "ZZ1X",
    pmName: "Purchasing Manager",
  },
  {
    lineId: "MCI-00156",
    parentId: "",
    supplierClaimType: "Risk",
    transactionType: "Lump Sum",
    fiscalYear: "2024-2025",
    coc: "ZZ COC Test",
    confidential: true,
    vendorName: "VIBRACOUSTIC SPAIN SAU",
    vendorCode: "VIBRACOUSTIC SPAIN SAU",
    description: "AUTO PAM TEST XXXXXX...",
    reportingValue: "(27,505,4230)",
    reportingNegative: true,
    status: "Forecast",
    createdOn: "24 MAY 2024 12:58 PM",
    implementationDate: "31 MAR 2025",
    isReserve: true,
    buyerCode: "ZZ0X",
    buyerName: "Buyer Officer",
    pmCode: "ZZ1X",
    pmName: "Purchasing Manager",
  },
  {
    lineId: "MCI-00155",
    parentId: "",
    supplierClaimType: "Risk",
    transactionType: "Lump Sum",
    fiscalYear: "2024-2025",
    coc: "ZZ COC Test",
    confidential: true,
    vendorName: "VIBRACOUSTIC SPAIN SAU",
    vendorCode: "VIBRACOUSTIC SPAIN SAU",
    description: "AUTO PAM TEST XXXXXX...",
    reportingValue: "(27,505,4230)",
    reportingNegative: true,
    status: "Forecast",
    createdOn: "24 MAY 2024 12:57 PM",
    implementationDate: "30 AUG 2024",
    isReserve: true,
    buyerCode: "ZZ0X",
    buyerName: "Buyer Officer",
    pmCode: "ZZ1X",
    pmName: "Purchasing Manager",
  },
]

export const filterOptions = {
  supplierClaimType: ["Risk", "Opportunity"],
  transactionType: ["Lump Sum", "POA", "Piece Price"],
  fiscalYear: ["2024-2025", "2025-2026", "2023-2024"],
  buyerCode: ["Any", "ZZ0X", "ZZ1X"],
  pmCode: ["Any", "ZZ1X"],
  coc: ["ZZ COC Test", "Body Mechanisms", "Chassis"],
  vendorName: [
    "ARLINGTON AUTOMOTIVE LIMITED",
    "TRELLEBORG SEALING SOLUTIONS",
    "SCHAEFFLER TECHNOLOGIES AG & CO.KG",
    "VIBRACOUSTIC SPAIN SAU",
  ],
  status: ["Forecast", "Open", "Draft", "Completed"],
  isReserve: ["Yes", "No"],
}
