#!/usr/bin/env node
'use strict';
// Read-only YAML normalization. Never discovers, installs or invokes a provider.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function readConfig(workspace, configName = 'aldc.yaml') {
  // Final path name (expands Windows 8.3 short names) so Doctor can bind the snapshot.
  const root = fs.realpathSync.native(workspace);
  const file = path.join(root, configName);
  const raw = fs.existsSync(file) ? fs.readFileSync(file) : null;
  let data = {};
  if (raw) {
    let yaml;
    try { yaml = require(require.resolve('js-yaml', { paths: [__dirname, path.join(__dirname, '../aldc-validate')] })); }
    catch { throw Error('YAML reader unavailable: install the declared ALDC npm dependencies, or tools/aldc-validate dependencies. No provider was probed.'); }
    data = yaml.load(raw.toString('utf8')) || {};
  }
  if (typeof data !== 'object' || Array.isArray(data)) throw Error('aldc.yaml must be an object');
  if (data.external != null && (typeof data.external !== 'object' || Array.isArray(data.external))) throw Error('external must be an object');
  const b = data.external?.bcquality ?? {};
  if (typeof b !== 'object' || Array.isArray(b)) throw Error('external.bcquality must be an object');
  const mode = b.mode ?? 'external-multiroot';
  const enabled = b.enabled ?? 'auto';
  if (!['plugin', 'external-multiroot'].includes(mode)) throw Error('external.bcquality.mode: expected plugin or external-multiroot');
  if (![true, false, 'auto'].includes(enabled)) throw Error('external.bcquality.enabled: expected boolean or auto');
  const string = (v, fallback, field, required = false) => {
    v = v ?? fallback;
    if (typeof v !== 'string' || /[\r\n\0]/.test(v)) throw Error(`${field}: expected a single-line string`);
    if (required && !v.trim()) throw Error(`${field}: must not be empty (omit the key to use the default)`);
    return v;
  };
  const p = b.plugin ?? {};
  if (typeof p !== 'object' || Array.isArray(p)) throw Error('external.bcquality.plugin must be an object');
  const plugin = {
    id: string(p.id, 'bcquality', 'plugin.id'),
    skill: string(p.skill, 'al-code-review', 'plugin.skill'),
    expectedVersion: string(p.expectedVersion, '', 'plugin.expectedVersion'),
    sourceRef: string(p.sourceRef, '', 'plugin.sourceRef')
  };
  if (!plugin.id || !plugin.skill) throw Error('plugin.id and plugin.skill must not be empty');
  if (plugin.expectedVersion && !/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(plugin.expectedVersion)) throw Error('plugin.expectedVersion: expected a semantic version');
  const config = { mode, enabled, plugin,
    url: string(b.url, 'https://github.com/microsoft/BCQuality.git', 'url', true),
    ref: string(b.ref, 'main', 'ref', true),
    pinnedCommit: string(b.pinnedCommit, '', 'pinnedCommit'),
    home: string(b.home, '../bcquality', 'home', true),
    entryPoint: string(b.entryPoint, 'skills/entry.md', 'entryPoint', true),
    pilotSkills: b.pilotSkills ?? [],
    fallback: { mode: 'skills-mode', residual: 'A-G', neverBlock: true }
  };
  for (const [k, v] of [['pinnedCommit', config.pinnedCommit], ['plugin.sourceRef', plugin.sourceRef]])
    if (v && !/^[0-9a-f]{40}$/i.test(v)) throw Error(`${k}: expected an empty value or full commit SHA`);
  if (!Array.isArray(config.pilotSkills) || config.pilotSkills.some(x => typeof x !== 'string')) throw Error('pilotSkills: expected string array');
  if (Object.keys(p).some(k => !['id', 'skill', 'expectedVersion', 'sourceRef'].includes(k))) throw Error('Unknown plugin identity field');
  // The solution anchor travels with the snapshot: one source of truth for where the
  // toolkit lives and how the multi-root workspace is laid out.
  const toolkitRoot = string(data.toolkitRoot, '.', 'toolkitRoot', true);
  const s = data.solution ?? {};
  if (typeof s !== 'object' || Array.isArray(s)) throw Error('solution must be an object');
  const r = s.roots ?? {};
  if (typeof r !== 'object' || Array.isArray(r)) throw Error('solution.roots must be an object');
  const solution = { workspaceFile: string(s.workspaceFile, 'aldc.code-workspace', 'solution.workspaceFile', true),
    roots: { application: string(r.application, '', 'solution.roots.application'), test: string(r.test, '', 'solution.roots.test') } };
  return { contractVersion: 1, workspace: root, configPath: file,
    configSha256: raw ? crypto.createHash('sha256').update(raw).digest('hex') : null,
    toolkitRoot, solution, bcquality: config };
}
if (require.main === module) {
  try { process.stdout.write(JSON.stringify(readConfig(process.argv[2] || '.'), null, 2) + '\n'); }
  catch (e) { console.error(`BCQuality configuration: ${e.message}`); process.exitCode = 2; }
}
module.exports = { readConfig };
