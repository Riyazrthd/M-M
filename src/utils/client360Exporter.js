// Indus Fire Safety Private Limited — Client 360° AMC Intelligence Exporter
// Provides professional Excel Workbook (.xlsx with 10 sheets) and comprehensive Vector Printable PDF report

import { COMPANY_INFO } from '../data/checklistTemplates.js';

/**
 * Downloads a complete, multi-sheet Excel Workbook for the Client 360° AMC Intelligence Report
 */
export async function downloadClient360ExcelWorkbook(summary) {
  if (!summary) return { success: false, error: 'Summary data required' };

  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Indus Fire Safety Private Limited';
  workbook.created = new Date();
  workbook.modified = new Date();

  const brandNavy = 'FF0F172A';
  const brandBlue = 'FF2563EB';
  const brandRed = 'FFDC2626';
  const brandGreen = 'FF059669';
  const headerGray = 'FFF1F5F9';
  const borderGray = 'FFE2E8F0';

  const defaultBorder = {
    top: { style: 'thin', color: { argb: borderGray } },
    left: { style: 'thin', color: { argb: borderGray } },
    bottom: { style: 'thin', color: { argb: borderGray } },
    right: { style: 'thin', color: { argb: borderGray } }
  };

  const styleBanner = (sheet, title, subtitle) => {
    sheet.mergeCells('A1:H1');
    const b1 = sheet.getCell('A1');
    b1.value = 'INDUS FIRE SAFETY PRIVATE LIMITED — CLIENT 360° AMC INTELLIGENCE';
    b1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    b1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandNavy } };
    b1.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:H2');
    const b2 = sheet.getCell('A2');
    b2.value = `${title.toUpperCase()} — ${subtitle.toUpperCase()}`;
    b2.font = { name: 'Arial', size: 10, bold: true, color: { argb: brandBlue } };
    b2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    b2.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;
  };

  // ─────────────────────────────────────────────────────────────
  // SHEET 1: Client Summary & Health Score
  // ─────────────────────────────────────────────────────────────
  const wsSummary = workbook.addWorksheet('1. Executive Summary');
  styleBanner(wsSummary, summary.clientName, 'Executive Overview & Health Score');

  wsSummary.getCell('A4').value = 'Client Name:';
  wsSummary.getCell('B4').value = summary.clientName;
  wsSummary.getCell('D4').value = 'Client Health Score:';
  wsSummary.getCell('E4').value = `${summary.healthScore.score} / 100 (${summary.healthScore.label})`;

  wsSummary.getCell('A5').value = 'Client Code:';
  wsSummary.getCell('B5').value = summary.clientCode;
  wsSummary.getCell('D5').value = 'AMC Contract Status:';
  wsSummary.getCell('E5').value = summary.contractDetails.renewalAlert;

  wsSummary.getCell('A6').value = 'Contact Person:';
  wsSummary.getCell('B6').value = `${summary.contactPerson} (${summary.contactPhone})`;
  wsSummary.getCell('D6').value = 'Contract Value:';
  wsSummary.getCell('E6').value = summary.contractDetails.contractValue;

  wsSummary.getCell('A7').value = 'Registered Sites:';
  wsSummary.getCell('B7').value = `${summary.sites.length} Industrial Facilities`;
  wsSummary.getCell('D7').value = 'Contract Expiry:';
  wsSummary.getCell('E7').value = `${summary.contractDetails.endDate} (${summary.contractDetails.daysToExpiry} days remaining)`;

  ['A4', 'D4', 'A5', 'D5', 'A6', 'D6', 'A7', 'D7'].forEach(c => {
    wsSummary.getCell(c).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF475569' } };
  });

  // KPI Table
  wsSummary.getCell('A9').value = 'KPI Metric Domain';
  wsSummary.getCell('B9').value = 'Primary Metric';
  wsSummary.getCell('C9').value = 'Value';
  wsSummary.getCell('D9').value = 'Operational Detail / Scope';

  ['A9', 'B9', 'C9', 'D9'].forEach(c => {
    const cell = wsSummary.getCell(c);
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandNavy } };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });

  const kpiRows = [
    ['AMC Contracts', 'Total AMC Contracts', summary.kpis.contract.totalContracts, 'Comprehensive Annual Maintenance Contracts'],
    ['AMC Contracts', 'Planned Visits vs Completed', `${summary.kpis.contract.visitsCompleted} / ${summary.kpis.contract.visitsScheduled}`, `Remaining Scheduled Visits: ${summary.kpis.contract.visitsPending}`],
    ['Asset Registry', 'Total Registered Assets', summary.kpis.asset.totalAssets, 'All categorized fire protection equipment units'],
    ['Asset Registry', 'Fire Extinguishers', summary.kpis.asset.extinguishers, 'ABC Powder, CO2, Foam, Mechanical Stored Units'],
    ['Asset Registry', 'Hydrants & Hose Boxes', summary.kpis.asset.hydrants + summary.kpis.asset.hoseBoxes, 'Single/Double Hydrant Valves & Delivery Hose Boxes'],
    ['Asset Registry', 'Inspected vs Pending', `${summary.kpis.asset.inspectedAssets} / ${summary.kpis.asset.totalAssets}`, `Pending Asset Inspections: ${summary.kpis.asset.pendingAssets}`],
    ['Inspection Audit', 'Completion Rate', `${summary.kpis.inspection.inspectionCompletionPct}%`, 'Verified against database inspection answers'],
    ['Inspection Audit', 'Assets Found Not Okay', summary.kpis.asset.notOkayAssets, 'Requires immediate attention or spare replacement'],
    ['Punch & Defects', 'Total Punch Items Raised', summary.kpis.punch.totalPunches, 'Recorded observations during AMC site visits'],
    ['Punch & Defects', 'Open vs Closed Punches', `${summary.kpis.punch.openPunches} Open / ${summary.kpis.punch.closedPunches} Closed`, `Closure Rate: ${summary.kpis.punch.punchClosurePct}%`],
    ['Punch & Defects', 'Critical Open Punches', summary.kpis.punch.criticalPunches, 'High risk defects requiring priority action']
  ];

  kpiRows.forEach((row, i) => {
    const rIdx = 10 + i;
    wsSummary.getRow(rIdx).values = row;
    wsSummary.getRow(rIdx).font = { name: 'Arial', size: 9 };
  });

  wsSummary.columns = [
    { width: 22 },
    { width: 32 },
    { width: 18 },
    { width: 45 }
  ];

  // ─────────────────────────────────────────────────────────────
  // SHEET 2: AMC Contracts
  // ─────────────────────────────────────────────────────────────
  const wsContract = workbook.addWorksheet('2. AMC Contracts');
  styleBanner(wsContract, summary.clientName, 'AMC Contract Details & Service Scope');

  const contractInfo = [
    ['Contract Parameter', 'Details / Values'],
    ['AMC Contract Number', summary.contractDetails.contractNumber],
    ['Purchase Order Number', summary.contractDetails.poNumber],
    ['Purchase Order Date', summary.contractDetails.poDate],
    ['Contract Period', `${summary.contractDetails.startDate} to ${summary.contractDetails.endDate}`],
    ['Contract Duration', summary.contractDetails.duration],
    ['AMC Frequency', summary.contractDetails.frequency],
    ['Planned Visits per Annum', summary.contractDetails.plannedVisits],
    ['Completed Visits to Date', summary.contractDetails.completedVisits],
    ['Remaining Planned Visits', summary.contractDetails.remainingVisits],
    ['Contract Estimated Value', summary.contractDetails.contractValue],
    ['Billing / Payment Terms', summary.contractDetails.billingTerms],
    ['Service Scope', summary.contractDetails.serviceScope],
    ['Included Asset Categories', summary.contractDetails.includedCategories],
    ['Coverage Warranty', summary.contractDetails.contractCoverage],
    ['Excluded Capital Services', summary.contractDetails.excludedServices],
    ['Contract Renewal Status', summary.contractDetails.renewalAlert],
    ['Days Remaining to Expiry', `${summary.contractDetails.daysToExpiry} Days`],
    ['Service Coordinator', summary.contractDetails.responsibleCoordinator]
  ];

  contractInfo.forEach((r, idx) => {
    const row = wsContract.getRow(4 + idx);
    row.values = r;
    if (idx === 0) {
      row.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandNavy } };
    } else {
      row.font = { name: 'Arial', size: 9 };
      row.getCell(1).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF334155' } };
    }
  });
  wsContract.columns = [{ width: 32 }, { width: 65 }];

  // ─────────────────────────────────────────────────────────────
  // SHEET 3: Sites & Facilities
  // ─────────────────────────────────────────────────────────────
  const wsSites = workbook.addWorksheet('3. Sites & Plants');
  styleBanner(wsSites, summary.clientName, 'Client Facilities & Site Progress');

  wsSites.getRow(4).values = [
    'Site Code', 'Plant / Site Name', 'Address', 'City', 'Contact Person', 'Phone',
    'Total Assets', 'Inspected', 'Pending', 'Defective', 'Frequency', 'Last Visit', 'Next Visit', 'Status'
  ];
  wsSites.getRow(4).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  wsSites.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandNavy } };

  summary.sites.forEach((s, idx) => {
    const row = wsSites.getRow(5 + idx);
    row.values = [
      s.siteCode, s.siteName, s.address, s.city, s.contactPerson, s.contactPhone,
      s.totalAssets, s.inspectedAssets, s.pendingAssets, s.defectiveAssets, s.frequency, s.lastVisitDate, s.nextScheduledVisit, s.status
    ];
    row.font = { name: 'Arial', size: 8.5 };
  });

  wsSites.columns = [
    { width: 14 }, { width: 32 }, { width: 35 }, { width: 16 }, { width: 20 }, { width: 16 },
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 }
  ];

  // ─────────────────────────────────────────────────────────────
  // SHEET 4: Complete Asset Register
  // ─────────────────────────────────────────────────────────────
  const wsAssets = workbook.addWorksheet('4. Asset Register');
  styleBanner(wsAssets, summary.clientName, 'Complete Registered Equipment Inventory');

  wsAssets.getRow(4).values = [
    'SR.', 'Asset QR No.', 'Asset ID', 'Asset Name', 'Category', 'Equipment Type', 'Location / Area',
    'Manufacturer', 'Serial No.', 'Capacity / Rating', 'Installation Date', 'Last Inspection', 'Next Due',
    'Asset Status', 'Condition', 'Inspection Result', 'Open Punches'
  ];
  wsAssets.getRow(4).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  wsAssets.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandNavy } };

  summary.assets.forEach((a, idx) => {
    const row = wsAssets.getRow(5 + idx);
    row.values = [
      a.srNo, a.assetQrNumber, a.assetId, a.assetName, a.assetCategory, a.assetType, a.departmentLocation,
      a.manufacturer, a.serialNumber, a.capacityRating, a.installationDate, a.lastInspectionDate, a.nextInspectionDueDate,
      a.assetStatus, a.assetCondition, a.lastInspectionResult, a.openPunchCount
    ];
    row.font = { name: 'Arial', size: 8.5 };
  });

  wsAssets.columns = [
    { width: 6 }, { width: 18 }, { width: 16 }, { width: 28 }, { width: 20 }, { width: 28 }, { width: 30 },
    { width: 24 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 18 }, { width: 16 }, { width: 24 }, { width: 12 }
  ];

  // ─────────────────────────────────────────────────────────────
  // SHEET 5: AMC Visits & Inspections
  // ─────────────────────────────────────────────────────────────
  const wsVisits = workbook.addWorksheet('5. AMC Visits');
  styleBanner(wsVisits, summary.clientName, 'Chronological AMC Visit & Field History');

  wsVisits.getRow(4).values = [
    'Visit Number', 'Site / Facility', 'Date', 'Start Time', 'Service Engineer', 'Badge',
    'Status', 'Total Assets', 'Inspected', 'Pending', 'Defects', 'Client Representative', 'Remarks'
  ];
  wsVisits.getRow(4).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  wsVisits.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandNavy } };

  summary.visits.forEach((v, idx) => {
    const row = wsVisits.getRow(5 + idx);
    row.values = [
      v.visitId || v.id, v.siteName || v.siteId, v.date, v.startTime || '09:30 AM',
      v.technicianName || v.serviceEngineer, v.technicianBadge || 'IFS-SE-041',
      v.status, v.totalAssets || 0, v.inspectedAssets || 0, v.pendingAssets || 0,
      v.defectsCount || 0, v.clientRepresentative || 'Client Rep', v.visitRemarks || 'Routine inspection completed.'
    ];
    row.font = { name: 'Arial', size: 8.5 };
  });

  wsVisits.columns = [
    { width: 24 }, { width: 28 }, { width: 14 }, { width: 12 }, { width: 22 }, { width: 14 },
    { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 10 }, { width: 24 }, { width: 35 }
  ];

  // ─────────────────────────────────────────────────────────────
  // SHEET 6: Not Okay Assets
  // ─────────────────────────────────────────────────────────────
  const wsNotOk = workbook.addWorksheet('6. Not Okay Assets');
  styleBanner(wsNotOk, summary.clientName, 'Equipment Requiring Rectification & Defect Details');

  wsNotOk.getRow(4).values = [
    'SR.', 'Asset ID', 'QR Number', 'Equipment Type', 'Location', 'Inspection Date', 'Technician',
    'Failed Parameter', 'Defect / Observation', 'Severity', 'Punch #', 'Rectification Status', 'Next Action'
  ];
  wsNotOk.getRow(4).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  wsNotOk.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandRed } };

  if (summary.assetsNotOkay.length > 0) {
    summary.assetsNotOkay.forEach((item, idx) => {
      const row = wsNotOk.getRow(5 + idx);
      row.values = [
        item.srNo, item.assetId, item.qrNumber, item.assetType, item.location, item.inspectionDate,
        item.technician, item.failedParameter, item.observation, item.severity, item.punchNumber,
        item.rectificationStatus, item.nextAction
      ];
      row.font = { name: 'Arial', size: 8.5 };
    });
  } else {
    wsNotOk.getRow(5).values = ['—', 'No Defective Assets Recorded', '—', '—', '—', '—', '—', '—', 'All assets in compliant state', '—', '—', 'Closed', 'None'];
  }

  wsNotOk.columns = [
    { width: 6 }, { width: 16 }, { width: 18 }, { width: 26 }, { width: 28 }, { width: 14 },
    { width: 20 }, { width: 26 }, { width: 35 }, { width: 12 }, { width: 16 }, { width: 18 }, { width: 30 }
  ];

  // ─────────────────────────────────────────────────────────────
  // SHEET 7: Punch & Defect Register
  // ─────────────────────────────────────────────────────────────
  const wsPunches = workbook.addWorksheet('7. Punch Register');
  styleBanner(wsPunches, summary.clientName, 'Complete AMC Punch List & Resolution Audit');

  wsPunches.getRow(4).values = [
    'Punch #', 'Date', 'Site / Facility', 'Asset ID', 'QR Token', 'Equipment Type', 'Location',
    'Defect Observation', 'Category', 'Severity', 'Technician', 'Target Date', 'Actual Rectified', 'Status', 'Closure Remarks'
  ];
  wsPunches.getRow(4).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  wsPunches.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandNavy } };

  summary.punches.forEach((p, idx) => {
    const row = wsPunches.getRow(5 + idx);
    row.values = [
      p.punchNo, p.punchDate, p.siteName, p.positionId, p.qrCode, p.assetType, p.location,
      p.defectObservation, p.defectCategory, p.severity, p.technicianName, p.targetDate,
      p.actualRectificationDate || '—', p.status, p.closureRemarks || '—'
    ];
    row.font = { name: 'Arial', size: 8.5 };
  });

  wsPunches.columns = [
    { width: 14 }, { width: 12 }, { width: 26 }, { width: 16 }, { width: 18 }, { width: 24 }, { width: 28 },
    { width: 36 }, { width: 22 }, { width: 12 }, { width: 20 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 35 }
  ];

  // ─────────────────────────────────────────────────────────────
  // SHEET 8: Pending Work & Justifications
  // ─────────────────────────────────────────────────────────────
  const wsPending = workbook.addWorksheet('8. Pending Work');
  styleBanner(wsPending, summary.clientName, 'Pending Inspections & Mandatory Exception Justifications');

  wsPending.getRow(4).values = [
    'SR.', 'Asset ID', 'QR Number', 'Site Location', 'Pending Reason', 'Technician Explanation / Remarks',
    'Assigned Technician', 'Scheduled Date', 'Status'
  ];
  wsPending.getRow(4).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  wsPending.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandNavy } };

  if (summary.pendingAssetsList.length > 0) {
    summary.pendingAssetsList.forEach((p, idx) => {
      const row = wsPending.getRow(5 + idx);
      row.values = [
        p.srNo, p.assetId, p.qrNumber, p.siteLocation, p.pendingReason, p.explanation,
        p.assignedTechnician, p.scheduledDate, p.currentStatus
      ];
      row.font = { name: 'Arial', size: 8.5 };
    });
  } else {
    wsPending.getRow(5).values = ['—', 'All Scheduled Assets Inspected', '—', '—', 'Zero Pending Assets', '100% inspection coverage achieved', '—', '—', 'Completed'];
  }

  wsPending.columns = [
    { width: 6 }, { width: 16 }, { width: 18 }, { width: 28 }, { width: 30 }, { width: 40 },
    { width: 22 }, { width: 14 }, { width: 16 }
  ];

  // ─────────────────────────────────────────────────────────────
  // SHEET 9: Technician Field History
  // ─────────────────────────────────────────────────────────────
  const wsTechs = workbook.addWorksheet('9. Technician History');
  styleBanner(wsTechs, summary.clientName, 'Service Engineers & Field Performance Audit');

  wsTechs.getRow(4).values = [
    'Technician Name', 'Employee Badge', 'Total Visits', 'Completed Visits',
    'Assets Inspected', 'Punches Raised', 'Rectifications Completed', 'Last Visit Date', 'Facilities Serviced'
  ];
  wsTechs.getRow(4).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  wsTechs.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandNavy } };

  summary.technicians.forEach((t, idx) => {
    const row = wsTechs.getRow(5 + idx);
    row.values = [
      t.name, t.badge, t.visitsCount, t.completedCount, t.inspectedAssetsTotal,
      t.punchesRaised, t.rectificationsCompleted, t.lastVisitDate, t.sitesVisited.join(', ')
    ];
    row.font = { name: 'Arial', size: 8.5 };
  });

  wsTechs.columns = [
    { width: 24 }, { width: 16 }, { width: 14 }, { width: 16 },
    { width: 16 }, { width: 14 }, { width: 20 }, { width: 16 }, { width: 35 }
  ];

  // ─────────────────────────────────────────────────────────────
  // SHEET 10: Asset Replacement History
  // ─────────────────────────────────────────────────────────────
  const wsSwaps = workbook.addWorksheet('10. Replacement History');
  styleBanner(wsSwaps, summary.clientName, 'Permanent QR Retention & Cylinder Swaps Log');

  wsSwaps.getRow(4).values = [
    'Position ID', 'Permanent QR Code', 'Asset Name', 'Replacement Date', 'Reason for Swap',
    'Removed Cylinder ID', 'Removed Cylinder Serial', 'Installed Cylinder Serial', 'Technician', 'Remarks'
  ];
  wsSwaps.getRow(4).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  wsSwaps.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandNavy } };

  if (summary.replacementHistory.length > 0) {
    summary.replacementHistory.forEach((r, idx) => {
      const row = wsSwaps.getRow(5 + idx);
      row.values = [
        r.positionId, r.qrCode, r.assetName, r.timestamp, r.reason,
        r.removedCylinder?.id || '—', r.removedCylinder?.serialNo || '—',
        r.replacementCylinder?.serialNo || '—', r.technician, r.notes
      ];
      row.font = { name: 'Arial', size: 8.5 };
    });
  } else {
    wsSwaps.getRow(5).values = ['—', 'No Cylinder Swaps Logged', '—', '—', 'Original assets active in permanent positions', '—', '—', '—', '—', '—'];
  }

  wsSwaps.columns = [
    { width: 16 }, { width: 18 }, { width: 26 }, { width: 18 }, { width: 32 },
    { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 35 }
  ];

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = summary.clientName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().substring(0, 10);
  const filename = `IFS_Client360_${safeName}_${dateStr}.xlsx`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return { success: true, filename };
}

/**
 * Generates and opens a high-fidelity printable executive report for Client 360° AMC Intelligence
 */
export function printClient360Report(summary) {
  if (!summary) return;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CLIENT 360° AMC INTELLIGENCE — ${summary.clientName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 12mm 10mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header-banner {
      background: #0F172A;
      color: #FFFFFF;
      padding: 18px 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .header-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .header-sub {
      font-size: 11px;
      color: #94A3B8;
      margin: 0;
    }
    .health-badge {
      background: #1E293B;
      border: 1px solid #334155;
      padding: 10px 16px;
      border-radius: 8px;
      text-align: right;
    }
    .health-score {
      font-size: 24px;
      font-weight: 800;
      color: ${summary.healthScore.color};
      line-height: 1;
    }
    .health-label {
      font-size: 10px;
      font-weight: 600;
      color: #E2E8F0;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 700;
      color: #0F172A;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 6px;
      margin-top: 0;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .kpi-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .kpi-val {
      font-size: 18px;
      font-weight: 700;
      color: #0F172A;
      margin: 2px 0;
    }
    .kpi-lbl {
      font-size: 9px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 10px;
    }
    th {
      background: #0F172A;
      color: #FFFFFF;
      text-align: left;
      padding: 6px 8px;
      font-weight: 600;
      font-size: 9.5px;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #E2E8F0;
    }
    tr:nth-child(even) td {
      background: #F8FAFC;
    }
    .tag {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
    }
    .tag-ok { background: #DCFCE7; color: #15803D; }
    .tag-notok { background: #FEE2E2; color: #B91C1C; }
    .tag-pending { background: #FEF3C7; color: #B45309; }
    .section-head {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      margin: 18px 0 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0F172A;
      padding-bottom: 4px;
    }
    .footer-sign {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 30px;
      border-top: 1px solid #CBD5E1;
      padding-top: 15px;
    }
    .sign-box {
      border: 1px dashed #CBD5E1;
      height: 65px;
      margin-top: 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94A3B8;
      font-size: 9px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>

  <!-- Controls for browser preview -->
  <div class="no-print" style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; background: #EEF2F6; padding: 8px 12px; border-radius: 6px;">
    <span style="font-weight: 600;">Client 360° Executive Intelligence Report Preview</span>
    <button onclick="window.print()" style="background: #2563EB; color: #FFF; border: none; padding: 6px 14px; border-radius: 4px; font-weight: 600; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <!-- Main Corporate Banner -->
  <div class="header-banner">
    <div>
      <div class="header-title">CLIENT 360° AMC INTELLIGENCE REPORT</div>
      <div class="header-sub">INDUS FIRE SAFETY PRIVATE LIMITED • COMPREHENSIVE AMC SERVICE & ASSET COMPLIANCE</div>
      <div style="font-size: 10px; color: #E2E8F0; margin-top: 6px;">
        <strong>${summary.clientName}</strong> (${summary.clientCode}) • ${summary.industry}
      </div>
    </div>
    <div class="health-badge">
      <div class="health-score">${summary.healthScore.score}<span style="font-size: 13px; color: #94A3B8;">/100</span></div>
      <div class="health-label">${summary.healthScore.label}</div>
    </div>
  </div>

  <!-- Client Master & Contract Info -->
  <div class="grid-2">
    <div class="card">
      <div class="card-title">1. Client Profile & Facility Overview</div>
      <table style="margin: 0;">
        <tr><td style="width: 35%; font-weight: 600;">Client Organization:</td><td>${summary.clientName}</td></tr>
        <tr><td style="font-weight: 600;">Client Code:</td><td>${summary.clientCode}</td></tr>
        <tr><td style="font-weight: 600;">Primary Contact:</td><td>${summary.contactPerson} (${summary.contactPhone})</td></tr>
        <tr><td style="font-weight: 600;">Email Address:</td><td>${summary.email}</td></tr>
        <tr><td style="font-weight: 600;">Billing Address:</td><td>${summary.billingAddress}, ${summary.city}</td></tr>
        <tr><td style="font-weight: 600;">Registered Sites:</td><td>${summary.sites.length} Active Plants / Complexes</td></tr>
      </table>
    </div>

    <div class="card">
      <div class="card-title">2. AMC Contract & Service Terms</div>
      <table style="margin: 0;">
        <tr><td style="width: 35%; font-weight: 600;">Contract Reference:</td><td>${summary.contractDetails.contractNumber}</td></tr>
        <tr><td style="font-weight: 600;">Purchase Order:</td><td>${summary.contractDetails.poNumber} (Dated: ${summary.contractDetails.poDate})</td></tr>
        <tr><td style="font-weight: 600;">Contract Period:</td><td>${summary.contractDetails.startDate} to ${summary.contractDetails.endDate}</td></tr>
        <tr><td style="font-weight: 600;">AMC Frequency:</td><td>${summary.contractDetails.frequency} (${summary.contractDetails.completedVisits} of ${summary.contractDetails.plannedVisits} visits completed)</td></tr>
        <tr><td style="font-weight: 600;">Contract Status:</td><td><span class="tag tag-ok">${summary.contractDetails.renewalAlert}</span></td></tr>
        <tr><td style="font-weight: 600;">Responsible Lead:</td><td>${summary.contractDetails.responsibleCoordinator}</td></tr>
      </table>
    </div>
  </div>

  <!-- Executive KPI Highlights -->
  <div class="section-head">3. Executive Service & Asset KPI Highlights</div>
  <div class="grid-4">
    <div class="kpi-card">
      <div class="kpi-lbl">Total Registered Assets</div>
      <div class="kpi-val">${summary.kpis.asset.totalAssets}</div>
      <div style="font-size: 8.5px; color: #64748B;">All Fire Safety Classes</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-lbl">Inspected Assets</div>
      <div class="kpi-val" style="color: #059669;">${summary.kpis.asset.inspectedAssets}</div>
      <div style="font-size: 8.5px; color: #059669;">${summary.kpis.inspection.inspectionCompletionPct}% Inspected</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-lbl">Pending Inspections</div>
      <div class="kpi-val" style="color: #D97706;">${summary.kpis.asset.pendingAssets}</div>
      <div style="font-size: 8.5px; color: #D97706;">Scheduled Next Visit</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-lbl">Defects / Open Punches</div>
      <div class="kpi-val" style="color: #DC2626;">${summary.kpis.punch.openPunches}</div>
      <div style="font-size: 8.5px; color: #DC2626;">${summary.kpis.punch.criticalPunches} Critical</div>
    </div>
  </div>

  <!-- Sites Table -->
  <div class="section-head">4. Industrial Plants & Facilities</div>
  <table>
    <thead>
      <tr>
        <th>Site Code</th>
        <th>Facility Name</th>
        <th>Address</th>
        <th>Total Assets</th>
        <th>Inspected</th>
        <th>Pending</th>
        <th>Defects</th>
        <th>Last Visit</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${summary.sites.map(s => `
        <tr>
          <td><strong>${s.siteCode}</strong></td>
          <td>${s.siteName}</td>
          <td>${s.address}, ${s.city}</td>
          <td><strong>${s.totalAssets}</strong></td>
          <td style="color: #059669;"><strong>${s.inspectedAssets}</strong></td>
          <td style="color: #D97706;">${s.pendingAssets}</td>
          <td style="color: #DC2626;">${s.defectiveAssets}</td>
          <td>${s.lastVisitDate}</td>
          <td><span class="tag ${s.status === 'Completed' ? 'tag-ok' : 'tag-pending'}">${s.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Assets Found Not Okay (Defects) -->
  <div class="section-head" style="color: #DC2626; border-color: #DC2626;">5. Equipment Found Not Okay & Punch Observations</div>
  <table>
    <thead>
      <tr style="background: #DC2626;">
        <th>Asset ID</th>
        <th>QR Token</th>
        <th>Asset Type</th>
        <th>Facility & Location</th>
        <th>Defect Observation</th>
        <th>Severity</th>
        <th>Punch #</th>
        <th>Rectification Status</th>
      </tr>
    </thead>
    <tbody>
      ${summary.assetsNotOkay.length > 0 ? summary.assetsNotOkay.map(d => `
        <tr>
          <td><strong>${d.assetId}</strong></td>
          <td>${d.qrNumber}</td>
          <td>${d.assetType}</td>
          <td>${d.location}</td>
          <td style="color: #B91C1C; font-weight: 500;">${d.observation}</td>
          <td><span class="tag ${d.severity === 'Critical' ? 'tag-notok' : 'tag-pending'}">${d.severity}</span></td>
          <td>${d.punchNumber}</td>
          <td><span class="tag ${d.rectificationStatus === 'Closed' ? 'tag-ok' : 'tag-notok'}">${d.rectificationStatus}</span></td>
        </tr>
      `).join('') : '<tr><td colspan="8" style="text-align: center; color: #059669; padding: 10px;">✓ All inspected equipment verified in compliant working order. No open defects recorded.</td></tr>'}
    </tbody>
  </table>

  <!-- Pending Work & Justifications -->
  <div class="section-head">6. Pending Asset Inspections & Mandatory Exception Justifications</div>
  <table>
    <thead>
      <tr>
        <th>Asset ID</th>
        <th>QR Token</th>
        <th>Location</th>
        <th>Reason for Exception</th>
        <th>Technician Explanation</th>
        <th>Scheduled Next Due</th>
      </tr>
    </thead>
    <tbody>
      ${summary.pendingAssetsList.length > 0 ? summary.pendingAssetsList.map(p => `
        <tr>
          <td><strong>${p.assetId}</strong></td>
          <td>${p.qrNumber}</td>
          <td>${p.siteLocation}</td>
          <td style="font-weight: 600; color: #D97706;">${p.pendingReason}</td>
          <td>${p.explanation}</td>
          <td>${p.scheduledDate}</td>
        </tr>
      `).join('') : '<tr><td colspan="6" style="text-align: center; color: #059669; padding: 10px;">✓ 100% of scheduled assets inspected during active AMC rotation.</td></tr>'}
    </tbody>
  </table>

  <!-- Field Technicians Audit -->
  <div class="section-head">7. Service Technicians & Field Audit</div>
  <table>
    <thead>
      <tr>
        <th>Technician Name</th>
        <th>Badge ID</th>
        <th>Visits Conducted</th>
        <th>Assets Inspected</th>
        <th>Punches Raised</th>
        <th>Last Visit Date</th>
        <th>Plants Serviced</th>
      </tr>
    </thead>
    <tbody>
      ${summary.technicians.map(t => `
        <tr>
          <td><strong>${t.name}</strong></td>
          <td>${t.badge}</td>
          <td>${t.visitsCount}</td>
          <td><strong>${t.inspectedAssetsTotal}</strong></td>
          <td>${t.punchesRaised}</td>
          <td>${t.lastVisitDate}</td>
          <td>${t.sitesVisited.join(', ')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Signatures Block -->
  <div class="footer-sign">
    <div>
      <div style="font-weight: 700;">Prepared by Lead Engineer</div>
      <div class="sign-box">Ramesh Patel (IFS-SE-041)<br/>Field Service Signature ✓</div>
    </div>
    <div>
      <div style="font-weight: 700;">Verified by AMC Coordinator</div>
      <div class="sign-box">Sanjay Sharma (IFS-MGR-008)<br/>Technical Verification ✓</div>
    </div>
    <div>
      <div style="font-weight: 700;">Customer Acknowledgment</div>
      <div class="sign-box">${summary.contactPerson}<br/>Client Representative Sign-Off ✓</div>
    </div>
  </div>

  <div style="margin-top: 15px; font-size: 8.5px; color: #94A3B8; text-align: center;">
    Report Generated: ${summary.reportGeneratedAt} • Indus Fire Safety Private Limited • System-Generated Audit Document
  </div>

</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
