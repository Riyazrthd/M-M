import React, { useState, useEffect, useMemo } from 'react';
import { Flame, CheckCircle2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DemoNoticeBanner from './components/DemoNoticeBanner';
import BottomNav from './components/BottomNav';
import CommandPaletteModal from './components/CommandPaletteModal';
import TemplateMappingsModal from './components/TemplateMappingsModal';
import EquipmentMasterModal from './components/EquipmentMasterModal';
import SupabaseBackupModal from './components/SupabaseBackupModal';
import { autoSyncToSupabase, fetchPositionFromSupabase } from './services/supabaseBackup';

import LoginScreen from './screens/LoginScreen';
import SiteListScreen from './screens/SiteListScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import AssetDetailsScreen from './screens/AssetDetailsScreen';
import DigitalChecklistScreen from './screens/DigitalChecklistScreen';
import PhotoRemarksScreen from './screens/PhotoRemarksScreen';
import VisitSummaryScreen from './screens/VisitSummaryScreen';
import ManagerDashboardScreen from './screens/ManagerDashboardScreen';
import ClientPortalScreen from './screens/ClientPortalScreen';
import AssetRegisterScreen from './screens/AssetRegisterScreen';

import { 
  initStorage, 
  getCurrentUser, 
  getSites, 
  getPositions, 
  getPositionByQR, 
  resolveScannedAssetPosition 
} from './data/storage';

// Synchronously detect if launched directly via scanned QR code URL
const detectInitialScanState = () => {
  if (typeof window === 'undefined') return { isDirectScan: false, scanCode: null, position: null, site: null };
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const scanCode = urlParams.get('scan') || urlParams.get('pos') || urlParams.get('qr') || urlParams.get('id');
    if (scanCode) {
      initStorage();
      const pos = resolveScannedAssetPosition(scanCode, urlParams);
      const sites = getSites();
      const site = pos ? (sites.find(s => s.id === pos.siteId) || sites[0]) : (sites[0] || null);
      return {
        isDirectScan: true,
        scanCode,
        position: pos,
        site: site
      };
    }
  } catch (e) {
    console.warn('Initial scan detection error:', e);
  }
  return { isDirectScan: false, scanCode: null, position: null, site: null };
};

export default function App() {
  const initialScan = useMemo(() => detectInitialScanState(), []);

  // Direct scan mode flag: when true, hides sidebar, topbar, demo banners, and bottom navigation
  const [isDirectScanMode, setIsDirectScanMode] = useState(initialScan.isDirectScan);
  const [currentScreen, setCurrentScreen] = useState(initialScan.isDirectScan ? 'digital-checklist' : 'manager-dashboard');
  const [activeSite, setActiveSite] = useState(initialScan.site || null);
  const [activePosition, setActivePosition] = useState(initialScan.position || null);
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());

  // Layout UI state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEquipmentMasterOpen, setIsEquipmentMasterOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  useEffect(() => {
    initStorage();
    const sites = getSites();
    if (sites.length > 0 && !activeSite) {
      setActiveSite(sites[0]);
    }
    const positions = getPositions();
    if (positions.length > 0 && !activePosition) {
      setActivePosition(positions[0]);
    }

    // If direct scan mode is active, try to hydrate from Supabase in the background if needed
    if (initialScan.isDirectScan && initialScan.scanCode) {
      fetchPositionFromSupabase(initialScan.scanCode).then(cloudPos => {
        if (cloudPos) {
          setActivePosition(cloudPos);
        }
      });
    }

    const handleUserChange = (e) => {
      setCurrentUserState(e.detail);
    };
    window.addEventListener('ifspl:user_changed', handleUserChange);

    const handleSyncTrigger = () => {
      autoSyncToSupabase();
    };
    window.addEventListener('ifspl:sync_queue_updated', handleSyncTrigger);

    return () => {
      window.removeEventListener('ifspl:user_changed', handleUserChange);
      window.removeEventListener('ifspl:sync_queue_updated', handleSyncTrigger);
    };
  }, []);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateTo = (screenId) => {
    setCurrentScreen(screenId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSite = (site) => {
    setActiveSite(site);
    const sitePos = getPositions(site.id);
    if (sitePos.length > 0) {
      setActivePosition(sitePos[0]);
    }
  };

  const handleSelectPosition = (position) => {
    setActivePosition(position);
  };

  // Full-page login screen
  if (currentScreen === 'login') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
        <LoginScreen onNavigate={navigateTo} />
      </div>
    );
  }

  // DIRECT SCAN MODE: Field Inspection ONLY (Zero dashboard, zero sidebar, zero distractions)
  if (isDirectScanMode) {
    const pos = activePosition || getPositions()[0];

    return (
      <div className="direct-scan-shell" style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        padding: '12px',
        width: '100%'
      }}>
        {/* Main Inspection Body - Opens Direct Landscape Checklist */}
        <main style={{ flex: 1, padding: '0', maxWidth: '100%', width: '100%', margin: '0 auto' }}>
          {currentScreen === 'digital-checklist' && (
            <DigitalChecklistScreen
              position={pos}
              activeSite={activeSite}
              onNavigate={(nextScreen) => {
                if (nextScreen === 'photo-remarks') {
                  setCurrentScreen('photo-remarks');
                } else if (nextScreen === 'asset-details') {
                  setCurrentScreen('asset-details');
                } else {
                  setCurrentScreen(nextScreen);
                }
              }}
              isDirectScanMode={true}
            />
          )}

          {currentScreen === 'photo-remarks' && (
            <PhotoRemarksScreen
              activeSite={activeSite}
              onNavigate={(nextScreen) => {
                if (nextScreen === 'digital-checklist') {
                  setCurrentScreen('digital-checklist');
                } else {
                  setCurrentScreen(nextScreen);
                }
              }}
              isDirectScanMode={true}
            />
          )}

          {currentScreen === 'asset-details' && (
            <div>
              <button
                onClick={() => setCurrentScreen('digital-checklist')}
                className="btn-outline"
                style={{ marginBottom: '14px', height: '36px', padding: '0 12px', fontSize: '13px' }}
              >
                ← Return to Inspection Checklist
              </button>
              <AssetDetailsScreen
                position={pos}
                onNavigate={(nextScreen) => setCurrentScreen(nextScreen)}
                onUpdatePosition={handleSelectPosition}
                isDirectScanMode={true}
              />
            </div>
          )}
        </main>

        {/* Discreet Footer with option to exit direct scan and open manager portal */}
        <footer style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E1E5E9',
          padding: '14px 18px',
          textAlign: 'center',
          marginTop: 'auto'
        }}>
          <div style={{
            maxWidth: '960px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
              Indus Fire Safety Private Limited • Dedicated Digital Field Inspection
            </span>
            <button
              type="button"
              onClick={() => {
                setIsDirectScanMode(false);
                setCurrentScreen('manager-dashboard');
                if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                  const cleanUrl = window.location.pathname;
                  window.history.pushState({}, '', cleanUrl);
                }
              }}
              style={{
                fontSize: '11.5px',
                color: '#4B5563',
                backgroundColor: 'transparent',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '5px 12px',
                cursor: 'pointer'
              }}
            >
              Open Full Manager Portal →
            </button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* 1. Makoro Enterprise Left Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenEquipmentMaster={() => setIsEquipmentMasterOpen(true)}
        onOpenSupabaseBackup={() => setIsSupabaseModalOpen(true)}
      />

      {/* 2. Main Application Column */}
      <div className="app-main-column">
        {/* Top Navigation Bar */}
        <TopBar
          currentScreen={currentScreen}
          onNavigate={navigateTo}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenSupabaseBackup={() => setIsSupabaseModalOpen(true)}
          activeSite={activeSite}
          onSelectSite={handleSelectSite}
        />

        {/* Yellow/Amber Demo Notice Banner */}
        <DemoNoticeBanner onNavigate={navigateTo} currentScreen={currentScreen} />

        {/* Screen Content Area */}
        <main className="app-content-body">
          {currentScreen === 'site-list' && (
            <SiteListScreen
              onNavigate={navigateTo}
              onSelectSite={handleSelectSite}
              onSelectPosition={handleSelectPosition}
            />
          )}

          {currentScreen === 'asset-register' && (
            <AssetRegisterScreen
              onNavigate={navigateTo}
              onAssetRegistered={(newPos) => {
                setActivePosition(newPos);
              }}
            />
          )}

          {currentScreen === 'qr-scanner' && (
            <QRScannerScreen
              activeSite={activeSite}
              onNavigate={navigateTo}
              onSelectPosition={handleSelectPosition}
            />
          )}

          {currentScreen === 'asset-details' && (
            <AssetDetailsScreen
              position={activePosition || getPositions()[0]}
              onNavigate={navigateTo}
              onUpdatePosition={handleSelectPosition}
            />
          )}

          {currentScreen === 'digital-checklist' && (
            <DigitalChecklistScreen
              position={activePosition || getPositions()[0]}
              activeSite={activeSite}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'photo-remarks' && (
            <PhotoRemarksScreen
              activeSite={activeSite}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'visit-summary' && (
            <VisitSummaryScreen
              activeSite={activeSite}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'manager-dashboard' && (
            <ManagerDashboardScreen
              onNavigate={navigateTo}
              onSelectSite={handleSelectSite}
              onSelectPosition={handleSelectPosition}
            />
          )}

          {currentScreen === 'client-portal' && (
            <ClientPortalScreen
              onNavigate={navigateTo}
            />
          )}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation (Shown only on small screens) */}
      <BottomNav currentScreen={currentScreen} onNavigate={navigateTo} />

      {/* 4. Global Command Palette Modal (Ctrl K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={navigateTo}
        onSelectSite={handleSelectSite}
        onSelectPosition={handleSelectPosition}
      />

      {/* 5. SOP Template Mappings Configuration Modal */}
      <TemplateMappingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 6. Equipment & Linked Target Service Master List Modal */}
      <EquipmentMasterModal
        isOpen={isEquipmentMasterOpen}
        onClose={() => setIsEquipmentMasterOpen(false)}
      />

      {/* 7. Supabase Cloud Database Backup & Sync Modal */}
      <SupabaseBackupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
