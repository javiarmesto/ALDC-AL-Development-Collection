#!/usr/bin/env node
'use strict';
// ALDC factory runner (5.5.0, phase 5): from an approved spec to an integrated, reviewed branch,
// with no human in between. Host-neutral and dependency-free (Node 20+).
//
// The runner decides the order and enforces the caps; it never calls a model itself. Every piece
// of judgement is a subsession of one crew role (crew.json), run through a host adapter
// (hosts/<host>.js: claude, fake; copilot and codex follow the same contract). All state lives in
// <plans.root>/<req>/: a dead run is resumed by running the factory again.
//
//   node factory.js <req> [--project .] [--host claude] [--crew crew.json] [--budget 15] [--hours 2]
//                        [--parallel N] [--verify "<cmd>"] [--test "<cmd>"] [--certified "<cmd>"]
// Exit 0 finished, 1 blocked (blocked.md says why), 3 tool failure.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const T = require('../tickets/tickets');
const I = require('../tickets/integrate');
const { plansRoot } = require('../tickets/lib');

class Blocked extends Error {}

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

// ── Parsing what roles return ─────────────────────────────────────────────────────
/** "### Shared File Entries" lines: [{ file, line }]. "none" and blank lines are skipped. */
function sharedEntries(text) {
  const m = String(text || '').match(/###\s*Shared File Entries\s*\n([\s\S]*?)(\n#{1,3}\s|$)/i);
  if (!m) return [];
  return m[1].split(/\r?\n/).map((l) => l.match(/^\s*[-*]\s*`?([^`:]+?)`?\s*:\s*(.+?)\s*$/)).filter(Boolean)
    .filter(([, file, line]) => !/^none$/i.test(file.trim()) && !/^none$/i.test(line.trim()))
    .map(([, file, line]) => ({ file: file.trim(), line: line.trim().replace(/^`|`$/g, '') }));
}

/** The Review-Report JSON block of a reviewer's answer, parsed; null when absent or invalid. */
function reviewReport(text) {
  const m = String(text || '').match(/###\s*Review-Report \(JSON\)[\s\S]*?```(?:json)?\s*\n([\s\S]*?)```/i);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/** Gating findings by the review contract's predicate: blocker or major, actionable. */
function gating(report) {
  const r = report?.review ? report : report?.['Review-Report'] || report || {};
  return (r.findings || []).filter((f) => ['blocker', 'major'].includes(String(f.severity || '').toLowerCase()));
}

// ── Prompts (host-neutral: the agent's own contract does the rest) ────────────────────
const P = {
  researcher: (req, dir) => `Research for requirement ${req}. Read the approved spec ${path.join(dir, `${req}.spec.md`)}${fs.existsSync(path.join(dir, `${req}.architecture.md`)) ? ' and its architecture' : ''}. Return structured findings (AL objects, dependencies, event architecture with its Standard Flow, test project structure), not a plan.`,
  cutter: (req) => `Run the ALDC tickets workflow for requirement ${req} (on Claude Code: /aldc:tickets ${req}) in pre-approved mode: write tickets/criteria.md and the tickets, and loop on tickets.js validate until it passes. Record the approved-cut gate in decisions.md. Do not build anything.`,
  implementer: (req, dir, ticket) => [
    `You build one ticket of requirement ${req}, in pre-approved mode. You run in a git worktree, in parallel with other tickets.`,
    `Use only the ticket's object_ids, do not edit its shared_files (list the entries you need under "### Shared File Entries"), and do not run git.`,
    `Plan files (read only): ${dir}. Research: ${path.join(dir, 'research.md')}.`,
    '', '--- ticket ---', read(ticket.file) || '',
  ].join('\n'),
  integrator: (req, entries, extra) => [
    `Integration step of requirement ${req} on its branch, in pre-approved mode. Apply exactly these shared-file entries (create a file that does not exist yet); change nothing else.`,
    ...entries.map((e) => `- ${e.file}: ${e.line}`),
    extra ? `\n${extra}` : '',
  ].join('\n'),
  fix: (req, what) => `Integration step of requirement ${req} on its branch, in pre-approved mode. Fix this and change nothing else:\n\n${what}`,
  reviewer: (req, dir, files, criteria) => [
    `final`, `Final review of requirement ${req}, scope phase, spec axis. The certified BCQuality review runs after you.`,
    `Changed files:`, ...files.map((f) => `- ${f}`), '', `Criteria to check (tickets/criteria.md):`, criteria || '(missing)',
    '', `Plan files: ${dir}. Return the Review-Report JSON block.`,
  ].join('\n'),
  reporter: (req, dir) => `Write the final report ${path.join(dir, `${req}-complete.md`)} for requirement ${req} from the plan-complete template, consolidating every tickets/T-NN.result.md, factory-run.json and the review files in ${dir}. Fill Verification, Not verified, Decisions taken without a human and Open risks from evidence only; write not-run with its reason for anything that was not executed.`,
};

// ── The run ───────────────────────────────────────────────────────────────────────
async function runFactory(opts) {
  const project = path.resolve(opts.project || '.');
  const req = opts.req;
  const crew = opts.crew || JSON.parse(read(path.join(__dirname, 'crew.json')));
  const host = opts.host;
  const caps = { ...crew.caps, ...(opts.caps || {}) };
  const commands = { verify: opts.verify ?? crew.verify, test: opts.test ?? crew.test, certified: opts.certified ?? crew.certified };
  if (opts.parallel) process.env.ALDC_PARALLEL = String(opts.parallel);
  const dir = path.join(plansRoot(project), req);
  const logFile = path.join(dir, 'factory-run.json');
  const history = JSON.parse(read(logFile) || '{"runs":[]}');
  const run = { id: new Date().toISOString(), host: host.name, caps, steps: [], outcome: 'running' };
  history.runs.push(run);
  const started = Date.now();
  const spent = () => run.steps.reduce((s, x) => s + (x.cost || 0), 0);
  let reserved = 0;   // budget handed to steps still running
  const save = () => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(logFile, JSON.stringify(history, null, 2) + '\n'); };
  const note = (kind, detail) => { run.steps.push({ at: new Date().toISOString(), kind, ...detail }); save(); };

  async function step(role, { prompt, cwd = project, ticket = null, attempt = 1 }) {
    const r = crew.roles[role];
    if (!r) throw new Error(`crew has no role ${role}`);
    const left = caps.budgetUsd - spent() - reserved;
    const timeLeft = caps.hours * 3600e3 - (Date.now() - started);
    if (left <= 0) throw new Blocked(`budget cap reached: ${spent().toFixed(2)} of ${caps.budgetUsd} USD`);
    if (timeLeft <= 0) throw new Blocked(`time cap reached: ${caps.hours} h`);
    const agent = r.agent?.[host.name] ?? null;
    const budget = Math.min(r.budget, left);
    reserved += budget;
    let res;
    try { res = await host.run({ role, agent, prompt, cwd, ticket, attempt, budget, timeoutMs: Math.min(r.timeoutMin * 60e3, timeLeft), project, req }); }
    finally { reserved -= budget; }
    note('role', { role, agent, ticket, attempt, cwd: path.relative(project, cwd).split(path.sep).join('/') || '.', ok: res.ok, exit: res.exit, cost: res.cost, seconds: res.seconds, session: res.session });
    return res;
  }
  function shell(kind, command) {
    if (!command) { note(kind, { result: 'not-run', reason: `no ${kind} command` }); return { ok: true, notRun: true, output: '' }; }
    const r = spawnSync(command, { cwd: project, shell: true, encoding: 'utf8', timeout: 20 * 60e3, maxBuffer: 64 << 20 });
    const output = ((r.stdout || '') + (r.stderr || '')).slice(-6000);
    note(kind, { command, exit: r.status, result: r.status === 0 ? 'pass' : 'fail' });
    return { ok: r.status === 0, output };
  }
  /** verify (and test) until green, sending failures to one integrator; false after the last try. */
  async function greenOrFix(label) {
    for (let i = 0; i <= caps.retries; i++) {
      const v = shell('verify', commands.verify);
      const t = v.ok ? shell('test', commands.test) : { ok: true };
      if (v.ok && t.ok) return true;
      if (i === caps.retries) return false;
      await step('integrator', { prompt: P.fix(req, `${label}: ${v.ok ? 'tests fail' : 'the build is red'}.\n\n${v.ok ? t.output : v.output}`), attempt: i + 1 });
    }
    return false;
  }
  const result = (t, body) => fs.writeFileSync(t.file.replace(/\.md$/i, '.result.md'), body);
  const setStatus = (id, s) => T.setStatus(project, req, id, s);
  /** Integration step for merged tickets: shared-file entries, build, tests, one commit, then close them. */
  async function finish(merged, wave) {
    const entries = merged.flatMap((m) => m.entries);
    if (entries.length) await step('integrator', { prompt: P.integrator(req, entries) });
    const green = await greenOrFix(`wave ${wave}`);
    const c = I.commitIntegration(project, req, `chore(${req}): integrate ${merged.map((m) => m.t.data.id).join(', ')}`);
    note('commit', { status: c.status, commit: c.commit });
    for (const { t, r, entries: e } of merged) {
      result(t, [`# ${t.data.id} result: ${t.data.title}`, '',
        `**Status:** ${green ? 'done' : 'blocked'} · **Date:** ${new Date().toISOString()} · **Wave:** ${wave || 'resumed'} · **Integration:** merged ${r.merge} into aldc/${req}`, '',
        '## What changed', '', '| File | Object |', '|---|---|', ...(r.files || []).map((f) => `| ${f} | ${(r.objects || []).filter((o) => o.file === f).map((o) => `${o.type} ${o.id}`).join(', ') || '-'} |`), '',
        '## Evidence', '', '| Check | Result | Source |', '|---|---|---|',
        `| Integration | merged | \`${t.data.id}.integration.json\` |`,
        `| Build after integration | ${commands.verify ? (green ? 'green' : 'red') : 'not-run (no verify command)'} | factory-run.json |`,
        `| Tests | ${commands.test ? (green ? 'pass' : 'fail') : 'not-run (no test command)'} | factory-run.json |`,
        `| Shared file entries | ${e.length ? 'applied in the integration step' : 'none'} | ${e.map((x) => x.file).join(', ') || '-'} |`, '',
        '**Review:** final review', ''].join('\n'));
      setStatus(t.data.id, green ? 'done' : 'blocked');
    }
    if (!green) throw new Blocked(`wave ${wave} does not build or pass its tests after ${caps.retries} corrections`);
  }

  try {
    // 0. An approved spec is the factory's input; everything before it stays human.
    if (!fs.existsSync(path.join(dir, `${req}.spec.md`))) throw new Blocked(`no approved spec: ${path.relative(project, path.join(dir, `${req}.spec.md`))}`);
    // 1. Research, persisted once.
    if (!fs.existsSync(path.join(dir, 'research.md'))) {
      const res = await step('researcher', { prompt: P.researcher(req, dir) });
      if (!fs.existsSync(path.join(dir, 'research.md')) && res.text) fs.writeFileSync(path.join(dir, 'research.md'), `# Research: ${req}\n\n${new Date().toISOString().slice(0, 10)}\n\n${res.text}\n`);
      if (!fs.existsSync(path.join(dir, 'research.md'))) throw new Blocked('the researcher returned nothing to persist');
    }
    // 2. The cut, validated by tickets.js, not by the model.
    for (let i = 0; !T.validate(project, req).ok; i++) {
      if (i > caps.retries) throw new Blocked(`the cut does not validate: ${T.validate(project, req).problems.slice(0, 5).join('; ')}`);
      await step('cutter', { prompt: P.cutter(req), attempt: i + 1 });
    }
    // 3. Integration branch; a resumed run drops what a dead one left half done.
    const prep = I.prepare(project, req);
    note('prepare', { branch: prep.branch, base: prep.base });
    const left = I.cleanup(project);
    if (left.removed.length) note('cleanup', { removed: left.removed.length });
    const sharedFile = (id) => path.join(dir, 'tickets', `${id}.shared.json`);
    const pending = [];
    for (const id of T.summary(project, req).in_progress) {
      const rec = JSON.parse(read(path.join(dir, 'tickets', `${id}.integration.json`)) || '{}');
      const t = (T.loadTickets(project, req) || []).find((x) => x.data.id === id);
      if (rec.status === 'merged') pending.push({ t, r: rec, entries: JSON.parse(read(sharedFile(id)) || '[]') });
      else setStatus(id, 'ready');
    }
    if (pending.length) { note('resume', { merged: pending.map((m) => m.t.data.id) }); await finish(pending, 0); }
    // 4. Waves.
    const tries = {};
    for (let wave = 1; ; wave++) {
      const w = T.wave(project, req);
      if (!w.tickets.length) break;
      const tickets = (T.loadTickets(project, req) || []).filter((t) => w.tickets.some((x) => x.id === t.data.id));
      const build = [];
      for (const t of tickets) {
        if (t.data.mode === 'hitl' && !new RegExp(`\\b${t.data.id}\\b`).test(read(path.join(dir, 'decisions.md')) || '')) {
          result(t, `# ${t.data.id} result: ${t.data.title}\n\n**Status:** blocked · **Date:** ${new Date().toISOString()}\n\nhitl ticket: the human decision its Scope names is not in decisions.md, and the factory runs unattended.\n`);
          setStatus(t.data.id, 'blocked'); note('blocked', { ticket: t.data.id, reason: 'hitl without a recorded decision' });
        } else { setStatus(t.data.id, 'in-progress'); build.push(t); }
      }
      if (!build.length) continue;
      note('wave', { wave, tickets: build.map((t) => t.data.id), parallel: w.parallel });
      // Implement in parallel, each ticket in its own worktree cut from the integration branch.
      const jobs = build.map((t) => {
        const n = (tries[t.data.id] = (tries[t.data.id] || 0) + 1);
        const wt = path.join(project, '.claude', 'worktrees', `factory-${t.data.id}-${n}`);
        const add = spawnSync('git', ['worktree', 'add', '-q', wt, '-b', `factory/${req}/${t.data.id}-${n}`, 'HEAD'], { cwd: project, encoding: 'utf8' });
        if (add.status !== 0) throw new Error(`git worktree add: ${add.stderr}`);
        return { t, wt, n };
      });
      const settled = await Promise.allSettled(jobs.map(({ t, wt, n }) => step('implementer', { prompt: P.implementer(req, dir, t), cwd: wt, ticket: t.data.id, attempt: n })));
      const stop = settled.find((x) => x.status === 'rejected');
      const outs = [];
      settled.forEach((x, i) => {
        if (x.status === 'fulfilled') outs.push({ ...jobs[i], res: x.value });
        else { I.discard(project, jobs[i].wt); tries[jobs[i].t.data.id]--; setStatus(jobs[i].t.data.id, 'ready'); }
      });
      // Integrate one at a time.
      const merged = [];
      for (const { t, wt, res } of outs) {
        let r;
        try { r = res.ok ? I.integrateTicket(project, req, t.data.id, wt) : { status: 'failed', problems: [`the implementer exited ${res.exit}`] }; }
        catch (e) { r = { status: 'failed', problems: [`integrate.js: ${e.message}`] }; }   // a tool failure costs this ticket a try, not the run
        if (r.leftover) note('leftover', { ticket: t.data.id, worktree: r.leftover });
        note('integrate', { ticket: t.data.id, status: r.status, problems: r.problems, conflicts: r.conflicts });
        if (r.status === 'merged') {
          const entries = sharedEntries(res.text);
          fs.writeFileSync(sharedFile(t.data.id), JSON.stringify(entries, null, 2) + '\n');
          merged.push({ t, r, entries }); continue;
        }
        if (fs.existsSync(wt)) I.discard(project, wt);
        if (tries[t.data.id] > caps.retries) {
          result(t, `# ${t.data.id} result: ${t.data.title}\n\n**Status:** blocked · **Date:** ${new Date().toISOString()}\n\nIntegration failed ${tries[t.data.id]} times: ${(r.problems || r.conflicts || [r.status]).join('; ')}\n`);
          setStatus(t.data.id, 'blocked');
        } else setStatus(t.data.id, 'ready');
      }
      if (merged.length) await finish(merged, wave);
      if (stop) throw stop.reason;
    }
    const s = T.summary(project, req);
    if (s.blocked.length) throw new Blocked(`blocked tickets: ${s.blocked.join(', ')}${s.waiting.length ? `; waiting on them: ${s.waiting.map((w) => w.id).join(', ')}` : ''}`);
    // 5. Final review: spec axis first, then the certified review covers the final code.
    const finalFile = path.join(dir, `${req}-review-final.json`);
    const base = JSON.parse(read(path.join(dir, 'integration.json')) || '{}').baseCommit;
    const changed = () => (spawnSync('git', ['diff', '--name-only', `${base}..HEAD`], { cwd: project, encoding: 'utf8' }).stdout || '').split(/\r?\n/).filter(Boolean);
    for (let i = 0; i < 2; i++) {
      const res = await step('spec-reviewer', { prompt: P.reviewer(req, dir, changed(), read(path.join(dir, 'tickets', 'criteria.md'))), attempt: i + 1 });
      const report = reviewReport(res.text);
      if (!report) throw new Blocked('the final review returned no Review-Report JSON');
      fs.writeFileSync(finalFile, JSON.stringify(report, null, 2) + '\n');
      const g = gating(report);
      note('review', { axis: 'spec', gating: g.length });
      if (!g.length) break;
      if (i === 1) throw new Blocked(`the final review still has ${g.length} gating finding(s) after one correction`);
      await step('integrator', { prompt: P.fix(req, g.map((f) => `- ${f.message || f.title} (${f.location?.file || ''}:${f.location?.line || ''})`).join('\n')) });
      if (!(await greenOrFix('review correction'))) throw new Blocked('the review correction does not build');
      note('commit', I.commitIntegration(project, req, `fix(${req}): final review findings`));
    }
    if (commands.certified) {
      const c = shell('certified', commands.certified.replaceAll('{base}', base || 'main'));
      note('certified', { result: c.ok ? 'certified' : 'not-certified' });
    } else note('certified', { result: 'not-run', reason: 'no certified command for this host' });
    // 6. Final report, written by a role from the files.
    if (!fs.existsSync(path.join(dir, `${req}-complete.md`))) await step('reporter', { prompt: P.reporter(req, dir) });
    if (!fs.existsSync(path.join(dir, `${req}-complete.md`))) throw new Blocked('the reporter wrote no final report');
    run.outcome = 'finished';
  } catch (e) {
    if (!(e instanceof Blocked)) { run.outcome = 'failure'; run.error = e.message; save(); throw e; }
    run.outcome = 'blocked'; run.reason = e.message;
    const s = T.summary(project, req);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocked.md'), `# blocked: ${req}\n\n${new Date().toISOString()} · factory run ${run.id} · host ${host.name}\n\n**Reason:** ${e.message}\n\n**Left:** ${s.total ? `${s.done.length}/${s.total} tickets done; ready ${s.ready.join(', ') || 'none'}; blocked ${s.blocked.join(', ') || 'none'}` : 'nothing cut yet'}.\n\nRun the factory again once the cause is fixed: it resumes from these files.\n`);
  } finally {
    run.seconds = Math.round((Date.now() - started) / 1000); run.cost = +spent().toFixed(4); save();
  }
  return run;
}

async function main(argv) {
  const args = argv.slice(2);
  const opt = (name, d) => { const i = args.indexOf(name); if (i === -1) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
  const project = opt('--project', '.'), hostName = opt('--host', 'claude'), crewFile = opt('--crew');
  const budget = opt('--budget'), hours = opt('--hours'), parallel = opt('--parallel');
  const verify = opt('--verify'), test = opt('--test'), certified = opt('--certified');
  const [req] = args;
  if (!req) { console.error('usage: factory.js <req> [--project .] [--host claude|fake] [--crew crew.json] [--budget USD] [--hours H] [--parallel N] [--verify cmd] [--test cmd] [--certified cmd]'); return 3; }
  let host;
  try { host = require(path.join(__dirname, 'hosts', `${hostName}.js`)).create({ project }); }
  catch (e) { console.error(`factory: no host adapter ${hostName} (${e.message})`); return 3; }
  const caps = {};
  if (budget) caps.budgetUsd = +budget;
  if (hours) caps.hours = +hours;
  try {
    const run = await runFactory({ project, req, host, crew: crewFile ? JSON.parse(fs.readFileSync(crewFile, 'utf8')) : undefined, caps, parallel, verify, test, certified });
    console.log(JSON.stringify({ outcome: run.outcome, reason: run.reason, cost: run.cost, seconds: run.seconds, steps: run.steps.length }));
    return run.outcome === 'finished' ? 0 : 1;
  } catch (e) { console.error(`factory: ${e.message}`); return 3; }
}

if (require.main === module) main(process.argv).then((code) => { process.exitCode = code; });
module.exports = { runFactory, sharedEntries, reviewReport, gating, Blocked, main };
