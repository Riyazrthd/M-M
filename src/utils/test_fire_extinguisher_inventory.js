/**
 * AUTOMATED TEST SUITE: FIRE EXTINGUISHER INVENTORY & CLIENT-WISE BREAKDOWN
 * Covers all 8 verification requirements:
 *  1. KPI shows actual total registered extinguisher quantity
 *  2. Clicking KPI opens client-wise breakdown structure
 *  3. Client-wise quantities add up exactly to KPI grand total
 *  4. Selecting a client opens only that client's extinguishers
 *  5. Report contains only that client's extinguisher assets
 *  6. No other asset category (Hoses, Hydrants, Pumps) is included
 *  7. KPI & breakdown update dynamically when asset records change (register, retire, delete)
 *  8. Exporter produces all 14 required fields (Asset ID, QR, Type, Capacity, Make, Serial, etc.)
 */

import {
  initStorage,
  getSites,
  saveSites,
  getPositions,
  savePositions,
  isFireExtinguisherAsset,
  getRegisteredExtinguishers,
  getTotalExtinguishersCount,
  getClientExtinguisherBreakdown,
  registerNewAsset
} from '../data/storage.js';

import { downloadClientExtinguishersCSV } from './extinguisherExporter.js';

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

export async function runFireExtinguisherInventoryTests() {
  console.log('================================================================');
  console.log(' FIRE EXTINGUISHER INVENTORY & CLIENT BREAKDOWN VERIFICATION');
  console.log('================================================================\n');

  initStorage();

  // ────────────────────────────────────────────────────────────
  // TEST 1: KPI Total Calculation from Actual Database Records
  // ────────────────────────────────────────────────────────────
  console.log('TEST 1: Actual Registered Extinguisher Quantity');
  const allPositions = getPositions();
  const directExtinguishers = allPositions.filter(isFireExtinguisherAsset);
  const kpiTotal = getTotalExtinguishersCount();

  assert(kpiTotal > 0, `Total registered fire extinguishers count is greater than 0 (actual: ${kpiTotal})`);
  assert(kpiTotal === directExtinguishers.length, `KPI total (${kpiTotal}) matches exact database records filtered by extinguisher criteria (${directExtinguishers.length})`);

  // ────────────────────────────────────────────────────────────
  // TEST 2: Strict Exclusion of Other Asset Categories
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 2: Strict Category Exclusion (Hose Boxes, Hydrants, Pumps)');
  const hoseBoxes = allPositions.filter(p => p.templateId === 'CL-03' || (p.equipmentType && p.equipmentType.includes('Hose Box')));
  assert(hoseBoxes.length > 0, `Sample data contains ${hoseBoxes.length} delivery hose boxes`);

  const hoseBoxIncludedInExtinguishers = hoseBoxes.some(isFireExtinguisherAsset);
  assert(!hoseBoxIncludedInExtinguishers, 'CRITICAL: Delivery Hose Boxes (CL-03) are STRICTLY EXCLUDED from fire extinguisher count');

  // Verify non-extinguisher mock object
  const mockHydrant = {
    positionId: 'POS-HYD-099',
    equipmentType: 'Hydrant Valve Landing Post',
    equipmentCategory: 'Hydrant System',
    templateId: 'CL-02',
    currentEquipment: { type: 'Single Head Hydrant' }
  };
  assert(!isFireExtinguisherAsset(mockHydrant), 'Hydrant landing valves are strictly excluded');

  const mockPump = {
    positionId: 'POS-PUMP-001',
    equipmentType: 'Main Diesel Fire Pump',
    equipmentCategory: 'Fire Pump',
    templateId: 'CL-01'
  };
  assert(!isFireExtinguisherAsset(mockPump), 'Fire pumps are strictly excluded');

  // ────────────────────────────────────────────────────────────
  // TEST 3: Client-Wise Breakdown & Grand Total Equality
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 3: Client-Wise Breakdown Sum Equals Grand Total');
  const breakdown = getClientExtinguisherBreakdown();
  assert(breakdown.length > 0, `Extinguisher breakdown contains ${breakdown.length} client organizations`);

  const clientSum = breakdown.reduce((sum, c) => sum + c.totalExtinguishers, 0);
  assert(clientSum === kpiTotal, `Client-wise sum (${clientSum}) strictly equals KPI grand total (${kpiTotal})`);

  // Verify all clients have valid names and counts
  const allClientsValid = breakdown.every(c => c.clientName && c.totalExtinguishers > 0 && Array.isArray(c.extinguishers));
  assert(allClientsValid, 'All client rows have valid client names, positive quantities, and linked asset arrays');

  // ────────────────────────────────────────────────────────────
  // TEST 4: Client Report Scoping (Only That Client\'s Extinguishers)
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 4: Client Report Isolation');
  const firstClient = breakdown[0];
  const clientExtinguishers = getRegisteredExtinguishers(firstClient.siteId || firstClient.clientName);

  assert(
    clientExtinguishers.length === firstClient.totalExtinguishers,
    `Selected client "${firstClient.clientName}" returns exactly ${firstClient.totalExtinguishers} extinguisher records`
  );

  // Ensure no cross-client contamination
  const sites = getSites();
  const validSiteIds = sites
    .filter(s => (s.clientName || s.company || s.name) === firstClient.clientName || s.id === firstClient.siteId)
    .map(s => s.id);

  const onlyBelongsToClient = clientExtinguishers.every(e => 
    validSiteIds.includes(e.siteId) || e.clientName === firstClient.clientName
  );
  assert(onlyBelongsToClient, `All returned assets strictly belong to client "${firstClient.clientName}" with zero cross-client leakage`);

  // ────────────────────────────────────────────────────────────
  // TEST 5: Dynamic KPI Update on Asset Registration
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 5: Dynamic KPI Update on New Registration');
  const initialCount = getTotalExtinguishersCount();
  const testSiteId = 'SITE-AIL-001';

  const regResult = registerNewAsset({
    siteId: testSiteId,
    equipmentCategory: 'Fire Extinguisher',
    equipmentType: 'ABC Powder Extinguisher',
    serviceType: 'Hydro Testing & Pressurisation',
    serialNumber: `TEST-EXT-${Date.now()}`,
    capacity: '6 Kg',
    manufacturer: 'Indus SafeGuard (IS 15683)',
    area: 'Safety Testing Bay',
    location: 'Near Gate 4'
  });

  assert(regResult.success === true, 'New fire extinguisher registered successfully');

  const afterRegCount = getTotalExtinguishersCount();
  assert(afterRegCount === initialCount + 1, `KPI Total incremented by exactly 1 (${initialCount} -> ${afterRegCount})`);

  const updatedBreakdown = getClientExtinguisherBreakdown();
  const updatedSum = updatedBreakdown.reduce((s, c) => s + c.totalExtinguishers, 0);
  assert(updatedSum === afterRegCount, `Client breakdown sum (${updatedSum}) automatically reflects newly registered extinguisher`);

  // ────────────────────────────────────────────────────────────
  // TEST 6: Dynamic KPI Update on Retirement / Scrapping
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 6: Dynamic KPI Update on Retirement');
  const allPositionsNow = getPositions();
  const createdPosIndex = allPositionsNow.findIndex(p => p.positionId === regResult.position.positionId);
  assert(createdPosIndex !== -1, 'Registered test asset found in positions database');

  // Mark asset as Retired
  allPositionsNow[createdPosIndex].status = 'Retired';
  allPositionsNow[createdPosIndex].operationalStatus = 'Retired';
  savePositions(allPositionsNow);

  const afterRetireCount = getTotalExtinguishersCount();
  assert(afterRetireCount === initialCount, `KPI Total decremented by 1 after retirement (${afterRegCount} -> ${afterRetireCount})`);

  // Cleanup: delete the test position from database
  const cleanPositions = getPositions().filter(p => p.positionId !== regResult.position.positionId);
  savePositions(cleanPositions);

  const afterDeleteCount = getTotalExtinguishersCount();
  assert(afterDeleteCount === initialCount, 'Database restored to original state cleanly');

  // ────────────────────────────────────────────────────────────
  // TEST 7: Exporter Column Schema & Data Integrity
  // ────────────────────────────────────────────────────────────
  console.log('\nTEST 7: Report Exporter Schema Verification (14 Mandatory Fields)');
  const sampleClientExts = breakdown[0].extinguishers;
  const csvExport = downloadClientExtinguishersCSV({
    clientName: breakdown[0].clientName,
    siteName: breakdown[0].siteName,
    extinguishers: sampleClientExts
  });

  const expectedFields = [
    'SR. No.',
    'Asset ID',
    'QR Number',
    'Client Name',
    'Site / Plant Name',
    'Location / Position',
    'Extinguisher Type',
    'Capacity',
    'Make / Manufacturer',
    'Serial Number',
    'Installation Date',
    'Last Inspection Date',
    'Next Inspection Due',
    'Asset Status'
  ];

  const allFieldsInHeader = expectedFields.every(f => csvExport.csvContent.includes(f));
  assert(allFieldsInHeader, 'Exported CSV contains all 14 mandatory fields in column header');

  const firstAssetId = sampleClientExts[0].positionId || sampleClientExts[0].id;
  assert(csvExport.csvContent.includes(firstAssetId), `Exported CSV contains actual asset ID ${firstAssetId}`);

  console.log('\n================================================================');
  console.log(` TOTAL INVENTORY TESTS: ${passed + failed}`);
  console.log(` PASSED: ${passed}`);
  console.log(` FAILED: ${failed}`);
  console.log('================================================================\n');

  return { passed, failed };
}

// Auto-run if executed directly via node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('test_fire_extinguisher_inventory')) {
  runFireExtinguisherInventoryTests().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}
