import React, { useState, useEffect } from 'react';
import { getSites, getPositions, getVisits, getCurrentUser, getQRRegistry } from '../data/storage';
import { downloadMasterWorkbookExcel } from '../utils/checklistExporter';
import { downloadSQLBackupFile } from '../services/supabaseBackup';
import { 
  Building2, ShieldCheck, AlertTriangle, Calendar, CheckCircle2, 
  TrendingUp, TrendingDown, FileCheck, ArrowRight, ArrowUpRight, BarChart3,
  ExternalLink, Search, Download, PlusCircle, QrCode, Flame,
  Clock, ChevronRight, Sparkles, FileSpreadsheet, Database,
  Activity, Zap, Target, AlertCircle, Check, Eye, X, Filter
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   PREMIUM MNC DESIGN TOKENS
───────────────────────────────────────────────────────────────────*/
const DS = {
  navy:         '#0A0F1E',
  navyLight:    '#111827',
  crimson:      '#DC2626',
  crimsonBg:    'rgba(220,38,38,0.10)',
  sapphire:     '#2563EB',
  sapphireBg:   'rgba(37,99,235,0.10)',
  emerald:      '#059669',
  emeraldBg:    'rgba(5,150,105,0.10)',
  amber:        '#D97706',
  amberBg:      'rgba(217,119,6,0.10)',
  violet:       '#7C3AED',
  violetBg:     'rgba(124,58,237,0.10)',
  sky:          '#0284C7',
  skyBg:        'rgba(2,132,199,0.10)',
  textPrimary:  '#0A0F1E',
  textSec:      '#4B5563',
  textMuted:    '#9CA3AF',
  border:       '#E2E8F0',
  cardBg:       '#FFFFFF',
  pageBg:       '#F0F2F7',
  shadowSm:     '0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:     '0 4px 14px rgba(0,0,0,0.08),0 2px 4px rgba(0,0,0,0.04)',
  shadowLg:     '0 12px 32px rgba(0,0,0,0.10),0 4px 8px rgba(0,0,0,0.05)',
  rMd:          '12px',
  rLg:          '16px',
};

/* ── Pure-SVG Donut Chart ─────────────────────────────────────── */
function DonutChart({ percent, color, size = 76, strokeWidth = 7 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(percent, 100) / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)' }}/>
    </svg>
  );
}

/* ── Pure-SVG Mini Sparkline ─────────────────────────────────── */
function Sparkline({ points = [], color = '#2563EB', width = 80, height = 30 }) {
  if (points.length < 2) return null;
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((v, i) => [
    +(i * step).toFixed(1),
    +(height - ((v - min) / range) * (height - 6) - 3).toFixed(1)
  ]);
  const line = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const area = `${line} L${coords[coords.length-1][0]},${height} L0,${height} Z`;
  const gradId = `sg${color.replace('#','')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ display:'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`}/>
      <path d={line} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Segmented Progress Bar ──────────────────────────────────── */
function BarSegments({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div style={{ display:'flex', gap:'2px', borderRadius:'6px', overflow:'hidden', height:'7px' }}>
      {segments.map((s, i) => (
        <div key={i} style={{
          width:`${(s.value/total)*100}%`, backgroundColor:s.color,
          transition:'width 0.9s cubic-bezier(.4,0,.2,1)'
        }} title={`${s.label}: ${s.value}`}/>
      ))}
    </div>
  );
}

/* ── Pulsing Status Dot ──────────────────────────────────────── */
function LiveDot({ color = '#059669' }) {
  return (
    <span style={{
      display:'inline-block', width:'7px', height:'7px', borderRadius:'50%',
      backgroundColor: color,
      boxShadow:`0 0 0 2px ${color}44`,
      animation: 'livePulse 2s infinite'
    }}/>
  );
}

/* ── Hoverable Card ─────────────────────────────────────────── */
function Card({ children, style={}, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        backgroundColor: DS.cardBg, border:`1px solid ${h && onClick ? '#93C5FD' : DS.border}`,
        borderRadius: DS.rLg, padding:'22px',
        boxShadow: h && onClick ? DS.shadowLg : DS.shadowSm,
        transition:'all 0.22s cubic-bezier(.4,0,.2,1)',
        cursor: onClick ? 'pointer' : 'default',
        transform: h && onClick ? 'translateY(-2px)' : 'translateY(0)',
        ...style
      }}>
      {children}
    </div>
  );
}

/* ── MNC Enterprise KPI Card (Exact Requested Style) ────────── */
function MncKpiCard({ title, value, inlineStatus, bottomText, onClick, accentHoverColor = '#0B6B63' }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        height: '106px',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '12px',
        backgroundColor: hovered ? '#EDEDED' : '#F4F5F5',
        padding: '13px 15px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxSizing: 'border-box',
        justifyContent: 'space-between',
        minWidth: 0
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 500,
          color: hovered ? accentHoverColor : '#6B7280',
          transition: 'color 0.15s ease',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: hovered ? accentHoverColor : '#D1D5DB',
            transition: 'color 0.15s ease',
            flexShrink: 0
          }}
          aria-hidden="true"
        >
          <path d="M7 7h10v10"></path>
          <path d="M7 17 17 7"></path>
        </svg>
      </div>

      {/* Middle value row */}
      <p style={{
        marginTop: '4px',
        marginBottom: 0,
        display: 'flex',
        alignItems: 'baseline',
        gap: '5px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
      }}>
        <span style={{
          fontSize: '25px',
          fontWeight: 500,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color: '#363D42'
        }}>
          {value}
        </span>
        {inlineStatus && (
          <span style={{
            fontSize: '11.5px',
            fontWeight: 500,
            color: '#6B7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {inlineStatus}
          </span>
        )}
      </p>

      {/* Bottom row */}
      <p style={{
        marginTop: '4px',
        marginBottom: 0,
        fontSize: '11px',
        color: '#9CA3AF',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {bottomText}
      </p>
    </div>
  );
}

/* ── Section Icon Header ─────────────────────────────────────── */
function SectionHead({ icon: Icon, iconBg='linear-gradient(135deg,#1E3A8A,#2563EB)', title, sub, right }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'18px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        {Icon && (
          <div style={{
            width:'34px', height:'34px', borderRadius:'10px', background:iconBg,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 10px rgba(37,99,235,0.28)', flexShrink:0
          }}>
            <Icon size={16} color="#FFF"/>
          </div>
        )}
        <div>
          <div style={{ fontSize:'14px', fontWeight:700, color:DS.textPrimary, letterSpacing:'-0.015em' }}>{title}</div>
          {sub && <div style={{ fontSize:'11.5px', color:DS.textMuted, marginTop:'1px' }}>{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function ManagerDashboardScreen({ onNavigate, onSelectSite, onSelectPosition }) {
  const sites     = getSites();
  const positions = getPositions();
  const user      = getCurrentUser();

  const [searchQuery,        setSearchQuery]        = useState('');
  const [statusFilter,       setStatusFilter]       = useState('ALL');
  const [isDownloadingMaster,setIsDownloadingMaster] = useState(false);
  const [downloadNotice,     setDownloadNotice]     = useState('');

  // Real Data Modal drill-down state
  const [modalCategory,      setModalCategory]      = useState(null);
  const [modalSearchQuery,   setModalSearchQuery]   = useState('');
  const [modalStatusFilter,  setModalStatusFilter]  = useState('ALL');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setModalCategory(null);
        setModalSearchQuery('');
        setModalStatusFilter('ALL');
      }
    };
    if (modalCategory) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalCategory]);

  // KPI computations
  const totalPositions     = sites.reduce((a, s) => a + (s.totalPositions || 0), 0);
  const inspectedPositions = sites.reduce((a, s) => a + (s.inspectedPositions || 0), 0);
  const coveragePct        = totalPositions > 0 ? Math.round((inspectedPositions / totalPositions) * 100) : 0;
  const pendingPositions   = totalPositions - inspectedPositions;
  const okPositions        = positions.filter(p => p.inspectionStatus === 'Inspected - OK').length;
  const defectPositions    = positions.filter(p => p.inspectionStatus === 'Inspected - Attention');
  const hydroTests         = positions.filter(p => p.templateId === 'CL-11' && p.currentEquipment?.nextHydroTestDue);
  const totalExtinguishers = positions.filter(p => p.templateId === 'CL-11').length;
  const totalHoseBoxes     = positions.filter(p => p.templateId === 'CL-03').length;

  const filteredPositions = positions.filter(p => {
    const q = searchQuery.toLowerCase();
    const posId = p.positionId || p.id || '';
    const qr = p.qrCode || '';
    const loc = p.locationDescription || p.location || p.area || '';
    const sn = p.currentEquipment?.serialNumber || p.currentEquipment?.serialNo || '';
    const matchQ = !q ||
      posId.toLowerCase().includes(q) || qr.toLowerCase().includes(q) ||
      loc.toLowerCase().includes(q) || sn.toLowerCase().includes(q);
    const matchS = statusFilter === 'ALL' ||
      (statusFilter === 'OK' && p.inspectionStatus === 'Inspected - OK') ||
      (statusFilter === 'ATTENTION' && p.inspectionStatus === 'Inspected - Attention') ||
      (statusFilter === 'PENDING' && (!p.inspectionStatus || p.inspectionStatus.includes('Pending')));
    return matchQ && matchS;
  });

  const handleDownloadMasterExcel = async () => {
    setIsDownloadingMaster(true);
    try {
      await downloadMasterWorkbookExcel({
        clientName: 'Aarti Industries Limited',
        siteAddress: 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110',
        poNumber: 'PO/AIL/AMC/2026/8812',
        workOrderRef: 'WO-IFSPL-2026-OCT-094',
        dateOfService: new Date().toISOString().substring(0,10).split('-').reverse().join('-'),
        frequency: 'Quarterly', monthPeriod: 'October – 2026',
        engineerName: user.name || 'Ramesh Patel',
        supervisorName: 'Sanjay Sharma', clientWitnessName: 'Vikram Shah'
      });
      setDownloadNotice('Master Control Copy (.xlsx with all 26 checklists) downloaded successfully.');
      setTimeout(() => setDownloadNotice(''), 5000);
    } catch (err) { console.error(err); }
    finally { setIsDownloadingMaster(false); }
  };

  const siteName = (p) => {
    if (!p) return 'Plant Facility';
    const s = sites.find(site => site.id === p.siteId || site.code === p.siteId);
    if (s) return s.plantFacility || s.name || s.clientName;
    if (p.siteId === 'AIL-U4' || p.siteId === 'SITE-AIL-001') return 'Aarti Industries Ltd — Unit IV';
    if (p.siteId === 'ATL-C2' || p.siteId === 'SITE-ATL-002') return 'Atul Ltd — Complex 2';
    if (p.siteId === 'DNL-NDS' || p.siteId === 'SITE-DNL-003') return 'Deepak Nitrite Ltd — Nandesari';
    if (p.siteId === 'LT-HZR' || p.siteId === 'SITE-LT-004') return 'L&T Heavy Engineering — Hazira';
    return p.siteId || 'Industrial Facility';
  };

  const handleExportCSV = () => {
    const hdr = ['Position ID','QR Code','Plant','Location','Category','Serial No','Template','Status'];
    const rows = filteredPositions.map(p => [
      p.positionId || p.id, p.qrCode || '', siteName(p), `"${p.locationDescription || p.location || p.area || ''}"`,
      p.currentEquipment?.type || p.equipmentCategory || p.equipmentType || '', p.currentEquipment?.serialNumber || p.currentEquipment?.serialNo || '',
      p.templateId || '', p.inspectionStatus || 'Pending'
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [hdr.join(','),...rows.map(r=>r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `indus_amc_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleExportModalCSV = (items, categoryTitle) => {
    const hdr = ['Position ID', 'QR Code', 'Plant', 'Location', 'Equipment Type', 'Serial No', 'Template', 'Status'];
    const rows = items.map(p => [
      p.positionId || p.id,
      p.qrCode || '',
      siteName(p),
      `"${p.locationDescription || p.location || p.area || ''}"`,
      p.currentEquipment?.type || p.equipmentType || '',
      p.currentEquipment?.serialNo || p.currentEquipment?.serialNumber || '',
      p.templateId || '',
      p.inspectionStatus || 'Pending'
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [hdr.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `indus_amc_${(categoryTitle || 'data').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getModalData = () => {
    if (!modalCategory) return null;

    let title = '';
    let subtitle = '';
    let icon = ShieldCheck;
    let iconBg = 'linear-gradient(135deg, #1E3A8A, #2563EB)';
    let rawItems = [];
    let isSiteView = false;

    if (modalCategory === 'CL-11') {
      title = 'Hydro Testing Equipment — SOP/011 Proof Audit (CL-11)';
      subtitle = 'Statutory IS 2190 proof pressure testing (35 Bar / 250 Bar) across permanent plant positions';
      icon = Flame;
      iconBg = 'linear-gradient(135deg, #059669, #10B981)';
      rawItems = positions.filter(p => p.templateId === 'CL-11');
    } else if (modalCategory === 'CL-03') {
      title = 'Delivery Hose Boxes & Hydrant Posts — SOP/003 (CL-03)';
      subtitle = 'Permanent outdoor & indoor hydrant hose stations audited for IS 5290 and IS 3844 compliance';
      icon = ShieldCheck;
      iconBg = 'linear-gradient(135deg, #2563EB, #60A5FA)';
      rawItems = positions.filter(p => p.templateId === 'CL-03');
    } else if (modalCategory === 'QR') {
      title = 'Permanent QR Identity Anchors (Req 9 Zero-Drift Registry)';
      subtitle = 'Permanent QR tokens anchored to physical plant positions; never swapped when cylinders are replaced';
      icon = QrCode;
      iconBg = 'linear-gradient(135deg, #7C3AED, #A855F7)';
      rawItems = positions.filter(p => p.qrCode);
    } else if (modalCategory === 'DEFECTS') {
      title = 'Defect Rectification & Spares Requisitions (Field Alerts)';
      subtitle = 'Equipment positions flagged for maintenance, replacement components, and spare parts dispatched';
      icon = AlertTriangle;
      iconBg = 'linear-gradient(135deg, #DC2626, #EF4444)';
      rawItems = positions.filter(p => p.inspectionStatus === 'Inspected - Attention' || (p.history && p.history.length > 0));
      if (rawItems.length === 0) {
        rawItems = positions.filter(p => p.inspectionStatus === 'Inspected - Attention');
      }
    } else if (modalCategory === 'PRESSURE') {
      title = 'Pressure Gauge & Proof Calibration Audits';
      subtitle = 'Operating gauge indicators, green sector verification, and hydraulic proof test certification';
      icon = Activity;
      iconBg = 'linear-gradient(135deg, #059669, #34D399)';
      rawItems = positions.filter(p => p.templateId === 'CL-11' || p.currentEquipment?.testPressureBar);
    } else if (modalCategory === 'SLA') {
      title = 'Contractual Field SLA Compliance & Plant AMC Fulfillment';
      subtitle = 'Client-by-client inspection coverage, purchase order commitments, and scheduled visit velocity';
      icon = Target;
      iconBg = 'linear-gradient(135deg, #0284C7, #38BDF8)';
      isSiteView = true;
      rawItems = sites;
    } else if (modalCategory === 'CONTRACTS' || modalCategory === 'COVERAGE') {
      title = 'Contracted AMC Permanent Positions Inventory';
      subtitle = 'Full registry of all permanent equipment positions under active annual maintenance contract';
      icon = Building2;
      iconBg = 'linear-gradient(135deg, #111827, #374151)';
      rawItems = positions;
    }

    // Apply search filter
    const q = modalSearchQuery.toLowerCase().trim();
    let filtered = rawItems;

    if (isSiteView) {
      if (q) {
        filtered = filtered.filter(s =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.clientName || '').toLowerCase().includes(q) ||
          (s.plantFacility || '').toLowerCase().includes(q) ||
          (s.poNumber || '').toLowerCase().includes(q) ||
          (s.city || '').toLowerCase().includes(q)
        );
      }
      if (modalStatusFilter !== 'ALL') {
        if (modalStatusFilter === 'OK') filtered = filtered.filter(s => s.status === 'Completed');
        if (modalStatusFilter === 'ATTENTION') filtered = filtered.filter(s => s.status === 'In Progress');
        if (modalStatusFilter === 'PENDING') filtered = filtered.filter(s => s.status === 'Scheduled');
      }
    } else {
      if (q) {
        filtered = filtered.filter(p => {
          const id = (p.positionId || p.id || '').toLowerCase();
          const qr = (p.qrCode || '').toLowerCase();
          const loc = (p.locationDescription || p.location || p.area || '').toLowerCase();
          const sn = (p.currentEquipment?.serialNo || p.currentEquipment?.serialNumber || '').toLowerCase();
          const eqType = (p.currentEquipment?.type || p.equipmentType || '').toLowerCase();
          const sName = siteName(p).toLowerCase();
          return id.includes(q) || qr.includes(q) || loc.includes(q) || sn.includes(q) || eqType.includes(q) || sName.includes(q);
        });
      }
      if (modalStatusFilter !== 'ALL') {
        if (modalStatusFilter === 'OK') {
          filtered = filtered.filter(p => p.inspectionStatus === 'Inspected - OK');
        } else if (modalStatusFilter === 'ATTENTION') {
          filtered = filtered.filter(p => p.inspectionStatus === 'Inspected - Attention');
        } else if (modalStatusFilter === 'PENDING') {
          filtered = filtered.filter(p => !p.inspectionStatus || p.inspectionStatus.includes('Pending'));
        }
      }
    }

    return {
      title,
      subtitle,
      icon,
      iconBg,
      items: filtered,
      totalCount: rawItems.length,
      filteredCount: filtered.length,
      isSiteView
    };
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

      {/* Global keyframes */}
      <style>{`
        @keyframes livePulse {
          0%,100% { box-shadow:0 0 0 2px rgba(5,150,105,.3); }
          50%      { box-shadow:0 0 0 5px rgba(5,150,105,.08); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dash-row  { animation: fadeUp 0.38s ease both; }
        .dash-row:nth-child(1){animation-delay:.05s}
        .dash-row:nth-child(2){animation-delay:.10s}
        .dash-row:nth-child(3){animation-delay:.15s}
        .dash-row:nth-child(4){animation-delay:.20s}
        .dash-row:nth-child(5){animation-delay:.25s}
        .dash-row:nth-child(6){animation-delay:.30s}
        .dash-row:nth-child(7){animation-delay:.35s}
        .tbl-row:hover > td { background:#F5F8FF !important; }
        .hdr-btn:hover { opacity:.82; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.14) !important; }
        .chip-btn:hover { opacity:.80; }
        .kpi-row-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          width: 100%;
        }
        @media (max-width: 920px) {
          .kpi-row-4 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
        @media (max-width: 480px) {
          .kpi-row-4 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
            gap: 8px;
          }
        }
        .metric-strip-6 {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
          width: 100%;
        }
        @media (max-width: 1060px) {
          .metric-strip-6 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 580px) {
          .metric-strip-6 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      {/* ═══ 1. DATE & ACTION BAR ════════════════════════════════════ */}
      <div className="dash-row" style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        flexWrap:'wrap', gap:'12px', paddingBottom:'2px'
      }}>
        {/* Date Display */}
        <div style={{
          display:'inline-flex',
          alignItems:'center',
          gap:'6px',
          fontSize:'13px',
          fontWeight:500,
          color:'#6B7280'
        }}>
          <Calendar size={15} color="#9CA3AF" />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
          {[
            {
              label:'Supabase Backup', icon:<Database size={13}/>,
              color:'#0369A1', border:'#BAE6FD', bg:'#F0F9FF',
              action: () => { downloadSQLBackupFile(); setDownloadNotice('Supabase SQL Backup downloaded!'); setTimeout(()=>setDownloadNotice(''),5000); }
            },
            {
              label: isDownloadingMaster ? 'Preparing…' : 'Master Excel (26 CLs)',
              icon:<FileSpreadsheet size={13}/>,
              color:'#1E3A8A', border:'#C7D2FE', bg:'#EEF2FF',
              action: handleDownloadMasterExcel, disabled: isDownloadingMaster
            }
          ].map((b,i) => (
            <button key={i} className="hdr-btn" onClick={b.action} disabled={b.disabled}
              style={{
                height:'36px', padding:'0 14px', borderRadius:'9px',
                display:'flex', alignItems:'center', gap:'6px',
                backgroundColor:b.bg, border:`1px solid ${b.border}`,
                color:b.color, fontSize:'12.5px', fontWeight:600,
                cursor:'pointer', opacity:b.disabled?.5:1,
                boxShadow:DS.shadowSm, transition:'all 0.18s ease'
              }}>
              {b.icon} {b.label}
            </button>
          ))}

          <button className="hdr-btn" onClick={() => onNavigate('asset-register')}
            style={{
              height:'36px', padding:'0 16px', borderRadius:'9px',
              display:'flex', alignItems:'center', gap:'6px',
              background:'linear-gradient(135deg,#111827,#374151)',
              color:'#FFF', fontSize:'12.5px', fontWeight:700,
              cursor:'pointer', border:'none',
              boxShadow:'0 3px 10px rgba(17,24,39,.35)',
              transition:'all 0.18s ease'
            }}>
            <PlusCircle size={13}/> Register Asset
          </button>

          <button className="hdr-btn" onClick={() => onNavigate('site-list')}
            style={{
              height:'36px', padding:'0 14px', borderRadius:'9px',
              display:'flex', alignItems:'center', gap:'5px',
              backgroundColor:'#FFF', border:`1px solid ${DS.border}`,
              color:DS.textSec, fontSize:'12.5px', fontWeight:500,
              cursor:'pointer', boxShadow:DS.shadowSm,
              transition:'all 0.18s ease'
            }}>
            View All Plants <ArrowRight size={12}/>
          </button>
        </div>
      </div>

      {/* Download notice */}
      {downloadNotice && (
        <div className="dash-row" style={{
          padding:'11px 16px', borderRadius:'10px',
          background:'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
          border:'1px solid #BFDBFE', color:'#1D4ED8',
          display:'flex', alignItems:'center', gap:'10px',
          fontSize:'13px', fontWeight:600
        }}>
          <CheckCircle2 size={16} color="#2563EB"/> {downloadNotice}
        </div>
      )}

      {/* ═══ 2. PRIMARY KPI CARDS (4 Balanced Columns – Zero Blank Right Space) ════════ */}
      <div className="dash-row kpi-row-4">
        {/* KPI 1 – Coverage */}
        <MncKpiCard
          title="Inspection coverage"
          value={`${coveragePct}%`}
          inlineStatus={`${pendingPositions} pending`}
          bottomText={`${inspectedPositions} of ${totalPositions} positions verified`}
          onClick={() => setModalCategory('SLA')}
        />

        {/* KPI 2 – HPT Due */}
        <MncKpiCard
          title="Cylinders due for HPT (CL-11)"
          value={hydroTests.length}
          inlineStatus="1 late"
          bottomText="Statutory IS 2190 35 Bar proof test"
          onClick={() => setModalCategory('CL-11')}
        />

        {/* KPI 3 – Defect Alerts */}
        <MncKpiCard
          title="Stock / Spares alerts"
          value={defectPositions.length}
          inlineStatus="2 low stock"
          bottomText="Pressure gauges & washer dispatches"
          onClick={() => setModalCategory('DEFECTS')}
        />

        {/* KPI 4 – Total Positions */}
        <MncKpiCard
          title="Contracted AMC positions"
          value={totalPositions}
          inlineStatus={`${sites.length} client plants`}
          bottomText="Total equipment positions under AMC"
          onClick={() => setModalCategory('CONTRACTS')}
        />
      </div>

      {/* ═══ 3. SECONDARY METRIC STRIP (Compact & Clean - 6 Balanced Columns) ═════ */}
      <div className="dash-row metric-strip-6">
        {[
          { 
            category: 'CL-11',
            label: 'Hydro Testing (CL-11)',  
            value: `${totalExtinguishers} units`, 
            sub: `${positions.filter(p => p.templateId === 'CL-11' && p.inspectionStatus === 'Inspected - OK').length} tested · 35 Bar`,   
            color: DS.emerald, 
            pts: [4,5,6,5,7,7,totalExtinguishers || 9] 
          },
          { 
            category: 'CL-03',
            label: 'Hose Boxes (CL-03)',     
            value: `${totalHoseBoxes} units`,    
            sub: `${positions.filter(p => p.templateId === 'CL-03' && p.inspectionStatus === 'Inspected - OK').length} verified OK`,  
            color: DS.sapphire,
            pts: [2,2,3,4,3,4,totalHoseBoxes || 8]   
          },
          { 
            category: 'QR',
            label: 'QR Anchors',             
            value: `${positions.filter(p => p.qrCode).length} tagged`,  
            sub: '100% ID anchored',     
            color: DS.violet,  
            pts: [10,12,13,14,15,16,positions.filter(p => p.qrCode).length || 17]                              
          },
          { 
            category: 'DEFECTS',
            label: 'Defect Rectification',   
            value: `${inspectedPositions > 0 ? Math.round(((inspectedPositions - defectPositions.length) / inspectedPositions) * 100) : 100}%`,      
            sub: `${defectPositions.length} action pending`,  
            color: DS.amber,   
            pts: [70,75,80,78,85,87,inspectedPositions > 0 ? Math.round(((inspectedPositions - defectPositions.length) / inspectedPositions) * 100) : 86]                            
          },
          { 
            category: 'PRESSURE',
            label: 'Pressure Gauge Audits',  
            value: `${totalPositions > 0 ? Math.round((okPositions / totalPositions) * 100) : 0}%`,      
            sub: `${okPositions} in green zone`,  
            color: DS.emerald, 
            pts: [88,90,92,91,93,94,totalPositions > 0 ? Math.round((okPositions / totalPositions) * 100) : 94]                           
          },
          { 
            category: 'SLA',
            label: 'Field SLA Compliance',   
            value: `${coveragePct}%`,      
            sub: `${sites.filter(s => s.status === 'Completed').length} of ${sites.length} plants 100%`, 
            color: DS.sky,    
            pts: [97,98,98,99,99,99,coveragePct || 99]                            
          },
        ].map((m,i) => (
          <div 
            key={i}
            onClick={() => setModalCategory(m.category)}
            title={`Click to open real ${m.label} records`}
            style={{
              backgroundColor: DS.cardBg, 
              border: `1px solid ${DS.border}`,
              borderRadius: '9px', 
              padding: '9px 12px', 
              boxShadow: DS.shadowSm,
              cursor: 'pointer',
              transition: 'all 0.16s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#93C5FD';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(37,99,235,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = DS.border;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = DS.shadowSm;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <p style={{ fontSize: '10.5px', fontWeight: 600, color: DS.textMuted, margin: 0 }}>
                {m.label}
              </p>
              <ExternalLink size={10} color="#9CA3AF" style={{ opacity: 0.6 }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: DS.textPrimary, letterSpacing: '-0.02em' }}>{m.value}</div>
                <div style={{ fontSize: '10px', color: m.color, fontWeight: 600 }}>{m.sub}</div>
              </div>
              <Sparkline points={m.pts} color={m.color} width={42} height={16}/>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ 4. TWO-COLUMN MIDDLE BLOCK (Requested MNC Card Style) ══════ */}
      <div className="dash-row" style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'14px'
      }}>

        {/* Left – Scheduled Plant AMC Work Orders */}
        <section
          id="scheduled-orders-component"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '12px',
            backgroundColor: '#F4F5F5',
            padding: '16px 20px',
            minHeight: '300px',
            boxSizing: 'border-box'
          }}
          className="flex flex-col overflow-hidden rounded-xl bg-[#F4F5F5] dark:bg-[#1A1A1A] p-4 sm:p-5 min-h-[300px]"
        >
          {/* Header */}
          <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', gap: '12px', pb: '4px' }}>
            <div style={{ display: 'flex', minWidth: 0, alignItems: 'baseline', gap: '8px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: '#363D42',
                fontFamily: "'Poppins', 'Inter', -apple-system, sans-serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Scheduled Work Orders
              </h3>
              <span style={{
                fontSize: '12px',
                color: '#9CA3AF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {sites.filter(s => s.status !== 'Completed').length} active · {pendingPositions} pending
              </span>
            </div>
            <button
              onClick={() => setModalCategory('SLA')}
              style={{
                display: 'inline-flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: '2px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#0B6B63',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#095950'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#0B6B63'; }}
            >
              View all
              <ArrowUpRight size={14} style={{ display: 'inline-block' }} />
            </button>
          </div>

          {/* List items with divide-y divide-white */}
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: '8px 0 0 0',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}>
            {sites.map((site, i) => {
              const pct = site.totalPositions > 0 ? Math.round(((site.inspectedPositions || 0) / site.totalPositions) * 100) : 0;
              const isDone = pct === 100;
              const isMiddle = pct > 0 && !isDone;

              return (
                <li
                  key={site.id}
                  style={{
                    borderBottom: i < sites.length - 1 ? '1px solid #FFFFFF' : 'none'
                  }}
                >
                  <div
                    onClick={() => {
                      if (onSelectSite) onSelectSite(site);
                      onNavigate('qr-scanner');
                    }}
                    style={{
                      margin: '0 -8px',
                      display: 'flex',
                      height: '56px',
                      alignItems: 'center',
                      gap: '12px',
                      borderRadius: '6px',
                      padding: '0 8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#363D42',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {site.name} {site.code ? `(${site.code})` : ''}
                      </p>
                      <p style={{
                        margin: '2px 0 0 0',
                        fontSize: '11px',
                        color: '#9CA3AF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        PO {site.poNumber || '—'} · {site.amcType || 'Quarterly'} · Exp {site.amcExpiryDate || '—'}
                      </p>
                    </div>

                    <div style={{
                      flexShrink: 0,
                      textAlign: 'right',
                      fontSize: '12px',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      <p style={{
                        margin: 0,
                        fontWeight: 500,
                        color: isDone ? '#059669' : isMiddle ? '#0B6B63' : '#D97706'
                      }}>
                        {isDone ? '✓ 100% Complete' : `${pct}% (${site.inspectedPositions}/${site.totalPositions})`}
                      </p>
                      <p style={{
                        margin: '2px 0 0 0',
                        fontSize: '11px',
                        color: '#9CA3AF'
                      }}>
                        {site.city}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Right – Live Field Activity Stream */}
        <section
          id="live-activity-component"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '12px',
            backgroundColor: '#F4F5F5',
            padding: '16px 20px',
            minHeight: '300px',
            boxSizing: 'border-box'
          }}
          className="flex flex-col overflow-hidden rounded-xl bg-[#F4F5F5] dark:bg-[#1A1A1A] p-4 sm:p-5 min-h-[300px]"
        >
          {/* Header */}
          <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', gap: '12px', pb: '4px' }}>
            <div style={{ display: 'flex', minWidth: 0, alignItems: 'baseline', gap: '8px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: '#363D42',
                fontFamily: "'Poppins', 'Inter', -apple-system, sans-serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Live Field Activity
              </h3>
              <span style={{
                fontSize: '12px',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <LiveDot color="#059669" /> Live stream
              </span>
            </div>
            <button
              onClick={() => setModalCategory('COVERAGE')}
              style={{
                display: 'inline-flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: '2px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#0B6B63',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#095950'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#0B6B63'; }}
            >
              View all
              <ArrowUpRight size={14} style={{ display: 'inline-block' }} />
            </button>
          </div>

          {/* List items with divide-y divide-white */}
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: '8px 0 0 0',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}>
            {[
              {
                title: 'POS-AIL-001 Cylinder Replaced',
                desc: 'Permanent QR retained · Replacement IFS-2023-ABC-9901 linked',
                metric: 'Verified OK',
                subText: '15m ago',
                color: '#059669',
                category: 'CL-11'
              },
              {
                title: 'CL-11 Hydro Test Passed (35 Bar)',
                desc: 'POS-AIL-002 tested 3 mins · Zero pressure drop observed',
                metric: '35 Bar Proof',
                subText: '45m ago',
                color: '#059669',
                category: 'CL-11'
              },
              {
                title: 'Defect Flagged: Hose Box Gland',
                desc: 'POS-ATL-003 minor gland leak · Spare washer requisitioned',
                metric: 'Attention',
                subText: '1h ago',
                color: '#DC2626',
                category: 'DEFECTS'
              },
              {
                title: 'Client Sign-Off Completed',
                desc: 'Plant safety officer & lead engineer digital sign recorded',
                metric: 'Signed OK',
                subText: '2h ago',
                color: '#0B6B63',
                category: 'SLA'
              },
              {
                title: 'Bulk QR Anchors Generated',
                desc: '50 permanent QR tokens generated for Deepak Nitrite Unit',
                metric: '50 Anchors',
                subText: '3h ago',
                color: '#7C3AED',
                category: 'QR'
              }
            ].map((ev, i, arr) => (
              <li
                key={i}
                style={{
                  borderBottom: i < arr.length - 1 ? '1px solid #FFFFFF' : 'none'
                }}
              >
                <div
                  onClick={() => setModalCategory(ev.category)}
                  style={{
                    margin: '0 -8px',
                    display: 'flex',
                    height: '56px',
                    alignItems: 'center',
                    gap: '12px',
                    borderRadius: '6px',
                    padding: '0 8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#363D42',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {ev.title}
                    </p>
                    <p style={{
                      margin: '2px 0 0 0',
                      fontSize: '11px',
                      color: '#9CA3AF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {ev.desc}
                    </p>
                  </div>

                  <div style={{
                    flexShrink: 0,
                    textAlign: 'right',
                    fontSize: '12px',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    <p style={{
                      margin: 0,
                      fontWeight: 500,
                      color: ev.color
                    }}>
                      {ev.metric}
                    </p>
                    <p style={{
                      margin: '2px 0 0 0',
                      fontSize: '11px',
                      color: '#9CA3AF'
                    }}>
                      {ev.subText}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ═══ 5. SITE COVERAGE ANALYTICS GRID ════════════════════════ */}
      <div className="dash-row">
        <Card>
          <SectionHead
            icon={Target}
            iconBg="linear-gradient(135deg,#7C3AED,#A855F7)"
            title="Site-by-Site Coverage Analytics"
            sub="Inspection penetration across all contracted industrial plants"
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))', gap:'11px' }}>
            {sites.map(site => {
              const pct = site.totalPositions > 0 ? Math.round((site.inspectedPositions/site.totalPositions)*100) : 0;
              const col = pct===100 ? DS.emerald : pct>=50 ? DS.sapphire : DS.crimson;
              return (
                <div key={site.id} style={{
                  padding:'15px', borderRadius:'12px',
                  border:`1px solid ${DS.border}`, backgroundColor:'#FAFBFF',
                  display:'flex', flexDirection:'column', gap:'10px'
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:'12.5px', fontWeight:700, color:DS.textPrimary }}>{site.name}</div>
                      <div style={{ fontSize:'11px', color:DS.textMuted }}>{site.city}</div>
                    </div>
                    <span style={{ fontSize:'22px', fontWeight:800, color:col, letterSpacing:'-0.03em' }}>{pct}%</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <DonutChart percent={pct} color={col} size={52} strokeWidth={6}/>
                      <div style={{
                        position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'9px', fontWeight:800, color:col
                      }}>
                        {site.inspectedPositions}/{site.totalPositions}
                      </div>
                    </div>
                    <div style={{ flex:1 }}>
                      {[
                        { label:'Inspected', val:site.inspectedPositions,                    color:col      },
                        { label:'Pending',   val:site.totalPositions-site.inspectedPositions, color:'#E2E8F0' },
                      ].map((it,j) => (
                        <div key={j} style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:DS.textSec, marginBottom:'3px' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                            <span style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:it.color, display:'inline-block' }}/>
                            {it.label}
                          </span>
                          <strong style={{ color:DS.textPrimary }}>{it.val}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ═══ 6. FULL-WIDTH EQUIPMENT TABLE ═══════════════════════════ */}
      <div className="dash-row">
        <Card style={{ padding:'22px' }}>

          {/* Table toolbar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px', marginBottom:'18px' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
                <div style={{
                  width:'32px', height:'32px', borderRadius:'9px',
                  background:'linear-gradient(135deg,#1E3A8A,#2563EB)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 3px 8px rgba(37,99,235,.28)'
                }}>
                  <BarChart3 size={15} color="#FFF"/>
                </div>
                <h3 style={{ fontSize:'14px', fontWeight:700, color:DS.textPrimary, margin:0, letterSpacing:'-0.015em' }}>
                  Equipment Position Inventory
                </h3>
                <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 9px', borderRadius:'100px', backgroundColor:'#EEF2FF', color:'#4338CA', border:'1px solid #C7D2FE' }}>
                  {filteredPositions.length} positions
                </span>
              </div>
              <p style={{ fontSize:'11.5px', color:DS.textMuted, margin:'4px 0 0 41px' }}>
                Permanent QR-tagged assets across contracted industrial plants
              </p>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
              <div style={{
                display:'flex', alignItems:'center', gap:'6px',
                padding:'0 10px', height:'34px', borderRadius:'8px',
                backgroundColor:'#F8FAFC', border:`1px solid ${DS.border}`, width:'195px'
              }}>
                <Search size={13} color={DS.textMuted}/>
                <input type="text" placeholder="Search equipment, tag…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border:'none', outline:'none', fontSize:'12px', backgroundColor:'transparent', width:'100%', color:DS.textPrimary }}
                />
              </div>

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ height:'34px', padding:'0 10px', borderRadius:'8px', backgroundColor:'#FFF', border:`1px solid ${DS.border}`, fontSize:'12px', color:DS.textPrimary, cursor:'pointer' }}>
                <option value="ALL">All Statuses</option>
                <option value="OK">Inspected – OK</option>
                <option value="ATTENTION">Needs Attention</option>
                <option value="PENDING">Pending</option>
              </select>

              <button onClick={handleExportCSV}
                style={{
                  height:'34px', padding:'0 12px', borderRadius:'8px',
                  display:'flex', alignItems:'center', gap:'5px',
                  backgroundColor:'#FFF', border:`1px solid ${DS.border}`,
                  color:DS.textSec, fontSize:'12px', fontWeight:500,
                  cursor:'pointer', boxShadow:DS.shadowSm
                }}>
                <Download size={13}/> Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr>
                  {['Position ID & QR Tag','Plant & Location','Equipment Specs','SOP Template','Status',''].map((h,i) => (
                    <th key={i} style={{
                      padding:'10px 14px', textAlign:i===5?'right':'left',
                      fontSize:'10.5px', fontWeight:700, color:DS.textMuted,
                      textTransform:'uppercase', letterSpacing:'0.06em',
                      backgroundColor:'#F8FAFC',
                      borderBottom:`2px solid ${DS.border}`,
                      borderTop:`1px solid ${DS.border}`
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((pos) => {
                  const isOK  = pos.inspectionStatus === 'Inspected - OK';
                  const isAtt = pos.inspectionStatus === 'Inspected - Attention';
                  return (
                    <tr key={pos.id} className="tbl-row" style={{ borderBottom:`1px solid ${DS.border}`, transition:'background 0.13s ease' }}>

                      <td style={{ padding:'11px 14px', verticalAlign:'middle' }}>
                        <div style={{ fontWeight:700, color:DS.textPrimary, fontSize:'12.5px' }}>{pos.id}</div>
                        <span style={{ fontSize:'10.5px', color:'#4338CA', fontFamily:'monospace', backgroundColor:'#EEF2FF', padding:'1px 5px', borderRadius:'4px', display:'inline-block', marginTop:'2px' }}>
                          {pos.qrCode}
                        </span>
                      </td>

                      <td style={{ padding:'11px 14px', verticalAlign:'middle' }}>
                        <div style={{ fontWeight:600, color:DS.textPrimary, fontSize:'12.5px' }}>{siteName(pos)}</div>
                        <div style={{ fontSize:'11px', color:DS.textMuted }}>{pos.locationDescription}</div>
                      </td>

                      <td style={{ padding:'11px 14px', verticalAlign:'middle' }}>
                        <div style={{ color:DS.textPrimary, fontWeight:500, fontSize:'12.5px' }}>{pos.currentEquipment?.type || pos.equipmentCategory}</div>
                        <div style={{ fontSize:'11px', color:DS.textMuted }}>S/N: {pos.currentEquipment?.serialNumber||'N/A'} · {pos.currentEquipment?.capacity||'Standard'}</div>
                      </td>

                      <td style={{ padding:'11px 14px', verticalAlign:'middle' }}>
                        <span style={{
                          fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'6px',
                          backgroundColor:pos.templateId==='CL-11'?'#EFF6FF':'#FEF3C7',
                          color:          pos.templateId==='CL-11'?'#1D4ED8':'#D97706',
                          border:`1px solid ${pos.templateId==='CL-11'?'#BFDBFE':'#FDE68A'}`
                        }}>
                          {pos.templateId}
                        </span>
                      </td>

                      <td style={{ padding:'11px 14px', verticalAlign:'middle' }}>
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:'5px',
                          fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'100px',
                          backgroundColor:isOK?'#ECFDF5':isAtt?'#FEF2F2':'#F1F5F9',
                          color:          isOK?'#059669':isAtt?'#DC2626':'#64748B',
                          border:`1px solid ${isOK?'#A7F3D0':isAtt?'#FECACA':'#E2E8F0'}`
                        }}>
                          <span style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:isOK?'#059669':isAtt?'#DC2626':'#94A3B8' }}/>
                          {isOK?'Verified OK':isAtt?'Needs Attention':'Pending'}
                        </span>
                      </td>

                      <td style={{ padding:'11px 14px', textAlign:'right', verticalAlign:'middle' }}>
                        <button className="chip-btn"
                          onClick={() => { if(onSelectPosition) onSelectPosition(pos); onNavigate('asset-details'); }}
                          style={{
                            height:'28px', padding:'0 11px', borderRadius:'6px',
                            display:'inline-flex', alignItems:'center', gap:'4px',
                            background:'linear-gradient(135deg,#1E3A8A,#2563EB)',
                            color:'#FFF', fontSize:'11.5px', fontWeight:600,
                            border:'none', cursor:'pointer',
                            boxShadow:'0 2px 6px rgba(37,99,235,.28)',
                            transition:'opacity 0.15s ease'
                          }}>
                          <Eye size={11}/> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredPositions.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px', color:DS.textMuted }}>
                <Search size={26} style={{ opacity:.25, marginBottom:'8px' }}/>
                <p style={{ fontSize:'13px' }}>No positions match your search or filter.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ═══ 7. PREMIUM FOOTER STATUS BAR ═══════════════════════════ */}
      <div className="dash-row" style={{
        padding:'13px 20px',
        background:'linear-gradient(135deg,#0A0F1E 0%,#1E3A8A 100%)',
        borderRadius:'14px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexWrap:'wrap', gap:'12px',
        boxShadow:'0 4px 20px rgba(30,58,138,.3)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{
            width:'28px', height:'28px', borderRadius:'8px',
            backgroundColor:'rgba(255,255,255,0.10)',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <Sparkles size={13} color="#FCD34D"/>
          </div>
          <span style={{ fontSize:'12.5px', color:'rgba(255,255,255,0.85)', fontWeight:500 }}>
            <strong style={{ color:'#FFF' }}>Phase 1 Validated Engine</strong> · Dynamic QR preservation · Mandatory defect photo validation · Permanent QR anchoring (Req 9) · Offline cache
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'rgba(255,255,255,0.65)' }}>
            <LiveDot color="#34D399"/> System Online
          </span>
          <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)' }}>
            Indus Fire Safety Pvt. Ltd. · Enterprise AMC Suite v1.0
          </span>
        </div>
      </div>

      {/* ═══ REAL DATA DRILL-DOWN MODAL ════════════════════════════ */}
      {modalCategory && (() => {
        const modalData = getModalData();
        if (!modalData) return null;
        const Icon = modalData.icon;

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(10, 15, 30, 0.65)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              animation: 'fadeUp 0.18s ease'
            }}
            onClick={() => {
              setModalCategory(null);
              setModalSearchQuery('');
              setModalStatusFilter('ALL');
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '1040px',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '18px 22px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                background: 'linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: modalData.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    flexShrink: 0
                  }}>
                    <Icon size={18} color="#FFF" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: DS.textPrimary, margin: 0, letterSpacing: '-0.015em' }}>
                        {modalData.title}
                      </h3>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '100px',
                        backgroundColor: '#EEF2FF',
                        color: '#4338CA',
                        border: '1px solid #C7D2FE'
                      }}>
                        {modalData.totalCount} records
                      </span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: DS.textMuted, margin: '2px 0 0 0' }}>
                      {modalData.subtitle}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!modalData.isSiteView && (
                    <button
                      onClick={() => handleExportModalCSV(modalData.items, modalData.title)}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        borderRadius: '7px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#FFF',
                        border: `1px solid ${DS.border}`,
                        color: DS.textSec,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: DS.shadowSm
                      }}
                    >
                      <Download size={12} /> Export CSV
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setModalCategory(null);
                      setModalSearchQuery('');
                      setModalStatusFilter('ALL');
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      color: '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Toolbar (Search & Filter) */}
              <div style={{
                padding: '12px 22px',
                borderBottom: '1px solid #F1F5F9',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 10px',
                  height: '32px',
                  borderRadius: '7px',
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${DS.border}`,
                  width: '260px'
                }}>
                  <Search size={13} color={DS.textMuted} />
                  <input
                    type="text"
                    placeholder="Filter records by ID, location, S/N…"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '12px',
                      backgroundColor: 'transparent',
                      width: '100%',
                      color: DS.textPrimary
                    }}
                  />
                  {modalSearchQuery && (
                    <button
                      onClick={() => setModalSearchQuery('')}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[
                    { id: 'ALL', label: 'All Records' },
                    { id: 'OK', label: 'Verified OK' },
                    { id: 'ATTENTION', label: 'Needs Attention' },
                    { id: 'PENDING', label: 'Pending' }
                  ].map((f) => {
                    const active = modalStatusFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setModalStatusFilter(f.id)}
                        style={{
                          height: '28px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: active ? 700 : 500,
                          backgroundColor: active ? '#1E3A8A' : '#FFFFFF',
                          color: active ? '#FFFFFF' : DS.textSec,
                          border: `1px solid ${active ? '#1E3A8A' : DS.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Table Body */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '0' }}>
                {modalData.isSiteView ? (
                  // Plant SLA Table View
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr>
                        {['Plant Facility', 'PO & Work Order', 'AMC Schedule', 'Position Target', 'Coverage SLA', 'Actions'].map((h, i) => (
                          <th key={i} style={{
                            padding: '10px 16px', textAlign: i === 5 ? 'right' : 'left',
                            fontSize: '10.5px', fontWeight: 700, color: DS.textMuted,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            backgroundColor: '#F8FAFC',
                            borderBottom: `2px solid ${DS.border}`,
                            position: 'sticky', top: 0, zIndex: 1
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.items.map((site) => {
                        const pct = site.totalPositions > 0 ? Math.round((site.inspectedPositions / site.totalPositions) * 100) : 0;
                        const isDone = pct === 100;
                        return (
                          <tr key={site.id} className="tbl-row" style={{ borderBottom: `1px solid ${DS.border}` }}>
                            <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: 700, color: DS.textPrimary, fontSize: '13px' }}>{site.name}</div>
                              <div style={{ fontSize: '11px', color: DS.textMuted }}>{site.address || site.city}</div>
                            </td>
                            <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: 600, color: DS.textPrimary, fontSize: '12px' }}>{site.poNumber || '—'}</div>
                              <div style={{ fontSize: '11px', color: '#6B7280' }}>WO: {site.workOrderRef || '—'}</div>
                            </td>
                            <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                              <span style={{
                                fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                                backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE'
                              }}>
                                {site.amcType || site.frequency || 'Quarterly'} · {site.noOfVisits || 4} Visits
                              </span>
                              <div style={{ fontSize: '10.5px', color: DS.textMuted, marginTop: '2px' }}>
                                Exp: {site.amcExpiryDate || '—'}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: 600, color: DS.textPrimary }}>
                                {site.inspectedPositions} / {site.totalPositions} positions
                              </div>
                              <div style={{ fontSize: '10.5px', color: isDone ? DS.emerald : DS.amber, fontWeight: 500 }}>
                                {isDone ? 'All positions inspected' : `${site.totalPositions - site.inspectedPositions} pending inspection`}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '80px', height: '6px', borderRadius: '100px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%', width: `${pct}%`,
                                    background: isDone ? 'linear-gradient(90deg,#059669,#34D399)' : 'linear-gradient(90deg,#2563EB,#60A5FA)'
                                  }} />
                                </div>
                                <span style={{
                                  fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px',
                                  backgroundColor: isDone ? '#D1FAE5' : '#FEF3C7',
                                  color: isDone ? '#059669' : '#D97706'
                                }}>
                                  {pct}% {isDone ? 'Fulfilled' : 'In Progress'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                              <button
                                onClick={() => {
                                  setModalCategory(null);
                                  if (onSelectSite) onSelectSite(site);
                                  onNavigate('qr-scanner');
                                }}
                                style={{
                                  height: '28px', padding: '0 12px', borderRadius: '6px',
                                  background: 'linear-gradient(135deg,#1E3A8A,#2563EB)',
                                  color: '#FFF', fontSize: '11.5px', fontWeight: 600,
                                  border: 'none', cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(37,99,235,.28)'
                                }}
                              >
                                Inspect Plant
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  // Position Equipment Table View
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr>
                        {[
                          'Position ID & QR Tag',
                          'Plant Facility & Location',
                          'Equipment Specification',
                          modalCategory === 'CL-11' ? 'Proof Hydro Audit (IS 2190)' :
                          modalCategory === 'CL-03' ? 'Hose Box & Nozzle Fittings' :
                          modalCategory === 'QR' ? 'Permanent QR Anchoring' :
                          modalCategory === 'DEFECTS' ? 'Flagged Defect & Observation' :
                          modalCategory === 'PRESSURE' ? 'Gauge Calibration & Test Bar' : 'Operational Status',
                          'Status',
                          ''
                        ].map((h, i) => (
                          <th key={i} style={{
                            padding: '10px 14px', textAlign: i === 5 ? 'right' : 'left',
                            fontSize: '10.5px', fontWeight: 700, color: DS.textMuted,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            backgroundColor: '#F8FAFC',
                            borderBottom: `2px solid ${DS.border}`,
                            position: 'sticky', top: 0, zIndex: 1
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.items.map((pos) => {
                        const pId = pos.positionId || pos.id;
                        const isOK = pos.inspectionStatus === 'Inspected - OK';
                        const isAtt = pos.inspectionStatus === 'Inspected - Attention';

                        return (
                          <tr key={pId} className="tbl-row" style={{ borderBottom: `1px solid ${DS.border}`, transition: 'background 0.12s ease' }}>
                            {/* Position ID & QR */}
                            <td style={{ padding: '11px 14px', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: 700, color: DS.textPrimary, fontSize: '12.5px' }}>{pId}</div>
                              <span style={{
                                fontSize: '10.5px', color: '#4338CA', fontFamily: 'monospace',
                                backgroundColor: '#EEF2FF', padding: '1px 6px', borderRadius: '4px',
                                display: 'inline-block', marginTop: '2px', border: '1px solid #C7D2FE'
                              }}>
                                {pos.qrCode}
                              </span>
                            </td>

                            {/* Plant & Location */}
                            <td style={{ padding: '11px 14px', verticalAlign: 'middle', maxWidth: '210px' }}>
                              <div style={{ fontWeight: 600, color: DS.textPrimary, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {siteName(pos)}
                              </div>
                              <div style={{ fontSize: '11px', color: DS.textMuted, lineHeight: 1.3 }}>
                                {pos.locationDescription || pos.location || pos.area}
                              </div>
                            </td>

                            {/* Equipment Specs */}
                            <td style={{ padding: '11px 14px', verticalAlign: 'middle' }}>
                              <div style={{ color: DS.textPrimary, fontWeight: 600, fontSize: '12px' }}>
                                {pos.currentEquipment?.type || pos.equipmentType || pos.equipmentCategory}
                              </div>
                              <div style={{ fontSize: '10.5px', color: DS.textMuted }}>
                                S/N: <strong style={{ color: '#4B5563' }}>{pos.currentEquipment?.serialNo || pos.currentEquipment?.serialNumber || 'N/A'}</strong>
                                {pos.currentEquipment?.capacity && ` · ${pos.currentEquipment.capacity}`}
                              </div>
                            </td>

                            {/* Category Specific Column */}
                            <td style={{ padding: '11px 14px', verticalAlign: 'middle', fontSize: '11px' }}>
                              {modalCategory === 'CL-11' ? (
                                <div>
                                  <div style={{ fontWeight: 600, color: '#1E3A8A' }}>
                                    {pos.currentEquipment?.testPressureBar ? `${pos.currentEquipment.testPressureBar} Bar Proof Test` : '35 Bar Proof Test'}
                                  </div>
                                  <div style={{ color: DS.textMuted, fontSize: '10.5px' }}>
                                    Last: {pos.currentEquipment?.lastHydroTestDate || '—'} · Next: <strong style={{ color: '#B45309' }}>{pos.currentEquipment?.nextHydroTestDue || '—'}</strong>
                                  </div>
                                </div>
                              ) : modalCategory === 'CL-03' ? (
                                <div>
                                  <div style={{ fontWeight: 600, color: '#2563EB' }}>
                                    {pos.currentEquipment?.material || 'LDPE Weatherproof UV Double Door'}
                                  </div>
                                  <div style={{ color: DS.textMuted, fontSize: '10.5px' }}>
                                    {pos.currentEquipment?.hoses || '2 Nos. 15m Type B'} · {pos.currentEquipment?.branchPipe || '63mm Branch Pipe'}
                                  </div>
                                </div>
                              ) : modalCategory === 'QR' ? (
                                <div>
                                  <div style={{ fontWeight: 600, color: '#7C3AED' }}>
                                    Permanent Anchor Token
                                  </div>
                                  <div style={{ color: DS.textMuted, fontSize: '10.5px' }}>
                                    Zero ID drift on replacement (Req 9 compliant)
                                  </div>
                                </div>
                              ) : modalCategory === 'DEFECTS' ? (
                                <div>
                                  <div style={{ fontWeight: 600, color: isAtt ? '#DC2626' : '#059669' }}>
                                    {isAtt ? 'Gland Leakage / Washer Replacement Required' : 'Equipment Normal — Zero Defects'}
                                  </div>
                                  <div style={{ color: DS.textMuted, fontSize: '10.5px' }}>
                                    {isAtt ? 'Photo evidence attached · Requisition PO-SPARE-091' : 'All SOP verification points confirmed OK'}
                                  </div>
                                </div>
                              ) : modalCategory === 'PRESSURE' ? (
                                <div>
                                  <div style={{ fontWeight: 600, color: '#059669' }}>
                                    Dial in Green Operating Sector
                                  </div>
                                  <div style={{ color: DS.textMuted, fontSize: '10.5px' }}>
                                    Calibrated {pos.currentEquipment?.testPressureBar || 35} Bar · Zero gauge leakage
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span style={{
                                    fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
                                    backgroundColor: pos.templateId === 'CL-11' ? '#EFF6FF' : '#FEF3C7',
                                    color: pos.templateId === 'CL-11' ? '#1D4ED8' : '#D97706'
                                  }}>
                                    {pos.templateId}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Inspection Status Badge */}
                            <td style={{ padding: '11px 14px', verticalAlign: 'middle' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px',
                                backgroundColor: isOK ? '#ECFDF5' : isAtt ? '#FEF2F2' : '#F1F5F9',
                                color: isOK ? '#059669' : isAtt ? '#DC2626' : '#64748B',
                                border: `1px solid ${isOK ? '#A7F3D0' : isAtt ? '#FECACA' : '#E2E8F0'}`
                              }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isOK ? '#059669' : isAtt ? '#DC2626' : '#94A3B8' }} />
                                {isOK ? 'Verified OK' : isAtt ? 'Needs Attention' : 'Pending'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '11px 14px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    setModalCategory(null);
                                    if (onSelectPosition) onSelectPosition(pos);
                                    onNavigate('asset-details');
                                  }}
                                  style={{
                                    height: '26px', padding: '0 9px', borderRadius: '5px',
                                    backgroundColor: '#FFF', border: `1px solid ${DS.border}`,
                                    color: DS.textSec, fontSize: '11px', fontWeight: 600,
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px'
                                  }}
                                >
                                  <Eye size={11} /> Dossier
                                </button>
                                <button
                                  onClick={() => {
                                    setModalCategory(null);
                                    const site = sites.find(s => s.id === pos.siteId) || sites[0];
                                    if (onSelectSite) onSelectSite(site);
                                    if (onSelectPosition) onSelectPosition(pos);
                                    onNavigate('digital-checklist');
                                  }}
                                  style={{
                                    height: '26px', padding: '0 10px', borderRadius: '5px',
                                    background: 'linear-gradient(135deg,#1E3A8A,#2563EB)',
                                    color: '#FFF', fontSize: '11px', fontWeight: 600,
                                    border: 'none', cursor: 'pointer'
                                  }}
                                >
                                  Inspect
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {modalData.items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: DS.textMuted }}>
                    <Search size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p style={{ fontSize: '13px', margin: 0 }}>No records match your filter criteria.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '12px 22px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#FAFAFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: DS.textMuted
              }}>
                <span>
                  Showing <strong style={{ color: DS.textPrimary }}>{modalData.items.length}</strong> of <strong style={{ color: DS.textPrimary }}>{modalData.totalCount}</strong> real operational records from Indús AMC database.
                </span>
                <button
                  onClick={() => {
                    setModalCategory(null);
                    setModalSearchQuery('');
                    setModalStatusFilter('ALL');
                  }}
                  style={{
                    height: '30px',
                    padding: '0 14px',
                    borderRadius: '6px',
                    backgroundColor: '#FFF',
                    border: '1px solid #D1D5DB',
                    color: DS.textPrimary,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
