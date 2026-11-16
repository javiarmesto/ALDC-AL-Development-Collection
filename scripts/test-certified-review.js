#!/usr/bin/env node
'use strict';
// Deterministic parts of claude-plugin/tools/bcquality/certified-review.js. No model calls.
// The last test runs BCQuality's real Validate-FindingsReport.ps1 on a composed fixture when
// pwsh and an installed BCQuality are available, and is skipped otherwise.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cr = require('../claude-plugin/tools/bcquality/certified-review.js');
const runtime = require('../claude-plugin/hooks/aldc-runtime.js');

const zero = { blocker: 0, major: 0, minor: 0, info: 0 };
const leafReport = (id, findings = [], extra = {}) => ({
  skill: { id, version: 1 }, outcome: 'completed',
  summary: { counts: { ...zero, ...Object.fromEntries(['blocker', 'major', 'minor', 'info'].map((s) => [s, findings.filter((f) => f.severity === s).length])) },
    coverage: { 'worklist-size': findings.length ? 2 : 0, 'items-evaluated': findings.length ? 2 : 0 } },
  findings, suppressed: [], ...extra,
});
const kf = (ref, file, line, msg, sev = 'major', conf = 'high', domain = 'Testing', extra = {}) => ({
  id: ref, severity: sev, message: msg, location: { file, line }, references: [{ path: ref }], confidence: conf, domain, ...extra,
});
const REF_A = 'microsoft/knowledge/testing/use-library-codeunits-for-test-fixtures.md';
const REF_B = 'microsoft/knowledge/testing/use-generateguid-for-unique-test-fixture-values.md';

test('parseArgs: defaults, required project, unknown flags', () => {
  const o = cr.parseArgs(['--project', '.', '--dry-run']);
  assert.equal(o.base, 'main'); assert.equal(o.concurrency, 4); assert.equal(o.budgetPerLeaf, 0.6); assert.equal(o.model, 'sonnet'); assert.equal(o.dryRun, true);
  assert.equal(o.out, path.join(path.resolve('.'), '.claude', 'audits'));
  assert.throws(() => cr.parseArgs([]), /--project/);
  assert.throws(() => cr.parseArgs(['--project', '.', '--bogus']), /Unknown argument/);
  assert.throws(() => cr.parseArgs(['--project', '.', '--concurrency', '0']), /concurrency/);
});

test('path resolution: comma list, @listfile, normalization, dedupe, scope checks', () => {
  assert.deepEqual(cr.parsePathsOption('a.al, b.al,,c.al'), ['a.al', 'b.al', 'c.al']);
  assert.deepEqual(cr.parsePathsOption('@list', () => '# c\nApp/x.al\r\n\nApp/y.al\n'), ['App/x.al', 'App/y.al']);
  const project = path.resolve('/proj');
  const exists = (p) => !p.endsWith('missing.al');
  const r = cr.normalizeSourcePaths(project, ['App\\b.al', 'App/a.al', path.join(project, 'App', 'b.al'), '../out.al', 'App/missing.al'], exists);
  assert.deepEqual(r.paths, ['App/a.al', 'App/b.al']);
  assert.equal(r.problems.length, 2);
  assert.match(r.problems.join(' '), /outside project: \.\.\/out\.al/);
  assert.match(r.problems.join(' '), /missing file: App\/missing\.al/);
});

test('git path resolution: base...HEAD + working tree + untracked; missing base is a tool failure', () => {
  const calls = [];
  const fakeGit = (project, args) => {
    calls.push(args.join(' '));
    if (args[0] === 'rev-parse') return ['abc'];
    if (args.includes('main...HEAD')) return ['App/a.al'];
    if (args[0] === 'diff') return ['App/a.al', 'App/b.al'];
    return ['Test/t.al'];
  };
  assert.deepEqual(cr.gitSourcePaths('/p', 'main', fakeGit), ['App/a.al', 'App/a.al', 'App/b.al', 'Test/t.al']);
  assert.ok(calls.some((c) => c.includes('--diff-filter=d main...HEAD -- *.al')));
  assert.ok(calls.some((c) => c.startsWith('ls-files --others --exclude-standard')));
  const res = cr.resolveSourcePaths({ project: path.resolve('/p'), base: 'main' }, { git: fakeGit, exists: () => true });
  assert.deepEqual(res.paths, ['App/a.al', 'App/b.al', 'Test/t.al']);
  assert.throws(() => cr.gitSourcePaths('/p', 'nope', () => { throw new Error('x'); }), (e) => e instanceof cr.ToolFailure && /Base ref 'nope'/.test(e.message));
});

test('splitLines counts like ReadAllLines', () => {
  assert.equal(cr.splitLines('a\r\nb\r\n').length, 2);
  assert.equal(cr.splitLines('﻿a\nb').length, 2);
  assert.equal(cr.splitLines('').length, 0);
  assert.equal(cr.splitLines('a\n\n').length, 2);
});

test('worklist parsing and host-owned expected composition', () => {
  // ConvertTo-Json collapses one-element arrays to objects; parseWorklist must accept both.
  const raw = JSON.stringify({
    superSkill: { id: 'al-code-review', path: 'microsoft/skills/review/al-code-review.md', version: 1 },
    subSkills: { id: 'al-security-review', path: 'custom/skills/review/al-security-review.md', version: 2, layer: 'custom', declaredPath: 'microsoft/skills/review/al-security-review.md' },
    skipped: [{ id: 'al-style-review', declaredPath: 'microsoft/skills/review/al-style-review.md', reason: 'configuration' }],
  });
  const w = cr.parseWorklist(raw);
  assert.equal(w.subSkills.length, 1);
  assert.equal(w.subSkills[0].path, 'custom/skills/review/al-security-review.md');
  const rows = [
    { path: 'custom/skills/review/al-security-review.md', version: 2, inputs: ['pr-diff', 'file-path'] },
    { path: 'microsoft/skills/review/al-style-review.md', version: 1, inputs: ['pr-diff', 'file-path'] },
  ];
  const e = cr.buildExpectedComposition(w, rows);
  assert.deepEqual(e.superSkill, { id: 'al-code-review', version: 1 });
  assert.deepEqual(e.subSkills.map((s) => [s.id, s.version]), [['al-security-review', 2]]);
  assert.deepEqual(e.skipped, [{ id: 'al-style-review', version: 1, reason: 'configuration' }]);
  assert.deepEqual(e.acceptedResults, []);
  const e2 = cr.buildExpectedComposition(w, [{ ...rows[0], inputs: ['pr-diff'] }, rows[1]]);
  assert.deepEqual(e2.subSkills, []);
  assert.deepEqual(e2.skipped[0], { id: 'al-security-review', version: 2, reason: 'not-applicable' });
  assert.throws(() => cr.parseWorklist('not json'), /not JSON/);
  assert.throws(() => cr.buildExpectedComposition(w, [rows[0]]), /not indexed/);
});

test('leaf domains and catalog page merge', () => {
  assert.deepEqual(cr.leafDomains('Use `-Domain error-handling` ... also -Domain web-services and -Domain error-handling'), ['error-handling', 'web-services']);
  const page = (offset, n, complete, total) => ({ totalCount: total, complete, offset, defaults: {}, candidates: Array.from({ length: n }, (_, i) => ({ path: `p${offset + i}` })) });
  const m = cr.mergeCatalogPages('d', [page(0, 2, false, 3), page(2, 1, true, 3)]);
  assert.equal(m.candidates.length, 3); assert.equal(m.complete, true);
  assert.throws(() => cr.mergeCatalogPages('d', [page(0, 2, false, 3)]), /incomplete/);
  assert.throws(() => cr.mergeCatalogPages('d', [page(0, 2, true, 3)]), /2 of 3/);
});

test('validator error codes', () => {
  assert.deepEqual(cr.validatorCodes('Findings-report acceptance failed: RANGE_START_MISMATCH at $.findings[0].location.range.start-line: x; REFERENCE_NOT_RETRIEVED at $.findings[1].references: y'),
    ['RANGE_START_MISMATCH', 'REFERENCE_NOT_RETRIEVED']);
  assert.deepEqual(cr.validatorCodes('Invalid findings-report JSON or schema: Required properties'), ['SCHEMA']);
});

test('JSON extraction is transport only', () => {
  assert.equal(cr.extractJson('{"a":1}').method, 'exact');
  assert.equal(cr.extractJson('Here:\n```json\n{"a":1}\n```').method, 'fenced');
  assert.equal(cr.extractJson('Result {"a":1} done').method, 'embedded');
  assert.equal(cr.extractJson('{"a":1,}'), null);
  assert.equal(cr.extractJson('[1]'), null);
  assert.equal(cr.extractJson(''), null);
});

test('bounded range normalization (DO pre-gate)', () => {
  const r = leafReport('x', [{ ...kf(REF_A, 'a.al', 5, 'm'), location: { file: 'a.al', line: 5, range: { 'start-line': 4, 'end-line': 6 } } }]);
  const n = cr.normalizeRanges(r);
  assert.equal(n.removed.length, 1);
  assert.equal(n.candidate.findings[0].location.range, undefined);
  assert.equal(r.findings[0].location.range['start-line'], 4, 'raw report is not mutated');
  const withCode = leafReport('x', [{ ...r.findings[0], 'suggested-code': '' }]);
  assert.equal(cr.normalizeRanges(withCode), null, 'suggested-code field disqualifies');
  const reversed = leafReport('x', [{ ...kf(REF_A, 'a.al', 5, 'm'), location: { file: 'a.al', line: 5, range: { 'start-line': 6, 'end-line': 9 } } }]);
  assert.equal(cr.normalizeRanges(reversed), null, 'line outside range is not eligible');
  assert.equal(cr.normalizeRanges(leafReport('x', [kf(REF_A, 'a.al', 5, 'm')])), null, 'nothing to normalize');
});

test('retrieved articles come only from full, successful Read calls under the BCQuality root', () => {
  const root = path.resolve(os.tmpdir(), 'bcq-root');
  const use = (id, file_path, extra = {}) => ({ type: 'tool_use', id, name: 'Read', input: { file_path, ...extra } });
  const res = (id, text, is_error = false) => ({ type: 'tool_result', tool_use_id: id, content: text, is_error });
  const events = [
    { type: 'assistant', message: { content: [
      use('1', path.join(root, 'microsoft', 'knowledge', 'testing', 'a.md')),
      use('2', path.join(root, 'microsoft', 'knowledge', 'testing', 'b.md'), { offset: 10, limit: 5 }),
      use('3', path.join(root, 'microsoft', 'knowledge', 'testing', 'c.md')),
      use('4', path.join(root, 'microsoft', 'skills', 'review', 'x.md')),
      use('5', path.join(os.tmpdir(), 'other', 'microsoft', 'knowledge', 'testing', 'd.md')),
      use('6', toFwd(path.join(root, 'community', 'knowledge', 'ui', 'e.md'))),
    ] } },
    { type: 'user', message: { content: [res('1', '1\t---'), res('2', 'x'), res('3', 'File does not exist.', true), res('4', 'x'), res('5', 'x'), res('6', 'ok')] } },
  ];
  assert.deepEqual(cr.retrievedArticles(events, root), ['community/knowledge/ui/e.md', 'microsoft/knowledge/testing/a.md']);
});
function toFwd(p) { return p.split(path.sep).join('/'); }

test('coverage evidence rule', () => {
  const r = leafReport('x', [kf(REF_A, 'a.al', 1, 'm')]);
  assert.match(cr.coverageEvidenceError(r, ['one']), /claims 2 evaluated/);
  assert.equal(cr.coverageEvidenceError(r, ['one', 'two']), null);
  assert.equal(cr.coverageEvidenceError(leafReport('y'), []), null);
});

test('super outcome rollup rules', () => {
  const s = (...o) => o.map((outcome) => ({ outcome }));
  assert.equal(cr.deriveSuperOutcome(s('completed', 'no-knowledge')), 'completed');
  assert.equal(cr.deriveSuperOutcome(s('no-knowledge', 'not-applicable')), 'no-knowledge');
  assert.equal(cr.deriveSuperOutcome(s('not-applicable')), 'not-applicable');
  assert.equal(cr.deriveSuperOutcome(s()), 'not-applicable');
  assert.equal(cr.deriveSuperOutcome(s('completed', 'failed')), 'partial');
  assert.equal(cr.deriveSuperOutcome(s('completed', 'partial')), 'partial');
  assert.equal(cr.deriveSuperOutcome(s('failed', 'failed')), 'failed');
  assert.equal(cr.deriveSuperOutcome(s('completed'), 1), 'partial');
  assert.equal(cr.deriveSuperOutcome(s('failed'), 1), 'failed');
});

test('composition: declared order, producers, agent id prefix, dedupe merge, counts, coverage, skips', () => {
  const testing = leafReport('al-testing-review', [
    kf(REF_A, 'T.al', 10, 'Same correction.', 'minor', 'medium'),
    { id: 'agent:hardcoded-key', severity: 'minor', message: 'Agent leaf finding.', location: { file: 'T.al', line: 30 }, references: [], confidence: 'medium', domain: 'Testing' },
  ]);
  const style = leafReport('al-style-review', [
    kf(REF_B, 'T.al', 10, 'Same correction.', 'major', 'high', 'Style'),
    kf(REF_B, 'T.al', 50, 'Different place.', 'minor', 'high', 'Style'),
  ]);
  const failed = cr.failedLeafResult('al-ui-review', 1, 'gate rejected');
  const selected = [{ id: 'al-style-review', version: 1 }, { id: 'al-testing-review', version: 1 }, { id: 'al-ui-review', version: 1 }];
  const { report, missing } = cr.composeSuperReport({
    superSkill: { id: 'al-code-review', version: 1 }, selected, skipped: [{ id: 'al-scm-review', version: 1, reason: 'configuration' }],
    accepted: { 'al-testing-review': testing, 'al-style-review': style, 'al-ui-review': { ...failed, findings: [] } },
    leafDomainsById: { 'al-testing-review': ['testing'], 'al-style-review': ['style'] },
  });
  assert.deepEqual(missing, []);
  assert.deepEqual(report['sub-results'].map((s) => s.skill.id), ['al-style-review', 'al-testing-review', 'al-ui-review']);
  assert.equal(report['sub-results'][1], testing, 'accepted leaf is nested unchanged');
  assert.equal(report.outcome, 'partial');
  assert.match(report['outcome-reason'], /al-ui-review failed/);
  assert.equal(report.findings.length, 3);
  const merged = report.findings.find((f) => f.location.line === 10);
  // Testing owns the testing article (more specific); style's style-domain reference is appended.
  assert.equal(merged['from-sub-skill'], 'al-testing-review');
  assert.equal(merged.id, REF_A);
  assert.deepEqual(merged.references.map((r) => r.path), [REF_A, REF_B]);
  assert.equal(merged.severity, 'major'); assert.equal(merged.confidence, 'high');
  assert.ok(report.findings.some((f) => f.id === 'al-testing-review:agent:hardcoded-key' && f['from-sub-skill'] === 'al-testing-review'));
  assert.deepEqual(report.summary.counts, { blocker: 0, major: 1, minor: 2, info: 0 });
  assert.deepEqual(report.summary.coverage, { 'worklist-size': 4, 'items-evaluated': 4 }, 'failed leaf coverage excluded');
  assert.deepEqual(report['skipped-sub-skills'], [{ skill: { id: 'al-scm-review', version: 1 }, reason: 'configuration' }]);
  assert.deepEqual(report.suppressed, []);
});

test('composition: missing leaves give partial, name the ids and forbid agent findings', () => {
  const agent = { id: 'agent:x', severity: 'minor', message: 'm', references: [], confidence: 'medium', domain: 'Agent', 'from-sub-skill': 'agent' };
  const { report, missing } = cr.composeSuperReport({
    superSkill: { id: 'al-code-review', version: 1 }, selected: [{ id: 'a', version: 1 }, { id: 'b', version: 1 }], skipped: [],
    accepted: { a: leafReport('a') }, agentFindings: [agent],
  });
  assert.deepEqual(missing, ['b']);
  assert.equal(report.outcome, 'partial');
  assert.match(report['outcome-reason'], /\bb\b/);
  assert.equal(report.findings.length, 0);
  assert.equal(report['skipped-sub-skills'], undefined);
  const all = cr.composeSuperReport({ superSkill: { id: 's', version: 1 }, selected: [{ id: 'a', version: 1 }], skipped: [], accepted: { a: leafReport('a') }, agentFindings: [agent] });
  assert.equal(all.report.outcome, 'completed');
  assert.equal(all.report.findings.length, 1);
  assert.equal(all.report.summary.counts.minor, 1);
});

test('agent finding gate', () => {
  const ok = { id: 'agent:cross-cut', severity: 'minor', confidence: 'medium', message: 'Issue and fix.', references: [], 'from-sub-skill': 'agent', domain: 'Agent', location: { file: 'a.al', line: 3 } };
  assert.deepEqual(cr.checkAgentFindings([ok], { 'a.al': 10 }), []);
  assert.deepEqual(cr.checkAgentFindings([], {}), []);
  const bad = { ...ok, id: 'agent:Bad Id', severity: 'major', confidence: 'high', domain: 'Security', location: { file: 'b.al', line: 3 } };
  const errs = cr.checkAgentFindings([bad], { 'a.al': 10 });
  for (const re of [/id/, /severity/, /confidence/, /domain/, /outside the source scope/]) assert.ok(errs.some((e) => re.test(e)), re.toString());
  assert.ok(cr.checkAgentFindings([{ ...ok, location: { file: 'a.al', line: 11 } }], { 'a.al': 10 }).length);
  assert.ok(cr.checkAgentFindings('x', {}).length);
});

test('verdict rules: partial, failed leaf, validator failure, missing self-review => not-certified', () => {
  const good = { report: { outcome: 'completed' }, validator: { ok: true }, leaves: [{ id: 'a', outcome: 'completed' }], missing: [], selfReview: { status: 'performed' } };
  assert.deepEqual(cr.decideVerdict(good), { verdict: 'certified', reasons: [] });
  assert.equal(cr.decideVerdict({ ...good, report: { outcome: 'no-knowledge' } }).verdict, 'certified');
  const partial = cr.decideVerdict({ ...good, report: { outcome: 'partial' } });
  assert.equal(partial.verdict, 'not-certified'); assert.match(partial.reasons.join(), /partial/);
  assert.equal(cr.decideVerdict({ ...good, validator: { ok: false, error: 'X' } }).verdict, 'not-certified');
  assert.equal(cr.decideVerdict({ ...good, leaves: [{ id: 'a', outcome: 'failed', hostFailed: true }] }).verdict, 'not-certified');
  assert.equal(cr.decideVerdict({ ...good, leaves: [{ id: 'a', outcome: 'partial' }] }).verdict, 'not-certified');
  assert.equal(cr.decideVerdict({ ...good, missing: ['b'] }).verdict, 'not-certified');
  assert.match(cr.decideVerdict({ ...good, selfReview: { status: 'not-performed', reason: 'budget' } }).reasons.join(), /self-review.*budget/);
});

test('neutral launch: no user CLAUDE.md, plugins disabled, read-only tools, empty MCP', () => {
  const project = path.resolve(os.tmpdir(), 'proj');
  const s = cr.neutralSettings(project);
  assert.equal(s.autoMemoryEnabled, false);
  assert.ok(s.claudeMdExcludes.includes(path.join(os.homedir(), '.claude', 'CLAUDE.md').split(path.sep).join('/')));
  assert.ok(s.claudeMdExcludes.includes(path.join(project, 'CLAUDE.md').split(path.sep).join('/')));
  assert.ok(Object.values(s.enabledPlugins).every((v) => v === false));
  const a = cr.claudeArgs({ model: 'sonnet', budget: 0.6, project, bcq: '/bcq' });
  const after = (flag) => a[a.indexOf(flag) + 1];
  assert.equal(after('--setting-sources'), 'project,local');
  assert.equal(after('--tools'), 'Read,Grep,Glob');
  assert.equal(after('--mcp-config'), '{"mcpServers":{}}');
  assert.equal(after('--max-budget-usd'), '0.6');
  assert.equal(after('--plugin-dir'), '/bcq');
  assert.ok(a.includes('--strict-mcp-config'));
  for (const t of ['Write', 'Edit', 'Bash', 'PowerShell', 'Agent', 'Skill']) assert.ok(a.includes(t), t);
});

test('DO excerpt for leaves keeps the findings contract and drops composition', () => {
  const doText = '# DO\n## Findings-report contract\nA\n## Development-guidance-report contract\nB\n## Composition (super-skills)\nC\n## Worked example\nD\n';
  const out = cr.doForLeaf(doText);
  assert.match(out, /Findings-report contract/); assert.match(out, /Worked example/);
  assert.doesNotMatch(out, /Development-guidance|Composition/);
});

const bcq = runtime.bcqualityRoot();
const canValidate = !!(bcq && fs.existsSync(path.join(bcq, 'tools', 'Validate-FindingsReport.ps1')) && fs.existsSync(path.join(bcq, REF_A)) && fs.existsSync(path.join(bcq, REF_B)) && cr.pwshAvailable());
test('composed super report passes the real Validate-FindingsReport.ps1 with an expected composition', { skip: !canValidate && 'pwsh or BCQuality not available' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-certified-test-'));
  try {
    fs.mkdirSync(path.join(dir, 'Test'));
    fs.writeFileSync(path.join(dir, 'Test', 'T.al'), Array.from({ length: 60 }, (_, i) => `// line ${i + 1}`).join('\n') + '\n');
    const file = 'Test/T.al';
    const testing = leafReport('al-testing-review', [kf(REF_A, file, 10, 'Same correction.', 'minor', 'medium')]);
    const testing2 = { ...testing, summary: { ...testing.summary, coverage: { 'worklist-size': 1, 'items-evaluated': 1 } } };
    const style = leafReport('al-style-review', [kf(REF_B, file, 10, 'Same correction.', 'major', 'high', 'Style')]);
    const style2 = { ...style, summary: { ...style.summary, coverage: { 'worklist-size': 1, 'items-evaluated': 1 } } };
    const expected = { superSkill: { id: 'al-code-review', version: 1 }, subSkills: [{ id: 'al-style-review', version: 1 }, { id: 'al-testing-review', version: 1 }],
      skipped: [{ id: 'al-scm-review', version: 1, reason: 'configuration' }], acceptedResults: [] };
    for (const [id, rep] of [['al-style-review', style2], ['al-testing-review', testing2]]) {
      const p = path.join(dir, `${id}.json`);
      fs.writeFileSync(p, JSON.stringify(rep));
      const v = cr.validateReport(bcq, { reportPath: p, skillKind: 'leaf', sourceRoot: dir, sourcePaths: [file], retrieved: [REF_A, REF_B] }, dir);
      assert.ok(v.ok, v.error);
      expected.acceptedResults.push({ id, version: 1, reportPath: `${id}.json` });
    }
    const expectedPath = path.join(dir, 'expected.json');
    fs.writeFileSync(expectedPath, JSON.stringify(expected));
    const agent = { id: 'agent:cross-cutting-gap', severity: 'minor', message: 'Cross-cutting issue and fix.', location: { file, line: 40 }, references: [], confidence: 'medium', 'from-sub-skill': 'agent', domain: 'Agent' };
    const { report } = cr.composeSuperReport({ superSkill: expected.superSkill, selected: expected.subSkills, skipped: expected.skipped,
      accepted: { 'al-style-review': style2, 'al-testing-review': testing2 }, agentFindings: [agent], leafDomainsById: { 'al-testing-review': ['testing'], 'al-style-review': ['style'] } });
    assert.equal(report.findings.length, 2, 'duplicates merged, agent finding added');
    const reportPath = path.join(dir, 'super.json');
    fs.writeFileSync(reportPath, JSON.stringify(report));
    const v = cr.validateReport(bcq, { reportPath, skillKind: 'super', sourceRoot: dir, sourcePaths: [file], retrieved: [REF_A, REF_B], expectedCompositionPath: expectedPath }, dir);
    assert.ok(v.ok, v.error);
    // Dropping a captured leaf must fail the composition check.
    const { report: partial } = cr.composeSuperReport({ superSkill: expected.superSkill, selected: expected.subSkills, skipped: expected.skipped, accepted: { 'al-style-review': style2 } });
    fs.writeFileSync(reportPath + '.p', JSON.stringify(partial));
    const vp = cr.validateReport(bcq, { reportPath: reportPath + '.p', skillKind: 'super', sourceRoot: dir, sourcePaths: [file], retrieved: [REF_A, REF_B], expectedCompositionPath: expectedPath }, dir);
    assert.equal(vp.ok, false);
    assert.ok(vp.codes.includes('SUPER_ACCEPTED_LEAF_MISSING'), vp.error);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
