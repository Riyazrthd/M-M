// Generate updated Supabase SQL schema & backup script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Set up localStorage mock for node
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

const atobPolyfill = (str) => Buffer.from(str, 'base64').toString('binary');
const btoaPolyfill = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = global.atob || atobPolyfill;
global.btoa = global.btoa || btoaPolyfill;
global.window = { dispatchEvent() {} };

const { initStorage } = await import('../src/data/storage.js');
const { generateSupabaseSQLBackup } = await import('../src/services/supabaseBackup.js');

// Initialize storage with production/clean baseline
initStorage(false);

const sqlContent = generateSupabaseSQLBackup();
const outputPath = path.join(rootDir, 'supabase_schema.sql');

fs.writeFileSync(outputPath, sqlContent, 'utf-8');
console.log(`[Supabase SQL] Successfully generated: ${outputPath} (${(sqlContent.length / 1024).toFixed(1)} KB)`);
