import ExcelJS from 'exceljs';
import { COMPANY_INFO } from '../data/checklistTemplates.js';

/**
 * Generates and downloads a CSV export of fire extinguishers for a client
 */
export function downloadClientExtinguishersCSV({ clientName, siteName, extinguishers = [] }) {
  const safeClient = clientName || 'Client';
  const headers = [
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

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = extinguishers.map((pos, idx) => {
    const loc = [pos.area, pos.locationDescription || pos.location].filter(Boolean).join(' — ') || 'Facility Area';
    return [
      escapeCSV(idx + 1),
      escapeCSV(pos.positionId || pos.id),
      escapeCSV(pos.qrCode || pos.qrToken || '—'),
      escapeCSV(pos.clientName || clientName || 'Client Organisation'),
      escapeCSV(pos.siteName || siteName || 'Plant Facility'),
      escapeCSV(loc),
      escapeCSV(pos.currentEquipment?.type || pos.equipmentType || 'Fire Extinguisher'),
      escapeCSV(pos.currentEquipment?.capacity || '—'),
      escapeCSV(pos.currentEquipment?.make || pos.currentEquipment?.manufacturer || 'Indus SafeGuard'),
      escapeCSV(pos.currentEquipment?.serialNo || pos.currentEquipment?.serialNumber || '—'),
      escapeCSV(pos.currentEquipment?.installationDate || pos.installationDate || '—'),
      escapeCSV(pos.lastInspectionDate || pos.inspectionHistory?.[0]?.inspectionDate || '—'),
      escapeCSV(pos.currentEquipment?.nextServiceDueDate || pos.currentEquipment?.nextHydroTestDue || pos.nextInspectionDueDate || '—'),
      escapeCSV(pos.inspectionStatus || pos.operationalStatus || pos.status || 'Active')
    ].join(',');
  });

  const metadataLines = [
    `# INDUS FIRE SAFETY PRIVATE LIMITED — REGISTERED FIRE EXTINGUISHER INVENTORY`,
    `# Client: ${safeClient}`,
    `# Total Extinguishers: ${extinguishers.length}`,
    `# Export Date: ${new Date().toLocaleString()}`,
    ``
  ];

  const csvContent = '\uFEFF' + metadataLines.join('\n') + headers.join(',') + '\n' + rows.join('\n');
  const filename = `Fire_Extinguishers_${safeClient.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().substring(0, 10)}.csv`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof Blob !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return { success: true, filename, count: extinguishers.length, csvContent };
}

/**
 * Generates and downloads a formatted Excel (.xlsx) file containing fire extinguishers for a client
 */
export async function downloadClientExtinguishersExcel({ clientName, siteName, extinguishers = [] }) {
  const safeClient = clientName || 'Client';
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Indus Fire Safety Private Limited';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Extinguisher Inventory', {
    views: [{ showGridLines: true }]
  });

  // 1. Company Header Banner
  worksheet.mergeCells('A1:N1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'INDUS FIRE SAFETY PRIVATE LIMITED';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 28;

  worksheet.mergeCells('A2:N2');
  const subTitleCell = worksheet.getCell('A2');
  subTitleCell.value = 'FIRE EXTINGUISHER ASSET INVENTORY & COMPLIANCE DOSSIER';
  subTitleCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFDC2626' } }; // Crimson
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  // 2. Metadata Block
  worksheet.getCell('A4').value = 'Client Name:';
  worksheet.getCell('B4').value = safeClient;
  worksheet.getCell('G4').value = 'Total Quantity:';
  worksheet.getCell('H4').value = `${extinguishers.length} Registered Extinguishers`;

  worksheet.getCell('A5').value = 'Facility / Site:';
  worksheet.getCell('B5').value = siteName || 'All Contracted Plants';
  worksheet.getCell('G5').value = 'Generated Timestamp:';
  worksheet.getCell('H5').value = new Date().toLocaleString();

  ['A4', 'G4', 'A5', 'G5'].forEach(cell => {
    worksheet.getCell(cell).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF475569' } };
  });
  ['B4', 'H4', 'B5', 'H5'].forEach(cell => {
    worksheet.getCell(cell).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0F172A' } };
  });

  // 3. Table Column Headers
  const headers = [
    { header: 'SR. No.', key: 'srNo', width: 8 },
    { header: 'Asset ID', key: 'assetId', width: 16 },
    { header: 'QR Number', key: 'qrNumber', width: 18 },
    { header: 'Client Name', key: 'clientName', width: 24 },
    { header: 'Site / Plant Name', key: 'siteName', width: 26 },
    { header: 'Location / Position', key: 'location', width: 32 },
    { header: 'Extinguisher Type', key: 'type', width: 28 },
    { header: 'Capacity', key: 'capacity', width: 12 },
    { header: 'Make / Manufacturer', key: 'make', width: 22 },
    { header: 'Serial Number', key: 'serialNumber', width: 20 },
    { header: 'Installation Date', key: 'installationDate', width: 16 },
    { header: 'Last Inspection', key: 'lastInspection', width: 16 },
    { header: 'Next Due Date', key: 'nextDue', width: 16 },
    { header: 'Asset Status', key: 'status', width: 18 }
  ];

  const headerRowIdx = 7;
  const headerRow = worksheet.getRow(headerRowIdx);
  headerRow.height = 24;

  headers.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6B63' } }; // Deep Teal
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
    worksheet.getColumn(idx + 1).width = col.width;
  });

  // 4. Data Rows
  extinguishers.forEach((pos, idx) => {
    const rowIdx = headerRowIdx + 1 + idx;
    const row = worksheet.getRow(rowIdx);
    row.height = 20;

    const loc = [pos.area, pos.locationDescription || pos.location].filter(Boolean).join(' — ') || 'Facility Area';
    const rowData = [
      idx + 1,
      pos.positionId || pos.id,
      pos.qrCode || pos.qrToken || '—',
      pos.clientName || clientName || 'Client Organisation',
      pos.siteName || siteName || 'Plant Facility',
      loc,
      pos.currentEquipment?.type || pos.equipmentType || 'Fire Extinguisher',
      pos.currentEquipment?.capacity || '—',
      pos.currentEquipment?.make || pos.currentEquipment?.manufacturer || 'Indus SafeGuard',
      pos.currentEquipment?.serialNo || pos.currentEquipment?.serialNumber || '—',
      pos.currentEquipment?.installationDate || pos.installationDate || '—',
      pos.lastInspectionDate || pos.inspectionHistory?.[0]?.inspectionDate || '—',
      pos.currentEquipment?.nextServiceDueDate || pos.currentEquipment?.nextHydroTestDue || pos.nextInspectionDueDate || '—',
      pos.inspectionStatus || pos.operationalStatus || pos.status || 'Active'
    ];

    rowData.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      cell.font = { name: 'Arial', size: 8.5 };
      cell.alignment = {
        horizontal: cIdx === 0 || cIdx === 7 ? 'center' : (cIdx === 1 || cIdx === 2 || cIdx === 9 || cIdx === 10 || cIdx === 11 || cIdx === 12 || cIdx === 13) ? 'center' : 'left',
        vertical: 'middle'
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `Fire_Extinguishers_${safeClient.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().substring(0, 10)}.xlsx`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof Blob !== 'undefined') {
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

  return { success: true, filename, count: extinguishers.length };
}

/**
 * Triggers clean browser print for the complete extinguisher inventory
 */
export function printClientExtinguishersReport({ clientName, siteName, extinguishers = [] }) {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const safeClient = clientName || 'Client Organisation';
  const tableRows = extinguishers.map((pos, idx) => {
    const loc = [pos.area, pos.locationDescription || pos.location].filter(Boolean).join(' — ') || 'Facility Area';
    return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${pos.positionId || pos.id}</strong></td>
        <td><code>${pos.qrCode || pos.qrToken || '—'}</code></td>
        <td>${pos.currentEquipment?.type || pos.equipmentType || 'Fire Extinguisher'}</td>
        <td style="text-align:center;">${pos.currentEquipment?.capacity || '—'}</td>
        <td>${pos.currentEquipment?.make || pos.currentEquipment?.manufacturer || 'Indus SafeGuard'}</td>
        <td><code>${pos.currentEquipment?.serialNo || pos.currentEquipment?.serialNumber || '—'}</code></td>
        <td>${loc}</td>
        <td style="text-align:center;">${pos.lastInspectionDate || pos.inspectionHistory?.[0]?.inspectionDate || '—'}</td>
        <td style="text-align:center;">${pos.currentEquipment?.nextServiceDueDate || pos.currentEquipment?.nextHydroTestDue || pos.nextInspectionDueDate || '—'}</td>
        <td style="text-align:center;">${pos.inspectionStatus || pos.operationalStatus || pos.status || 'Active'}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fire Extinguisher Inventory — ${safeClient}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 20px; color: #0F172A; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0B6B63; padding-bottom: 12px; margin-bottom: 16px; }
          .company-title { font-size: 18px; font-weight: 800; color: #0F172A; letter-spacing: -0.02em; }
          .sub { font-size: 11px; color: #64748B; margin-top: 2px; }
          .report-title { font-size: 15px; font-weight: 700; color: #0B6B63; text-align: right; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; }
          .meta-item strong { color: #475569; font-size: 11px; display: block; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background-color: #0F172A; color: white; padding: 6px 8px; font-weight: 600; text-align: left; }
          td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          code { font-family: monospace; background: #EEF2F6; padding: 1px 4px; border-radius: 3px; font-size: 10px; }
          @media print {
            body { margin: 10mm; }
            th { background-color: #0F172A !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-title">INDUS FIRE SAFETY PRIVATE LIMITED</div>
            <div class="sub">Comprehensive AMC Fire Extinguisher Asset Inventory & Inspection Record</div>
          </div>
          <div>
            <div class="report-title">REGISTERED EXTINGUISHER INVENTORY</div>
            <div class="sub" style="text-align: right;">Generated: ${new Date().toLocaleString()}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <strong>Client Name</strong>
            <div>${safeClient}</div>
          </div>
          <div class="meta-item">
            <strong>Facility / Site</strong>
            <div>${siteName || 'All Contracted Plants'}</div>
          </div>
          <div class="meta-item">
            <strong>Total Extinguishers</strong>
            <div style="font-weight: 700; color: #0B6B63;">${extinguishers.length} Registered Units</div>
          </div>
          <div class="meta-item">
            <strong>Compliance Standard</strong>
            <div>IS 2190 / IS 15683 Proof Tested</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align:center;">#</th>
              <th>Asset ID</th>
              <th>QR Code</th>
              <th>Type</th>
              <th style="text-align:center;">Cap.</th>
              <th>Make</th>
              <th>Serial No.</th>
              <th>Location</th>
              <th style="text-align:center;">Last Insp.</th>
              <th style="text-align:center;">Next Due</th>
              <th style="text-align:center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 12px;">
          <div>Indus Fire Safety Pvt. Ltd. · AMC Maintenance Portal</div>
          <div>Page 1 of 1 · Verified Asset Record</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
}
