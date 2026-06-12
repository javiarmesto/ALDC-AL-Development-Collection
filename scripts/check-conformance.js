#!/usr/bin/env node
/**
 * ALDC — check-conformance.js
 * Verificador de conformidad del framework (Fase 4 del plan).
 * Sin dependencias externas (no requiere npm install).
 *
 * Uso:  node check-conformance.js [ruta-al-repo]
 * Salida: informe en stdout; exit code 1 si hay errores (apto para CI).
 *
 * Comprueba:
 *   1. Todos los paths declarados en aldc.yaml existen en disco
 *   2. Todo primitivo en disco está declarado en aldc.yaml (huérfanos)
 *   3. Los contadores afirmados en CLAUDE.md coinciden con la realidad
 *   4. Los @import de CLAUDE.md resuelven
 *   5. Los enlaces markdown relativos de CLAUDE.md y README.md resuelven
 *   6. Sincronía de árboles: raíz vs packages/foundation (si existe)
 *   7. Cobertura del plugin: cada agente raíz tiene contraparte en claude-plugin
 *   8. Frontmatter presente y bien formado en agentes y skills
 *
 * Integración CI sugerida (.github/workflows/validate.yml):
 *   - run: node scripts/check-conformance.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || '.');
const errors = [];
const warnings = [];
const ok = [];

const exists = (p) => fs.existsSync(path.join(ROOT, p));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const listFiles = (dir, suffix) => {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith(suffix)).map((f) => path.posix.join(dir, f));
};
const listSkillDirs = (dir) => {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('skill-'))
    .map((d) => path.posix.join(dir, d.name));
};

// ── 1 + 2: aldc.yaml ↔ disco ────────────────────────────────────────────────
const aldcYaml = read('aldc.yaml');
// Solo las secciones required:/optional: definen el contenido del framework.
// (La sección external: contiene rutas relativas a OTRO repo — p.ej. BCQuality — y
// menciones informativas tipo consumedBy que no cuentan como declaración.)
const manifestBody = aldcYaml.slice(aldcYaml.search(/^required:/m));
const declared = [...manifestBody.matchAll(/"((?:agents|skills|prompts|instructions|docs|tools)\/[^"]+)"/g)]
  .map((m) => m[1]);

for (const p of declared) {
  if (exists(p)) ok.push(`aldc.yaml → existe: ${p}`);
  else errors.push(`aldc.yaml declara un path inexistente: ${p}`);
}

const declaredSet = new Set(declared);
const orphan = (files, label) => {
  for (const f of files) {
    if (f.endsWith('index.md') || f.endsWith('README.md')) continue;
    if (!declaredSet.has(f)) warnings.push(`${label} en disco NO declarado en aldc.yaml: ${f}`);
  }
};
orphan(listFiles('agents', '.agent.md'), 'Agente');
orphan(listSkillDirs('skills').map((d) => `${d}/SKILL.md`), 'Skill');
orphan(listFiles('prompts', '.prompt.md'), 'Prompt');
orphan(listFiles('instructions', '.md'), 'Instruction');

// ── 3: contadores de CLAUDE.md ──────────────────────────────────────────────
const claudeMd = read('CLAUDE.md');
const actual = {
  agents: listFiles('agents', '.agent.md').length,
  skills: listSkillDirs('skills').length,
  prompts: listFiles('prompts', '.prompt.md').length,
  instructions: listFiles('instructions', '.md').filter((f) => !f.endsWith('index.md') && !f.endsWith('README.md')).length,
};
const claims = [...claudeMd.matchAll(/(\d+)\s+(agents?|subagents?|skills?|workflows?|instructions?)/gi)];
const claimTotals = {};
for (const [, n, kindRaw] of claims) {
  const kind = kindRaw.toLowerCase().replace(/s?$/, 's');
  claimTotals[kind] = claimTotals[kind] || new Set();
  claimTotals[kind].add(Number(n));
}
const compare = (kind, actualN, note = '') => {
  const set = claimTotals[kind];
  if (!set) return;
  if (set.size > 1) errors.push(`CLAUDE.md se contradice sobre "${kind}": afirma ${[...set].join(' y ')}`);
  // El total en disco puede superar lo afirmado si hay tiers (core vs extensión):
  for (const n of set) {
    if (n > actualN) errors.push(`CLAUDE.md afirma ${n} ${kind} pero en disco hay ${actualN}${note}`);
    else if (n < actualN) warnings.push(`CLAUDE.md afirma ${n} ${kind}; en disco hay ${actualN}${note} (¿tiers sin documentar?)`);
  }
};
compare('agents', actual.agents, ' (ficheros .agent.md)');
compare('skills', actual.skills, ' (directorios skill-*)');
compare('workflows', actual.prompts, ' (ficheros .prompt.md)');
compare('instructions', actual.instructions, ' (md en instructions/, sin index/README)');

// ── 4: @import en CLAUDE.md ─────────────────────────────────────────────────
for (const [, imp] of claudeMd.matchAll(/@import\s+(\S+)/g)) {
  const p = imp.replace(/^\.\//, '');
  if (exists(p)) ok.push(`@import resuelve: ${p}`);
  else errors.push(`CLAUDE.md @import roto: ${imp}`);
}

// ── 5: enlaces relativos en CLAUDE.md y README.md ───────────────────────────
for (const file of ['CLAUDE.md', 'README.md']) {
  if (!exists(file)) continue;
  for (const [, , target] of read(file).matchAll(/\[([^\]]*)\]\((\.\/[^)#\s]+|[A-Za-z][\w./-]*\.md)(#[^)]*)?\)/g)) {
    if (/^https?:/.test(target)) continue;
    const p = target.replace(/^\.\//, '');
    if (!exists(p)) errors.push(`${file}: enlace relativo roto → ${target}`);
  }
}

// ── 6: sincronía raíz ↔ packages/foundation ─────────────────────────────────
if (exists('packages/foundation')) {
  for (const tree of ['agents', 'skills', 'instructions', 'prompts']) {
    const mirror = `packages/foundation/${tree}`;
    if (!exists(mirror)) { warnings.push(`packages/foundation sin árbol: ${tree}`); continue; }
    const walk = (rel) => {
      const out = [];
      for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
        const p = path.posix.join(rel, e.name);
        if (e.isDirectory()) out.push(...walk(p));
        else out.push(p);
      }
      return out;
    };
    for (const f of walk(tree)) {
      const twin = `packages/foundation/${f}`;
      if (!exists(twin)) errors.push(`Drift: ${f} no existe en packages/foundation`);
      else if (read(f) !== read(twin)) errors.push(`Drift: ${f} difiere de ${twin}`);
    }
  }
}

// ── 7: cobertura del plugin Claude Code ─────────────────────────────────────
if (exists('claude-plugin/agents')) {
  for (const f of listFiles('agents', '.agent.md')) {
    const name = path.basename(f, '.agent.md');
    if (!exists(`claude-plugin/agents/${name}.md`))
      errors.push(`Plugin sin contraparte para el agente: ${name}`);
  }
}

// ── 8: frontmatter ──────────────────────────────────────────────────────────
const checkFm = (files, required) => {
  for (const f of files) {
    const txt = read(f);
    if (!txt.startsWith('---')) { warnings.push(`Sin frontmatter: ${f}`); continue; }
    const end = txt.indexOf('\n---', 3);
    if (end < 0) { errors.push(`Frontmatter sin cerrar: ${f}`); continue; }
    const fm = txt.slice(0, end);
    for (const key of required) {
      if (!new RegExp(`^${key}\\s*:`, 'm').test(fm)) warnings.push(`Frontmatter sin "${key}": ${f}`);
    }
  }
};
checkFm(listFiles('agents', '.agent.md'), ['description']);
checkFm(listSkillDirs('skills').map((d) => `${d}/SKILL.md`).filter(exists), ['name', 'description']);

// ── Informe ─────────────────────────────────────────────────────────────────
console.log(`\nALDC check-conformance — ${new Date().toISOString().slice(0, 10)}`);
console.log(`Repo: ${ROOT}`);
console.log(`En disco: ${actual.agents} agentes · ${actual.skills} skills · ${actual.prompts} prompts · ${actual.instructions} instructions\n`);
if (errors.length) {
  console.log(`✖ ERRORES (${errors.length}):`);
  errors.forEach((e) => console.log(`   ✖ ${e}`));
}
if (warnings.length) {
  console.log(`\n⚠ AVISOS (${warnings.length}):`);
  warnings.forEach((w) => console.log(`   ⚠ ${w}`));
}
console.log(`\n✓ comprobaciones superadas: ${ok.length}`);
process.exit(errors.length ? 1 : 0);
