import React, { useState } from 'react';
import { ArrowRight, X, Sparkles } from 'lucide-react';

export default function DemoNoticeBanner({ onNavigate, currentScreen }) {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('ifspl_demo_banner_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('ifspl_demo_banner_dismissed', 'true');
    } catch (e) {}
  };

  const isAlreadyOnRegister = currentScreen === 'asset-register';

  return (
    <div style={{
      backgroundColor: '#FFFBEB',
      borderBottom: '1px solid #FEF3C7',
      padding: '7px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '13px',
      color: '#92400E',
      zIndex: 30
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: '#FDE68A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Sparkles size={11} color="#B45309" />
        </div>
        <span style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '13px',
          fontWeight: 400
        }}>
          <strong style={{ fontWeight: 600 }}>Demo environment:</strong> Sample industrial plants & position records loaded. Register your own equipment to test live QR stickers and auto-checklists.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {!isAlreadyOnRegister && (
          <button
            onClick={() => onNavigate('asset-register')}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#92400E',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid #FDE68A',
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              padding: '2px 8px',
              cursor: 'pointer',
              minHeight: 'unset'
            }}
          >
            <span>Register Asset</span>
            <ArrowRight size={12} />
          </button>
        )}

        <button
          onClick={handleDismiss}
          style={{
            color: '#B45309',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'unset',
            opacity: 0.8
          }}
          title="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
