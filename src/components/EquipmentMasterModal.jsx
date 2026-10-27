import React, { useState, useEffect } from 'react';
import { 
  getEquipmentMaster, 
  addEquipmentMasterItem, 
  updateEquipmentMasterItem, 
  deleteEquipmentMasterItem,
  addLinkedServiceToEquipment,
  removeLinkedServiceFromEquipment 
} from '../data/storage';
import { CHECKLIST_TEMPLATES } from '../data/checklistTemplates';
import { 
  Sliders, 
  Plus, 
  Check, 
  X, 
  Pencil, 
  Trash2, 
  Search, 
  Link as LinkIcon, 
  Layers, 
  FileText,
  AlertCircle,
  Tag
} from 'lucide-react';

export default function EquipmentMasterModal({ isOpen, onClose, onEquipmentMasterUpdated }) {
  const [masterList, setMasterList] = useState(getEquipmentMaster());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Add Equipment Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('Fire Extinguisher');
  const [customCategory, setCustomCategory] = useState('');
  const [newEquipmentType, setNewEquipmentType] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [newInitialService, setNewInitialService] = useState('Hydro Testing & Pressurisation');
  const [newInitialTemplate, setNewInitialTemplate] = useState('CL-11');

  // Link Service Form state
  const [linkingEquipmentId, setLinkingEquipmentId] = useState(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceTemplate, setNewServiceTemplate] = useState('CL-11');
  const [newServiceIsDefault, setNewServiceIsDefault] = useState(false);

  // Edit Equipment Name state
  const [editingEquipmentId, setEditingEquipmentId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingCapacity, setEditingCapacity] = useState('');

  // Notification Banner
  const [notice, setNotice] = useState('');

  const reloadMaster = () => {
    const data = getEquipmentMaster();
    setMasterList(data);
    if (onEquipmentMasterUpdated) onEquipmentMasterUpdated(data);
  };

  useEffect(() => {
    if (isOpen) {
      reloadMaster();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Extract distinct categories
  const categories = Array.from(new Set(masterList.map(item => item.category))).filter(Boolean);

  // Filter master list
  const filteredList = masterList.filter(item => {
    const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      item.equipmentType.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q) ||
      (item.linkedServices && item.linkedServices.some(s => s.serviceType.toLowerCase().includes(q)));
    return matchCat && matchQuery;
  });

  const showNotification = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  // Add new Specific Equipment Type
  const handleSaveNewEquipment = (e) => {
    e.preventDefault();
    if (!newEquipmentType.trim()) return;

    const categoryToUse = newCategory === '__CUSTOM__' ? customCategory.trim() : newCategory;
    if (!categoryToUse) return;

    const capList = newCapacity.split(',').map(s => s.trim()).filter(Boolean);
    const defaultCap = capList[0] || newCapacity.trim();

    const created = addEquipmentMasterItem({
      category: categoryToUse,
      equipmentType: newEquipmentType.trim(),
      defaultCapacity: defaultCap,
      capacities: capList.length > 0 ? capList : (defaultCap ? [defaultCap] : []),
      linkedServices: [
        {
          id: `SRV-${Date.now().toString(36).toUpperCase()}`,
          serviceType: newInitialService.trim(),
          checklistTemplateId: newInitialTemplate || null,
          isDefault: true
        }
      ]
    });

    reloadMaster();
    setShowAddModal(false);
    setNewEquipmentType('');
    setNewCapacity('');
    showNotification(`Added "${created.equipmentType}" with linked service "${newInitialService}"`);
  };

  // Save Link Service to Equipment
  const handleSaveLinkedService = (e) => {
    e.preventDefault();
    if (!linkingEquipmentId || !newServiceName.trim()) return;

    addLinkedServiceToEquipment(linkingEquipmentId, {
      serviceType: newServiceName.trim(),
      checklistTemplateId: newServiceTemplate || null,
      isDefault: newServiceIsDefault
    });

    reloadMaster();
    setLinkingEquipmentId(null);
    setNewServiceName('');
    showNotification(`Linked service "${newServiceName}" successfully.`);
  };

  // Remove linked service
  const handleRemoveService = (equipmentId, serviceId, serviceName) => {
    if (window.confirm(`Remove linked service "${serviceName}" from this equipment?`)) {
      removeLinkedServiceFromEquipment(equipmentId, serviceId);
      reloadMaster();
      showNotification(`Removed linked service "${serviceName}".`);
    }
  };

  // Edit Equipment
  const handleStartEdit = (item) => {
    setEditingEquipmentId(item.id);
    setEditingName(item.equipmentType);
    setEditingCapacity(
      Array.isArray(item.capacities) && item.capacities.length > 0 
        ? item.capacities.join(', ') 
        : (item.defaultCapacity || '')
    );
  };

  const handleSaveEdit = (id) => {
    if (!editingName.trim()) return;
    const capList = editingCapacity.split(',').map(s => s.trim()).filter(Boolean);
    const defCap = capList[0] || editingCapacity.trim();
    updateEquipmentMasterItem(id, {
      equipmentType: editingName.trim(),
      defaultCapacity: defCap,
      capacities: capList.length > 0 ? capList : (defCap ? [defCap] : [])
    });
    reloadMaster();
    setEditingEquipmentId(null);
    showNotification('Equipment details updated successfully.');
  };

  // Delete Equipment Type
  const handleDeleteEquipment = (item) => {
    if (window.confirm(`Delete equipment type "${item.equipmentType}" and all its linked services?`)) {
      deleteEquipmentMasterItem(item.id);
      reloadMaster();
      showNotification(`Deleted equipment type "${item.equipmentType}".`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(3px)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '820px',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}>
              <Sliders size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Equipment & Linked Target Service Master
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '2px 0 0 0' }}>
                Manage Specific Equipment Types and their automatic linked Target Service Types
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#9CA3AF', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Notice alert */}
        {notice && (
          <div style={{
            margin: '12px 24px 0 24px',
            padding: '10px 14px',
            backgroundColor: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} />
            <span>{notice}</span>
          </div>
        )}

        {/* Toolbar: Search, Category Filter, and Add Button */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#F8FAFC'
        }}>
          {/* Search box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 12px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            width: '260px'
          }}>
            <Search size={15} color="#64748B" />
            <input
              type="text"
              placeholder="Search equipment or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.82rem',
                backgroundColor: 'transparent',
                width: '100%',
                color: '#0F172A'
              }}
            />
          </div>

          {/* Add New Equipment Button */}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              height: '36px',
              padding: '0 14px',
              borderRadius: '8px',
              backgroundColor: '#111827',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Specific Equipment Type</span>
          </button>
        </div>

        {/* Category Pills */}
        <div style={{
          padding: '8px 24px',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          borderBottom: '1px solid #F1F5F9',
          backgroundColor: '#FFFFFF'
        }}>
          <button
            onClick={() => setSelectedCategory('ALL')}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedCategory === 'ALL' ? '1px solid #111827' : '1px solid #E2E8F0',
              backgroundColor: selectedCategory === 'ALL' ? '#111827' : '#FFFFFF',
              color: selectedCategory === 'ALL' ? '#FFFFFF' : '#475569'
            }}
          >
            All Categories ({masterList.length})
          </button>
          {categories.map(cat => {
            const count = masterList.filter(i => i.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #00875A' : '1px solid #E2E8F0',
                  backgroundColor: isSelected ? '#ECFDF5' : '#FFFFFF',
                  color: isSelected ? '#065F46' : '#475569',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Equipment List */}
        <div style={{
          padding: '16px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {filteredList.map((item) => {
            const isEditing = editingEquipmentId === item.id;
            const isLinking = linkingEquipmentId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Equipment Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        textTransform: 'uppercase'
                      }}>
                        {item.category}
                      </span>
                      {item.defaultCapacity && (
                        <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          Default: {item.defaultCapacity}
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <input
                          type="text"
                          className="input-field"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          style={{ height: '34px', fontSize: '0.84rem' }}
                        />
                        <input
                          type="text"
                          placeholder="Capacity"
                          className="input-field"
                          value={editingCapacity}
                          onChange={(e) => setEditingCapacity(e.target.value)}
                          style={{ height: '34px', width: '130px', fontSize: '0.84rem' }}
                        />
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          style={{
                            height: '34px',
                            padding: '0 12px',
                            borderRadius: '6px',
                            backgroundColor: '#00875A',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingEquipmentId(null)}
                          className="btn-outline"
                          style={{ height: '34px', padding: '0 10px', fontSize: '0.78rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A' }}>
                        {item.equipmentType}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleStartEdit(item)}
                        style={{ color: '#475569', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
                        title="Edit Equipment Type"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteEquipment(item)}
                        style={{ color: '#DC2626', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
                        title="Delete Equipment Type"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Linked Target Services List */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  border: '1px solid #EDF2F7'
                }}>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <LinkIcon size={12} color="#00875A" />
                      <span>Linked Target Service Types ({item.linkedServices?.length || 0}):</span>
                    </span>

                    <button
                      onClick={() => {
                        setLinkingEquipmentId(item.id);
                        setNewServiceName('');
                        setNewServiceTemplate('CL-11');
                        setNewServiceIsDefault(false);
                      }}
                      style={{
                        color: '#2563EB',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      <span>Link Target Service</span>
                    </button>
                  </div>

                  {/* Inline Link Service Form */}
                  {isLinking && (
                    <form onSubmit={handleSaveLinkedService} style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                        Link Target Service Type to "{item.equipmentType}":
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr auto', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hydro Testing & Pressurisation"
                          className="input-field"
                          value={newServiceName}
                          onChange={(e) => setNewServiceName(e.target.value)}
                          style={{ height: '34px', fontSize: '0.8rem' }}
                        />
                        <select
                          className="input-field"
                          value={newServiceTemplate}
                          onChange={(e) => setNewServiceTemplate(e.target.value)}
                          style={{ height: '34px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          <option value="">No Checklist Assigned</option>
                          {Object.keys(CHECKLIST_TEMPLATES).map(tid => (
                            <option key={tid} value={tid}>{tid} — {CHECKLIST_TEMPLATES[tid].shortTitle}</option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="submit"
                            style={{
                              height: '34px',
                              padding: '0 12px',
                              borderRadius: '6px',
                              backgroundColor: '#00875A',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Save Link
                          </button>
                          <button
                            type="button"
                            onClick={() => setLinkingEquipmentId(null)}
                            className="btn-outline"
                            style={{ height: '34px', padding: '0 8px', fontSize: '0.78rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#475569', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newServiceIsDefault}
                          onChange={(e) => setNewServiceIsDefault(e.target.checked)}
                        />
                        <span>Set as primary default service when selecting this equipment</span>
                      </label>
                    </form>
                  )}

                  {/* Badges of linked services */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {item.linkedServices && item.linkedServices.map(srv => (
                      <div
                        key={srv.id || srv.serviceType}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: srv.isDefault ? '1px solid #00875A' : '1px solid #CBD5E1',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.76rem'
                        }}
                      >
                        <strong style={{ color: '#0F172A' }}>{srv.serviceType}</strong>
                        {srv.checklistTemplateId ? (
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8'
                          }}>
                            {srv.checklistTemplateId}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.66rem',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E'
                          }}>
                            No Template
                          </span>
                        )}

                        {srv.isDefault && (
                          <span style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D'
                          }}>
                            Default
                          </span>
                        )}

                        {/* Remove button */}
                        {item.linkedServices.length > 1 && (
                          <button
                            onClick={() => handleRemoveService(item.id, srv.id, srv.serviceType)}
                            style={{
                              color: '#94A3B8',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Unlink this service"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#64748B',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px'
            }}>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No equipment types found matching "{searchQuery}"</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
                style={{ height: '34px', fontSize: '0.78rem', marginTop: '10px' }}
              >
                + Add Equipment Type Now
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Total Specific Equipment Types: <strong>{masterList.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ height: '36px', padding: '0 18px', fontSize: '0.84rem' }}
          >
            Close Master List
          </button>
        </div>
      </div>

      {/* SUB-MODAL: ADD NEW SPECIFIC EQUIPMENT TYPE */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#111827' }}>
                Add New Specific Equipment Type
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ color: '#9CA3AF', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewEquipment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                  Equipment Category *
                </label>
                <select
                  className="input-field"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ height: '38px', cursor: 'pointer' }}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__CUSTOM__">+ Create New Category...</option>
                </select>
                {newCategory === '__CUSTOM__' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter new category name..."
                    className="input-field"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    style={{ marginTop: '6px', height: '36px' }}
                  />
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                  Specific Equipment Type Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water CO2 Fire Extinguisher 9 Ltr"
                  className="input-field"
                  value={newEquipmentType}
                  onChange={(e) => setNewEquipmentType(e.target.value)}
                  style={{ height: '38px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                  Linked Capacities / Ratings (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9 Ltr, 6 Ltr, 50 Ltr (Trolley)"
                  className="input-field"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  style={{ height: '38px' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                  First capacity is default; all options populate the linked dropdown during asset registration.
                </span>
              </div>

              {/* Initial Linked Target Service */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#00875A', textTransform: 'uppercase' }}>
                  Initial Linked Target Service Type:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748B', display: 'block', marginBottom: '2px' }}>
                      Service Type Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hydro Testing & Pressurisation"
                      className="input-field"
                      value={newInitialService}
                      onChange={(e) => setNewInitialService(e.target.value)}
                      style={{ height: '36px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748B', display: 'block', marginBottom: '2px' }}>
                      Assigned Checklist Template
                    </label>
                    <select
                      className="input-field"
                      value={newInitialTemplate}
                      onChange={(e) => setNewInitialTemplate(e.target.value)}
                      style={{ height: '36px', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      {Object.keys(CHECKLIST_TEMPLATES).map(tid => (
                        <option key={tid} value={tid}>{tid} — {CHECKLIST_TEMPLATES[tid].shortTitle}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                >
                  Save Equipment & Linked Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}