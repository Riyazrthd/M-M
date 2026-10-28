// Indus Fire Safety Private Limited - Exact 25 mm x 25 mm Bulk QR Label PDF Generator
// Generates print-ready PDFs formatted for A4 label sheets with exact physical millimeter dimensions
// Meets all Master Prompt requirements: exact 25 mm x 25 mm QR, centered SR. NO. below, cutting guides

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { buildQRScanUrl } from './qrUrlHelper.js';

/**
 * Generate high-resolution printable PDF containing bulk QR labels
 * 
 * Strict Physical Dimensions:
 * - QR Code image: EXACT 25.0 mm x 25.0 mm
 * - Label Cell: 34.0 mm width x 36.0 mm height
 * - SR. NO.: Centered horizontally directly below QR code (e.g. SR. NO. 001)
 * - Page Grid: 5 columns x 7 rows = 35 labels per A4 page
 * - Critical Print Instruction: "Print at 100% / Actual Size. Disable Fit to Page"
 * 
 * @param {Array} qrRecords - Array of QR records from QR registry
 * @param {Object} options - Customization options
 * @returns {Promise<Object>} Result object with fileName and totalLabels
 */
export async function generateBulkQRLabelsPDF(qrRecords, options = {}) {
  if (!qrRecords || qrRecords.length === 0) {
    throw new Error('No QR code records provided for label generation.');
  }

  // A4 dimensions in mm: 210 x 297
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageW = 210;
  const pageH = 297;

  // Strict Physical Dimensions in Millimeters
  const qrSize = 25.0; // EXACT 25 mm x 25 mm (2.5 cm x 2.5 cm)
  const labelW = 34.0; // Label box width
  const labelH = 36.0; // Label box height (25mm QR + 2mm top + 7mm text + 2mm bottom)
  
  const cols = 5;      // 5 columns = 170 mm
  const rows = 7;      // 7 rows = 252 mm (35 labels per page)
  const labelsPerPage = cols * rows;

  const leftMargin = (pageW - (cols * labelW)) / 2; // (210 - 170)/2 = 20 mm
  const topMargin = 22.0; // Space for header

  const totalPages = Math.ceil(qrRecords.length / labelsPerPage) || 1;
  const batchId = options.batchId || qrRecords[0]?.batchId || 'BATCH';
  const title = options.title || 'INDUS FIRE SAFETY PRIVATE LIMITED';

  // 1. Pre-generate all QR code images at 400x400 px resolution for high-DPI razor-sharp printing
  // Every QR code strictly encodes the canonical deployed application URL: https://riyazrthd.github.io/M-M/qr/TOKEN
  const qrImageMap = {};
  for (const rec of qrRecords) {
    const payload = buildQRScanUrl(rec.token);
    try {
      qrImageMap[rec.token] = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 400,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
    } catch (err) {
      console.warn('QR image generation warning for', rec.token, err);
    }
  }

  let recordIdx = 0;

  for (let page = 1; page <= totalPages; page++) {
    if (page > 1) {
      doc.addPage('a4', 'portrait');
    }

    // Header Branding & Document Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42); // #0F172A
    doc.text(title, pageW / 2, 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // #475569
    doc.text(
      `Batch: ${batchId}   •   Standard Label Size: Exact 25 mm × 25 mm QR   •   Page ${page} of ${totalPages}`, 
      pageW / 2, 
      12.5, 
      { align: 'center' }
    );

    // CRITICAL PRINT INSTRUCTION (Required by specification)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28); // #B91C1C Warning Red
    doc.text(
      "CRITICAL PRINT INSTRUCTION: Print at 100% / Actual Size. Disable 'Fit to Page' / Page Scaling.", 
      pageW / 2, 
      16.5, 
      { align: 'center' }
    );

    // Top divider line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, 18.5, pageW - leftMargin, 18.5);

    // Render Grid of Labels on Current Page
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (recordIdx >= qrRecords.length) break;

        const rec = qrRecords[recordIdx];
        const x = leftMargin + (c * labelW);
        const y = topMargin + (r * labelH);

        // 1. Light dashed cutting guide box around label
        doc.setDrawColor(203, 213, 225); // #CBD5E1
        doc.setLineWidth(0.2);
        doc.setLineDash([1, 1], 0);
        doc.rect(x, y, labelW, labelH);
        doc.setLineDash([]); // Reset to solid line

        // 2. Exact 25 mm x 25 mm QR code image (centered horizontally in 34mm box)
        const qrX = x + ((labelW - qrSize) / 2); // x + 4.5 mm
        const qrY = y + 2.0;

        const imgData = qrImageMap[rec.token];
        if (imgData) {
          doc.addImage(imgData, 'PNG', qrX, qrY, qrSize, qrSize);
        }

        // 3. SR. NO. directly below QR code (centered horizontally)
        // Format: SR. NO. 001
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(15, 23, 42);
        const textY = qrY + qrSize + 4.2; // 2.0 + 25.0 + 4.2 = 31.2 mm
        doc.text(rec.displayNo || `SR. NO. ${rec.seqNumber}`, x + (labelW / 2), textY, { align: 'center' });

        // 4. Subtle permanent token below SR. NO.
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.2);
        doc.setTextColor(100, 116, 139);
        doc.text(rec.token, x + (labelW / 2), textY + 2.8, { align: 'center' });

        recordIdx++;
      }
    }

    // Footer on each page
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Indus Fire Safety Private Limited • Permanent Equipment QR Label Registry • Generated: ${new Date().toLocaleDateString('en-GB')}`, 
      pageW / 2, 
      pageH - 6, 
      { align: 'center' }
    );
  }

  const fileName = `IFS_QR_Labels_${batchId}_${qrRecords.length}_units.pdf`;
  if (options.saveToFile !== false && typeof window !== 'undefined' && typeof doc.save === 'function') {
    doc.save(fileName);
  }

  return {
    success: true,
    fileName,
    totalLabels: qrRecords.length,
    totalPages,
    doc
  };
}

/**
 * Generate standalone printable HTML for browser print preview
 */
export function generatePrintableHTML(qrRecords, options = {}, qrImageMap = {}) {
  const batchId = options.batchId || qrRecords[0]?.batchId || 'BATCH';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print QR Labels - ${batchId}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0F172A;
      background: #FFFFFF;
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 1px solid #CBD5E1;
      padding-bottom: 6px;
    }
    .company {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .sub {
      font-size: 9.5px;
      color: #475569;
      margin-top: 2px;
    }
    .warning {
      font-size: 9.5px;
      font-weight: 700;
      color: #B91C1C;
      margin-top: 3px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(5, 34mm);
      grid-gap: 2mm;
      justify-content: center;
    }
    .label-box {
      width: 34mm;
      height: 36mm;
      box-sizing: border-box;
      border: 1px dashed #CBD5E1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5mm;
      page-break-inside: avoid;
    }
    .qr-img {
      width: 25mm;
      height: 25mm;
      display: block;
    }
    .sr-no {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0F172A;
      margin-top: 1.5mm;
      text-align: center;
      line-height: 1;
    }
    .token {
      font-size: 5pt;
      color: #64748B;
      margin-top: 1mm;
      text-align: center;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">INDUS FIRE SAFETY PRIVATE LIMITED</div>
    <div class="sub">Batch: ${batchId} • Standard 25 mm × 25 mm QR Asset Labels • Total: ${qrRecords.length} Labels</div>
    <div class="warning">CRITICAL PRINT INSTRUCTION: Print at 100% / Actual Size. Disable 'Fit to Page' / Scaling in printer settings.</div>
  </div>
  <div class="grid">
    ${qrRecords.map(rec => `
      <div class="label-box">
        <img class="qr-img" src="${qrImageMap[rec.token] || ''}" alt="${rec.displayNo}" />
        <div class="sr-no">${rec.displayNo}</div>
        <div class="token">${rec.token}</div>
      </div>
    `).join('')}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;
}

/**
 * Print preview trigger for browser window
 */
export async function printBulkQRLabelsPreview(qrRecords, options = {}) {
  if (!qrRecords || qrRecords.length === 0) return;

  const qrImageMap = {};
  for (const rec of qrRecords) {
    const payload = buildQRScanUrl(rec.token);
    try {
      qrImageMap[rec.token] = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
    } catch (err) {}
  }

  const html = generatePrintableHTML(qrRecords, options, qrImageMap);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  }
}
