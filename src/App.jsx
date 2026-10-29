import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Flame, CheckCircle2, AlertCircle, Camera, ArrowRight, ShieldAlert } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DemoNoticeBanner from './components/DemoNoticeBanner';
import BottomNav from './components/BottomNav';
import CommandPaletteModal from './components/CommandPaletteModal';
import TemplateMappingsModal from './components/TemplateMappingsModal';
import EquipmentMasterModal from './components/EquipmentMasterModal';
import SupabaseBackupModal from './components/SupabaseBackupModal';
import { autoSyncToSupabase, fetchPositionFromSupabase, fetchSitesFromSupabase, initBackgroundCloudSync } from './services/supabaseBackup';
import { parseScannedQRToken } from './utils/qrUrlHelper';

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

const QRManagementScreen = lazy(() => import('./screens/QRManagementScreen'));
const Client360ReportScreen = lazy(() => import('./screens/Client360ReportScreen'));

import { 
  initStorage, 
  getCurrentUser, 
  getSites, 
  getPositions, 
  getPositionByQR, 
  resolveScannedAssetPosition,
  getQRRecordByToken
} from './data/storage';

// Synchronously detect if launched directly via scanned QR code URL
const detectInitialScanState = () => {
  if (typeof window === 'undefined') return { isDirectScan: false, scanCode: null, position: null, site: null, prefilledQR: null, isInvalidQR: false };
  try {
    const urlParams = new URLSearchParams(window.location.search);
    let rawCode = urlParams.get('scan') || urlParams.get('pos') || urlParams.get('qr') || urlParams.get('id') || urlParams.get('token');

    // Check pathname: e.g. /M-M/qr/IFS-QR-000001 or /qr/IFS-QR-000001
    if (!rawCode && window.location.pathname) {
      const pathMatch = window.location.pathname.match(/(?:\/qr\/|\/scan\/|\/pos\/|\/tag\/)([^\/\?\#]+)/i);
      if (pathMatch && pathMatch[1]) {
        rawCode = decodeURIComponent(pathMatch[1]);
      }
    }

    // Check hash: e.g. #/qr/IFS-QR-000001
    if (!rawCode && window.location.hash) {
      const hashMatch = window.location.hash.match(/(?:\/qr\/|\/scan\/|\/pos\/|\/tag\/)([^\/\?\#]+)/i);
      if (hashMatch && hashMatch[1]) {
        rawCode = decodeURIComponent(hashMatch[1]);
      }
    }

    // Check pending QR preserved across authentication
    if (!rawCode && typeof sessionStorage !== 'undefined') {
      rawCode = sessionStorage.getItem('ifspl_pending_qr');
    }

    if (rawCode) {
      const scanCode = parseScannedQRToken(rawCode);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('ifspl_pending_qr', scanCode);
      }

      initStorage();
      const resolved = resolveScannedAssetPosition(scanCode, urlParams);

      // Case 1: Unassigned pre-printed QR code in registry
      if (resolved && resolved.isUnassignedQR) {
        return {
          isDirectScan: false,
          isInvalidQR: false,
          scanCode,
          position: null,
          site: getSites()[0] || null,
          prefilledQR: resolved.qrRecord,
          initialScreen: 'asset-register'
        };
      }

      // Case 2: Invalid or retired QR code
      if (resolved && resolved.isInvalidQR) {
        return {
          isDirectScan: false,
          isInvalidQR: true,
          scanCode,
          errorMessage: resolved.error || `QR Code "${scanCode}" is not recognized in the permanent registry.`,
          position: null,
          site: null,
          prefilledQR: null,
          initialScreen: 'invalid-qr'
        };
      }

      // Case 3: Valid assigned asset position
      if (resolved && resolved.positionId) {
        const pos = resolved;
        const sites = getSites();
        const site = pos ? (sites.find(s => s.id === pos.siteId) || sites[0]) : (sites[0] || null);
        return {
          isDirectScan: true,
          isInvalidQR: false,
          scanCode,
          position: pos,
          site: site,
          prefilledQR: null,
          initialScreen: 'digital-checklist'
        };
      }
    }
  } catch (e) {
    console.warn('Initial scan detection error:', e);
  }
  return { isDirectScan: false, scanCode: null, position: null, site: null, prefilledQR: null, isInvalidQR: false };
};

export default function App() {
  const initialScan = useMemo(() => detectInitialScanState(), []);

  // Direct scan mode flag: when true, hides sidebar, topbar, demo banners, and bottom navigation
  const [isDirectScanMode, setIsDirectScanMode] = useState(initialScan.isDirectScan);
  const [currentScreen, setCurrentScreen] = useState(initialScan.initialScreen || (initialScan.isDirectScan ? 'digital-checklist' : 'manager-dashboard'));
  const [activeSite, setActiveSite] = useState(initialScan.site || null);
  const [activePosition, setActivePosition] = useState(initialScan.position || null);
  const [prefilledQR, setPrefilledQR] = useState(initialScan.prefilledQR || null);
  const [invalidQRInfo, setInvalidQRInfo] = useState(
    initialScan.isInvalidQR ? { token: initialScan.scanCode, error: initialScan.errorMessage } : null
  );
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [activeReportClientId, setActiveReportClientId] = useState(null);

  // Layout UI state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEquipmentMasterOpen, setIsEquipmentMasterOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  useEffect(() => {
    initStorage();
    initBackgroundCloudSync({ intervalMs: 6000 });
    
    // Eagerly pull latest client master records from Supabase Cloud on launch
    fetchSitesFromSupabase().then(freshSites => {
      if (freshSites && freshSites.length > 0 && !activeSite) {
        setActiveSite(freshSites[0]);
      }
    }).catch(() => {});

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

  const navigateTo = (screenId, extraData = null) => {
    if (screenId === 'client-360-reports') {
      if (typeof extraData === 'string') {
        setActiveReportClientId(extraData);
      } else if (extraData && typeof extraData === 'object' && (extraData.clientName || extraData.name)) {
        setActiveReportClientId(extraData.clientName || extraData.name);
      } else if (!extraData) {
        setActiveReportClientId(null);
      }
    }
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

  // Full-page login screen with QR redirect preservation (Requirement 3)
  if (currentScreen === 'login') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
        <LoginScreen 
          onNavigate={navigateTo} 
          onLoginSuccess={(user, pendingQR) => {
            setCurrentUserState(user);
            if (pendingQR) {
              const res = resolveScannedAssetPosition(pendingQR);
              if (res && res.isUnassignedQR) {
                setPrefilledQR(res.qrRecord);
                setInvalidQRInfo(null);
                navigateTo('asset-register');
                return;
              }
              if (res && res.positionId) {
                setActivePosition(res);
                setIsDirectScanMode(true);
                setInvalidQRInfo(null);
                navigateTo('digital-checklist');
                return;
              }
              if (res && res.isInvalidQR) {
                setInvalidQRInfo({ token: pendingQR, error: res.error });
                navigateTo('invalid-qr');
                return;
              }
            }
            if (user.role === 'client') {
              navigateTo('client-portal');
            } else if (user.role === 'manager') {
              navigateTo('manager-dashboard');
            } else {
              navigateTo('site-list');
            }
          }}
        />
      </div>
    );
  }

  // Invalid or Retired QR Code Screen (Requirement 2: Step 3)
  if (currentScreen === 'invalid-qr' || (isDirectScanMode && invalidQRInfo)) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px'
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <ShieldAlert size={34} />
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
            Unrecognized or Retired QR Code
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748B', margin: '0 0 16px', lineHeight: 1.5 }}>
            {invalidQRInfo?.error || initialScan.errorMessage || 'This QR token was not found in the asset database or permanent registry.'}
          </p>
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#F1F5F9',
            borderRadius: '6px',
            border: '1px dashed #CBD5E1',
            display: 'inline-block',
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: 700,
            color: '#334155',
            marginBottom: '24px'
          }}>
            {invalidQRInfo?.token || initialScan.scanCode || 'UNKNOWN-QR'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('ifspl_pending_qr'); } catch (e) {}
                setIsDirectScanMode(false);
                setInvalidQRInfo(null);
                navigateTo('qr-scanner');
              }}
              className="btn-primary"
              style={{
                height: '42px',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#111827',
                color: '#FFFFFF',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Camera size={16} />
              <span>Scan Another QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('ifspl_pending_qr'); } catch (e) {}
                setIsDirectScanMode(false);
                setInvalidQRInfo(null);
                navigateTo('site-list');
              }}
              style={{
                height: '40px',
                fontSize: '13.5px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <span>View Sites & Asset List</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('ifspl_pending_qr'); } catch (e) {}
                setIsDirectScanMode(false);
                setInvalidQRInfo(null);
                navigateTo('manager-dashboard');
              }}
              style={{
                height: '40px',
                fontSize: '13.5px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                color: '#64748B',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span>Return to Manager Portal</span>
            </button>
          </div>
        </div>
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
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
        />

        {/* Yellow/Amber Demo Notice Banner */}
        <DemoNoticeBanner onNavigate={navigateTo} currentScreen={currentScreen} />

        {/* Screen Content Area */}
        <main className="app-content-body">
          <Suspense fallback={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '12px', color: '#475569' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTopColor: '#DC2626', borderRadius: '50%', animation: 'ifspl_spin 0.7s linear infinite' }}></div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Loading Module...</div>
            </div>
          }>
          {currentScreen === 'site-list' && (
            <SiteListScreen
              onNavigate={navigateTo}
              onSelectSite={handleSelectSite}
              onSelectPosition={handleSelectPosition}
            />
          )}

          {currentScreen === 'qr-management' && (
            <QRManagementScreen
              onNavigate={navigateTo}
              onRegisterWithQR={(qrRec) => {
                setPrefilledQR(qrRec);
                navigateTo('asset-register');
              }}
              onSelectPosition={handleSelectPosition}
            />
          )}

          {currentScreen === 'asset-register' && (
            <AssetRegisterScreen
              onNavigate={navigateTo}
              prefilledQR={prefilledQR}
              onAssetRegistered={(newPos) => {
                setActivePosition(newPos);
                setPrefilledQR(null);
              }}
            />
          )}

          {currentScreen === 'qr-scanner' && (
            <QRScannerScreen
              activeSite={activeSite}
              onNavigate={(target, data) => {
                if (data?.prefilledQR) {
                  setPrefilledQR(data.prefilledQR);
                }
                navigateTo(target);
              }}
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

          {currentScreen === 'client-360-reports' && (
            <Client360ReportScreen
              onNavigate={navigateTo}
              initialClientId={activeReportClientId}
              onSelectSite={handleSelectSite}
              onSelectPosition={handleSelectPosition}
            />
          )}

          {currentScreen === 'client-portal' && (
            <ClientPortalScreen
              onNavigate={navigateTo}
            />
          )}
          </Suspense>
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
