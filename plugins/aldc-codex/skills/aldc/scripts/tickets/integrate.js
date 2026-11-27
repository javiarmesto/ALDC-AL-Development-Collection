#!/usr/bin/env node
'use strict';
// aldc-claude 5.5.0 (factory phase 4): deterministic integration of ticket worktrees.
// Each ticket implementer runs with isolation: worktree and never touches git (the host refuses
// compound git commands inside a worktree). This tool, run by the Conductor from the main
// checkout, does all of the git work. It commits the ticket's files on the worktree branch,
// checks them against the ticket and merges the branch into aldc/<req>.
//
//   node integrate.js prepare <req> [--project .]          switch to aldc/<req> (create it from HEAD)
//   node integrate.js ticket  <req> <T-NN> --worktree <p>  check, commit, merge --no-ff, remove worktree
//   node integrate.js discard <req> --worktree <p>         remove a worktree and its branch, no merge
//   node integrate.js commit  <req> --message "<m>"        commit changes outside .claude/ on aldc/<req>
//   node integrate.js cleanup <req>                        remove agent worktrees left by a dead session
//   node integrate.js status  <req>                        branch, base, merged tickets, leftover worktrees
// Exit 0 ok, 1 refused (problems, conflict, nothing to integrate), 3 tool failure. Output is JSON.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadTickets, parseRanges, ticketsDir, plansRoot } = require('./tickets');

const OBJECT = /^\s*(table|tableextension|page|pageextension|pagecustomization|codeunit|report|reportextension|query|xmlport|enum|enumextension|permissionset|permissionsetextension)\s+(\d+)\b/gim;
const WIN = process.platform === 'win32';
// Real paths: git prints long names, while a Windows temp dir can be an 8.3 short name.
const real = (p) => { try { return fs.realpathSync.native(path.resolve(p)); } catch { return path.resolve(p); } };
const same = (a, b) => { const n = (p) => real(p).replace(/[\\/]+$/, ''); return WIN ? n(a).toLowerCase() === n(b).toLowerCase() : n(a) === n(b); };
const posix = (p) => p.split(path.sep).join('/');

function git(cwd, args, { allowFail = false } = {}) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 << 20, windowsHide: true });
  if (r.error) throw new Error(`git ${args[0]}: ${r.error.message}`);
  if (r.status !== 0 && !allowFail) throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || r.stdout).trim()}`);
  return r;
}
const out = (r) => (r.stdout || '').trim();

/** Commit identity: the repository's own; a neutral one only when none is configured. */
function identity(cwd) {
  const email = out(git(cwd, ['config', 'user.email'], { allowFail: true }));
  return email ? [] : ['-c', 'user.name=ALDC', '-c', 'user.email=aldc@localhost'];
}

const branchName = (req) => `aldc/${req}`;
const stateFile = (project, req) => path.join(plansRoot(project), req, 'integration.json');
const readState = (project, req) => { try { return JSON.parse(fs.readFileSync(stateFile(project, req), 'utf8')); } catch { return null; } };
const writeState = (project, req, s) => { fs.mkdirSync(path.dirname(stateFile(project, req)), { recursive: true }); fs.writeFileSync(stateFile(project, req), JSON.stringify(s, null, 2) + '\n'); };

/** Files changed in a checkout (tracked and untracked), relative and with forward slashes. .claude/ is never integrated. */
function changedFiles(cwd) {
  const r = git(cwd, ['status', '--porcelain', '-uall', '-z']);
  const files = [];
  const parts = (r.stdout || '').split('\0').filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const code = parts[i].slice(0, 2); let file = parts[i].slice(3);
    if (code[0] === 'R' || code[0] === 'C') i++; // rename: the next entry is the old path
    file = file.replace(/\\/g, '/');
    if (!file.startsWith('.claude/')) files.push({ file, deleted: code.includes('D') });
  }
  return files;
}

function currentBranch(cwd) { return out(git(cwd, ['branch', '--show-current'], { allowFail: true })); }

function mainCheckout(cwd) {
  const common = out(git(cwd, ['rev-parse', '--path-format=absolute', '--git-common-dir']));
  return path.dirname(common);
}

function excludeWorktrees(project) {
  const file = path.join(out(git(project, ['rev-parse', '--path-format=absolute', '--git-dir'])), 'info', 'exclude');
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!/^\/?\.claude\/worktrees\/?$/m.test(text)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, (text && !text.endsWith('\n') ? '\n' : '') + '.claude/worktrees/\n');
  }
}

function prepare(project, req) {
  if (git(project, ['rev-parse', '--git-dir'], { allowFail: true }).status !== 0) throw new Error(`${project} is not a git repository: the ticket path with worktrees needs one`);
  if (!same(mainCheckout(project), project)) throw new Error('run prepare from the main checkout, not from a worktree');
  excludeWorktrees(project);
  const branch = branchName(req);
  const current = currentBranch(project);
  const state = readState(project, req) || {};
  if (current !== branch) {
    const exists = git(project, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], { allowFail: true }).status === 0;
    git(project, exists ? ['switch', branch] : ['switch', '-c', branch]);
    if (!exists) Object.assign(state, { base: current || null, baseCommit: out(git(project, ['rev-parse', 'HEAD'])) });
  }
  Object.assign(state, { req, branch, merged: state.merged || [] });
  if (!state.baseCommit) state.baseCommit = out(git(project, ['merge-base', 'HEAD', state.base || 'HEAD'], { allowFail: true })) || out(git(project, ['rev-parse', 'HEAD']));
  writeState(project, req, state);
  return { status: 'ready', branch, base: state.base, baseCommit: state.baseCommit, dirty: changedFiles(project).map((f) => f.file) };
}

/** Object declarations in an AL file: [{ type, id }]. */
function objectsIn(text) {
  return [...String(text || '').matchAll(OBJECT)].map((m) => ({ type: m[1].toLowerCase(), id: +m[2] }));
}

function matchesShared(file, shared) {
  const f = file.toLowerCase();
  return (shared || []).some((s) => {
    const p = String(s).replace(/\\/g, '/').toLowerCase().replace(/^\.\//, '');
    if (!p) return false;
    if (p.includes('*')) return new RegExp('^' + p.split('*').map((x) => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$').test(f) || new RegExp('(^|/)' + p.split('*').map((x) => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$').test(f);
    return f === p || f.endsWith('/' + p);
  });
}

/** Check a ticket worktree against its ticket: files outside shared_files, object IDs inside object_ids. */
function check(worktree, ticket, files) {
  const problems = [];
  const ranges = parseRanges(ticket.data.object_ids).filter(Boolean);
  const objects = [];
  for (const { file, deleted } of files) {
    if (matchesShared(file, ticket.data.shared_files)) problems.push(`${file} is a shared file (shared_files); it is changed in the integration step, not in a ticket`);
    if (deleted || !/\.al$/i.test(file)) continue;
    for (const o of objectsIn(fs.readFileSync(path.join(worktree, file), 'utf8'))) {
      objects.push({ ...o, file });
      if (!ranges.some((r) => o.id >= r.from && o.id <= r.to)) problems.push(`${file}: ${o.type} ${o.id} is outside the ticket's object_ids (${(ticket.data.object_ids || []).join(', ') || 'none'})`);
    }
  }
  return { problems, objects };
}

/** Remove a worktree and its branch. On Windows a process that just left the folder can still
 * hold a file for a moment (EPERM): retry, and if the folder still stays, report it as left over
 * instead of failing the integration (git forgets it either way; cleanup removes it later). */
function removeWorktree(project, worktree, branch) {
  git(project, ['worktree', 'remove', '--force', worktree], { allowFail: true });
  let leftover = null;
  if (fs.existsSync(worktree)) {
    try { fs.rmSync(worktree, { recursive: true, force: true, maxRetries: 10, retryDelay: 400 }); }
    catch (e) { leftover = `${posix(worktree)} (${e.code || e.message})`; }
  }
  git(project, ['worktree', 'prune'], { allowFail: true });
  if (branch && !branch.startsWith('aldc/')) git(project, ['branch', '-D', branch], { allowFail: true });
  return leftover;
}

/** The compile gate's own record inside a worktree (aldc-verify state), kept before the worktree goes. */
function gateEvidence(worktree) {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(worktree, '.claude', '.aldc-verify', 'state.json'), 'utf8'));
    return { lastGreen: !!s.lastGreen, history: (s.history || []).slice(-8) };
  } catch { return null; }
}

function findTicket(project, req, id) {
  const t = (loadTickets(project, req) || []).find((x) => (x.data.id || '').toUpperCase() === String(id).toUpperCase());
  if (!t) throw new Error(`no ticket ${id} in ${ticketsDir(project, req)}`);
  return t;
}

function integrateTicket(project, req, id, worktree) {
  if (!worktree) throw new Error('--worktree <path> is required (worktreePath from the Agent result)');
  worktree = path.resolve(project, worktree);
  if (!fs.existsSync(worktree)) throw new Error(`no worktree at ${worktree}`);
  if (!same(mainCheckout(worktree), project) || same(worktree, project)) throw new Error(`${worktree} is not a linked worktree of ${project}`);
  const branch = branchName(req);
  if (currentBranch(project) !== branch) throw new Error(`the main checkout is on ${currentBranch(project) || 'a detached HEAD'}, not ${branch}: run prepare first`);
  const ticket = findTicket(project, req, id);
  const wtBranch = currentBranch(worktree);
  const files = changedFiles(worktree);
  const record = { ticket: ticket.data.id, title: ticket.data.title, worktree: posix(worktree), worktreeBranch: wtBranch || null, at: new Date().toISOString() };
  const save = (r) => { fs.writeFileSync(path.join(ticketsDir(project, req), `${ticket.data.id}.integration.json`), JSON.stringify({ ...record, ...r }, null, 2) + '\n'); return { ...record, ...r }; };

  // Commits the agent made anyway count too: check them like uncommitted files.
  const committed = out(git(worktree, ['diff', '--name-only', `${branch}...HEAD`], { allowFail: true })).split(/\r?\n/).filter((f) => f && !f.startsWith('.claude/'));
  if (!files.length && !committed.length) return save({ status: 'empty', problems: ['the worktree has no changes outside .claude/: nothing to integrate'] });
  const toCheck = [...files, ...committed.filter((f) => !files.some((x) => x.file === f)).map((file) => ({ file, deleted: !fs.existsSync(path.join(worktree, file)) }))];
  const { problems, objects } = check(worktree, ticket, toCheck);
  if (problems.length) return save({ status: 'refused', problems, files: toCheck.map((f) => f.file), objects });

  // Commit on the worktree branch, file by file (never add -A).
  if (files.length) {
    for (const { file, deleted } of files) git(worktree, deleted ? ['rm', '--cached', '--quiet', '--', file] : ['add', '--', file]);
    // A file rewritten with identical content (line endings only, under autocrlf) stages nothing.
    const staged = git(worktree, ['diff', '--cached', '--quiet'], { allowFail: true }).status !== 0;
    if (staged) git(worktree, [...identity(worktree), 'commit', '--quiet', '-m', `${ticket.data.id}: ${ticket.data.title}`]);
    else if (!committed.length) return save({ status: 'empty', problems: ['the worktree changes nothing once staged (identical content)'] });
  }
  const commit = out(git(worktree, ['rev-parse', 'HEAD']));
  const merge = git(project, [...identity(project), 'merge', '--no-ff', '--no-edit', '-m', `Merge ${ticket.data.id}: ${ticket.data.title}`, commit], { allowFail: true });
  if (merge.status !== 0) {
    const conflicts = out(git(project, ['diff', '--name-only', '--diff-filter=U'], { allowFail: true })).split(/\r?\n/).filter(Boolean);
    git(project, ['merge', '--abort'], { allowFail: true });
    return save({ status: 'conflict', commit, conflicts, detail: (merge.stderr || merge.stdout || '').trim().slice(0, 2000), files: files.map((f) => f.file) });
  }
  const mergeCommit = out(git(project, ['rev-parse', 'HEAD']));
  const gate = gateEvidence(worktree);
  const leftover = removeWorktree(project, worktree, wtBranch);
  const state = readState(project, req) || { req, branch, merged: [] };
  state.merged = [...(state.merged || []).filter((m) => m.ticket !== ticket.data.id), { ticket: ticket.data.id, commit, merge: mergeCommit }];
  writeState(project, req, state);
  return save({ status: 'merged', commit, merge: mergeCommit, files: toCheck.map((f) => f.file), objects, gate, ...(leftover ? { leftover } : {}) });
}

/** Remove a worktree and its branch without merging. */
function discard(project, worktree) {
  const wt = path.resolve(project, worktree);
  const br = fs.existsSync(wt) ? currentBranch(wt) : null;
  removeWorktree(project, wt, br);
  return { status: 'discarded', worktree: posix(wt), branch: br };
}

function commitIntegration(project, req, message) {
  if (!message) throw new Error('--message "<text>" is required');
  const branch = branchName(req);
  if (currentBranch(project) !== branch) throw new Error(`the main checkout is not on ${branch}`);
  const files = changedFiles(project);
  if (!files.length) return { status: 'clean', files: [] };
  for (const { file, deleted } of files) git(project, deleted ? ['rm', '--cached', '--quiet', '--', file] : ['add', '--', file]);
  git(project, [...identity(project), 'commit', '--quiet', '-m', message]);
  return { status: 'committed', commit: out(git(project, ['rev-parse', 'HEAD'])), files: files.map((f) => f.file) };
}

/** Linked worktrees of agents: under .claude/worktrees/ or on a worktree-agent-* branch. */
function agentWorktrees(project) {
  const list = out(git(project, ['worktree', 'list', '--porcelain'], { allowFail: true }));
  const items = [];
  for (const block of list.split(/\r?\n\r?\n/)) {
    const wt = block.match(/^worktree (.+)$/m); const br = block.match(/^branch refs\/heads\/(.+)$/m);
    if (!wt || same(wt[1], project)) continue;
    const p = wt[1].replace(/\\/g, '/');
    if (/\/\.claude\/worktrees\//.test(p) || /^worktree-agent-/.test(br ? br[1] : '')) items.push({ worktree: p, branch: br ? br[1] : null });
  }
  return items;
}

function cleanup(project) {
  const removed = agentWorktrees(project);
  for (const w of removed) removeWorktree(project, w.worktree, w.branch);
  // Folders git already forgot: a removal that hit a locked file on Windows left them behind.
  const root = path.join(project, '.claude', 'worktrees');
  const orphans = [];
  for (const name of fs.existsSync(root) ? fs.readdirSync(root) : []) {
    const dir = path.join(root, name);
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); orphans.push(posix(dir)); } catch { /* still locked: next cleanup */ }
  }
  return { status: 'clean', removed, orphans };
}

function status(project, req) {
  const state = readState(project, req);
  return { req, branch: branchName(req), current: currentBranch(project), base: state?.base ?? null, baseCommit: state?.baseCommit ?? null, merged: state?.merged || [], leftover: agentWorktrees(project) };
}

function main(argv) {
  const args = argv.slice(2);
  const opt = (name, dflt) => { const i = args.indexOf(name); if (i === -1) return dflt; const v = args[i + 1]; args.splice(i, 2); return v; };
  const project = path.resolve(opt('--project', '.'));
  const worktree = opt('--worktree');
  const message = opt('--message');
  const [cmd, req, id] = args;
  if (!cmd || !req) { console.error('usage: integrate.js <prepare|ticket|discard|commit|cleanup|status> <req> [T-NN] [--worktree <path>] [--message "<m>"] [--project .]'); return 3; }
  try {
    let r;
    if (cmd === 'prepare') r = prepare(project, req);
    else if (cmd === 'ticket') r = integrateTicket(project, req, id, worktree);
    else if (cmd === 'discard') {
      if (!worktree) throw new Error('--worktree <path> is required');
      r = discard(project, worktree);
    } else if (cmd === 'commit') r = commitIntegration(project, req, message);
    else if (cmd === 'cleanup') r = cleanup(project);
    else if (cmd === 'status') r = status(project, req);
    else { console.error(`unknown command ${cmd}`); return 3; }
    console.log(JSON.stringify(r, null, 2));
    return ['empty', 'refused', 'conflict'].includes(r.status) ? 1 : 0;
  } catch (e) { console.error(`integrate: ${e.message}`); return 3; }
}

if (require.main === module) process.exitCode = main(process.argv);
module.exports = { prepare, integrateTicket, discard, commitIntegration, cleanup, status, objectsIn, matchesShared, changedFiles, agentWorktrees, main };
