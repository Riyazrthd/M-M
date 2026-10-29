// Indus Fire Safety Private Limited - Supabase Cloud Backup & Sync Service
// Provides SQL Schema generation, dynamic DDL & data backup, and live REST sync

import { 
  getSites, 
  getPositions, 
  getVisits, 
  getPlantTechnicians,
  getQRRegistry,
  getDeletedSiteIds,
  removeDeletedSiteId,
  clearDeletedSiteIds
} from '../data/storage.js';
import { 
  INITIAL_TEMPLATE_MAPPINGS, 
  INITIAL_EQUIPMENT_MASTER 
} from '../data/templateMappings.js';

const SUPABASE_CONFIG_KEY = 'ifspl_supabase_config';

const DEFAULT_SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) 
  || 'https://xvoirpdkblusopxrkbjo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) 
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2b2lycGRrYmx1c29weHJrYmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzk1NDcsImV4cCI6MjEwNjg1NTU0N30.iIagzt-f6Te0l3WXFXqWdIIKu6XBpa5I66JfD1bwFZE';

// Retrieve saved Supabase cloud credentials
export function getSupabaseConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || DEFAULT_SUPABASE_URL,
        anonKey: parsed.anonKey || DEFAULT_SUPABASE_ANON_KEY,
        autoSync: parsed.autoSync !== undefined ? !!parsed.autoSync : true,
        lastSyncedAt: parsed.lastSyncedAt || null
      };
    }
  } catch (e) {
    console.warn('Error reading Supabase config:', e);
  }
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    autoSync: true,
    lastSyncedAt: null
  };
}

// Background Auto-sync trigger
export async function autoSyncToSupabase() {
  if (typeof window === 'undefined') return;
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.anonKey && cfg.autoSync) {
    try {
      const res = await pushDataToSupabase(cfg.url, cfg.anonKey);
      if (res && res.success) {
        window.dispatchEvent(new CustomEvent('ifspl:supabase_synced', { detail: res }));
      }
      return res;
    } catch (e) {
      console.warn('[Supabase AutoSync] notice:', e);
    }
  }
}

// Save Supabase credentials to local storage
export function saveSupabaseConfig(config) {
  try {
    const current = getSupabaseConfig();
    const updated = {
      ...current,
      ...config
    };
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save Supabase config:', e);
    return null;
  }
}

// SQL String escape helper
function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    const json = JSON.stringify(val).replace(/'/g, "''");
    return `'${json}'::jsonb`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

// Generate the complete Supabase SQL Backup file (DDL + Data Inserts)
export function generateSupabaseSQLBackup() {
  const sites = getSites();
  const positions = getPositions();
  const visits = getVisits();
  const technicians = getPlantTechnicians();
  const equipmentMaster = (() => {
    try {
      const raw = localStorage.getItem('ifspl_amc_equipment_master');
      return raw ? JSON.parse(raw) : INITIAL_EQUIPMENT_MASTER;
    } catch (e) {
      return INITIAL_EQUIPMENT_MASTER;
    }
  })();
  const templateMappings = (() => {
    try {
      const raw = localStorage.getItem('ifspl_amc_template_mappings');
      return raw ? JSON.parse(raw) : INITIAL_TEMPLATE_MAPPINGS;
    } catch (e) {
      return INITIAL_TEMPLATE_MAPPINGS;
    }
  })();

  const now = new Date();
  const timestampStr = now.toISOString();

  let sql = `-- ============================================================================
-- INDUS FIRE SAFETY PRIVATE LIMITED — DIGITAL AMC SYSTEM
-- CLOUD DATABASE BACKUP & SUPABASE REPLICATION SCHEMA
-- Generated: ${timestampStr}
-- Format: PostgreSQL 14+ / Supabase Compatible
-- Instructions: Run this entire script in your Supabase Project SQL Editor
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLE: sites (Client Facilities & AMC Contracts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sites (
    id VARCHAR(64) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    company VARCHAR(255),
    plant_facility VARCHAR(255),
    code VARCHAR(64),
    address TEXT,
    city VARCHAR(128),
    po_number VARCHAR(128),
    po_date DATE,
    amc_type VARCHAR(64) DEFAULT 'Quarterly',
    frequency VARCHAR(64) DEFAULT 'Quarterly',
    no_of_visits INTEGER DEFAULT 4,
    amc_expiry_date DATE,
    work_order_ref VARCHAR(128),
    contract_period VARCHAR(128),
    client_contact VARCHAR(128),
    contact_phone VARCHAR(64),
    email VARCHAR(128),
    tax_id VARCHAR(64),
    total_positions INTEGER DEFAULT 0,
    inspected_positions INTEGER DEFAULT 0,
    status VARCHAR(64) DEFAULT 'Scheduled',
    scheduled_date DATE,
    applicable_checklists JSONB DEFAULT '["CL-11", "CL-03"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLE: equipment_master (Equipment Types, Categories & Capacities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.equipment_master (
    id VARCHAR(64) PRIMARY KEY,
    equipment_type VARCHAR(128) NOT NULL,
    category VARCHAR(128) NOT NULL,
    target_service VARCHAR(255),
    default_capacity VARCHAR(64),
    capacities JSONB DEFAULT '[]'::jsonb,
    linked_services JSONB DEFAULT '[]'::jsonb,
    checklist_template_id VARCHAR(32),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns are nullable and linked_services column exists if previously created
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'equipment_master' AND column_name = 'target_service' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.equipment_master ALTER COLUMN target_service DROP NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'equipment_master' AND column_name = 'linked_services'
    ) THEN
        ALTER TABLE public.equipment_master ADD COLUMN linked_services JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- ============================================================================
-- 3. TABLE: template_mappings (Category & Service to Checklist SOP Mappings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.template_mappings (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(128) NOT NULL,
    service_type VARCHAR(255) NOT NULL,
    template_id VARCHAR(32) NOT NULL,
    service_label VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TABLE: plant_technicians (On-Site Authorized Roster)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.plant_technicians (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    badge VARCHAR(64),
    role_title VARCHAR(128),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLE: positions (Permanent QR Equipment Positions & Mounted Units)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.positions (
    id VARCHAR(64) PRIMARY KEY,
    position_id VARCHAR(64) NOT NULL UNIQUE,
    qr_code VARCHAR(128) NOT NULL UNIQUE,
    site_id VARCHAR(64) REFERENCES public.sites(id) ON DELETE CASCADE,
    area VARCHAR(255),
    location VARCHAR(255),
    equipment_category VARCHAR(128),
    equipment_type VARCHAR(128),
    capacity VARCHAR(64),
    service_type VARCHAR(255),
    template_id VARCHAR(32),
    current_equipment_id VARCHAR(128),
    current_equipment JSONB,
    applicable_checklist_mapping JSONB,
    inspection_status VARCHAR(64) DEFAULT 'Pending Initial Inspection',
    last_inspection_date DATE,
    last_inspection_time VARCHAR(32),
    technician_name VARCHAR(128),
    technician_badge VARCHAR(64),
    history JSONB DEFAULT '[]'::jsonb,
    inspection_history JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    status VARCHAR(32) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. TABLE: visits (AMC Inspections, Checklists & Sign-Offs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.visits (
    id VARCHAR(64) PRIMARY KEY,
    visit_id VARCHAR(64) NOT NULL UNIQUE,
    site_id VARCHAR(64) REFERENCES public.sites(id) ON DELETE CASCADE,
    date DATE,
    work_order_ref VARCHAR(128),
    started_at TIMESTAMPTZ,
    service_engineer VARCHAR(128),
    technician_name VARCHAR(128),
    technician_badge VARCHAR(64),
    technician_role VARCHAR(128),
    supervisor VARCHAR(128),
    client_representative VARCHAR(128),
    status VARCHAR(64) DEFAULT 'In Progress',
    total_assets INTEGER DEFAULT 0,
    inspected_assets INTEGER DEFAULT 0,
    pending_assets INTEGER DEFAULT 0,
    checklist_answers JSONB DEFAULT '{}'::jsonb,
    pending_justifications JSONB DEFAULT '{}'::jsonb,
    visit_remarks TEXT,
    spares_replaced TEXT,
    pending_points TEXT,
    technician_signature TEXT,
    client_signature TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. TABLE: audit_sync_queue (Offline Queue & Sync Audit Log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_sync_queue (
    id VARCHAR(64) PRIMARY KEY,
    action_type VARCHAR(64) NOT NULL,
    payload JSONB,
    status VARCHAR(64) DEFAULT 'SYNCED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. TABLE: qr_registry (Permanent Bulk QR Codes & Asset Bindings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.qr_registry (
    id VARCHAR(64) PRIMARY KEY,
    token VARCHAR(128) NOT NULL UNIQUE,
    display_no VARCHAR(64) NOT NULL UNIQUE,
    seq_number INTEGER NOT NULL UNIQUE,
    batch_id VARCHAR(64) NOT NULL,
    batch_label VARCHAR(128),
    generated_date VARCHAR(64),
    generated_time VARCHAR(64),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by VARCHAR(128) DEFAULT 'Admin',
    assignment_status VARCHAR(64) DEFAULT 'Available',
    linked_asset_id VARCHAR(64),
    linked_position_id VARCHAR(64),
    linked_asset_name VARCHAR(255),
    assigned_date VARCHAR(64),
    assigned_by VARCHAR(128),
    lifecycle_status VARCHAR(64) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTO-MIGRATIONS FOR EXISTING SUPABASE TABLES
-- Ensures updated_at and required columns exist even on existing database schemas
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sites' AND column_name = 'updated_at') THEN
        ALTER TABLE public.sites ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'positions' AND column_name = 'updated_at') THEN
        ALTER TABLE public.positions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'updated_at') THEN
        ALTER TABLE public.visits ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'qr_registry' AND column_name = 'updated_at') THEN
        ALTER TABLE public.qr_registry ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_sites_code ON public.sites(code);
CREATE INDEX IF NOT EXISTS idx_sites_updated_at ON public.sites(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_qr_code ON public.positions(qr_code);
CREATE INDEX IF NOT EXISTS idx_positions_site_id ON public.positions(site_id);
CREATE INDEX IF NOT EXISTS idx_positions_equipment_type ON public.positions(equipment_type);
CREATE INDEX IF NOT EXISTS idx_positions_updated_at ON public.positions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_site_id ON public.visits(site_id);
CREATE INDEX IF NOT EXISTS idx_visits_updated_at ON public.visits(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_master_cat ON public.equipment_master(category);
CREATE INDEX IF NOT EXISTS idx_qr_registry_token ON public.qr_registry(token);
CREATE INDEX IF NOT EXISTS idx_qr_registry_batch ON public.qr_registry(batch_id);
CREATE INDEX IF NOT EXISTS idx_qr_registry_status ON public.qr_registry(assignment_status);
CREATE INDEX IF NOT EXISTS idx_qr_registry_seq ON public.qr_registry(seq_number);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures standard Supabase anon and authenticated keys work out of the box
-- ============================================================================
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_registry ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public access to sites" ON public.sites;
    CREATE POLICY "Public access to sites" ON public.sites FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to equipment_master" ON public.equipment_master;
    CREATE POLICY "Public access to equipment_master" ON public.equipment_master FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to template_mappings" ON public.template_mappings;
    CREATE POLICY "Public access to template_mappings" ON public.template_mappings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to plant_technicians" ON public.plant_technicians;
    CREATE POLICY "Public access to plant_technicians" ON public.plant_technicians FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to positions" ON public.positions;
    CREATE POLICY "Public access to positions" ON public.positions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to visits" ON public.visits;
    CREATE POLICY "Public access to visits" ON public.visits FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to audit_sync_queue" ON public.audit_sync_queue;
    CREATE POLICY "Public access to audit_sync_queue" ON public.audit_sync_queue FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to qr_registry" ON public.qr_registry;
    CREATE POLICY "Public access to qr_registry" ON public.qr_registry FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ============================================================================
-- BACKUP DATA INSERT STATEMENTS
-- ============================================================================

`;

  // 1. Sites Inserts
  sql += `-- Backing up ${sites.length} Sites\n`;
  for (const s of sites) {
    sql += `INSERT INTO public.sites (
  id, client_name, name, company, plant_facility, code, address, city, 
  po_number, po_date, amc_type, frequency, no_of_visits, amc_expiry_date, 
  work_order_ref, contract_period, client_contact, contact_phone, email, 
  tax_id, total_positions, inspected_positions, status, scheduled_date, applicable_checklists
) VALUES (
  ${sqlEscape(s.id)}, ${sqlEscape(s.clientName || s.name)}, ${sqlEscape(s.name)}, ${sqlEscape(s.company)}, 
  ${sqlEscape(s.plantFacility)}, ${sqlEscape(s.code)}, ${sqlEscape(s.address)}, ${sqlEscape(s.city)}, 
  ${sqlEscape(s.poNumber)}, ${sqlEscape(s.poDate)}, ${sqlEscape(s.amcType || s.frequency)}, ${sqlEscape(s.frequency || s.amcType)}, 
  ${sqlEscape(s.noOfVisits || 4)}, ${sqlEscape(s.amcExpiryDate)}, ${sqlEscape(s.workOrderRef)}, ${sqlEscape(s.contractPeriod)}, 
  ${sqlEscape(s.clientContact)}, ${sqlEscape(s.contactPhone)}, ${sqlEscape(s.email)}, ${sqlEscape(s.taxId)}, 
  ${sqlEscape(s.totalPositions || 0)}, ${sqlEscape(s.inspectedPositions || 0)}, ${sqlEscape(s.status || 'Scheduled')}, 
  ${sqlEscape(s.scheduledDate)}, ${sqlEscape(s.applicableChecklists || ['CL-11', 'CL-03'])}
) ON CONFLICT (id) DO UPDATE SET 
  client_name = EXCLUDED.client_name,
  po_number = EXCLUDED.po_number,
  po_date = EXCLUDED.po_date,
  amc_type = EXCLUDED.amc_type,
  no_of_visits = EXCLUDED.no_of_visits,
  amc_expiry_date = EXCLUDED.amc_expiry_date,
  updated_at = NOW();\n\n`;
  }

  // 2. Equipment Master Inserts
  sql += `-- Backing up ${equipmentMaster.length} Equipment Master items\n`;
  for (const em of equipmentMaster) {
    const primaryService = em.targetService || (em.linkedServices && em.linkedServices.length > 0 ? em.linkedServices[0].serviceType : 'Routine Servicing / Inspection');
    const primaryChecklist = em.checklistTemplateId || (em.linkedServices && em.linkedServices.length > 0 ? em.linkedServices[0].checklistTemplateId : 'CL-26');
    const linkedServices = em.linkedServices || [];

    sql += `INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  ${sqlEscape(em.id)}, ${sqlEscape(em.equipmentType)}, ${sqlEscape(em.category)}, 
  ${sqlEscape(primaryService)}, ${sqlEscape(em.defaultCapacity)}, ${sqlEscape(em.capacities || [])}, 
  ${sqlEscape(linkedServices)}, ${sqlEscape(primaryChecklist)}
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;\n\n`;
  }

  // 3. Template Mappings Inserts
  sql += `-- Backing up ${templateMappings.length} Template Mappings\n`;
  for (const tm of templateMappings) {
    const category = tm.category || tm.equipmentCategory || 'Fire Extinguisher';
    const serviceType = tm.serviceType || 'Routine Servicing / Inspection';
    const templateId = tm.templateId || tm.checklistTemplateId || 'CL-26';
    const label = tm.serviceLabel || tm.notes || tm.equipmentType || serviceType;

    sql += `INSERT INTO public.template_mappings (
  id, category, service_type, template_id, service_label
) VALUES (
  ${sqlEscape(tm.id)}, ${sqlEscape(category)}, ${sqlEscape(serviceType)}, 
  ${sqlEscape(templateId)}, ${sqlEscape(label)}
) ON CONFLICT (id) DO NOTHING;\n\n`;
  }

  // 4. Plant Technicians Inserts
  sql += `-- Backing up ${technicians.length} Plant Technicians\n`;
  for (const t of technicians) {
    sql += `INSERT INTO public.plant_technicians (
  id, name, badge, role_title, is_active
) VALUES (
  ${sqlEscape(t.id)}, ${sqlEscape(t.name)}, ${sqlEscape(t.badge)}, 
  ${sqlEscape(t.roleTitle)}, TRUE
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  badge = EXCLUDED.badge;\n\n`;
  }

  // 5. Positions Inserts
  sql += `-- Backing up ${positions.length} Permanent Equipment Positions\n`;
  for (const p of positions) {
    const pId = p.positionId || p.id;
    sql += `INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  ${sqlEscape(pId)}, ${sqlEscape(pId)}, ${sqlEscape(p.qrCode)}, ${sqlEscape(p.siteId)}, 
  ${sqlEscape(p.area)}, ${sqlEscape(p.location)}, ${sqlEscape(p.equipmentCategory || p.category)}, 
  ${sqlEscape(p.equipmentType)}, ${sqlEscape(p.capacity || p.currentEquipment?.capacity)}, 
  ${sqlEscape(p.serviceType)}, ${sqlEscape(p.templateId)}, ${sqlEscape(p.currentEquipmentId || p.currentEquipment?.serialNo)}, 
  ${sqlEscape(p.currentEquipment)}, ${sqlEscape(p.applicableChecklistMapping)}, 
  ${sqlEscape(p.inspectionStatus || 'Pending')}, ${sqlEscape(p.lastInspectionDate)}, 
  ${sqlEscape(p.lastInspectionTime)}, ${sqlEscape(p.technicianName)}, ${sqlEscape(p.technicianBadge)}, 
  ${sqlEscape(p.history || [])}, ${sqlEscape(p.inspectionHistory || [])}, ${sqlEscape(p.notes || '')}, 
  ${sqlEscape(p.status || 'Active')}
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();\n\n`;
  }

  // 6. Visits Inserts
  sql += `-- Backing up ${visits.length} AMC Visits\n`;
  for (const v of visits) {
    const vId = v.visitId || v.id;
    sql += `INSERT INTO public.visits (
  id, visit_id, site_id, date, service_engineer, technician_name, technician_badge, 
  technician_role, supervisor, client_representative, status, checklist_answers, 
  visit_remarks, spares_replaced, pending_points, technician_signature, client_signature, completed_at
) VALUES (
  ${sqlEscape(vId)}, ${sqlEscape(vId)}, ${sqlEscape(v.siteId)}, ${sqlEscape(v.date)}, 
  ${sqlEscape(v.serviceEngineer)}, ${sqlEscape(v.technicianName || v.serviceEngineer)}, 
  ${sqlEscape(v.technicianBadge)}, ${sqlEscape(v.technicianRole)}, ${sqlEscape(v.supervisor)}, 
  ${sqlEscape(v.clientRepresentative)}, ${sqlEscape(v.status)}, ${sqlEscape(v.checklistAnswers || {})}, 
  ${sqlEscape(v.visitRemarks || '')}, ${sqlEscape(v.sparesReplaced || '')}, ${sqlEscape(v.pendingPoints || '')}, 
  ${sqlEscape(v.technicianSignature)}, ${sqlEscape(v.clientSignature)}, ${sqlEscape(v.completedAt)}
) ON CONFLICT (visit_id) DO UPDATE SET 
  status = EXCLUDED.status,
  checklist_answers = EXCLUDED.checklist_answers,
  visit_remarks = EXCLUDED.visit_remarks,
  technician_signature = EXCLUDED.technician_signature,
  client_signature = EXCLUDED.client_signature,
  updated_at = NOW();\n\n`;
  }

  // 7. QR Registry Inserts (Module 1 & 10)
  const qrRegistry = getQRRegistry();
  sql += `-- Backing up ${qrRegistry.length} Permanent QR Code Records\n`;
  for (const qr of qrRegistry) {
    sql += `INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  ${sqlEscape(qr.id)}, ${sqlEscape(qr.token)}, ${sqlEscape(qr.displayNo)}, 
  ${qr.seqNumber || 0}, ${sqlEscape(qr.batchId)}, ${sqlEscape(qr.batchLabel)}, 
  ${sqlEscape(qr.generatedDate)}, ${sqlEscape(qr.generatedTime)}, 
  ${sqlEscape(qr.generatedAt || new Date().toISOString())}, 
  ${sqlEscape(qr.generatedBy || 'Admin')}, 
  ${sqlEscape(qr.assignmentStatus || 'Available')}, 
  ${sqlEscape(qr.linkedAssetId || null)}, 
  ${sqlEscape(qr.linkedPositionId || null)}, 
  ${sqlEscape(qr.linkedAssetName || null)}, 
  ${sqlEscape(qr.assignedDate || null)}, 
  ${sqlEscape(qr.assignedBy || null)}, 
  ${sqlEscape(qr.lifecycleStatus || 'Active')}
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;\n\n`;
  }

  sql += `-- ============================================================================
-- BACKUP COMPLETE
-- Total Sites: ${sites.length}
-- Total Equipment Master Types: ${equipmentMaster.length}
-- Total Positions (QR tags): ${positions.length}
-- Total Visits: ${visits.length}
-- Total Permanent QR Codes: ${qrRegistry.length}
-- ============================================================================
`;

  return sql;
}

// Download dynamic SQL file to user's computer
export function downloadSQLBackupFile() {
  const sql = generateSupabaseSQLBackup();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `ifspl_supabase_backup_${dateStr}.sql`;
  
  const blob = new Blob([sql], { type: 'application/sql;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
}

// Generate complete JSON dump
export function generateJSONBackup() {
  const sites = getSites();
  const positions = getPositions();
  const visits = getVisits();
  const technicians = getPlantTechnicians();
  const qrRegistry = getQRRegistry();
  const equipmentMaster = (() => {
    try {
      const raw = localStorage.getItem('ifspl_amc_equipment_master');
      return raw ? JSON.parse(raw) : INITIAL_EQUIPMENT_MASTER;
    } catch (e) {
      return INITIAL_EQUIPMENT_MASTER;
    }
  })();
  const templateMappings = (() => {
    try {
      const raw = localStorage.getItem('ifspl_amc_template_mappings');
      return raw ? JSON.parse(raw) : INITIAL_TEMPLATE_MAPPINGS;
    } catch (e) {
      return INITIAL_TEMPLATE_MAPPINGS;
    }
  })();

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    organization: 'Indus Fire Safety Private Limited',
    system: 'Digital AMC Equipment Tracking & Inspection Platform',
    tables: {
      sites,
      positions,
      visits,
      plant_technicians: technicians,
      equipment_master: equipmentMaster,
      template_mappings: templateMappings,
      qr_registry: qrRegistry
    }
  };
}

// Download JSON file
export function downloadJSONBackupFile() {
  const data = generateJSONBackup();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `ifspl_cloud_backup_${dateStr}.json`;
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
}

// Test live Supabase connection
export async function testSupabaseConnection(url, anonKey) {
  if (!url || !url.trim() || !anonKey || !anonKey.trim()) {
    return { success: false, message: 'Supabase URL and Anon Key are required.' };
  }

  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  try {
    const res = await fetch(`${cleanUrl}/rest/v1/sites?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      return { 
        success: true, 
        message: 'Successfully connected to Supabase cloud! The "sites" table is reachable.' 
      };
    }

    if (res.status === 401 || res.status === 403) {
      return { 
        success: false, 
        message: 'Authentication failed. Please verify your Supabase Anon Public API Key.' 
      };
    }

    if (res.status === 404 || res.status === 400) {
      // Endpoint reached but table might not exist yet
      return {
        success: true,
        message: 'Connected to Supabase project! (Tables not yet initialized — please run the SQL backup script first).'
      };
    }

    const errText = await res.text();
    return { 
      success: false, 
      message: `Supabase returned HTTP ${res.status}: ${errText.slice(0, 120)}` 
    };
  } catch (e) {
    return { 
      success: false, 
      message: `Connection error: ${e.message}. Check your URL format (e.g. https://your-id.supabase.co).` 
    };
  }
}

// Delete an individual site and cascade its positions and visits in Supabase Cloud
export async function deleteSiteFromSupabase(siteId) {
  if (!siteId) return { success: false, error: 'siteId is required' };
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) return { success: false, error: 'No cloud config' };

  const cleanUrl = cfg.url.trim().replace(/\/+$/, '');
  const cleanKey = cfg.anonKey.trim();
  const headers = {
    'apikey': cleanKey,
    'Authorization': `Bearer ${cleanKey}`,
    'Content-Type': 'application/json'
  };

  const encodedId = encodeURIComponent(siteId);

  try {
    // 1. Delete associated positions in Supabase
    await fetch(`${cleanUrl}/rest/v1/positions?site_id=eq.${encodedId}`, {
      method: 'DELETE',
      headers
    });

    // 2. Delete associated visits in Supabase
    await fetch(`${cleanUrl}/rest/v1/visits?site_id=eq.${encodedId}`, {
      method: 'DELETE',
      headers
    });

    // 3. Delete the site in Supabase
    const res = await fetch(`${cleanUrl}/rest/v1/sites?id=eq.${encodedId}`, {
      method: 'DELETE',
      headers
    });

    if (res.ok) {
      removeDeletedSiteId(siteId);
      return { success: true };
    } else {
      const err = await res.text();
      console.warn('Supabase site delete response:', err);
      return { success: false, error: err };
    }
  } catch (err) {
    console.warn('deleteSiteFromSupabase error:', err);
    return { success: false, error: err.message };
  }
}

// Wipe all client records (sites, positions, visits) from Supabase Cloud
export async function clearSupabaseClientData() {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) return { success: false, error: 'No cloud config' };

  const cleanUrl = cfg.url.trim().replace(/\/+$/, '');
  const cleanKey = cfg.anonKey.trim();
  const headers = {
    'apikey': cleanKey,
    'Authorization': `Bearer ${cleanKey}`,
    'Content-Type': 'application/json'
  };

  try {
    // Delete positions, visits, sites in cloud (using not.is.null filter)
    await fetch(`${cleanUrl}/rest/v1/positions?id=not.is.null`, { method: 'DELETE', headers });
    await fetch(`${cleanUrl}/rest/v1/visits?id=not.is.null`, { method: 'DELETE', headers });
    await fetch(`${cleanUrl}/rest/v1/sites?id=not.is.null`, { method: 'DELETE', headers });
    clearDeletedSiteIds();
    return { success: true };
  } catch (err) {
    console.warn('clearSupabaseClientData error:', err);
    return { success: false, error: err.message };
  }
}

// Live Push to Supabase Cloud via PostgREST
export async function pushDataToSupabase(url, anonKey) {
  const conn = await testSupabaseConnection(url, anonKey);
  if (!conn.success) {
    return { success: false, error: conn.message };
  }

  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  // Purge any tombstoned deleted sites from remote cloud first
  const deletedIds = getDeletedSiteIds();
  if (Array.isArray(deletedIds) && deletedIds.length > 0) {
    for (const delId of deletedIds) {
      try {
        await deleteSiteFromSupabase(delId);
      } catch (e) {}
    }
  }

  const headers = {
    'apikey': cleanKey,
    'Authorization': `Bearer ${cleanKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };

  const results = {
    sites: 0,
    equipmentMaster: 0,
    technicians: 0,
    positions: 0,
    visits: 0
  };

  try {
    // 1. Sync Sites
    const sites = getSites().map(s => ({
      id: s.id,
      client_name: s.clientName || s.name,
      name: s.name,
      company: s.company,
      plant_facility: s.plantFacility,
      code: s.code,
      address: s.address,
      city: s.city,
      po_number: s.poNumber,
      po_date: s.poDate,
      amc_type: s.amcType || s.frequency,
      frequency: s.frequency || s.amcType,
      no_of_visits: s.noOfVisits || 4,
      amc_expiry_date: s.amcExpiryDate,
      work_order_ref: s.workOrderRef,
      contract_period: s.contractPeriod,
      client_contact: s.clientContact,
      contact_phone: s.contactPhone,
      email: s.email,
      tax_id: s.taxId,
      total_positions: s.totalPositions || 0,
      inspected_positions: s.inspectedPositions || 0,
      status: s.status || 'Scheduled',
      scheduled_date: s.scheduledDate,
      applicable_checklists: s.applicableChecklists || ['CL-11', 'CL-03'],
      updated_at: new Date().toISOString()
    }));

    const resSites = await fetch(`${cleanUrl}/rest/v1/sites`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sites)
    });
    if (!resSites.ok) throw new Error(`Sites sync failed: ${await resSites.text()}`);
    results.sites = sites.length;

    // 2. Sync Equipment Master
    const rawEM = localStorage.getItem('ifspl_amc_equipment_master');
    const equipmentMaster = (rawEM ? JSON.parse(rawEM) : INITIAL_EQUIPMENT_MASTER).map(em => ({
      id: em.id,
      equipment_type: em.equipmentType,
      category: em.category,
      target_service: em.targetService || em.linkedServices?.[0]?.serviceType || 'Routine Servicing / Inspection',
      default_capacity: em.defaultCapacity,
      capacities: em.capacities || [],
      linked_services: em.linkedServices || [],
      checklist_template_id: em.checklistTemplateId || em.linkedServices?.[0]?.checklistTemplateId || 'CL-26'
    }));

    const resEM = await fetch(`${cleanUrl}/rest/v1/equipment_master`, {
      method: 'POST',
      headers,
      body: JSON.stringify(equipmentMaster)
    });
    if (resEM.ok) results.equipmentMaster = equipmentMaster.length;

    // 3. Sync Technicians
    const techs = getPlantTechnicians().map(t => ({
      id: t.id,
      name: t.name,
      badge: t.badge,
      role_title: t.roleTitle,
      is_active: true
    }));

    const resTechs = await fetch(`${cleanUrl}/rest/v1/plant_technicians`, {
      method: 'POST',
      headers,
      body: JSON.stringify(techs)
    });
    if (resTechs.ok) results.technicians = techs.length;

    // 4. Sync Positions
    const positions = getPositions().map(p => {
      const pId = p.positionId || p.id;
      return {
        id: pId,
        position_id: pId,
        qr_code: p.qrCode,
        site_id: p.siteId,
        area: p.area,
        location: p.location,
        equipment_category: p.equipmentCategory || p.category,
        equipment_type: p.equipmentType,
        capacity: p.capacity || p.currentEquipment?.capacity,
        service_type: p.serviceType,
        template_id: p.templateId,
        current_equipment_id: p.currentEquipmentId || p.currentEquipment?.serialNo,
        current_equipment: p.currentEquipment,
        applicable_checklist_mapping: p.applicableChecklistMapping,
        inspection_status: p.inspectionStatus || 'Pending',
        last_inspection_date: p.lastInspectionDate,
        last_inspection_time: p.lastInspectionTime,
        technician_name: p.technicianName,
        technician_badge: p.technicianBadge,
        history: p.history || [],
        inspection_history: p.inspectionHistory || [],
        notes: p.notes || '',
        status: p.status || 'Active',
        updated_at: new Date().toISOString()
      };
    });

    const resPos = await fetch(`${cleanUrl}/rest/v1/positions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(positions)
    });
    if (!resPos.ok) throw new Error(`Positions sync failed: ${await resPos.text()}`);
    results.positions = positions.length;

    // 5. Sync Visits
    const visits = getVisits().map(v => {
      const vId = v.visitId || v.id;
      return {
        id: vId,
        visit_id: vId,
        site_id: v.siteId,
        date: v.date,
        work_order_ref: v.workOrderRef,
        started_at: v.startedAt,
        service_engineer: v.serviceEngineer,
        technician_name: v.technicianName || v.serviceEngineer,
        technician_badge: v.technicianBadge,
        technician_role: v.technicianRole,
        supervisor: v.supervisor,
        client_representative: v.clientRepresentative,
        status: v.status,
        total_assets: v.totalAssets || 0,
        inspected_assets: v.inspectedAssets || 0,
        pending_assets: v.pendingAssets || 0,
        checklist_answers: v.checklistAnswers || {},
        pending_justifications: v.pendingJustifications || {},
        visit_remarks: v.visitRemarks || '',
        spares_replaced: v.sparesReplaced || '',
        pending_points: v.pendingPoints || '',
        technician_signature: v.technicianSignature,
        client_signature: v.clientSignature,
        completed_at: v.completedAt,
        updated_at: new Date().toISOString()
      };
    });

    const resVisits = await fetch(`${cleanUrl}/rest/v1/visits`, {
      method: 'POST',
      headers,
      body: JSON.stringify(visits)
    });
    if (resVisits.ok) results.visits = visits.length;

    // 6. Sync QR Registry
    const qrList = getQRRegistry().map(qr => ({
      id: qr.id,
      token: qr.token,
      display_no: qr.displayNo,
      seq_number: qr.seqNumber || 0,
      batch_id: qr.batchId,
      batch_label: qr.batchLabel,
      generated_date: qr.generatedDate,
      generated_time: qr.generatedTime,
      generated_at: qr.generatedAt || new Date().toISOString(),
      generated_by: qr.generatedBy || 'Admin',
      assignment_status: qr.assignmentStatus || 'Available',
      linked_asset_id: qr.linkedAssetId || null,
      linked_position_id: qr.linkedPositionId || null,
      linked_asset_name: qr.linkedAssetName || null,
      assigned_date: qr.assignedDate || null,
      assigned_by: qr.assignedBy || null,
      lifecycle_status: qr.lifecycleStatus || 'Active'
    }));

    try {
      const resQr = await fetch(`${cleanUrl}/rest/v1/qr_registry`, {
        method: 'POST',
        headers,
        body: JSON.stringify(qrList)
      });
      if (resQr.ok) results.qrRegistry = qrList.length;
    } catch (e) {
      console.warn('QR registry sync notice:', e);
    }

    // Record last sync timestamp
    saveSupabaseConfig({ lastSyncedAt: new Date().toISOString() });

    return {
      success: true,
      stats: results,
      syncedAt: new Date().toISOString()
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// Live Pull / Restore from Supabase Cloud
export async function pullDataFromSupabase(url, anonKey) {
  const conn = await testSupabaseConnection(url, anonKey);
  if (!conn.success) {
    return { success: false, error: conn.message };
  }

  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  const headers = {
    'apikey': cleanKey,
    'Authorization': `Bearer ${cleanKey}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Fetch Sites
    const resSites = await fetch(`${cleanUrl}/rest/v1/sites?select=*`, { headers });
    if (!resSites.ok) throw new Error(`Failed to fetch sites: ${await resSites.text()}`);
    const sites = await resSites.json();

    // 2. Fetch Positions
    const resPositions = await fetch(`${cleanUrl}/rest/v1/positions?select=*`, { headers });
    if (!resPositions.ok) throw new Error(`Failed to fetch positions: ${await resPositions.text()}`);
    const positions = await resPositions.json();

    // 3. Fetch Visits
    const resVisits = await fetch(`${cleanUrl}/rest/v1/visits?select=*`, { headers });
    const visits = resVisits.ok ? await resVisits.json() : [];

    // 4. Fetch Equipment Master
    const resEM = await fetch(`${cleanUrl}/rest/v1/equipment_master?select=*`, { headers });
    const equipmentMaster = resEM.ok ? await resEM.json() : [];

    // 5. Fetch Technicians
    const resTechs = await fetch(`${cleanUrl}/rest/v1/plant_technicians?select=*`, { headers });
    const technicians = resTechs.ok ? await resTechs.json() : [];

    // 6. Fetch QR Registry
    let qrRegistry = [];
    try {
      const resQr = await fetch(`${cleanUrl}/rest/v1/qr_registry?select=*`, { headers });
      if (resQr.ok) qrRegistry = await resQr.json();
    } catch (e) {
      console.warn('QR registry pull notice:', e);
    }

    // Transform and store locally with tombstone filtering
    const deletedSiteIds = getDeletedSiteIds();
    if (Array.isArray(deletedSiteIds) && deletedSiteIds.length > 0) {
      deletedSiteIds.forEach(delId => {
        deleteSiteFromSupabase(delId).catch(() => {});
      });
    }

    const activeSites = Array.isArray(sites) 
      ? sites.filter(s => s && s.id && !deletedSiteIds.includes(s.id))
      : [];

    const activePositions = Array.isArray(positions)
      ? positions.filter(p => p && (!p.site_id || !deletedSiteIds.includes(p.site_id)))
      : [];

    const activeVisits = Array.isArray(visits)
      ? visits.filter(v => v && (!v.site_id || !deletedSiteIds.includes(v.site_id)))
      : [];

    if (Array.isArray(sites)) {
      const transformedSites = activeSites.map(s => ({
        id: s.id,
        clientName: s.client_name || s.name,
        name: s.name,
        company: s.company,
        plantFacility: s.plant_facility,
        code: s.code,
        address: s.address,
        city: s.city,
        poNumber: s.po_number,
        poDate: s.po_date,
        amcType: s.amc_type,
        frequency: s.frequency,
        noOfVisits: s.no_of_visits,
        amcExpiryDate: s.amc_expiry_date,
        workOrderRef: s.work_order_ref,
        contractPeriod: s.contract_period,
        clientContact: s.client_contact,
        contactPhone: s.contact_phone,
        email: s.email,
        taxId: s.tax_id,
        totalPositions: s.total_positions || 0,
        inspectedPositions: s.inspected_positions || 0,
        status: s.status,
        scheduledDate: s.scheduled_date,
        applicableChecklists: s.applicable_checklists || ['CL-11', 'CL-03']
      }));
      localStorage.setItem('ifspl_amc_sites', JSON.stringify(transformedSites));
    }

    if (Array.isArray(positions)) {
      const transformedPositions = activePositions.map(p => ({
        id: p.id,
        positionId: p.position_id || p.id,
        qrCode: p.qr_code,
        siteId: p.site_id,
        area: p.area,
        location: p.location,
        equipmentCategory: p.equipment_category,
        equipmentType: p.equipment_type,
        capacity: p.capacity,
        serviceType: p.service_type,
        templateId: p.template_id,
        currentEquipmentId: p.current_equipment_id,
        currentEquipment: p.current_equipment,
        applicableChecklistMapping: p.applicable_checklist_mapping,
        inspectionStatus: p.inspection_status,
        lastInspectionDate: p.last_inspection_date,
        lastInspectionTime: p.last_inspection_time,
        technicianName: p.technician_name,
        technicianBadge: p.technician_badge,
        history: p.history || [],
        inspectionHistory: p.inspection_history || [],
        notes: p.notes,
        status: p.status
      }));
      localStorage.setItem('ifspl_amc_positions', JSON.stringify(transformedPositions));
    }

    if (Array.isArray(visits)) {
      const transformedVisits = activeVisits.map(v => ({
        id: v.id,
        visitId: v.visit_id || v.id,
        siteId: v.site_id,
        date: v.date,
        serviceEngineer: v.service_engineer,
        technicianName: v.technician_name,
        technicianBadge: v.technician_badge,
        technicianRole: v.technician_role,
        supervisor: v.supervisor,
        clientRepresentative: v.client_representative,
        status: v.status,
        checklistAnswers: v.checklist_answers || {},
        visitRemarks: v.visit_remarks,
        sparesReplaced: v.spares_replaced,
        pendingPoints: v.pending_points,
        technicianSignature: v.technician_signature,
        clientSignature: v.client_signature,
        completedAt: v.completed_at
      }));
      localStorage.setItem('ifspl_amc_visits', JSON.stringify(transformedVisits));
    }

    if (Array.isArray(equipmentMaster) && equipmentMaster.length > 0) {
      const transformedEM = equipmentMaster.map(em => ({
        id: em.id,
        equipmentType: em.equipment_type,
        category: em.category,
        targetService: em.target_service,
        defaultCapacity: em.default_capacity,
        capacities: em.capacities || [],
        linkedServices: em.linked_services || [],
        checklistTemplateId: em.checklist_template_id
      }));
      localStorage.setItem('ifspl_amc_equipment_master', JSON.stringify(transformedEM));
    }

    if (Array.isArray(technicians) && technicians.length > 0) {
      const transformedTechs = technicians.map(t => ({
        id: t.id,
        name: t.name,
        badge: t.badge,
        roleTitle: t.role_title
      }));
      localStorage.setItem('ifspl_amc_plant_technicians', JSON.stringify(transformedTechs));
    }

    if (Array.isArray(qrRegistry) && qrRegistry.length > 0) {
      const transformedQr = qrRegistry.map(qr => ({
        id: qr.id,
        token: qr.token,
        displayNo: qr.display_no,
        seqNumber: qr.seq_number || 0,
        batchId: qr.batch_id,
        batchLabel: qr.batch_label,
        generatedDate: qr.generated_date,
        generatedTime: qr.generated_time,
        generatedAt: qr.generated_at,
        generatedBy: qr.generated_by,
        assignmentStatus: qr.assignment_status,
        linkedAssetId: qr.linked_asset_id,
        linkedPositionId: qr.linked_position_id,
        linkedAssetName: qr.linked_asset_name,
        assignedDate: qr.assigned_date,
        assignedBy: qr.assigned_by,
        lifecycleStatus: qr.lifecycle_status
      }));
      localStorage.setItem('ifspl_amc_qr_registry', JSON.stringify(transformedQr));
    }

    // Record last sync timestamp
    saveSupabaseConfig({ lastSyncedAt: new Date().toISOString() });

    // Notify UI components that data has updated silently in background
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('ifspl:cloud_synced', { 
          detail: { 
            restored: {
              sites: sites.length,
              positions: positions.length,
              visits: visits.length,
              equipmentMaster: equipmentMaster.length,
              technicians: technicians.length,
              qrRegistry: qrRegistry.length
            }
          } 
        }));
        window.dispatchEvent(new CustomEvent('ifspl:sites_updated'));
        window.dispatchEvent(new CustomEvent('ifspl:positions_updated'));
        window.dispatchEvent(new CustomEvent('ifspl:visits_updated'));
        window.dispatchEvent(new CustomEvent('ifspl:qr_registry_updated'));
        window.dispatchEvent(new CustomEvent('storage'));
      } catch (e) {}
    }

    return {
      success: true,
      restored: {
        sites: sites.length,
        positions: positions.length,
        visits: visits.length,
        equipmentMaster: equipmentMaster.length,
        technicians: technicians.length,
        qrRegistry: qrRegistry.length
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Fetch a specific position on-demand from Supabase by position_id or qr_code
 * Used when a mobile phone scans a QR code generated on another device
 */
export async function fetchPositionFromSupabase(queryCode) {
  if (!queryCode || typeof queryCode !== 'string') return null;
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  const cleanUrl = config.url.trim().replace(/\/+$/, '');
  const cleanKey = config.anonKey.trim();
  const headers = {
    'apikey': cleanKey,
    'Authorization': `Bearer ${cleanKey}`,
    'Content-Type': 'application/json'
  };

  try {
    const clean = encodeURIComponent(queryCode.trim());
    const res = await fetch(`${cleanUrl}/rest/v1/positions?or=(position_id.eq.${clean},qr_code.eq.${clean},id.eq.${clean})&select=*`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const p = data[0];
        const transformed = {
          id: p.id,
          positionId: p.position_id || p.id,
          qrCode: p.qr_code,
          qrToken: p.qr_code,
          siteId: p.site_id,
          area: p.area,
          location: p.location,
          equipmentCategory: p.equipment_category,
          equipmentType: p.equipment_type,
          capacity: p.capacity,
          serviceType: p.service_type,
          templateId: p.template_id,
          currentEquipmentId: p.current_equipment_id,
          currentEquipment: p.current_equipment,
          applicableChecklistMapping: p.applicable_checklist_mapping,
          inspectionStatus: p.inspection_status || 'Active in Position',
          lastInspectionDate: p.last_inspection_date,
          history: p.history || []
        };
        // Cache into local positions
        try {
          const raw = localStorage.getItem('ifspl_amc_positions');
          const localPositions = raw ? JSON.parse(raw) : [];
          const idx = localPositions.findIndex(lp => lp.positionId === transformed.positionId || lp.id === transformed.id);
          if (idx >= 0) {
            localPositions[idx] = transformed;
          } else {
            localPositions.push(transformed);
          }
          localStorage.setItem('ifspl_amc_positions', JSON.stringify(localPositions));
        } catch (e) {}

        return transformed;
      }
    }
  } catch (err) {
    console.warn('fetchPositionFromSupabase error:', err);
  }
  return null;
}

// ----------------------------------------------------------------------------
// INSTANT CLOUD SYNC & SILENT BACKGROUND REFRESH ENGINE
// ----------------------------------------------------------------------------

/**
 * Lightweight check to see if remote Supabase database has changes newer than lastSyncedAt.
 * Queries only 1 row (updated_at) per table instead of downloading whole collections.
 */
export async function checkCloudHasUpdates(url, anonKey, lastSyncedAt) {
  if (!url || !anonKey) return false;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();
  const headers = {
    'apikey': cleanKey,
    'Authorization': `Bearer ${cleanKey}`,
    'Content-Type': 'application/json'
  };

  try {
    // If device has never synced before, it needs fresh data
    if (!lastSyncedAt) return true;
    const lastSyncTime = new Date(lastSyncedAt).getTime();

    // Check positions table
    const resPos = await fetch(`${cleanUrl}/rest/v1/positions?select=updated_at&order=updated_at.desc&limit=1`, { headers });
    if (resPos.ok) {
      const rows = await resPos.json();
      if (Array.isArray(rows) && rows[0]?.updated_at) {
        if (new Date(rows[0].updated_at).getTime() > lastSyncTime) return true;
      }
    }

    // Check sites table
    const resSites = await fetch(`${cleanUrl}/rest/v1/sites?select=updated_at&order=updated_at.desc&limit=1`, { headers });
    if (resSites.ok) {
      const rows = await resSites.json();
      if (Array.isArray(rows) && rows[0]?.updated_at) {
        if (new Date(rows[0].updated_at).getTime() > lastSyncTime) return true;
      }
    }

    // Check visits table
    const resVisits = await fetch(`${cleanUrl}/rest/v1/visits?select=updated_at&order=updated_at.desc&limit=1`, { headers });
    if (resVisits.ok) {
      const rows = await resVisits.json();
      if (Array.isArray(rows) && rows[0]?.updated_at) {
        if (new Date(rows[0].updated_at).getTime() > lastSyncTime) return true;
      }
    }
  } catch (err) {
    // Silent network failure during background check
  }
  return false;
}

let debouncePushTimer = null;
let isPushingToCloud = false;
let pendingPushAgain = false;

/**
 * Triggers instant debounced outbound push to Supabase Cloud whenever local state changes.
 * Debounced to 300ms so rapid edits or batch modifications do not flood the network.
 */
export function triggerInstantCloudSync(reason = 'data_change') {
  if (typeof window === 'undefined') return;
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey || !cfg.autoSync) return;

  if (debouncePushTimer) {
    clearTimeout(debouncePushTimer);
  }

  // Set 300ms debounce
  debouncePushTimer = setTimeout(async () => {
    if (isPushingToCloud) {
      pendingPushAgain = true;
      return;
    }

    isPushingToCloud = true;
    try {
      window.dispatchEvent(new CustomEvent('ifspl:cloud_sync_status', {
        detail: { status: 'syncing', message: 'Syncing to cloud...', reason }
      }));

      const res = await pushDataToSupabase(cfg.url, cfg.anonKey);
      if (res && res.success) {
        window.dispatchEvent(new CustomEvent('ifspl:cloud_sync_status', {
          detail: { 
            status: 'synced', 
            message: 'Live Cloud ✓', 
            stats: res.stats, 
            timestamp: Date.now() 
          }
        }));
        window.dispatchEvent(new CustomEvent('ifspl:supabase_synced', { detail: res }));
      } else {
        window.dispatchEvent(new CustomEvent('ifspl:cloud_sync_status', {
          detail: { 
            status: 'error', 
            message: res?.error || 'Cloud sync failed',
            timestamp: Date.now() 
          }
        }));
      }
    } catch (e) {
      window.dispatchEvent(new CustomEvent('ifspl:cloud_sync_status', {
        detail: { status: 'error', message: e.message || 'Network sync error', timestamp: Date.now() }
      }));
    } finally {
      isPushingToCloud = false;
      if (pendingPushAgain) {
        pendingPushAgain = false;
        triggerInstantCloudSync('queued_updates');
      }
    }
  }, 300);
}

let isPullingFromCloud = false;

/**
 * Silently polls the cloud for remote changes and pulls them into local storage
 * without reloading the page or interrupting active user input.
 */
export async function silentCheckAndSync(triggerSource = 'poll') {
  if (typeof window === 'undefined') return;
  if (isPullingFromCloud || isPushingToCloud) return;

  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey || !cfg.autoSync) return;

  try {
    const hasUpdates = await checkCloudHasUpdates(cfg.url, cfg.anonKey, cfg.lastSyncedAt);
    if (hasUpdates) {
      isPullingFromCloud = true;
      window.dispatchEvent(new CustomEvent('ifspl:cloud_sync_status', {
        detail: { status: 'refreshing', message: 'Updating from cloud...' }
      }));

      const res = await pullDataFromSupabase(cfg.url, cfg.anonKey);
      if (res && res.success) {
        saveSupabaseConfig({ lastSyncedAt: new Date().toISOString() });
        window.dispatchEvent(new CustomEvent('ifspl:cloud_sync_status', {
          detail: { status: 'synced', message: 'Updated Live ✓', timestamp: Date.now() }
        }));
      }
    }
  } catch (e) {
    // Silent fail in background
  } finally {
    isPullingFromCloud = false;
  }
}

let bgSyncInitialized = false;

/**
 * Initializes the background cloud synchronization lifecycle.
 * Listens to local mutation events, window focus, visibility changes, network reconnection,
 * and maintains a lightweight background heartbeat poller.
 */
export function initBackgroundCloudSync(options = {}) {
  if (typeof window === 'undefined' || bgSyncInitialized) return;
  bgSyncInitialized = true;

  const intervalMs = options.intervalMs || 6000;

  // 1. Listen for local mutations requesting cloud sync
  window.addEventListener('ifspl:request_cloud_sync', (e) => {
    triggerInstantCloudSync(e.detail?.reason || 'local_mutation');
  });

  // 2. Window focus & tab visibility change -> immediate silent check
  window.addEventListener('focus', () => {
    silentCheckAndSync('window_focus');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      silentCheckAndSync('visibility_change');
    }
  });

  // 3. Online reconnect -> push local pending queue and check cloud
  window.addEventListener('online', () => {
    triggerInstantCloudSync('reconnect_online');
    silentCheckAndSync('reconnect_online');
  });

  // 4. Periodic background poller
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      silentCheckAndSync('interval_active');
    }
  }, intervalMs);

  // Background tab poller (less frequent to conserve mobile battery: every 24s)
  setInterval(() => {
    if (document.visibilityState !== 'visible') {
      silentCheckAndSync('interval_background');
    }
  }, intervalMs * 4);

  // 5. Listen for explicit cloud delete requests
  window.addEventListener('ifspl:request_cloud_delete_site', (e) => {
    if (e.detail?.siteId) {
      deleteSiteFromSupabase(e.detail.siteId);
    }
  });

  window.addEventListener('ifspl:request_cloud_clear_all', () => {
    clearSupabaseClientData();
  });

  // Initial silent check on application launch
  setTimeout(() => {
    silentCheckAndSync('initial_launch');
  }, 1200);
}


