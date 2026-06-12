#!/usr/bin/env node
/**
 * ALDC — sync-foundation.js
 * Sincroniza los árboles canónicos de la raíz hacia packages/foundation/,
 * la fuente desde la que prepare-package.js empaqueta el VSIX de la extensión.
 *
 * Uso:    node scripts/sync-foundation.js          (sincroniza)
 *         node scripts/sync-foundation.js --check  (solo comprueba; exit 1 si hay drift — para CI)
 *
 * Regla: packages/foundation/ NUNCA se edita a mano. Siempre: editar raíz → sync → build.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TREES = ['agents', 'skills', 'instructions', 'prompts'];
const CHECK = process.argv.includes('--check');

let copied = 0, identical = 0, extras = [], drift = [];

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

for (const tree of TREES) {
  const srcRoot = path.join(ROOT, tree);
  const dstRoot = path.join(ROOT, 'packages', 'foundation', tree);
  if (!fs.existsSync(srcRoot)) continue;

  for (const src of walk(srcRoot)) {
    const rel = path.relative(srcRoot, src);
    const dst = path.join(dstRoot, rel);
    const same = fs.existsSync(dst) && fs.readFileSync(src).equals(fs.readFileSync(dst));
    if (same) { identical++; continue; }
    drift.push(path.posix.join(tree, rel.split(path.sep).join('/')));
    if (!CHECK) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      copied++;
    }
  }

  // Ficheros que existen en foundation pero no en la raíz (extras heredados):
  if (fs.existsSync(dstRoot)) {
    for (const dst of walk(dstRoot)) {
      const rel = path.relative(dstRoot, dst);
      if (!fs.existsSync(path.join(srcRoot, rel)))
        extras.push(path.posix.join('packages/foundation', tree, rel.split(path.sep).join('/')));
    }
  }
}

console.log(`sync-foundation ${CHECK ? '(check)' : ''}`);
console.log(`  idénticos: ${identical}`);
if (CHECK) {
  drift.forEach((f) => console.log(`  ✖ drift: ${f}`));
} else {
  drift.forEach((f) => console.log(`  → sincronizado: ${f}`));
  console.log(`  copiados: ${copied}`);
}
if (extras.length) {
  console.log(`  ⚠ extras en foundation sin equivalente en raíz (revisar a mano, no se tocan):`);
  extras.forEach((f) => console.log(`     ${f}`));
}
process.exit(CHECK && drift.length ? 1 : 0);
