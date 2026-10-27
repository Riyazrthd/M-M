// Indus Fire Safety Private Limited - Realistic Demo Master Data

export const DEMO_USERS = [
  {
    id: "usr-tech-01",
    name: "Ramesh Patel",
    email: "ramesh.patel@indusfiresafety.com",
    role: "technician",
    roleTitle: "Lead Service Engineer",
    badge: "IFS-SE-041",
    phone: "+91 98250 12345"
  },
  {
    id: "usr-mgr-01",
    name: "Sanjay Sharma",
    email: "sanjay.sharma@indusfiresafety.com",
    role: "manager",
    roleTitle: "Technical Services Manager",
    badge: "IFS-MGR-008",
    phone: "+91 98251 67890"
  },
  {
    id: "usr-client-01",
    name: "Vikram Shah",
    email: "vikram.shah@aartigroup.com",
    role: "client",
    roleTitle: "Head of Safety & Fire Services",
    company: "Aarti Industries Ltd",
    badge: "AIL-EHS-104",
    phone: "+91 98252 54321"
  }
];

export const DEMO_SITES = [
  {
    id: "SITE-AIL-001",
    clientName: "Campus Store Co.",
    name: "Campus Store Co.",
    plantFacility: "Aarti Industries Ltd — Unit IV",
    code: "AIL-U4",
    company: "Campus Store Co.",
    address: "Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110",
    city: "Jhagadia / Bharuch",
    poNumber: "PO/AIL/AMC/2026/8812",
    poDate: "2026-04-01",
    amcType: "Quarterly",
    frequency: "Quarterly",
    noOfVisits: 4,
    amcExpiryDate: "2027-03-31",
    workOrderRef: "WO-IFSPL-2026-OCT-094",
    contractPeriod: "01-Apr-2026 to 31-Mar-2027",
    clientContact: "Aditi Sharma",
    contactPhone: "+91 98201 55667",
    email: "aditi@campusstore.demo",
    taxId: "24AAACA1234F1Z5",
    totalPositions: 6,
    inspectedPositions: 2,
    status: "In Progress",
    scheduledDate: "2026-10-26",
    applicableChecklists: ["CL-11", "CL-03"]
  },
  {
    id: "SITE-ATL-002",
    clientName: "Zaraka Lifestyle",
    name: "Zaraka Lifestyle",
    plantFacility: "Atul Limited — Complex 2",
    code: "ATL-C2",
    company: "Zaraka Lifestyle",
    address: "Post Atul 396020, Dist Valsad, Gujarat, India",
    city: "Valsad / Atul",
    poNumber: "PO/ATL/SAFE/2026/4401",
    poDate: "2026-01-01",
    amcType: "Monthly",
    frequency: "Monthly",
    noOfVisits: 12,
    amcExpiryDate: "2026-12-31",
    workOrderRef: "WO-IFSPL-2026-SEP-082",
    contractPeriod: "01-Jan-2026 to 31-Dec-2026",
    clientContact: "Kavita Rao",
    contactPhone: "+91 99102 44556",
    email: "buying@zaraka.demo",
    taxId: "24AABCA5678G2Z3",
    totalPositions: 4,
    inspectedPositions: 4,
    status: "Completed",
    scheduledDate: "2026-10-18",
    applicableChecklists: ["CL-11", "CL-03"]
  },
  {
    id: "SITE-DNL-003",
    clientName: "UrbanThread Apparel Pvt. Ltd.",
    name: "UrbanThread Apparel Pvt. Ltd.",
    plantFacility: "Deepak Nitrite Ltd — Nandesari",
    code: "DNL-NDS",
    company: "UrbanThread Apparel Pvt. Ltd.",
    address: "4/12 GIDC Chemical Complex, Nandesari, Vadodara, Gujarat 391340",
    city: "Vadodara",
    poNumber: "PO/DNL/FIRE/2026/1932",
    poDate: "2026-07-01",
    amcType: "Quarterly",
    frequency: "Quarterly",
    noOfVisits: 4,
    amcExpiryDate: "2027-06-30",
    workOrderRef: "WO-IFSPL-2026-OCT-102",
    contractPeriod: "01-Jul-2026 to 30-Jun-2027",
    clientContact: "Rohan Varma",
    contactPhone: "+91 98200 11223",
    email: "rohan@urbanthread.demo",
    taxId: "24AACCA9012H3Z1",
    totalPositions: 4,
    inspectedPositions: 1,
    status: "In Progress",
    scheduledDate: "2026-10-27",
    applicableChecklists: ["CL-11", "CL-03"]
  },
  {
    id: "SITE-LT-004",
    clientName: "Metro Exports House",
    name: "Metro Exports House",
    plantFacility: "L&T Heavy Engineering — Hazira",
    code: "LT-HZR",
    company: "Metro Exports House",
    address: "Surat-Hazira Road, Hazira Manufacturing Complex, Surat 394510",
    city: "Surat",
    poNumber: "PO/LT/ENGG/2026/7741",
    poDate: "2026-10-01",
    amcType: "Half-Yearly",
    frequency: "Half-Yearly",
    noOfVisits: 2,
    amcExpiryDate: "2027-09-30",
    workOrderRef: "WO-IFSPL-2026-NOV-001",
    contractPeriod: "01-Oct-2026 to 30-Sep-2027",
    clientContact: "Deepak Chawla",
    contactPhone: "+91 97654 33221",
    email: "orders@metroexports.demo",
    taxId: "24AADCA3456J4Z9",
    totalPositions: 3,
    inspectedPositions: 0,
    status: "Scheduled",
    scheduledDate: "2026-11-04",
    applicableChecklists: ["CL-11", "CL-03"]
  }
];

// Positions represent PERMANENT physical locations.
// Each has a permanent QR Code. If equipment (e.g. cylinder) is swapped, the position QR never changes!
export const DEMO_POSITIONS = [
  {
    positionId: "POS-AIL-001",
    qrCode: "QR-POS-AIL-001",
    siteId: "SITE-AIL-001",
    area: "Plant 1 — Reaction Bay (Ground Floor)",
    location: "Adjacent to Column C-4, West Fire Corridor",
    equipmentType: "Fire Extinguisher",
    templateId: "CL-11",
    currentEquipmentId: "EXT-CYL-8821",
    currentEquipment: {
      id: "EXT-CYL-8821",
      serialNo: "IFS-2022-DCP-8821",
      type: "ABC Dry Chemical Powder (Stored Pressure)",
      capacity: "6 Kg",
      make: "Indus SafeGuard (IS 15683)",
      mfgDate: "2022-03",
      lastHydroTestDate: "2025-03-12",
      nextHydroTestDue: "2028-03-12",
      testPressureBar: 35,
      operationalStatus: "Active in Position"
    },
    // Cylinder replacement history for this permanent position
    history: [
      {
        timestamp: "2025-03-12 11:30",
        event: "Cylinder Replacement for Statutory Hydro Testing",
        reason: "Scheduled 3-year hydraulic pressure testing (IS 2190)",
        removedCylinder: {
          id: "EXT-CYL-5120",
          serialNo: "IFS-2019-DCP-5120",
          status: "Sent to IFS Hydro Testing Facility Vadodara",
          testResult: "Passed 35 Bar / 3 Mins, Re-certified"
        },
        replacementCylinder: {
          id: "EXT-CYL-8821",
          serialNo: "IFS-2022-DCP-8821",
          status: "Mounted at Position POS-AIL-001"
        },
        technician: "Ramesh Patel",
        notes: "Permanent QR code QR-POS-AIL-001 retained. Cylinder updated in asset master."
      }
    ],
    inspectionStatus: "Inspected - OK",
    lastInspectionDate: "2026-10-26"
  },
  {
    positionId: "POS-AIL-002",
    qrCode: "QR-POS-AIL-002",
    siteId: "SITE-AIL-001",
    area: "Plant 1 — Solvent Distillation Unit",
    location: "Emergency Staircase Landing 1st Floor",
    equipmentType: "Fire Extinguisher",
    templateId: "CL-11",
    currentEquipmentId: "EXT-CYL-9044",
    currentEquipment: {
      id: "EXT-CYL-9044",
      serialNo: "IFS-2023-FOAM-9044",
      type: "Mechanical Foam (AFFF Stored Pressure)",
      capacity: "9 Litre",
      make: "Indus SafeGuard (IS 15683)",
      mfgDate: "2023-01",
      lastHydroTestDate: "2023-01-20",
      nextHydroTestDue: "2026-11-20",
      testPressureBar: 35,
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Pending Today",
    lastInspectionDate: null
  },
  {
    positionId: "POS-AIL-003",
    qrCode: "QR-POS-AIL-003",
    siteId: "SITE-AIL-001",
    area: "Tank Farm — Storage Sphere 01",
    location: "Hydrant Post HP-04 North Perimeter",
    equipmentType: "Delivery Hose Box",
    templateId: "CL-03",
    currentEquipmentId: "HB-AIL-04",
    currentEquipment: {
      id: "HB-AIL-04",
      serialNo: "HB-2021-LDPE-04",
      type: "Delivery Hose Box (Double Door)",
      material: "LDPE Weatherproof UV Stabilized",
      finish: "Fire Red exterior (IS 5 Shade 536), Interior White",
      hoses: "2 Nos. 15m Type B (63mm instantaneous coupling)",
      branchPipe: "1 No. 63mm Stainless Steel with 16mm nozzle",
      mounting: "Fabricated Heavy Angle Ground Stand",
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Inspected - Attention",
    lastInspectionDate: "2026-10-26"
  },
  {
    positionId: "POS-AIL-004",
    qrCode: "QR-POS-AIL-004",
    siteId: "SITE-AIL-001",
    area: "Warehouse & Raw Material Bay",
    location: "Truck Unloading Dock No. 2",
    equipmentType: "Delivery Hose Box",
    templateId: "CL-03",
    currentEquipmentId: "HB-AIL-09",
    currentEquipment: {
      id: "HB-AIL-09",
      serialNo: "HB-2022-LDPE-09",
      type: "Delivery Hose Box (Double Door)",
      material: "LDPE Weatherproof UV Stabilized",
      finish: "Fire Red exterior (IS 5 Shade 536), Interior White",
      hoses: "2 Nos. 15m Type B (63mm instantaneous coupling)",
      branchPipe: "1 No. 63mm Gunmetal branch pipe",
      mounting: "Wall Bracket Fixed",
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Pending Today",
    lastInspectionDate: null
  },
  {
    positionId: "POS-AIL-005",
    qrCode: "QR-POS-AIL-005",
    siteId: "SITE-AIL-001",
    area: "Main Control Room & Server Hall",
    location: "Server Room Entrance Vestibule",
    equipmentType: "Fire Extinguisher",
    templateId: "CL-11",
    currentEquipmentId: "EXT-CYL-7714",
    currentEquipment: {
      id: "EXT-CYL-7714",
      serialNo: "IFS-2021-CO2-7714",
      type: "CO2 Gas Fire Extinguisher",
      capacity: "4.5 Kg",
      make: "Indus SafeGuard (IS 15683)",
      mfgDate: "2021-08",
      lastHydroTestDate: "2021-08-15",
      nextHydroTestDue: "2026-08-15",
      testPressureBar: 250,
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Pending Today",
    lastInspectionDate: null
  },
  {
    positionId: "POS-AIL-006",
    qrCode: "QR-POS-AIL-HB-03",
    siteId: "SITE-AIL-001",
    area: "Administration & Canteen Block",
    location: "Main Reception Corridor West",
    equipmentType: "Delivery Hose Box",
    templateId: "CL-03",
    currentEquipmentId: "HB-AIL-12",
    currentEquipment: {
      id: "HB-AIL-12",
      serialNo: "HB-2023-LDPE-12",
      type: "Delivery Hose Box (Double Door)",
      material: "LDPE Weatherproof UV Stabilized",
      finish: "Fire Red exterior (IS 5 Shade 536), Interior White",
      hoses: "2 Nos. 15m Type B (63mm instantaneous coupling)",
      branchPipe: "1 No. 63mm Gunmetal branch pipe",
      mounting: "Wall Bracket Fixed",
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Pending Today",
    lastInspectionDate: null
  },
  // Atul Limited (SITE-ATL-002) - Completed Site (4/4 inspected)
  {
    positionId: "POS-ATL-001",
    qrCode: "QR-POS-ATL-001",
    siteId: "SITE-ATL-002",
    area: "Plant 2 — Solvent Recovery",
    location: "Distillation Column D-02 Base",
    equipmentType: "Fire Extinguisher",
    templateId: "CL-11",
    currentEquipmentId: "EXT-ATL-1102",
    currentEquipment: {
      id: "EXT-ATL-1102",
      serialNo: "IFS-2023-DCP-1102",
      type: "ABC Dry Chemical Powder (Stored Pressure)",
      capacity: "6 Kg",
      make: "Indus SafeGuard (IS 15683)",
      mfgDate: "2023-04",
      lastHydroTestDate: "2026-04-10",
      nextHydroTestDue: "2029-04-10",
      testPressureBar: 35,
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Inspected - OK",
    lastInspectionDate: "2026-10-18"
  },
  {
    positionId: "POS-ATL-002",
    qrCode: "QR-POS-ATL-002",
    siteId: "SITE-ATL-002",
    area: "Hydrant Yard",
    location: "Yard Hydrant Post HP-08",
    equipmentType: "Delivery Hose Box",
    templateId: "CL-03",
    currentEquipmentId: "HB-ATL-03",
    currentEquipment: {
      id: "HB-ATL-03",
      serialNo: "HB-2022-LDPE-03",
      type: "Delivery Hose Box (Double Door)",
      material: "LDPE Weatherproof UV Stabilized",
      finish: "Fire Red exterior (IS 5 Shade 536), Interior White",
      hoses: "2 Nos. 15m Type B (63mm instantaneous coupling)",
      branchPipe: "1 No. 63mm Stainless Steel with 16mm nozzle",
      mounting: "Ground Stand",
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Inspected - OK",
    lastInspectionDate: "2026-10-18"
  },
  {
    positionId: "POS-ATL-003",
    qrCode: "QR-POS-ATL-003",
    siteId: "SITE-ATL-002",
    area: "Transformer Yard",
    location: "Main Step-Up Substation Fence",
    equipmentType: "Fire Extinguisher",
    templateId: "CL-11",
    currentEquipmentId: "EXT-ATL-3011",
    currentEquipment: {
      id: "EXT-ATL-3011",
      serialNo: "IFS-2022-CO2-3011",
      type: "CO2 Gas Fire Extinguisher",
      capacity: "4.5 Kg",
      make: "Indus SafeGuard (IS 15683)",
      mfgDate: "2022-01",
      lastHydroTestDate: "2022-01-15",
      nextHydroTestDue: "2027-01-15",
      testPressureBar: 250,
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Inspected - OK",
    lastInspectionDate: "2026-10-18"
  },
  {
    positionId: "POS-ATL-004",
    qrCode: "QR-POS-ATL-004",
    siteId: "SITE-ATL-002",
    area: "Finished Goods Warehouse",
    location: "Bay 3 Exit Gate",
    equipmentType: "Delivery Hose Box",
    templateId: "CL-03",
    currentEquipmentId: "HB-ATL-07",
    currentEquipment: {
      id: "HB-ATL-07",
      serialNo: "HB-2023-LDPE-07",
      type: "Delivery Hose Box (Double Door)",
      material: "LDPE Weatherproof UV Stabilized",
      finish: "Fire Red exterior (IS 5 Shade 536), Interior White",
      hoses: "2 Nos. 15m Type B (63mm instantaneous coupling)",
      branchPipe: "1 No. 63mm Gunmetal branch pipe",
      mounting: "Wall Bracket",
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Inspected - OK",
    lastInspectionDate: "2026-10-18"
  },
  // Deepak Nitrite Ltd (SITE-DNL-003) - In Progress (1/4 inspected)
  {
    positionId: "POS-DNL-001",
    qrCode: "QR-POS-DNL-001",
    siteId: "SITE-DNL-003",
    area: "Nitration Plant Ground Floor",
    location: "Reactor R-101 North Walkway",
    equipmentType: "Fire Extinguisher",
    templateId: "CL-11",
    currentEquipmentId: "EXT-DNL-4019",
    currentEquipment: {
      id: "EXT-DNL-4019",
      serialNo: "IFS-2023-FOAM-4019",
      type: "Mechanical Foam (AFFF Stored Pressure)",
      capacity: "9 Litre",
      make: "Indus SafeGuard (IS 15683)",
      mfgDate: "2023-05",
      lastHydroTestDate: "2023-05-20",
      nextHydroTestDue: "2026-12-20",
      testPressureBar: 35,
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Inspected - OK",
    lastInspectionDate: "2026-10-27"
  },
  {
    positionId: "POS-DNL-002",
    qrCode: "QR-POS-DNL-002",
    siteId: "SITE-DNL-003",
    area: "Boiler House",
    location: "Near Feed Water Pump Station",
    equipmentType: "Delivery Hose Box",
    templateId: "CL-03",
    currentEquipmentId: "HB-DNL-01",
    currentEquipment: {
      id: "HB-DNL-01",
      serialNo: "HB-2022-LDPE-01",
      type: "Delivery Hose Box (Double Door)",
      material: "LDPE Weatherproof UV Stabilized",
      finish: "Fire Red exterior (IS 5 Shade 536), Interior White",
      hoses: "2 Nos. 15m Type B (63mm instantaneous coupling)",
      branchPipe: "1 No. 63mm Stainless Steel",
      mounting: "Fabricated Stand",
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Pending Today",
    lastInspectionDate: null
  },
  {
    positionId: "POS-DNL-003",
    qrCode: "QR-POS-DNL-003",
    siteId: "SITE-DNL-003",
    area: "Central Control Room",
    location: "Main Entrance Foyer",
    equipmentType: "Fire Extinguisher",
    templateId: "CL-11",
    currentEquipmentId: "EXT-DNL-2088",
    currentEquipment: {
      id: "EXT-DNL-2088",
      serialNo: "IFS-2022-CO2-2088",
      type: "CO2 Gas Fire Extinguisher",
      capacity: "4.5 Kg",
      make: "Indus SafeGuard (IS 15683)",
      mfgDate: "2022-07",
      lastHydroTestDate: "2022-07-15",
      nextHydroTestDue: "2027-07-15",
      testPressureBar: 250,
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Pending Today",
    lastInspectionDate: null
  },
  {
    positionId: "POS-DNL-004",
    qrCode: "QR-POS-DNL-004",
    siteId: "SITE-DNL-003",
    area: "Tank Farm Dike Area",
    location: "Hydrant Post HP-02",
    equipmentType: "Delivery Hose Box",
    templateId: "CL-03",
    currentEquipmentId: "HB-DNL-05",
    currentEquipment: {
      id: "HB-DNL-05",
      serialNo: "HB-2023-LDPE-05",
      type: "Delivery Hose Box (Double Door)",
      material: "LDPE Weatherproof UV Stabilized",
      finish: "Fire Red exterior (IS 5 Shade 536), Interior White",
      hoses: "2 Nos. 15m Type B (63mm instantaneous coupling)",
      branchPipe: "1 No. 63mm Gunmetal branch pipe",
      mounting: "Wall Fixed",
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Pending Today",
    lastInspectionDate: null
  },
  // L&T Heavy Engineering Hazira (SITE-LT-004) - Scheduled Site (0/3 inspected)
  {
    positionId: "POS-LT-001",
    qrCode: "QR-POS-LT-001",
    siteId: "SITE-LT-004",
    area: "Heavy Fabrication Bay 1",
    location: "Column F-12 East Craneway",
    equipmentType: "Fire Extinguisher",
    templateId: "CL-11",
    currentEquipmentId: "EXT-LT-9901",
    currentEquipment: {
      id: "EXT-LT-9901",
      serialNo: "IFS-2023-DCP-9901",
      type: "ABC Dry Chemical Powder (Stored Pressure)",
      capacity: "9 Kg",
      make: "Indus SafeGuard (IS 15683)",
      mfgDate: "2023-09",
      lastHydroTestDate: "2023-09-10",
      nextHydroTestDue: "2026-09-10",
      testPressureBar: 35,
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Pending Inspection",
    lastInspectionDate: null
  },
  {
    positionId: "POS-LT-002",
    qrCode: "QR-POS-LT-002",
    siteId: "SITE-LT-004",
    area: "Hazira Jetty Loading Area",
    location: "Barge Docking Post 01",
    equipmentType: "Delivery Hose Box",
    templateId: "CL-03",
    currentEquipmentId: "HB-LT-01",
    currentEquipment: {
      id: "HB-LT-01",
      serialNo: "HB-2022-LDPE-01",
      type: "Delivery Hose Box (Double Door)",
      material: "LDPE Weatherproof UV Stabilized",
      finish: "Fire Red exterior (IS 5 Shade 536), Interior White",
      hoses: "2 Nos. 15m Type B (63mm instantaneous coupling)",
      branchPipe: "1 No. 63mm Stainless Steel",
      mounting: "Fabricated Stand",
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Pending Inspection",
    lastInspectionDate: null
  },
  {
    positionId: "POS-LT-003",
    qrCode: "QR-POS-LT-003",
    siteId: "SITE-LT-004",
    area: "Special Pressure Vessel Workshop",
    location: "Welding Booth Cluster B",
    equipmentType: "Fire Extinguisher",
    templateId: "CL-11",
    currentEquipmentId: "EXT-LT-9904",
    currentEquipment: {
      id: "EXT-LT-9904",
      serialNo: "IFS-2022-CO2-9904",
      type: "CO2 Gas Fire Extinguisher",
      capacity: "4.5 Kg",
      make: "Indus SafeGuard (IS 15683)",
      mfgDate: "2022-03",
      lastHydroTestDate: "2022-03-15",
      nextHydroTestDue: "2027-03-15",
      testPressureBar: 250,
      operationalStatus: "Active in Position"
    },
    history: [],
    inspectionStatus: "Pending Inspection",
    lastInspectionDate: null
  }
];

// Sample Visit Record
export const DEMO_ACTIVE_VISIT = {
  visitId: "VISIT-2026-10-AIL-01",
  siteId: "SITE-AIL-001",
  date: "2026-10-26",
  serviceEngineer: "Ramesh Patel",
  supervisor: "Sanjay Sharma",
  clientRepresentative: "Vikram Shah",
  status: "In Progress",
  checklistAnswers: {
    // CL-11 completed on POS-AIL-001
    "POS-AIL-001": {
      templateId: "CL-11",
      timestamp: "2026-10-26 09:45",
      items: {
        1: { status: "OK", reason: "", photo: null },
        2: { status: "OK", reason: "", photo: null },
        3: { status: "OK", reason: "", photo: null },
        4: { status: "OK", reason: "", photo: null },
        5: { status: "OK", reason: "", photo: null },
        6: { status: "OK", reason: "", photo: null },
        7: { status: "NA", reason: "Stored pressure unit - dry nitrogen already sealed", photo: null },
        8: { status: "OK", reason: "", photo: null },
        9: { status: "OK", reason: "", photo: null }
      },
      remarks: "Hydraulic pressure verified at 35 Bar for 3 mins. No leakage, no deformation. Pressure gauge calibrated.",
      photos: []
    },
    // CL-03 completed on POS-AIL-003
    "POS-AIL-003": {
      templateId: "CL-03",
      timestamp: "2026-10-26 10:15",
      items: {
        1: { status: "OK", reason: "", photo: null },
        2: { status: "NOT_OK", reason: "Weather rubber beading loose on left door frame edge", photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150'><rect width='200' height='150' fill='%23fee2e2'/><text x='15' y='80' fill='%23dc2626' font-size='14' font-family='sans-serif'>Beading Defect Evidence</text></svg>" },
        3: { status: "OK", reason: "", photo: null },
        4: { status: "OK", reason: "", photo: null },
        5: { status: "OK", reason: "", photo: null },
        6: { status: "OK", reason: "", photo: null },
        7: { status: "OK", reason: "", photo: null },
        8: { status: "OK", reason: "", photo: null }
      },
      remarks: "Rubber beading loose on left door frame edge. Scheduled for replacement during afternoon round.",
      photos: [
        {
          id: "photo-01",
          url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150'><rect width='200' height='150' fill='%23fee2e2'/><text x='15' y='80' fill='%23dc2626' font-size='14' font-family='sans-serif'>Beading Defect Evidence</text></svg>",
          label: "Hose Box door beading damage",
          timestamp: "2026-10-26 10:18"
        }
      ]
    }
  },
  visitRemarks: "Quarterly AMC inspection underway. Extinguishers in Reaction Bay tested in accordance with IS 2190. Tank farm hose box minor rubber beading attended.",
  sparesReplaced: "Rubber beading (1.5m), 1 No. Break glass key chain",
  pendingPoints: "Replacement of cylinder EXT-CYL-5120 lot certificate to be attached upon lab receipt.",
  technicianSignature: null,
  clientSignature: null,
  completedAt: null
};
