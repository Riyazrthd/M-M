import React, { useState } from 'react';
import { getCurrentUser, setCurrentUser } from '../data/storage';
import { DEMO_USERS } from '../data/sampleData';
import NetworkStatusBadge from './NetworkStatusBadge';
import { ShieldCheck, UserCheck, ChevronDown, Layers, CheckCircle2 } from 'lucide-react';

export default function Header({ currentScreen, onNavigate }) {
  const [user, setUserState] = useState(getCurrentUser());
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showScreensMenu, setShowScreensMenu] = useState(false);

  const SCREENS = [
    { id: 'login', label: '1. Login Screen', category: 'Auth' },
    { id: 'site-list', label: '2. Site List Screen', category: 'Operations' },
    { id: 'asset-register', label: '➕ Register New Asset (QR)', category: 'Operations' },
    { id: 'qr-scanner', label: '3. QR Scanner Screen', category: 'Field' },
    { id: 'asset-details', label: '4. Asset Details & Swaps', category: 'Field' },
    { id: 'digital-checklist', label: '5. Digital Checklist (CL-11 / CL-03)', category: 'Audit' },
    { id: 'photo-remarks', label: '6. Photo & Remarks Gallery', category: 'Audit' },
    { id: 'visit-summary', label: '7. Visit Summary & Signatures', category: 'Sign-off' },
    { id: 'manager-dashboard', label: '8. Manager Dashboard', category: 'Management' },
    { id: 'client-portal', label: '9. Client Read-Only Portal', category: 'Client' }
  ];

  const handleRoleSelect = (newUser) => {
    setCurrentUser(newUser);
    setUserState(newUser);
    setShowRoleMenu(false);

    // Contextual navigation when switching role
    if (newUser.role === 'client') {
      onNavigate('client-portal');
    } else if (newUser.role === 'manager') {
      onNavigate('manager-dashboard');
    } else {
      onNavigate('site-list');
    }
  };

  return (
    <header style={{
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Brand Logo & Title */}
        <div 
          onClick={() => onNavigate(user.role === 'client' ? 'client-portal' : 'site-list')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <img
            src="/indus_fire_safety_logo.png"
            alt="Indus Fire Safety"
            style={{
              height: '42px',
              width: '42px',
              objectFit: 'contain',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              backgroundColor: '#FFFFFF',
              padding: '2px'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                letterSpacing: '0.05em', 
                color: 'var(--brand-crimson)', 
                textTransform: 'uppercase' 
              }}>
                Indus Fire Safety
              </span>
              <span className="badge badge-demo">Phase 1 Demo</span>
            </div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Digital AMC Inspection System
            </h1>
          </div>
        </div>

        {/* Right: Network Status, 9 Screens Navigator, & User / Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <NetworkStatusBadge />

          {/* Quick Navigator for all 9 screens */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowScreensMenu(!showScreensMenu); setShowRoleMenu(false); }}
              className="btn-outline"
              style={{
                height: '40px',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                backgroundColor: showScreensMenu ? 'var(--bg-subtle)' : 'var(--bg-surface)'
              }}
              title="Jump between all 9 Phase 1 screens"
            >
              <Layers size={16} color="var(--brand-navy)" />
              <span style={{ fontWeight: 700 }}>Screens (9)</span>
              <ChevronDown size={14} style={{ opacity: 0.6 }} />
            </button>

            {showScreensMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '280px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-float)',
                padding: '8px',
                zIndex: 60
              }}>
                <div style={{
                  padding: '6px 8px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid var(--border-light)',
                  marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>All 9 Phase 1 Screens</span>
                  <span style={{ color: 'var(--brand-crimson)' }}>Accessible</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '380px', overflowY: 'auto' }}>
                  {SCREENS.map((sc) => {
                    const isActive = currentScreen === sc.id;
                    return (
                      <button
                        key={sc.id}
                        onClick={() => {
                          onNavigate(sc.id);
                          setShowScreensMenu(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isActive ? 'var(--status-fail-bg)' : 'transparent',
                          color: isActive ? 'var(--brand-crimson)' : 'var(--text-main)',
                          border: isActive ? '1px solid var(--status-fail-border)' : '1px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: 'auto',
                          fontSize: '0.82rem',
                          fontWeight: isActive ? 700 : 500
                        }}
                      >
                        <span>{sc.label}</span>
                        {isActive && <CheckCircle2 size={14} color="var(--brand-crimson)" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Persona Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowRoleMenu(!showRoleMenu); setShowScreensMenu(false); }}
              className="btn-outline"
              style={{
                height: '40px',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem'
              }}
            >
              <UserCheck size={16} color="var(--brand-crimson)" />
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div style={{ fontWeight: 700 }}>{user.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.roleTitle}</div>
              </div>
              <ChevronDown size={14} style={{ opacity: 0.6 }} />
            </button>

            {showRoleMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '260px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-float)',
                padding: '8px',
                zIndex: 60
              }}>
                <div style={{ 
                  padding: '6px 8px 8px', 
                  fontSize: '0.72rem', 
                  fontWeight: 700, 
                  color: 'var(--text-muted)', 
                  textTransform: 'uppercase',
                  borderBottom: '1px solid var(--border-light)',
                  marginBottom: '6px'
                }}>
                  Switch Persona / Role (Demo)
                </div>

                {DEMO_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleRoleSelect(u)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: u.id === user.id ? 'var(--bg-subtle)' : 'transparent',
                      border: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '2px',
                      minHeight: 'auto',
                      marginBottom: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{u.name}</span>
                      <span className={`badge ${u.role === 'technician' ? 'badge-navy' : u.role === 'manager' ? 'badge-ok' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                        {u.role.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.roleTitle}</span>
                  </button>
                ))}

                <div style={{ 
                  borderTop: '1px solid var(--border-light)', 
                  marginTop: '6px', 
                  paddingTop: '6px' 
                }}>
                  <button
                    onClick={() => { setShowRoleMenu(false); onNavigate('login'); }}
                    style={{ 
                      width: '100%', 
                      fontSize: '0.85rem', 
                      color: 'var(--brand-crimson)', 
                      padding: '6px',
                      justifyContent: 'center',
                      minHeight: 'auto'
                    }}
                  >
                    Go to Full Login Screen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
