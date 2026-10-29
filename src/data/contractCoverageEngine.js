// Indus Fire Safety Private Limited - Contract Coverage & Poka-Yoke Service Validation Engine
// Enforces that service activities respect the client's actual AMC/ARC contract scope.
// The system NEVER assumes every client has contracted every service.

import { STORAGE_KEYS } from './storage.js';

export const CONTRACT_TYPES = {
  AMC: 'AMC', // Annual Maintenance Contract
  ARC: 'ARC'  // Annual Rate Contract (On-Call / Schedule of Rates)
};

export const SERVICE_ACTIVITIES = {
  INSPECTION: 'inspection',
  REFILLING: 'refilling',
  HPT: 'hpt',
  REPAIR: 'repair',
  REPLACEMENT: 'replacement',
  PREVENTIVE_MAINTENANCE: 'preventiveMaintenance',
  EMERGENCY_SERVICE: 'emergencyService',
  OTHER: 'other'
};

export const SERVICE_ACTIVITY_LABELS = {
  inspection: 'Routine AMC / Field Inspection',
  refilling: 'Extinguisher Refilling & Recharging',
  hpt: 'Hydrostatic Pressure Testing (HPT / IS 2190)',
  repair: 'Defect Rectification & Component Repair',
  replacement: 'Equipment / Cylinder Replacement',
  preventiveMaintenance: 'Scheduled Preventive Maintenance',
  emergencyService: 'Emergency Breakdown & Call-Out Service',
  other: 'Specialized Additional Work'
};

export const COVERAGE_STATUSES = {
  INCLUDED: 'Included',
  EXCLUDED: 'Excluded',
  CHARGEABLE: 'Chargeable / Additional Work',
  REQUIRES_APPROVAL: 'Requires Approval',
  NOT_CONFIGURED: 'Not Configured'
};

export const COVERAGE_STATUS_STYLES = {
  'Included': {
    bg: '#DCFCE7',
    color: '#15803D',
    border: '#86EFAC',
    label: 'Contract Covered',
    icon: 'CheckCircle2'
  },
  'Excluded': {
    bg: '#FEE2E2',
    color: '#B91C1C',
    border: '#FCA5A5',
    label: 'Outside Contract Coverage',
    icon: 'XCircle'
  },
  'Chargeable / Additional Work': {
    bg: '#DBEAFE',
    color: '#1E40AF',
    border: '#93C5FD',
    label: 'Chargeable (Rate Card)',
    icon: 'DollarSign'
  },
  'Requires Approval': {
    bg: '#FEF3C7',
    color: '#B45309',
    border: '#FCD34D',
    label: 'Approval Required',
    icon: 'AlertTriangle'
  },
  'Not Configured': {
    bg: '#F3F4F6',
    color: '#4B5563',
    border: '#E5E7EB',
    label: 'Not Configured (Flagged)',
    icon: 'HelpCircle'
  }
};

/**
 * Returns default service coverage configuration for a standard contract type
 */
export function getDefaultServiceCoverage(contractType = CONTRACT_TYPES.AMC, amcScope = 'Comprehensive') {
  if (contractType === CONTRACT_TYPES.ARC) {
    return {
      inspection: COVERAGE_STATUSES.INCLUDED,
      refilling: COVERAGE_STATUSES.CHARGEABLE,
      hpt: COVERAGE_STATUSES.CHARGEABLE,
      repair: COVERAGE_STATUSES.CHARGEABLE,
      replacement: COVERAGE_STATUSES.CHARGEABLE,
      preventiveMaintenance: COVERAGE_STATUSES.CHARGEABLE,
      emergencyService: COVERAGE_STATUSES.CHARGEABLE,
      other: COVERAGE_STATUSES.REQUIRES_APPROVAL
    };
  }

  const s = (amcScope || '').toLowerCase();
  if (s.includes('inspection only')) {
    return {
      inspection: COVERAGE_STATUSES.INCLUDED,
      refilling: COVERAGE_STATUSES.EXCLUDED,
      hpt: COVERAGE_STATUSES.EXCLUDED,
      repair: COVERAGE_STATUSES.CHARGEABLE,
      replacement: COVERAGE_STATUSES.EXCLUDED,
      preventiveMaintenance: COVERAGE_STATUSES.INCLUDED,
      emergencyService: COVERAGE_STATUSES.REQUIRES_APPROVAL,
      other: COVERAGE_STATUSES.REQUIRES_APPROVAL
    };
  }

  if (s.includes('inspection + refilling') || s.includes('inspection and refilling')) {
    return {
      inspection: COVERAGE_STATUSES.INCLUDED,
      refilling: COVERAGE_STATUSES.INCLUDED,
      hpt: COVERAGE_STATUSES.REQUIRES_APPROVAL,
      repair: COVERAGE_STATUSES.REQUIRES_APPROVAL,
      replacement: COVERAGE_STATUSES.EXCLUDED,
      preventiveMaintenance: COVERAGE_STATUSES.INCLUDED,
      emergencyService: COVERAGE_STATUSES.REQUIRES_APPROVAL,
      other: COVERAGE_STATUSES.REQUIRES_APPROVAL
    };
  }

  // Comprehensive AMC default (Inspection + Refilling + HPT + Routine Repairs)
  return {
    inspection: COVERAGE_STATUSES.INCLUDED,
    refilling: COVERAGE_STATUSES.INCLUDED,
    hpt: COVERAGE_STATUSES.INCLUDED,
    repair: COVERAGE_STATUSES.INCLUDED,
    replacement: COVERAGE_STATUSES.REQUIRES_APPROVAL,
    preventiveMaintenance: COVERAGE_STATUSES.INCLUDED,
    emergencyService: COVERAGE_STATUSES.INCLUDED,
    other: COVERAGE_STATUSES.REQUIRES_APPROVAL
  };
}

/**
 * Validates whether a specific service activity is authorized under a client's contract.
 * POKA-YOKE: Never assumes work is covered if coverage is missing, expired, or excluded.
 */
export function validateServiceContractCoverage(site, activityType, assetCategory = null) {
  if (!site) {
    return {
      isAuthorized: false,
      commercialStatus: 'Outside Contract Coverage',
      coverageStatus: COVERAGE_STATUSES.NOT_CONFIGURED,
      allowedToAutoProceed: false,
      contractType: 'Unknown',
      activityType,
      reason: 'No client contract record found for this asset.',
      requiresApproval: true,
      approvalType: 'Contract Assignment Needed'
    };
  }

  const contractType = site.contractType || (site.amcType?.toUpperCase().includes('ARC') ? CONTRACT_TYPES.ARC : CONTRACT_TYPES.AMC);
  const now = new Date();
  const expiryDate = site.amcExpiryDate ? new Date(site.amcExpiryDate) : null;
  const isExpired = expiryDate && expiryDate.getTime() < now.getTime();

  // 1. Contract Validity Check
  if (isExpired) {
    return {
      isAuthorized: false,
      commercialStatus: 'Contract Expired',
      coverageStatus: COVERAGE_STATUSES.EXCLUDED,
      allowedToAutoProceed: false,
      contractType,
      activityType,
      reason: `Client ${contractType} expired on ${site.amcExpiryDate}. Renewal or approval required before executing chargeable activities.`,
      requiresApproval: true,
      approvalType: 'Contract Renewal / Extension'
    };
  }

  // 2. Covered Asset Categories Check
  if (assetCategory && Array.isArray(site.coveredAssetCategories) && site.coveredAssetCategories.length > 0) {
    const isCategoryCovered = site.coveredAssetCategories.some(c => 
      c.toLowerCase() === assetCategory.toLowerCase() || 
      assetCategory.toLowerCase().includes(c.toLowerCase())
    );
    if (!isCategoryCovered) {
      return {
        isAuthorized: false,
        commercialStatus: 'Outside Contract Coverage',
        coverageStatus: COVERAGE_STATUSES.EXCLUDED,
        allowedToAutoProceed: false,
        contractType,
        activityType,
        reason: `Equipment category "${assetCategory}" is not included in the contracted asset scope for this client.`,
        requiresApproval: true,
        approvalType: 'Out-of-Scope Asset Quotation'
      };
    }
  }

  // 3. Service Coverage Verification
  const coverageMap = site.serviceCoverage || getDefaultServiceCoverage(contractType, site.amcType);
  const rawStatus = coverageMap[activityType];

  if (rawStatus === COVERAGE_STATUSES.INCLUDED) {
    return {
      isAuthorized: true,
      commercialStatus: 'Contract Covered',
      coverageStatus: COVERAGE_STATUSES.INCLUDED,
      allowedToAutoProceed: true,
      contractType,
      activityType,
      reason: `Authorized under active ${contractType} contract (${site.amcType || 'Standard'}).`,
      requiresApproval: false,
      approvalType: null
    };
  }

  if (rawStatus === COVERAGE_STATUSES.EXCLUDED) {
    return {
      isAuthorized: false,
      commercialStatus: 'Outside Contract Coverage',
      coverageStatus: COVERAGE_STATUSES.EXCLUDED,
      allowedToAutoProceed: false,
      contractType,
      activityType,
      reason: `Service activity "${SERVICE_ACTIVITY_LABELS[activityType] || activityType}" is strictly excluded from this client's contract scope.`,
      requiresApproval: true,
      approvalType: 'Customer Approval / Work Quotation'
    };
  }

  if (rawStatus === COVERAGE_STATUSES.CHARGEABLE || rawStatus === 'Chargeable') {
    return {
      isAuthorized: false,
      commercialStatus: 'Chargeable / Additional Work',
      coverageStatus: COVERAGE_STATUSES.CHARGEABLE,
      allowedToAutoProceed: false,
      contractType,
      activityType,
      reason: `Chargeable service under ${contractType} schedule of rates. Requires client work order or PO confirmation before execution.`,
      requiresApproval: true,
      approvalType: 'Client Work Order / PO'
    };
  }

  if (rawStatus === COVERAGE_STATUSES.REQUIRES_APPROVAL) {
    return {
      isAuthorized: false,
      commercialStatus: 'Approval Required',
      coverageStatus: COVERAGE_STATUSES.REQUIRES_APPROVAL,
      allowedToAutoProceed: false,
      contractType,
      activityType,
      reason: `Contract mandates supervisor review and customer authorization before commencing "${SERVICE_ACTIVITY_LABELS[activityType] || activityType}".`,
      requiresApproval: true,
      approvalType: 'Supervisor Review & Customer Sign-Off'
    };
  }

  // Poka-Yoke Fallback: If Not Configured or ambiguous, NEVER assume it is included!
  return {
    isAuthorized: false,
    commercialStatus: 'Approval Required',
    coverageStatus: COVERAGE_STATUSES.NOT_CONFIGURED,
    allowedToAutoProceed: false,
    contractType,
    activityType,
    reason: `Service coverage for "${SERVICE_ACTIVITY_LABELS[activityType] || activityType}" is not configured in contract terms. Defaulted to Approval Required.`,
    requiresApproval: true,
    approvalType: 'Commercial Review Needed'
  };
}

/**
 * Maps an inspection finding/defect to its technical service requirement and performs
 * Poka-Yoke contract validation.
 * 
 * Validates BOTH:
 * 1. Technical requirement: What work does the asset need?
 * 2. Commercial authorization: Is that work covered or approved under this client's contract?
 */
export function evaluateInspectionFindingPokaYoke(site, asset, observationText = '', failedItemTitle = '') {
  const text = `${observationText} ${failedItemTitle}`.toLowerCase();

  let activityType = SERVICE_ACTIVITIES.REPAIR;
  let technicalTitle = 'Defect Rectification';
  let technicalReason = observationText || 'Defect observed during inspection';
  let severity = 'Major';

  if (text.includes('pressure') || text.includes('gauge') || text.includes('refill') || text.includes('discharged') || text.includes('empty')) {
    activityType = SERVICE_ACTIVITIES.REFILLING;
    technicalTitle = 'Extinguisher Refilling & Recharging';
    technicalReason = 'Low or lost cylinder pressure / pressure gauge in red zone / discharge indicator tripped.';
    severity = 'Critical';
  } else if (text.includes('hydro') || text.includes('hpt') || text.includes('35 bar') || text.includes('pressure test')) {
    activityType = SERVICE_ACTIVITIES.HPT;
    technicalTitle = 'Hydrostatic Pressure Testing (35 Bar / IS 2190)';
    technicalReason = 'Cylinder due or overdue for statutory hydraulic stretch and proof testing.';
    severity = 'Critical';
  } else if (text.includes('corrosion') || text.includes('corroded') || text.includes('dented') || text.includes('replace cylinder') || text.includes('condemned')) {
    activityType = SERVICE_ACTIVITIES.REPLACEMENT;
    technicalTitle = 'Physical Unit / Cylinder Replacement';
    technicalReason = 'Shell compromised by severe external corrosion, mechanical impact, or structural denting.';
    severity = 'Critical';
  } else if (text.includes('hose') || text.includes('horn') || text.includes('nozzle') || text.includes('seal') || text.includes('pin') || text.includes('valve')) {
    activityType = SERVICE_ACTIVITIES.REPAIR;
    technicalTitle = 'Component Repair & Hardware Servicing';
    technicalReason = observationText || 'Defective safety pin, split discharge hose, or loose bracket mounting.';
    severity = 'Major';
  }

  const commercial = validateServiceContractCoverage(site, activityType, asset?.equipmentCategory);

  return {
    technicalRequirement: {
      activityType,
      title: technicalTitle,
      reason: technicalReason,
      severity,
      assetId: asset?.positionId || asset?.id || 'POS-UNKNOWN',
      assetType: asset?.equipmentType || 'Fire Extinguisher'
    },
    commercialAuthorization: commercial,
    autoProceedWithService: commercial.allowedToAutoProceed,
    approvalRequired: commercial.requiresApproval,
    pokaYokeAlert: {
      isCovered: commercial.isAuthorized,
      statusLabel: commercial.commercialStatus,
      message: commercial.reason,
      badgeStyle: COVERAGE_STATUS_STYLES[commercial.coverageStatus] || COVERAGE_STATUS_STYLES['Not Configured']
    }
  };
}

/**
 * Service Approvals & Quotations Store Management
 */
export function getServiceApprovals(filterSiteOrClient = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICE_APPROVALS || 'ifspl_amc_service_approvals');
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    if (filterSiteOrClient) {
      const q = filterSiteOrClient.trim().toLowerCase();
      return list.filter(item => 
        (item.siteId && item.siteId.toLowerCase() === q) ||
        (item.clientName && item.clientName.toLowerCase() === q) ||
        (item.positionId && item.positionId.toLowerCase() === q)
      );
    }
    return list;
  } catch (e) {
    return [];
  }
}

export function saveServiceApprovals(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.SERVICE_APPROVALS || 'ifspl_amc_service_approvals', JSON.stringify(list));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('ifspl:service_approvals_updated'));
      window.dispatchEvent(new CustomEvent('storage'));
    }
  } catch (e) {
    console.warn('saveServiceApprovals notice:', e);
  }
}

/**
 * Creates an Approval Request / Quotation for work that is Outside Contract Coverage or Chargeable
 */
export function createServiceApprovalRequest(requestData) {
  const list = getServiceApprovals();
  const seq = list.length + 1;
  const requestId = requestData.id || `REQ-APV-${Date.now()}`;
  const requestNumber = requestData.requestNumber || `APV-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;

  const newRequest = {
    id: requestId,
    requestNumber,
    createdAt: new Date().toISOString(),
    createdDate: new Date().toISOString().substring(0, 10),
    siteId: requestData.siteId,
    clientName: requestData.clientName || 'Client Organization',
    siteName: requestData.siteName || 'Facility Plant',
    positionId: requestData.positionId,
    qrCode: requestData.qrCode,
    assetName: requestData.assetName || 'Fire Extinguisher',
    punchId: requestData.punchId || null,
    punchNo: requestData.punchNo || null,
    activityType: requestData.activityType || SERVICE_ACTIVITIES.REFILLING,
    activityTitle: SERVICE_ACTIVITY_LABELS[requestData.activityType] || 'Service Activity',
    commercialStatus: requestData.commercialStatus || 'Outside Contract Coverage',
    technicalReason: requestData.technicalReason || 'Required based on inspection findings',
    estimatedCost: requestData.estimatedCost || (requestData.activityType === 'refilling' ? '₹850' : '₹1,500'),
    status: 'Pending Approval', // 'Pending Approval' | 'Approved' | 'Rejected' | 'Work Completed'
    requestedBy: requestData.requestedBy || 'Technician Field Inspection',
    clientApprover: null,
    approvalDate: null,
    approvalNotes: '',
    clientPoRef: requestData.clientPoRef || null
  };

  list.unshift(newRequest);
  saveServiceApprovals(list);
  return newRequest;
}

/**
 * Processes an Approval Request (Approve or Reject)
 */
export function processServiceApproval(requestId, decision, details = {}) {
  const list = getServiceApprovals();
  const idx = list.findIndex(r => r.id === requestId || r.requestNumber === requestId);
  if (idx === -1) return { success: false, error: 'Approval request not found' };

  list[idx] = {
    ...list[idx],
    status: decision === 'Approved' ? 'Approved' : 'Rejected',
    clientApprover: details.approvedBy || details.rejectedBy || 'Authorized Manager',
    approvalDate: new Date().toISOString().substring(0, 10),
    approvalNotes: details.notes || '',
    clientPoRef: details.poRef || list[idx].clientPoRef,
    updatedAt: new Date().toISOString()
  };

  saveServiceApprovals(list);
  return { success: true, request: list[idx] };
}
