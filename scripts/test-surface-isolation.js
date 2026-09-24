#!/usr/bin/env node
'use strict';
// Exercise the commands in disposable repositories, including poisoned siblings.
// No host invocation, credentials or AL runtime is needed for packaging isolation.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SURFACES = [
  { command: 'sync:claude', script: 'sync-plugin-support.js', output: 'claude-plugin' },
  { command: 'sync:copilot-cli', script: 'sync-copilot-cli.js', output: 'copilot-cli-plugin' },
  { command: 'sync:codex', script: 'sync-codex.js', output: 'plugins/aldc-codex' },
];
const ignore = new Set(['.git', 'node_modules', '__pycache__', '.DS_Store']);
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-surface-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(ROOT, dir, { recursive: true, filter: p => !ignore.has(path.basename(p)) && !path.basename(p).startsWith('.aldc-packaged-layout-') });
  return dir;
}
function snapshot(dir) {
  const files = {};
  function walk(rel) {
    const p = path.join(dir, rel);
    if (!fs.existsSync(p)) return;
    for (const item of fs.readdirSync(p, { withFileTypes: true })) {
      if (ignore.has(item.name)) continue;
      const name = rel ? `${rel}/${item.name}` : item.name;
      if (item.isDirectory()) walk(name);
      else files[name] = `${fs.statSync(path.join(dir, name)).mode & 0o777}:` + crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, name))).digest('hex');
    }
  }
  walk('');
  return files;
}
function changed(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(p => before[p] !== after[p]).sort();
}
function run(dir, command, check = false) {
  return execFileSync('npm', ['run', command, ...(check ? ['--', '--check'] : [])], {
    cwd: dir, encoding: 'utf8', stdio: 'pipe',
    env: { ...process.env, NODE_PATH: path.join(ROOT, 'node_modules') },
  });
}
function append(dir, file, content = '\n// unrelated surface mutation\n') {
  fs.appendFileSync(path.join(dir, file), content);
}
for (const target of SURFACES) {
  test(`${target.command}: owns its output, ignores sibling outputs and generators, is idempotent`, t => {
    const dir = fixture(t);
    const baseline = snapshot(path.join(ROOT, target.output));
    // Neither a missing sibling package nor an un-runnable sibling generator may
    // affect this surface. Also poison the shared workspace mirror separately.
    for (const other of SURFACES.filter(s => s !== target)) {
      fs.rmSync(path.join(dir, other.output), { recursive: true });
      fs.writeFileSync(path.join(dir, 'scripts', other.script), "throw Error('Sibling generator must not execute or be imported');\n");
    }
    if (target.command !== 'sync:copilot-cli') {
      append(dir, 'scripts/copilot-cli-adapter.js');
      append(dir, 'scripts/copilot-cli-bootstrap.js');
    }
    if (target.command !== 'sync:claude') append(dir, 'scripts/claude-al-tooling.md', '\nUnrelated Claude guide change.\n');
    if (target.command !== 'sync:codex') append(dir, 'scripts/codex-mcp-setup.md', '\nUnrelated Codex guide change.\n');
    append(dir, '.claude/agents/al-developer.md', '\nWorkspace-only change.\n');
    fs.rmSync(path.join(dir, target.output), { recursive: true });
    const before = snapshot(dir);
    run(dir, target.command);
    const after = snapshot(dir);
    assert.ok(changed(before, after).length > 0, 'Generation restores its missing output');
    assert.deepEqual(changed(before, after).filter(p => !p.startsWith(`${target.output}/`)), [], 'No writes outside the selected surface');
    assert.deepEqual(changed(baseline, snapshot(path.join(dir, target.output))), [], 'Independent generation reproduces the committed payload, including provenance');
    run(dir, target.command);
    assert.deepEqual(changed(after, snapshot(dir)), [], 'A second run writes no different content or modes');
    run(dir, target.command, true);
    assert.deepEqual(changed(after, snapshot(dir)), [], '--check is read-only');
    append(dir, `${target.output}/README.md`, '\nIntentional drift.\n');
    const drifted = snapshot(dir);
    assert.throws(() => run(dir, target.command, true), /drift|differences/, 'Drift still fails');
    assert.deepEqual(changed(drifted, snapshot(dir)), [], 'Failed checks do not repair files');
  });
}

test('shared canonical changes reach every distribution without touching the workspace mirror or foundation', t => {
  const dir = fixture(t);
  append(dir, 'agents/al-developer.agent.md', '\nCanonical isolation probe.\n');
  const before = snapshot(dir);
  run(dir, 'sync:plugins');
  const after = snapshot(dir);
  const diffs = changed(before, after);
  for (const surface of SURFACES) assert.ok(diffs.some(p => p.startsWith(`${surface.output}/`)), surface.command);
  assert.deepEqual(diffs.filter(p => !SURFACES.some(s => p.startsWith(`${s.output}/`))), []);
  for (const p of ['claude-plugin/agents/al-developer.md', 'copilot-cli-plugin/agents/al-developer.agent.md', 'plugins/aldc-codex/agents/al-developer.toml']) {
    assert.ok(fs.readFileSync(path.join(dir, p), 'utf8').includes('Canonical isolation probe.'), p);
  }
  // Explicit opt-in updates only the development mirror; its drift gate survives.
  assert.throws(() => run(dir, 'sync:claude-workspace', true), error => error.status === 1 && /drift/.test(error.stdout));
  run(dir, 'sync:claude-workspace');
  assert.deepEqual(changed(after, snapshot(dir)).filter(p => !p.startsWith('.claude/')), []);
  run(dir, 'sync:claude-workspace', true);
});

test('foundation needs only canonical inputs and writes only the VSIX foundation tree', t => {
  const dir = fixture(t);
  for (const surface of SURFACES) {
    fs.rmSync(path.join(dir, surface.output), { recursive: true });
    fs.writeFileSync(path.join(dir, 'scripts', surface.script), "throw Error('VSIX must not run a plugin generator');\n");
  }
  fs.rmSync(path.join(dir, '.claude'), { recursive: true });
  append(dir, 'agents/al-developer.agent.md', '\nVSIX isolation probe.\n');
  const before = snapshot(dir);
  assert.throws(() => run(dir, 'sync:foundation', true), error => error.status === 1 && /drift/.test(error.stdout));
  run(dir, 'sync:foundation');
  const after = snapshot(dir);
  assert.deepEqual(changed(before, after), ['packages/foundation/agents/al-developer.agent.md']);
  assert.equal(fs.readFileSync(path.join(dir, 'packages/foundation/agents/al-developer.agent.md'), 'utf8'), fs.readFileSync(path.join(dir, 'agents/al-developer.agent.md'), 'utf8'));
  run(dir, 'sync:foundation', true);
  run(dir, 'sync:foundation');
  assert.deepEqual(changed(after, snapshot(dir)), []);
});
