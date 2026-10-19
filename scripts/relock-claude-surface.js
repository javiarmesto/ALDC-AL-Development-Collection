#!/usr/bin/env node
'use strict';
// Rewrites claude-plugin/provenance.json after editing the maintained Claude surface. init.js and
// `sync-plugin-support.js --check` verify every payload file against it and reject unlisted files.
//   node scripts/relock-claude-surface.js           # rewrite the payload hashes
//   node scripts/relock-claude-surface.js --check   # fail when the lock does not match
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', 'claude-plugin');
const { walk, normalized, verify } = require(path.join(root, 'scripts', 'package-provenance'));
const { hash } = require(path.join(root, 'scripts', 'install-transaction'));
if (process.argv.includes('--check')) { verify(root); console.log('provenance ok'); process.exit(0); }
const file = path.join(root, 'provenance.json');
const lock = JSON.parse(fs.readFileSync(file, 'utf8'));
lock.generator = 'maintained claude surface (see claude-plugin/SURFACE.md)';
lock.outputs = Object.fromEntries(walk(root).filter((p) => p !== 'provenance.json')
  .map((p) => [p, hash(normalized(fs.readFileSync(path.join(root, p))))]));
fs.writeFileSync(file, JSON.stringify(lock, null, 2) + '\n');
verify(root);
console.log(`provenance: ${Object.keys(lock.outputs).length} files`);
