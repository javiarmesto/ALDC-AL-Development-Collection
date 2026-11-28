#!/usr/bin/env node
'use strict';
// aldc-claude: Stop hook. In pre-approved mode, do not let the session end while a plan
// started in this session has no final <task>-complete.md and no blocked.md. Evals Oct 2026:
// conductors ended their turn with phases pending (one left the API undone).
// Human mode never blocks: there the plan legitimately waits for approval.
// Bounded: at most MAX_BLOCKS blocks per session, so it can never loop forever.
const fs = require('fs');
const path = require('path');
const runtime = require('./aldc-runtime');
const evidence = require('./evidence');
const tickets = require('../tools/tickets/tickets');

const MAX_BLOCKS = 3;

const isFinalReport = (dir, f) => /-complete\.md$/.test(f) && !/-phase-\d+-complete\.md$/.test(f)
  && !/\bPARTIAL\b|NOT complete|\bincomplete\b/i.test((runtime.read(path.join(dir, f)) || '').slice(0, 2000));

/** A requirement on the ticket path that this session touched and that is not closed. */
function ticketPlan(dir, files, since) {
  if (files.includes('blocked.md') || files.some((f) => isFinalReport(dir, f))) return null;
  const tdir = path.join(dir, 'tickets');
  let names = []; try { names = fs.readdirSync(tdir).filter((n) => /^T-\d+(\.result)?\.md$/i.test(n)); } catch { return null; }
  const ticketFiles = names.filter((n) => !/\.result\.md$/i.test(n));
  if (!ticketFiles.length) return null;
  const touched = Math.max(...names.map((n) => fs.statSync(path.join(tdir, n)).mtimeMs));
  if (since && touched < since) return null;
  const status = ticketFiles.map((n) => (tickets.parseFrontmatter(runtime.read(path.join(tdir, n))) || {}).status);
  const open = ticketFiles.filter((n, i) => !['done', 'blocked'].includes(status[i])).map((n) => n.replace(/\.md$/i, ''));
  return { name: path.basename(dir), tickets: ticketFiles.length, done: status.filter((s) => s === 'done').length, open };
}

function pendingPlans(cwd, since) {
  const root = runtime.plansRoot(cwd);
  let dirs = [];
  try { dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(root, d.name)); } catch { return []; }
  const out = [];
  for (const dir of dirs) {
    let files; try { files = fs.readdirSync(dir); } catch { continue; }
    if (files.includes('tickets')) { // 5.5.0 ticket path: the ticket graph says what is left
      const t = ticketPlan(dir, files, since);
      if (t) out.push(t);
      continue;
    }
    const tracked = files.filter((f) => /-plan\.md$|-phase-\d+-complete\.md$/.test(f));
    if (!tracked.length) continue;
    // Final report: <task>-complete.md per the contract (also accept <task>-plan-complete.md).
    // A final report that declares itself partial is not a closed plan (19-oct p4: "PARTIAL (6 of 8 phases)");
    // the legitimate way out of an unfinished plan is blocked.md.
    const isFinal = (f) => isFinalReport(dir, f);
    if (files.some((f) => isFinal(f) || f === 'blocked.md')) continue;
    const touched = Math.max(...tracked.map((f) => fs.statSync(path.join(dir, f)).mtimeMs));
    if (since && touched < since) continue;
    const plan = files.find((f) => /-plan\.md$/.test(f));
    const planned = plan ? Math.max(0, ...[...(runtime.read(path.join(dir, plan)) || '').matchAll(/Phase\s+(\d+)\s*:/g)].map((m) => +m[1])) : 0;
    const done = Math.max(0, ...files.map((f) => +(f.match(/-phase-(\d+)-complete\.md$/) || [])[1] || 0));
    out.push({ name: path.basename(dir), planned, done });
  }
  return out;
}

/** Final reports written in this session whose claims the evidence does not support (5.5.0, brake 1). */
function unsupportedReports(cwd, since) {
  const root = runtime.plansRoot(cwd);
  let dirs = [];
  try { dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(root, d.name)); } catch { return []; }
  const out = [];
  for (const dir of dirs) {
    let files; try { files = fs.readdirSync(dir); } catch { continue; }
    if (files.includes('blocked.md')) continue;
    for (const f of files.filter((n) => /-complete\.md$/.test(n) && !/-phase-\d+-complete\.md$/.test(n))) {
      const full = path.join(dir, f);
      // 2 s tolerance: file times and Date.now() tick at different resolutions on Windows.
      if (since && fs.statSync(full).mtimeMs < since - 2000) continue;
      // Brake 2 is only required where it can run: BCQuality installed and not disabled for the project.
      const requireReview = !!runtime.bcqualityRoot() && !runtime.bcqualityDisabled(cwd);
      const problems = evidence.finalReportProblems(cwd, runtime.read(full) || '', { requireReview });
      if (problems.length) out.push({ report: path.relative(cwd, full).split(path.sep).join('/'), problems });
    }
  }
  return out;
}

function guard(payload) {
  if (!payload?.cwd || runtime.autonomy(payload.cwd).gates !== 'pre-approved') return null;
  const file = runtime.sessionFile(payload.session_id);
  const state = runtime.readState(file);
  if (!state.start) return null; // only plans this session started are guarded
  if ((state.blocks || 0) >= MAX_BLOCKS) return null;
  const pending = pendingPlans(payload.cwd, state.start);
  if (!pending.length) {
    const reports = unsupportedReports(payload.cwd, state.start);
    if (!reports.length) return null;
    state.blocks = (state.blocks || 0) + 1;
    runtime.writeState(file, state);
    return { decision: 'block', reason:
      'ALDC (pre-approved): the final report says more than the evidence shows. ' +
      reports.map((r) => `${r.report}: ${r.problems.join(' ')}`).join(' | ') +
      ' Fix the cause and update the report. If it cannot be fixed, say so in the report or write blocked.md with the reason, then stop.' };
  }
  state.blocks = (state.blocks || 0) + 1;
  runtime.writeState(file, state);
  const list = pending.map((p) => p.tickets
    ? `${p.name} (tickets done: ${p.done}/${p.tickets}${p.open.length ? `, open: ${p.open.join(', ')}` : ', final report missing'})`
    : `${p.name} (phase files done: ${p.done}${p.planned ? `, phases in plan: ${p.planned}` : ''})`).join('; ');
  const onTickets = pending.some((p) => p.tickets);
  return { decision: 'block', reason:
    `ALDC (pre-approved): the plan is not finished: ${list}. ` +
    (onTickets
      ? 'Run tickets.js status <req> and continue with the next wave (implement → integrate → T-NN.result.md → set done), then the final review, until the final <task-name>-complete.md report is written. '
      : 'This is a 5.4.x phase plan, and since 6.0.0 the Conductor does not finish plans by phases: cut the work its phase files do not record as done into tickets (/aldc:tickets <req>) and build them until the final <task-name>-complete.md report is written. ') +
    'If a ⛔ hard stop applies, write blocked.md in that plan folder with the reason and what is left, then stop.' };
}

if (require.main === module) {
  try { const out = guard(runtime.readStdin()); if (out) console.log(JSON.stringify(out)); }
  catch { /* never trap the session because of the hook itself */ }
}
module.exports = { guard, pendingPlans, unsupportedReports };
