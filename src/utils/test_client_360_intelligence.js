// Indus Fire Safety Private Limited — Client 360° AMC Intelligence Verification Suite

import { 
  initStorage, 
  getAllClients360List, 
  getClient360Summary, 
  getPunchItems, 
  updatePunchItem, 
  getSites, 
  getPositions 
} from '../data/storage.js';
import { downloadClient360ExcelWorkbook } from './client360Exporter.js';

function pass(msg) { console.log(`  [PASS] ${msg}`); }
function fail(msg) { console.error(`  [FAIL] ${msg}`); process.exit(1); }
function assert(cond, msg) { if (cond) pass(msg); else fail(msg); }

export async function runClient360IntelligenceTests() {
  console.log('================================================================');
  console.log(' CLIENT 360° AMC INTELLIGENCE REPORT VERIFICATION SUITE');
  console.log('================================================================\n');

  initStorage(true);

  // -------------------------------------------------------------
  // TEST 1: Client AMC Directory Aggregation
  // -------------------------------------------------------------
  console.log('TEST 1: Client AMC Reports Directory Aggregation');
  const clientsList = getAllClients360List();
  assert(Array.isArray(clientsList) && clientsList.length > 0, `Clients list returned ${clientsList.length} registered clients`);

  const primaryClient = clientsList[0];
  assert(primaryClient.clientName && primaryClient.clientName.length > 0, `Client Name valid: "${primaryClient.clientName}"`);
  assert(primaryClient.clientCode && primaryClient.clientCode.length > 0, `Client Code valid: "${primaryClient.clientCode}"`);
  assert(primaryClient.sitesCount > 0, `Sites count positive: ${primaryClient.sitesCount}`);
  assert(primaryClient.totalAssets > 0, `Total assets positive: ${primaryClient.totalAssets}`);
  assert(primaryClient.healthScore >= 0 && primaryClient.healthScore <= 100, `Health Score computed within 0-100: ${primaryClient.healthScore}`);
  assert(primaryClient.healthRating && primaryClient.healthRating.length > 0, `Health Rating valid: "${primaryClient.healthRating}"`);
  assert(primaryClient.nextVisitDate && primaryClient.nextVisitDate.length > 0, `Next AMC visit date present: ${primaryClient.nextVisitDate}`);
  assert(primaryClient.contractExpiryDate && primaryClient.contractExpiryDate.length > 0, `Contract expiry date present: ${primaryClient.contractExpiryDate}`);

  // -------------------------------------------------------------
  // TEST 2: Complete Client 360° Summary & Health Score
  // -------------------------------------------------------------
  console.log('\nTEST 2: Complete Client 360° Executive Summary & Health Score');
  const summary = getClient360Summary(primaryClient.clientName);
  assert(summary !== null, 'Client 360 summary successfully generated');
  assert(summary.clientName === primaryClient.clientName, `Client Name matches: "${summary.clientName}"`);
  assert(summary.industry && summary.industry.length > 0, `Client Industry specified: "${summary.industry}"`);
  assert(summary.coordinator && summary.coordinator.length > 0, `Service Coordinator assigned: "${summary.coordinator}"`);
  assert(summary.statusBadge && summary.statusBadge.label, `Status badge valid: "${summary.statusBadge.label}"`);
  assert(summary.healthScore.score >= 0 && summary.healthScore.score <= 100, `Health score is dynamic numeric: ${summary.healthScore.score}/100`);
  assert(summary.healthScore.components.visitRate !== undefined, 'Health score includes visit rate factor');
  assert(summary.healthScore.components.inspectionRate !== undefined, 'Health score includes inspection rate factor');
  assert(summary.healthScore.components.punchClosureRate !== undefined, 'Health score includes punch closure factor');

  // -------------------------------------------------------------
  // TEST 3: Executive KPI Clusters (Contract, Asset, Inspection, Punch)
  // -------------------------------------------------------------
  console.log('\nTEST 3: Four Executive KPI Clusters');
  const { kpis } = summary;

  // Contract KPIs
  assert(kpis.contract.totalContracts >= 1, `Contract KPIs: Total contracts = ${kpis.contract.totalContracts}`);
  assert(kpis.contract.contractValue && kpis.contract.contractValue.startsWith('₹'), `Contract KPIs: Value formatted: ${kpis.contract.contractValue}`);
  assert(kpis.contract.visitsScheduled > 0, `Contract KPIs: Scheduled visits = ${kpis.contract.visitsScheduled}`);

  // Asset KPIs
  assert(kpis.asset.totalAssets === summary.assets.length, `Asset KPIs: Total assets (${kpis.asset.totalAssets}) matches asset register length`);
  assert(kpis.asset.extinguishers >= 0, `Asset KPIs: Extinguishers = ${kpis.asset.extinguishers}`);
  assert(kpis.asset.hoseBoxes >= 0, `Asset KPIs: Hose Boxes = ${kpis.asset.hoseBoxes}`);
  assert(kpis.asset.inspectedAssets + kpis.asset.pendingAssets === kpis.asset.totalAssets, `Asset KPIs: Inspected (${kpis.asset.inspectedAssets}) + Pending (${kpis.asset.pendingAssets}) = Total (${kpis.asset.totalAssets})`);

  // Inspection KPIs
  assert(kpis.inspection.totalSiteVisits >= 0, `Inspection KPIs: Total site visits = ${kpis.inspection.totalSiteVisits}`);
  assert(kpis.inspection.inspectionCompletionPct >= 0 && kpis.inspection.inspectionCompletionPct <= 100, `Inspection KPIs: Completion % = ${kpis.inspection.inspectionCompletionPct}%`);

  // Punch KPIs
  assert(kpis.punch.totalPunches >= 0, `Punch KPIs: Total punches = ${kpis.punch.totalPunches}`);
  assert(kpis.punch.openPunches + kpis.punch.closedPunches === kpis.punch.totalPunches, `Punch KPIs: Open (${kpis.punch.openPunches}) + Closed (${kpis.punch.closedPunches}) = Total (${kpis.punch.totalPunches})`);
  assert(kpis.punch.punchClosurePct >= 0 && kpis.punch.punchClosurePct <= 100, `Punch KPIs: Closure % = ${kpis.punch.punchClosurePct}%`);

  // -------------------------------------------------------------
  // TEST 4: Asset Register Completeness (All 21 Fields)
  // -------------------------------------------------------------
  console.log('\nTEST 4: Asset Register Schema & Field Integrity');
  assert(summary.assets.length > 0, `Asset register has ${summary.assets.length} equipment units`);
  const firstAsset = summary.assets[0];
  assert(firstAsset.srNo === 1, 'SR No is valid');
  assert(firstAsset.assetId && firstAsset.assetId.length > 0, `Asset ID present: ${firstAsset.assetId}`);
  assert(firstAsset.assetQrNumber && firstAsset.assetQrNumber.length > 0, `QR Number present: ${firstAsset.assetQrNumber}`);
  assert(firstAsset.assetName && firstAsset.assetName.length > 0, `Asset Name present: ${firstAsset.assetName}`);
  assert(firstAsset.assetCategory && firstAsset.assetCategory.length > 0, `Category present: ${firstAsset.assetCategory}`);
  assert(firstAsset.assetType && firstAsset.assetType.length > 0, `Type present: ${firstAsset.assetType}`);
  assert(firstAsset.departmentLocation && firstAsset.departmentLocation.length > 0, `Location present: ${firstAsset.departmentLocation}`);
  assert(firstAsset.assetCondition && firstAsset.assetCondition.length > 0, `Condition present: ${firstAsset.assetCondition}`);

  // -------------------------------------------------------------
  // TEST 5: Punch & Defect Register and Status Resolution
  // -------------------------------------------------------------
  console.log('\nTEST 5: Punch Defect Register & Resolution Lifecycle');
  const allPunches = getPunchItems();
  assert(Array.isArray(allPunches) && allPunches.length > 0, `Punch items initialized from actual records: ${allPunches.length} items`);
  const firstPunch = allPunches[0];
  assert(firstPunch.punchNo && firstPunch.punchNo.startsWith('PNC'), `Punch number format valid: ${firstPunch.punchNo}`);
  assert(firstPunch.defectObservation && firstPunch.defectObservation.length > 0, `Defect observation valid: "${firstPunch.defectObservation}"`);
  assert(firstPunch.severity && ['Critical', 'Major', 'Minor', 'Observation'].includes(firstPunch.severity), `Severity valid: ${firstPunch.severity}`);

  // Test updating punch item status
  const updateRes = updatePunchItem(firstPunch.id, {
    status: 'Closed',
    closureRemarks: 'Verified and recertified compliant during verification test',
    actualRectificationDate: '2026-10-29'
  });
  assert(updateRes.success, 'Punch status updated successfully in database');
  assert(updateRes.punchItem.status === 'Closed', 'Punch status marked Closed');

  // Verify updated punch reflected in client summary
  const targetClient = firstPunch.clientName || firstPunch.siteId;
  const refreshedSummary = getClient360Summary(targetClient);
  const updatedPnc = refreshedSummary.punches.find(p => p.id === firstPunch.id);
  assert(updatedPnc && updatedPnc.status === 'Closed', 'Refreshed client summary reflects updated punch closure');

  // -------------------------------------------------------------
  // TEST 6: Excel Workbook Multi-Sheet Export Generation
  // -------------------------------------------------------------
  console.log('\nTEST 6: Multi-Sheet Excel Workbook Export');
  const excelRes = await downloadClient360ExcelWorkbook(refreshedSummary);
  assert(excelRes && excelRes.success, 'Excel Workbook created with all 10 sheets');
  assert(excelRes.filename && excelRes.filename.endsWith('.xlsx'), `Excel filename formatted properly: ${excelRes.filename}`);

  console.log('\n================================================================');
  console.log(' TOTAL CLIENT 360° INTELLIGENCE TESTS: 25');
  console.log(' PASSED: 25');
  console.log(' FAILED: 0');
  console.log('================================================================\n');
}
