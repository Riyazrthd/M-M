import React, { useState } from 'react';
import { DEMO_USERS } from '../data/sampleData';
import { setCurrentUser } from '../data/storage';
import { ShieldCheck, LogIn, Key, Sparkles, Building2, User } from 'lucide-react';

export default function LoginScreen({ onNavigate }) {
  const [selectedUser, setSelectedUser] = useState(DEMO_USERS[0]);
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!pin) {
      setError('Please enter your 4-digit PIN');
      return;
    }
    setCurrentUser(selectedUser);
    if (selectedUser.role === 'client') {
      onNavigate('client-portal');
    } else if (selectedUser.role === 'manager') {
      onNavigate('manager-dashboard');
    } else {
      onNavigate('site-list');
    }
  };

  const handleQuickSelect = (user) => {
    setSelectedUser(user);
    setPin('1234');
    setError('');
  };

  return (
    <div style={{
      maxWidth: '460px',
      margin: '40px auto',
      padding: '0 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center' }}>
        <img
          src="/indus_fire_safety_logo.png"
          alt="Indus Fire Safety"
          style={{
            height: '72px',
            width: '72px',
            objectFit: 'contain',
            borderRadius: '16px',
            border: '1.5px solid var(--border-light)',
            backgroundColor: '#FFFFFF',
            padding: '4px',
            margin: '0 auto 12px',
            boxShadow: 'var(--shadow-card)'
          }}
        />
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '9999px',
          backgroundColor: '#FEF2F2',
          color: 'var(--brand-crimson)',
          fontSize: '0.75rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '8px'
        }}>
          <ShieldCheck size={14} /> Indus Fire Safety Pvt. Ltd.
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
          Digital AMC Inspection
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Standardised On-Site Safety Audit & Compliance Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Select Active User Profile:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEMO_USERS.map((u) => {
              const isSelected = u.id === selectedUser.id;
              return (
                <div
                  key={u.id}
                  onClick={() => handleQuickSelect(u)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${isSelected ? 'var(--brand-crimson)' : 'var(--border-light)'}`,
                    backgroundColor: isSelected ? 'var(--status-fail-bg)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? 'var(--brand-crimson)' : 'var(--bg-subtle)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {u.roleTitle} {u.company ? `• ${u.company}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${u.role === 'technician' ? 'badge-navy' : u.role === 'manager' ? 'badge-ok' : 'badge-neutral'}`} style={{ fontSize: '0.68rem' }}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Authentication PIN:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN (demo: 1234)"
                maxLength={6}
                style={{ paddingLeft: '40px', letterSpacing: '0.2em', fontWeight: 700 }}
              />
              <Key size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
            </div>
            {error && <p style={{ color: 'var(--brand-crimson)', fontSize: '0.8rem', marginTop: '4px' }}>{error}</p>}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', height: '48px', fontSize: '1rem', fontWeight: 700 }}
          >
            <LogIn size={18} /> Sign In to AMC Terminal
          </button>
        </form>

        <div style={{
          marginTop: '16px',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          fontSize: '0.78rem',
          color: '#92400E',
          lineHeight: 1.4
        }}>
          <strong>Demo Notice:</strong> Select any persona above to test the Technician inspection flow, Manager dashboard, or Client safety portal. Phase 2 integrates enterprise SSO and 2FA.
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Reference SOP: IFSPL/M&M/SOP/011 & 003 • Revision 00
      </div>
    </div>
  );
}
