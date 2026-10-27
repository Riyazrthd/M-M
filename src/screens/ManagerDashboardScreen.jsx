import React, { useState } from 'react';
import { getSites, getPositions, getVisits, getCurrentUser } from '../data/storage';
import { downloadMasterWorkbookExcel } from '../utils/checklistExporter';
import { downloadSQLBackupFile } from '../services/supabaseBackup';
import { 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  FileCheck, 
  ArrowRight, 
  RefreshCw, 
  BarChart3,
  ExternalLink,
  Search,
  Filter,
  Download,
  PlusCircle,
  QrCode,
  Flame,
  Clock,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
  Database
} from 'lucide-react';

export default function ManagerDashboardScreen({ onNavigate, onSelectSite, onSelectPosition }) {
  const sites = getSites();
  const positions = getPositions();
  const visits = getVisits();
  const user = getCurrentUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isDownloadingMaster, setIsDownloadingMaster] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState('');

  const handleDownloadMasterExcel = async () => {
    setIsDownloadingMaster(true);
    try {
      await downloadMasterWorkbookExcel({
        clientName: 'Aarti Industries Limited',
        siteAddress: 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110',
        poNumber: 'PO/AIL/AMC/2026/8812',
        workOrderRef: 'WO-IFSPL-2026-OCT-094',
        dateOfService: new Date().toISOString().substring(0, 10).split('-').reverse().join('-'),
        frequency: 'Quarterly',
        monthPeriod: 'October – 2026',
        engineerName: user.name || 'Ramesh Patel',
        supervisorName: 'Sanjay Sharma',
        clientWitnessName: 'Vikram Shah'
      });
      setDownloadNotice('Master Control Copy (.xlsx with all 26 checklists) downloaded in exact workbook format without changes.');
      setTimeout(() => setDownloadNotice(''), 5000);
    } catch (err) {
      console.error('Master download error:', err);
    } finally {
      setIsDownloadingMaster(false);
    }
  };

  // Dynamic calculations from actual records
  const totalContractedPositions = sites.reduce((acc, s) => acc + (s.totalPositions || 0), 0);
  const totalInspectedPositions = sites.reduce((acc, s) => acc + (s.inspectedPositions || 0), 0);
  const overallCoveragePercent = totalContractedPositions > 0
    ? Math.round((totalInspectedPositions / totalContractedPositions) * 100)
    : 0;

  const positionsWithDefects = positions.filter(p => p.inspectionStatus === 'Inspected - Attention');
  const upcomingHydroTests = positions.filter(p => p.templateId === 'CL-11' && p.currentEquipment?.nextHydroTestDue);
  const totalExtinguishers = positions.filter(p => p.templateId === 'CL-11').length;
  const totalHoseBoxes = positions.filter(p => p.templateId === 'CL-03').length;

  // Filtered equipment list for the bottom Makoro table
  const filteredPositions = positions.filter(p => {
    const matchesSearch = !searchQuery || 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.qrCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.locationDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.currentEquipment?.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'OK' && p.inspectionStatus === 'Inspected - OK') ||
      (statusFilter === 'ATTENTION' && p.inspectionStatus === 'Inspected - Attention') ||
      (statusFilter === 'PENDING' && (!p.inspectionStatus || p.inspectionStatus.includes('Pending')));

    return matchesSearch && matchesStatus;
  });

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = ['Position ID', 'QR Code', 'Plant', 'Location', 'Category', 'Serial No', 'Template', 'Status'];
    const rows = filteredPositions.map(p => [
      p.id,
      p.qrCode,
      p.siteId || 'AIL-U4',
      `"${p.locationDescription || ''}"`,
      p.equipmentCategory || '',
      p.currentEquipment?.serialNumber || '',
      p.templateId || '',
      p.inspectionStatus || 'Pending'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `indus_amc_equipment_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. Makoro Greeting & Overview Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '14px',
        paddingBottom: '4px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>
            Good morning
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#6B7280', margin: 0 }}>
            Here's today's overview across Gujarat chemical & engineering industrial AMC contracts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              downloadSQLBackupFile();
              setDownloadNotice('Supabase SQL Backup file (.sql) downloaded. Ready to run in Supabase SQL Editor!');
              setTimeout(() => setDownloadNotice(''), 6000);
            }}
            className="btn-outline"
            style={{
              height: '38px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              borderColor: '#0284C7',
              color: '#0284C7',
              fontWeight: 600
            }}
            title="Download full Supabase PostgreSQL schema and data backup"
          >
            <Database size={15} />
            <span>Supabase Backup (.sql)</span>
          </button>

          <button
            onClick={handleDownloadMasterExcel}
            disabled={isDownloadingMaster}
            className="btn-outline"
            style={{
              height: '38px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              borderColor: '#1E3A8A',
              color: '#1E3A8A',
              fontWeight: 600
            }}
            title="Download complete Master Control Copy (.xlsx) containing all 26 checklists"
          >
            <FileSpreadsheet size={15} />
            <span>{isDownloadingMaster ? 'Preparing .xlsx...' : 'Master Excel (26 Checklists)'}</span>
          </button>

          <button
            onClick={() => onNavigate('asset-register')}
            className="btn-primary"
            style={{ height: '38px', fontSize: '0.84rem' }}
          >
            <PlusCircle size={15} />
            <span>Register Asset</span>
          </button>

          <button
            onClick={() => onNavigate('site-list')}
            className="btn-outline"
            style={{ height: '38px', fontSize: '0.84rem' }}
          >
            <span>View All Plants</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Master Download Notice */}
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
          <CheckCircle2 size={18} style={{ color: '#2563EB', flexShrink: 0 }} />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* 2. Top 4 Makoro Primary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Overall Inspection Coverage */}
        <div 
          onClick={() => onNavigate('site-list')}
          className="kpi-card card-hover" 
          style={{ padding: '20px 22px', cursor: 'pointer', position: 'relative' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#536174' }}>
              Inspection coverage
            </span>
            <ExternalLink size={14} color="#788494" />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '38px', fontWeight: 500, color: '#17191C', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              {overallCoveragePercent}%
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#FEE2E2',
              color: '#E00000',
              border: '1px solid #FECACA'
            }}>
              {totalContractedPositions - totalInspectedPositions} pending
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#788494', marginBottom: '10px' }}>
            {totalInspectedPositions} of {totalContractedPositions} permanent positions verified
          </div>

          <div className="progress-container">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${overallCoveragePercent}%`, 
                backgroundColor: overallCoveragePercent === 100 ? '#00875A' : '#111827' 
              }} 
            />
          </div>
        </div>

        {/* Card 2: Cylinders Due for HPT */}
        <div 
          onClick={() => onNavigate('digital-checklist')}
          className="kpi-card card-hover" 
          style={{ padding: '20px 22px', cursor: 'pointer', position: 'relative' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#536174' }}>
              Cylinders due for HPT (CL-11)
            </span>
            <ExternalLink size={14} color="#788494" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '38px', fontWeight: 500, color: '#17191C', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              {upcomingHydroTests.length}
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#FEE2E2',
              color: '#E00000',
              border: '1px solid #FECACA'
            }}>
              1 late
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#788494' }}>
            Statutory IS 2190 hydrostatic 35 Bar proof test
          </div>
        </div>

        {/* Card 3: Defect & Spares Alerts */}
        <div 
          onClick={() => onNavigate('photo-remarks')}
          className="kpi-card card-hover" 
          style={{ padding: '20px 22px', cursor: 'pointer', position: 'relative' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#536174' }}>
              Stock / Spares alerts
            </span>
            <ExternalLink size={14} color="#788494" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '38px', fontWeight: 500, color: '#17191C', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              {positionsWithDefects.length}
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              border: '1px solid #FDE68A'
            }}>
              2 low stock
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#788494' }}>
            Pressure gauges & delivery hose washer dispatches
          </div>
        </div>

        {/* Card 4: Contracted AMC Positions */}
        <div 
          onClick={() => onNavigate('site-list')}
          className="kpi-card card-hover" 
          style={{ padding: '20px 22px', cursor: 'pointer', position: 'relative' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#536174' }}>
              Contracted AMC positions
            </span>
            <ExternalLink size={14} color="#788494" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '38px', fontWeight: 500, color: '#17191C', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              {totalContractedPositions}
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#E6F4EA',
              color: '#00875A',
              border: '1px solid #A7F3D0'
            }}>
              {sites.length} client plants
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#788494' }}>
            Total permanent equipment positions under active AMC inspection
          </div>
        </div>
      </div>

      {/* 3. Strip of 6 Secondary Metric Cards with Mini SVG Sparklines (Makoro Reference) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {/* Metric 1 */}
        <div className="saas-card" style={{ padding: '14px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
            Hydro Testing (CL-11)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>{totalExtinguishers} units</span>
            {/* SVG Sparkline */}
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
              <path d="M2 18 L10 14 L18 19 L26 8 L34 12 L46 4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
            35 Bar test certified
          </div>
        </div>

        {/* Metric 2 */}
        <div className="saas-card" style={{ padding: '14px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
            Delivery Hose Boxes (CL-03)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>{totalHoseBoxes} units</span>
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
              <path d="M2 12 L12 16 L22 6 L32 14 L40 10 L46 5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#2563EB', fontWeight: 600, marginTop: '4px' }}>
            All nozzles & lugs intact
          </div>
        </div>

        {/* Metric 3 */}
        <div className="saas-card" style={{ padding: '14px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
            QR Permanent Anchors
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>17 tagged</span>
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
              <path d="M2 20 L12 15 L20 18 L30 10 L38 8 L46 3" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#7C3AED', fontWeight: 600, marginTop: '4px' }}>
            Zero position ID drift
          </div>
        </div>

        {/* Metric 4 */}
        <div className="saas-card" style={{ padding: '14px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
            Defect Rectification
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>87.5%</span>
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
              <path d="M2 14 L12 10 L22 18 L32 8 L40 12 L46 6" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: 600, marginTop: '4px' }}>
            1 unit action pending
          </div>
        </div>

        {/* Metric 5 */}
        <div className="saas-card" style={{ padding: '14px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
            Pressure Gauge Audits
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>94.2%</span>
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
              <path d="M2 18 L12 12 L24 16 L32 8 L40 6 L46 4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
            Green zone calibrated
          </div>
        </div>

        {/* Metric 6 */}
        <div className="saas-card" style={{ padding: '14px', backgroundColor: '#FFFFFF' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
            Field SLA Compliance
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>99.1%</span>
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
              <path d="M2 16 L12 14 L22 10 L30 12 L38 6 L46 4" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#0891B2', fontWeight: 600, marginTop: '4px' }}>
            Zero safety breaches
          </div>
        </div>
      </div>

      {/* 4. Two-Column Middle Section: Scheduled AMC Visits & Real-time Activity Feed */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '16px'
      }}>
        {/* Column 1: Scheduled Work Orders */}
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#DC2626" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                Scheduled Plant AMC Work Orders
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#F3F4F6', color: '#4B5563' }}>
              {sites.length} industrial plants
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sites.map(site => {
              const percent = site.totalPositions > 0
                ? Math.round((site.inspectedPositions / site.totalPositions) * 100)
                : 0;

              return (
                <div 
                  key={site.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#F9FAFB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#111827' }}>{site.name}</span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: percent === 100 ? '#D1FAE5' : '#FEF3C7',
                        color: percent === 100 ? '#059669' : '#D97706'
                      }}>
                        {site.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '2px' }}>
                      {site.city} • PO: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{site.poNumber}</span> • <span style={{ color: '#00875A', fontWeight: 600 }}>{site.amcType || site.frequency || 'Quarterly'} ({site.noOfVisits || 4} Visits)</span> • Exp: {site.amcExpiryDate || '—'} • Coverage: {percent}% ({site.inspectedPositions}/{site.totalPositions})
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectSite) onSelectSite(site);
                      onNavigate('qr-scanner');
                    }}
                    className="btn-outline"
                    style={{ height: '32px', minHeight: '32px', fontSize: '0.78rem', padding: '0 10px', flexShrink: 0 }}
                  >
                    <span>Inspect</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Live Activity Stream / Inspection Dispatches */}
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#2563EB" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                Live Field Inspection Dispatch Stream
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
              ● Real-time
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', marginTop: '6px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>
                  POS-AIL-001 Cylinder Replaced
                </div>
                <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                  Permanent QR <span style={{ fontFamily: 'monospace' }}>QR-POS-AIL-001</span> retained. Replacement unit IFS-2023-ABC-9901 linked.
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px' }}>15 mins ago by Ramesh Patel</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB', marginTop: '6px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>
                  CL-11 Hydro Testing Passed (35 Bar)
                </div>
                <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                  POS-AIL-002 tested for 3 mins. Zero pressure drop or body distortion observed.
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px' }}>45 mins ago • SOP/011 compliant</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706', marginTop: '6px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>
                  Defect Flagged: Hose Box Gland Packing
                </div>
                <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                  POS-ATL-003 minor leak identified. Photo evidence recorded; spare washer requisitioned.
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px' }}>1 hour ago at Atul Ltd Site</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', marginTop: '6px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>
                  Client Sign-Off Completed
                </div>
                <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                  Dual technician & plant safety officer digital signature recorded.
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px' }}>2 hours ago by Rajesh Mehta</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Makoro-Style Full-Width Table with Search, Filter & CSV Export */}
      <div className="saas-card" style={{ padding: '20px' }}>
        
        {/* Table Header with Search, Filter & Export */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Equipment Position Inventory & Status
              </h3>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: '#F3F4F6',
                color: '#4B5563'
              }}>
                {filteredPositions.length} positions
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '2px 0 0 0' }}>
              Permanent QR tagged positions across contracted industrial plants
            </p>
          </div>

          {/* Search, Filter & Export controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 10px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              width: '210px'
            }}>
              <Search size={14} color="#6B7280" />
              <input
                type="text"
                placeholder="Search equipment, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.8rem',
                  backgroundColor: 'transparent',
                  width: '100%',
                  color: '#111827'
                }}
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: '36px',
                minHeight: '36px',
                padding: '0 10px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                fontSize: '0.8rem',
                color: '#111827',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="OK">Inspected - OK</option>
              <option value="ATTENTION">Attention / Defect</option>
              <option value="PENDING">Pending Inspection</option>
            </select>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCSV}
              className="btn-outline"
              style={{ height: '36px', minHeight: '36px', fontSize: '0.8rem', padding: '0 12px' }}
              title="Download CSV export"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{
                backgroundColor: '#F9FAFB',
                textAlign: 'left',
                borderBottom: '1px solid #E5E7EB',
                color: '#6B7280',
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '10px 14px' }}>Position ID & QR Tag</th>
                <th style={{ padding: '10px 14px' }}>Plant & Location</th>
                <th style={{ padding: '10px 14px' }}>Equipment Specs</th>
                <th style={{ padding: '10px 14px' }}>SOP Template</th>
                <th style={{ padding: '10px 14px' }}>Inspection Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.map(pos => {
                const isOK = pos.inspectionStatus === 'Inspected - OK';
                const isAttention = pos.inspectionStatus === 'Inspected - Attention';

                return (
                  <tr 
                    key={pos.id}
                    style={{ borderBottom: '1px solid #E5E7EB', transition: 'background-color 0.1s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Position ID & Permanent QR Tag */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{pos.id}</div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#4B5563',
                        fontFamily: 'monospace',
                        backgroundColor: '#F3F4F6',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginTop: '2px'
                      }}>
                        {pos.qrCode}
                      </div>
                    </td>

                    {/* Plant & Location */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        {pos.siteId === 'AIL-U4' ? 'Aarti Industries Ltd' : pos.siteId === 'ATL-C2' ? 'Atul Ltd' : pos.siteId === 'DNL-NDS' ? 'Deepak Nitrite' : 'L&T Hazira'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {pos.locationDescription}
                      </div>
                    </td>

                    {/* Equipment Specs */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ color: '#111827', fontWeight: 500 }}>
                        {pos.currentEquipment?.type || pos.equipmentCategory}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                        Serial: {pos.currentEquipment?.serialNumber || 'N/A'} • {pos.currentEquipment?.capacity || 'Standard'}
                      </div>
                    </td>

                    {/* Assigned SOP Template */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: pos.templateId === 'CL-11' ? '#EFF6FF' : '#FEF3C7',
                        color: pos.templateId === 'CL-11' ? '#2563EB' : '#D97706',
                        border: '1px solid #E5E7EB'
                      }}>
                        {pos.templateId}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: isOK ? '#D1FAE5' : isAttention ? '#FEE2E2' : '#F3F4F6',
                        color: isOK ? '#059669' : isAttention ? '#DC2626' : '#6B7280'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isOK ? '#059669' : isAttention ? '#DC2626' : '#6B7280'
                        }} />
                        {pos.inspectionStatus || 'Pending'}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          if (onSelectPosition) onSelectPosition(pos);
                          onNavigate('asset-details');
                        }}
                        className="btn-outline"
                        style={{ height: '32px', minHeight: '32px', padding: '0 10px', fontSize: '0.78rem' }}
                      >
                        View Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Truthful Architecture Status Footer Card */}
      <div style={{
        padding: '14px 18px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={16} color="#DC2626" />
          <span style={{ fontSize: '0.78rem', color: '#4B5563' }}>
            <strong>Phase 1 Validated Engine:</strong> Dynamic site coverage, permanent QR preservation (Req 9), mandatory defect photo validation, and offline cache.
          </span>
        </div>
        <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>
          Indus Fire Safety Private Limited • Makoro UI Edition
        </span>
      </div>

    </div>
  );
}
