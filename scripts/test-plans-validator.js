#!/usr/bin/env node
'use strict';
// Requirement-set completeness as the contracts actually lay it out: one folder per
// requirement under the plans root. Static file checks only; no agent or host behaviour.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), os = require('os');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const validator = path.join(root, 'tools/aldc-validate/index.js');

const temp = t => { const p = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc plans á ')); t.after(() => fs.rmSync(p, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })); return p; };
const write = (r, rel, body = 'contract\n') => { fs.mkdirSync(path.dirname(path.join(r, rel)), { recursive: true }); fs.writeFileSync(path.join(r, rel), body); };
// A project laid out as the toolkit installs it, minus the plans under test.
function project(t) {
  const r = temp(t);
  fs.copyFileSync(path.join(root, 'aldc.yaml'), path.join(r, 'aldc.yaml'));
  write(r, '.github/plans/memory.md', 'decisions\n');
  return r;
}
const run = r => {
  const p = spawnSync(process.execPath, [validator, '--config', 'aldc.yaml'], { cwd: r, encoding: 'utf8' });
  return { status: p.status, out: p.stdout + p.stderr };
};

test('a requirement is its folder: a complete set passes and a missing contract is named', t => {
  const r = project(t);
  const req = '.github/plans/ventas-online';
  write(r, `${req}/ventas-online.spec.md`);
  write(r, `${req}/ventas-online.architecture.md`);
  let result = run(r);
  assert.match(result.out, /Requirement "ventas-online" incomplete: missing ventas-online\/ventas-online\.test-plan\.md/);
  write(r, `${req}/ventas-online.test-plan.md`);
  result = run(r);
  assert.match(result.out, /Requirement "ventas-online" has complete set \(3\/3\)/);
  assert.doesNotMatch(result.out, /incomplete/);
  // Reports produced during implementation are not contracts and never count.
  write(r, `${req}/ventas-online-phase-1-complete.md`);
  assert.match(run(r).out, /has complete set/);
});

test('a decomposed requirement is satisfied by its assigned unit specs', t => {
  const r = project(t);
  const req = '.github/plans/portal-clientes';
  write(r, `${req}/portal-clientes.architecture.md`);
  write(r, `${req}/portal-clientes.test-plan.md`);
  // The Architect assigns unique output paths, so {req}.spec.md need not exist.
  assert.match(run(r).out, /missing portal-clientes\/portal-clientes\.spec\.md/);
  write(r, `${req}/portal-clientes-api.spec.md`);
  write(r, `${req}/portal-clientes-ui.spec.md`);
  const result = run(r);
  assert.match(result.out, /has complete set \(decomposed into 2 unit spec\(s\)\)/);
  assert.doesNotMatch(result.out, /incomplete/);
});

test('contracts left in the plans root are reported instead of silently ignored', t => {
  const r = project(t);
  write(r, '.github/plans/legacy.spec.md');
  write(r, '.github/plans/legacy.architecture.md');
  write(r, '.github/plans/legacy.test-plan.md');
  const result = run(r);
  assert.match(result.out, /Contracts outside a requirement folder \(move each to \.github\/plans\/\{req_name\}\/\)/);
  for (const name of ['legacy.spec.md', 'legacy.architecture.md', 'legacy.test-plan.md']) assert.ok(result.out.includes(name), `missing from the report: ${name}`);
  // A note beside the plans is not a contract and is left alone.
  const clean = project(t);
  write(clean, '.github/plans/claude-plugin-tool-modernization.md');
  const quiet = run(clean);
  assert.doesNotMatch(quiet.out, /outside a requirement folder/);
  assert.match(quiet.out, /No requirement sets found/);
});

test('the archive folder is history, not an incomplete requirement', t => {
  const r = project(t);
  write(r, '.github/plans/archive/ventas-2024.spec.md');
  const result = run(r);
  assert.doesNotMatch(result.out, /Requirement "archive"/);
  assert.match(result.out, /No requirement sets found/);
});
