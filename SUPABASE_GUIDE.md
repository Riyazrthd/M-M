# Indus Fire Safety Private Limited (IFSPL) — Supabase Cloud Database & Backup Guide

This document explains how your Digital AMC System connects to **Supabase** (PostgreSQL 14+) so that all client profiles, equipment asset positions, QR codes, checklist SOP mappings, and inspection histories are backed up and saved safely in the cloud.

---

## 1. What Has Been Created

1. **`supabase_schema_backup.sql`** (in project root):
   - A complete PostgreSQL / Supabase script (~52 KB) containing:
     - DDL schemas for all 7 application tables.
     - Row Level Security (RLS) policies allowing secure anon/authenticated app access.
     - Performance indexes on QR codes, site IDs, equipment types, and visits.
     - Full `INSERT ... ON CONFLICT` seed data for all 4 industrial client facilities, 20 equipment types with linked capacities, 3 plant technicians, and 17 permanent asset positions with active units.

2. **Supabase Cloud Service Engine (`src/services/supabaseBackup.js`)**:
   - `generateSupabaseSQLBackup()`: Generates an up-to-the-minute `.sql` backup file including any new assets or inspections registered during runtime.
   - `downloadSQLBackupFile()`: One-click browser download of timestamped `.sql` backups.
   - `downloadJSONBackupFile()`: One-click browser download of structured `.json` data.
   - `testSupabaseConnection()`: Probes your Supabase cloud REST endpoint.
   - `pushDataToSupabase()`: Directly uploads and merges local data to Supabase cloud tables.
   - `pullDataFromSupabase()`: Restores local storage from Supabase cloud tables.

3. **In-App Cloud Backup Modal (`src/components/SupabaseBackupModal.jsx`)**:
   - Accessible via **"Cloud / Supabase"** button in the left sidebar footer and the top navigation bar.
   - Allows one-click downloading, connection testing, pushing to cloud, and copying the SQL script.

4. **Manager Dashboard Quick Backup**:
   - A dedicated **"Supabase Backup (.sql)"** button directly on the Executive Dashboard header.

---

## 2. Quick Setup: Cloud Deployment in 3 Steps (Free Tier)

### Step 1: Create Your Supabase Project
1. Visit **[supabase.com](https://supabase.com)** and sign in (free plan includes 500 MB database, unlimited API requests).
2. Click **"New Project"**.
3. Enter:
   - **Name**: `ifspl-digital-amc` (or your preferred name)
   - **Database Password**: Choose a strong password and save it
   - **Region**: Choose closest region (e.g. `ap-south-1` Mumbai)
4. Click **Create new project** (takes ~1 minute to spin up).

---

### Step 2: Run the SQL Backup Script
1. In your Supabase Project dashboard, click **SQL Editor** (icon `>_` on the left menu).
2. Click **"+ New query"**.
3. Open `supabase_schema_backup.sql` from this repository (or click **"Copy Full SQL Script"** inside the app's Cloud modal).
4. Paste the entire SQL script into the editor.
5. Click **Run** (green button at the bottom right).
6. Result: All 7 tables will be created with primary keys, indexes, and full baseline seed data in under 5 seconds!

---

### Step 3: Connect the App for Live Cloud Sync
1. In your Supabase Dashboard, go to **Project Settings** (gear icon) → **API**.
2. Copy two values:
   - **Project URL** (e.g. `https://xyzabcdefghijklm.supabase.co`)
   - **Project API Keys** → `anon` `public` key (e.g. `eyJhbGciOiJIUzI1NiIsIn...`)
3. Open the IFSPL application in your browser (`http://localhost:5173`).
4. Click **"Cloud Backup"** in the top navigation bar or **"Cloud / Supabase"** in the sidebar.
5. Go to the **"Live Cloud Sync"** tab.
6. Paste your **Project URL** and **Anon Key**, then click **"Save Credentials"**.
7. Click **"Test Connection"** → You will see:
   `✓ Successfully connected to Supabase cloud!`
8. Click **"Save / Backup Local Data to Cloud"** → All local records will sync to Supabase!

---

## 3. Database Schema Overview

| Table Name | Description | Key Fields |
|---|---|---|
| `public.sites` | Client sites & AMC contracts | `id`, `client_name`, `plant_facility`, `po_number`, `po_date`, `amc_type`, `no_of_visits`, `amc_expiry_date`, `tax_id` |
| `public.equipment_master` | Equipment & Linked Services | `id`, `equipment_type`, `category`, `target_service`, `default_capacity`, `capacities` (JSONB) |
| `public.template_mappings` | Category & Service to SOP links | `id`, `category`, `service_type`, `template_id`, `service_label` |
| `public.plant_technicians` | On-site technicians roster | `id`, `name`, `badge`, `role_title`, `is_active` |
| `public.positions` | Permanent QR equipment positions | `position_id`, `qr_code`, `site_id`, `area`, `location`, `equipment_type`, `capacity`, `current_equipment` (JSONB), `history` (JSONB) |
| `public.visits` | AMC inspection records & signatures | `visit_id`, `site_id`, `date`, `technician_name`, `technician_badge`, `checklist_answers` (JSONB), `technician_signature`, `client_signature` |
| `public.audit_sync_queue` | Offline queue & sync audit log | `id`, `action_type`, `payload` (JSONB), `status`, `created_at` |

---

## 4. Key Architectural Safeguards Maintained

- **Permanent QR Position Immutability**: Just like in the offline app, the `positions` table retains `qr_code` and `position_id` as unique, immutable identifiers. When cylinders are swapped for hydro pressure testing, the position retains its QR code while the cylinder replacement history is appended to `history` JSONB.
- **Auto-Linked Capacities**: The `equipment_master` table preserves linked capacity arrays (e.g. `["9 Ltr (Standard)", "6 Ltr", "50 Ltr"]`).
- **No Financial Data**: Strictly zero monetary numbers or currency fields are included in any table or SQL statement.
- **Row Level Security (RLS)**: Pre-configured with permissive policies so standard Supabase anon keys work seamlessly in single-tenant or field technician environments.
