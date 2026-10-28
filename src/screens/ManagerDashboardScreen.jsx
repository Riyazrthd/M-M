import React, { useState, useEffect } from 'react';
import { getSites, getPositions, getVisits, getCurrentUser } from '../data/storage';
import { downloadMasterWorkbookExcel } from '../utils/checklistExporter';
import { downloadSQLBackupFile } from '../services/supabaseBackup';
import { 
  Building2, ShieldCheck, AlertTriangle, Calendar, CheckCircle2, 
  TrendingUp, TrendingDown, FileCheck, ArrowRight, BarChart3,
  ExternalLink, Search, Download, PlusCircle, QrCode, Flame,
  Clock, ChevronRight, Sparkles, FileSpreadsheet, Database,
  Activity, Zap, Target, AlertCircle, Check, Eye
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
    const matchQ = !q ||
      p.id.toLowerCase().includes(q) || p.qrCode.toLowerCase().includes(q) ||
      p.locationDescription?.toLowerCase().includes(q) ||
      p.currentEquipment?.serialNumber?.toLowerCase().includes(q);
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

  const handleExportCSV = () => {
    const hdr = ['Position ID','QR Code','Plant','Location','Category','Serial No','Template','Status'];
    const rows = filteredPositions.map(p => [
      p.id, p.qrCode, p.siteId || 'AIL-U4', `"${p.locationDescription||''}"`,
      p.equipmentCategory||'', p.currentEquipment?.serialNumber||'',
      p.templateId||'', p.inspectionStatus||'Pending'
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [hdr.join(','),...rows.map(r=>r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `indus_amc_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const siteName = p => p.siteId === 'AIL-U4' ? 'Aarti Industries Ltd' : p.siteId === 'ATL-C2' ? 'Atul Ltd' : p.siteId === 'DNL-NDS' ? 'Deepak Nitrite' : 'L&T Hazira';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

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
      `}</style>

      {/* ═══ 1. GREETING + ACTION ROW ═══════════════════════════════ */}
      <div className="dash-row" style={{
        display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        flexWrap:'wrap', gap:'14px', paddingBottom:'2px'
      }}>
        <div>
          <h2 style={{ fontSize:'1.6rem', fontWeight:800, color:DS.textPrimary, margin:'0 0 4px 0', letterSpacing:'-0.035em' }}>
            {greeting}, {user.name.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize:'13px', color:DS.textSec, margin:0 }}>
            Executive Operations · Gujarat Industrial AMC Contracts ·{' '}
            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </p>
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

      {/* ═══ 2. PRIMARY KPI CARDS (Ultra-Compact & Refined MNC Style) ═══ */}
      <div className="dash-row" style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'10px'
      }}>

        {/* KPI 1 – Coverage */}
        <Card onClick={() => onNavigate('site-list')} style={{ padding:'12px 14px', borderRadius:'10px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
            <span style={{ fontSize:'11px', fontWeight:500, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.04em' }}>
              Inspection Coverage
            </span>
            <div style={{ position:'relative', flexShrink:0 }}>
              <DonutChart percent={coveragePct} color={coveragePct >= 80 ? DS.emerald : coveragePct >= 40 ? DS.amber : DS.crimson} size={34} strokeWidth={3.5}/>
              <div style={{
                position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'9px', fontWeight:600, color: coveragePct >= 80 ? DS.emerald : coveragePct >= 40 ? DS.amber : DS.crimson
              }}>{coveragePct}%</div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'4px' }}>
            <span style={{ fontSize:'22px', fontWeight:600, color:DS.textPrimary, lineHeight:1.1 }}>
              {coveragePct}%
            </span>
            <span style={{ fontSize:'10px', fontWeight:500, padding:'1px 6px', borderRadius:'4px', backgroundColor:'#FEE2E2', color:'#DC2626' }}>
              {pendingPositions} pending
            </span>
          </div>

          <p style={{ fontSize:'11px', color:DS.textSec, margin:'0 0 6px 0' }}>
            {inspectedPositions} / {totalPositions} positions verified
          </p>

          <BarSegments segments={[
            { label:'OK',        value:okPositions,              color:DS.emerald },
            { label:'Attention', value:defectPositions.length,   color:DS.crimson },
            { label:'Pending',   value:pendingPositions,         color:'#E2E8F0'  },
          ]}/>
        </Card>

        {/* KPI 2 – HPT Due */}
        <Card onClick={() => onNavigate('digital-checklist')} style={{ padding:'12px 14px', borderRadius:'10px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
            <span style={{ fontSize:'11px', fontWeight:500, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.04em' }}>
              Cylinders Due (CL-11)
            </span>
            <div style={{
              width:'26px', height:'26px', borderRadius:'6px', flexShrink:0,
              background:'#FEF2F2', border:'1px solid #FECACA',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <Flame size={13} color="#DC2626"/>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'4px' }}>
            <span style={{ fontSize:'22px', fontWeight:600, color:DS.textPrimary, lineHeight:1.1 }}>
              {hydroTests.length}
            </span>
            <span style={{ fontSize:'10px', fontWeight:500, padding:'1px 6px', borderRadius:'4px', backgroundColor:'#FEE2E2', color:'#DC2626' }}>
              1 overdue
            </span>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <p style={{ fontSize:'11px', color:DS.textSec, margin:0 }}>IS 2190 statutory 35 Bar proof</p>
            <Sparkline points={[3,5,4,7,6,9,hydroTests.length||9]} color={DS.crimson} width={58} height={18}/>
          </div>
        </Card>

        {/* KPI 3 – Defect Alerts */}
        <Card onClick={() => onNavigate('photo-remarks')} style={{ padding:'12px 14px', borderRadius:'10px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
            <span style={{ fontSize:'11px', fontWeight:500, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.04em' }}>
              Defect / Spares Alerts
            </span>
            <div style={{
              width:'26px', height:'26px', borderRadius:'6px', flexShrink:0,
              background:'#FFFBEB', border:'1px solid #FDE68A',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <AlertTriangle size={13} color="#D97706"/>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'4px' }}>
            <span style={{ fontSize:'22px', fontWeight:600, color:DS.textPrimary, lineHeight:1.1 }}>
              {defectPositions.length}
            </span>
            <span style={{ fontSize:'10px', fontWeight:500, padding:'1px 6px', borderRadius:'4px', backgroundColor:'#FEF3C7', color:'#D97706' }}>
              2 low stock
            </span>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <p style={{ fontSize:'11px', color:DS.textSec, margin:0 }}>Gauges & washer dispatches</p>
            <Sparkline points={[1,3,2,4,2,3,defectPositions.length||1]} color={DS.amber} width={58} height={18}/>
          </div>
        </Card>

        {/* KPI 4 – Total Positions */}
        <Card onClick={() => onNavigate('site-list')} style={{ padding:'12px 14px', borderRadius:'10px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
            <span style={{ fontSize:'11px', fontWeight:500, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.04em' }}>
              Contracted Positions
            </span>
            <div style={{
              width:'26px', height:'26px', borderRadius:'6px', flexShrink:0,
              background:'#ECFDF5', border:'1px solid #A7F3D0',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <Building2 size={13} color="#059669"/>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'4px' }}>
            <span style={{ fontSize:'22px', fontWeight:600, color:DS.textPrimary, lineHeight:1.1 }}>
              {totalPositions}
            </span>
            <span style={{ fontSize:'10px', fontWeight:500, padding:'1px 6px', borderRadius:'4px', backgroundColor:'#ECFDF5', color:'#059669' }}>
              {sites.length} plants
            </span>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <p style={{ fontSize:'11px', color:DS.textSec, margin:0 }}>Permanent QR tagged assets</p>
            <Sparkline points={[12,14,14,16,17,18,totalPositions||18]} color={DS.emerald} width={58} height={18}/>
          </div>
        </Card>
      </div>

      {/* ═══ 3. SECONDARY METRIC STRIP (Compact & Clean) ═════════════ */}
      <div className="dash-row" style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'8px'
      }}>
        {[
          { label:'Hydro Testing (CL-11)',  value:`${totalExtinguishers} units`, sub:'35 Bar certified',   color:DS.emerald, pts:[4,5,6,5,7,7,totalExtinguishers||6] },
          { label:'Hose Boxes (CL-03)',     value:`${totalHoseBoxes} units`,    sub:'Nozzles & lugs OK',  color:DS.sapphire,pts:[2,2,3,4,3,4,totalHoseBoxes||4]   },
          { label:'QR Anchors',             value:'17 tagged',  sub:'Zero ID drift',     color:DS.violet,  pts:[10,12,13,14,15,16,17]                              },
          { label:'Defect Rectification',   value:'87.5%',      sub:'1 action pending',  color:DS.amber,   pts:[70,75,80,78,85,87,87.5]                            },
          { label:'Pressure Gauge Audits',  value:'94.2%',      sub:'Green zone calib.',  color:DS.emerald, pts:[88,90,92,91,93,94,94.2]                           },
          { label:'Field SLA Compliance',   value:'99.1%',      sub:'Zero safety breach', color:DS.sky,    pts:[97,98,98,99,99,99,99.1]                            },
        ].map((m,i) => (
          <div key={i} style={{
            backgroundColor:DS.cardBg, border:`1px solid ${DS.border}`,
            borderRadius:'8px', padding:'9px 12px', boxShadow:DS.shadowSm
          }}>
            <p style={{ fontSize:'10px', fontWeight:500, color:DS.textMuted, margin:'0 0 3px 0' }}>
              {m.label}
            </p>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <div>
                <div style={{ fontSize:'15px', fontWeight:600, color:DS.textPrimary }}>{m.value}</div>
                <div style={{ fontSize:'10px', color:m.color, fontWeight:500 }}>{m.sub}</div>
              </div>
              <Sparkline points={m.pts} color={m.color} width={42} height={16}/>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ 4. TWO-COLUMN MIDDLE BLOCK ══════════════════════════════ */}
      <div className="dash-row" style={{
        display:'grid', gridTemplateColumns:'1.15fr 1fr', gap:'13px'
      }}>

        {/* Left – Scheduled Work Orders */}
        <Card>
          <SectionHead
            icon={Calendar}
            title="Scheduled Plant AMC Work Orders"
            sub="Active inspection work orders across all contracted sites"
            right={
              <span style={{ fontSize:'10.5px', fontWeight:700, padding:'3px 10px', borderRadius:'100px', backgroundColor:'#EEF2FF', color:'#4338CA', border:'1px solid #C7D2FE' }}>
                {sites.length} plants
              </span>
            }
          />
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {sites.map(site => {
              const pct = site.totalPositions > 0 ? Math.round((site.inspectedPositions/site.totalPositions)*100) : 0;
              const done = pct === 100;
              return (
                <div key={site.id} style={{
                  padding:'12px 14px', borderRadius:'10px',
                  border:`1px solid ${DS.border}`,
                  background: done ? 'linear-gradient(135deg,#F0FDF4,#ECFDF5)' : '#FAFBFF',
                  display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px'
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'3px' }}>
                      <span style={{ fontSize:'12.5px', fontWeight:700, color:DS.textPrimary }}>{site.name}</span>
                      <span style={{
                        fontSize:'10px', fontWeight:700, padding:'1.5px 7px', borderRadius:'100px',
                        backgroundColor:done?'#D1FAE5':'#FEF3C7', color:done?'#059669':'#D97706'
                      }}>
                        {done ? '✓ Complete' : site.status}
                      </span>
                    </div>
                    <p style={{ fontSize:'11px', color:DS.textMuted, margin:'0 0 8px 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {site.city} · PO {site.poNumber} · {site.amcType||'Quarterly'} · Exp {site.amcExpiryDate||'—'}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ flex:1, height:'5px', borderRadius:'100px', backgroundColor:'#E2E8F0', overflow:'hidden' }}>
                        <div style={{
                          height:'100%', borderRadius:'100px', width:`${pct}%`,
                          background: done ? 'linear-gradient(90deg,#059669,#34D399)' : 'linear-gradient(90deg,#2563EB,#60A5FA)',
                          transition:'width 0.9s cubic-bezier(.4,0,.2,1)'
                        }}/>
                      </div>
                      <span style={{ fontSize:'10.5px', fontWeight:700, color:done?DS.emerald:DS.sapphire, minWidth:'28px', textAlign:'right' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { if(onSelectSite) onSelectSite(site); onNavigate('qr-scanner'); }}
                    style={{
                      height:'30px', padding:'0 12px', borderRadius:'7px', flexShrink:0,
                      display:'flex', alignItems:'center', gap:'4px',
                      background:'linear-gradient(135deg,#1E3A8A,#2563EB)',
                      color:'#FFF', fontSize:'11.5px', fontWeight:700,
                      border:'none', cursor:'pointer',
                      boxShadow:'0 2px 6px rgba(37,99,235,.35)',
                      transition:'all 0.18s ease'
                    }}>
                    Inspect <ChevronRight size={11}/>
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right – Live Activity Feed */}
        <Card>
          <SectionHead
            icon={Activity}
            iconBg="linear-gradient(135deg,#059669,#10B981)"
            title="Live Field Activity Stream"
            sub="Real-time inspection dispatch feed"
            right={
              <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:600, color:DS.emerald }}>
                <LiveDot color={DS.emerald}/> Live
              </span>
            }
          />
          <div style={{ display:'flex', flexDirection:'column' }}>
            {[
              { color:DS.emerald, icon:Check,       title:'POS-AIL-001 Cylinder Replaced',      desc:'Permanent QR QR-POS-AIL-001 retained. Replacement IFS-2023-ABC-9901 linked.', time:'15 min ago · Ramesh Patel' },
              { color:DS.sapphire,icon:ShieldCheck, title:'CL-11 Hydro Test Passed (35 Bar)',    desc:'POS-AIL-002 tested 3 mins. Zero pressure drop or body distortion observed.',  time:'45 min ago · SOP/011 compliant' },
              { color:DS.amber,   icon:AlertCircle, title:'Defect Flagged: Hose Box Gland',      desc:'POS-ATL-003 minor leak identified. Photo evidence recorded; spare requisitioned.', time:'1 hr ago · Atul Ltd Site' },
              { color:DS.emerald, icon:FileCheck,   title:'Client Sign-Off Completed',            desc:'Dual technician & plant safety officer digital signature recorded.',          time:'2 hr ago · Rajesh Mehta' },
              { color:DS.violet,  icon:QrCode,      title:'Bulk QR Labels Generated',             desc:'50 permanent QR anchors generated for Deepak Nitrite Unit. Registry updated.', time:'3 hr ago · System' },
            ].map((ev, i, arr) => {
              const Icon = ev.icon;
              return (
                <div key={i} style={{
                  display:'flex', gap:'11px',
                  paddingBottom: i < arr.length-1 ? '13px' : 0,
                  marginBottom:  i < arr.length-1 ? '13px' : 0,
                  borderBottom:  i < arr.length-1 ? `1px dashed ${DS.border}` : 'none'
                }}>
                  <div style={{
                    width:'30px', height:'30px', borderRadius:'8px', flexShrink:0,
                    backgroundColor:`${ev.color}18`, border:`1px solid ${ev.color}30`,
                    display:'flex', alignItems:'center', justifyContent:'center'
                  }}>
                    <Icon size={14} color={ev.color}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'12.5px', fontWeight:700, color:DS.textPrimary, marginBottom:'2px' }}>{ev.title}</div>
                    <div style={{ fontSize:'11.5px', color:DS.textSec, lineHeight:1.5, marginBottom:'3px' }}>{ev.desc}</div>
                    <div style={{ fontSize:'10.5px', color:DS.textMuted }}>{ev.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
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

    </div>
  );
}
