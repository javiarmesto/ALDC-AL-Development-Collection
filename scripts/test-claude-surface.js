#!/usr/bin/env node
'use strict';
// Tests de los hooks de aldc-claude: se ejecutan como los ejecuta Claude Code (proceso aparte,
// JSON por stdin) sobre un proyecto AL temporal.   node --test scripts/test-claude-surface.js
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

test('session-context: modo human por defecto y pre-approved con ALDC_GATES', () => {
  const cwd = project();
  assert.match(run('session-context.js', { cwd, session_id: sid() }).hookSpecificOutput.additionalContext, /ALDC autonomy: human/);
  assert.match(run('session-context.js', { cwd, session_id: sid() }, { ALDC_GATES: 'pre-approved' }).hookSpecificOutput.additionalContext, /ALDC autonomy: pre-approved \(from ALDC_GATES\)/);
});

test('session-context: avisa si faltan las reglas y calla fuera de proyectos AL', () => {
  const out = run('session-context.js', { cwd: project(), session_id: sid() });
  assert.match(out.systemMessage, /ALDC rules are not in \.claude\/rules/);
  assert.strictEqual(run('session-context.js', { cwd: fs.mkdtempSync(path.join(os.tmpdir(), 'no-al-')) }), null);
});

test('session-context: without the BCQuality plugin it warns with both install commands and has Claude offer the install', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-home-'));
  fs.mkdirSync(path.join(home, '.claude', 'plugins'), { recursive: true });
  const installed = path.join(home, '.claude', 'plugins', 'installed_plugins.json');
  const env = { HOME: home, USERPROFILE: home, BCQUALITY_HOME: '' };
  fs.writeFileSync(installed, JSON.stringify({ plugins: { 'aldc@aldc-marketplace': [{}] } }));
  const out = run('session-context.js', { cwd: project(), session_id: sid() }, env);
  assert.match(out.systemMessage, /BCQuality plugin is not installed/);
  assert.match(out.systemMessage, /claude plugin marketplace add https:\/\/github\.com\/microsoft\/BCQuality\.git, then claude plugin install bcquality@bcquality/);
  assert.match(out.hookSpecificOutput.additionalContext, /offer to install it/);
  assert.match(out.hookSpecificOutput.additionalContext, /Run them only if the user agrees/);
  fs.writeFileSync(installed, JSON.stringify({ plugins: { 'bcquality@bcquality': [{}] } }));
  const ok = run('session-context.js', { cwd: project(), session_id: sid() }, env);
  assert.doesNotMatch(ok.hookSpecificOutput.additionalContext, /BCQuality (plugin )?is not installed/);
});

test('session-context: con subagentes en segundo plano pide esperar y, en pre-approved, avisa de la variable', () => {
  const human = run('session-context.js', { cwd: project(), session_id: sid() }, { CLAUDE_CODE_DISABLE_BACKGROUND_TASKS: '' });
  assert.match(human.hookSpecificOutput.additionalContext, /do not end your turn or write "waiting"/);
  assert.doesNotMatch(human.systemMessage || '', /CLAUDE_CODE_DISABLE_BACKGROUND_TASKS/);
  const auto = run('session-context.js', { cwd: project(), session_id: sid() }, { CLAUDE_CODE_DISABLE_BACKGROUND_TASKS: '', ALDC_GATES: 'pre-approved' });
  assert.match(auto.systemMessage, /Set CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1/);
  const off = run('session-context.js', { cwd: project(), session_id: sid() }, { CLAUDE_CODE_DISABLE_BACKGROUND_TASKS: '1', ALDC_GATES: 'pre-approved' });
  assert.doesNotMatch(off.hookSpecificOutput.additionalContext, /moved to the background|Background subagents are enabled/);
});

test('session-context: avisa si la BCQuality instalada no trae al-knowledge', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-home-'));
  fs.mkdirSync(path.join(home, '.claude', 'plugins'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'plugins', 'installed_plugins.json'), JSON.stringify({ plugins: { 'bcquality@bcquality': [{}] } }));
  const bcq = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-bcq-'));
  fs.writeFileSync(path.join(bcq, 'plugin.json'), JSON.stringify({ version: '0.2.0' }));
  const env = { HOME: home, USERPROFILE: home, BCQUALITY_HOME: bcq };
  const old = run('session-context.js', { cwd: project(), session_id: sid() }, env);
  assert.match(old.systemMessage, /BCQuality \(0\.2\.0\) has no al-knowledge skill/);
  fs.mkdirSync(path.join(bcq, 'skills', 'al-knowledge'), { recursive: true });
  fs.writeFileSync(path.join(bcq, 'skills', 'al-knowledge', 'SKILL.md'), '---\nname: al-knowledge\n---\n');
  const ok = run('session-context.js', { cwd: project(), session_id: sid() }, env);
  assert.doesNotMatch(ok.hookSpecificOutput.additionalContext, /no al-knowledge skill/);
});

test('agent-brief: subagente ALDC en primer plano, con todas las reglas y el modo autónomo', () => {
  const out = run('agent-brief.js', { cwd: project(), tool_input: { subagent_type: 'aldc:al-implement-subagent', prompt: 'Phase 2', run_in_background: true } }, { ALDC_GATES: 'pre-approved' });
  const u = out.hookSpecificOutput.updatedInput;
  assert.strictEqual(u.run_in_background, false);
  for (const r of RULES) {
    const heading = fs.readFileSync(path.resolve(HOOKS, '..', 'rules', r), 'utf8').match(/^# .+$/m)[0];
    assert.ok(u.prompt.includes(heading), 'falta ' + r);
  }
  assert.match(u.prompt, /ALDC autonomy: pre-approved/);
  assert.match(u.prompt, /Standard Flow: before subscribing/);
});

test('agent-brief: no duplica reglas que ya van completas y no toca otros agentes', () => {
  const cwd = project();
  const first = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-review-subagent', prompt: 'x' } }).hookSpecificOutput.updatedInput.prompt;
  const second = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-review-subagent', prompt: first } }).hookSpecificOutput.updatedInput.prompt;
  assert.strictEqual((second.match(/# AL Testing — Micro Rules/g) || []).length, 1);
  assert.strictEqual(run('agent-brief.js', { cwd, tool_input: { subagent_type: 'Explore', prompt: 'x' } }), null);
});

test('agent-brief: la regla del SDK de agentes va cuando el proyecto extiende Agent Metadata Provider', () => {
  const cwd = project();
  fs.writeFileSync(path.join(cwd, 'app', 'src', 'A.EnumExt.al'), 'enumextension 50101 "A" extends "Agent Metadata Provider" { }');
  const p = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-review-subagent', prompt: 'x' } }).hookSpecificOutput.updatedInput.prompt;
  assert.match(p, /Completeness checklist/);
});

test('agent-brief: Architect y Spec reciben candidatos manuales etiquetados, con procedencia, y la ruta al-knowledge si existe', () => {
  const cwd = project();
  const bcq = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-bcq-'));
  fs.mkdirSync(path.join(bcq, 'community', 'knowledge', 'perf'), { recursive: true });
  fs.writeFileSync(path.join(bcq, 'community', 'knowledge', 'perf', 'modify.md'), '---\ndomain: performance\nkeywords: [contact-modify, record-modify, lead-score]\n---\n# Avoid redundant Modify\n');
  fs.writeFileSync(path.join(bcq, 'plugin.json'), JSON.stringify({ name: 'bcquality', version: '9.9.9' }));
  const env = { BCQUALITY_HOME: bcq };
  for (const role of ['aldc:al-architect', 'aldc:al-spec-agent']) {
    const p = run('agent-brief.js', { cwd, tool_input: { subagent_type: role, prompt: 'Lead Score on Contact' } }, env).hookSpecificOutput.updatedInput.prompt;
    assert.match(p, /## BCQuality candidates \(ALDC hook keyword match .*NOT a BCQuality consultation\)/, role);
    assert.match(p, /Provenance: root .* \(env\) · bcquality 9\.9\.9/, role);
    assert.match(p, /knowledge\/perf\/modify\.md/, role);
    assert.match(p, /selection: manual/, role);
    assert.match(p, /route: hook-candidates/, role);
    assert.match(p, /never place them in responses\[\]/, role);
    assert.match(p, /no al-knowledge skill/, role);
    const again = run('agent-brief.js', { cwd, tool_input: { subagent_type: role, prompt: p } }, env).hookSpecificOutput.updatedInput.prompt;
    assert.strictEqual((again.match(/## BCQuality candidates/g) || []).length, 1, role);
  }
  fs.mkdirSync(path.join(bcq, 'skills', 'al-knowledge'), { recursive: true });
  fs.writeFileSync(path.join(bcq, 'skills', 'al-knowledge', 'SKILL.md'), '---\nname: al-knowledge\n---\n');
  const withSkill = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-architect', prompt: 'Lead Score on Contact' } }, env).hookSpecificOutput.updatedInput.prompt;
  assert.match(withSkill, /consult `bcquality:al-knowledge` with the Skill tool/);
  assert.match(withSkill, /verbatim/);
  assert.match(withSkill, /only loads instructions and runs nothing/);
  for (const role of ['aldc:al-planning-subagent', 'aldc:al-implement-subagent']) {
    const p = run('agent-brief.js', { cwd, tool_input: { subagent_type: role, prompt: 'Lead Score on Contact' } }, env).hookSpecificOutput.updatedInput.prompt;
    assert.doesNotMatch(p, /## BCQuality (candidates|knowledge)/, role);
  }
});

test('agent-brief: la selección del revisor se declara coincidencia de ALDC, no ejecución del proveedor', () => {
  const cwd = project();
  const bcq = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-bcq-'));
  fs.mkdirSync(path.join(bcq, 'community', 'knowledge', 'perf'), { recursive: true });
  fs.writeFileSync(path.join(bcq, 'community', 'knowledge', 'perf', 'modify.md'), '---\ndomain: performance\nkeywords: [contact-modify, record-modify]\n---\n# Avoid redundant Modify\n');
  const p = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-review-subagent', prompt: 'Review phase 1' } }, { BCQUALITY_HOME: bcq }).hookSpecificOutput.updatedInput.prompt;
  assert.match(p, /## BCQuality selection \(ALDC keyword match .*not a BCQuality provider execution\)/);
});

test('agent-brief: external.bcquality.enabled false means no BCQuality articles for any role', () => {
  const cwd = project();
  fs.writeFileSync(path.join(cwd, 'aldc.yaml'), 'external:\n  bcquality:\n    mode: "plugin"\n    enabled: false   # opt-out\n');
  const bcq = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-bcq-'));
  fs.mkdirSync(path.join(bcq, 'community', 'knowledge', 'perf'), { recursive: true });
  fs.writeFileSync(path.join(bcq, 'community', 'knowledge', 'perf', 'modify.md'), '---\ndomain: performance\nkeywords: [contact-modify, record-modify, lead-score]\n---\n# Avoid redundant Modify\n');
  const env = { BCQUALITY_HOME: bcq };
  for (const role of ['aldc:al-architect', 'aldc:al-spec-agent', 'aldc:al-planning-subagent', 'aldc:al-review-subagent']) {
    const p = run('agent-brief.js', { cwd, tool_input: { subagent_type: role, prompt: 'Lead Score on Contact' } }, env).hookSpecificOutput.updatedInput.prompt;
    assert.doesNotMatch(p, /## BCQuality (knowledge|selection)/, role);
    assert.doesNotMatch(p, /modify\.md/, role);
  }
});

test('stop-guard: en pre-approved bloquea un plan a medias como mucho 3 veces y respeta blocked.md', () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const plan = path.join(cwd, '.claude', 'plans', 'feat');
  fs.mkdirSync(plan, { recursive: true });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), '**Phase 1: A**\n**Phase 2: B**');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s }), null, 'human no bloquea');
  const blocks = [1, 2, 3, 4].map(() => run('stop-guard.js', { cwd, session_id: s }, { ALDC_GATES: 'pre-approved' }));
  assert.deepStrictEqual(blocks.map((b) => b?.decision ?? null), ['block', 'block', 'block', null]);
  const s2 = sid(); run('session-context.js', { cwd, session_id: s2 });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), '**Phase 1: A**');
  fs.writeFileSync(path.join(plan, 'blocked.md'), 'missing symbols');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s2 }, { ALDC_GATES: 'pre-approved' }), null);
});

test('stop-guard: el informe final <task>-complete.md cierra el plan', () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const plan = path.join(cwd, '.claude', 'plans', 'feat');
  fs.mkdirSync(plan, { recursive: true });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), '**Phase 1: A**');
  fs.writeFileSync(path.join(plan, 'feat-complete.md'), 'done');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s }, { ALDC_GATES: 'pre-approved' }), null);
});

test('flow-scout: bloquea una vez un suscriptor a un publisher no investigado', () => {
  const cwd = project(); const s = sid();
  const write = { cwd, session_id: s, tool_name: 'Write', tool_input: { file_path: path.join(cwd, 'app', 'src', 'H.Codeunit.al'),
    content: "[EventSubscriber(ObjectType::Codeunit, Codeunit::\"Release Sales Document\", 'OnAfterReleaseSalesDoc', '', false, false)]" } };
  assert.strictEqual(run('flow-scout.js', write).hookSpecificOutput.permissionDecision, 'deny');
  assert.strictEqual(run('flow-scout.js', write), null, 'solo una vez por publisher');
});

test('flow-scout: no bloquea si el publisher se investigó antes', () => {
  const cwd = project(); const s = sid();
  run('flow-scout.js', { cwd, session_id: s, tool_name: 'mcp__plugin_aldc_al-symbols-mcp__al_search_object_members', tool_input: { objectName: 'Release Sales Document', memberType: 'procedures' } });
  const out = run('flow-scout.js', { cwd, session_id: s, tool_name: 'Edit', tool_input: { file_path: path.join(cwd, 'app', 'src', 'H.Codeunit.al'),
    new_string: "[EventSubscriber(ObjectType::Codeunit, Codeunit::\"Release Sales Document\", 'OnAfterReleaseSalesDoc', '', false, false)]" } });
  assert.strictEqual(out, null);
});

test('send-guard: bloquea SendMessage con un plan de ALDC abierto y lo deja pasar sin plan', () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const msg = { cwd, session_id: s, tool_name: 'SendMessage', tool_input: { to: 'a1', message: 'Implement phase 3' } };
  assert.strictEqual(run('send-guard.js', msg), null, 'sin plan, pasa');
  const plan = path.join(cwd, '.claude', 'plans', 'feat');
  fs.mkdirSync(plan, { recursive: true });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), 'plan');
  assert.strictEqual(run('send-guard.js', msg).hookSpecificOutput.permissionDecision, 'deny');
  fs.writeFileSync(path.join(plan, 'feat-complete.md'), 'done');
  assert.strictEqual(run('send-guard.js', msg), null, 'plan cerrado, pasa');
});

test('estado de sesión: Flow Scout en paralelo no borra la hora de inicio', async () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const { spawn } = require('child_process');
  await Promise.all(Array.from({ length: 12 }, (_, i) => new Promise((res) => {
    const p = spawn(process.execPath, [path.join(HOOKS, 'flow-scout.js')]);
    p.on('close', res);
    p.stdin.end(JSON.stringify({ cwd, session_id: s, tool_name: 'Read', tool_input: { file_path: 'x' + i + '.al' } }));
  })));
  const state = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), `aldc-claude-session-${s}.json`), 'utf8'));
  assert.ok(state.start, 'la hora de inicio sigue');
});

test('artifact-gate: bloquea un informe de revisión sin seguridad o sin artículos de BCQuality', () => {
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

test('artifact-gate: bloquea un EventSubscriber sin comentario y acepta el comentado', () => {
  const cwd = project();
  const f = path.join(cwd, 'app', 'src', 'H.Codeunit.al');
  fs.writeFileSync(f, "codeunit 50101 H {\n    [EventSubscriber(ObjectType::Table, Database::Contact, 'OnAfterInsertEvent', '', false, false)]\n    local procedure A() begin end;\n}");
  assert.strictEqual(run('artifact-gate.js', { cwd, tool_name: 'Write', tool_input: { file_path: f } }).decision, 'block');
  fs.writeFileSync(f, "codeunit 50101 H {\n    // After insert: the contact exists, so its number is final.\n    [InherentPermissions(PermissionObjectType::TableData, Database::Contact, 'r')]\n    [EventSubscriber(ObjectType::Table, Database::Contact, 'OnAfterInsertEvent', '', false, false)]\n    local procedure A() begin end;\n}");
  assert.strictEqual(run('artifact-gate.js', { cwd, tool_name: 'Write', tool_input: { file_path: f } }), null);
});

test('session-context: anuncia el runner de tests si el proyecto lo declara', () => {
  const cwd = project();
  assert.match(run('session-context.js', { cwd, session_id: sid() }).hookSpecificOutput.additionalContext, /no test runner configured/);
  fs.writeFileSync(path.join(cwd, 'aldc.yaml'), 'testing:\n  runner: "node tools/l4.js --codeunits all"\n');
  assert.match(run('session-context.js', { cwd, session_id: sid() }).hookSpecificOutput.additionalContext, /ALDC tests: run `node tools\/l4\.js --codeunits all`/);
});

test('stop-guard: un informe final PARTIAL no cierra el plan; blocked.md sí', () => {
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
