import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DemoNoticeBanner from './components/DemoNoticeBanner';
import BottomNav from './components/BottomNav';
import CommandPaletteModal from './components/CommandPaletteModal';
import TemplateMappingsModal from './components/TemplateMappingsModal';
import EquipmentMasterModal from './components/EquipmentMasterModal';
import SupabaseBackupModal from './components/SupabaseBackupModal';
import { autoSyncToSupabase } from './services/supabaseBackup';

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

import { initStorage, getCurrentUser, getSites, getPositions, getPositionByQR } from './data/storage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('manager-dashboard');
  const [activeSite, setActiveSite] = useState(null);
  const [activePosition, setActivePosition] = useState(null);
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
    if (sites.length > 0) {
      setActiveSite(sites[0]);
    }
    const positions = getPositions();
    if (positions.length > 0) {
      setActivePosition(positions[0]);
    }

    // Auto-launch Checklist if opened via scanned QR code URL (e.g. ?scan=IFS-POS-000108)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const scanCode = urlParams.get('scan') || urlParams.get('pos') || urlParams.get('qr') || urlParams.get('id');
      if (scanCode) {
        const matched = getPositionByQR(scanCode);
        if (matched) {
          setActivePosition(matched);
          const matchedSite = sites.find(s => s.id === matched.siteId);
          if (matchedSite) setActiveSite(matchedSite);
          setCurrentScreen('digital-checklist');
        }
      }
    } catch (e) {
      console.warn('URL QR scan error:', e);
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
