/**
 * AUTOMATED VERIFICATION SUITE: SMART SITE INSPECTION TRACKING & MANDATORY COMPLETION VALIDATION
 * Covers all 9 required test cases:
 *  1. 100 assets registered, 60 inspected -> Total=100, Inspected=60, Pending=40, Pending list=40
 *  2. 100 assets, all 100 inspected -> Pending=0, Completion allowed (Status = 'Completed')
 *  3. 100 assets, 97 inspected, 3 pending -> Completion blocked without reasons, 3 missing identified
 *  4. Reasons given for only 2 of 3 pending assets -> Completion still blocked, 1 missing identified
 *  5. Reasons given for all 3 pending assets -> Completion succeeds with status 'Completed with Exceptions'
 *  6. Page reload simulation -> All inspection records, justifications, and progress 100% retained
 *  7. Duplicate QR scan -> Re-scanning same asset QR does not count twice
 *  8. Multi-device lookup -> Active inspection session retrieved consistently via database storage
 *  9. Exporter validation -> CSV / Excel pending list export schema and column accuracy
 */

import {
  initStorage,
  getSites,
  saveSites,
  getPositions,
  savePositions,
  getVisits,
  saveVisits,
  getActiveVisit,
  getPendingAssetsForSite,
  validateSiteInspectionCompletion,
  savePendingAssetJustifications,
  completeSiteInspection,
  saveChecklistResult,
  VALID_PENDING_REASONS
} from '../data/storage.js';

import { generatePendingAssetsCSVData } from './pendingAssetExporter.js';

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

export async function runInspectionCompletionTests() {
  console.log('================================================================');
  console.log(' SITE INSPECTION TRACKING & MANDATORY COMPLETION VALIDATION TEST');
  console.log('================================================================\n');

  // Setup simulated test environment with a large industrial plant (100 assets)
  const testSiteId = 'SITE-TEST-100';
  const testSite = {
    id: testSiteId,
    code: testSiteId,
    name: 'Reliance Petrochemicals Complex - Unit 7',
    plantFacility: 'Reliance Petrochemicals Complex - Unit 7',
    clientName: 'Reliance Industries Limited',
    city: 'Jamnagar',
    totalPositions: 100,
    inspectedPositions: 0
  };

  // Generate 100 mock asset positions for this site
  const testPositions = [];
  for (let i = 1; i <= 100; i++) {
    const pad = String(i).padStart(3, '0');
    testPositions.push({
      id: `POS-RIL-${pad}`,
      positionId: `POS-RIL-${pad}`,
      siteId: testSiteId,
      templateId: i % 2 === 0 ? 'CL-11' : 'CL-03',
      equipmentType: i % 2 === 0 ? 'CO2 Extinguisher 4.5kg' : 'Hydrant Valve Box',
      equipmentCategory: i % 2 === 0 ? 'Fire Extinguisher' : 'Hydrant System',
      qrCode: `QR-RIL-${pad}`,
      locationDescription: `Zone-${Math.ceil(i / 20)}, Floor 1, Pillar P-${pad}`,
      inspectionStatus: 'Pending Inspection',
      currentEquipment: {
        serialNumber: `SN-RIL-2026-${pad}`,
        type: i % 2 === 0 ? 'CO2 Extinguisher 4.5kg' : 'Hydrant Valve Box'
      }
    });
  }

  // Pre-seed storage
  initStorage();
  const currentSites = getSites().filter(s => s.id !== testSiteId);
  currentSites.push(testSite);
  saveSites(currentSites);

  const currentPositions = getPositions().filter(p => p.siteId !== testSiteId);
  savePositions([...currentPositions, ...testPositions]);

  // Clear existing test visits for this site
  const remainingVisits = getVisits().filter(v => v.siteId !== testSiteId);
  saveVisits(remainingVisits);

  // ────────────────────────────────────────────────────────────
  // TEST 1: 100 assets registered, 60 inspected
  // ────────────────────────────────────────────────────────────
  console.log('TEST 1: 100 Assets Registered, 60 Inspected Tracking');
  
  // Step 1: Scan first QR -> Automatic session start
  const activeVisit = getActiveVisit(testSiteId);
  assert(activeVisit && activeVisit.visitId, 'Active inspection session automatically initialized on first scan');
  assert(activeVisit.status === 'In Progress', 'Session status is "In Progress"');
  assert(activeVisit.startedAt && activeVisit.startDate, 'Session records inspection start date and timestamp');
  assert(activeVisit.totalAssets === 100, 'Total assets for site scheduled is 100');

  // Step 2: Inspect 60 assets
  for (let i = 0; i < 60; i++) {
    const pos = testPositions[i];
    saveChecklistResult({
      visitId: activeVisit.visitId,
      positionId: pos.positionId,
      templateId: pos.templateId,
      siteId: testSiteId,
      items: [{ itemId: '1', response: 'OK' }],
      status: 'OK',
      overallStatus: 'OK'
    });
  }

  const sessionAfter60 = getVisits().find(v => (v.visitId || v.id) === activeVisit.visitId);
  assert(sessionAfter60.inspectedAssets === 60, `Inspected assets count is exactly 60 (actual: ${sessionAfter60.inspectedAssets})`);
  assert(sessionAfter60.pendingAssets === 40, `Pending assets count is exactly 40 (actual: ${sessionAfter60.pendingAssets})`);
  assert(sessionAfter60.progressPct === 60, `Progress percentage is exactly 60% (actual: ${sessionAfter60.progressPct}%)`);

  const pendingList40 = getPendingAssetsForSite(testSiteId, activeVisit.visitId);
  assert(pendingList40.length === 40, `Downloadable pending list contains exactly 40 assets (actual: ${pendingList40.length})`);
  
  // Check that all 40 are indeed positions 61 to 100
  const expectedPendingIds = testPositions.slice(60).map(p => p.positionId);
  const actualPendingIds = pendingList40.map(p => p.positionId);
  const all40Match = expectedPendingIds.every(id => actualPendingIds.includes(id));
  assert(all40Match, 'Downloaded pending list contains the exact remaining 40 uninspected asset IDs');

  // ────────────────────────────────────────────────────────────
  // TEST 2: 100 assets, all 100 inspected -> Pending = 0, Completed allowed
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 2: 100 Assets, All 100 Inspected -> Direct Completion');
  
  // Create a separate clean site for 100% inspection test
  const cleanSiteId = 'SITE-TEST-100-FULL';
  const cleanSite = {
    id: cleanSiteId,
    code: cleanSiteId,
    name: 'Clean Petrochemicals Plant',
    totalPositions: 100
  };
  saveSites([...getSites(), cleanSite]);

  const cleanSitePositions = [];
  for (let i = 1; i <= 100; i++) {
    const pad = String(i).padStart(3, '0');
    cleanSitePositions.push({
      id: `POS-FULL-${pad}`,
      positionId: `POS-FULL-${pad}`,
      siteId: cleanSiteId,
      templateId: 'CL-11',
      equipmentType: 'ABC Powder Extinguisher',
      qrCode: `QR-FULL-${pad}`,
      inspectionStatus: 'Pending Inspection'
    });
  }
  savePositions([...getPositions(), ...cleanSitePositions]);
  
  const fullVisit = getActiveVisit(cleanSiteId);
  for (let i = 0; i < 100; i++) {
    saveChecklistResult({
      visitId: fullVisit.visitId,
      positionId: cleanSitePositions[i].positionId,
      templateId: 'CL-11',
      siteId: cleanSiteId,
      items: [{ itemId: '1', response: 'OK' }],
      status: 'OK'
    });
  }

  const fullValidation = validateSiteInspectionCompletion(fullVisit.visitId);
  assert(fullValidation.canComplete === true, 'Validation allows completion when 100% assets are inspected');
  assert(fullValidation.pendingCount === 0, 'Pending count is strictly 0');
  assert(fullValidation.missingJustifications.length === 0, 'No missing justifications required');

  const fullCompletionResult = completeSiteInspection(fullVisit.visitId, {
    clientWitnessName: 'Sanjay Mehta',
    technicianName: 'Ramesh Patel'
  });
  assert(fullCompletionResult.success === true, 'Site inspection marked completed successfully');
  assert(fullCompletionResult.visit.status === 'Completed', 'Final status is "Completed" (without exceptions)');
  assert(fullCompletionResult.visit.completedAt !== undefined, 'Completion timestamp is recorded in database');

  // ────────────────────────────────────────────────────────────
  // TEST 3: 100 assets, 97 inspected, 3 pending -> Completion BLOCKED
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 3: 100 Assets, 97 Inspected, 3 Pending -> Completion Blocked');
  
  // Inspect 37 more assets on the first site (so 60 + 37 = 97 inspected, 3 pending)
  for (let i = 60; i < 97; i++) {
    saveChecklistResult({
      visitId: activeVisit.visitId,
      positionId: testPositions[i].positionId,
      templateId: testPositions[i].templateId,
      siteId: testSiteId,
      items: [{ itemId: '1', response: 'OK' }],
      status: 'OK'
    });
  }

  const validation97 = validateSiteInspectionCompletion(activeVisit.visitId);
  assert(validation97.canComplete === false, 'Completion is strictly BLOCKED when 3 assets are pending without reasons');
  assert(validation97.pendingCount === 3, `Identifies exactly 3 pending assets (actual: ${validation97.pendingCount})`);
  assert(validation97.missingJustifications.length === 3, 'Requires justifications for all 3 pending assets');

  // Attempt forced completion without justifications -> must return false / block
  let blockedErrorThrown = false;
  try {
    const res = completeSiteInspection(activeVisit.visitId);
    if (!res || !res.success) blockedErrorThrown = true;
  } catch (err) {
    blockedErrorThrown = true;
  }
  assert(blockedErrorThrown, 'Backend/storage layer actively rejects completion without justifications');

  // ────────────────────────────────────────────────────────────
  // TEST 4: Partial justifications (2 of 3) -> Completion remains BLOCKED
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 4: Partial Justifications (2 of 3) -> Completion Remains Blocked');
  
  const pending3 = validation97.pendingList;
  const partialJustifications = {
    [pending3[0].positionId]: {
      reason: VALID_PENDING_REASONS[0], // "Asset Not Accessible / Area Locked"
      explanation: 'Key unavailable with site security shift in-charge',
      recordedBy: 'Ramesh Patel'
    },
    [pending3[1].positionId]: {
      reason: VALID_PENDING_REASONS[2], // "Site Hot Work in Progress"
      explanation: 'Active welding and gas cutting in vicinity of hydrant box',
      recordedBy: 'Ramesh Patel'
    }
  };

  savePendingAssetJustifications(activeVisit.visitId, partialJustifications);

  const validationPartial = validateSiteInspectionCompletion(activeVisit.visitId);
  assert(validationPartial.canComplete === false, 'Completion is STILL BLOCKED when only 2 of 3 pending assets are justified');
  assert(validationPartial.missingJustifications.length === 1, 'Clear validation report shows exactly 1 asset still missing a reason');
  assert(
    validationPartial.missingJustifications[0].positionId === pending3[2].positionId,
    `Identifies the exact missing asset (${pending3[2].positionId}) requiring justification`
  );

  // ────────────────────────────────────────────────────────────
  // TEST 5: All 3 pending justified -> Status: 'Completed with Exceptions'
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 5: All 3 Pending Justified -> Completed with Exceptions');

  const full3Justifications = {
    ...partialJustifications,
    [pending3[2].positionId]: {
      reason: 'Other (requires detailed explanation)',
      explanation: 'Temporary scaffolding installed directly in front of extinguisher cabinet during turnaround',
      recordedBy: 'Ramesh Patel'
    }
  };

  savePendingAssetJustifications(activeVisit.visitId, full3Justifications);

  const validationFull3 = validateSiteInspectionCompletion(activeVisit.visitId);
  assert(validationFull3.canComplete === true, 'Completion is ALLOWED when all 3 pending assets have valid justifications');
  assert(validationFull3.missingJustifications.length === 0, 'Zero missing justifications remain');
  assert(validationFull3.recommendation === 'Completed with Exceptions', 'System recommends status "Completed with Exceptions"');

  const exceptionCompletion = completeSiteInspection(activeVisit.visitId, {
    clientWitnessName: 'K. Patel',
    technicianName: 'Ramesh Patel'
  });

  assert(exceptionCompletion.success === true, 'Site inspection completion succeeds');
  assert(exceptionCompletion.visit.status === 'Completed with Exceptions', 'Visit status is strictly "Completed with Exceptions"');
  assert(Object.keys(exceptionCompletion.visit.pendingJustifications).length === 3, 'All 3 justifications permanently saved in visit record');
  assert(exceptionCompletion.visit.completedAt !== undefined, 'Completion timestamp saved');

  // ────────────────────────────────────────────────────────────
  // TEST 6: Page Reload Persistence
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 6: Page Reload Simulation & Database Persistence');

  // Re-read visits and positions from storage to simulate fresh page load
  const reloadedVisits = getVisits();
  const reloadedVisit = reloadedVisits.find(v => (v.visitId || v.id) === activeVisit.visitId);
  
  assert(reloadedVisit !== undefined, 'Visit record exists in database after simulated reload');
  assert(reloadedVisit.status === 'Completed with Exceptions', 'Status "Completed with Exceptions" preserved after reload');
  assert(reloadedVisit.inspectedAssets === 97, `Inspected assets count (97) preserved after reload (actual: ${reloadedVisit.inspectedAssets})`);
  assert(reloadedVisit.pendingAssets === 3, `Pending assets count (3) preserved after reload (actual: ${reloadedVisit.pendingAssets})`);
  assert(Object.keys(reloadedVisit.pendingJustifications).length === 3, 'All 3 pending justifications preserved after reload');
  assert(reloadedVisit.pendingJustifications[pending3[0].positionId].reason === VALID_PENDING_REASONS[0], 'First justification details intact');

  // ────────────────────────────────────────────────────────────
  // TEST 7: Duplicate QR Scan Prevention
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 7: Duplicate QR Scan Test (No Double Counting)');

  // Start another session
  const dupSiteId = 'SITE-DUP-TEST';
  const dupSitePositions = [
    { id: 'POS-DUP-1', positionId: 'POS-DUP-1', siteId: dupSiteId, templateId: 'CL-11', qrCode: 'QR-DUP-1' },
    { id: 'POS-DUP-2', positionId: 'POS-DUP-2', siteId: dupSiteId, templateId: 'CL-11', qrCode: 'QR-DUP-2' }
  ];
  savePositions([...getPositions(), ...dupSitePositions]);

  const dupVisit = getActiveVisit(dupSiteId);
  assert(dupVisit.totalAssets === 2, 'Total assets initialized to 2');

  // Scan and inspect POS-DUP-1 first time
  saveChecklistResult({
    visitId: dupVisit.visitId,
    positionId: 'POS-DUP-1',
    templateId: 'CL-11',
    siteId: dupSiteId,
    items: [{ itemId: '1', response: 'OK' }]
  });

  const dupAfter1 = getVisits().find(v => (v.visitId || v.id) === dupVisit.visitId);
  assert(dupAfter1.inspectedAssets === 1, 'First scan increments inspected count to 1');
  assert(dupAfter1.pendingAssets === 1, 'Pending count decrements to 1');

  // Scan and inspect POS-DUP-1 second time (duplicate scan)
  saveChecklistResult({
    visitId: dupVisit.visitId,
    positionId: 'POS-DUP-1',
    templateId: 'CL-11',
    siteId: dupSiteId,
    items: [{ itemId: '1', response: 'OK' }]
  });

  const dupAfter2 = getVisits().find(v => (v.visitId || v.id) === dupVisit.visitId);
  assert(dupAfter2.inspectedAssets === 1, 'DUPLICATE SCAN PREVENTED: Inspected count strictly remains 1 (not 2)');
  assert(dupAfter2.pendingAssets === 1, 'Pending count strictly remains 1');
  assert(dupAfter2.progressPct === 50, 'Progress percentage strictly remains 50%');

  // ────────────────────────────────────────────────────────────
  // TEST 8: Multi-Device / Concurrent Session Lookup
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 8: Multi-Device Continuity & Session Lookup');

  // When second device looks up active visit for site, it must retrieve the exact same session
  const sessionDevice2 = getActiveVisit(dupSiteId);
  assert(sessionDevice2.visitId === dupVisit.visitId, 'Multi-device lookup binds to identical active visit ID without creating duplicates');
  assert(sessionDevice2.inspectedAssets === 1, 'Device 2 immediately sees live inspected count from shared database');

  // ────────────────────────────────────────────────────────────
  // TEST 9: Pending Asset Exporter Schema & Output Validation
  // ────────────────────────────────────────────────────
  console.log('\nTEST 9: Downloadable Pending Asset List CSV / Excel Data Format');

  const csvOutput = generatePendingAssetsCSVData({
    site: testSite,
    visit: reloadedVisit,
    positions: pending3
  });

  assert(csvOutput.includes('PENDING ASSET INSPECTION LIST'), 'CSV output contains mandatory header');
  assert(csvOutput.includes('SR. No.'), 'CSV header includes SR. No.');
  assert(csvOutput.includes('Asset QR Number / QR ID'), 'CSV header includes Asset QR Number / QR ID');
  assert(csvOutput.includes('Asset Name / Equipment Description'), 'CSV header includes Asset Name');
  assert(csvOutput.includes('Asset Type'), 'CSV header includes Asset Type');
  assert(csvOutput.includes('Asset ID / Position ID'), 'CSV header includes Asset ID');
  assert(csvOutput.includes('Customer / Site Name'), 'CSV header includes Customer / Site Name');
  assert(csvOutput.includes('Location / Department / Position'), 'CSV header includes Location / Position');
  assert(csvOutput.includes('Inspection Status'), 'CSV header includes Inspection Status');

  // Verify all 3 pending positions appear in CSV
  const all3InCSV = pending3.every(p => csvOutput.includes(p.positionId));
  assert(all3InCSV, 'All pending asset positions are listed in exported CSV data');

  console.log('\n================================================================');
  console.log(` TOTAL WORKFLOW TESTS: ${passed + failed}`);
  console.log(` PASSED: ${passed}`);
  console.log(` FAILED: ${failed}`);
  console.log('================================================================\n');

  return { passed, failed };
}

// Auto-run if executed directly via node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('test_inspection_completion_workflow')) {
  runInspectionCompletionTests().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}
