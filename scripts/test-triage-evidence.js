'use strict';
// Structural fixtures only. These records are not Business Central runtime evidence.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function record() {
  return { version: 1, incident: 'fixture-only', baseline: 'fixture revision/app/symbols', target: 'fixture sandbox/build',
    milestones: { capture: { status: 'captured', reference: 'fixture://recording' },
      inspection: { status: 'inspected', reference: 'fixture://decoded#exception-1' },
      diagnosis: { status: 'supported' }, validation: { status: 'pending', reason: 'Fix not implemented' } },
    claims: [{ statement: 'Fixture divisor is zero', status: 'supported', evidence: [
      { reference: 'fixture://decoded#exception-1', observation: 'Fixture divisor=0 at exception' } ] }] };
}
function run(t, data, transform = s => s, validator = 'tools/aldc-validate/index.js') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-triage-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const report = path.join(dir, 'incident-diagnosis.md');
  fs.writeFileSync(report, transform('# Structural fixture\n\n```aldc-triage-evidence\n' + JSON.stringify(data) + '\n```\n'));
  const result = spawnSync(process.execPath, [path.join(root, validator), '--diagnosis', report], { cwd: dir, encoding: 'utf8' });
  return { status: result.status, output: result.stdout + result.stderr };
}
test('a cited observation passes without claiming fix validation, including CRLF', t => {
  const result = run(t, record(), s => s.replace(/\n/g, '\r\n'));
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /structure valid/);
  assert.match(result.output, /validation=pending/);
});
test('unavailable capture and insufficient diagnosis pass with a next observation', t => {
  const data = record();
  data.milestones.capture = { status: 'not-captured', reason: 'Provider unavailable' };
  data.milestones.inspection = { status: 'insufficient', reason: 'No recording' };
  data.milestones.diagnosis.status = 'insufficient';
  data.milestones.diagnosis.reason = 'No recorded state to inspect';
  data.claims = [{ statement: 'Cause remains unknown', status: 'not-captured', nextObservation: 'Request authorized reproduction' }];
  assert.equal(run(t, data).status, 0);
});
test('a supported claim without a cited observation fails', t => {
  const data = record(); data.claims[0].evidence[0].observation = '';
  const result = run(t, data); assert.equal(result.status, 1); assert.match(result.output, /observation/);
});
test('collecting an archive does not establish inspection or a supported diagnosis', t => {
  const data = record(); data.milestones.inspection = { status: 'insufficient', reason: 'Archive not decoded' };
  const result = run(t, data); assert.equal(result.status, 1); assert.match(result.output, /inspection/);
});
test('an empty diagnostic cannot be reported as supported', t => {
  const data = record(); data.claims = [];
  assert.equal(run(t, data).status, 1);
});
test('missing milestones, missing evidence references and premature validation fail', t => {
  for (const mutate of [d => delete d.milestones.capture, d => delete d.claims[0].evidence[0].reference,
    d => { d.milestones.validation = { status: 'passed' }; },
    d => { d.claims[0] = { statement: 'Unknown', status: 'insufficient' }; }]) {
    const data = record(); mutate(data); const result = run(t, data);
    assert.equal(result.status, 1); assert.match(result.output, /Diagnosis invalid:/);
  }
});
test('malformed JSON, duplicate evidence blocks and missing report fail clearly', t => {
  for (const transform of [s => s.replace('"version":1', '"version":'), s => s + s,
    () => '# Legacy diagnosis without a snapshot contract']) {
    const result = run(t, record(), transform); assert.equal(result.status, 1); assert.match(result.output, /Diagnosis invalid:/);
  }
  const result = spawnSync(process.execPath, [path.join(root, 'tools/aldc-validate/index.js'), '--diagnosis', 'missing.md'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
});
test('the documented insufficient example and generated terminal validators work without project setup', t => {
  const guide = fs.readFileSync(path.join(root, 'skills/skill-debug/references/snapshot-evidence.md'), 'utf8');
  assert.equal(run(t, record(), () => guide).status, 0);
  for (const validator of ['copilot-cli-plugin/tools/aldc-validate/index.js', 'plugins/aldc-codex/skills/aldc/scripts/aldc-validate/index.js']) {
    const result = run(t, record(), s => s, validator);
    assert.equal(result.status, 0, result.output);
    const uncited = record(); uncited.claims[0].evidence = [];
    const invalid = run(t, uncited, s => s, validator);
    assert.equal(invalid.status, 1); assert.match(invalid.output, /cited observations/);
  }
});
test('CLI Triage grants only capture and other roles inherit none of the proxy', () => {
  const { toolsForRole } = require('./copilot-cli-adapter');
  const tools = toolsForRole('al-triage');
  assert.deepEqual(tools.filter(t => t.startsWith('bc-snapshot/')), [
    'bc-snapshot/initialize_snapshot_debugging', 'bc-snapshot/get_snapshot_status', 'bc-snapshot/stop_snapshot_debugging']);
  for (const role of ['al-conductor', 'al-developer', 'al-review-subagent', 'dredd'])
    assert.equal(toolsForRole(role).some(t => t.startsWith('bc-snapshot/')), false);
});
