// End-to-End Test Suite: Asset Registration -> Automatic Checklist -> QR Code Workflow
// Verifying all business workflow steps specified by Indus Fire Safety Pvt Ltd

import { 
  initStorage, 
  getSites, 
  getPositions, 
  getPositionById,
  getPositionByQR,
  registerNewAsset,
  updateAssetDetails,
  replaceEquipmentAtPosition,
  saveChecklistResult,
  getActiveVisit,
  getTemplateMappings,
  saveTemplateMapping,
  getEquipmentMaster,
  addEquipmentMasterItem,
  addLinkedServiceToEquipment
} from '../data/storage.js';

import { resolveChecklistMapping, getLinkedCapacities } from '../data/templateMappings.js';
import { generateSupabaseSQLBackup, generateJSONBackup, getSupabaseConfig, saveSupabaseConfig } from '../services/supabaseBackup.js';
import fs from 'fs';
import QRCode from 'qrcode';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

console.log('================================================================');
console.log(' INDUS FIRE SAFETY PRIVATE LIMITED');
console.log(' ASSET REGISTRATION → AUTO CHECKLIST → QR WORKFLOW TEST SUITE');
console.log('================================================================\n');

initStorage();

// -----------------------------------------------------------------------------
// TEST 1, 2, 3: Register New Fire Extinguisher, Unique Position ID, Auto Checklist
// -----------------------------------------------------------------------------
console.log('TEST 1-3: Register Fire Extinguisher with Hydro Testing Service');
const extinguisherData = {
  siteId: 'SITE-AIL-001',
  clientName: 'Aarti Industries Limited',
  siteName: 'Aarti Industries Ltd — Unit IV',
  area: 'Plant 1 — Distillation Section',
  location: 'Pillar D-14 South Wall',
  equipmentCategory: 'Fire Extinguisher',
  equipmentType: 'ABC Dry Chemical Powder (Stored Pressure)',
  serviceType: 'Hydro Testing & Pressurisation',
  serialNumber: 'IFS-TEST-EXT-9901',
  capacity: '6 Kg',
  manufacturer: 'Indus SafeGuard (IS 15683)',
  model: 'SP-ABC-6',
  manufacturingDate: '2024-02',
  installationDate: '2024-02-15',
  lastHptDate: '2024-02-15',
  nextHptDueDate: '2027-02-15',
  initialCondition: 'Active in Position'
};

const regExtResult = registerNewAsset(extinguisherData);

assert(regExtResult.success === true, 'Registration succeeded without error');
assert(regExtResult.position !== undefined, 'AssetPosition record created');
assert(regExtResult.position.positionId.startsWith('IFS-POS-'), `Unique Position ID generated (${regExtResult.position.positionId})`);
assert(regExtResult.qrCode.startsWith('IFS-QR-'), `Unique QR code generated (${regExtResult.qrCode})`);
assert(regExtResult.templateId === 'CL-11', `Correct checklist CL-11 automatically assigned for Hydro Testing (got ${regExtResult.templateId})`);
assert(regExtResult.position.currentEquipment.serialNo === 'IFS-TEST-EXT-9901', 'Physical unit serial number properly mapped to active unit');

// Test Duplicate Serial Number Prevention at same site
console.log('\nTEST: Duplicate Serial Number Prevention');
const duplicateReg = registerNewAsset(extinguisherData);
assert(duplicateReg.success === false, 'Duplicate serial number registration was rejected');
assert(duplicateReg.error.includes('already registered at this site'), 'Helpful error message returned for duplicate serial');

// -----------------------------------------------------------------------------
// TEST 4: Generate, Render & Download QR Code
// -----------------------------------------------------------------------------
console.log('\nTEST 4: QR Code Generation & Sticker Rendering');
let qrDataUrl = null;
await new Promise((resolve) => {
  QRCode.toDataURL(regExtResult.qrCode, { width: 300, margin: 2 }, (err, url) => {
    assert(!err && typeof url === 'string' && url.startsWith('data:image/png;base64,'), 'QR code rendered into valid Base64 PNG data URL');
    qrDataUrl = url;
    resolve();
  });
});

// -----------------------------------------------------------------------------
// TEST 5 & 6: Scan QR Code, Open Correct Asset & Load Assigned Checklist
// -----------------------------------------------------------------------------
console.log('\nTEST 5-6: Scan Existing QR Code & Auto-Load Assigned Checklist');
const scannedAsset = getPositionByQR(regExtResult.qrCode);
assert(scannedAsset !== null, 'Scanned QR code resolves registered asset position');
assert(scannedAsset.positionId === regExtResult.position.positionId, 'Resolved position ID strictly matches original registered asset');
assert(scannedAsset.templateId === 'CL-11', 'Assigned template CL-11 is loaded directly for inspection');
assert(scannedAsset.currentEquipment.serialNo === 'IFS-TEST-EXT-9901', 'Currently mounted physical unit correctly identified');

// -----------------------------------------------------------------------------
// TEST 7 & 8: Complete Inspection & Retain Inspection History
// -----------------------------------------------------------------------------
console.log('\nTEST 7-8: Complete Checklist Inspection & Verify Retained History');
const visit = getActiveVisit('SITE-AIL-001');

const inspectionPayload = {
  templateId: scannedAsset.templateId,
  docNo: 'IFSPL/M&M/CL/011',
  sopNo: 'IFSPL/M&M/SOP/011',
  items: {
    1: { status: 'OK', reason: '', photo: null },
    2: { status: 'OK', reason: '', photo: null },
    3: { status: 'OK', reason: '', photo: null },
    4: { status: 'OK', reason: '', photo: null },
    5: { status: 'OK', reason: '', photo: null },
    6: { status: 'OK', reason: '', photo: null },
    7: { status: 'NA', reason: 'Stored pressure nitrogen sealed', photo: null },
    8: { status: 'OK', reason: '', photo: null },
    9: { status: 'OK', reason: '', photo: null }
  },
  remarks: 'Statutory 35 Bar hydro test completed. Gauge calibrated, shell intact.',
  counts: { totalItems: 9, okCount: 8, notOkCount: 0, naCount: 1 }
};

const saveResult = saveChecklistResult(visit.visitId, scannedAsset.positionId, {
  ...inspectionPayload,
  technicianName: 'Ramesh Patel',
  technicianBadge: 'IFS-SE-041'
});
assert(saveResult.success === true, 'Inspection visit checklist recorded successfully');

// Reopen same QR code and confirm inspection history is retained
const reopenedAsset = getPositionByQR(regExtResult.qrCode);
assert(reopenedAsset.inspectionStatus === 'Inspected - OK', 'Asset position status updated to "Inspected - OK"');
assert(reopenedAsset.inspectionHistory && reopenedAsset.inspectionHistory.length >= 1, 'Inspection history log retained on asset position');
assert(reopenedAsset.inspectionHistory[0].templateId === 'CL-11', 'History record links to CL-11');
assert(reopenedAsset.inspectionHistory[0].unitSerialNo === 'IFS-TEST-EXT-9901', 'History record links to exact unit serial number tested');
assert(reopenedAsset.inspectionHistory[0].technicianName === 'Ramesh Patel', 'Inspection history captures technician who inspected');
assert(reopenedAsset.inspectionHistory[0].inspectedAt !== undefined, 'Inspection submission exact timestamp captured');
assert(reopenedAsset.inspectionHistory[0].inspectionDate !== undefined, 'Inspection submission date captured');

// -----------------------------------------------------------------------------
// TEST 9: Register Delivery Hose Box & Verify Automatic CL-03 Mapping
// -----------------------------------------------------------------------------
console.log('\nTEST 9: Register Delivery Hose Box & Automatic CL-03 Mapping');
const hoseBoxData = {
  siteId: 'SITE-AIL-001',
  clientName: 'Aarti Industries Limited',
  siteName: 'Aarti Industries Ltd — Unit IV',
  area: 'Tank Farm East Gate',
  location: 'Hydrant Post HP-11',
  equipmentCategory: 'Delivery Hose Box',
  equipmentType: 'Double Door LDPE Weatherproof Hose Box',
  serviceType: 'Hose Box Servicing & Maintenance',
  serialNumber: 'HB-AIL-TEST-88',
  capacity: '2x 15m Hoses + Branch',
  manufacturer: 'Indus SafeGuard (IS 5)',
  model: 'LDPE-DD-01',
  manufacturingDate: '2023-11'
};

const regHbResult = registerNewAsset(hoseBoxData);
assert(regHbResult.success === true, 'Hose Box registration succeeded');
assert(regHbResult.templateId === 'CL-03', `Correct checklist CL-03 automatically assigned (got ${regHbResult.templateId})`);
assert(regHbResult.position.positionId.startsWith('IFS-POS-'), 'Unique Position ID generated for Hose Box');

// -----------------------------------------------------------------------------
// TEST 10: Unknown QR Handling & Manual ID Entry
// -----------------------------------------------------------------------------
console.log('\nTEST 10: Unknown QR Codes & Manual ID Entry Fallback');
const unknownQR = 'IFS-QR-UNKNOWN-999999';
const unknownLookup = getPositionByQR(unknownQR);
assert(unknownLookup === null, 'Unknown QR lookup returns null, never opens a random asset');

// Manual ID resolution works identically to QR resolution
const manualResolved = getPositionByQR(regHbResult.position.positionId);
assert(manualResolved !== null && manualResolved.positionId === regHbResult.position.positionId, 'Manual entry of Position ID resolves same asset position');

// -----------------------------------------------------------------------------
// TEST 11: Edit Asset Details While Preserving Immutable QR Code
// -----------------------------------------------------------------------------
console.log('\nTEST 11: Edit Asset Details and Confirm QR Remains Unchanged');
const posBeforeEdit = getPositionById(regExtResult.position.positionId);
const originalQR = posBeforeEdit.qrCode;
const originalPosId = posBeforeEdit.positionId;

const editResult = updateAssetDetails(regExtResult.position.positionId, {
  area: 'Plant 1 — Solvent Distillation (Relocated Bay)',
  location: 'Pillar D-14 South Wall (Moved 2m Left)',
  notes: 'Mounting bracket reinforced with M10 expansion bolts'
});

assert(editResult.success === true, 'Asset details updated successfully');
const posAfterEdit = getPositionById(regExtResult.position.positionId);
assert(posAfterEdit.qrCode === originalQR, `CRITICAL: Permanent QR Code (${posAfterEdit.qrCode}) remains strictly UNCHANGED`);
assert(posAfterEdit.positionId === originalPosId, `CRITICAL: Permanent Position ID (${posAfterEdit.positionId}) remains strictly UNCHANGED`);
assert(posAfterEdit.area === 'Plant 1 — Solvent Distillation (Relocated Bay)', 'Updated area reflected in record');

// -----------------------------------------------------------------------------
// TEST 12: Cylinder Replacement Retains Position QR & Separates Histories
// -----------------------------------------------------------------------------
console.log('\nTEST 12: Cylinder Swap at Position Retaining QR & Separating History');
const swapResult = replaceEquipmentAtPosition(regExtResult.position.positionId, {
  reason: 'Routine swap for off-site IS 2190 hydro test lot',
  removedDestination: 'IFS Central Hydro Lab Vadodara',
  newSerialNo: 'IFS-2024-DCP-SWAP-9902',
  newCapacity: '6 Kg',
  newType: 'ABC Dry Chemical Powder (Stored Pressure)',
  technicianName: 'Ramesh Patel'
});

assert(swapResult.success === true, 'Cylinder swap succeeded');
const posAfterSwap = getPositionById(regExtResult.position.positionId);
assert(posAfterSwap.qrCode === originalQR, 'Position QR code retained unchanged after cylinder replacement');
assert(posAfterSwap.positionId === originalPosId, 'Position ID retained unchanged after cylinder replacement');
assert(posAfterSwap.currentEquipment.serialNo === 'IFS-2024-DCP-SWAP-9902', 'Active unit is now the replacement cylinder');
assert(posAfterSwap.history.length >= 1, 'Lifecycle history created for cylinder swap event');
assert(posAfterSwap.history[0].removedCylinder.serialNo === 'IFS-TEST-EXT-9901', 'Removed cylinder serial recorded in history');
assert(posAfterSwap.history[0].replacementCylinder.serialNo === 'IFS-2024-DCP-SWAP-9902', 'Replacement cylinder serial recorded separately');

// -----------------------------------------------------------------------------
// TEST 13: Configurable Template Mapping & Unmapped Warnings
// -----------------------------------------------------------------------------
console.log('\nTEST 13: Configurable Checklist Template Mapping & Unmapped Warnings');
// Routine Extinguisher check maps to CL-26
const routineExtMapping = resolveChecklistMapping('Fire Extinguisher', 'Routine Servicing / Inspection');
assert(routineExtMapping.success === true && routineExtMapping.checklistTemplateId === 'CL-26', 'Routine Extinguisher maps to CL-26 (NOT CL-11)');

// Unmapped equipment category/service returns warning
const unmapped = resolveChecklistMapping('Fire Pumpset', 'Pump Flow & Cut-in Pressure Test');
assert(unmapped.success === false, 'Unmapped category/service returns success=false');
assert(unmapped.checklistTemplateId === null, 'Does NOT silently assign an unrelated checklist');
assert(unmapped.warning.includes('No applicable checklist template configured'), 'Returns clear warning message for unmapped service');

// -----------------------------------------------------------------------------
// TEST 14: Equipment Master List & Linked Target Service Automatic Binding
// -----------------------------------------------------------------------------
console.log('\nTEST 14: Specific Equipment Type & Linked Target Service Master');
const masterList = getEquipmentMaster();
assert(masterList.length >= 17, `Master list loaded with ${masterList.length} specific equipment types`);

const waterCo2 = masterList.find(e => e.equipmentType === 'Water CO2 Fire Extinguisher');
assert(waterCo2 !== undefined, 'Water CO2 Fire Extinguisher exists in master list');
assert(waterCo2.linkedServices.some(s => s.serviceType === 'Hydro Testing & Pressurisation'), 'Water CO2 is linked to Hydro Testing & Pressurisation');
assert(waterCo2.linkedServices.some(s => s.serviceType === 'Water Discharge & Cylinder Overhaul'), 'Water CO2 is linked to Water Discharge & Cylinder Overhaul');

// Add new equipment and link custom target service type
const newEq = addEquipmentMasterItem({
  category: 'Clean Agent Extinguisher',
  equipmentType: 'Inert Gas IG-541 Cylinder System',
  defaultCapacity: '80 Ltr 200 Bar',
  initialServiceType: 'IG-541 Discharge & Nozzle Test',
  initialTemplateId: 'CL-18'
});

assert(newEq.equipmentType === 'Inert Gas IG-541 Cylinder System', 'New specific equipment type added to master');
assert(newEq.linkedServices[0].serviceType === 'IG-541 Discharge & Nozzle Test', 'Initial target service linked to new equipment');

// Verify automatic resolution of linked service for this specific equipment type
const resolvedCustom = resolveChecklistMapping('Clean Agent Extinguisher', 'IG-541 Discharge & Nozzle Test', 'Inert Gas IG-541 Cylinder System');
assert(resolvedCustom.success === true && resolvedCustom.checklistTemplateId === 'CL-18', 'Auto-resolved checklist CL-18 from equipment-linked service');

// -----------------------------------------------------------------------------
// TEST 15: Client Autofetch on Asset Registration (Non-Editable Client Dossier)
// -----------------------------------------------------------------------------
console.log('\nTEST 15: Asset Registration Auto-Fetches Client Details from Client Selection');
const clientRegResult = registerNewAsset({
  siteId: 'SITE-ATL-002',
  area: 'Warehouse Section B',
  location: 'Pillar 14 - North Exit',
  equipmentCategory: 'Delivery Hose Box',
  equipmentType: 'Double Door LDPE Weatherproof Hose Box',
  serviceType: 'Hose Box Servicing & Maintenance',
  serialNumber: `HB-AUTOFETCH-${Date.now()}`,
  capacity: '15m x 63mm',
  manufacturer: 'Indus SafeGuard'
});

assert(clientRegResult.success === true, 'Asset registered with selected client ID');
const registeredPos = clientRegResult.position;
assert(registeredPos.clientName === 'Zaraka Lifestyle', 'Auto-fetched Client Name matches selected client master');
assert(registeredPos.poNumber === 'PO/ATL/SAFE/2026/4401', 'Auto-fetched PO Number matches client master');
assert(registeredPos.poDate === '2026-01-01', 'Auto-fetched PO Date matches client master');
assert(registeredPos.amcType === 'Monthly', 'Auto-fetched AMC Type matches client master');
assert(registeredPos.noOfVisits === 12, 'Auto-fetched Number of Visits matches client master');
assert(registeredPos.amcExpiryDate === '2026-12-31', 'Auto-fetched AMC Expiry Date matches client master');
assert(registeredPos.taxId === '24AABCA5678G2Z3', 'Auto-fetched Client GSTIN/Tax ID matches client master');
assert(registeredPos.city === 'Valsad / Atul', 'Auto-fetched City matches client master');

// -----------------------------------------------------------------------------
// TEST 16: Linked Equipment Capacity / Rating Dropdown Options
// -----------------------------------------------------------------------------
console.log('\nTEST 16: Linked Equipment Capacity / Rating Dropdown Options');
const waterCo2Caps = getLinkedCapacities('Water CO2 Fire Extinguisher');
assert(waterCo2Caps.includes('9 Ltr'), 'Water CO2 includes 9 Ltr standard capacity');
assert(waterCo2Caps.includes('6 Ltr'), 'Water CO2 includes 6 Ltr portable capacity');
assert(waterCo2Caps.some(c => c.includes('50 Ltr')), 'Water CO2 includes 50 Ltr mobile trolley capacity');

const abcCaps = getLinkedCapacities('ABC Dry Chemical Powder (Stored Pressure)');
assert(abcCaps.includes('6 Kg'), 'ABC Powder includes 6 Kg standard capacity');
assert(abcCaps.includes('4 Kg') && abcCaps.includes('9 Kg'), 'ABC Powder includes 4 Kg and 9 Kg capacities');

const co2Caps = getLinkedCapacities('CO2 Gas Fire Extinguisher');
assert(co2Caps.includes('4.5 Kg'), 'CO2 Gas includes 4.5 Kg standard capacity');
assert(co2Caps.includes('2 Kg') && co2Caps.includes('9 Kg'), 'CO2 Gas includes 2 Kg and 9 Kg capacities');

const hoseBoxCaps = getLinkedCapacities('Double Door LDPE Weatherproof Hose Box');
assert(hoseBoxCaps.includes('2 x 15m Hoses + Branch Pipe'), 'Hose Box includes dual 15m hose capacity');

const landingValveCaps = getLinkedCapacities('Single Outlet Landing Valve (IS 5290)');
assert(landingValveCaps.includes('63mm Female Instantaneous'), 'Landing valve includes 63mm instantaneous rating');

// -----------------------------------------------------------------------------
// TEST 17: Supabase Cloud Database Backup & Replication Generation
// -----------------------------------------------------------------------------
console.log('\nTEST 17: Supabase Cloud Database Backup & Replication Generation');
const generatedSQL = generateSupabaseSQLBackup();
assert(typeof generatedSQL === 'string' && generatedSQL.length > 25000, 'Generated Supabase SQL backup exceeds 25KB');
assert(generatedSQL.includes('CREATE TABLE IF NOT EXISTS public.sites'), 'Schema contains public.sites table definition');
assert(generatedSQL.includes('CREATE TABLE IF NOT EXISTS public.equipment_master'), 'Schema contains public.equipment_master table');
assert(generatedSQL.includes('CREATE TABLE IF NOT EXISTS public.template_mappings'), 'Schema contains public.template_mappings table');
assert(generatedSQL.includes('CREATE TABLE IF NOT EXISTS public.plant_technicians'), 'Schema contains public.plant_technicians table');
assert(generatedSQL.includes('CREATE TABLE IF NOT EXISTS public.positions'), 'Schema contains public.positions table');
assert(generatedSQL.includes('CREATE TABLE IF NOT EXISTS public.visits'), 'Schema contains public.visits table');
assert(generatedSQL.includes('ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY'), 'RLS enabled for sites');
assert(generatedSQL.includes('ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY'), 'RLS enabled for positions');
assert(generatedSQL.includes('CREATE POLICY "Public access to positions"'), 'Permissive RLS policy created for positions');
assert(generatedSQL.includes('po_number, po_date, amc_type, frequency, no_of_visits, amc_expiry_date'), 'Sites insert includes all PO & AMC contract columns');
assert(generatedSQL.includes('capacities JSONB'), 'Equipment master schema supports linked capacities JSONB');
assert(generatedSQL.includes('QR-POS-AIL-001'), 'Includes permanent QR tag seed data for Aarti Industries');

const generatedJSON = generateJSONBackup();
assert(generatedJSON.tables && Array.isArray(generatedJSON.tables.sites), 'JSON backup exports sites table');
assert(generatedJSON.tables && Array.isArray(generatedJSON.tables.positions), 'JSON backup exports positions table');
assert(generatedJSON.tables && Array.isArray(generatedJSON.tables.visits), 'JSON backup exports visits table');

const sqlFileOnDisk = fs.existsSync('./supabase_schema_backup.sql');
assert(sqlFileOnDisk, 'Physical file supabase_schema_backup.sql exists on disk in project root');
const sqlFileStats = fs.statSync('./supabase_schema_backup.sql');
assert(sqlFileStats.size > 40000, `Physical file size is valid (>40KB, got ${sqlFileStats.size} bytes)`);

console.log('\n================================================================');
console.log(` TOTAL WORKFLOW CHECKS: ${passed + failed}`);
console.log(` PASSED: ${passed}`);
console.log(` FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
