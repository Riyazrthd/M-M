// Indus Fire Safety Private Limited - Modular Storage Layer
// Prepares clean interface for future IndexedDB, Supabase / PostgreSQL sync, and offline queueing

import { DEMO_USERS, DEMO_SITES, DEMO_POSITIONS, DEMO_ACTIVE_VISIT } from './sampleData.js';
import { INITIAL_TEMPLATE_MAPPINGS, INITIAL_EQUIPMENT_MASTER, resolveChecklistMapping } from './templateMappings.js';

const STORAGE_KEYS = {
  CURRENT_USER: 'ifspl_amc_user',
  SITES: 'ifspl_amc_sites',
  POSITIONS: 'ifspl_amc_positions',
  VISITS: 'ifspl_amc_visits',
  ACTIVE_VISIT_ID: 'ifspl_amc_active_visit_id',
  SYNC_QUEUE: 'ifspl_amc_sync_queue',
  TEMPLATE_MAPPINGS: 'ifspl_amc_template_mappings',
  EQUIPMENT_MASTER: 'ifspl_amc_equipment_master',
  PLANT_TECHNICIANS: 'ifspl_amc_plant_technicians'
};

// Initialize default storage if empty
export function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SITES)) {
    localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(DEMO_SITES));
  } else {
    // Sync client fields if missing from previous session
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.SITES));
      let modified = false;
      const updated = existing.map(site => {
        const demo = DEMO_SITES.find(d => d.id === site.id);
        if (demo && (!site.clientName || !site.email || !site.contactPhone || !site.poDate || !site.amcType || !site.noOfVisits || !site.amcExpiryDate)) {
          modified = true;
          return {
            ...site,
            clientName: site.clientName || demo.clientName,
            name: site.name || demo.name,
            contactPhone: site.contactPhone || demo.contactPhone,
            email: site.email || demo.email,
            taxId: site.taxId || demo.taxId,
            poNumber: site.poNumber || demo.poNumber,
            poDate: site.poDate || demo.poDate,
            amcType: site.amcType || demo.amcType || site.frequency || demo.frequency,
            frequency: site.frequency || demo.frequency || site.amcType || demo.amcType,
            noOfVisits: site.noOfVisits !== undefined ? site.noOfVisits : demo.noOfVisits,
            amcExpiryDate: site.amcExpiryDate || demo.amcExpiryDate
          };
        }
        return site;
      });
      if (modified) {
        localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(updated));
      }
    } catch (e) {}
  }
  if (!localStorage.getItem(STORAGE_KEYS.POSITIONS)) {
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(DEMO_POSITIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VISITS)) {
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify([DEMO_ACTIVE_VISIT]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE)) {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEMPLATE_MAPPINGS)) {
    localStorage.setItem(STORAGE_KEYS.TEMPLATE_MAPPINGS, JSON.stringify(INITIAL_TEMPLATE_MAPPINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EQUIPMENT_MASTER)) {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT_MASTER, JSON.stringify(INITIAL_EQUIPMENT_MASTER));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PLANT_TECHNICIANS)) {
    localStorage.setItem(STORAGE_KEYS.PLANT_TECHNICIANS, JSON.stringify(DEFAULT_PLANT_TECHNICIANS));
  }
}

// Plant On-Site Technicians Roster (2-3 technicians per plant)
export const DEFAULT_PLANT_TECHNICIANS = [
  {
    id: "tech-01",
    name: "Ramesh Patel",
    badge: "IFS-SE-041",
    roleTitle: "Lead Service Engineer"
  },
  {
    id: "tech-02",
    name: "Amit Trivedi",
    badge: "IFS-SE-042",
    roleTitle: "Field Service Engineer"
  },
  {
    id: "tech-03",
    name: "Jignesh Solanki",
    badge: "IFS-TECH-019",
    roleTitle: "Fire Safety Technician"
  }
];

export function getPlantTechnicians() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLANT_TECHNICIANS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return DEFAULT_PLANT_TECHNICIANS;
  } catch (e) {
    return DEFAULT_PLANT_TECHNICIANS;
  }
}

export function addPlantTechnician({ name, badge, roleTitle }) {
  if (!name || !name.trim()) return null;
  const list = getPlantTechnicians();
  const existing = list.find(t => t.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) return existing;

  const newTech = {
    id: `tech-${Date.now()}`,
    name: name.trim(),
    badge: badge && badge.trim() ? badge.trim() : `IFS-TECH-${Math.floor(100 + Math.random() * 900)}`,
    roleTitle: roleTitle && roleTitle.trim() ? roleTitle.trim() : "Service Engineer"
  };

  const updated = [...list, newTech];
  localStorage.setItem(STORAGE_KEYS.PLANT_TECHNICIANS, JSON.stringify(updated));
  return newTech;
}

// User Authentication state
export function getCurrentUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : DEMO_USERS[0];
  } catch (e) {
    return DEMO_USERS[0];
  }
}

export function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('ifspl:user_changed', { detail: user }));
}

// Sites
export function getSites() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SITES);
    const sites = data ? JSON.parse(data) : DEMO_SITES;
    const allPositions = getPositions();

    // Dynamically calculate coverage from actual equipment position records
    return sites.map((site) => {
      const sitePositions = allPositions.filter(p => p.siteId === site.id);
      if (sitePositions.length > 0) {
        const total = sitePositions.length;
        const inspected = sitePositions.filter(p => p.inspectionStatus && p.inspectionStatus.startsWith('Inspected')).length;
        const status = (inspected >= total && total > 0) 
          ? 'Completed' 
          : (inspected > 0 ? 'In Progress' : 'Scheduled');

        return {
          ...site,
          totalPositions: total,
          inspectedPositions: inspected,
          status
        };
      }
      return site;
    });
  } catch (e) {
    return DEMO_SITES;
  }
}

export function getSiteById(siteId) {
  const sites = getSites();
  return sites.find(s => s.id === siteId) || null;
}

export function addSite(siteData) {
  const data = localStorage.getItem(STORAGE_KEYS.SITES);
  const sites = data ? JSON.parse(data) : DEMO_SITES;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  nextYear.setDate(nextYear.getDate() - 1);
  const nextYearStr = nextYear.toISOString().slice(0, 10);

  const amcType = siteData.amcType || siteData.frequency || 'Quarterly';
  let defaultVisits = 4;
  if (amcType === 'Monthly') defaultVisits = 12;
  else if (amcType === 'Bi-Monthly') defaultVisits = 6;
  else if (amcType === 'Quarterly') defaultVisits = 4;
  else if (amcType === 'Half-Yearly') defaultVisits = 2;
  else if (amcType === 'Annually') defaultVisits = 1;

  const newSite = {
    id: siteData.id || `SITE-CUS-${Date.now().toString().slice(-4)}`,
    clientName: siteData.clientName || siteData.name || 'New Client Co.',
    name: siteData.clientName || siteData.name || 'New Client Co.',
    company: siteData.company || siteData.clientName || 'New Client Co.',
    plantFacility: siteData.plantFacility || siteData.name || 'Plant Facility 1',
    code: siteData.code || `CUS-${Math.floor(10 + Math.random() * 90)}`,
    address: siteData.address || 'Industrial Estate, Gujarat',
    city: siteData.city || 'Vadodara',
    poNumber: siteData.poNumber || `PO/IFSPL/${today.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    poDate: siteData.poDate || todayStr,
    amcType: amcType,
    frequency: amcType,
    noOfVisits: siteData.noOfVisits !== undefined ? Number(siteData.noOfVisits) : defaultVisits,
    amcExpiryDate: siteData.amcExpiryDate || nextYearStr,
    contractPeriod: siteData.contractPeriod || `${siteData.poDate || todayStr} to ${siteData.amcExpiryDate || nextYearStr}`,
    clientContact: siteData.clientContact || 'Primary Contact',
    contactPhone: siteData.contactPhone || '+91 98000 00000',
    email: siteData.email || 'contact@client.demo',
    taxId: siteData.taxId || '',
    totalPositions: 0,
    inspectedPositions: 0,
    status: 'Scheduled',
    applicableChecklists: ['CL-11', 'CL-03']
  };
  sites.push(newSite);
  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
  return newSite;
}

export function updateSite(siteId, updatedData) {
  const data = localStorage.getItem(STORAGE_KEYS.SITES);
  const sites = data ? JSON.parse(data) : DEMO_SITES;
  const index = sites.findIndex(s => s.id === siteId);
  if (index === -1) return null;

  const amcType = updatedData.amcType || updatedData.frequency || sites[index].amcType || sites[index].frequency || 'Quarterly';

  sites[index] = {
    ...sites[index],
    ...updatedData,
    clientName: updatedData.clientName || updatedData.name || sites[index].clientName,
    name: updatedData.clientName || updatedData.name || sites[index].name,
    company: updatedData.clientName || updatedData.company || sites[index].company,
    poNumber: updatedData.poNumber !== undefined ? updatedData.poNumber : sites[index].poNumber,
    poDate: updatedData.poDate !== undefined ? updatedData.poDate : sites[index].poDate,
    amcType: amcType,
    frequency: amcType,
    noOfVisits: updatedData.noOfVisits !== undefined ? Number(updatedData.noOfVisits) : sites[index].noOfVisits,
    amcExpiryDate: updatedData.amcExpiryDate !== undefined ? updatedData.amcExpiryDate : sites[index].amcExpiryDate
  };
  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
  return sites[index];
}

export function deleteSite(siteId) {
  const data = localStorage.getItem(STORAGE_KEYS.SITES);
  const sites = data ? JSON.parse(data) : DEMO_SITES;
  const filtered = sites.filter(s => s.id !== siteId);
  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(filtered));
  return true;
}

// Positions (QR Identified permanent equipment positions)
export function getPositions(siteId = null) {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.POSITIONS);
    const positions = data ? JSON.parse(data) : DEMO_POSITIONS;
    if (siteId) {
      return positions.filter(p => p.siteId === siteId);
    }
    return positions;
  } catch (e) {
    return siteId ? DEMO_POSITIONS.filter(p => p.siteId === siteId) : DEMO_POSITIONS;
  }
}

export function getPositionById(positionId) {
  const positions = getPositions();
  return positions.find(p => p.positionId === positionId || p.qrCode === positionId) || null;
}

export function getPositionByQR(qrCode) {
  if (!qrCode || typeof qrCode !== 'string') return null;
  const positions = getPositions();
  
  let cleanCode = qrCode.trim();
  // Extract token if a full URL or query string was scanned
  try {
    if (cleanCode.includes('?') || cleanCode.includes('&')) {
      const queryPart = cleanCode.split('?')[1] || cleanCode;
      const params = new URLSearchParams(queryPart);
      cleanCode = params.get('scan') || params.get('pos') || params.get('id') || params.get('qr') || cleanCode;
    }
    if (cleanCode.includes('#')) {
      cleanCode = cleanCode.split('#')[1] || cleanCode;
    }
    if (cleanCode.includes('/') && (cleanCode.startsWith('http://') || cleanCode.startsWith('https://'))) {
      const parts = cleanCode.split('/').filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (lastPart && !lastPart.includes('.')) {
        cleanCode = lastPart;
      }
    }
  } catch (e) {}

  const cleanUpper = cleanCode.trim().toUpperCase();

  return positions.find(p => {
    const pQr = (p.qrCode || '').toUpperCase();
    const pPosId = (p.positionId || '').toUpperCase();
    const pId = (p.id || '').toUpperCase();
    const pSerial = (p.currentEquipment?.serialNo || p.currentEquipment?.serialNumber || '').toUpperCase();
    const pUnitId = (p.currentEquipment?.id || '').toUpperCase();

    return pQr === cleanUpper || 
           pPosId === cleanUpper || 
           pId === cleanUpper || 
           pSerial === cleanUpper ||
           pUnitId === cleanUpper ||
           (cleanUpper.length > 6 && pQr.includes(cleanUpper)) ||
           (cleanUpper.length > 6 && cleanUpper.includes(pQr));
  }) || null;
}

// Equipment replacement at a permanent position
// Enforces Requirement 9: QR code of position remains unchanged; cylinder histories tracked separately!
export function replaceEquipmentAtPosition(positionId, replacementData) {
  const positions = getPositions();
  const index = positions.findIndex(p => p.positionId === positionId);
  if (index === -1) return { success: false, error: 'Position not found' };

  const currentPos = positions[index];
  const oldEquipment = currentPos.currentEquipment;

  const newHistoryEntry = {
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    event: "Cylinder Replacement / Swap",
    reason: replacementData.reason || "Removed for Hydro Pressure Testing (35 Bar)",
    removedCylinder: {
      id: oldEquipment.id || oldEquipment.serialNo,
      serialNo: oldEquipment.serialNo,
      type: oldEquipment.type,
      status: replacementData.removedDestination || "Dispatched to IFS Hydro Testing Facility Vadodara",
      dispatchNote: replacementData.dispatchNote || "Batch reference for IS 2190 recertification"
    },
    replacementCylinder: {
      id: replacementData.newSerialNo,
      serialNo: replacementData.newSerialNo,
      type: replacementData.newType || oldEquipment.type,
      capacity: replacementData.newCapacity || oldEquipment.capacity,
      make: replacementData.newMake || "Indus SafeGuard (IS 15683)",
      testPressureBar: replacementData.newPressure || 35,
      status: `Mounted at permanent position ${currentPos.positionId}`
    },
    technician: replacementData.technicianName || "Service Engineer",
    notes: replacementData.notes || `Permanent QR code ${currentPos.qrCode} retained unchanged.`
  };

  const updatedEquipment = {
    ...oldEquipment,
    id: replacementData.newSerialNo,
    serialNo: replacementData.newSerialNo,
    type: replacementData.newType || oldEquipment.type,
    capacity: replacementData.newCapacity || oldEquipment.capacity,
    lastHydroTestDate: replacementData.newHydroDate || new Date().toISOString().substring(0, 10),
    nextHydroTestDue: replacementData.newNextDue || "2029-10-26",
    operationalStatus: "Active in Position (Recently Replaced)"
  };

  const updatedPosition = {
    ...currentPos,
    currentEquipmentId: replacementData.newSerialNo,
    currentEquipment: updatedEquipment,
    history: [newHistoryEntry, ...(currentPos.history || [])]
  };

  positions[index] = updatedPosition;
  localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));

  // Queue audit log
  queueSyncAction({
    type: 'EQUIPMENT_REPLACED',
    positionId: currentPos.positionId,
    qrCode: currentPos.qrCode,
    removedEquipment: oldEquipment,
    replacementEquipment: updatedEquipment,
    timestamp: new Date().toISOString()
  });

  return { success: true, position: updatedPosition };
}

// Visits & Checklists
export function getVisits() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VISITS);
    return data ? JSON.parse(data) : [DEMO_ACTIVE_VISIT];
  } catch (e) {
    return [DEMO_ACTIVE_VISIT];
  }
}

export function getVisitById(visitId) {
  const visits = getVisits();
  return visits.find(v => v.visitId === visitId) || null;
}

export function getActiveVisit(siteId = "SITE-AIL-001") {
  const visits = getVisits();
  let visit = visits.find(v => v.siteId === siteId && v.status === "In Progress");
  if (!visit) {
    visit = {
      visitId: `VISIT-${new Date().getFullYear()}-${siteId.replace('SITE-', '')}-01`,
      siteId: siteId,
      date: new Date().toISOString().substring(0, 10),
      serviceEngineer: getCurrentUser().name,
      technicianName: getCurrentUser().name,
      technicianBadge: getCurrentUser().badge || 'IFS-SE-041',
      supervisor: "Sanjay Sharma",
      clientRepresentative: "Vikram Shah",
      status: "In Progress",
      checklistAnswers: {},
      visitRemarks: "",
      sparesReplaced: "",
      pendingPoints: "",
      technicianSignature: null,
      clientSignature: null,
      completedAt: null
    };
    visits.unshift(visit);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  }
  return visit;
}

export function saveChecklistResult(visitId, positionId, checklistData) {
  const visits = getVisits();
  const vIndex = visits.findIndex(v => v.visitId === visitId);
  if (vIndex === -1) return { success: false, error: 'Visit not found' };

  if (!visits[vIndex].checklistAnswers) {
    visits[vIndex].checklistAnswers = {};
  }

  const now = new Date();
  const isoTimestamp = checklistData.inspectedAt || checklistData.completedAt || now.toISOString();
  const inspectionDate = checklistData.inspectionDate || isoTimestamp.substring(0, 10);
  const inspectionTime = checklistData.inspectionTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedTimestamp = checklistData.timestamp || `${inspectionDate} ${inspectionTime}`;
  const currentUser = getCurrentUser();
  const technicianName = checklistData.technicianName || visits[vIndex].serviceEngineer || currentUser.name || 'Ramesh Patel';
  const technicianBadge = checklistData.technicianBadge || currentUser.badge || 'IFS-SE-041';
  const technicianRole = checklistData.technicianRole || currentUser.roleTitle || 'Lead Service Engineer';

  visits[vIndex].checklistAnswers[positionId] = {
    ...checklistData,
    savedAt: isoTimestamp,
    inspectedAt: isoTimestamp,
    inspectionDate,
    inspectionTime,
    timestamp: formattedTimestamp,
    technicianName,
    technicianBadge,
    technicianRole
  };

  // Also update position's inspection status
  const positions = getPositions();
  const pIndex = positions.findIndex(p => p.positionId === positionId);
  if (pIndex !== -1) {
    // Check if any item is NOT_OK
    const hasFail = Object.values(checklistData.items || {}).some(item => item.status === 'NOT_OK');
    positions[pIndex].inspectionStatus = hasFail ? 'Inspected - Attention' : 'Inspected - OK';
    positions[pIndex].lastInspectionDate = inspectionDate;
    
    if (!positions[pIndex].inspectionHistory) {
      positions[pIndex].inspectionHistory = [];
    }
    positions[pIndex].inspectionHistory.unshift({
      visitId,
      timestamp: formattedTimestamp,
      inspectedAt: isoTimestamp,
      inspectionDate,
      inspectionTime,
      technicianName,
      technicianBadge,
      technicianRole,
      templateId: checklistData.templateId,
      status: hasFail ? 'Inspected - Attention' : 'Inspected - OK',
      counts: checklistData.counts,
      remarks: checklistData.remarks,
      unitSerialNo: positions[pIndex].currentEquipment?.serialNo
    });

    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
  }

  // Update site inspected positions count
  updateSiteProgress(visits[vIndex].siteId);

  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

  queueSyncAction({
    type: 'CHECKLIST_RECORDED',
    visitId,
    positionId,
    technicianName,
    inspectedAt: isoTimestamp,
    timestamp: isoTimestamp
  });

  return { success: true, visit: visits[vIndex] };
}

export function updateSiteProgress(siteId) {
  const sites = getSites();
  const sIndex = sites.findIndex(s => s.id === siteId);
  if (sIndex === -1) return;

  const positions = getPositions(siteId);
  const total = positions.length;
  const inspected = positions.filter(p => p.inspectionStatus && p.inspectionStatus.startsWith('Inspected')).length;

  sites[sIndex].totalPositions = total;
  sites[sIndex].inspectedPositions = inspected;
  sites[sIndex].status = (inspected >= total && total > 0) ? 'Completed' : (inspected > 0 ? 'In Progress' : 'Scheduled');

  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
}

export function saveVisitRemarks(visitId, { visitRemarks, sparesReplaced, pendingPoints }) {
  const visits = getVisits();
  const vIndex = visits.findIndex(v => v.visitId === visitId);
  if (vIndex === -1) return { success: false, error: 'Visit not found' };

  visits[vIndex] = {
    ...visits[vIndex],
    visitRemarks: visitRemarks ?? visits[vIndex].visitRemarks,
    sparesReplaced: sparesReplaced ?? visits[vIndex].sparesReplaced,
    pendingPoints: pendingPoints ?? visits[vIndex].pendingPoints
  };

  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

  queueSyncAction({
    type: 'VISIT_REMARKS_SAVED',
    visitId,
    timestamp: new Date().toISOString()
  });

  return { success: true, visit: visits[vIndex] };
}

export function saveVisitSignatures(visitId, {
  technicianSignature,
  clientSignature,
  clientRepName,
  technicianName,
  technicianBadge,
  visitRemarks,
  sparesReplaced,
  pendingPoints
}) {
  const visits = getVisits();
  const vIndex = visits.findIndex(v => v.visitId === visitId);
  if (vIndex === -1) return { success: false, error: 'Visit not found' };

  const now = new Date();
  const isoTimestamp = now.toISOString();
  const dateStr = isoTimestamp.substring(0, 10);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const currentUser = getCurrentUser();
  const resolvedTechName = technicianName || visits[vIndex].technicianName || visits[vIndex].serviceEngineer || currentUser.name || 'Ramesh Patel';
  const resolvedTechBadge = technicianBadge || visits[vIndex].technicianBadge || currentUser.badge || 'IFS-SE-041';
  const isFullySigned = Boolean(technicianSignature && clientSignature);

  visits[vIndex] = {
    ...visits[vIndex],
    technicianName: resolvedTechName,
    serviceEngineer: resolvedTechName,
    technicianBadge: resolvedTechBadge,
    technicianSignature: technicianSignature || visits[vIndex].technicianSignature,
    clientSignature: clientSignature || visits[vIndex].clientSignature,
    clientRepresentative: clientRepName || visits[vIndex].clientRepresentative,
    visitRemarks: visitRemarks ?? visits[vIndex].visitRemarks,
    sparesReplaced: sparesReplaced ?? visits[vIndex].sparesReplaced,
    pendingPoints: pendingPoints ?? visits[vIndex].pendingPoints,
    status: isFullySigned ? 'Signed & Completed' : visits[vIndex].status,
    completedAt: isFullySigned ? (visits[vIndex].completedAt || isoTimestamp) : null,
    signedAt: isFullySigned ? (visits[vIndex].signedAt || isoTimestamp) : null,
    signedDate: isFullySigned ? (visits[vIndex].signedDate || dateStr) : null,
    signedTime: isFullySigned ? (visits[vIndex].signedTime || timeStr) : null
  };

  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

  queueSyncAction({
    type: 'VISIT_SIGNED',
    visitId,
    technicianName: resolvedTechName,
    signedAt: isoTimestamp,
    timestamp: isoTimestamp
  });

  return { success: true, visit: visits[vIndex] };
}

// Template Mappings (Configurable by Admin)
export function getTemplateMappings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATE_MAPPINGS);
    return data ? JSON.parse(data) : INITIAL_TEMPLATE_MAPPINGS;
  } catch (e) {
    return INITIAL_TEMPLATE_MAPPINGS;
  }
}

export function saveTemplateMapping(mapping) {
  const mappings = getTemplateMappings();
  const index = mappings.findIndex(m => m.id === mapping.id);
  if (index !== -1) {
    mappings[index] = { ...mappings[index], ...mapping, updatedAt: new Date().toISOString() };
  } else {
    mappings.push({
      ...mapping,
      id: mapping.id || `MAP-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString()
    });
  }
  localStorage.setItem(STORAGE_KEYS.TEMPLATE_MAPPINGS, JSON.stringify(mappings));
  queueSyncAction({ type: 'TEMPLATE_MAPPING_UPDATED', mappingId: mapping.id, timestamp: new Date().toISOString() });
  return { success: true, mappings };
}

// -----------------------------------------------------------------------------
// Equipment & Linked Target Service Master Data Layer
// -----------------------------------------------------------------------------
export function getEquipmentMaster() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EQUIPMENT_MASTER);
    return data ? JSON.parse(data) : INITIAL_EQUIPMENT_MASTER;
  } catch (e) {
    return INITIAL_EQUIPMENT_MASTER;
  }
}

export function saveEquipmentMaster(items) {
  localStorage.setItem(STORAGE_KEYS.EQUIPMENT_MASTER, JSON.stringify(items));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ifspl:equipment_master_changed', { detail: items }));
  }
  queueSyncAction({ type: 'EQUIPMENT_MASTER_UPDATED', timestamp: new Date().toISOString() });
  return items;
}

export function addEquipmentMasterItem(item) {
  const master = getEquipmentMaster();
  const newItem = {
    id: item.id || `EQ-CUS-${Date.now().toString(36).toUpperCase()}`,
    category: item.category || 'Fire Extinguisher',
    equipmentType: (item.equipmentType || '').trim(),
    defaultCapacity: item.defaultCapacity || '',
    capacities: Array.isArray(item.capacities) && item.capacities.length > 0 
      ? item.capacities 
      : (item.defaultCapacity ? [item.defaultCapacity] : []),
    linkedServices: Array.isArray(item.linkedServices) ? item.linkedServices : [
      {
        id: `SRV-${Date.now()}`,
        serviceType: item.initialServiceType || 'Routine Servicing / Inspection',
        checklistTemplateId: item.initialTemplateId || 'CL-26',
        isDefault: true
      }
    ]
  };
  master.push(newItem);
  saveEquipmentMaster(master);
  return newItem;
}

export function updateEquipmentMasterItem(id, updatedData) {
  const master = getEquipmentMaster();
  const idx = master.findIndex(e => e.id === id);
  if (idx === -1) return null;
  master[idx] = {
    ...master[idx],
    ...updatedData,
    id: master[idx].id
  };
  saveEquipmentMaster(master);
  return master[idx];
}

export function deleteEquipmentMasterItem(id) {
  const master = getEquipmentMaster();
  const filtered = master.filter(e => e.id !== id);
  saveEquipmentMaster(filtered);
  return true;
}

export function addLinkedServiceToEquipment(equipmentId, serviceObj) {
  const master = getEquipmentMaster();
  const eq = master.find(e => e.id === equipmentId);
  if (!eq) return null;
  if (!Array.isArray(eq.linkedServices)) eq.linkedServices = [];

  // If this new service is set to default, reset other services
  if (serviceObj.isDefault) {
    eq.linkedServices.forEach(s => { s.isDefault = false; });
  }

  const newService = {
    id: serviceObj.id || `SRV-${Date.now().toString(36).toUpperCase()}`,
    serviceType: serviceObj.serviceType.trim(),
    checklistTemplateId: serviceObj.checklistTemplateId || null,
    isDefault: eq.linkedServices.length === 0 ? true : Boolean(serviceObj.isDefault)
  };

  eq.linkedServices.push(newService);
  saveEquipmentMaster(master);
  return newService;
}

export function removeLinkedServiceFromEquipment(equipmentId, serviceId) {
  const master = getEquipmentMaster();
  const eq = master.find(e => e.id === equipmentId);
  if (!eq || !Array.isArray(eq.linkedServices)) return false;
  eq.linkedServices = eq.linkedServices.filter(s => s.id !== serviceId && s.serviceType !== serviceId);
  if (eq.linkedServices.length > 0 && !eq.linkedServices.some(s => s.isDefault)) {
    eq.linkedServices[0].isDefault = true;
  }
  saveEquipmentMaster(master);
  return true;
}

// Step 1 - Step 3: Register New Asset with Auto-assigned Checklist and QR Generation
export function registerNewAsset(assetData) {
  const positions = getPositions();
  const sites = getSites();
  const cleanSerial = (assetData.serialNumber || '').trim().toUpperCase();

  // 1. Duplicate Serial Number Validation at the same Client / Site
  if (cleanSerial) {
    const existingUnit = positions.find(p => 
      p.siteId === assetData.siteId && 
      p.currentEquipment && 
      (p.currentEquipment.serialNo?.toUpperCase() === cleanSerial || p.currentEquipment.serialNumber?.toUpperCase() === cleanSerial)
    );
    if (existingUnit) {
      return {
        success: false,
        error: `Duplicate Registration Error: Unit with Serial Number "${cleanSerial}" is already registered at this site in position ${existingUnit.positionId}.`
      };
    }
  }

  // 2. Automatic Checklist Template Resolution
  const mappings = getTemplateMappings();
  const mappingResult = resolveChecklistMapping(
    assetData.equipmentCategory,
    assetData.serviceType,
    assetData.equipmentType,
    mappings
  );

  if (!mappingResult.success || !mappingResult.checklistTemplateId) {
    return {
      success: false,
      error: `Checklist Resolution Warning: ${mappingResult.warning || 'No applicable checklist template configured for this equipment and service type.'}`
    };
  }

  const assignedTemplateId = mappingResult.checklistTemplateId;

  // 3. Generate unique permanent Asset Position Code & QR Code
  // Format: IFS-POS-000101 (or site-prefixed sequential code)
  const currentCount = positions.length;
  const seqNumber = String(100 + currentCount + 1).padStart(6, '0');
  const permanentPositionCode = `IFS-POS-${seqNumber}`;
  
  // Stable, opaque QR identifier
  const qrToken = `IFS-QR-${permanentPositionCode}`;

  const targetSite = sites.find(s => s.id === assetData.siteId) || { name: 'Industrial Facility', clientContact: 'Site Safety Head' };

  // 4. Construct EquipmentUnit record
  const equipmentUnit = {
    id: cleanSerial || `UNIT-${seqNumber}`,
    assetPositionId: permanentPositionCode,
    serialNo: cleanSerial,
    serialNumber: cleanSerial,
    make: assetData.manufacturer || assetData.make || 'Indus SafeGuard',
    manufacturer: assetData.manufacturer || assetData.make || 'Indus SafeGuard',
    model: assetData.model || 'Standard ISI',
    capacity: assetData.capacity || '6 Kg',
    type: assetData.equipmentType || assetData.equipmentCategory,
    manufacturingDate: assetData.manufacturingDate || '2024-01',
    mfgDate: assetData.manufacturingDate || '2024-01',
    installationDate: assetData.installationDate || new Date().toISOString().substring(0, 10),
    lastServiceDate: assetData.lastServiceDate || new Date().toISOString().substring(0, 10),
    lastRefillDate: assetData.lastRefillDate || null,
    lastHptDate: assetData.lastHptDate || null,
    lastHydroTestDate: assetData.lastHptDate || null,
    nextServiceDueDate: assetData.nextServiceDueDate || '2027-10-26',
    nextRefillDueDate: assetData.nextRefillDueDate || '2027-10-26',
    nextHptDueDate: assetData.nextHptDueDate || '2029-10-26',
    nextHydroTestDue: assetData.nextHptDueDate || '2029-10-26',
    testPressureBar: assetData.equipmentCategory === 'Fire Extinguisher' ? (assetData.testPressureBar || 35) : null,
    operationalStatus: assetData.initialCondition || 'Active in Position',
    technicianRemarks: assetData.technicianRemarks || '',
    photo: assetData.photo || null,
    removedAt: null,
    removalReason: null
  };

  // 5. Construct AssetPosition record
  const newPosition = {
    id: `pos-${Date.now()}`,
    positionId: permanentPositionCode,
    permanentPositionCode: permanentPositionCode,
    qrCode: qrToken,
    qrToken: qrToken,
    siteId: assetData.siteId,
    siteName: targetSite.name,
    clientName: assetData.clientName || targetSite.clientName || targetSite.company || targetSite.name || 'Client Organisation',
    area: assetData.area || 'Ground Floor Area',
    location: assetData.location || 'Near Main Entrance',
    poNumber: assetData.poNumber || targetSite.poNumber || 'N/A',
    poDate: assetData.poDate || targetSite.poDate || null,
    amcType: assetData.amcType || targetSite.amcType || targetSite.frequency || 'Quarterly',
    noOfVisits: assetData.noOfVisits !== undefined ? assetData.noOfVisits : (targetSite.noOfVisits !== undefined ? targetSite.noOfVisits : 4),
    amcExpiryDate: assetData.amcExpiryDate || targetSite.amcExpiryDate || null,
    siteAddress: assetData.siteAddress || targetSite.address || '',
    city: assetData.city || targetSite.city || '',
    taxId: assetData.taxId || targetSite.taxId || '',
    contactPhone: assetData.contactPhone || targetSite.contactPhone || '',
    email: assetData.email || targetSite.email || '',
    equipmentCategory: assetData.equipmentCategory,
    equipmentType: assetData.equipmentType,
    serviceType: assetData.serviceType,
    currentEquipmentId: equipmentUnit.serialNo,
    activeUnitId: equipmentUnit.serialNo,
    currentEquipment: equipmentUnit,
    applicableChecklistMapping: {
      templateId: assignedTemplateId,
      serviceType: assetData.serviceType,
      mappingId: mappingResult.mapping?.id || 'DEFAULT'
    },
    templateId: assignedTemplateId,
    inspectionStatus: 'Pending Initial Inspection',
    lastInspectionDate: null,
    history: [],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  positions.unshift(newPosition);
  localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));

  // Update site positions count and coverage
  updateSiteProgress(assetData.siteId);

  // Queue sync
  queueSyncAction({
    type: 'ASSET_REGISTERED',
    positionId: permanentPositionCode,
    qrCode: qrToken,
    checklistTemplateId: assignedTemplateId,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    position: newPosition,
    qrCode: qrToken,
    templateId: assignedTemplateId,
    mappingInfo: mappingResult
  };
}

// Edit asset details without EVER changing the permanent QR code or Position ID!
export function updateAssetDetails(positionId, updatedData) {
  const positions = getPositions();
  const index = positions.findIndex(p => p.positionId === positionId);
  if (index === -1) return { success: false, error: 'Position not found' };

  const current = positions[index];

  // Preserve permanent IDs
  const preservedQR = current.qrCode;
  const preservedPositionId = current.positionId;

  const updatedPosition = {
    ...current,
    area: updatedData.area !== undefined ? updatedData.area : current.area,
    location: updatedData.location !== undefined ? updatedData.location : current.location,
    poNumber: updatedData.poNumber !== undefined ? updatedData.poNumber : current.poNumber,
    notes: updatedData.notes !== undefined ? updatedData.notes : current.notes,
    currentEquipment: {
      ...current.currentEquipment,
      ...(updatedData.equipmentDetails || {})
    },
    qrCode: preservedQR, // Immutable
    qrToken: preservedQR, // Immutable
    positionId: preservedPositionId, // Immutable
    permanentPositionCode: preservedPositionId, // Immutable
    updatedAt: new Date().toISOString()
  };

  positions[index] = updatedPosition;
  localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));

  queueSyncAction({
    type: 'ASSET_UPDATED',
    positionId: preservedPositionId,
    timestamp: new Date().toISOString()
  });

  return { success: true, position: updatedPosition };
}

// Global Asset Search helper
export function searchAssets(query = '') {
  const positions = getPositions();
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return positions;

  return positions.filter(p => 
    p.positionId.toLowerCase().includes(cleanQ) ||
    p.qrCode.toLowerCase().includes(cleanQ) ||
    p.area.toLowerCase().includes(cleanQ) ||
    p.location.toLowerCase().includes(cleanQ) ||
    p.equipmentType.toLowerCase().includes(cleanQ) ||
    (p.currentEquipment?.serialNo && p.currentEquipment.serialNo.toLowerCase().includes(cleanQ))
  );
}
export function queueSyncAction(action) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action,
      status: 'PENDING_REMOTE_SYNC_PHASE2',
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('ifspl:sync_queue_updated', { detail: { count: queue.length } }));
  } catch (e) {
    console.warn('Queue action error:', e);
  }
}

export function getSyncQueueCount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    const queue = raw ? JSON.parse(raw) : [];
    return queue.length;
  } catch (e) {
    return 0;
  }
}
