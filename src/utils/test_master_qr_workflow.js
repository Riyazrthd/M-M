// Test Suite for Master QR Workflow: Bulk QR Generation, Permanent Registry, Label Specs & Checklist Inspection
import { 
  initStorage, 
  getQRRegistry, 
  getQRSequence, 
  generateBulkQRCodes, 
  getQRRecordByToken, 
  assignQRToAsset, 
  resolveScannedAssetPosition, 
  registerNewAsset, 
  getPositions, 
  getActiveVisit,
  getChecklistSession, 
  submitAssetObservation, 
  completeChecklistSession,
  STORAGE_KEYS
} from '../data/storage.js';

import { generateBulkQRLabelsPDF, generatePrintableHTML } from './qrLabelPDFExporter.js';
import { generateSupabaseSQLBackup, generateJSONBackup } from '../services/supabaseBackup.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

export async function runMasterQRTests() {
  console.log('================================================================');
  console.log(' MASTER PROMPT VERIFICATION: BULK QR, REGISTRY & CHECKLIST');
  console.log('================================================================\n');

  initStorage();

  // -------------------------------------------------------------
  // MODULE 1: Bulk QR Code Generation in Advance
  // -------------------------------------------------------------
  console.log('TEST 1: Bulk QR Generation in Advance without Asset Information');
  const initialReg = getQRRegistry();
  const initialCount = initialReg.length;
  const initialSeq = getQRSequence();

  // Generate 50 QR codes
  const batch1 = generateBulkQRCodes(50, { generatedBy: 'Admin (Ramesh Patel)', batchLabel: 'Plant Ground Floor Batch' });
  assert(batch1.success === true, 'Bulk generation of 50 QR codes succeeded');
  assert(batch1.records.length === 50, 'Returned exactly 50 QR code records');
  assert(batch1.startSeq === initialSeq + 1, `Sequence starts from next number: ${initialSeq + 1}`);
  assert(batch1.endSeq === initialSeq + 50, `Sequence ends at: ${initialSeq + 50}`);

  const sample1 = batch1.records[0];
  assert(sample1.token.startsWith('IFS-QR-'), `QR Token formatted properly: ${sample1.token}`);
  assert(sample1.displayNo.startsWith('SR. NO. '), `Display number formatted properly: ${sample1.displayNo}`);
  assert(sample1.assignmentStatus === 'Available', 'Initial assignment status is "Available"');
  assert(sample1.linkedAssetId === null, 'Linked Asset ID is null before registration');
  assert(sample1.lifecycleStatus === 'Active', 'Lifecycle status is "Active"');

  // -------------------------------------------------------------
  // MODULE 1 & 10: Permanent Registry & Continuity Across Batches
  // -------------------------------------------------------------
  console.log('\nTEST 2: Sequential Continuity Across Multiple Batches & Duplicate Prevention');
  // Generate another batch of 100 QR codes
  const batch2 = generateBulkQRCodes(100, { generatedBy: 'Admin (Ramesh Patel)', batchLabel: 'First Floor Batch' });
  assert(batch2.success === true, 'Bulk generation of second batch (100 QR codes) succeeded');
  assert(batch2.records.length === 100, 'Returned exactly 100 QR records');
  assert(batch2.startSeq === batch1.endSeq + 1, `Second batch continuous from first batch (${batch1.endSeq + 1})`);
  assert(batch2.endSeq === batch1.endSeq + 100, `Second batch ends at ${batch1.endSeq + 100}`);

  // Verify all tokens and display numbers across all records are unique
  const fullRegistry = getQRRegistry();
  const tokenSet = new Set(fullRegistry.map(r => r.token));
  const seqSet = new Set(fullRegistry.map(r => r.seqNumber));
  assert(tokenSet.size === fullRegistry.length, `CRITICAL: 100% Unique QR Tokens (${tokenSet.size}/${fullRegistry.length}) - 0 Duplicates`);
  assert(seqSet.size === fullRegistry.length, `CRITICAL: 100% Unique Sequential Numbers (${seqSet.size}/${fullRegistry.length}) - 0 Duplicates`);

  // -------------------------------------------------------------
  // MODULE 2: Printable 25mm x 25mm QR Label Generator Specs
  // -------------------------------------------------------------
  console.log('\nTEST 3: Physical Label Dimensions & Print Instruction Specifications');
  const sampleRecords = fullRegistry.slice(0, 35); // 1 full A4 page of 35 labels
  
  // Test PDF generation without crashing in Node/mock environment
  try {
    const pdfDoc = await generateBulkQRLabelsPDF(sampleRecords, { saveToFile: false });
    assert(pdfDoc !== null && typeof pdfDoc === 'object', 'jsPDF vector document created successfully');
  } catch (e) {
    assert(false, `generateBulkQRLabelsPDF failed: ${e.message}`);
  }

  // Test Printable HTML preview
  const htmlPreview = generatePrintableHTML(sampleRecords, { title: 'Test Print' });
  assert(htmlPreview.includes('25mm'), 'HTML contains explicit physical width "25mm" for QR code');
  assert(htmlPreview.includes('SR. NO.'), 'HTML contains centered "SR. NO." directly below QR code');
  assert(htmlPreview.includes('Print at 100% / Actual Size') && htmlPreview.includes('Fit to Page'), 'HTML includes mandatory print scaling instruction');
  assert(htmlPreview.includes('table-layout: fixed') || htmlPreview.includes('display: grid'), 'HTML layout uses fixed grid structure');

  // -------------------------------------------------------------
  // MODULE 3: Technician Scan & Registration Workflow
  // -------------------------------------------------------------
  console.log('\nTEST 4: Unassigned QR Scanning -> Pre-filled Asset Registration');
  // Grab an available QR code from batch1
  const availableQR = batch1.records[5];
  
  // 1. Scan unassigned QR code
  const scanResult = resolveScannedAssetPosition(availableQR.token);
  assert(scanResult !== null && scanResult.isUnassignedQR === true, 'Scanned unassigned QR code identified as unassigned label');
  assert(scanResult.qrRecord.token === availableQR.token, 'QR token matches scanned label');
  assert(scanResult.displayNo === availableQR.displayNo, 'Display number matches scanned label');

  // 2. Technician registers equipment using this pre-printed QR label
  const newAssetPayload = {
    siteId: 'SITE-AIL-001',
    area: 'Plant 1 — Synthesis Block B',
    location: 'Near Column B-12',
    equipmentCategory: 'Fire Extinguisher',
    equipmentType: 'ABC Dry Chemical Powder (Stored Pressure)',
    serviceType: 'Hydro Testing & Pressurisation',
    equipmentName: 'ABC 6 Kg Extinguisher',
    manufacturer: 'Indus SafeGuard (IS 15683)',
    model: 'SP-ABC-6',
    serialNumber: `IFS-TEST-SN-${Date.now()}`,
    capacity: '6 Kg',
    assignedQRToken: availableQR.token,
    assignedBy: 'Ramesh Patel (Field Technician)'
  };

  const regResult = registerNewAsset(newAssetPayload);
  assert(regResult.success === true, 'Asset registration with pre-printed QR code succeeded');
  assert(regResult.position.qrCode === availableQR.token, 'Permanent position QR code bound to scanned token');

  // 3. Verify status in QR registry transitioned to 'Assigned'
  const updatedQR = getQRRecordByToken(availableQR.token);
  assert(updatedQR.assignmentStatus === 'Assigned', 'QR status in registry transitioned to "Assigned"');
  assert(updatedQR.linkedPositionId === regResult.position.positionId, 'QR linkedPositionId matches asset position ID');
  assert(updatedQR.assignedBy === 'Ramesh Patel (Field Technician)', 'QR assignedBy captures technician name');

  // 4. Test Duplicate Assignment Prevention: Attempting to assign the same QR code to another asset must FAIL
  const duplicateAttemptPayload = {
    siteId: 'SITE-AIL-001',
    area: 'Plant 1 — Workshop Area',
    location: 'Near Entrance',
    equipmentCategory: 'Fire Extinguisher',
    equipmentType: 'Water CO2 Fire Extinguisher',
    serviceType: 'Hydro Testing & Pressurisation',
    serialNumber: `IFS-TEST-DUP-${Date.now()}`,
    capacity: '9 Ltr',
    assignedQRToken: availableQR.token
  };
  const dupResult = registerNewAsset(duplicateAttemptPayload);
  assert(dupResult.success === false, 'CRITICAL: Rejects duplicate assignment of already assigned QR label');
  assert(dupResult.error.includes('already assigned'), 'Provides descriptive error explaining QR is already assigned');

  // 5. Scan already assigned QR code: must open asset directly
  const assignedScanResult = resolveScannedAssetPosition(availableQR.token);
  assert(assignedScanResult.isUnassignedQR !== true, 'Assigned QR code is NOT treated as unassigned');
  assert(assignedScanResult.positionId === regResult.position.positionId, 'Resolves directly to registered asset position');

  // -------------------------------------------------------------
  // MODULES 4-9: Landscape Checklist & Sequential Multi-Asset Inspection
  // -------------------------------------------------------------
  console.log('\nTEST 5: Multi-Asset Sequential Inspection in Same Checklist Session');
  // Get two distinct assets: an existing position and our newly registered position
  const allPositions = getPositions();
  const asset1 = allPositions.find(p => p.positionId !== regResult.position.positionId) || allPositions[1];
  const asset2 = regResult.position;

  // Dedicated visit for pristine isolated multi-asset test
  const testVisitId = `VISIT-TEST-MULTI-${Date.now()}`;
  const visits = JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
  visits.unshift({
    visitId: testVisitId,
    siteId: 'SITE-AIL-001',
    date: '2026-10-28',
    serviceEngineer: 'Ramesh Patel',
    technicianName: 'Ramesh Patel',
    status: 'In Progress',
    checklistAnswers: {},
    checklistSessions: {}
  });
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

  const visitId = testVisitId;

  // Session for CL-11
  const session = getChecklistSession(visitId, 'CL-11');
  assert(session !== null, 'Checklist session initialized for CL-11');

  // Submit first asset observation
  const obs1 = {
    positionId: asset1.positionId,
    assetName: asset1.equipmentType || 'Water CO2 Fire Extinguisher',
    serialNo: asset1.currentEquipment?.serialNo || 'SN-001',
    location: `${asset1.area} / ${asset1.location}`,
    answers: { 1: 'OK', 2: 'OK', 3: 'OK', 4: 'OK', 5: 'OK', 6: 'OK', 7: 'OK', 8: 'OK', 9: 'OK' },
    remarks: 'Routine inspection passed, pressure normal',
    technicianName: 'Ramesh Patel',
    technicianBadge: 'IFS-SE-041'
  };

  const sub1 = submitAssetObservation(visitId, 'CL-11', obs1);
  assert(sub1.success === true, 'Observation 1 submitted successfully');
  assert(sub1.record.sn === 1, 'First inspection recorded as Serial No. 1');
  assert(sub1.record.isLocked === true, 'First inspection observation is permanently locked');
  assert(sub1.record.submissionDate !== undefined && sub1.record.submissionTime !== undefined, 'First inspection captures date and time');
  assert(sub1.record.technicianName === 'Ramesh Patel', 'First inspection captures technician name');

  // Submit second asset observation under the SAME checklist
  const obs2 = {
    positionId: asset2.positionId,
    assetName: asset2.equipmentType || 'ABC Dry Chemical Powder',
    serialNo: asset2.currentEquipment?.serialNo || 'SN-002',
    location: `${asset2.area} / ${asset2.location}`,
    answers: { 1: 'OK', 2: 'OK', 3: 'OK', 4: 'OK', 5: 'OK', 6: 'OK', 7: 'OK', 8: 'OK', 9: 'OK' },
    remarks: 'Gauge in green, seal intact',
    technicianName: 'Ramesh Patel',
    technicianBadge: 'IFS-SE-041'
  };

  const sub2 = submitAssetObservation(visitId, 'CL-11', obs2);
  assert(sub2.success === true, 'Observation 2 submitted successfully in same checklist');
  assert(sub2.record.sn === 2, 'Second inspection recorded as Serial No. 2 (Sequence continuous)');
  assert(sub2.record.isLocked === true, 'Second inspection observation is permanently locked');

  // Verify session state contains both submitted records intact without overwriting
  const updatedSession = getChecklistSession(visitId, 'CL-11');
  assert(updatedSession.records.length >= 2, 'Session maintains multiple asset inspection records together');
  const rec1 = updatedSession.records.find(r => r.sn === 1);
  const rec2 = updatedSession.records.find(r => r.sn === 2);
  assert(rec1 !== undefined && rec1.positionId === asset1.positionId, 'Record #1 preserved without overwrite');
  assert(rec2 !== undefined && rec2.positionId === asset2.positionId, 'Record #2 preserved without overwrite');

  // Complete checklist session
  const completeRes = completeChecklistSession(visitId, 'CL-11');
  assert(completeRes.success === true, 'Checklist session finalized successfully');

  // -------------------------------------------------------------
  // MODULE 10: Supabase Cloud Schema & Backup
  // -------------------------------------------------------------
  console.log('\nTEST 6: Supabase Cloud Schema with QR Registry Table');
  const sqlBackup = generateSupabaseSQLBackup();
  assert(sqlBackup.includes('CREATE TABLE IF NOT EXISTS public.qr_registry'), 'SQL schema defines public.qr_registry table');
  assert(sqlBackup.includes('token VARCHAR(128) NOT NULL UNIQUE'), 'token has UNIQUE constraint');
  assert(sqlBackup.includes('display_no VARCHAR(64) NOT NULL UNIQUE'), 'display_no has UNIQUE constraint');
  assert(sqlBackup.includes('seq_number INTEGER NOT NULL UNIQUE'), 'seq_number has UNIQUE constraint');
  assert(sqlBackup.includes('idx_qr_registry_token'), 'Performance index on token created');
  assert(sqlBackup.includes('idx_qr_registry_seq'), 'Performance index on seq_number created');
  assert(sqlBackup.includes('Public access to qr_registry'), 'RLS policy created for qr_registry');

  const jsonBackup = generateJSONBackup();
  assert(Array.isArray(jsonBackup.tables.qr_registry), 'JSON backup includes qr_registry table');
  assert(jsonBackup.tables.qr_registry.length > 0, `JSON backup exports all permanent QR records (${jsonBackup.tables.qr_registry.length})`);

  console.log('\n================================================================');
  console.log(` TOTAL TESTS: ${passed + failed}`);
  console.log(` PASSED: ${passed}`);
  console.log(` FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    throw new Error(`${failed} tests failed!`);
  }
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('test_master_qr_workflow')) {
  runMasterQRTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
