import React from 'react';
import { Building2, QrCode, ClipboardCheck, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { getCurrentUser } from '../data/storage';

export default function BottomNav({ currentScreen, onNavigate }) {
  const user = getCurrentUser();

  const navItems = [
    { id: 'site-list', label: 'Sites', icon: Building2 },
    { id: 'qr-scanner', label: 'Scan QR', icon: QrCode },
    { id: 'digital-checklist', label: 'Checklist', icon: ClipboardCheck },
    { id: 'visit-summary', label: 'Signatures', icon: ShieldCheck },
    { id: 'manager-dashboard', label: 'Dashboard', icon: LayoutDashboard }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
