'use strict';
// aldc-claude 5.5.0: evidence the final report must agree with (phase 2, brake 1 on the ALDC side).
// aldc-verify compiles when a subagent or the session stops, but releases after 3 red attempts; nothing
// stopped a conductor from closing a plan on a red or stale build. These checks are deterministic and
// read-only: compile evidence from aldc-verify's state, test claims without a runner, and tables that no
// permission set covers (BCQuality did not catch the last one in any phase 0 variant).
const fs = require('fs');
const path = require('path');
const runtime = require('./aldc-runtime');

const SKIP_DIRS = new Set(['.git', '.alpackages', '.claude', '.github', '.vscode', 'node_modules', 'bin', 'obj', '.snapshots', '.output']);

/** AL source files under root, bounded. */
function alFiles(root, out = [], depth = 0) {
  if (depth > 8 || out.length > 5000) return out;
  let entries; try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(root, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) alFiles(full, out, depth + 1); }
    else if (e.name.toLowerCase().endsWith('.al')) out.push(full);
  }
  return out;
}

const newestAl = (root) => alFiles(root).reduce((m, f) => { try { return Math.max(m, fs.statSync(f).mtimeMs); } catch { return m; } }, 0);

/**
 * Last compile result aldc-verify recorded (gate or /aldc-verify:al-verify), and whether code changed after it.
 * status: green | red | stale | not-run | missing (aldc-verify never ran here).
 */
function build(cwd) {
  const state = runtime.readState(path.join(cwd, '.claude', '.aldc-verify', 'state.json'));
  const last = (state.history || []).filter((h) => h && h.at && h.status).slice(-1)[0];
  if (!last) return { status: 'missing', reason: 'aldc-verify has no compile record in this project' };
  const at = Date.parse(last.at);
  const changed = newestAl(cwd);
  if (last.status === 'not-run' || last.status === 'no-projects') return { status: 'not-run', at: last.at, reason: last.reason || last.status };
  if (last.status !== 'green') return { status: 'red', at: last.at, reason: `last compile: ${last.status}` + (last.errorCodes ? ` (${last.errorCodes.join(', ')})` : '') };
  if (changed > at + 1000) return { status: 'stale', at: last.at, reason: `AL changed at ${new Date(changed).toISOString()}, after the last green compile at ${last.at}` };
  return { status: 'green', at: last.at };
}

const unquote = (s) => String(s || '').trim().replace(/^"|"$/g, '').toLowerCase();

/** An app.json that is a test app: its name or folder says Test, or it depends on Microsoft test libraries. */
function isTestApp(dir) {
  let app; try { app = JSON.parse(fs.readFileSync(path.join(dir, 'app.json'), 'utf8')); } catch { return false; }
  if (/\btests?\b/i.test(app.name || '') || /^tests?$/i.test(path.basename(dir))) return true;
  return (app.dependencies || []).some((d) => /^(Library Assert|Tests-TestLibraries|Any|Library Variable Storage|Test Runner)$/i.test(d.name || ''));
}

function appDirs(root, out = [], depth = 0) {
  if (depth > 4) return out;
  let entries; try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return out; }
  if (entries.some((e) => e.isFile() && e.name === 'app.json')) out.push(root);
  for (const e of entries) if (e.isDirectory() && !SKIP_DIRS.has(e.name)) appDirs(path.join(root, e.name), out, depth + 1);
  return out;
}

/** Tables declared in a non-test app that no permissionset or permissionsetextension of that app names as tabledata. */
function permissionGaps(cwd) {
  const gaps = [];
  for (const dir of appDirs(cwd)) {
    if (isTestApp(dir)) continue;
    const tables = [];
    const covered = new Set();
    for (const f of alFiles(dir)) {
      const text = runtime.read(f) || '';
      for (const m of text.matchAll(/^\s*table\s+\d+\s+("[^"]+"|[\w]+)/gim)) tables.push({ name: unquote(m[1]), file: path.relative(cwd, f).split(path.sep).join('/') });
      if (/^\s*permissionset(extension)?\s+\d+/im.test(text))
        for (const m of text.matchAll(/tabledata\s+("[^"]+"|[\w]+)\s*=/gi)) covered.add(unquote(m[1]));
    }
    for (const t of tables) if (!covered.has(t.name)) gaps.push(t);
  }
  return gaps;
}

/** Lines of a report that claim tests passed when no test runner is configured (they can only be compiled). */
const PASS = /\b(pass(ed|es|ing)?|green|succeeded|successful)\b|✅/i;
const NOT_RUN = /not[- ]?run|not executed|no (test )?runner|compiled(,| but| only)? not (run|executed)|compiled only|sin ejecutar|no (se )?ejecut/i;
// Lines about compiling, analyzers or files mention tests without claiming they ran.
const OTHER_CHECK = /compil|build|analy[sz]er|unchanged|separad|separate|copied|copiad/i;
function testClaims(text) {
  return String(text || '').split(/\r?\n/).filter((l) => {
    if (NOT_RUN.test(l) || OTHER_CHECK.test(l)) return false;
    const cells = l.split('|').map((c) => c.trim()).filter(Boolean);
    const row = l.trim().startsWith('|') && cells.length >= 2 && /^(unit |acceptance |integration )?tests?( run| runs| executed| execution| results?)?$/i.test(cells[0])
      && cells.slice(1).some((c) => PASS.test(c));
    const prose = /\b(all|\d+(\s*\/\s*\d+)?)\s+(unit |acceptance |integration )?tests?\b[^\n|]{0,30}/i.test(l) && PASS.test(l)
      || /\btests?\s+(all\s+)?(pass(ed|es)?|green|succeeded)\b/i.test(l);
    return row || prose;
  }).map((l) => l.trim()).slice(0, 5);
}

/** Newest certified-review verdict in the project's audits folder (tools/bcquality/certified-review.js). */
function certifiedVerdict(cwd) {
  const dir = path.resolve(cwd, runtime.yamlValue(runtime.read(path.join(cwd, 'aldc.yaml')), 'audits', 'root') || '.claude/audits');
  let names = []; try { names = fs.readdirSync(dir); } catch { return null; }
  const file = names.filter((n) => /^bcquality-certified-.*\.verdict\.json$/.test(n)).sort().pop();
  if (!file) return null;
  const full = path.join(dir, file);
  const data = runtime.readState(full);
  return { file: path.relative(cwd, full).split(path.sep).join('/'), verdict: data.verdict || 'unreadable', mtime: fs.statSync(full).mtimeMs };
}

/**
 * Problems that keep a final report from closing a plan; empty when the evidence agrees with it.
 * `requireReview` (pre-approved): brake 2 must have produced a verdict for the current code, or the report
 * must say why the BCQuality review did not run.
 */
function finalReportProblems(cwd, reportText, { requireReview = false } = {}) {
  const problems = [];
  if (requireReview) {
    const v = certifiedVerdict(cwd);
    const said = /bcquality[^\n]{0,80}(not[- ]?(run|certified|installed)|no certificad|sin certificar)/i.test(reportText);
    if ((!v || v.mtime + 1000 < newestAl(cwd)) && !said)
      problems.push(v ? `BCQuality: the certified review (${v.file}) is older than the last AL change. Run it again (al-conductor Phase 3 step 0) or say in the report why it was not run.`
        : 'BCQuality: no certified review ran for this code. Run tools/bcquality/certified-review.js (al-conductor Phase 3 step 0), or say in the report why the BCQuality review did not run.');
    else if (v && v.verdict !== 'certified' && !said && !reportText.includes(path.basename(v.file)))
      problems.push(`BCQuality: the review verdict is ${v.verdict} (${v.file}); the report must say "BCQuality review: not certified" and cite that file.`);
  }
  const b = build(cwd);
  if (b.status === 'red' || b.status === 'stale')
    problems.push(`Build: ${b.reason}. Run /aldc-verify:al-verify, fix every error, and update the report with the new result.`);
  else if ((b.status === 'not-run' || b.status === 'missing') && !/build[^\n]{0,80}not[- ]?run|not[- ]?run[^\n]{0,40}build/i.test(reportText))
    problems.push(`Build: there is no green compile evidence (${b.reason}). Either compile with /aldc-verify:al-verify or state "build: not-run" with the reason in the report's Verification table.`);
  if (!runtime.testRunner(cwd)) {
    const claims = testClaims(reportText);
    if (claims.length) problems.push(`Tests: no test runner is configured (aldc.yaml testing.runner), so tests were compiled, not executed; these lines claim otherwise: ${claims.map((c) => `"${c.slice(0, 120)}"`).join('; ')}. Report them as not-run.`);
  }
  const gaps = permissionGaps(cwd);
  if (gaps.length) problems.push(`Permissions: no permission set gives tabledata access to ${gaps.slice(0, 10).map((g) => `${g.name} (${g.file})`).join(', ')}${gaps.length > 10 ? ` and ${gaps.length - 10} more` : ''}. Add them to the app's permission set.`);
  return problems;
}

module.exports = { build, permissionGaps, testClaims, certifiedVerdict, finalReportProblems, alFiles, isTestApp };
