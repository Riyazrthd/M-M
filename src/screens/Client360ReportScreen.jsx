import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, ShieldCheck, AlertTriangle, Calendar, CheckCircle2, 
  TrendingUp, TrendingDown, FileCheck, ArrowRight, ArrowUpRight, BarChart3,
  ExternalLink, Search, Download, PlusCircle, QrCode, Flame, FireExtinguisher, Layers,
  Clock, ChevronRight, Sparkles, FileSpreadsheet, Database, Printer, ChevronLeft, ArrowUpDown,
  Activity, Zap, Target, AlertCircle, Check, Eye, X, Filter, Phone, Mail, MapPin, User,
  FileText, Shield, Award, CheckSquare, Clock3, RefreshCw
} from 'lucide-react';
import { 
  getAllClients360List, 
  getClient360Summary, 
  updatePunchItem, 
  getSites, 
  getPositions, 
  getVisits 
} from '../data/storage';
import { 
  downloadClient360ExcelWorkbook, 
  printClient360Report 
} from '../utils/client360Exporter';
import { downloadPendingAssetsExcel, downloadPendingAssetsCSV } from '../utils/pendingAssetExporter';

export default function Client360ReportScreen({ 
  onNavigate, 
  initialClientId = null, 
  onSelectSite = null, 
  onSelectPosition = null 
}) {
  const [clientsList, setClientsList] = useState(getAllClients360List());
  const [selectedClientName, setSelectedClientName] = useState(initialClientId || null);
  const [activeTab, setActiveTab] = useState('overview');

  // Directory filter states
  const [directorySearch, setDirectorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('assets');

  // Detail view search & filter states
  const [assetSearch, setAssetSearch] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('ALL');
  const [assetConditionFilter, setAssetConditionFilter] = useState('ALL');

  const [punchSearch, setPunchSearch] = useState('');
  const [punchStatusFilter, setPunchStatusFilter] = useState('ALL');
  const [punchSeverityFilter, setPunchSeverityFilter] = useState('ALL');

  // Active modal for punch update
  const [selectedPunchToEdit, setSelectedPunchToEdit] = useState(null);
  const [punchEditStatus, setPunchEditStatus] = useState('Closed');
  const [punchEditRemarks, setPunchEditRemarks] = useState('');

  // Selected visit modal
  const [selectedVisitModal, setSelectedVisitModal] = useState(null);

  // Reload data when mutations occur
  const reloadData = () => {
    setClientsList(getAllClients360List());
  };

  useEffect(() => {
    const handleUpdate = () => reloadData();
    window.addEventListener('ifspl:data_changed', handleUpdate);
    window.addEventListener('ifspl:punch_updated', handleUpdate);
    return () => {
      window.removeEventListener('ifspl:data_changed', handleUpdate);
      window.removeEventListener('ifspl:punch_updated', handleUpdate);
    };
  }, []);

  // Compute selected client summary
  const clientSummary = useMemo(() => {
    if (!selectedClientName) return null;
    return getClient360Summary(selectedClientName);
  }, [selectedClientName, clientsList]);

  // Filtered directory list
  const filteredDirectory = useMemo(() => {
    return clientsList.filter(c => {
      const q = directorySearch.toLowerCase().trim();
      const matchQ = !q || c.clientName.toLowerCase().includes(q) || c.clientCode.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || c.amcStatus.toUpperCase() === statusFilter.toUpperCase();
      return matchQ && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'assets') return b.totalAssets - a.totalAssets;
      if (sortBy === 'pending') return b.pendingAssets - a.pendingAssets;
      if (sortBy === 'defects') return b.defectiveAssets - a.defectiveAssets;
      if (sortBy === 'health') return b.healthScore - a.healthScore;
      if (sortBy === 'expiry') return new Date(a.contractExpiryDate) - new Date(b.contractExpiryDate);
      return 0;
    });
  }, [clientsList, directorySearch, statusFilter, sortBy]);

  // Handle punch resolution submission
  const handleSavePunchUpdate = (e) => {
    e.preventDefault();
    if (!selectedPunchToEdit) return;
    updatePunchItem(selectedPunchToEdit.id, {
      status: punchEditStatus,
      closureRemarks: punchEditRemarks,
      actualRectificationDate: punchEditStatus === 'Closed' || punchEditStatus === 'Rectified' 
        ? new Date().toISOString().substring(0, 10) 
        : null
    });
    setSelectedPunchToEdit(null);
    setPunchEditRemarks('');
    reloadData();
  };

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 1: CLIENT AMC INTELLIGENCE DIRECTORY (NO CLIENT SELECTED)
  // ──────────────────────────────────────────────────────────────────────────
  if (!selectedClientName || !clientSummary) {
    return (
      <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        {/* Directory Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                <ShieldCheck size={20} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Client 360° AMC Intelligence Reports
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748B' }}>
              Management-level enterprise reporting • Full client dossier, AMC contracts, asset compliance, defect punch lists & service health scores
            </p>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('manager-dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← Return to Dashboard
          </button>
        </div>

        {/* Directory Search & Filters Bar */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by client name, client code, or company..."
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px 0 36px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
                color: '#0F172A',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* AMC Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '0.82rem',
                color: '#0F172A',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All AMC Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '0.82rem',
                color: '#0F172A',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <option value="assets">Total Assets (High to Low)</option>
              <option value="health">Client Health Score</option>
              <option value="pending">Pending Inspections</option>
              <option value="defects">Defective Assets</option>
              <option value="expiry">Contract Expiry</option>
            </select>
          </div>
        </div>

        {/* Clients Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {filteredDirectory.map((client) => {
            const isHealthy = client.healthScore >= 75;
            const isAttention = client.healthScore < 75 && client.healthScore >= 60;

            return (
              <div
                key={client.clientName}
                onClick={() => setSelectedClientName(client.clientName)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  {/* Card Header: Client Name, Code, Health Score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.74rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 700 }}>
                          {client.clientCode}
                        </span>
                        <span style={{
                          fontSize: '0.74rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: client.amcStatus === 'Active' ? '#DCFCE7' : '#F1F5F9',
                          color: client.amcStatus === 'Active' ? '#15803D' : '#475569',
                          fontWeight: 600
                        }}>
                          {client.amcStatus}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                        {client.clientName}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                        {client.sitesCount} Contracted Plant {client.sitesCount > 1 ? 'Facilities' : 'Facility'}
                      </div>
                    </div>

                    {/* Health Score Pill */}
                    <div style={{
                      textAlign: 'center',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: `${client.healthColor}12`,
                      border: `1px solid ${client.healthColor}33`,
                      minWidth: '65px'
                    }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: client.healthColor, lineHeight: 1 }}>
                        {client.healthScore}
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: client.healthColor, textTransform: 'uppercase', marginTop: '2px' }}>
                        {client.healthRating}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    marginBottom: '14px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Total Assets</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{client.totalAssets}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#059669', textTransform: 'uppercase', fontWeight: 600 }}>Inspected</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669' }}>{client.inspectedAssets}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#D97706', textTransform: 'uppercase', fontWeight: 600 }}>Pending</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#D97706' }}>{client.pendingAssets}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: client.defectiveAssets > 0 ? '#DC2626' : '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Defects</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: client.defectiveAssets > 0 ? '#DC2626' : '#64748B' }}>
                        {client.defectiveAssets}
                      </div>
                    </div>
                  </div>

                  {/* Additional Highlights */}
                  <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Punch Resolution:</span>
                      <strong style={{ color: '#0F172A' }}>{client.punchClosurePct}% Closed</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Contract Expiry:</span>
                      <strong style={{ color: '#0F172A' }}>{client.contractExpiryDate}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Next Scheduled Visit:</span>
                      <strong style={{ color: '#2563EB' }}>{client.nextVisitDate}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    View complete 360° dossier
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Open Report <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 2: CLIENT 360° AMC INTELLIGENCE REPORT FOR SELECTED CLIENT
  // ──────────────────────────────────────────────────────────────────────────
  const { kpis, contractDetails, healthScore, sites, assets, visits, technicians, punches, assetsNotOkay, pendingAssetsList, agingBuckets } = clientSummary;

  // Filtered Assets inside tab
  const filteredAssets = assets.filter(a => {
    const q = assetSearch.toLowerCase().trim();
    const matchQ = !q || a.assetId.toLowerCase().includes(q) || a.assetQrNumber.toLowerCase().includes(q) || a.assetName.toLowerCase().includes(q) || a.serialNumber.toLowerCase().includes(q);
    const matchCat = assetCategoryFilter === 'ALL' || a.assetCategory.toLowerCase().includes(assetCategoryFilter.toLowerCase());
    const matchCond = assetConditionFilter === 'ALL' || a.assetCondition.toLowerCase() === assetConditionFilter.toLowerCase();
    return matchQ && matchCat && matchCond;
  });

  // Filtered Punches inside tab
  const filteredPunches = punches.filter(p => {
    const q = punchSearch.toLowerCase().trim();
    const matchQ = !q || p.punchNo.toLowerCase().includes(q) || p.positionId.toLowerCase().includes(q) || p.defectObservation.toLowerCase().includes(q);
    const matchStatus = punchStatusFilter === 'ALL' || p.status.toUpperCase() === punchStatusFilter.toUpperCase();
    const matchSev = punchSeverityFilter === 'ALL' || p.severity.toUpperCase() === punchSeverityFilter.toUpperCase();
    return matchQ && matchStatus && matchSev;
  });

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      
      {/* Top Breadcrumb & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setSelectedClientName(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              color: '#334155',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← All Client Reports
          </button>
          <span style={{ color: '#94A3B8' }}>/</span>
          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 500 }}>Client AMC Dossier</span>
          <span style={{ color: '#94A3B8' }}>/</span>
          <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>{clientSummary.clientName}</strong>
        </div>

        {/* Export & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => downloadClient360ExcelWorkbook(clientSummary)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#0F172A',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={15} color="#059669" />
            Export Excel Workbook (.xlsx)
          </button>

          <button
            onClick={() => printClient360Report(clientSummary)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#0F172A',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Printer size={15} />
            Download Complete PDF Report
          </button>
        </div>
      </div>

      {/* SECTION 2: CLIENT REPORT HEADER — PREMIUM ENTERPRISE BLUEPRINT */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        padding: '24px 28px',
        marginBottom: '22px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        {/* Left: Client Branding & Master Details */}
        <div style={{ flex: '1 1 540px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              padding: '3px 8px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '6px',
              textTransform: 'uppercase'
            }}>
              CLIENT 360° AMC INTELLIGENCE
            </span>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px',
              backgroundColor: `${clientSummary.statusBadge.color}18`,
              color: clientSummary.statusBadge.color
            }}>
              {clientSummary.statusBadge.label}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Period: {clientSummary.reportPeriod}
            </span>
          </div>

          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {clientSummary.clientName}
          </h1>

          <div style={{ fontSize: '0.83rem', color: '#475569', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span><strong>Client Code:</strong> {clientSummary.clientCode}</span>
            <span>•</span>
            <span><strong>Industry:</strong> {clientSummary.industry}</span>
            <span>•</span>
            <span><strong>Coordinator:</strong> {clientSummary.coordinator}</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px 16px',
            fontSize: '0.8rem',
            color: '#64748B'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={13} color="#94A3B8" />
              <span><strong>Contact:</strong> {clientSummary.contactPerson}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={13} color="#94A3B8" />
              <span>{clientSummary.contactPhone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} color="#94A3B8" />
              <span>{clientSummary.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} color="#94A3B8" />
              <span>{clientSummary.billingAddress}, {clientSummary.city}</span>
            </div>
          </div>
        </div>

        {/* Right: Client Health Score Gauge */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px 20px',
          minWidth: '260px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            CLIENT HEALTH SCORE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: healthScore.color, lineHeight: 1 }}>
              {healthScore.score}
            </span>
            <span style={{ fontSize: '1rem', color: '#94A3B8', fontWeight: 600 }}>/ 100</span>
          </div>

          <div style={{
            fontSize: '0.84rem',
            fontWeight: 700,
            color: healthScore.color,
            marginBottom: '10px'
          }}>
            {healthScore.rating} • {healthScore.label}
          </div>

          <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>AMC Visits:</span>
              <strong style={{ color: '#0F172A' }}>{healthScore.components.visitRate}% on track</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Asset Inspection:</span>
              <strong style={{ color: '#0F172A' }}>{healthScore.components.inspectionRate}% verified</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Punch Closure:</span>
              <strong style={{ color: '#0F172A' }}>{healthScore.components.punchClosureRate}% resolved</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: CLIENT EXECUTIVE KPI SUMMARY — CLICKABLE METRIC CARDS */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          Executive Service Performance KPIs
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {/* Card 1: AMC Contracts */}
          <div 
            onClick={() => setActiveTab('contracts')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '16px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563EB'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>AMC Contracts</span>
              <FileText size={16} color="#2563EB" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
              {kpis.contract.contractValue}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
              <span>Visits Completed:</span>
              <strong style={{ color: '#059669' }}>{kpis.contract.visitsCompleted} / {kpis.contract.visitsScheduled}</strong>
            </div>
          </div>

          {/* Card 2: Registered Assets */}
          <div 
            onClick={() => setActiveTab('assets')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '16px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Registered Assets</span>
              <Layers size={16} color="#059669" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
              {kpis.asset.totalAssets} Units
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
              <span>Extinguishers: <strong>{kpis.asset.extinguishers}</strong></span>
              <span>Hose Boxes: <strong>{kpis.asset.hoseBoxes}</strong></span>
            </div>
          </div>

          {/* Card 3: Inspection Progress */}
          <div 
            onClick={() => setActiveTab('pending')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '16px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#D97706'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Inspection Progress</span>
              <CheckSquare size={16} color="#D97706" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
              {kpis.inspection.inspectionCompletionPct}%
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
              <span>Inspected: <strong style={{ color: '#059669' }}>{kpis.asset.inspectedAssets}</strong></span>
              <span>Pending: <strong style={{ color: '#D97706' }}>{kpis.asset.pendingAssets}</strong></span>
            </div>
          </div>

          {/* Card 4: Defect Punch Items */}
          <div 
            onClick={() => setActiveTab('punches')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '16px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#DC2626'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Punch & Defects</span>
              <AlertTriangle size={16} color="#DC2626" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
              {kpis.punch.openPunches} Open
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
              <span>Critical: <strong style={{ color: '#DC2626' }}>{kpis.punch.criticalPunches}</strong></span>
              <span>Closure: <strong style={{ color: '#059669' }}>{kpis.punch.punchClosurePct}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: NAVIGATION TABS */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid #E2E8F0',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'contracts', label: 'AMC Contracts' },
          { id: 'sites', label: `Sites & Plants (${sites.length})` },
          { id: 'assets', label: `Asset Register (${assets.length})` },
          { id: 'visits', label: `Visits & Inspections (${visits.length})` },
          { id: 'punches', label: `Punch & Rectification (${punches.length})` },
          { id: 'defects', label: `Assets Not Okay (${assetsNotOkay.length})` },
          { id: 'pending', label: `Pending Work (${pendingAssetsList.length})` },
          { id: 'analytics', label: 'Analytics & Aging' },
          { id: 'technicians', label: `Technicians (${technicians.length})` },
          { id: 'history', label: 'Replacement Log' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '9px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '0.84rem',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#2563EB' : '#64748B',
              borderBottom: activeTab === tab.id ? '2px solid #2563EB' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {/* Contract Timeline Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
              AMC Service Milestones & Timeline
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D', fontWeight: 700, fontSize: '0.78rem' }}>1</div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>Contract Commencement</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>PO Reference: {contractDetails.poNumber} • Effective: {contractDetails.startDate}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 700, fontSize: '0.78rem' }}>2</div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>Periodic Inspections Dispatched</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{contractDetails.completedVisits} of {contractDetails.plannedVisits} visits conducted by lead service engineers</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309', fontWeight: 700, fontSize: '0.78rem' }}>3</div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>Next Scheduled Rotation</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Target Visit: {sites[0]?.nextScheduledVisit || 'November 2026'} ({contractDetails.remainingVisits} remaining visits in cycle)</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 700, fontSize: '0.78rem' }}>4</div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>Contract Expiry & Renewal Window</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Scheduled Expiry: {contractDetails.endDate} • {contractDetails.daysToExpiry} Days Remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Health Score Breakdown Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
              Service Quality & Compliance Health Factors
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span>Asset Inspection Coverage</span>
                  <strong>{kpis.inspection.inspectionCompletionPct}%</strong>
                </div>
                <div style={{ height: '7px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ width: `${kpis.inspection.inspectionCompletionPct}%`, height: '100%', backgroundColor: '#059669' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span>Punch Item Resolution Rate</span>
                  <strong>{kpis.punch.punchClosurePct}%</strong>
                </div>
                <div style={{ height: '7px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ width: `${kpis.punch.punchClosurePct}%`, height: '100%', backgroundColor: '#2563EB' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span>AMC Contract Active Period</span>
                  <strong>{contractDetails.daysToExpiry > 0 ? 'Compliant' : 'Expired'} ({contractDetails.daysToExpiry}d left)</strong>
                </div>
                <div style={{ height: '7px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(10, (contractDetails.daysToExpiry / 365) * 100))}%`, height: '100%', backgroundColor: contractDetails.daysToExpiry > 60 ? '#2563EB' : '#DC2626' }} />
                </div>
              </div>

              <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.78rem', color: '#475569' }}>
                💡 <strong>Management Note:</strong> Health score dynamically computes real-time service compliance. Addressing {kpis.punch.openPunches} open punch items will elevate the client health score to 98/100.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: AMC CONTRACTS */}
      {activeTab === 'contracts' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            Comprehensive Annual Maintenance Contract Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px 24px', fontSize: '0.84rem' }}>
            <div><span style={{ color: '#64748B' }}>Contract Reference:</span> <strong style={{ color: '#0F172A' }}>{contractDetails.contractNumber}</strong></div>
            <div><span style={{ color: '#64748B' }}>PO Number:</span> <strong style={{ color: '#0F172A' }}>{contractDetails.poNumber}</strong></div>
            <div><span style={{ color: '#64748B' }}>PO Issue Date:</span> <strong style={{ color: '#0F172A' }}>{contractDetails.poDate}</strong></div>
            <div><span style={{ color: '#64748B' }}>Contract Period:</span> <strong style={{ color: '#0F172A' }}>{contractDetails.startDate} to {contractDetails.endDate}</strong></div>
            <div><span style={{ color: '#64748B' }}>Duration:</span> <strong style={{ color: '#0F172A' }}>{contractDetails.duration}</strong></div>
            <div><span style={{ color: '#64748B' }}>Visit Frequency:</span> <strong style={{ color: '#2563EB' }}>{contractDetails.frequency}</strong></div>
            <div><span style={{ color: '#64748B' }}>Planned Visits:</span> <strong style={{ color: '#0F172A' }}>{contractDetails.plannedVisits} Visits / Annum</strong></div>
            <div><span style={{ color: '#64748B' }}>Visits Completed:</span> <strong style={{ color: '#059669' }}>{contractDetails.completedVisits}</strong></div>
            <div><span style={{ color: '#64748B' }}>Visits Remaining:</span> <strong style={{ color: '#D97706' }}>{contractDetails.remainingVisits}</strong></div>
            <div><span style={{ color: '#64748B' }}>Estimated Contract Value:</span> <strong style={{ color: '#0F172A' }}>{contractDetails.contractValue}</strong></div>
            <div><span style={{ color: '#64748B' }}>Billing / Payment Terms:</span> <strong style={{ color: '#0F172A' }}>{contractDetails.billingTerms}</strong></div>
            <div><span style={{ color: '#64748B' }}>Renewal Status:</span> <strong style={{ color: contractDetails.daysToExpiry > 60 ? '#059669' : '#DC2626' }}>{contractDetails.renewalAlert}</strong></div>
          </div>

          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #E2E8F0' }} />

          <div style={{ fontSize: '0.84rem' }}>
            <div style={{ marginBottom: '8px' }}><strong>Service Scope:</strong> {contractDetails.serviceScope}</div>
            <div style={{ marginBottom: '8px' }}><strong>Included Asset Categories:</strong> {contractDetails.includedCategories}</div>
            <div style={{ marginBottom: '8px' }}><strong>Parts & Labour Coverage:</strong> {contractDetails.contractCoverage}</div>
            <div><strong>Exclusions:</strong> {contractDetails.excludedServices}</div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SITES & PLANTS */}
      {activeTab === 'sites' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
              Contracted Industrial Plants & Facilities ({sites.length})
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Site Code</th>
                  <th style={{ padding: '10px 14px' }}>Plant / Facility Name</th>
                  <th style={{ padding: '10px 14px' }}>Address</th>
                  <th style={{ padding: '10px 14px' }}>Site Contact</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Total</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Inspected</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Pending</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Defects</th>
                  <th style={{ padding: '10px 14px' }}>Last Visit</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sites.map(s => (
                  <tr key={s.siteId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{s.siteCode}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{s.siteName}</td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{s.address}, {s.city}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{s.contactPerson} ({s.contactPhone})</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>{s.totalAssets}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>{s.inspectedAssets}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#D97706' }}>{s.pendingAssets}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: s.defectiveAssets > 0 ? '#DC2626' : '#64748B' }}>{s.defectiveAssets}</td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{s.lastVisitDate}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        backgroundColor: s.status === 'Completed' ? '#DCFCE7' : '#FEF3C7',
                        color: s.status === 'Completed' ? '#15803D' : '#B45309'
                      }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: COMPLETE ASSET REGISTER */}
      {activeTab === 'assets' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {/* Asset Register Toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search assets by ID, QR token, serial number, or type..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: '34px',
                    padding: '0 10px 0 32px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <select
                value={assetCategoryFilter}
                onChange={(e) => setAssetCategoryFilter(e.target.value)}
                style={{ height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
              >
                <option value="ALL">All Categories</option>
                <option value="Extinguisher">Fire Extinguishers</option>
                <option value="Hose">Hose Boxes</option>
                <option value="Hydrant">Hydrants</option>
              </select>

              <select
                value={assetConditionFilter}
                onChange={(e) => setAssetConditionFilter(e.target.value)}
                style={{ height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
              >
                <option value="ALL">All Conditions</option>
                <option value="Okay">Okay</option>
                <option value="Defective">Defective</option>
                <option value="Pending Inspection">Pending</option>
              </select>
            </div>

            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
              Showing {filteredAssets.length} of {assets.length} registered units
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '9px 12px' }}>SR.</th>
                  <th style={{ padding: '9px 12px' }}>Asset ID</th>
                  <th style={{ padding: '9px 12px' }}>QR Token</th>
                  <th style={{ padding: '9px 12px' }}>Equipment Type</th>
                  <th style={{ padding: '9px 12px' }}>Capacity / Spec</th>
                  <th style={{ padding: '9px 12px' }}>Serial Number</th>
                  <th style={{ padding: '9px 12px' }}>Location / Position</th>
                  <th style={{ padding: '9px 12px' }}>Last Inspection</th>
                  <th style={{ padding: '9px 12px' }}>Condition</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(a => (
                  <tr key={a.assetId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '9px 12px', color: '#64748B' }}>{a.srNo}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0F172A' }}>{a.assetId}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: '#2563EB', fontWeight: 600 }}>{a.assetQrNumber}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 500 }}>{a.assetType}</td>
                    <td style={{ padding: '9px 12px', color: '#475569' }}>{a.capacityRating}</td>
                    <td style={{ padding: '9px 12px', color: '#64748B' }}>{a.serialNumber}</td>
                    <td style={{ padding: '9px 12px', color: '#475569' }}>{a.departmentLocation}</td>
                    <td style={{ padding: '9px 12px', color: '#64748B' }}>{a.lastInspectionDate}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        backgroundColor: a.assetCondition === 'Okay' ? '#DCFCE7' : (a.assetCondition === 'Defective' ? '#FEE2E2' : '#FEF3C7'),
                        color: a.assetCondition === 'Okay' ? '#15803D' : (a.assetCondition === 'Defective' ? '#B91C1C' : '#B45309')
                      }}>
                        {a.assetCondition}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          const rawPos = getPositions().find(p => p.positionId === a.assetId);
                          if (rawPos && onSelectPosition) onSelectPosition(rawPos);
                          if (onNavigate) onNavigate('asset-details');
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: VISITS & INSPECTIONS */}
      {activeTab === 'visits' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
              Chronological AMC Visits & Field Inspections ({visits.length})
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Visit ID</th>
                  <th style={{ padding: '10px 14px' }}>Facility</th>
                  <th style={{ padding: '10px 14px' }}>Date</th>
                  <th style={{ padding: '10px 14px' }}>Lead Engineer</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Scheduled</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Inspected</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Pending</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v.visitId || v.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{v.visitId || v.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{v.siteName || v.siteId}</td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{v.date}</td>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>{v.technicianName || v.serviceEngineer} ({v.technicianBadge || 'IFS-SE-041'})</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>{v.totalAssets || 0}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>{v.inspectedAssets || 0}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#D97706' }}>{v.pendingAssets || 0}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        backgroundColor: v.status.includes('Completed') ? '#DCFCE7' : '#DBEAFE',
                        color: v.status.includes('Completed') ? '#15803D' : '#1D4ED8'
                      }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedVisitModal(v)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        View Checklist
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: PUNCH & RECTIFICATION */}
      {activeTab === 'punches' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search punches by defect, Punch #, or Asset ID..."
                  value={punchSearch}
                  onChange={(e) => setPunchSearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: '34px',
                    padding: '0 10px 0 32px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <select
                value={punchStatusFilter}
                onChange={(e) => setPunchStatusFilter(e.target.value)}
                style={{ height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="RECTIFIED">Rectified</option>
              </select>

              <select
                value={punchSeverityFilter}
                onChange={(e) => setPunchSeverityFilter(e.target.value)}
                style={{ height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="MAJOR">Major</option>
                <option value="MINOR">Minor</option>
              </select>
            </div>

            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
              {filteredPunches.length} Punch Items Recorded
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '9px 12px' }}>Punch #</th>
                  <th style={{ padding: '9px 12px' }}>Date</th>
                  <th style={{ padding: '9px 12px' }}>Asset ID</th>
                  <th style={{ padding: '9px 12px' }}>Location</th>
                  <th style={{ padding: '9px 12px' }}>Defect Observation</th>
                  <th style={{ padding: '9px 12px' }}>Severity</th>
                  <th style={{ padding: '9px 12px' }}>Technician</th>
                  <th style={{ padding: '9px 12px' }}>Status</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPunches.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0F172A' }}>{p.punchNo}</td>
                    <td style={{ padding: '9px 12px', color: '#64748B' }}>{p.punchDate}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: '#2563EB' }}>{p.positionId}</td>
                    <td style={{ padding: '9px 12px', color: '#475569' }}>{p.location}</td>
                    <td style={{ padding: '9px 12px', color: '#0F172A', maxWidth: '300px' }}>{p.defectObservation}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: p.severity === 'Critical' ? '#FEE2E2' : '#FEF3C7',
                        color: p.severity === 'Critical' ? '#B91C1C' : '#B45309'
                      }}>
                        {p.severity}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', color: '#475569' }}>{p.technicianName}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        backgroundColor: p.status === 'Closed' || p.status === 'Rectified' ? '#DCFCE7' : '#FEE2E2',
                        color: p.status === 'Closed' || p.status === 'Rectified' ? '#15803D' : '#B91C1C'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedPunchToEdit(p);
                          setPunchEditStatus(p.status === 'Open' ? 'Closed' : p.status);
                          setPunchEditRemarks(p.closureRemarks || '');
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        Update / Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: ASSETS FOUND NOT OKAY */}
      {activeTab === 'defects' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FEF2F2' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              Assets Found Not Okay & Attention Required ({assetsNotOkay.length})
            </h3>
          </div>

          {assetsNotOkay.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Asset ID</th>
                    <th style={{ padding: '10px 14px' }}>QR Token</th>
                    <th style={{ padding: '10px 14px' }}>Equipment Type</th>
                    <th style={{ padding: '10px 14px' }}>Location</th>
                    <th style={{ padding: '10px 14px' }}>Inspection Date</th>
                    <th style={{ padding: '10px 14px' }}>Failed Parameter</th>
                    <th style={{ padding: '10px 14px' }}>Defect Observation</th>
                    <th style={{ padding: '10px 14px' }}>Severity</th>
                    <th style={{ padding: '10px 14px' }}>Rectification</th>
                  </tr>
                </thead>
                <tbody>
                  {assetsNotOkay.map(d => (
                    <tr key={d.assetId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{d.assetId}</td>
                      <td style={{ padding: '10px 14px', color: '#2563EB', fontFamily: 'monospace' }}>{d.qrNumber}</td>
                      <td style={{ padding: '10px 14px' }}>{d.assetType}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B' }}>{d.location}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B' }}>{d.inspectionDate}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{d.failedParameter}</td>
                      <td style={{ padding: '10px 14px', color: '#B91C1C', fontWeight: 500 }}>{d.observation}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem', fontWeight: 700, backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                          {d.severity}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem', fontWeight: 600, backgroundColor: d.rectificationStatus === 'Closed' ? '#DCFCE7' : '#FEF3C7', color: d.rectificationStatus === 'Closed' ? '#15803D' : '#B45309' }}>
                          {d.rectificationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '36px', textAlign: 'center', color: '#059669' }}>
              <CheckCircle2 size={32} style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>All Equipment Verified in Compliant State</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>Zero assets currently require corrective maintenance.</div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 8: PENDING WORK & JUSTIFICATIONS */}
      {activeTab === 'pending' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                Pending Asset Inspections & Mandatory Exception Justifications ({pendingAssetsList.length})
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                Auditable explanations recorded at database level when completing inspections with exceptions
              </div>
            </div>

            {pendingAssetsList.length > 0 && (
              <button
                onClick={() => downloadPendingAssetsExcel({
                  site: sites[0],
                  pendingList: pendingAssetsList.map((p, idx) => ({
                    srNo: idx + 1,
                    positionId: p.assetId,
                    qrCode: p.qrNumber,
                    equipmentType: 'Fire Safety Equipment',
                    location: p.siteLocation,
                    customerName: clientSummary.clientName,
                    justification: { reason: p.pendingReason, explanation: p.explanation }
                  }))
                })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Download size={14} /> Download Pending Asset List
              </button>
            )}
          </div>

          {pendingAssetsList.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>SR.</th>
                    <th style={{ padding: '10px 14px' }}>Asset ID</th>
                    <th style={{ padding: '10px 14px' }}>QR Token</th>
                    <th style={{ padding: '10px 14px' }}>Location</th>
                    <th style={{ padding: '10px 14px' }}>Mandatory Exception Reason</th>
                    <th style={{ padding: '10px 14px' }}>Technician Explanation</th>
                    <th style={{ padding: '10px 14px' }}>Scheduled Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAssetsList.map(p => (
                    <tr key={p.assetId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', color: '#64748B' }}>{p.srNo}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{p.assetId}</td>
                      <td style={{ padding: '10px 14px', color: '#2563EB', fontFamily: 'monospace' }}>{p.qrNumber}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{p.siteLocation}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#D97706' }}>{p.pendingReason}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B' }}>{p.explanation}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B' }}>{p.scheduledDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '36px', textAlign: 'center', color: '#059669' }}>
              <CheckCircle2 size={32} style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>100% Inspection Coverage Achieved</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>Zero assets pending inspection for this client.</div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 9: PERFORMANCE ANALYTICS & PUNCH AGING */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Punch Aging Chart */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
              Open Punch Item Aging Distribution
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '0–7 Days', count: agingBuckets['0-7'], color: '#059669' },
                { label: '8–15 Days', count: agingBuckets['8-15'], color: '#2563EB' },
                { label: '16–30 Days', count: agingBuckets['16-30'], color: '#D97706' },
                { label: '31–60 Days', count: agingBuckets['31-60'], color: '#EA580C' },
                { label: '60+ Days (Overdue)', count: agingBuckets['60+'], color: '#DC2626' }
              ].map(b => (
                <div key={b.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{b.label}</span>
                    <strong>{b.count} Punch Items</strong>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{
                      width: `${kpis.punch.openPunches > 0 ? (b.count / kpis.punch.openPunches) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: b.color
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Category Distribution */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
              Asset Portfolio by Category
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Fire Extinguishers', count: kpis.asset.extinguishers, color: '#DC2626' },
                { label: 'Delivery Hose Boxes', count: kpis.asset.hoseBoxes, color: '#2563EB' },
                { label: 'Hydrant Landing Valves', count: kpis.asset.hydrants, color: '#059669' },
                { label: 'Fire Pumps & Panels', count: kpis.asset.pumps + kpis.asset.alarms, color: '#7C3AED' },
                { label: 'Other Safety Equipment', count: kpis.asset.otherAssets, color: '#64748B' }
              ].map(c => (
                <div key={c.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{c.label}</span>
                    <strong>{c.count} Units ({kpis.asset.totalAssets > 0 ? Math.round((c.count / kpis.asset.totalAssets) * 100) : 0}%)</strong>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{
                      width: `${kpis.asset.totalAssets > 0 ? (c.count / kpis.asset.totalAssets) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: c.color
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 10: TECHNICIANS */}
      {activeTab === 'technicians' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
              Service Engineers & Field Performance Audit ({technicians.length})
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Technician Name</th>
                  <th style={{ padding: '10px 14px' }}>Badge ID</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Total Visits</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Completed</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Assets Inspected</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Punches Raised</th>
                  <th style={{ padding: '10px 14px' }}>Last Visit Date</th>
                  <th style={{ padding: '10px 14px' }}>Facilities Serviced</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map(t => (
                  <tr key={t.badge} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{t.name}</td>
                    <td style={{ padding: '10px 14px', color: '#2563EB', fontWeight: 600 }}>{t.badge}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>{t.visitsCount}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>{t.completedCount}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>{t.inspectedAssetsTotal}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#DC2626' }}>{t.punchesRaised}</td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{t.lastVisitDate}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{t.sitesVisited.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 11: REPLACEMENT LOG */}
      {activeTab === 'history' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
              Permanent QR Position Swaps & Cylinder Replacement Audit Log
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Verifies permanent QR code retention on physical positions during hydro testing swaps (IS 2190)
            </div>
          </div>

          {clientSummary.replacementHistory.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Position ID</th>
                    <th style={{ padding: '10px 14px' }}>Permanent QR Code</th>
                    <th style={{ padding: '10px 14px' }}>Timestamp</th>
                    <th style={{ padding: '10px 14px' }}>Reason</th>
                    <th style={{ padding: '10px 14px' }}>Removed Cylinder Serial</th>
                    <th style={{ padding: '10px 14px' }}>Installed Cylinder Serial</th>
                    <th style={{ padding: '10px 14px' }}>Technician</th>
                  </tr>
                </thead>
                <tbody>
                  {clientSummary.replacementHistory.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{r.positionId}</td>
                      <td style={{ padding: '10px 14px', color: '#2563EB', fontFamily: 'monospace' }}>{r.qrCode}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B' }}>{r.timestamp}</td>
                      <td style={{ padding: '10px 14px', color: '#334155' }}>{r.reason}</td>
                      <td style={{ padding: '10px 14px', color: '#DC2626' }}>{r.removedCylinder?.serialNo || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 600 }}>{r.replacementCylinder?.serialNo || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{r.technician}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
              <CheckCircle2 size={32} style={{ marginBottom: '8px', color: '#059669' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>No Cylinder Swaps Conducted</div>
              <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>All equipment units currently remain original at their assigned permanent positions.</div>
            </div>
          )}
        </div>
      )}

      {/* PUNCH UPDATE / RESOLUTION MODAL */}
      {selectedPunchToEdit && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                Update Defect Punch Status
              </h3>
              <button 
                onClick={() => setSelectedPunchToEdit(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePunchUpdate}>
              <div style={{ marginBottom: '14px', fontSize: '0.84rem' }}>
                <span style={{ color: '#64748B' }}>Punch Ref:</span> <strong>{selectedPunchToEdit.punchNo}</strong> ({selectedPunchToEdit.positionId})
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Rectification Status
                </label>
                <select
                  value={punchEditStatus}
                  onChange={(e) => setPunchEditStatus(e.target.value)}
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                >
                  <option value="Open">Open (Pending Spare / Dispatch)</option>
                  <option value="In Progress">In Progress (Under Rectification)</option>
                  <option value="Rectified">Rectified (Field Resolved)</option>
                  <option value="Closed">Closed & Verified Compliant</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Closure / Rectification Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail parts replaced, tests conducted, or corrective actions..."
                  value={punchEditRemarks}
                  onChange={(e) => setPunchEditRemarks(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPunchToEdit(null)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0F172A', color: '#FFF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Punch Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISIT CHECKLIST VIEW MODAL */}
      {selectedVisitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                  AMC Visit Inspection Record
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {selectedVisitModal.visitId || selectedVisitModal.id} • {selectedVisitModal.date}
                </div>
              </div>
              <button 
                onClick={() => setSelectedVisitModal(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, fontSize: '0.84rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <div><span style={{ color: '#64748B' }}>Site:</span> <strong>{selectedVisitModal.siteName}</strong></div>
                <div><span style={{ color: '#64748B' }}>Lead Engineer:</span> <strong>{selectedVisitModal.technicianName || selectedVisitModal.serviceEngineer}</strong></div>
                <div><span style={{ color: '#64748B' }}>Status:</span> <strong>{selectedVisitModal.status}</strong></div>
                <div><span style={{ color: '#64748B' }}>Client Rep:</span> <strong>{selectedVisitModal.clientRepresentative || 'Vikram Shah'}</strong></div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <strong>Visit Remarks:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#475569', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  {selectedVisitModal.visitRemarks || 'Routine comprehensive inspection completed according to IS 2190 / NFPA guidelines.'}
                </p>
              </div>

              <div>
                <strong>Inspected Asset Answers ({Object.keys(selectedVisitModal.checklistAnswers || {}).length} units):</strong>
                <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  {Object.entries(selectedVisitModal.checklistAnswers || {}).map(([pId, ans]) => (
                    <div key={pId} style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{pId}</span>
                      <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>Recorded ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedVisitModal(null)}
                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#0F172A', color: '#FFF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
