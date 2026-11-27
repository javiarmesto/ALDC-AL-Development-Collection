'use strict';
// Tests for tools/factory/factory.js (factory phase 5) with the fake host: real git, no model.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const F = require('../tools/factory/factory');
const fake = require('../tools/factory/hosts/fake');
const T = require('../tools/tickets/tickets');

const git = (cwd, ...a) => { const r = spawnSync('git', a, { cwd, encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr); return r.stdout.trim(); };
const ID = ['-c', 'user.name=t', '-c', 'user.email=t@localhost'];
const RANGES = { 'T-01': 50100, 'T-02': 50110, 'T-03': 50120 };
const PERMS = 'App/src/Demo.PermissionSet.al';

/** A git repo with one AL app and an approved spec under .github/plans (the root tools' default). */
function project() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-factory-'));
  git(root, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(root, 'App', 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'App', 'app.json'), JSON.stringify({ name: 'Demo', idRanges: [{ from: 50100, to: 50149 }] }));
  git(root, 'add', 'App/app.json'); git(root, ...ID, 'commit', '-qm', 'base');
  const dir = path.join(root, '.github', 'plans', 'demo');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'demo.spec.md'), '# Spec\nThree independent features.\n');
  return { root, dir };
}

const ticket = (id, extra = '') => `---\nid: ${id}\ntitle: Feature ${id}\ndepends_on: []\nmode: ${extra || 'afk'}\nobject_ids: [${RANGES[id]}-${RANGES[id] + 9}]\nacceptance: [AC-0${id.slice(-1)}]\nbcq: []\nshared_files: [${PERMS}]\nstatus: ready\n---\n\n## Scope\n\nFeature ${id}.\n`;
const REVIEW = (findings = []) => `Done.\n\n### Review-Report (JSON)\n\n\`\`\`json\n${JSON.stringify({ review: { verdict: findings.length ? 'NEEDS_REVISION' : 'APPROVED', security: {} }, findings })}\n\`\`\`\n`;

/** The default crew script: every role does its job. `tweak(call)` may override one call. */
function script(tweak = () => null) {
  return async (call) => {
    const t = tweak(call);
    if (t) return t;
    const plans = '.github/plans/demo';
    switch (call.role) {
      case 'researcher': return { text: 'Findings. Standard Flow: none.', cost: 0.2 };
      case 'cutter': return { cost: 0.3, files: {
        [`${plans}/tickets/criteria.md`]: '# Criteria\n\n- AC-01: one\n- AC-02: two\n- AC-03: three\n',
        [`${plans}/tickets/T-01.md`]: ticket('T-01'), [`${plans}/tickets/T-02.md`]: ticket('T-02'), [`${plans}/tickets/T-03.md`]: ticket('T-03'),
      } };
      case 'implementer': {
        const id = RANGES[call.ticket];
        return { delayMs: 150, cost: 0.5,
          files: { [`App/src/${call.ticket}.Codeunit.al`]: `codeunit ${id} "Feature ${call.ticket}"\n{\n}\n` },
          text: `## ${call.ticket} Implementation Summary\n\n### Shared File Entries\n- ${PERMS}: codeunit "Feature ${call.ticket}" = X\n\n### Issues / Notes\n- none\n` };
      }
      case 'integrator': return { cost: 0.2, files: { [PERMS]: `permissionset 50149 "Demo"\n{\n    // ${call.prompt.split('\n').filter((l) => l.startsWith('- ')).length} entries\n}\n` } };
      case 'spec-reviewer': return { cost: 0.4, text: REVIEW() };
      case 'reporter': return { cost: 0.1, files: { [`${plans}/demo-complete.md`]: '# Done\n' } };
      case 'retro': return { files: { [`${plans}/retro.md`]: '# Retro\n\n- Proposal: none.\n' } };
      default: return {};
    }
  };
}

const factory = (root, s, opts = {}) => { const calls = []; return F.runFactory({ project: root, req: 'demo', host: fake.create({ script: s, calls }), ...opts }).then((run) => ({ run, calls })); };

test('from an approved spec to a reviewed branch: research, cut, one parallel wave, integration, review, report', async () => {
  const { root, dir } = project();
  const { run, calls } = await factory(root, script());
  assert.strictEqual(run.outcome, 'finished', run.reason);
  assert.deepStrictEqual(calls.map((c) => c.role).filter((r, i, a) => a.indexOf(r) === i), ['researcher', 'cutter', 'implementer', 'integrator', 'spec-reviewer', 'reporter', 'retro']);
  // The three implementers ran at the same time, each in its own worktree.
  const impl = calls.filter((c) => c.role === 'implementer');
  assert.strictEqual(impl.length, 3);
  assert.ok(Math.max(...impl.map((c) => c.startedAt)) - Math.min(...impl.map((c) => c.startedAt)) < 150, 'launched together');
  assert.strictEqual(new Set(impl.map((c) => c.cwd)).size, 3);
  assert.ok(impl.every((c) => /[\\/]\.claude[\\/]worktrees[\\/]factory-T-0\d-1$/.test(c.cwd)));
  // aldc/demo carries one merge per ticket and the integration commit; no worktree is left.
  assert.strictEqual(git(root, 'branch', '--show-current'), 'aldc/demo');
  assert.match(git(root, 'log', '--merges', '--format=%s'), /Merge T-03.*\n.*Merge T-02.*\n.*Merge T-01/);
  assert.match(git(root, 'log', '-1', '--format=%s'), /^chore\(demo\): integrate T-01, T-02, T-03$/);
  assert.strictEqual(git(root, 'worktree', 'list').split('\n').length, 1);
  // The integrator got the three shared entries; the tickets are done with their result files.
  assert.strictEqual(calls.find((c) => c.role === 'integrator').prompt.split('\n').filter((l) => l.startsWith('- ')).length, 3);
  assert.deepStrictEqual(T.summary(root, 'demo').done, ['T-01', 'T-02', 'T-03']);
  assert.match(fs.readFileSync(path.join(dir, 'tickets', 'T-02.result.md'), 'utf8'), /Build after integration \| not-run \(no verify command\)/);
  assert.ok(fs.existsSync(path.join(dir, 'demo-review-final.json')) && fs.existsSync(path.join(dir, 'research.md')));
  // factory-run.json records every step and the cost the host reported.
  const log = JSON.parse(fs.readFileSync(path.join(dir, 'factory-run.json'), 'utf8'));
  assert.strictEqual(log.runs.at(-1).outcome, 'finished');
  assert.strictEqual(log.runs.at(-1).cost, 2.7);
  assert.ok(log.runs.at(-1).steps.some((s) => s.kind === 'certified' && s.result === 'not-run'));
  // The retro ran last, after the outcome was saved, and wrote its proposals.
  const last = log.runs.at(-1).steps.at(-1);
  assert.strictEqual(last.kind, 'retro');
  assert.strictEqual(last.result, 'written');
  assert.ok(fs.existsSync(path.join(dir, 'retro.md')));
  assert.match(calls.find((c) => c.role === 'reporter').prompt, /not by the Conductor/);
});

test('the retro proposes only: a tracked file it edits is put back, and a blocked run gets one too', async () => {
  const { root, dir } = project();
  const s = script((c) => {
    if (c.role === 'cutter') return { files: {
      '.github/plans/demo/tickets/criteria.md': '- AC-01: one\n- AC-02: two\n- AC-03: three\n',
      '.github/plans/demo/tickets/T-01.md': ticket('T-01'), '.github/plans/demo/tickets/T-02.md': ticket('T-02', 'hitl'), '.github/plans/demo/tickets/T-03.md': ticket('T-03'),
    } };
    if (c.role === 'retro') { assert.match(c.prompt, /outcome: blocked/); return { files: { 'App/app.json': '{"tampered":true}' }, text: 'Proposal: record the T-02 decision earlier.' }; }
    return null;
  });
  const { run } = await factory(root, s);
  assert.strictEqual(run.outcome, 'blocked');
  const r = run.steps.find((x) => x.kind === 'retro');
  assert.strictEqual(r.result, 'written');
  assert.deepStrictEqual(r.reverted, ['App/app.json']);
  assert.match(fs.readFileSync(path.join(root, 'App', 'app.json'), 'utf8'), /idRanges/);
  assert.match(fs.readFileSync(path.join(dir, 'retro.md'), 'utf8'), /record the T-02 decision/);
});

test('an empty ticket whose objects are already on the branch is closed, not rebuilt; the cut refuses a permission-set-only ticket', async () => {
  const { root, dir } = project();
  const plans = '.github/plans/demo';
  const s = script((c) => {
    if (c.role === 'cutter') return { files: {
      [`${plans}/tickets/criteria.md`]: '- AC-01: one\n- AC-02: two\n- AC-03: three\n',
      [`${plans}/tickets/T-01.md`]: ticket('T-01'), [`${plans}/tickets/T-02.md`]: ticket('T-02'),
      [`${plans}/tickets/T-03.md`]: ticket('T-03').replace('depends_on: []', 'depends_on: [T-01, T-02]'),
    } };
    // The integration step of wave 1 already writes T-03's object; its implementer then has nothing to do.
    if (c.role === 'integrator') return { files: { [PERMS]: 'permissionset 50149 "Demo"\n{\n}\n', 'App/src/Late.Codeunit.al': 'codeunit 50120 "Late"\n{\n}\n' } };
    if (c.role === 'implementer' && c.ticket === 'T-03') return { text: 'Nothing to change.' };
    return null;
  });
  const { run, calls } = await factory(root, s);
  assert.strictEqual(run.outcome, 'finished', run.reason);
  assert.strictEqual(calls.filter((c) => c.ticket === 'T-03').length, 1, 'not rebuilt');
  assert.deepStrictEqual(run.steps.find((x) => x.kind === 'satisfied').objects.map((o) => o.id), [50120]);
  assert.match(fs.readFileSync(path.join(dir, 'tickets', 'T-03.result.md'), 'utf8'), /already on aldc\/demo \(codeunit 50120/);
  assert.match(fs.readFileSync(path.join(dir, 'tickets', 'T-01.result.md'), 'utf8'), /\*\*Review:\*\* pending final review/);
  // The validator refuses the cut that caused it: a ticket whose only objects are shared permission sets.
  fs.appendFileSync(path.join(dir, 'tickets', 'T-03.md'), '\n## Objects\n\n| Type | ID | Name | New / extends |\n|---|---|---|---|\n| PermissionSet | 50121 | Demo | new |\n');
  assert.match(T.validate(root, 'demo').problems.join('\n'), /T-03\.md: its only objects are permission sets in shared_files/);
});

test('requirement traceability: the run writes traceability.md and blocks on a requirement point the review finds unmet', async () => {
  const { root, dir } = project();
  fs.appendFileSync(path.join(dir, 'demo.spec.md'), '\n### Requirement points\n\n| REQ | What was asked | Source | Acceptance |\n| --- | --- | --- | --- |\n| REQ-01 | one | issue #1 | AC-01 |\n| REQ-02 | two | issue #1 | AC-02 |\n| REQ-03 | three | issue #1 | AC-03 |\n');
  const review = (unmet) => `### Review-Report (JSON)\n\n\`\`\`json\n${JSON.stringify({ review: { verdict: 'APPROVED', security: {}, criteria: { declared: ['AC-01', 'AC-02', 'AC-03'], met: ['AC-01', 'AC-03', ...(unmet ? [] : ['AC-02'])], unmet: unmet ? ['AC-02'] : [], 'not-evaluated': [] } }, findings: [] })}\n\`\`\`\n`;
  const blocked = await factory(root, script((c) => (c.role === 'spec-reviewer' ? { text: review(true) } : null)));
  assert.strictEqual(blocked.run.outcome, 'blocked');
  assert.match(blocked.run.reason, /requirement points not delivered: REQ-02/);
  assert.match(fs.readFileSync(path.join(dir, 'traceability.md'), 'utf8'), /\| REQ-02 \| two \|.*\*\*unmet\*\*/);
  const { root: r2, dir: d2 } = project();
  fs.appendFileSync(path.join(d2, 'demo.spec.md'), '\n### Requirement points\n\n| REQ | What was asked | Source | Acceptance |\n| --- | --- | --- | --- |\n| REQ-01 | one | issue #1 | AC-01, AC-02, AC-03 |\n');
  const ok = await factory(r2, script((c) => (c.role === 'spec-reviewer' ? { text: review(false) } : null)));
  assert.strictEqual(ok.run.outcome, 'finished', ok.run.reason);
  assert.deepStrictEqual(ok.run.steps.find((x) => x.kind === 'trace').counts, { 'met by review only': 1 });
  assert.match(ok.calls.find((c) => c.role === 'reporter').prompt, /traceability\.md/);
});

test('a ticket refused at integration is discarded and rebuilt; it blocks after the retries', async () => {
  const { root } = project();
  const out = script((c) => (c.role === 'implementer' && c.ticket === 'T-02' && c.attempt === 1
    ? { files: { 'App/src/T-02.Codeunit.al': 'codeunit 50140 "Wrong range"\n{\n}\n' }, text: '' } : null));
  const { run, calls } = await factory(root, out);
  assert.strictEqual(run.outcome, 'finished', run.reason);
  assert.deepStrictEqual(calls.filter((c) => c.ticket === 'T-02').map((c) => c.attempt), [1, 2]);
  assert.ok(run.steps.some((s) => s.kind === 'integrate' && s.ticket === 'T-02' && s.status === 'refused'));

  const { root: r2 } = project();
  const always = script((c) => (c.role === 'implementer' && c.ticket === 'T-03' ? { files: { 'App/src/T-03.Codeunit.al': 'codeunit 50148 "Wrong"\n{\n}\n' } } : null));
  const second = await factory(r2, always, { crew: { ...JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'factory', 'crew.json'), 'utf8')), caps: { budgetUsd: 15, hours: 2, retries: 1 } } });
  assert.strictEqual(second.run.outcome, 'blocked');
  assert.match(second.run.reason, /blocked tickets: T-03/);
  assert.deepStrictEqual(T.summary(r2, 'demo').blocked, ['T-03']);
});

test('the budget cap stops the run with blocked.md, and a new run resumes without redoing research or the cut', async () => {
  const { root, dir } = project();
  const first = await factory(root, script(), { caps: { budgetUsd: 0.9 } });
  assert.strictEqual(first.run.outcome, 'blocked');
  assert.match(first.run.reason, /budget cap reached/);
  assert.match(fs.readFileSync(path.join(dir, 'blocked.md'), 'utf8'), /budget cap reached/);
  // Second run, fresh budget: resumes from the files.
  const second = await factory(root, script());
  assert.strictEqual(second.run.outcome, 'finished', second.run.reason);
  assert.ok(!second.calls.some((c) => ['researcher', 'cutter'].includes(c.role)), 'research and cut reused');
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, 'factory-run.json'), 'utf8')).runs.length, 2);
});

test('a dead run: its leftover worktree is removed and its in-progress ticket rebuilt', async () => {
  const { root, dir } = project();
  await factory(root, script(), { caps: { budgetUsd: 0.9 } });            // research + cut, then the cap
  // Simulate a session that died mid-wave: T-01 in progress with a worktree on disk.
  T.setStatus(root, 'demo', 'T-01', 'in-progress');
  git(root, 'worktree', 'add', '-q', path.join(root, '.claude', 'worktrees', 'agent-dead'), '-b', 'worktree-agent-dead');
  const { run } = await factory(root, script());
  assert.strictEqual(run.outcome, 'finished', run.reason);
  assert.ok(run.steps.some((s) => s.kind === 'cleanup' && s.removed === 1));
  assert.deepStrictEqual(T.summary(root, 'demo').done, ['T-01', 'T-02', 'T-03']);
  assert.ok(fs.existsSync(path.join(dir, 'demo-complete.md')));
});

test('a hitl ticket without a recorded decision is blocked; the others are built', async () => {
  const { root } = project();
  const s = script((c) => (c.role === 'cutter' ? { files: {
    '.github/plans/demo/tickets/criteria.md': '- AC-01: one\n- AC-02: two\n- AC-03: three\n',
    '.github/plans/demo/tickets/T-01.md': ticket('T-01'), '.github/plans/demo/tickets/T-02.md': ticket('T-02', 'hitl'), '.github/plans/demo/tickets/T-03.md': ticket('T-03'),
  } } : null));
  const { run } = await factory(root, s);
  assert.strictEqual(run.outcome, 'blocked');
  assert.match(run.reason, /blocked tickets: T-02/);
  assert.deepStrictEqual(T.summary(root, 'demo').done, ['T-01', 'T-03']);
});

test('a red build goes to one integrator fix; gating review findings get one correction', async () => {
  const { root } = project();
  const flag = path.join(root, 'green.flag');
  let reviews = 0;
  const s = script((c) => {
    if (c.role === 'integrator' && /build is red/.test(c.prompt)) return { files: { 'green.flag': 'ok' } };
    if (c.role === 'spec-reviewer') return { text: REVIEW(++reviews === 1 ? [{ severity: 'major', message: 'AC-02 unmet', location: { file: 'App/src/T-02.Codeunit.al', line: 1 } }] : []) };
    return null;
  });
  const check = path.join(root, 'check.js');
  fs.writeFileSync(check, `process.exit(require('fs').existsSync(${JSON.stringify(flag)}) ? 0 : 1)`);
  const verify = `node "${check}"`;
  const { run, calls } = await factory(root, s, { verify });
  assert.strictEqual(run.outcome, 'finished', run.reason);
  assert.ok(calls.some((c) => c.role === 'integrator' && /build is red/.test(c.prompt)));
  assert.ok(calls.some((c) => c.role === 'integrator' && /AC-02 unmet/.test(c.prompt)));
  assert.strictEqual(calls.filter((c) => c.role === 'spec-reviewer').length, 2);
});

test('no approved spec, no factory', async () => {
  const { root, dir } = project();
  fs.rmSync(path.join(dir, 'demo.spec.md'));
  const { run, calls } = await factory(root, script());
  assert.strictEqual(run.outcome, 'blocked');
  assert.match(run.reason, /no approved spec/);
  assert.strictEqual(calls.length, 0);
});

test('parsers: shared entries and the Review-Report block', () => {
  assert.deepStrictEqual(F.sharedEntries('### Shared File Entries\n- `App/x.al`: tabledata "A" = RIMD\n- none\n\n### Issues'), [{ file: 'App/x.al', line: 'tabledata "A" = RIMD' }]);
  assert.deepStrictEqual(F.sharedEntries('### Shared File Entries\n- none\n'), []);
  assert.strictEqual(F.reviewReport('no block'), null);
  assert.strictEqual(F.gating(F.reviewReport(REVIEW([{ severity: 'minor' }, { severity: 'blocker' }]))).length, 1);
});

test('claude host: one claude -p per role, agent, budget, plugin dirs, and the plan folder for worktrees', async () => {
  const { EventEmitter } = require('events');
  const seen = [];
  const spawn = (bin, args, opts) => {
    seen.push({ bin, args, opts });
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.kill = () => {};
    setImmediate(() => { child.stdout.emit('data', JSON.stringify({ result: 'done', total_cost_usd: 0.42, session_id: 's1', is_error: false })); child.emit('close', 0); });
    return child;
  };
  const host = require('../tools/factory/hosts/claude').create({ spawn, model: 'sonnet', pluginDirs: ['/p/aldc', '/p/verify'], mode: 'agent' });
  const res = await host.run({ role: 'implementer', agent: 'aldc:al-implementer', prompt: 'build T-01', cwd: '/repo/.claude/worktrees/x', project: '/repo', budget: 3, timeoutMs: 1000 });
  assert.deepStrictEqual([res.ok, res.cost, res.text, res.session], [true, 0.42, 'done', 's1']);
  const a = seen[0].args;
  assert.deepStrictEqual(a.slice(0, 2), ['-p', 'build T-01']);
  assert.deepStrictEqual(a.slice(a.indexOf('--agent'), a.indexOf('--agent') + 2), ['--agent', 'aldc:al-implementer']);
  assert.deepStrictEqual(a.slice(a.indexOf('--max-budget-usd'), a.indexOf('--max-budget-usd') + 2), ['--max-budget-usd', '3']);
  assert.strictEqual(a.filter((x) => x === '--plugin-dir').length, 2);
  assert.ok(a.includes('--add-dir') && a.includes('/repo'));
  assert.strictEqual(seen[0].opts.env.ALDC_GATES, 'pre-approved');
  assert.strictEqual(seen[0].opts.cwd, '/repo/.claude/worktrees/x');
  // The main checkout needs no --add-dir; a role with no agent runs a plain prompt.
  await host.run({ role: 'reporter', agent: null, prompt: 'report', cwd: '/repo', project: '/repo' });
  assert.ok(!seen[1].args.includes('--agent') && !seen[1].args.includes('--add-dir'));
  // Default mode: the agent runs as a foreground subagent, so the plugin's subagent hooks apply.
  const d = require('../tools/factory/hosts/claude').create({ spawn });
  await d.run({ role: 'implementer', agent: 'aldc:al-implementer', prompt: 'build T-02', cwd: '/repo', project: '/repo' });
  assert.ok(!seen[2].args.includes('--agent'));
  assert.match(seen[2].args[1], /launch the subagent `aldc:al-implementer` in the foreground/);
  assert.match(seen[2].args[1], /--- brief ---\nbuild T-02\n--- end of brief ---/);
});
