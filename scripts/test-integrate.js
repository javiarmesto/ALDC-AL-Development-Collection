'use strict';
// Tests for tools/tickets/integrate.js, run through its Claude Code copy (factory phase 4). Real git, no model calls.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const TOOL = path.join(__dirname, '..', 'claude-plugin', 'tools', 'tickets', 'integrate.js');
const TICKETS = path.join(__dirname, '..', 'claude-plugin', 'tools', 'tickets', 'tickets.js');
const integrate = require(TOOL);

const ID = ['-c', 'user.name=t', '-c', 'user.email=t@localhost'];
function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

function ticket(dir, id, fields = {}) {
  const f = { title: `Ticket ${id}`, depends_on: '[]', mode: 'afk', object_ids: '[50100-50109]', acceptance: '[AC-01]', bcq: '[]', shared_files: '[App/src/Demo.PermissionSet.al]', status: 'in-progress', ...fields };
  fs.writeFileSync(path.join(dir, `${id}.md`), `---\nid: ${id}\n${Object.entries(f).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n\n## Scope\n\nx\n`);
}

/** A git repo with one AL app, two tickets and the plans folder (untracked, as in a real project). */
function repo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-integrate-'));
  git(root, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(root, 'App', 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'App', 'app.json'), JSON.stringify({ name: 'Demo', idRanges: [{ from: 50100, to: 50149 }] }));
  fs.writeFileSync(path.join(root, 'App', 'src', 'Demo.PermissionSet.al'), 'permissionset 50149 "Demo"\n{\n}\n');
  git(root, 'add', 'App/app.json'); git(root, 'add', 'App/src/Demo.PermissionSet.al');
  git(root, ...ID, 'commit', '-qm', 'base');
  const dir = path.join(root, '.claude', 'plans', 'demo', 'tickets');
  fs.mkdirSync(dir, { recursive: true });
  ticket(dir, 'T-01', { object_ids: '[50100-50109]' });
  ticket(dir, 'T-02', { object_ids: '[50110-50119]' });
  return { root, dir };
}

function worktree(root, name) {
  const wt = path.join(root, '.claude', 'worktrees', name);
  git(root, 'worktree', 'add', '-q', wt, '-b', `worktree-agent-${name}`);
  return wt;
}

const write = (dir, rel, text) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text); };
const run = (root, ...args) => spawnSync(process.execPath, [TOOL, ...args, '--project', root], { encoding: 'utf8' });

test('prepare switches to aldc/<req>, records the base and excludes .claude/worktrees', () => {
  const { root } = repo();
  const r = integrate.prepare(root, 'demo');
  assert.strictEqual(r.branch, 'aldc/demo');
  assert.strictEqual(r.base, 'main');
  assert.strictEqual(git(root, 'branch', '--show-current'), 'aldc/demo');
  assert.match(fs.readFileSync(path.join(root, '.git', 'info', 'exclude'), 'utf8'), /^\.claude\/worktrees\/$/m);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(root, '.claude', 'plans', 'demo', 'integration.json'), 'utf8')).base, 'main');
  // Idempotent: a second prepare (a resumed session) keeps the recorded base.
  assert.strictEqual(integrate.prepare(root, 'demo').base, 'main');
});

test('two tickets in parallel worktrees merge into aldc/<req>, one merge commit each', () => {
  const { root, dir } = repo();
  integrate.prepare(root, 'demo');
  const a = worktree(root, 'a'); const b = worktree(root, 'b');
  write(a, 'App/src/Alpha.Table.al', 'table 50100 "Alpha"\n{\n}\n');
  write(a, '.claude/.aldc-verify/state.json', '{}'); // gate state in the worktree: never integrated
  write(b, 'App/src/Beta.Codeunit.al', 'codeunit 50110 "Beta"\n{\n}\n');
  const ra = integrate.integrateTicket(root, 'demo', 'T-01', a);
  const rb = integrate.integrateTicket(root, 'demo', 'T-02', b);
  assert.strictEqual(ra.status, 'merged'); assert.strictEqual(rb.status, 'merged');
  assert.deepStrictEqual(ra.files, ['App/src/Alpha.Table.al']);
  assert.deepStrictEqual(ra.objects, [{ type: 'table', id: 50100, file: 'App/src/Alpha.Table.al' }]);
  assert.ok(fs.existsSync(path.join(root, 'App', 'src', 'Alpha.Table.al')) && fs.existsSync(path.join(root, 'App', 'src', 'Beta.Codeunit.al')));
  assert.ok(!fs.existsSync(a) && !fs.existsSync(b), 'worktrees removed');
  assert.strictEqual(git(root, 'branch', '--list', 'worktree-agent-*'), '', 'ticket branches deleted');
  assert.match(git(root, 'log', '--merges', '--format=%s'), /Merge T-02: Ticket T-02\nMerge T-01: Ticket T-01/);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, 'T-01.integration.json'), 'utf8')).status, 'merged');
  assert.deepStrictEqual(integrate.status(root, 'demo').merged.map((m) => m.ticket), ['T-01', 'T-02']);
});

test('an object outside the ticket range is refused, nothing is committed', () => {
  const { root } = repo();
  integrate.prepare(root, 'demo');
  const a = worktree(root, 'a');
  write(a, 'App/src/Alpha.Table.al', 'table 50111 "Alpha"\n{\n}\n');
  const r = run(root, 'ticket', 'demo', 'T-01', '--worktree', a);
  assert.strictEqual(r.status, 1);
  const res = JSON.parse(r.stdout);
  assert.strictEqual(res.status, 'refused');
  assert.match(res.problems[0], /table 50111 is outside the ticket's object_ids \(50100-50109\)/);
  assert.ok(fs.existsSync(a), 'the worktree stays for the Conductor to discard');
  assert.strictEqual(git(root, 'log', '--format=%s', '-1'), 'base');
});

test('a shared file changed in a ticket is refused', () => {
  const { root } = repo();
  integrate.prepare(root, 'demo');
  const a = worktree(root, 'a');
  write(a, 'App/src/Demo.PermissionSet.al', 'permissionset 50149 "Demo"\n{\n    Permissions = tabledata Alpha = RIMD;\n}\n');
  const res = integrate.integrateTicket(root, 'demo', 'T-01', a);
  assert.strictEqual(res.status, 'refused');
  assert.match(res.problems.join('\n'), /Demo\.PermissionSet\.al is a shared file/);
});

test('two tickets editing the same file: the second conflicts, the merge is aborted', () => {
  const { root } = repo();
  write(root, 'App/src/Notes.txt', 'base\n');
  git(root, 'add', 'App/src/Notes.txt'); git(root, ...ID, 'commit', '-qm', 'notes');
  integrate.prepare(root, 'demo');
  const a = worktree(root, 'a'); const b = worktree(root, 'b');
  write(a, 'App/src/Notes.txt', 'alpha\n'); write(b, 'App/src/Notes.txt', 'beta\n');
  assert.strictEqual(integrate.integrateTicket(root, 'demo', 'T-01', a).status, 'merged');
  const rb = integrate.integrateTicket(root, 'demo', 'T-02', b);
  assert.strictEqual(rb.status, 'conflict');
  assert.deepStrictEqual(rb.conflicts, ['App/src/Notes.txt']);
  assert.strictEqual(git(root, 'status', '--porcelain', '--untracked-files=no'), '', 'merge aborted, tree clean');
  assert.strictEqual(fs.readFileSync(path.join(root, 'App', 'src', 'Notes.txt'), 'utf8').replace(/\r\n/g, '\n'), 'alpha\n');
});

test('an empty worktree has nothing to integrate', () => {
  const { root } = repo();
  integrate.prepare(root, 'demo');
  const a = worktree(root, 'a');
  assert.strictEqual(integrate.integrateTicket(root, 'demo', 'T-01', a).status, 'empty');
});

test('commit puts the integration step (shared files) on aldc/<req>, leaving .claude/ out', () => {
  const { root } = repo();
  integrate.prepare(root, 'demo');
  write(root, 'App/src/Demo.PermissionSet.al', 'permissionset 50149 "Demo"\n{\n    Permissions = tabledata Alpha = RIMD;\n}\n');
  const r = integrate.commitIntegration(root, 'demo', 'chore: permissions for T-01');
  assert.strictEqual(r.status, 'committed');
  assert.deepStrictEqual(r.files, ['App/src/Demo.PermissionSet.al']);
  assert.match(git(root, 'status', '--porcelain'), /\.claude\//, 'plans stay untracked');
});

test('cleanup removes agent worktrees a dead session left; discard removes one', () => {
  const { root } = repo();
  integrate.prepare(root, 'demo');
  const a = worktree(root, 'a'); worktree(root, 'b');
  write(a, 'App/src/Alpha.Table.al', 'table 50100 "Alpha"\n{\n}\n');
  assert.strictEqual(integrate.status(root, 'demo').leftover.length, 2);
  const d = JSON.parse(run(root, 'discard', 'demo', '--worktree', a).stdout);
  assert.strictEqual(d.status, 'discarded'); assert.ok(!fs.existsSync(a));
  // A folder git no longer knows (a removal that hit a locked file) is swept too.
  fs.mkdirSync(path.join(root, '.claude', 'worktrees', 'orphan', 'App'), { recursive: true });
  const c = integrate.cleanup(root);
  assert.strictEqual(c.removed.length, 1);
  assert.ok(c.orphans.some((o) => o.endsWith('/orphan')));
  assert.ok(!fs.existsSync(path.join(root, '.claude', 'worktrees', 'orphan')));
  assert.deepStrictEqual(integrate.status(root, 'demo').leftover, []);
  assert.strictEqual(git(root, 'branch', '--list', 'worktree-agent-*'), '');
});

test('object declarations and shared-file patterns', () => {
  assert.deepStrictEqual(integrate.objectsIn('namespace X;\ntableextension 50101 "C" extends Customer\n{\n}\n// codeunit 1 "c"\npermissionset 50102 P {}'), [
    { type: 'tableextension', id: 50101 }, { type: 'permissionset', id: 50102 },
  ]);
  assert.ok(integrate.matchesShared('App/src/Permissions/Demo.PermissionSet.al', ['*.PermissionSet.al']));
  assert.ok(integrate.matchesShared('App/app.json', ['app.json']));
  assert.ok(!integrate.matchesShared('App/src/Alpha.Table.al', ['*.PermissionSet.al', 'app.json']));
});

test('tickets.js wave caps the frontier at ALDC_PARALLEL', () => {
  const { root, dir } = repo();
  ticket(dir, 'T-03', { object_ids: '[50120-50129]', status: 'ready' });
  const env = { ...process.env, ALDC_PARALLEL: '2' };
  const r = spawnSync(process.execPath, [TICKETS, 'wave', 'demo', '--project', root], { encoding: 'utf8', env });
  const w = JSON.parse(r.stdout);
  assert.strictEqual(w.parallel, 2); assert.strictEqual(w.source, 'ALDC_PARALLEL');
  assert.deepStrictEqual(w.tickets.map((t) => t.id), ['T-01', 'T-02']);
  assert.strictEqual(w.left, 1);
});
