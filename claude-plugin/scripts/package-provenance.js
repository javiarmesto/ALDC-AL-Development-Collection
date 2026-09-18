'use strict';
// Source/output hashes adapted from Lab b2ce9d9.../scripts/sync.mjs.
const fs = require('fs');
const path = require('path');
const { hash, checked } = require('./install-transaction');
const normalized = b => Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n'));
// Derived, never content. Python writes __pycache__ the first time a shipped script
// is imported, so it exists on a developer's disk and in a real installation, but
// never in a clean checkout - .gitignore excludes it. Listing one as a provenance
// source makes every sync --check drift on CI while passing locally, and makes a
// user's own installation look tampered with. The .py itself stays hash-checked.
const DERIVED = /^(?:__pycache__|\.DS_Store|Thumbs\.db)$|\.py[co]$/;
function walk(root, prefix = '') {
  if (!fs.existsSync(path.join(root, prefix))) return [];
  return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).sort((a,b) => a.name < b.name ? -1 : 1).flatMap(e => {
    if (DERIVED.test(e.name)) return [];
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isSymbolicLink()) throw Error(`Symlink package source: ${rel}`);
    return e.isDirectory() ? walk(root, rel) : [rel];
  });
}
function provenance(root, sources, outputs, generator) {
  return JSON.stringify({ schema: 1, algorithm: 'sha256-lf', generator,
    sources: Object.fromEntries([...new Set([...sources, generator, 'scripts/package-provenance.js'])].sort().map(p => [p, hash(normalized(fs.readFileSync(checked(root, p))))])),
    outputs: Object.fromEntries([...outputs].sort(([a],[b]) => a < b ? -1 : 1).map(([p,b]) => [p, hash(normalized(Buffer.from(b)))])),
  }, null, 2) + '\n';
}
function verify(root) {
  const lock = JSON.parse(fs.readFileSync(checked(root, 'provenance.json'), 'utf8'));
  if (lock.schema !== 1 || lock.algorithm !== 'sha256-lf' || !lock.outputs) throw Error('Invalid package provenance');
  for (const [p,h] of Object.entries(lock.outputs)) {
    if (hash(normalized(fs.readFileSync(checked(root,p)))) !== h) throw Error(`Package integrity mismatch: ${p}`);
  }
  const actual = walk(root).filter(p => p !== 'provenance.json');
  if (actual.some(p => !Object.hasOwn(lock.outputs, p))) throw Error('Unexpected file in plugin payload');
  return lock;
}
module.exports = { normalized, walk, provenance, verify };
