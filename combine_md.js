const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ignoreDirs = ['node_modules'];
const out = path.join(root, 'README.md');
let combined = '';

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoreDirs.includes(entry.name)) continue;
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (entry.name === 'README.md') return;
      if (entry.name === 'combined.md') return;
      combined += `\n\n# File: ${full}\n`;
      combined += fs.readFileSync(full, 'utf8');
    }
  }
}

walk(root);
fs.writeFileSync(out, combined, 'utf8');
console.log('Combined markdown into README.md');
