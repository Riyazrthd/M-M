// Indus Fire Safety Private Limited - Modular Storage Layer
// Prepares clean interface for future IndexedDB, Supabase / PostgreSQL sync, and offline queueing

import { DEMO_USERS, DEMO_SITES, DEMO_POSITIONS, DEMO_ACTIVE_VISIT } from './sampleData.js';
import { INITIAL_TEMPLATE_MAPPINGS, INITIAL_EQUIPMENT_MASTER, resolveChecklistMapping } from './templateMappings.js';
import { parseScannedQRToken } from '../utils/qrUrlHelper.js';
import {
  CONTRACT_TYPES,
  SERVICE_ACTIVITIES,
  SERVICE_ACTIVITY_LABELS,
  COVERAGE_STATUSES,
  COVERAGE_STATUS_STYLES,
  getDefaultServiceCoverage,
  validateServiceContractCoverage,
  evaluateInspectionFindingPokaYoke,
  getServiceApprovals,
  saveServiceApprovals,
  createServiceApprovalRequest,
  processServiceApproval
} from './contractCoverageEngine.js';

export {
  CONTRACT_TYPES,
  SERVICE_ACTIVITIES,
  SERVICE_ACTIVITY_LABELS,
  COVERAGE_STATUSES,
  COVERAGE_STATUS_STYLES,
  getDefaultServiceCoverage,
  validateServiceContractCoverage,
  evaluateInspectionFindingPokaYoke,
  getServiceApprovals,
  saveServiceApprovals,
  createServiceApprovalRequest,
  processServiceApproval
};

export const STORAGE_KEYS = {
  CURRENT_USER: 'ifspl_amc_user',
  SITES: 'ifspl_amc_sites',
  POSITIONS: 'ifspl_amc_positions',
  VISITS: 'ifspl_amc_visits',
  ACTIVE_VISIT_ID: 'ifspl_amc_active_visit_id',
  SYNC_QUEUE: 'ifspl_amc_sync_queue',
  TEMPLATE_MAPPINGS: 'ifspl_amc_template_mappings',
  EQUIPMENT_MASTER: 'ifspl_amc_equipment_master',
  PLANT_TECHNICIANS: 'ifspl_amc_plant_technicians',
  QR_REGISTRY: 'ifspl_amc_qr_registry',
  QR_SEQUENCE: 'ifspl_amc_qr_sequence',
  DELETED_SITE_IDS: 'ifspl_amc_deleted_sites',
  PUNCH_ITEMS: 'ifspl_amc_punch_items',
  SERVICE_APPROVALS: 'ifspl_amc_service_approvals'
};

/**
 * Tombstone helpers to prevent deleted clients from reappearing after cloud sync or page refresh.
 */
export function getDeletedSiteIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_SITE_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addDeletedSiteId(siteId) {
  if (!siteId) return;
  const list = getDeletedSiteIds();
  if (!list.includes(siteId)) {
    list.push(siteId);
    localStorage.setItem(STORAGE_KEYS.DELETED_SITE_IDS, JSON.stringify(list));
  }
}

export function removeDeletedSiteId(siteId) {
  if (!siteId) return;
  const list = getDeletedSiteIds().filter(id => id !== siteId);
  localStorage.setItem(STORAGE_KEYS.DELETED_SITE_IDS, JSON.stringify(list));
}

export function clearDeletedSiteIds() {
  localStorage.removeItem(STORAGE_KEYS.DELETED_SITE_IDS);
}

/**
 * Central notification dispatcher for all data mutations.
 * Dispatches targeted DOM events for reactive UI updates and triggers instant debounced cloud sync
 * so changes made on this device are automatically mirrored to other devices in real time.
 */
export function notifyDataChanged(changeType, entityId = null, payload = null) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('ifspl:data_changed', { 
        detail: { changeType, entityId, payload, timestamp: Date.now() } 
      }));

      // Domain-specific events for seamless in-memory re-renders
      if (changeType.includes('site')) {
        window.dispatchEvent(new CustomEvent('ifspl:sites_updated', { detail: { changeType, entityId } }));
      }
      if (changeType.includes('position') || changeType.includes('asset') || changeType.includes('equipment')) {
        window.dispatchEvent(new CustomEvent('ifspl:positions_updated', { detail: { changeType, entityId } }));
      }
      if (changeType.includes('visit') || changeType.includes('checklist') || changeType.includes('inspection')) {
        window.dispatchEvent(new CustomEvent('ifspl:visits_updated', { detail: { changeType, entityId } }));
      }
      if (changeType.includes('qr')) {
        window.dispatchEvent(new CustomEvent('ifspl:qr_registry_updated', { detail: { changeType, entityId } }));
      }

      // Request immediate debounced push to Supabase Cloud
      window.dispatchEvent(new CustomEvent('ifspl:request_cloud_sync', {
        detail: { reason: changeType, entityId }
      }));
    } catch (e) {
      console.warn('notifyDataChanged notice:', e);
    }
  }
}

/**
 * Clear all demo/sample client data for production launch
 * Strictly preserves all 26 Checklists, SOPs, Equipment Masters, Template Mappings, and Technicians
 */
export function clearAllClientData() {
  // Read all existing site IDs to tombstone them and prevent resurrection
  let existingSiteIds = [];
  try {
    const rawSites = localStorage.getItem(STORAGE_KEYS.SITES);
    if (rawSites) {
      existingSiteIds = JSON.parse(rawSites).map(s => s.id);
    }
  } catch (e) {}

  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify([]));
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_VISIT_ID);
  
  // Clean QR registry: unassign any linked positions so all labels are Available
  try {
    const rawQr = localStorage.getItem(STORAGE_KEYS.QR_REGISTRY);
    if (rawQr) {
      const qrList = JSON.parse(rawQr);
      const cleaned = qrList
        .filter(item => item.batchId !== 'BATCH-INITIAL-ASSIGNED')
        .map(item => {
          if (item.assignmentStatus === 'Assigned') {
            return {
              ...item,
              assignmentStatus: 'Available',
              linkedAssetId: null,
              linkedPositionId: null,
              linkedAssetName: null,
              assignedDate: null,
              assignedBy: null
            };
          }
          return item;
        });
      localStorage.setItem(STORAGE_KEYS.QR_REGISTRY, JSON.stringify(cleaned));
    }
  } catch (e) {}

  // Tombstone removed site IDs
  existingSiteIds.forEach(id => addDeletedSiteId(id));

  localStorage.setItem('ifspl_production_clean_v1', 'true');
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('storage'));
      window.dispatchEvent(new CustomEvent('ifspl:data_cleared'));
      window.dispatchEvent(new CustomEvent('ifspl:request_cloud_clear_all'));
    } catch (e) {}
  }
  notifyDataChanged('all_client_data_cleared');
}

/**
 * Seed demo client data for evaluation or testing
 */
export function seedDemoClientData() {
  clearDeletedSiteIds();
  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(DEMO_SITES));
  localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(DEMO_POSITIONS));
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify([DEMO_ACTIVE_VISIT]));
  localStorage.setItem('ifspl_production_clean_v1', 'demo');
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('storage'));
      window.dispatchEvent(new CustomEvent('ifspl:data_cleared'));
    } catch (e) {}
  }
  notifyDataChanged('demo_data_seeded');
}

// Initialize default storage
export function initStorage(forceDemo = false) {
  const isTestEnv = forceDemo || (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test');

  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
  }

  // Production migration check: if in browser and clean flag not yet set, clear all demo clients
  const isProductionClean = localStorage.getItem('ifspl_production_clean_v1');

  if (isTestEnv) {
    if (!localStorage.getItem(STORAGE_KEYS.SITES)) {
      localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(DEMO_SITES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.POSITIONS)) {
      localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(DEMO_POSITIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VISITS)) {
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify([DEMO_ACTIVE_VISIT]));
    }
  } else {
    // Production browser runtime:
    if (!isProductionClean) {
      // First load in production: clean demo client records
      clearAllClientData();
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.SITES)) {
        localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.POSITIONS)) {
        localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.VISITS)) {
        localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify([]));
      }
    }
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
  if (!localStorage.getItem(STORAGE_KEYS.QR_REGISTRY)) {
    // Populate permanent QR registry with initial seed data:
    // 1. Initial pre-printed Available labels batch (SR. NO. 001 to SR. NO. 050)
    // 2. Already assigned assets only if in test environment
    const initialRegistry = [];
    const positions = (isTestEnv && DEMO_POSITIONS) || [];

    // Seed initial batch of 50 available QR labels
    for (let s = 1; s <= 50; s++) {
      const padded = String(s).padStart(6, '0');
      initialRegistry.push({
        id: `QR-REC-${padded}`,
        token: `IFS-QR-${padded}`,
        displayNo: `SR. NO. ${String(s).padStart(3, '0')}`,
        seqNumber: s,
        batchId: 'BATCH-20261001-001',
        batchLabel: 'Batch BATCH-20261001-001 (50 Labels)',
        generatedDate: '01/10/2026',
        generatedTime: '09:00:00 AM',
        generatedAt: '2026-10-01T03:30:00.000Z',
        generatedBy: 'Ramesh Patel (Admin)',
        assignmentStatus: 'Available',
        linkedAssetId: null,
        linkedPositionId: null,
        linkedAssetName: null,
        assignedDate: null,
        assignedBy: null,
        lifecycleStatus: 'Active'
      });
    }

    if (isTestEnv && positions.length > 0) {
      positions.forEach((pos, idx) => {
        const seq = 100 + idx + 1;
        const padded = String(seq).padStart(6, '0');
        const token = pos.qrCode || `IFS-QR-${pos.positionId}`;
        initialRegistry.push({
          id: `QR-REC-${padded}`,
          token: token,
          displayNo: `SR. NO. ${String(seq).padStart(3, '0')}`,
          seqNumber: seq,
          batchId: 'BATCH-INITIAL-ASSIGNED',
          batchLabel: 'Initial Site Assets Batch',
          generatedDate: '01/10/2026',
          generatedTime: '09:00:00 AM',
          generatedAt: '2026-10-01T03:30:00.000Z',
          generatedBy: 'System Auto-Register',
          assignmentStatus: 'Assigned',
          linkedAssetId: pos.positionId,
          linkedPositionId: pos.positionId,
          linkedAssetName: pos.equipmentType || 'Fire Safety Equipment',
          assignedDate: '01/10/2026 09:30 AM',
          assignedBy: 'System Auto-Register',
          lifecycleStatus: 'Active'
        });
      });
    }

    localStorage.setItem(STORAGE_KEYS.QR_REGISTRY, JSON.stringify(initialRegistry));
    const highestSeq = Math.max(...initialRegistry.map(r => r.seqNumber || 0), 50);
    localStorage.setItem(STORAGE_KEYS.QR_SEQUENCE, String(highestSeq));
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
    if (!data) return [];
    const rawSites = JSON.parse(data);
    if (!Array.isArray(rawSites)) return [];
    const deletedIds = getDeletedSiteIds();
    const sites = deletedIds.length > 0 ? rawSites.filter(s => !deletedIds.includes(s.id)) : rawSites;
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
    return [];
  }
}

export function getSiteById(siteId) {
  const sites = getSites();
  return sites.find(s => s.id === siteId) || null;
}

export function addSite(siteData) {
  const data = localStorage.getItem(STORAGE_KEYS.SITES);
  const sites = data ? JSON.parse(data) : [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  nextYear.setDate(nextYear.getDate() - 1);
  const nextYearStr = nextYear.toISOString().slice(0, 10);

  const amcType = siteData.amcType || siteData.frequency || 'Quarterly';
  const contractType = siteData.contractType || (amcType.toUpperCase().includes('ARC') ? CONTRACT_TYPES.ARC : CONTRACT_TYPES.AMC);
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
    contractType: contractType,
    amcType: amcType,
    frequency: amcType,
    noOfVisits: siteData.noOfVisits !== undefined ? Number(siteData.noOfVisits) : defaultVisits,
    amcExpiryDate: siteData.amcExpiryDate || nextYearStr,
    contractPeriod: siteData.contractPeriod || `${siteData.poDate || todayStr} to ${siteData.amcExpiryDate || nextYearStr}`,
    serviceCoverage: siteData.serviceCoverage || getDefaultServiceCoverage(contractType, amcType),
    coveredAssetCategories: siteData.coveredAssetCategories || ['Fire Extinguisher', 'Hydrant System', 'Hose Box', 'Fire Alarm'],
    contractExclusions: siteData.contractExclusions || '',
    requiresClientApprovalForAdditionalWork: siteData.requiresClientApprovalForAdditionalWork !== undefined ? Boolean(siteData.requiresClientApprovalForAdditionalWork) : true,
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
  notifyDataChanged('site_added', newSite.id, newSite);
  return newSite;
}

export function updateSite(siteId, updatedData) {
  const data = localStorage.getItem(STORAGE_KEYS.SITES);
  const sites = data ? JSON.parse(data) : [];
  const index = sites.findIndex(s => s.id === siteId);
  if (index === -1) return null;

  const amcType = updatedData.amcType || updatedData.frequency || sites[index].amcType || sites[index].frequency || 'Quarterly';
  const contractType = updatedData.contractType || sites[index].contractType || (amcType.toUpperCase().includes('ARC') ? CONTRACT_TYPES.ARC : CONTRACT_TYPES.AMC);

  sites[index] = {
    ...sites[index],
    ...updatedData,
    clientName: updatedData.clientName || updatedData.name || sites[index].clientName,
    name: updatedData.clientName || updatedData.name || sites[index].name,
    company: updatedData.clientName || updatedData.company || sites[index].company,
    poNumber: updatedData.poNumber !== undefined ? updatedData.poNumber : sites[index].poNumber,
    poDate: updatedData.poDate !== undefined ? updatedData.poDate : sites[index].poDate,
    contractType: contractType,
    amcType: amcType,
    frequency: amcType,
    noOfVisits: updatedData.noOfVisits !== undefined ? Number(updatedData.noOfVisits) : sites[index].noOfVisits,
    amcExpiryDate: updatedData.amcExpiryDate !== undefined ? updatedData.amcExpiryDate : sites[index].amcExpiryDate,
    serviceCoverage: updatedData.serviceCoverage !== undefined ? updatedData.serviceCoverage : (sites[index].serviceCoverage || getDefaultServiceCoverage(contractType, amcType)),
    coveredAssetCategories: updatedData.coveredAssetCategories !== undefined ? updatedData.coveredAssetCategories : (sites[index].coveredAssetCategories || ['Fire Extinguisher', 'Hydrant System', 'Hose Box', 'Fire Alarm']),
    contractExclusions: updatedData.contractExclusions !== undefined ? updatedData.contractExclusions : (sites[index].contractExclusions || ''),
    requiresClientApprovalForAdditionalWork: updatedData.requiresClientApprovalForAdditionalWork !== undefined ? Boolean(updatedData.requiresClientApprovalForAdditionalWork) : (sites[index].requiresClientApprovalForAdditionalWork ?? true)
  };
  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
  notifyDataChanged('site_updated', siteId, sites[index]);
  return sites[index];
}

export function deleteSite(siteId) {
  if (!siteId) return false;

  // 1. Mark as tombstoned immediately so background pulls never restore it
  addDeletedSiteId(siteId);

  // 2. Remove from local sites
  const data = localStorage.getItem(STORAGE_KEYS.SITES);
  const sites = data ? JSON.parse(data) : [];
  const filtered = sites.filter(s => s.id !== siteId);
  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(filtered));

  // 3. Cascade delete associated equipment positions from localStorage
  try {
    const rawPos = localStorage.getItem(STORAGE_KEYS.POSITIONS);
    if (rawPos) {
      const positions = JSON.parse(rawPos);
      const remainingPos = positions.filter(p => p.siteId !== siteId);
      localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(remainingPos));
    }
  } catch (e) {
    console.warn('Cascade position delete notice:', e);
  }

  // 4. Cascade delete associated visits from localStorage
  try {
    const rawVisits = localStorage.getItem(STORAGE_KEYS.VISITS);
    if (rawVisits) {
      const visits = JSON.parse(rawVisits);
      const remainingVisits = visits.filter(v => v.siteId !== siteId);
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(remainingVisits));
    }
  } catch (e) {
    console.warn('Cascade visit delete notice:', e);
  }

  // 5. Reset active visit if it was for this site
  try {
    const activeVisitId = localStorage.getItem(STORAGE_KEYS.ACTIVE_VISIT_ID);
    if (activeVisitId && activeVisitId.includes(siteId)) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_VISIT_ID);
    }
  } catch (e) {}

  // 6. Clean QR Registry: unassign any QR codes linked to this site's positions
  try {
    const rawQr = localStorage.getItem(STORAGE_KEYS.QR_REGISTRY);
    if (rawQr) {
      const qrList = JSON.parse(rawQr);
      const cleaned = qrList.map(qr => {
        if (qr.linkedPositionId && (qr.linkedPositionId.includes(siteId) || qr.linkedPositionId.startsWith(`POS-${siteId}`))) {
          return {
            ...qr,
            assignmentStatus: 'Available',
            linkedAssetId: null,
            linkedPositionId: null,
            linkedAssetName: null,
            assignedDate: null,
            assignedBy: null
          };
        }
        return qr;
      });
      localStorage.setItem(STORAGE_KEYS.QR_REGISTRY, JSON.stringify(cleaned));
    }
  } catch (e) {}

  // 7. Notify in-app listeners
  notifyDataChanged('site_deleted', siteId);

  // 8. Request cloud deletion directly across the network
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('ifspl:request_cloud_delete_site', {
        detail: { siteId }
      }));
    } catch (e) {}
  }

  return true;
}

// Positions (QR Identified permanent equipment positions)
export function getPositions(siteId = null) {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.POSITIONS);
    if (!data) return [];
    const positions = JSON.parse(data);
    if (!Array.isArray(positions)) return [];
    const deletedIds = getDeletedSiteIds();
    const validPositions = deletedIds.length > 0 ? positions.filter(p => !deletedIds.includes(p.siteId)) : positions;
    if (siteId) {
      return validPositions.filter(p => p.siteId === siteId);
    }
    return validPositions;
  } catch (e) {
    return [];
  }
}

export function getPositionById(positionId) {
  const positions = getPositions();
  return positions.find(p => p.positionId === positionId || p.qrCode === positionId) || null;
}

export function savePositions(positions) {
  try {
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions || []));
    notifyDataChanged('positions_saved');
    return true;
  } catch (e) {
    console.error('savePositions error:', e);
    return false;
  }
}

export function saveSites(sites) {
  try {
    localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites || []));
    notifyDataChanged('sites_saved');
    return true;
  } catch (e) {
    console.error('saveSites error:', e);
    return false;
  }
}

export function saveVisits(visits) {
  try {
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits || []));
    notifyDataChanged('visits_saved');
    return true;
  } catch (e) {
    console.error('saveVisits error:', e);
    return false;
  }
}

// ============================================================================
// FIRE EXTINGUISHER INVENTORY & CLIENT BREAKDOWN QUERY HELPERS
// ============================================================================

/**
 * Validates whether an asset record is an actual registered fire extinguisher.
 * Strictly excludes:
 * - Unassigned QR records (not yet assigned to an asset)
 * - Delivery Hose Boxes (CL-03), Hydrants, Pumps, SCBA, Sprinklers, Alarms
 * - Retired or Scrapped units
 */
export function isFireExtinguisherAsset(pos) {
  if (!pos) return false;
  // Exclude deleted or retired positions
  if (pos.status === 'Retired' || pos.status === 'Deleted' || pos.operationalStatus === 'Retired' || pos.operationalStatus === 'Scrapped') {
    return false;
  }
  // Must have a valid position or asset identifier
  if (!pos.positionId && !pos.id) return false;

  const eqCategory = (pos.equipmentCategory || '').trim().toLowerCase();
  const eqType = (pos.equipmentType || '').trim().toLowerCase();
  const tmpl = (pos.templateId || '').trim().toUpperCase();
  const unitType = (pos.currentEquipment?.type || '').trim().toLowerCase();

  // Explicit non-extinguisher asset types to strictly exclude
  const excludedKeywords = [
    'hose', 'hydrant', 'pump', 'sprinkler', 'alarm', 'detector',
    'panel', 'damper', 'monitor', 'breathing', 'scba', 'door', 'blanket', 'signage'
  ];
  const hasExcludedKeyword = excludedKeywords.some(kw => 
    eqType.includes(kw) || eqCategory.includes(kw) || unitType.includes(kw)
  );
  if (hasExcludedKeyword) return false;

  // Extinguisher indicators
  if (eqCategory === 'fire extinguisher' || eqCategory === 'extinguisher') return true;
  if (eqType === 'fire extinguisher' || eqType.includes('extinguisher')) return true;
  if (tmpl === 'CL-11') return true;
  if (
    unitType.includes('extinguisher') ||
    unitType.includes('dcp') ||
    unitType.includes('co2') ||
    unitType.includes('afff') ||
    unitType.includes('stored pressure') ||
    unitType.includes('water co2') ||
    unitType.includes('clean agent')
  ) {
    return true;
  }

  return false;
}

/**
 * Returns all registered fire extinguisher positions across all clients (or filtered by site/client)
 */
export function getRegisteredExtinguishers(clientIdOrSiteId = null) {
  const positions = getPositions();
  const sites = getSites();

  let filtered = positions.filter(isFireExtinguisherAsset);

  if (clientIdOrSiteId) {
    filtered = filtered.filter(p => {
      if (p.siteId === clientIdOrSiteId) return true;
      const s = sites.find(site => site.id === p.siteId || site.code === p.siteId);
      const cName = s?.clientName || s?.company || s?.name || p.clientName;
      return cName === clientIdOrSiteId || s?.id === clientIdOrSiteId;
    });
  }

  return filtered;
}

/**
 * Returns total count of registered fire extinguishers across all clients
 */
export function getTotalExtinguishersCount() {
  return getRegisteredExtinguishers().length;
}

/**
 * Returns client-wise aggregated breakdown of fire extinguishers:
 * [ { clientName, siteId, siteName, totalExtinguishers, extinguishers, typesBreakdown, inspectedCount, attentionCount, pendingCount } ]
 */
export function getClientExtinguisherBreakdown() {
  const extinguishers = getRegisteredExtinguishers();
  const sites = getSites();

  const clientMap = {};

  extinguishers.forEach(ext => {
    const s = sites.find(site => site.id === ext.siteId || site.code === ext.siteId);
    const clientKey = s?.clientName || s?.company || s?.name || ext.clientName || 'Unassigned Client';
    const siteTitle = s?.plantFacility || s?.name || ext.siteName || ext.siteId || 'Main Facility';
    
    if (!clientMap[clientKey]) {
      clientMap[clientKey] = {
        clientName: clientKey,
        siteId: ext.siteId,
        siteName: siteTitle,
        siteAddress: s?.address || ext.siteAddress || '',
        city: s?.city || ext.city || '',
        totalExtinguishers: 0,
        extinguishers: [],
        typesBreakdown: {},
        inspectedCount: 0,
        attentionCount: 0,
        pendingCount: 0
      };
    }

    clientMap[clientKey].totalExtinguishers++;
    clientMap[clientKey].extinguishers.push(ext);

    // Track type breakdown
    const typeLabel = ext.currentEquipment?.type || ext.equipmentType || 'Fire Extinguisher';
    clientMap[clientKey].typesBreakdown[typeLabel] = (clientMap[clientKey].typesBreakdown[typeLabel] || 0) + 1;

    // Track inspection status
    if (ext.inspectionStatus === 'Inspected - OK') {
      clientMap[clientKey].inspectedCount++;
    } else if (ext.inspectionStatus === 'Inspected - Attention') {
      clientMap[clientKey].attentionCount++;
    } else {
      clientMap[clientKey].pendingCount++;
    }
  });

  return Object.values(clientMap).sort((a, b) => b.totalExtinguishers - a.totalExtinguishers);
}

// ============================================================================
// ALL ASSET INVENTORY & CLIENT BREAKDOWN QUERY HELPERS (ALL ASSET CATEGORIES)
// ============================================================================

/**
 * Returns all valid registered assets across all categories (or filtered by category and/or client/site).
 * Strictly excludes retired or scrapped assets and unassigned QR labels.
 */
export function getRegisteredAssets(clientIdOrSiteId = null, categoryFilter = null) {
  const positions = getPositions();
  const sites = getSites();

  let filtered = positions.filter(p => {
    if (!p) return false;
    if (p.status === 'Retired' || p.status === 'Deleted' || p.operationalStatus === 'Retired' || p.operationalStatus === 'Scrapped') {
      return false;
    }
    if (!p.positionId && !p.id) return false;
    return true;
  });

  if (categoryFilter && categoryFilter !== 'ALL') {
    if (categoryFilter === 'EXTINGUISHER' || categoryFilter === 'Fire Extinguisher') {
      filtered = filtered.filter(isFireExtinguisherAsset);
    } else {
      const catLower = categoryFilter.toLowerCase();
      filtered = filtered.filter(p => {
        const c = (p.equipmentCategory || '').toLowerCase();
        const t = (p.equipmentType || '').toLowerCase();
        const tmpl = (p.templateId || '').toLowerCase();
        return c.includes(catLower) || t.includes(catLower) || tmpl.includes(catLower);
      });
    }
  }

  if (clientIdOrSiteId) {
    filtered = filtered.filter(p => {
      if (p.siteId === clientIdOrSiteId) return true;
      const s = sites.find(site => site.id === p.siteId || site.code === p.siteId);
      const cName = s?.clientName || s?.company || s?.name || p.clientName;
      return cName === clientIdOrSiteId || s?.id === clientIdOrSiteId;
    });
  }

  return filtered;
}

/**
 * Returns total count of all registered assets (or filtered by category)
 */
export function getTotalAssetsCount(categoryFilter = null) {
  return getRegisteredAssets(null, categoryFilter).length;
}

/**
 * Returns client-wise aggregated breakdown of ALL assets (or filtered by category):
 * [ { clientName, siteId, siteName, totalAssets, assets, categoriesBreakdown, typesBreakdown, inspectedCount, attentionCount, pendingCount } ]
 */
export function getClientAssetBreakdown(categoryFilter = null) {
  const assets = getRegisteredAssets(null, categoryFilter);
  const sites = getSites();

  const clientMap = {};

  assets.forEach(asset => {
    const s = sites.find(site => site.id === asset.siteId || site.code === asset.siteId);
    const clientKey = s?.clientName || s?.company || s?.name || asset.clientName || 'Unassigned Client';
    const siteTitle = s?.plantFacility || s?.name || asset.siteName || asset.siteId || 'Main Facility';
    
    if (!clientMap[clientKey]) {
      clientMap[clientKey] = {
        clientName: clientKey,
        siteId: asset.siteId,
        siteName: siteTitle,
        siteAddress: s?.address || asset.siteAddress || '',
        city: s?.city || asset.city || '',
        totalAssets: 0,
        assets: [],
        categoriesBreakdown: {},
        typesBreakdown: {},
        inspectedCount: 0,
        attentionCount: 0,
        pendingCount: 0
      };
    }

    clientMap[clientKey].totalAssets++;
    clientMap[clientKey].assets.push(asset);

    // Track category breakdown
    const catLabel = asset.equipmentCategory || (asset.templateId === 'CL-03' ? 'Delivery Hose Box' : (asset.templateId === 'CL-11' ? 'Fire Extinguisher' : asset.equipmentType || 'Safety Equipment'));
    clientMap[clientKey].categoriesBreakdown[catLabel] = (clientMap[clientKey].categoriesBreakdown[catLabel] || 0) + 1;

    // Track specific type breakdown
    const typeLabel = asset.currentEquipment?.type || asset.equipmentType || catLabel;
    clientMap[clientKey].typesBreakdown[typeLabel] = (clientMap[clientKey].typesBreakdown[typeLabel] || 0) + 1;

    // Track inspection status
    if (asset.inspectionStatus === 'Inspected - OK') {
      clientMap[clientKey].inspectedCount++;
    } else if (asset.inspectionStatus === 'Inspected - Attention') {
      clientMap[clientKey].attentionCount++;
    } else {
      clientMap[clientKey].pendingCount++;
    }
  });

  return Object.values(clientMap).map(c => ({
    ...c,
    categories: Object.keys(c.categoriesBreakdown),
    statusCounts: {
      ok: c.inspectedCount,
      attn: c.attentionCount,
      pending: c.pendingCount
    }
  })).sort((a, b) => b.totalAssets - a.totalAssets);
}

// ============================================================================
// PERMANENT QR REGISTRY & BULK GENERATION MODULE (Modules 1, 2, 3)
// Concurrency-safe, duplicate-free, permanent registry of all QR tokens
// ============================================================================

export function getQRRegistry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QR_REGISTRY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('getQRRegistry error:', e);
  }
  return [];
}

export function getQRSequence() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QR_SEQUENCE);
    if (raw) return parseInt(raw, 10) || 0;
  } catch (e) {}
  return 0;
}

/**
 * Find QR record from registry by token, id, display number, or scanned code
 */
export function getQRRecordByToken(tokenOrCode) {
  if (!tokenOrCode || typeof tokenOrCode !== 'string') return null;
  const clean = parseScannedQRToken(tokenOrCode);
  const cleanUpper = clean.toUpperCase();
  const registry = getQRRegistry();

  return registry.find(r => {
    const rToken = (r.token || '').toUpperCase();
    const rId = (r.id || '').toUpperCase();
    const rDisp = (r.displayNo || '').toUpperCase();
    return rToken === cleanUpper || 
           rId === cleanUpper || 
           rDisp === cleanUpper ||
           (rToken.length > 5 && cleanUpper.includes(rToken)) ||
           (cleanUpper.length > 5 && rToken.includes(cleanUpper));
  }) || null;
}

/**
 * Generate bulk QR codes in advance without entering asset details (Module 1)
 * Guarantees permanent unique numbering that never restarts from 1
 */
export function generateBulkQRCodes(quantity, options = {}) {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    return { success: false, error: 'Invalid quantity: Must be a positive integer.' };
  }

  const registry = getQRRegistry();
  let currentSeq = getQRSequence();

  // Concurrency-safe: compute highest existing sequence in registry
  registry.forEach(r => {
    if (r.seqNumber && r.seqNumber > currentSeq) {
      currentSeq = r.seqNumber;
    }
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const batchDateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const batchId = options.batchId || `BATCH-${batchDateStr}-${String(Date.now()).slice(-4)}`;
  const generatedBy = options.generatedBy || 'Ramesh Patel (Admin)';

  const newRecords = [];
  const startSeq = currentSeq + 1;
  const endSeq = currentSeq + qty;

  for (let s = startSeq; s <= endSeq; s++) {
    const padded = String(s).padStart(6, '0');
    const token = `IFS-QR-${padded}`;
    const displayNo = `SR. NO. ${String(s).padStart(3, '0')}`;

    // Duplicate prevention check across all existing records
    if (registry.some(r => r.token === token || r.seqNumber === s)) {
      continue;
    }

    const record = {
      id: `QR-REC-${padded}`,
      token: token,
      displayNo: displayNo,
      seqNumber: s,
      batchId: batchId,
      batchLabel: options.batchLabel || `Batch ${batchId} (${qty} Labels)`,
      generatedDate: dateFormatted,
      generatedTime: timeFormatted,
      generatedAt: now.toISOString(),
      generatedBy: generatedBy,
      assignmentStatus: 'Available', // 'Available' | 'Assigned' | 'Inactive'
      linkedAssetId: null,
      linkedPositionId: null,
      linkedAssetName: null,
      assignedDate: null,
      assignedBy: null,
      lifecycleStatus: 'Active' // 'Active' | 'Damaged' | 'Retired'
    };

    newRecords.push(record);
    registry.push(record);
  }

  // Atomically update sequence and registry
  localStorage.setItem(STORAGE_KEYS.QR_SEQUENCE, String(endSeq));
  localStorage.setItem(STORAGE_KEYS.QR_REGISTRY, JSON.stringify(registry));
  notifyDataChanged('qr_generated', batchId, { startSeq, endSeq, count: newRecords.length });

  // Dispatch live notification event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ifspl:qr_registry_updated', { 
      detail: { batchId, count: newRecords.length, startSeq, endSeq } 
    }));
  }

  return {
    success: true,
    batchId,
    startSeq,
    endSeq,
    count: newRecords.length,
    records: newRecords
  };
}

/**
 * Assign an existing QR code to an asset (Module 3)
 * Prevents duplicate assignment and binds the QR token permanently
 */
export function assignQRToAsset(qrToken, assetPositionId, assetName, options = {}) {
  if (!qrToken || !assetPositionId) {
    return { success: false, error: 'Both QR Token and Asset Position ID are required for assignment.' };
  }

  const registry = getQRRegistry();
  const tokenUpper = qrToken.trim().toUpperCase();

  let recIndex = registry.findIndex(r => 
    r.token.toUpperCase() === tokenUpper || 
    r.id.toUpperCase() === tokenUpper ||
    r.displayNo.toUpperCase() === tokenUpper
  );

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-US');

  if (recIndex === -1) {
    // If not in registry (e.g. legacy direct position), create the permanent assigned record
    const seq = registry.length + 1;
    const newRec = {
      id: `QR-REC-${String(seq).padStart(6, '0')}`,
      token: qrToken,
      displayNo: `SR. NO. ${String(seq).padStart(3, '0')}`,
      seqNumber: seq,
      batchId: 'BATCH-DIRECT-ASSIGN',
      batchLabel: 'Direct Registration',
      generatedDate: now.toLocaleDateString('en-GB'),
      generatedTime: now.toLocaleTimeString('en-US'),
      generatedAt: now.toISOString(),
      generatedBy: options.assignedBy || 'Technician',
      assignmentStatus: 'Assigned',
      linkedAssetId: assetPositionId,
      linkedPositionId: assetPositionId,
      linkedAssetName: assetName || 'Fire Protection Equipment',
      assignedDate: dateFormatted,
      assignedBy: options.assignedBy || 'Technician',
      lifecycleStatus: 'Active'
    };
    registry.push(newRec);
    localStorage.setItem(STORAGE_KEYS.QR_REGISTRY, JSON.stringify(registry));
    notifyDataChanged('qr_assigned', assetPositionId, newRec);
    return { success: true, record: newRec };
  }

  const record = registry[recIndex];

  // Check duplicate assignment: If already assigned to another asset, strictly prohibit
  if (record.assignmentStatus === 'Assigned' && record.linkedPositionId && record.linkedPositionId !== assetPositionId) {
    return { 
      success: false, 
      error: `Duplicate Assignment Error: QR Code ${record.displayNo} (${record.token}) is already assigned to asset ${record.linkedPositionId}. Each QR code can only be assigned to one physical asset.` 
    };
  }

  record.assignmentStatus = 'Assigned';
  record.linkedAssetId = assetPositionId;
  record.linkedPositionId = assetPositionId;
  record.linkedAssetName = assetName || record.linkedAssetName || 'Fire Protection Equipment';
  record.assignedDate = dateFormatted;
  record.assignedAtIso = now.toISOString();
  record.assignedBy = options.assignedBy || 'Ramesh Patel (Field Technician)';

  registry[recIndex] = record;
  localStorage.setItem(STORAGE_KEYS.QR_REGISTRY, JSON.stringify(registry));
  notifyDataChanged('qr_assigned', assetPositionId, record);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ifspl:qr_registry_updated', { 
      detail: { token: record.token, assetId: assetPositionId } 
    }));
  }

  return { success: true, record };
}

/**
 * Retrieve batch of QR codes for reprinting without changing tokens (Module 2)
 */
export function getQRRecordsForReprint(batchId = null, tokenList = null) {
  const registry = getQRRegistry();
  if (batchId) {
    return registry.filter(r => r.batchId === batchId);
  }
  if (tokenList && Array.isArray(tokenList)) {
    const set = new Set(tokenList.map(t => t.toUpperCase()));
    return registry.filter(r => set.has(r.token.toUpperCase()) || set.has(r.id.toUpperCase()));
  }
  return registry;
}

export function getPositionByQR(qrCode) {
  if (!qrCode || typeof qrCode !== 'string') return null;
  const positions = getPositions();
  const cleanCode = parseScannedQRToken(qrCode);
  const cleanUpper = cleanCode.trim().toUpperCase();

  // First check if this token is registered in the permanent QR registry and assigned to a position
  const qrRec = getQRRecordByToken(cleanCode);
  if (qrRec && qrRec.assignmentStatus === 'Assigned' && qrRec.linkedPositionId) {
    const linked = positions.find(p => p.positionId === qrRec.linkedPositionId || p.qrCode === qrRec.token);
    if (linked) return linked;
  }

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

/**
 * Resolve asset position for QR scan with query param fallback
 * Handles cross-device scans (e.g. registered on PC, scanned on mobile)
 * Also detects unassigned QR codes for immediate field registration
 */
export function resolveScannedAssetPosition(scanCode, urlParams = null) {
  if (!scanCode) return null;
  const clean = parseScannedQRToken(scanCode);
  if (!clean) return null;

  // 1. Direct match with existing assigned asset
  const match = getPositionByQR(clean);
  if (match) return match;

  // 2. Check QR Registry
  const qrRec = getQRRecordByToken(clean);
  if (qrRec) {
    if (qrRec.lifecycleStatus === 'Retired') {
      return {
        isInvalidQR: true,
        isRetiredQR: true,
        scanCode: clean,
        qrRecord: qrRec,
        error: `QR Code "${qrRec.displayNo}" (${qrRec.token}) has been retired and is no longer active in the system.`
      };
    }

    if (qrRec.assignmentStatus === 'Available') {
      return {
        isUnassignedQR: true,
        qrRecord: qrRec,
        qrToken: qrRec.token,
        displayNo: qrRec.displayNo,
        seqNumber: qrRec.seqNumber
      };
    }

    if (qrRec.assignmentStatus === 'Assigned' && qrRec.linkedPositionId) {
      const positions = getPositions();
      const linked = positions.find(p => p.positionId === qrRec.linkedPositionId || p.qrCode === qrRec.token);
      if (linked) return linked;
    }
  }

  // 3. Fallback strictly for explicit legacy query URLs that carried full metadata
  try {
    const params = urlParams || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null);
    if (params && params.get('tmpl') && (params.get('sn') || params.get('eq'))) {
      const tmpl = params.get('tmpl') || 'CL-11';
      const eq = params.get('eq') || 'Fire Safety Equipment';
      const client = params.get('client') || 'Client Organisation';
      const loc = params.get('loc') || 'Plant Area';
      const sn = params.get('sn') || clean;
      const cap = params.get('cap') || '';

      const constructed = {
        id: `pos-${clean.toLowerCase()}`,
        positionId: clean,
        permanentPositionCode: clean,
        qrCode: clean.startsWith('IFS-QR-') ? clean : `IFS-QR-${clean}`,
        qrToken: clean.startsWith('IFS-QR-') ? clean : `IFS-QR-${clean}`,
        siteId: 'SITE-AIL-001',
        siteName: client,
        clientName: client,
        area: loc.split('—')[0]?.trim() || loc,
        location: loc.split('—')[1]?.trim() || loc,
        equipmentCategory: 'Fire Extinguisher',
        equipmentType: eq,
        serviceType: 'Digital Inspection & Maintenance',
        templateId: tmpl,
        currentEquipmentId: sn,
        activeUnitId: sn,
        currentEquipment: {
          id: sn,
          assetPositionId: clean,
          serialNo: sn,
          serialNumber: sn,
          make: 'Indus SafeGuard',
          capacity: cap || 'Standard',
          type: eq,
          operationalStatus: 'Active in Position'
        },
        applicableChecklistMapping: {
          templateId: tmpl
        },
        inspectionStatus: 'Pending Initial Inspection',
        lastInspectionDate: null,
        history: []
      };

      const positions = getPositions();
      const exists = positions.find(p => p.positionId === clean);
      if (!exists) {
        positions.push(constructed);
        localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
      }
      return constructed;
    }
  } catch (e) {
    console.warn('resolveScannedAssetPosition error:', e);
  }

  // 4. Token is not found in database or registry -> Return explicit invalid QR state
  return {
    isInvalidQR: true,
    scanCode: clean,
    error: `QR Code "${clean}" is not recognized in the database or permanent registry.`
  };
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
  notifyDataChanged('equipment_replaced', currentPos.positionId, updatedPosition);

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
    if (!data) return [];
    const visits = JSON.parse(data);
    return Array.isArray(visits) ? visits : [];
  } catch (e) {
    return [];
  }
}

export function getVisitById(visitId) {
  const visits = getVisits();
  return visits.find(v => v.visitId === visitId) || null;
}

export const VALID_PENDING_REASONS = [
  'Asset not found at site',
  'Asset inaccessible',
  'Asset removed / shifted',
  'Asset damaged or unsafe to inspect',
  'Customer representative unavailable',
  'Asset not available during visit',
  'QR code missing or damaged',
  'Asset not covered under current AMC',
  'Other'
];

export function getActiveVisit(siteId = "SITE-AIL-001") {
  const visits = getVisits();
  let visit = visits.find(v => v.siteId === siteId && (v.status === "In Progress" || v.status === "Draft"));
  const sitePositions = getPositions(siteId);
  const totalAssetsCount = sitePositions.length;

  if (visit) {
    // Dynamically calculate and refresh metrics from database records
    const inspectedKeys = Object.keys(visit.checklistAnswers || {});
    visit.totalAssets = totalAssetsCount;
    visit.inspectedAssets = inspectedKeys.length;
    visit.pendingAssets = Math.max(0, totalAssetsCount - inspectedKeys.length);
    visit.progressPct = totalAssetsCount > 0 ? Math.round((inspectedKeys.length / totalAssetsCount) * 100) : 0;
    return visit;
  }

  // Create new active site inspection session
  const sites = getSites();
  const site = sites.find(s => s.id === siteId) || {};
  const siteVisitsCount = visits.filter(v => v.siteId === siteId).length;
  const seqStr = String(siteVisitsCount + 1).padStart(2, '0');
  const cleanSiteCode = (site.code || site.id || 'SITE').replace('SITE-', '').replace(/[^A-Za-z0-9]/g, '');
  const now = new Date();
  const isoTimestamp = now.toISOString();
  const dateStr = isoTimestamp.substring(0, 10);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const currentUser = getCurrentUser();

  const clientTitle = site.clientName || site.company || site.name || 'Industrial Plant Facility';
  const workOrder = site.workOrderRef || site.poNumber || `WO-IFS-${now.getFullYear()}-${cleanSiteCode}`;

  visit = {
    id: `VISIT-${now.getFullYear()}-${cleanSiteCode}-${seqStr}`,
    visitId: `VISIT-${now.getFullYear()}-${cleanSiteCode}-${seqStr}`,
    siteId: siteId,
    siteName: clientTitle,
    customerName: clientTitle,
    workOrderRef: workOrder,
    poNumber: site.poNumber || '—',
    date: dateStr,
    startedAt: isoTimestamp,
    startDate: dateStr,
    startTime: timeStr,
    completedAt: null,
    completedDate: null,
    completedTime: null,
    serviceEngineer: currentUser.name || 'Ramesh Patel',
    technicianName: currentUser.name || 'Ramesh Patel',
    technicianBadge: currentUser.badge || 'IFS-SE-041',
    technicianRole: currentUser.roleTitle || 'Lead Service Engineer',
    supervisor: "Sanjay Sharma",
    clientRepresentative: site.clientContact || "Vikram Shah",
    status: "In Progress",
    totalAssets: totalAssetsCount,
    inspectedAssets: 0,
    pendingAssets: totalAssetsCount,
    progressPct: 0,
    checklistAnswers: {},
    pendingJustifications: {},
    visitRemarks: "",
    sparesReplaced: "",
    pendingPoints: "",
    technicianSignature: null,
    clientSignature: null
  };

  visits.unshift(visit);
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_VISIT_ID, visit.visitId);
  notifyDataChanged('site_inspection_started', visit.visitId, visit);

  return visit;
}

/**
 * Returns actual pending assets scheduled for inspection at site
 * that have not yet been inspected in the active inspection session.
 */
export function getPendingAssetsForSite(siteId, visitId = null) {
  const sitePositions = getPositions(siteId);
  const visits = getVisits();
  let visit = null;
  if (visitId) {
    visit = visits.find(v => v.visitId === visitId);
  }
  if (!visit) {
    visit = visits.find(v => v.siteId === siteId && v.status === 'In Progress') || visits.find(v => v.siteId === siteId) || null;
  }

  const inspectedKeys = new Set(Object.keys(visit?.checklistAnswers || {}));
  const pending = sitePositions.filter(pos => !inspectedKeys.has(pos.positionId));

  const sites = getSites();
  const site = sites.find(s => s.id === siteId) || {};
  const siteName = site.clientName || site.name || 'Site';

  return pending.map((pos, idx) => ({
    srNo: idx + 1,
    positionId: pos.positionId,
    id: pos.id || pos.positionId,
    qrCode: pos.qrCode || `IFS-QR-${pos.positionId}`,
    equipmentType: pos.equipmentType || pos.currentEquipment?.equipmentName || 'Fire Safety Equipment',
    equipmentCategory: pos.equipmentCategory || pos.equipmentType || 'Fire Safety',
    currentEquipment: pos.currentEquipment,
    templateId: pos.templateId || 'CL-11',
    area: pos.area || pos.locationDescription || 'Plant Area',
    location: pos.location || 'Site Location',
    customerName: siteName,
    siteId: siteId,
    inspectionStatus: 'Pending',
    justification: visit?.pendingJustifications?.[pos.positionId] || null
  }));
}

/**
 * Performs database-level validation on whether an AMC site inspection can be completed
 */
export function validateSiteInspectionCompletion(visitId) {
  const visits = getVisits();
  const visit = visits.find(v => (v.visitId || v.id) === visitId);
  if (!visit) {
    return {
      isValid: false,
      error: 'Inspection session not found',
      canComplete: false,
      pendingCount: 0,
      missingJustifications: []
    };
  }

  const sitePositions = getPositions(visit.siteId);
  const totalAssets = sitePositions.length;
  const inspectedKeys = Object.keys(visit.checklistAnswers || {});
  const inspectedAssets = inspectedKeys.length;
  const pendingList = sitePositions.filter(p => !inspectedKeys.includes(p.positionId));
  const pendingAssets = pendingList.length;
  const progressPct = totalAssets > 0 ? Math.round((inspectedAssets / totalAssets) * 100) : 0;

  // Scenario A: All assets inspected (Pending = 0)
  if (pendingAssets === 0) {
    return {
      isValid: true,
      canComplete: true,
      isFullyInspected: true,
      totalAssets,
      inspectedAssets,
      pendingAssets: 0,
      pendingCount: 0,
      progressPct: 100,
      pendingList: [],
      missingJustifications: [],
      statusRecommendation: 'Completed',
      recommendation: 'Completed'
    };
  }

  // Scenario B: Some assets are pending
  const existingJustifications = visit.pendingJustifications || {};
  const missingJustifications = pendingList.filter(p => {
    const just = existingJustifications[p.positionId];
    if (!just || !just.reason || !just.reason.trim()) return true;
    if (just.reason.startsWith('Other') && (!just.explanation || just.explanation.trim().length < 5)) return true;
    return false;
  });

  const canComplete = missingJustifications.length === 0;

  return {
    isValid: true,
    canComplete,
    isFullyInspected: false,
    totalAssets,
    inspectedAssets,
    pendingAssets,
    pendingCount: pendingAssets,
    progressPct,
    pendingList,
    missingJustifications,
    statusRecommendation: canComplete ? 'Completed with Exceptions' : 'Blocked',
    recommendation: canComplete ? 'Completed with Exceptions' : 'Blocked'
  };
}

/**
 * Saves or drafts pending asset justifications into the session
 */
export function savePendingAssetJustifications(visitId, justifications = {}) {
  const visits = getVisits();
  const vIndex = visits.findIndex(v => v.visitId === visitId);
  if (vIndex === -1) return { success: false, error: 'Inspection session not found' };

  if (!visits[vIndex].pendingJustifications) {
    visits[vIndex].pendingJustifications = {};
  }

  const currentUser = getCurrentUser();
  const now = new Date().toISOString();

  Object.entries(justifications).forEach(([posId, entry]) => {
    if (entry && (entry.reason || entry.remarks || entry.explanation)) {
      visits[vIndex].pendingJustifications[posId] = {
        reason: entry.reason || 'Other',
        explanation: entry.explanation || entry.remarks || '',
        remarks: entry.remarks || entry.explanation || '',
        justifiedBy: currentUser.name || 'Technician',
        justifiedAt: now
      };
    }
  });

  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  notifyDataChanged('pending_justification_saved', visitId);
  return { success: true, pendingJustifications: visits[vIndex].pendingJustifications };
}

/**
 * Enforces the strict completion rule at the database level:
 * - If all assets inspected -> "Completed"
 * - If pending assets exist -> Requires justification for EVERY pending asset.
 *   - If any missing -> BLOCKS completion.
 *   - If all valid -> "Completed with Exceptions"
 */
export function completeSiteInspection(visitId, {
  justifications = {},
  technicianSignature = null,
  clientSignature = null,
  clientRepName = null,
  technicianName = null,
  technicianBadge = null,
  visitRemarks = null,
  sparesReplaced = null,
  pendingPoints = null
} = {}) {
  const visits = getVisits();
  const vIndex = visits.findIndex(v => (v.visitId || v.id) === visitId);
  if (vIndex === -1) return { success: false, error: 'Inspection session not found.' };

  const visit = visits[vIndex];
  const sitePositions = getPositions(visit.siteId);
  const totalAssets = sitePositions.length;
  const inspectedKeys = Object.keys(visit.checklistAnswers || {});
  const inspectedAssets = inspectedKeys.length;
  const pendingList = sitePositions.filter(p => !inspectedKeys.includes(p.positionId));
  const pendingAssets = pendingList.length;
  const progressPct = totalAssets > 0 ? Math.round((inspectedAssets / totalAssets) * 100) : 0;

  // Merge any passed justifications with already saved ones
  const mergedJustifications = {
    ...(visit.pendingJustifications || {}),
    ...justifications
  };

  const now = new Date();
  const isoTimestamp = now.toISOString();
  const dateStr = isoTimestamp.substring(0, 10);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const currentUser = getCurrentUser();
  const resolvedTechName = technicianName || visit.technicianName || visit.serviceEngineer || currentUser.name || 'Ramesh Patel';
  const resolvedTechBadge = technicianBadge || visit.technicianBadge || currentUser.badge || 'IFS-SE-041';

  let finalStatus = 'Completed';

  if (pendingAssets > 0) {
    // Check justification for EVERY pending asset
    const missing = [];
    pendingList.forEach(pos => {
      const just = mergedJustifications[pos.positionId];
      if (!just || !just.reason || !just.reason.trim()) {
        missing.push(pos);
      } else if (just.reason.startsWith('Other') && (!just.explanation || just.explanation.trim().length < 5)) {
        missing.push(pos);
      }
    });

    if (missing.length > 0) {
      return {
        success: false,
        error: `Mandatory completion blocked: ${missing.length} pending asset(s) do not have a valid justification. Individual justification is mandatory for EVERY pending asset before completion.`,
        missingCount: missing.length,
        missingPositions: missing.map(m => m.positionId)
      };
    }

    finalStatus = 'Completed with Exceptions';
  }

  // Update visit record
  visit.totalAssets = totalAssets;
  visit.inspectedAssets = inspectedAssets;
  visit.pendingAssets = pendingAssets;
  visit.progressPct = progressPct;
  visit.pendingJustifications = mergedJustifications;
  visit.status = finalStatus;
  visit.completedAt = isoTimestamp;
  visit.completedDate = dateStr;
  visit.completedTime = timeStr;

  if (technicianSignature) visit.technicianSignature = technicianSignature;
  if (clientSignature) visit.clientSignature = clientSignature;
  if (clientRepName) visit.clientRepresentative = clientRepName;
  if (resolvedTechName) {
    visit.technicianName = resolvedTechName;
    visit.serviceEngineer = resolvedTechName;
  }
  if (resolvedTechBadge) visit.technicianBadge = resolvedTechBadge;
  if (visitRemarks !== null && visitRemarks !== undefined) visit.visitRemarks = visitRemarks;
  if (sparesReplaced !== null && sparesReplaced !== undefined) visit.sparesReplaced = sparesReplaced;
  if (pendingPoints !== null && pendingPoints !== undefined) visit.pendingPoints = pendingPoints;

  // If both signatures present, mark signed timestamp
  if (visit.technicianSignature && visit.clientSignature) {
    visit.signedAt = isoTimestamp;
    visit.signedDate = dateStr;
    visit.signedTime = timeStr;
  }

  visits[vIndex] = visit;
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

  // Update site status
  updateSiteProgress(visit.siteId);
  notifyDataChanged('site_inspection_completed', visitId, visit);

  queueSyncAction({
    type: 'SITE_INSPECTION_COMPLETED',
    visitId,
    status: finalStatus,
    totalAssets,
    inspectedAssets,
    pendingAssets,
    timestamp: isoTimestamp
  });

  return {
    success: true,
    status: finalStatus,
    visit,
    totalAssets,
    inspectedAssets,
    pendingAssets,
    progressPct
  };
}

export function saveChecklistResult(visitId, positionId, checklistData) {
  if (typeof visitId === 'object' && visitId !== null && !checklistData) {
    const payload = visitId;
    checklistData = payload;
    positionId = payload.positionId || payload.id;
    visitId = payload.visitId;
  }
  const visits = getVisits();
  const vIndex = visits.findIndex(v => (v.visitId || v.id) === visitId);
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

  // If this position was previously pending and justified, clear the pending justification
  if (visits[vIndex].pendingJustifications && visits[vIndex].pendingJustifications[positionId]) {
    delete visits[vIndex].pendingJustifications[positionId];
  }

  // Recalculate live progress counts from database records
  const sitePositions = getPositions(visits[vIndex].siteId);
  const totalAssetsCount = sitePositions.length;
  const inspectedAssetsCount = Object.keys(visits[vIndex].checklistAnswers).length;
  visits[vIndex].totalAssets = totalAssetsCount;
  visits[vIndex].inspectedAssets = inspectedAssetsCount;
  visits[vIndex].pendingAssets = Math.max(0, totalAssetsCount - inspectedAssetsCount);
  visits[vIndex].progressPct = totalAssetsCount > 0 ? Math.round((inspectedAssetsCount / totalAssetsCount) * 100) : 0;

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
  notifyDataChanged('checklist_result_saved', positionId, { visitId, positionId });

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
  const visits = getVisits();
  const activeVisit = visits.find(v => v.siteId === siteId && (v.status === 'In Progress' || v.status === 'Completed with Exceptions' || v.status === 'Completed'));

  let status = 'Scheduled';
  if (activeVisit?.status === 'Completed with Exceptions') {
    status = 'Completed with Exceptions';
  } else if ((inspected >= total && total > 0) || activeVisit?.status === 'Completed') {
    status = 'Completed';
  } else if (inspected > 0 || activeVisit?.status === 'In Progress') {
    status = 'In Progress';
  }

  sites[sIndex].totalPositions = total;
  sites[sIndex].inspectedPositions = inspected;
  sites[sIndex].status = status;

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
  notifyDataChanged('visit_remarks_saved', visitId);

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
  notifyDataChanged('visit_signatures_saved', visitId);

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
  notifyDataChanged('template_mapping_saved', mapping.id);
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
  notifyDataChanged('equipment_master_saved');
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
  const permanentPositionCode = assetData.positionId || `IFS-POS-${seqNumber}`;
  
  // Stable, opaque QR identifier (either from pre-printed scanned QR or generated)
  let qrToken = assetData.assignedQRToken || assetData.qrCode;

  if (qrToken) {
    const regRec = getQRRecordByToken(qrToken);
    if (regRec) {
      if (regRec.assignmentStatus === 'Assigned' && regRec.linkedPositionId && regRec.linkedPositionId !== permanentPositionCode) {
        return {
          success: false,
          error: `Duplicate Assignment Error: QR Code "${regRec.displayNo}" (${regRec.token}) is already assigned to asset ${regRec.linkedPositionId}. Each QR code can only be assigned to one physical asset.`
        };
      }
      qrToken = regRec.token;
    }
  } else {
    qrToken = `IFS-QR-${permanentPositionCode}`;
  }

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
  notifyDataChanged('asset_registered', permanentPositionCode, newPosition);

  // Permanently bind this QR token in the permanent QR Registry!
  assignQRToAsset(qrToken, permanentPositionCode, assetData.equipmentName || assetData.equipmentType, {
    assignedBy: assetData.assignedBy || 'Technician'
  });

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
  notifyDataChanged('asset_updated', preservedPositionId, updatedPosition);

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

// -------------------------------------------------------------
// Multi-Asset Checklist Session Engine (Multiple Assets in One Checklist)
// -------------------------------------------------------------

export function getChecklistSession(visitId, templateId) {
  const visits = getVisits();
  const vIndex = visits.findIndex(v => v.visitId === visitId);
  if (vIndex === -1) return null;

  const visit = visits[vIndex];
  if (!visit.checklistSessions) {
    visit.checklistSessions = {};
  }

  if (!visit.checklistSessions[templateId]) {
    // Populate session with any existing answers for this template
    const existingRecords = [];
    const positions = getPositions();

    if (visit.checklistAnswers) {
      Object.entries(visit.checklistAnswers).forEach(([posId, ans]) => {
        if (ans.templateId === templateId) {
          const pos = positions.find(p => p.positionId === posId) || {};
          existingRecords.push({
            sn: existingRecords.length + 1,
            positionId: posId,
            assetId: posId,
            serialNo: pos.currentEquipment?.serialNo || pos.serialNumber || 'N/A',
            equipmentType: pos.equipmentType || ans.templateId,
            area: pos.area || ans.area || 'Plant Area',
            location: pos.location || ans.location || 'Location',
            capacity: pos.capacity || 'Standard',
            answers: ans.items || {},
            remarks: ans.remarks || '',
            photos: ans.photos || [],
            overallResult: ans.overallResult || 'Pass',
            technicianName: ans.technicianName || visit.serviceEngineer || 'Ramesh Patel',
            technicianBadge: ans.technicianBadge || 'IFS-SE-041',
            technicianRole: ans.technicianRole || 'Lead Service Engineer',
            submittedAt: ans.timestamp || ans.savedAt || new Date().toISOString(),
            isLocked: true
          });
        }
      });
    }

    visit.checklistSessions[templateId] = {
      sessionId: `SESSION-${templateId}-${visitId}`,
      templateId,
      visitId,
      status: existingRecords.length > 0 ? 'In Progress' : 'Draft',
      startedAt: new Date().toISOString(),
      completedAt: null,
      records: existingRecords
    };
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  }

  return visit.checklistSessions[templateId];
}

export function submitAssetObservation(visitId, templateId, observationData) {
  const visits = getVisits();
  const vIndex = visits.findIndex(v => v.visitId === visitId);
  if (vIndex === -1) return { success: false, error: 'Visit not found' };

  const visit = visits[vIndex];
  if (!visit.checklistSessions) visit.checklistSessions = {};
  if (!visit.checklistSessions[templateId]) {
    visit.checklistSessions[templateId] = getChecklistSession(visitId, templateId);
  }

  const session = visit.checklistSessions[templateId] || getChecklistSession(visitId, templateId);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const fullTimestamp = `${dateFormatted} ${timeFormatted}`;

  const posId = observationData.positionId;
  const positions = getPositions();
  const pos = positions.find(p => p.positionId === posId) || {};

  const existingIdx = session.records.findIndex(r => r.positionId === posId);

  // Compute counts
  const answers = observationData.answers || {};
  let okCount = 0;
  let notOkCount = 0;
  let naCount = 0;
  Object.values(answers).forEach(val => {
    const status = typeof val === 'object' ? val.status : val;
    if (status === 'OK' || status === '√') okCount++;
    else if (status === 'NOT_OK' || status === 'FAIL' || status === 'X') notOkCount++;
    else if (status === 'NA') naCount++;
  });

  const overallResult = notOkCount > 0 ? 'Defective' : 'Pass';

  const newRecord = {
    sn: existingIdx >= 0 ? session.records[existingIdx].sn : (session.records.length + 1),
    positionId: posId,
    assetId: posId,
    serialNo: pos.currentEquipment?.serialNo || pos.serialNumber || observationData.serialNo || 'N/A',
    equipmentType: pos.equipmentType || observationData.equipmentType || 'Fire Protection Equipment',
    area: pos.area || observationData.area || 'Plant Area',
    location: pos.location || observationData.location || 'Mounting Point',
    capacity: pos.capacity || 'Standard',
    answers,
    remarks: observationData.remarks || '',
    photos: observationData.photos || [],
    counts: { okCount, notOkCount, naCount, total: Object.keys(answers).length },
    overallResult,
    technicianName: observationData.technicianName || 'Ramesh Patel',
    technicianBadge: observationData.technicianBadge || 'IFS-SE-041',
    technicianRole: observationData.technicianRole || 'Lead Service Engineer',
    submissionDate: dateFormatted,
    submissionTime: timeFormatted,
    submittedAt: fullTimestamp,
    submittedAtIso: now.toISOString(),
    isLocked: true
  };

  if (existingIdx >= 0) {
    session.records[existingIdx] = newRecord;
  } else {
    session.records.push(newRecord);
  }

  session.status = 'In Progress';
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

  // Also save to individual position checklist result for full backward-compatibility and sync
  saveChecklistResult(visitId, posId, {
    templateId,
    items: answers,
    remarks: observationData.remarks || '',
    photos: observationData.photos || [],
    overallResult,
    counts: {
      totalItems: Object.keys(answers).length,
      okCount,
      notOkCount,
      naCount
    },
    technicianName: newRecord.technicianName,
    technicianBadge: newRecord.technicianBadge,
    technicianRole: newRecord.technicianRole,
    timestamp: fullTimestamp,
    inspectionDate: dateFormatted,
    inspectionTime: timeFormatted
  });

  return { success: true, record: newRecord, session };
}

export function completeChecklistSession(visitId, templateId) {
  const visits = getVisits();
  const vIndex = visits.findIndex(v => v.visitId === visitId);
  if (vIndex === -1) return { success: false, error: 'Visit not found' };

  const visit = visits[vIndex];
  if (!visit.checklistSessions || !visit.checklistSessions[templateId]) {
    return { success: false, error: 'Session not found' };
  }

  const session = visit.checklistSessions[templateId];
  session.status = 'Completed';
  session.completedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  notifyDataChanged('checklist_session_completed', visitId);
  return { success: true, session };
}

// ============================================================================
// CLIENT 360° AMC INTELLIGENCE & PUNCH / DEFECT REPORTING ENGINE
// ============================================================================

/**
 * Discovers and seeds default punch items from actual recorded visits and defective positions
 */
function initializeDefaultPunchItems() {
  const visits = getVisits();
  const positions = getPositions();
  const sites = getSites();
  const list = [];
  let seq = 1;

  // 1. Scan visits for any checklist observation with NOT_OK status
  visits.forEach(v => {
    const s = sites.find(site => site.id === v.siteId);
    const clientName = s?.clientName || s?.company || s?.name || v.customerName || 'Industrial Client';
    const siteName = s?.plantFacility || s?.name || v.siteName || 'Plant Facility';

    const answers = v.checklistAnswers || {};
    Object.entries(answers).forEach(([posId, ans]) => {
      const pos = positions.find(p => p.positionId === posId);
      const items = ans.items || {};

      Object.entries(items).forEach(([itemNo, itemVal]) => {
        if (itemVal && (itemVal.status === 'NOT_OK' || itemVal.status === 'FAIL' || itemVal.status === 'X')) {
          const punchNo = `PNC-2026-${String(seq++).padStart(3, '0')}`;
          const isCritical = itemNo === '2' || itemNo === 2 || (itemVal.reason && itemVal.reason.toLowerCase().includes('pressure'));
          
          const evaluation = evaluateInspectionFindingPokaYoke(
            s,
            pos || { positionId: posId, equipmentCategory: pos?.equipmentCategory, equipmentType: pos?.equipmentType },
            itemVal.reason || itemVal.remarks || '',
            itemVal.title || ''
          );

          const punchRecord = {
            id: `PUNCH-${v.visitId || v.id}-${posId}-${itemNo}`,
            punchNo,
            punchDate: v.date || '2026-10-26',
            clientName,
            siteId: v.siteId,
            siteName,
            visitId: v.visitId || v.id,
            positionId: posId,
            qrCode: pos?.qrCode || `IFS-QR-${posId}`,
            assetName: pos?.currentEquipment?.equipmentName || pos?.equipmentType || 'Fire Equipment',
            assetCategory: pos?.equipmentCategory || 'Fire Extinguisher',
            assetType: pos?.equipmentType || 'Fire Safety Asset',
            location: [pos?.area, pos?.location].filter(Boolean).join(' — ') || 'Plant Facility Bay',
            failedItemNo: Number(itemNo) || itemNo,
            failedItemTitle: itemVal.title || `Inspection Parameter #${itemNo}`,
            defectObservation: itemVal.reason || itemVal.remarks || 'Defect identified during scheduled AMC maintenance',
            defectCategory: isCritical ? 'Hydraulic / Pressure Integrity' : 'Mechanical & Housing Integrity',
            severity: isCritical ? 'Critical' : 'Major',
            // Poka-Yoke Contract Entitlement
            requiredActivity: evaluation.technicalRequirement.activityType,
            requiredActivityTitle: evaluation.technicalRequirement.title,
            commercialStatus: evaluation.commercialAuthorization.commercialStatus,
            coverageStatus: evaluation.commercialAuthorization.coverageStatus,
            autoAuthorized: evaluation.autoProceedWithService,
            approvalRequired: evaluation.approvalRequired,
            approvalStatus: evaluation.autoProceedWithService ? 'Auto-Approved (Under Contract)' : 'Pending Client Approval',
            contractType: s?.contractType || 'AMC',
            pokaYokeReason: evaluation.commercialAuthorization.reason,
            technicianName: v.technicianName || v.serviceEngineer || 'Ramesh Patel',
            technicianBadge: v.technicianBadge || 'IFS-SE-041',
            responsibleDept: 'IFS Field Technical Team',
            rectificationOwner: v.technicianName || 'Ramesh Patel',
            targetDate: '2026-11-05',
            actualRectificationDate: null,
            status: 'Open',
            closureRemarks: '',
            evidencePhoto: itemVal.photo || (itemVal.photos && itemVal.photos[0]?.url) || null,
            closurePhoto: null,
            createdAt: v.startedAt || new Date().toISOString()
          };

          list.push(punchRecord);

          // Seed outside contract approval workflow if required
          if (evaluation.approvalRequired) {
            createServiceApprovalRequest({
              siteId: v.siteId,
              clientName,
              siteName,
              positionId: posId,
              qrCode: pos?.qrCode || `IFS-QR-${posId}`,
              assetName: pos?.currentEquipment?.equipmentName || pos?.equipmentType || 'Fire Extinguisher',
              punchId: punchRecord.id,
              punchNo: punchRecord.punchNo,
              activityType: evaluation.technicalRequirement.activityType,
              commercialStatus: evaluation.commercialAuthorization.commercialStatus,
              technicalReason: punchRecord.defectObservation
            });
          }
        }
      });
    });
  });

  // 2. Add sample historical closed and minor punch records for realistic lifecycle audit
  if (list.length > 0) {
    const first = list[0];
    list.push({
      id: `PUNCH-HIST-001`,
      punchNo: `PNC-2026-${String(seq++).padStart(3, '0')}`,
      punchDate: '2026-10-18',
      clientName: first.clientName,
      siteId: first.siteId,
      siteName: first.siteName,
      visitId: first.visitId,
      positionId: first.positionId,
      qrCode: first.qrCode,
      assetName: first.assetName,
      assetCategory: first.assetCategory,
      assetType: first.assetType,
      location: first.location,
      failedItemNo: 7,
      failedItemTitle: 'External Paint & Identification Stenciling',
      defectObservation: 'Paint flaking on discharge horn mounting bracket edge',
      defectCategory: 'Corrosion & Surface Protection',
      severity: 'Minor',
      technicianName: 'Amit Trivedi',
      technicianBadge: 'IFS-SE-042',
      responsibleDept: 'IFS Field Technical Team',
      rectificationOwner: 'Amit Trivedi',
      targetDate: '2026-10-25',
      actualRectificationDate: '2026-10-22',
      status: 'Closed',
      closureRemarks: 'Bracket sanded, primed and recoated with Signal Red IS 5 epoxy paint. Verified compliant.',
      evidencePhoto: null,
      closurePhoto: null,
      createdAt: '2026-10-18T10:30:00.000Z'
    });

    list.push({
      id: `PUNCH-HIST-002`,
      punchNo: `PNC-2026-${String(seq++).padStart(3, '0')}`,
      punchDate: '2026-10-20',
      clientName: first.clientName,
      siteId: first.siteId,
      siteName: first.siteName,
      visitId: first.visitId,
      positionId: first.positionId,
      qrCode: first.qrCode,
      assetName: first.assetName,
      assetCategory: first.assetCategory,
      assetType: first.assetType,
      location: first.location,
      failedItemNo: 1,
      failedItemTitle: 'Tamper Seal & Safety Pin Verification',
      defectObservation: 'Plastic tamper wire missing; lock pin loose in handle hole',
      defectCategory: 'Mechanical & Housing Integrity',
      severity: 'Major',
      technicianName: 'Jignesh Solanki',
      technicianBadge: 'IFS-TECH-019',
      responsibleDept: 'IFS Field Technical Team',
      rectificationOwner: 'Jignesh Solanki',
      targetDate: '2026-10-24',
      actualRectificationDate: '2026-10-23',
      status: 'Closed',
      closureRemarks: 'Replaced pull pin and installed new embossed serial tamper seal (Seal No: IFS-SEAL-8891). Tested trigger safety latch.',
      evidencePhoto: null,
      closurePhoto: null,
      createdAt: '2026-10-20T11:15:00.000Z'
    });
  }

  return list;
}

/**
 * Retrieve all punch items (optionally filtered by client name or site ID)
 */
export function getPunchItems(filterClientOrSiteId = null) {
  let list = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PUNCH_ITEMS);
    if (raw) {
      list = JSON.parse(raw);
    }
  } catch (e) {
    list = [];
  }

  if (!list || list.length === 0) {
    list = initializeDefaultPunchItems();
    try {
      localStorage.setItem(STORAGE_KEYS.PUNCH_ITEMS, JSON.stringify(list));
    } catch (e) {}
  }

  if (!filterClientOrSiteId || filterClientOrSiteId === 'ALL') {
    return list;
  }

  const query = filterClientOrSiteId.trim().toLowerCase();
  return list.filter(item => {
    return (item.siteId && item.siteId.toLowerCase() === query) ||
           (item.clientName && item.clientName.toLowerCase() === query) ||
           (item.siteName && item.siteName.toLowerCase() === query);
  });
}

/**
 * Updates a punch item (status, remarks, closure date, photo)
 */
export function updatePunchItem(punchId, updates = {}) {
  const list = getPunchItems();
  const idx = list.findIndex(p => p.id === punchId || p.punchNo === punchId);
  if (idx === -1) return { success: false, error: 'Punch item not found' };

  list[idx] = {
    ...list[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEYS.PUNCH_ITEMS, JSON.stringify(list));
  notifyDataChanged('punch_item_updated', punchId, list[idx]);
  return { success: true, punchItem: list[idx] };
}

/**
 * Creates a new punch item
 */
export function addPunchItem(punchData) {
  const list = getPunchItems();
  const sites = getSites();
  const s = sites.find(site => site.id === punchData.siteId) || getSiteById(punchData.siteId);

  const evaluation = evaluateInspectionFindingPokaYoke(
    s,
    { positionId: punchData.positionId, equipmentCategory: punchData.assetCategory, equipmentType: punchData.assetType },
    punchData.defectObservation || '',
    punchData.failedItemTitle || ''
  );

  const seq = list.length + 1;
  const newPunch = {
    id: punchData.id || `PUNCH-MANUAL-${Date.now()}`,
    punchNo: punchData.punchNo || `PNC-2026-${String(seq).padStart(3, '0')}`,
    punchDate: punchData.punchDate || new Date().toISOString().substring(0, 10),
    clientName: punchData.clientName || s?.clientName || 'Client Organization',
    siteId: punchData.siteId || 'SITE-001',
    siteName: punchData.siteName || s?.plantFacility || 'Facility Plant',
    visitId: punchData.visitId || 'VISIT-CURRENT',
    positionId: punchData.positionId || 'POS-001',
    qrCode: punchData.qrCode || 'IFS-QR-000001',
    assetName: punchData.assetName || 'Fire Safety Equipment',
    assetCategory: punchData.assetCategory || 'Fire Extinguisher',
    assetType: punchData.assetType || 'Fire Extinguisher',
    location: punchData.location || 'Facility Area',
    failedItemNo: punchData.failedItemNo || 1,
    failedItemTitle: punchData.failedItemTitle || 'Operational Defect',
    defectObservation: punchData.defectObservation || 'Defect noted',
    defectCategory: punchData.defectCategory || 'Mechanical',
    severity: punchData.severity || evaluation.technicalRequirement.severity || 'Major',
    // Poka-Yoke Contract Validation
    requiredActivity: punchData.requiredActivity || evaluation.technicalRequirement.activityType,
    requiredActivityTitle: punchData.requiredActivityTitle || evaluation.technicalRequirement.title,
    commercialStatus: punchData.commercialStatus || evaluation.commercialAuthorization.commercialStatus,
    coverageStatus: punchData.coverageStatus || evaluation.commercialAuthorization.coverageStatus,
    autoAuthorized: punchData.autoAuthorized !== undefined ? punchData.autoAuthorized : evaluation.autoProceedWithService,
    approvalRequired: punchData.approvalRequired !== undefined ? punchData.approvalRequired : evaluation.approvalRequired,
    approvalStatus: punchData.approvalStatus || (evaluation.autoProceedWithService ? 'Auto-Approved (Under Contract)' : 'Pending Client Approval'),
    contractType: s?.contractType || 'AMC',
    pokaYokeReason: evaluation.commercialAuthorization.reason,
    technicianName: punchData.technicianName || 'Ramesh Patel',
    technicianBadge: punchData.technicianBadge || 'IFS-SE-041',
    responsibleDept: 'IFS Field Technical Team',
    rectificationOwner: punchData.rectificationOwner || punchData.technicianName || 'Ramesh Patel',
    targetDate: punchData.targetDate || '2026-11-10',
    actualRectificationDate: null,
    status: 'Open',
    closureRemarks: '',
    evidencePhoto: punchData.evidencePhoto || null,
    closurePhoto: null,
    createdAt: new Date().toISOString()
  };

  list.unshift(newPunch);
  localStorage.setItem(STORAGE_KEYS.PUNCH_ITEMS, JSON.stringify(list));
  notifyDataChanged('punch_item_added', newPunch.id, newPunch);

  if (newPunch.approvalRequired) {
    createServiceApprovalRequest({
      siteId: newPunch.siteId,
      clientName: newPunch.clientName,
      siteName: newPunch.siteName,
      positionId: newPunch.positionId,
      qrCode: newPunch.qrCode,
      assetName: newPunch.assetName,
      punchId: newPunch.id,
      punchNo: newPunch.punchNo,
      activityType: newPunch.requiredActivity,
      commercialStatus: newPunch.commercialStatus,
      technicalReason: newPunch.defectObservation
    });
  }

  return { success: true, punchItem: newPunch };
}

/**
 * Computes the complete 360° AMC Intelligence Summary for a given client
 */
export function getClient360Summary(clientIdentifier = null) {
  const sites = getSites();
  const positions = getPositions();
  const visits = getVisits();
  const punches = getPunchItems();

  let matchedSites = [];
  if (clientIdentifier) {
    const q = clientIdentifier.trim().toLowerCase();
    matchedSites = sites.filter(s => {
      const cName = (s.clientName || s.name || s.company || '').toLowerCase();
      const sId = (s.id || '').toLowerCase();
      const code = (s.code || '').toLowerCase();
      return cName === q || sId === q || code === q || cName.includes(q);
    });
  }

  if (matchedSites.length === 0 && sites.length > 0) {
    matchedSites = [sites[0]];
  }

  const primarySite = matchedSites[0] || {};
  const clientName = primarySite.clientName || primarySite.name || primarySite.company || 'Client Organization';
  const clientCode = primarySite.code || primarySite.id || 'CUS-01';
  const siteIds = new Set(matchedSites.map(s => s.id));

  // 1. Assets for this client across all sites
  const clientAssets = positions.filter(p => siteIds.has(p.siteId));

  // 2. Visits for this client
  const clientVisits = visits.filter(v => siteIds.has(v.siteId));

  // 3. Punch items for this client
  const clientPunches = punches.filter(p => 
    siteIds.has(p.siteId) || 
    (p.clientName && p.clientName.toLowerCase() === clientName.toLowerCase())
  );

  // 4. Asset category breakdowns
  let extinguishersCount = 0;
  let hydrantsCount = 0;
  let hoseBoxesCount = 0;
  let hoseReelsCount = 0;
  let sprinklersCount = 0;
  let pumpsCount = 0;
  let alarmsCount = 0;
  let otherAssetsCount = 0;

  clientAssets.forEach(p => {
    const cat = (p.equipmentCategory || '').toLowerCase();
    const type = (p.equipmentType || '').toLowerCase();
    const tmpl = (p.templateId || '').toLowerCase();

    if (cat.includes('extinguisher') || type.includes('extinguisher') || tmpl === 'cl-11' || isFireExtinguisherAsset(p)) {
      extinguishersCount++;
    } else if (cat.includes('hydrant') || type.includes('hydrant') || tmpl === 'cl-01' || tmpl === 'cl-02') {
      hydrantsCount++;
    } else if (cat.includes('hose box') || type.includes('hose box') || tmpl === 'cl-03') {
      hoseBoxesCount++;
    } else if (cat.includes('hose reel') || type.includes('hose reel') || tmpl === 'cl-04') {
      hoseReelsCount++;
    } else if (cat.includes('sprinkler') || type.includes('sprinkler') || tmpl === 'cl-06') {
      sprinklersCount++;
    } else if (cat.includes('pump') || type.includes('pump') || tmpl === 'cl-05') {
      pumpsCount++;
    } else if (cat.includes('alarm') || type.includes('alarm') || tmpl === 'cl-10') {
      alarmsCount++;
    } else {
      otherAssetsCount++;
    }
  });

  const totalAssets = clientAssets.length;
  const inspectedAssets = clientAssets.filter(p => p.inspectionStatus && p.inspectionStatus.startsWith('Inspected')).length;
  const pendingAssets = Math.max(0, totalAssets - inspectedAssets);
  const notOkayAssets = clientAssets.filter(p => p.inspectionStatus === 'Inspected - Attention');
  const okAssets = clientAssets.filter(p => p.inspectionStatus === 'Inspected - OK');

  // Contract Details & Visits
  const plannedVisits = matchedSites.reduce((sum, s) => sum + Number(s.noOfVisits || 4), 0);
  const completedVisits = clientVisits.filter(v => 
    v.status === 'Completed' || 
    v.status === 'Completed with Exceptions' || 
    v.status === 'Signed & Completed'
  ).length;
  const remainingVisits = Math.max(0, plannedVisits - completedVisits);

  // Expiry & Renewal
  const expiryDate = primarySite.amcExpiryDate || '2027-03-31';
  const today = new Date();
  const expD = new Date(expiryDate);
  const diffTime = expD.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let renewalStatus = 'Active';
  let renewalBadgeColor = '#059669';
  if (diffDays <= 0) {
    renewalStatus = 'Expired';
    renewalBadgeColor = '#DC2626';
  } else if (diffDays <= 30) {
    renewalStatus = 'Renewal Due (Within 30 Days)';
    renewalBadgeColor = '#DC2626';
  } else if (diffDays <= 60) {
    renewalStatus = 'Renewal Due (Within 60 Days)';
    renewalBadgeColor = '#D97706';
  } else if (diffDays <= 90) {
    renewalStatus = 'Advance Renewal (Within 90 Days)';
    renewalBadgeColor = '#2563EB';
  }

  // Punch metrics
  const totalPunches = clientPunches.length;
  const openPunches = clientPunches.filter(p => p.status === 'Open' || p.status === 'In Progress' || p.status === 'Awaiting Material').length;
  const closedPunches = clientPunches.filter(p => p.status === 'Closed' || p.status === 'Rectified').length;
  const criticalPunches = clientPunches.filter(p => p.severity === 'Critical' && (p.status === 'Open' || p.status === 'In Progress')).length;
  const overduePunches = clientPunches.filter(p => {
    if (p.status === 'Closed' || p.status === 'Rectified') return false;
    if (!p.targetDate) return false;
    return new Date(p.targetDate).getTime() < today.getTime();
  }).length;
  const punchClosurePct = totalPunches > 0 ? Math.round((closedPunches / totalPunches) * 100) : 100;

  // Punch Aging Buckets
  const agingBuckets = {
    '0-7': 0,
    '8-15': 0,
    '16-30': 0,
    '31-60': 0,
    '60+': 0
  };

  clientPunches.forEach(p => {
    if (p.status !== 'Closed' && p.status !== 'Rectified') {
      const pDate = new Date(p.punchDate || p.createdAt || today);
      const age = Math.max(0, Math.floor((today.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24)));
      if (age <= 7) agingBuckets['0-7']++;
      else if (age <= 15) agingBuckets['8-15']++;
      else if (age <= 30) agingBuckets['16-30']++;
      else if (age <= 60) agingBuckets['31-60']++;
      else agingBuckets['60+']++;
    }
  });

  // Client Health Score (0-100) dynamically calculated from real data
  const visitScore = plannedVisits > 0 ? Math.min(25, (completedVisits / plannedVisits) * 25) : 25;
  const inspectionScore = totalAssets > 0 ? ((inspectedAssets / totalAssets) * 35) : 35;
  let punchScore = (punchClosurePct / 100) * 25;
  punchScore -= (criticalPunches * 6);
  punchScore -= (overduePunches * 3);
  punchScore = Math.max(0, punchScore);

  let contractScore = 15;
  if (diffDays <= 0) contractScore = 0;
  else if (diffDays <= 30) contractScore = 7;
  else if (diffDays <= 60) contractScore = 11;

  const healthScore = Math.max(5, Math.min(100, Math.round(visitScore + inspectionScore + punchScore + contractScore)));

  let healthRating = 'Healthy';
  let healthLabel = 'AMC On Track';
  let healthColor = '#2563EB';
  if (healthScore >= 90) {
    healthRating = 'Excellent';
    healthLabel = 'AMC Fully Compliant';
    healthColor = '#059669';
  } else if (healthScore >= 75) {
    healthRating = 'Healthy';
    healthLabel = 'AMC On Track';
    healthColor = '#2563EB';
  } else if (healthScore >= 60) {
    healthRating = 'Moderate';
    healthLabel = 'Attention Required';
    healthColor = '#D97706';
  } else {
    healthRating = 'Critical Risk';
    healthLabel = 'Urgent Review Needed';
    healthColor = '#DC2626';
  }

  // Technicians History
  const techMap = {};
  clientVisits.forEach(v => {
    const tName = v.technicianName || v.serviceEngineer || 'Ramesh Patel';
    const tBadge = v.technicianBadge || 'IFS-SE-041';
    if (!techMap[tName]) {
      techMap[tName] = {
        name: tName,
        badge: tBadge,
        visitsCount: 0,
        completedCount: 0,
        inspectedAssetsTotal: 0,
        punchesRaised: 0,
        rectificationsCompleted: 0,
        lastVisitDate: v.date || '—',
        sitesVisited: new Set()
      };
    }
    techMap[tName].visitsCount++;
    if (v.status.includes('Completed')) techMap[tName].completedCount++;
    techMap[tName].inspectedAssetsTotal += (v.inspectedAssets || Object.keys(v.checklistAnswers || {}).length);
    techMap[tName].sitesVisited.add(v.siteName || v.siteId);
    if (!techMap[tName].lastVisitDate || new Date(v.date) > new Date(techMap[tName].lastVisitDate)) {
      techMap[tName].lastVisitDate = v.date;
    }
  });

  const techniciansList = Object.values(techMap).map(t => ({
    ...t,
    sitesVisited: Array.from(t.sitesVisited)
  }));

  // Replaced Assets History
  const replacementHistory = [];
  clientAssets.forEach(pos => {
    if (Array.isArray(pos.history) && pos.history.length > 0) {
      pos.history.forEach(h => {
        if (h.event && (h.event.includes('Replacement') || h.event.includes('Swap'))) {
          replacementHistory.push({
            positionId: pos.positionId,
            qrCode: pos.qrCode,
            assetName: pos.currentEquipment?.equipmentName || pos.equipmentType,
            timestamp: h.timestamp,
            reason: h.reason,
            removedCylinder: h.removedCylinder,
            replacementCylinder: h.replacementCylinder,
            technician: h.technician,
            notes: h.notes
          });
        }
      });
    }
  });

  // Sites summary list
  const sitesList = matchedSites.map(s => {
    const sPositions = clientAssets.filter(p => p.siteId === s.id);
    const sInspected = sPositions.filter(p => p.inspectionStatus && p.inspectionStatus.startsWith('Inspected')).length;
    const sPending = Math.max(0, sPositions.length - sInspected);
    const sDefects = sPositions.filter(p => p.inspectionStatus === 'Inspected - Attention').length;
    const sVisits = clientVisits.filter(v => v.siteId === s.id);
    const lastVisit = sVisits[0]?.date || s.scheduledDate || '2026-10-26';

    return {
      siteId: s.id,
      siteName: s.plantFacility || s.name || 'Plant Facility',
      siteCode: s.code || s.id,
      address: s.address || 'Industrial Estate, GIDC',
      city: s.city || 'Vadodara',
      contactPerson: s.clientContact || 'Site Safety In-Charge',
      contactPhone: s.contactPhone || '+91 98000 00000',
      totalAssets: sPositions.length,
      inspectedAssets: sInspected,
      pendingAssets: sPending,
      defectiveAssets: sDefects,
      frequency: s.amcType || s.frequency || 'Quarterly',
      lastVisitDate: lastVisit,
      nextScheduledVisit: s.scheduledDate || '2026-11-20',
      status: s.status || (sPending === 0 && sPositions.length > 0 ? 'Completed' : 'In Progress')
    };
  });

  // Detailed Asset Register with all 21 fields
  const assetRegister = clientAssets.map((pos, idx) => {
    const isDefective = pos.inspectionStatus === 'Inspected - Attention';
    const isInspectedOk = pos.inspectionStatus === 'Inspected - OK';
    let condition = 'Pending Inspection';
    if (isDefective) condition = 'Defective';
    else if (isInspectedOk) condition = 'Okay';
    else if (pos.status === 'Retired') condition = 'Retired';
    else if (pos.status === 'Replaced') condition = 'Replaced';

    const pOpenPunches = clientPunches.filter(p => p.positionId === pos.positionId && (p.status === 'Open' || p.status === 'In Progress')).length;

    return {
      srNo: idx + 1,
      assetQrNumber: pos.qrCode || `IFS-QR-${pos.positionId}`,
      assetId: pos.positionId || pos.id,
      assetName: pos.currentEquipment?.equipmentName || pos.equipmentType || 'Fire Safety Asset',
      assetCategory: pos.equipmentCategory || (pos.templateId === 'CL-03' ? 'Hose Box' : 'Fire Extinguisher'),
      assetType: pos.currentEquipment?.type || pos.equipmentType || 'Fire Protection Unit',
      siteName: primarySite.plantFacility || primarySite.name || 'Plant Facility',
      departmentLocation: [pos.area, pos.location].filter(Boolean).join(' — ') || 'Plant Floor',
      manufacturer: pos.currentEquipment?.make || pos.currentEquipment?.manufacturer || 'Indus SafeGuard (IS 15683)',
      modelNumber: pos.currentEquipment?.model || 'IFS-PRO-2026',
      serialNumber: pos.currentEquipment?.serialNo || pos.currentEquipment?.serialNumber || '—',
      capacityRating: pos.currentEquipment?.capacity || pos.capacity || '—',
      installationDate: pos.currentEquipment?.installationDate || pos.installationDate || '2022-04-10',
      commissioningDate: pos.commissioningDate || pos.installationDate || '2022-04-15',
      lastInspectionDate: pos.lastInspectionDate || pos.inspectionHistory?.[0]?.inspectionDate || '—',
      nextInspectionDueDate: pos.currentEquipment?.nextServiceDueDate || pos.currentEquipment?.nextHydroTestDue || '2027-01-15',
      assetStatus: pos.operationalStatus || pos.status || 'Active in Position',
      amcCoverageStatus: 'Covered under Active AMC',
      assetCondition: condition,
      lastInspectionResult: isDefective ? 'Not Okay (Attention Required)' : (isInspectedOk ? 'Okay (Pass)' : 'Pending Inspection'),
      openPunchCount: pOpenPunches,
      pendingRectificationCount: pOpenPunches
    };
  });

  // Assets Found Not Okay
  const assetsNotOkay = clientAssets
    .filter(p => p.inspectionStatus === 'Inspected - Attention')
    .map((p, idx) => {
      const punch = clientPunches.find(pnc => pnc.positionId === p.positionId);
      return {
        srNo: idx + 1,
        assetId: p.positionId,
        qrNumber: p.qrCode,
        assetType: p.equipmentType,
        siteName: primarySite.plantFacility || primarySite.name,
        location: [p.area, p.location].filter(Boolean).join(' — '),
        inspectionDate: p.lastInspectionDate || '2026-10-26',
        visitNumber: punch?.visitId || 'VISIT-CURRENT',
        technician: punch?.technicianName || 'Ramesh Patel',
        failedParameter: punch?.failedItemTitle || 'Housing & Component Integrity',
        observation: punch?.defectObservation || 'Defect noted during inspection',
        severity: punch?.severity || 'Major',
        punchNumber: punch?.punchNo || 'PNC-2026-001',
        rectificationStatus: punch?.status || 'Open',
        lastUpdate: punch?.updatedAt || '2026-10-26',
        nextAction: punch?.status === 'Open' ? 'Dispatch IFS replacement spare & recertify' : 'Verified closed'
      };
    });

  // Pending Assets with Justification Reasons
  const pendingAssetsList = clientAssets
    .filter(p => !p.inspectionStatus || !p.inspectionStatus.startsWith('Inspected'))
    .map((p, idx) => {
      const visit = clientVisits[0];
      const just = visit?.pendingJustifications?.[p.positionId];
      return {
        srNo: idx + 1,
        assetId: p.positionId,
        qrNumber: p.qrCode,
        siteLocation: [p.area, p.location].filter(Boolean).join(' — '),
        pendingReason: just?.reason || 'Scheduled for Next AMC Field Rotation',
        explanation: just?.explanation || just?.remarks || 'Asset scheduled under planned quarterly batch.',
        assignedTechnician: visit?.technicianName || 'Ramesh Patel',
        scheduledDate: primarySite.scheduledDate || '2026-10-26',
        currentStatus: 'Pending Inspection'
      };
    });

  return {
    clientName,
    clientCode,
    contactPerson: primarySite.clientContact || 'Primary Contact',
    contactPhone: primarySite.contactPhone || '+91 98000 00000',
    email: primarySite.email || 'contact@client.org',
    billingAddress: primarySite.address || 'Industrial Estate, GIDC, Gujarat',
    city: primarySite.city || 'Vadodara',
    industry: 'Chemicals, Petrochemicals & Heavy Manufacturing',
    coordinator: 'Sanjay Sharma (Lead Technical AMC Coordinator)',
    amcStatus: primarySite.status === 'Completed' ? 'Completed' : (diffDays <= 0 ? 'Expired' : 'Active'),
    reportGeneratedAt: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US'),
    reportPeriod: `FY ${new Date().getFullYear()}-${new Date().getFullYear() + 1} (Q3)`,
    financialYear: `2026-2027`,
    statusBadge: {
      label: renewalStatus,
      color: renewalBadgeColor
    },
    healthScore: {
      score: healthScore,
      rating: healthRating,
      label: healthLabel,
      color: healthColor,
      components: {
        visitRate: Math.round(visitScore * 4),
        inspectionRate: Math.round(inspectionScore * (100 / 35)),
        punchClosureRate: punchClosurePct,
        contractValidityDays: diffDays
      }
    },
    kpis: {
      contract: {
        totalContracts: matchedSites.length,
        activeContracts: diffDays > 0 ? matchedSites.length : 0,
        expiredContracts: diffDays <= 0 ? matchedSites.length : 0,
        renewalDueContracts: diffDays <= 60 && diffDays > 0 ? 1 : 0,
        contractValue: `₹${(totalAssets * 450).toLocaleString('en-IN')}`,
        visitsScheduled: plannedVisits,
        visitsCompleted: completedVisits,
        visitsPending: remainingVisits
      },
      asset: {
        totalAssets,
        extinguishers: extinguishersCount,
        hydrants: hydrantsCount,
        hoseBoxes: hoseBoxesCount,
        hoseReels: hoseReelsCount,
        sprinklers: sprinklersCount,
        pumps: pumpsCount,
        alarms: alarmsCount,
        otherAssets: otherAssetsCount,
        inspectedAssets,
        pendingAssets,
        notOkayAssets: notOkayAssets.length,
        requiringRectification: openPunches
      },
      inspection: {
        totalSiteVisits: clientVisits.length,
        inspectionsConducted: inspectedAssets,
        inspectedAssets,
        inspectionCompletionPct: totalAssets > 0 ? Math.round((inspectedAssets / totalAssets) * 100) : 0,
        pendingInspections: pendingAssets,
        missedVisits: 0,
        completedWithExceptions: clientVisits.filter(v => v.status === 'Completed with Exceptions').length
      },
      punch: {
        totalPunches,
        openPunches,
        closedPunches,
        criticalPunches,
        overduePunches,
        punchClosurePct,
        avgRectificationDays: '3.5 Days'
      }
    },
    contractDetails: {
      contractNumber: `AMC-IFS-${clientCode}-${new Date().getFullYear()}`,
      poNumber: primarySite.poNumber || 'PO/IFS/AMC/2026',
      poDate: primarySite.poDate || '2026-04-01',
      startDate: primarySite.poDate || '2026-04-01',
      endDate: expiryDate,
      duration: '12 Months (1 Year Comprehensive)',
      contractType: primarySite.contractType || (primarySite.amcType?.toUpperCase().includes('ARC') ? 'ARC' : 'AMC'),
      amcType: primarySite.amcType || primarySite.frequency || 'Quarterly',
      frequency: primarySite.frequency || primarySite.amcType || 'Quarterly',
      plannedVisits,
      completedVisits,
      remainingVisits,
      contractValue: `₹${(totalAssets * 450).toLocaleString('en-IN')}`,
      billingTerms: primarySite.contractType === 'ARC' ? 'Schedule of Rates (Per-Service Itemized Invoicing)' : 'Quarterly In Arrears on Acceptance of Field Sign-Off (Net 30)',
      serviceScope: primarySite.amcType || 'Routine AMC Servicing, IS 2190 Pressure Testing, Defect Rectification & Statutory Audit Verification',
      includedCategories: Array.isArray(primarySite.coveredAssetCategories) ? primarySite.coveredAssetCategories.join(', ') : 'Fire Extinguishers, Hydrants, Hose Boxes, Hose Reels, Alarm Panels',
      contractCoverage: primarySite.contractType === 'ARC' ? 'Rate Contract — Itemized Standard Rate Schedule' : '100% Comprehensive Parts & Labour for Approved Standard Spares',
      excludedServices: primarySite.contractExclusions || 'Capital piping replacements exceeding ₹15,000 without written amendment',
      serviceCoverage: primarySite.serviceCoverage || getDefaultServiceCoverage(primarySite.contractType, primarySite.amcType),
      renewalAlert: renewalStatus,
      daysToExpiry: diffDays,
      responsibleCoordinator: 'Sanjay Sharma (Lead AMC Coordinator)'
    },
    serviceApprovals: getServiceApprovals(clientName),
    sites: sitesList,
    assets: assetRegister,
    visits: clientVisits,
    technicians: techniciansList,
    punches: clientPunches,
    assetsNotOkay,
    pendingAssetsList,
    replacementHistory,
    agingBuckets
  };
}

/**
 * Returns the aggregated directory list of all registered clients for the Client AMC Reports directory
 */
export function getAllClients360List() {
  const sites = getSites();
  const clientKeys = new Set();
  const list = [];

  sites.forEach(s => {
    const cName = s.clientName || s.name || s.company || 'Client Organization';
    if (!clientKeys.has(cName)) {
      clientKeys.add(cName);
      const summary = getClient360Summary(cName);
      list.push({
        clientName: summary.clientName,
        clientCode: summary.clientCode,
        sitesCount: summary.sites.length,
        amcStatus: summary.amcStatus,
        totalAssets: summary.kpis.asset.totalAssets,
        inspectedAssets: summary.kpis.asset.inspectedAssets,
        pendingAssets: summary.kpis.asset.pendingAssets,
        defectiveAssets: summary.kpis.asset.notOkayAssets,
        punchClosurePct: summary.kpis.punch.punchClosurePct,
        nextVisitDate: summary.sites[0]?.nextScheduledVisit || '2026-11-20',
        contractExpiryDate: summary.contractDetails.endDate,
        healthScore: summary.healthScore.score,
        healthRating: summary.healthScore.rating,
        healthLabel: summary.healthScore.label,
        healthColor: summary.healthScore.color,
        summary
      });
    }
  });

  return list.sort((a, b) => b.totalAssets - a.totalAssets);
}

