#!/usr/bin/env node
/**
 * ALDC — sync-claude-workspace.js
 * Regenera .claude/ (workspace de desarrollo de ESTE repo con Claude Code) como
 * espejo de claude-plugin/ — la distribución Claude Code canónica.
 *
 *   claude-plugin/agents/          → .claude/agents/          (espejo: borra extras)
 *   claude-plugin/skills/          → .claude/skills/          (espejo: borra extras)
 *   claude-plugin/rules-templates/ → .claude/rules/           (espejo: borra extras)
 *
 * PRESERVA siempre: .claude/settings.json y .claude/settings.local.json.
 *
 * Uso:    node scripts/sync-claude-workspace.js          (sincroniza)
 *         node scripts/sync-claude-workspace.js --check  (exit 1 si hay drift — CI)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const MAP = [
  ['claude-plugin/agents', '.claude/agents'],
  ['claude-plugin/skills', '.claude/skills'],
  ['claude-plugin/rules-templates', '.claude/rules'],
];

let synced = 0, removed = 0, identical = 0;
const drift = [];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

for (const [srcRel, dstRel] of MAP) {
  const srcRoot = path.join(ROOT, srcRel);
  const dstRoot = path.join(ROOT, dstRel);

  // 1. fuente → destino
  for (const src of walk(srcRoot)) {
    const rel = path.relative(srcRoot, src);
    const dst = path.join(dstRoot, rel);
    const same = fs.existsSync(dst) && fs.readFileSync(src).equals(fs.readFileSync(dst));
    if (same) { identical++; continue; }
    drift.push(`${dstRel}/${rel.split(path.sep).join('/')} (desactualizado)`);
    if (!CHECK) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      synced++;
    }
  }

  // 2. extras en destino sin equivalente en fuente → eliminar (espejo real)
  for (const dst of walk(dstRoot)) {
    const rel = path.relative(dstRoot, dst);
    if (!fs.existsSync(path.join(srcRoot, rel))) {
      drift.push(`${dstRel}/${rel.split(path.sep).join('/')} (huérfano)`);
      if (!CHECK) { fs.unlinkSync(dst); removed++; }
    }
  }
  // limpiar directorios vacíos tras borrar huérfanos
  if (!CHECK && fs.existsSync(dstRoot)) {
    const prune = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) prune(path.join(d, e.name));
      }
      if (fs.readdirSync(d).length === 0) fs.rmdirSync(d);
    };
    prune(dstRoot);
  }
}

console.log(`sync-claude-workspace ${CHECK ? '(check)' : ''}`);
console.log(`  idénticos: ${identical}`);
if (CHECK) drift.forEach((f) => console.log(`  ✖ drift: ${f}`));
else console.log(`  sincronizados: ${synced} · huérfanos eliminados: ${removed}`);
process.exit(CHECK && drift.length ? 1 : 0);
