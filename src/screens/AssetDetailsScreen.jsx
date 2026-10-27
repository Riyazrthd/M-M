import React, { useState } from 'react';
import { replaceEquipmentAtPosition, updateAssetDetails, getCurrentUser } from '../data/storage';
import { CHECKLIST_TEMPLATES } from '../data/checklistTemplates';
import { getLinkedCapacities } from '../data/templateMappings';
import QRStickerCard from '../components/QRStickerCard';
import { 
  Shield, 
  QrCode, 
  ArrowLeftRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  ChevronLeft, 
  MapPin, 
  Printer, 
  Edit3 
} from 'lucide-react';

export default function AssetDetailsScreen({ position, onNavigate, onUpdatePosition }) {
  const [currentPos, setCurrentPos] = useState(position);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const user = getCurrentUser();

  // Edit fields
  const [editArea, setEditArea] = useState(currentPos.area);
  const [editLocation, setEditLocation] = useState(currentPos.location);
  const [editPoNumber, setEditPoNumber] = useState(currentPos.poNumber || '');

  // Replacement Form State
  const [replaceReason, setReplaceReason] = useState('Due for statutory 3-year hydraulic pressure testing (35 Bar / IS 2190)');
  const [removedDestination, setRemovedDestination] = useState('Dispatched to IFS Central Hydro Testing Facility Vadodara');
  const [newSerialNo, setNewSerialNo] = useState(`IFS-2024-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newCapacity, setNewCapacity] = useState(currentPos.currentEquipment?.capacity || '6 Kg');
  const [newType, setNewType] = useState(currentPos.currentEquipment?.type || 'ABC Dry Chemical Powder');
  const [replaceNotes, setReplaceNotes] = useState('Permanent position QR code retained. Cylinder swapped for off-site servicing.');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const template = CHECKLIST_TEMPLATES[currentPos.templateId] || CHECKLIST_TEMPLATES['CL-11'];

  const handlePerformReplacement = (e) => {
    e.preventDefault();
    const result = replaceEquipmentAtPosition(currentPos.positionId, {
      reason: replaceReason,
      removedDestination,
      newSerialNo,
      newCapacity,
      newType,
      notes: replaceNotes,
      technicianName: user.name
    });

    if (result.success) {
      setCurrentPos(result.position);
      if (onUpdatePosition) {
        onUpdatePosition(result.position);
      }
      setShowReplaceModal(false);
      setFeedbackMsg(`Cylinder successfully swapped to ${newSerialNo}. Permanent Position QR "${currentPos.qrCode}" preserved.`);
      setTimeout(() => setFeedbackMsg(''), 6000);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const res = updateAssetDetails(currentPos.positionId, {
      area: editArea,
      location: editLocation,
      poNumber: editPoNumber
    });

    if (res.success) {
      setCurrentPos(res.position);
      if (onUpdatePosition) {
        onUpdatePosition(res.position);
      }
      setShowEditModal(false);
      setFeedbackMsg(`Asset position details updated successfully. Permanent QR code "${currentPos.qrCode}" remains unchanged.`);
      setTimeout(() => setFeedbackMsg(''), 6000);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Navigation & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <button
          onClick={() => onNavigate('qr-scanner')}
          className="btn-outline"
          style={{ height: '40px', minHeight: '40px', padding: '0 12px', fontSize: '0.85rem' }}
        >
          <ChevronLeft size={16} /> Back to Scanner
        </button>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowStickerModal(true)}
            className="btn-outline"
            style={{ height: '40px', minHeight: '40px', fontSize: '0.85rem' }}
            title="View or print the QR sticker for this permanent position"
          >
            <Printer size={16} />
            <span>Print QR Sticker</span>
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className="btn-outline"
            style={{ height: '40px', minHeight: '40px', fontSize: '0.85rem' }}
            title="Edit mounting area or location (QR remains immutable)"
          >
            <Edit3 size={16} />
            <span>Edit Details</span>
          </button>

          <button
            onClick={() => setShowReplaceModal(true)}
            className="btn-outline"
            style={{ height: '40px', minHeight: '40px', fontSize: '0.85rem', color: 'var(--brand-crimson)', borderColor: 'var(--brand-crimson)' }}
          >
            <ArrowLeftRight size={16} />
            <span>Replace / Swap Unit</span>
          </button>

          <button
            onClick={() => onNavigate('digital-checklist')}
            className="btn-primary"
            style={{ height: '40px', minHeight: '40px', fontSize: '0.88rem', padding: '0 16px' }}
          >
            <span>Open Checklist ({template.id})</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--status-ok-bg)',
          color: 'var(--status-ok)',
          border: '1px solid var(--status-ok-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Permanent Position Header Card */}
      <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--brand-crimson)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-navy">Permanent Equipment Position</span>
              <span className="badge badge-neutral">{currentPos.templateId}</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              Position: {currentPos.positionId}
            </h2>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-subtle)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)'
          }}>
            <QrCode size={24} color="var(--brand-crimson)" />
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                Permanent Position QR Code
              </span>
              <strong style={{ fontSize: '0.95rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                {currentPos.qrCode}
              </strong>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          backgroundColor: '#F8FAFC',
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.88rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Plant / Section Area:</span>
            <strong>{currentPos.area}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Mounting Point / Pillar:</span>
            <span>{currentPos.location}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Assigned Inspection SOP:</span>
            <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{template.sopNo}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>PO / Contract:</span>
            <span>{currentPos.poNumber || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Currently Mounted Equipment Details */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="var(--brand-crimson)" />
            Currently Installed Equipment Unit
          </h3>
          <span className="badge badge-ok">
            {currentPos.currentEquipment?.operationalStatus || currentPos.currentEquipment?.status || 'Active in Position'}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          fontSize: '0.88rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Unit Serial Number:</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--brand-navy)' }}>
              {currentPos.currentEquipment?.serialNo || currentPos.currentEquipment?.serialNumber}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Equipment Type:</span>
            <strong>{currentPos.currentEquipment?.type || currentPos.equipmentType}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Capacity / Rating:</span>
            <strong>{currentPos.currentEquipment?.capacity || 'Standard'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Manufacturer / Standard:</span>
            <span>{currentPos.currentEquipment?.make || currentPos.currentEquipment?.manufacturer || 'Indus SafeGuard'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Last Hydro Test (HPT):</span>
            <strong style={{ color: 'var(--brand-crimson)' }}>
              {currentPos.currentEquipment?.lastHydroTestDate || currentPos.currentEquipment?.lastHptDate || 'N/A'}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Next Due Date:</span>
            <span>{currentPos.currentEquipment?.nextHydroTestDue || currentPos.currentEquipment?.nextHptDueDate || '2027-10-26'}</span>
          </div>
        </div>
      </div>

      {/* Equipment Replacement & Service History (Requirement 9) */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              Position Lifecycle & Cylinder Replacement History
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Separated audit logs for removed and replacement units at this permanent location.
            </p>
          </div>
          <span className="badge badge-neutral">
            {currentPos.history?.length || 0} Events Logged
          </span>
        </div>

        {(!currentPos.history || currentPos.history.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No prior unit swap events recorded for this position. Original registered unit in service.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {currentPos.history.map((hist, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--brand-navy)' }}>
                    {hist.event}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {hist.timestamp}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  <strong>Trigger / Reason:</strong> {hist.reason}
                </div>

                {/* Split removed vs replacement cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem'
                  }}>
                    <strong style={{ color: 'var(--brand-crimson)', display: 'block', marginBottom: '4px' }}>
                      [Removed Cylinder Record]
                    </strong>
                    <div>ID / Serial: <strong>{hist.removedCylinder?.serialNo}</strong></div>
                    <div>Destination: {hist.removedCylinder?.status}</div>
                    {hist.removedCylinder?.testResult && (
                      <div style={{ color: 'var(--status-ok)', fontWeight: 600, marginTop: '2px' }}>
                        Hydro Result: {hist.removedCylinder.testResult}
                      </div>
                    )}
                  </div>

                  <div style={{
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem'
                  }}>
                    <strong style={{ color: 'var(--status-ok)', display: 'block', marginBottom: '4px' }}>
                      [Replacement Cylinder Record]
                    </strong>
                    <div>ID / Serial: <strong>{hist.replacementCylinder?.serialNo}</strong></div>
                    <div>Status: {hist.replacementCylinder?.status}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Standard: IS 2190 / 35 Bar Certified
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Performed by: {hist.technician} • {hist.notes}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routine & Statutory Inspection History */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              Historical Inspection Logs
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Completed digital inspection visit records conducted at this permanent position.
            </p>
          </div>
          <span className="badge badge-neutral">
            {currentPos.inspectionHistory?.length || 0} Inspections
          </span>
        </div>

        {(!currentPos.inspectionHistory || currentPos.inspectionHistory.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No prior inspection visits logged yet. Use "Open Checklist ({template.id})" above to conduct the initial inspection.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentPos.inspectionHistory.map((insp, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--brand-navy)' }}>{insp.visitId}</strong>
                    <span className="badge badge-navy" style={{ fontSize: '0.68rem' }}>{insp.templateId}</span>
                    <span className={`badge ${insp.status?.includes('OK') ? 'badge-ok' : 'badge-fail'}`} style={{ fontSize: '0.68rem' }}>
                      {insp.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Conducted on {insp.timestamp || insp.inspectedAt} • Inspected by: <strong style={{ color: 'var(--brand-navy)' }}>{insp.technicianName || 'Ramesh Patel'}</strong> ({insp.technicianBadge || 'IFS-SE-041'}) • Unit S/N: {insp.unitSerialNo || currentPos.currentEquipment?.serialNo}
                  </div>
                  {insp.remarks && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      <em>"{insp.remarks}"</em>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Details Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 100
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Edit Asset Position Location</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-ghost" style={{ minHeight: 'auto', padding: '4px' }}>✕</button>
            </div>

            <div style={{ padding: '8px 12px', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#1E40AF', marginBottom: '14px' }}>
              <strong>Permanent Mapping Rule:</strong> Position QR Code <code>{currentPos.qrCode}</code> will remain strictly identical.
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '3px' }}>Building / Area:</label>
                <input type="text" className="input-field" value={editArea} onChange={(e) => setEditArea(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '3px' }}>Mounting Point / Location:</label>
                <input type="text" className="input-field" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '3px' }}>PO / Contract Number:</label>
                <input type="text" className="input-field" value={editPoNumber} onChange={(e) => setEditPoNumber(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-outline" style={{ flex: 1, height: '44px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, height: '44px' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Sticker Modal */}
      {showStickerModal && (
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
          padding: '16px',
          zIndex: 100
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Print Asset QR Sticker</h3>
              <button type="button" onClick={() => setShowStickerModal(false)} className="btn-ghost" style={{ minHeight: 'auto', padding: '4px' }}>✕</button>
            </div>

            <QRStickerCard
              position={currentPos}
              onNavigate={onNavigate}
              onRegisterAnother={() => {
                setShowStickerModal(false);
                onNavigate('asset-register');
              }}
            />
          </div>
        </div>
      )}

      {/* Replacement Modal (Enforces Requirement 9) */}
      {showReplaceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 100
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeftRight size={20} color="var(--brand-crimson)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Replace / Swap Cylinder</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="btn-ghost"
                style={{ minHeight: 'auto', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              fontSize: '0.82rem',
              color: '#1E40AF',
              marginBottom: '16px'
            }}>
              <strong>Requirement 9 Rule:</strong> Position QR Code <code>{currentPos.qrCode}</code> will remain permanently attached to this position. Only the cylinder payload changes.
            </div>

            <form onSubmit={handlePerformReplacement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  Current Cylinder to Remove:
                </label>
                <input
                  type="text"
                  className="input-field"
                  disabled
                  value={`${currentPos.currentEquipment?.serialNo} (${currentPos.currentEquipment?.type})`}
                  style={{ backgroundColor: 'var(--bg-subtle)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  Reason for Cylinder Removal:
                </label>
                <select
                  className="input-field"
                  value={replaceReason}
                  onChange={(e) => setReplaceReason(e.target.value)}
                >
                  <option value="Due for statutory 3-year hydraulic pressure testing (35 Bar / IS 2190)">
                    Due for statutory 3-year hydraulic pressure testing (35 Bar / IS 2190)
                  </option>
                  <option value="Discharged during plant hot-work emergency standby">
                    Discharged during plant hot-work emergency standby
                  </option>
                  <option value="Pressure gauge needle in red discharge zone">
                    Pressure gauge needle in red discharge zone
                  </option>
                  <option value="Defective valve assembly / safety clip missing">
                    Defective valve assembly / safety clip missing
                  </option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  Destination for Removed Cylinder:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={removedDestination}
                  onChange={(e) => setRemovedDestination(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  Replacement Cylinder Serial Number:
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={newSerialNo}
                  onChange={(e) => setNewSerialNo(e.target.value)}
                  placeholder="e.g. IFS-2024-DCP-9941"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                    Type:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                    Capacity:
                  </label>
                  <select
                    className="input-field"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                  >
                    {getLinkedCapacities(newType || currentPos.equipmentType, currentPos.equipmentCategory).map(cap => (
                      <option key={cap} value={cap}>{cap}</option>
                    ))}
                    {!getLinkedCapacities(newType || currentPos.equipmentType, currentPos.equipmentCategory).includes(newCapacity) && (
                      <option value={newCapacity}>{newCapacity}</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  Technician Handover Notes:
                </label>
                <textarea
                  className="textarea-field"
                  value={replaceNotes}
                  onChange={(e) => setReplaceNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="btn-outline"
                  style={{ flex: 1, height: '48px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, height: '48px', justifyContent: 'center' }}
                >
                  Confirm & Update Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
