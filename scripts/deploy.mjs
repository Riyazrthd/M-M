import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building production bundle...');
execSync('node node_modules/vite/bin/vite.js build', { stdio: 'inherit' });

const distPath = path.resolve('dist');
const docsPath = path.resolve('docs');
const rootAssetsPath = path.resolve('assets');

// Ensure 404.html is in dist
if (fs.existsSync('404.html')) {
  fs.copyFileSync('404.html', path.join(distPath, '404.html'));
}

// Sync to docs/ directory for main branch GitHub Pages deployment option
console.log('Copying production bundle to docs folder...');
if (fs.existsSync(docsPath)) {
  fs.rmSync(docsPath, { recursive: true, force: true });
}
fs.cpSync(distPath, docsPath, { recursive: true });

// Also copy assets directly into root assets/ so both / and /docs/ have assets
console.log('Syncing production assets to root assets folder...');
if (fs.existsSync(rootAssetsPath)) {
  fs.rmSync(rootAssetsPath, { recursive: true, force: true });
}
fs.cpSync(path.join(distPath, 'assets'), rootAssetsPath, { recursive: true });

console.log('Deploying dist folder to gh-pages branch...');

try {
  execSync('git init', { cwd: distPath, stdio: 'ignore' });
  execSync('git checkout -B gh-pages', { cwd: distPath, stdio: 'ignore' });
  execSync('git add -A', { cwd: distPath, stdio: 'ignore' });
  execSync('git commit -m "Deploy direct scan checklist & Supabase sync update"', { cwd: distPath, stdio: 'ignore' });
  execSync('git remote add origin https://github.com/Riyazrthd/M-M.git', { cwd: distPath, stdio: 'ignore' });
  execSync('git push origin gh-pages --force', { cwd: distPath, stdio: 'inherit' });
  console.log('✓ Successfully pushed compiled bundle to gh-pages branch!');
} catch (err) {
  console.error('Deployment error:', err.message);
} finally {
  const gitDir = path.join(distPath, '.git');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }
}

