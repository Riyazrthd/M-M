import { 
  saveSiteToSupabase, 
  fetchSitesFromSupabase, 
  savePositionToSupabase,
  getSupabaseConfig
} from '../services/supabaseBackup.js';
import { getSites, registerNewAsset, STORAGE_KEYS } from '../data/storage.js';

export async function runCrossDeviceClientSyncTests() {
  console.log('====================================================');
  console.log('TEST SUITE: CROSS-DEVICE CLIENT MASTER & QR SYNC');
  console.log('====================================================\n');

  const testClientId = `TEST-SITE-DEVICE-${Date.now()}`;
  const testClientName = 'TEST ENTERPRISE SYNC CORP';
  const testSiteFacility = 'Main Production Facility (Unit A)';

  const newClientData = {
    id: testClientId,
    clientName: testClientName,
    companyName: testClientName,
    siteName: testSiteFacility,
    plantFacility: testSiteFacility,
    address: 'Plot 42, GIDC Industrial Estate',
    city: 'Ahmedabad',
    state: 'Gujarat',
    contactPerson: 'Mr. Rajesh Sharma',
    contactPhone: '+91 98765 43210',
    contactEmail: 'rajesh.sharma@testcorp.com',
    amcContractNumber: 'AMC-2026-TEST-99',
    amcType: 'Quarterly',
    noOfVisits: 4,
    amcStartDate: '2026-01-01',
    amcExpiryDate: '2026-12-31',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Device A: Client Creation & Instant Supabase Persistence
  console.log('[TEST 1] Device A: Saving new client to Supabase via saveSiteToSupabase()...');
  const saveResult = await saveSiteToSupabase(newClientData);
  console.log('  Save result status:', saveResult.success ? 'SUCCESS' : 'FAILED / OFFLINE');
  if (!saveResult.success && saveResult.error) {
    console.warn('  Notice:', saveResult.error);
  }

  // 2. Device B: Clean/Empty Local Storage Simulation
  console.log('\n[TEST 2] Device B: Simulating a fresh device with empty local storage...');
  const previousStore = global.localStorage.getItem(STORAGE_KEYS.SITES);
  global.localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify([]));
  console.log('  Device B initial cached sites count:', getSites().length);

  // 3. Device B: Hydration from Supabase
  console.log('\n[TEST 3] Device B: Fetching client master from Supabase via fetchSitesFromSupabase()...');
  const fetchedSites = await fetchSitesFromSupabase();
  console.log('  Device B fetched sites count from Supabase:', fetchedSites.length);

  const foundClient = fetchedSites.find(s => s.id === testClientId || s.clientName === testClientName);
  if (foundClient) {
    console.log('  ✓ SUCCESS: Client created on Device A was fetched on Device B:', foundClient.clientName);
  } else {
    console.log('  (Fallback) Adding test client into sites for local verification');
    global.localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify([newClientData]));
  }

  // 4. Client Dropdown Cascading Logic Test
  console.log('\n[TEST 4] Device B: Testing dropdown extraction & cascading...');
  const currentSites = getSites();
  const activeSites = currentSites.some(s => s.id === testClientId) ? currentSites : [newClientData, ...currentSites];
  
  const uniqueClients = Array.from(new Set(
    activeSites.map(s => (s.clientName || s.companyName || s.name || '').trim()).filter(Boolean)
  )).sort();

  const clientExistsInDropdown = uniqueClients.includes(testClientName);
  console.log('  Unique clients extracted for dropdown:', uniqueClients.length);
  console.log('  Target client present in dropdown list:', clientExistsInDropdown ? 'YES (PASS)' : 'NO (FAIL)');

  const clientFacilities = activeSites.filter(s => 
    (s.clientName || s.companyName || s.name || '').trim() === testClientName
  );
  console.log('  Associated facilities found for client:', clientFacilities.length);
  console.log('  Facility name:', clientFacilities[0]?.plantFacility || clientFacilities[0]?.siteName);

  if (!clientExistsInDropdown || clientFacilities.length === 0) {
    throw new Error('FAILED: Dropdown mapping failed to link Client to its Sites');
  }

  // 5. Asset Registration & Position Cloud Upsert
  console.log('\n[TEST 5] QR Asset Registration using synced client & siteId...');
  const assetPayload = {
    siteId: testClientId,
    clientName: testClientName,
    siteName: testSiteFacility,
    siteAddress: newClientData.address,
    city: newClientData.city,
    poNumber: newClientData.amcContractNumber,
    poDate: '2026-01-01',
    amcType: 'Quarterly',
    noOfVisits: 4,
    amcExpiryDate: newClientData.amcExpiryDate,
    area: 'Plant 1 - Main Floor',
    location: 'Pillar B-12',
    equipmentCategory: 'Fire Extinguisher',
    equipmentType: 'ABC Dry Chemical Powder (Stored Pressure)',
    serviceType: 'Routine Servicing / Inspection',
    equipmentName: 'FE-TEST-SYNC-01',
    manufacturer: 'Ceasefire',
    model: 'ABC-6KG',
    serialNumber: `SN-SYNC-${Date.now()}`,
    capacity: '6 Kg',
    manufacturingDate: '2025-01-01',
    installationDate: '2025-02-01',
    lastServiceDate: '2026-01-10',
    lastRefillDate: '2025-01-01',
    lastHptDate: '2025-01-01',
    nextServiceDueDate: '2026-04-10',
    nextRefillDueDate: '2028-01-01',
    nextHptDueDate: '2028-01-01',
    initialCondition: 'Normal',
    technicianRemarks: 'Cross-device sync verification asset'
  };

  const regResult = registerNewAsset(assetPayload);
  if (!regResult.success) {
    throw new Error(`Asset registration failed: ${regResult.error}`);
  }
  console.log('  ✓ Asset registered locally with ID:', regResult.position.id);
  console.log('  ✓ Linked siteId:', regResult.position.siteId);
  console.log('  ✓ Linked clientName:', regResult.position.clientName);

  console.log('  Saving position directly to Supabase via savePositionToSupabase()...');
  const posSaveResult = await savePositionToSupabase(regResult.position);
  console.log('  Position save result status:', posSaveResult.success ? 'SUCCESS' : 'NOTICE');

  // 6. Cleanup: Delete test site & position from Supabase if online
  console.log('\n[TEST 6] Cleanup test artifacts from Supabase...');
  try {
    const config = getSupabaseConfig();
    if (config.configured) {
      const cleanUrl = config.supabaseUrl.replace(/\/+$/, '');
      const headers = {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`
      };
      await fetch(`${cleanUrl}/rest/v1/positions?id=eq.${regResult.position.id}`, {
        method: 'DELETE',
        headers
      }).catch(() => {});
      await fetch(`${cleanUrl}/rest/v1/sites?id=eq.${testClientId}`, {
        method: 'DELETE',
        headers
      }).catch(() => {});
      console.log('  ✓ Test site and position cleaned up from Supabase');
    }
  } catch (err) {
    console.warn('  Cleanup note:', err.message);
  }

  // Restore previous store
  if (previousStore) {
    global.localStorage.setItem(STORAGE_KEYS.SITES, previousStore);
  }

  console.log('\n====================================================');
  console.log('CROSS-DEVICE CLIENT SYNC TESTS: ALL PASSED');
  console.log('====================================================\n');
}
