import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { getSyncQueueCount } from '../data/storage';

export default function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(getSyncQueueCount());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleQueueChange = (e) => setQueueCount(e.detail?.count ?? getSyncQueueCount());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('ifspl:sync_queue_updated', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ifspl:sync_queue_updated', handleQueueChange);
    };
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          backgroundColor: isOnline ? 'var(--status-ok-bg)' : 'var(--status-fail-bg)',
          color: isOnline ? 'var(--status-ok)' : 'var(--status-fail)',
          border: `1px solid ${isOnline ? 'var(--status-ok-border)' : 'var(--status-fail-border)'}`,
          fontWeight: 600
        }}
        title={isOnline ? "Network Connected. Local storage operational." : "Offline Mode. Changes cached locally."}
      >
        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '9999px',
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-light)',
          fontSize: '0.75rem',
          fontWeight: 600
        }}
        title="Phase 1: Local state with persistent queue. Phase 2: Live Supabase / Cloud sync."
      >
        <RefreshCw size={11} style={{ opacity: 0.7 }} />
        <span>Local Sync Ready</span>
        {queueCount > 0 && (
          <span style={{ 
            backgroundColor: 'var(--brand-crimson)', 
            color: '#fff', 
            borderRadius: '9999px', 
            padding: '1px 5px', 
            fontSize: '0.68rem',
            marginLeft: '2px'
          }}>
            {queueCount}
          </span>
        )}
      </div>
    </div>
  );
}
