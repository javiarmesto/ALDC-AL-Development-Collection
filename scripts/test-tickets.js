'use strict';
// Tests for tools/tickets/tickets.js, run through its Claude Code copy (.claude/plans) (factory phase 3). No model calls.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const TOOL = path.join(__dirname, '..', 'claude-plugin', 'tools', 'tickets', 'tickets.js');
const tickets = require(TOOL);

function project({ ranges = [{ from: 50100, to: 50149 }], criteria = ['AC-01', 'AC-02', 'AC-03'] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-tickets-'));
  fs.mkdirSync(path.join(root, 'App'));
  fs.writeFileSync(path.join(root, 'App', 'app.json'), JSON.stringify({ name: 'Demo', idRanges: ranges }));
  const dir = path.join(root, '.claude', 'plans', 'demo', 'tickets');
  fs.mkdirSync(dir, { recursive: true });
  if (criteria) fs.writeFileSync(path.join(dir, 'criteria.md'), '# Criteria\n\n' + criteria.map((c) => `- ${c}: something observable`).join('\n') + '\n');
  return { root, dir };
}

function ticket(dir, id, fields = {}) {
  const f = { title: `Ticket ${id}`, depends_on: '[]', mode: 'afk', object_ids: '[50100-50109]', acceptance: '[AC-01]', bcq: '[]', shared_files: '[]', status: 'ready', ...fields };
  const fm = [`id: ${id}`, ...Object.entries(f).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`)].join('\n');
  fs.writeFileSync(path.join(dir, `${id}.md`), `---\n${fm}\n---\n\n## Scope\n\nSomething.\n`);
}

function goodCut() {
  const p = project();
  ticket(p.dir, 'T-01', { object_ids: '[50100-50109]', acceptance: '[AC-01]' });
  ticket(p.dir, 'T-02', { object_ids: '[50110-50119]', acceptance: '[AC-02]', depends_on: '[T-01]' });
  ticket(p.dir, 'T-03', { object_ids: '[50120-50129]', acceptance: '[AC-03]', depends_on: '[T-01]', mode: 'hitl' });
  return p;
}

test('frontmatter: inline lists, block lists, quotes and comments', () => {
  const d = tickets.parseFrontmatter('---\nid: T-01\ntitle: "Loyalty: points"\ndepends_on:\n  - T-00\n  - T-02\nobject_ids: 50100-50109, 50200..50201\nacceptance: [AC-01, "AC-02"]  # two\nstatus: ready\n---\nbody');
  assert.deepStrictEqual(d.depends_on, ['T-00', 'T-02']);
  assert.strictEqual(d.title, 'Loyalty: points');
  assert.deepStrictEqual(d.acceptance, ['AC-01', 'AC-02']);
  assert.deepStrictEqual(tickets.parseRanges(d.object_ids).map((r) => [r.from, r.to]), [[50100, 50109], [50200, 50201]]);
  assert.strictEqual(tickets.parseFrontmatter('no frontmatter'), null);
});

test('a well-formed cut validates', () => {
  const p = goodCut();
  const r = tickets.validate(p.root, 'demo');
  assert.deepStrictEqual(r.problems, []);
  assert.strictEqual(r.ok, true);
});

test('validate rejects a cycle, overlapping ranges, a range outside app.json and an uncovered criterion', () => {
  const p = project();
  ticket(p.dir, 'T-01', { depends_on: '[T-02]', object_ids: '[50100-50109]', acceptance: '[AC-01]' });
  ticket(p.dir, 'T-02', { depends_on: '[T-01]', object_ids: '[50105-50114]', acceptance: '[AC-02]' });
  ticket(p.dir, 'T-03', { object_ids: '[60000-60009]', acceptance: '[AC-09]' });
  const { ok, problems } = tickets.validate(p.root, 'demo');
  assert.strictEqual(ok, false);
  const text = problems.join('\n');
  assert.match(text, /dependency cycle: T-0\d -> T-0\d -> T-0\d/);
  assert.match(text, /T-02\.md: object_ids 50105-50114 overlaps T-01/);
  assert.match(text, /T-03\.md: object_ids 60000-60009 is outside every app\.json idRanges/);
  assert.match(text, /AC-03 is closed by no ticket/);
  assert.match(text, /T-03\.md: cites AC-09, which is not in criteria\.md/);
});

test('validate reports missing fields, bad enums, unknown deps, done without result and missing criteria.md', () => {
  const p = project({ criteria: null });
  ticket(p.dir, 'T-01', { mode: 'auto', status: 'finished', acceptance: undefined });
  ticket(p.dir, 'T-02', { depends_on: '[T-09]', status: 'done', object_ids: '[abc]' });
  const text = tickets.validate(p.root, 'demo').problems.join('\n');
  assert.match(text, /T-01\.md: missing acceptance/);
  assert.match(text, /T-01\.md: mode must be afk or hitl/);
  assert.match(text, /T-01\.md: status must be one of/);
  assert.match(text, /T-02\.md: depends_on T-09, which does not exist/);
  assert.match(text, /T-02\.md: done without T-02\.result\.md/);
  assert.match(text, /object_ids entry "abc" is not a range/);
  assert.match(text, /no tickets\/criteria\.md/);
});

test('no tickets folder is a problem, not a crash', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-tickets-'));
  const r = tickets.validate(root, 'none');
  assert.strictEqual(r.ok, false);
  assert.match(r.problems[0], /no tickets folder/);
});

test('frontier follows depends_on; an in-progress ticket is resumed first', () => {
  const p = goodCut();
  assert.deepStrictEqual(tickets.summary(p.root, 'demo').frontier.map((f) => f.id), ['T-01']);
  fs.writeFileSync(path.join(p.dir, 'T-01.result.md'), '# T-01 result\n');
  tickets.setStatus(p.root, 'demo', 'T-01', 'done');
  tickets.setStatus(p.root, 'demo', 'T-03', 'in-progress');
  const s = tickets.summary(p.root, 'demo');
  assert.deepStrictEqual(s.frontier.map((f) => f.id), ['T-03', 'T-02']);
  assert.strictEqual(s.frontier[0].status, 'in-progress');
  assert.deepStrictEqual(s.done, ['T-01']);
  assert.strictEqual(s.finished, false);
});

test('set refuses done without a result file and rejects unknown statuses', () => {
  const p = goodCut();
  assert.throws(() => tickets.setStatus(p.root, 'demo', 'T-01', 'done'), /write T-01\.result\.md before marking it done/);
  assert.throws(() => tickets.setStatus(p.root, 'demo', 'T-01', 'finished'), /status must be one of/);
  assert.throws(() => tickets.setStatus(p.root, 'demo', 'T-07', 'ready'), /no ticket T-07/);
  tickets.setStatus(p.root, 'demo', 'T-02', 'blocked');
  assert.match(fs.readFileSync(path.join(p.dir, 'T-02.md'), 'utf8'), /^status: blocked$/m);
});

test('finished when every ticket is done or blocked; plans.root from aldc.yaml is honoured', () => {
  const p = goodCut();
  for (const id of ['T-01', 'T-02', 'T-03']) {
    fs.writeFileSync(path.join(p.dir, `${id}.result.md`), 'r');
    tickets.setStatus(p.root, 'demo', id, id === 'T-03' ? 'blocked' : 'done');
  }
  assert.strictEqual(tickets.summary(p.root, 'demo').finished, true);

  const q = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-tickets-'));
  fs.writeFileSync(path.join(q, 'aldc.yaml'), 'plans:\n  root: docs/plans\n');
  assert.strictEqual(tickets.ticketsDir(q, 'x'), path.join(q, 'docs', 'plans', 'x', 'tickets'));
});

test('CLI: exit codes and the resume summary', () => {
  const p = goodCut();
  const run = (...a) => spawnSync(process.execPath, [TOOL, ...a, '--project', p.root], { encoding: 'utf8' });
  assert.strictEqual(run('validate', 'demo').status, 0);
  const st = run('status', 'demo');
  assert.strictEqual(st.status, 0);
  assert.match(st.stdout, /demo: 0\/3 done/);
  assert.match(st.stdout, /research\.md: missing/);
  assert.match(st.stdout, /next: T-01/);
  assert.match(st.stdout, /waiting: T-02 for T-01/);
  assert.deepStrictEqual(JSON.parse(run('next', 'demo').stdout).map((f) => f.id), ['T-01']);
  ticket(p.dir, 'T-04', { object_ids: '[50100-50101]' });
  assert.strictEqual(run('validate', 'demo').status, 1);
  assert.strictEqual(run('bogus', 'demo').status, 3);
});

test('each surface resolves plans.root from its own aldc.yaml, and a project aldc.yaml wins', () => {
  const lib = (surface) => {
    // A copy of lib.js under a fake surface root with that surface's aldc.yaml.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-surface-'));
    if (surface) fs.writeFileSync(path.join(root, 'aldc.yaml'), `plans:\n  root: "${surface}"\n`);
    const dir = path.join(root, 'skills', 'aldc', 'scripts', 'tickets');
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(__dirname, '..', 'tools', 'tickets', 'lib.js'), path.join(dir, 'lib.js'));
    return require(path.join(dir, 'lib.js'));
  };
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-project-'));
  assert.strictEqual(lib('.agents/plans').plansRoot(project), path.join(project, '.agents', 'plans'));
  assert.strictEqual(require(path.join(__dirname, '..', 'claude-plugin', 'tools', 'tickets', 'lib.js')).plansRoot(project), path.join(project, '.claude', 'plans'));
  assert.strictEqual(require(path.join(__dirname, '..', 'tools', 'tickets', 'lib.js')).plansRoot(project), path.join(project, '.github', 'plans'));
  fs.writeFileSync(path.join(project, 'aldc.yaml'), 'plans:\n  root: "work/plans"\n');
  assert.strictEqual(lib('.agents/plans').plansRoot(project), path.join(project, 'work', 'plans'));
});

// ── Requirement traceability (trace.js) ──────────────────────────────────────
const trace = require(path.join(__dirname, '..', 'claude-plugin', 'tools', 'tickets', 'trace.js'));
const POINTS = (rows) => '# Spec\n\n### Requirement points\n\n| REQ | What was asked | Source | Acceptance |\n| --- | --- | --- | --- |\n' + rows.map((r) => `| ${r.join(' | ')} |`).join('\n') + '\n';

test('trace: a spec without Requirement points is not traceable and does not block the cut', () => {
  const p = goodCut();
  assert.strictEqual(trace.check(p.root, 'demo').traceable, false);
  assert.strictEqual(tickets.validate(p.root, 'demo').ok, true);
});

test('trace: a requirement point with no criterion stops the cut; one named only in criteria.md counts', () => {
  const p = goodCut();
  const spec = path.join(p.root, '.claude', 'plans', 'demo', 'demo.spec.md');
  fs.writeFileSync(spec, POINTS([['REQ-01', 'Email by default', 'issue #4', 'AC-01'], ['REQ-02', 'Rating note up to 100', 'DRF 3.2', ''], ['REQ-03', 'Vendor card', 'DRF 3.3', 'AC-09']]));
  const v = tickets.validate(p.root, 'demo');
  assert.strictEqual(v.ok, false);
  assert.ok(v.problems.includes('trace: REQ-02 has no acceptance criterion: nothing will check that it was delivered'));
  assert.ok(v.problems.includes('trace: REQ-03 names AC-09, which is not in tickets/criteria.md'));
  // criteria.md can carry the link instead of the spec table.
  fs.writeFileSync(spec, POINTS([['REQ-01', 'Email by default', 'issue #4', 'AC-01'], ['REQ-02', 'Rating note up to 100', 'DRF 3.2', '']]));
  fs.writeFileSync(path.join(p.dir, 'criteria.md'), '- AC-01: email (REQ-01)\n- AC-02: note stored (REQ-02)\n- AC-03: unchanged behaviour\n');
  const c = trace.check(p.root, 'demo');
  assert.strictEqual(c.ok, true, c.problems.join('; '));
  assert.deepStrictEqual(c.derived, ['AC-03']);
});

test('trace: the matrix gives one verdict per point from the review and the test evidence', () => {
  const p = goodCut();
  const plans = path.join(p.root, '.claude', 'plans', 'demo');
  fs.writeFileSync(path.join(plans, 'demo.spec.md'), POINTS([['REQ-01', 'a', 's', 'AC-01'], ['REQ-02', 'b', 's', 'AC-02'], ['REQ-03', 'c', 's', 'AC-03']]));
  fs.appendFileSync(path.join(p.dir, 'T-01.md'), '\n## Tests\n\n| Test | Criterion | Given / When / Then |\n|---|---|---|\n| EmailDefault | AC-01 | x |\n');
  assert.strictEqual(trace.matrix(p.root, 'demo').rows[0].verdict, 'pending review');
  fs.writeFileSync(path.join(plans, 'demo-review-final.json'), JSON.stringify({ review: { criteria: { declared: ['AC-01', 'AC-02', 'AC-03'], met: ['AC-01', 'AC-03'], unmet: ['AC-02'], 'not-evaluated': [] } } }));
  let m = trace.matrix(p.root, 'demo');
  assert.deepStrictEqual(m.rows.map((r) => r.verdict), ['met, not executed', 'unmet', 'met by review only']);
  fs.writeFileSync(path.join(plans, 'factory-run.json'), JSON.stringify({ runs: [{ steps: [{ kind: 'test', result: 'pass' }] }] }));
  m = trace.matrix(p.root, 'demo');
  assert.strictEqual(m.rows[0].verdict, 'met, executed');
  assert.match(fs.readFileSync(path.join(plans, 'traceability.md'), 'utf8'), /\| REQ-02 \| b \| s \| AC-02 \| unmet \| T-02 \| 0 \| \*\*unmet\*\* \|/);
});
