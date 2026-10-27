import React, { useState, useEffect, useRef } from 'react';
import { Search, QrCode, Building2, ClipboardCheck, LayoutDashboard, ShieldCheck, ArrowRight, X, FileText, PlusCircle } from 'lucide-react';
import { getPositions, getSites } from '../data/storage';

export default function CommandPaletteModal({ isOpen, onClose, onNavigate, onSelectSite, onSelectPosition }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else if (onOpen) onOpen();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positions = getPositions();
  const sites = getSites();
  const cleanQ = query.trim().toLowerCase();

  // Search Results
  const matchingScreens = [
    { id: 'manager-dashboard', title: 'Manager AMC Dashboard', category: 'Screen', icon: LayoutDashboard },
    { id: 'site-list', title: 'Industrial Sites & Plant AMC', category: 'Screen', icon: Building2 },
    { id: 'asset-register', title: 'Register New Asset & Generate QR', category: 'Workflow', icon: PlusCircle },
    { id: 'qr-scanner', title: 'QR Tag Scanner (Camera & Manual)', category: 'Screen', icon: QrCode },
    { id: 'digital-checklist', title: 'Digital Checklist Inspection (CL-11 / CL-03)', category: 'Screen', icon: ClipboardCheck },
    { id: 'client-portal', title: 'Client Read-Only Portal (Audits & Sign-off)', category: 'Screen', icon: ShieldCheck }
  ].filter(s => !cleanQ || s.title.toLowerCase().includes(cleanQ));

  const matchingSites = sites.filter(s =>
    !cleanQ || s.name.toLowerCase().includes(cleanQ) || s.code.toLowerCase().includes(cleanQ) || s.city.toLowerCase().includes(cleanQ)
  );

  const matchingPositions = positions.filter(p =>
    !cleanQ ||
    p.id.toLowerCase().includes(cleanQ) ||
    p.qrCode.toLowerCase().includes(cleanQ) ||
    p.locationDescription?.toLowerCase().includes(cleanQ) ||
    p.equipmentCategory?.toLowerCase().includes(cleanQ) ||
    p.currentEquipment?.serialNumber?.toLowerCase().includes(cleanQ)
  ).slice(0, 8);

  const matchingChecklists = [
    { id: 'CL-11', docNo: 'IFSPL/M&M/CL/011', title: 'Hydro Testing & Pressurisation (Extinguishers)', type: 'CL-11' },
    { id: 'CL-03', docNo: 'IFSPL/M&M/CL/003', title: 'Delivery Hose Boxes Maintenance', type: 'CL-03' },
    { id: 'CL-26', docNo: 'IFSPL/M&M/CL/026', title: 'Routine Fire Extinguisher Monthly Inspection', type: 'CL-26' }
  ].filter(c => !cleanQ || c.title.toLowerCase().includes(cleanQ) || c.id.toLowerCase().includes(cleanQ) || c.docNo.toLowerCase().includes(cleanQ));

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 16px 20px 16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF'
        }}>
          <Search size={20} color="#6B7280" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search assets, serials, QR tags, plants, SOP checklists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              color: '#111827',
              backgroundColor: 'transparent'
            }}
          />
          {query ? (
            <button 
              onClick={() => setQuery('')}
              style={{ padding: '4px', color: '#9CA3AF', borderRadius: '4px' }}
            >
              <X size={16} />
            </button>
          ) : (
            <span style={{
              fontSize: '0.72rem',
              padding: '2px 6px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              color: '#6B7280',
              fontWeight: 600
            }}>
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div style={{ overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Screens / Workflows */}
          {matchingScreens.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', paddingLeft: '8px' }}>
                Quick Navigation & Workflows
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {matchingScreens.map(s => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onNavigate(s.id);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                        backgroundColor: '#FFFFFF'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{s.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Jump to {s.category.toLowerCase()} module</div>
                        </div>
                      </div>
                      <ArrowRight size={14} color="#9CA3AF" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Asset Positions & QR Codes */}
          {matchingPositions.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', paddingLeft: '8px' }}>
                Equipment Positions & QR Tags ({matchingPositions.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {matchingPositions.map(pos => (
                  <div
                    key={pos.id}
                    onClick={() => {
                      if (onSelectPosition) onSelectPosition(pos);
                      onNavigate('asset-details');
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s ease',
                      backgroundColor: '#FFFFFF'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                        <QrCode size={16} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{pos.id}</span>
                          <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#F3F4F6', color: '#4B5563', fontFamily: 'monospace' }}>
                            {pos.qrCode}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#6B7280' }}>
                          {pos.locationDescription} • Serial: {pos.currentEquipment?.serialNumber || 'N/A'} ({pos.currentEquipment?.capacity || pos.templateId})
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563EB' }}>View Dossier &rarr;</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sites */}
          {matchingSites.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', paddingLeft: '8px' }}>
                Industrial Client Plants
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {matchingSites.map(site => (
                  <div
                    key={site.id}
                    onClick={() => {
                      if (onSelectSite) onSelectSite(site);
                      onNavigate('site-list');
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s ease',
                      backgroundColor: '#FFFFFF'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{site.name}</div>
                        <div style={{ fontSize: '0.76rem', color: '#6B7280' }}>{site.city} • {site.poNumber} • {site.totalPositions} positions</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#DC2626' }}>Select Site &rarr;</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist Templates */}
          {matchingChecklists.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', paddingLeft: '8px' }}>
                Standard Operating Checklists (SOP)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {matchingChecklists.map(chk => (
                  <div
                    key={chk.id}
                    onClick={() => {
                      onNavigate('digital-checklist');
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s ease',
                      backgroundColor: '#FFFFFF'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                          <span style={{ color: '#059669', marginRight: '6px' }}>[{chk.id}]</span>
                          {chk.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#6B7280' }}>Document: {chk.docNo} • IS 2190 / IS 5 compliant</div>
                      </div>
                    </div>
                    <ArrowRight size={14} color="#9CA3AF" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchingScreens.length === 0 && matchingPositions.length === 0 && matchingSites.length === 0 && matchingChecklists.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6B7280' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '4px' }}>No results found for "{query}"</p>
              <p style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Try searching by serial number, position ID, plant name, or SOP code.</p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#F9FAFB',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#6B7280'
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span><strong style={{ color: '#111827' }}>&uarr;&darr;</strong> navigate</span>
            <span><strong style={{ color: '#111827' }}>&crarr;</strong> select</span>
            <span><strong style={{ color: '#111827' }}>esc</strong> close</span>
          </div>
          <span>Indus Fire Safety AMC Engine</span>
        </div>
      </div>
    </div>
  );
}
