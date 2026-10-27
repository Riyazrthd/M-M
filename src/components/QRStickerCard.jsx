import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, 
  Download, 
  ArrowRight, 
  PlusCircle, 
  CheckCircle2, 
  Copy, 
  Flame,
  Check,
  Sparkles,
  Layers,
  ClipboardCheck,
  Smartphone,
  ExternalLink
} from 'lucide-react';

export default function QRStickerCard({
  position,
  onNavigate,
  onRegisterAnother
}) {
  // Style 1 = Heavy-Duty Industrial Badge (Vertical, Dark accents)
  // Style 2 = Compact Modern Light Tag (Side-by-side, Pastel Rose accents)
  const [stickerStyle, setStickerStyle] = useState('style1');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const printAreaRef = useRef(null);

  // Position attributes fallback resolution
  const posId = position?.positionId || position?.id || 'IFS-POS-000108';
  const qrCodeText = position?.qrCode || `IFS-QR-${posId}`;
  const clientName = position?.clientName || position?.company || position?.siteName || 'Client Name Pvt. Ltd.';
  const equipmentDesc = position?.equipmentType || position?.currentEquipment?.type || position?.equipmentName || 'ABC Dry Chemical Powder (Stored Pressure)';
  const locationDesc = position?.area && position?.location 
    ? `${position.area} — ${position.location}`
    : position?.locationDescription || position?.location || position?.area || 'Plant 1 — Reaction Bay (Ground Floor) — Near Column C-4, West Fire Corridor';
  const serialNo = position?.currentEquipment?.serialNo || position?.currentEquipment?.serialNumber || position?.serialNumber || 'IFS-2024-2218';
  const formId = position?.templateId || 'CL-11';

  // Direct Mobile Checklist URL (opens the digital checklist directly when scanned by any smartphone camera)
  const getDirectChecklistUrl = () => {
    const params = new URLSearchParams();
    params.set('scan', posId);
    if (formId) params.set('tmpl', formId);
    if (equipmentDesc) params.set('eq', equipmentDesc);
    if (locationDesc) params.set('loc', locationDesc);
    if (clientName) params.set('client', clientName);
    if (serialNo) params.set('sn', serialNo);

    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // If deployed on github.io
      if (window.location.hostname.includes('github.io')) {
        let pathname = window.location.pathname.replace(/\/+$/, '');
        if (!pathname.includes('/docs')) {
          pathname += '/docs';
        }
        return `${origin}${pathname}/?${params.toString()}`;
      }
      // If running on localhost, default to GitHub Pages /docs/ URL so smartphone camera opens the live form over mobile internet!
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `https://riyazrthd.github.io/M-M/docs/?${params.toString()}`;
      }
      return `${origin}${window.location.pathname}?${params.toString()}`;
    }
    return `https://riyazrthd.github.io/M-M/docs/?${params.toString()}`;
  };

  const activeQRPayload = getDirectChecklistUrl();

  // Generate crimson-red QR code with High Error Correction
  useEffect(() => {
    if (activeQRPayload) {
      QRCode.toDataURL(activeQRPayload, {
        width: 360,
        margin: 1,
        color: {
          dark: '#A80018', // Official Indus Crimson Red
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error tolerance: 30% recovery for fast phone camera decoding
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR Generation Error:', err));
    }
  }, [activeQRPayload]);

  // Handle standard browser/OS print
  const handlePrint = () => {
    window.print();
  };

  // Helper function for rounded rectangles on canvas
  const drawRoundRect = (ctx, x, y, w, h, radius, fill, stroke, strokeColor) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = strokeColor || '#000000';
      ctx.stroke();
    }
  };

  // Handle high-resolution composite sticker PNG download for both styles
  const handleDownloadPNG = async () => {
    setIsDownloading(true);
    try {
      const scale = 2; // High DPI for crisp thermal / vinyl label printing
      const canvas = document.createElement('canvas');

      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = qrDataUrl;
      await new Promise(resolve => { qrImg.onload = resolve; });

      if (stickerStyle === 'style1') {
        // ==================================================================
        // STYLE 1: Heavy-Duty Industrial Badge (340 x 640 @ 2x = 680 x 1280)
        // ==================================================================
        const width = 340 * scale;
        const height = 640 * scale;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 1. Outer Container
        ctx.fillStyle = '#FFFFFF';
        drawRoundRect(ctx, 0, 0, width, height, 22 * scale, true, true, '#17191C');

        // 2. Top Crimson Header Banner with gradient
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(22 * scale, 0);
        ctx.lineTo(width - 22 * scale, 0);
        ctx.arcTo(width, 0, width, 22 * scale, 22 * scale);
        ctx.lineTo(width, 88 * scale);
        ctx.lineTo(0, 88 * scale);
        ctx.lineTo(0, 22 * scale);
        ctx.arcTo(0, 0, 22 * scale, 0, 22 * scale);
        ctx.closePath();
        ctx.clip();

        const grad = ctx.createLinearGradient(0, 0, 0, 88 * scale);
        grad.addColorStop(0, '#A80018');
        grad.addColorStop(1, '#8A0012');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, 88 * scale);

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.font = `bold ${16 * scale}px 'Inter', sans-serif`;
        ctx.fillText('INDUS FIRE SAFETY', width / 2, 34 * scale);

        ctx.font = `bold ${12 * scale}px 'Inter', sans-serif`;
        ctx.fillText('PRIVATE LIMITED', width / 2, 54 * scale);

        ctx.fillStyle = '#FFB8C2';
        ctx.font = `600 ${9.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('DIGITAL AMC INSPECTION TAG • VADODARA', width / 2, 73 * scale);
        ctx.restore();

        // 3. Permanent Position ID Pill
        ctx.fillStyle = '#17191C';
        drawRoundRect(ctx, 16 * scale, 102 * scale, width - 32 * scale, 48 * scale, 8 * scale, true, false);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#9CA3AF';
        ctx.font = `600 ${8.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('PERMANENT ASSET POSITION ID', width / 2, 116 * scale);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${19 * scale}px 'JetBrains Mono', monospace`;
        ctx.fillText(posId, width / 2, 138 * scale);

        // 4. Corner Viewfinder Brackets around QR
        const qrBoxSize = 190 * scale;
        const qrBoxX = (width - qrBoxSize) / 2;
        const qrBoxY = 162 * scale;
        const bracketLen = 22 * scale;
        const bracketRadius = 8 * scale;

        ctx.strokeStyle = '#A80018';
        ctx.lineWidth = 3.5 * scale;
        ctx.lineCap = 'round';

        // Top-Left bracket
        ctx.beginPath();
        ctx.moveTo(qrBoxX, qrBoxY + bracketLen);
        ctx.lineTo(qrBoxX, qrBoxY + bracketRadius);
        ctx.arcTo(qrBoxX, qrBoxY, qrBoxX + bracketRadius, qrBoxY, bracketRadius);
        ctx.lineTo(qrBoxX + bracketLen, qrBoxY);
        ctx.stroke();

        // Top-Right bracket
        ctx.beginPath();
        ctx.moveTo(qrBoxX + qrBoxSize - bracketLen, qrBoxY);
        ctx.lineTo(qrBoxX + qrBoxSize - bracketRadius, qrBoxY);
        ctx.arcTo(qrBoxX + qrBoxSize, qrBoxY, qrBoxX + qrBoxSize, qrBoxY + bracketRadius, bracketRadius);
        ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY + bracketLen);
        ctx.stroke();

        // Bottom-Left bracket
        ctx.beginPath();
        ctx.moveTo(qrBoxX, qrBoxY + qrBoxSize - bracketLen);
        ctx.lineTo(qrBoxX, qrBoxY + qrBoxSize - bracketRadius);
        ctx.arcTo(qrBoxX, qrBoxY + qrBoxSize, qrBoxX + bracketRadius, qrBoxY + qrBoxSize, bracketRadius);
        ctx.lineTo(qrBoxX + bracketLen, qrBoxY + qrBoxSize);
        ctx.stroke();

        // Bottom-Right bracket
        ctx.beginPath();
        ctx.moveTo(qrBoxX + qrBoxSize - bracketLen, qrBoxY + qrBoxSize);
        ctx.lineTo(qrBoxX + qrBoxSize - bracketRadius, qrBoxY + qrBoxSize);
        ctx.arcTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize, qrBoxX + qrBoxSize, qrBoxY + qrBoxSize - bracketRadius, bracketRadius);
        ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize - bracketLen);
        ctx.stroke();

        // QR Image
        const qrRenderSize = 160 * scale;
        const qrRenderX = (width - qrRenderSize) / 2;
        const qrRenderY = qrBoxY + (qrBoxSize - qrRenderSize) / 2;
        ctx.drawImage(qrImg, qrRenderX, qrRenderY, qrRenderSize, qrRenderSize);

        // Center Flame Badge on QR
        const centerBadgeX = width / 2;
        const centerBadgeY = qrRenderY + qrRenderSize / 2;
        const badgeRadius = 16 * scale;

        ctx.beginPath();
        ctx.arc(centerBadgeX, centerBadgeY, badgeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 2 * scale;
        ctx.strokeStyle = '#A80018';
        ctx.stroke();

        // Center flame icon
        ctx.beginPath();
        ctx.moveTo(centerBadgeX, centerBadgeY - 9 * scale);
        ctx.bezierCurveTo(centerBadgeX + 6 * scale, centerBadgeY - 4 * scale, centerBadgeX + 8 * scale, centerBadgeY + 4 * scale, centerBadgeX + 3 * scale, centerBadgeY + 8 * scale);
        ctx.bezierCurveTo(centerBadgeX + 1 * scale, centerBadgeY + 10 * scale, centerBadgeX - 1 * scale, centerBadgeY + 10 * scale, centerBadgeX - 3 * scale, centerBadgeY + 8 * scale);
        ctx.bezierCurveTo(centerBadgeX - 8 * scale, centerBadgeY + 4 * scale, centerBadgeX - 6 * scale, centerBadgeY - 4 * scale, centerBadgeX, centerBadgeY - 9 * scale);
        ctx.fillStyle = '#A80018';
        ctx.fill();

        // 5. "— SCAN TO INSPECT —"
        const scanY = qrBoxY + qrBoxSize + 20 * scale;
        ctx.strokeStyle = '#A80018';
        ctx.lineWidth = 1.5 * scale;

        ctx.beginPath();
        ctx.moveTo(width / 2 - 80 * scale, scanY - 4 * scale);
        ctx.lineTo(width / 2 - 50 * scale, scanY - 4 * scale);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#17191C';
        ctx.font = `bold ${10.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('SCAN TO INSPECT', width / 2, scanY);

        ctx.beginPath();
        ctx.moveTo(width / 2 + 50 * scale, scanY - 4 * scale);
        ctx.lineTo(width / 2 + 80 * scale, scanY - 4 * scale);
        ctx.stroke();

        // 6. Metadata Box Table
        const metaX = 16 * scale;
        const metaY = scanY + 14 * scale;
        const metaW = width - 32 * scale;
        const metaH = 175 * scale;

        ctx.fillStyle = '#FFFFFF';
        drawRoundRect(ctx, metaX, metaY, metaW, metaH, 12 * scale, true, true, '#E1E5E9');

        ctx.strokeStyle = '#F1F3F5';
        ctx.lineWidth = 1 * scale;

        ctx.beginPath();
        ctx.moveTo(metaX, metaY + 36 * scale);
        ctx.lineTo(metaX + metaW, metaY + 36 * scale);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(metaX, metaY + 76 * scale);
        ctx.lineTo(metaX + metaW, metaY + 76 * scale);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(metaX, metaY + 128 * scale);
        ctx.lineTo(metaX + metaW, metaY + 128 * scale);
        ctx.stroke();

        // Bottom row background
        ctx.fillStyle = '#F8F9FA';
        ctx.beginPath();
        ctx.moveTo(metaX, metaY + 128 * scale);
        ctx.lineTo(metaX + metaW, metaY + 128 * scale);
        ctx.lineTo(metaX + metaW, metaY + metaH - 12 * scale);
        ctx.arcTo(metaX + metaW, metaY + metaH, metaX + metaW - 12 * scale, metaY + metaH, 12 * scale);
        ctx.lineTo(metaX + 12 * scale, metaY + metaH);
        ctx.arcTo(metaX, metaY + metaH, metaX, metaY + metaH - 12 * scale, 12 * scale);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(metaX + metaW / 2, metaY + 128 * scale);
        ctx.lineTo(metaX + metaW / 2, metaY + metaH);
        ctx.stroke();

        ctx.textAlign = 'left';

        // Row 1: CLIENT
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${10 * scale}px 'Inter', sans-serif`;
        ctx.fillText('CLIENT', metaX + 10 * scale, metaY + 23 * scale);

        ctx.fillStyle = '#17191C';
        ctx.font = `500 ${11.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText(clientName, metaX + 80 * scale, metaY + 23 * scale);

        // Row 2: EQUIPMENT
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${10 * scale}px 'Inter', sans-serif`;
        ctx.fillText('EQUIPMENT', metaX + 10 * scale, metaY + 58 * scale);

        ctx.fillStyle = '#17191C';
        ctx.font = `500 ${11 * scale}px 'Inter', sans-serif`;
        ctx.fillText(equipmentDesc, metaX + 80 * scale, metaY + 58 * scale);

        // Row 3: LOCATION
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${10 * scale}px 'Inter', sans-serif`;
        ctx.fillText('LOCATION', metaX + 10 * scale, metaY + 95 * scale);

        ctx.fillStyle = '#17191C';
        ctx.font = `400 ${10.5 * scale}px 'Inter', sans-serif`;
        const locWords = locationDesc.split(' ');
        let l1 = '';
        let l2 = '';
        for (let i = 0; i < locWords.length; i++) {
          if ((l1 + locWords[i]).length < 32 && !l2) {
            l1 += (l1 ? ' ' : '') + locWords[i];
          } else {
            l2 += (l2 ? ' ' : '') + locWords[i];
          }
        }
        ctx.fillText(l1, metaX + 80 * scale, metaY + 95 * scale);
        if (l2) ctx.fillText(l2, metaX + 80 * scale, metaY + 111 * scale);

        // Row 4: SERIAL NO. and FORM
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${9.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('SERIAL NO.', metaX + 10 * scale, metaY + 144 * scale);

        ctx.fillStyle = '#17191C';
        ctx.font = `bold ${12 * scale}px 'JetBrains Mono', monospace`;
        ctx.fillText(serialNo, metaX + 10 * scale, metaY + 162 * scale);

        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${9.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('FORM', metaX + metaW / 2 + 10 * scale, metaY + 144 * scale);

        ctx.fillStyle = '#17191C';
        ctx.font = `bold ${13 * scale}px 'Inter', sans-serif`;
        ctx.fillText(formId, metaX + metaW / 2 + 10 * scale, metaY + 162 * scale);

        // 7. Security Warning Footer
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, height - 38 * scale);
        ctx.lineTo(width, height - 38 * scale);
        ctx.lineTo(width, height - 22 * scale);
        ctx.arcTo(width, height, width - 22 * scale, height, 22 * scale);
        ctx.lineTo(22 * scale, height);
        ctx.arcTo(0, height, 0, height - 22 * scale, 22 * scale);
        ctx.closePath();
        ctx.clip();

        ctx.fillStyle = '#17191C';
        ctx.fillRect(0, height - 38 * scale, width, 38 * scale);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `600 ${8.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('DO NOT REMOVE • REPORT DAMAGE TO INDUS FIRE SAFETY', width / 2, height - 16 * scale);
        ctx.restore();

      } else {
        // ==================================================================
        // STYLE 2: Compact Light Tag (420 x 480 @ 2x = 840 x 960)
        // ==================================================================
        const width = 420 * scale;
        const height = 480 * scale;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 1. Outer White Card Container with rounded corners
        ctx.fillStyle = '#FFFFFF';
        drawRoundRect(ctx, 0, 0, width, height, 20 * scale, true, true, '#FECDD3');

        // 2. Top Soft Pink Header Bar
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(20 * scale, 0);
        ctx.lineTo(width - 20 * scale, 0);
        ctx.arcTo(width, 0, width, 20 * scale, 20 * scale);
        ctx.lineTo(width, 56 * scale);
        ctx.lineTo(0, 56 * scale);
        ctx.lineTo(0, 20 * scale);
        ctx.arcTo(0, 0, 20 * scale, 0, 20 * scale);
        ctx.closePath();
        ctx.clip();

        ctx.fillStyle = '#FFF1F2';
        ctx.fillRect(0, 0, width, 56 * scale);

        // Flame icon on left
        const flameX = 22 * scale;
        const flameY = 28 * scale;
        ctx.beginPath();
        ctx.moveTo(flameX, flameY - 8 * scale);
        ctx.bezierCurveTo(flameX + 5 * scale, flameY - 3 * scale, flameX + 7 * scale, flameY + 3 * scale, flameX + 3 * scale, flameY + 7 * scale);
        ctx.bezierCurveTo(flameX + 1 * scale, flameY + 8 * scale, flameX - 1 * scale, flameY + 8 * scale, flameX - 3 * scale, flameY + 7 * scale);
        ctx.bezierCurveTo(flameX - 7 * scale, flameY + 3 * scale, flameX - 5 * scale, flameY - 3 * scale, flameX, flameY - 8 * scale);
        ctx.fillStyle = '#A80018';
        ctx.fill();

        // Company text on left
        ctx.textAlign = 'left';
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${12.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('INDUS FIRE SAFETY PVT.', 36 * scale, 24 * scale);
        ctx.fillText('LTD.', 36 * scale, 40 * scale);

        // Right pill: AMC • VADODARA
        const pillW = 110 * scale;
        const pillH = 26 * scale;
        const pillX = width - pillW - 18 * scale;
        const pillY = 15 * scale;
        ctx.fillStyle = '#FFFFFF';
        drawRoundRect(ctx, pillX, pillY, pillW, pillH, 13 * scale, true, true, '#FECDD3');

        ctx.textAlign = 'center';
        ctx.fillStyle = '#A80018';
        ctx.font = `600 ${9.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('AMC • VADODARA', pillX + pillW / 2, pillY + 17 * scale);
        ctx.restore();

        // 3. Client Line (Centered)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${9 * scale}px 'Inter', sans-serif`;
        ctx.fillText('C L I E N T', width / 2, 78 * scale);

        ctx.fillStyle = '#17191C';
        ctx.font = `bold ${15 * scale}px 'Inter', sans-serif`;
        ctx.fillText(clientName, width / 2, 100 * scale);

        // 4. Middle Section (Side by Side)
        // Left Column: QR Code Box
        const qrBoxW = 165 * scale;
        const qrBoxH = 165 * scale;
        const qrBoxX = 20 * scale;
        const qrBoxY = 120 * scale;

        ctx.fillStyle = '#FFFFFF';
        drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 14 * scale, true, true, '#FECDD3');

        const qrImgSize = 145 * scale;
        ctx.drawImage(qrImg, qrBoxX + 10 * scale, qrBoxY + 10 * scale, qrImgSize, qrImgSize);

        // Center badge on QR
        const cX = qrBoxX + qrBoxW / 2;
        const cY = qrBoxY + qrBoxH / 2;
        ctx.beginPath();
        ctx.arc(cX, cY, 14 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 1.5 * scale;
        ctx.strokeStyle = '#A80018';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cX, cY - 7 * scale);
        ctx.bezierCurveTo(cX + 5 * scale, cY - 3 * scale, cY + 6 * scale, cY + 3 * scale, cX + 2 * scale, cY + 6 * scale);
        ctx.bezierCurveTo(cX, cY + 8 * scale, cX - 2 * scale, cY + 8 * scale, cX - 2 * scale, cY + 6 * scale);
        ctx.bezierCurveTo(cX - 6 * scale, cY + 3 * scale, cX - 4 * scale, cY - 3 * scale, cX, cY - 7 * scale);
        ctx.fillStyle = '#A80018';
        ctx.fill();

        // Right Column: Position ID, Serial, Form, Scan Pill
        const col2X = qrBoxX + qrBoxW + 18 * scale;
        const col2W = width - col2X - 20 * scale;

        // Block 1: ASSET POSITION ID
        ctx.textAlign = 'left';
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${8.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('ASSET POSITION ID', col2X, qrBoxY + 14 * scale);

        ctx.fillStyle = '#FFF1F2';
        drawRoundRect(ctx, col2X, qrBoxY + 20 * scale, col2W, 30 * scale, 6 * scale, true, false);

        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${14 * scale}px 'JetBrains Mono', monospace`;
        ctx.fillText(posId, col2X + 8 * scale, qrBoxY + 41 * scale);

        // Block 2: SERIAL NO.
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${8.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('SERIAL NO.', col2X, qrBoxY + 68 * scale);

        ctx.fillStyle = '#17191C';
        ctx.font = `bold ${12 * scale}px 'JetBrains Mono', monospace`;
        ctx.fillText(serialNo, col2X, qrBoxY + 84 * scale);

        // Block 3: FORM
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${8.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText('FORM', col2X, qrBoxY + 104 * scale);

        ctx.fillStyle = '#17191C';
        ctx.font = `bold ${13 * scale}px 'Inter', sans-serif`;
        ctx.fillText(formId, col2X, qrBoxY + 120 * scale);

        // Block 4: SCAN TO INSPECT Button
        const btnY = qrBoxY + 134 * scale;
        const btnGrad = ctx.createLinearGradient(col2X, btnY, col2X + col2W, btnY);
        btnGrad.addColorStop(0, '#E02424');
        btnGrad.addColorStop(1, '#EA580C');
        ctx.fillStyle = btnGrad;
        drawRoundRect(ctx, col2X, btnY, col2W, 30 * scale, 6 * scale, true, false);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${10 * scale}px 'Inter', sans-serif`;
        ctx.fillText('SCAN TO INSPECT', col2X + col2W / 2, btnY + 19 * scale);

        // 5. Bottom Metadata Container
        const botX = 20 * scale;
        const botY = qrBoxY + qrBoxH + 16 * scale;
        const botW = width - 40 * scale;
        const botH = 150 * scale;

        ctx.fillStyle = '#FFF5F5';
        drawRoundRect(ctx, botX, botY, botW, botH, 12 * scale, true, true, '#F3E8E8');

        ctx.textAlign = 'left';
        // Equipment Row
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${10 * scale}px 'Inter', sans-serif`;
        ctx.fillText('EQUIPMENT', botX + 12 * scale, botY + 24 * scale);

        ctx.fillStyle = '#17191C';
        ctx.font = `500 ${11.5 * scale}px 'Inter', sans-serif`;
        ctx.fillText(equipmentDesc, botX + 88 * scale, botY + 24 * scale);

        // Divider
        ctx.strokeStyle = '#FDE8EA';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(botX + 12 * scale, botY + 38 * scale);
        ctx.lineTo(botX + botW - 12 * scale, botY + 38 * scale);
        ctx.stroke();

        // Location Row
        ctx.fillStyle = '#A80018';
        ctx.font = `bold ${10 * scale}px 'Inter', sans-serif`;
        ctx.fillText('LOCATION', botX + 12 * scale, botY + 62 * scale);

        ctx.fillStyle = '#17191C';
        ctx.font = `400 ${11 * scale}px 'Inter', sans-serif`;
        const words = locationDesc.split(' ');
        let row1 = '';
        let row2 = '';
        let row3 = '';
        for (let i = 0; i < words.length; i++) {
          if ((row1 + words[i]).length < 42 && !row2) {
            row1 += (row1 ? ' ' : '') + words[i];
          } else if ((row2 + words[i]).length < 42 && !row3) {
            row2 += (row2 ? ' ' : '') + words[i];
          } else {
            row3 += (row3 ? ' ' : '') + words[i];
          }
        }
        ctx.fillText(row1, botX + 88 * scale, botY + 62 * scale);
        if (row2) ctx.fillText(row2, botX + 88 * scale, botY + 80 * scale);
        if (row3) ctx.fillText(row3, botX + 88 * scale, botY + 98 * scale);
      }

      // Trigger automatic high-res PNG download
      const downloadLink = document.createElement('a');
      const filename = stickerStyle === 'style1'
        ? `QR_STICKER_INDUSTRIAL_${posId}.png`
        : `QR_STICKER_COMPACT_${posId}.png`;
      downloadLink.download = filename;
      downloadLink.href = canvas.toDataURL('image/png');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Download PNG failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy direct QR deep-link URL
  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeQRPayload);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      
      {/* Registration Success Confirmation Bar (Field Technician Feedback) */}
      <div style={{
        width: '100%',
        maxWidth: '560px',
        padding: '14px 18px',
        backgroundColor: '#E6F4EA',
        border: '1px solid #A7F3D0',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={22} color="#00875A" />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#00875A' }}>
              Asset Position Tag Ready
            </div>
            <div style={{ fontSize: '12px', color: '#536174' }}>
              Permanent Position ID <strong>{posId}</strong> mapped to SOP Checklist <strong>{formId}</strong>.
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '6px',
          backgroundColor: '#FFFFFF',
          color: '#00875A',
          border: '1px solid #A7F3D0'
        }}>
          QR Generated
        </span>
      </div>

      {/* Smartphone Direct Scan Banner */}
      <div style={{
        width: '100%',
        maxWidth: '560px',
        padding: '12px 16px',
        backgroundColor: '#F0F9FF',
        border: '1px solid #BAE6FD',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#0369A1' }}>
            <Smartphone size={17} color="#0284C7" />
            <span>Direct Mobile Checklist Link Active</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#0284C7', backgroundColor: '#E0F2FE', padding: '2px 8px', borderRadius: '4px' }}>
            Bypasses All Dashboards
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4 }}>
          Scanning this QR tag with any iPhone or Android camera opens <strong>{formId}</strong> directly for asset <strong>{posId}</strong> with no dashboard or sidebar distraction.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <a
            href={activeQRPayload}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <span>Test Direct Mobile Link</span>
            <ExternalLink size={13} />
          </a>
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid #BAE6FD',
              backgroundColor: '#FFFFFF',
              color: '#0369A1',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {copiedNotice ? <Check size={13} color="#00875A" /> : <Copy size={13} />}
            <span>{copiedNotice ? 'Link Copied' : 'Copy Direct Link'}</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          STICKER FORMAT SELECTOR (Style 1 vs Style 2)
          ==================================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px',
        backgroundColor: '#F3F4F4',
        borderRadius: '10px',
        border: '1px solid #E1E5E9'
      }}>
        <button
          type="button"
          onClick={() => setStickerStyle('style1')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: stickerStyle === 'style1' ? 600 : 500,
            borderRadius: '7px',
            backgroundColor: stickerStyle === 'style1' ? '#FFFFFF' : 'transparent',
            color: stickerStyle === 'style1' ? '#17191C' : '#536174',
            boxShadow: stickerStyle === 'style1' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Style 1: Heavy-Duty Industrial Badge
        </button>

        <button
          type="button"
          onClick={() => setStickerStyle('style2')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: stickerStyle === 'style2' ? 600 : 500,
            borderRadius: '7px',
            backgroundColor: stickerStyle === 'style2' ? '#FFFFFF' : 'transparent',
            color: stickerStyle === 'style2' ? '#17191C' : '#536174',
            boxShadow: stickerStyle === 'style2' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Style 2: Compact Light Tag (Side-by-Side)
        </button>
      </div>

      {/* ====================================================================
          STYLE 1: OFFICIAL INDUS AMC HEAVY-DUTY INDUSTRIAL BADGE
          ==================================================================== */}
      {stickerStyle === 'style1' && (
        <div 
          ref={printAreaRef}
          id="qr-sticker-printable"
          style={{
            width: '340px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #17191C',
            borderRadius: '22px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: '#17191C',
            boxSizing: 'border-box',
            position: 'relative'
          }}
        >
          {/* Top Crimson Header Banner */}
          <div style={{
            background: 'linear-gradient(180deg, #A80018 0%, #8A0012 100%)',
            padding: '16px 14px 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
              <Flame size={20} color="#FFFFFF" fill="#FFFFFF" />
            </div>

            <div style={{
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1.2
            }}>
              INDUS FIRE SAFETY
            </div>

            <div style={{
              fontSize: '11.5px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '2px'
            }}>
              PRIVATE LIMITED
            </div>

            <div style={{
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: '#FFB8C2',
              textTransform: 'uppercase',
              marginTop: '4px'
            }}>
              DIGITAL AMC INSPECTION TAG • VADODARA
            </div>
          </div>

          {/* Permanent Position ID Pill (Dark Charcoal) */}
          <div style={{
            margin: '14px 16px 8px 16px',
            backgroundColor: '#17191C',
            borderRadius: '8px',
            padding: '8px 12px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '8.5px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>
              PERMANENT ASSET POSITION ID
            </div>
            <div style={{
              fontSize: '19px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#FFFFFF',
              letterSpacing: '0.06em'
            }}>
              {posId}
            </div>
          </div>

          {/* QR Code Viewfinder Box with Red Corner Brackets */}
          <div style={{
            position: 'relative',
            width: '200px',
            height: '200px',
            margin: '10px auto 4px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '24px',
              height: '24px',
              borderTop: '3.5px solid #A80018',
              borderLeft: '3.5px solid #A80018',
              borderTopLeftRadius: '10px'
            }} />

            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '24px',
              height: '24px',
              borderTop: '3.5px solid #A80018',
              borderRight: '3.5px solid #A80018',
              borderTopRightRadius: '10px'
            }} />

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '24px',
              height: '24px',
              borderBottom: '3.5px solid #A80018',
              borderLeft: '3.5px solid #A80018',
              borderBottomLeftRadius: '10px'
            }} />

            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '24px',
              height: '24px',
              borderBottom: '3.5px solid #A80018',
              borderRight: '3.5px solid #A80018',
              borderBottomRightRadius: '10px'
            }} />

            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Tag for Position ${posId}`}
                style={{
                  width: '168px',
                  height: '168px',
                  display: 'block'
                }}
              />
            ) : (
              <div style={{ width: '168px', height: '168px', backgroundColor: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#788494' }}>
                Generating Tag...
              </div>
            )}

            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '2px solid #A80018',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(168, 0, 24, 0.25)'
            }}>
              <Flame size={18} color="#A80018" fill="#A80018" />
            </div>
          </div>

          {/* "— SCAN TO INSPECT —" */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            margin: '8px 0 12px 0'
          }}>
            <div style={{ width: '32px', height: '1.5px', backgroundColor: '#A80018' }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#17191C',
              textTransform: 'uppercase'
            }}>
              SCAN TO INSPECT
            </span>
            <div style={{ width: '32px', height: '1.5px', backgroundColor: '#A80018' }} />
          </div>

          {/* Metadata Table Card */}
          <div style={{
            margin: '0 16px 14px 16px',
            border: '1px solid #E1E5E9',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            textAlign: 'left'
          }}>
            {/* Row 1: CLIENT */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '88px 1fr',
              padding: '9px 12px',
              borderBottom: '1px solid #F1F3F5',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#A80018',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                CLIENT
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#17191C',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {clientName}
              </span>
            </div>

            {/* Row 2: EQUIPMENT */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '88px 1fr',
              padding: '9px 12px',
              borderBottom: '1px solid #F1F3F5',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#A80018',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                EQUIPMENT
              </span>
              <span style={{
                fontSize: '11.5px',
                fontWeight: 500,
                color: '#17191C',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {equipmentDesc}
              </span>
            </div>

            {/* Row 3: LOCATION */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '88px 1fr',
              padding: '9px 12px',
              borderBottom: '1px solid #F1F3F5',
              alignItems: 'flex-start'
            }}>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#A80018',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                paddingTop: '1px'
              }}>
                LOCATION
              </span>
              <span style={{
                fontSize: '11px',
                color: '#17191C',
                lineHeight: 1.35
              }}>
                {locationDesc}
              </span>
            </div>

            {/* Row 4: SERIAL NO. & FORM */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              padding: '8px 12px',
              backgroundColor: '#F8F9FA'
            }}>
              <div style={{ borderRight: '1px solid #E1E5E9', paddingRight: '8px' }}>
                <div style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: '#A80018',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}>
                  SERIAL NO.
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#17191C'
                }}>
                  {serialNo}
                </div>
              </div>

              <div style={{ paddingLeft: '10px' }}>
                <div style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: '#A80018',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}>
                  FORM
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#17191C'
                }}>
                  {formId}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Warning Banner */}
          <div style={{
            backgroundColor: '#17191C',
            padding: '9px 12px',
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: '8px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            DO NOT REMOVE • REPORT DAMAGE TO INDUS FIRE SAFETY
          </div>
        </div>
      )}

      {/* ====================================================================
          STYLE 2: COMPACT MODERN LIGHT TAG (SIDE-BY-SIDE / SECOND PDF REFERENCE)
          ==================================================================== */}
      {stickerStyle === 'style2' && (
        <div 
          ref={printAreaRef}
          id="qr-sticker-printable"
          style={{
            width: '420px',
            maxWidth: '100%',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #FECDD3',
            borderRadius: '20px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: '#17191C',
            boxSizing: 'border-box',
            position: 'relative'
          }}
        >
          {/* Top Soft Pink Header Bar */}
          <div style={{
            backgroundColor: '#FFF1F2',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #FFE4E6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="#A80018" fill="#A80018" />
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#A80018',
                  letterSpacing: '0.02em',
                  lineHeight: 1.15
                }}>
                  INDUS FIRE SAFETY PVT.
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#A80018',
                  letterSpacing: '0.02em',
                  lineHeight: 1.15
                }}>
                  LTD.
                </div>
              </div>
            </div>

            {/* Pill: AMC • VADODARA */}
            <div style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FECDD3',
              fontSize: '9.5px',
              fontWeight: 700,
              color: '#A80018',
              letterSpacing: '0.06em'
            }}>
              AMC • VADODARA
            </div>
          </div>

          {/* Client Header Section (Centered) */}
          <div style={{ textAlign: 'center', padding: '14px 16px 10px 16px' }}>
            <div style={{
              fontSize: '9.5px',
              fontWeight: 700,
              color: '#A80018',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>
              C L I E N T
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#17191C'
            }}>
              {clientName}
            </div>
          </div>

          {/* Middle Section: Side-by-Side QR Box & Position Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '165px 1fr',
            gap: '16px',
            padding: '0 18px 14px 18px',
            alignItems: 'center'
          }}>
            {/* Left Column: QR Code Box */}
            <div style={{
              position: 'relative',
              width: '165px',
              height: '165px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #FECDD3',
              borderRadius: '14px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box'
            }}>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR for ${posId}`}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              ) : (
                <div style={{ fontSize: '11px', color: '#788494' }}>Generating...</div>
              )}

              {/* Center Flame Badge */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: '2px solid #A80018',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(168, 0, 24, 0.25)'
              }}>
                <Flame size={16} color="#A80018" fill="#A80018" />
              </div>
            </div>

            {/* Right Column: Asset Details & Scan Pill */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* ASSET POSITION ID */}
              <div>
                <div style={{
                  fontSize: '8.5px',
                  fontWeight: 700,
                  color: '#A80018',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}>
                  ASSET POSITION ID
                </div>
                <div style={{
                  backgroundColor: '#FFF1F2',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#A80018',
                  letterSpacing: '0.04em'
                }}>
                  {posId}
                </div>
              </div>

              {/* SERIAL NO */}
              <div>
                <div style={{
                  fontSize: '8.5px',
                  fontWeight: 700,
                  color: '#A80018',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}>
                  SERIAL NO.
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#17191C'
                }}>
                  {serialNo}
                </div>
              </div>

              {/* FORM */}
              <div>
                <div style={{
                  fontSize: '8.5px',
                  fontWeight: 700,
                  color: '#A80018',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}>
                  FORM
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#17191C'
                }}>
                  {formId}
                </div>
              </div>

              {/* SCAN TO INSPECT Button */}
              <div style={{
                background: 'linear-gradient(135deg, #E02424 0%, #EA580C 100%)',
                color: '#FFFFFF',
                borderRadius: '6px',
                padding: '6px 10px',
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 2px 4px rgba(224, 36, 36, 0.25)',
                marginTop: '2px'
              }}>
                SCAN TO INSPECT
              </div>
            </div>
          </div>

          {/* Bottom Metadata Box */}
          <div style={{
            margin: '0 18px 18px 18px',
            backgroundColor: '#FFF5F5',
            border: '1px solid #F3E8E8',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#A80018', letterSpacing: '0.04em' }}>
                EQUIPMENT
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#17191C' }}>
                {equipmentDesc}
              </span>
            </div>

            <div style={{ height: '1px', backgroundColor: '#FDE8EA' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#A80018', letterSpacing: '0.04em', paddingTop: '1px' }}>
                LOCATION
              </span>
              <span style={{ fontSize: '11px', color: '#17191C', lineHeight: 1.35 }}>
                {locationDesc}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons: Launch Checklist, Print, High-Res PNG Download & Copy Code */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '480px'
      }}>
        {/* Direct Open Checklist Button */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('digital-checklist')}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: '#00875A',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 135, 90, 0.2)'
            }}
            title={`Directly open and fill digital checklist ${formId} for this equipment`}
          >
            <ClipboardCheck size={18} />
            <span>Launch Inspection Checklist ({formId}) →</span>
          </button>
        )}

        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          width: '100%'
        }}>
          <button
            onClick={handlePrint}
            className="btn-primary"
            style={{
              flex: 1,
              minWidth: '140px',
              height: '42px',
              fontSize: '13.5px',
              fontWeight: 600,
              backgroundColor: '#111827'
            }}
            title="Print official vinyl / paper QR sticker tag"
          >
            <Printer size={16} />
            <span>Print Sticker</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className="btn-outline"
            style={{
              flex: 1,
              minWidth: '140px',
              height: '42px',
              fontSize: '13.5px',
              fontWeight: 600,
              borderColor: '#A80018',
              color: '#A80018'
            }}
            title="Download complete high-res printable tag PNG"
          >
            <Download size={16} />
            <span>{isDownloading ? 'Generating...' : 'Download Tag PNG'}</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="btn-outline"
            style={{
              height: '42px',
              padding: '0 14px',
              fontSize: '13px'
            }}
            title="Copy QR Identifier link / code to clipboard"
          >
            {copiedNotice ? <Check size={15} color="#00875A" /> : <Copy size={15} />}
            <span>{copiedNotice ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Post-Registration Navigation Options */}
      {onRegisterAnother && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '560px',
          marginTop: '10px'
        }}>
          <button
            onClick={onRegisterAnother}
            className="btn-outline"
            style={{ height: '40px', padding: '0 16px', fontSize: '13px' }}
          >
            <PlusCircle size={15} />
            <span>Register Another Asset</span>
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('asset-details')}
              className="btn-outline"
              style={{ height: '40px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>View Asset Dossier</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
