#!/usr/bin/env node
'use strict';

// Real installer regression checks in disposable projects; no BC environment needed.
const assert = require('assert').strict;
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const yaml = require('js-yaml');
const { project } = require('./native-profile');
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-native-profile-'));
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const read = p => fs.readFileSync(p, 'utf8');
const fm = text => yaml.load(text.split('\n---')[0].slice(4));
const installer = (cwd, args = [], env = {}) => spawnSync(process.execPath,
  [path.join(root, 'scripts/install.js'), 'install', '--yes', ...args],
  { cwd, encoding: 'utf8', timeout: 30000, env: { ...process.env, npm_config_offline: 'true', ...env } });
const digestFiles = directory => {
  const result = {};
  const walk = (dir, prefix = '') => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = `${prefix}${e.name}`;
      if (e.isDirectory()) walk(path.join(dir, e.name), rel + '/');
      else result[rel] = require('crypto').createHash('sha256').update(fs.readFileSync(path.join(dir, e.name))).digest('hex');
    }
  };
  walk(directory); return result;
};

try {
  const fixture = path.join(tmp, 'project'); fs.mkdirSync(fixture);
  const sentinel = '{"id":"fixture","version":"1.2.3.4"}\n';
  fs.writeFileSync(path.join(fixture, 'app.json'), sentinel);
  fs.mkdirSync(path.join(fixture, 'App'));
  fs.mkdirSync(path.join(fixture, 'Test'));
  fs.writeFileSync(path.join(fixture, 'App/Sentinel.Table.al'), '// existing AL source\n');
  fs.writeFileSync(path.join(fixture, 'Test/app.json'), sentinel);
  fs.mkdirSync(path.join(fixture, '.vscode'));
  fs.writeFileSync(path.join(fixture, '.vscode/settings.json'), '{"custom":true}\n');
  let run = installer(fixture);
  check(run.status === 0, `Default install: ${run.stderr}`);
  for (const tree of ['agents', 'prompts']) {
    for (const name of fs.readdirSync(path.join(root, tree))) {
      check(read(path.join(fixture, '.github', tree, name)) === read(path.join(root, tree, name)), `BC28 preserves ${tree}/${name}`);
    }
  }
  const before = digestFiles(fixture);
  run = installer(fixture, ['--profile', 'bc29-native']);
  check(run.status !== 0 && (run.stdout + run.stderr).includes('Profile switch'), 'Mixed-profile update is refused');
  assert.deepEqual(digestFiles(fixture), before); checks++;
  run = installer(fixture, ['--profile', 'invalid']);
  check(run.status !== 0, 'Unknown profile refused');
  assert.deepEqual(digestFiles(fixture), before); checks++;
  run = installer(fixture, ['--profile', 'bc29-native', '--force']);
  check(run.status === 0, `Native install: ${run.stderr}`);
  check(read(path.join(fixture, 'app.json')) === sentinel, 'User manifest untouched');
  check(JSON.parse(read(path.join(fixture, '.github/aldc-profile.json'))).profile === 'bc29-native', 'Native profile recorded');

  const allowed = new Set(['al_symbolsearch', 'al_getdiagnostics', 'al_build', 'al_downloadsymbols', 'al_debug', 'al_setbreakpoint', 'al_snapshotdebugging']);
  for (const tree of ['agents', 'prompts']) {
    for (const name of fs.readdirSync(path.join(root, tree)).filter(n => /\.(agent|prompt)\.md$/.test(n))) {
      const installed = path.join(fixture, '.github', tree, name);
      const text = read(installed), metadata = fm(text);
      const original = fm(read(path.join(root, tree, name)));
      check(metadata.model === original.model, `Model preserved: ${name}`);
      assert.deepEqual(metadata.handoffs, original.handoffs); checks++;
      check(!metadata.tools.some(t => /al-symbols-mcp|sshadowsdk|atlas/i.test(t)), `No legacy provider grant: ${name}`);
      check(metadata.tools.filter(t => t.startsWith('ms-dynamics-smb.al/')).every(t => allowed.has(t.split('/')[1])), `Catalog names: ${name}`);
      check(!/bclsp_|al_symbolrelations|al_get_diagnostics|al_search_objects|al_download_symbols|al_generate_manifest|al_download_source|al_clear_credentials_cache|al_generate_cpu_profile|al_get_package_dependencies|al_generatepermissionset|al_new_project|\bal_go\b/.test(text), `No stale tool instructions: ${name}`);
      const link = text.match(/\[the native tool contract\]\(([^)]+)\)/);
      check(link && fs.existsSync(path.resolve(path.dirname(installed), link[1])), `Contract readable after install: ${name}`);
    }
  }
  const agent = name => read(path.join(fixture, '.github/agents', name + '.agent.md'));
  const grants = name => fm(agent(name)).tools.filter(t => t.startsWith('ms-dynamics-smb.al/'));
  check(grants('al-conductor').length === 0, 'Conductor has no native execution grants');
  const conductor = read(path.join(root, 'agents/al-conductor.agent.md'));
  check(agent('al-conductor').endsWith(conductor.slice(conductor.indexOf('\n---', 3) + 4)), 'Entire Conductor body retained inline');
  for (const name of ['al-architect', 'al-planning-subagent', 'al-review-subagent', 'al-developer-reviewer', 'dredd', 'al-presales', 'al-agent-builder']) {
    check(!grants(name).some(t => /al_build|al_downloadsymbols|al_debug|al_setbreakpoint|al_snapshotdebugging/.test(t)), `Read-only native scope: ${name}`);
  }
  for (const name of ['al-developer', 'al-implement-subagent']) check(grants(name).includes('ms-dynamics-smb.al/al_build'), `Implementation build grant: ${name}`);
  check(!grants('al-triage').includes('ms-dynamics-smb.al/al_build'), 'Triage cannot build through native grant');
  const build = read(path.join(fixture, '.github/prompts/al-build.prompt.md'));
  check(!/al_(?:incremental_publish|publish|publish_existing_extension|package|full_package)/.test(build), 'Native build has no deployment or invented packaging operations');
  check(build.includes('Stop after build/package') && build.includes('human gate'), 'Native build stops at the deployment handoff');
  const nativeBefore = agent('al-conductor');
  const customPaths = ['aldc.yaml', '.github/copilot-instructions.md', '.github/instructions/al-guidelines.instructions.md'];
  // The workspace definition is the developer's own file: seeded once, never replaced.
  const userOwned = ['aldc.code-workspace'];
  for (const rel of [...customPaths, ...userOwned]) fs.appendFileSync(path.join(fixture, rel), '\n# USER CUSTOMIZATION\n');
  const customized = Object.fromEntries([...customPaths, ...userOwned].map(rel => [rel, read(path.join(fixture, rel))]));
  run = installer(fixture);
  check(run.status === 0, 'Non-force native update succeeds');
  for (const rel of [...customPaths, ...userOwned]) check(read(path.join(fixture, rel)) === customized[rel], `Non-force preserves ${rel}`);
  run = installer(fixture, ['--force']);
  check(run.status === 0 && agent('al-conductor') === nativeBefore, 'Unspecified profile retains installed native selection');
  for (const rel of customPaths) check(!read(path.join(fixture, rel)).includes('USER CUSTOMIZATION'), `Force replaces ${rel} as documented`);
  for (const rel of userOwned) check(read(path.join(fixture, rel)) === customized[rel], `Force preserves the developer's ${rel}`);
  const memoryPath = path.join(fixture, '.github/plans/memory.md');
  fs.writeFileSync(memoryPath, 'USER MEMORY\n');
  run = installer(fixture, ['--profile', 'bc28', '--force']);
  check(run.status === 0, `BC28 rollback: ${run.stderr}`);
  check(agent('al-conductor') === conductor, 'Rollback restores canonical Conductor bytes');
  check(read(memoryPath) === 'USER MEMORY\n', 'Rollback preserves project memory');
  check(read(path.join(fixture, 'app.json')) === sentinel, 'Rollback preserves user app.json');
  check(read(path.join(fixture, 'App/Sentinel.Table.al')) === '// existing AL source\n', 'Profile changes preserve AL sources');
  check(read(path.join(fixture, 'Test/app.json')) === sentinel, 'Profile changes preserve Test manifest');
  check(read(path.join(fixture, '.vscode/settings.json')) === '{"custom":true}\n', 'Profile changes preserve VS Code settings');
  assert.throws(() => project('agents/new-role.agent.md', Buffer.from('---\ntools: [read]\n---\n')), /assignment missing/); checks++;
  const custom = path.join(tmp, 'custom'); fs.mkdirSync(custom);
  run = installer(custom, ['--profile', 'bc29-native', '--target-dir', '.copilot']);
  check(run.status === 0, `Custom target native install: ${run.stderr}`);
  check(fs.existsSync(path.join(custom, '.copilot/docs/framework/native-al-tools.md')), 'Contract installed with custom target');
  // Reproduce a Windows-style source checkout without requiring a Windows host.
  const crlfPackage = path.join(tmp, 'crlf-package');
  fs.cpSync(root, crlfPackage, { recursive: true, filter: p => !['.git', 'node_modules'].includes(path.basename(p)) });
  for (const tree of ['agents', 'prompts']) {
    for (const name of fs.readdirSync(path.join(root, tree)).filter(n => /\.(agent|prompt)\.md$/.test(n))) {
      const rel = `${tree}/${name}`;
      const lf = read(path.join(root, rel)).replace(/\r\n/g, '\n');
      const crlf = lf.replace(/\n/g, '\r\n');
      fs.writeFileSync(path.join(crlfPackage, rel), crlf);
      check(project(rel, Buffer.from(crlf)).toString().replace(/\r\n/g, '\n') === project(rel, Buffer.from(lf)).toString(), `CRLF projection: ${rel}`);
    }
  }
  const crlfFixture = path.join(tmp, 'crlf-project'); fs.mkdirSync(crlfFixture);
  run = installer(crlfFixture, ['--profile', 'bc29-native'], { ALDC_PACKAGE_DIR: crlfPackage });
  check(run.status === 0, `CRLF source installation succeeds: ${run.stdout} ${run.stderr}`);
  const crlfConductor = read(path.join(crlfPackage, 'agents/al-conductor.agent.md'));
  check(read(path.join(crlfFixture, '.github/agents/al-conductor.agent.md')).endsWith(crlfConductor.slice(crlfConductor.indexOf('\r\n---', 3) + 5)), 'CRLF Conductor body retained byte for byte');
  console.log(`PASS: ${checks} checks; real default/native/switch/rollback/custom-target installs. No AL/BC runtime operations executed.`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
