import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('[Deploy] Running build & sync process...');
execSync('node scripts/build.mjs', { stdio: 'inherit' });

const distPath = path.resolve('dist');

console.log('[Deploy] Deploying dist folder to gh-pages branch...');
try {
  execSync('git init', { cwd: distPath, stdio: 'ignore' });
  execSync('git checkout -B gh-pages', { cwd: distPath, stdio: 'ignore' });
  execSync('git add -A', { cwd: distPath, stdio: 'ignore' });
  execSync('git commit -m "Deploy compiled production bundle to gh-pages"', { cwd: distPath, stdio: 'ignore' });
  execSync('git remote add origin https://github.com/Riyazrthd/M-M.git', { cwd: distPath, stdio: 'ignore' });
  execSync('git push origin gh-pages --force', { cwd: distPath, stdio: 'inherit' });
  console.log('[Deploy] Successfully pushed compiled bundle to gh-pages branch!');
} catch (err) {
  console.error('[Deploy] Deployment error:', err.message);
} finally {
  const gitDir = path.join(distPath, '.git');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }
}
