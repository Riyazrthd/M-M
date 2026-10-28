-- ============================================================================
-- INDUS FIRE SAFETY PRIVATE LIMITED — DIGITAL AMC SYSTEM
-- CLOUD DATABASE BACKUP & SUPABASE REPLICATION SCHEMA
-- Generated: 2026-10-27T04:48:52.415Z
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
    service_engineer VARCHAR(128),
    technician_name VARCHAR(128),
    technician_badge VARCHAR(64),
    technician_role VARCHAR(128),
    supervisor VARCHAR(128),
    client_representative VARCHAR(128),
    status VARCHAR(64) DEFAULT 'In Progress',
    checklist_answers JSONB DEFAULT '{}'::jsonb,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_sites_code ON public.sites(code);
CREATE INDEX IF NOT EXISTS idx_positions_qr_code ON public.positions(qr_code);
CREATE INDEX IF NOT EXISTS idx_positions_site_id ON public.positions(site_id);
CREATE INDEX IF NOT EXISTS idx_positions_equipment_type ON public.positions(equipment_type);
CREATE INDEX IF NOT EXISTS idx_visits_site_id ON public.visits(site_id);
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

-- Backing up 4 Sites
INSERT INTO public.sites (
  id, client_name, name, company, plant_facility, code, address, city, 
  po_number, po_date, amc_type, frequency, no_of_visits, amc_expiry_date, 
  work_order_ref, contract_period, client_contact, contact_phone, email, 
  tax_id, total_positions, inspected_positions, status, scheduled_date, applicable_checklists
) VALUES (
  'SITE-AIL-001', 'Campus Store Co.', 'Campus Store Co.', 'Campus Store Co.', 
  'Aarti Industries Ltd — Unit IV', 'AIL-U4', 'Plot 2201/2202, Jhagadia GIDC Industrial Estate, Bharuch, Gujarat 393110', 'Jhagadia / Bharuch', 
  'PO/AIL/AMC/2026/8812', '2026-04-01', 'Quarterly', 'Quarterly', 
  4, '2027-03-31', 'WO-IFSPL-2026-OCT-094', '01-Apr-2026 to 31-Mar-2027', 
  'Aditi Sharma', '+91 98201 55667', 'aditi@campusstore.demo', '24AAACA1234F1Z5', 
  6, 2, 'In Progress', 
  '2026-10-26', '["CL-11","CL-03"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  client_name = EXCLUDED.client_name,
  po_number = EXCLUDED.po_number,
  po_date = EXCLUDED.po_date,
  amc_type = EXCLUDED.amc_type,
  no_of_visits = EXCLUDED.no_of_visits,
  amc_expiry_date = EXCLUDED.amc_expiry_date,
  updated_at = NOW();

INSERT INTO public.sites (
  id, client_name, name, company, plant_facility, code, address, city, 
  po_number, po_date, amc_type, frequency, no_of_visits, amc_expiry_date, 
  work_order_ref, contract_period, client_contact, contact_phone, email, 
  tax_id, total_positions, inspected_positions, status, scheduled_date, applicable_checklists
) VALUES (
  'SITE-ATL-002', 'Zaraka Lifestyle', 'Zaraka Lifestyle', 'Zaraka Lifestyle', 
  'Atul Limited — Complex 2', 'ATL-C2', 'Post Atul 396020, Dist Valsad, Gujarat, India', 'Valsad / Atul', 
  'PO/ATL/SAFE/2026/4401', '2026-01-01', 'Monthly', 'Monthly', 
  12, '2026-12-31', 'WO-IFSPL-2026-SEP-082', '01-Jan-2026 to 31-Dec-2026', 
  'Kavita Rao', '+91 99102 44556', 'buying@zaraka.demo', '24AABCA5678G2Z3', 
  4, 4, 'Completed', 
  '2026-10-18', '["CL-11","CL-03"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  client_name = EXCLUDED.client_name,
  po_number = EXCLUDED.po_number,
  po_date = EXCLUDED.po_date,
  amc_type = EXCLUDED.amc_type,
  no_of_visits = EXCLUDED.no_of_visits,
  amc_expiry_date = EXCLUDED.amc_expiry_date,
  updated_at = NOW();

INSERT INTO public.sites (
  id, client_name, name, company, plant_facility, code, address, city, 
  po_number, po_date, amc_type, frequency, no_of_visits, amc_expiry_date, 
  work_order_ref, contract_period, client_contact, contact_phone, email, 
  tax_id, total_positions, inspected_positions, status, scheduled_date, applicable_checklists
) VALUES (
  'SITE-DNL-003', 'UrbanThread Apparel Pvt. Ltd.', 'UrbanThread Apparel Pvt. Ltd.', 'UrbanThread Apparel Pvt. Ltd.', 
  'Deepak Nitrite Ltd — Nandesari', 'DNL-NDS', '4/12 GIDC Chemical Complex, Nandesari, Vadodara, Gujarat 391340', 'Vadodara', 
  'PO/DNL/FIRE/2026/1932', '2026-07-01', 'Quarterly', 'Quarterly', 
  4, '2027-06-30', 'WO-IFSPL-2026-OCT-102', '01-Jul-2026 to 30-Jun-2027', 
  'Rohan Varma', '+91 98200 11223', 'rohan@urbanthread.demo', '24AACCA9012H3Z1', 
  4, 1, 'In Progress', 
  '2026-10-27', '["CL-11","CL-03"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  client_name = EXCLUDED.client_name,
  po_number = EXCLUDED.po_number,
  po_date = EXCLUDED.po_date,
  amc_type = EXCLUDED.amc_type,
  no_of_visits = EXCLUDED.no_of_visits,
  amc_expiry_date = EXCLUDED.amc_expiry_date,
  updated_at = NOW();

INSERT INTO public.sites (
  id, client_name, name, company, plant_facility, code, address, city, 
  po_number, po_date, amc_type, frequency, no_of_visits, amc_expiry_date, 
  work_order_ref, contract_period, client_contact, contact_phone, email, 
  tax_id, total_positions, inspected_positions, status, scheduled_date, applicable_checklists
) VALUES (
  'SITE-LT-004', 'Metro Exports House', 'Metro Exports House', 'Metro Exports House', 
  'L&T Heavy Engineering — Hazira', 'LT-HZR', 'Surat-Hazira Road, Hazira Manufacturing Complex, Surat 394510', 'Surat', 
  'PO/LT/ENGG/2026/7741', '2026-10-01', 'Half-Yearly', 'Half-Yearly', 
  2, '2027-09-30', 'WO-IFSPL-2026-NOV-001', '01-Oct-2026 to 30-Sep-2027', 
  'Deepak Chawla', '+91 97654 33221', 'orders@metroexports.demo', '24AADCA3456J4Z9', 
  3, 0, 'Scheduled', 
  '2026-11-04', '["CL-11","CL-03"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  client_name = EXCLUDED.client_name,
  po_number = EXCLUDED.po_number,
  po_date = EXCLUDED.po_date,
  amc_type = EXCLUDED.amc_type,
  no_of_visits = EXCLUDED.no_of_visits,
  amc_expiry_date = EXCLUDED.amc_expiry_date,
  updated_at = NOW();

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

-- Backing up 17 Permanent Equipment Positions
INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-AIL-001', 'POS-AIL-001', 'QR-POS-AIL-001', 'SITE-AIL-001', 
  'Plant 1 — Reaction Bay (Ground Floor)', 'Adjacent to Column C-4, West Fire Corridor', NULL, 
  'Fire Extinguisher', '6 Kg', 
  NULL, 'CL-11', 'EXT-CYL-8821', 
  '{"id":"EXT-CYL-8821","serialNo":"IFS-2022-DCP-8821","type":"ABC Dry Chemical Powder (Stored Pressure)","capacity":"6 Kg","make":"Indus SafeGuard (IS 15683)","mfgDate":"2022-03","lastHydroTestDate":"2025-03-12","nextHydroTestDue":"2028-03-12","testPressureBar":35,"operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Inspected - OK', '2026-10-26', 
  NULL, NULL, NULL, 
  '[{"timestamp":"2025-03-12 11:30","event":"Cylinder Replacement for Statutory Hydro Testing","reason":"Scheduled 3-year hydraulic pressure testing (IS 2190)","removedCylinder":{"id":"EXT-CYL-5120","serialNo":"IFS-2019-DCP-5120","status":"Sent to IFS Hydro Testing Facility Vadodara","testResult":"Passed 35 Bar / 3 Mins, Re-certified"},"replacementCylinder":{"id":"EXT-CYL-8821","serialNo":"IFS-2022-DCP-8821","status":"Mounted at Position POS-AIL-001"},"technician":"Ramesh Patel","notes":"Permanent QR code QR-POS-AIL-001 retained. Cylinder updated in asset master."}]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-AIL-002', 'POS-AIL-002', 'QR-POS-AIL-002', 'SITE-AIL-001', 
  'Plant 1 — Solvent Distillation Unit', 'Emergency Staircase Landing 1st Floor', NULL, 
  'Fire Extinguisher', '9 Litre', 
  NULL, 'CL-11', 'EXT-CYL-9044', 
  '{"id":"EXT-CYL-9044","serialNo":"IFS-2023-FOAM-9044","type":"Mechanical Foam (AFFF Stored Pressure)","capacity":"9 Litre","make":"Indus SafeGuard (IS 15683)","mfgDate":"2023-01","lastHydroTestDate":"2023-01-20","nextHydroTestDue":"2026-11-20","testPressureBar":35,"operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Pending Today', NULL, 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-AIL-003', 'POS-AIL-003', 'QR-POS-AIL-003', 'SITE-AIL-001', 
  'Tank Farm — Storage Sphere 01', 'Hydrant Post HP-04 North Perimeter', NULL, 
  'Delivery Hose Box', NULL, 
  NULL, 'CL-03', 'HB-AIL-04', 
  '{"id":"HB-AIL-04","serialNo":"HB-2021-LDPE-04","type":"Delivery Hose Box (Double Door)","material":"LDPE Weatherproof UV Stabilized","finish":"Fire Red exterior (IS 5 Shade 536), Interior White","hoses":"2 Nos. 15m Type B (63mm instantaneous coupling)","branchPipe":"1 No. 63mm Stainless Steel with 16mm nozzle","mounting":"Fabricated Heavy Angle Ground Stand","operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Inspected - Attention', '2026-10-26', 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-AIL-004', 'POS-AIL-004', 'QR-POS-AIL-004', 'SITE-AIL-001', 
  'Warehouse & Raw Material Bay', 'Truck Unloading Dock No. 2', NULL, 
  'Delivery Hose Box', NULL, 
  NULL, 'CL-03', 'HB-AIL-09', 
  '{"id":"HB-AIL-09","serialNo":"HB-2022-LDPE-09","type":"Delivery Hose Box (Double Door)","material":"LDPE Weatherproof UV Stabilized","finish":"Fire Red exterior (IS 5 Shade 536), Interior White","hoses":"2 Nos. 15m Type B (63mm instantaneous coupling)","branchPipe":"1 No. 63mm Gunmetal branch pipe","mounting":"Wall Bracket Fixed","operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Pending Today', NULL, 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-AIL-005', 'POS-AIL-005', 'QR-POS-AIL-005', 'SITE-AIL-001', 
  'Main Control Room & Server Hall', 'Server Room Entrance Vestibule', NULL, 
  'Fire Extinguisher', '4.5 Kg', 
  NULL, 'CL-11', 'EXT-CYL-7714', 
  '{"id":"EXT-CYL-7714","serialNo":"IFS-2021-CO2-7714","type":"CO2 Gas Fire Extinguisher","capacity":"4.5 Kg","make":"Indus SafeGuard (IS 15683)","mfgDate":"2021-08","lastHydroTestDate":"2021-08-15","nextHydroTestDue":"2026-08-15","testPressureBar":250,"operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Pending Today', NULL, 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-AIL-006', 'POS-AIL-006', 'QR-POS-AIL-HB-03', 'SITE-AIL-001', 
  'Administration & Canteen Block', 'Main Reception Corridor West', NULL, 
  'Delivery Hose Box', NULL, 
  NULL, 'CL-03', 'HB-AIL-12', 
  '{"id":"HB-AIL-12","serialNo":"HB-2023-LDPE-12","type":"Delivery Hose Box (Double Door)","material":"LDPE Weatherproof UV Stabilized","finish":"Fire Red exterior (IS 5 Shade 536), Interior White","hoses":"2 Nos. 15m Type B (63mm instantaneous coupling)","branchPipe":"1 No. 63mm Gunmetal branch pipe","mounting":"Wall Bracket Fixed","operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Pending Today', NULL, 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-ATL-001', 'POS-ATL-001', 'QR-POS-ATL-001', 'SITE-ATL-002', 
  'Plant 2 — Solvent Recovery', 'Distillation Column D-02 Base', NULL, 
  'Fire Extinguisher', '6 Kg', 
  NULL, 'CL-11', 'EXT-ATL-1102', 
  '{"id":"EXT-ATL-1102","serialNo":"IFS-2023-DCP-1102","type":"ABC Dry Chemical Powder (Stored Pressure)","capacity":"6 Kg","make":"Indus SafeGuard (IS 15683)","mfgDate":"2023-04","lastHydroTestDate":"2026-04-10","nextHydroTestDue":"2029-04-10","testPressureBar":35,"operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Inspected - OK', '2026-10-18', 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-ATL-002', 'POS-ATL-002', 'QR-POS-ATL-002', 'SITE-ATL-002', 
  'Hydrant Yard', 'Yard Hydrant Post HP-08', NULL, 
  'Delivery Hose Box', NULL, 
  NULL, 'CL-03', 'HB-ATL-03', 
  '{"id":"HB-ATL-03","serialNo":"HB-2022-LDPE-03","type":"Delivery Hose Box (Double Door)","material":"LDPE Weatherproof UV Stabilized","finish":"Fire Red exterior (IS 5 Shade 536), Interior White","hoses":"2 Nos. 15m Type B (63mm instantaneous coupling)","branchPipe":"1 No. 63mm Stainless Steel with 16mm nozzle","mounting":"Ground Stand","operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Inspected - OK', '2026-10-18', 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-ATL-003', 'POS-ATL-003', 'QR-POS-ATL-003', 'SITE-ATL-002', 
  'Transformer Yard', 'Main Step-Up Substation Fence', NULL, 
  'Fire Extinguisher', '4.5 Kg', 
  NULL, 'CL-11', 'EXT-ATL-3011', 
  '{"id":"EXT-ATL-3011","serialNo":"IFS-2022-CO2-3011","type":"CO2 Gas Fire Extinguisher","capacity":"4.5 Kg","make":"Indus SafeGuard (IS 15683)","mfgDate":"2022-01","lastHydroTestDate":"2022-01-15","nextHydroTestDue":"2027-01-15","testPressureBar":250,"operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Inspected - OK', '2026-10-18', 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-ATL-004', 'POS-ATL-004', 'QR-POS-ATL-004', 'SITE-ATL-002', 
  'Finished Goods Warehouse', 'Bay 3 Exit Gate', NULL, 
  'Delivery Hose Box', NULL, 
  NULL, 'CL-03', 'HB-ATL-07', 
  '{"id":"HB-ATL-07","serialNo":"HB-2023-LDPE-07","type":"Delivery Hose Box (Double Door)","material":"LDPE Weatherproof UV Stabilized","finish":"Fire Red exterior (IS 5 Shade 536), Interior White","hoses":"2 Nos. 15m Type B (63mm instantaneous coupling)","branchPipe":"1 No. 63mm Gunmetal branch pipe","mounting":"Wall Bracket","operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Inspected - OK', '2026-10-18', 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-DNL-001', 'POS-DNL-001', 'QR-POS-DNL-001', 'SITE-DNL-003', 
  'Nitration Plant Ground Floor', 'Reactor R-101 North Walkway', NULL, 
  'Fire Extinguisher', '9 Litre', 
  NULL, 'CL-11', 'EXT-DNL-4019', 
  '{"id":"EXT-DNL-4019","serialNo":"IFS-2023-FOAM-4019","type":"Mechanical Foam (AFFF Stored Pressure)","capacity":"9 Litre","make":"Indus SafeGuard (IS 15683)","mfgDate":"2023-05","lastHydroTestDate":"2023-05-20","nextHydroTestDue":"2026-12-20","testPressureBar":35,"operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Inspected - OK', '2026-10-27', 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-DNL-002', 'POS-DNL-002', 'QR-POS-DNL-002', 'SITE-DNL-003', 
  'Boiler House', 'Near Feed Water Pump Station', NULL, 
  'Delivery Hose Box', NULL, 
  NULL, 'CL-03', 'HB-DNL-01', 
  '{"id":"HB-DNL-01","serialNo":"HB-2022-LDPE-01","type":"Delivery Hose Box (Double Door)","material":"LDPE Weatherproof UV Stabilized","finish":"Fire Red exterior (IS 5 Shade 536), Interior White","hoses":"2 Nos. 15m Type B (63mm instantaneous coupling)","branchPipe":"1 No. 63mm Stainless Steel","mounting":"Fabricated Stand","operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Pending Today', NULL, 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-DNL-003', 'POS-DNL-003', 'QR-POS-DNL-003', 'SITE-DNL-003', 
  'Central Control Room', 'Main Entrance Foyer', NULL, 
  'Fire Extinguisher', '4.5 Kg', 
  NULL, 'CL-11', 'EXT-DNL-2088', 
  '{"id":"EXT-DNL-2088","serialNo":"IFS-2022-CO2-2088","type":"CO2 Gas Fire Extinguisher","capacity":"4.5 Kg","make":"Indus SafeGuard (IS 15683)","mfgDate":"2022-07","lastHydroTestDate":"2022-07-15","nextHydroTestDue":"2027-07-15","testPressureBar":250,"operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Pending Today', NULL, 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-DNL-004', 'POS-DNL-004', 'QR-POS-DNL-004', 'SITE-DNL-003', 
  'Tank Farm Dike Area', 'Hydrant Post HP-02', NULL, 
  'Delivery Hose Box', NULL, 
  NULL, 'CL-03', 'HB-DNL-05', 
  '{"id":"HB-DNL-05","serialNo":"HB-2023-LDPE-05","type":"Delivery Hose Box (Double Door)","material":"LDPE Weatherproof UV Stabilized","finish":"Fire Red exterior (IS 5 Shade 536), Interior White","hoses":"2 Nos. 15m Type B (63mm instantaneous coupling)","branchPipe":"1 No. 63mm Gunmetal branch pipe","mounting":"Wall Fixed","operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Pending Today', NULL, 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-LT-001', 'POS-LT-001', 'QR-POS-LT-001', 'SITE-LT-004', 
  'Heavy Fabrication Bay 1', 'Column F-12 East Craneway', NULL, 
  'Fire Extinguisher', '9 Kg', 
  NULL, 'CL-11', 'EXT-LT-9901', 
  '{"id":"EXT-LT-9901","serialNo":"IFS-2023-DCP-9901","type":"ABC Dry Chemical Powder (Stored Pressure)","capacity":"9 Kg","make":"Indus SafeGuard (IS 15683)","mfgDate":"2023-09","lastHydroTestDate":"2023-09-10","nextHydroTestDue":"2026-09-10","testPressureBar":35,"operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Pending Inspection', NULL, 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-LT-002', 'POS-LT-002', 'QR-POS-LT-002', 'SITE-LT-004', 
  'Hazira Jetty Loading Area', 'Barge Docking Post 01', NULL, 
  'Delivery Hose Box', NULL, 
  NULL, 'CL-03', 'HB-LT-01', 
  '{"id":"HB-LT-01","serialNo":"HB-2022-LDPE-01","type":"Delivery Hose Box (Double Door)","material":"LDPE Weatherproof UV Stabilized","finish":"Fire Red exterior (IS 5 Shade 536), Interior White","hoses":"2 Nos. 15m Type B (63mm instantaneous coupling)","branchPipe":"1 No. 63mm Stainless Steel","mounting":"Fabricated Stand","operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Pending Inspection', NULL, 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

INSERT INTO public.positions (
  id, position_id, qr_code, site_id, area, location, equipment_category, 
  equipment_type, capacity, service_type, template_id, current_equipment_id, 
  current_equipment, applicable_checklist_mapping, inspection_status, 
  last_inspection_date, last_inspection_time, technician_name, technician_badge, 
  history, inspection_history, notes, status
) VALUES (
  'POS-LT-003', 'POS-LT-003', 'QR-POS-LT-003', 'SITE-LT-004', 
  'Special Pressure Vessel Workshop', 'Welding Booth Cluster B', NULL, 
  'Fire Extinguisher', '4.5 Kg', 
  NULL, 'CL-11', 'EXT-LT-9904', 
  '{"id":"EXT-LT-9904","serialNo":"IFS-2022-CO2-9904","type":"CO2 Gas Fire Extinguisher","capacity":"4.5 Kg","make":"Indus SafeGuard (IS 15683)","mfgDate":"2022-03","lastHydroTestDate":"2022-03-15","nextHydroTestDue":"2027-03-15","testPressureBar":250,"operationalStatus":"Active in Position"}'::jsonb, NULL, 
  'Pending Inspection', NULL, 
  NULL, NULL, NULL, 
  '[]'::jsonb, '[]'::jsonb, '', 
  'Active'
) ON CONFLICT (position_id) DO UPDATE SET 
  inspection_status = EXCLUDED.inspection_status,
  last_inspection_date = EXCLUDED.last_inspection_date,
  current_equipment = EXCLUDED.current_equipment,
  history = EXCLUDED.history,
  inspection_history = EXCLUDED.inspection_history,
  updated_at = NOW();

-- Backing up 1 AMC Visits
INSERT INTO public.visits (
  id, visit_id, site_id, date, service_engineer, technician_name, technician_badge, 
  technician_role, supervisor, client_representative, status, checklist_answers, 
  visit_remarks, spares_replaced, pending_points, technician_signature, client_signature, completed_at
) VALUES (
  'VISIT-2026-10-AIL-01', 'VISIT-2026-10-AIL-01', 'SITE-AIL-001', '2026-10-26', 
  'Ramesh Patel', 'Ramesh Patel', 
  NULL, NULL, 'Sanjay Sharma', 
  'Vikram Shah', 'In Progress', '{"POS-AIL-001":{"templateId":"CL-11","timestamp":"2026-10-26 09:45","items":{"1":{"status":"OK","reason":"","photo":null},"2":{"status":"OK","reason":"","photo":null},"3":{"status":"OK","reason":"","photo":null},"4":{"status":"OK","reason":"","photo":null},"5":{"status":"OK","reason":"","photo":null},"6":{"status":"OK","reason":"","photo":null},"7":{"status":"NA","reason":"Stored pressure unit - dry nitrogen already sealed","photo":null},"8":{"status":"OK","reason":"","photo":null},"9":{"status":"OK","reason":"","photo":null}},"remarks":"Hydraulic pressure verified at 35 Bar for 3 mins. No leakage, no deformation. Pressure gauge calibrated.","photos":[]},"POS-AIL-003":{"templateId":"CL-03","timestamp":"2026-10-26 10:15","items":{"1":{"status":"OK","reason":"","photo":null},"2":{"status":"NOT_OK","reason":"Weather rubber beading loose on left door frame edge","photo":"data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' width=''200'' height=''150''><rect width=''200'' height=''150'' fill=''%23fee2e2''/><text x=''15'' y=''80'' fill=''%23dc2626'' font-size=''14'' font-family=''sans-serif''>Beading Defect Evidence</text></svg>"},"3":{"status":"OK","reason":"","photo":null},"4":{"status":"OK","reason":"","photo":null},"5":{"status":"OK","reason":"","photo":null},"6":{"status":"OK","reason":"","photo":null},"7":{"status":"OK","reason":"","photo":null},"8":{"status":"OK","reason":"","photo":null}},"remarks":"Rubber beading loose on left door frame edge. Scheduled for replacement during afternoon round.","photos":[{"id":"photo-01","url":"data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' width=''200'' height=''150''><rect width=''200'' height=''150'' fill=''%23fee2e2''/><text x=''15'' y=''80'' fill=''%23dc2626'' font-size=''14'' font-family=''sans-serif''>Beading Defect Evidence</text></svg>","label":"Hose Box door beading damage","timestamp":"2026-10-26 10:18"}]}}'::jsonb, 
  'Quarterly AMC inspection underway. Extinguishers in Reaction Bay tested in accordance with IS 2190. Tank farm hose box minor rubber beading attended.', 'Rubber beading (1.5m), 1 No. Break glass key chain', 'Replacement of cylinder EXT-CYL-5120 lot certificate to be attached upon lab receipt.', 
  NULL, NULL, NULL
) ON CONFLICT (visit_id) DO UPDATE SET 
  status = EXCLUDED.status,
  checklist_answers = EXCLUDED.checklist_answers,
  visit_remarks = EXCLUDED.visit_remarks,
  technician_signature = EXCLUDED.technician_signature,
  client_signature = EXCLUDED.client_signature,
  updated_at = NOW();

-- ============================================================================
-- BACKUP COMPLETE
-- Total Sites: 4
-- Total Equipment Master Types: 20
-- Total Positions (QR tags): 17
-- Total Visits: 1
-- ============================================================================
