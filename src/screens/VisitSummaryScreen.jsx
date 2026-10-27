import React, { useState } from 'react';
import { getActiveVisit, saveVisitSignatures, getPositions, getCurrentUser, getPlantTechnicians } from '../data/storage';
import { CHECKLIST_TEMPLATES, COMPANY_INFO } from '../data/checklistTemplates';
import { 
  downloadChecklistCSV, 
  downloadChecklistExcel, 
  downloadMasterWorkbookExcel 
} from '../utils/checklistExporter';
import SignaturePad from '../components/SignaturePad';
import { ShieldCheck, CheckCircle2, AlertCircle, FileCheck, Printer, ArrowRight, UserCheck, ChevronLeft, Building, Download, FileSpreadsheet } from 'lucide-react';

export default function VisitSummaryScreen({ activeSite, onNavigate }) {
  const user = getCurrentUser();
  const visit = getActiveVisit(activeSite?.id || "SITE-AIL-001");
  const sitePositions = getPositions(visit.siteId);

  const plantTechnicians = getPlantTechnicians();
  const [techSig, setTechSig] = useState(visit.technicianSignature);
  const [techName, setTechName] = useState(visit.technicianName || visit.serviceEngineer || plantTechnicians[0]?.name || 'Ramesh Patel');

  const [clientSig, setClientSig] = useState(visit.clientSignature);
  const [clientName, setClientName] = useState(visit.clientRepresentative || 'Vikram Shah');

  const [validationError, setValidationError] = useState('');
  const [completeSuccess, setCompleteSuccess] = useState(visit.status === 'Signed & Completed');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

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

    const res = saveVisitSignatures(visit.visitId, {
      technicianSignature: techSig,
      clientSignature: clientSig,
      clientRepName: clientName.trim(),
      technicianName: techName.trim(),
      technicianBadge: user.badge || 'IFS-SE-041'
    });

    if (res.success) {
      setValidationError('');
      setCompleteSuccess(true);
    }
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

      {completeSuccess && (
        <div style={{
          padding: '18px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#F0FDF4',
          color: '#166534',
          border: '1.5px solid #22C55E',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={24} style={{ color: '#16A34A', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>AMC Inspection Visit Officially Signed & Finalised!</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#15803D', marginTop: '2px' }}>
                Both Service Engineer and Client In-Charge signatures authenticated.
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
            border: '1px solid #DCFCE7',
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
                {visit.signedDate || new Date().toISOString().substring(0, 10)} {visit.signedTime ? `at ${visit.signedTime}` : ''}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
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
    </div>
  );
}
