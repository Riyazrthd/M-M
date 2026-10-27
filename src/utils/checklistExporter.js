// Indus Fire Safety Private Limited - Exact Control Copy Checklist Exporter
// Produces 100% exact CSV and Excel (.xlsx) matching the master control workbook format

import ExcelJS from 'exceljs';
import { CHECKLIST_TEMPLATES, COMPANY_INFO } from '../data/checklistTemplates';

/**
 * Escape CSV fields containing commas or quotes
 */
function escapeCSV(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate exact CSV text for any checklist (CL-01 to CL-26) with filled responses
 */
export function generateChecklistCSV(templateId, options = {}) {
  const template = CHECKLIST_TEMPLATES[templateId] || CHECKLIST_TEMPLATES['CL-11'];
  const items = template.items || [];
  const itemCount = items.length;

  // Number of columns: 4 fixed prefix (SN, Area, ID No., Location) + itemCount + 1 (Remarks)
  const totalCols = 4 + itemCount + 1;
  const commas = (count) => ','.repeat(Math.max(0, count));

  // Options & Metadata
  const clientName = options.clientName || 'Aarti Industries Limited';
  const siteAddress = options.siteAddress || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110';
  const clientFull = `"${clientName}, ${siteAddress}"`;
  const poNumber = options.poNumber || 'PO/AIL/AMC/2026/8812';
  const workOrderRef = options.workOrderRef || 'WO-IFSPL-2026-OCT-094';
  const dateOfService = options.dateOfService || new Date().toISOString().substring(0, 10).split('-').reverse().join('-');
  const frequency = options.frequency || 'Quarterly';
  const monthPeriod = options.monthPeriod || 'October – 2026';
  
  // Technician & Signatory details
  const engineerName = options.engineerName || 'Ramesh Patel';
  const supervisorName = options.supervisorName || 'Sanjay Sharma';
  const clientWitnessName = options.clientWitnessName || 'Vikram Shah';
  const techSig = options.techSig !== undefined ? options.techSig : true;
  const clientSig = options.clientSig !== undefined ? options.clientSig : true;

  // Actual filled rows or sample rows
  const records = options.records && options.records.length > 0 ? options.records : [
    {
      sn: 1,
      area: options.area || 'Plant 1',
      idNo: options.positionId || 'POS-001',
      location: options.location || 'Reaction Bay Pillar C-4',
      answers: options.answers || {},
      remarks: options.remarks || ''
    }
  ];

  // Build CSV Lines
  const lines = [];

  // 1. Company Header
  lines.push(`INDUS FIRE SAFETY PRIVATE LIMITED${commas(totalCols - 1)}`);
  lines.push(`"Corporate Office: 903, Atlantis Heights, Sarabhai Compound, Vadodara-390 023, India.  Tele: 0265 2343441, 2343442, 2341633  |  Email: maint.ifss@yahoo.com  |  Web: www.indusfiresafety.com"${commas(totalCols - 1)}`);

  // 2. Document Info Line
  lines.push(`Checklist Doc. No.,,,Reference SOP No.,,,Revision,,,Effective Date,,,Doc. Type / Classification,,${commas(totalCols - 15)}`);
  lines.push(`${template.docNo},,,${template.sopNo},,,${template.revision},,,${template.effectiveDate},,,${template.classification},,${commas(totalCols - 15)}`);

  // 3. Checklist Title
  lines.push(`${template.title}${commas(totalCols - 1)}`);

  // 4. Client & PO Metadata
  lines.push(`Client Name & Address,,,${clientFull}${commas(totalCols - 4)}`);
  lines.push(`PO / Contract No.,,,${escapeCSV(poNumber)},,,,,Job,,"AMC – Testing, inspection & maintenance of fire protection equipment",,,,${commas(totalCols - 15)}`);
  lines.push(`Work Order / Ref. No.,,,${escapeCSV(workOrderRef)},,,,,Date of Service,,${dateOfService}${options.inspectionTime ? ' ' + options.inspectionTime : ''},,,,${commas(totalCols - 15)}`);
  lines.push(`Frequency,,,${escapeCSV(frequency)},,,,,Month / Period,,${escapeCSV(monthPeriod)},,,,${commas(totalCols - 15)}`);

  // 5. Standard Note Line
  lines.push(`"${template.standardNote}"${commas(totalCols - 1)}`);

  // 6. Table Header Line (Row 1)
  const headerCols = ['SN', 'Area / Plant', 'ID No.', 'Location'];
  items.forEach((item, idx) => {
    headerCols.push(`Item ${idx + 1}`);
  });
  headerCols.push('Remarks');
  lines.push(headerCols.join(','));

  // 7. Item Descriptions Line (Row 2)
  const descCols = ['', '', '', ''];
  items.forEach((item) => {
    descCols.push(escapeCSV(item.text));
  });
  descCols.push('');
  lines.push(descCols.join(','));

  // 8. Item Applicability Line (Row 3)
  const appCols = ['', '', '', ''];
  items.forEach((item) => {
    appCols.push(escapeCSV(item.applicability));
  });
  appCols.push('');
  lines.push(appCols.join(','));

  // 9. Data Rows (Up to 25 standard rows)
  const itemTotalsOk = new Array(itemCount).fill(0);
  const itemTotalsNotOk = new Array(itemCount).fill(0);
  const itemTotalsNa = new Array(itemCount).fill(0);
  let unitsCheckedCount = 0;

  for (let r = 1; r <= 25; r++) {
    const rec = records[r - 1];
    if (rec) {
      unitsCheckedCount++;
      const rowCols = [
        rec.sn || r,
        escapeCSV(rec.area || ''),
        escapeCSV(rec.idNo || ''),
        escapeCSV(rec.location || '')
      ];

      items.forEach((item, idx) => {
        const ans = rec.answers ? rec.answers[item.itemNo] : null;
        let symbol = '';
        if (ans) {
          const status = ans.status || ans;
          if (status === 'OK' || status === '√') {
            symbol = '√';
            itemTotalsOk[idx]++;
          } else if (status === 'NOT_OK' || status === 'FAIL' || status === 'X') {
            symbol = 'X';
            itemTotalsNotOk[idx]++;
          } else if (status === 'NA') {
            symbol = 'NA';
            itemTotalsNa[idx]++;
          }
        }
        rowCols.push(symbol);
      });

      rowCols.push(escapeCSV(rec.remarks || ''));
      lines.push(rowCols.join(','));
    } else {
      // Empty row placeholder up to row 25
      lines.push(`${r}${commas(totalCols - 1)}`);
    }
  }

  // 10. Summary Totals Rows
  lines.push(`Equipment / units checked (nos.),,,,${unitsCheckedCount}${commas(totalCols - 5)}`);
  lines.push(`Total √ (OK / Pass),,,,${itemTotalsOk.join(',')},`);
  lines.push(`Total X (NOT OK / Fail),,,,${itemTotalsNotOk.join(',')},`);
  lines.push(`Total NA,,,,${itemTotalsNa.join(',')},`);

  // Empty separator
  lines.push(commas(totalCols - 1));

  // 11. Remarks / Observations Section
  lines.push(`"Remarks / Observations (including corrective actions, spares replaced and pending points)"${commas(totalCols - 1)}`);
  const visitRemarks = options.visitRemarks || 'AMC quarterly routine service completed in accordance with reference SOP.';
  const sparesReplaced = options.sparesReplaced ? `Spares replaced: ${options.sparesReplaced}` : '';
  const pendingPoints = options.pendingPoints ? `Pending points: ${options.pendingPoints}` : '';
  lines.push(escapeCSV(visitRemarks) + commas(totalCols - 1));
  if (sparesReplaced) lines.push(escapeCSV(sparesReplaced) + commas(totalCols - 1));
  if (pendingPoints) lines.push(escapeCSV(pendingPoints) + commas(totalCols - 1));
  lines.push(commas(totalCols - 1));

  // 12. Technical Specifications & Baseline Section
  lines.push(`"Applicable standards & performance baseline – ${template.sopNo}, Section 3 (Technical Specifications & Performance Baseline)"${commas(totalCols - 1)}`);
  if (template.technicalBaseline) {
    template.technicalBaseline.forEach((bullet) => {
      lines.push(escapeCSV(bullet) + commas(totalCols - 1));
    });
  }
  lines.push(commas(totalCols - 1));

  // 13. Sign-off Block
  lines.push(`Checked by (Service Engineer),,,,,Verified by (Supervisor / Technical),,,,,Witnessed by (Client I/C Fire Services),,,,${commas(totalCols - 15)}`);
  lines.push(`Name: ${engineerName},,,,,Name: ${supervisorName},,,,,Name: ${clientWitnessName},,,,${commas(totalCols - 15)}`);
  lines.push(`Signature: ${techSig ? `[DIGITALLY SIGNED - ${engineerName}]` : ''},,,,,Signature: [VERIFIED],,,,,Signature: ${clientSig ? `[DIGITALLY SIGNED - ${clientWitnessName}]` : ''},,,,${commas(totalCols - 15)}`);
  lines.push(`Date: ${dateOfService}${options.inspectionTime ? ' ' + options.inspectionTime : ''},,,,,Date: ${dateOfService},,,,,Date: ${dateOfService},,,,${commas(totalCols - 15)}`);
  lines.push(`For Indus Fire Safety Private Limited – Authorised Signatory (Seal & Signature): ______________________________${commas(totalCols - 1)}`);

  return lines.join('\r\n');
}

/**
 * Trigger immediate browser download of the exact filled checklist CSV
 */
export function downloadChecklistCSV(templateId, options = {}) {
  const csvContent = generateChecklistCSV(templateId, options);
  
  // UTF-8 BOM (\uFEFF) ensures Excel opens the checkmark '√' cleanly without garbled characters
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const template = CHECKLIST_TEMPLATES[templateId] || CHECKLIST_TEMPLATES['CL-11'];
  const safeClient = (options.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  const safeDate = new Date().toISOString().substring(0, 10);
  const fileName = `${template.id}_${safeClient}_${safeDate}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download filled checklist in EXACT Microsoft Excel (.xlsx) format
 * Preserves the 100% exact layout, colors, fonts, borders, formulas, and merged cells
 * from the master control copy workbook.
 */
export async function downloadChecklistExcel(templateId, options = {}) {
  // 1. Fetch template workbook
  const response = await fetch('/templates/AMC_CHECKLIST_MASTER.xlsx');
  if (!response.ok) {
    throw new Error('Master Excel template file could not be fetched from /templates/AMC_CHECKLIST_MASTER.xlsx');
  }
  const arrayBuffer = await response.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  // 2. Identify the target worksheet for templateId (e.g. 'CL-01')
  const template = CHECKLIST_TEMPLATES[templateId] || CHECKLIST_TEMPLATES['CL-11'];
  const targetSheet = workbook.worksheets.find(ws => 
    ws.name.startsWith(templateId + ' ') || ws.name === templateId || ws.name.startsWith(templateId)
  );

  if (!targetSheet) {
    throw new Error(`Worksheet for template ${templateId} not found in master template`);
  }

  // 3. Metadata
  const clientName = options.clientName || 'Aarti Industries Limited';
  const siteAddress = options.siteAddress || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110';
  const fullClientStr = options.clientFull || `${clientName}, ${siteAddress}`;
  const poNumber = options.poNumber || 'PO/AIL/AMC/2026/8812';
  const workOrderRef = options.workOrderRef || 'WO-IFSPL-2026-OCT-094';
  const dateOfService = options.dateOfService || new Date().toISOString().substring(0, 10).split('-').reverse().join('-');
  const frequency = options.frequency || 'Quarterly';
  const monthPeriod = options.monthPeriod || 'October – 2026';

  // Populate Row 6: Client Name & Address (target cell D6)
  const cellD6 = targetSheet.getCell('D6');
  if (cellD6) cellD6.value = fullClientStr;

  // Populate Row 7: PO / Contract No (target cell D7)
  const cellD7 = targetSheet.getCell('D7');
  if (cellD7) cellD7.value = poNumber;

  // Populate Row 8: Work Order (target cell D8)
  const cellD8 = targetSheet.getCell('D8');
  if (cellD8) cellD8.value = workOrderRef;

  // Populate Row 9: Frequency (target cell D9)
  const cellD9 = targetSheet.getCell('D9');
  if (cellD9) cellD9.value = frequency;

  // Dynamically locate "Date of Service" & "Month / Period" value cells in rows 8 and 9
  const serviceDateTimeStr = options.inspectionTime ? `${dateOfService} ${options.inspectionTime}` : dateOfService;
  targetSheet.getRow(8).eachCell((cell, colNumber) => {
    if (cell.value && String(cell.value).includes('Date of Service')) {
      targetSheet.getCell(8, colNumber + 2).value = serviceDateTimeStr;
    }
  });

  targetSheet.getRow(9).eachCell((cell, colNumber) => {
    if (cell.value && String(cell.value).includes('Month / Period')) {
      targetSheet.getCell(9, colNumber + 2).value = monthPeriod;
    }
  });

  // 4. Inspection Records (Rows 14 to 38)
  const items = template.items || [];
  const itemCount = items.length;
  const records = options.records && options.records.length > 0 ? options.records : [
    {
      sn: 1,
      area: options.area || 'Plant 1',
      idNo: options.positionId || 'POS-AIL-001',
      location: options.location || 'Reaction Bay Pillar C-4',
      answers: options.answers || {},
      remarks: options.remarks || ''
    }
  ];

  const itemTotalsOk = new Array(itemCount).fill(0);
  const itemTotalsNotOk = new Array(itemCount).fill(0);
  const itemTotalsNa = new Array(itemCount).fill(0);
  let unitsChecked = 0;

  records.forEach((rec, idx) => {
    const rowNum = 14 + idx;
    if (rowNum <= 38) {
      unitsChecked++;
      targetSheet.getCell(rowNum, 1).value = rec.sn || (idx + 1);
      targetSheet.getCell(rowNum, 2).value = rec.area || '';
      targetSheet.getCell(rowNum, 3).value = rec.idNo || '';
      targetSheet.getCell(rowNum, 4).value = rec.location || '';

      items.forEach((item, itemIdx) => {
        const colNum = 5 + itemIdx;
        const ans = rec.answers ? rec.answers[item.itemNo] : null;
        let symbol = '';
        if (ans) {
          const status = ans.status || ans;
          if (status === 'OK' || status === '√') {
            symbol = '√';
            itemTotalsOk[itemIdx]++;
          } else if (status === 'NOT_OK' || status === 'FAIL' || status === 'X') {
            symbol = 'X';
            itemTotalsNotOk[itemIdx]++;
          } else if (status === 'NA') {
            symbol = 'NA';
            itemTotalsNa[itemIdx]++;
          }
        }
        targetSheet.getCell(rowNum, colNum).value = symbol;
      });

      // Last column is Remarks
      const remarksCol = 5 + itemCount;
      targetSheet.getCell(rowNum, remarksCol).value = rec.remarks || '';
    }
  });

  // 5. Totals Rows (Rows 39, 40, 41, 42)
  for (let c = 5; c < 5 + itemCount; c++) {
    targetSheet.getCell(39, c).value = unitsChecked;
  }
  items.forEach((_, idx) => {
    targetSheet.getCell(40, 5 + idx).value = itemTotalsOk[idx];
  });
  items.forEach((_, idx) => {
    targetSheet.getCell(41, 5 + idx).value = itemTotalsNotOk[idx];
  });
  items.forEach((_, idx) => {
    targetSheet.getCell(42, 5 + idx).value = itemTotalsNa[idx];
  });

  // 6. Remarks / Observations (Row 45)
  const visitRemarks = options.visitRemarks || 'Routine AMC servicing completed. Pressure and operational baseline tested satisfactory.';
  const cellRemarks = targetSheet.getCell('A45');
  if (cellRemarks) {
    cellRemarks.value = visitRemarks;
  }

  // 7. Signatures block (Rows 54 to bottom)
  const engineerName = options.engineerName || 'Ramesh Patel';
  const supervisorName = options.supervisorName || 'Sanjay Sharma';
  const clientWitnessName = options.clientWitnessName || 'Vikram Shah';

  for (let r = 54; r <= targetSheet.rowCount; r++) {
    const row = targetSheet.getRow(r);
    row.eachCell((cell, col) => {
      const v = String(cell.value || '');
      if (v.startsWith('Name:')) {
        if (col <= 5) cell.value = `Name: ${engineerName}`;
        else if (col <= 10) cell.value = `Name: ${supervisorName}`;
        else cell.value = `Name: ${clientWitnessName}`;
      } else if (v.startsWith('Signature:')) {
        if (col <= 5) cell.value = `Signature: [DIGITALLY SIGNED - ${engineerName}]`;
        else if (col <= 10) cell.value = 'Signature: [VERIFIED - TECHNICAL VP]';
        else cell.value = `Signature: [DIGITALLY SIGNED - ${clientWitnessName}]`;
      } else if (v.startsWith('Date:')) {
        if (col <= 5) cell.value = `Date: ${dateOfService}${options.inspectionTime ? ' ' + options.inspectionTime : ''}`;
        else cell.value = `Date: ${dateOfService}`;
      }
    });
  }

  // Set active sheet view in workbook so Excel opens directly to this sheet
  const sheetIdx = workbook.worksheets.indexOf(targetSheet);
  workbook.views = [{ 
    x: 0, 
    y: 0, 
    width: 10000, 
    height: 20000, 
    firstSheet: 0, 
    activeTab: sheetIdx, 
    visibility: 'visible' 
  }];

  // 8. Generate Excel file buffer and trigger instant download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = URL.createObjectURL(blob);

  const safeClient = (clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  const safeDate = new Date().toISOString().substring(0, 10);
  const fileName = `${template.id}_${safeClient}_${safeDate}.xlsx`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download full master workbook (.xlsx) containing all 26 checklists
 * with filled data across all sheets for the entire site visit
 */
export async function downloadMasterWorkbookExcel(options = {}) {
  const response = await fetch('/templates/AMC_CHECKLIST_MASTER.xlsx');
  if (!response.ok) {
    throw new Error('Master Excel template file could not be fetched');
  }
  const arrayBuffer = await response.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const clientName = options.clientName || 'Aarti Industries Limited';
  const siteAddress = options.siteAddress || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110';
  const fullClientStr = options.clientFull || `${clientName}, ${siteAddress}`;
  const poNumber = options.poNumber || 'PO/AIL/AMC/2026/8812';
  const workOrderRef = options.workOrderRef || 'WO-IFSPL-2026-OCT-094';
  const dateOfService = options.dateOfService || new Date().toISOString().substring(0, 10).split('-').reverse().join('-');
  const frequency = options.frequency || 'Quarterly';
  const monthPeriod = options.monthPeriod || 'October – 2026';
  const engineerName = options.engineerName || 'Ramesh Patel';
  const supervisorName = options.supervisorName || 'Sanjay Sharma';
  const clientWitnessName = options.clientWitnessName || 'Vikram Shah';

  // Iterate over all 26 checklist worksheets and populate client metadata
  workbook.worksheets.filter(ws => ws.name.startsWith('CL-')).forEach(sheet => {
    sheet.getCell('D6').value = fullClientStr;
    sheet.getCell('D7').value = poNumber;
    sheet.getCell('D8').value = workOrderRef;
    sheet.getCell('D9').value = frequency;

    const serviceDateTimeStr = options.inspectionTime ? `${dateOfService} ${options.inspectionTime}` : dateOfService;
    sheet.getRow(8).eachCell((cell, colNumber) => {
      if (cell.value && String(cell.value).includes('Date of Service')) {
        sheet.getCell(8, colNumber + 2).value = serviceDateTimeStr;
      }
    });

    sheet.getRow(9).eachCell((cell, colNumber) => {
      if (cell.value && String(cell.value).includes('Month / Period')) {
        sheet.getCell(9, colNumber + 2).value = monthPeriod;
      }
    });

    for (let r = 54; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      row.eachCell((cell, col) => {
        const v = String(cell.value || '');
        if (v.startsWith('Name:')) {
          if (col <= 5) cell.value = `Name: ${engineerName}`;
          else if (col <= 10) cell.value = `Name: ${supervisorName}`;
          else cell.value = `Name: ${clientWitnessName}`;
        } else if (v.startsWith('Signature:')) {
          if (col <= 5) cell.value = `Signature: [DIGITALLY SIGNED - ${engineerName}]`;
          else if (col <= 10) cell.value = 'Signature: [VERIFIED - TECHNICAL VP]';
          else cell.value = `Signature: [DIGITALLY SIGNED - ${clientWitnessName}]`;
        } else if (v.startsWith('Date:')) {
          if (col <= 5) cell.value = `Date: ${dateOfService}${options.inspectionTime ? ' ' + options.inspectionTime : ''}`;
          else cell.value = `Date: ${dateOfService}`;
        }
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = URL.createObjectURL(blob);

  const safeClient = (clientName || 'Site').replace(/[^a-zA-Z0-9]/g, '_');
  const safeDate = new Date().toISOString().substring(0, 10);
  const fileName = `AMC_Master_Control_Copy_All_Checklists_${safeClient}_${safeDate}.xlsx`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
