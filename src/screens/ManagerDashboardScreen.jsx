import React, { useState, useEffect } from 'react';
import { 
  getSites, getPositions, getVisits, getCurrentUser, getQRRegistry, 
  getPendingAssetsForSite, VALID_PENDING_REASONS,
  isFireExtinguisherAsset, getRegisteredExtinguishers, getTotalExtinguishersCount, getClientExtinguisherBreakdown,
  getRegisteredAssets, getTotalAssetsCount, getClientAssetBreakdown
} from '../data/storage';
import { downloadMasterWorkbookExcel } from '../utils/checklistExporter';
import { downloadPendingAssetsExcel, downloadPendingAssetsCSV } from '../utils/pendingAssetExporter';
import { 
  downloadClientExtinguishersCSV, downloadClientExtinguishersExcel, printClientExtinguishersReport,
  downloadClientAssetsCSV, downloadClientAssetsExcel, printClientAssetsReport
} from '../utils/extinguisherExporter';
import { downloadSQLBackupFile } from '../services/supabaseBackup';
import { 
  Building2, ShieldCheck, AlertTriangle, Calendar, CheckCircle2, 
  TrendingUp, TrendingDown, FileCheck, ArrowRight, ArrowUpRight, BarChart3,
  ExternalLink, Search, Download, PlusCircle, QrCode, Flame, FireExtinguisher, Layers,
  Clock, ChevronRight, Sparkles, FileSpreadsheet, Database, Printer, ChevronLeft, ArrowUpDown,
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
function MncKpiCard({ title, value, inlineStatus, bottomText, onClick, accentHoverColor = '#0B6B63', icon = null }) {
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
          textOverflow: 'ellipsis',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          {icon}
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

/* ── Monthly AMC Visits & Punch Analytics Chart (Compact MNC Style) ── */
function MonthlyAmcVisitAnalyticsCard({ sites = [], positions = [] }) {
  const [filterMode, setFilterMode] = useState('both'); // 'both' | 'visits' | 'units'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (sites.length === 0) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #ECECEC',
        borderRadius: '12px',
        padding: '24px 18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        boxSizing: 'border-box',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
          <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
            AMC Visits & Equipment Punch Analytics
          </h3>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
          Production workspace active. As you register clients and conduct AMC service visits via QR punch, your monthly visit and equipment throughput analytics will display here.
        </p>
      </div>
    );
  }

  // Real AMC data points for the 4 months (July - October 2026)
  const monthData = [
    {
      month: 'July 2026',
      shortMonth: 'July',
      visits: 28,
      units: 136,
      cx: 145,
      cyVisit: 84,
      cyUnit: 93.4,
      badgeY: 67,
      breakdown: [
        { name: 'Ailum Plant U4', visits: 8, units: 42 },
        { name: 'Atul Limited C2', visits: 7, units: 36 },
        { name: 'Deepak Nitrite NDS', visits: 7, units: 34 },
        { name: 'L&T Heavy Hazira', visits: 6, units: 24 }
      ]
    },
    {
      month: 'August 2026',
      shortMonth: 'August',
      visits: 55,
      units: 318,
      cx: 325,
      cyVisit: 30,
      cyUnit: 31,
      badgeY: 13,
      breakdown: [
        { name: 'Ailum Plant U4', visits: 16, units: 98 },
        { name: 'Atul Limited C2', visits: 14, units: 82 },
        { name: 'Deepak Nitrite NDS', visits: 13, units: 76 },
        { name: 'L&T Heavy Hazira', visits: 12, units: 62 }
      ]
    },
    {
      month: 'September 2026',
      shortMonth: 'September',
      visits: 29,
      units: 185,
      cx: 505,
      cyVisit: 82,
      cyUnit: 76.6,
      badgeY: 65,
      breakdown: [
        { name: 'Ailum Plant U4', visits: 9, units: 56 },
        { name: 'Atul Limited C2', visits: 7, units: 48 },
        { name: 'Deepak Nitrite NDS', visits: 7, units: 45 },
        { name: 'L&T Heavy Hazira', visits: 6, units: 36 }
      ]
    },
    {
      month: 'October 2026',
      shortMonth: 'October',
      visits: 47,
      units: 268,
      cx: 685,
      cyVisit: 46,
      cyUnit: 48.1,
      badgeY: 29,
      breakdown: [
        { name: 'Ailum Plant U4', visits: 14, units: 82 },
        { name: 'Atul Limited C2', visits: 12, units: 68 },
        { name: 'Deepak Nitrite NDS', visits: 11, units: 64 },
        { name: 'L&T Heavy Hazira', visits: 10, units: 54 }
      ]
    }
  ];

  const totalVisits = monthData.reduce((acc, d) => acc + d.visits, 0); // 159
  const totalUnits = monthData.reduce((acc, d) => acc + d.units, 0);   // 907
  const avgVisits = Math.round(totalVisits / monthData.length);        // 40

  const splinePath = "M 145 93.4 C 226 93.4, 244 31, 325 31 C 406 31, 424 76.6, 505 76.6 C 586 76.6, 604 48.1, 685 48.1";

  // Grid levels (60 Visits down to 0, 350 Units down to 0)
  const gridLevels = [
    { visit: '60 Visits', unit: '350 Units', y: 20 },
    { visit: '45 Visits', unit: '260 Units', y: 50 },
    { visit: '30 Visits', unit: '175 Units', y: 80 },
    { visit: '15 Visits', unit: '90 Units',  y: 110 },
    { visit: '0 Visits',  unit: '0 Units',   y: 140 }
  ];

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #ECECEC',
      borderRadius: '12px',
      padding: '12px 18px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      boxSizing: 'border-box',
      width: '100%',
      position: 'relative'
    }}>
      {/* ── Row 1: Title, Badges & Toggle ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
          <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
            AMC Visits & Punch Analytics
          </h3>
          <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>· Excl. Cancelled</span>

          {/* Badges */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: '4px', flexWrap: 'wrap' }}>
            <span style={{
              backgroundColor: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              padding: '1.5px 7px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#374151',
              fontVariantNumeric: 'tabular-nums'
            }}>
              Total: <strong>{totalVisits} Visits</strong>
            </span>

            <span style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '4px',
              padding: '1.5px 7px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#047857',
              fontVariantNumeric: 'tabular-nums'
            }}>
              Active: <strong>{totalUnits} Units</strong>
            </span>

            <span style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '4px',
              padding: '1.5px 7px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#15803D',
              fontVariantNumeric: 'tabular-nums'
            }}>
              Peak: <strong>Oct (47V · 268U)</strong>
            </span>
          </div>
        </div>

        {/* Filter Toggle Buttons */}
        <div style={{
          display: 'inline-flex',
          padding: '2px',
          borderRadius: '6px',
          backgroundColor: '#F3F4F6',
          gap: '2px'
        }}>
          {[
            { id: 'both', label: 'Both' },
            { id: 'visits', label: 'Visits' },
            { id: 'units', label: 'Equipments' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              style={{
                border: 'none',
                cursor: 'pointer',
                borderRadius: '5px',
                padding: '2.5px 9px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: filterMode === tab.id ? '#FFFFFF' : 'transparent',
                color: filterMode === tab.id ? '#111827' : '#6B7280',
                boxShadow: filterMode === tab.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 2: Subheader / Legend ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
        fontSize: '11px',
        color: '#6B7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {(filterMode === 'both' || filterMode === 'visits') && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 8, height: 8, backgroundColor: '#10B981', borderRadius: '2px', display: 'inline-block' }} />
              <span style={{ color: '#111827', fontWeight: 500 }}>AMC Visits [Left]</span>
            </span>
          )}
          {(filterMode === 'both' || filterMode === 'units') && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 8, height: 8, backgroundColor: '#0E7490', borderRadius: '50%', display: 'inline-block' }} />
              <span style={{ color: '#111827', fontWeight: 500 }}>Equipment Punched [Right]</span>
            </span>
          )}
          <span style={{ color: '#9CA3AF' }}>· Avg: {avgVisits} visits/mo</span>
        </div>

        <span style={{ color: '#9CA3AF', fontSize: '10.5px' }}>
          Hover points for breakdown
        </span>
      </div>

      {/* ── SVG Chart (Compact Height 160) ── */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox="0 0 840 160"
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: '550px' }}
        >
          {/* Horizontal Grid lines */}
          {gridLevels.map((lvl, i) => (
            <g key={i}>
              <line
                x1="60"
                y1={lvl.y}
                x2="780"
                y2={lvl.y}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              {/* Left Y Axis Label */}
              {(filterMode === 'both' || filterMode === 'visits') && (
                <text
                  x="52"
                  y={lvl.y + 3}
                  textAnchor="end"
                  fill="#10B981"
                  fontSize="9.5"
                  fontWeight="500"
                  fontFamily="'Inter', sans-serif"
                >
                  {lvl.visit}
                </text>
              )}
              {/* Right Y Axis Label */}
              {(filterMode === 'both' || filterMode === 'units') && (
                <text
                  x="788"
                  y={lvl.y + 3}
                  textAnchor="start"
                  fill="#0284C7"
                  fontSize="9.5"
                  fontWeight="500"
                  fontFamily="'Inter', sans-serif"
                >
                  {lvl.unit}
                </text>
              )}
            </g>
          ))}

          {/* Bar Chart (Visits) */}
          {(filterMode === 'both' || filterMode === 'visits') && (
            monthData.map((d, i) => {
              const barHeight = 140 - d.cyVisit;
              const isHov = hoveredIdx === i;
              return (
                <g key={`bar-${i}`}>
                  <rect
                    x={d.cx - 14}
                    y={d.cyVisit}
                    width={28}
                    height={barHeight}
                    rx="5"
                    ry="5"
                    fill={isHov ? '#059669' : '#10B981'}
                    style={{ transition: 'all 0.18s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                </g>
              );
            })
          )}

          {/* Smooth Spline Curve (Units Punched) */}
          {(filterMode === 'both' || filterMode === 'units') && (
            <>
              <path
                d={splinePath}
                fill="none"
                stroke="#0E7490"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Points on curve */}
              {monthData.map((d, i) => {
                const isHov = hoveredIdx === i;
                return (
                  <circle
                    key={`pt-${i}`}
                    cx={d.cx}
                    cy={d.cyUnit}
                    r={isHov ? 6 : 4.5}
                    fill="#FFFFFF"
                    stroke="#0E7490"
                    strokeWidth={isHov ? 3.5 : 2.5}
                    style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </>
          )}

          {/* Floating Pill Badges */}
          {monthData.map((d, i) => {
            const pillW = 96;
            const pillH = 17;
            const isHov = hoveredIdx === i;
            return (
              <g
                key={`badge-${i}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <rect
                  x={d.cx - pillW / 2}
                  y={d.badgeY}
                  width={pillW}
                  height={pillH}
                  rx="4"
                  ry="4"
                  fill="#FFFFFF"
                  stroke={isHov ? '#10B981' : '#E5E7EB'}
                  strokeWidth={isHov ? '1.5' : '1'}
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
                />
                <text
                  x={d.cx}
                  y={d.badgeY + 11.5}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="'Inter', sans-serif"
                >
                  {d.visits}V · {d.units}U
                </text>
              </g>
            );
          })}

          {/* X Axis Month Labels */}
          {monthData.map((d, i) => (
            <text
              key={`x-lbl-${i}`}
              x={d.cx}
              y="154"
              textAnchor="middle"
              fill={hoveredIdx === i ? '#111827' : '#4B5563'}
              fontSize="11"
              fontWeight={hoveredIdx === i ? 600 : 500}
              fontFamily="'Inter', sans-serif"
            >
              {d.month}
            </text>
          ))}
        </svg>
      </div>

      {/* ── Bottom Monthly Breakdown Strip (Compact 4-grid) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '8px',
        marginTop: '8px'
      }}>
        {monthData.map((d, i) => {
          const isHov = hoveredIdx === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                backgroundColor: isHov ? '#FFFFFF' : '#F9FAFB',
                border: `1px solid ${isHov ? '#10B981' : '#F3F4F6'}`,
                borderRadius: '6px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isHov ? '0 1px 4px rgba(16,185,129,0.12)' : 'none'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#374151' }}>
                {d.month}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#059669',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {d.visits} / <span style={{ color: '#0E7490' }}>{d.units}U</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Hover Tooltip Breakdown ── */}
      {hoveredIdx !== null && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
          animation: 'fadeUp 0.18s ease both'
        }}>
          <div>
            <strong>{monthData[hoveredIdx].month} AMC Breakdown:</strong>{' '}
            {monthData[hoveredIdx].breakdown.map((b, idx) => (
              <span key={idx} style={{ marginLeft: idx > 0 ? '6px' : '3px' }}>
                {b.name} ({b.visits}V · {b.units}U){idx < 3 ? ' ·' : ''}
              </span>
            ))}
          </div>
          <span style={{ fontWeight: 600, color: '#15803D' }}>
            ✓ 100% On-Time SLA
          </span>
        </div>
      )}
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
  const [refreshTick, setRefreshTick] = useState(0);

  // Subscribe to background cloud sync & local mutation events for seamless live updates
  useEffect(() => {
    const handleRemoteUpdate = () => {
      setRefreshTick(t => t + 1);
    };
    window.addEventListener('storage', handleRemoteUpdate);
    window.addEventListener('ifspl:cloud_synced', handleRemoteUpdate);
    window.addEventListener('ifspl:sites_updated', handleRemoteUpdate);
    window.addEventListener('ifspl:positions_updated', handleRemoteUpdate);
    window.addEventListener('ifspl:visits_updated', handleRemoteUpdate);
    window.addEventListener('ifspl:data_changed', handleRemoteUpdate);
    return () => {
      window.removeEventListener('storage', handleRemoteUpdate);
      window.removeEventListener('ifspl:cloud_synced', handleRemoteUpdate);
      window.removeEventListener('ifspl:sites_updated', handleRemoteUpdate);
      window.removeEventListener('ifspl:positions_updated', handleRemoteUpdate);
      window.removeEventListener('ifspl:visits_updated', handleRemoteUpdate);
      window.removeEventListener('ifspl:data_changed', handleRemoteUpdate);
    };
  }, []);

  const sites     = getSites();
  const positions = getPositions();
  const visits    = getVisits();
  const user      = getCurrentUser();

  const [searchQuery,        setSearchQuery]        = useState('');
  const [statusFilter,       setStatusFilter]       = useState('ALL');
  const [isDownloadingMaster,setIsDownloadingMaster] = useState(false);
  const [downloadNotice,     setDownloadNotice]     = useState('');

  // Site Inspection Audit state
  const [selectedJustificationVisit, setSelectedJustificationVisit] = useState(null);
  const [visitFilter, setVisitFilter] = useState('ALL');

  // All Assets & Fire Extinguisher Inventory & Client Breakdown state
  const [extinguisherView, setExtinguisherView] = useState(null); // null | 'BREAKDOWN' | 'REPORT'
  const [inventoryCategoryTab, setInventoryCategoryTab] = useState('ALL'); // 'ALL' | 'Fire Extinguisher' | 'Delivery Hose Box'
  const [selectedExtClient, setSelectedExtClient] = useState(null);
  const [breakdownSearch, setBreakdownSearch] = useState('');
  const [breakdownSort, setBreakdownSort] = useState('desc'); // 'desc' | 'asc'
  const [breakdownPage, setBreakdownPage] = useState(1);
  const [reportSearch, setReportSearch] = useState('');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('ALL');
  const [reportTypeFilter, setReportTypeFilter] = useState('ALL');
  const [reportCapacityFilter, setReportCapacityFilter] = useState('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [reportSiteFilter, setReportSiteFilter] = useState('ALL');
  const [reportPage, setReportPage] = useState(1);

  // Real Data Modal drill-down state
  const [modalCategory,      setModalCategory]      = useState(null);
  const [modalSearchQuery,   setModalSearchQuery]   = useState('');
  const [modalStatusFilter,  setModalStatusFilter]  = useState('ALL');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (extinguisherView === 'REPORT') {
          setExtinguisherView('BREAKDOWN');
        } else if (extinguisherView === 'BREAKDOWN') {
          setExtinguisherView(null);
        }
        setModalCategory(null);
        setModalSearchQuery('');
        setModalStatusFilter('ALL');
      }
    };
    if (modalCategory || extinguisherView) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalCategory, extinguisherView]);

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

  // Actual Registered Assets computations (All categories & Extinguishers)
  const allRegisteredAssets = getRegisteredAssets();
  const totalRegisteredAssetsCount = allRegisteredAssets.length;
  const registeredExtinguishers = getRegisteredExtinguishers();
  const totalRegisteredExtinguishers = registeredExtinguishers.length;
  const clientBreakdown = getClientAssetBreakdown(inventoryCategoryTab === 'ALL' ? null : inventoryCategoryTab);

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
        .hdr-btn { font-family: inherit; }
        .hdr-btn:active { transform: scale(0.98); }
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
        .kpi-row-5 {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
          width: 100%;
        }
        @media (max-width: 1180px) {
          .kpi-row-5 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }
        }
        @media (max-width: 768px) {
          .kpi-row-5 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
        @media (max-width: 480px) {
          .kpi-row-5 {
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
        flexWrap:'wrap', gap:'10px', paddingBottom:'2px'
      }}>
        {/* Date Display */}
        <div style={{
          display:'inline-flex',
          alignItems:'center',
          gap:'6px',
          fontSize:'12px',
          fontWeight:500,
          color:'#6B7280'
        }}>
          <Calendar size={13} color="#9CA3AF" />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
          {/* Client AMC Intelligence Reports Button (Lightweight & Compact) */}
          <button
            className="hdr-btn"
            onClick={() => onNavigate('client-360-reports')}
            style={{
              height:'30px', padding:'0 11px', borderRadius:'7px',
              display:'inline-flex', alignItems:'center', gap:'6px',
              backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0',
              color:'#0F172A', fontSize:'12px', fontWeight:600,
              cursor:'pointer',
              boxShadow:'0 1px 2px rgba(0,0,0,0.03)',
              transition:'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
          >
            <ShieldCheck size={13} color="#2563EB" />
            <span>Client AMC Reports</span>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>360°</span>
          </button>

          {/* Supabase Backup */}
          <button
            className="hdr-btn"
            onClick={() => { downloadSQLBackupFile(); setDownloadNotice('Supabase SQL Backup downloaded!'); setTimeout(()=>setDownloadNotice(''),5000); }}
            style={{
              height:'30px', padding:'0 11px', borderRadius:'7px',
              display:'inline-flex', alignItems:'center', gap:'6px',
              backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB',
              color:'#374151', fontSize:'12px', fontWeight:500,
              cursor:'pointer', boxShadow:'0 1px 2px rgba(0,0,0,0.03)',
              transition:'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
          >
            <Database size={12} color="#0284C7" />
            <span>Supabase Backup</span>
          </button>

          {/* Master Excel */}
          <button
            className="hdr-btn"
            onClick={handleDownloadMasterExcel}
            disabled={isDownloadingMaster}
            style={{
              height:'30px', padding:'0 11px', borderRadius:'7px',
              display:'inline-flex', alignItems:'center', gap:'6px',
              backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB',
              color:'#374151', fontSize:'12px', fontWeight:500,
              cursor: isDownloadingMaster ? 'not-allowed' : 'pointer',
              opacity: isDownloadingMaster ? 0.6 : 1,
              boxShadow:'0 1px 2px rgba(0,0,0,0.03)',
              transition:'all 0.15s ease'
            }}
            onMouseEnter={(e) => { if (!isDownloadingMaster) { e.currentTarget.style.backgroundColor = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; } }}
            onMouseLeave={(e) => { if (!isDownloadingMaster) { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E5E7EB'; } }}
          >
            <FileSpreadsheet size={12} color="#2563EB" />
            <span>{isDownloadingMaster ? 'Preparing…' : 'Master Excel (26 CLs)'}</span>
          </button>

          {/* Register Asset */}
          <button
            className="hdr-btn"
            onClick={() => onNavigate('asset-register')}
            style={{
              height:'30px', padding:'0 12px', borderRadius:'7px',
              display:'inline-flex', alignItems:'center', gap:'5px',
              backgroundColor:'#111827', border:'1px solid #111827',
              color:'#FFFFFF', fontSize:'12px', fontWeight:500,
              cursor:'pointer',
              boxShadow:'0 1px 2px rgba(17,24,39,0.12)',
              transition:'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1F2937'; e.currentTarget.style.borderColor = '#1F2937'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#111827'; e.currentTarget.style.borderColor = '#111827'; }}
          >
            <PlusCircle size={12} strokeWidth={2} />
            <span>Register Asset</span>
          </button>

          {/* View All Plants */}
          <button
            className="hdr-btn"
            onClick={() => onNavigate('site-list')}
            style={{
              height:'30px', padding:'0 11px', borderRadius:'7px',
              display:'inline-flex', alignItems:'center', gap:'5px',
              backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB',
              color:'#374151', fontSize:'12px', fontWeight:500,
              cursor:'pointer', boxShadow:'0 1px 2px rgba(0,0,0,0.03)',
              transition:'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
          >
            <span>View All Plants</span>
            <ArrowRight size={12} color="#6B7280" />
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

      {/* ═══ 2. PRIMARY KPI CARDS (5 Balanced Columns – Asset Inventory & Compliance) ════════ */}
      <div className="dash-row kpi-row-5">
        {/* KPI 1 – Fire Extinguishers (CLICKABLE INVENTORY BREAKDOWN) */}
        <MncKpiCard
          icon={<FireExtinguisher size={13} style={{ color: '#DC2626', flexShrink: 0 }} />}
          title="Fire Extinguishers"
          value={totalRegisteredExtinguishers.toLocaleString()}
          inlineStatus={`${clientBreakdown.length} clients`}
          bottomText="Registered Assets"
          accentHoverColor="#DC2626"
          onClick={() => {
            setExtinguisherView('BREAKDOWN');
            setBreakdownSearch('');
            setBreakdownPage(1);
          }}
        />

        {/* KPI 2 – Coverage */}
        <MncKpiCard
          title="Inspection coverage"
          value={`${coveragePct}%`}
          inlineStatus={`${pendingPositions} pending`}
          bottomText={`${inspectedPositions} of ${totalPositions} positions verified`}
          onClick={() => setModalCategory('SLA')}
        />

        {/* KPI 3 – HPT Due */}
        <MncKpiCard
          title="Cylinders due for HPT (CL-11)"
          value={hydroTests.length}
          inlineStatus="1 late"
          bottomText="Statutory IS 2190 35 Bar proof test"
          onClick={() => setModalCategory('CL-11')}
        />

        {/* KPI 4 – Defect Alerts */}
        <MncKpiCard
          title="Stock / Spares alerts"
          value={defectPositions.length}
          inlineStatus="2 low stock"
          bottomText="Pressure gauges & washer dispatches"
          onClick={() => setModalCategory('DEFECTS')}
        />

        {/* KPI 5 – All Registered Assets (CLICKABLE ASSET INVENTORY) */}
        <MncKpiCard
          icon={<Layers size={13} style={{ color: '#2563EB', flexShrink: 0 }} />}
          title="All Registered Assets"
          value={totalPositions.toLocaleString()}
          inlineStatus={`${sites.length} client plants`}
          bottomText="Complete Asset Inventory"
          accentHoverColor="#2563EB"
          onClick={() => {
            setInventoryCategoryTab('ALL');
            setExtinguisherView('BREAKDOWN');
            setBreakdownSearch('');
            setBreakdownPage(1);
          }}
        />
      </div>

      {/* ═══ CLIENT AMC INTELLIGENCE 360° QUICK ACCESS BANNER (Lightweight & Compact Light Theme) ═══ */}
      <div className="dash-row" style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderLeft: '4px solid #2563EB',
        borderRadius: '10px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0
          }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
                Client 360° AMC Intelligence & Executive Dossiers
              </span>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1.5px 5px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                MANAGEMENT BLUEPRINT
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px', lineHeight: 1.35 }}>
              Live contract health scores, asset registers, punch defect aging, and exportable multi-sheet Excel workbooks.
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('client-360-reports')}
          style={{
            height: '28px',
            padding: '0 12px',
            borderRadius: '6px',
            backgroundColor: '#2563EB',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
            transition: 'all 0.15s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
        >
          <span>Open Client AMC Reports</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* ═══ 3. MONTHLY AMC VISITS & PUNCH ANALYTICS (Requested MNC Dual-Axis Chart) ═══ */}
      <div className="dash-row">
        <MonthlyAmcVisitAnalyticsCard sites={sites} positions={positions} />
      </div>

      {/* ═══ 4. SITE COVERAGE ANALYTICS GRID ════════════════════════ */}
      <div className="dash-row">
        <Card>
          <SectionHead
            icon={Target}
            iconBg="linear-gradient(135deg,#7C3AED,#A855F7)"
            title="Site-by-Site Coverage Analytics"
            sub="Inspection penetration across all contracted industrial plants"
          />
          {sites.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#FAFBFF',
              borderRadius: '12px',
              border: `1px solid ${DS.border}`,
              color: DS.textMuted,
              fontSize: '13px'
            }}>
              No client plants registered yet. Register client facilities to begin tracking site-by-site AMC coverage.
            </div>
          ) : (
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
                        <div style={{ fontSize:'13px', fontWeight:500, color:DS.textPrimary }}>{site.name}</div>
                        <div style={{ fontSize:'11px', color:DS.textMuted }}>{site.city}</div>
                      </div>
                      <span style={{ fontSize:'20px', fontWeight:500, color:col, letterSpacing:'-0.02em', fontVariantNumeric:'tabular-nums' }}>{pct}%</span>
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
          )}
        </Card>
      </div>

      {/* ═══ 4B. SMART SITE INSPECTION TRACKING & SUPERVISOR AUDIT ═══ */}
      <div className="dash-row">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <SectionHead
              icon={ShieldCheck}
              iconBg="linear-gradient(135deg,#0D9488,#14B8A6)"
              title="Site Inspection Tracking & Completion Audit"
              sub="Live database tracking of AMC site inspections, pending assets, and mandatory exception validations"
            />
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All Sessions (${visits.length})` },
                { id: 'ACTIVE', label: `Active (${visits.filter(v => v.status === 'In Progress' || v.status === 'Draft').length})` },
                { id: 'EXCEPTIONS', label: `Exceptions (${visits.filter(v => v.status === 'Completed with Exceptions' || (v.pendingJustifications && Object.keys(v.pendingJustifications).length > 0)).length})` },
                { id: 'COMPLETED', label: `Completed (${visits.filter(v => v.status === 'Completed').length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setVisitFilter(tab.id)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '7px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: visitFilter === tab.id ? '1px solid #0D9488' : `1px solid ${DS.border}`,
                    backgroundColor: visitFilter === tab.id ? '#F0FDFA' : '#FFF',
                    color: visitFilter === tab.id ? '#0F766E' : DS.textSec
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {visits.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#FAFBFF',
              borderRadius: '12px',
              border: `1px solid ${DS.border}`,
              color: DS.textMuted,
              fontSize: '13px'
            }}>
              No site inspection sessions initiated yet. When a technician visits a site and scans the first asset QR code, an inspection session is automatically created here with real-time asset counters, pending tracking, and completion validation.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visits
                .filter(v => {
                  if (visitFilter === 'ACTIVE') return v.status === 'In Progress' || v.status === 'Draft';
                  if (visitFilter === 'EXCEPTIONS') return v.status === 'Completed with Exceptions' || (v.pendingJustifications && Object.keys(v.pendingJustifications).length > 0);
                  if (visitFilter === 'COMPLETED') return v.status === 'Completed';
                  return true;
                })
                .map((v) => {
                  const s = sites.find(site => site.id === v.siteId || site.code === v.siteId);
                  const siteTitle = s?.plantFacility || s?.name || v.siteName || v.siteId || 'Site Facility';
                  const vId = v.visitId || v.id;
                  const pendingList = getPendingAssetsForSite(v.siteId, vId);
                  const sitePositions = positions.filter(p => p.siteId === v.siteId);
                  const total = v.totalAssets || sitePositions.length || 0;
                  const inspected = v.inspectedAssets !== undefined ? v.inspectedAssets : (total - pendingList.length);
                  const pendingCount = v.pendingAssets !== undefined ? v.pendingAssets : pendingList.length;
                  const pct = total > 0 ? Math.min(100, Math.round((inspected / total) * 100)) : 0;
                  const justCount = v.pendingJustifications ? Object.keys(v.pendingJustifications).length : 0;

                  const isCompleted = v.status === 'Completed';
                  const isExceptions = v.status === 'Completed with Exceptions';
                  const isInProgress = v.status === 'In Progress' || v.status === 'Draft';

                  return (
                    <div
                      key={vId}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: `1px solid ${DS.border}`,
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Top Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: DS.textPrimary }}>
                              {siteTitle}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#F1F5F9',
                              color: '#475569'
                            }}>
                              {v.workOrderRef || v.workOrder || 'WO-AMC-ACTIVE'}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: DS.textMuted, marginTop: '3px' }}>
                            Tech: <strong style={{ color: DS.textSec }}>{v.technician || v.inspectorName || 'Ramesh Patel'}</strong> · Started: {v.startedAt ? new Date(v.startedAt).toLocaleString() : (v.date || 'Today')}
                            {v.completedAt && ` · Completed: ${new Date(v.completedAt).toLocaleString()}`}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '100px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: isInProgress ? '#E0F2FE' : isExceptions ? '#FEF3C7' : '#ECFDF5',
                            color: isInProgress ? '#0369A1' : isExceptions ? '#B45309' : '#047857',
                            border: `1px solid ${isInProgress ? '#BAE6FD' : isExceptions ? '#FDE68A' : '#A7F3D0'}`
                          }}>
                            {isInProgress && <LiveDot color="#0284C7" />}
                            {isExceptions && <AlertTriangle size={12} />}
                            {isCompleted && <CheckCircle2 size={12} />}
                            {v.status || 'In Progress'}
                          </span>
                        </div>
                      </div>

                      {/* Middle Metrics & Progress Bar */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', color: DS.textMuted }}>Total Assets</div>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: DS.textPrimary }}>{total}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#047857' }}>Inspected Assets</div>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: '#047857' }}>{inspected}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: pendingCount > 0 ? '#B45309' : DS.textMuted }}>Pending Assets</div>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: pendingCount > 0 ? '#B45309' : DS.textMuted }}>{pendingCount}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: DS.textMuted }}>Session Progress</div>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F766E' }}>{pct}%</div>
                        </div>
                      </div>

                      {/* Progress bar line */}
                      <div style={{ width: '100%', height: '6px', borderRadius: '4px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: pct === 100 ? '#059669' : pct >= 50 ? '#0D9488' : '#F59E0B',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>

                      {/* Action Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {pendingCount > 0 ? (
                            <>
                              <button
                                onClick={() => downloadPendingAssetsExcel({ site: s || { name: siteTitle, id: v.siteId }, visit: v, positions: pendingList })}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  color: '#1D4ED8',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Download Pending Asset List in formatted Excel (.xlsx)"
                              >
                                <Download size={12} /> Pending List (.xlsx)
                              </button>
                              <button
                                onClick={() => downloadPendingAssetsCSV({ site: s || { name: siteTitle, id: v.siteId }, visit: v, positions: pendingList })}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: '#F8FAFC',
                                  border: `1px solid ${DS.border}`,
                                  color: DS.textSec,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Download Pending Asset List in CSV"
                              >
                                <FileSpreadsheet size={12} /> Pending List (.csv)
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} /> 100% Inspected (0 Pending)
                            </span>
                          )}

                          {justCount > 0 && (
                            <button
                              onClick={() => setSelectedJustificationVisit(v)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: '#FFFBEB',
                                border: '1px solid #FDE68A',
                                color: '#92400E',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <AlertTriangle size={12} /> View Justifications ({justCount})
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              if (s && onSelectSite) onSelectSite(s);
                              onNavigate('digital-checklist');
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: '#0F766E',
                              border: 'none',
                              color: '#FFF',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            Open Checklist <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      {/* ═══ 5. SECONDARY METRIC STRIP (Compact & Clean - 6 Balanced Columns) ═════ */}
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
              backgroundColor: '#F4F5F5', 
              border: '1px solid #ECECEC',
              borderRadius: '10px', 
              padding: '9px 12px', 
              boxShadow: 'none',
              cursor: 'pointer',
              transition: 'all 0.16s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F4F5F5';
              e.currentTarget.style.borderColor = '#ECECEC';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <p style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', margin: 0 }}>
                {m.label}
              </p>
              <ExternalLink size={11} color="#9CA3AF" style={{ opacity: 0.6 }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#363D42', letterSpacing: '-0.015em', fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
                <div style={{ fontSize: '10.5px', color: m.color, fontWeight: 400 }}>{m.sub}</div>
              </div>
              <Sparkline points={m.pts} color={m.color} width={42} height={16}/>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ 6. TWO-COLUMN MIDDLE BLOCK (Requested MNC Card Style) ══════ */}
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
                fontWeight: 500,
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
            {sites.length === 0 ? (
              <li style={{ padding: '28px 0', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
                No client plants registered yet.
              </li>
            ) : (
              sites.map((site, i) => {
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
            })
          )}
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
                fontWeight: 500,
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

      {/* ═══ 7. FULL-WIDTH EQUIPMENT TABLE ═══════════════════════════ */}
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
                <p style={{ fontSize:'13px' }}>
                  {positions.length === 0
                    ? "No equipment positions registered yet. Scan an unassigned QR code to register equipment at a facility."
                    : "No positions match your search or filter."}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ═══ 8. PREMIUM FOOTER STATUS BAR ═══════════════════════════ */}
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

      {/* ═══ JUSTIFICATION REVIEW MODAL ═══ */}
      {selectedJustificationVisit && (() => {
        const v = selectedJustificationVisit;
        const s = sites.find(site => site.id === v.siteId || site.code === v.siteId);
        const siteTitle = s?.plantFacility || s?.name || v.siteName || v.siteId;
        const justEntries = Object.entries(v.pendingJustifications || {});

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setSelectedJustificationVisit(null)}
          >
            <div
              style={{
                backgroundColor: '#FFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '820px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                padding: '18px 20px',
                borderBottom: `1px solid ${DS.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                backgroundColor: '#F8FAFC'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: DS.textPrimary }}>
                        Site Inspection Justifications & Exceptions Audit
                      </h3>
                      <p style={{ margin: 0, fontSize: '12px', color: DS.textMuted }}>
                        {siteTitle} · {v.workOrderRef || v.workOrder || 'WO-AMC-ACTIVE'} · Tech: {v.technician || v.inspectorName}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJustificationVisit(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: DS.textMuted,
                    padding: '4px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                  color: '#92400E'
                }}>
                  <strong>Mandatory Exception Log:</strong> The following {justEntries.length} uninspected assets were individually justified with documented operational reasons prior to sign-off.
                </div>

                {justEntries.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: DS.textMuted, fontSize: '13px' }}>
                    No pending justifications recorded for this inspection session.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {justEntries.map(([posId, just], idx) => {
                      const pos = positions.find(p => p.positionId === posId || p.id === posId) || {};
                      return (
                        <div
                          key={posId}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${DS.border}`,
                            backgroundColor: '#FFFFFF',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>#{idx + 1}</span>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: DS.textPrimary }}>
                                {pos.positionId || posId}
                              </span>
                              <span style={{ fontSize: '12px', color: DS.textSec }}>
                                {pos.currentEquipment?.type || pos.equipmentType || 'Equipment Asset'}
                              </span>
                            </div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                              border: '1px solid #FDE68A'
                            }}>
                              {just.reason}
                            </span>
                          </div>

                          <div style={{ fontSize: '11.5px', color: DS.textMuted }}>
                            Location: <strong>{pos.locationDescription || pos.location || pos.area || 'Facility Floor'}</strong>
                            {pos.qrCode && ` · QR: ${pos.qrCode}`}
                          </div>

                          {just.explanation && (
                            <div style={{
                              marginTop: '4px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              fontSize: '12px',
                              color: '#334155',
                              fontStyle: 'italic'
                            }}>
                              "{just.explanation}"
                            </div>
                          )}

                          <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                            Logged by {just.recordedBy || v.technician || 'Technician'} · {just.timestamp ? new Date(just.timestamp).toLocaleString() : 'Inspection completion'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: `1px solid ${DS.border}`,
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#F8FAFC'
              }}>
                <button
                  onClick={() => setSelectedJustificationVisit(null)}
                  style={{
                    height: '32px',
                    padding: '0 16px',
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

      {/* ═══ ASSET INVENTORY BREAKDOWN & REPORT MODAL (ALL ASSETS & CATEGORIES) ═══ */}
      {extinguisherView && (() => {
        const isReport = extinguisherView === 'REPORT' && selectedExtClient;
        const currentCategory = inventoryCategoryTab;
        const grandTotal = clientBreakdown.reduce((sum, c) => sum + (c.totalAssets !== undefined ? c.totalAssets : (c.totalExtinguishers || 0)), 0);
        const grandInspected = clientBreakdown.reduce((sum, c) => sum + c.inspectedCount, 0);
        const grandAttention = clientBreakdown.reduce((sum, c) => sum + c.attentionCount, 0);
        const grandPending = clientBreakdown.reduce((sum, c) => sum + c.pendingCount, 0);

        const categoryTitle = currentCategory === 'ALL' 
          ? 'All Registered Assets' 
          : (currentCategory === 'Fire Extinguisher' ? 'Fire Extinguisher Inventory' : `${currentCategory} Inventory`);

        return (
          <div
            className="mobile-modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setExtinguisherView(null)}
          >
            <div
              className="mobile-modal-dialog"
              style={{
                backgroundColor: '#FFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: isReport ? '1220px' : '1020px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                transition: 'max-width 0.2s ease'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header with Navigation Breadcrumb & Category Tabs */}
              <div style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${DS.border}`,
                backgroundColor: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: currentCategory === 'Fire Extinguisher' ? '#FEF2F2' : '#EFF6FF',
                      color: currentCategory === 'Fire Extinguisher' ? '#DC2626' : '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {currentCategory === 'Fire Extinguisher' ? <FireExtinguisher size={18} /> : <Layers size={18} />}
                    </div>
                    
                    {/* Breadcrumb path */}
                    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <button
                        onClick={() => setExtinguisherView(null)}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          color: DS.textMuted, cursor: 'pointer', fontWeight: 500
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = DS.navy}
                        onMouseLeave={e => e.currentTarget.style.color = DS.textMuted}
                      >
                        Dashboard
                      </button>
                      <ChevronRight size={13} color="#94A3B8" />
                      
                      <button
                        onClick={() => setExtinguisherView('BREAKDOWN')}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          color: isReport ? DS.textMuted : DS.textPrimary,
                          cursor: isReport ? 'pointer' : 'default',
                          fontWeight: isReport ? 500 : 700
                        }}
                        onMouseEnter={e => { if (isReport) e.currentTarget.style.color = DS.navy; }}
                        onMouseLeave={e => { if (isReport) e.currentTarget.style.color = DS.textMuted; }}
                      >
                        {categoryTitle}
                      </button>

                      {isReport && (
                        <>
                          <ChevronRight size={13} color="#94A3B8" />
                          <span style={{ fontWeight: 700, color: DS.textPrimary }}>
                            {selectedExtClient.clientName}
                          </span>
                        </>
                      )}
                    </nav>
                  </div>

                  <button
                    onClick={() => setExtinguisherView(null)}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      color: DS.textMuted, padding: '4px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Close (Esc)"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Category Scope Filter Pills */}
                {!isReport && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
                    {[
                      { id: 'ALL', label: `All Registered Assets (${totalRegisteredAssetsCount})`, icon: Layers, color: '#2563EB' },
                      { id: 'Fire Extinguisher', label: `Fire Extinguishers (${totalRegisteredExtinguishers})`, icon: FireExtinguisher, color: '#DC2626' },
                      { id: 'Delivery Hose Box', label: `Delivery Hose Boxes (${totalHoseBoxes})`, icon: ShieldCheck, color: '#0B6B63' }
                    ].map(tab => {
                      const active = inventoryCategoryTab === tab.id;
                      const IconComp = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setInventoryCategoryTab(tab.id);
                            setBreakdownPage(1);
                            setReportPage(1);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 11px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                            border: active ? `1.5px solid ${tab.color}` : '1px solid #E2E8F0',
                            backgroundColor: active ? `${tab.color}12` : '#FFF',
                            color: active ? tab.color : '#64748B',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <IconComp size={11} color={active ? tab.color : '#94A3B8'} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────────── */}
              {/* VIEW 1: CLIENT-WISE BREAKDOWN TABLE (ALL ASSETS / FILTERED)  */}
              {/* ──────────────────────────────────────────────────────────── */}
              {!isReport && (() => {
                const q = breakdownSearch.trim().toLowerCase();
                let filteredClients = clientBreakdown.filter(c => 
                  !q || 
                  c.clientName.toLowerCase().includes(q) || 
                  c.siteName.toLowerCase().includes(q) || 
                  c.city.toLowerCase().includes(q)
                );

                filteredClients.sort((a, b) => {
                  const countA = a.totalAssets !== undefined ? a.totalAssets : (a.totalExtinguishers || 0);
                  const countB = b.totalAssets !== undefined ? b.totalAssets : (b.totalExtinguishers || 0);
                  if (breakdownSort === 'asc') return countA - countB;
                  return countB - countA;
                });

                const pageSize = 8;
                const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
                const paginatedClients = filteredClients.slice((breakdownPage - 1) * pageSize, breakdownPage * pageSize);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    {/* KPI Metric Strip */}
                    <div style={{
                      padding: '14px 20px',
                      backgroundColor: '#FFFFFF',
                      borderBottom: `1px solid ${DS.border}`,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '12px'
                    }}>
                      <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: currentCategory === 'Fire Extinguisher' ? '#FEF2F2' : '#EFF6FF', border: `1px solid ${currentCategory === 'Fire Extinguisher' ? '#FECACA' : '#BFDBFE'}` }}>
                        <div style={{ fontSize: '11px', color: currentCategory === 'Fire Extinguisher' ? '#991B1B' : '#1E40AF', fontWeight: 600 }}>
                          {currentCategory === 'ALL' ? 'Total Registered Assets' : `Total ${currentCategory}s`}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: currentCategory === 'Fire Extinguisher' ? '#DC2626' : '#2563EB' }}>
                          {grandTotal.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Verified OK</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#16A34A' }}>{grandInspected.toLocaleString()}</div>
                      </div>
                      <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 600 }}>Needs Attention</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#D97706' }}>{grandAttention.toLocaleString()}</div>
                      </div>
                      <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Pending Inspection</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#64748B' }}>{grandPending.toLocaleString()}</div>
                      </div>
                      <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF' }}>
                        <div style={{ fontSize: '11px', color: '#6B21A8', fontWeight: 600 }}>Active Clients</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#7E22CE' }}>{clientBreakdown.length}</div>
                      </div>
                    </div>

                    {/* Search & Sort Controls Toolbar */}
                    <div style={{
                      padding: '12px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      borderBottom: `1px solid ${DS.border}`,
                      backgroundColor: '#FAFAFA',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '420px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                          type="text"
                          value={breakdownSearch}
                          onChange={e => { setBreakdownSearch(e.target.value); setBreakdownPage(1); }}
                          placeholder="Search clients by name, facility or city..."
                          style={{
                            width: '100%',
                            height: '34px',
                            padding: '0 12px 0 32px',
                            borderRadius: '8px',
                            border: `1px solid ${DS.border}`,
                            fontSize: '12.5px',
                            backgroundColor: '#FFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setBreakdownSort(s => s === 'desc' ? 'asc' : 'desc')}
                          style={{
                            height: '34px',
                            padding: '0 12px',
                            borderRadius: '8px',
                            border: `1px solid ${DS.border}`,
                            backgroundColor: '#FFF',
                            color: DS.textSec,
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <ArrowUpDown size={13} />
                          Sort: Quantity ({breakdownSort === 'desc' ? 'Highest first' : 'Lowest first'})
                        </button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="mobile-table-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: `1px solid ${DS.border}` }}>
                            <th style={{ padding: '10px 14px', textAlign: 'center', width: '45px', color: '#64748B', fontWeight: 600 }}>#</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>Client Organization</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>Primary Plant / Site</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>Equipment Breakdown</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>Status Summary</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B', fontWeight: 600 }}>Total Units</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', width: '120px', color: '#64748B', fontWeight: 600 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedClients.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: DS.textMuted }}>
                                No client asset records match your search query.
                              </td>
                            </tr>
                          ) : (
                            paginatedClients.map((client, idx) => {
                              const globalIndex = (breakdownPage - 1) * pageSize + idx + 1;
                              const clientTotal = client.totalAssets !== undefined ? client.totalAssets : (client.totalExtinguishers || 0);
                              const breakdownMap = client.categoriesBreakdown || client.typesBreakdown || {};

                              return (
                                <tr
                                  key={client.clientName}
                                  onClick={() => {
                                    setSelectedExtClient(client);
                                    setExtinguisherView('REPORT');
                                    setReportSearch('');
                                    setReportCategoryFilter('ALL');
                                    setReportTypeFilter('ALL');
                                    setReportCapacityFilter('ALL');
                                    setReportStatusFilter('ALL');
                                    setReportSiteFilter('ALL');
                                    setReportPage(1);
                                  }}
                                  style={{
                                    borderBottom: `1px solid ${DS.border}`,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.12s ease'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                                >
                                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                                    {globalIndex}
                                  </td>
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ fontWeight: 600, color: DS.textPrimary }}>
                                      {client.clientName}
                                    </div>
                                    {client.city && (
                                      <div style={{ fontSize: '11px', color: DS.textMuted }}>
                                        {client.city}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px 14px', color: DS.textSec }}>
                                    {client.siteName}
                                  </td>
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                      {Object.entries(breakdownMap).map(([t, count]) => (
                                        <span
                                          key={t}
                                          style={{
                                            fontSize: '11px',
                                            padding: '2px 7px',
                                            borderRadius: '4px',
                                            backgroundColor: '#F1F5F9',
                                            color: '#334155',
                                            fontWeight: 500
                                          }}
                                        >
                                          {t}: <strong>{count}</strong>
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                    <div style={{ display: 'inline-flex', gap: '5px' }}>
                                      {client.inspectedCount > 0 && (
                                        <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 600 }}>
                                          {client.inspectedCount} OK
                                        </span>
                                      )}
                                      {client.attentionCount > 0 && (
                                        <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }}>
                                          {client.attentionCount} Attn
                                        </span>
                                      )}
                                      {client.pendingCount > 0 && (
                                        <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#64748B', fontWeight: 600 }}>
                                          {client.pendingCount} Pend
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                    <span style={{
                                      fontSize: '16px',
                                      fontWeight: 700,
                                      color: currentCategory === 'Fire Extinguisher' ? '#DC2626' : '#2563EB',
                                      letterSpacing: '-0.02em',
                                      fontVariantNumeric: 'tabular-nums'
                                    }}>
                                      {clientTotal.toLocaleString()}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#0B6B63',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                    >
                                      View Assets <ArrowRight size={11} />
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        {/* Grand Total Footer Row */}
                        <tfoot>
                          <tr style={{ backgroundColor: '#F1F5F9', borderTop: `2px solid ${DS.border}` }}>
                            <td colSpan={3} style={{ padding: '12px 14px', fontWeight: 700, color: DS.textPrimary }}>
                              Grand Total ({clientBreakdown.length} Contracted Clients)
                            </td>
                            <td style={{ padding: '12px 14px', color: DS.textSec, fontSize: '11.5px' }}>
                              All registered {currentCategory === 'ALL' ? 'assets' : currentCategory.toLowerCase() + 's'} across database
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: DS.textSec }}>
                                {grandInspected} OK · {grandAttention} Attn · {grandPending} Pend
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <span style={{ fontSize: '18px', fontWeight: 800, color: currentCategory === 'Fire Extinguisher' ? '#DC2626' : '#2563EB', fontVariantNumeric: 'tabular-nums' }}>
                                {grandTotal.toLocaleString()}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Breakdown Pagination Footer */}
                    <div style={{
                      padding: '12px 20px',
                      borderTop: `1px solid ${DS.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#F8FAFC'
                    }}>
                      <div style={{ fontSize: '12px', color: DS.textMuted }}>
                        Showing {paginatedClients.length} of {filteredClients.length} clients ({grandTotal.toLocaleString()} total units)
                      </div>
                      {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            disabled={breakdownPage <= 1}
                            onClick={() => setBreakdownPage(p => Math.max(1, p - 1))}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${DS.border}`,
                              backgroundColor: '#FFF',
                              fontSize: '11px',
                              cursor: breakdownPage <= 1 ? 'not-allowed' : 'pointer',
                              opacity: breakdownPage <= 1 ? 0.5 : 1
                            }}
                          >
                            Previous
                          </button>
                          <span style={{ fontSize: '11px', alignSelf: 'center', color: DS.textSec }}>
                            Page {breakdownPage} of {totalPages}
                          </span>
                          <button
                            disabled={breakdownPage >= totalPages}
                            onClick={() => setBreakdownPage(p => Math.min(totalPages, p + 1))}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${DS.border}`,
                              backgroundColor: '#FFF',
                              fontSize: '11px',
                              cursor: breakdownPage >= totalPages ? 'not-allowed' : 'pointer',
                              opacity: breakdownPage >= totalPages ? 0.5 : 1
                            }}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* VIEW 2: COMPLETE CLIENT ASSET REPORT (ALL ASSETS FOR CLIENT) */}
              {/* ──────────────────────────────────────────────────────────── */}
              {isReport && (() => {
                const client = selectedExtClient;
                // Fetch all assets for this client
                const rawClientAssets = client.assets || getRegisteredAssets(client.siteId || client.clientName);

                // Available dynamic filter options
                const availableCategories = [...new Set(rawClientAssets.map(e => e.equipmentCategory || (e.templateId === 'CL-03' ? 'Delivery Hose Box' : 'Fire Extinguisher')).filter(Boolean))];
                const availableTypes = [...new Set(rawClientAssets.map(e => e.currentEquipment?.type || e.equipmentType).filter(Boolean))];
                const availableCapacities = [...new Set(rawClientAssets.map(e => e.currentEquipment?.capacity).filter(Boolean))];
                const availableSites = [...new Set(rawClientAssets.map(e => e.siteName || siteName(e)).filter(Boolean))];

                // Filtering
                const sq = reportSearch.trim().toLowerCase();
                const filteredReport = rawClientAssets.filter(e => {
                  const posId = (e.positionId || e.id || '').toLowerCase();
                  const qr = (e.qrCode || e.qrToken || '').toLowerCase();
                  const sn = (e.currentEquipment?.serialNo || e.currentEquipment?.serialNumber || '').toLowerCase();
                  const loc = (e.locationDescription || e.location || e.area || '').toLowerCase();
                  const cat = (e.equipmentCategory || (e.templateId === 'CL-03' ? 'Delivery Hose Box' : 'Fire Extinguisher')).toLowerCase();
                  const eqT = (e.currentEquipment?.type || e.equipmentType || '').toLowerCase();

                  const matchSearch = !sq || posId.includes(sq) || qr.includes(sq) || sn.includes(sq) || loc.includes(sq) || cat.includes(sq) || eqT.includes(sq);

                  const curCategory = e.equipmentCategory || (e.templateId === 'CL-03' ? 'Delivery Hose Box' : 'Fire Extinguisher');
                  const matchCategory = reportCategoryFilter === 'ALL' || curCategory === reportCategoryFilter;
                  const currentT = e.currentEquipment?.type || e.equipmentType;
                  const matchType = reportTypeFilter === 'ALL' || currentT === reportTypeFilter;
                  const matchCap = reportCapacityFilter === 'ALL' || (e.currentEquipment?.capacity || '') === reportCapacityFilter;
                  const matchStatus = reportStatusFilter === 'ALL' ||
                    (reportStatusFilter === 'OK' && e.inspectionStatus === 'Inspected - OK') ||
                    (reportStatusFilter === 'ATTENTION' && e.inspectionStatus === 'Inspected - Attention') ||
                    (reportStatusFilter === 'PENDING' && (!e.inspectionStatus || e.inspectionStatus.includes('Pending')));
                  const matchSite = reportSiteFilter === 'ALL' || (e.siteName || siteName(e)) === reportSiteFilter;

                  return matchSearch && matchCategory && matchType && matchCap && matchStatus && matchSite;
                });

                const reportPageSize = 12;
                const reportTotalPages = Math.ceil(filteredReport.length / reportPageSize) || 1;
                const paginatedReport = filteredReport.slice((reportPage - 1) * reportPageSize, reportPage * reportPageSize);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    {/* Top Action & Summary Bar */}
                    <div style={{
                      padding: '12px 20px',
                      backgroundColor: '#FFFFFF',
                      borderBottom: `1px solid ${DS.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => setExtinguisherView('BREAKDOWN')}
                          style={{
                            height: '32px',
                            padding: '0 10px',
                            borderRadius: '6px',
                            border: `1px solid ${DS.border}`,
                            backgroundColor: '#F8FAFC',
                            color: DS.textPrimary,
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <ChevronLeft size={14} /> Back to Breakdown
                        </button>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: DS.textPrimary }}>
                            {client.clientName}
                          </div>
                          <div style={{ fontSize: '11px', color: DS.textMuted }}>
                            {client.siteName} · Total: <strong style={{ color: '#2563EB' }}>{rawClientAssets.length} Registered Units</strong>
                          </div>
                        </div>
                      </div>

                      {/* Export Actions (Excel, CSV, Print for All Assets) */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => downloadClientAssetsExcel({ clientName: client.clientName, siteName: client.siteName, assets: filteredReport, reportTitle: `${client.clientName}_Assets` })}
                          style={{
                            height: '32px',
                            padding: '0 11px',
                            borderRadius: '6px',
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Export all client assets to formatted Excel (.xlsx)"
                        >
                          <Download size={13} /> Excel (.xlsx)
                        </button>
                        <button
                          onClick={() => downloadClientAssetsCSV({ clientName: client.clientName, siteName: client.siteName, assets: filteredReport, reportTitle: `${client.clientName}_Assets` })}
                          style={{
                            height: '32px',
                            padding: '0 11px',
                            borderRadius: '6px',
                            backgroundColor: '#F8FAFC',
                            border: `1px solid ${DS.border}`,
                            color: DS.textSec,
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Export all client assets to CSV"
                        >
                          <FileSpreadsheet size={13} /> CSV
                        </button>
                        <button
                          onClick={() => printClientAssetsReport({ clientName: client.clientName, siteName: client.siteName, assets: filteredReport, reportTitle: `${client.clientName} Asset Inventory` })}
                          style={{
                            height: '32px',
                            padding: '0 11px',
                            borderRadius: '6px',
                            backgroundColor: '#F8FAFC',
                            border: `1px solid ${DS.border}`,
                            color: DS.textSec,
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Print or save PDF asset dossier"
                        >
                          <Printer size={13} /> Print / PDF
                        </button>
                      </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div style={{
                      padding: '10px 20px',
                      backgroundColor: '#FAFAFA',
                      borderBottom: `1px solid ${DS.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '300px' }}>
                        <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                          type="text"
                          value={reportSearch}
                          onChange={e => { setReportSearch(e.target.value); setReportPage(1); }}
                          placeholder="Search Asset ID, QR, Serial, Location..."
                          style={{
                            width: '100%',
                            height: '30px',
                            padding: '0 10px 0 28px',
                            borderRadius: '6px',
                            border: `1px solid ${DS.border}`,
                            fontSize: '11.5px',
                            backgroundColor: '#FFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Category Filter */}
                      {availableCategories.length > 1 && (
                        <select
                          value={reportCategoryFilter}
                          onChange={e => { setReportCategoryFilter(e.target.value); setReportPage(1); }}
                          style={{
                            height: '30px',
                            padding: '0 8px',
                            borderRadius: '6px',
                            border: `1px solid ${DS.border}`,
                            backgroundColor: '#FFF',
                            fontSize: '11.5px',
                            color: DS.textPrimary
                          }}
                        >
                          <option value="ALL">All Categories ({availableCategories.length})</option>
                          {availableCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      )}

                      {/* Type Filter */}
                      <select
                        value={reportTypeFilter}
                        onChange={e => { setReportTypeFilter(e.target.value); setReportPage(1); }}
                        style={{
                          height: '30px',
                          padding: '0 8px',
                          borderRadius: '6px',
                          border: `1px solid ${DS.border}`,
                          backgroundColor: '#FFF',
                          fontSize: '11.5px',
                          color: DS.textPrimary
                        }}
                      >
                        <option value="ALL">All Types ({availableTypes.length})</option>
                        {availableTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      {/* Capacity Filter */}
                      {availableCapacities.length > 0 && (
                        <select
                          value={reportCapacityFilter}
                          onChange={e => { setReportCapacityFilter(e.target.value); setReportPage(1); }}
                          style={{
                            height: '30px',
                            padding: '0 8px',
                            borderRadius: '6px',
                            border: `1px solid ${DS.border}`,
                            backgroundColor: '#FFF',
                            fontSize: '11.5px',
                            color: DS.textPrimary
                          }}
                        >
                          <option value="ALL">All Capacities</option>
                          {availableCapacities.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      )}

                      {/* Status Filter */}
                      <select
                        value={reportStatusFilter}
                        onChange={e => { setReportStatusFilter(e.target.value); setReportPage(1); }}
                        style={{
                          height: '30px',
                          padding: '0 8px',
                          borderRadius: '6px',
                          border: `1px solid ${DS.border}`,
                          backgroundColor: '#FFF',
                          fontSize: '11.5px',
                          color: DS.textPrimary
                        }}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="OK">Verified OK</option>
                        <option value="ATTENTION">Needs Attention</option>
                        <option value="PENDING">Pending</option>
                      </select>

                      {(reportSearch || reportCategoryFilter !== 'ALL' || reportTypeFilter !== 'ALL' || reportCapacityFilter !== 'ALL' || reportStatusFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setReportSearch('');
                            setReportCategoryFilter('ALL');
                            setReportTypeFilter('ALL');
                            setReportCapacityFilter('ALL');
                            setReportStatusFilter('ALL');
                            setReportPage(1);
                          }}
                          style={{
                            height: '30px',
                            padding: '0 8px',
                            borderRadius: '6px',
                            border: `1px solid ${DS.border}`,
                            backgroundColor: '#FFF',
                            color: '#DC2626',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Detailed Report Table (All Assets for this Client) */}
                    <div className="mobile-table-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: `1px solid ${DS.border}` }}>
                            <th style={{ padding: '9px 10px', textAlign: 'center', width: '38px', color: '#64748B' }}>#</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', color: '#64748B' }}>Asset ID</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', color: '#64748B' }}>QR Number</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', color: '#64748B' }}>Category</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', color: '#64748B' }}>Equipment Type</th>
                            <th style={{ padding: '9px 10px', textAlign: 'center', color: '#64748B' }}>Cap. / Spec</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', color: '#64748B' }}>Make / Mfr</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', color: '#64748B' }}>Serial No.</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', color: '#64748B' }}>Location / Position</th>
                            <th style={{ padding: '9px 10px', textAlign: 'center', color: '#64748B' }}>Last Insp.</th>
                            <th style={{ padding: '9px 10px', textAlign: 'center', color: '#64748B' }}>Next Due</th>
                            <th style={{ padding: '9px 10px', textAlign: 'center', color: '#64748B' }}>Status</th>
                            <th style={{ padding: '9px 10px', textAlign: 'center', width: '90px', color: '#64748B' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedReport.length === 0 ? (
                            <tr>
                              <td colSpan={13} style={{ padding: '36px', textAlign: 'center', color: DS.textMuted }}>
                                No asset records match your filter criteria.
                              </td>
                            </tr>
                          ) : (
                            paginatedReport.map((pos, idx) => {
                              const globalIdx = (reportPage - 1) * reportPageSize + idx + 1;
                              const isOK = pos.inspectionStatus === 'Inspected - OK';
                              const isAtt = pos.inspectionStatus === 'Inspected - Attention';
                              const loc = [pos.area, pos.locationDescription || pos.location].filter(Boolean).join(' — ') || 'Plant Floor';
                              const category = pos.equipmentCategory || (pos.templateId === 'CL-03' ? 'Delivery Hose Box' : (pos.templateId === 'CL-11' ? 'Fire Extinguisher' : pos.equipmentType || 'Safety Equipment'));

                              return (
                                <tr
                                  key={pos.positionId || pos.id}
                                  style={{ borderBottom: `1px solid ${DS.border}` }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                                >
                                  <td style={{ padding: '10px', textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                                    {globalIdx}
                                  </td>
                                  <td style={{ padding: '10px', fontWeight: 600, color: DS.textPrimary, whiteSpace: 'nowrap' }}>
                                    {pos.positionId || pos.id}
                                  </td>
                                  <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontFamily: 'monospace',
                                      fontSize: '10.5px',
                                      backgroundColor: '#F1F5F9',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      color: '#334155'
                                    }}>
                                      <QrCode size={10} color="#64748B" />
                                      {pos.qrCode || pos.qrToken || '—'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px', color: '#0B6B63', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {category}
                                  </td>
                                  <td style={{ padding: '10px', fontWeight: 500, color: DS.textPrimary }}>
                                    {pos.currentEquipment?.type || pos.equipmentType || category}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: '#0B6B63', whiteSpace: 'nowrap' }}>
                                    {pos.currentEquipment?.capacity || '—'}
                                  </td>
                                  <td style={{ padding: '10px', color: DS.textSec, whiteSpace: 'nowrap' }}>
                                    {pos.currentEquipment?.make || pos.currentEquipment?.manufacturer || 'Indus SafeGuard'}
                                  </td>
                                  <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '10.5px', color: '#475569', whiteSpace: 'nowrap' }}>
                                    {pos.currentEquipment?.serialNo || pos.currentEquipment?.serialNumber || '—'}
                                  </td>
                                  <td style={{ padding: '10px', color: DS.textSec, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={loc}>
                                    {loc}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center', color: DS.textMuted, fontSize: '11px', whiteSpace: 'nowrap' }}>
                                    {pos.lastInspectionDate || pos.inspectionHistory?.[0]?.inspectionDate || '—'}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: '#D97706', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {pos.currentEquipment?.nextServiceDueDate || pos.currentEquipment?.nextHydroTestDue || pos.nextInspectionDueDate || '—'}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      padding: '2px 7px',
                                      borderRadius: '100px',
                                      backgroundColor: isOK ? '#ECFDF5' : isAtt ? '#FEF2F2' : '#F1F5F9',
                                      color: isOK ? '#059669' : isAtt ? '#DC2626' : '#64748B',
                                      border: `1px solid ${isOK ? '#A7F3D0' : isAtt ? '#FECACA' : '#E2E8F0'}`
                                    }}>
                                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: isOK ? '#059669' : isAtt ? '#DC2626' : '#94A3B8' }} />
                                      {isOK ? 'Verified OK' : isAtt ? 'Needs Attn' : 'Pending'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                                      <button
                                        onClick={() => {
                                          setExtinguisherView(null);
                                          if (onSelectPosition) onSelectPosition(pos);
                                          onNavigate('asset-details');
                                        }}
                                        style={{
                                          height: '24px',
                                          padding: '0 7px',
                                          borderRadius: '4px',
                                          backgroundColor: '#FFF',
                                          border: `1px solid ${DS.border}`,
                                          color: DS.textSec,
                                          fontSize: '10.5px',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                        title="View Asset Dossier"
                                      >
                                        <Eye size={10} /> Dossier
                                      </button>
                                      <button
                                        onClick={() => {
                                          setExtinguisherView(null);
                                          const site = sites.find(s => s.id === pos.siteId) || sites[0];
                                          if (onSelectSite) onSelectSite(site);
                                          if (onSelectPosition) onSelectPosition(pos);
                                          onNavigate('digital-checklist');
                                        }}
                                        style={{
                                          height: '24px',
                                          padding: '0 8px',
                                          borderRadius: '4px',
                                          background: 'linear-gradient(135deg,#0B6B63,#0F766E)',
                                          color: '#FFF',
                                          fontSize: '10.5px',
                                          fontWeight: 600,
                                          border: 'none',
                                          cursor: 'pointer'
                                        }}
                                        title="Inspect Asset"
                                      >
                                        Inspect
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Report Pagination Footer */}
                    <div style={{
                      padding: '10px 20px',
                      borderTop: `1px solid ${DS.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#F8FAFC'
                    }}>
                      <div style={{ fontSize: '11.5px', color: DS.textMuted }}>
                        Showing {paginatedReport.length} of {filteredReport.length} registered assets ({rawClientAssets.length} total registered for {client.clientName})
                      </div>
                      {reportTotalPages > 1 && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            disabled={reportPage <= 1}
                            onClick={() => setReportPage(p => Math.max(1, p - 1))}
                            style={{
                              padding: '3px 9px',
                              borderRadius: '5px',
                              border: `1px solid ${DS.border}`,
                              backgroundColor: '#FFF',
                              fontSize: '11px',
                              cursor: reportPage <= 1 ? 'not-allowed' : 'pointer',
                              opacity: reportPage <= 1 ? 0.5 : 1
                            }}
                          >
                            Previous
                          </button>
                          <span style={{ fontSize: '11px', alignSelf: 'center', color: DS.textSec }}>
                            Page {reportPage} of {reportTotalPages}
                          </span>
                          <button
                            disabled={reportPage >= reportTotalPages}
                            onClick={() => setReportPage(p => Math.min(reportTotalPages, p + 1))}
                            style={{
                              padding: '3px 9px',
                              borderRadius: '5px',
                              border: `1px solid ${DS.border}`,
                              backgroundColor: '#FFF',
                              fontSize: '11px',
                              cursor: reportPage >= reportTotalPages ? 'not-allowed' : 'pointer',
                              opacity: reportPage >= reportTotalPages ? 0.5 : 1
                            }}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
