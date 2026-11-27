#!/usr/bin/env node
'use strict';
// ALDC 5.5.0 (factory phase 3): deterministic ticket graph for a requirement. Host-neutral:
// the same file ships on every surface (tools/tickets/lib.js resolves plans.root).
// Tickets live in <plans.root>/<req>/tickets/T-NN.md with a small YAML frontmatter
// (docs/templates/ticket-template.md). The model cuts the spec into tickets; this tool,
// not the model, checks the cut and decides what runs next, so any new session can resume
// from the files alone. No dependencies: the plugin ships without node_modules.
//
//   node tickets.js validate <req> [--project .]   exit 0 valid, 1 problems, 3 tool failure
//   node tickets.js next     <req> [--project .]   prints the frontier as JSON
//   node tickets.js wave     <req> [--project .]   the frontier capped at tickets.parallel (5.5.0, phase 4)
//   node tickets.js status   <req> [--project .]   prints a resume summary (JSON with --json)
//   node tickets.js set      <req> <T-NN> <status> [--project .]
const fs = require('fs');
const path = require('path');

const STATUSES = ['ready', 'in-progress', 'done', 'blocked'];
const MODES = ['afk', 'hitl'];
const REQUIRED = ['id', 'title', 'depends_on', 'mode', 'object_ids', 'acceptance', 'status'];
const LISTS = ['depends_on', 'acceptance', 'bcq', 'shared_files', 'object_ids'];

const { read, plansRoot, parallel } = require('./lib');

const ticketsDir = (project, req) => path.join(plansRoot(project), req, 'tickets');

const unquote = (s) => String(s).trim().replace(/^(["'])(.*)\1$/, '$2');
const splitList = (s) => s.split(',').map(unquote).filter(Boolean);

/** Frontmatter: `key: value`, inline lists `[a, b]` and block lists (`- item` lines). */
function parseFrontmatter(text) {
  const m = String(text || '').match(/^﻿?---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!m) return null;
  const data = {};
  let listKey = null;
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '');
    if (!line.trim()) continue;
    const item = line.match(/^\s+-\s+(.*)$/) || line.match(/^-\s+(.*)$/);
    if (item && listKey) { data[listKey].push(unquote(item[1])); continue; }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    listKey = null;
    if (value === '') { data[key] = []; listKey = key; }
    else if (/^\[.*\]$/.test(value.trim())) data[key] = splitList(value.trim().slice(1, -1));
    else data[key] = unquote(value);
  }
  for (const k of LISTS) if (typeof data[k] === 'string') data[k] = splitList(data[k]);
  return data;
}

/** "50100-50109", "50100..50109" or "50100" -> [{from, to}] (invalid entries -> null). */
function parseRanges(list) {
  return (list || []).map((r) => {
    const m = String(r).match(/^(\d+)\s*(?:-|\.\.)\s*(\d+)$/) || String(r).match(/^(\d+)$/);
    if (!m) return null;
    const from = +m[1]; const to = +(m[2] || m[1]);
    return from <= to ? { from, to, text: String(r) } : null;
  });
}

function loadTickets(project, req) {
  const dir = ticketsDir(project, req);
  let names = [];
  try { names = fs.readdirSync(dir).filter((n) => /^T-\d+\.md$/i.test(n)).sort(); } catch { return null; }
  return names.map((n) => {
    const file = path.join(dir, n);
    const text = read(file);
    const data = parseFrontmatter(text) || {};
    const result = path.join(dir, n.replace(/\.md$/i, '.result.md'));
    return { file, name: n, data, hasResult: fs.existsSync(result) };
  });
}

/** Criteria the cut must cover: `AC-NN` ids listed in tickets/criteria.md. */
function loadCriteria(project, req) {
  const text = read(path.join(ticketsDir(project, req), 'criteria.md'));
  if (text == null) return null;
  return [...new Set([...text.matchAll(/^\s*[-*|]?\s*\**(AC-\d+)\b/gim)].map((m) => m[1].toUpperCase()))];
}

/** idRanges of every app.json under the project (bounded walk). */
function appRanges(project) {
  const out = [];
  const skip = new Set(['.git', '.alpackages', '.claude', 'node_modules', '.github', '.vscode']);
  (function walk(dir, depth) {
    if (depth > 4) return;
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isFile() && e.name === 'app.json') {
        try {
          const app = JSON.parse(read(path.join(dir, e.name)));
          for (const r of app.idRanges || (app.idRange ? [app.idRange] : [])) out.push({ from: +r.from, to: +r.to, app: path.relative(project, dir) || '.' });
        } catch { /* unreadable app.json is the compiler's problem */ }
      } else if (e.isDirectory() && !skip.has(e.name)) walk(path.join(dir, e.name), depth + 1);
    }
  })(project, 0);
  return out;
}

function findCycle(byId) {
  const state = {};
  const stack = [];
  const visit = (id) => {
    if (state[id] === 2) return null;
    if (state[id] === 1) return stack.slice(stack.indexOf(id)).concat(id);
    state[id] = 1; stack.push(id);
    for (const d of byId[id]?.data.depends_on || []) if (byId[d]) { const c = visit(d); if (c) return c; }
    stack.pop(); state[id] = 2;
    return null;
  };
  for (const id of Object.keys(byId)) { const c = visit(id); if (c) return c; }
  return null;
}

function validate(project, req) {
  const tickets = loadTickets(project, req);
  if (!tickets) return { ok: false, problems: [`no tickets folder: ${path.relative(project, ticketsDir(project, req)) || ticketsDir(project, req)}`] };
  if (!tickets.length) return { ok: false, problems: ['the tickets folder has no T-NN.md files'] };
  const problems = [];
  const byId = {};
  for (const t of tickets) {
    const d = t.data;
    if (!Object.keys(d).length) { problems.push(`${t.name}: no frontmatter`); continue; }
    for (const k of REQUIRED) if (d[k] === undefined) problems.push(`${t.name}: missing ${k}`);
    if (d.id && d.id.toUpperCase() !== t.name.replace(/\.md$/i, '').toUpperCase()) problems.push(`${t.name}: id ${d.id} does not match the file name`);
    if (d.mode && !MODES.includes(d.mode)) problems.push(`${t.name}: mode must be ${MODES.join(' or ')}`);
    if (d.status && !STATUSES.includes(d.status)) problems.push(`${t.name}: status must be one of ${STATUSES.join(', ')}`);
    if (Array.isArray(d.acceptance) && !d.acceptance.length) problems.push(`${t.name}: acceptance is empty; every ticket closes at least one criterion`);
    if (d.status === 'done' && !t.hasResult) problems.push(`${t.name}: done without ${t.name.replace(/\.md$/i, '.result.md')}`);
    if (d.id) { if (byId[d.id]) problems.push(`${t.name}: duplicate id ${d.id}`); byId[d.id] = t; }
  }
  for (const t of tickets) for (const dep of t.data.depends_on || []) {
    if (!byId[dep]) problems.push(`${t.name}: depends_on ${dep}, which does not exist`);
    if (dep === t.data.id) problems.push(`${t.name}: depends on itself`);
  }
  const cycle = findCycle(byId);
  if (cycle) problems.push(`dependency cycle: ${cycle.join(' -> ')}`);

  // A shared file has one writer, the integration step. A ticket whose only objects are permission
  // sets, and which lists shared files, has nothing to build in its worktree (eval f6-runner).
  for (const t of tickets) {
    if (!(t.data.shared_files || []).length) continue;
    const table = (/^##\s*Objects\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m.exec(fs.readFileSync(t.file, 'utf8')) || [])[1] || '';
    const types = table.split(/\r?\n/).filter((l) => /^\s*\|/.test(l)).map((l) => l.split('|')[1].trim())
      .filter((c) => c && !/^type$/i.test(c) && !/^:?-+:?$/.test(c));
    if (types.length && types.every((c) => /permission\s*set/i.test(c)))
      problems.push(`${t.name}: its only objects are permission sets in shared_files, which the integration step writes; drop the ticket and move its criteria to the tickets that need those entries`);
  }

  // Object ID ranges: well formed, disjoint between tickets, inside an app.json idRanges entry.
  const apps = appRanges(project);
  const owned = [];
  for (const t of tickets) {
    const ranges = parseRanges(t.data.object_ids);
    ranges.forEach((r, i) => {
      if (!r) { problems.push(`${t.name}: object_ids entry "${t.data.object_ids[i]}" is not a range like 50100-50109`); return; }
      if (apps.length && !apps.some((a) => r.from >= a.from && r.to <= a.to)) problems.push(`${t.name}: object_ids ${r.text} is outside every app.json idRanges`);
      for (const o of owned) if (r.from <= o.to && o.from <= r.to) problems.push(`${t.name}: object_ids ${r.text} overlaps ${o.ticket} (${o.text})`);
      owned.push({ ...r, ticket: t.data.id || t.name });
    });
  }

  // Coverage: every criterion in criteria.md closed by some ticket; tickets cite only known criteria.
  const criteria = loadCriteria(project, req);
  if (!criteria) problems.push('no tickets/criteria.md: list the spec acceptance criteria as AC-NN so coverage can be checked');
  else {
    const cited = new Set(tickets.flatMap((t) => (t.data.acceptance || []).map((a) => a.toUpperCase())));
    for (const c of criteria) if (!cited.has(c)) problems.push(`${c} is closed by no ticket`);
    for (const t of tickets) for (const a of t.data.acceptance || []) if (!criteria.includes(a.toUpperCase())) problems.push(`${t.name}: cites ${a}, which is not in criteria.md`);
  }
  // Requirement traceability: every requirement point of the spec has a criterion (trace.js).
  const trace = require('./trace').check(project, req);
  for (const p of trace.problems) problems.push(`trace: ${p}`);
  return { ok: !problems.length, problems, tickets: tickets.length, traceable: trace.traceable };
}

function summary(project, req) {
  const tickets = loadTickets(project, req) || [];
  const byId = Object.fromEntries(tickets.map((t) => [t.data.id, t]));
  const of = (s) => tickets.filter((t) => t.data.status === s).map((t) => t.data.id);
  const unblocked = (t) => (t.data.depends_on || []).every((d) => byId[d]?.data.status === 'done');
  // In progress first: a ticket left in-progress by a dead session is resumed before new work.
  const frontier = [...tickets.filter((t) => t.data.status === 'in-progress'), ...tickets.filter((t) => t.data.status === 'ready' && unblocked(t))]
    .map((t) => ({ id: t.data.id, title: t.data.title, mode: t.data.mode, status: t.data.status, file: path.relative(project, t.file).split(path.sep).join('/') }));
  const waiting = tickets.filter((t) => t.data.status === 'ready' && !unblocked(t)).map((t) => ({ id: t.data.id, waits_for: (t.data.depends_on || []).filter((d) => byId[d]?.data.status !== 'done') }));
  const reqDir = path.join(plansRoot(project), req);
  return {
    req, total: tickets.length,
    done: of('done'), in_progress: of('in-progress'), ready: of('ready'), blocked: of('blocked'),
    frontier, waiting,
    research: fs.existsSync(path.join(reqDir, 'research.md')),
    finished: tickets.length > 0 && tickets.every((t) => ['done', 'blocked'].includes(t.data.status)),
  };
}

/** The next wave: the frontier capped at the parallel limit (aldc.yaml tickets.parallel / ALDC_PARALLEL). */
function wave(project, req) {
  const cap = parallel(project);
  const frontier = summary(project, req).frontier;
  return { parallel: cap.parallel, source: cap.source, tickets: frontier.slice(0, cap.parallel), left: Math.max(0, frontier.length - cap.parallel) };
}

function setStatus(project, req, id, status) {
  if (!STATUSES.includes(status)) throw new Error(`status must be one of ${STATUSES.join(', ')}`);
  const t = (loadTickets(project, req) || []).find((x) => (x.data.id || '').toUpperCase() === id.toUpperCase());
  if (!t) throw new Error(`no ticket ${id} in ${ticketsDir(project, req)}`);
  if (status === 'done' && !t.hasResult) throw new Error(`${t.name}: write ${t.name.replace(/\.md$/i, '.result.md')} before marking it done`);
  const text = read(t.file);
  const updated = text.replace(/^(﻿?---\r?\n[\s\S]*?^status:)[ \t]*[^\r\n]*/m, `$1 ${status}`);
  if (updated === text && t.data.status !== status) throw new Error(`${t.name}: no status line to update`);
  fs.writeFileSync(t.file, updated);
  return { id: t.data.id, from: t.data.status, to: status };
}

function main(argv) {
  const args = argv.slice(2);
  const opt = (name, dflt) => { const i = args.indexOf(name); if (i === -1) return dflt; const v = args[i + 1]; args.splice(i, 2); return v; };
  const flag = (name) => { const i = args.indexOf(name); if (i === -1) return false; args.splice(i, 1); return true; };
  const project = path.resolve(opt('--project', '.'));
  const json = flag('--json');
  const [cmd, req, ...rest] = args;
  if (!cmd || !req) { console.error('usage: tickets.js <validate|next|wave|status|set> <req> [T-NN status] [--project .] [--json]'); return 3; }
  try {
    if (cmd === 'validate') {
      const r = validate(project, req);
      if (json) console.log(JSON.stringify(r, null, 2));
      else console.log(r.ok ? `tickets: ${r.tickets} valid` : `tickets: ${r.problems.length} problem(s)\n` + r.problems.map((p) => `- ${p}`).join('\n'));
      return r.ok ? 0 : 1;
    }
    if (cmd === 'next') { console.log(JSON.stringify(summary(project, req).frontier, null, 2)); return 0; }
    if (cmd === 'wave') { console.log(JSON.stringify(wave(project, req), null, 2)); return 0; }
    if (cmd === 'status') {
      const s = summary(project, req);
      if (json) { console.log(JSON.stringify(s, null, 2)); return 0; }
      console.log([
        `${s.req}: ${s.done.length}/${s.total} done` + (s.blocked.length ? `, blocked ${s.blocked.join(', ')}` : '') + (s.finished ? ' (finished)' : ''),
        `research.md: ${s.research ? 'present, reuse it' : 'missing'}`,
        `next: ${s.frontier.map((f) => `${f.id}${f.status === 'in-progress' ? ' (resume)' : ''}`).join(', ') || 'none'}`,
        ...s.waiting.map((w) => `waiting: ${w.id} for ${w.waits_for.join(', ')}`),
      ].join('\n'));
      return 0;
    }
    if (cmd === 'set') {
      const [id, status] = rest;
      console.log(JSON.stringify(setStatus(project, req, id, status)));
      return 0;
    }
    console.error(`unknown command ${cmd}`); return 3;
  } catch (e) { console.error(`tickets: ${e.message}`); return 3; }
}

// Exports first: trace.js requires this module while it runs as a program.
module.exports = { parseFrontmatter, parseRanges, validate, summary, wave, setStatus, plansRoot, ticketsDir, loadTickets, main };
if (require.main === module) process.exitCode = main(process.argv);
