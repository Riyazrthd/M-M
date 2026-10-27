import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

export default function SignaturePad({
  title = "Signature",
  subtitle = "",
  signerName = "",
  nameLabel = "Full Name of Signatory:",
  onSignerNameChange,
  initialSignature = null,
  onSave,
  required = true
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(initialSignature));
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F172A';

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = initialSignature;
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const pos = getCoordinates(e);
    setIsDrawing(true);
    setLastPos(pos);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault(); // Prevent page scroll while signing

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPos(pos);
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) {
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    if (onSave) {
      onSave(null);
    }
  };

  return (
    <div className="card" style={{ padding: '16px', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PenTool size={18} color="var(--brand-crimson)" />
          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h4>
          {required && <span style={{ color: 'var(--brand-crimson)', fontSize: '0.8rem', fontWeight: 700 }}>*Required</span>}
        </div>
        <button
          type="button"
          onClick={clearCanvas}
          className="btn-outline"
          style={{ height: '36px', minHeight: '36px', padding: '0 10px', fontSize: '0.8rem' }}
        >
          <RotateCcw size={14} /> Clear
        </button>
      </div>

      {subtitle && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          {subtitle}
        </div>
      )}

      {onSignerNameChange && (
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {nameLabel} {required && <span style={{ color: 'var(--brand-crimson)', fontWeight: 700 }}>*</span>}
          </label>
          <input
            type="text"
            className="input-field"
            value={signerName}
            onChange={(e) => onSignerNameChange(e.target.value)}
            placeholder="e.g. Ramesh Patel / Vikram Shah"
            style={{
              borderColor: (required && !signerName?.trim()) ? '#E00000' : undefined
            }}
          />
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
            pointerEvents: 'none',
            textAlign: 'center'
          }}>
            Draw signature here using finger or mouse
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }}>
        <span>Timestamp: {new Date().toISOString().substring(0, 10)}</span>
        {hasSignature ? (
          <span style={{ color: 'var(--status-ok)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={14} /> Signature captured
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Pending signature</span>
        )}
      </div>
    </div>
  );
}
