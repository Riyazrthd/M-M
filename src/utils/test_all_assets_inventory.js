import {
  getPositions,
  getRegisteredAssets,
  getTotalAssetsCount,
  getClientAssetBreakdown,
  getRegisteredExtinguishers,
  getTotalExtinguishersCount,
  registerNewAsset
} from '../data/storage.js';

import {
  downloadClientAssetsCSV,
  downloadClientAssetsExcel
} from './extinguisherExporter.js';

export async function runAllAssetsInventoryTests() {
  console.log('================================================================');
  console.log(' ALL REGISTERED ASSETS INVENTORY & MULTI-CATEGORY SUITE');
  console.log('================================================================\n');

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

  // TEST 1: Total Registered Assets Count includes all categories
  console.log('TEST 1: Total Registered Assets vs Extinguisher Subset');
  const totalAllAssets = getTotalAssetsCount('ALL');
  const totalExtinguishers = getTotalAssetsCount('Fire Extinguisher');
  const totalHoseBoxes = getTotalAssetsCount('Delivery Hose Box');

  assert(totalAllAssets > 0, `Total all registered assets count is greater than 0 (actual: ${totalAllAssets})`);
  assert(totalAllAssets > totalExtinguishers, `Total all assets (${totalAllAssets}) is strictly greater than extinguisher subset (${totalExtinguishers})`);
  assert(totalExtinguishers > 0, `Extinguisher subset count is positive (${totalExtinguishers})`);
  assert(totalHoseBoxes > 0, `Hose box subset count is positive (${totalHoseBoxes})`);

  // TEST 2: Multi-Category Client Breakdown Integrity
  console.log('\nTEST 2: Client Breakdown Multi-Category Verification');
  const allBreakdown = getClientAssetBreakdown('ALL');
  assert(allBreakdown.length > 0, `Client breakdown returned ${allBreakdown.length} client facilities`);

  const sumClientAssets = allBreakdown.reduce((sum, c) => sum + c.totalAssets, 0);
  assert(sumClientAssets === totalAllAssets, `Sum of client assets (${sumClientAssets}) strictly matches total assets KPI (${totalAllAssets})`);

  const clientsWithMultipleCategories = allBreakdown.filter(c => c.categories && c.categories.length > 1);
  assert(clientsWithMultipleCategories.length > 0, `Found clients with multi-category inventories (${clientsWithMultipleCategories.length} clients)`);

  const firstClient = allBreakdown[0];
  assert(firstClient.categoriesBreakdown && typeof firstClient.categoriesBreakdown === 'object', 'Client contains category breakdown mapping');
  assert(firstClient.typesBreakdown && typeof firstClient.typesBreakdown === 'object', 'Client contains equipment types breakdown mapping');
  assert(firstClient.statusCounts && typeof firstClient.statusCounts.ok === 'number', 'Client contains operational status breakdown');

  // TEST 3: Category Filter Tabs in Breakdown
  console.log('\nTEST 3: Category Filtered Breakdown');
  const extBreakdown = getClientAssetBreakdown('Fire Extinguisher');
  const hoseBreakdown = getClientAssetBreakdown('Delivery Hose Box');
  const sumExt = extBreakdown.reduce((sum, c) => sum + c.totalAssets, 0);
  const sumHose = hoseBreakdown.reduce((sum, c) => sum + c.totalAssets, 0);

  assert(sumExt === totalExtinguishers, `Extinguisher breakdown sum (${sumExt}) strictly matches extinguisher KPI (${totalExtinguishers})`);
  assert(sumHose === totalHoseBoxes, `Hose box breakdown sum (${sumHose}) strictly matches hose box KPI (${totalHoseBoxes})`);

  // TEST 4: Client Detailed Report with Mixed Asset Types
  console.log('\nTEST 4: Client Report Asset Schema & Categories');
  const clientAssets = getRegisteredAssets(firstClient.clientName, 'ALL');
  assert(clientAssets.length === firstClient.totalAssets, `Client asset list count (${clientAssets.length}) matches client breakdown total (${firstClient.totalAssets})`);

  // TEST 5: CSV Exporter for All Assets (15 Columns including Equipment Category)
  console.log('\nTEST 5: All Assets CSV Exporter Schema (15 Columns)');
  const csvExport = downloadClientAssetsCSV({
    clientName: firstClient.clientName,
    siteName: firstClient.siteName,
    assets: clientAssets,
    reportTitle: 'ALL REGISTERED ASSET INVENTORY'
  });

  const expectedHeaders = [
    'SR. No.',
    'Asset ID',
    'QR Number',
    'Client Name',
    'Site / Plant Name',
    'Location / Position',
    'Equipment Category',
    'Equipment Type',
    'Capacity / Specification',
    'Make / Manufacturer',
    'Serial Number',
    'Installation Date',
    'Last Inspection Date',
    'Next Inspection Due',
    'Asset Status'
  ];

  const allHeadersPresent = expectedHeaders.every(h => csvExport.csvContent.includes(h));
  assert(allHeadersPresent, 'All 15 headers including Equipment Category are present in All Assets CSV export');
  assert(csvExport.count === clientAssets.length, `CSV export contains all ${clientAssets.length} asset rows`);

  // TEST 6: Excel Exporter for All Assets
  console.log('\nTEST 6: All Assets Excel Exporter');
  let excelSuccess = false;
  try {
    const res = await downloadClientAssetsExcel({
      clientName: firstClient.clientName,
      siteName: firstClient.siteName,
      assets: clientAssets,
      reportTitle: 'ALL REGISTERED ASSET INVENTORY'
    });
    excelSuccess = res.success && res.count === clientAssets.length;
  } catch (err) {
    excelSuccess = false;
  }
  assert(excelSuccess, `Excel generator succeeded for all ${clientAssets.length} assets with company styling and 15 columns`);

  console.log('\n================================================================');
  console.log(` TOTAL ALL-ASSET TESTS: ${passed + failed}`);
  console.log(` PASSED: ${passed}`);
  console.log(` FAILED: ${failed}`);
  console.log('================================================================\n');

  return { passed, failed };
}

// Auto-run if executed directly via node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('test_all_assets_inventory')) {
  runAllAssetsInventoryTests().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}
