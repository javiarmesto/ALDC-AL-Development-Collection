'use strict';
// Adapted from Research Lab 0c2a147.../experiments/chat-install-001/lib/installer.mjs.
// Local file transactions only: no dependency installation or host configuration.
const fs = require('fs');
const path = require('path');
const { createHash, randomUUID } = require('crypto');
const { hostname } = require('os');
const hash = data => data === null ? null : createHash('sha256').update(data).digest('hex');
const encode = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const META = '.aldc-install';
function checked(root, rel) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel) || /[\\:\x00-\x1f]/.test(rel) ||
      rel.split('/').some(p => !p || p === '.' || p === '..' || /^\.git$/i.test(p) || /[. ]$/.test(p) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p))) throw Error(`Unsafe path: ${rel}`);
  const full = path.join(root, rel);
  for (let p = full; ; p = path.dirname(p)) {
    const stat = fs.lstatSync(p, { throwIfNoEntry: false });
    if (stat && (stat.isSymbolicLink() || (p !== full && !stat.isDirectory()) || (p === full && !stat.isFile()))) throw Error(`Expected regular path without symlinks: ${p}`);
    if (path.dirname(p) === p) break;
  }
  return full;
}
function read(root, rel) { const p = checked(root, rel); return fs.existsSync(p) ? fs.readFileSync(p) : null; }
function json(root, rel) { const b = read(root, rel); return b === null ? null : JSON.parse(b); }
function atomic(root, rel, bytes, mode = 0o644) {
  const p = checked(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const temp = p + '.' + randomUUID() + '.tmp';
  try { fs.writeFileSync(temp, bytes, { flag: 'wx', mode }); fs.renameSync(temp, p); fs.chmodSync(p, mode); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
function statePath(surface) {
  if (!/^[a-z0-9-]+$/.test(surface)) throw Error('Invalid surface');
  return `${META}/${surface}.json`;
}
function journalPath(id) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw Error('Invalid transaction ID');
  return `${META}/backups/${id}/journal.json`;
}
function acquire(root) {
  const rel = `${META}/operation.lock`, p = checked(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  let fd;
  try { fd = fs.openSync(p, 'wx', 0o600); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const before = fs.readFileSync(p); let owner; let dead = false;
    try { owner = JSON.parse(before); } catch { /* unknown locks stay locked */ }
    if (owner?.host === hostname() && Number.isInteger(owner.pid) && owner.pid > 0) {
      try { process.kill(owner.pid, 0); } catch (e) { dead = e.code === 'ESRCH'; }
    }
    if (!dead || !fs.readFileSync(p).equals(before)) throw Error('Another installer operation holds the lock');
    fs.unlinkSync(p); fd = fs.openSync(p, 'wx', 0o600);
  }
  fs.writeFileSync(fd, encode({ pid: process.pid, host: hostname() }));
  return () => { fs.closeSync(fd); fs.unlinkSync(p); };
}
function plan({ root, surface, files, force = false }) {
  root = path.resolve(root);
  if (json(root, `${META}/pending.json`)) throw Error('Interrupted operation: run rollback before installing');
  const state = json(root, statePath(surface));
  if (state && (state.schema !== 1 || state.surface !== surface || !state.files)) throw Error('Invalid installation receipt');
  const seen = new Set(), actions = [];
  for (const [rel, record] of files) {
    if (rel.startsWith(META + '/')) throw Error('Reserved installer destination');
    if (seen.has(rel.toLowerCase())) throw Error(`Duplicate destination: ${rel}`);
    seen.add(rel.toLowerCase());
    const before = read(root, rel), desired = Buffer.from(record.content);
    const oldHash = state?.files[rel];
    const drift = before !== null && !before.equals(desired) && hash(before) !== oldHash;
    const preserve = before !== null && (record.seed || (drift && !force && !record.merge));
    const after = preserve ? before : desired;
    actions.push({ rel, before, after, seed: Boolean(record.seed), managed: !preserve || oldHash !== undefined, retain: Boolean(record.retain), customized: Boolean(drift),
      status: before === null ? 'add' : preserve ? (record.seed ? 'preserve' : 'collision') : before.equals(after) ? 'unchanged' : 'replace' });
  }
  // Never delete unknown files. A retired tracked path needs an explicit decision
  // if customized, otherwise remove it with a recoverable preimage.
  for (const [rel, previous] of Object.entries(state?.files || {})) {
    if (files.has(rel) || state.retained?.includes(rel)) continue;
    if (rel.startsWith(META + '/')) throw Error('Invalid receipt destination');
    const before = read(root, rel); if (before === null) continue;
    if (hash(before) !== previous) throw Error(`Customized obsolete file: ${rel}`);
    actions.push({ rel, before, after: null, status: 'remove', managed: false });
  }
  return { root, surface, state, actions };
}
// customized: existing bytes match neither the receipt nor the packaged content,
// so a replace action overwrites a local change (recoverably) rather than a tracked file.
function report(plan) { return plan.actions.map(({ rel, status, before, after, customized }) => ({ path: rel, action: status, before: hash(before), after: hash(after), customized: Boolean(customized) })); }
// Stable identity of a planned outcome: the same files, actions and bytes.
function digest(plan) { return hash(Buffer.from(JSON.stringify(report(plan).map(f => [f.path, f.action, f.before, f.after])))); }
function restore(root, journal, interrupted = false, beforeWrites = () => {}) {
  if (journal?.schema !== 1 || !Array.isArray(journal.actions)) throw Error('Invalid rollback journal');
  const changes = [], preserved = [];
  for (const a of journal.actions) {
    const actual = hash(read(root, a.rel));
    if (a.seed && actual !== a.afterHash) { preserved.push(a.rel); continue; }
    if (interrupted && actual === a.beforeHash) continue;
    if (actual !== a.afterHash) throw Error(`Changed since installation; rollback would overwrite: ${a.rel}`);
    const before = a.backup === null ? null : read(root, a.backup);
    if (hash(before) !== a.beforeHash) throw Error(`Backup integrity mismatch: ${a.rel}`);
    changes.push({ ...a, before });
  }
  beforeWrites();
  for (const a of changes.reverse()) {
    if (hash(read(root, a.rel)) !== a.afterHash) throw Error(`Concurrent change during rollback: ${a.rel}`);
    if (a.before === null) fs.unlinkSync(checked(root, a.rel));
    else atomic(root, a.rel, a.before, a.mode);
  }
  return preserved;
}
function apply(options) {
  let p = plan(options);
  if (options.dryRun) return { files: report(p), transaction: null, dryRun: true, digest: digest(p) };
  const release = acquire(p.root);
  try {
    p = plan(options); // Read again under the installer lock.
    if (options.expectDigest && digest(p) !== options.expectDigest) throw Error('Installation plan changed since preview; review the new preview before applying');
    const files = {};
    const collisions = p.actions.filter(a => a.status === 'collision').map(a => a.rel);
    const retained = p.actions.filter(a => a.retain).map(a => a.rel);
    for (const a of p.actions) if (a.managed && !a.seed && a.after !== null) files[a.rel] = a.status === 'collision' ? p.state.files[a.rel] : hash(a.after);
    const changes = p.actions.filter(a => hash(a.before) !== hash(a.after));
    if (!changes.length && JSON.stringify(files) === JSON.stringify(p.state?.files || {}) && JSON.stringify(collisions) === JSON.stringify(p.state?.collisions || []) && JSON.stringify(retained) === JSON.stringify(p.state?.retained || [])) return { files: report(p), transaction: null, digest: digest(p) };
    const id = randomUUID(), stateRel = statePath(p.surface);
    changes.push({ rel: stateRel, before: read(p.root, stateRel), after: encode({ schema: 1, surface: p.surface, transaction: id, files, collisions, retained }) });
    const journal = { schema: 1, id, surface: p.surface, status: 'prepared', actions: [] };
    for (const [i, a] of changes.entries()) {
      const stat = fs.lstatSync(checked(p.root, a.rel), { throwIfNoEntry: false });
      const mode = stat ? stat.mode & 0o777 : 0o644;
      const backup = a.before === null ? null : `${META}/backups/${id}/${i}.before`;
      if (backup) atomic(p.root, backup, a.before, 0o600);
      journal.actions.push({ rel: a.rel, seed: a.seed || false, beforeHash: hash(a.before), afterHash: hash(a.after), backup, mode });
    }
    atomic(p.root, journalPath(id), encode(journal), 0o600);
    atomic(p.root, `${META}/.gitignore`, Buffer.from('*\n'));
    atomic(p.root, `${META}/pending.json`, encode({ id }), 0o600);
    try {
      for (const [i, a] of changes.entries()) {
        if (hash(read(p.root, a.rel)) !== hash(a.before)) throw Error(`Concurrent change before write: ${a.rel}`);
        if (a.after === null) fs.unlinkSync(checked(p.root, a.rel));
        else atomic(p.root, a.rel, a.after, journal.actions[i].mode);
        if (options.failAfter === i + 1) throw Error('Injected write failure');
      }
      journal.status = 'committed'; atomic(p.root, journalPath(id), encode(journal), 0o600);
      fs.unlinkSync(checked(p.root, `${META}/pending.json`));
    } catch (error) {
      try {
        restore(p.root, journal, true);
        journal.status = 'reverted'; atomic(p.root, journalPath(id), encode(journal), 0o600);
        fs.unlinkSync(checked(p.root, `${META}/pending.json`));
      } catch (recovery) { throw Error(`${error.message}; recovery pending: ${recovery.message}`); }
      throw Error(`${error.message}; previous files restored`);
    }
    return { files: report(p), transaction: id, digest: digest(p) };
  } finally { release(); }
}
function rollback(root, surface) {
  root = path.resolve(root); const release = acquire(root);
  try {
    const pending = json(root, `${META}/pending.json`), state = json(root, statePath(surface));
    const id = pending?.id || state?.transaction;
    if (!id) throw Error('No installation to roll back');
    const journal = json(root, journalPath(id));
    if (journal?.id !== id || journal.surface !== surface) throw Error('Pending transaction belongs to another surface or has invalid ID');
    const preserved = restore(root, journal, Boolean(pending), () => {
      atomic(root, `${META}/pending.json`, encode({ id }), 0o600);
    });
    journal.status = 'rolled-back'; atomic(root, journalPath(id), encode(journal), 0o600);
    fs.unlinkSync(checked(root, `${META}/pending.json`));
    return { rolledBack: id, preserved };
  } finally { release(); }
}
function drift(root, surface) {
  const rel = statePath(surface);
  let state;
  try { state = json(root, rel); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw Error(`Invalid installation receipt (${rel}): malformed JSON. Preserve the receipt/backups and inspect before replacing anything.`);
  }
  if (!state) throw Error(`No installation receipt (${rel}). Run Install Toolkit to Workspace (CLI: aldc install) and review existing-file collisions; older toolkit copies may have no receipt.`);
  if (state.schema !== 1 || state.surface !== surface || !state.files || typeof state.files !== 'object' || Array.isArray(state.files))
    throw Error(`Invalid installation receipt (${rel}). Preserve the receipt/backups and inspect before replacing anything.`);
  return [...new Set([...(state.collisions || []), ...Object.entries(state.files).filter(([rel, h]) => hash(read(root, rel)) !== h).map(([rel]) => rel)])];
}
// Read-only state for a user interface. Absent, invalid and drifted receipts are
// reported as data, never thrown; restore() remains the authority at rollback time.
function inspect(root, surface) {
  root = path.resolve(root);
  const rel = statePath(surface);
  const result = { surface, receipt: 'absent', receiptPath: rel, receiptProblem: null, transaction: null, pending: null,
    managed: 0, drift: [], collisions: [], retained: [],
    restore: { available: false, transaction: null, status: null, reason: 'No recorded installation transaction', interrupted: false, changes: [], preserved: [], blocked: [] } };
  let state = null;
  const raw = read(root, rel);
  if (raw !== null) {
    try { state = JSON.parse(raw); } catch { state = undefined; }
    if (state === undefined) result.receiptProblem = 'malformed JSON';
    else if (!state || state.schema !== 1 || state.surface !== surface || !state.files || typeof state.files !== 'object' || Array.isArray(state.files)) result.receiptProblem = 'unexpected receipt schema or surface';
    if (result.receiptProblem) { result.receipt = 'invalid'; state = null; }
    else {
      result.receipt = 'valid'; result.transaction = state.transaction || null; result.managed = Object.keys(state.files).length;
      result.collisions = [...(state.collisions || [])]; result.retained = [...(state.retained || [])];
      result.drift = [...new Set([...result.collisions, ...Object.entries(state.files).filter(([p, h]) => hash(read(root, p)) !== h).map(([p]) => p)])];
    }
  }
  try { result.pending = json(root, `${META}/pending.json`)?.id || null; } catch { result.pending = null; result.pendingProblem = 'malformed pending marker'; }
  const id = result.pending || state?.transaction;
  const restore = result.restore;
  if (!id) return result;
  restore.transaction = id; restore.interrupted = Boolean(result.pending);
  let journal = null;
  try { journal = json(root, journalPath(id)); } catch { journal = null; }
  if (journal?.id !== id || journal.surface !== surface || journal.schema !== 1 || !Array.isArray(journal.actions)) { restore.reason = 'Rollback journal is missing or invalid'; return result; }
  restore.status = journal.status;
  if (journal.status === 'rolled-back' && !restore.interrupted) { restore.reason = 'The last transaction was already rolled back'; return result; }
  for (const a of journal.actions) {
    const actual = hash(read(root, a.rel));
    if (a.seed && actual !== a.afterHash) { restore.preserved.push(a.rel); continue; }
    if (restore.interrupted && actual === a.beforeHash) continue;
    if (actual !== a.afterHash) { restore.blocked.push(a.rel); continue; }
    let backup = null;
    try { backup = a.backup === null ? null : read(root, a.backup); } catch { backup = undefined; }
    if (backup === undefined || hash(backup) !== a.beforeHash) { restore.reason = `Backup integrity mismatch: ${a.rel}`; return result; }
    restore.changes.push(a.rel);
  }
  restore.available = restore.blocked.length === 0;
  restore.reason = restore.available ? null : 'Changed since installation; rollback would overwrite later edits';
  return result;
}
// The caller supplies only its managed fragment; surrounding user bytes survive.
function managedBlock(existing, fragment, label) {
  const begin = `<!-- BEGIN ALDC ${label} -->`, end = `<!-- END ALDC ${label} -->`;
  const text = existing === null ? '' : existing.toString('utf8');
  const block = `${begin}\n${fragment.trim()}\n${end}`;
  const starts = text.split(begin).length - 1, ends = text.split(end).length - 1;
  if (starts !== ends || starts > 1 || (starts && text.indexOf(end) < text.indexOf(begin))) throw Error('Inconsistent ALDC managed markers');
  if (!starts) return Buffer.from(text + (text ? (text.endsWith('\n') ? '\n' : '\n\n') : '') + block + '\n');
  return Buffer.from(text.slice(0, text.indexOf(begin)) + block + text.slice(text.indexOf(end) + end.length));
}
module.exports = { apply, plan, report, digest, inspect, rollback, drift, hash, read, checked, managedBlock };
