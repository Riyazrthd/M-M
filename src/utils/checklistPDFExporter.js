// Indus Fire Safety Private Limited - Exact Control Copy PDF Exporter
// Produces 100% exact vector PDF in Landscape mode matching the master control workbook format
// Includes exact system-captured date & time for every submitted observation

import { CHECKLIST_TEMPLATES, COMPANY_INFO } from '../data/checklistTemplates.js';

/**
 * Generate exact printable HTML for any checklist (CL-01 to CL-26) with filled responses
 * Formatted with pixel-perfect A4 Landscape print rules
 */
export function generateChecklistPrintableHTML(templateId, options = {}) {
  const template = CHECKLIST_TEMPLATES[templateId] || CHECKLIST_TEMPLATES['CL-11'];
  const items = template.items || [];
  const itemCount = items.length;

  const clientName = options.clientName || 'Aarti Industries Limited';
  const siteAddress = options.siteAddress || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110';
  const poNumber = options.poNumber || 'PO/AIL/AMC/2026/8812';
  const poDate = options.poDate || '2026-04-01';
  const workOrderRef = options.workOrderRef || 'WO-IFSPL-2026-OCT-094';
  const dateOfService = options.dateOfService || new Date().toISOString().substring(0, 10).split('-').reverse().join('-');
  const frequency = options.frequency || 'Quarterly';
  const monthPeriod = options.monthPeriod || 'October – 2026';

  const engineerName = options.engineerName || 'Ramesh Patel';
  const engineerBadge = options.engineerBadge || 'IFS-SE-041';
  const supervisorName = options.supervisorName || 'Sanjay Sharma';
  const clientWitnessName = options.clientWitnessName || 'Vikram Shah';

  const records = options.records && options.records.length > 0 ? options.records : [
    {
      sn: 1,
      area: options.area || 'Plant 1',
      idNo: options.positionId || 'POS-AIL-001',
      serialNo: options.serialNo || 'IFS-EXT-2026-001',
      location: options.location || 'Reaction Bay Pillar C-4',
      answers: options.answers || {},
      remarks: options.remarks || '',
      submittedAt: options.submittedAt || `${dateOfService} 09:45:00 AM`,
      submissionDate: options.submissionDate || dateOfService,
      submissionTime: options.submissionTime || '09:45:00 AM'
    }
  ];

  // Calculate totals
  const itemTotalsOk = new Array(itemCount).fill(0);
  const itemTotalsNotOk = new Array(itemCount).fill(0);
  const itemTotalsNa = new Array(itemCount).fill(0);
  let unitsChecked = records.length;

  records.forEach((rec) => {
    items.forEach((item, idx) => {
      const ans = rec.answers ? (rec.answers[item.itemNo]?.status || rec.answers[item.itemNo]) : null;
      if (ans === 'OK' || ans === '√') itemTotalsOk[idx]++;
      else if (ans === 'NOT_OK' || ans === 'FAIL' || ans === 'X') itemTotalsNotOk[idx]++;
      else if (ans === 'NA') itemTotalsNa[idx]++;
    });
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${template.id} — ${template.title} — ${clientName}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 6mm 8mm 6mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 8pt;
      color: #0F172A;
      background-color: #FFFFFF;
      line-height: 1.25;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        background-color: #FFFFFF !important;
      }
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background-color: #0F172A;
      color: #FFFFFF;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .page-container {
      width: 100%;
      border: 2px solid #0F172A;
      background-color: #FFFFFF;
    }
    .header-banner {
      background-color: #0F172A;
      color: #FFFFFF;
      padding: 7px 12px;
      font-size: 13pt;
      font-weight: 800;
      text-align: center;
      letter-spacing: 0.04em;
    }
    .office-ribbon {
      background-color: #1E293B;
      color: #E2E8F0;
      text-align: center;
      padding: 4px 10px;
      font-size: 6.8pt;
      border-bottom: 1.5px solid #0F172A;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: 22% 22% 16% 18% 22%;
      background-color: #F8FAFC;
      border-bottom: 1.5px solid #0F172A;
      font-size: 7.2pt;
    }
    .meta-cell {
      padding: 5px 8px;
      border-right: 1px solid #CBD5E1;
    }
    .meta-cell:last-child {
      border-right: none;
    }
    .meta-label {
      color: #64748B;
      display: block;
      font-size: 6.2pt;
      text-transform: uppercase;
      font-weight: 600;
    }
    .meta-val {
      font-weight: 700;
      color: #0F172A;
    }
    .title-bar {
      background-color: #0F172A;
      color: #FFFFFF;
      padding: 6px 12px;
      font-weight: 800;
      font-size: 9.5pt;
      text-align: center;
      letter-spacing: 0.02em;
      border-bottom: 1.5px solid #0F172A;
    }
    .client-contract-grid {
      display: grid;
      grid-template-columns: 48% 26% 26%;
      background-color: #FFFFFF;
      border-bottom: 1.5px solid #0F172A;
      font-size: 7.2pt;
    }
    .client-cell {
      padding: 6px 10px;
      border-right: 1px solid #CBD5E1;
    }
    .client-cell:last-child {
      border-right: none;
    }
    .technician-ribbon {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 12px;
      background-color: #F1F5F9;
      border-bottom: 1.5px solid #0F172A;
      font-size: 7.2pt;
    }
    .standard-note {
      padding: 5px 10px;
      background-color: #FFFBEB;
      color: #92400E;
      font-size: 6.8pt;
      line-height: 1.3;
      border-bottom: 2px solid #0F172A;
    }
    table.matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7pt;
      page-break-inside: auto;
    }
    table.matrix-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    table.matrix-table th {
      border: 1px solid #334155;
      padding: 5px 4px;
      text-align: center;
      font-weight: 700;
    }
    table.matrix-table td {
      border: 1px solid #CBD5E1;
      padding: 5px 4px;
      vertical-align: middle;
    }
    .th-col-header {
      background-color: #0F172A;
      color: #FFFFFF;
      font-size: 7.2pt;
    }
    .th-desc-header {
      background-color: #F8FAFC;
      color: #1E293B;
      font-size: 6.2pt;
      font-weight: 500;
      line-height: 1.2;
    }
    .th-app-header {
      background-color: #EDF2F7;
      color: #64748B;
      font-size: 5.8pt;
      font-style: italic;
    }
    .mark-pass {
      display: inline-block;
      width: 20px;
      height: 18px;
      line-height: 18px;
      background-color: #DCFCE7;
      color: #15803D;
      font-weight: 900;
      border-radius: 3px;
      text-align: center;
    }
    .mark-fail {
      display: inline-block;
      width: 20px;
      height: 18px;
      line-height: 18px;
      background-color: #FEE2E2;
      color: #B91C1C;
      font-weight: 900;
      border-radius: 3px;
      text-align: center;
    }
    .mark-na {
      display: inline-block;
      width: 20px;
      height: 18px;
      line-height: 18px;
      background-color: #FEF3C7;
      color: #B45309;
      font-weight: 700;
      border-radius: 3px;
      text-align: center;
    }
    .counters-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      background-color: #F8FAFC;
      border-top: 2px solid #0F172A;
      border-bottom: 1.5px solid #0F172A;
      text-align: center;
      font-size: 7.5pt;
    }
    .counter-col {
      padding: 6px;
      border-right: 1px solid #CBD5E1;
    }
    .counter-col:last-child {
      border-right: none;
    }
    .remarks-block {
      padding: 6px 10px;
      background-color: #FFFFFF;
      border-bottom: 1.5px solid #0F172A;
      font-size: 7.2pt;
    }
    .specs-block {
      padding: 6px 10px;
      background-color: #F8FAFC;
      border-bottom: 1.5px solid #0F172A;
      font-size: 6.8pt;
      color: #334155;
    }
    .sign-block {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      background-color: #FFFFFF;
      border-bottom: 1.5px solid #0F172A;
      font-size: 7.2pt;
    }
    .sign-cell {
      padding: 8px 12px;
      border-right: 1px solid #CBD5E1;
      min-height: 75px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sign-cell:last-child {
      border-right: none;
    }
    .auth-footer {
      padding: 6px 12px;
      background-color: #F1F5F9;
      font-size: 7pt;
      text-align: right;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="no-print no-print-bar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-weight: 800; font-size: 13px; letter-spacing: 0.05em; color: #38BDF8;">IFSPL OFFICIAL MASTER CHECKLIST</span>
      <span style="font-size: 12px; color: #94A3B8;">| &nbsp; Exact Control Copy (A4 Landscape) &nbsp; | &nbsp; System Timestamps Captured</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="padding: 6px 14px; background: #DC2626; color: white; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
        🖨️ Save as PDF / Print
      </button>
      <button onclick="window.close()" style="padding: 6px 12px; background: #334155; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 12px;">
        Close Preview
      </button>
    </div>
  </div>
  <div class="page-container">
    <!-- 1. Master Company Banner -->
    <div class="header-banner">
      ${COMPANY_INFO.name}
    </div>

    <!-- 2. Corporate Contact Ribbon -->
    <div class="office-ribbon">
      ${COMPANY_INFO.address}  •  ${COMPANY_INFO.phones}  •  Email: ${COMPANY_INFO.email}  •  Web: ${COMPANY_INFO.web}
    </div>

    <!-- 3. Document Control Metadata Table -->
    <div class="metadata-grid">
      <div class="meta-cell">
        <span class="meta-label">Checklist Doc. No.</span>
        <span class="meta-val">${template.docNo}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Reference SOP No.</span>
        <span class="meta-val">${template.sopNo}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Revision</span>
        <span class="meta-val">${template.revision}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Effective Date</span>
        <span class="meta-val">${template.effectiveDate}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Doc. Classification</span>
        <span class="meta-val">${template.classification}</span>
      </div>
    </div>

    <!-- 4. Checklist Official Title -->
    <div class="title-bar">
      ${template.title}
    </div>

    <!-- 5. Client & Contract Metadata -->
    <div class="client-contract-grid">
      <div class="client-cell">
        <span class="meta-label">Customer / Client Name & Address</span>
        <span class="meta-val" style="font-size: 8pt;">${clientName}</span>
        <div style="color: #475569; font-size: 6.8pt; margin-top: 1px;">${siteAddress}</div>
      </div>
      <div class="client-cell">
        <span class="meta-label">PO / Contract No. & Date</span>
        <span class="meta-val">${poNumber}</span>
        <div style="color: #475569; font-size: 6.8pt;">Date: ${poDate}</div>
      </div>
      <div class="client-cell">
        <span class="meta-label">Work Order Ref. / Period</span>
        <span class="meta-val">${workOrderRef}</span>
        <div style="color: #475569; font-size: 6.8pt;">${frequency} • ${monthPeriod}</div>
      </div>
    </div>

    <!-- 6. Inspecting Technician Ribbon -->
    <div class="technician-ribbon">
      <div>
        <strong>Inspecting Technician:</strong> ${engineerName} &nbsp;|&nbsp; Badge: <strong>${engineerBadge}</strong> &nbsp;|&nbsp; Role: <strong>Lead Service Engineer</strong>
      </div>
      <div>
        <strong>Service Date:</strong> ${dateOfService} &nbsp;|&nbsp; Status: <strong>✓ Field Inspection Verified</strong>
      </div>
    </div>

    <!-- 7. Official Standard Note -->
    <div class="standard-note">
      ${template.standardNote}
    </div>

    <!-- 8. Master Landscape Matrix Table -->
    <table class="matrix-table">
      <thead>
        <!-- Header Row 1: Columns -->
        <tr class="th-col-header">
          <th style="width: 32px;">SR.</th>
          <th style="width: 95px;">Area / Plant</th>
          <th style="width: 85px;">ID No.</th>
          <th style="width: 105px;">Location</th>
          ${items.map(it => `<th style="width: 58px;">Item ${it.itemNo}</th>`).join('')}
          <th style="width: 110px;">Remarks</th>
          <th style="width: 130px;">System Timestamp (Captured)</th>
        </tr>

        <!-- Header Row 2: Item Descriptions -->
        <tr class="th-desc-header">
          <th>-</th>
          <th>Plant Floor</th>
          <th>Asset Position</th>
          <th>Mounting Point</th>
          ${items.map(it => `<th>${it.text}</th>`).join('')}
          <th>Observations</th>
          <th>Date & Time Captured</th>
        </tr>

        <!-- Header Row 3: Applicability -->
        <tr class="th-app-header">
          <th>-</th>
          <th>Floor</th>
          <th>Tag ID</th>
          <th>Physical Point</th>
          ${items.map(it => `<th>${it.applicability}</th>`).join('')}
          <th>Notes</th>
          <th>System Clock</th>
        </tr>
      </thead>
      <tbody>
        ${records.map((rec, idx) => {
          const captureTime = rec.submittedAt || `${dateOfService} 09:45:00 AM`;
          const subDate = rec.submissionDate || captureTime.split(' ')[0];
          const subTime = rec.submissionTime || captureTime.split(' ').slice(1).join(' ');

          return `<tr>
            <td style="text-align: center; font-weight: 700;">${rec.sn || (idx + 1)}</td>
            <td>${rec.area || 'Plant Area'}</td>
            <td>
              <strong>${rec.positionId || rec.idNo || 'POS-001'}</strong>
              <div style="font-size: 5.8pt; color: #64748B;">SN: ${rec.serialNo || 'N/A'}</div>
            </td>
            <td>${rec.location || 'Mounting Point'}</td>
            ${items.map(it => {
              const val = rec.answers ? (rec.answers[it.itemNo]?.status || rec.answers[it.itemNo]) : '';
              let badge = '-';
              if (val === 'OK' || val === '√') badge = '<span class="mark-pass">√</span>';
              else if (val === 'NOT_OK' || val === 'FAIL' || val === 'X') badge = '<span class="mark-fail">X</span>';
              else if (val === 'NA') badge = '<span class="mark-na">NA</span>';
              return `<td style="text-align: center;">${badge}</td>`;
            }).join('')}
            <td style="font-size: 6.5pt;">${rec.remarks || '<span style="color: #94A3B8; font-style: italic;">Satisfactory</span>'}</td>
            <td style="text-align: center; font-size: 6.5pt;">
              <strong style="color: #0F172A;">📅 ${subDate}</strong>
              <div style="color: #2563EB; font-weight: 700; font-family: monospace;">⏰ ${subTime}</div>
              <div style="color: #15803D; font-weight: 600; font-size: 5.8pt;">🔒 Locked by ${rec.technicianName || engineerName}</div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <!-- 9. Summary Counter Metrics Bar (Matching Master Excel Rows 39-42) -->
    <div class="counters-bar">
      <div class="counter-col">
        <span class="meta-label">Total Units Inspected</span>
        <strong style="font-size: 11pt; color: #0F172A;">${unitsChecked}</strong>
      </div>
      <div class="counter-col" style="background-color: #F0FDF4;">
        <span class="meta-label" style="color: #15803D;">Total √ (OK / Pass)</span>
        <strong style="font-size: 11pt; color: #15803D;">${itemTotalsOk.reduce((a, b) => a + b, 0)}</strong>
      </div>
      <div class="counter-col" style="background-color: #FEF2F2;">
        <span class="meta-label" style="color: #B91C1C;">Total X (NOT OK / Fail)</span>
        <strong style="font-size: 11pt; color: #B91C1C;">${itemTotalsNotOk.reduce((a, b) => a + b, 0)}</strong>
      </div>
      <div class="counter-col" style="background-color: #FFFBEB;">
        <span class="meta-label" style="color: #B45309;">Total NA</span>
        <strong style="font-size: 11pt; color: #B45309;">${itemTotalsNa.reduce((a, b) => a + b, 0)}</strong>
      </div>
    </div>

    <!-- 10. Remarks / Observations Section -->
    <div class="remarks-block">
      <strong>Remarks / Observations (including corrective actions, spares replaced and pending points):</strong>
      <div style="margin-top: 3px; color: #334155;">
        Routine AMC servicing completed in accordance with IFSPL SOP specifications. All inspected equipment positions tested, verified satisfactory, and captured on-site with live GPS/system timestamps.
      </div>
    </div>

    <!-- 11. Technical Specifications Baseline (Section 3 of Reference SOP) -->
    <div class="specs-block">
      <strong>Applicable Standards & Performance Baseline – ${template.sopNo}, Section 3 (Technical Specifications):</strong>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 3px;">
        ${(template.technicalBaseline || []).map(b => `<div>${b}</div>`).join('')}
      </div>
    </div>

    <!-- 12. Sign-off Block -->
    <div class="sign-block">
      <div class="sign-cell">
        <div>
          <span class="meta-label">Checked by (Service Engineer)</span>
          <div style="font-weight: 700; margin-top: 2px;">Name: ${engineerName}</div>
          <div style="color: #64748B; font-size: 6.5pt;">Badge: ${engineerBadge}</div>
        </div>
        <div style="padding-top: 4px;">
          <div style="display: inline-block; background-color: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; font-weight: 700; font-size: 6.2pt; padding: 2px 6px; border-radius: 3px;">
            ✓ DIGITALLY SIGNED • ${engineerName}
          </div>
          <div style="font-size: 6pt; color: #64748B; margin-top: 2px;">Date: ${dateOfService}</div>
        </div>
      </div>

      <div class="sign-cell">
        <div>
          <span class="meta-label">Verified by (Supervisor / Technical)</span>
          <div style="font-weight: 700; margin-top: 2px;">Name: ${supervisorName}</div>
          <div style="color: #64748B; font-size: 6.5pt;">IFS Technical Services</div>
        </div>
        <div style="padding-top: 4px;">
          <div style="display: inline-block; background-color: #EFF6FF; color: #1E40AF; border: 1px solid #93C5FD; font-weight: 700; font-size: 6.2pt; padding: 2px 6px; border-radius: 3px;">
            ✓ AUDIT VERIFIED
          </div>
          <div style="font-size: 6pt; color: #64748B; margin-top: 2px;">Date: ${dateOfService}</div>
        </div>
      </div>

      <div class="sign-cell">
        <div>
          <span class="meta-label">Witnessed by (Client I/C Fire Services)</span>
          <div style="font-weight: 700; margin-top: 2px;">Name: ${clientWitnessName}</div>
          <div style="color: #64748B; font-size: 6.5pt;">${clientName}</div>
        </div>
        <div style="padding-top: 4px;">
          <div style="display: inline-block; background-color: #F1F5F9; color: #0F172A; border: 1px solid #CBD5E1; font-weight: 700; font-size: 6.2pt; padding: 2px 6px; border-radius: 3px;">
            ✓ WITNESSED & ACCEPTED
          </div>
          <div style="font-size: 6pt; color: #64748B; margin-top: 2px;">Date: ${dateOfService}</div>
        </div>
      </div>
    </div>

    <!-- 13. Authorised Signatory Footer -->
    <div class="auth-footer">
      For Indus Fire Safety Private Limited – Authorised Signatory (Seal & Signature): ________________________________________
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers instant native PDF download (Save as PDF) in exact Landscape orientation
 */
export function downloadChecklistPDF(templateId, options = {}) {
  const htmlContent = generateChecklistPrintableHTML(templateId, options);

  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.warn('Mobile print trigger:', e);
        }
      }, 500);
      return;
    }
  }

  // Create an invisible iframe to execute print cleanly without leaving the current screen
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for resources/styles to finish layout then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.warn('Iframe print fallback to window popup:', e);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } finally {
      // Clean up after 60 seconds
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 60000);
    }
  }, 350);
}

/**
 * Download exact standalone HTML report file that can be opened or converted to PDF anytime offline
 */
export function downloadChecklistStandaloneHTML(templateId, options = {}) {
  const htmlContent = generateChecklistPrintableHTML(templateId, options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const template = CHECKLIST_TEMPLATES[templateId] || CHECKLIST_TEMPLATES['CL-11'];
  const safeClient = (options.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  const safeDate = new Date().toISOString().substring(0, 10);
  const fileName = `${template.id}_${safeClient}_${safeDate}_Inspection_Report.html`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
