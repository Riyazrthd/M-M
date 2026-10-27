import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('[Build] Preparing dev template for Vite...');
if (fs.existsSync('index.dev.html')) {
  fs.copyFileSync('index.dev.html', 'index.html');
}

console.log('[Build] Running Vite production build...');
execSync('node node_modules/vite/bin/vite.js build', { stdio: 'inherit' });

const distPath = path.resolve('dist');
const docsPath = path.resolve('docs');
const rootAssetsPath = path.resolve('assets');

// 1. Ensure 404.html is in dist
if (fs.existsSync('404.html')) {
  fs.copyFileSync('404.html', path.join(distPath, '404.html'));
}

// 2. Ensure dist has docs/ subfolder
const distDocsPath = path.join(distPath, 'docs');
if (fs.existsSync(distDocsPath)) {
  fs.rmSync(distDocsPath, { recursive: true, force: true });
}
fs.mkdirSync(distDocsPath, { recursive: true });
fs.copyFileSync(path.join(distPath, 'index.html'), path.join(distDocsPath, 'index.html'));
if (fs.existsSync('404.html')) {
  fs.copyFileSync('404.html', path.join(distDocsPath, '404.html'));
}
fs.cpSync(path.join(distPath, 'assets'), path.join(distDocsPath, 'assets'), { recursive: true });

// 3. Sync to docs/ directory
console.log('[Build] Syncing to docs folder...');
if (fs.existsSync(docsPath)) {
  fs.rmSync(docsPath, { recursive: true, force: true });
}
fs.cpSync(distPath, docsPath, { recursive: true });

// 4. Sync production assets to root assets/
console.log('[Build] Syncing production assets to root assets folder...');
if (fs.existsSync(rootAssetsPath)) {
  fs.rmSync(rootAssetsPath, { recursive: true, force: true });
}
fs.cpSync(path.join(distPath, 'assets'), rootAssetsPath, { recursive: true });

// 5. CRITICAL: Replace root index.html with the compiled production bundle
// This guarantees that if GitHub Pages deploys from main branch root (/),
// it serves the compiled JavaScript bundle and never gets stuck on loading!
console.log('[Build] Writing compiled production bundle to root index.html...');
fs.copyFileSync(path.join(distPath, 'index.html'), 'index.html');

console.log('[Build] Production build complete and synced across root, docs, and dist!');
