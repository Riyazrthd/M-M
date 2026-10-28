import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  QrCode, 
  PlusCircle, 
  ClipboardCheck, 
  Camera, 
  FileCheck2, 
  ShieldCheck, 
  Sliders, 
  LogOut, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Moon, 
  Sun,
  Layers,
  HelpCircle,
  PhoneCall,
  Cloud
} from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '../data/storage';
import { DEMO_USERS } from '../data/sampleData';

export default function Sidebar({
  currentScreen,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenSettings,
  onOpenEquipmentMaster,
  onOpenSupabaseBackup
}) {
  const [user, setUserState] = useState(getCurrentUser());
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleRoleChange = (newUser) => {
    setCurrentUser(newUser);
    setUserState(newUser);
    setShowRoleDropdown(false);
    if (newUser.role === 'client') {
      onNavigate('client-portal');
    } else if (newUser.role === 'manager') {
      onNavigate('manager-dashboard');
    } else {
      onNavigate('site-list');
    }
  };

  const navGroups = [
    {
      groupTitle: 'Operations',
      items: [
        { id: 'manager-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'site-list', label: 'Client List', icon: Building2 },
        { id: 'qr-management', label: 'QR Code Management', icon: QrCode, badge: 'Bulk' },
        { id: 'asset-register', label: 'Register Asset & QR', icon: PlusCircle, badge: 'New' },
        { id: 'qr-scanner', label: 'QR Tag Scanner', icon: QrCode }
      ]
    },
    {
      groupTitle: 'Field AMC',
      items: [
        { id: 'asset-details', label: 'Asset Dossier & Swaps', icon: Layers },
        { id: 'digital-checklist', label: 'Digital Checklist', icon: ClipboardCheck },
        { id: 'photo-remarks', label: 'Evidence & Spares', icon: Camera },
        { id: 'visit-summary', label: 'Visit Sign-Off', icon: FileCheck2 }
      ]
    },
    {
      groupTitle: 'Compliance',
      items: [
        { id: 'client-portal', label: 'Client Read-Only Portal', icon: ShieldCheck }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 60
          }}
        />
      )}

      {/* Main Sidebar Container */}
      <aside 
        className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsed ? '68px' : '260px',
          minWidth: isCollapsed ? '68px' : '260px',
          maxWidth: isCollapsed ? '68px' : '260px',
          flexShrink: 0,
          backgroundColor: '#F7F8F9',
          borderRight: '1px solid #E1E5E9',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 70,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
          overflowY: 'hidden',
          boxSizing: 'border-box',
          // Mobile drawer transform
          ...(isMobileOpen ? {
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: '280px',
            maxWidth: '280px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          } : {})
        }}
      >
        
        {/* Top Header / Branding */}
        <div style={{
          padding: isCollapsed ? '16px 10px' : '16px 14px',
          borderBottom: '1px solid #E1E5E9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          backgroundColor: '#F7F8F9'
        }}>
          {!isCollapsed ? (
            <div 
              onClick={() => onNavigate(user.role === 'client' ? 'client-portal' : 'manager-dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', overflow: 'hidden' }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                flexShrink: 0
              }}>
                <Flame size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                    Indus AMC
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: '#E5E7EB',
                    color: '#4B5563'
                  }}>
                    v1.0
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                  Fire Safety Systems
                </div>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => onNavigate('manager-dashboard')}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer'
              }}
              title="Indus AMC"
            >
              <Flame size={18} />
            </div>
          )}

          {/* Collapse Button (Hidden on Mobile Drawer) */}
          {!isMobileOpen && (
            <button
              onClick={onToggleCollapse}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                minHeight: 'unset'
              }}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}
        </div>

        {/* Navigation Links (Scrollable) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '12px 6px' : '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {!isCollapsed && (
                <div style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#788494',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0 8px 6px 8px'
                }}>
                  {group.groupTitle}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        if (isMobileOpen && onCloseMobile) onCloseMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      style={{
                        width: '100%',
                        minHeight: '38px',
                        height: '38px',
                        padding: isCollapsed ? '0' : '0 10px',
                        borderRadius: '8px',
                        backgroundColor: isActive ? '#E8E9EA' : 'transparent',
                        color: isActive ? '#17191C' : '#536174',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'space-between',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '13px',
                        transition: 'all 0.12s ease',
                        border: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#E8E9EA';
                          e.currentTarget.style.color = '#17191C';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#536174';
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        minWidth: 0,
                        flex: 1,
                        overflow: 'hidden'
                      }}>
                        <Icon 
                          size={18} 
                          color={isActive ? '#17191C' : '#536174'} 
                          strokeWidth={isActive ? 2.1 : 1.8}
                          style={{ flexShrink: 0 }}
                        />
                        {!isCollapsed && (
                          <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '-0.01em',
                            textAlign: 'left'
                          }}>
                            {item.label}
                          </span>
                        )}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span style={{
                          fontSize: '10px',
                          lineHeight: '1',
                          padding: '2.5px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                          flexShrink: 0,
                          marginLeft: '8px'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Information / Hotline Card (Matching Makoro sidebar info box) */}
          {!isCollapsed && (
            <div style={{
              margin: '6px 4px 0 4px',
              padding: '12px',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E1E5E9',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00875A' }}></span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#17191C' }}>IS 2190 & IS 5 Validated</span>
              </div>
              <p style={{ fontSize: '12px', color: '#536174', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                Real-time digital AMC certification & hydro-pressure tracking.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#DC2626', fontWeight: 600 }}>
                <PhoneCall size={12} />
                <span>+91 265 233 4590</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Settings & User Profile Pill */}
        <div style={{
          padding: isCollapsed ? '10px 6px' : '12px 10px',
          borderTop: '1px solid #E1E5E9',
          backgroundColor: '#F7F8F9',
          position: 'relative'
        }}>
          {/* Supabase Cloud Database & Backup Shortcut */}
          <button
            onClick={() => {
              if (onOpenSupabaseBackup) onOpenSupabaseBackup();
              if (isMobileOpen && onCloseMobile) onCloseMobile();
            }}
            title="Supabase Cloud Live (xvoirpdkblusopxrkbjo.supabase.co)"
            style={{
              width: '100%',
              minHeight: '34px',
              height: '34px',
              padding: isCollapsed ? '0' : '0 10px',
              borderRadius: '6px',
              color: '#166534',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '6px',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
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
              backgroundColor: '#00875A',
              flexShrink: 0
            }} />
            <Cloud size={15} color="#00875A" style={{ flexShrink: 0 }} />
            {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Supabase Cloud</span>}
          </button>

          {/* Equipment & Linked Services Master Shortcut */}
          <button
            onClick={() => {
              if (onOpenEquipmentMaster) onOpenEquipmentMaster();
              if (isMobileOpen && onCloseMobile) onCloseMobile();
            }}
            title="Equipment & Linked Target Services Master"
            style={{
              width: '100%',
              minHeight: '34px',
              height: '34px',
              padding: isCollapsed ? '0' : '0 10px',
              borderRadius: '6px',
              color: '#00875A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              marginBottom: '4px',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E8E9EA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Sliders size={16} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Equipment Master</span>}
          </button>

          {/* Settings Shortcut */}
          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              if (isMobileOpen && onCloseMobile) onCloseMobile();
            }}
            title="SOP Template Mappings"
            style={{
              width: '100%',
              minHeight: '34px',
              height: '34px',
              padding: isCollapsed ? '0' : '0 10px',
              borderRadius: '6px',
              color: '#536174',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              marginBottom: '6px',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E8E9EA';
              e.currentTarget.style.color = '#17191C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#536174';
            }}
          >
            <Sliders size={16} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Template Mappings</span>}
          </button>

          {/* User Profile Box */}
          <div 
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            style={{
              padding: isCollapsed ? '6px 0' : '6px 8px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E1E5E9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#111827',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '12px',
                flexShrink: 0
              }}>
                {user.name.charAt(0)}
              </div>
              {!isCollapsed && (
                <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#17191C', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#788494', textTransform: 'capitalize', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.role === 'technician' ? 'Field Engineer' : user.role === 'manager' ? 'Technical Manager' : 'Client Auditor'}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ChevronDown size={14} color="#788494" style={{ flexShrink: 0, marginLeft: '4px' }} />
            )}
          </div>

          {/* Role Switcher Popover */}
          {showRoleDropdown && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '10px',
              right: isCollapsed ? 'auto' : '10px',
              width: isCollapsed ? '200px' : 'auto',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
              padding: '6px',
              marginBottom: '6px',
              zIndex: 80
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', padding: '6px 8px' }}>
                Switch User Persona
              </div>
              {DEMO_USERS.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleRoleChange(u)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: u.id === user.id ? '#F3F4F6' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = u.id === user.id ? '#F3F4F6' : 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>{u.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{u.designation}</div>
                  </div>
                  {u.id === user.id && <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>Active</span>}
                </div>
              ))}

              <div style={{ borderTop: '1px solid #E5E7EB', margin: '4px 0' }} />

              <div
                onClick={() => {
                  setShowRoleDropdown(false);
                  onNavigate('login');
                }}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#DC2626',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
