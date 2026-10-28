// Node test runner with browser environment mocks
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
  location: { search: '', pathname: '/' },
  open: () => ({ document: { write() {}, close() {} }, focus() {} }),
  document: { createElement: () => ({ setAttribute() {}, appendChild() {}, click() {} }) }
};
global.CustomEvent = class {};

async function runAllTests() {
  await import('./src/utils/test_phase1_acceptance.js');
  console.log('\n\n');
  await import('./src/utils/test_registration_qr_workflow.js');
  console.log('\n\n');
  const masterTests = await import('./src/utils/test_master_qr_workflow.js');
  await masterTests.runMasterQRTests();
}

runAllTests();
