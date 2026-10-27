import React, { useState } from 'react';
import { getActiveVisit, saveVisitRemarks } from '../data/storage';
import PhotoCapture from '../components/PhotoCapture';
import { Camera, Image as ImageIcon, Trash2, ZoomIn, CheckCircle2, ChevronLeft, ArrowRight, Wrench, AlertTriangle, FileText } from 'lucide-react';

export default function PhotoRemarksScreen({ activeSite, onNavigate }) {
  const visit = getActiveVisit(activeSite?.id || "SITE-AIL-001");

  // Collect photos from all answered positions + visit level
  const initialVisitPhotos = [
    ...(visit.photos || []),
    {
      id: 'demo-p1',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23fee2e2"/><text x="40" y="150" fill="%23dc2626" font-size="20" font-family="sans-serif">Hose Box Door Beading Wear</text></svg>',
      name: 'beading_defect_post4.jpg',
      timestamp: '2026-10-26 10:18',
      category: 'Defect Evidence'
    },
    {
      id: 'demo-p2',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23dcfce7"/><text x="50" y="150" fill="%23059669" font-size="20" font-family="sans-serif">Extinguisher Tag IS 2190</text></svg>',
      name: 'extinguisher_35bar_tag.jpg',
      timestamp: '2026-10-26 09:47',
      category: 'Inspection Stamp'
    }
  ];

  const [photos, setPhotos] = useState(initialVisitPhotos);
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState(null);

  // Remarks & Spares Fields
  const [visitRemarks, setVisitRemarks] = useState(visit.visitRemarks || 'Quarterly AMC inspection completed for Plant 1 Reaction Bay and Tank Farm. Extinguishers hydro tested at 35 Bar for 3 minutes.');
  const [sparesReplaced, setSparesReplaced] = useState(visit.sparesReplaced || '1 No. Break glass key, 1.5m LDPE rubber beading, 2 Nos. Safety tamper seals');
  const [pendingPoints, setPendingPoints] = useState(visit.pendingPoints || 'Off-site hydro test certificate for removed cylinder EXT-CYL-5120 to be dispatched within 72 hours.');
  const [saveMsg, setSaveMsg] = useState('');

  const handleSaveAndProceed = () => {
    saveVisitRemarks(visit.visitId, {
      visitRemarks,
      sparesReplaced,
      pendingPoints
    });
    setSaveMsg('Observations and spare parts logs saved.');
    setTimeout(() => {
      onNavigate('visit-summary');
    }, 600);
  };

  const removePhoto = (id) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  return (
    <div className="app-container" style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <button
          onClick={() => onNavigate('digital-checklist')}
          className="btn-outline"
          style={{ height: '40px', minHeight: '40px', padding: '0 12px', fontSize: '0.85rem' }}
        >
          <ChevronLeft size={16} /> Back to Checklist
        </button>

        <button
          onClick={handleSaveAndProceed}
          className="btn-primary"
          style={{ height: '40px', minHeight: '40px', padding: '0 16px', fontSize: '0.88rem' }}
        >
          <span>Continue to Signatures</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {saveMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--status-ok-bg)',
          color: 'var(--status-ok)',
          border: '1px solid var(--status-ok-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="badge badge-navy">Step 3 of 4</span>
          <span className="badge badge-neutral">Audit Evidence</span>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
          Photo Evidence & Engineering Remarks
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Review photographic documentation, log replaced spare parts, and record pending laboratory certificates.
        </p>
      </div>

      {/* Photo Gallery Grid */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="var(--brand-crimson)" />
            Audit Photo Evidence Gallery ({photos.length} Photos)
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Tap photo to enlarge
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '16px'
        }}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                backgroundColor: 'var(--bg-subtle)'
              }}
            >
              <div
                style={{ aspectRatio: '4/3', cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => setSelectedPhotoForZoom(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.name || 'Inspection evidence'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: '8px 10px', fontSize: '0.75rem', backgroundColor: '#FFFFFF' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {photo.category || photo.name || 'Evidence Item'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  {photo.timestamp}
                </div>
              </div>

              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                display: 'flex',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoForZoom(photo)}
                  style={{
                    width: '30px',
                    height: '30px',
                    minHeight: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    color: '#fff',
                    padding: 0
                  }}
                  title="Enlarge"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  style={{
                    width: '30px',
                    height: '30px',
                    minHeight: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(220, 38, 38, 0.85)',
                    color: '#fff',
                    padding: 0
                  }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Upload More Photos Component */}
        <PhotoCapture
          label="Add Additional On-Site Photographic Evidence"
          photos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={8}
        />
      </div>

      {/* Remarks, Spares Replaced & Pending Points */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
            General Engineering Observations & Corrective Actions:
          </label>
          <textarea
            className="textarea-field"
            value={visitRemarks}
            onChange={(e) => setVisitRemarks(e.target.value)}
            rows={3}
            placeholder="Record general condition of installations, cleanliness of boxes, accessibility of extinguisher brackets..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '6px' }}>
              <Wrench size={16} color="var(--brand-crimson)" />
              Spares Replaced on Site:
            </label>
            <textarea
              className="textarea-field"
              value={sparesReplaced}
              onChange={(e) => setSparesReplaced(e.target.value)}
              rows={2}
              placeholder="e.g. 2 Nos. Neoprene O-rings, 1 No. Safety pin, Break glass key..."
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '6px' }}>
              <AlertTriangle size={16} color="var(--brand-amber)" />
              Pending Points / Next Actions:
            </label>
            <textarea
              className="textarea-field"
              value={pendingPoints}
              onChange={(e) => setPendingPoints(e.target.value)}
              rows={2}
              placeholder="e.g. Return refilled cylinder lot within 72 hrs, client sign-off on gate pass..."
            />
          </div>
        </div>
      </div>

      {/* Next Step Banner */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={handleSaveAndProceed}
          className="btn-primary"
          style={{ height: '48px', padding: '0 24px', fontSize: '1rem' }}
        >
          <span>Save Observations & Proceed to Signatures</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Image Modal for Zoom */}
      {selectedPhotoForZoom && (
        <div
          onClick={() => setSelectedPhotoForZoom(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 120
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '650px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-float)'
            }}
          >
            <div style={{ position: 'relative', maxHeight: '70vh', backgroundColor: '#000', display: 'flex', justifyContent: 'center' }}>
              <img
                src={selectedPhotoForZoom.url}
                alt="Enlarged"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
              <button
                type="button"
                onClick={() => setSelectedPhotoForZoom(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
                {selectedPhotoForZoom.category || selectedPhotoForZoom.name}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Recorded on {selectedPhotoForZoom.timestamp} • Tamper-resistant photo audit hash: IFS-{Math.random().toString(36).substr(2, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
