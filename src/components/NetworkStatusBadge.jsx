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
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', flexShrink: 0 }}>
      {/* Online Status Pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          height: '32px',
          padding: '0 8px',
          borderRadius: '6px',
          backgroundColor: isOnline ? '#F0FDF4' : '#FEF2F2',
          color: isOnline ? '#166534' : '#991B1B',
          border: `1px solid ${isOnline ? '#BBF7D0' : '#FECACA'}`,
          fontWeight: 600,
          fontSize: '11.5px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxSizing: 'border-box'
        }}
        title={isOnline ? "Network Connected. Local storage operational." : "Offline Mode. Changes cached locally."}
      >
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#16A34A' : '#DC2626',
          flexShrink: 0
        }} />
        {isOnline ? <Wifi size={13} style={{ flexShrink: 0 }} /> : <WifiOff size={13} style={{ flexShrink: 0 }} />}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Sync Status Badge (Only shown when pending queue exists) */}
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
          title={`${queueCount} inspection changes pending sync`}
        >
          <RefreshCw size={11} style={{ flexShrink: 0 }} />
          <span>Sync</span>
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
    </div>
  );
}
