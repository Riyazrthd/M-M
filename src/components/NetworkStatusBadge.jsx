import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CloudCheck, Cloud, AlertCircle } from 'lucide-react';
import { getSyncQueueCount } from '../data/storage';
import { triggerInstantCloudSync } from '../services/supabaseBackup';

export default function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(getSyncQueueCount());
  const [syncStatus, setSyncStatus] = useState({
    status: 'synced', // 'synced' | 'syncing' | 'refreshing' | 'error'
    message: 'Live Cloud ✓',
    timestamp: Date.now()
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus({ status: 'synced', message: 'Live Cloud ✓', timestamp: Date.now() });
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus({ status: 'offline', message: 'Offline (Local)', timestamp: Date.now() });
    };
    const handleQueueChange = (e) => setQueueCount(e.detail?.count ?? getSyncQueueCount());

    const handleCloudSyncStatus = (e) => {
      if (e.detail) {
        setSyncStatus({
          status: e.detail.status || 'synced',
          message: e.detail.message || 'Live Cloud ✓',
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('ifspl:sync_queue_updated', handleQueueChange);
    window.addEventListener('ifspl:cloud_sync_status', handleCloudSyncStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ifspl:sync_queue_updated', handleQueueChange);
      window.removeEventListener('ifspl:cloud_sync_status', handleCloudSyncStatus);
    };
  }, []);

  const handleManualSync = () => {
    if (isOnline) {
      triggerInstantCloudSync('manual_user_click');
    }
  };

  const isSyncing = syncStatus.status === 'syncing' || syncStatus.status === 'refreshing';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', flexShrink: 0 }}>
      {/* Cloud Sync Status Pill (Clickable to trigger instant sync) */}
      <button
        onClick={handleManualSync}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          height: '32px',
          padding: '0 9px',
          borderRadius: '6px',
          backgroundColor: !isOnline 
            ? '#FEF2F2' 
            : isSyncing 
              ? '#EFF6FF' 
              : syncStatus.status === 'error'
                ? '#FFFBEB'
                : '#F0FDF4',
          color: !isOnline 
            ? '#991B1B' 
            : isSyncing 
              ? '#1D4ED8' 
              : syncStatus.status === 'error'
                ? '#92400E'
                : '#166534',
          border: `1px solid ${
            !isOnline 
              ? '#FECACA' 
              : isSyncing 
                ? '#BFDBFE' 
                : syncStatus.status === 'error'
                  ? '#FDE68A'
                  : '#BBF7D0'
          }`,
          fontWeight: 600,
          fontSize: '11.5px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxSizing: 'border-box',
          cursor: isOnline ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        title={
          !isOnline 
            ? 'Offline Mode. Changes saved locally and will auto-sync when connected.' 
            : isSyncing 
              ? 'Synchronizing in background with cloud database...' 
              : 'Connected to Supabase Cloud in real time. Click to force instant cloud refresh.'
        }
      >
        <span 
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: !isOnline 
              ? '#DC2626' 
              : isSyncing 
                ? '#2563EB' 
                : syncStatus.status === 'error'
                  ? '#D97706'
                  : '#16A34A',
            flexShrink: 0,
            animation: isSyncing ? 'pulse 1s infinite' : 'none'
          }} 
        />
        {isSyncing ? (
          <RefreshCw 
            size={12} 
            style={{ 
              flexShrink: 0, 
              animation: 'spin 1s linear infinite' 
            }} 
          />
        ) : !isOnline ? (
          <WifiOff size={12} style={{ flexShrink: 0 }} />
        ) : (
          <Cloud size={12} style={{ flexShrink: 0 }} />
        )}
        <span>
          {!isOnline 
            ? 'Offline (Cached)' 
            : isSyncing 
              ? syncStatus.message 
              : syncStatus.status === 'error'
                ? 'Cloud Syncing...'
                : syncStatus.message}
        </span>
      </button>

      {/* Sync Queue Badge (Shown when offline actions remain) */}
      {queueCount > 0 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            height: '32px',
            padding: '0 7px',
            borderRadius: '6px',
            backgroundColor: '#EFF6FF',
            color: '#1D4ED8',
            border: '1px solid #BFDBFE',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}
          title={`${queueCount} inspection changes queued for sync`}
        >
          <RefreshCw size={11} style={{ flexShrink: 0 }} />
          <span>Queue</span>
          <span style={{ 
            backgroundColor: '#DC2626', 
            color: '#FFFFFF', 
            borderRadius: '9999px', 
            padding: '1px 5px', 
            fontSize: '10px',
            lineHeight: 1,
            fontWeight: 700
          }}>
            {queueCount}
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
