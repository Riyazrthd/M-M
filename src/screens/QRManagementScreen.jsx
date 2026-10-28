import React, { useState, useEffect, useMemo } from 'react';
import { 
  getQRRegistry, 
  getQRSequence, 
  generateBulkQRCodes 
} from '../data/storage';
import { generateBulkQRLabelsPDF, printBulkQRLabelsPreview } from '../utils/qrLabelPDFExporter';
import { 
  QrCode, 
  Printer, 
  PlusCircle, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  RefreshCw,
  FileText
} from 'lucide-react';

export default function QRManagementScreen({ onNavigate, onRegisterWithQR, onSelectPosition }) {
  const [registry, setRegistry] = useState(() => getQRRegistry());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'ASSIGNED'
  const [selectedBatch, setSelectedBatch] = useState('ALL');

  // Generate Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateQuantity, setGenerateQuantity] = useState(100);
  const [customQuantity, setCustomQuantity] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState('');
  const [generatedBatchResult, setGeneratedBatchResult] = useState(null);

  // PDF Download State
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState('');
  const [copiedToken, setCopiedToken] = useState('');

  // Reload registry when updated
  const refreshRegistry = () => {
    setRegistry(getQRRegistry());
  };

  useEffect(() => {
    const handleUpdate = () => refreshRegistry();
    window.addEventListener('ifspl:qr_registry_updated', handleUpdate);
    return () => window.removeEventListener('ifspl:qr_registry_updated', handleUpdate);
  }, []);

  // Compute Batches
  const allBatches = useMemo(() => {
    const batchSet = new Set();
    registry.forEach(r => {
      if (r.batchId) batchSet.add(r.batchId);
    });
    return Array.from(batchSet);
  }, [registry]);

  // Statistics
  const totalCount = registry.length;
  const availableCount = registry.filter(r => r.assignmentStatus === 'Available').length;
  const assignedCount = registry.filter(r => r.assignmentStatus === 'Assigned').length;
  const currentSequence = getQRSequence();

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return registry.filter(r => {
      // Status filter
      if (statusFilter === 'AVAILABLE' && r.assignmentStatus !== 'Available') return false;
      if (statusFilter === 'ASSIGNED' && r.assignmentStatus !== 'Assigned') return false;

      // Batch filter
      if (selectedBatch !== 'ALL' && r.batchId !== selectedBatch) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchToken = (r.token || '').toLowerCase().includes(q);
        const matchDisplay = (r.displayNo || '').toLowerCase().includes(q);
        const matchBatch = (r.batchId || '').toLowerCase().includes(q);
        const matchAsset = (r.linkedAssetId || '').toLowerCase().includes(q) || (r.linkedAssetName || '').toLowerCase().includes(q);
        if (!matchToken && !matchDisplay && !matchBatch && !matchAsset) return false;
      }

      return true;
    });
  }, [registry, statusFilter, selectedBatch, searchQuery]);

  // Handle Bulk Generation
  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationNotice('');

    const qty = customQuantity ? parseInt(customQuantity, 10) : generateQuantity;
    if (isNaN(qty) || qty <= 0) {
      setGenerationNotice('Please enter a valid positive quantity.');
      setIsGenerating(false);
      return;
    }

    try {
      const result = generateBulkQRCodes(qty, {
        batchLabel: batchNotes.trim() || `Batch of ${qty} QR Labels`,
        generatedBy: 'Ramesh Patel (Admin)'
      });

      if (result.success) {
        refreshRegistry();
        setGeneratedBatchResult(result);
        setGenerationNotice(`✓ Successfully generated ${result.count} unique QR codes (${result.records[0]?.displayNo} to ${result.records[result.records.length - 1]?.displayNo})! Saved permanently in database.`);
      } else {
        setGenerationNotice(result.error || 'Failed to generate QR codes.');
      }
    } catch (e) {
      setGenerationNotice(`Generation error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Bulk PDF
  const handleDownloadPDF = async (recordsToPrint = filteredRecords, batchTitle = null) => {
    if (!recordsToPrint || recordsToPrint.length === 0) {
      setDownloadSuccessMessage('No QR codes available to download.');
      return;
    }

    setIsDownloadingPDF(true);
    setDownloadSuccessMessage('');

    try {
      const result = await generateBulkQRLabelsPDF(recordsToPrint, {
        batchId: batchTitle || (selectedBatch !== 'ALL' ? selectedBatch : (recordsToPrint[0]?.batchId || 'BULK')),
        title: 'INDUS FIRE SAFETY PRIVATE LIMITED'
      });

      if (result.success) {
        setDownloadSuccessMessage(`✓ Downloaded printable PDF: ${result.fileName} (${result.totalLabels} labels on ${result.totalPages} pages). Exact 25 mm × 25 mm size preserved.`);
      }
    } catch (err) {
      console.error('PDF error:', err);
      setDownloadSuccessMessage(`Failed to generate PDF: ${err.message}`);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Quick Copy
  const handleCopy = (token) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(''), 2000);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        backgroundColor: '#FFFFFF',
        padding: '16px 20px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF'
            }}>
              Module 1 & 11: Master QR Registry
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Sequence: #{currentSequence}
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>
            Permanent QR Code Management
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '2px 0 0 0' }}>
            Generate bulk QR labels in advance (25 mm × 25 mm), track field assignments, and prevent duplicate codes.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setIsGenerateModalOpen(true);
              setGeneratedBatchResult(null);
              setGenerationNotice('');
            }}
            className="btn-primary"
            style={{
              height: '40px',
              padding: '0 18px',
              fontSize: '0.86rem',
              fontWeight: 700,
              backgroundColor: '#A80018',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(168, 0, 24, 0.3)'
            }}
          >
            <PlusCircle size={17} />
            <span>Generate Bulk QR Codes</span>
          </button>

          <button
            onClick={() => handleDownloadPDF(filteredRecords)}
            disabled={isDownloadingPDF || filteredRecords.length === 0}
            className="btn-primary"
            style={{
              height: '40px',
              padding: '0 16px',
              fontSize: '0.85rem',
              backgroundColor: '#1E3A8A',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isDownloadingPDF ? 'wait' : 'pointer'
            }}
            title="Download printable PDF with exact 25 mm x 25 mm QR labels"
          >
            <Printer size={16} />
            <span>{isDownloadingPDF ? 'Generating PDF...' : `Print Labels PDF (${filteredRecords.length})`}</span>
          </button>
        </div>
      </div>

      {/* Download / Generation Feedback Alerts */}
      {downloadSuccessMessage && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #93C5FD',
          borderRadius: '6px',
          color: '#1E40AF',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#2563EB" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* 2. Key Metrics Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px'
      }}>
        {/* Total Generated */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0F172A'
          }}>
            <QrCode size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', fontWeight: 600 }}>Total QR Codes</span>
            <strong style={{ fontSize: '1.35rem', color: '#0F172A' }}>{totalCount}</strong>
          </div>
        </div>

        {/* Available / Unassigned */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #BBF7D0',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: '#DCFCE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#15803D'
          }}>
            <Tag size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#15803D', display: 'block', fontWeight: 700 }}>Available (Ready to Stick)</span>
            <strong style={{ fontSize: '1.35rem', color: '#15803D' }}>{availableCount}</strong>
          </div>
        </div>

        {/* Assigned on Field Assets */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#2563EB', display: 'block', fontWeight: 700 }}>Assigned to Assets</span>
            <strong style={{ fontSize: '1.35rem', color: '#1E3A8A' }}>{assignedCount}</strong>
          </div>
        </div>

        {/* Total Batches */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569'
          }}>
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', fontWeight: 600 }}>Batches Generated</span>
            <strong style={{ fontSize: '1.35rem', color: '#0F172A' }}>{allBatches.length}</strong>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by QR Number (e.g. 001), Token, Asset ID, or Batch..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.84rem',
              color: '#0F172A'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#F1F5F9',
            padding: '3px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 600
          }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: statusFilter === 'ALL' ? '#FFFFFF' : 'transparent',
                color: statusFilter === 'ALL' ? '#0F172A' : '#64748B',
                boxShadow: statusFilter === 'ALL' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('AVAILABLE')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: statusFilter === 'AVAILABLE' ? '#DCFCE7' : 'transparent',
                color: statusFilter === 'AVAILABLE' ? '#15803D' : '#64748B',
                boxShadow: statusFilter === 'AVAILABLE' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Available ({availableCount})
            </button>
            <button
              onClick={() => setStatusFilter('ASSIGNED')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: statusFilter === 'ASSIGNED' ? '#EFF6FF' : 'transparent',
                color: statusFilter === 'ASSIGNED' ? '#2563EB' : '#64748B',
                boxShadow: statusFilter === 'ASSIGNED' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Assigned ({assignedCount})
            </button>
          </div>

          {/* Batch Selector */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Batches</option>
            {allBatches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Main Registry Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div className="mobile-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                <th style={{ padding: '10px 12px', border: '1px solid #334155', width: '130px' }}>
                  SR. No.
                </th>
                <th style={{ padding: '10px 12px', border: '1px solid #334155', width: '170px' }}>
                  Permanent QR Token
                </th>
                <th style={{ padding: '10px 12px', border: '1px solid #334155', width: '150px' }}>
                  Batch ID
                </th>
                <th style={{ padding: '10px 12px', border: '1px solid #334155', width: '110px' }}>
                  Status
                </th>
                <th style={{ padding: '10px 12px', border: '1px solid #334155' }}>
                  Linked Field Asset
                </th>
                <th style={{ padding: '10px 12px', border: '1px solid #334155', width: '170px' }}>
                  Generated / Assigned
                </th>
                <th style={{ padding: '10px 12px', border: '1px solid #334155', textAlign: 'center', width: '160px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={28} color="#94A3B8" />
                      <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>No QR records match your criteria</strong>
                      <span style={{ fontSize: '0.8rem' }}>Click "Generate Bulk QR Codes" above to create advance labels.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isAssigned = rec.assignmentStatus === 'Assigned';
                  return (
                    <tr 
                      key={rec.token}
                      style={{
                        backgroundColor: isAssigned ? '#F8FAFC' : '#FFFFFF',
                        borderBottom: '1px solid #E2E8F0'
                      }}
                    >
                      {/* SR. No. */}
                      <td style={{ padding: '10px 12px', border: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={13} color={isAssigned ? '#2563EB' : '#16A34A'} />
                          <strong style={{ fontSize: '0.88rem', color: '#0F172A', fontFamily: 'monospace' }}>
                            {rec.displayNo}
                          </strong>
                        </div>
                      </td>

                      {/* Permanent Token */}
                      <td style={{ padding: '10px 12px', border: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            backgroundColor: '#F1F5F9',
                            borderRadius: '4px',
                            color: '#0F172A'
                          }}>
                            {rec.token}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(rec.token)}
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              color: copiedToken === rec.token ? '#16A34A' : '#94A3B8',
                              padding: '2px'
                            }}
                            title="Copy QR token"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Batch ID */}
                      <td style={{ padding: '10px 12px', border: '1px solid #E2E8F0', color: '#475569', fontSize: '0.78rem' }}>
                        {rec.batchId}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: isAssigned ? '#EFF6FF' : '#DCFCE7',
                          color: isAssigned ? '#1D4ED8' : '#15803D',
                          border: isAssigned ? '1px solid #BFDBFE' : '1px solid #86EFAC'
                        }}>
                          ● {isAssigned ? 'Assigned' : 'Available'}
                        </span>
                      </td>

                      {/* Linked Asset */}
                      <td style={{ padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                        {isAssigned ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: '#0F172A', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                {rec.linkedPositionId || rec.linkedAssetId}
                              </strong>
                              {onSelectPosition && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectPosition({ positionId: rec.linkedPositionId });
                                    onNavigate('asset-details');
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: '#2563EB',
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                  title="View asset dossier"
                                >
                                  <ExternalLink size={12} />
                                </button>
                              )}
                            </div>
                            <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748B' }}>
                              {rec.linkedAssetName}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.76rem' }}>
                            Unassigned — Stick label on asset to register
                          </span>
                        )}
                      </td>

                      {/* Timestamps */}
                      <td style={{ padding: '10px 12px', border: '1px solid #E2E8F0', fontSize: '0.74rem', color: '#475569' }}>
                        <div>Gen: <strong>{rec.generatedDate}</strong></div>
                        {rec.assignedDate && (
                          <div style={{ color: '#2563EB', marginTop: '2px' }}>
                            Assigned: {rec.assignedDate.split(' ')[0]}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '8px 12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF([rec], rec.batchId)}
                            style={{
                              height: '28px',
                              padding: '0 8px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#0F172A',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Download printable 25 mm x 25 mm label PDF"
                          >
                            <Printer size={12} />
                            <span>Label</span>
                          </button>

                          {!isAssigned && onRegisterWithQR && (
                            <button
                              type="button"
                              onClick={() => onRegisterWithQR(rec)}
                              style={{
                                height: '28px',
                                padding: '0 8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: '#059669',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Register a new asset with this pre-printed QR code"
                            >
                              <PlusCircle size={12} />
                              <span>Register</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          fontSize: '0.78rem',
          color: '#64748B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Showing <strong>{filteredRecords.length}</strong> of <strong>{totalCount}</strong> registered QR codes</span>
          <span>Print Format: <strong>A4 Sheet • 25 mm × 25 mm QR • Centered SR. NO.</strong></span>
        </div>
      </div>

      {/* ====================================================================
          5. BULK QR GENERATION MODAL (Module 1)
          Allows generating 50, 100, 200, 500 or custom quantity in advance
          ==================================================================== */}
      {isGenerateModalOpen && (
        <div 
          className="mobile-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div 
            className="mobile-modal-dialog"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              maxWidth: '560px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#A80018',
              color: '#FFFFFF',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  Generate Bulk QR Codes in Advance
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#FEE2E2' }}>
                  Permanent sequence will continue from current sequence #{currentSequence + 1}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '1.4rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {generationNotice && (
                <div style={{
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  lineHeight: 1.4,
                  backgroundColor: generatedBatchResult ? '#DCFCE7' : '#FEF2F2',
                  color: generatedBatchResult ? '#15803D' : '#B91C1C',
                  border: generatedBatchResult ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                }}>
                  {generationNotice}
                </div>
              )}

              {!generatedBatchResult ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                      Select Required Quantity:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {[50, 100, 200, 500].map(qty => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => {
                            setGenerateQuantity(qty);
                            setCustomQuantity('');
                          }}
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            border: (!customQuantity && generateQuantity === qty) ? '2px solid #A80018' : '1px solid #CBD5E1',
                            backgroundColor: (!customQuantity && generateQuantity === qty) ? '#FEF2F2' : '#FFFFFF',
                            color: (!customQuantity && generateQuantity === qty) ? '#A80018' : '#0F172A'
                          }}
                        >
                          {qty} Codes
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Or Enter Custom Quantity:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5000"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(e.target.value)}
                      placeholder="e.g. 25, 75, 250, 1000..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Batch Notes / Label (Optional):
                    </label>
                    <input
                      type="text"
                      value={batchNotes}
                      onChange={(e) => setBatchNotes(e.target.value)}
                      placeholder="e.g. Gujarat Plant Extinguishers Batch 2"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div style={{
                    padding: '12px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.78rem',
                    color: '#64748B',
                    lineHeight: 1.4
                  }}>
                    <strong style={{ color: '#0F172A' }}>Permanent Uniqueness Guarantee:</strong>
                    <div>• Numbering will strictly continue from: <strong>SR. NO. {String(currentSequence + 1).padStart(3, '0')}</strong></div>
                    <div>• Generates unique tokens like <strong>IFS-QR-{String(currentSequence + 1).padStart(6, '0')}</strong></div>
                    <div>• No asset information required at time of generation.</div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center', padding: '10px 0' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 style={{ margin: '4px 0', fontSize: '1.1rem', color: '#0F172A' }}>Batch Generation Complete!</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.84rem', color: '#64748B' }}>
                      Batch ID: <strong>{generatedBatchResult.batchId}</strong> ({generatedBatchResult.count} labels ready for printing)
                    </p>
                  </div>

                  <div style={{
                    padding: '12px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.82rem',
                    display: 'flex',
                    justifyContent: 'space-around'
                  }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block' }}>First Label</span>
                      <strong style={{ color: '#0F172A' }}>{generatedBatchResult.records[0]?.displayNo}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block' }}>Last Label</span>
                      <strong style={{ color: '#0F172A' }}>{generatedBatchResult.records[generatedBatchResult.records.length - 1]?.displayNo}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(generatedBatchResult.records, generatedBatchResult.batchId)}
                    disabled={isDownloadingPDF}
                    className="btn-primary"
                    style={{
                      height: '42px',
                      backgroundColor: '#1E3A8A',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Download size={17} />
                    <span>{isDownloadingPDF ? 'Generating PDF...' : 'Download Printable PDF (25 mm × 25 mm)'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 20px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="btn-outline"
                style={{ height: '36px', padding: '0 14px', fontSize: '0.82rem' }}
              >
                Close
              </button>
              {!generatedBatchResult && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn-primary"
                  style={{
                    height: '36px',
                    padding: '0 18px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    backgroundColor: '#A80018',
                    cursor: isGenerating ? 'wait' : 'pointer'
                  }}
                >
                  {isGenerating ? 'Generating...' : `Confirm & Generate ${(customQuantity || generateQuantity)} Codes`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
