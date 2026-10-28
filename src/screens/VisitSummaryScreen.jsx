import React, { useState } from 'react';
import { 
  getActiveVisit, 
  saveVisitSignatures, 
  getPositions, 
  getCurrentUser, 
  getPlantTechnicians,
  getPendingAssetsForSite,
  validateSiteInspectionCompletion,
  completeSiteInspection,
  VALID_PENDING_REASONS
} from '../data/storage';
import { CHECKLIST_TEMPLATES, COMPANY_INFO } from '../data/checklistTemplates';
import { 
  downloadChecklistCSV, 
  downloadChecklistExcel, 
  downloadMasterWorkbookExcel 
} from '../utils/checklistExporter';
import {
  downloadPendingAssetsCSV,
  downloadPendingAssetsExcel
} from '../utils/pendingAssetExporter';
import SignaturePad from '../components/SignaturePad';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Printer, 
  ArrowRight, 
  UserCheck, 
  ChevronLeft, 
  Building, 
  Download, 
  FileSpreadsheet,
  AlertTriangle,
  X,
  FileText,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

export default function VisitSummaryScreen({ activeSite, onNavigate }) {
  const user = getCurrentUser();
  const visit = getActiveVisit(activeSite?.id || "SITE-AIL-001");
  const sitePositions = getPositions(visit.siteId);
  const pendingAssets = getPendingAssetsForSite(visit.siteId, visit.visitId);

  const plantTechnicians = getPlantTechnicians();
  const [techSig, setTechSig] = useState(visit.technicianSignature);
  const [techName, setTechName] = useState(visit.technicianName || visit.serviceEngineer || plantTechnicians[0]?.name || 'Ramesh Patel');

  const [clientSig, setClientSig] = useState(visit.clientSignature);
  const [clientName, setClientName] = useState(visit.clientRepresentative || 'Vikram Shah');

  const [validationError, setValidationError] = useState('');
  const [completeSuccess, setCompleteSuccess] = useState(
    visit.status === 'Completed' || visit.status === 'Completed with Exceptions' || visit.status === 'Signed & Completed'
  );
  const [currentStatus, setCurrentStatus] = useState(visit.status || 'In Progress');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

  // Mandatory Justification Dialog State
  const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);
  const [justifications, setJustifications] = useState(() => ({ ...(visit.pendingJustifications || {}) }));
  const [justificationModalError, setJustificationModalError] = useState('');

  // Calculate actual totals from answered positions
  const answeredPositions = Object.keys(visit.checklistAnswers || {});
  const totalPositionsCount = sitePositions.length;
  const inspectedCount = answeredPositions.length;

  let totalOk = 0;
  let totalNotOk = 0;
  let totalNa = 0;

  answeredPositions.forEach((posId) => {
    const ans = visit.checklistAnswers[posId];
    if (ans && ans.items) {
      Object.values(ans.items).forEach((item) => {
        if (item.status === 'OK') totalOk++;
        else if (item.status === 'NOT_OK') totalNotOk++;
        else if (item.status === 'NA') totalNa++;
      });
    }
  });

  // Primary template used in this visit (e.g. CL-11 or CL-03)
  const primaryTemplateId = answeredPositions.length > 0 
    ? (visit.checklistAnswers[answeredPositions[0]]?.templateId || 'CL-11')
    : 'CL-11';

  const buildRecords = (targetTemplateId) => {
    const list = [];
    answeredPositions.forEach((posId) => {
      const pos = sitePositions.find(p => (p.positionId || p.id) === posId) || {};
      const ans = visit.checklistAnswers[posId];
      if (ans && (!targetTemplateId || ans.templateId === targetTemplateId || answeredPositions.length === 1)) {
        list.push({
          sn: list.length + 1,
          area: pos.area || pos.locationDescription || 'Plant Area',
          idNo: pos.positionId || posId,
          location: pos.location || 'Site Location',
          answers: ans.items || {},
          remarks: ans.remarks || ''
        });
      }
    });
    return list;
  };

  const handleDownloadExcel = async () => {
    setIsExporting(true);
    setValidationError('');
    try {
      const records = buildRecords(primaryTemplateId);
      await downloadChecklistExcel(primaryTemplateId, {
        clientName: activeSite?.clientName || activeSite?.name || 'Aarti Industries Limited',
        siteAddress: activeSite?.address || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110',
        poNumber: activeSite?.poNumber || 'PO/AIL/AMC/2026/8812',
        workOrderRef: activeSite?.workOrderRef || 'WO-IFSPL-2026-OCT-094',
        dateOfService: new Date().toISOString().substring(0, 10).split('-').reverse().join('-'),
        inspectionTime: visit.signedTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        frequency: activeSite?.frequency || 'Quarterly',
        monthPeriod: 'October – 2026',
        engineerName: techName.trim() || user.name || 'Ramesh Patel',
        supervisorName: 'Sanjay Sharma',
        clientWitnessName: clientName || 'Vikram Shah',
        techSig: Boolean(techSig),
        clientSig: Boolean(clientSig),
        visitRemarks: visit.visitRemarks || 'All statutory AMC checks carried out satisfactorily.',
        sparesReplaced: visit.sparesReplaced,
        pendingPoints: visit.pendingPoints,
        records
      });
      setExportNotice('Excel (.xlsx) report downloaded in exact master control copy format without changes.');
      setTimeout(() => setExportNotice(''), 5000);
    } catch (err) {
      console.error(err);
      setValidationError('Failed to generate Excel: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCSV = () => {
    const records = buildRecords(primaryTemplateId);
    downloadChecklistCSV(primaryTemplateId, {
      clientName: activeSite?.clientName || activeSite?.name || 'Aarti Industries Limited',
      siteAddress: activeSite?.address || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110',
      poNumber: activeSite?.poNumber || 'PO/AIL/AMC/2026/8812',
      workOrderRef: activeSite?.workOrderRef || 'WO-IFSPL-2026-OCT-094',
      dateOfService: new Date().toISOString().substring(0, 10).split('-').reverse().join('-'),
      inspectionTime: visit.signedTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      frequency: activeSite?.frequency || 'Quarterly',
      monthPeriod: 'October – 2026',
      engineerName: techName.trim() || user.name || 'Ramesh Patel',
      supervisorName: 'Sanjay Sharma',
      clientWitnessName: clientName || 'Vikram Shah',
      techSig: Boolean(techSig),
      clientSig: Boolean(clientSig),
      visitRemarks: visit.visitRemarks || 'All statutory AMC checks carried out satisfactorily.',
      records
    });
  };

  const handleDownloadMaster = async () => {
    setIsExporting(true);
    try {
      await downloadMasterWorkbookExcel({
        clientName: activeSite?.clientName || activeSite?.name || 'Aarti Industries Limited',
        siteAddress: activeSite?.address || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110',
        poNumber: activeSite?.poNumber || 'PO/AIL/AMC/2026/8812',
        workOrderRef: activeSite?.workOrderRef || 'WO-IFSPL-2026-OCT-094',
        dateOfService: new Date().toISOString().substring(0, 10).split('-').reverse().join('-'),
        inspectionTime: visit.signedTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        frequency: activeSite?.frequency || 'Quarterly',
        monthPeriod: 'October – 2026',
        engineerName: techName.trim() || user.name || 'Ramesh Patel',
        supervisorName: 'Sanjay Sharma',
        clientWitnessName: clientName || 'Vikram Shah'
      });
      setExportNotice('Full Master Control Copy (.xlsx with all 26 checklists) downloaded.');
      setTimeout(() => setExportNotice(''), 5000);
    } catch (err) {
      console.error(err);
      setValidationError('Failed to generate Master Excel: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPendingExcel = async () => {
    try {
      await downloadPendingAssetsExcel({ site: activeSite, visit, pendingAssets });
    } catch (err) {
      console.error(err);
      setValidationError('Failed to generate Pending Assets Excel: ' + err.message);
    }
  };

  const handleDownloadPendingCSV = () => {
    try {
      downloadPendingAssetsCSV({ site: activeSite, visit, pendingAssets });
    } catch (err) {
      console.error(err);
      setValidationError('Failed to generate Pending Assets CSV: ' + err.message);
    }
  };

  const handleFinalSign = () => {
    if (!techName || !techName.trim()) {
      setValidationError('Technician Name (who inspected) is required for sign-off.');
      return;
    }
    if (!techSig) {
      setValidationError('Service Engineer / Inspecting Technician signature is required to sign off the AMC inspection.');
      return;
    }
    if (!clientName || !clientName.trim()) {
      setValidationError('Client Representative Name is required for sign-off.');
      return;
    }
    if (!clientSig) {
      setValidationError('Client In-Charge (Witnessed by) signature is required for official handover.');
      return;
    }

    // Work Completion Validation:
    // If pending assets exist, check if all pending assets have justifications
    if (pendingAssets.length > 0) {
      const validation = validateSiteInspectionCompletion(visit.visitId);
      if (!validation.canComplete) {
        // Open mandatory justification modal
        setIsJustificationModalOpen(true);
        setJustificationModalError(`${pendingAssets.length} assets have not been inspected. Please provide a reason for each pending asset before completing the site inspection.`);
        return;
      }
    }

    // Complete inspection
    const res = completeSiteInspection(visit.visitId, {
      justifications,
      technicianSignature: techSig,
      clientSignature: clientSig,
      clientRepName: clientName.trim(),
      technicianName: techName.trim(),
      technicianBadge: user.badge || 'IFS-SE-041'
    });

    if (res.success) {
      setValidationError('');
      setCompleteSuccess(true);
      setCurrentStatus(res.status);
    } else {
      setValidationError(res.error || 'Completion blocked by validation rules.');
    }
  };

  const handleConfirmJustificationsAndComplete = () => {
    setJustificationModalError('');

    // Check each pending asset
    for (const pos of pendingAssets) {
      const just = justifications[pos.positionId];
      if (!just || !just.reason || !just.reason.trim()) {
        setJustificationModalError(`Please select an inspection exception reason for asset #${pos.srNo} (${pos.positionId} - ${pos.equipmentType}).`);
        return;
      }
      if (just.reason === 'Other' && (!just.explanation || just.explanation.trim().length < 5)) {
        setJustificationModalError(`Please provide a detailed explanation (min 5 characters) for asset #${pos.srNo} (${pos.positionId}) since "Other" was selected.`);
        return;
      }
    }

    // Execute backend-level completion validation
    const res = completeSiteInspection(visit.visitId, {
      justifications,
      technicianSignature: techSig,
      clientSignature: clientSig,
      clientRepName: clientName ? clientName.trim() : null,
      technicianName: techName ? techName.trim() : null,
      technicianBadge: user.badge || 'IFS-SE-041'
    });

    if (!res.success) {
      setJustificationModalError(res.error);
      return;
    }

    setIsJustificationModalOpen(false);
    setValidationError('');
    setCompleteSuccess(true);
    setCurrentStatus(res.status);
  };

  return (
    <div className="app-container" style={{ maxWidth: '880px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <button
          onClick={() => onNavigate('photo-remarks')}
          className="btn-outline"
          style={{ height: '40px', minHeight: '40px', padding: '0 12px', fontSize: '0.85rem' }}
        >
          <ChevronLeft size={16} /> Back to Photos
        </button>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadExcel}
            disabled={isExporting}
            className="btn-primary"
            style={{
              height: '40px',
              minHeight: '40px',
              padding: '0 14px',
              fontSize: '0.84rem',
              backgroundColor: '#1E3A8A',
              boxShadow: '0 1px 2px rgba(30, 58, 138, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isExporting ? 0.7 : 1
            }}
            title="Download filled checklist in exact master control copy Excel (.xlsx) format without changes"
          >
            <Download size={15} />
            <span>{isExporting ? 'Generating...' : 'Download Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="btn-primary"
            style={{
              height: '40px',
              minHeight: '40px',
              padding: '0 12px',
              fontSize: '0.84rem',
              backgroundColor: '#064E3B',
              boxShadow: '0 1px 2px rgba(6, 78, 59, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Download filled checklist in exact CSV format"
          >
            <Download size={15} />
            <span>CSV</span>
          </button>

          <button
            onClick={handleDownloadMaster}
            disabled={isExporting}
            className="btn-outline"
            style={{
              height: '40px',
              minHeight: '40px',
              padding: '0 12px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Download full master workbook with all 26 checklists"
          >
            <FileSpreadsheet size={15} />
            <span>All 26 Checklists (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-outline"
            style={{ height: '40px', minHeight: '40px', padding: '0 12px', fontSize: '0.84rem' }}
          >
            <Printer size={15} /> Print / PDF
          </button>
          
          <button
            onClick={() => onNavigate('manager-dashboard')}
            className="btn-secondary"
            style={{ height: '40px', minHeight: '40px', padding: '0 14px', fontSize: '0.84rem' }}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Export Notice */}
      {exportNotice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#EFF6FF',
          color: '#1D4ED8',
          border: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} style={{ color: '#2563EB', flexShrink: 0 }} />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Pending Asset Inspection Notification (Requirement 3) */}
      {pendingAssets.length > 0 && !completeSuccess && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#FFFBEB',
          border: '1.5px solid #FCD34D',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
              flexShrink: 0
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#92400E' }}>
                {pendingAssets.length} assets are still pending inspection.
              </div>
              <div style={{ fontSize: '0.82rem', color: '#B45309', marginTop: '2px' }}>
                Total: {totalPositionsCount} · Inspected: {inspectedCount} · Progress: {totalPositionsCount > 0 ? Math.round((inspectedCount/totalPositionsCount)*100) : 0}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadPendingExcel}
              className="btn-outline"
              style={{
                height: '38px',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderColor: '#F59E0B',
                color: '#B45309',
                backgroundColor: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Download list of remaining uninspected assets in Excel (.xlsx)"
            >
              <Download size={14} /> Download Pending Asset List (.xlsx)
            </button>
            <button
              onClick={handleDownloadPendingCSV}
              className="btn-outline"
              style={{
                height: '38px',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderColor: '#F59E0B',
                color: '#B45309',
                backgroundColor: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Download pending asset list in CSV"
            >
              <Download size={14} /> CSV
            </button>
          </div>
        </div>
      )}

      {/* Inspection Summary Block (Requirement 6) */}
      <div className="card" style={{
        padding: '18px 20px',
        backgroundColor: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: currentStatus.includes('Completed') ? '#10B981' : '#3B82F6'
              }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                Site Inspection Summary & Verification
              </h3>
            </div>
            <p style={{ margin: '3px 0 0 16px', fontSize: '0.78rem', color: '#64748B' }}>
              Database-backed session metrics · Work Order {visit.workOrderRef || activeSite?.poNumber || '—'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '100px',
              fontSize: '0.8rem',
              fontWeight: 700,
              backgroundColor: currentStatus === 'Completed' || currentStatus === 'Signed & Completed'
                ? '#ECFDF5'
                : currentStatus === 'Completed with Exceptions'
                  ? '#FEF3C7'
                  : '#EFF6FF',
              color: currentStatus === 'Completed' || currentStatus === 'Signed & Completed'
                ? '#059669'
                : currentStatus === 'Completed with Exceptions'
                  ? '#D97706'
                  : '#2563EB',
              border: `1px solid ${currentStatus === 'Completed' || currentStatus === 'Signed & Completed' ? '#A7F3D0' : currentStatus === 'Completed with Exceptions' ? '#FCD34D' : '#BFDBFE'}`
            }}>
              {currentStatus}
            </span>
          </div>
        </div>

        {/* 4-Item Metric Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '14px'
        }}>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Total Assets</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{totalPositionsCount}</div>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, textTransform: 'uppercase' }}>Inspected</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>{inspectedCount}</div>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: pendingAssets.length > 0 ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${pendingAssets.length > 0 ? '#FECACA' : '#E2E8F0'}`, textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: pendingAssets.length > 0 ? '#DC2626' : '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Pending</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: pendingAssets.length > 0 ? '#DC2626' : '#0F172A', marginTop: '2px' }}>{pendingAssets.length}</div>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600, textTransform: 'uppercase' }}>Progress</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1D4ED8', marginTop: '2px' }}>
              {totalPositionsCount > 0 ? Math.round((inspectedCount / totalPositionsCount) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Audit Meta Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          fontSize: '0.8rem',
          backgroundColor: '#F8FAFC',
          padding: '12px 14px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0'
        }}>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Customer / Plant:</span>
            <strong style={{ color: '#0F172A' }}>{activeSite?.clientName || activeSite?.name || visit.siteName}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Technician:</span>
            <strong style={{ color: '#0F172A' }}>{techName}</strong> ({user.badge || 'IFS-SE-041'})
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Inspection Start:</span>
            <strong style={{ color: '#0F172A' }}>
              {visit.startDate || visit.date} {visit.startTime ? `at ${visit.startTime}` : ''}
            </strong>
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Inspection Completion:</span>
            <strong style={{ color: visit.completedAt ? '#059669' : '#D97706' }}>
              {visit.completedDate ? `${visit.completedDate} at ${visit.completedTime}` : 'In Progress (Pending Finalisation)'}
            </strong>
          </div>
        </div>

        {/* Pending Justifications List (if completed with exceptions) */}
        {visit.pendingJustifications && Object.keys(visit.pendingJustifications).length > 0 && (
          <div style={{ marginTop: '14px', borderTop: '1px dashed #CBD5E1', paddingTop: '12px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} />
              <span>Pending Asset Justifications on Record ({Object.keys(visit.pendingJustifications).length}):</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(visit.pendingJustifications).map(([pId, jInfo]) => {
                const pos = sitePositions.find(p => p.positionId === pId);
                return (
                  <div key={pId} style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    fontSize: '0.78rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    <div>
                      <strong style={{ color: '#92400E', fontFamily: 'monospace' }}>{pId}</strong>
                      <span style={{ color: '#78350F', marginLeft: '6px' }}>
                        ({pos?.equipmentType || 'Asset'}) · <strong>{jInfo.reason}</strong>
                      </span>
                      {jInfo.explanation && (
                        <div style={{ color: '#92400E', fontSize: '0.74rem', marginTop: '2px' }}>
                          Reason details: {jInfo.explanation}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#B45309' }}>
                      Justified by {jInfo.justifiedBy || 'Technician'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {completeSuccess && (
        <div style={{
          padding: '18px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: currentStatus === 'Completed with Exceptions' ? '#FFFBEB' : '#F0FDF4',
          color: currentStatus === 'Completed with Exceptions' ? '#92400E' : '#166534',
          border: `1.5px solid ${currentStatus === 'Completed with Exceptions' ? '#FCD34D' : '#22C55E'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={24} style={{ color: currentStatus === 'Completed with Exceptions' ? '#D97706' : '#16A34A', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                {currentStatus === 'Completed with Exceptions'
                  ? 'AMC Inspection Officially Finalised (Completed with Exceptions)'
                  : 'AMC Inspection Visit Officially Finalised & Certified!'}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 500, color: currentStatus === 'Completed with Exceptions' ? '#B45309' : '#15803D', marginTop: '2px' }}>
                {currentStatus === 'Completed with Exceptions'
                  ? 'All pending equipment positions individually justified and authenticated in audit records.'
                  : '100% of scheduled equipment positions inspected and authenticated.'}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px',
            backgroundColor: '#FFFFFF',
            padding: '12px 14px',
            borderRadius: '6px',
            border: `1px solid ${currentStatus === 'Completed with Exceptions' ? '#FDE68A' : '#DCFCE7'}`,
            fontSize: '0.82rem'
          }}>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Inspected & Certified by (Service Engineer):</span>
              <strong style={{ color: '#0F172A', fontSize: '0.88rem' }}>{techName}</strong>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>IFS Badge: {user.badge || 'IFS-SE-041'}</span>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Official Sign-Off Timestamp:</span>
              <strong style={{ color: '#0F172A', fontSize: '0.88rem' }}>
                {visit.signedDate || visit.completedDate || new Date().toISOString().substring(0, 10)} {visit.signedTime || visit.completedTime ? `at ${visit.signedTime || visit.completedTime}` : ''}
              </strong>
              <span style={{ color: '#16A34A', display: 'block', fontSize: '0.72rem' }}>✓ System Clock Captured & Verified</span>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Witnessed on behalf of Client:</span>
              <strong style={{ color: '#0F172A', fontSize: '0.88rem' }}>{clientName}</strong>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>{activeSite?.name || 'Aarti Industries Ltd'}</span>
            </div>
          </div>
        </div>
      )}

      {validationError && (
        <div style={{
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--status-fail-bg)',
          color: 'var(--status-fail)',
          border: '1px solid var(--status-fail-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <AlertCircle size={20} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Official IFS Header Box */}
      <div className="card" style={{ padding: '24px', borderTop: '4px solid var(--brand-navy)' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            {COMPANY_INFO.name}
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {COMPANY_INFO.address} • {COMPANY_INFO.phones} • Email: {COMPANY_INFO.email}
          </p>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'var(--bg-subtle)',
            padding: '4px 16px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 800,
            fontSize: '0.85rem',
            color: 'var(--brand-crimson)',
            marginTop: '8px'
          }}>
            AMC INSPECTION & MAINTENANCE VISIT SUMMARY
          </div>
        </div>

        {/* Visit Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          fontSize: '0.82rem',
          backgroundColor: 'var(--bg-subtle)',
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Visit Reference ID:</span>
            <strong style={{ color: 'var(--brand-navy)' }}>{visit.visitId}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Site / Client Plant:</span>
            <strong>{activeSite?.name || 'Aarti Industries Ltd — Unit IV'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>PO / Contract Number:</span>
            <span>{activeSite?.poNumber || 'PO/AIL/AMC/2026/8812'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Inspection Date:</span>
            <strong>{visit.date || new Date().toISOString().substring(0, 10)}</strong>
          </div>
        </div>

        {/* Audit Metrics Totals (Calculated from Actual Records) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Positions Inspected</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--brand-navy)' }}>
              {inspectedCount} / {totalPositionsCount}
            </strong>
          </div>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-ok-bg)', border: '1px solid var(--status-ok-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--status-ok)', fontWeight: 700, display: 'block' }}>Total OK (√)</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--status-ok)' }}>{totalOk}</strong>
          </div>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-fail-bg)', border: '1px solid var(--status-fail-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--status-fail)', fontWeight: 700, display: 'block' }}>Total Not OK (X)</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--status-fail)' }}>{totalNotOk}</strong>
          </div>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-na-bg)', border: '1px solid var(--status-na-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--status-na)', fontWeight: 700, display: 'block' }}>Total NA</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--status-na)' }}>{totalNa}</strong>
          </div>
        </div>

        {/* Inspected Positions Table */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '8px' }}>
            Equipment Position Breakdown & Inspection Sign-Off:
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '8px 10px' }}>Position ID</th>
                  <th style={{ padding: '8px 10px' }}>Permanent QR</th>
                  <th style={{ padding: '8px 10px' }}>Checklist</th>
                  <th style={{ padding: '8px 10px' }}>Installed Equipment</th>
                  <th style={{ padding: '8px 10px' }}>Inspected By</th>
                  <th style={{ padding: '8px 10px' }}>Inspection Time & Date</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sitePositions.map((pos) => {
                  const ans = visit.checklistAnswers ? visit.checklistAnswers[pos.positionId] : null;
                  const isChecked = Boolean(ans);
                  const hasNotOk = ans && Object.values(ans.items || {}).some(i => i.status === 'NOT_OK');
                  const posTechName = ans?.technicianName || techName || user.name || 'Ramesh Patel';
                  const posTime = ans?.timestamp || ans?.savedAt?.substring(0, 16) || visit.date;

                  return (
                    <tr key={pos.positionId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>{pos.positionId}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{pos.qrCode}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {pos.templateId}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {pos.currentEquipment?.serialNo} ({pos.currentEquipment?.capacity || pos.currentEquipment?.boxType || pos.equipmentType})
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: '0.78rem' }}>
                        {isChecked ? (
                          <div>
                            <strong style={{ color: 'var(--brand-navy)' }}>{posTechName}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ans?.technicianBadge || user.badge || 'IFS-SE-041'}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: '0.78rem' }}>
                        {isChecked ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{posTime}</div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--status-ok)', fontWeight: 600 }}>✓ Captured</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {isChecked ? (
                          hasNotOk ? (
                            <span className="badge badge-fail" style={{ fontSize: '0.7rem' }}>Attention / Defect</span>
                          ) : (
                            <span className="badge badge-ok" style={{ fontSize: '0.7rem' }}>Passed OK</span>
                          )
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visit Remarks and Observations */}
        <div style={{
          backgroundColor: '#F8FAFC',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          marginBottom: '16px'
        }}>
          <div><strong>Engineer Observations:</strong> {visit.visitRemarks || 'All statutory checks conducted.'}</div>
          <div style={{ marginTop: '4px' }}><strong>Spares Replaced:</strong> {visit.sparesReplaced || 'Nil'}</div>
          <div style={{ marginTop: '4px' }}><strong>Pending Laboratory Points:</strong> {visit.pendingPoints || 'None'}</div>
        </div>

        {/* Applicable Standards & Performance Baseline Statement */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
          Certified in conformity with IFSPL/M&M/SOP/011 (Section 3 — IS 2190 35 Bar Hydraulic pressure testing) & IFSPL/M&M/SOP/003 (Section 3 — Delivery Hose Boxes).
        </div>

        {/* Dual Signatures Capture Section (Workbook Rows 56-60) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Service Engineer Signature */}
          <div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                Select Inspecting Technician for Sign-Off: *
              </label>
              <select
                value={plantTechnicians.some(t => t.name === techName) ? techName : 'CUSTOM'}
                onChange={(e) => {
                  setValidationError('');
                  if (e.target.value !== 'CUSTOM') {
                    setTechName(e.target.value);
                  }
                }}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  marginBottom: '10px',
                  cursor: 'pointer'
                }}
              >
                {plantTechnicians.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.badge} — {t.roleTitle})
                  </option>
                ))}
                <option value="CUSTOM">Type / Edit Custom Name Below...</option>
              </select>
            </div>

            <SignaturePad
              title="Checked by (Service Engineer)"
              subtitle="Technician who physically inspected equipment positions *"
              nameLabel="Technician Name (Who Inspected)"
              signerName={techName}
              onSignerNameChange={(val) => {
                setValidationError('');
                setTechName(val);
              }}
              initialSignature={techSig}
              onSave={setTechSig}
              required={true}
            />
          </div>

          {/* Client Fire In-Charge Signature */}
          <div>
            <SignaturePad
              title="Witnessed by (Client I/C Fire Services)"
              subtitle="Authorized client representative witnessing inspection *"
              nameLabel="Client Representative Name"
              signerName={clientName}
              onSignerNameChange={(val) => {
                setValidationError('');
                setClientName(val);
              }}
              initialSignature={clientSig}
              onSave={setClientSig}
              required={true}
            />
          </div>
        </div>

        {/* Authorised Signatory Footer */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            For Indus Fire Safety Private Limited — Authorised Signatory (Seal & Signature)
          </div>

          <button
            onClick={handleFinalSign}
            className="btn-primary"
            style={{ height: '48px', padding: '0 24px', fontSize: '1rem', fontWeight: 700 }}
          >
            <CheckCircle2 size={18} />
            <span>Finalise & Sign Visit</span>
          </button>
        </div>
      </div>
      {/* Mandatory Pending Asset Justification Modal (Requirements 4 & 5) */}
      {isJustificationModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              backgroundColor: '#FFFBEB'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#92400E' }}>
                    Mandatory Pending Asset Justifications
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#B45309' }}>
                    {pendingAssets.length} assets have not been inspected. Please provide a reason for each pending asset before completing the site inspection.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsJustificationModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Scrollable list of pending assets */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {justificationModalError && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{justificationModalError}</span>
                </div>
              )}

              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Each uninspected asset requires an explicit, verified justification before the site inspection can be marked as <strong>Completed with Exceptions</strong>.
              </div>

              {pendingAssets.map((pos) => {
                const currentJust = justifications[pos.positionId] || {};
                const selectedReason = currentJust.reason || '';
                const isOther = selectedReason === 'Other';

                return (
                  <div key={pos.positionId} style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {/* Asset Identification Details */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            backgroundColor: '#E2E8F0',
                            color: '#334155',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            #{pos.srNo}
                          </span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
                            {pos.equipmentType}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '3px' }}>
                          Position ID: <strong style={{ color: '#1E293B' }}>{pos.positionId}</strong> · QR: <span style={{ fontFamily: 'monospace' }}>{pos.qrCode}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '1px' }}>
                          Location: {pos.location} ({pos.area})
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '100px',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA'
                      }}>
                        Pending Inspection
                      </span>
                    </div>

                    {/* Reason Selection Dropdown */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Reason for not inspecting: *
                      </label>
                      <select
                        value={selectedReason}
                        onChange={(e) => {
                          const val = e.target.value;
                          setJustifications(prev => ({
                            ...prev,
                            [pos.positionId]: {
                              ...(prev[pos.positionId] || {}),
                              reason: val
                            }
                          }));
                        }}
                        style={{
                          width: '100%',
                          height: '36px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: selectedReason ? '1.5px solid #CBD5E1' : '1.5px solid #FCA5A5',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.84rem',
                          fontWeight: 500,
                          color: selectedReason ? '#0F172A' : '#9CA3AF'
                        }}
                      >
                        <option value="">-- Select Mandatory Reason --</option>
                        {VALID_PENDING_REASONS.map((reason) => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                    </div>

                    {/* Mandatory Detailed Explanation if "Other" is chosen */}
                    {isOther && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#B91C1C', marginBottom: '4px' }}>
                          Mandatory Detailed Explanation for "Other": *
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Provide specific technical or site reason (min 5 characters)..."
                          value={currentJust.explanation || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setJustifications(prev => ({
                              ...prev,
                              [pos.positionId]: {
                                ...(prev[pos.positionId] || {}),
                                explanation: val,
                                remarks: val
                              }
                            }));
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: (currentJust.explanation || '').trim().length >= 5 ? '1.5px solid #CBD5E1' : '1.5px solid #F87171',
                            fontSize: '0.82rem',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    )}

                    {/* Additional Remarks field (optional) */}
                    {!isOther && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', color: '#64748B', marginBottom: '3px' }}>
                          Additional Remarks (Optional):
                        </label>
                        <input
                          type="text"
                          placeholder="Add any specific observations or technician remarks..."
                          value={currentJust.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setJustifications(prev => ({
                              ...prev,
                              [pos.positionId]: {
                                ...(prev[pos.positionId] || {}),
                                remarks: val
                              }
                            }));
                          }}
                          style={{
                            width: '100%',
                            height: '34px',
                            padding: '0 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.8rem'
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <button
                onClick={handleDownloadPendingExcel}
                className="btn-outline"
                style={{ height: '36px', fontSize: '0.8rem', padding: '0 12px' }}
              >
                <Download size={14} /> Download List (.xlsx)
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIsJustificationModalOpen(false)}
                  className="btn-outline"
                  style={{ height: '36px', fontSize: '0.82rem', padding: '0 16px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmJustificationsAndComplete}
                  style={{
                    height: '36px',
                    padding: '0 18px',
                    borderRadius: '8px',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Submit & Complete with Exceptions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
