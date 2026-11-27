#!/usr/bin/env node
'use strict';
// ALDC requirement traceability: REQ-NN (what was asked) -> AC-NN (acceptance) -> tickets and tests
// -> review and execution evidence. Deterministic, no model. Host-neutral (Node 20+).
//
// Sources, all under <plans.root>/<req>/:
//   <req>.spec.md          "Requirement points" table: | REQ-01 | what was asked | source | AC-01, AC-02 |
//   tickets/criteria.md    AC lines; a line may also name its REQ-NN
//   tickets/T-NN.md        acceptance list and the Tests table (Criterion column)
//   <req>-review-final.json  review.criteria {met, unmet, not-evaluated}
//   factory-run.json / tickets/T-NN.result.md   whether the tests were executed
//
//   node trace.js check <req> [--project .] [--json]   at the cut: every REQ has a criterion (exit 1 if not)
//   node trace.js matrix <req> [--project .] [--json]  at the end: writes traceability.md, one verdict per REQ
// A spec without a Requirement points table is not traceable: check reports it and passes (5.x specs).
const fs = require('fs');
const path = require('path');
const { read, plansRoot } = require('./lib');

const ids = (text, kind) => [...new Set([...String(text || '').matchAll(new RegExp(`\\b${kind}-\\d+\\b`, 'gi'))].map((m) => m[0].toUpperCase()))];
const cells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());

/** Rows of the spec's Requirement points table: [{ id, asked, source, acs }]. */
function requirementPoints(specText) {
  const out = [];
  for (const line of String(specText || '').split(/\r?\n/)) {
    if (!/^\s*\|/.test(line)) continue;
    const c = cells(line);
    if (!/^REQ-\d+$/i.test(c[0] || '')) continue;
    out.push({ id: c[0].toUpperCase(), asked: c[1] || '', source: c[2] || '', acs: ids(c.slice(3).join(' '), 'AC') });
  }
  return out;
}

/** criteria.md: [{ id, reqs }] in file order. */
function criteria(text) {
  const out = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = /^\s*[-*|]?\s*\**(AC-\d+)\b/i.exec(line);
    if (m) out.push({ id: m[1].toUpperCase(), reqs: ids(line, 'REQ') });
  }
  return out;
}

function load(project, req) {
  const dir = path.join(plansRoot(project), req);
  const T = require('./tickets');
  return {
    dir,
    points: requirementPoints(read(path.join(dir, `${req}.spec.md`))),
    criteria: criteria(read(path.join(dir, 'tickets', 'criteria.md'))),
    tickets: T.loadTickets(project, req) || [],
    review: (() => { try { const r = JSON.parse(read(path.join(dir, `${req}-review-final.json`))); return (r.review || r['Review-Report']?.review || {}).criteria || null; } catch { return null; } })(),
    run: (() => { try { return JSON.parse(read(path.join(dir, 'factory-run.json'))).runs.at(-1); } catch { return null; } })(),
  };
}

/** REQ -> AC map: the spec table plus any REQ named on a criteria.md line. */
function links(s) {
  const map = new Map(s.points.map((p) => [p.id, new Set(p.acs)]));
  for (const c of s.criteria) for (const r of c.reqs) { if (!map.has(r)) map.set(r, new Set()); map.get(r).add(c.id); }
  return map;
}

/** At the cut: every requirement point has at least one criterion, and every criterion it names exists. */
function check(project, req) {
  const s = load(project, req);
  if (!s.points.length) return { ok: true, traceable: false, problems: [], note: `${req}.spec.md has no Requirement points table: requirements are not traced` };
  const known = new Set(s.criteria.map((c) => c.id));
  const problems = [];
  const map = links(s);
  for (const [r, acs] of map) {
    if (!s.points.some((p) => p.id === r)) problems.push(`criteria.md names ${r}, which is not in the spec's Requirement points`);
    if (!acs.size) problems.push(`${r} has no acceptance criterion: nothing will check that it was delivered`);
    for (const a of acs) if (s.criteria.length && !known.has(a)) problems.push(`${r} names ${a}, which is not in tickets/criteria.md`);
  }
  const traced = new Set([...map.values()].flatMap((x) => [...x]));
  const derived = s.criteria.filter((c) => !traced.has(c.id)).map((c) => c.id);
  return { ok: !problems.length, traceable: true, problems, requirements: map.size, derived };
}

/** Test rows of a ticket's Tests table: [{ test, acs }]. */
function ticketTests(t) {
  const text = read(t.file) || '';
  const sec = (/^##\s*Tests\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m.exec(text) || [])[1] || '';
  return sec.split(/\r?\n/).filter((l) => /^\s*\|/.test(l)).map(cells)
    .filter((c) => c[0] && !/^test$/i.test(c[0]) && !/^:?-+:?$/.test(c[0]))
    .map((c) => ({ test: c[0], acs: ids(c.slice(1).join(' '), 'AC') }));
}

/** Were the tests executed and green? 'pass', 'fail' or 'not-run'. */
function execution(s) {
  const tests = (s.run?.steps || []).filter((x) => x.kind === 'test');
  if (tests.length) return tests.at(-1).result === 'pass' ? 'pass' : tests.at(-1).result === 'fail' ? 'fail' : 'not-run';
  const rows = s.tickets.map((t) => (/\|\s*Tests\s*\|\s*([^|]+)\|/i.exec(read(t.file.replace(/\.md$/i, '.result.md')) || '') || [])[1] || '');
  if (rows.length && rows.every((r) => /^\s*pass/i.test(r))) return 'pass';
  if (rows.some((r) => /^\s*fail/i.test(r))) return 'fail';
  return 'not-run';
}

/** At the end: one verdict per requirement point, written to traceability.md. */
function matrix(project, req, { write = true } = {}) {
  const s = load(project, req);
  const c = check(project, req);
  if (!c.traceable) return { traceable: false, note: c.note, rows: [] };
  const map = links(s);
  const exec = execution(s);
  const status = (a) => !s.review ? 'pending' : (s.review.unmet || []).includes(a) ? 'unmet' : (s.review.met || []).includes(a) ? 'met' : 'not evaluated';
  const rows = [...map].map(([r, acs]) => {
    const p = s.points.find((x) => x.id === r) || { asked: '', source: '' };
    const list = [...acs];
    const tickets = s.tickets.filter((t) => (t.data.acceptance || []).some((a) => acs.has(String(a).toUpperCase()))).map((t) => t.data.id);
    const tests = s.tickets.flatMap(ticketTests).filter((x) => x.acs.some((a) => acs.has(a)) && !/^review\b|^manual\b/i.test(x.test)).map((x) => x.test);
    const st = list.map(status);
    let verdict;
    if (!list.length) verdict = 'not covered';
    else if (st.includes('unmet')) verdict = 'unmet';
    else if (st.includes('pending')) verdict = 'pending review';
    else if (st.includes('not evaluated')) verdict = 'not evaluated';
    else if (tests.length && exec === 'pass') verdict = 'met, executed';
    else if (exec === 'fail') verdict = 'met in review, tests fail';
    else verdict = tests.length ? 'met, not executed' : 'met by review only';
    return { req: r, asked: p.asked, source: p.source, acs: list, review: st, tickets, tests, verdict };
  });
  const counts = rows.reduce((o, r) => { o[r.verdict] = (o[r.verdict] || 0) + 1; return o; }, {});
  const out = { traceable: true, execution: exec, rows, counts, derived: c.derived, problems: c.problems };
  if (write) fs.writeFileSync(path.join(s.dir, 'traceability.md'), render(req, out));
  return out;
}

function render(req, m) {
  return [
    `# Traceability: ${req}`, '',
    `Generated by tools/tickets/trace.js on ${new Date().toISOString()}. Tests: ${m.execution}.`, '',
    '| REQ | What was asked | Source | Criteria | Review | Tickets | Tests | Verdict |', '|---|---|---|---|---|---|---|---|',
    ...m.rows.map((r) => `| ${r.req} | ${r.asked.replace(/\|/g, '/')} | ${r.source} | ${r.acs.join(', ') || '-'} | ${r.review.join(', ') || '-'} | ${r.tickets.join(', ') || '-'} | ${r.tests.length} | **${r.verdict}** |`),
    '', `**Summary:** ${Object.entries(m.counts).map(([k, v]) => `${v} ${k}`).join(' · ')}`,
    m.derived.length ? `\n**Derived criteria** (no requirement point names them): ${m.derived.join(', ')}` : '',
    m.problems.length ? `\n**Problems:**\n${m.problems.map((p) => `- ${p}`).join('\n')}` : '', '',
  ].join('\n');
}

function main(argv) {
  const args = argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); if (i === -1) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
  const flag = (n) => { const i = args.indexOf(n); if (i === -1) return false; args.splice(i, 1); return true; };
  const project = path.resolve(opt('--project', '.'));
  const json = flag('--json');
  const [cmd, req] = args;
  if (!['check', 'matrix'].includes(cmd) || !req) { console.error('usage: trace.js <check|matrix> <req> [--project .] [--json]'); return 3; }
  try {
    if (cmd === 'check') {
      const r = check(project, req);
      if (json) console.log(JSON.stringify(r, null, 2));
      else console.log(!r.traceable ? r.note : r.ok ? `trace: ${r.requirements} requirement point(s), each with a criterion` : `trace: ${r.problems.length} problem(s)\n${r.problems.map((p) => `- ${p}`).join('\n')}`);
      return r.ok ? 0 : 1;
    }
    const m = matrix(project, req);
    if (json) console.log(JSON.stringify(m, null, 2));
    else console.log(m.traceable ? `trace: ${Object.entries(m.counts).map(([k, v]) => `${v} ${k}`).join(', ')} (traceability.md)` : m.note);
    return 0;
  } catch (e) { console.error(`trace: ${e.message}`); return 3; }
}

if (require.main === module) process.exitCode = main(process.argv);
module.exports = { requirementPoints, criteria, check, matrix, main };
