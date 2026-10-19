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

const MAX_BLOCKS = 3;

function pendingPlans(cwd, since) {
  const root = runtime.plansRoot(cwd);
  let dirs = [];
  try { dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(root, d.name)); } catch { return []; }
  const out = [];
  for (const dir of dirs) {
    let files; try { files = fs.readdirSync(dir); } catch { continue; }
    const tracked = files.filter((f) => /-plan\.md$|-phase-\d+-complete\.md$/.test(f));
    if (!tracked.length) continue;
    // Final report: <task>-complete.md per the contract (also accept <task>-plan-complete.md).
    // A final report that declares itself partial is not a closed plan (19-oct p4: "PARTIAL (6 of 8 phases)");
    // the legitimate way out of an unfinished plan is blocked.md.
    const isFinal = (f) => /-complete\.md$/.test(f) && !/-phase-\d+-complete\.md$/.test(f)
      && !/\bPARTIAL\b|NOT complete|\bincomplete\b/i.test((runtime.read(path.join(dir, f)) || '').slice(0, 2000));
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

function guard(payload) {
  if (!payload?.cwd || runtime.autonomy(payload.cwd).gates !== 'pre-approved') return null;
  const file = runtime.sessionFile(payload.session_id);
  const state = runtime.readState(file);
  if (!state.start) return null; // only plans this session started are guarded
  if ((state.blocks || 0) >= MAX_BLOCKS) return null;
  const pending = pendingPlans(payload.cwd, state.start);
  if (!pending.length) return null;
  state.blocks = (state.blocks || 0) + 1;
  runtime.writeState(file, state);
  const list = pending.map((p) => `${p.name} (phase files done: ${p.done}${p.planned ? `, phases in plan: ${p.planned}` : ''})`).join('; ');
  return { decision: 'block', reason:
    `ALDC (pre-approved): the plan is not finished: ${list}. Continue with the next pending phase now ` +
    '(implement → review → phase-complete file) until the final <task-name>-complete.md report is written. ' +
    'If a ⛔ hard stop applies, write blocked.md in that plan folder with the reason and what is left, then stop.' };
}

if (require.main === module) {
  try { const out = guard(runtime.readStdin()); if (out) console.log(JSON.stringify(out)); }
  catch { /* never trap the session because of the hook itself */ }
}
module.exports = { guard, pendingPlans };
