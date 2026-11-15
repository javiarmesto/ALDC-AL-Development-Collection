#!/usr/bin/env node
'use strict';
// Rewrites provenance.json of the maintained Claude plugins (claude-plugin/ and, since 5.4.0, the optional
// claude-plugin-extras/) after editing them. init.js and `sync-plugin-support.js --check` verify every core
// payload file against its lock and reject unlisted files; the Claude surface tests verify both locks.
//   node scripts/relock-claude-surface.js           # rewrite the payload hashes of both plugins
//   node scripts/relock-claude-surface.js --check   # fail when a lock does not match
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..');
const core = path.join(repo, 'claude-plugin');
const { walk, normalized, verify } = require(path.join(core, 'scripts', 'package-provenance'));
const { hash } = require(path.join(core, 'scripts', 'install-transaction'));
const PLUGINS = [
  ['claude-plugin', 'maintained claude surface (see claude-plugin/SURFACE.md)'],
  ['claude-plugin-extras', 'maintained claude surface (see claude-plugin-extras/README.md)'],
];
const check = process.argv.includes('--check');
for (const [dir, generator] of PLUGINS) {
  const root = path.join(repo, dir);
  if (!fs.existsSync(root)) continue;
  if (check) { verify(root); console.log(`${dir}: provenance ok`); continue; }
  const file = path.join(root, 'provenance.json');
  const lock = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { schema: 1, algorithm: 'sha256-lf', generator, sources: {} };
  lock.generator = generator;
  lock.outputs = Object.fromEntries(walk(root).filter((p) => p !== 'provenance.json')
    .map((p) => [p, hash(normalized(fs.readFileSync(path.join(root, p))))]));
  fs.writeFileSync(file, JSON.stringify(lock, null, 2) + '\n');
  verify(root);
  console.log(`${dir}: provenance ${Object.keys(lock.outputs).length} files`);
}
