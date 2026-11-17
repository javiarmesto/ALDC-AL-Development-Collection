'use strict';
// Tests for claude-plugin/tools/tickets/tickets.js (factory phase 3). No model calls.
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
