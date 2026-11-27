#!/usr/bin/env node
'use strict';
// The Claude Code plugin is maintained by hand (claude-plugin/SURFACE.md), but its host-neutral
// tools are the canonical ones under tools/: this copies them in verbatim.
//   node scripts/sync-claude-tools.js          copy
//   node scripts/sync-claude-tools.js --check  exit 1 on drift
// After a copy, relock the surface: node scripts/relock-claude-surface.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOOLS = {
  'tools/tickets': ['lib.js', 'tickets.js', 'integrate.js'],
  'tools/factory': ['factory.js', 'crew.json', 'hosts/claude.js', 'hosts/fake.js'],
};

function sync(check = false) {
  let drift = 0;
  for (const [dir, names] of Object.entries(TOOLS)) {
    for (const name of names) {
      const from = path.join(ROOT, dir, name);
      const to = path.join(ROOT, 'claude-plugin', dir, name);
      const want = fs.readFileSync(from, 'utf8').replace(/\r\n/g, '\n');
      const have = fs.existsSync(to) ? fs.readFileSync(to, 'utf8').replace(/\r\n/g, '\n') : null;
      if (have === want) continue;
      drift++;
      if (check) console.error(`drift: claude-plugin/${dir}/${name} differs from ${dir}/${name}`);
      else { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.writeFileSync(to, want); }
    }
  }
  console.log(`Claude tools: ${Object.values(TOOLS).flat().length} files; ${drift} ${check ? 'drifted' : 'copied'}`);
  return drift;
}

if (require.main === module) process.exitCode = sync(process.argv.includes('--check')) && process.argv.includes('--check') ? 1 : 0;
module.exports = { sync, TOOLS };
