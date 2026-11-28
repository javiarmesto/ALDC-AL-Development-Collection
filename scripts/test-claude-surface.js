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
  const r = spawnSync(process.execPath, [path.join(HOOKS, hook)], { input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, ALDC_GATES: '', CLAUDE_CONFIG_DIR: '', ...env } });
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
// A Claude config with no plugins: BCQuality absent, so brake 2 is not required.
const NO_BCQ = { CLAUDE_CONFIG_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-nocfg-')), BCQUALITY_HOME: '' };
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
  const out = run('agent-brief.js', { cwd: project(), tool_input: { subagent_type: 'aldc:al-implementer', prompt: 'Phase 2', run_in_background: true } }, { ALDC_GATES: 'pre-approved' });
  const u = out.hookSpecificOutput.updatedInput;
  assert.strictEqual(u.run_in_background, false);
  for (const r of RULES) {
    const heading = fs.readFileSync(path.resolve(HOOKS, '..', 'rules', r), 'utf8').match(/^# .+$/m)[0];
    assert.ok(u.prompt.includes(heading), 'falta ' + r);
  }
  assert.match(u.prompt, /ALDC autonomy: pre-approved/);
  assert.match(u.prompt, /Standard Flow: before subscribing/);
});

test('5.5.0: SubagentStart briefs ALDC subagents no PreToolUse briefed (workflow agents), never twice', () => {
  const cwd = project();
  const session = sid();
  const start = (type) => run('agent-brief.js', { hook_event_name: 'SubagentStart', agent_type: type, cwd, session_id: session }, { ALDC_GATES: 'pre-approved' });
  const ctx = start('aldc:al-implementer').hookSpecificOutput;
  assert.strictEqual(ctx.hookEventName, 'SubagentStart');
  for (const r of RULES) assert.ok(ctx.additionalContext.includes(fs.readFileSync(path.resolve(HOOKS, '..', 'rules', r), 'utf8').match(/^# .+$/m)[0]), 'falta ' + r);
  assert.match(ctx.additionalContext, /ALDC autonomy: pre-approved/);
  run('agent-brief.js', { cwd, session_id: session, tool_input: { subagent_type: 'aldc:al-implementer', prompt: 'Phase 1' } });
  assert.strictEqual(start('aldc:al-implementer'), null, 'already briefed through PreToolUse');
  assert.ok(start('aldc:al-implementer'), 'the claim is used once');
  assert.strictEqual(start('general-purpose'), null);
  const hooks = JSON.parse(fs.readFileSync(path.join(HOOKS, 'hooks.json'), 'utf8')).hooks;
  assert.ok(hooks.SubagentStart.some((h) => h.matcher === '^aldc(-extras)?:' && h.hooks.some((c) => c.command.includes('agent-brief.js'))));
});

test('5.5.0: aldc declares aldc-verify and bcquality as dependencies and the session flags a missing or doubled aldc-verify', () => {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(HOOKS, '..', '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.deepStrictEqual(manifest.dependencies.map((d) => d.name), ['aldc-verify', 'bcquality']);
  assert.strictEqual(manifest.dependencies.find((d) => d.name === 'bcquality').marketplace, 'bcquality');
  const rootMarket = path.resolve(HOOKS, '..', '..', '.claude-plugin', 'marketplace.json');
  if (fs.existsSync(rootMarket)) {
    const market = JSON.parse(fs.readFileSync(rootMarket, 'utf8'));
    assert.deepStrictEqual(market.allowCrossMarketplaceDependenciesOn, ['bcquality']);
    const aldc = market.plugins.find((p) => p.name === 'aldc');
    assert.deepStrictEqual(aldc.dependencies, manifest.dependencies, 'repeated in the entry so a blocked install fails loudly');
    assert.deepStrictEqual(market.plugins.find((p) => p.name === 'aldc-verify').source, { source: 'github', repo: 'javiarmesto/aldc-verify-plugin', ref: 'v0.4.1' });
  }
  const cfg = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-cfg-'));
  fs.mkdirSync(path.join(cfg, 'plugins'));
  const installed = (ids) => fs.writeFileSync(path.join(cfg, 'plugins', 'installed_plugins.json'), JSON.stringify({ plugins: Object.fromEntries(ids.map((k) => [k, [{}]])) }));
  const warn = () => run('session-context.js', { cwd: project(), session_id: sid() }, { CLAUDE_CONFIG_DIR: cfg }).systemMessage || '';
  installed(['aldc@aldc-marketplace', 'bcquality@bcquality']);
  assert.match(warn(), /aldc-verify is not installed or is disabled, although aldc requires it/);
  installed(['aldc@aldc-marketplace', 'bcquality@bcquality', 'aldc-verify@aldc-marketplace', 'aldc-verify@aldc-verify-dev']);
  assert.match(warn(), /aldc-verify is enabled 2 times .*claude plugin uninstall aldc-verify@aldc-verify-dev/);
  fs.writeFileSync(path.join(cfg, 'settings.json'), JSON.stringify({ enabledPlugins: { 'aldc-verify@aldc-verify-dev': false } }));
  assert.doesNotMatch(warn(), /aldc-verify is/);
});

test('agent-brief: no duplica reglas que ya van completas y no toca otros agentes', () => {
  const cwd = project();
  const first = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-reviewer', prompt: 'x' } }).hookSpecificOutput.updatedInput.prompt;
  const second = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-reviewer', prompt: first } }).hookSpecificOutput.updatedInput.prompt;
  assert.strictEqual((second.match(/# AL Testing — Micro Rules/g) || []).length, 1);
  assert.strictEqual(run('agent-brief.js', { cwd, tool_input: { subagent_type: 'Explore', prompt: 'x' } }), null);
});

test('agent-brief: la regla del SDK de agentes va cuando el proyecto extiende Agent Metadata Provider', () => {
  const cwd = project();
  fs.writeFileSync(path.join(cwd, 'app', 'src', 'A.EnumExt.al'), 'enumextension 50101 "A" extends "Agent Metadata Provider" { }');
  const p = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-reviewer', prompt: 'x' } }).hookSpecificOutput.updatedInput.prompt;
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
  for (const role of ['aldc:al-researcher', 'aldc:al-implementer']) {
    const p = run('agent-brief.js', { cwd, tool_input: { subagent_type: role, prompt: 'Lead Score on Contact' } }, env).hookSpecificOutput.updatedInput.prompt;
    assert.doesNotMatch(p, /## BCQuality (candidates|knowledge)/, role);
  }
});

test('agent-brief: la selección del revisor se declara coincidencia de ALDC, no ejecución del proveedor', () => {
  const cwd = project();
  const bcq = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-bcq-'));
  fs.mkdirSync(path.join(bcq, 'community', 'knowledge', 'perf'), { recursive: true });
  fs.writeFileSync(path.join(bcq, 'community', 'knowledge', 'perf', 'modify.md'), '---\ndomain: performance\nkeywords: [contact-modify, record-modify]\n---\n# Avoid redundant Modify\n');
  const p = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-reviewer', prompt: 'Review phase 1' } }, { BCQUALITY_HOME: bcq }).hookSpecificOutput.updatedInput.prompt;
  assert.match(p, /## BCQuality selection \(ALDC keyword match .*not a BCQuality provider execution\)/);
});

test('agent-brief: external.bcquality.enabled false means no BCQuality articles for any role', () => {
  const cwd = project();
  fs.writeFileSync(path.join(cwd, 'aldc.yaml'), 'external:\n  bcquality:\n    mode: "plugin"\n    enabled: false   # opt-out\n');
  const bcq = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-bcq-'));
  fs.mkdirSync(path.join(bcq, 'community', 'knowledge', 'perf'), { recursive: true });
  fs.writeFileSync(path.join(bcq, 'community', 'knowledge', 'perf', 'modify.md'), '---\ndomain: performance\nkeywords: [contact-modify, record-modify, lead-score]\n---\n# Avoid redundant Modify\n');
  const env = { BCQUALITY_HOME: bcq };
  for (const role of ['aldc:al-architect', 'aldc:al-spec-agent', 'aldc:al-researcher', 'aldc:al-reviewer']) {
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
  verifyState(cwd, 'green');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s }, { ALDC_GATES: 'pre-approved', ...NO_BCQ }), null);
});

// aldc-verify's gate state: one history entry `at` now + offset ms.
const verifyState = (cwd, status, offset = 5000) => {
  const dir = path.join(cwd, '.claude', '.aldc-verify');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify({ history: [{ at: new Date(Date.now() + offset).toISOString(), status }] }));
};

test('5.5.0: stop-guard does not let a final report close on a red or stale build, untested passes or tables without permissions', () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const plan = path.join(cwd, '.claude', 'plans', 'feat');
  fs.mkdirSync(plan, { recursive: true });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), '**Phase 1: A**');
  const report = path.join(plan, 'feat-complete.md');
  const stop = () => run('stop-guard.js', { cwd, session_id: sid() === s ? s : s }, { ALDC_GATES: 'pre-approved', ...NO_BCQ });
  const fresh = () => { const s2 = sid(); run('session-context.js', { cwd, session_id: s2 }); return () => run('stop-guard.js', { cwd, session_id: s2 }, { ALDC_GATES: 'pre-approved', ...NO_BCQ }); };
  fs.writeFileSync(report, '| Compilation | passed |\n| Tests executed | not-run: no runner |');
  verifyState(cwd, 'red');
  assert.match(stop().reason, /Build: last compile: red/);
  verifyState(cwd, 'green', -60000);
  assert.match(fresh()().reason, /Build: AL changed at .* after the last green compile/);
  verifyState(cwd, 'green');
  assert.strictEqual(fresh()(), null, 'green, fresh, honest report');
  fs.writeFileSync(report, '| Compilation | passed |\n| Tests executed | passed (12/12) |');
  assert.match(fresh()().reason, /Tests: no test runner is configured.*passed \(12\/12\)/);
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: (() => { const s3 = sid(); run('session-context.js', { cwd, session_id: s3 }); return s3; })() }, { ALDC_GATES: 'pre-approved', ALDC_TEST_RUNNER: 'pwsh Run-Tests.ps1', ...NO_BCQ }), null, 'with a runner a pass is a claim it can back');
  fs.writeFileSync(report, '| Tests executed | not-run |');
  fs.writeFileSync(path.join(cwd, 'app', 'src', 'Lead.Table.al'), 'table 50100 "DR Lead" { fields { field(1; "No."; Code[20]) { } } }');
  fs.writeFileSync(path.join(cwd, 'app', 'src', 'Perm.PermissionSet.al'), 'permissionset 50100 "DR Base" { Permissions = codeunit "Score" = X; }');
  verifyState(cwd, 'green');
  assert.match(fresh()().reason, /Permissions: no permission set gives tabledata access to dr lead \(app\/src\/Lead\.Table\.al\)/);
  fs.writeFileSync(path.join(cwd, 'app', 'src', 'Perm.PermissionSet.al'), 'permissionset 50100 "DR Base" { Permissions = tabledata "DR Lead" = RIMD; }');
  verifyState(cwd, 'green');
  assert.strictEqual(fresh()(), null);
  fs.rmSync(path.join(cwd, '.claude', '.aldc-verify'), { recursive: true });
  assert.match(fresh()().reason, /no green compile evidence .*state "build: not-run"/);
  fs.writeFileSync(report, '| Build | not-run: no AL compiler on this machine |\n| Tests executed | not-run |');
  assert.strictEqual(fresh()(), null, 'an honest degradation closes');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s }), null, 'human mode never blocks');
});

test('5.5.0: with BCQuality installed, pre-approved needs a certified-review verdict for the current code', () => {
  const cwd = project();
  const bcq = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-bcq-'));
  const env = { ALDC_GATES: 'pre-approved', BCQUALITY_HOME: bcq };
  const plan = path.join(cwd, '.claude', 'plans', 'feat');
  fs.mkdirSync(plan, { recursive: true });
  fs.writeFileSync(path.join(plan, 'feat-plan.md'), '**Phase 1: A**');
  const report = path.join(plan, 'feat-complete.md');
  const stop = () => { const s = sid(); run('session-context.js', { cwd, session_id: s }); return run('stop-guard.js', { cwd, session_id: s }, env); };
  fs.writeFileSync(report, '| Tests executed | not-run |');
  verifyState(cwd, 'green');
  assert.match(stop().reason, /BCQuality: no certified review ran for this code/);
  const audits = path.join(cwd, '.claude', 'audits');
  fs.mkdirSync(audits, { recursive: true });
  const verdict = (v) => fs.writeFileSync(path.join(audits, 'bcquality-certified-20261116-120000.verdict.json'), JSON.stringify({ verdict: v }));
  verdict('certified');
  assert.strictEqual(stop(), null);
  verdict('not-certified');
  assert.match(stop().reason, /verdict is not-certified .*must say "BCQuality review: not certified"/);
  fs.writeFileSync(report, '| Tests executed | not-run |\n| BCQuality review | not certified: 2 leaves failed (bcquality-certified-20261116-120000.verdict.json) |');
  assert.strictEqual(stop(), null);
  const cli = path.resolve(HOOKS, '..', 'tools', 'bcquality', 'certified-review.js');
  assert.ok(fs.existsSync(cli));
  assert.match(fs.readFileSync(path.resolve(HOOKS, '..', 'agents', 'al-conductor.md'), 'utf8'), /certified-review\.js" --project \. --base main --detach/);
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

// ─── 5.4.0: merged agents and their deprecated aliases ─────────────────────────────────────
const PLUGIN = path.resolve(HOOKS, '..');
const AGENTS_DIR = path.join(PLUGIN, 'agents');
const ALIASES = {
  'al-developer': ['al-implementer', 'direct'], 'al-implement-subagent': ['al-implementer', 'phase'],
  'al-review-subagent': ['al-reviewer', 'phase'], 'al-developer-reviewer': ['al-reviewer', 'increment'],
  dredd: ['al-reviewer', 'audit'], 'al-planning-subagent': ['al-researcher', undefined],
};
const OLD_NAMES = Object.keys(ALIASES).join('|');
const front = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  const head = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
  const data = Object.fromEntries(head.split(/\r?\n/).map((l) => { const i = l.indexOf(':'); return [l.slice(0, i), l.slice(i + 1).trim()]; }));
  return { text, data };
};

test('5.4.0: Conductor, entry skills and hooks launch only the new agent names', () => {
  const launchers = [
    'agents/al-conductor.md', 'skills/conduct/SKILL.md', 'skills/develop/SKILL.md', 'skills/review/SKILL.md', 'skills/audit/SKILL.md',
    ...fs.readdirSync(HOOKS).filter((f) => f.endsWith('.js')).map((f) => 'hooks/' + f),
  ];
  for (const rel of launchers) {
    const text = fs.readFileSync(path.join(PLUGIN, rel), 'utf8');
    // Report identifiers (skill.id) keep the old spellings; launching by an old name does not.
    assert.doesNotMatch(text, new RegExp(`aldc:(${OLD_NAMES})\\b`), rel + ' launches an alias');
    assert.doesNotMatch(text, new RegExp(`agents/(${OLD_NAMES})\\.md`), rel + ' reads an alias contract');
    if (rel.startsWith('hooks/')) assert.doesNotMatch(text, new RegExp(`\\b(${OLD_NAMES})\\b`), rel + ' names a deprecated agent');
  }
  const named = (rel, ...names) => names.forEach((n) => assert.match(fs.readFileSync(path.join(PLUGIN, rel), 'utf8'), new RegExp(`aldc:${n}\\b`), rel + ' -> ' + n));
  named('skills/conduct/SKILL.md', 'al-researcher', 'al-implementer', 'al-reviewer');
  named('agents/al-conductor.md', 'al-researcher', 'al-implementer', 'al-reviewer');
  named('skills/develop/SKILL.md', 'al-implementer');
  named('skills/review/SKILL.md', 'al-reviewer');
  named('skills/audit/SKILL.md', 'al-reviewer');
});

test('6.0.0: the 5.4.0 aliases, the al-spec-create alias and the extras pointers are gone', () => {
  for (const name of Object.keys(ALIASES)) assert.ok(!fs.existsSync(path.join(AGENTS_DIR, name + '.md')), 'alias removed: ' + name);
  assert.deepStrictEqual(fs.readdirSync(AGENTS_DIR).filter((f) => /aldc-alias-of:/.test(fs.readFileSync(path.join(AGENTS_DIR, f), 'utf8'))), []);
  for (const s of ['al-spec-create', 'presales', 'agent-builder']) assert.ok(!fs.existsSync(path.join(PLUGIN, 'skills', s)), 'skill removed: ' + s);
  assert.deepStrictEqual(fs.readdirSync(AGENTS_DIR).map((f) => f.replace(/\.md$/, '')).sort(),
    ['al-architect', 'al-conductor', 'al-implementer', 'al-knowledge-consultant', 'al-researcher', 'al-reviewer', 'al-spec-agent', 'al-triage']);
  const yaml = fs.readFileSync(path.join(PLUGIN, 'aldc.yaml'), 'utf8');
  assert.doesNotMatch(yaml, /deprecatedAgents|deprecatedWorkflows/);
  // The modes and scopes the old names mapped to are still the ones the merged contracts define.
  const impl = fs.readFileSync(path.join(AGENTS_DIR, 'al-implementer.md'), 'utf8');
  for (const m of ['phase', 'direct']) assert.match(impl, new RegExp('## Mode `' + m + '`'));
  const rev = fs.readFileSync(path.join(AGENTS_DIR, 'al-reviewer.md'), 'utf8');
  for (const s of ['phase', 'increment', 'audit']) assert.ok(rev.includes('`' + s + '`'), 'reviewer scope ' + s);
  assert.doesNotMatch(front(path.join(AGENTS_DIR, 'al-reviewer.md')).data.tools, /\b(Write|Edit|Bash|Task|Agent)\b/, 'reviewer stays read-only in every scope');
  // The Doctor finds a 6.0.0 Claude install by its spec entry skill.
  assert.match(fs.readFileSync(path.join(PLUGIN, 'tools', 'context-doctor', 'aldc_context_doctor.py'), 'utf8'), /"claude": \[\("agents\/al-architect\.md", "skills\/spec\/SKILL\.md"\)/);
});

// ─── 5.4.0: the slimmed Conductor keeps every gate, hard stop and artifact path ─────────────
test('5.4.0: Conductor gates, hard stops and artifact paths stay reachable; templates are read on demand', () => {
  const conductor = fs.readFileSync(path.join(AGENTS_DIR, 'al-conductor.md'), 'utf8');
  const template = (n) => fs.readFileSync(path.join(PLUGIN, 'docs', 'templates', n), 'utf8');
  for (const phrase of [
    '🚨 HARD GATE — APPROVED CUT', 'STOP and WAIT for explicit user approval. DO NOT start implementation until user confirms',
    'showing the cut in chat is NOT enough',
    '**⛔ TDD ENFORCEMENT**', 'Zero tests = ticket FAILED',
    'Review is MANDATORY — NO EXCEPTIONS', 'NEVER skip review',
    'Review completeness gate', 'cannot become approval from zero findings',
    '🚨 MANDATORY memory.md update at completion', '🚨 CRITICAL PAUSE POINTS',
    '⛔ User requests stop', '⛔ Critical review failure', '⛔ 3+ consecutive review failures',
    '⛔ Architecture mismatch', '⛔ Missing dependencies', '⛔ Test infrastructure failure',
    '### PAUSE and Confirm When:', '### Escalate to User When:', 'Human Validation Gates 🚨',
    // pre-approved, foreground delegation and the honest final report
    'stay hard stops in both modes', 'Git commits run only when `autonomy.commit: true`',
    'Never call `AskUserQuestion` and never end the turn to wait', 'run_in_background: false',
    'Never continue a subagent with `SendMessage`', 'The final review does not close while `review.security` is missing',
    '*Verification*, *Not verified*, *Decisions taken without a human* and *Open risks*',
  ]) assert.ok(conductor.includes(phrase), 'conductor: ' + phrase);
  // 6.0.0: the phase path is gone; a 5.4.x phase plan is research for a new cut.
  assert.doesNotMatch(conductor, /## Phase \d|HARD GATE — PHASE|phase-complete-template|-phase-1-complete\.md|finish it by phases/);
  assert.match(conductor, /The phase path was removed in 6\.0\.0/);
  assert.ok(!fs.existsSync(path.join(PLUGIN, 'docs', 'templates', 'phase-complete-template.md')), 'phase-complete template removed');
  for (const artifact of [
    '.claude/plans/<task-name>/<task-name>-plan.md', '<req>-review-final.json',
    '.claude/plans/<task-name>/<task-name>-bcquality-final.json', '.claude/plans/<task-name>/<task-name>-complete.md',
    '.claude/plans/<task-name>/decisions.md', '.claude/plans/<task-name>/blocked.md', '.claude/plans/memory.md',
    '.claude/plans/<req>/<req>.bcq-criteria.json', '{req_name}.spec.md', '{req_name}.architecture.md', '{req_name}.test-plan.md',
  ]) assert.ok(conductor.includes(artifact), 'conductor artifact: ' + artifact);
  // One source per artifact format: the conductor reads the template at the step that writes it.
  for (const n of ['plan-template.md', 'plan-complete-template.md', 'test-plan-template.md', 'code-review-template.md', 'ticket-result-template.md']) {
    assert.ok(conductor.includes('${CLAUDE_PLUGIN_ROOT}/docs/templates/' + n), 'conductor reads ' + n);
  }
  assert.doesNotMatch(conductor, /_style_guide>|must NOT read them/, 'no inline copy of the templates and no ban on reading them');
  assert.doesNotMatch(conductor, /micro-rules inline/, 'the AL rules come from agent-brief.js, not from the conductor');
  const complete = template('plan-complete-template.md');
  for (const h of ['**Verification (what was checked, and how):**', '**Not verified:**', '**Decisions taken without a human:**', '**Open risks:**', 'Never write "passing" for tests that did not run'])
    assert.ok(complete.includes(h), 'plan-complete template: ' + h);
  assert.doesNotMatch(complete, /All tests passing: ✅/, 'the final report never pre-fills passing tests');
  assert.ok(template('plan-template.md').includes('**Mini-design:**'), 'plan template carries the Mini-design');
  assert.ok(complete.includes('**Tickets Completed:**') && complete.includes('<plan>-review-final.json'), 'the final report consolidates tickets and the final review');
  assert.doesNotMatch(complete, /phase-complete|Phases Completed/, 'no phase files to consolidate since 6.0.0');
});

test('6.0.0: /aldc:spec is the one specification entry; nothing routes to al-spec-create', () => {
  const spec = fs.readFileSync(path.join(PLUGIN, 'skills', 'spec', 'SKILL.md'), 'utf8');
  assert.ok(spec.includes('${CLAUDE_PLUGIN_ROOT}/agents/al-spec-agent.md'), 'entry reads the Spec contract');
  assert.match(spec, /SPEC-ID/, 'entry carries the multi-spec handoff the workflow had');
  // Nothing in the plugin routes to the alias any more.
  const dirs = [['agents', AGENTS_DIR], ['skills', path.join(PLUGIN, 'skills')]];
  for (const [kind, dir] of dirs) for (const f of fs.readdirSync(dir)) {
    const file = kind === 'agents' ? path.join(dir, f) : path.join(dir, f, 'SKILL.md');
    if (!fs.existsSync(file) || f === 'al-spec-create' || f === 'spec') continue;
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /al-spec-create|al-spec\.create/, kind + '/' + f + ' routes to the deprecated spec workflow');
  }
});

test('5.4.0: Claude audit reports live under .claude/audits in the plugin, its skills and its normalizer', () => {
  const { auditsRootFor, plansRootFor } = require('./plugin-runtime');
  const repo = path.resolve(PLUGIN, '..');
  // 5.5.0: the shared plugin-runtime.js agrees with the plugin's aldc.yaml.
  assert.strictEqual(plansRootFor(repo, 'claude'), '.claude/plans');
  assert.strictEqual(auditsRootFor(repo, 'claude'), '.claude/audits');
  assert.match(fs.readFileSync(path.join(PLUGIN, 'aldc.yaml'), 'utf8'), /^audits:\r?\n\s+root:\s*"\.claude\/audits"/m);
  assert.ok(fs.readFileSync(path.join(PLUGIN, 'skills', 'audit', 'SKILL.md'), 'utf8').includes('.claude/audits/'));
  // A Claude project has no aldc.yaml of its own (init.js seeds none): the plugin's normalizer defaults to this surface.
  const { readConfig } = require(path.join(PLUGIN, 'tools', 'bcquality', 'config.js'));
  const bare = readConfig(fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-noyaml-')));
  assert.strictEqual(bare.plans.root, '.claude/plans');
  assert.strictEqual(bare.audits.root, '.claude/audits');
  // The other surfaces keep their roots.
  assert.strictEqual(auditsRootFor(repo, 'codex'), '.agents/audits');
  assert.strictEqual(auditsRootFor(repo, 'copilot-cli'), '.github/audits');
});

// ─── 5.4.0: pre-sales and agent building moved to the optional aldc-extras plugin ───────────
const EXTRAS = path.resolve(PLUGIN, '..', 'claude-plugin-extras');
const MOVED = {
  agents: ['al-presales', 'al-agent-builder'],
  skills: ['presales', 'agent-builder', 'al-agent-create', 'al-agent-instructions', 'al-agent-task', 'al-agent-test',
    'skill-estimation', 'skill-agent-instructions', 'skill-agent-task-patterns', 'skill-agent-toolkit'],
};
const textFiles = (root) => require(path.join(PLUGIN, 'scripts', 'package-provenance')).walk(root)
  .filter((p) => /\.(md|js|json|ya?ml|txt|sh|py)$/.test(p) && p !== 'provenance.json');

test('5.4.0: aldc-extras holds the moved roles, depends on aldc and both plugins are in the marketplace', () => {
  for (const a of MOVED.agents) {
    assert.ok(fs.existsSync(path.join(EXTRAS, 'agents', a + '.md')), 'extras agent ' + a);
    assert.ok(!fs.existsSync(path.join(AGENTS_DIR, a + '.md')), 'core no longer ships agent ' + a);
    assert.strictEqual(front(path.join(EXTRAS, 'agents', a + '.md')).data.name, a);
  }
  for (const s of MOVED.skills) {
    assert.ok(fs.existsSync(path.join(EXTRAS, 'skills', s, 'SKILL.md')), 'extras skill ' + s);
    assert.ok(!fs.existsSync(path.join(PLUGIN, 'skills', s)), 'core no longer ships skill ' + s);
  }
  // The Agent SDK rule stays in the core: the implementer and reviewer apply it without aldc-extras.
  assert.ok(fs.existsSync(path.join(PLUGIN, 'rules', 'al-agent-toolkit.md')));
  assert.ok(!fs.existsSync(path.join(EXTRAS, 'rules')), 'extras ships no copy of the core rules');
  const manifest = JSON.parse(fs.readFileSync(path.join(EXTRAS, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.strictEqual(manifest.name, 'aldc-extras');
  assert.strictEqual(manifest.version, '6.0.1');
  // 6.0.1: no version ranges. A range resolves only against <plugin>--v<version> git tags, which none of these repositories has.
  assert.deepStrictEqual(manifest.dependencies, [{ name: 'aldc' }]);
  const coreManifest = JSON.parse(fs.readFileSync(path.join(PLUGIN, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.strictEqual(coreManifest.version, '6.0.1');
  assert.ok(coreManifest.dependencies.every((d) => d.version === undefined), 'no version ranges in the core dependencies');
  // The root marketplace is repository-only; the npm package does not ship it.
  const rootMarket = path.resolve(PLUGIN, '..', '.claude-plugin', 'marketplace.json');
  if (fs.existsSync(rootMarket)) {
    const market = JSON.parse(fs.readFileSync(rootMarket, 'utf8'));
    const entry = (n) => market.plugins.find((p) => p.name === n);
    assert.deepStrictEqual(market.plugins.map((p) => p.name).sort(), ['aldc', 'aldc-extras', 'aldc-verify']);
    assert.strictEqual(entry('aldc').source, './claude-plugin');
    assert.strictEqual(entry('aldc-extras').source, './claude-plugin-extras');
    for (const n of ['aldc', 'aldc-extras']) assert.strictEqual(entry(n).version, '6.0.1', n + ' version');
  }
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(PLUGIN, '.claude-plugin', 'marketplace.json'), 'utf8')).plugins[0].version, '6.0.1');
});

test('5.4.0: core and extras name only files they ship; extras reach the core through <aldc-root>', () => {
  const ref = /\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]*[\w-])/g;
  for (const rel of textFiles(PLUGIN)) {
    const text = fs.readFileSync(path.join(PLUGIN, rel), 'utf8');
    for (const [, p] of text.matchAll(ref)) {
      assert.ok(!MOVED.agents.some((a) => p === 'agents/' + a + '.md'), rel + ' reads moved ' + p);
      assert.ok(!MOVED.skills.some((s) => p.startsWith('skills/' + s + '/')), rel + ' reads moved ' + p);
    }
    // Core launchers never route to the moved agents under the core prefix.
    assert.doesNotMatch(text, /aldc:al-(presales|agent-builder)\b/, rel + ' launches a moved agent as aldc:');
  }
  for (const rel of textFiles(EXTRAS)) {
    const text = fs.readFileSync(path.join(EXTRAS, rel), 'utf8');
    for (const [, p] of text.matchAll(ref)) {
      if (/[<{*]/.test(p)) continue;
      assert.ok(fs.existsSync(path.join(EXTRAS, ...p.split('/'))), `extras ${rel} names \${CLAUDE_PLUGIN_ROOT}/${p}, which it does not ship: write <aldc-root>/${p}`);
    }
    for (const [, p] of text.matchAll(/<aldc-root>\/([\w./-]*[\w-])/g)) {
      assert.ok(fs.existsSync(path.join(PLUGIN, ...p.split('/'))), `extras ${rel}: <aldc-root>/${p} exists in the core`);
    }
  }
  for (const rel of ['agents/al-presales.md', 'agents/al-agent-builder.md', 'skills/presales/SKILL.md', 'skills/agent-builder/SKILL.md']) {
    assert.ok(fs.readFileSync(path.join(EXTRAS, rel), 'utf8').includes('${CLAUDE_PLUGIN_ROOT}/docs/claude-runtime.md'), rel + ' reads the extras runtime pointer');
  }
  assert.ok(fs.readFileSync(path.join(EXTRAS, 'docs', 'claude-runtime.md'), 'utf8').includes('<aldc-root>/docs/claude-runtime.md'), 'extras runtime points to the core runtime');
});

test('5.4.0: the core briefs aldc-extras:al-agent-builder with the Agent SDK rule; a core reviewer still gets it without extras', () => {
  const cwd = project();
  const builder = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc-extras:al-agent-builder', prompt: 'Build', run_in_background: true } }).hookSpecificOutput.updatedInput;
  assert.strictEqual(builder.run_in_background, false);
  assert.match(builder.prompt, /Completeness checklist/);
  assert.match(builder.prompt, /# AL Testing — Micro Rules/);
  const presales = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc-extras:al-presales', prompt: 'Estimate', run_in_background: true } }).hookSpecificOutput.updatedInput;
  assert.strictEqual(presales.run_in_background, false);
  assert.doesNotMatch(presales.prompt, /aldc-rules/, 'pre-sales writes no AL: no rules');
  const old = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-agent-builder', prompt: 'x' } }).hookSpecificOutput.updatedInput;
  assert.strictEqual(old.prompt, 'x', 'the old core name gets no code brief');
  const reviewer = run('agent-brief.js', { cwd, tool_input: { subagent_type: 'aldc:al-reviewer', prompt: 'Review the agent SDK app' } }).hookSpecificOutput.updatedInput.prompt;
  assert.match(reviewer, /Completeness checklist/);
  assert.match(fs.readFileSync(path.join(PLUGIN, 'skills', 'skill-al-review-pipeline', 'SKILL.md'), 'utf8'), /\$\{CLAUDE_PLUGIN_ROOT\}\/rules\/al-agent-toolkit\.md/);
});

test('5.4.0: the aldc-extras SessionStart hook states the core root or asks to install aldc', () => {
  const hook = require(path.join(EXTRAS, 'hooks', 'core-root.js'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-home-'));
  assert.strictEqual(hook.coreRoot(home), PLUGIN, 'a clone finds claude-plugin beside it');
  const lone = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-extras-'));
  const missing = hook.context(home, lone);
  assert.match(missing.systemMessage, /claude plugin install aldc@aldc-marketplace/);
  fs.mkdirSync(path.join(home, '.claude', 'plugins'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'plugins', 'installed_plugins.json'), JSON.stringify({ plugins: { 'aldc@aldc-marketplace': [{ installPath: PLUGIN }] } }));
  const found = hook.context(home, lone);
  assert.ok(!found.systemMessage);
  assert.ok(found.hookSpecificOutput.additionalContext.includes('aldc core root is ' + PLUGIN));
  // Plugin cache layout: <marketplace>/aldc-extras/<v> beside <marketplace>/aldc/<v>; the newest aldc wins.
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-cache-'));
  for (const v of ['5.3.0', '5.4.0']) {
    fs.mkdirSync(path.join(cache, 'aldc', v, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(cache, 'aldc', v, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(cache, 'aldc', v, 'docs', 'claude-runtime.md'), '# runtime\n');
    fs.writeFileSync(path.join(cache, 'aldc', v, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'aldc', version: v }));
  }
  fs.mkdirSync(path.join(cache, 'aldc-extras', '5.4.0'), { recursive: true });
  const emptyHome = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-home-'));
  assert.strictEqual(hook.coreRoot(emptyHome, path.join(cache, 'aldc-extras', '5.4.0')), path.join(cache, 'aldc', '5.4.0'));
  const hooks = JSON.parse(fs.readFileSync(path.join(EXTRAS, 'hooks', 'hooks.json'), 'utf8')).hooks;
  assert.deepStrictEqual(Object.keys(hooks), ['SessionStart'], 'extras adds no tool hooks; the core ones apply');
});

test('5.4.0: both Claude plugins verify against their own provenance lock', () => {
  const { verify } = require(path.join(PLUGIN, 'scripts', 'package-provenance'));
  for (const root of [PLUGIN, EXTRAS]) assert.doesNotThrow(() => verify(root), root);
});

// ── 5.5.0 (factory phase 3): tickets and resumable state ────────────────────
const writeTicket = (dir, id, status, deps = '[]') => fs.writeFileSync(path.join(dir, `${id}.md`),
  `---\nid: ${id}\ntitle: ${id}\ndepends_on: ${deps}\nmode: afk\nobject_ids: [50100-50109]\nacceptance: [AC-01]\nstatus: ${status}\n---\nScope.\n`);

test('5.5.0: stop-guard counts open tickets on the ticket path and lets a finished cut close with its final report', () => {
  const cwd = project(); const s = sid();
  run('session-context.js', { cwd, session_id: s });
  const req = path.join(cwd, '.claude', 'plans', 'feat');
  const t = path.join(req, 'tickets');
  fs.mkdirSync(t, { recursive: true });
  fs.writeFileSync(path.join(req, 'feat-plan.md'), '# Mini-design\nWork is cut into tickets/.');
  writeTicket(t, 'T-01', 'done'); fs.writeFileSync(path.join(t, 'T-01.result.md'), 'r');
  writeTicket(t, 'T-02', 'in-progress', '[T-01]');
  writeTicket(t, 'T-03', 'blocked');
  const env = { ALDC_GATES: 'pre-approved', ...NO_BCQ };
  const b = run('stop-guard.js', { cwd, session_id: s }, env);
  assert.strictEqual(b.decision, 'block');
  assert.match(b.reason, /feat \(tickets done: 1\/3, open: T-02\)/);
  assert.match(b.reason, /tickets\.js status/);
  assert.doesNotMatch(b.reason, /phase files/);

  // All done or blocked but no final report: still open, and it says what is missing.
  const s2 = sid(); run('session-context.js', { cwd, session_id: s2 });
  writeTicket(t, 'T-02', 'done', '[T-01]');
  assert.match(run('stop-guard.js', { cwd, session_id: s2 }, env).reason, /tickets done: 2\/3, final report missing/);

  // The final report closes it once the evidence agrees with it.
  const s3 = sid(); run('session-context.js', { cwd, session_id: s3 });
  fs.writeFileSync(path.join(req, 'feat-complete.md'), '# Done\n| Build | not-run |\nbuild: not-run (no compiler here)');
  assert.strictEqual(run('stop-guard.js', { cwd, session_id: s3 }, env), null);
});

test('5.5.0: session-context tells a new session which ticket requirement to resume', () => {
  const cwd = project();
  const t = path.join(cwd, '.claude', 'plans', 'loyalty', 'tickets');
  fs.mkdirSync(t, { recursive: true });
  writeTicket(t, 'T-01', 'done'); fs.writeFileSync(path.join(t, 'T-01.result.md'), 'r');
  writeTicket(t, 'T-02', 'ready', '[T-01]');
  const ctx = run('session-context.js', { cwd, session_id: sid() }).hookSpecificOutput.additionalContext;
  assert.match(ctx, /requirement loyalty is in progress on tickets \(1\/2 done, open: T-02\)/);
  assert.match(ctx, /\/aldc:conduct loyalty/);
  fs.writeFileSync(path.join(cwd, '.claude', 'plans', 'loyalty', 'blocked.md'), 'waiting for a human');
  assert.doesNotMatch(run('session-context.js', { cwd, session_id: sid() }).hookSpecificOutput.additionalContext, /in progress on tickets/);
});

test('5.5.0: artifact-gate checks ticket reviews like phase reviews', () => {
  const cwd = project();
  const dir = path.join(cwd, '.claude', 'plans', 'feat', 'tickets');
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, 'T-04.review.json');
  fs.writeFileSync(f, JSON.stringify({ review: { bcquality: { outcome: 'not-applicable' } } }));
  const out = run('artifact-gate.js', { cwd, tool_name: 'Write', tool_input: { file_path: f } });
  assert.strictEqual(out.decision, 'block');
  assert.match(out.reason, /T-04\.review\.json.*review\.security lacks/);
});

test('5.5.0: the tickets skill, tool and templates ship with the plugin and the conductor resumes from them', () => {
  for (const p of ['skills/tickets/SKILL.md', 'tools/tickets/tickets.js', 'docs/templates/ticket-template.md', 'docs/templates/ticket-result-template.md'])
    assert.ok(fs.existsSync(path.join(PLUGIN, p)), p);
  const conductor = fs.readFileSync(path.join(PLUGIN, 'agents', 'al-conductor.md'), 'utf8');
  assert.match(conductor, /## Build in waves/);
  assert.match(conductor, /tickets\.js" status <req>/);
  // The ticket template's own frontmatter parses and passes the field checks.
  const tickets = require(path.join(PLUGIN, 'tools', 'tickets', 'tickets.js'));
  const d = tickets.parseFrontmatter(fs.readFileSync(path.join(PLUGIN, 'docs', 'templates', 'ticket-template.md'), 'utf8'));
  assert.deepStrictEqual([d.id, d.mode, d.status, d.acceptance], ['T-01', 'afk', 'ready', ['AC-01']]);
});

// ── 5.5.0 (factory phase 4): worktrees, parallel waves and the final review ──
test('5.5.0: artifact-gate checks the final review of a ticketed requirement', () => {
  const cwd = project();
  const dir = path.join(cwd, '.claude', 'plans', 'feat');
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, 'feat-review-final.json');
  fs.writeFileSync(f, JSON.stringify({ review: { bcquality: { outcome: 'not-applicable' } } }));
  const out = run('artifact-gate.js', { cwd, tool_name: 'Write', tool_input: { file_path: f } });
  assert.strictEqual(out.decision, 'block');
  assert.match(out.reason, /feat-review-final\.json.*review\.security lacks/);
});

test('5.5.0: session-context names the ticket worktrees a dead session left behind', () => {
  const cwd = project();
  const g = (...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
  g('init', '-q'); fs.writeFileSync(path.join(cwd, 'README.md'), 'x');
  g('add', 'README.md'); g('-c', 'user.name=t', '-c', 'user.email=t@l', 'commit', '-qm', 'base');
  g('worktree', 'add', '-q', path.join(cwd, '.claude', 'worktrees', 'agent-x'), '-b', 'worktree-agent-x');
  const t = path.join(cwd, '.claude', 'plans', 'loyalty', 'tickets');
  fs.mkdirSync(t, { recursive: true });
  writeTicket(t, 'T-01', 'in-progress');
  const ctx = run('session-context.js', { cwd, session_id: sid() }).hookSpecificOutput.additionalContext;
  assert.match(ctx, /requirement loyalty is in progress on tickets/);
  assert.match(ctx, /removes the 1 ticket worktree\(s\) left behind \(integrate\.js cleanup\)/);
});

test('5.5.0: the conductor builds tickets in parallel worktrees and integrates them with integrate.js', () => {
  assert.ok(fs.existsSync(path.join(PLUGIN, 'tools', 'tickets', 'integrate.js')));
  const conductor = fs.readFileSync(path.join(PLUGIN, 'agents', 'al-conductor.md'), 'utf8');
  for (const re of [/isolation: "worktree"/, /integrate\.js"/, /`I prepare <req>`/, /`T wave <req>`/, /<req>-review-final\.json/, /al-go --no-review/, /delivery: local/, /You never run git yourself/])
    assert.match(conductor, re);
  const implementer = fs.readFileSync(path.join(PLUGIN, 'agents', 'al-implementer.md'), 'utf8');
  assert.match(implementer, /### Shared File Entries/);
  assert.match(implementer, /Do not run git/);
  assert.match(fs.readFileSync(path.join(PLUGIN, 'agents', 'al-reviewer.md'), 'utf8'), /number: "final"/);
  assert.match(fs.readFileSync(path.join(PLUGIN, 'aldc.yaml'), 'utf8'), /^tickets:\r?\n {2}parallel: 3\r?$/m);
});
