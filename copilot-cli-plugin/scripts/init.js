#!/usr/bin/env node
'use strict';
// Canonical adaptation of Lab init.mjs and Codex install_runtime.py (b2ce9d9...).
// Distributed with the same transaction engine as Chat. Default is a dry run.
const fs = require('fs');
const path = require('path');
const tx = require('./install-transaction');
const { verify, walk, normalized } = require('./package-provenance');
function overlaps(project, pluginRoot, platform = process.platform) {
  const paths = platform === 'win32' ? path.win32 : path;
  const canonical = p => {
    const resolved = paths.resolve(p);
    return platform === 'win32' ? resolved.toLowerCase() : resolved;
  };
  const target = canonical(project), source = canonical(pluginRoot);
  const prefix = p => p.endsWith(paths.sep) ? p : p + paths.sep;
  return target === source || target.startsWith(prefix(source)) || source.startsWith(prefix(target));
}
function initialize({ project, pluginRoot, apply = false, force = false, rollback = false, check = false }) {
  project = path.resolve(project); pluginRoot = path.resolve(pluginRoot);
  if (overlaps(project, pluginRoot)) throw Error('Choose a project outside the plugin source tree');
  const descriptor = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'surface.json'), 'utf8'));
  const surface = descriptor.surface;
  if (!['claude', 'cli', 'codex'].includes(surface)) throw Error('Unsupported plugin surface');
  // plans.root travels with the distribution: the generator resolves it from
  // aldc.yaml once and records it here, so no YAML reader is needed at install time.
  const plansRoot = descriptor.plansRoot || '.github/plans';
  if (typeof plansRoot !== 'string' || !plansRoot || path.isAbsolute(plansRoot) || plansRoot.split(/[\\/]/).includes('..')) {
    throw Error('surface.json: plansRoot must be a relative path inside the project');
  }
  if (rollback) return tx.rollback(project, surface);
  if (check) return { drift: tx.drift(project, surface), hostLoading: 'unverified' };
  verify(pluginRoot); // Check all locked payloads before planning a project write.
  const files = new Map();
  const put = (rel, content, opts = {}) => {
    if (files.has(rel)) throw Error(`Duplicate destination: ${rel}`);
    files.set(rel, { content, ...opts });
  };
  const copy = (src, dst, opts) => put(dst, normalized(fs.readFileSync(path.join(pluginRoot, src))), opts);
  const ruleDest = surface === 'claude' ? '.claude/rules' : surface === 'cli' ? '.github/instructions' : '.agents/skills/aldc/references/rules';
  // The Claude Code plugin ships its rules as `rules/`; the CLI distribution keeps
  // `rules-templates/`, which is the folder name its own generator writes.
  const ruleSource = surface === 'claude' ? 'rules' : 'rules-templates';
  if (surface !== 'codex') for (const rel of walk(pluginRoot, ruleSource)) copy(rel, `${ruleDest}/${path.basename(rel)}`);
  copy('templates/memory-template.md', `${plansRoot}/memory.md`, { seed: true });
  if (surface === 'codex') {
    // Codex is the one surface whose plans root is neither the consumers' default
    // (.github/plans, as in the CLI) nor resolvable from an installed package dir
    // (as install.js does for Claude Code via plansRootOf). Local bootstrap is its
    // only path, so it declares the root in the project: without this, the project's
    // own bcquality/config.js and aldc-validate would look under .github/plans.
    // Seeded, so a project that already has an aldc.yaml keeps it.
    copy('aldc.yaml', 'aldc.yaml', { seed: true });
    for (const rel of walk(pluginRoot, 'skills')) copy(rel, '.agents/' + rel);
    for (const rel of walk(pluginRoot, 'agents')) copy(rel, '.codex/' + rel);
  }
  let guidance = surface === 'claude' ? 'CLAUDE.md' : 'AGENTS.md';
  // Copilot CLI reads AGENTS.md; preserve AGENTS.override.md without using it.
  const before = tx.read(project, guidance);
  const fragment = fs.readFileSync(path.join(pluginRoot, 'project-guidance.md'), 'utf8');
  // Only the ALDC block is managed; preserve surrounding text, including CRLF.
  put(guidance, tx.managedBlock(before, fragment, surface.toUpperCase()), { retain: true, merge: before === null || !before.toString('utf8').includes(`<!-- BEGIN ALDC ${surface.toUpperCase()} -->`) });
  const shadowing = require('./cli-bootstrap').inspectShadowing(project, pluginRoot);
  const result = tx.apply({ root: project, surface, files, force, dryRun: !apply });
  return { ...result, surface, guidance, shadowing, hostLoading: 'unverified',
    note: 'Review collisions and potential shadowing. Bootstrap installs no agents or skills. Restart Copilot CLI and inspect actual loaded sources, including any extra trusted roots.' };
}
if (require.main === module) {
  try {
    const opts = { project: process.cwd(), pluginRoot: path.resolve(__dirname, '..') };
    const args = process.argv.slice(2);
    for (let i=0; i<args.length; i++) {
      const arg = args[i];
      if (arg === '--project' && args[i+1]) opts.project = args[++i];
      else if (arg === '--apply') opts.apply = true;
      else if (arg === '--force') opts.force = true;
      else if (arg === '--rollback') opts.rollback = true;
      else if (arg === '--verify') opts.check = true;
      else throw Error(`Unknown or incomplete argument: ${arg}`);
    }
    const result = initialize(opts); console.log(JSON.stringify(result, null, 2));
    if (result.drift?.length || result.files?.some(f => f.action === 'collision')) process.exitCode = 2;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { initialize, overlaps };
