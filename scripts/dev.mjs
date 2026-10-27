import { execSync } from 'child_process';
import fs from 'fs';

console.log('[Dev] Restoring development template for Vite dev server...');
if (fs.existsSync('index.dev.html')) {
  fs.copyFileSync('index.dev.html', 'index.html');
}

console.log('[Dev] Starting Vite dev server...');
execSync('node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173', { stdio: 'inherit' });
