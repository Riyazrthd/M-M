import React, { useState, useEffect, useRef } from 'react';
import { CHECKLIST_TEMPLATES, CHECKLIST_INDEX, COMPANY_INFO } from '../data/checklistTemplates';
import { 
  getActiveVisit, 
  saveChecklistResult, 
  getCurrentUser, 
  getPlantTechnicians, 
  addPlantTechnician,
  getPositions,
  getPositionByQR,
  resolveScannedAssetPosition,
  getChecklistSession,
  submitAssetObservation,
  completeChecklistSession
} from '../data/storage';
import jsQR from 'jsqr';
import { 
  downloadChecklistCSV, 
  downloadChecklistExcel, 
  downloadMasterWorkbookExcel 
} from '../utils/checklistExporter';
import {
  downloadChecklistPDF,
  downloadChecklistStandaloneHTML
} from '../utils/checklistPDFExporter';
import PhotoCapture from '../components/PhotoCapture';
import { 
  Check, 
  X, 
  Minus, 
  AlertCircle, 
  Camera, 
  CheckCircle2, 
  ChevronLeft, 
  ArrowRight, 
  FileText, 
  Download, 
  ChevronDown,
  Sparkles,
  Clock,
  UserCheck,
  ShieldCheck,
  PlusCircle,
  QrCode,
  Lock,
  Layers,
  RotateCcw,
  CheckCheck
} from 'lucide-react';

export default function DigitalChecklistScreen({
  position,
  activeSite,
  onNavigate,
  onOpenPhotos,
  isDirectScanMode = false
}) {
  // Determine template (default CL-11 or position's template)
  const defaultTemplateId = position?.templateId || 'CL-11';
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId);
  const template = CHECKLIST_TEMPLATES[selectedTemplateId] || CHECKLIST_TEMPLATES['CL-11'];

  const user = getCurrentUser();
  const visit = getActiveVisit(activeSite?.id || position?.siteId || "SITE-AIL-001");

  // Plant technicians roster (2-3 technicians available on-site)
  const [plantTechnicians, setPlantTechnicians] = useState(getPlantTechnicians());
  const [selectedTechId, setSelectedTechId] = useState(() => getPlantTechnicians()[0]?.id || 'tech-01');
  const [inspectingTechName, setInspectingTechName] = useState(() => getPlantTechnicians()[0]?.name || 'Ramesh Patel');
  const [inspectingTechBadge, setInspectingTechBadge] = useState(() => getPlantTechnicians()[0]?.badge || 'IFS-SE-041');
  const [inspectingTechRole, setInspectingTechRole] = useState(() => getPlantTechnicians()[0]?.roleTitle || 'Lead Service Engineer');

  const [isAddingCustomTech, setIsAddingCustomTech] = useState(false);
  const [customTechName, setCustomTechName] = useState('');
  const [customTechBadge, setCustomTechBadge] = useState('');

  // Parent Checklist Session & Submitted Child Observations
  const [session, setSession] = useState(() => getChecklistSession(visit.visitId, selectedTemplateId));
  const [submittedRecords, setSubmittedRecords] = useState(() => session?.records || []);
  const [sessionStatus, setSessionStatus] = useState(() => session?.status || 'In Progress');

  // Active Asset being inspected in the row
  const [activeAsset, setActiveAsset] = useState(() => {
    // If an initial position was passed, use it ONLY IF NOT already submitted
    const curSession = getChecklistSession(visit.visitId, selectedTemplateId);
    const existing = curSession?.records || [];
    if (position && !existing.some(r => r.positionId === position.positionId)) {
      return position;
    }
    return null;
  });

  // Observations for the currently active asset
  const [activeAnswers, setActiveAnswers] = useState({});
  const [activeRemarks, setActiveRemarks] = useState('');
  const [activePhotos, setActivePhotos] = useState([]);
  const [activeDefectItemNo, setActiveDefectItemNo] = useState(null);

  // Status feedback & notifications
  const [validationError, setValidationError] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState('');
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState('');

  // Camera QR Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerCameraActive, setScannerCameraActive] = useState(false);
  const [cameraStatusMessage, setCameraStatusMessage] = useState('Camera standby');
  const [manualCodeInput, setManualCodeInput] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Live timer
  const [currentLiveTime, setCurrentLiveTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setCurrentLiveTime(`${datePart} • ${timePart}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Synchronize when template selection changes
  useEffect(() => {
    const newSession = getChecklistSession(visit.visitId, selectedTemplateId);
    setSession(newSession);
    setSubmittedRecords(newSession?.records || []);
    setSessionStatus(newSession?.status || 'In Progress');
    setActiveAnswers({});
    setActiveRemarks('');
    setActivePhotos([]);
    setValidationError('');
    setSaveSuccessNotice('');
  }, [selectedTemplateId]);

  // Synchronize immediately when position prop is scanned or resolved
  useEffect(() => {
    if (position) {
      const curSession = getChecklistSession(visit.visitId, selectedTemplateId);
      const existing = curSession?.records || [];
      setSubmittedRecords([...existing]);
      setSession(curSession);

      if (!existing.some(r => r.positionId === position.positionId)) {
        setActiveAsset(position);
        setActiveAnswers({});
        setActiveRemarks('');
      } else {
        setActiveAsset(null);
      }
      if (position.templateId && position.templateId !== selectedTemplateId) {
        setSelectedTemplateId(position.templateId);
      }
    }
  }, [position]);

  // Handle technician selection
  const handleSelectTechnician = (techId) => {
    setValidationError('');
    if (techId === 'ADD_NEW') {
      setIsAddingCustomTech(true);
      return;
    }
    setIsAddingCustomTech(false);
    const tech = plantTechnicians.find(t => t.id === techId);
    if (tech) {
      setSelectedTechId(tech.id);
      setInspectingTechName(tech.name);
      setInspectingTechBadge(tech.badge);
      setInspectingTechRole(tech.roleTitle);
    }
  };

  const handleAddNewTechnician = () => {
    if (!customTechName || !customTechName.trim()) {
      setValidationError('Please enter technician full name.');
      return;
    }
    const newTech = addPlantTechnician({
      name: customTechName.trim(),
      badge: customTechBadge.trim() || undefined,
      roleTitle: 'Service Engineer'
    });
    if (newTech) {
      const updatedList = getPlantTechnicians();
      setPlantTechnicians(updatedList);
      setSelectedTechId(newTech.id);
      setInspectingTechName(newTech.name);
      setInspectingTechBadge(newTech.badge);
      setInspectingTechRole(newTech.roleTitle);
      setIsAddingCustomTech(false);
      setCustomTechName('');
      setCustomTechBadge('');
    }
  };

  // -------------------------------------------------------------
  // Camera & QR Scanner Operations
  // -------------------------------------------------------------
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatusMessage('Camera API not supported in this browser. Use manual selector below.');
        return;
      }
      setCameraStatusMessage('Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
      }
      setScannerCameraActive(true);
      setCameraStatusMessage('Camera active. Point at asset QR code...');

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          const video = videoRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });
            if (qrResult && qrResult.data) {
              if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
              }
              handleSelectAssetByCode(qrResult.data);
            }
          }
        }
      }, 250);
    } catch (err) {
      console.warn('Camera error:', err);
      setScannerCameraActive(false);
      setCameraStatusMessage('Camera unavailable or permission denied. Select asset from plant list below.');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScannerCameraActive(false);
    setCameraStatusMessage('Camera standby');
  };

  const handleOpenScanner = () => {
    setIsScannerOpen(true);
    setValidationError('');
    setTimeout(() => {
      startCamera();
    }, 150);
  };

  const handleCloseScanner = () => {
    stopCamera();
    setIsScannerOpen(false);
    setManualCodeInput('');
  };

  const handleSelectAssetByCode = (code) => {
    const clean = (code || '').trim();
    if (!clean) return;

    const matched = resolveScannedAssetPosition(clean) || getPositionByQR(clean) || getPositions().find(p => 
      p.positionId.toLowerCase() === clean.toLowerCase() ||
      (p.currentEquipment?.serialNo && p.currentEquipment.serialNo.toLowerCase() === clean.toLowerCase())
    );

    if (matched) {
      // Check if this asset has already been inspected in this parent checklist session
      const alreadyDone = submittedRecords.some(r => r.positionId === matched.positionId);
      if (alreadyDone) {
        setValidationError(`Asset "${matched.positionId}" is already inspected in Record #${submittedRecords.find(r => r.positionId === matched.positionId)?.sn}. Please scan a different asset.`);
        handleCloseScanner();
        return;
      }

      setActiveAsset(matched);
      setActiveAnswers({});
      setActiveRemarks('');
      setActivePhotos([]);
      setValidationError('');
      setSaveSuccessNotice(`✓ Asset "${matched.positionId}" scanned & details auto-filled for Record #${submittedRecords.length + 1}.`);
      handleCloseScanner();
    } else {
      setValidationError(`Asset code "${clean}" not recognized in plant database.`);
    }
  };

  // -------------------------------------------------------------
  // Observation Table Value Changes
  // -------------------------------------------------------------
  const handleDropdownChange = (itemNo, value) => {
    setValidationError('');
    setActiveAnswers(prev => ({
      ...prev,
      [itemNo]: value
    }));

    if (value === 'NOT_OK') {
      setActiveDefectItemNo(itemNo);
    } else if (activeDefectItemNo === itemNo) {
      setActiveDefectItemNo(null);
    }
  };

  const handleMarkAllOk = () => {
    setValidationError('');
    const updated = {};
    (template.items || []).forEach(item => {
      updated[item.itemNo] = 'OK';
    });
    setActiveAnswers(updated);
  };

  // -------------------------------------------------------------
  // Submit Current Asset Observation (Requirement 3, 4, 5)
  // -------------------------------------------------------------
  const handleSubmitObservation = () => {
    setValidationError('');
    setSaveSuccessNotice('');

    if (!activeAsset) {
      setValidationError('Please scan an asset QR code or select an asset before submitting observation.');
      return;
    }

    const items = template.items || [];
    // Ensure all required items have an observation
    const unanswered = items.filter(it => it.required && !activeAnswers[it.itemNo]);
    if (unanswered.length > 0) {
      setValidationError(`Please record observations for Item ${unanswered.map(u => u.itemNo).join(', ')} before submitting.`);
      return;
    }

    const posId = activeAsset.positionId || activeAsset.id;
    const observationPayload = {
      positionId: posId,
      serialNo: activeAsset.currentEquipment?.serialNo || activeAsset.serialNumber || 'N/A',
      equipmentType: activeAsset.equipmentType || template.targetType || 'Fire Extinguisher',
      area: activeAsset.area || 'Plant Area',
      location: activeAsset.location || 'Location',
      capacity: activeAsset.capacity || activeAsset.currentEquipment?.capacity || 'Standard',
      answers: activeAnswers,
      remarks: activeRemarks,
      photos: activePhotos,
      technicianName: inspectingTechName.trim(),
      technicianBadge: inspectingTechBadge,
      technicianRole: inspectingTechRole
    };

    const result = submitAssetObservation(visit.visitId, selectedTemplateId, observationPayload);

    if (result.success) {
      setSubmittedRecords([...result.session.records]);
      const lastRec = result.session.records[result.session.records.length - 1];
      const stamp = lastRec?.submittedAt || `${lastRec?.submissionDate} ${lastRec?.submissionTime}` || 'just now';
      setSaveSuccessNotice(`✓ Asset observation for "${posId}" submitted and locked at ${stamp} by system clock. Ready for next asset.`);
      
      // Reset active observation for next asset
      setActiveAsset(null);
      setActiveAnswers({});
      setActiveRemarks('');
      setActivePhotos([]);
      setActiveDefectItemNo(null);

      // Smooth scroll back to table
      const tableElem = document.getElementById('landscape-checklist-table');
      if (tableElem) {
        tableElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      setValidationError(result.error || 'Failed to submit observation.');
    }
  };

  // -------------------------------------------------------------
  // Final Checklist Session Completion (Requirement 6)
  // -------------------------------------------------------------
  const handleCompleteChecklist = () => {
    if (submittedRecords.length === 0) {
      setValidationError('Cannot complete checklist: No asset observations have been submitted yet. Please scan and submit at least one asset.');
      return;
    }

    const result = completeChecklistSession(visit.visitId, selectedTemplateId);
    if (result.success) {
      setSessionStatus('Completed');
      setSaveSuccessNotice(`✓ Parent Checklist ${template.docNo} completed! All ${submittedRecords.length} asset observations are locked and preserved.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // -------------------------------------------------------------
  // Master Landscape PDF Download (Exact Control Copy Layout & System Timestamps)
  // -------------------------------------------------------------
  const handleDownloadPDF = () => {
    setIsDownloadingPDF(true);
    setValidationError('');
    try {
      const recordsToExport = submittedRecords.length > 0 ? submittedRecords : (activeAsset ? [{
        sn: 1,
        area: activeArea || 'Plant Area',
        positionId: activePosId || 'POS-AIL-001',
        idNo: activePosId || 'POS-AIL-001',
        serialNo: activeAsset?.currentEquipment?.serialNo || activeAsset?.serialNumber || 'IFS-EXT-2026-001',
        location: activeLocation || 'Location',
        answers: activeAnswers,
        remarks: activeRemarks,
        technicianName: inspectingTechName.trim() || user.name || 'Ramesh Patel',
        submissionDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        submissionTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        submittedAt: `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
      }] : []);

      downloadChecklistPDF(selectedTemplateId, {
        clientName: activeSite?.clientName || activeSite?.name || 'Aarti Industries Limited',
        siteAddress: activeSite?.address || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110',
        poNumber: activeSite?.poNumber || 'PO/AIL/AMC/2026/8812',
        poDate: activeSite?.poDate || '2026-04-01',
        workOrderRef: activeSite?.workOrderRef || 'WO-IFSPL-2026-OCT-094',
        dateOfService: new Date().toISOString().substring(0, 10).split('-').reverse().join('-'),
        inspectionTime: currentLiveTime || new Date().toLocaleTimeString(),
        frequency: activeSite?.frequency || 'Quarterly',
        monthPeriod: 'October – 2026',
        records: recordsToExport,
        engineerName: inspectingTechName.trim() || user.name || 'Ramesh Patel',
        engineerBadge: inspectingTechBadge || 'IFS-SE-041',
        supervisorName: 'Sanjay Sharma',
        clientWitnessName: activeSite?.clientContact || 'Vikram Shah'
      });
      setDownloadNotice(`✓ Generated Landscape PDF for ${template.id} containing all ${recordsToExport.length} inspected asset records with exact system timestamps.`);
    } catch (err) {
      console.error('PDF generation error:', err);
      setValidationError(`PDF generation error: ${err.message}. Master Excel export is also available.`);
    } finally {
      setTimeout(() => setIsDownloadingPDF(false), 1200);
    }
  };

  // -------------------------------------------------------------
  // Master Excel (.xlsx) Download (Exact Control Copy Layout)
  // -------------------------------------------------------------
  const handleDownloadExcel = async () => {
    setIsDownloadingExcel(true);
    setValidationError('');
    try {
      await downloadChecklistExcel(selectedTemplateId, {
        clientName: activeSite?.clientName || activeSite?.name || 'Aarti Industries Limited',
        siteAddress: activeSite?.address || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110',
        poNumber: activeSite?.poNumber || 'PO/AIL/AMC/2026/8812',
        workOrderRef: activeSite?.workOrderRef || 'WO-IFSPL-2026-OCT-094',
        dateOfService: new Date().toISOString().substring(0, 10).split('-').reverse().join('-'),
        inspectionTime: currentLiveTime || new Date().toLocaleTimeString(),
        frequency: activeSite?.frequency || 'Quarterly',
        monthPeriod: 'October – 2026',
        records: submittedRecords.map(r => ({
          sn: r.sn,
          area: r.area,
          idNo: r.positionId,
          location: r.location,
          answers: r.answers,
          remarks: r.remarks ? `${r.remarks} [Captured: ${r.submittedAt || (r.submissionDate + ' ' + r.submissionTime)}]` : `[Captured: ${r.submittedAt || (r.submissionDate + ' ' + r.submissionTime)}]`
        })),
        engineerName: inspectingTechName.trim() || user.name || 'Ramesh Patel',
        supervisorName: 'Sanjay Sharma',
        clientWitnessName: activeSite?.clientContact || 'Vikram Shah',
        visitRemarks: 'Routine AMC servicing completed in accordance with IFSPL SOP specifications.'
      });
      setDownloadNotice(`✓ Downloaded ${template.id} master Excel file containing all ${submittedRecords.length} inspected asset records with system timestamps.`);
    } catch (err) {
      console.error('Download error:', err);
      setValidationError(`Excel generation note: ${err.message}. Exporting CSV fallback.`);
      downloadChecklistCSV(selectedTemplateId);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  // Quick stats calculation
  const totalUnitsInspected = submittedRecords.length;
  let totalPassCount = 0;
  let totalFailCount = 0;
  let totalNaCount = 0;
  submittedRecords.forEach(r => {
    if (r.counts) {
      totalPassCount += (r.counts.okCount || 0);
      totalFailCount += (r.counts.notOkCount || 0);
      totalNaCount += (r.counts.naCount || 0);
    }
  });

  // Current active asset metadata
  const activeSn = submittedRecords.length + 1;
  const activeArea = activeAsset?.area || activeAsset?.locationDescription?.split('—')[0]?.trim() || '';
  const activePosId = activeAsset?.positionId || activeAsset?.id || '';
  const activeLocation = activeAsset?.location || activeAsset?.locationDescription?.split('—')[1]?.trim() || '';

  // All available assets at this site matching this template
  const siteAssets = getPositions(activeSite?.id || "SITE-AIL-001").filter(p => 
    !p.templateId || p.templateId === selectedTemplateId || template.targetType === p.equipmentCategory || template.targetType === p.equipmentType
  );

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Top Action Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!isDirectScanMode && (
            <button
              onClick={() => onNavigate('site-list')}
              className="btn-outline"
              style={{ height: '36px', minHeight: '36px', padding: '0 12px', fontSize: '0.82rem' }}
            >
              <ChevronLeft size={16} /> Sites List
            </button>
          )}

          {/* Status Badge */}
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: sessionStatus === 'Completed' ? '#DCFCE7' : '#FEF3C7',
            color: sessionStatus === 'Completed' ? '#15803D' : '#B45309',
            border: sessionStatus === 'Completed' ? '1px solid #86EFAC' : '1px solid #FDE68A'
          }}>
            {sessionStatus === 'Completed' ? '✓ Checklist Completed' : '● Inspection In Progress'}
          </span>

          {activeAsset && (
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#0F172A',
              backgroundColor: '#EFF6FF',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #BFDBFE',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <QrCode size={14} color="#2563EB" />
              <span>Scanned Asset: <strong style={{ fontFamily: 'monospace' }}>{activeAsset.positionId}</strong></span>
              <span style={{ color: '#475569', fontWeight: 600 }}>({template.id} • {template.sopNo})</span>
            </span>
          )}
        </div>

        {/* Landscape PDF, Master Excel & CSV Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="btn-primary"
            style={{
              height: '36px',
              padding: '0 14px',
              fontSize: '0.82rem',
              backgroundColor: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isDownloadingPDF ? 'wait' : 'pointer',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
            }}
            title="Download filled checklist in exact original landscape PDF format"
          >
            <Download size={15} />
            <span>{isDownloadingPDF ? 'Opening Print PDF...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            disabled={isDownloadingExcel}
            className="btn-primary"
            style={{
              height: '36px',
              padding: '0 14px',
              fontSize: '0.82rem',
              backgroundColor: '#1E3A8A',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isDownloadingExcel ? 'wait' : 'pointer'
            }}
            title="Download filled checklist in exact master Excel format with all inspected rows"
          >
            <Download size={15} />
            <span>{isDownloadingExcel ? 'Generating .xlsx...' : 'Download Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => downloadChecklistCSV(selectedTemplateId)}
            className="btn-primary"
            style={{
              height: '36px',
              padding: '0 12px',
              fontSize: '0.82rem',
              backgroundColor: '#064E3B',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Download CSV copy of checklist"
          >
            <Download size={15} />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {saveSuccessNotice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#ECFDF5',
          color: '#065F46',
          border: '1px solid #A7F3D0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {downloadNotice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#EFF6FF',
          color: '#1D4ED8',
          border: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#2563EB" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {validationError && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#FEF2F2',
          color: '#B91C1C',
          border: '1px solid #FECACA',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          fontWeight: 600
        }}>
          <AlertCircle size={18} color="#DC2626" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ====================================================================
          1. ORIGINAL UPLOADED CHECKLIST FORMAT (LANDSCAPE WORKBOOK HEADER)
          Preserving exact company banner, address, doc numbers, and formatting
          ==================================================================== */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #0F172A',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
      }}>

        {/* Row 1: Company Name Header */}
        <div style={{
          backgroundColor: '#A80018',
          color: '#FFFFFF',
          textAlign: 'center',
          padding: '10px 14px',
          fontWeight: 800,
          fontSize: '1.25rem',
          letterSpacing: '0.04em'
        }}>
          {COMPANY_INFO.name}
        </div>

        {/* Row 2: Corporate Office & Contact Info */}
        <div style={{
          backgroundColor: '#1E293B',
          color: '#E2E8F0',
          textAlign: 'center',
          padding: '6px 12px',
          fontSize: '0.76rem',
          lineHeight: 1.4,
          borderBottom: '1.5px solid #0F172A'
        }}>
          {COMPANY_INFO.address}  •  {COMPANY_INFO.phones}  •  Email: {COMPANY_INFO.email}  •  Web: {COMPANY_INFO.web}
        </div>

        {/* Rows 3-4: Document Control Copy Metadata Table */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          backgroundColor: '#F8FAFC',
          borderBottom: '1.5px solid #0F172A',
          fontSize: '0.78rem'
        }}>
          <div style={{ padding: '8px 10px', borderRight: '1px solid #CBD5E1' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Checklist Doc. No.</span>
            <strong style={{ color: '#0F172A' }}>{template.docNo}</strong>
          </div>
          <div style={{ padding: '8px 10px', borderRight: '1px solid #CBD5E1' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Reference SOP No.</span>
            <strong style={{ color: '#0F172A' }}>{template.sopNo}</strong>
          </div>
          <div style={{ padding: '8px 10px', borderRight: '1px solid #CBD5E1' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Revision</span>
            <strong style={{ color: '#0F172A' }}>{template.revision}</strong>
          </div>
          <div style={{ padding: '8px 10px', borderRight: '1px solid #CBD5E1' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Effective Date</span>
            <strong style={{ color: '#0F172A' }}>{template.effectiveDate}</strong>
          </div>
          <div style={{ padding: '8px 10px' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Doc. Type / Classification</span>
            <strong style={{ color: '#0F172A' }}>{template.classification}</strong>
          </div>
        </div>

        {/* Row 5: Checklist Title */}
        <div style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 16px',
          fontWeight: 800,
          fontSize: '1.05rem',
          textAlign: 'center',
          letterSpacing: '0.02em',
          borderBottom: '1.5px solid #0F172A'
        }}>
          {template.title}
        </div>

        {/* Rows 6-9: Client & Contract Details Table */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          backgroundColor: '#FFFFFF',
          borderBottom: '1.5px solid #0F172A',
          fontSize: '0.8rem'
        }}>
          <div style={{ padding: '8px 12px', borderRight: '1px solid #CBD5E1', gridColumn: 'span 2' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Customer / Client Name & Address:</span>
            <strong style={{ color: '#0F172A' }}>
              {activeSite?.clientName || activeSite?.name || 'Aarti Industries Limited'}
            </strong>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#475569' }}>
              {activeSite?.address || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110'}
            </span>
          </div>

          <div style={{ padding: '8px 12px', borderRight: '1px solid #CBD5E1' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>PO / Contract No. & Date:</span>
            <strong style={{ color: '#0F172A' }}>{activeSite?.poNumber || 'PO/AIL/AMC/2026/8812'}</strong>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#475569' }}>Date: {activeSite?.poDate || '2026-04-01'}</span>
          </div>

          <div style={{ padding: '8px 12px' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Work Order Ref. / Period:</span>
            <strong style={{ color: '#0F172A' }}>{activeSite?.workOrderRef || 'WO-IFSPL-2026-OCT-094'}</strong>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#475569' }}>{activeSite?.amcType || 'Quarterly'} • October 2026</span>
          </div>
        </div>

        {/* Technician Inspector Sign-off Ribbon */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '8px 14px',
          backgroundColor: '#F1F5F9',
          borderBottom: '1.5px solid #0F172A',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={16} color="#059669" />
            <span style={{ fontWeight: 600, color: '#334155' }}>Inspecting Technician:</span>
            <select
              value={selectedTechId}
              onChange={(e) => handleSelectTechnician(e.target.value)}
              style={{
                height: '30px',
                padding: '0 8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '4px',
                border: '1px solid #94A3B8',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              {plantTechnicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.badge})
                </option>
              ))}
              <option value="ADD_NEW">+ Add Other Technician...</option>
            </select>
            <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Badge: <strong>{inspectingTechBadge}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={15} color="#2563EB" />
            <span style={{ color: '#475569' }}>Service Date & Clock:</span>
            <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{currentLiveTime}</strong>
          </div>
        </div>

        {/* Row 10: Official Standard Note */}
        <div style={{
          padding: '7px 12px',
          backgroundColor: '#FFFBEB',
          color: '#92400E',
          fontSize: '0.75rem',
          lineHeight: 1.4,
          borderBottom: '2px solid #0F172A'
        }}>
          {template.standardNote}
        </div>

        {/* ====================================================================
            2. LANDSCAPE CHECKLIST MATRIX TABLE
            Preserving exact columns: SR. No., Area/Plant, ID No., Location, 
            Item 1..N, Remarks, Action
            ==================================================================== */}
        <div 
          id="landscape-checklist-table"
          style={{
            overflowX: 'auto',
            width: '100%',
            backgroundColor: '#FFFFFF'
          }}
        >
          <table style={{
            width: '100%',
            minWidth: '1080px',
            borderCollapse: 'collapse',
            fontSize: '0.8rem',
            textAlign: 'left'
          }}>
            <thead>
              {/* Header Row 1: Main column names */}
              <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                <th style={{ width: '85px', padding: '10px 8px', border: '1px solid #334155', textAlign: 'center' }}>
                  SR. No.
                </th>
                <th style={{ width: '150px', padding: '10px 8px', border: '1px solid #334155' }}>
                  Area / Plant
                </th>
                <th style={{ width: '130px', padding: '10px 8px', border: '1px solid #334155' }}>
                  ID No.
                </th>
                <th style={{ width: '160px', padding: '10px 8px', border: '1px solid #334155' }}>
                  Location
                </th>
                {template.items.map((item) => (
                  <th 
                    key={item.itemNo} 
                    style={{ 
                      width: '105px', 
                      padding: '10px 6px', 
                      border: '1px solid #334155', 
                      textAlign: 'center',
                      verticalAlign: 'top'
                    }}
                  >
                    <div>Item {item.itemNo}</div>
                  </th>
                ))}
                <th style={{ width: '170px', padding: '10px 8px', border: '1px solid #334155' }}>
                  Remarks
                </th>
                <th style={{ width: '165px', padding: '10px 8px', border: '1px solid #334155', textAlign: 'center' }}>
                  System Timestamp (Captured)
                </th>
              </tr>

              {/* Header Row 2: Item Description Text */}
              <tr style={{ backgroundColor: '#F8FAFC', color: '#334155', fontSize: '0.72rem', lineHeight: 1.3 }}>
                <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>-</th>
                <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1' }}>Facility Area</th>
                <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1' }}>Asset Position</th>
                <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1' }}>Mounting Point</th>
                {template.items.map((item) => (
                  <th 
                    key={item.itemNo} 
                    style={{ 
                      padding: '6px 6px', 
                      border: '1px solid #CBD5E1', 
                      textAlign: 'center',
                      fontWeight: 500,
                      color: '#1E293B'
                    }}
                  >
                    {item.text}
                  </th>
                ))}
                <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1' }}>Abnormalities</th>
                <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>Date & Time Captured</th>
              </tr>

              {/* Header Row 3: Applicability */}
              <tr style={{ backgroundColor: '#EDF2F7', color: '#64748B', fontSize: '0.69rem' }}>
                <th style={{ padding: '4px 8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>-</th>
                <th style={{ padding: '4px 8px', border: '1px solid #CBD5E1' }}>Plant Floor</th>
                <th style={{ padding: '4px 8px', border: '1px solid #CBD5E1' }}>Tag ID</th>
                <th style={{ padding: '4px 8px', border: '1px solid #CBD5E1' }}>Physical Point</th>
                {template.items.map((item) => (
                  <th key={item.itemNo} style={{ padding: '4px 4px', border: '1px solid #CBD5E1', textAlign: 'center', fontStyle: 'italic' }}>
                    {item.applicability}
                  </th>
                ))}
                <th style={{ padding: '4px 8px', border: '1px solid #CBD5E1' }}>Notes</th>
                <th style={{ padding: '4px 8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>System Clock</th>
              </tr>
            </thead>

            <tbody>
              {/* ================================================================
                  1. NEW SCAN ENTRY ROW (ALWAYS UPPER / AT TOP OF TABLE)
                  - Features compact camera/QR scan icon against SR. No.
                  - Auto-fills asset details when scanned
                  - Technician fills observation and clicks Submit Obs.
                  ================================================================ */}
              {sessionStatus !== 'Completed' && (
                <tr style={{
                  backgroundColor: '#EFF6FF',
                  border: '2px solid #2563EB',
                  boxShadow: 'inset 0 0 4px rgba(37,99,235,0.1)'
                }}>
                  {/* SR. No. with COMPACT CAMERA / QR SCAN ICON */}
                  <td style={{
                    padding: '8px 6px',
                    border: '1px solid #93C5FD',
                    textAlign: 'center',
                    verticalAlign: 'middle'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E3A8A' }}>
                        {activeSn}
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenScanner}
                        style={{
                          width: '28px',
                          height: '28px',
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(220,38,38,0.3)',
                          padding: 0
                        }}
                        title={`Click camera icon to scan asset QR code for Serial No. ${activeSn}`}
                      >
                        <Camera size={15} />
                      </button>
                    </div>
                  </td>

                  {/* Area / Plant (Auto-filled on QR scan) */}
                  <td style={{ padding: '8px 6px', border: '1px solid #93C5FD', verticalAlign: 'middle' }}>
                    <input
                      type="text"
                      value={activeArea}
                      onChange={(e) => setActiveAsset(prev => ({ ...prev, area: e.target.value }))}
                      placeholder="Scan QR to auto-fill area..."
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid #BFDBFE',
                        backgroundColor: activeAsset ? '#FFFFFF' : '#F8FAFC',
                        color: '#0F172A'
                      }}
                    />
                  </td>

                  {/* ID No. (Auto-filled on QR scan — NO separate input, NO button) */}
                  <td style={{ padding: '8px 6px', border: '1px solid #93C5FD', verticalAlign: 'middle' }}>
                    {activeAsset ? (
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          backgroundColor: '#1E3A8A',
                          color: '#FFFFFF',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          {activePosId}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.66rem', color: '#64748B', marginTop: '2px' }}>
                          SN: {activeAsset.currentEquipment?.serialNo || activeAsset.serialNumber || 'N/A'}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontStyle: 'italic' }}>
                        Scan QR code...
                      </span>
                    )}
                  </td>

                  {/* Location (Auto-filled on QR scan) */}
                  <td style={{ padding: '8px 6px', border: '1px solid #93C5FD', verticalAlign: 'middle' }}>
                    <input
                      type="text"
                      value={activeLocation}
                      onChange={(e) => setActiveAsset(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Scan QR to auto-fill location..."
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '0.78rem',
                        borderRadius: '4px',
                        border: '1px solid #BFDBFE',
                        backgroundColor: activeAsset ? '#FFFFFF' : '#F8FAFC',
                        color: '#0F172A'
                      }}
                    />
                  </td>

                  {/* Observation Item Dropdowns (Columns 5 to N+4) */}
                  {template.items.map((item) => {
                    const val = activeAnswers[item.itemNo] || '';
                    return (
                      <td 
                        key={item.itemNo} 
                        style={{ 
                          padding: '8px 4px', 
                          border: '1px solid #93C5FD', 
                          textAlign: 'center',
                          verticalAlign: 'middle'
                        }}
                      >
                        <select
                          value={val}
                          onChange={(e) => handleDropdownChange(item.itemNo, e.target.value)}
                          style={{
                            width: '100%',
                            height: '32px',
                            padding: '0 4px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: val === 'OK' ? '#DCFCE7' : val === 'NOT_OK' ? '#FEE2E2' : val === 'NA' ? '#FEF3C7' : '#FFFFFF',
                            color: val === 'OK' ? '#15803D' : val === 'NOT_OK' ? '#B91C1C' : val === 'NA' ? '#B45309' : '#475569',
                            border: val === 'OK' ? '1.5px solid #22C55E' : val === 'NOT_OK' ? '1.5px solid #EF4444' : val === 'NA' ? '1.5px solid #F59E0B' : '1px solid #94A3B8'
                          }}
                        >
                          <option value="">--</option>
                          <option value="OK">√ OK</option>
                          <option value="NOT_OK">X Fail</option>
                          <option value="NA">NA</option>
                        </select>
                      </td>
                    );
                  })}

                  {/* Remarks Field */}
                  <td style={{ padding: '8px 6px', border: '1px solid #93C5FD', verticalAlign: 'middle' }}>
                    <input
                      type="text"
                      value={activeRemarks}
                      onChange={(e) => setActiveRemarks(e.target.value)}
                      placeholder="Enter observation..."
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '0.78rem',
                        borderRadius: '4px',
                        border: '1px solid #BFDBFE',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A'
                      }}
                    />
                  </td>

                  {/* Submit Observation Button */}
                  <td style={{ padding: '8px 6px', border: '1px solid #93C5FD', textAlign: 'center', verticalAlign: 'middle' }}>
                    <button
                      type="button"
                      onClick={handleSubmitObservation}
                      style={{
                        width: '100%',
                        height: '36px',
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(5,150,105,0.3)',
                        whiteSpace: 'nowrap'
                      }}
                      title="Lock observation for this asset and capture exact system date and time"
                    >
                      <CheckCheck size={14} />
                      <span>Submit Obs.</span>
                    </button>
                  </td>
                </tr>
              )}

              {/* ================================================================
                  2. ALL SUBMITTED RECORDS (UNDER SEQUENCE IN BELOW)
                  - After submit, each record appears below under sequential Sr. No. (1, 2, 3...)
                  - Permanently preserved and locked
                  ================================================================ */}
              {submittedRecords.map((rec) => (
                <tr 
                  key={rec.positionId} 
                  style={{
                    backgroundColor: rec.overallResult === 'Defective' ? '#FEF2F2' : '#F0FDF4',
                    borderBottom: '1px solid #CBD5E1'
                  }}
                >
                  {/* Locked SR. No. */}
                  <td style={{ padding: '8px 8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Lock size={12} color="#059669" />
                      <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{rec.sn}</strong>
                    </div>
                  </td>

                  {/* Area */}
                  <td style={{ padding: '8px 8px', border: '1px solid #CBD5E1', color: '#1E293B' }}>
                    {rec.area}
                  </td>

                  {/* Asset ID */}
                  <td style={{ padding: '8px 8px', border: '1px solid #CBD5E1' }}>
                    <span style={{
                      display: 'inline-block',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #CBD5E1'
                    }}>
                      {rec.positionId}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748B' }}>
                      SN: {rec.serialNo}
                    </span>
                  </td>

                  {/* Location */}
                  <td style={{ padding: '8px 8px', border: '1px solid #CBD5E1', color: '#475569' }}>
                    {rec.location}
                  </td>

                  {/* Item Observations (Locked Cells) */}
                  {template.items.map((item) => {
                    const status = rec.answers ? (rec.answers[item.itemNo]?.status || rec.answers[item.itemNo]) : '';
                    let badgeBg = '#F8FAFC';
                    let badgeColor = '#64748B';
                    let symbol = '-';

                    if (status === 'OK' || status === '√') {
                      badgeBg = '#DCFCE7';
                      badgeColor = '#15803D';
                      symbol = '√';
                    } else if (status === 'NOT_OK' || status === 'FAIL' || status === 'X') {
                      badgeBg = '#FEE2E2';
                      badgeColor = '#B91C1C';
                      symbol = 'X';
                    } else if (status === 'NA') {
                      badgeBg = '#FEF3C7';
                      badgeColor = '#B45309';
                      symbol = 'NA';
                    }

                    return (
                      <td key={item.itemNo} style={{ padding: '8px 4px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '28px',
                          height: '24px',
                          lineHeight: '24px',
                          borderRadius: '4px',
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}>
                          {symbol}
                        </span>
                      </td>
                    );
                  })}

                  {/* Remarks */}
                  <td style={{ padding: '8px 8px', border: '1px solid #CBD5E1', color: '#1E293B', fontSize: '0.78rem' }}>
                    {rec.remarks || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>None</span>}
                  </td>

                  {/* Date, Time & Technician Name (Compact Style - No Big Elements) */}
                  <td style={{ padding: '4px 6px', border: '1px solid #CBD5E1', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.25 }}>
                      {rec.submissionDate || (rec.submittedAt ? rec.submittedAt.split(' ')[0] : 'N/A')}
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563EB', fontFamily: 'monospace', lineHeight: 1.25 }}>
                      {rec.submissionTime || (rec.submittedAt ? rec.submittedAt.split(' ').slice(1).join(' ') : 'N/A')}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#475569', fontWeight: 500, lineHeight: 1.25 }}>
                      {rec.technicianName || 'Technician'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ====================================================================
            SUMMARY COUNTER METRICS BAR (Matching Rows 39-42 of Master Excel)
            ==================================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          backgroundColor: '#F8FAFC',
          borderTop: '2px solid #0F172A',
          textAlign: 'center',
          fontSize: '0.8rem'
        }}>
          <div style={{ padding: '10px', borderRight: '1px solid #CBD5E1' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Total Units Inspected (nos.)</span>
            <strong style={{ fontSize: '1.25rem', color: '#0F172A' }}>{totalUnitsInspected}</strong>
          </div>
          <div style={{ padding: '10px', borderRight: '1px solid #CBD5E1', backgroundColor: '#F0FDF4' }}>
            <span style={{ color: '#15803D', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>Total √ (OK / Pass)</span>
            <strong style={{ fontSize: '1.25rem', color: '#15803D' }}>{totalPassCount}</strong>
          </div>
          <div style={{ padding: '10px', borderRight: '1px solid #CBD5E1', backgroundColor: '#FEF2F2' }}>
            <span style={{ color: '#B91C1C', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>Total X (NOT OK / Fail)</span>
            <strong style={{ fontSize: '1.25rem', color: '#B91C1C' }}>{totalFailCount}</strong>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#FFFBEB' }}>
            <span style={{ color: '#B45309', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>Total NA</span>
            <strong style={{ fontSize: '1.25rem', color: '#B45309' }}>{totalNaCount}</strong>
          </div>
        </div>

        {/* Section 6: Final Checklist Completion Action Bar (Requirement 6) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #CBD5E1'
        }}>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
              Multi-Asset Session: {totalUnitsInspected} Assets Recorded Under {template.docNo}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              All submitted observations are permanently locked and will be embedded in the official Excel workbook.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {sessionStatus !== 'Completed' ? (
              <button
                type="button"
                onClick={handleCompleteChecklist}
                className="btn-primary"
                style={{
                  height: '42px',
                  padding: '0 20px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  backgroundColor: '#059669',
                  boxShadow: '0 2px 6px rgba(5,150,105,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCheck size={18} />
                <span>Complete Checklist (Finalize All {totalUnitsInspected} Assets)</span>
              </button>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: '1.5px solid #86EFAC'
              }}>
                <CheckCircle2 size={18} color="#15803D" />
                <span>Checklist Finalized & Locked</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              style={{
                height: '42px',
                padding: '0 18px',
                fontSize: '0.86rem',
                fontWeight: 700,
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isDownloadingPDF ? 'wait' : 'pointer',
                boxShadow: '0 2px 5px rgba(220, 38, 38, 0.35)'
              }}
              title="Download exact original landscape PDF with system timestamps"
            >
              <Download size={16} />
              <span>{isDownloadingPDF ? 'Opening Print PDF...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="btn-outline"
              style={{
                height: '42px',
                padding: '0 16px',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={16} />
              <span>Export Master Excel</span>
            </button>
          </div>
        </div>

      </div>

      {/* ====================================================================
          CAMERA / QR CODE SCANNER MODAL
          Triggered by clicking the Camera/QR icon against SR. No.
          ==================================================================== */}
      {isScannerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#EF4444" />
                <strong style={{ fontSize: '0.95rem' }}>
                  Scan Asset QR Code — {template.shortTitle || template.targetType}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleCloseScanner}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.25rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Camera Video Viewfinder */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '240px',
                backgroundColor: '#000000',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: scannerCameraActive ? 'block' : 'none'
                  }}
                />

                {!scannerCameraActive && (
                  <div style={{ textAlign: 'center', color: '#94A3B8', padding: '16px' }}>
                    <QrCode size={48} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <div style={{ fontSize: '0.84rem' }}>{cameraStatusMessage}</div>
                  </div>
                )}

                {/* Targeting Reticle */}
                {scannerCameraActive && (
                  <div style={{
                    position: 'absolute',
                    width: '160px',
                    height: '160px',
                    border: '2px solid #22C55E',
                    borderRadius: '12px',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)'
                  }} />
                )}
              </div>

              {/* Manual Asset Code Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Or enter Asset Position Code / Serial Number:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="e.g. POS-AIL-001 or IFS-2022-DCP-8821"
                    style={{
                      flex: 1,
                      height: '38px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.84rem'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSelectAssetByCode(manualCodeInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSelectAssetByCode(manualCodeInput)}
                    className="btn-primary"
                    style={{ height: '38px', padding: '0 14px', fontSize: '0.82rem' }}
                  >
                    Load Asset
                  </button>
                </div>
              </div>

              {/* Quick Select Assets at this Site */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Or pick from registered {template.targetType} assets at {activeSite?.name || 'Site'}:
                </div>
                <div style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px'
                }}>
                  {siteAssets.length === 0 ? (
                    <div style={{ padding: '10px', fontSize: '0.78rem', color: '#94A3B8', textAlign: 'center' }}>
                      No assets found matching this checklist type.
                    </div>
                  ) : (
                    siteAssets.map(ast => {
                      const isAlreadyDone = submittedRecords.some(r => r.positionId === ast.positionId);
                      return (
                        <div
                          key={ast.id || ast.positionId}
                          onClick={() => handleSelectAssetByCode(ast.positionId)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer',
                            backgroundColor: isAlreadyDone ? '#F8FAFC' : '#FFFFFF'
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.82rem', color: '#0F172A', fontFamily: 'monospace' }}>
                              {ast.positionId}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: '#64748B', marginLeft: '6px' }}>
                              ({ast.equipmentType || template.targetType}) • {ast.location}
                            </span>
                          </div>
                          {isAlreadyDone ? (
                            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                              ✓ Inspected
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600 }}>
                              Select & Fill →
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '10px 16px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0'
            }}>
              <button
                type="button"
                onClick={handleCloseScanner}
                className="btn-outline"
                style={{ height: '34px', padding: '0 14px', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
