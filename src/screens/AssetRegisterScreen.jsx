import React, { useState, useEffect } from 'react';
import { getSites, registerNewAsset, getEquipmentMaster } from '../data/storage';
import { EQUIPMENT_CATEGORIES, resolveChecklistMapping, getLinkedCapacities } from '../data/templateMappings';
import { CHECKLIST_TEMPLATES } from '../data/checklistTemplates';
import PhotoCapture from '../components/PhotoCapture';
import QRStickerCard from '../components/QRStickerCard';
import EquipmentMasterModal from '../components/EquipmentMasterModal';
import { 
  Building2, 
  ShieldAlert, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Layers, 
  Calendar, 
  Wrench,
  Camera,
  RotateCcw,
  Sliders,
  Lock,
  Check,
  ChevronRight,
  Link as LinkIcon
} from 'lucide-react';

export default function AssetRegisterScreen({ onNavigate, onAssetRegistered }) {
  const sites = getSites();

  // Wizard Step State (1: Client & Site, 2: Equipment, 3: Checklist Mapping, 4: Review, 5: Sticker)
  const [step, setStep] = useState(1);

  // Form State
  const initialSite = sites[0] || {};
  const [siteId, setSiteId] = useState(initialSite.id || 'SITE-AIL-001');
  const [clientName, setClientName] = useState(initialSite.clientName || initialSite.company || initialSite.name || 'Campus Store Co.');
  const [siteName, setSiteName] = useState(initialSite.plantFacility || initialSite.name || 'Aarti Industries Ltd — Unit IV');
  const [siteAddress, setSiteAddress] = useState(initialSite.address || 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110');
  const [city, setCity] = useState(initialSite.city || 'Jhagadia / Bharuch');
  const [poNumber, setPoNumber] = useState(initialSite.poNumber || 'PO/AIL/AMC/2026/8812');
  const [poDate, setPoDate] = useState(initialSite.poDate || '2026-04-01');
  const [amcType, setAmcType] = useState(initialSite.amcType || initialSite.frequency || 'Quarterly');
  const [noOfVisits, setNoOfVisits] = useState(initialSite.noOfVisits !== undefined ? initialSite.noOfVisits : 4);
  const [amcExpiryDate, setAmcExpiryDate] = useState(initialSite.amcExpiryDate || '2027-03-31');
  const [taxId, setTaxId] = useState(initialSite.taxId || '24AAACA1234F1Z5');
  const [contactPhone, setContactPhone] = useState(initialSite.contactPhone || '+91 98201 55667');
  const [email, setEmail] = useState(initialSite.email || 'aditi@campusstore.demo');
  const [area, setArea] = useState('Plant 1 — Reaction Bay (Ground Floor)');
  const [location, setLocation] = useState('Near Column C-4, West Fire Corridor');

  // Master List & Equipment Fields
  const [equipmentMaster, setEquipmentMaster] = useState(getEquipmentMaster());
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('Fire Extinguisher');
  const [equipmentType, setEquipmentType] = useState('Water CO2 Fire Extinguisher');
  const [serviceType, setServiceType] = useState('Hydro Testing & Pressurisation');
  const [equipmentName, setEquipmentName] = useState('Water CO2 Portable Fire Extinguisher');
  const [manufacturer, setManufacturer] = useState('Indus SafeGuard (IS 15683)');
  const [model, setModel] = useState('SP-WCO2-9');
  const [serialNumber, setSerialNumber] = useState(`IFS-2024-${Math.floor(1000 + Math.random() * 9000)}`);
  const [capacity, setCapacity] = useState('9 Ltr');
  const [isCustomCapacity, setIsCustomCapacity] = useState(false);
  const [mfgDate, setMfgDate] = useState('2024-01');
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().substring(0, 10));
  const [lastServiceDate, setLastServiceDate] = useState(new Date().toISOString().substring(0, 10));
  const [lastRefillDate, setLastRefillDate] = useState('');
  const [lastHptDate, setLastHptDate] = useState('2024-01-15');
  const [nextServiceDueDate, setNextServiceDueDate] = useState('2027-10-26');
  const [nextRefillDueDate, setNextRefillDueDate] = useState('2027-10-26');
  const [nextHptDueDate, setNextHptDueDate] = useState('2029-10-26');
  const [initialCondition, setInitialCondition] = useState('Active in Position (New Registration)');
  const [technicianRemarks, setTechnicianRemarks] = useState('Registered on-site during AMC round. Wall bracket firm, gauge in green.');
  const [photos, setPhotos] = useState([]);

  // Auto-assigned Checklist Info
  const [resolvedMapping, setResolvedMapping] = useState(null);

  // Registration Result
  const [registrationResult, setRegistrationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Synchronize equipment master changes
  useEffect(() => {
    const handleMasterChanged = (e) => {
      setEquipmentMaster(e.detail || getEquipmentMaster());
    };
    window.addEventListener('ifspl:equipment_master_changed', handleMasterChanged);
    return () => window.removeEventListener('ifspl:equipment_master_changed', handleMasterChanged);
  }, []);

  // Handle site/client selection — auto-fetch all client-related details
  const handleSiteChange = (selectedId) => {
    setSiteId(selectedId);
    const found = sites.find(s => s.id === selectedId);
    if (found) {
      setClientName(found.clientName || found.company || found.name || '');
      setSiteName(found.plantFacility || found.name || '');
      setSiteAddress(found.address || '');
      setCity(found.city || '');
      setPoNumber(found.poNumber || '');
      setPoDate(found.poDate || '');
      setAmcType(found.amcType || found.frequency || 'Quarterly');
      setNoOfVisits(found.noOfVisits !== undefined ? found.noOfVisits : 4);
      setAmcExpiryDate(found.amcExpiryDate || '');
      setTaxId(found.taxId || '');
      setContactPhone(found.contactPhone || '');
      setEmail(found.email || '');
    }
  };

  // Re-evaluate mapping whenever category, service type, or equipment type changes
  useEffect(() => {
    const res = resolveChecklistMapping(selectedCategory, serviceType, equipmentType);
    setResolvedMapping(res);
  }, [selectedCategory, serviceType, equipmentType]);

  // When equipmentType changes, automatically show and link its target service types and linked capacity
  const handleEquipmentTypeChange = (newType) => {
    setEquipmentType(newType);
    const eqItem = equipmentMaster.find(e => 
      e.equipmentType.toLowerCase() === newType.toLowerCase() &&
      (!selectedCategory || e.category.toLowerCase() === selectedCategory.toLowerCase())
    );

    if (eqItem && Array.isArray(eqItem.linkedServices) && eqItem.linkedServices.length > 0) {
      const defaultSrv = eqItem.linkedServices.find(s => s.isDefault)?.serviceType || eqItem.linkedServices[0].serviceType;
      setServiceType(defaultSrv);
    }

    // Automatically link capacity dropdown to selected equipment type
    const linkedCaps = getLinkedCapacities(newType, selectedCategory, equipmentMaster);
    const defCap = eqItem?.defaultCapacity || linkedCaps[0] || '9 Ltr';
    setCapacity(defCap);
    setIsCustomCapacity(false);
  };

  // When category changes, update available equipment types and automatically select its linked target service and capacity
  const handleCategoryChange = (newCatName) => {
    setSelectedCategory(newCatName);
    const matchingEquipments = equipmentMaster.filter(e => e.category.toLowerCase() === newCatName.toLowerCase());
    
    if (matchingEquipments.length > 0) {
      const firstEq = matchingEquipments[0];
      setEquipmentType(firstEq.equipmentType);
      const linked = firstEq.linkedServices || [];
      const defaultSrv = linked.find(s => s.isDefault)?.serviceType || linked[0]?.serviceType || 'Routine Servicing';
      setServiceType(defaultSrv);

      // Automatically link capacity
      const linkedCaps = getLinkedCapacities(firstEq.equipmentType, newCatName, equipmentMaster);
      const defCap = firstEq.defaultCapacity || linkedCaps[0] || '9 Ltr';
      setCapacity(defCap);
      setIsCustomCapacity(false);
    } else {
      const catObj = EQUIPMENT_CATEGORIES.find(c => c.name === newCatName);
      if (catObj) {
        const defaultType = catObj.types[0] || newCatName;
        const defaultSrv = catObj.serviceTypes[0]?.name || 'Routine Servicing';
        setEquipmentType(defaultType);
        setServiceType(defaultSrv);

        const linkedCaps = getLinkedCapacities(defaultType, newCatName, equipmentMaster);
        setCapacity(linkedCaps[0] || '9 Ltr');
        setIsCustomCapacity(false);
      }
    }
  };

  // Step 1 Validation (Client is auto-fetched, Area and Exact Location are required)
  const validateStep1 = () => {
    if (!siteId) {
      setErrorMessage('Please select a Client / Company Name.');
      return false;
    }
    if (!area.trim() || !location.trim()) {
      setErrorMessage('Please enter the physical position (Building / Area / Floor and Exact Mounting Point are mandatory).');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!serialNumber.trim()) {
      setErrorMessage('Serial Number is required. Duplicate serials at the same site will be rejected.');
      return false;
    }
    if (!capacity.trim() || !manufacturer.trim()) {
      setErrorMessage('Capacity and Manufacturer / Make are required.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Final Registration Submission (Step 4)
  const handleSubmitRegistration = () => {
    setErrorMessage('');
    
    // Check checklist mapping validity
    if (!resolvedMapping || !resolvedMapping.success || !resolvedMapping.checklistTemplateId) {
      setErrorMessage(`Cannot register asset: ${resolvedMapping?.warning || 'No valid checklist template mapping exists.'}`);
      return;
    }

    const payload = {
      siteId,
      clientName,
      siteName,
      siteAddress,
      city,
      poNumber,
      poDate,
      amcType,
      noOfVisits,
      amcExpiryDate,
      taxId,
      contactPhone,
      email,
      area,
      location,
      equipmentCategory: selectedCategory,
      equipmentType,
      serviceType,
      equipmentName,
      manufacturer,
      model,
      serialNumber: serialNumber.trim(),
      capacity,
      manufacturingDate: mfgDate,
      installationDate,
      lastServiceDate,
      lastRefillDate,
      lastHptDate,
      nextServiceDueDate,
      nextRefillDueDate,
      nextHptDueDate,
      initialCondition,
      technicianRemarks,
      photo: photos[0]?.url || null
    };

    const result = registerNewAsset(payload);

    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }

    setRegistrationResult(result.position);
    if (onAssetRegistered) {
      onAssetRegistered(result.position);
    }
    setStep(5); // Move to Success & Sticker view
  };

  const handleResetForAnother = () => {
    setSerialNumber(`IFS-2024-${Math.floor(1000 + Math.random() * 9000)}`);
    setLocation('');
    setPhotos([]);
    setRegistrationResult(null);
    setErrorMessage('');
    setStep(1);
  };

  const currentTemplate = resolvedMapping?.checklistTemplateId 
    ? CHECKLIST_TEMPLATES[resolvedMapping.checklistTemplateId]
    : null;

  return (
    <div className="app-container" style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title & Wizard Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#536174',
                backgroundColor: '#F3F4F4',
                border: '1px solid #E1E5E9',
                borderRadius: '4px',
                padding: '2px 8px',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                Asset Onboarding
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#17191C', margin: 0, letterSpacing: '-0.01em' }}>
              Register New Asset & Generate QR
            </h2>
            <p style={{ fontSize: '13px', color: '#536174', margin: '3px 0 0 0' }}>
              Register a permanent asset position, resolve its governing SOP checklist, and generate an immutable QR identifier.
            </p>
          </div>

          <button
            onClick={() => onNavigate('site-list')}
            className="btn-outline"
            style={{
              height: '36px',
              minHeight: '36px',
              fontSize: '13px',
              fontWeight: 500,
              padding: '0 14px',
              borderRadius: '6px',
              border: '1px solid #E1E5E9',
              backgroundColor: '#FFFFFF',
              color: '#17191C'
            }}
          >
            Cancel / Back to Sites
          </button>
        </div>

        {/* Wizard Steps Breadcrumb */}
        {step < 5 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            overflowX: 'auto',
            padding: '4px 0',
            borderBottom: '1px solid #E1E5E9',
            paddingBottom: '12px',
            marginBottom: '4px'
          }}>
            {[
              { num: 1, label: 'Client & Site' },
              { num: 2, label: 'Equipment Details' },
              { num: 3, label: 'Checklist Assignment' },
              { num: 4, label: 'Review & Submit' }
            ].map((st, idx, arr) => {
              const isActive = step === st.num;
              const isCompleted = step > st.num;
              return (
                <React.Fragment key={st.num}>
                  <button
                    type="button"
                    onClick={() => {
                      if (st.num < step) setStep(st.num);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: isActive ? '#111827' : (isCompleted ? '#F0FDF4' : '#F7F8F9'),
                      color: isActive ? '#FFFFFF' : (isCompleted ? '#00875A' : '#788494'),
                      border: `1px solid ${isActive ? '#111827' : (isCompleted ? '#BBF7D0' : '#E1E5E9')}`,
                      fontSize: '13px',
                      fontWeight: isActive ? 500 : (isCompleted ? 500 : 400),
                      whiteSpace: 'nowrap',
                      cursor: st.num < step ? 'pointer' : 'default',
                      minHeight: 'unset'
                    }}
                  >
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : (isCompleted ? '#DCFCE7' : '#E8E9EA'),
                      color: isActive ? '#FFFFFF' : (isCompleted ? '#00875A' : '#536174')
                    }}>
                      {isCompleted ? <Check size={11} strokeWidth={2.5} /> : st.num}
                    </span>
                    <span>{st.label}</span>
                  </button>

                  {idx < arr.length - 1 && (
                    <ChevronRight size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div style={{
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--status-fail-bg)',
          color: 'var(--status-fail)',
          border: '1px solid var(--status-fail-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <AlertCircle size={20} style={{ shrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Client Selection & Auto-Fetched Details */}
      {step === 1 && (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E1E5E9', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#17191C', margin: 0 }}>
                Step 1: Client Selection & Permanent Asset Position
              </h3>
              <p style={{ fontSize: '13px', color: '#536174', margin: '3px 0 0 0' }}>
                Select the Client / Company. All contractual and plant details are auto-fetched and locked.
              </p>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#536174',
              backgroundColor: '#F3F4F4',
              border: '1px solid #E1E5E9',
              borderRadius: '4px',
              padding: '2px 8px'
            }}>
              Step 1 of 4
            </span>
          </div>

          {/* 1. Client Selection Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#17191C', marginBottom: '6px' }}>
              Select Client / Company Name: <span style={{ color: '#E00000' }}>*</span>
            </label>
            <select
              className="input-field"
              value={siteId}
              onChange={(e) => handleSiteChange(e.target.value)}
              style={{ fontWeight: 500, fontSize: '14px', height: '40px', borderColor: '#E1E5E9' }}
            >
              {sites.map(s => {
                const cName = s.clientName || s.company || s.name;
                const pFacility = s.plantFacility || s.name;
                return (
                  <option key={s.id} value={s.id}>
                    {cName} — {pFacility} ({s.city})
                  </option>
                );
              })}
            </select>
            <span style={{ fontSize: '12px', color: '#788494', marginTop: '4px', display: 'block' }}>
              Picking a client automatically populates all client master and AMC contract data below.
            </span>
          </div>

          {/* 2. Auto-Fetched Client & Contract Dossier (Strictly Non-Editable) */}
          <div style={{
            backgroundColor: '#F7F8F9',
            border: '1px solid #E1E5E9',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E1E5E9', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={14} style={{ color: '#536174' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#17191C' }}>
                  Auto-Fetched Client Dossier & Contract Details (Non-Editable)
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#E8E9EA',
                color: '#536174',
                border: '1px solid #E1E5E9',
                borderRadius: '4px',
                padding: '2px 6px'
              }}>
                <Lock size={10} /> Auto-Fetched • Read Only
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Client / Company Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={clientName}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#F3F4F4', color: '#17191C', cursor: 'not-allowed', borderColor: '#E1E5E9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Industrial Plant / Facility Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={siteName}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#F3F4F4', color: '#17191C', cursor: 'not-allowed', borderColor: '#E1E5E9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  PO / Contract Reference
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={poNumber || 'N/A'}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#F3F4F4', color: '#17191C', cursor: 'not-allowed', borderColor: '#E1E5E9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  PO Date
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={poDate || 'N/A'}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#F3F4F4', color: '#17191C', cursor: 'not-allowed', borderColor: '#E1E5E9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Type of AMC
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={amcType || 'Quarterly'}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#F3F4F4', color: '#17191C', cursor: 'not-allowed', borderColor: '#E1E5E9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Number of Visits per Year
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={noOfVisits !== undefined ? `${noOfVisits} Scheduled Visits / Year` : '4 Scheduled Visits / Year'}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#F3F4F4', color: '#17191C', cursor: 'not-allowed', borderColor: '#E1E5E9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  AMC Expiry Date
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={amcExpiryDate || 'N/A'}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#F3F4F4', color: '#17191C', cursor: 'not-allowed', borderColor: '#E1E5E9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Client GSTIN / Tax ID
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={taxId || 'N/A'}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#F3F4F4', color: '#17191C', cursor: 'not-allowed', borderColor: '#E1E5E9' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Plant Facility Address & City
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={`${siteAddress}${city ? ` — ${city}` : ''}`}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#F3F4F4', color: '#17191C', cursor: 'not-allowed', borderColor: '#E1E5E9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Client Contact Coordinates
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={`${contactPhone || ''}${contactPhone && email ? ' • ' : ''}${email || ''}`}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#F3F4F4', color: '#17191C', cursor: 'not-allowed', borderColor: '#E1E5E9' }}
                />
              </div>
            </div>
          </div>

          {/* 3. Permanent Physical Asset Position (Only Editable Fields) */}
          <div style={{
            borderTop: '1px solid #E1E5E9',
            paddingTop: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#17191C', margin: 0 }}>
                Permanent Physical Asset Position (Editable)
              </h4>
              <p style={{ fontSize: '13px', color: '#536174', margin: '2px 0 0 0' }}>
                Specify the exact permanent physical location within the selected client facility.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#17191C', marginBottom: '4px' }}>
                  Building / Area / Floor: <span style={{ color: '#E00000' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Plant 1 — Reaction Bay (Ground Floor)"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required
                  style={{ height: '40px', fontSize: '14px', borderColor: '#E1E5E9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#17191C', marginBottom: '4px' }}>
                  Exact Mounting Point / Pillar: <span style={{ color: '#E00000' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Adjacent to Column C-4, West Fire Corridor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  style={{ height: '40px', fontSize: '14px', borderColor: '#E1E5E9' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              style={{
                height: '40px',
                padding: '0 20px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: '#111827',
                color: '#FFFFFF',
                borderRadius: '6px',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span>Next: Equipment Details</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Equipment Details */}
      {step === 2 && (() => {
        const distinctCategories = Array.from(new Set([
          ...equipmentMaster.map(e => e.category),
          ...EQUIPMENT_CATEGORIES.map(c => c.name)
        ])).filter(Boolean);

        const allEquipmentOptions = Array.from(new Set([
          ...equipmentMaster
            .filter(e => !selectedCategory || e.category.toLowerCase() === selectedCategory.toLowerCase())
            .map(e => e.equipmentType),
          ...(EQUIPMENT_CATEGORIES.find(c => c.name === selectedCategory)?.types || [])
        ]));

        const currentEquipmentRecord = equipmentMaster.find(e => 
          e.equipmentType.toLowerCase() === equipmentType.toLowerCase() &&
          (!selectedCategory || e.category.toLowerCase() === selectedCategory.toLowerCase())
        );

        const linkedServices = currentEquipmentRecord && Array.isArray(currentEquipmentRecord.linkedServices) && currentEquipmentRecord.linkedServices.length > 0
          ? currentEquipmentRecord.linkedServices
          : (EQUIPMENT_CATEGORIES.find(c => c.name === selectedCategory)?.serviceTypes || []).map(s => ({
              id: s.id,
              serviceType: s.name,
              checklistTemplateId: s.defaultTemplate
            }));

        const rawCapacities = getLinkedCapacities(equipmentType, selectedCategory, equipmentMaster);
        const availableCapacities = Array.from(new Set([
          ...rawCapacities,
          ...(capacity && !rawCapacities.includes(capacity) && !isCustomCapacity ? [capacity] : [])
        ]));

        return (
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E1E5E9', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#17191C', margin: 0 }}>
                  Step 2: Equipment Specification & Unit History
                </h3>
                <p style={{ fontSize: '13px', color: '#536174', margin: '3px 0 0 0' }}>
                  Select equipment type to automatically link its target service and standard capacity options.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMasterModalOpen(true)}
                className="btn-outline"
                style={{
                  height: '34px',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#17191C',
                  borderColor: '#E1E5E9',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '0 12px',
                  cursor: 'pointer'
                }}
                title="Open Master List to Add Equipment & Link Service Types"
              >
                <Sliders size={14} />
                <span>Equipment Master List</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  Equipment Category: <span style={{ color: 'var(--brand-crimson)' }}>*</span>
                </label>
                <select
                  className="input-field"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {distinctCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  Specific Equipment Type: <span style={{ color: 'var(--brand-crimson)' }}>*</span>
                </label>
                <select
                  className="input-field"
                  value={equipmentType}
                  onChange={(e) => handleEquipmentTypeChange(e.target.value)}
                >
                  {allEquipmentOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  Target Service Type: <span style={{ color: 'var(--brand-crimson)' }}>*</span>
                </label>
                <select
                  className="input-field"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  {linkedServices.map(s => (
                    <option key={s.id || s.serviceType} value={s.serviceType}>
                      {s.serviceType} {s.checklistTemplateId ? `[${s.checklistTemplateId}]` : ''}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.72rem', color: '#00875A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LinkIcon size={11} />
                  <span>Auto-linked to {equipmentType}</span>
                </div>
              </div>
            </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                Unit Serial Number: <span style={{ color: 'var(--brand-crimson)' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. IFS-2024-DCP-8821"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                required
                style={{ fontWeight: 700 }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Unique unit tag on cylinder body</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                Capacity / Rating: <span style={{ color: 'var(--brand-crimson)' }}>*</span>
              </label>
              <select
                className="input-field"
                value={isCustomCapacity ? '__CUSTOM__' : capacity}
                onChange={(e) => {
                  if (e.target.value === '__CUSTOM__') {
                    setIsCustomCapacity(true);
                    setCapacity('');
                  } else {
                    setIsCustomCapacity(false);
                    setCapacity(e.target.value);
                  }
                }}
                style={{ fontWeight: 600 }}
              >
                {availableCapacities.map(cap => (
                  <option key={cap} value={cap}>{cap}</option>
                ))}
                <option value="__CUSTOM__">+ Custom Capacity / Rating...</option>
              </select>

              {isCustomCapacity && (
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter custom capacity / rating (e.g. 9 Ltr, 6 Kg)"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                  style={{ marginTop: '6px' }}
                  autoFocus
                />
              )}

              <div style={{ fontSize: '0.72rem', color: '#00875A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LinkIcon size={11} />
                <span>Auto-linked to {equipmentType}</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                Manufacturer / Make: <span style={{ color: 'var(--brand-crimson)' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Statutory Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '3px' }}>
                Manufacturing Date:
              </label>
              <input
                type="month"
                className="input-field"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
                style={{ height: '40px', minHeight: '40px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '3px' }}>
                Last Hydro Test (35 Bar):
              </label>
              <input
                type="date"
                className="input-field"
                value={lastHptDate}
                onChange={(e) => setLastHptDate(e.target.value)}
                style={{ height: '40px', minHeight: '40px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '3px' }}>
                Next HPT Due Date:
              </label>
              <input
                type="date"
                className="input-field"
                value={nextHptDueDate}
                onChange={(e) => setNextHptDueDate(e.target.value)}
                style={{ height: '40px', minHeight: '40px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '3px' }}>
                Initial Condition:
              </label>
              <select
                className="input-field"
                value={initialCondition}
                onChange={(e) => setInitialCondition(e.target.value)}
                style={{ height: '40px', minHeight: '40px' }}
              >
                <option value="Active in Position (New Registration)">Active in Position (New)</option>
                <option value="Good Condition (Ready for Service)">Good Condition</option>
                <option value="Requires Hydro Test Refill">Requires Hydro Test</option>
              </select>
            </div>
          </div>

          {/* Photograph Upload */}
          <PhotoCapture
            label="Upload Asset Physical Condition Photograph (Optional)"
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={2}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                height: '40px',
                padding: '0 16px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: '#FFFFFF',
                color: '#17191C',
                border: '1px solid #E1E5E9',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep2()) setStep(3);
              }}
              style={{
                height: '40px',
                padding: '0 20px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: '#111827',
                color: '#FFFFFF',
                borderRadius: '6px',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span>Next: Checklist Assignment</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      );
    })()}

      {/* STEP 3: Automatic Checklist Assignment */}
      {step === 3 && (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E1E5E9', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#17191C', margin: 0 }}>
                Step 3: Automatic Checklist Template Assignment
              </h3>
              <p style={{ fontSize: '13px', color: '#536174', margin: '3px 0 0 0' }}>
                The system evaluates equipment category and service type against the master SOP checklist mapping engine.
              </p>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#536174',
              backgroundColor: '#F3F4F4',
              border: '1px solid #E1E5E9',
              borderRadius: '4px',
              padding: '2px 8px'
            }}>
              Step 3 of 4
            </span>
          </div>

          {resolvedMapping?.success && currentTemplate ? (
            <div style={{
              border: '2px solid var(--status-ok)',
              backgroundColor: '#F0FDF4',
              borderRadius: 'var(--radius-md)',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={24} color="var(--status-ok)" />
                  <div>
                    <span className="badge badge-ok" style={{ fontSize: '0.72rem' }}>Checklist Automatically Assigned</span>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '2px' }}>
                      {currentTemplate.title}
                    </h4>
                  </div>
                </div>
                <span className="badge badge-navy" style={{ fontSize: '0.85rem' }}>{currentTemplate.id}</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                fontSize: '0.82rem',
                backgroundColor: '#FFFFFF',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--status-ok-border)',
                marginTop: '10px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Official Document No.:</span>
                  <strong style={{ color: 'var(--brand-navy)' }}>{currentTemplate.docNo}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Governing SOP Reference:</span>
                  <strong>{currentTemplate.sopNo}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Inspection Scope:</span>
                  <span>{currentTemplate.items.length} Standard Checklist Items</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Mapping Criteria:</span>
                  <span style={{ color: 'var(--status-ok)', fontWeight: 700 }}>
                    {resolvedMapping.matchType} Match ({serviceType})
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong>Important Domain Rule:</strong> Routine extinguisher visual checks map to <code>CL-26</code>, while hydraulic pressure testing (IS 2190) maps to <code>CL-11</code>.
              </div>
            </div>
          ) : (
            <div style={{
              border: '2px solid var(--status-fail)',
              backgroundColor: '#FEF2F2',
              borderRadius: 'var(--radius-md)',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-fail)', marginBottom: '8px' }}>
                <ShieldAlert size={24} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>No Applicable Checklist Template Configured</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#991B1B', lineHeight: 1.5 }}>
                {resolvedMapping?.warning || `No checklist template is mapped to category "${selectedCategory}" with service "${serviceType}".`}
              </p>
              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                To protect audit compliance, the system will NOT silently assign an unrelated checklist. Please adjust the service type or configure template mappings.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                height: '40px',
                padding: '0 16px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: '#FFFFFF',
                color: '#17191C',
                border: '1px solid #E1E5E9',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={!resolvedMapping?.success}
              onClick={() => setStep(4)}
              style={{
                height: '40px',
                padding: '0 20px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: '#111827',
                color: '#FFFFFF',
                borderRadius: '6px',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: resolvedMapping?.success ? 'pointer' : 'not-allowed',
                opacity: resolvedMapping?.success ? 1 : 0.5
              }}
            >
              <span>Next: Review & Generate QR</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review and Submit */}
      {step === 4 && (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E1E5E9', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#17191C', margin: 0 }}>
                Step 4: Review Asset Dossier Before Registering
              </h3>
              <p style={{ fontSize: '13px', color: '#536174', margin: '3px 0 0 0' }}>
                Verify client contract parameters, physical placement, and resolved SOP template before recording unit.
              </p>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#536174',
              backgroundColor: '#F3F4F4',
              border: '1px solid #E1E5E9',
              borderRadius: '4px',
              padding: '2px 8px'
            }}>
              Step 4 of 4
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
            backgroundColor: 'var(--bg-subtle)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Auto-Fetched Client & Facility:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{clientName}</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{siteName} ({city})</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{siteAddress}</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Client Contract & AMC:</span>
              <strong style={{ color: 'var(--text-primary)' }}>PO: {poNumber || 'N/A'}</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                AMC: {amcType} ({noOfVisits} visits/yr)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                PO Date: {poDate || 'N/A'} • Exp: {amcExpiryDate || 'N/A'}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Permanent Position Location:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{area}</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{location}</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Equipment Unit Identity:</span>
              <strong style={{ color: 'var(--brand-crimson)', fontSize: '0.95rem' }}>{serialNumber}</strong>
              <div>{equipmentType} ({capacity})</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Assigned Checklist SOP:</span>
              <strong style={{ color: 'var(--status-ok)' }}>{currentTemplate?.id} — {currentTemplate?.shortTitle}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doc: {currentTemplate?.docNo}</div>
            </div>
          </div>

          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            fontSize: '0.82rem',
            color: '#1E40AF',
            lineHeight: 1.4
          }}>
            <strong>Automatic Generation Sequence:</strong> Submitting will record this physical unit, generate a unique permanent Position Code (e.g. <code>IFS-POS-xxxxxx</code>) and an immutable QR Code.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{
                height: '40px',
                padding: '0 16px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: '#FFFFFF',
                color: '#17191C',
                border: '1px solid #E1E5E9',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitRegistration}
              style={{
                height: '40px',
                padding: '0 24px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: '#111827',
                color: '#FFFFFF',
                borderRadius: '6px',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Save Asset & Generate QR Sticker</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: QR Sticker Preview and Print Actions */}
      {step === 5 && registrationResult && (
        <QRStickerCard
          position={registrationResult}
          onNavigate={onNavigate}
          onRegisterAnother={handleResetForAnother}
        />
      )}

      {/* Equipment & Linked Target Service Master List Modal */}
      <EquipmentMasterModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        onEquipmentMasterUpdated={setEquipmentMaster}
      />
    </div>
  );
}
