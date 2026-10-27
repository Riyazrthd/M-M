import React, { useState, useEffect, useRef } from 'react';
import { getPositions, getPositionByQR } from '../data/storage';
import { 
  QrCode, 
  Search, 
  Camera, 
  CameraOff, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  PlusCircle, 
  Shield, 
  Calendar,
  Wrench,
  Tag,
  Sparkles
} from 'lucide-react';

export default function QRScannerScreen({ onNavigate, onSelectPosition, activeSite }) {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [unknownCode, setUnknownCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatusMessage, setCameraStatusMessage] = useState('Camera standby');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Available positions for quick testing
  const allPositions = getPositions(activeSite ? activeSite.id : null);

  // Attempt to start real camera stream if supported and requested
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatusMessage('Camera API not supported in this browser.');
        return;
      }

      setCameraStatusMessage('Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setCameraStatusMessage('Camera active. Scanning for QR tags...');

      // If native BarcodeDetector is available, set up detection loop
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39'] });
          const scanInterval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const rawValue = barcodes[0].rawValue;
                  handleScanCode(rawValue);
                  clearInterval(scanInterval);
                }
              } catch (detectErr) {
                // Ignore frame detection hiccups
              }
            }
          }, 400);
        } catch (e) {
          console.log('BarcodeDetector initialization:', e);
        }
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraActive(false);
      setCameraStatusMessage('Camera unavailable or permission denied. Use manual entry below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraStatusMessage('Camera paused');
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleScanCode = (codeToScan) => {
    const code = (codeToScan || manualCode).trim();
    if (!code) {
      setScanError('Please enter or scan a valid QR code or Position ID');
      setScannedResult(null);
      return;
    }

    const match = getPositionByQR(code);
    if (match) {
      setScannedResult(match);
      setScanError('');
      setUnknownCode('');
      if (onSelectPosition) {
        onSelectPosition(match);
      }
    } else {
      setScanError(`Asset not found: No equipment position registered for code "${code}".`);
      setUnknownCode(code);
      setScannedResult(null);
    }
  };

  const handleStartInspection = () => {
    if (scannedResult) {
      if (onSelectPosition) {
        onSelectPosition(scannedResult);
      }
      onNavigate('digital-checklist');
    }
  };

  const handleViewDetails = () => {
    if (scannedResult) {
      if (onSelectPosition) {
        onSelectPosition(scannedResult);
      }
      onNavigate('asset-details');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Title & Quick Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0F172A', color: '#FFFFFF' }}>
              Step 1: Permanent QR Scan
            </span>
            {activeSite && (
              <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' }}>
                {activeSite.name}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Equipment Position QR Scanner
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#6B7280', margin: '2px 0 0 0' }}>
            Scanning the permanent equipment position QR automatically launches its mapped SOP checklist.
          </p>
        </div>

        <button
          onClick={() => onNavigate('asset-register')}
          className="btn-primary"
          style={{ height: '38px', fontSize: '0.84rem' }}
        >
          <PlusCircle size={15} />
          <span>Register New Asset</span>
        </button>
      </div>

      {/* Camera Viewfinder */}
      <div className="saas-card" style={{ padding: '16px', textAlign: 'center' }}>
        <div className="scanner-viewfinder" style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Live Video Feed Element */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: cameraActive ? 'block' : 'none'
            }}
          />

          {/* Fallback Viewfinder Animation */}
          {!cameraActive && (
            <div style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '20px' }}>
              <CameraOff size={32} style={{ margin: '0 auto 8px', opacity: 0.8 }} />
              <div style={{ fontSize: '0.8rem' }}>{cameraStatusMessage}</div>
            </div>
          )}

          <div className="scanner-laser" />
          <div className="scanner-reticle" />

          {/* Top Camera Controls */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              color: '#fff',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem'
            }}>
              <Camera size={12} color={cameraActive ? '#059669' : '#94A3B8'} />
              <span>{cameraActive ? 'Live Camera Feed' : 'Optical Viewfinder'}</span>
            </div>

            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              style={{
                height: '28px',
                minHeight: '28px',
                padding: '0 10px',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '9999px',
                color: '#111827',
                fontWeight: 600
              }}
            >
              {cameraActive ? 'Pause Camera' : 'Turn On Camera'}
            </button>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '5px 12px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '9999px'
          }}>
            Align position QR code inside the white reticle frame
          </div>
        </div>

        {/* Quick Demo Test Barcodes */}
        <div style={{ marginTop: '16px', textAlign: 'left' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Quick Demo Scan (Simulate reading physical QR sticker):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allPositions.slice(0, 5).map((pos) => {
              const posId = pos.id || pos.positionId;
              return (
                <button
                  key={posId}
                  onClick={() => {
                    setManualCode(pos.qrCode);
                    handleScanCode(pos.qrCode);
                  }}
                  className="btn-outline"
                  style={{
                    height: '34px',
                    minHeight: '34px',
                    padding: '0 10px',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <QrCode size={13} color="#DC2626" />
                  <span style={{ fontWeight: 600 }}>{posId}</span>
                  <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>({pos.templateId})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Manual Entry Fallback */}
      <div className="saas-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
          Manual Position ID / QR Code Lookup Fallback
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0 0 14px 0' }}>
          When the camera cannot be used or hardware permissions are restricted, type the printed Position ID or QR string manually.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScanCode(manualCode);
          }}
          style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. QR-POS-AIL-001 or IFS-POS-000101"
              value={manualCode}
              onChange={(e) => {
                setManualCode(e.target.value);
                setScanError('');
              }}
              style={{ paddingLeft: '38px', height: '42px' }}
            />
            <QrCode size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#6B7280' }} />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ height: '42px', padding: '0 20px' }}
          >
            Lookup Asset
          </button>
        </form>

        {/* Unknown QR Alert */}
        {scanError && (
          <div style={{
            marginTop: '14px',
            padding: '14px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 700, fontSize: '0.86rem' }}>
              <AlertCircle size={16} />
              <span>{scanError}</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#4B5563', margin: 0 }}>
              No random asset will be opened. If this is a newly mounted equipment position on site, register it now to generate its permanent record.
            </p>
            <div>
              <button
                onClick={() => onNavigate('asset-register')}
                className="btn-primary"
                style={{ height: '34px', minHeight: '34px', fontSize: '0.8rem', padding: '0 12px' }}
              >
                <PlusCircle size={14} />
                <span>Register This Asset Position</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RESOLVED ASSET CARD (When valid QR is scanned) */}
      {scannedResult && (
        <div
          className="saas-card"
          style={{
            border: '1.5px solid #059669',
            backgroundColor: '#FFFFFF',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-in'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#D1FAE5', color: '#059669' }}>
                    Verified Position
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                    Auto-Loaded SOP: {scannedResult.templateId}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: '2px 0 0 0' }}>
                  {scannedResult.id || scannedResult.positionId}
                </h3>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: '#6B7280', display: 'block' }}>Permanent QR Tag:</span>
              <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#111827' }}>{scannedResult.qrCode}</strong>
            </div>
          </div>

          {/* Asset Summary Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            backgroundColor: '#F9FAFB',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '16px',
            border: '1px solid #E5E7EB'
          }}>
            <div>
              <span style={{ color: '#6B7280', display: 'block' }}>Client & Site:</span>
              <strong style={{ color: '#111827' }}>{scannedResult.clientName || 'Aarti Industries Ltd'}</strong>
              <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>{scannedResult.siteName || activeSite?.name}</div>
            </div>

            <div>
              <span style={{ color: '#6B7280', display: 'block' }}>Area & Location:</span>
              <strong style={{ color: '#111827' }}>{scannedResult.area || scannedResult.locationDescription}</strong>
              <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>{scannedResult.location || 'Ground Floor'}</div>
            </div>

            <div>
              <span style={{ color: '#6B7280', display: 'block' }}>Equipment Type:</span>
              <strong style={{ color: '#DC2626' }}>
                {scannedResult.currentEquipment?.type || scannedResult.equipmentCategory || scannedResult.equipmentType}
              </strong>
              <div style={{ color: '#6B7280' }}>Rating: {scannedResult.currentEquipment?.capacity || 'Standard'}</div>
            </div>

            <div>
              <span style={{ color: '#6B7280', display: 'block' }}>Installed Serial Number:</span>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A', fontFamily: 'monospace' }}>
                {scannedResult.currentEquipment?.serialNumber || scannedResult.currentEquipment?.serialNo}
              </strong>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleStartInspection}
              className="btn-primary"
              style={{ flex: 1.5, height: '44px', fontSize: '0.92rem', justifyContent: 'center' }}
            >
              <span>Launch Checklist ({scannedResult.templateId})</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={handleViewDetails}
              className="btn-outline"
              style={{ flex: 1, height: '44px', fontSize: '0.88rem' }}
            >
              <span>Asset Dossier & Cylinder Swap</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
