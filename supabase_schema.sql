-- ============================================================================
-- INDUS FIRE SAFETY PRIVATE LIMITED — DIGITAL AMC SYSTEM
-- CLOUD DATABASE BACKUP & SUPABASE REPLICATION SCHEMA
-- Generated: 2026-10-29T04:17:37.423Z
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

-- Backing up 0 Sites
-- Backing up 20 Equipment Master items
INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-EXT-001', 'Water CO2 Fire Extinguisher', 'Fire Extinguisher', 
  'Hydro Testing & Pressurisation', '9 Ltr', '["9 Ltr","6 Ltr","50 Ltr (Trolley)"]'::jsonb, 
  '[{"id":"SRV-WCO2-HPT","serviceType":"Hydro Testing & Pressurisation","checklistTemplateId":"CL-11","isDefault":true},{"id":"SRV-WCO2-OVERHAUL","serviceType":"Water Discharge & Cylinder Overhaul","checklistTemplateId":"CL-11","isDefault":false},{"id":"SRV-WCO2-ROUTINE","serviceType":"Routine Servicing / Inspection","checklistTemplateId":"CL-26","isDefault":false}]'::jsonb, 'CL-11'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-EXT-002', 'ABC Dry Chemical Powder (Stored Pressure)', 'Fire Extinguisher', 
  'Hydro Testing & Pressurisation', '6 Kg', '["6 Kg","4 Kg","9 Kg","2 Kg","1 Kg","50 Kg (Trolley)","75 Kg (Trolley)"]'::jsonb, 
  '[{"id":"SRV-ABC-HPT","serviceType":"Hydro Testing & Pressurisation","checklistTemplateId":"CL-11","isDefault":true},{"id":"SRV-ABC-REFILL","serviceType":"Annual Refilling & Recharging","checklistTemplateId":"CL-11","isDefault":false},{"id":"SRV-ABC-ROUTINE","serviceType":"Routine Servicing / Inspection","checklistTemplateId":"CL-26","isDefault":false}]'::jsonb, 'CL-11'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-EXT-003', 'ABC Dry Chemical Powder (Cartridge Type)', 'Fire Extinguisher', 
  'Hydro Testing & Pressurisation', '6 Kg', '["6 Kg","9 Kg","4 Kg","50 Kg (Trolley)","75 Kg (Trolley)"]'::jsonb, 
  '[{"id":"SRV-ABCC-HPT","serviceType":"Hydro Testing & Pressurisation","checklistTemplateId":"CL-11","isDefault":true},{"id":"SRV-ABCC-REFILL","serviceType":"Annual Refilling & Recharging","checklistTemplateId":"CL-11","isDefault":false},{"id":"SRV-ABCC-ROUTINE","serviceType":"Routine Servicing / Inspection","checklistTemplateId":"CL-26","isDefault":false}]'::jsonb, 'CL-11'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-EXT-004', 'CO2 Gas Fire Extinguisher', 'Fire Extinguisher', 
  'Hydro Testing & Pressurisation', '4.5 Kg', '["4.5 Kg","2 Kg","3 Kg","6.5 Kg","9 Kg","22.5 Kg (Mobile)"]'::jsonb, 
  '[{"id":"SRV-CO2-HPT","serviceType":"Hydro Testing & Pressurisation","checklistTemplateId":"CL-11","isDefault":true},{"id":"SRV-CO2-REFILL","serviceType":"CO2 Gas Refilling & Weight Check","checklistTemplateId":"CL-11","isDefault":false},{"id":"SRV-CO2-ROUTINE","serviceType":"Routine Servicing / Inspection","checklistTemplateId":"CL-26","isDefault":false}]'::jsonb, 'CL-11'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-EXT-005', 'Mechanical Foam (AFFF Stored Pressure)', 'Fire Extinguisher', 
  'Hydro Testing & Pressurisation', '9 Ltr', '["9 Ltr","6 Ltr","50 Ltr (Trolley)"]'::jsonb, 
  '[{"id":"SRV-FOAM-HPT","serviceType":"Hydro Testing & Pressurisation","checklistTemplateId":"CL-11","isDefault":true},{"id":"SRV-FOAM-CHARGE","serviceType":"AFFF Foam Charge Replacement","checklistTemplateId":"CL-11","isDefault":false},{"id":"SRV-FOAM-ROUTINE","serviceType":"Routine Servicing / Inspection","checklistTemplateId":"CL-26","isDefault":false}]'::jsonb, 'CL-11'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-EXT-006', 'Clean Agent (HFC-236fa / FK-5-1-12)', 'Fire Extinguisher', 
  'Hydro Testing & Pressurisation', '4 Kg', '["4 Kg","2 Kg","6 Kg"]'::jsonb, 
  '[{"id":"SRV-CLEAN-HPT","serviceType":"Hydro Testing & Pressurisation","checklistTemplateId":"CL-11","isDefault":true},{"id":"SRV-CLEAN-VERIF","serviceType":"Clean Agent Pressure Verification","checklistTemplateId":"CL-26","isDefault":false},{"id":"SRV-CLEAN-ROUTINE","serviceType":"Routine Servicing / Inspection","checklistTemplateId":"CL-26","isDefault":false}]'::jsonb, 'CL-11'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-HB-001', 'Double Door LDPE Weatherproof Hose Box', 'Delivery Hose Box', 
  'Hose Box Servicing & Maintenance', '2 x 15m Hoses + Branch Pipe', '["2 x 15m Hoses + Branch Pipe","2 x 30m Hoses + Branch Pipe","1 x 15m Hose + Branch Pipe","15m x 63mm (Single Hose)"]'::jsonb, 
  '[{"id":"SRV-HB-MAINT-1","serviceType":"Hose Box Servicing & Maintenance","checklistTemplateId":"CL-03","isDefault":true},{"id":"SRV-HB-AUDIT-1","serviceType":"Annual Hose Box Physical Audit","checklistTemplateId":"CL-03","isDefault":false}]'::jsonb, 'CL-03'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-HB-002', 'Single Door MS Powder Coated Hose Box', 'Delivery Hose Box', 
  'Hose Box Servicing & Maintenance', '1 x 15m Hose + Branch Pipe', '["1 x 15m Hose + Branch Pipe","2 x 15m Hoses + Branch Pipe"]'::jsonb, 
  '[{"id":"SRV-HB-MAINT-2","serviceType":"Hose Box Servicing & Maintenance","checklistTemplateId":"CL-03","isDefault":true},{"id":"SRV-HB-AUDIT-2","serviceType":"Annual Hose Box Physical Audit","checklistTemplateId":"CL-03","isDefault":false}]'::jsonb, 'CL-03'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-HB-003', 'FRP Heavy Duty Industrial Hose Box', 'Delivery Hose Box', 
  'Hose Box Servicing & Maintenance', '2 x 15m Hoses + Branch Pipe', '["2 x 15m Hoses + Branch Pipe","2 x 30m Hoses + Branch Pipe"]'::jsonb, 
  '[{"id":"SRV-HB-MAINT-3","serviceType":"Hose Box Servicing & Maintenance","checklistTemplateId":"CL-03","isDefault":true},{"id":"SRV-HB-AUDIT-3","serviceType":"Annual Hose Box Physical Audit","checklistTemplateId":"CL-03","isDefault":false}]'::jsonb, 'CL-03'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-HR-001', 'Swinging Type 19mm Hose Reel', 'First Aid Hose Reel', 
  'Hose Reel Servicing & Drum Check', '30 Metre Length', '["30 Metre Length","36 Metre Length","40 Metre Length","19mm x 30m Drum"]'::jsonb, 
  '[{"id":"SRV-HR-MAINT-1","serviceType":"Hose Reel Servicing & Drum Check","checklistTemplateId":"CL-09","isDefault":true}]'::jsonb, 'CL-09'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-HR-002', 'Fixed Type 25mm Hose Reel', 'First Aid Hose Reel', 
  'Hose Reel Servicing & Drum Check', '30 Metre Length', '["30 Metre Length","36 Metre Length","25mm x 30m Drum"]'::jsonb, 
  '[{"id":"SRV-HR-MAINT-2","serviceType":"Hose Reel Servicing & Drum Check","checklistTemplateId":"CL-09","isDefault":true}]'::jsonb, 'CL-09'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-HYD-001', 'Single Outlet Landing Valve (IS 5290)', 'Hydrant System', 
  'Landing Valve & FB Inlet Overhaul', '63mm Female Instantaneous', '["63mm Female Instantaneous","75mm Flanged x 63mm Outlet","80mm Flanged x 63mm Outlet"]'::jsonb, 
  '[{"id":"SRV-HYD-MAINT-1","serviceType":"Landing Valve & FB Inlet Overhaul","checklistTemplateId":"CL-01","isDefault":true}]'::jsonb, 'CL-01'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-HYD-002', 'Double Outlet Landing Valve', 'Hydrant System', 
  'Landing Valve & FB Inlet Overhaul', '2 x 63mm Outlets', '["2 x 63mm Outlets","100mm Flanged x 2x 63mm Outlets"]'::jsonb, 
  '[{"id":"SRV-HYD-MAINT-2","serviceType":"Landing Valve & FB Inlet Overhaul","checklistTemplateId":"CL-01","isDefault":true}]'::jsonb, 'CL-01'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-HYD-003', '4-Way Fire Brigade Inlet Connection', 'Hydrant System', 
  'Landing Valve & FB Inlet Overhaul', '4 x 63mm Inlets to 150mm Header', '["4 x 63mm Inlets to 150mm Header","2 x 63mm Inlets to 100mm Header"]'::jsonb, 
  '[{"id":"SRV-HYD-MAINT-3","serviceType":"Landing Valve & FB Inlet Overhaul","checklistTemplateId":"CL-01","isDefault":true}]'::jsonb, 'CL-01'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-ALARM-001', 'Addressable Fire Alarm Control Panel', 'Fire Detection & Alarm System', 
  'Quarterly Detection & Sounder Testing', '4 Loop (500 Devices)', '["4 Loop (500 Devices)","2 Loop (250 Devices)","8 Loop (1000 Devices)","16 Loop (2000 Devices)"]'::jsonb, 
  '[{"id":"SRV-ALARM-MAINT-1","serviceType":"Quarterly Detection & Sounder Testing","checklistTemplateId":"CL-18","isDefault":true}]'::jsonb, 'CL-18'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-ALARM-002', 'Conventional 8-Zone Alarm Panel', 'Fire Detection & Alarm System', 
  'Quarterly Detection & Sounder Testing', '8 Zones', '["8 Zones","4 Zones","16 Zones","24 Zones"]'::jsonb, 
  '[{"id":"SRV-ALARM-MAINT-2","serviceType":"Quarterly Detection & Sounder Testing","checklistTemplateId":"CL-18","isDefault":true}]'::jsonb, 'CL-18'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-ALARM-003', 'Smoke & Heat Detector Loop', 'Fire Detection & Alarm System', 
  'Quarterly Detection & Sounder Testing', '30 Detectors Loop', '["30 Detectors Loop","60 Detectors Loop","120 Detectors Loop"]'::jsonb, 
  '[{"id":"SRV-ALARM-MAINT-3","serviceType":"Quarterly Detection & Sounder Testing","checklistTemplateId":"CL-18","isDefault":true}]'::jsonb, 'CL-18'
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-PUMP-001', 'Main Electric Fire Pump 2850 RPM', 'Fire Pumpset', 
  'Pump Flow & Cut-in Pressure Test', '2280 LPM @ 7.0 Bar', '["2280 LPM @ 7.0 Bar","2850 LPM @ 8.8 Bar","1620 LPM @ 5.6 Bar"]'::jsonb, 
  '[{"id":"SRV-PUMP-TEST-1","serviceType":"Pump Flow & Cut-in Pressure Test","checklistTemplateId":null,"isDefault":true}]'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-PUMP-002', 'Diesel Engine Standby Fire Pump', 'Fire Pumpset', 
  'Pump Flow & Cut-in Pressure Test', '2280 LPM @ 7.0 Bar', '["2280 LPM @ 7.0 Bar","2850 LPM @ 8.8 Bar","1620 LPM @ 5.6 Bar"]'::jsonb, 
  '[{"id":"SRV-PUMP-TEST-2","serviceType":"Pump Flow & Cut-in Pressure Test","checklistTemplateId":null,"isDefault":true}]'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

INSERT INTO public.equipment_master (
  id, equipment_type, category, target_service, default_capacity, capacities, linked_services, checklist_template_id
) VALUES (
  'EQ-PUMP-003', 'Jockey Pressure Maintenance Pump', 'Fire Pumpset', 
  'Pump Flow & Cut-in Pressure Test', '180 LPM @ 7.5 Bar', '["180 LPM @ 7.5 Bar","108 LPM @ 5.6 Bar","300 LPM @ 8.8 Bar"]'::jsonb, 
  '[{"id":"SRV-PUMP-TEST-3","serviceType":"Pump Flow & Cut-in Pressure Test","checklistTemplateId":null,"isDefault":true}]'::jsonb, NULL
) ON CONFLICT (id) DO UPDATE SET 
  target_service = EXCLUDED.target_service,
  capacities = EXCLUDED.capacities,
  linked_services = EXCLUDED.linked_services;

-- Backing up 8 Template Mappings
INSERT INTO public.template_mappings (
  id, category, service_type, template_id, service_label
) VALUES (
  'MAP-001', 'Fire Extinguisher', 'Hydro Testing & Pressurisation', 
  'CL-11', 'Mandatory IS 2190 statutory 35 Bar hydraulic pressure test (Section 6 Format)'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.template_mappings (
  id, category, service_type, template_id, service_label
) VALUES (
  'MAP-002', 'Fire Extinguisher', 'Annual Refilling & Recharging', 
  'CL-11', 'Powder / AFFF refilling, dry nitrogen pressurisation, and lot certificate'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.template_mappings (
  id, category, service_type, template_id, service_label
) VALUES (
  'MAP-003', 'Fire Extinguisher', 'Routine Servicing / Inspection', 
  'CL-26', 'Monthly / quarterly visual check of pressure gauge, seal, tag and mounting'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.template_mappings (
  id, category, service_type, template_id, service_label
) VALUES (
  'MAP-004', 'Delivery Hose Box', 'Hose Box Servicing & Maintenance', 
  'CL-03', 'IFSPL/M&M/CL/003 Front glass, rubber beading, hinges, 15m hoses, branch pipe'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.template_mappings (
  id, category, service_type, template_id, service_label
) VALUES (
  'MAP-005', 'Delivery Hose Box', 'Annual Hose Box Physical Audit', 
  'CL-03', 'IFSPL/M&M/CL/003 Annual structural mounting, paint, and accessories verification'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.template_mappings (
  id, category, service_type, template_id, service_label
) VALUES (
  'MAP-006', 'Hydrant System', 'Landing Valve & FB Inlet Overhaul', 
  'CL-01', 'IFSPL/M&M/CL/001 Hydrant valve gland packing, hydro leak test, lug cleaning'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.template_mappings (
  id, category, service_type, template_id, service_label
) VALUES (
  'MAP-007', 'First Aid Hose Reel', 'Hose Reel Servicing & Drum Check', 
  'CL-09', 'IFSPL/M&M/CL/009 Drum rotation, nozzle shutoff, 30m tubing pressure test'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.template_mappings (
  id, category, service_type, template_id, service_label
) VALUES (
  'MAP-008', 'Fire Detection & Alarm System', 'Quarterly Detection & Sounder Testing', 
  'CL-18', 'IFSPL/M&M/CL/018 Panel battery standby, aerosol smoke probe, manual call point'
) ON CONFLICT (id) DO NOTHING;

-- Backing up 3 Plant Technicians
INSERT INTO public.plant_technicians (
  id, name, badge, role_title, is_active
) VALUES (
  'tech-01', 'Ramesh Patel', 'IFS-SE-041', 
  'Lead Service Engineer', TRUE
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  badge = EXCLUDED.badge;

INSERT INTO public.plant_technicians (
  id, name, badge, role_title, is_active
) VALUES (
  'tech-02', 'Amit Trivedi', 'IFS-SE-042', 
  'Field Service Engineer', TRUE
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  badge = EXCLUDED.badge;

INSERT INTO public.plant_technicians (
  id, name, badge, role_title, is_active
) VALUES (
  'tech-03', 'Jignesh Solanki', 'IFS-TECH-019', 
  'Fire Safety Technician', TRUE
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  badge = EXCLUDED.badge;

-- Backing up 0 Permanent Equipment Positions
-- Backing up 0 AMC Visits
-- Backing up 50 Permanent QR Code Records
INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000001', 'IFS-QR-000001', 'SR. NO. 001', 
  1, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000002', 'IFS-QR-000002', 'SR. NO. 002', 
  2, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000003', 'IFS-QR-000003', 'SR. NO. 003', 
  3, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000004', 'IFS-QR-000004', 'SR. NO. 004', 
  4, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000005', 'IFS-QR-000005', 'SR. NO. 005', 
  5, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000006', 'IFS-QR-000006', 'SR. NO. 006', 
  6, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000007', 'IFS-QR-000007', 'SR. NO. 007', 
  7, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000008', 'IFS-QR-000008', 'SR. NO. 008', 
  8, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000009', 'IFS-QR-000009', 'SR. NO. 009', 
  9, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000010', 'IFS-QR-000010', 'SR. NO. 010', 
  10, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000011', 'IFS-QR-000011', 'SR. NO. 011', 
  11, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000012', 'IFS-QR-000012', 'SR. NO. 012', 
  12, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000013', 'IFS-QR-000013', 'SR. NO. 013', 
  13, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000014', 'IFS-QR-000014', 'SR. NO. 014', 
  14, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000015', 'IFS-QR-000015', 'SR. NO. 015', 
  15, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000016', 'IFS-QR-000016', 'SR. NO. 016', 
  16, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000017', 'IFS-QR-000017', 'SR. NO. 017', 
  17, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000018', 'IFS-QR-000018', 'SR. NO. 018', 
  18, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000019', 'IFS-QR-000019', 'SR. NO. 019', 
  19, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000020', 'IFS-QR-000020', 'SR. NO. 020', 
  20, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000021', 'IFS-QR-000021', 'SR. NO. 021', 
  21, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000022', 'IFS-QR-000022', 'SR. NO. 022', 
  22, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000023', 'IFS-QR-000023', 'SR. NO. 023', 
  23, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000024', 'IFS-QR-000024', 'SR. NO. 024', 
  24, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000025', 'IFS-QR-000025', 'SR. NO. 025', 
  25, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000026', 'IFS-QR-000026', 'SR. NO. 026', 
  26, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000027', 'IFS-QR-000027', 'SR. NO. 027', 
  27, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000028', 'IFS-QR-000028', 'SR. NO. 028', 
  28, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000029', 'IFS-QR-000029', 'SR. NO. 029', 
  29, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000030', 'IFS-QR-000030', 'SR. NO. 030', 
  30, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000031', 'IFS-QR-000031', 'SR. NO. 031', 
  31, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000032', 'IFS-QR-000032', 'SR. NO. 032', 
  32, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000033', 'IFS-QR-000033', 'SR. NO. 033', 
  33, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000034', 'IFS-QR-000034', 'SR. NO. 034', 
  34, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000035', 'IFS-QR-000035', 'SR. NO. 035', 
  35, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000036', 'IFS-QR-000036', 'SR. NO. 036', 
  36, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000037', 'IFS-QR-000037', 'SR. NO. 037', 
  37, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000038', 'IFS-QR-000038', 'SR. NO. 038', 
  38, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000039', 'IFS-QR-000039', 'SR. NO. 039', 
  39, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000040', 'IFS-QR-000040', 'SR. NO. 040', 
  40, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000041', 'IFS-QR-000041', 'SR. NO. 041', 
  41, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000042', 'IFS-QR-000042', 'SR. NO. 042', 
  42, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000043', 'IFS-QR-000043', 'SR. NO. 043', 
  43, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000044', 'IFS-QR-000044', 'SR. NO. 044', 
  44, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000045', 'IFS-QR-000045', 'SR. NO. 045', 
  45, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000046', 'IFS-QR-000046', 'SR. NO. 046', 
  46, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000047', 'IFS-QR-000047', 'SR. NO. 047', 
  47, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000048', 'IFS-QR-000048', 'SR. NO. 048', 
  48, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000049', 'IFS-QR-000049', 'SR. NO. 049', 
  49, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

INSERT INTO public.qr_registry (
  id, token, display_no, seq_number, batch_id, batch_label, 
  generated_date, generated_time, generated_at, generated_by, 
  assignment_status, linked_asset_id, linked_position_id, 
  linked_asset_name, assigned_date, assigned_by, lifecycle_status
) VALUES (
  'QR-REC-000050', 'IFS-QR-000050', 'SR. NO. 050', 
  50, 'BATCH-20261001-001', 'Batch BATCH-20261001-001 (50 Labels)', 
  '01/10/2026', '09:00:00 AM', 
  '2026-10-01T03:30:00.000Z', 
  'Ramesh Patel (Admin)', 
  'Available', 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  'Active'
) ON CONFLICT (token) DO UPDATE SET 
  assignment_status = EXCLUDED.assignment_status,
  linked_asset_id = EXCLUDED.linked_asset_id,
  linked_position_id = EXCLUDED.linked_position_id,
  linked_asset_name = EXCLUDED.linked_asset_name,
  assigned_date = EXCLUDED.assigned_date,
  assigned_by = EXCLUDED.assigned_by,
  lifecycle_status = EXCLUDED.lifecycle_status;

-- ============================================================================
-- BACKUP COMPLETE
-- Total Sites: 0
-- Total Equipment Master Types: 20
-- Total Positions (QR tags): 0
-- Total Visits: 0
-- Total Permanent QR Codes: 50
-- ============================================================================
