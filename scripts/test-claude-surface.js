#!/usr/bin/env node
'use strict';
// Tests for the maintained Claude surface hooks: each hook runs the way Claude Code runs it
// (separate process, JSON on stdin) against a temporary AL project.   node --test scripts/test-claude-surface.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOKS = path.resolve(__dirname, '..', 'claude-plugin', 'hooks');
const run = (hook, payload, env = {}) => {
  const r = spawnSync(process.execPath, [path.join(HOOKS, hook)], { input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, ALDC_GATES: '', ...env } });
  assert.strictEqual(r.status, 0, r.stderr);
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
};
const project = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-hooks-'));
  fs.mkdirSync(path.join(dir, 'app', 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'app', 'app.json'), JSON.stringify({ application: '28.0.0.0' }));
  fs.writeFileSync(path.join(dir, 'app', 'src', 'Score.Codeunit.al'), 'codeunit 50100 "Score" { procedure Raise(var Contact: Record Contact) begin Contact.Modify(); end; }');
  return dir;
};
const sid = () => 'test-' + Math.random().toString(36).slice(2);
const RULES = fs.readdirSync(path.resolve(HOOKS, '..', 'rules')).filter((n) => n.endsWith('.md') && n !== 'al-agent-toolkit.md');

test('session-context: human by default, pre-approved through ALDC_GATES', () => {
  const cwd = project();
  assert.match(run('session-context.js', { cwd, session_id: sid() }).hookSpecificOutput.additionalContext, /ALDC autonomy: human/);
  assert.match(run('session-context.js', { cwd, session_id: sid() }, { ALDC_GATES: 'pre-approved' }).hookSpecificOutput.additionalContext, /ALDC autonomy: pre-approved \(from ALDC_GATES\)/);
});

test('session-context: warns when rules are missing and stays silent outside AL projects', () => {
  const out = run('session-context.js', { cwd: project(), session_id: sid() });
  assert.match(out.systemMessage, /ALDC rules are not in \.claude\/rules/);
  assert.strictEqual(run('session-context.js', { cwd: fs.mkdtempSync(path.join(os.tmpdir(), 'no-al-')) }), null);
});

test('agent-brief: ALDC subagent in the foreground, with every rule and the autonomy mode', () => {
  const out = run('agent-brief.js', { cwd: project(), tool_input: { subagent_type: 'aldc:al-implement-subagent', prompt: 'Phase 2', run_in_background: true } }, { ALDC_GATES: 'pre-approved' });
  const u = out.hookSpecificOutput.updatedInput;
  assert.strictEqual(u.run_in_background, false);
  for (const r of RULES) {
    const heading = fs.readFileSync(path.resolve(HOOKS, '..', 'rules', r), 'utf8').match(/^# .+$/m)[0];
    assert.ok(u.prompt.includes(heading), 'missing ' + r);
  }
  assert.match(u.prompt, /ALDC autonomy: pre-approved/);
  assert.match(u.prompt, /Standard Flow: before subscribing/);
});

test('agent-brief: does not duplicate complete rules and leaves other agents alone', () => {
  const cwd = project();
  const first = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-review-subagent', prompt: 'x' } }).hookSpecificOutput.updatedInput.prompt;
  const second = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-review-subagent', prompt: first } }).hookSpecificOutput.updatedInput.prompt;
  assert.strictEqual((second.match(/# AL Testing — Micro Rules/g) || []).length, 1);
  assert.strictEqual(run('agent-brief.js', { cwd, tool_input: { subagent_type: 'Explore', prompt: 'x' } }), null);
});

test('agent-brief: adds the agent SDK rule when the project extends Agent Metadata Provider', () => {
  const cwd = project();
  fs.writeFileSync(path.join(cwd, 'app', 'src', 'A.EnumExt.al'), 'enumextension 50101 "A" extends "Agent Metadata Provider" { }');
  const p = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-review-subagent', prompt: 'x' } }).hookSpecificOutput.updatedInput.prompt;
  assert.match(p, /Completeness checklist/);
});

test('stop-guard: in pre-approved blocks an unfinished plan at most 3 times and honours blocked.md', () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const plan = path.join(cwd, '.claude', 'plans', 'feat');
  fs.mkdirSync(plan, { recursive: true });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), '**Phase 1: A**\n**Phase 2: B**');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s }), null, 'human mode never blocks');
  const blocks = [1, 2, 3, 4].map(() => run('stop-guard.js', { cwd, session_id: s }, { ALDC_GATES: 'pre-approved' }));
  assert.deepStrictEqual(blocks.map((b) => b?.decision ?? null), ['block', 'block', 'block', null]);
  const s2 = sid(); run('session-context.js', { cwd, session_id: s2 });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), '**Phase 1: A**');
  fs.writeFileSync(path.join(plan, 'blocked.md'), 'missing symbols');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s2 }, { ALDC_GATES: 'pre-approved' }), null);
});

test('stop-guard: the final <task>-complete.md report closes the plan', () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const plan = path.join(cwd, '.claude', 'plans', 'feat');
  fs.mkdirSync(plan, { recursive: true });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), '**Phase 1: A**');
  fs.writeFileSync(path.join(plan, 'feat-complete.md'), 'done');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s }, { ALDC_GATES: 'pre-approved' }), null);
});

test('flow-scout: blocks once a subscriber to a publisher nobody inspected', () => {
  const cwd = project(); const s = sid();
  const write = { cwd, session_id: s, tool_name: 'Write', tool_input: { file_path: path.join(cwd, 'app', 'src', 'H.Codeunit.al'),
    content: "[EventSubscriber(ObjectType::Codeunit, Codeunit::\"Release Sales Document\", 'OnAfterReleaseSalesDoc', '', false, false)]" } };
  assert.strictEqual(run('flow-scout.js', write).hookSpecificOutput.permissionDecision, 'deny');
  assert.strictEqual(run('flow-scout.js', write), null, 'only once per publisher');
});

test('flow-scout: does not block when the publisher was inspected first', () => {
  const cwd = project(); const s = sid();
  run('flow-scout.js', { cwd, session_id: s, tool_name: 'mcp__plugin_aldc_al-symbols-mcp__al_search_object_members', tool_input: { objectName: 'Release Sales Document', memberType: 'procedures' } });
  const out = run('flow-scout.js', { cwd, session_id: s, tool_name: 'Edit', tool_input: { file_path: path.join(cwd, 'app', 'src', 'H.Codeunit.al'),
    new_string: "[EventSubscriber(ObjectType::Codeunit, Codeunit::\"Release Sales Document\", 'OnAfterReleaseSalesDoc', '', false, false)]" } });
  assert.strictEqual(out, null);
});

test('send-guard: blocks SendMessage while an ALDC plan is open and allows it otherwise', () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const msg = { cwd, session_id: s, tool_name: 'SendMessage', tool_input: { to: 'a1', message: 'Implement phase 3' } };
  assert.strictEqual(run('send-guard.js', msg), null, 'no plan: allowed');
  const plan = path.join(cwd, '.claude', 'plans', 'feat');
  fs.mkdirSync(plan, { recursive: true });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), 'plan');
  assert.strictEqual(run('send-guard.js', msg).hookSpecificOutput.permissionDecision, 'deny');
  fs.writeFileSync(path.join(plan, 'feat-complete.md'), 'done');
  assert.strictEqual(run('send-guard.js', msg), null, 'closed plan: allowed');
});

test('session state: concurrent Flow Scout writes keep the session start', async () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const { spawn } = require('child_process');
  await Promise.all(Array.from({ length: 12 }, (_, i) => new Promise((res) => {
    const p = spawn(process.execPath, [path.join(HOOKS, 'flow-scout.js')]);
    p.on('close', res);
    p.stdin.end(JSON.stringify({ cwd, session_id: s, tool_name: 'Read', tool_input: { file_path: 'x' + i + '.al' } }));
  })));
  const state = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), `aldc-claude-session-${s}.json`), 'utf8'));
  assert.ok(state.start, 'session start kept');
});

test('artifact-gate: rejects a review report without security checks or BCQuality dispositions', () => {
  const cwd = project();
  const f = path.join(cwd, 'feat-review-phase-5.json');
  const write = (obj) => { fs.writeFileSync(f, JSON.stringify(obj)); return run('artifact-gate.js', { cwd, tool_name: 'Write', tool_input: { file_path: f } }); };
  const security = { checks: ['write-scope', 'permission-sets', 'secrets', 'event-bypass', 'table-validation'].map((check) => ({ check, status: 'ok' })) };
  const noArticles = write({ review: { security, bcquality: { outcome: 'completed' } } });
  assert.strictEqual(noArticles.decision, 'block');
  assert.match(noArticles.reason, /articles is missing/);
  assert.match(write({ review: { bcquality: { outcome: 'not-applicable' } } }).reason, /review\.security lacks/);
  assert.match(write({ review: { security, bcquality: { outcome: 'selection-completed', articles: [{ path: 'a.md', status: 'dismissed', reason: 'not requested by the requirement' }] } } }).reason, /without a valid disposition/);
  assert.strictEqual(write({ review: { security, bcquality: { outcome: 'selection-completed', articles: [{ path: 'a.md', status: 'applied' }] } } }), null);
});

test('artifact-gate: rejects an uncommented EventSubscriber and accepts a commented one', () => {
  const cwd = project();
  const f = path.join(cwd, 'app', 'src', 'H.Codeunit.al');
  fs.writeFileSync(f, "codeunit 50101 H {\n    [EventSubscriber(ObjectType::Table, Database::Contact, 'OnAfterInsertEvent', '', false, false)]\n    local procedure A() begin end;\n}");
  assert.strictEqual(run('artifact-gate.js', { cwd, tool_name: 'Write', tool_input: { file_path: f } }).decision, 'block');
  fs.writeFileSync(f, "codeunit 50101 H {\n    // After insert: the contact exists, so its number is final.\n    [InherentPermissions(PermissionObjectType::TableData, Database::Contact, 'r')]\n    [EventSubscriber(ObjectType::Table, Database::Contact, 'OnAfterInsertEvent', '', false, false)]\n    local procedure A() begin end;\n}");
  assert.strictEqual(run('artifact-gate.js', { cwd, tool_name: 'Write', tool_input: { file_path: f } }), null);
});

test('session-context: announces the test runner when the project declares one', () => {
  const cwd = project();
  assert.match(run('session-context.js', { cwd, session_id: sid() }).hookSpecificOutput.additionalContext, /no test runner configured/);
  fs.writeFileSync(path.join(cwd, 'aldc.yaml'), 'testing:\n  runner: "node tools/l4.js --codeunits all"\n');
  assert.match(run('session-context.js', { cwd, session_id: sid() }).hookSpecificOutput.additionalContext, /ALDC tests: run `node tools\/l4\.js --codeunits all`/);
});

test('stop-guard: a PARTIAL final report does not close the plan; blocked.md does', () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const plan = path.join(cwd, '.claude', 'plans', 'feat');
  fs.mkdirSync(plan, { recursive: true });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), 'plan');
  fs.writeFileSync(path.join(plan, 'feat-complete.md'), '## Plan Complete: Feat — PARTIAL (6 of 8 phases)\n\n**Status: NOT complete.**');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s }, { ALDC_GATES: 'pre-approved' }).decision, 'block');
  fs.writeFileSync(path.join(plan, 'blocked.md'), 'usage limit: phases 7-8 left');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s }, { ALDC_GATES: 'pre-approved' }), null);
});
