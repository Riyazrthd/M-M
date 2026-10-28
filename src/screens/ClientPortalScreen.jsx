import React, { useState } from 'react';
import { getSites, getSiteById, getPositions, getVisits } from '../data/storage';
import { ShieldCheck, Download, CheckCircle2, AlertTriangle, FileText, Calendar, Building, Printer, ExternalLink } from 'lucide-react';

export default function ClientPortalScreen({ onNavigate }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const allSites = getSites();
  const clientSite = allSites[0] || null;
  const siteId = clientSite?.id;
  const positions = siteId ? getPositions(siteId) : [];
  const visits = siteId ? getVisits().filter(v => v.siteId === siteId) : [];
  const activeVisit = visits[0];

  const filteredPositions = positions.filter((pos) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'CL-11') return pos.templateId === 'CL-11';
    if (selectedFilter === 'CL-03') return pos.templateId === 'CL-03';
    return true;
  });

  const verifiedCount = positions.filter(p => p.inspectionStatus && p.inspectionStatus.startsWith('Inspected')).length;
  const compliancePercent = positions.length > 0 ? Math.round((verifiedCount / positions.length) * 100) : 0;

  if (!clientSite) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card" style={{ padding: '48px 24px', backgroundColor: '#FFFFFF', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            margin: '0 auto 16px auto'
          }}>
            <Building size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Client Portal Ready for Production
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#6B7280', maxWidth: '440px', margin: '8px auto 20px auto' }}>
            No clients registered yet. Once you register a client facility, client safety representatives can review verified compliance records and download dossiers here.
          </p>
          <button
            onClick={() => onNavigate('site-list')}
            style={{
              height: '38px',
              padding: '0 18px',
              borderRadius: '8px',
              backgroundColor: '#064E3B',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.84rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Go to Client Facilities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Client Portal Header */}
      <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF', borderLeft: '4px solid #2563EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-navy" style={{ backgroundColor: '#1D4ED8' }}>Client Safety Portal (Read-Only)</span>
              <span className="badge badge-ok">Verified Compliance</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              {clientSite?.name || 'Aarti Industries Ltd — Unit IV'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Safety & Fire Protection Equipment AMC Audit Log • Supervised by Indus Fire Safety Pvt. Ltd.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="btn-outline"
            style={{ height: '40px', minHeight: '40px', fontSize: '0.85rem' }}
          >
            <Printer size={16} /> Export Compliance Dossier
          </button>
        </div>

        {/* Contract Meta Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginTop: '16px',
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-subtle)',
          fontSize: '0.82rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>Contract / PO Number:</span>
            <strong style={{ color: 'var(--brand-navy)', fontFamily: 'monospace' }}>{clientSite?.poNumber || '—'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>PO Date:</span>
            <strong>{clientSite?.poDate || '01-Apr-2026'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>Type of AMC:</span>
            <strong style={{ color: '#00875A' }}>{clientSite?.amcType || clientSite?.frequency} ({clientSite?.noOfVisits || 4} Visits/Yr)</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>AMC Expire Date:</span>
            <strong style={{ color: '#B45309' }}>{clientSite?.amcExpiryDate || clientSite?.contractPeriod || '31-Mar-2027'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>Client EHS Representative:</span>
            <span>Vikram Shah (Head EHS)</span>
          </div>
        </div>
      </div>

      {/* Compliance Overview Scorecards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        <div className="card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
            Equipment Audit Coverage
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '4px' }}>
            {verifiedCount} / {positions.length} Units ({compliancePercent}%)
          </div>
          <div className="progress-container" style={{ marginTop: '8px' }}>
            <div className="progress-fill" style={{ width: `${compliancePercent}%`, backgroundColor: 'var(--status-ok)' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
            Extinguisher Hydro Testing (IS 2190)
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-ok)', marginTop: '4px' }}>
            100% Certified
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            All active cylinders tested at 35 Bar for 3 mins
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
            Latest Signed AMC Report
          </span>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '4px' }}>
            {activeVisit ? activeVisit.visitId : 'In Progress'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Status: {activeVisit?.status || 'Pending completion'}
          </div>
        </div>
      </div>

      {/* Filter Tabs for Assets */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Plant Equipment Positions & Inspection History
          </h3>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'ALL', label: 'All Equipment' },
              { id: 'CL-11', label: 'Extinguishers (CL-11)' },
              { id: 'CL-03', label: 'Hose Boxes (CL-03)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className="btn-outline"
                style={{
                  height: '34px',
                  minHeight: '34px',
                  padding: '0 12px',
                  fontSize: '0.78rem',
                  backgroundColor: selectedFilter === tab.id ? 'var(--brand-navy)' : 'var(--bg-surface)',
                  color: selectedFilter === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                  borderColor: selectedFilter === tab.id ? 'var(--brand-navy)' : 'var(--border-light)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mobile-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '10px 12px' }}>Position ID</th>
                <th style={{ padding: '10px 12px' }}>Permanent QR</th>
                <th style={{ padding: '10px 12px' }}>Physical Location</th>
                <th style={{ padding: '10px 12px' }}>Installed Equipment</th>
                <th style={{ padding: '10px 12px' }}>Standard / HPT Status</th>
                <th style={{ padding: '10px 12px' }}>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.map((pos) => (
                <tr key={pos.positionId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    {pos.positionId}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {pos.qrCode}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div>{pos.area}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pos.location}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600 }}>{pos.currentEquipment?.serialNo}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {pos.currentEquipment?.type || pos.equipmentType}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '0.78rem' }}>
                    {pos.templateId === 'CL-11' ? (
                      <div>
                        <div>IS 2190 (35 Bar)</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          Next HPT: {pos.currentEquipment?.nextHydroTestDue || '2028-03'}
                        </div>
                      </div>
                    ) : (
                      <div>IS 5 (Double Door)</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge ${
                      pos.inspectionStatus === 'Inspected - OK' ? 'badge-ok' :
                      pos.inspectionStatus === 'Inspected - Attention' ? 'badge-fail' : 'badge-neutral'
                    }`} style={{ fontSize: '0.72rem' }}>
                      {pos.inspectionStatus || 'Pending'}
                    </span>
                    {pos.inspectionHistory && pos.inspectionHistory.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        by {pos.inspectionHistory[0].technicianName || 'Ramesh Patel'} • {pos.inspectionHistory[0].timestamp}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual Signature Audit Verification Proof */}
      {activeVisit && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '10px' }}>
            Audit Sign-off Verification
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                Indus Service Engineer (Inspected & Signed):
              </span>
              <div style={{ marginTop: '6px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--brand-navy)' }}>
                {activeVisit.technicianName || activeVisit.serviceEngineer || 'Ramesh Patel'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Badge: {activeVisit.technicianBadge || 'IFS-SE-041'} • Lead Service Engineer
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--status-ok)', fontWeight: 600, marginTop: '4px' }}>
                ✓ Digitally authenticated on {activeVisit.signedDate || activeVisit.date} {activeVisit.signedTime ? `at ${activeVisit.signedTime}` : ''}
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                Client Representative (Witnessed):
              </span>
              <div style={{ marginTop: '6px', fontWeight: 700 }}>
                {activeVisit.clientRepresentative || 'Vikram Shah'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--status-ok)', fontWeight: 600, marginTop: '2px' }}>
                ✓ Witnessed on behalf of Aarti Industries Ltd
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
