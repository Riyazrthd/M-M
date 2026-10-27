import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Database, 
  Download, 
  UploadCloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  X, 
  ExternalLink,
  ShieldCheck,
  FileCode,
  HardDrive
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  downloadSQLBackupFile, 
  downloadJSONBackupFile, 
  generateSupabaseSQLBackup,
  testSupabaseConnection, 
  pushDataToSupabase, 
  pullDataFromSupabase 
} from '../services/supabaseBackup';
import { getSites, getPositions, getVisits, getPlantTechnicians } from '../data/storage';

export default function SupabaseBackupModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('download'); // 'download' | 'sync' | 'guide'
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);

  const [copiedSQL, setCopiedSQL] = useState(false);
  const [sqlPreview, setSqlPreview] = useState('');

  // Local storage counts
  const sitesCount = getSites().length;
  const positionsCount = getPositions().length;
  const visitsCount = getVisits().length;
  const techsCount = getPlantTechnicians().length;

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setAutoSync(config.autoSync || false);
      setLastSyncedAt(config.lastSyncedAt || null);
      setTestResult(null);
      setSyncResult(null);
      setRestoreResult(null);
      setCopiedSQL(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'guide' && !sqlPreview) {
      try {
        const preview = generateSupabaseSQLBackup();
        setSqlPreview(preview.slice(0, 1500) + '\n\n-- ... [Remaining INSERT statements included in download] ...');
      } catch (e) {
        setSqlPreview('-- Error generating SQL preview');
      }
    }
  }, [activeTab, sqlPreview]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      autoSync
    });
    setTestResult({ success: true, message: 'Supabase credentials saved locally.' });
  };

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, message: 'Please enter both Supabase Project URL and Anon Key.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url, anonKey);
    setTesting(false);
    setTestResult(res);
  };

  const handlePushToCloud = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setSyncResult({ success: false, error: 'Please enter both Supabase Project URL and Anon Key.' });
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim(), autoSync });
    const res = await pushDataToSupabase(url, anonKey);
    setSyncing(false);
    setSyncResult(res);
    if (res.success) {
      setLastSyncedAt(res.syncedAt);
    }
  };

  const handlePullFromCloud = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setRestoreResult({ success: false, error: 'Please enter both Supabase Project URL and Anon Key.' });
      return;
    }
    if (!window.confirm('This will restore data from your Supabase cloud tables into local storage. Continue?')) {
      return;
    }
    setRestoring(true);
    setRestoreResult(null);
    const res = await pullDataFromSupabase(url, anonKey);
    setRestoring(false);
    setRestoreResult(res);
  };

  const handleCopySQL = () => {
    try {
      const fullSQL = generateSupabaseSQLBackup();
      navigator.clipboard.writeText(fullSQL);
      setCopiedSQL(true);
      setTimeout(() => setCopiedSQL(false), 2500);
    } catch (e) {
      alert('Could not copy automatically. Please use the Download button.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(17, 24, 39, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E1E5E9',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #E1E5E9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F7F8F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#111827',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Database size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#17191C', margin: 0 }}>
                  Supabase Cloud Database & Backup
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0'
                }}>
                  PostgreSQL 14+
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#536174', margin: '2px 0 0 0' }}>
                Save, replicate, and restore all digital AMC data to your Supabase cloud database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#788494',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #E1E5E9',
          padding: '0 24px',
          backgroundColor: '#FFFFFF',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveTab('download')}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === 'download' ? '#111827' : '#536174',
              borderBottom: activeTab === 'download' ? '2px solid #111827' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} />
            <span>Download Backup Files</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === 'sync' ? '#111827' : '#536174',
              borderBottom: activeTab === 'sync' ? '2px solid #111827' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <UploadCloud size={16} />
            <span>Live Cloud Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === 'guide' ? '#111827' : '#536174',
              borderBottom: activeTab === 'guide' ? '2px solid #111827' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileCode size={16} />
            <span>Setup Guide & SQL</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: DOWNLOAD BACKUP FILES */}
          {activeTab === 'download' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Summary Stats Card */}
              <div style={{
                backgroundColor: '#F7F8F9',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #E1E5E9'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#17191C', marginBottom: '12px' }}>
                  Live Data Ready to Backup
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '6px', border: '1px solid #E1E5E9' }}>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>{sitesCount}</div>
                    <div style={{ fontSize: '12px', color: '#536174' }}>Client Sites</div>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '6px', border: '1px solid #E1E5E9' }}>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#00875A' }}>{positionsCount}</div>
                    <div style={{ fontSize: '12px', color: '#536174' }}>Asset Positions (QR)</div>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '6px', border: '1px solid #E1E5E9' }}>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>{visitsCount}</div>
                    <div style={{ fontSize: '12px', color: '#536174' }}>AMC Visits</div>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '6px', border: '1px solid #E1E5E9' }}>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>{techsCount}</div>
                    <div style={{ fontSize: '12px', color: '#536174' }}>Plant Technicians</div>
                  </div>
                </div>
              </div>

              {/* Action 1: SQL Backup File */}
              <div style={{
                border: '1px solid #E1E5E9',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: '#ECFDF5',
                    color: '#00875A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FileCode size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#17191C', margin: '0 0 4px 0' }}>
                      Supabase Complete SQL Backup (.sql)
                    </h3>
                    <p style={{ fontSize: '13px', color: '#536174', margin: 0, lineHeight: 1.4 }}>
                      Self-contained PostgreSQL script containing table DDL, RLS security policies, performance indexes, and full <code>INSERT</code> statements for all current data.
                    </p>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#00875A', fontWeight: 500 }}>
                      ✓ Includes all client PO details, linked equipment capacities, and inspection history
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => downloadSQLBackupFile()}
                  style={{
                    height: '40px',
                    padding: '0 18px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: '#111827',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <Download size={16} />
                  <span>Download .SQL</span>
                </button>
              </div>

              {/* Action 2: JSON Backup File */}
              <div style={{
                border: '1px solid #E1E5E9',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <HardDrive size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#17191C', margin: '0 0 4px 0' }}>
                      Standard Cloud JSON Backup (.json)
                    </h3>
                    <p style={{ fontSize: '13px', color: '#536174', margin: 0, lineHeight: 1.4 }}>
                      Structured JSON export of all database collections, ideal for API pipelines, backups, and programmatic migration.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => downloadJSONBackupFile()}
                  style={{
                    height: '40px',
                    padding: '0 18px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: '#FFFFFF',
                    color: '#17191C',
                    borderRadius: '6px',
                    border: '1px solid #E1E5E9',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <Download size={16} />
                  <span>Download .JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CLOUD SYNC */}
          {activeTab === 'sync' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '13px',
                color: '#166534',
                lineHeight: 1.5
              }}>
                <strong>Direct PostgREST Cloud Sync:</strong> Connect this app directly to your Supabase project. Any asset positions, inspections, and client AMC data will be saved directly into your cloud database.
              </div>

              {/* Supabase URL Input */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#17191C', marginBottom: '6px' }}>
                  Supabase Project URL:
                </label>
                <input
                  type="text"
                  placeholder="https://your-project-id.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid #E1E5E9',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#788494', marginTop: '4px', display: 'block' }}>
                  Found under Supabase Dashboard → Project Settings → API → Project URL
                </span>
              </div>

              {/* Supabase Anon Key Input */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#17191C', marginBottom: '6px' }}>
                  Supabase Anon Public API Key:
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid #E1E5E9',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#788494', marginTop: '4px', display: 'block' }}>
                  Found under Supabase Dashboard → Project Settings → API → Project API Keys (anon / public)
                </span>
              </div>

              {/* Action Row */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: '#FFFFFF',
                    color: '#17191C',
                    border: '1px solid #E1E5E9',
                    borderRadius: '6px',
                    cursor: testing ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RefreshCw size={16} className={testing ? 'spin' : ''} />
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: '#F3F4F4',
                    color: '#17191C',
                    border: '1px solid #E1E5E9',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Save Credentials
                </button>
              </div>

              {/* Test Connection Result Alert */}
              {testResult && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '6px',
                  backgroundColor: testResult.success ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${testResult.success ? '#BBF7D0' : '#FECACA'}`,
                  color: testResult.success ? '#166534' : '#991B1B',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {testResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Cloud Sync Buttons */}
              <div style={{
                borderTop: '1px solid #E1E5E9',
                paddingTop: '16px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={handlePushToCloud}
                  disabled={syncing}
                  style={{
                    height: '42px',
                    padding: '0 20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: '#111827',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: syncing ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <UploadCloud size={18} />
                  <span>{syncing ? 'Pushing to Supabase...' : 'Save / Backup Local Data to Cloud'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullFromCloud}
                  disabled={restoring}
                  style={{
                    height: '42px',
                    padding: '0 18px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: '#FFFFFF',
                    color: '#17191C',
                    border: '1px solid #E1E5E9',
                    borderRadius: '6px',
                    cursor: restoring ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Download size={18} />
                  <span>{restoring ? 'Restoring...' : 'Restore from Cloud'}</span>
                </button>
              </div>

              {/* Sync Results */}
              {syncResult && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '6px',
                  backgroundColor: syncResult.success ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${syncResult.success ? '#BBF7D0' : '#FECACA'}`,
                  color: syncResult.success ? '#166534' : '#991B1B',
                  fontSize: '13px'
                }}>
                  {syncResult.success ? (
                    <div>
                      <strong>✓ Cloud Backup Succeeded!</strong> Saved {syncResult.stats.sites} sites, {syncResult.stats.positions} asset positions, and {syncResult.stats.visits} inspection visits to Supabase.
                    </div>
                  ) : (
                    <div>
                      <strong>✗ Backup Error:</strong> {syncResult.error}
                    </div>
                  )}
                </div>
              )}

              {/* Restore Results */}
              {restoreResult && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '6px',
                  backgroundColor: restoreResult.success ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${restoreResult.success ? '#BBF7D0' : '#FECACA'}`,
                  color: restoreResult.success ? '#166534' : '#991B1B',
                  fontSize: '13px'
                }}>
                  {restoreResult.success ? (
                    <div>
                      <strong>✓ Local Storage Restored!</strong> Pulled {restoreResult.restored.sites} sites and {restoreResult.restored.positions} positions from Supabase cloud.
                    </div>
                  ) : (
                    <div>
                      <strong>✗ Restore Error:</strong> {restoreResult.error}
                    </div>
                  )}
                </div>
              )}

              {lastSyncedAt && (
                <div style={{ fontSize: '12px', color: '#536174' }}>
                  Last cloud backup completed at: {new Date(lastSyncedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETUP GUIDE & SQL VIEWER */}
          {activeTab === 'guide' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', color: '#17191C', lineHeight: 1.6 }}>
                Follow these 3 simple steps to save your AMC data onto a free Supabase cloud database:
              </div>

              {/* Step 1 */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#111827',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  1
                </div>
                <div>
                  <strong style={{ fontSize: '14px', color: '#17191C' }}>Create a Free Supabase Project</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#536174' }}>
                    Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>supabase.com</a>, sign in with GitHub or email, and click <strong>"New Project"</strong>. Choose your region (e.g. Mumbai, India).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#111827',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  2
                </div>
                <div>
                  <strong style={{ fontSize: '14px', color: '#17191C' }}>Execute the SQL Schema Backup</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#536174' }}>
                    Click <strong>SQL Editor</strong> in the left sidebar of Supabase. Click the button below to copy the full SQL script, paste it into the editor, and click <strong>Run</strong>.
                  </p>
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleCopySQL}
                      style={{
                        height: '34px',
                        padding: '0 14px',
                        fontSize: '13px',
                        fontWeight: 500,
                        backgroundColor: copiedSQL ? '#00875A' : '#111827',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {copiedSQL ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedSQL ? 'Full SQL Copied to Clipboard!' : 'Copy Full SQL Script'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#111827',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  3
                </div>
                <div>
                  <strong style={{ fontSize: '14px', color: '#17191C' }}>Connect in Tab 2 for Automatic Cloud Sync</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#536174' }}>
                    Copy your <strong>Project URL</strong> and <strong>Anon Key</strong> from Project Settings → API in Supabase. Paste them in the "Live Cloud Sync" tab to enable one-click cloud backup anytime!
                  </p>
                </div>
              </div>

              {/* SQL Code Preview Window */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#536174' }}>SQL Schema Preview:</span>
                  <span style={{ fontSize: '11px', color: '#788494' }}>Stored file: <code>supabase_schema_backup.sql</code></span>
                </div>
                <pre style={{
                  backgroundColor: '#1E293B',
                  color: '#E2E8F0',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  maxHeight: '180px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  margin: 0
                }}>
                  {sqlPreview || '-- Loading preview...'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #E1E5E9',
          backgroundColor: '#F7F8F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#536174' }}>
            <ShieldCheck size={16} color="#00875A" />
            <span>RLS Protected &bull; Zero financial values stored</span>
          </div>

          <button
            onClick={onClose}
            style={{
              height: '36px',
              padding: '0 16px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: '#FFFFFF',
              color: '#17191C',
              border: '1px solid #E1E5E9',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
