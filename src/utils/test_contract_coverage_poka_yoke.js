// Automated Verification Suite for Client-Specific AMC/ARC Contract Coverage & Poka-Yoke Engine
import {
  validateServiceContractCoverage,
  evaluateInspectionFindingPokaYoke,
  getServiceApprovals,
  createServiceApprovalRequest,
  processServiceApproval,
  getDefaultServiceCoverage,
  CONTRACT_TYPES,
  SERVICE_ACTIVITIES,
  COVERAGE_STATUSES
} from '../data/contractCoverageEngine.js';
import {
  initStorage,
  getSites,
  addPunchItem,
  getPunchItems,
  getClient360Summary
} from '../data/storage.js';

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

export async function runContractCoveragePokaYokeTests() {
  console.log('================================================================');
  console.log(' CLIENT-SPECIFIC AMC/ARC CONTRACT COVERAGE POKA-YOKE TEST SUITE');
  console.log('================================================================\n');

  initStorage(true);
  const sites = getSites();

  // Find demo sites configured for our scenarios
  const siteClientA = sites.find(s => s.id === 'SITE-DNL-003') || {
    id: 'SITE-TEST-DNL',
    clientName: 'Client A - Inspection Only',
    amcType: 'AMC (Inspection Only)',
    contractType: 'AMC',
    amcExpiryDate: '2027-12-31',
    serviceCoverage: {
      inspection: 'Included',
      refilling: 'Excluded',
      hpt: 'Excluded',
      repair: 'Chargeable / Additional Work',
      replacement: 'Excluded'
    }
  };

  const siteClientB = sites.find(s => s.id === 'SITE-ATL-002') || {
    id: 'SITE-TEST-ATL',
    clientName: 'Client B - Inspection + Refilling',
    amcType: 'AMC (Inspection + Refilling)',
    contractType: 'AMC',
    amcExpiryDate: '2027-12-31',
    serviceCoverage: {
      inspection: 'Included',
      refilling: 'Included',
      hpt: 'Requires Approval',
      repair: 'Requires Approval',
      replacement: 'Excluded'
    }
  };

  const siteClientC = sites.find(s => s.id === 'SITE-AIL-001') || {
    id: 'SITE-TEST-AIL',
    clientName: 'Client C - Comprehensive AMC',
    amcType: 'AMC (Inspection + Refilling + HPT)',
    contractType: 'AMC',
    amcExpiryDate: '2027-12-31',
    serviceCoverage: {
      inspection: 'Included',
      refilling: 'Included',
      hpt: 'Included',
      repair: 'Included',
      replacement: 'Requires Approval'
    }
  };

  const siteClientD = sites.find(s => s.id === 'SITE-LT-004') || {
    id: 'SITE-TEST-LT',
    clientName: 'Client D - ARC Contract',
    amcType: 'ARC (Annual Rate Contract)',
    contractType: 'ARC',
    amcExpiryDate: '2027-12-31',
    serviceCoverage: {
      inspection: 'Included',
      refilling: 'Chargeable / Additional Work',
      hpt: 'Chargeable / Additional Work',
      repair: 'Chargeable / Additional Work',
      replacement: 'Chargeable / Additional Work'
    }
  };

  // -------------------------------------------------------------------------
  // TEST 1: Client A — AMC Inspection Only (Refilling Excluded)
  // -------------------------------------------------------------------------
  console.log('TEST 1: Scenario A — Client with AMC Inspection Only Finding Low Pressure');
  const findingA = evaluateInspectionFindingPokaYoke(
    siteClientA,
    { positionId: 'POS-TEST-A1', equipmentCategory: 'Fire Extinguisher', equipmentType: 'ABC 6kg' },
    'Extinguisher pressure gauge needle in red zone / empty cylinder',
    'Pressure Gauge & Charge Indicator'
  );

  assert(findingA.technicalRequirement.activityType === 'refilling', 'Technically identified activity is "refilling"');
  assert(findingA.technicalRequirement.severity === 'Critical', 'Severity identified as Critical');
  assert(findingA.commercialAuthorization.isAuthorized === false, 'Commercial authorization correctly REJECTED under Inspection-Only contract');
  assert(findingA.commercialAuthorization.commercialStatus === 'Outside Contract Coverage', 'Commercial status is strictly "Outside Contract Coverage"');
  assert(findingA.autoProceedWithService === false, 'Poka-Yoke: autoProceedWithService is strictly FALSE');
  assert(findingA.approvalRequired === true, 'Poka-Yoke: Customer approval / quotation is REQUIRED');

  // Verify Punch and Approval generation
  const punchA = addPunchItem({
    siteId: siteClientA.id,
    clientName: siteClientA.clientName,
    positionId: 'POS-TEST-A1',
    assetName: 'ABC Fire Extinguisher 6kg',
    defectObservation: 'Pressure gauge in red zone',
    failedItemTitle: 'Pressure Gauge & Charge Indicator'
  });

  assert(punchA.success === true, 'Punch item created for defective extinguisher');
  assert(punchA.punchItem.commercialStatus === 'Outside Contract Coverage', `Punch commercialStatus is "${punchA.punchItem.commercialStatus}"`);
  assert(punchA.punchItem.approvalStatus === 'Pending Client Approval', `Punch approvalStatus is "${punchA.punchItem.approvalStatus}"`);

  // Verify approval request was generated
  const approvalsA = getServiceApprovals(siteClientA.id);
  const matchedReqA = approvalsA.find(r => r.positionId === 'POS-TEST-A1');
  assert(Boolean(matchedReqA), 'Approval / quotation request generated for unauthorized refilling');
  assert(matchedReqA?.commercialStatus === 'Outside Contract Coverage', 'Approval request tagged as Outside Contract Coverage');

  // -------------------------------------------------------------------------
  // TEST 2: Client B — AMC Inspection + Refilling
  // -------------------------------------------------------------------------
  console.log('\nTEST 2: Scenario B — Client with AMC Inspection + Refilling Finding Low Pressure');
  const findingB = evaluateInspectionFindingPokaYoke(
    siteClientB,
    { positionId: 'POS-TEST-B1', equipmentCategory: 'Fire Extinguisher', equipmentType: 'ABC 6kg' },
    'Low pressure observed on gauge',
    'Pressure Gauge'
  );

  assert(findingB.technicalRequirement.activityType === 'refilling', 'Technically identified activity is "refilling"');
  assert(findingB.commercialAuthorization.isAuthorized === true, 'Commercial authorization APPROVED under Inspection + Refilling contract');
  assert(findingB.commercialAuthorization.commercialStatus === 'Contract Covered', 'Commercial status is "Contract Covered"');
  assert(findingB.autoProceedWithService === true, 'Poka-Yoke: autoProceedWithService is TRUE — auto-creates refilling activity');
  assert(findingB.approvalRequired === false, 'Poka-Yoke: No extra customer approval needed for contracted refilling');

  // -------------------------------------------------------------------------
  // TEST 3: Client C — AMC Comprehensive (Inspection + Refilling + HPT)
  // -------------------------------------------------------------------------
  console.log('\nTEST 3: Scenario C — Client with Comprehensive AMC Testing HPT & Refilling Independently');
  const hptCoverageC = validateServiceContractCoverage(siteClientC, 'hpt', 'Fire Extinguisher');
  const refillCoverageC = validateServiceContractCoverage(siteClientC, 'refilling', 'Fire Extinguisher');
  const replaceCoverageC = validateServiceContractCoverage(siteClientC, 'replacement', 'Fire Extinguisher');

  assert(hptCoverageC.isAuthorized === true, 'HPT is covered under Client C Comprehensive contract');
  assert(refillCoverageC.isAuthorized === true, 'Refilling is covered under Client C Comprehensive contract');
  assert(replaceCoverageC.isAuthorized === false && replaceCoverageC.coverageStatus === 'Requires Approval', 
    'Cylinder Replacement still requires specific customer approval under Comprehensive terms');

  // -------------------------------------------------------------------------
  // TEST 4: Client D — ARC Contract (Schedule of Rates)
  // -------------------------------------------------------------------------
  console.log('\nTEST 4: Scenario D — Client with ARC Contract (Rate Schedule)');
  const findingD = evaluateInspectionFindingPokaYoke(
    siteClientD,
    { positionId: 'POS-TEST-D1', equipmentCategory: 'Fire Extinguisher', equipmentType: 'CO2 4.5kg' },
    'Cylinder empty, discharge seal broken',
    'Weight & Charge Status'
  );

  assert(findingD.commercialAuthorization.contractType === 'ARC', 'Identified contract type as ARC');
  assert(findingD.commercialAuthorization.commercialStatus === 'Chargeable / Additional Work', 'ARC Refilling flagged as "Chargeable / Additional Work"');
  assert(findingD.autoProceedWithService === false, 'Poka-Yoke: Chargeable ARC work does NOT auto-proceed without client PO/work order');

  // -------------------------------------------------------------------------
  // TEST 5: Poka-Yoke Contract Expiry Validation
  // -------------------------------------------------------------------------
  console.log('\nTEST 5: Scenario E — Expired Contract Halts Auto-Authorization');
  const expiredSite = {
    id: 'SITE-EXPIRED',
    clientName: 'Expired Corp',
    contractType: 'AMC',
    amcExpiryDate: '2024-01-01', // Expired in past
    serviceCoverage: { refilling: 'Included' }
  };

  const findingExpired = validateServiceContractCoverage(expiredSite, 'refilling', 'Fire Extinguisher');
  assert(findingExpired.isAuthorized === false, 'Expired contract blocks automatic service authorization');
  assert(findingExpired.commercialStatus === 'Contract Expired', 'Commercial status flagged as "Contract Expired"');
  assert(findingExpired.allowedToAutoProceed === false, 'Poka-Yoke: allowedToAutoProceed is strictly FALSE on expired contracts');

  // -------------------------------------------------------------------------
  // TEST 6: Poka-Yoke Unconfigured Service Activity Validation
  // -------------------------------------------------------------------------
  console.log('\nTEST 6: Scenario F — Ambiguous / Missing Service Coverage Never Assumed Included');
  const unconfiguredSite = {
    id: 'SITE-UNCONFIG',
    clientName: 'Unconfigured Corp',
    contractType: 'AMC',
    amcExpiryDate: '2027-12-31',
    serviceCoverage: {} // Empty configuration
  };

  const findingUnconfigured = validateServiceContractCoverage(unconfiguredSite, 'emergencyService', 'Fire Pump');
  assert(findingUnconfigured.isAuthorized === false, 'Unconfigured service is NEVER assumed to be included');
  assert(findingUnconfigured.coverageStatus === 'Not Configured', 'Status flagged as "Not Configured"');
  assert(findingUnconfigured.requiresApproval === true, 'Poka-Yoke: Requires approval before proceeding');

  // -------------------------------------------------------------------------
  // TEST 7: Outside-Contract Quotation & Approval Lifecycle
  // -------------------------------------------------------------------------
  console.log('\nTEST 7: Approval Request Processing & Quotation Sign-Off Lifecycle');
  const newReq = createServiceApprovalRequest({
    siteId: siteClientA.id,
    clientName: siteClientA.clientName,
    positionId: 'POS-TEST-APPROVAL',
    activityType: 'refilling',
    commercialStatus: 'Outside Contract Coverage',
    technicalReason: 'Extinguisher empty after accidental discharge',
    estimatedCost: '₹950'
  });

  assert(newReq.status === 'Pending Approval', `Initial approval request status is "${newReq.status}"`);

  // Manager approves quotation
  const approved = processServiceApproval(newReq.id, 'Approved', {
    approvedBy: 'Mr. Vikram Shah (Safety Head)',
    poRef: 'PO-EXTRA-2026-8841',
    notes: 'Approved under emergency safety budget'
  });

  assert(approved.success === true, 'Approval successfully processed');
  assert(approved.request.status === 'Approved', 'Request status transitioned to "Approved"');
  assert(approved.request.clientPoRef === 'PO-EXTRA-2026-8841', `Client PO Reference captured: ${approved.request.clientPoRef}`);

  // -------------------------------------------------------------------------
  // TEST 8: Client 360° Report Reflection
  // -------------------------------------------------------------------------
  console.log('\nTEST 8: Client 360° Summary Contract Coverage Integration');
  const summaryA = getClient360Summary(siteClientA.clientName);
  assert(summaryA.contractDetails.serviceCoverage !== undefined, 'Contract coverage matrix embedded in Client 360 summary');
  assert(summaryA.serviceApprovals !== undefined, 'Service approvals list embedded in Client 360 summary');

  console.log('\n================================================================');
  console.log(` TOTAL POKA-YOKE COVERAGE TESTS: ${passed + failed}`);
  console.log(` PASSED: ${passed}`);
  console.log(` FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} contract coverage Poka-Yoke test(s) failed`);
  }
}
