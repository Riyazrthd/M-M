import { execFileSync } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const stdout = execFileSync(edgePath, [
  '--headless',
  '--dump-dom',
  'https://riyazrthd.github.io/M-M/?scan=POS-AIL-001'
], { encoding: 'utf8' });

console.log('FULL DOM:\n' + stdout);
