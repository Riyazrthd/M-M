import React, { useState } from 'react';
import { 
  Search, 
  Menu, 
  Bell, 
  Building2, 
  ChevronDown, 
  Check, 
  AlertTriangle, 
  Info,
  ExternalLink,
  X,
  Cloud,
  Database
} from 'lucide-react';
import NetworkStatusBadge from './NetworkStatusBadge';
import { getSites } from '../data/storage';

export default function TopBar({ 
  currentScreen, 
  onNavigate, 
  onToggleMobileMenu, 
  onOpenCommandPalette,
  onOpenSupabaseBackup,
  activeSite,
  onSelectSite
}) {
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const sites = getSites();

  // Screen title mapping
  const SCREEN_TITLES = {
    'manager-dashboard': 'Executive AMC Dashboard',
    'site-list': 'Client List',
    'asset-register': 'Register Asset & Generate QR',
    'qr-scanner': 'QR Tag Camera Scanner',
    'asset-details': 'Equipment Position & Asset Dossier',
    'digital-checklist': 'Digital Inspection Checklist',
    'photo-remarks': 'Defect Evidence & Spares Gallery',
    'visit-summary': 'AMC Visit Summary & Signatures',
    'client-portal': 'Client Compliance Portal'
  };

  const sampleNotifications = [
    { id: 1, title: 'HPT 35-Bar Test Due', desc: 'POS-AIL-004 due for hydro testing within 48h', type: 'urgent', time: '10m ago' },
    { id: 2, title: 'Inspection Pending', desc: 'Boiler House 2 has 4 units unverified', type: 'warning', time: '1h ago' },
    { id: 3, title: 'Cylinder Replaced', desc: 'Permanent QR retained for POS-AIL-001', type: 'info', time: '2h ago' }
  ];

  return (
    <header style={{
      height: '56px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E1E5E9',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      gap: '12px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onToggleMobileMenu}
          className="mobile-hamburger-btn"
          style={{
            padding: '6px',
            borderRadius: '6px',
            color: '#536174',
            display: 'none', // Shown via CSS media query
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'unset',
            border: '1px solid #E1E5E9',
            backgroundColor: '#FFFFFF'
          }}
          title="Open Menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#17191C',
            margin: 0,
            whiteSpace: 'nowrap'
          }}>
            {SCREEN_TITLES[currentScreen] || 'Indus AMC System'}
          </h1>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            border: '1px solid #DBEAFE'
          }}>
            Phase 1
          </span>
        </div>
      </div>

      {/* Center: Makoro Global Command Search Bar */}
      <div 
        onClick={onOpenCommandPalette}
        style={{
          flex: 1,
          maxWidth: '520px',
          minWidth: 0,
          height: '38px',
          backgroundColor: '#F7F8F9',
          border: '1px solid #E1E5E9',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#D1D5DB';
          e.currentTarget.style.backgroundColor = '#E8E9EA';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E1E5E9';
          e.currentTarget.style.backgroundColor = '#F7F8F9';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <Search size={16} color="#788494" />
          <span style={{
            fontSize: '13.5px',
            color: '#788494',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Search assets, serials, QR tags, plants, SOP checklists...
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#536174',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E1E5E9',
          padding: '2px 6px',
          borderRadius: '5px'
        }}>
          <span>Ctrl</span>
          <span>K</span>
        </div>
      </div>

      {/* Right: Site Selector, Network Status, & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        
        {/* Plant / Site Selector Pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSiteDropdown(!showSiteDropdown)}
            style={{
              height: '36px',
              minHeight: '36px',
              padding: '0 12px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#111827',
              cursor: 'pointer'
            }}
          >
            <Building2 size={15} color="#DC2626" />
            <span style={{
              maxWidth: '160px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {activeSite ? activeSite.name : 'Select Plant'}
            </span>
            <ChevronDown size={14} color="#6B7280" />
          </button>

          {/* Plant Selector Dropdown */}
          {showSiteDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '6px',
              width: '280px',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '6px',
              zIndex: 90
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', padding: '6px 8px' }}>
                Select Industrial Plant
              </div>
              {sites.map(s => {
                const isSelected = activeSite?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (onSelectSite) onSelectSite(s);
                      setShowSiteDropdown(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? '#FEF2F2' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{s.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>{s.city} • {s.totalPositions} positions</div>
                    </div>
                    {isSelected && <Check size={14} color="#DC2626" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Network Status Badge */}
        <NetworkStatusBadge />

        {/* Supabase Cloud Status & Backup Button */}
        <button
          onClick={onOpenSupabaseBackup}
          style={{
            height: '36px',
            padding: '0 12px',
            borderRadius: '6px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534',
            fontSize: '13px',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
          title="Supabase Cloud Live (xvoirpdkblusopxrkbjo.supabase.co)"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#DCFCE7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F0FDF4';
          }}
        >
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#00875A'
          }} />
          <Cloud size={16} color="#00875A" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Supabase Cloud</span>
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '36px',
              height: '36px',
              minHeight: '36px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4B5563',
              position: 'relative',
              cursor: 'pointer',
              padding: 0
            }}
            title="Notifications"
          >
            <Bell size={17} />
            <span style={{
              position: 'absolute',
              top: '7px',
              right: '7px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#DC2626'
            }} />
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '6px',
              width: '320px',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '10px',
              zIndex: 90
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>AMC Operational Alerts</span>
                <span style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 600 }}>3 active</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sampleNotifications.map(n => (
                  <div key={n.id} style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: n.type === 'urgent' ? '#FEF2F2' : '#F9FAFB',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: n.type === 'urgent' ? '#DC2626' : '#111827' }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#4B5563' }}>{n.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
