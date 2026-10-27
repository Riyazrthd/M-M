// Node test runner with browser environment mocks
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};
global.window = {
  dispatchEvent() {}
};
global.CustomEvent = class {};

async function runAllTests() {
  await import('./src/utils/test_phase1_acceptance.js');
  console.log('\n\n');
  await import('./src/utils/test_registration_qr_workflow.js');
}

runAllTests();
