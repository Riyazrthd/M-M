import React, { useState, useEffect } from 'react';
import { getSites, getPositions, addSite, updateSite, deleteSite, clearAllClientData, seedDemoClientData } from '../data/storage';
import TemplateMappingsModal from '../components/TemplateMappingsModal';
import EquipmentMasterModal from '../components/EquipmentMasterModal';
import { 
  Building2, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Building,
  Tag,
  Sliders,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Hash
} from 'lucide-react';

export default function SiteListScreen({ onNavigate, onSelectSite, onSelectPosition }) {
  const [sites, setSites] = useState(getSites());
  const [positions, setPositions] = useState(getPositions());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showMappingsModal, setShowMappingsModal] = useState(false);
  const [showEquipmentMasterModal, setShowEquipmentMasterModal] = useState(false);

  // Modals for CRUD operations
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [activeClient, setActiveClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);

  // Sync state on storage events
  useEffect(() => {
    const handleUpdate = () => {
      setSites(getSites());
      setPositions(getPositions());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('ifspl:data_cleared', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('ifspl:data_cleared', handleUpdate);
    };
  }, []);

  const handleConfirmClearAll = () => {
    clearAllClientData();
    setSites([]);
    setPositions([]);
    setSelectedClientIds([]);
    setIsClearModalOpen(false);
  };

  const handleSeedDemoData = () => {
    seedDemoClientData();
    setSites(getSites());
    setPositions(getPositions());
  };

  // Helper to generate fresh initial form data with 1-year contract defaults
  const getInitialFormData = () => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    nextYear.setDate(nextYear.getDate() - 1);
    const nextYearStr = nextYear.toISOString().slice(0, 10);

    return {
      clientName: '',
      contactPhone: '+91 ',
      email: '',
      taxId: '',
      city: 'Vadodara',
      address: 'Industrial Estate, GIDC',
      poNumber: `PO/IFS/${today.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      poDate: todayStr,
      amcType: 'Quarterly',
      noOfVisits: 4,
      amcExpiryDate: nextYearStr
    };
  };

  // Form states for Add/Edit
  const [formData, setFormData] = useState(getInitialFormData());

  // Automatically update contracted visit count when AMC type changes
  const handleAmcTypeChange = (type) => {
    let visits = formData.noOfVisits;
    if (type === 'Monthly') visits = 12;
    else if (type === 'Bi-Monthly') visits = 6;
    else if (type === 'Quarterly') visits = 4;
    else if (type === 'Half-Yearly') visits = 2;
    else if (type === 'Annually') visits = 1;

    setFormData(prev => ({
      ...prev,
      amcType: type,
      noOfVisits: visits
    }));
  };

  // Automatically default AMC Expiry Date to 1 year when PO Date is adjusted
  const handlePoDateChange = (date) => {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const expiry = new Date(d);
      expiry.setFullYear(expiry.getFullYear() + 1);
      expiry.setDate(expiry.getDate() - 1);
      setFormData(prev => ({
        ...prev,
        poDate: date,
        amcExpiryDate: expiry.toISOString().slice(0, 10)
      }));
    } else {
      setFormData(prev => ({ ...prev, poDate: date }));
    }
  };

  // Re-fetch sites on storage update
  const reloadSites = () => {
    setSites(getSites());
  };

  // Filter clients
  const filteredSites = sites.filter((site) => {
    const q = searchQuery.toLowerCase().trim();
    const name = (site.clientName || site.company || site.name || '').toLowerCase();
    const phone = (site.contactPhone || '').toLowerCase();
    const email = (site.email || '').toLowerCase();
    const tax = (site.taxId || '').toLowerCase();
    const po = (site.poNumber || '').toLowerCase();
    const amc = (site.amcType || site.frequency || '').toLowerCase();
    const matchesQuery = !q || name.includes(q) || phone.includes(q) || email.includes(q) || tax.includes(q) || po.includes(q) || amc.includes(q);

    if (statusFilter === 'ALL') return matchesQuery;
    return matchesQuery && site.status.toUpperCase() === statusFilter;
  });

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedClientIds(filteredSites.map(s => s.id));
    } else {
      setSelectedClientIds([]);
    }
  };

  const handleToggleSelectOne = (id) => {
    if (selectedClientIds.includes(id)) {
      setSelectedClientIds(selectedClientIds.filter(item => item !== id));
    } else {
      setSelectedClientIds([...selectedClientIds, id]);
    }
  };

  const allSelected = filteredSites.length > 0 && selectedClientIds.length === filteredSites.length;

  // View / Inspect action (opens QR scanner directly)
  const handleViewClient = (site) => {
    if (onSelectSite) onSelectSite(site);
    onNavigate('qr-scanner');
  };

  // Open full Client Details modal
  const handleOpenView = (site, e) => {
    if (e) e.stopPropagation();
    setViewClient(site);
    setIsViewModalOpen(true);
  };

  // Edit action (Pencil icon)
  const handleOpenEdit = (site, e) => {
    if (e) e.stopPropagation();
    setActiveClient(site);
    setFormData({
      clientName: site.clientName || site.name || '',
      contactPhone: site.contactPhone || '',
      email: site.email || '',
      taxId: site.taxId || '',
      city: site.city || '',
      address: site.address || '',
      poNumber: site.poNumber || '',
      poDate: site.poDate || '',
      amcType: site.amcType || site.frequency || 'Quarterly',
      noOfVisits: site.noOfVisits !== undefined ? site.noOfVisits : 4,
      amcExpiryDate: site.amcExpiryDate || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!activeClient) return;
    updateSite(activeClient.id, formData);
    reloadSites();
    setIsEditModalOpen(false);
    setActiveClient(null);
  };

  // Delete action (Trash icon)
  const handleOpenDelete = (site, e) => {
    if (e) e.stopPropagation();
    setActiveClient(site);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!activeClient) return;
    deleteSite(activeClient.id);
    reloadSites();
    setIsDeleteModalOpen(false);
    setActiveClient(null);
  };

  // Add action (Green + button)
  const handleOpenAdd = () => {
    setFormData(getInitialFormData());
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) return;
    addSite(formData);
    reloadSites();
    setIsAddModalOpen(false);
  };

  // Export CSV (Download icon)
  const handleExportCSV = () => {
    const listToExport = selectedClientIds.length > 0
      ? sites.filter(s => selectedClientIds.includes(s.id))
      : sites;

    const headers = [
      'Client Name',
      'Contact No',
      'Email ID',
      'Tax ID',
      'City',
      'Address',
      'PO Number',
      'PO Date',
      'Type of AMC',
      'No of Visits',
      'AMC Expire Date',
      'Status'
    ];
    const rows = listToExport.map(s => [
      `"${s.clientName || s.name || ''}"`,
      `"${s.contactPhone || ''}"`,
      `"${s.email || ''}"`,
      `"${s.taxId || ''}"`,
      `"${s.city || ''}"`,
      `"${s.address || ''}"`,
      `"${s.poNumber || ''}"`,
      `"${s.poDate || ''}"`,
      `"${s.amcType || s.frequency || ''}"`,
      `"${s.noOfVisits || ''}"`,
      `"${s.amcExpiryDate || ''}"`,
      `"${s.status || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clients_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header Card matching the user's reference screenshot */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #EAECF0',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
      }}>
        
        {/* Top Control Bar: "Clients: 4" on left, Search/Tools on right */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Left Title: Clients: 4 */}
          <div style={{ fontSize: '1.08rem', fontWeight: 700, color: '#111827' }}>
            <span>Clients: </span>
            <span style={{ fontWeight: 600, color: '#4B5563' }}>{filteredSites.length}</span>
          </div>

          {/* Right Action Icons & Search Toolbar */}
          <div className="site-list-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Filter Funnel Icon with Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: showFilterDropdown ? '#F3F4F6' : 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: 0
                }}
                title="Filter by AMC status"
              >
                <Filter size={18} />
              </button>

              {showFilterDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  width: '180px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  padding: '6px',
                  zIndex: 30
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', padding: '6px 8px' }}>
                    Filter Status
                  </div>
                  {['ALL', 'IN PROGRESS', 'COMPLETED', 'SCHEDULED'].map(status => (
                    <div
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilterDropdown(false);
                      }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: statusFilter === status ? '#0F172A' : '#4B5563',
                        backgroundColor: statusFilter === status ? '#F3F4F6' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{status}</span>
                      {statusFilter === status && <Check size={14} color="#059669" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search clients... Input */}
            <div className="site-list-search-box" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 12px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              width: '240px'
            }}>
              <Search size={15} color="#6B7280" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.84rem',
                  backgroundColor: 'transparent',
                  width: '100%',
                  color: '#111827'
                }}
              />
            </div>

            {/* Upload / Import Icon */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                cursor: 'pointer',
                padding: 0
              }}
              title="Import Clients CSV"
            >
              <Upload size={18} />
            </button>

            {/* Download / Export Icon */}
            <button
              onClick={handleExportCSV}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                cursor: 'pointer',
                padding: 0
              }}
              title="Export Clients CSV"
            >
              <Download size={18} />
            </button>

            {/* Dark Green Circular "+" Button */}
            <button
              onClick={handleOpenAdd}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#064E3B',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(6, 78, 59, 0.3)',
                padding: 0,
                minHeight: 'unset'
              }}
              title="Add New Client"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>

            {/* Clear All Client Data Button (Production Clean Slate) */}
            {sites.length > 0 && (
              <button
                onClick={() => setIsClearModalOpen(true)}
                style={{
                  height: '34px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Clear All Client Data (Start Fresh for Production)"
              >
                <Trash2 size={13} />
                <span>Clear Clients</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="client-table-desktop-header" style={{
          alignItems: 'center',
          gap: '8px',
          padding: '4px 18px',
          fontSize: '0.74rem',
          fontWeight: 700,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {/* Select All Checkbox */}
          <div>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                borderRadius: '4px',
                accentColor: '#064E3B'
              }}
            />
          </div>

          <div>CLIENT</div>
          <div>CONTACT NO</div>
          <div>EMAIL ID</div>
          <div>PO NUMBER</div>
          <div style={{ textAlign: 'center' }}>+</div>
          <div style={{ textAlign: 'right' }}>ACTIONS</div>
        </div>
      </div>

      {/* Selected Items Batch Banner */}
      {selectedClientIds.length > 0 && (
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          padding: '8px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: '#166534'
        }}>
          <span><strong>{selectedClientIds.length}</strong> client(s) selected</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExportCSV}
              style={{
                padding: '3px 10px',
                fontSize: '0.76rem',
                fontWeight: 600,
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #86EFAC',
                color: '#166534',
                cursor: 'pointer'
              }}
            >
              Export Selected
            </button>
            <button
              onClick={() => setSelectedClientIds([])}
              style={{
                padding: '3px 10px',
                fontSize: '0.76rem',
                fontWeight: 600,
                borderRadius: '6px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#166534',
                cursor: 'pointer'
              }}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Client List Rows (Each row is a rounded card container matching reference) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredSites.map((site) => {
          const isSelected = selectedClientIds.includes(site.id);
          const clientTitle = site.clientName || site.company || site.name;

          return (
            <div
              key={site.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #EAECF0',
                padding: '13px 18px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                transition: 'background-color 0.1s ease, border-color 0.1s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#EAECF0';
              }}
              onClick={() => handleViewClient(site)}
            >
              {/* DESKTOP ROW VIEW (> 768px) */}
              <div className="client-row-desktop">
                {/* Row Checkbox */}
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelectOne(site.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      accentColor: '#064E3B'
                    }}
                  />
                </div>

                {/* Client Name with Building Icon & AMC Sub-details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div style={{
                    color: '#4B5563',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Building2 size={18} strokeWidth={1.8} />
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {clientTitle}
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: '#536174',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      <span style={{ color: '#00875A', fontWeight: 600 }}>
                        {site.amcType || site.frequency || 'Quarterly'} ({site.noOfVisits || 4} Visits)
                      </span>
                      <span style={{ color: '#D1D5DB' }}>•</span>
                      <span style={{ color: '#788494' }}>
                        Exp: {site.amcExpiryDate || site.contractPeriod || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact No */}
                <div style={{
                  fontSize: '0.86rem',
                  color: '#374151',
                  whiteSpace: 'nowrap'
                }}>
                  {site.contactPhone || '—'}
                </div>

                {/* Email ID */}
                <div style={{
                  fontSize: '0.86rem',
                  color: '#4B5563',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {site.email || '—'}
                </div>

                {/* PO Number */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: '#111827',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={site.poNumber || '—'}
                >
                  {site.poNumber || '—'}
                </div>

                {/* Spacer Column */}
                <div />

                {/* Actions Column (Eye, Pencil, Red Trash) */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '12px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => handleOpenView(site, e)}
                    style={{
                      color: '#374151',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 'unset'
                    }}
                    title="View Client Details & AMC Dossier"
                  >
                    <Eye size={17} />
                  </button>

                  <button
                    onClick={(e) => handleOpenEdit(site, e)}
                    style={{
                      color: '#374151',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 'unset'
                    }}
                    title="Edit Client Information"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={(e) => handleOpenDelete(site, e)}
                    style={{
                      color: '#DC2626',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 'unset'
                    }}
                    title="Delete Client"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* MOBILE CARD VIEW (<= 768px) */}
              <div className="client-row-mobile">
                {/* Top Row: Checkbox, Client Name, AMC Frequency Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(site.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          accentColor: '#064E3B'
                        }}
                      />
                    </div>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#374151'
                    }}>
                      <Building2 size={16} strokeWidth={2} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '0.94rem',
                        fontWeight: 700,
                        color: '#111827',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {clientTitle}
                      </div>
                      <div style={{
                        fontSize: '0.72rem',
                        color: '#00875A',
                        fontWeight: 600,
                        marginTop: '1px'
                      }}>
                        {site.amcType || site.frequency || 'Quarterly'} • {site.noOfVisits || 4} Visits
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #DBEAFE',
                    flexShrink: 0
                  }}>
                    {site.amcStatus || 'Active'}
                  </span>
                </div>

                {/* Details Grid (Phone, PO, Email) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '6px 10px',
                  padding: '8px 10px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #F1F5F9',
                  fontSize: '0.76rem'
                }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>Contact Phone</span>
                    <a
                      href={`tel:${site.contactPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: '#0284C7',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '1px'
                      }}
                    >
                      <Phone size={11} /> {site.contactPhone || '—'}
                    </a>
                  </div>

                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>PO Number</span>
                    <span style={{
                      color: '#111827',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      display: 'block',
                      marginTop: '1px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {site.poNumber || '—'}
                    </span>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>Email Address</span>
                    <span style={{
                      color: '#475569',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {site.email || '—'}
                    </span>
                  </div>
                </div>

                {/* Bottom Row Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '4px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleViewClient(site)}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      backgroundColor: '#064E3B',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <span>View Assets</span>
                    <ArrowRight size={13} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={(e) => handleOpenView(site, e)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="View Client Dossier"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      onClick={(e) => handleOpenEdit(site, e)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Edit Client Information"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      onClick={(e) => handleOpenDelete(site, e)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '6px',
                        border: '1px solid #FEE2E2',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Delete Client"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {sites.length === 0 ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #EAECF0',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <Building2 size={28} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
                Production Workspace Ready
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.86rem', color: '#6B7280', maxWidth: '480px' }}>
                No clients registered yet. All 26 digital checklists (CL-01 to CL-26), SOP standards, equipment master types, and QR code tools are loaded and ready. Register your first industrial facility to start.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
              <button
                onClick={handleOpenAdd}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  backgroundColor: '#064E3B',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Register First Client
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Upload size={16} /> Import Client CSV
              </button>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.78rem', color: '#9CA3AF' }}>
              Need test fixtures? <button onClick={handleSeedDemoData} style={{ background: 'none', border: 'none', color: '#0B6B63', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.78rem' }}>Load demo clients for evaluation</button>
            </div>
          </div>
        ) : filteredSites.length === 0 ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #EAECF0',
            padding: '36px 20px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            <p style={{ fontSize: '0.92rem', marginBottom: '6px' }}>No clients found matching "{searchQuery}"</p>
            <p style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Try adjusting your search terms or filter.</p>
          </div>
        ) : null}
      </div>

      {/* Bottom Utility Bar (Allows accessing Template Mappings and Asset Positions) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '10px 4px'
      }}>
        <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
          Indus Fire Safety AMC Management • Total Registered Equipment Positions: <strong>{positions.length}</strong>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowEquipmentMasterModal(true)}
            className="btn-outline"
            style={{
              height: '34px',
              fontSize: '0.78rem',
              padding: '0 12px',
              color: '#00875A',
              borderColor: '#A7F3D0',
              backgroundColor: '#ECFDF5',
              cursor: 'pointer'
            }}
          >
            <Sliders size={14} />
            <span>Equipment & Service Master</span>
          </button>
          <button
            onClick={() => setShowMappingsModal(true)}
            className="btn-outline"
            style={{ height: '34px', fontSize: '0.78rem', padding: '0 12px' }}
          >
            <Sliders size={14} />
            <span>Checklist Template Mappings</span>
          </button>
        </div>
      </div>

      {/* MODAL 0: VIEW CLIENT DETAILS DOSSIER */}
      {isViewModalOpen && viewClient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#D1FAE5',
                    color: '#065F46',
                    textTransform: 'uppercase'
                  }}>
                    Active AMC Client
                  </span>
                  <span style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: 600 }}>
                    {viewClient.code || viewClient.id}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  {viewClient.clientName || viewClient.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#536174', marginTop: '2px' }}>
                  {viewClient.plantFacility || viewClient.company}
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                style={{ color: '#9CA3AF', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Card 1: AMC & PO Contract Details */}
              <div style={{
                backgroundColor: '#F8F9FA',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '16px'
              }}>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FileText size={15} color="#00875A" />
                  <span>AMC & Purchase Order (PO) Details</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.84rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>PO Number</span>
                    <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{viewClient.poNumber || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>PO Date</span>
                    <strong style={{ color: '#0F172A' }}>{viewClient.poDate || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Type of AMC</span>
                    <strong style={{ color: '#00875A' }}>{viewClient.amcType || viewClient.frequency || 'Quarterly'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>No. of Visits</span>
                    <strong style={{ color: '#0F172A' }}>{viewClient.noOfVisits || 4} Visits / Year</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>AMC Expire Date</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <strong style={{ color: '#B45309' }}>{viewClient.amcExpiryDate || viewClient.contractPeriod || '—'}</strong>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        fontWeight: 600
                      }}>
                        Valid AMC Contract
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Contact & Plant Facility */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '16px'
              }}>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Building2 size={15} color="#2563EB" />
                  <span>Client Contact & Plant Location</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.84rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Contact Phone</span>
                    <strong style={{ color: '#0F172A' }}>{viewClient.contactPhone || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Email Address</span>
                    <strong style={{ color: '#0F172A' }}>{viewClient.email || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Tax ID (GSTIN)</span>
                    <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{viewClient.taxId || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>City / Region</span>
                    <strong style={{ color: '#0F172A' }}>{viewClient.city || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Plant / Site Address</span>
                    <span style={{ color: '#334155', fontSize: '0.82rem' }}>{viewClient.address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Positions & Coverage */}
              <div style={{
                backgroundColor: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem'
              }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Contracted Positions</span>
                  <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>
                    {positions.filter(p => p.siteId === viewClient.id).length || viewClient.totalPositions || 0} Units
                  </strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Inspected Coverage</span>
                  <strong style={{ fontSize: '1.05rem', color: '#00875A' }}>
                    {positions.filter(p => p.siteId === viewClient.id && p.inspectionStatus && p.inspectionStatus.startsWith('Inspected')).length || viewClient.inspectedPositions || 0} Inspected
                  </strong>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderTop: '1px solid #E5E7EB',
              backgroundColor: '#F8F9FA'
            }}>
              <button
                type="button"
                onClick={() => {
                  const clientToEdit = viewClient;
                  setIsViewModalOpen(false);
                  handleOpenEdit(clientToEdit);
                }}
                className="btn-outline"
                style={{ height: '38px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Pencil size={14} />
                <span>Edit Client</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="btn-outline"
                  style={{ height: '38px', fontSize: '0.84rem' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const clientToInspect = viewClient;
                    setIsViewModalOpen(false);
                    handleViewClient(clientToInspect);
                  }}
                  className="btn-primary"
                  style={{ height: '38px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Inspect Equipment / Scan QR</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW CLIENT */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Add New Client
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ color: '#9CA3AF', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Client / Company Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Apex Textiles Pvt. Ltd."
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="+91 98..."
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Email ID *
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="contact@company.demo"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Tax ID (GSTIN)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 24AAACA1234F1Z5"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    City / Region
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Vadodara, Bharuch..."
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              {/* AMC CONTRACT & PURCHASE ORDER DETAILS */}
              <div style={{
                backgroundColor: '#F8F9FA',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#064E3B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FileText size={15} />
                  <span>AMC Contract & Purchase Order Details</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      PO Number *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="e.g. PO/AIL/AMC/2026/8812"
                      value={formData.poNumber}
                      onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      PO Date *
                    </label>
                    <input
                      type="date"
                      required
                      className="input-field"
                      value={formData.poDate}
                      onChange={(e) => handlePoDateChange(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      Type of AMC *
                    </label>
                    <select
                      className="input-field"
                      value={formData.amcType}
                      onChange={(e) => handleAmcTypeChange(e.target.value)}
                      style={{ height: '40px', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="Monthly">Monthly (12 Visits / Year)</option>
                      <option value="Bi-Monthly">Bi-Monthly (6 Visits / Year)</option>
                      <option value="Quarterly">Quarterly (4 Visits / Year)</option>
                      <option value="Half-Yearly">Half-Yearly (2 Visits / Year)</option>
                      <option value="Annually">Annually (1 Visit / Year)</option>
                      <option value="Custom">Custom Schedule</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      No. of Visits *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      required
                      className="input-field"
                      placeholder="e.g. 4"
                      value={formData.noOfVisits}
                      onChange={(e) => setFormData({ ...formData, noOfVisits: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    AMC Expire Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={formData.amcExpiryDate}
                    onChange={(e) => setFormData({ ...formData, amcExpiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-outline"
                  style={{ height: '38px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
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
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CLIENT */}
      {isEditModalOpen && activeClient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Edit Client: {activeClient.clientName || activeClient.name}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ color: '#9CA3AF', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Client / Company Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Email ID *
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Tax ID (GSTIN)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    City / Region
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              {/* AMC CONTRACT & PURCHASE ORDER DETAILS */}
              <div style={{
                backgroundColor: '#F8F9FA',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#064E3B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FileText size={15} />
                  <span>AMC Contract & Purchase Order Details</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      PO Number *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={formData.poNumber}
                      onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      PO Date *
                    </label>
                    <input
                      type="date"
                      required
                      className="input-field"
                      value={formData.poDate}
                      onChange={(e) => handlePoDateChange(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      Type of AMC *
                    </label>
                    <select
                      className="input-field"
                      value={formData.amcType}
                      onChange={(e) => handleAmcTypeChange(e.target.value)}
                      style={{ height: '40px', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="Monthly">Monthly (12 Visits / Year)</option>
                      <option value="Bi-Monthly">Bi-Monthly (6 Visits / Year)</option>
                      <option value="Quarterly">Quarterly (4 Visits / Year)</option>
                      <option value="Half-Yearly">Half-Yearly (2 Visits / Year)</option>
                      <option value="Annually">Annually (1 Visit / Year)</option>
                      <option value="Custom">Custom Schedule</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      No. of Visits *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      required
                      className="input-field"
                      value={formData.noOfVisits}
                      onChange={(e) => setFormData({ ...formData, noOfVisits: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    AMC Expire Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={formData.amcExpiryDate}
                    onChange={(e) => setFormData({ ...formData, amcExpiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-outline"
                  style={{ height: '38px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ height: '38px', fontSize: '0.84rem' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CLIENT CONFIRMATION */}
      {isDeleteModalOpen && activeClient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626' }}>
              <AlertCircle size={22} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#111827' }}>
                Delete Client?
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#4B5563', margin: 0 }}>
              Are you sure you want to remove <strong>{activeClient.clientName || activeClient.name}</strong> from the client roster?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-outline"
                style={{ height: '36px', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: IMPORT CLIENTS CSV */}
      {isImportModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Import Clients via CSV
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                style={{ color: '#9CA3AF', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
              Upload a CSV file containing columns: <code>Client Name, Contact No, Email, Tax ID, City, Address, PO Number, PO Date, Type of AMC, No of Visits, AMC Expire Date</code>.
            </p>
            <label style={{
              border: '1.5px dashed #D1D5DB',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#F9FAFB',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'block'
            }}>
              <Upload size={24} style={{ margin: '0 auto 6px', color: '#9CA3AF' }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Click to select CSV file</div>
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>Supported format: .csv</div>
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const text = event.target.result;
                      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
                      if (lines.length <= 1) return;
                      for (let i = 1; i < lines.length; i++) {
                        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                        if (cols.length >= 1 && cols[0]) {
                          addSite({
                            clientName: cols[0],
                            contactPhone: cols[1] || '+91 98000 00000',
                            email: cols[2] || 'contact@client.demo',
                            taxId: cols[3] || '',
                            city: cols[4] || 'Vadodara',
                            address: cols[5] || 'Industrial Estate',
                            poNumber: cols[6] || `PO/IFS/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
                            poDate: cols[7] || new Date().toISOString().slice(0, 10),
                            amcType: cols[8] || 'Quarterly',
                            noOfVisits: cols[9] ? Number(cols[9]) : 4,
                            amcExpiryDate: cols[10] || ''
                          });
                        }
                      }
                      reloadSites();
                      setIsImportModalOpen(false);
                    } catch (err) {
                      console.error('Failed to parse CSV:', err);
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="btn-outline"
                style={{ height: '36px', fontSize: '0.82rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Demo Data Confirmation Modal */}
      {isClearModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626'
              }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
                  Clear All Client Data?
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#6B7280' }}>
                  Ready for real production launch
                </p>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              This will remove all demo client facilities, equipment positions, and active visits.
              <br /><br />
              <strong style={{ color: '#065F46' }}>✓ Preserved 100%:</strong> All 26 Checklists (CL-01 to CL-26), SOP documents, Equipment Masters, and QR code printing tools will remain intact.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="btn-outline"
                style={{ height: '36px', fontSize: '0.82rem', padding: '0 14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAll}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mappings Modal */}
      <TemplateMappingsModal
        isOpen={showMappingsModal}
        onClose={() => setShowMappingsModal(false)}
      />

      {/* Equipment Master Modal */}
      <EquipmentMasterModal
        isOpen={showEquipmentMasterModal}
        onClose={() => setShowEquipmentMasterModal(false)}
      />

    </div>
  );
}
