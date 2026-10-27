import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, ZoomIn, CheckCircle2 } from 'lucide-react';

export default function PhotoCapture({
  label = "Capture Photo Evidence",
  photos = [],
  onPhotosChange,
  maxPhotos = 3,
  required = false
}) {
  const fileInputRef = useRef(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const newPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          url: loadEvent.target.result,
          name: file.name,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          sizeKb: Math.round(file.size / 1024)
        };
        onPhotosChange([...photos, newPhoto].slice(0, maxPhotos));
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const removePhoto = (idToRemove) => {
    onPhotosChange(photos.filter(p => p.id !== idToRemove));
    if (previewPhoto && previewPhoto.id === idToRemove) {
      setPreviewPhoto(null);
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Camera size={16} color="var(--brand-crimson)" />
          {label}
          {required && <span style={{ color: 'var(--brand-crimson)', fontSize: '0.8rem' }}>*Required</span>}
        </label>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {photos.length} of {maxPhotos} attached
        </span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        multiple={maxPhotos > 1}
        style={{ display: 'none' }}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: '10px'
      }}>
        {/* Render existing photos */}
        {photos.map((photo) => (
          <div
            key={photo.id}
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              aspectRatio: '4/3',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer'
            }}
          >
            <img
              src={photo.url}
              alt="Evidence thumbnail"
              onClick={() => setPreviewPhoto(photo)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              title="Click to preview enlarged"
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              padding: '2px 4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {photo.timestamp.substring(11, 16)}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removePhoto(photo.id);
              }}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '28px',
                height: '28px',
                minHeight: '28px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(220, 38, 38, 0.9)',
                color: '#fff',
                padding: 0
              }}
              title="Remove photo"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {/* Add photo button if below max */}
        {photos.length < maxPhotos && (
          <div
            className="photo-slot"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{ minHeight: '85px' }}
          >
            <Camera size={22} style={{ marginBottom: '4px' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Take / Add</span>
          </div>
        )}
      </div>

      {/* Enlarged Photo Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 130
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-float)'
            }}
          >
            <div style={{ position: 'relative', maxHeight: '65vh', backgroundColor: '#000', display: 'flex', justifyContent: 'center' }}>
              <img
                src={previewPhoto.url}
                alt="Enlarged evidence"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
              />
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>{previewPhoto.name || 'Photo Evidence'}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recorded on {previewPhoto.timestamp}</div>
              </div>
              <button
                type="button"
                onClick={() => removePhoto(previewPhoto.id)}
                className="btn-outline"
                style={{ height: '36px', minHeight: '36px', padding: '0 12px', fontSize: '0.8rem', color: 'var(--brand-crimson)' }}
              >
                <Trash2 size={14} /> Remove Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
