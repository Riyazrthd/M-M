import React, { useState } from 'react';
import { 
  Search, 
  Menu, 
  Bell, 
  Cloud,
  Calendar
} from 'lucide-react';
import NetworkStatusBadge from './NetworkStatusBadge';

export default function TopBar({ 
  currentScreen, 
  onNavigate, 
  onToggleMobileMenu, 
  onOpenCommandPalette,
  onOpenSupabaseBackup
}) {
  const [showNotifications, setShowNotifications] = useState(false);

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
    'client-360-reports': 'Client 360° AMC Intelligence',
    'client-portal': 'Client Compliance Portal'
  };

  const sampleNotifications = [
    { id: 1, title: 'HPT 35-Bar Test Due', desc: 'POS-AIL-004 due for hydro testing within 48h', type: 'urgent', time: '10m ago' },
    { id: 2, title: 'Inspection Pending', desc: 'Boiler House 2 has 4 units unverified', type: 'warning', time: '1h ago' },
    { id: 3, title: 'Cylinder Replaced', desc: 'Permanent QR retained for POS-AIL-001', type: 'info', time: '2h ago' }
  ];

  return (
    <header style={{
      height: '50px',
      minHeight: '50px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E1E5E9',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 14px',
      gap: '10px',
      width: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 0 }}>
        <button
          onClick={onToggleMobileMenu}
          className="mobile-hamburger-btn"
          style={{
            padding: '5px',
            borderRadius: '6px',
            color: '#536174',
            display: 'none', // Shown via CSS media query
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'unset',
            border: '1px solid #E1E5E9',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer'
          }}
          title="Open Menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <h1 style={{
            fontSize: '14.5px',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '180px',
            letterSpacing: '-0.01em'
          }}>
            {SCREEN_TITLES[currentScreen] || 'Indus AMC System'}
          </h1>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 5px',
            borderRadius: '4px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            border: '1px solid #DBEAFE',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            lineHeight: 1.2
          }}>
            Phase 1
          </span>
          <span className="hide-on-mobile" style={{
            fontSize: '11px',
            color: '#64748B',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: '2px'
          }}>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <Calendar size={12} color="#94A3B8" />
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </span>
        </div>
      </div>

      {/* Center: Compact Global Command Search Bar */}
      <div 
        onClick={onOpenCommandPalette}
        style={{
          flex: '1 1 auto',
          maxWidth: '260px',
          minWidth: '60px',
          height: '32px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#CBD5E1';
          e.currentTarget.style.backgroundColor = '#F1F5F9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E2E8F0';
          e.currentTarget.style.backgroundColor = '#F8FAFC';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
          <Search size={14} color="#64748B" style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: '12px',
            color: '#64748B',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Search...
          </span>
        </div>

        <div className="hide-on-mobile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '10px',
          fontWeight: 600,
          color: '#64748B',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          padding: '1px 5px',
          borderRadius: '4px',
          flexShrink: 0,
          marginLeft: '4px'
        }}>
          <span>Ctrl K</span>
        </div>
      </div>

      {/* Right: Network Status, Cloud & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Compact Network Status Badge */}
        <NetworkStatusBadge />

        {/* Compact Supabase Cloud Status & Backup Button */}
        <button
          onClick={onOpenSupabaseBackup}
          style={{
            height: '32px',
            minHeight: '32px',
            padding: '0 8px',
            borderRadius: '6px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534',
            fontSize: '11.5px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxSizing: 'border-box'
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
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#16A34A',
            flexShrink: 0
          }} />
          <Cloud size={14} color="#16A34A" style={{ flexShrink: 0 }} />
          <span>Supabase Cloud</span>
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '32px',
              height: '32px',
              minHeight: '32px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              position: 'relative',
              cursor: 'pointer',
              padding: 0,
              boxSizing: 'border-box'
            }}
            title="Notifications"
          >
            <Bell size={15} />
            <span style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '6px',
              height: '6px',
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
