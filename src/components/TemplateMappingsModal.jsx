import React, { useState } from 'react';
import { getTemplateMappings, saveTemplateMapping } from '../data/storage';
import { EQUIPMENT_CATEGORIES } from '../data/templateMappings';
import { CHECKLIST_TEMPLATES } from '../data/checklistTemplates';
import { Sliders, Plus, Check, X, Shield, AlertCircle } from 'lucide-react';

export default function TemplateMappingsModal({ isOpen, onClose }) {
  const [mappings, setMappings] = useState(getTemplateMappings());
  const [showAddForm, setShowAddForm] = useState(false);

  // New mapping form fields
  const [category, setCategory] = useState('Fire Extinguisher');
  const [serviceType, setServiceType] = useState('Routine Servicing / Inspection');
  const [templateId, setTemplateId] = useState('CL-26');
  const [notes, setNotes] = useState('Custom administrative mapping');
  const [notice, setNotice] = useState('');

  if (!isOpen) return null;

  const handleToggleActive = (mapping) => {
    const updated = { ...mapping, active: !mapping.active };
    saveTemplateMapping(updated);
    setMappings(getTemplateMappings());
  };

  const handleAddMapping = (e) => {
    e.preventDefault();
    const newMapping = {
      id: `MAP-CUSTOM-${Date.now().toString(36).toUpperCase()}`,
      equipmentCategory: category,
      equipmentType: 'All Equipment Types',
      serviceType,
      checklistTemplateId: templateId,
      active: true,
      notes
    };
    saveTemplateMapping(newMapping);
    setMappings(getTemplateMappings());
    setShowAddForm(false);
    setNotice(`New checklist mapping created: ${category} (${serviceType}) -> ${templateId}`);
    setTimeout(() => setNotice(''), 4000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 110
    }}>
      <div className="card" style={{ maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={22} color="var(--brand-crimson)" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Checklist Template Mapping Engine
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Administrator configuration for automatic checklist assignment rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ minHeight: 'auto', padding: '6px 10px', fontSize: '1.1rem' }}
          >
            ✕
          </button>
        </div>

        {notice && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--status-ok-bg)', color: 'var(--status-ok)', border: '1px solid var(--status-ok-border)', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.85rem' }}>
            {notice}
          </div>
        )}

        {/* Existing Mappings Table */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Active Configuration Rules ({mappings.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-outline"
              style={{ height: '34px', minHeight: '34px', padding: '0 10px', fontSize: '0.78rem' }}
            >
              <Plus size={14} />
              <span>{showAddForm ? 'Cancel Form' : 'Add New Rule'}</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '8px 10px' }}>Category</th>
                  <th style={{ padding: '8px 10px' }}>Service Type</th>
                  <th style={{ padding: '8px 10px' }}>Assigned Template</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{m.equipmentCategory}</td>
                    <td style={{ padding: '8px 10px' }}>{m.serviceType}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className="badge badge-navy" style={{ fontSize: '0.7rem' }}>
                        {m.checklistTemplateId}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={`badge ${m.active ? 'badge-ok' : 'badge-neutral'}`} style={{ fontSize: '0.68rem' }}>
                        {m.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleActive(m)}
                        className="btn-outline"
                        style={{ height: '28px', minHeight: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                      >
                        {m.active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAddMapping} style={{ backgroundColor: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Create New Template Mapping Rule</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '2px' }}>Category:</label>
                <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {EQUIPMENT_CATEGORIES.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '2px' }}>Service Type:</label>
                <input
                  type="text"
                  className="input-field"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g. Annual Overhaul"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '2px' }}>Checklist Template:</label>
                <select className="input-field" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  {Object.keys(CHECKLIST_TEMPLATES).map(tid => (
                    <option key={tid} value={tid}>{tid} — {CHECKLIST_TEMPLATES[tid].shortTitle}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '2px' }}>Admin Notes:</label>
              <input
                type="text"
                className="input-field"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-outline"
                style={{ height: '38px', minHeight: '38px', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ height: '38px', minHeight: '38px', fontSize: '0.82rem' }}
              >
                Save Mapping Rule
              </button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ height: '40px', padding: '0 20px', fontSize: '0.88rem' }}
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
