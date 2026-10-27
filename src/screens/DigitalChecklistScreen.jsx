import React, { useState, useEffect } from 'react';
import { CHECKLIST_TEMPLATES, CHECKLIST_INDEX, COMPANY_INFO } from '../data/checklistTemplates';
import { getActiveVisit, saveChecklistResult, getCurrentUser, getPlantTechnicians, addPlantTechnician } from '../data/storage';
import { 
  downloadChecklistCSV, 
  downloadChecklistExcel, 
  downloadMasterWorkbookExcel 
} from '../utils/checklistExporter';
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
  PlusCircle
} from 'lucide-react';

export default function DigitalChecklistScreen({
  position,
  activeSite,
  onNavigate,
  onOpenPhotos
}) {
  // Determine template (default CL-11 or position's template)
  const defaultTemplateId = position?.templateId || 'CL-11';
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId);
  const template = CHECKLIST_TEMPLATES[selectedTemplateId] || CHECKLIST_TEMPLATES['CL-11'];

  const user = getCurrentUser();
  const visit = getActiveVisit(activeSite?.id || position?.siteId || "SITE-AIL-001");

  // Load existing answers for this position if already saved
  const posId = position?.positionId || position?.id || 'POS-AIL-001';
  const initialData = (visit.checklistAnswers && visit.checklistAnswers[posId])
    ? visit.checklistAnswers[posId]
    : { items: {}, remarks: '', photos: [] };

  const [responses, setResponses] = useState(initialData.items || {});
  const [remarks, setRemarks] = useState(initialData.remarks || '');
  const [photos, setPhotos] = useState(initialData.photos || []);
  const [validationError, setValidationError] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState('');
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState('');

  // Plant technicians roster (2-3 technicians available on-site)
  const [plantTechnicians, setPlantTechnicians] = useState(getPlantTechnicians());
  const [selectedTechId, setSelectedTechId] = useState(() => {
    if (initialData.technicianName) {
      const match = getPlantTechnicians().find(t => t.name.toLowerCase() === initialData.technicianName.toLowerCase());
      if (match) return match.id;
    }
    return getPlantTechnicians()[0]?.id || 'tech-01';
  });
  const [inspectingTechName, setInspectingTechName] = useState(() => {
    if (initialData.technicianName) return initialData.technicianName;
    return getPlantTechnicians()[0]?.name || 'Ramesh Patel';
  });
  const [inspectingTechBadge, setInspectingTechBadge] = useState(() => {
    if (initialData.technicianBadge) return initialData.technicianBadge;
    return getPlantTechnicians()[0]?.badge || 'IFS-SE-041';
  });
  const [inspectingTechRole, setInspectingTechRole] = useState(() => {
    if (initialData.technicianRole) return initialData.technicianRole;
    return getPlantTechnicians()[0]?.roleTitle || 'Lead Service Engineer';
  });

  const [isAddingCustomTech, setIsAddingCustomTech] = useState(false);
  const [customTechName, setCustomTechName] = useState('');
  const [customTechBadge, setCustomTechBadge] = useState('');

  const [capturedTimestamp, setCapturedTimestamp] = useState(
    initialData.timestamp || initialData.savedAt || ''
  );
  const [currentLiveTime, setCurrentLiveTime] = useState('');

  // Handle technician selection from plant dropdown
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

  // Live timer for exact real-time capture
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

  // Selected item modal/inline form for defect details (reason + photo evidence)
  const [activeDefectItemNo, setActiveDefectItemNo] = useState(null);

  // Update responses when template or position changes
  useEffect(() => {
    if (position?.templateId && position.templateId !== selectedTemplateId) {
      setSelectedTemplateId(position.templateId);
    }
  }, [position]);

  // Handle status click (OK, NOT_OK, NA)
  const handleSetStatus = (itemNo, newStatus) => {
    setValidationError('');
    const existing = responses[itemNo] || { status: null, reason: '', photo: null };

    if (newStatus === 'NOT_OK') {
      setActiveDefectItemNo(itemNo);
      setResponses({
        ...responses,
        [itemNo]: {
          ...existing,
          status: 'NOT_OK'
        }
      });
    } else {
      if (activeDefectItemNo === itemNo) {
        setActiveDefectItemNo(null);
      }
      setResponses({
        ...responses,
        [itemNo]: {
          ...existing,
          status: newStatus
        }
      });
    }
  };

  const handleUpdateDefectReason = (itemNo, reason) => {
    const existing = responses[itemNo] || { status: 'NOT_OK', reason: '', photo: null };
    setResponses({
      ...responses,
      [itemNo]: {
        ...existing,
        reason
      }
    });
  };

  const handleUpdateDefectPhoto = (itemNo, photoUrl) => {
    const existing = responses[itemNo] || { status: 'NOT_OK', reason: '', photo: null };
    setResponses({
      ...responses,
      [itemNo]: {
        ...existing,
        photo: photoUrl
      }
    });
  };

  // Validation
  const validateForm = () => {
    if (!inspectingTechName || !inspectingTechName.trim()) {
      setValidationError('Technician Name (who inspected) is required before submitting the inspection.');
      return false;
    }

    for (const item of template.items) {
      const resp = responses[item.itemNo];
      if (!resp || !resp.status) {
        setValidationError(`Item ${item.itemNo} ("${item.text}") has not been verified. Please select OK, NOT OK, or NA.`);
        return false;
      }

      if (resp.status === 'NOT_OK') {
        if (!resp.reason || resp.reason.trim().length < 5) {
          setValidationError(`Item ${item.itemNo} is marked NOT OK. A descriptive abnormality reason is required.`);
          setActiveDefectItemNo(item.itemNo);
          return false;
        }

        if (!resp.photo) {
          setValidationError(`Item ${item.itemNo} is marked NOT OK. Photo evidence of the defect is mandatory before submission.`);
          setActiveDefectItemNo(item.itemNo);
          return false;
        }
      }
    }
    return true;
  };

  // Metric totals
  const totalItemsCount = template.items.length;
  let okCount = 0;
  let notOkCount = 0;
  let naCount = 0;
  let completedCount = 0;

  template.items.forEach((item) => {
    const r = responses[item.itemNo];
    if (r && r.status) {
      completedCount++;
      if (r.status === 'OK') okCount++;
      else if (r.status === 'NOT_OK') notOkCount++;
      else if (r.status === 'NA') naCount++;
    }
  });

  const progressPercent = totalItemsCount > 0 ? Math.round((completedCount / totalItemsCount) * 100) : 0;

  // Direct download in EXACT control copy format
  const handleDownloadExactCSV = () => {
    const filledAnswers = {};
    template.items.forEach(it => {
      const r = responses[it.itemNo];
      filledAnswers[it.itemNo] = r ? r.status : '';
    });

    const primaryDefect = Object.values(responses).find(r => r.status === 'NOT_OK' && r.reason);

    downloadChecklistCSV(selectedTemplateId, {
      clientName: activeSite?.clientName || activeSite?.name || 'Aarti Industries Limited',
      siteAddress: activeSite?.address || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110',
      poNumber: activeSite?.poNumber || 'PO/AIL/AMC/2026/8812',
      workOrderRef: activeSite?.workOrderRef || 'WO-IFSPL-2026-OCT-094',
      dateOfService: new Date().toISOString().substring(0, 10).split('-').reverse().join('-'),
      frequency: activeSite?.frequency || 'Quarterly',
      monthPeriod: 'October – 2026',
      area: position?.area || position?.locationDescription || 'Plant 1 Reaction Bay',
      positionId: posId,
      location: position?.location || 'Near Column C-4, West Fire Corridor',
      engineerName: inspectingTechName.trim() || user.name || 'Ramesh Patel',
      supervisorName: 'Sanjay Sharma',
      clientWitnessName: activeSite?.clientContact || 'Vikram Shah',
      techSig: true,
      clientSig: true,
      inspectionTime: currentLiveTime || new Date().toLocaleTimeString(),
      visitRemarks: remarks || 'Routine AMC servicing completed. Pressure and operational baseline tested satisfactory.',
      answers: responses,
      records: [
        {
          sn: 1,
          area: position?.area || position?.locationDescription || 'Plant 1',
          idNo: posId,
          location: position?.location || 'Reaction Bay Pillar C-4',
          answers: responses,
          remarks: primaryDefect ? primaryDefect.reason : ''
        }
      ]
    });
  };

  // Direct download in EXACT Microsoft Excel (.xlsx) control copy format
  const handleDownloadExactExcel = async () => {
    setIsDownloadingExcel(true);
    setValidationError('');
    try {
      const primaryDefect = Object.values(responses).find(r => r.status === 'NOT_OK' && r.reason);
      await downloadChecklistExcel(selectedTemplateId, {
        clientName: activeSite?.clientName || activeSite?.name || 'Aarti Industries Limited',
        siteAddress: activeSite?.address || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110',
        poNumber: activeSite?.poNumber || 'PO/AIL/AMC/2026/8812',
        workOrderRef: activeSite?.workOrderRef || 'WO-IFSPL-2026-OCT-094',
        dateOfService: new Date().toISOString().substring(0, 10).split('-').reverse().join('-'),
        inspectionTime: currentLiveTime || new Date().toLocaleTimeString(),
        frequency: activeSite?.frequency || 'Quarterly',
        monthPeriod: 'October – 2026',
        area: position?.area || position?.locationDescription || 'Plant 1 Reaction Bay',
        positionId: posId,
        location: position?.location || 'Near Column C-4, West Fire Corridor',
        engineerName: inspectingTechName.trim() || user.name || 'Ramesh Patel',
        supervisorName: 'Sanjay Sharma',
        clientWitnessName: activeSite?.clientContact || 'Vikram Shah',
        visitRemarks: remarks || 'Routine AMC servicing completed. Pressure and operational baseline tested satisfactory.',
        answers: responses,
        records: [
          {
            sn: 1,
            area: position?.area || position?.locationDescription || 'Plant 1',
            idNo: posId,
            location: position?.location || 'Reaction Bay Pillar C-4',
            answers: responses,
            remarks: primaryDefect ? primaryDefect.reason : ''
          }
        ]
      });
      setDownloadNotice(`Excel (.xlsx) generated for ${selectedTemplateId} in exact master control copy format without changes.`);
      setTimeout(() => setDownloadNotice(''), 5000);
    } catch (err) {
      console.error('Excel download error:', err);
      setValidationError('Failed to generate Excel file: ' + err.message);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handleSaveAndProceed = () => {
    if (!validateForm()) {
      return;
    }

    const now = new Date();
    const isoTimestamp = now.toISOString();
    const formattedDate = isoTimestamp.substring(0, 10);
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fullTimestamp = `${formattedDate} ${formattedTime}`;

    const result = saveChecklistResult(visit.visitId, posId, {
      templateId: selectedTemplateId,
      items: responses,
      remarks,
      photos,
      overallResult: notOkCount > 0 ? 'Defective' : 'Pass',
      counts: {
        totalItems: totalItemsCount,
        okCount,
        notOkCount,
        naCount
      },
      completedAt: isoTimestamp,
      inspectedAt: isoTimestamp,
      inspectionDate: formattedDate,
      inspectionTime: formattedTime,
      timestamp: fullTimestamp,
      technicianName: inspectingTechName.trim(),
      technicianBadge: inspectingTechBadge,
      technicianRole: user.roleTitle || 'Lead Service Engineer'
    });

    if (result.success) {
      setCapturedTimestamp(fullTimestamp);
      setSaveSuccessNotice(`Checklist recorded successfully. Inspected by ${inspectingTechName.trim()} on ${formattedDate} at ${formattedTime}.`);
      setTimeout(() => {
        onNavigate('photo-remarks');
      }, 700);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Navigation & Template Selector Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <button
          onClick={() => onNavigate('asset-details')}
          className="btn-outline"
          style={{ height: '38px', minHeight: '38px', padding: '0 12px', fontSize: '0.84rem' }}
        >
          <ChevronLeft size={16} /> Asset Details
        </button>

        {/* 26-Checklist Master Dropdown Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280' }}>
              Checklist:
            </span>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              style={{
                height: '38px',
                minHeight: '38px',
                padding: '0 12px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #0F172A',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#0F172A',
                cursor: 'pointer'
              }}
            >
              {CHECKLIST_INDEX.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} — {item.title} ({item.itemsCount} items)
                </option>
              ))}
            </select>
          </div>

          {/* Download Filled Checklist in Exact Format Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleDownloadExactExcel}
              disabled={isDownloadingExcel}
              className="btn-primary"
              style={{
                height: '38px',
                minHeight: '38px',
                padding: '0 14px',
                fontSize: '0.82rem',
                backgroundColor: '#1E3A8A',
                boxShadow: '0 1px 2px rgba(30, 58, 138, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isDownloadingExcel ? 0.7 : 1,
                cursor: isDownloadingExcel ? 'wait' : 'pointer'
              }}
              title="Download filled checklist in exact master control copy Excel (.xlsx) format without any changes"
            >
              <Download size={15} />
              <span>{isDownloadingExcel ? 'Generating .xlsx...' : 'Download Excel (.xlsx)'}</span>
            </button>

            <button
              onClick={handleDownloadExactCSV}
              className="btn-primary"
              style={{
                height: '38px',
                minHeight: '38px',
                padding: '0 14px',
                fontSize: '0.82rem',
                backgroundColor: '#064E3B',
                boxShadow: '0 1px 2px rgba(6, 78, 59, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Download filled checklist in exact control copy CSV format"
            >
              <Download size={15} />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Excel Download Notice */}
      {downloadNotice && (
        <div style={{
          padding: '14px 16px',
          borderRadius: '8px',
          backgroundColor: '#EFF6FF',
          color: '#1D4ED8',
          border: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={20} style={{ flexShrink: 0, color: '#2563EB' }} />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Validation Alert */}
      {validationError && (
        <div style={{
          padding: '14px 16px',
          borderRadius: '8px',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{validationError}</span>
        </div>
      )}

      {saveSuccessNotice && (
        <div style={{
          padding: '14px 16px',
          borderRadius: '8px',
          backgroundColor: '#ECFDF5',
          color: '#059669',
          border: '1px solid #A7F3D0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={20} />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Excel Workbook Header (Preserving Exact Document Number, Revision, SOP) */}
      <div className="saas-card" style={{ padding: '20px', borderTop: '4px solid var(--brand-crimson)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: '1px solid #E5E7EB',
          paddingBottom: '12px',
          marginBottom: '14px'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>
              {COMPANY_INFO.name}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '3px 0 0 0' }}>
              {template.title}
            </h2>
          </div>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF'
          }}>
            {template.classification}
          </span>
        </div>

        {/* Exact Document Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          fontSize: '0.82rem',
          backgroundColor: '#F9FAFB',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
        }}>
          <div>
            <span style={{ color: '#6B7280', display: 'block' }}>Checklist Doc. No.:</span>
            <strong style={{ color: '#111827' }}>{template.docNo}</strong>
          </div>
          <div>
            <span style={{ color: '#6B7280', display: 'block' }}>Reference SOP No.:</span>
            <strong style={{ color: '#111827' }}>{template.sopNo}</strong>
          </div>
          <div>
            <span style={{ color: '#6B7280', display: 'block' }}>Revision / Effective Date:</span>
            <span>Rev {template.revision} • {template.effectiveDate}</span>
          </div>
          <div>
            <span style={{ color: '#6B7280', display: 'block' }}>Job Contract Type:</span>
            <span>{template.jobDescription}</span>
          </div>
        </div>

        {/* Target Position Context */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginTop: '12px',
          padding: '10px 12px',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          fontSize: '0.82rem'
        }}>
          <div>
            <span style={{ color: '#6B7280', display: 'block' }}>Client & Site:</span>
            <strong style={{ color: '#111827' }}>{activeSite?.name || 'Aarti Industries Ltd — Unit IV'}</strong>
          </div>
          <div>
            <span style={{ color: '#6B7280', display: 'block' }}>Inspected Position:</span>
            <strong style={{ color: '#DC2626' }}>{posId}</strong>
          </div>
          <div>
            <span style={{ color: '#6B7280', display: 'block' }}>Installed Equipment Serial:</span>
            <span style={{ fontFamily: 'monospace' }}>{position?.currentEquipment?.serialNumber || position?.currentEquipment?.serialNo || 'IFS-2024-8812'}</span>
          </div>
          <div>
            <span style={{ color: '#6B7280', display: 'block' }}>Target Service Type:</span>
            <span style={{ fontWeight: 600 }}>{position?.serviceType || template.title}</span>
          </div>
        </div>

        {/* Inspection Capture & Technician Sign-off Binding Card */}
        <div style={{
          marginTop: '12px',
          padding: '12px 14px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #CBD5E1',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
              <UserCheck size={16} color="#00875A" />
              <span>Technician Name (Who Inspected) *</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={selectedTechId}
                onChange={(e) => handleSelectTechnician(e.target.value)}
                style={{
                  height: '36px',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  border: '1.5px solid ' + (inspectingTechName ? '#CBD5E1' : '#E00000'),
                  borderRadius: '6px',
                  padding: '0 8px',
                  flex: 1,
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Select Technician (2–3 on duty) --</option>
                {plantTechnicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.badge})
                  </option>
                ))}
                <option value="ADD_NEW">+ Enter Other Technician...</option>
              </select>
              <span className="badge badge-neutral" style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', height: '26px' }}>
                {inspectingTechBadge}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
              Selected: <strong>{inspectingTechName}</strong> • {inspectingTechRole}
            </span>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
              <Clock size={16} color="#2563EB" />
              <span>Inspection Date & Time Captured:</span>
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#FFFFFF',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              minHeight: '36px'
            }}>
              {capturedTimestamp ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#00875A" />
                  <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>
                    {capturedTimestamp}
                  </strong>
                  <span className="badge badge-ok" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                    Timestamp Locked
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00875A', display: 'inline-block' }} />
                  <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>
                    {currentLiveTime || 'Live Clock Active'}
                  </strong>
                  <span className="badge badge-navy" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                    Auto-Captured on Submit
                  </span>
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
              Stamps exact submission timestamp onto AMC dossier & Excel sheet
            </span>
          </div>
        </div>

        {/* Standard Note from Workbook */}
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#FFFBEB',
          borderRadius: '6px',
          fontSize: '0.78rem',
          color: '#92400E',
          lineHeight: 1.4,
          border: '1px solid #FDE68A'
        }}>
          {template.standardNote}
        </div>
      </div>

      {/* Live Calculation Metric Bar */}
      <div className="saas-card" style={{ padding: '16px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
          <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#F3F4F6' }}>
            <span style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase', display: 'block' }}>
              Checked (Nos.)
            </span>
            <strong style={{ fontSize: '1.25rem', color: '#111827' }}>
              {completedCount} / {totalItemsCount}
            </strong>
          </div>

          <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <span style={{ fontSize: '0.72rem', color: '#059669', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              Total √ (OK)
            </span>
            <strong style={{ fontSize: '1.25rem', color: '#059669' }}>
              {okCount}
            </strong>
          </div>

          <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <span style={{ fontSize: '0.72rem', color: '#DC2626', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              Total X (Not OK)
            </span>
            <strong style={{ fontSize: '1.25rem', color: '#DC2626' }}>
              {notOkCount}
            </strong>
          </div>

          <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <span style={{ fontSize: '0.72rem', color: '#D97706', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              Total NA
            </span>
            <strong style={{ fontSize: '1.25rem', color: '#D97706' }}>
              {naCount}
            </strong>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-container" style={{ marginTop: '12px' }}>
          <div
            className="progress-fill"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: progressPercent === 100 ? '#059669' : '#DC2626'
            }}
          />
        </div>
      </div>

      {/* Checklist Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {template.items.map((item) => {
          const resp = responses[item.itemNo] || { status: null, reason: '', photo: null };
          const isItemDefective = resp.status === 'NOT_OK';
          const isDefectDrawerOpen = activeDefectItemNo === item.itemNo;

          return (
            <div
              key={item.itemNo}
              className="saas-card"
              style={{
                padding: '16px',
                border: isItemDefective
                  ? '1.5px solid #DC2626'
                  : resp.status === 'OK'
                  ? '1px solid #A7F3D0'
                  : '1px solid #E5E7EB',
                backgroundColor: isItemDefective
                  ? '#FEF2F2'
                  : resp.status === 'OK'
                  ? '#FAFCFA'
                  : '#FFFFFF'
              }}
            >
              {/* Item Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    {item.itemNo}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111827', lineHeight: 1.35, margin: 0 }}>
                      {item.text}
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#F3F4F6',
                        color: '#4B5563',
                        border: '1px solid #E5E7EB'
                      }}>
                        Applicability: {item.applicability}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Way Choice Buttons (OK, NOT OK, NA) — Touch Target >= 48px */}
              <div className="choice-btn-group">
                <button
                  type="button"
                  onClick={() => handleSetStatus(item.itemNo, 'OK')}
                  className={`choice-btn ${resp.status === 'OK' ? 'active-ok' : ''}`}
                >
                  <Check size={18} strokeWidth={2.5} />
                  <span>√ OK / Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus(item.itemNo, 'NOT_OK')}
                  className={`choice-btn ${resp.status === 'NOT_OK' ? 'active-fail' : ''}`}
                >
                  <X size={18} strokeWidth={2.5} />
                  <span>X Not OK</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus(item.itemNo, 'NA')}
                  className={`choice-btn ${resp.status === 'NA' ? 'active-na' : ''}`}
                >
                  <Minus size={18} strokeWidth={2.5} />
                  <span>NA</span>
                </button>
              </div>

              {/* In-Line Defect Details (Mandatory Reason & Photo) */}
              {(isItemDefective || isDefectDrawerOpen) && (
                <div style={{
                  marginTop: '12px',
                  padding: '14px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #FECACA',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontWeight: 700, fontSize: '0.84rem' }}>
                    <AlertCircle size={16} />
                    <span>Item {item.itemNo} Failed: Mandatory Defect Reason & Photo Evidence Required</span>
                  </div>

                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter specific defect description (e.g. pressure gauge cracked, seal broken)..."
                    value={resp.reason || ''}
                    onChange={(e) => handleUpdateDefectReason(item.itemNo, e.target.value)}
                  />

                  {/* Photo upload for defect */}
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                      Defect Photographic Evidence:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {resp.photo ? (
                        <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                          <img src={resp.photo} alt="Defect" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => handleUpdateDefectPhoto(item.itemNo, null)}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              backgroundColor: 'rgba(220, 38, 38, 0.9)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1.5px dashed #DC2626',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: 600
                        }}>
                          <Camera size={16} />
                          <span>Snap Photo Evidence</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => handleUpdateDefectPhoto(item.itemNo, ev.target.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Remarks / Observations Textarea */}
      <div className="saas-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
          Remarks / Observations (Including corrective actions, spares replaced & pending points)
        </h3>
        <textarea
          className="textarea-field"
          placeholder="Record any general observations, minor adjustments, seal wire replaced or hydro test lab notes..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
        />

        {/* General Position Photos */}
        <div style={{ marginTop: '14px' }}>
          <PhotoCapture
            label="General Position & Equipment Evidence Photos"
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={4}
          />
        </div>
      </div>

      {/* Technical Specifications & Performance Baseline (from Section 3 of SOP) */}
      <div className="saas-card" style={{ padding: '16px', backgroundColor: '#F9FAFB' }}>
        <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>
          Applicable Standards & Performance Baseline — {template.sopNo}, Section 3:
        </h4>
        <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '4px', margin: 0 }}>
          {template.technicalBaseline.map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>
      </div>

      {/* Inspecting Technician Selection & Audit Stamping (Select Name After Filling Form) */}
      <div className="saas-card" style={{
        padding: '20px',
        backgroundColor: '#FFFFFF',
        border: '2px solid #2563EB',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(37, 99, 235, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB'
          }}>
            <UserCheck size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Inspecting Technician Sign-Off (Select Who Inspected This Unit) *
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '2px 0 0 0' }}>
              In this plant 2–3 technicians are on duty. Please select your name after filling the form to bind your inspection record:
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'flex-start' }}>
          {/* Technician Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Select Technician Name: *
            </label>
            <select
              value={selectedTechId}
              onChange={(e) => handleSelectTechnician(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: '6px',
                border: '1.5px solid ' + (inspectingTechName ? '#2563EB' : '#E00000'),
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#111827',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Choose Your Name (Technician Who Inspected) --</option>
              {plantTechnicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.badge} — {t.roleTitle})
                </option>
              ))}
              <option value="ADD_NEW">+ Add / Enter Other Technician Name...</option>
            </select>

            {isAddingCustomTech && (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Add Technician to Plant Roster:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={customTechName}
                    onChange={(e) => setCustomTechName(e.target.value)}
                    placeholder="Technician full name..."
                    style={{ flex: 1, minWidth: '160px', height: '36px', fontSize: '0.86rem' }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    value={customTechBadge}
                    onChange={(e) => setCustomTechBadge(e.target.value)}
                    placeholder="Badge ID (e.g. IFS-SE-043)"
                    style={{ width: '130px', height: '36px', fontSize: '0.86rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewTechnician}
                    className="btn-primary"
                    style={{ height: '36px', padding: '0 14px', fontSize: '0.82rem' }}
                  >
                    Save & Select
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomTech(false)}
                    className="btn-outline"
                    style={{ height: '36px', padding: '0 10px', fontSize: '0.82rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Time & Date Stamping Confirmation */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#F8FAFC',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Clock size={16} color="#2563EB" />
              <strong style={{ color: '#0F172A' }}>Inspection Date & Time:</strong>
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
              {capturedTimestamp || currentLiveTime || 'Capturing live...'}
            </div>
            <div style={{ fontSize: '0.74rem' }}>
              {inspectingTechName ? (
                <span style={{ color: '#00875A', fontWeight: 600 }}>
                  ✓ Stamping: <strong>{inspectingTechName}</strong> ({inspectingTechBadge} • {inspectingTechRole})
                </span>
              ) : (
                <span style={{ color: '#E00000', fontWeight: 600 }}>
                  * Required: Please select your name before submitting
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <button
          onClick={handleDownloadExactCSV}
          className="btn-outline"
          style={{ height: '46px', fontSize: '0.92rem', padding: '0 18px', borderColor: '#064E3B', color: '#064E3B' }}
        >
          <Download size={16} />
          <span>Download Filled Checklist ({template.id} CSV)</span>
        </button>

        <button
          onClick={handleSaveAndProceed}
          className="btn-primary"
          style={{ flex: 1, height: '46px', fontSize: '0.95rem', justifyContent: 'center' }}
        >
          <span>Submit Inspection & Stamp Audit Date/Time</span>
          <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
}
