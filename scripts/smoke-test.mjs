import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'index.html',
  'src/main.js',
  'src/style.css',
  'assets/models/README.md'
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`Missing file: ${file}`);
    process.exit(1);
  }
}

const main = readFileSync('src/main.js', 'utf8');
const html = readFileSync('index.html', 'utf8');

if (!main.includes('GLTFLoader') || !main.includes('drawFullMap')) {
  console.error('Expected GLTFLoader and full map rendering in src/main.js');
  process.exit(1);
}

if (!html.includes('id="garage-menu"') || !html.includes('id="minimap"') || !html.includes('id="fullmap"')) {
  console.error('Expected garage menu, minimap, and full map in index.html');
  process.exit(1);
}

console.log('Smoke test passed.');
