// Node test runner with browser environment mocks
process.env.NODE_ENV = 'test';
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

const atobPolyfill = (str) => Buffer.from(str, 'base64').toString('binary');
const btoaPolyfill = (str) => Buffer.from(str, 'binary').toString('base64');

global.atob = global.atob || atobPolyfill;
global.btoa = global.btoa || btoaPolyfill;

global.window = {
  dispatchEvent() {},
  atob: atobPolyfill,
  btoa: btoaPolyfill,
  location: { 
    origin: 'https://riyazrthd.github.io', 
    hostname: 'riyazrthd.github.io', 
    search: '', 
    pathname: '/M-M/' 
  },
  open: () => ({ document: { write() {}, close() {} }, focus() {} }),
  document: { createElement: () => ({ setAttribute() {}, appendChild() {}, click() {} }) }
};
global.CustomEvent = class {
  constructor(type, params = {}) {
    this.type = type;
    this.detail = params.detail;
  }
};

async function runAllTests() {
  await import('./src/utils/test_phase1_acceptance.js');
  console.log('\n\n');
  await import('./src/utils/test_registration_qr_workflow.js');
  console.log('\n\n');
  const masterTests = await import('./src/utils/test_master_qr_workflow.js');
  await masterTests.runMasterQRTests();
  console.log('\n\n');
  const inspectionTests = await import('./src/utils/test_inspection_completion_workflow.js');
  await inspectionTests.runInspectionCompletionTests();
  console.log('\n\n');
  const extinguisherTests = await import('./src/utils/test_fire_extinguisher_inventory.js');
  await extinguisherTests.runFireExtinguisherInventoryTests();
  console.log('\n\n');
  const allAssetsTests = await import('./src/utils/test_all_assets_inventory.js');
  await allAssetsTests.runAllAssetsInventoryTests();
  console.log('\n\n');
  const cloudSyncTests = await import('./src/utils/test_instant_cloud_sync.js');
  await cloudSyncTests.runInstantCloudSyncTests();
  console.log('\n\n');
  const client360Tests = await import('./src/utils/test_client_360_intelligence.js');
  await client360Tests.runClient360IntelligenceTests();
  console.log('\n\n');
  const crossDeviceTests = await import('./src/utils/test_cross_device_client_sync.js');
  await crossDeviceTests.runCrossDeviceClientSyncTests();
}

runAllTests();
