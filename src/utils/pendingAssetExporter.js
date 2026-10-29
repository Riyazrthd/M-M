import { COMPANY_INFO } from '../data/checklistTemplates.js';

/**
 * Generates CSV string containing pending assets for an AMC site inspection
 */
export function generatePendingAssetsCSVData({ site, visit, pendingAssets = [], positions = [] }) {
  const assets = pendingAssets.length > 0 ? pendingAssets : positions;
  const siteName = site?.clientName || site?.plantFacility || site?.name || 'Customer Site';
  const siteCode = site?.code || site?.id || 'SITE';
  const workOrder = site?.workOrderRef || site?.poNumber || visit?.workOrderRef || 'WO-AMC';
  const visitId = visit?.visitId || visit?.id || 'VISIT';

  // Build CSV Header & Rows
  const headers = [
    'SR. No.',
    'Asset QR Number / QR ID',
    'Asset Name / Equipment Description',
    'Asset Type',
    'Asset ID / Position ID',
    'Customer / Site Name',
    'Location / Department / Position',
    'Inspection Status'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = assets.map((asset, index) => {
    const loc = [asset.area, asset.locationDescription, asset.location].filter(Boolean).join(' - ') || 'Site Area';
    return [
      escapeCSV(index + 1),
      escapeCSV(asset.qrCode || asset.token || '—'),
      escapeCSV(asset.equipmentType || asset.currentEquipment?.equipmentName || asset.currentEquipment?.type || 'Fire Safety Equipment'),
      escapeCSV(asset.equipmentCategory || asset.equipmentType || 'Asset'),
      escapeCSV(asset.positionId || asset.id),
      escapeCSV(siteName),
      escapeCSV(loc),
      escapeCSV('Pending Inspection')
    ].join(',');
  });

  const metadataLines = [
    `# INDUS FIRE SAFETY PRIVATE LIMITED - PENDING ASSET INSPECTION LIST`,
    `# Customer / Site: ${siteName}`,
    `# Work Order: ${workOrder}`,
    `# Inspection Session: ${visitId}`,
    `# Total Pending Assets: ${assets.length}`,
    `# Generated At: ${new Date().toLocaleString()}`,
    ``
  ];

  return '\uFEFF' + metadataLines.join('\n') + headers.join(',') + '\n' + rows.join('\n');
}

/**
 * Generates and downloads a CSV file containing pending assets for an AMC site inspection
 */
export function downloadPendingAssetsCSV({ site, visit, pendingAssets = [], positions = [] }) {
  const assets = pendingAssets.length > 0 ? pendingAssets : positions;
  const siteCode = site?.code || site?.id || 'SITE';
  const visitId = visit?.visitId || visit?.id || 'VISIT';
  const csvContent = generatePendingAssetsCSVData({ site, visit, pendingAssets: assets });
  const filename = `Pending_Assets_${siteCode}_${visitId}.csv`;

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

  return { success: true, filename, count: assets.length, csvContent };
}

/**
 * Generates and downloads a formatted Excel (.xlsx) file containing pending assets
 */
export async function downloadPendingAssetsExcel({ site, visit, pendingAssets = [], positions = [] }) {
  const assets = pendingAssets.length > 0 ? pendingAssets : positions;
  const siteName = site?.clientName || site?.plantFacility || site?.name || 'Customer Site';
  const siteCode = site?.code || site?.id || 'SITE';
  const workOrder = site?.workOrderRef || site?.poNumber || visit?.workOrderRef || 'WO-AMC';
  const visitId = visit?.visitId || visit?.id || 'VISIT';
  const techName = visit?.technician || visit?.technicianName || visit?.serviceEngineer || 'Ramesh Patel';

  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Indus Fire Safety Private Limited';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Pending Assets', {
    views: [{ showGridLines: true }]
  });

  // 1. Company Header
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'INDUS FIRE SAFETY PRIVATE LIMITED';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 28;

  worksheet.mergeCells('A2:H2');
  const subTitleCell = worksheet.getCell('A2');
  subTitleCell.value = 'AMC SITE INSPECTION — PENDING ASSET AUDIT DOSSIER';
  subTitleCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFDC2626' } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  // 2. Metadata Block
  worksheet.getCell('A4').value = 'Customer / Plant:';
  worksheet.getCell('B4').value = siteName;
  worksheet.getCell('E4').value = 'Work Order / PO:';
  worksheet.getCell('F4').value = workOrder;

  worksheet.getCell('A5').value = 'Inspection Session:';
  worksheet.getCell('B5').value = visitId;
  worksheet.getCell('E5').value = 'Service Engineer:';
  worksheet.getCell('F5').value = techName;

  worksheet.getCell('A6').value = 'Total Pending Count:';
  worksheet.getCell('B6').value = `${pendingAssets.length} Assets Pending Inspection`;
  worksheet.getCell('E6').value = 'Export Timestamp:';
  worksheet.getCell('F6').value = new Date().toLocaleString();

  ['A4', 'E4', 'A5', 'E5', 'A6', 'E6'].forEach(cell => {
    worksheet.getCell(cell).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF475569' } };
  });
  ['B4', 'F4', 'B5', 'F5', 'B6', 'F6'].forEach(cell => {
    worksheet.getCell(cell).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0F172A' } };
  });
  worksheet.getCell('B6').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFDC2626' } };

  // 3. Table Column Headers
  const tableStartRow = 8;
  const headers = [
    'SR. NO.',
    'ASSET QR NUMBER',
    'ASSET NAME',
    'ASSET TYPE',
    'ASSET ID',
    'CUSTOMER / SITE NAME',
    'LOCATION / DEPARTMENT / POSITION',
    'INSPECTION STATUS'
  ];

  const headerRow = worksheet.getRow(tableStartRow);
  headerRow.values = headers;
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF064E3B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // 4. Data Rows
  let currentRowNum = tableStartRow + 1;
  pendingAssets.forEach((asset, idx) => {
    const loc = [asset.area, asset.locationDescription, asset.location].filter(Boolean).join(' - ') || 'Site Area';
    const row = worksheet.getRow(currentRowNum);
    row.values = [
      idx + 1,
      asset.qrCode || asset.token || '—',
      asset.equipmentType || asset.currentEquipment?.equipmentName || 'Fire Safety Equipment',
      asset.equipmentCategory || asset.equipmentType || 'Asset',
      asset.positionId || asset.id,
      siteName,
      loc,
      'Pending'
    ];
    row.height = 20;

    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 8.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (colNum === 1 || colNum === 2 || colNum === 5 || colNum === 8) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      if (colNum === 2 || colNum === 5) {
        cell.font = { name: 'Courier New', size: 8.5, bold: true };
      }

      if (colNum === 8) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
        cell.font = { name: 'Arial', size: 8.5, bold: true, color: { argb: 'FFDC2626' } };
      }
    });

    currentRowNum++;
  });

  // Set explicit column widths
  worksheet.columns = [
    { key: 'srNo', width: 10 },
    { key: 'qrCode', width: 22 },
    { key: 'name', width: 32 },
    { key: 'type', width: 20 },
    { key: 'assetId', width: 18 },
    { key: 'site', width: 28 },
    { key: 'location', width: 34 },
    { key: 'status', width: 18 }
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `Pending_Assets_${siteCode}_${visitId}.xlsx`;

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

  return { success: true, filename, count: pendingAssets.length, buffer };
}
