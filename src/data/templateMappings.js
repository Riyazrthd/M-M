// Indus Fire Safety Private Limited - Configurable Checklist Template Mapping Engine
// Maps Equipment Categories, Types, and Service Types to standardized SOP Checklists

// Master list of Specific Equipment Types and their strictly linked Target Service Types
export const INITIAL_EQUIPMENT_MASTER = [
  // Fire Extinguisher
  {
    id: "EQ-EXT-001",
    category: "Fire Extinguisher",
    equipmentType: "Water CO2 Fire Extinguisher",
    defaultCapacity: "9 Ltr",
    capacities: ["9 Ltr", "6 Ltr", "50 Ltr (Trolley)"],
    linkedServices: [
      { id: "SRV-WCO2-HPT", serviceType: "Hydro Testing & Pressurisation", checklistTemplateId: "CL-11", isDefault: true },
      { id: "SRV-WCO2-OVERHAUL", serviceType: "Water Discharge & Cylinder Overhaul", checklistTemplateId: "CL-11", isDefault: false },
      { id: "SRV-WCO2-ROUTINE", serviceType: "Routine Servicing / Inspection", checklistTemplateId: "CL-26", isDefault: false }
    ]
  },
  {
    id: "EQ-EXT-002",
    category: "Fire Extinguisher",
    equipmentType: "ABC Dry Chemical Powder (Stored Pressure)",
    defaultCapacity: "6 Kg",
    capacities: ["6 Kg", "4 Kg", "9 Kg", "2 Kg", "1 Kg", "50 Kg (Trolley)", "75 Kg (Trolley)"],
    linkedServices: [
      { id: "SRV-ABC-HPT", serviceType: "Hydro Testing & Pressurisation", checklistTemplateId: "CL-11", isDefault: true },
      { id: "SRV-ABC-REFILL", serviceType: "Annual Refilling & Recharging", checklistTemplateId: "CL-11", isDefault: false },
      { id: "SRV-ABC-ROUTINE", serviceType: "Routine Servicing / Inspection", checklistTemplateId: "CL-26", isDefault: false }
    ]
  },
  {
    id: "EQ-EXT-003",
    category: "Fire Extinguisher",
    equipmentType: "ABC Dry Chemical Powder (Cartridge Type)",
    defaultCapacity: "6 Kg",
    capacities: ["6 Kg", "9 Kg", "4 Kg", "50 Kg (Trolley)", "75 Kg (Trolley)"],
    linkedServices: [
      { id: "SRV-ABCC-HPT", serviceType: "Hydro Testing & Pressurisation", checklistTemplateId: "CL-11", isDefault: true },
      { id: "SRV-ABCC-REFILL", serviceType: "Annual Refilling & Recharging", checklistTemplateId: "CL-11", isDefault: false },
      { id: "SRV-ABCC-ROUTINE", serviceType: "Routine Servicing / Inspection", checklistTemplateId: "CL-26", isDefault: false }
    ]
  },
  {
    id: "EQ-EXT-004",
    category: "Fire Extinguisher",
    equipmentType: "CO2 Gas Fire Extinguisher",
    defaultCapacity: "4.5 Kg",
    capacities: ["4.5 Kg", "2 Kg", "3 Kg", "6.5 Kg", "9 Kg", "22.5 Kg (Mobile)"],
    linkedServices: [
      { id: "SRV-CO2-HPT", serviceType: "Hydro Testing & Pressurisation", checklistTemplateId: "CL-11", isDefault: true },
      { id: "SRV-CO2-REFILL", serviceType: "CO2 Gas Refilling & Weight Check", checklistTemplateId: "CL-11", isDefault: false },
      { id: "SRV-CO2-ROUTINE", serviceType: "Routine Servicing / Inspection", checklistTemplateId: "CL-26", isDefault: false }
    ]
  },
  {
    id: "EQ-EXT-005",
    category: "Fire Extinguisher",
    equipmentType: "Mechanical Foam (AFFF Stored Pressure)",
    defaultCapacity: "9 Ltr",
    capacities: ["9 Ltr", "6 Ltr", "50 Ltr (Trolley)"],
    linkedServices: [
      { id: "SRV-FOAM-HPT", serviceType: "Hydro Testing & Pressurisation", checklistTemplateId: "CL-11", isDefault: true },
      { id: "SRV-FOAM-CHARGE", serviceType: "AFFF Foam Charge Replacement", checklistTemplateId: "CL-11", isDefault: false },
      { id: "SRV-FOAM-ROUTINE", serviceType: "Routine Servicing / Inspection", checklistTemplateId: "CL-26", isDefault: false }
    ]
  },
  {
    id: "EQ-EXT-006",
    category: "Fire Extinguisher",
    equipmentType: "Clean Agent (HFC-236fa / FK-5-1-12)",
    defaultCapacity: "4 Kg",
    capacities: ["4 Kg", "2 Kg", "6 Kg"],
    linkedServices: [
      { id: "SRV-CLEAN-HPT", serviceType: "Hydro Testing & Pressurisation", checklistTemplateId: "CL-11", isDefault: true },
      { id: "SRV-CLEAN-VERIF", serviceType: "Clean Agent Pressure Verification", checklistTemplateId: "CL-26", isDefault: false },
      { id: "SRV-CLEAN-ROUTINE", serviceType: "Routine Servicing / Inspection", checklistTemplateId: "CL-26", isDefault: false }
    ]
  },

  // Delivery Hose Box
  {
    id: "EQ-HB-001",
    category: "Delivery Hose Box",
    equipmentType: "Double Door LDPE Weatherproof Hose Box",
    defaultCapacity: "2 x 15m Hoses + Branch Pipe",
    capacities: ["2 x 15m Hoses + Branch Pipe", "2 x 30m Hoses + Branch Pipe", "1 x 15m Hose + Branch Pipe", "15m x 63mm (Single Hose)"],
    linkedServices: [
      { id: "SRV-HB-MAINT-1", serviceType: "Hose Box Servicing & Maintenance", checklistTemplateId: "CL-03", isDefault: true },
      { id: "SRV-HB-AUDIT-1", serviceType: "Annual Hose Box Physical Audit", checklistTemplateId: "CL-03", isDefault: false }
    ]
  },
  {
    id: "EQ-HB-002",
    category: "Delivery Hose Box",
    equipmentType: "Single Door MS Powder Coated Hose Box",
    defaultCapacity: "1 x 15m Hose + Branch Pipe",
    capacities: ["1 x 15m Hose + Branch Pipe", "2 x 15m Hoses + Branch Pipe"],
    linkedServices: [
      { id: "SRV-HB-MAINT-2", serviceType: "Hose Box Servicing & Maintenance", checklistTemplateId: "CL-03", isDefault: true },
      { id: "SRV-HB-AUDIT-2", serviceType: "Annual Hose Box Physical Audit", checklistTemplateId: "CL-03", isDefault: false }
    ]
  },
  {
    id: "EQ-HB-003",
    category: "Delivery Hose Box",
    equipmentType: "FRP Heavy Duty Industrial Hose Box",
    defaultCapacity: "2 x 15m Hoses + Branch Pipe",
    capacities: ["2 x 15m Hoses + Branch Pipe", "2 x 30m Hoses + Branch Pipe"],
    linkedServices: [
      { id: "SRV-HB-MAINT-3", serviceType: "Hose Box Servicing & Maintenance", checklistTemplateId: "CL-03", isDefault: true },
      { id: "SRV-HB-AUDIT-3", serviceType: "Annual Hose Box Physical Audit", checklistTemplateId: "CL-03", isDefault: false }
    ]
  },

  // First Aid Hose Reel
  {
    id: "EQ-HR-001",
    category: "First Aid Hose Reel",
    equipmentType: "Swinging Type 19mm Hose Reel",
    defaultCapacity: "30 Metre Length",
    capacities: ["30 Metre Length", "36 Metre Length", "40 Metre Length", "19mm x 30m Drum"],
    linkedServices: [
      { id: "SRV-HR-MAINT-1", serviceType: "Hose Reel Servicing & Drum Check", checklistTemplateId: "CL-09", isDefault: true }
    ]
  },
  {
    id: "EQ-HR-002",
    category: "First Aid Hose Reel",
    equipmentType: "Fixed Type 25mm Hose Reel",
    defaultCapacity: "30 Metre Length",
    capacities: ["30 Metre Length", "36 Metre Length", "25mm x 30m Drum"],
    linkedServices: [
      { id: "SRV-HR-MAINT-2", serviceType: "Hose Reel Servicing & Drum Check", checklistTemplateId: "CL-09", isDefault: true }
    ]
  },

  // Hydrant System
  {
    id: "EQ-HYD-001",
    category: "Hydrant System",
    equipmentType: "Single Outlet Landing Valve (IS 5290)",
    defaultCapacity: "63mm Female Instantaneous",
    capacities: ["63mm Female Instantaneous", "75mm Flanged x 63mm Outlet", "80mm Flanged x 63mm Outlet"],
    linkedServices: [
      { id: "SRV-HYD-MAINT-1", serviceType: "Landing Valve & FB Inlet Overhaul", checklistTemplateId: "CL-01", isDefault: true }
    ]
  },
  {
    id: "EQ-HYD-002",
    category: "Hydrant System",
    equipmentType: "Double Outlet Landing Valve",
    defaultCapacity: "2 x 63mm Outlets",
    capacities: ["2 x 63mm Outlets", "100mm Flanged x 2x 63mm Outlets"],
    linkedServices: [
      { id: "SRV-HYD-MAINT-2", serviceType: "Landing Valve & FB Inlet Overhaul", checklistTemplateId: "CL-01", isDefault: true }
    ]
  },
  {
    id: "EQ-HYD-003",
    category: "Hydrant System",
    equipmentType: "4-Way Fire Brigade Inlet Connection",
    defaultCapacity: "4 x 63mm Inlets to 150mm Header",
    capacities: ["4 x 63mm Inlets to 150mm Header", "2 x 63mm Inlets to 100mm Header"],
    linkedServices: [
      { id: "SRV-HYD-MAINT-3", serviceType: "Landing Valve & FB Inlet Overhaul", checklistTemplateId: "CL-01", isDefault: true }
    ]
  },

  // Fire Detection & Alarm System
  {
    id: "EQ-ALARM-001",
    category: "Fire Detection & Alarm System",
    equipmentType: "Addressable Fire Alarm Control Panel",
    defaultCapacity: "4 Loop (500 Devices)",
    capacities: ["4 Loop (500 Devices)", "2 Loop (250 Devices)", "8 Loop (1000 Devices)", "16 Loop (2000 Devices)"],
    linkedServices: [
      { id: "SRV-ALARM-MAINT-1", serviceType: "Quarterly Detection & Sounder Testing", checklistTemplateId: "CL-18", isDefault: true }
    ]
  },
  {
    id: "EQ-ALARM-002",
    category: "Fire Detection & Alarm System",
    equipmentType: "Conventional 8-Zone Alarm Panel",
    defaultCapacity: "8 Zones",
    capacities: ["8 Zones", "4 Zones", "16 Zones", "24 Zones"],
    linkedServices: [
      { id: "SRV-ALARM-MAINT-2", serviceType: "Quarterly Detection & Sounder Testing", checklistTemplateId: "CL-18", isDefault: true }
    ]
  },
  {
    id: "EQ-ALARM-003",
    category: "Fire Detection & Alarm System",
    equipmentType: "Smoke & Heat Detector Loop",
    defaultCapacity: "30 Detectors Loop",
    capacities: ["30 Detectors Loop", "60 Detectors Loop", "120 Detectors Loop"],
    linkedServices: [
      { id: "SRV-ALARM-MAINT-3", serviceType: "Quarterly Detection & Sounder Testing", checklistTemplateId: "CL-18", isDefault: true }
    ]
  },

  // Fire Pumpset
  {
    id: "EQ-PUMP-001",
    category: "Fire Pumpset",
    equipmentType: "Main Electric Fire Pump 2850 RPM",
    defaultCapacity: "2280 LPM @ 7.0 Bar",
    capacities: ["2280 LPM @ 7.0 Bar", "2850 LPM @ 8.8 Bar", "1620 LPM @ 5.6 Bar"],
    linkedServices: [
      { id: "SRV-PUMP-TEST-1", serviceType: "Pump Flow & Cut-in Pressure Test", checklistTemplateId: null, isDefault: true }
    ]
  },
  {
    id: "EQ-PUMP-002",
    category: "Fire Pumpset",
    equipmentType: "Diesel Engine Standby Fire Pump",
    defaultCapacity: "2280 LPM @ 7.0 Bar",
    capacities: ["2280 LPM @ 7.0 Bar", "2850 LPM @ 8.8 Bar", "1620 LPM @ 5.6 Bar"],
    linkedServices: [
      { id: "SRV-PUMP-TEST-2", serviceType: "Pump Flow & Cut-in Pressure Test", checklistTemplateId: null, isDefault: true }
    ]
  },
  {
    id: "EQ-PUMP-003",
    category: "Fire Pumpset",
    equipmentType: "Jockey Pressure Maintenance Pump",
    defaultCapacity: "180 LPM @ 7.5 Bar",
    capacities: ["180 LPM @ 7.5 Bar", "108 LPM @ 5.6 Bar", "300 LPM @ 8.8 Bar"],
    linkedServices: [
      { id: "SRV-PUMP-TEST-3", serviceType: "Pump Flow & Cut-in Pressure Test", checklistTemplateId: null, isDefault: true }
    ]
  }
];

export const EQUIPMENT_CATEGORIES = [
  {
    id: "CAT-EXT",
    name: "Fire Extinguisher",
    types: [
      "ABC Dry Chemical Powder (Stored Pressure)",
      "ABC Dry Chemical Powder (Cartridge Type)",
      "CO2 Gas Fire Extinguisher",
      "Mechanical Foam (AFFF Stored Pressure)",
      "Water CO2 Fire Extinguisher",
      "Clean Agent (HFC-236fa / FK-5-1-12)"
    ],
    serviceTypes: [
      { id: "SRV-HPT", name: "Hydro Testing & Pressurisation", defaultTemplate: "CL-11" },
      { id: "SRV-ROUTINE", name: "Routine Servicing / Inspection", defaultTemplate: "CL-26" },
      { id: "SRV-REFILL", name: "Annual Refilling & Recharging", defaultTemplate: "CL-11" }
    ]
  },
  {
    id: "CAT-HB",
    name: "Delivery Hose Box",
    types: [
      "Double Door LDPE Weatherproof Hose Box",
      "Single Door MS Powder Coated Hose Box",
      "FRP Heavy Duty Industrial Hose Box"
    ],
    serviceTypes: [
      { id: "SRV-HB-MAINT", name: "Hose Box Servicing & Maintenance", defaultTemplate: "CL-03" },
      { id: "SRV-HB-AUDIT", name: "Annual Hose Box Physical Audit", defaultTemplate: "CL-03" }
    ]
  },
  {
    id: "CAT-HR",
    name: "First Aid Hose Reel",
    types: [
      "Swinging Type 19mm Hose Reel",
      "Fixed Type 25mm Hose Reel"
    ],
    serviceTypes: [
      { id: "SRV-HR-MAINT", name: "Hose Reel Servicing & Drum Check", defaultTemplate: "CL-09" }
    ]
  },
  {
    id: "CAT-HYD",
    name: "Hydrant System",
    types: [
      "Single Outlet Landing Valve (IS 5290)",
      "Double Outlet Landing Valve",
      "4-Way Fire Brigade Inlet Connection"
    ],
    serviceTypes: [
      { id: "SRV-HYD-MAINT", name: "Landing Valve & FB Inlet Overhaul", defaultTemplate: "CL-01" }
    ]
  },
  {
    id: "CAT-ALARM",
    name: "Fire Detection & Alarm System",
    types: [
      "Addressable Fire Alarm Control Panel",
      "Conventional 8-Zone Alarm Panel",
      "Smoke & Heat Detector Loop"
    ],
    serviceTypes: [
      { id: "SRV-ALARM-MAINT", name: "Quarterly Detection & Sounder Testing", defaultTemplate: "CL-18" }
    ]
  },
  {
    id: "CAT-PUMP",
    name: "Fire Pumpset",
    types: [
      "Main Electric Fire Pump 2850 RPM",
      "Diesel Engine Standby Fire Pump",
      "Jockey Pressure Maintenance Pump"
    ],
    serviceTypes: [
      { id: "SRV-PUMP-TEST", name: "Pump Flow & Cut-in Pressure Test", defaultTemplate: null } // Deliberately unmapped to test warnings!
    ]
  }
];

export const INITIAL_TEMPLATE_MAPPINGS = [
  {
    id: "MAP-001",
    equipmentCategory: "Fire Extinguisher",
    equipmentType: "All Extinguisher Types",
    serviceType: "Hydro Testing & Pressurisation",
    checklistTemplateId: "CL-11",
    active: true,
    effectiveFrom: "2026-10-01",
    notes: "Mandatory IS 2190 statutory 35 Bar hydraulic pressure test (Section 6 Format)"
  },
  {
    id: "MAP-002",
    equipmentCategory: "Fire Extinguisher",
    equipmentType: "All Extinguisher Types",
    serviceType: "Annual Refilling & Recharging",
    checklistTemplateId: "CL-11",
    active: true,
    effectiveFrom: "2026-10-01",
    notes: "Powder / AFFF refilling, dry nitrogen pressurisation, and lot certificate"
  },
  {
    id: "MAP-003",
    equipmentCategory: "Fire Extinguisher",
    equipmentType: "All Extinguisher Types",
    serviceType: "Routine Servicing / Inspection",
    checklistTemplateId: "CL-26",
    active: true,
    effectiveFrom: "2026-10-01",
    notes: "Monthly / quarterly visual check of pressure gauge, seal, tag and mounting"
  },
  {
    id: "MAP-004",
    equipmentCategory: "Delivery Hose Box",
    equipmentType: "All Delivery Hose Boxes",
    serviceType: "Hose Box Servicing & Maintenance",
    checklistTemplateId: "CL-03",
    active: true,
    effectiveFrom: "2026-10-01",
    notes: "IFSPL/M&M/CL/003 Front glass, rubber beading, hinges, 15m hoses, branch pipe"
  },
  {
    id: "MAP-005",
    equipmentCategory: "Delivery Hose Box",
    equipmentType: "All Delivery Hose Boxes",
    serviceType: "Annual Hose Box Physical Audit",
    checklistTemplateId: "CL-03",
    active: true,
    effectiveFrom: "2026-10-01",
    notes: "IFSPL/M&M/CL/003 Annual structural mounting, paint, and accessories verification"
  },
  {
    id: "MAP-006",
    equipmentCategory: "Hydrant System",
    equipmentType: "Landing Valves & FB Inlets",
    serviceType: "Landing Valve & FB Inlet Overhaul",
    checklistTemplateId: "CL-01",
    active: true,
    effectiveFrom: "2026-10-01",
    notes: "IFSPL/M&M/CL/001 Hydrant valve gland packing, hydro leak test, lug cleaning"
  },
  {
    id: "MAP-007",
    equipmentCategory: "First Aid Hose Reel",
    equipmentType: "All Hose Reels",
    serviceType: "Hose Reel Servicing & Drum Check",
    checklistTemplateId: "CL-09",
    active: true,
    effectiveFrom: "2026-10-01",
    notes: "IFSPL/M&M/CL/009 Drum rotation, nozzle shutoff, 30m tubing pressure test"
  },
  {
    id: "MAP-008",
    equipmentCategory: "Fire Detection & Alarm System",
    equipmentType: "Smoke & Heat Detector Loop",
    serviceType: "Quarterly Detection & Sounder Testing",
    checklistTemplateId: "CL-18",
    active: true,
    effectiveFrom: "2026-10-01",
    notes: "IFSPL/M&M/CL/018 Panel battery standby, aerosol smoke probe, manual call point"
  }
];

// Helper to resolve the matching template
export function resolveChecklistMapping(category, serviceType, equipmentType = null, customMappings = null) {
  // 1. Check linked services in equipment master first
  let equipmentMaster = INITIAL_EQUIPMENT_MASTER;
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('ifspl_amc_equipment_master');
      if (stored) equipmentMaster = JSON.parse(stored);
    } catch (e) {}
  }

  if (equipmentType) {
    const eqItem = equipmentMaster.find(e => 
      e.equipmentType.toLowerCase() === equipmentType.toLowerCase() &&
      (!category || e.category.toLowerCase() === category.toLowerCase())
    );
    if (eqItem && Array.isArray(eqItem.linkedServices)) {
      const linkedSrv = eqItem.linkedServices.find(s => 
        s.serviceType.toLowerCase() === serviceType.toLowerCase()
      );
      if (linkedSrv) {
        if (linkedSrv.checklistTemplateId) {
          return {
            success: true,
            mapping: linkedSrv,
            checklistTemplateId: linkedSrv.checklistTemplateId,
            matchType: 'EQUIPMENT_LINKED'
          };
        } else {
          return {
            success: false,
            mapping: null,
            checklistTemplateId: null,
            warning: `Target service "${serviceType}" linked to equipment "${equipmentType}" has no checklist template assigned.`,
            matchType: 'UNMAPPED'
          };
        }
      }
    }
  }

  const mappings = customMappings || INITIAL_TEMPLATE_MAPPINGS;

  // 2. Try exact match in custom template mappings
  if (equipmentType) {
    const exactMatch = mappings.find(m => 
      m.active &&
      m.equipmentCategory === category &&
      m.serviceType === serviceType &&
      m.equipmentType === equipmentType
    );
    if (exactMatch && exactMatch.checklistTemplateId) {
      return {
        success: true,
        mapping: exactMatch,
        checklistTemplateId: exactMatch.checklistTemplateId,
        matchType: 'EXACT'
      };
    }
  }

  // 3. Try category + service type with "All" wildcard
  const wildcardMatch = mappings.find(m => 
    m.active &&
    m.equipmentCategory === category &&
    m.serviceType === serviceType
  );
  if (wildcardMatch && wildcardMatch.checklistTemplateId) {
    return {
      success: true,
      mapping: wildcardMatch,
      checklistTemplateId: wildcardMatch.checklistTemplateId,
      matchType: 'CATEGORY_DEFAULT'
    };
  }

  // 4. No mapping found: explicitly return unmapped warning (prevents silent wrong checklist assignment!)
  return {
    success: false,
    mapping: null,
    checklistTemplateId: null,
    warning: `No applicable checklist template configured for category "${category}" with service "${serviceType}".`,
    matchType: 'UNMAPPED'
  };
}

// -----------------------------------------------------------------------------
// Linked Equipment Capacities & Ratings Resolution Helper
// -----------------------------------------------------------------------------
export function getStandardCapacitiesForType(equipmentType = '', category = '', defaultCap = '') {
  const t = (equipmentType || '').toLowerCase();
  const c = (category || '').toLowerCase();

  let results = [];

  if (t.includes('water co2') || (c.includes('extinguisher') && t.includes('water'))) {
    results = ['9 Ltr', '6 Ltr', '50 Ltr (Trolley)'];
  } else if (t.includes('foam') || t.includes('afff')) {
    results = ['9 Ltr', '6 Ltr', '50 Ltr (Trolley)'];
  } else if (t.includes('co2') || t.includes('carbon dioxide')) {
    results = ['4.5 Kg', '2 Kg', '3 Kg', '6.5 Kg', '9 Kg', '22.5 Kg (Mobile)'];
  } else if (t.includes('clean agent') || t.includes('hfc') || t.includes('fk-5') || t.includes('gas')) {
    results = ['4 Kg', '2 Kg', '6 Kg', '80 Ltr 200 Bar'];
  } else if (t.includes('dry chemical') || t.includes('dcp') || t.includes('abc') || c.includes('extinguisher')) {
    results = ['6 Kg', '4 Kg', '9 Kg', '2 Kg', '1 Kg', '50 Kg (Trolley)', '75 Kg (Trolley)'];
  } else if (c.includes('hose box') || t.includes('hose box')) {
    results = [
      '2 x 15m Hoses + Branch Pipe',
      '1 x 15m Hose + Branch Pipe',
      '2 x 30m Hoses + Branch Pipe',
      '15m x 63mm (Single Hose)'
    ];
  } else if (c.includes('hose reel') || t.includes('hose reel')) {
    results = ['30 Metre Length', '36 Metre Length', '40 Metre Length', '19mm x 30m Drum', '25mm x 30m Drum'];
  } else if (c.includes('hydrant') || t.includes('landing valve') || t.includes('inlet')) {
    results = [
      '63mm Female Instantaneous',
      '2 x 63mm Outlets',
      '4 x 63mm Inlets to 150mm Header',
      '75mm Flanged x 63mm Outlet',
      '80mm Flanged x 63mm Outlet'
    ];
  } else if (c.includes('alarm') || c.includes('detection') || t.includes('panel') || t.includes('detector')) {
    results = [
      '4 Loop (500 Devices)',
      '2 Loop (250 Devices)',
      '8 Loop (1000 Devices)',
      '8 Zones',
      '4 Zones',
      '16 Zones',
      '30 Detectors Loop',
      '60 Detectors Loop'
    ];
  } else if (c.includes('pump') || t.includes('pump')) {
    results = [
      '2280 LPM @ 7.0 Bar',
      '2850 LPM @ 8.8 Bar',
      '1620 LPM @ 5.6 Bar',
      '180 LPM @ 7.5 Bar',
      '108 LPM @ 5.6 Bar',
      '300 LPM @ 8.8 Bar'
    ];
  } else {
    results = defaultCap ? [defaultCap] : ['Standard Size / Capacity'];
  }

  if (defaultCap && !results.includes(defaultCap)) {
    results.unshift(defaultCap);
  }

  return results;
}

export function getLinkedCapacities(equipmentType, category = '', masterList = null) {
  if (!equipmentType) return ['Standard'];

  const eqTypeClean = equipmentType.trim().toLowerCase();
  const master = masterList || INITIAL_EQUIPMENT_MASTER;

  if (Array.isArray(master)) {
    const found = master.find(e => 
      e.equipmentType && e.equipmentType.trim().toLowerCase() === eqTypeClean &&
      (!category || !e.category || e.category.toLowerCase() === category.toLowerCase())
    );
    if (found && Array.isArray(found.capacities) && found.capacities.length > 0) {
      const list = [...found.capacities];
      if (found.defaultCapacity && !list.includes(found.defaultCapacity)) {
        list.unshift(found.defaultCapacity);
      }
      return list;
    }
    if (found && found.defaultCapacity) {
      return getStandardCapacitiesForType(equipmentType, category || found.category, found.defaultCapacity);
    }
  }

  return getStandardCapacitiesForType(equipmentType, category);
}
