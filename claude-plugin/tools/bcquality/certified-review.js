#!/usr/bin/env node
'use strict';
// aldc-claude: deterministic, certified BCQuality review runner.
//
// Phase 0 showed that `bcquality:al-code-review` never composes reliably when a model
// orchestrates it. This runner is the host: it resolves the leaf worklist with BCQuality's
// own tools, runs every leaf as an isolated neutral `claude -p` call (the model executes one
// leaf only), gates each return with Validate-FindingsReport.ps1, composes the super-skill
// report itself per microsoft/skills/review/al-code-review.md, runs the cross-domain agent
// self-review pass as one more isolated call, and validates the composed report as `super`
// against a host-owned expected composition. Anything short of a clean, complete, validated
// composition is `not-certified`.
//
// Usage:
//   node certified-review.js --project <dir> [--paths <f1,f2|@listfile>] [--base main]
//     [--concurrency 4] [--budget-per-leaf 0.6] [--max-total-usd 12] [--model sonnet]
//     [--out <dir>] [--dry-run]
//   node certified-review.js --project <dir> [same options] --detach   (start in the background)
//   node certified-review.js --project <dir> --wait <seconds>           (poll for its verdict)
// Exit: 0 certified, 1 not-certified, 2 still running (--wait), 3 tool failure.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const runtime = require('../../hooks/aldc-runtime.js');

const SUPER_SKILL_PATH = 'microsoft/skills/review/al-code-review.md';
const INPUT_KIND = 'file-path';
const SEVERITIES = ['blocker', 'major', 'minor', 'info'];
const SEV_RANK = { info: 0, minor: 1, major: 2, blocker: 3 };
const CONF_RANK = { low: 0, medium: 1, high: 2 };
const LEAF_TIMEOUT_MS = 20 * 60 * 1000;

class ToolFailure extends Error {}

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const opts = { base: 'main', concurrency: 4, budgetPerLeaf: 0.6, maxTotalUsd: 12, model: 'sonnet', dryRun: false };
  const need = (i, name) => { if (i >= argv.length) throw new ToolFailure(`Missing value for ${name}.`); return argv[i]; };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--project': opts.project = need(++i, a); break;
      case '--paths': opts.paths = need(++i, a); break;
      case '--base': opts.base = need(++i, a); break;
      case '--concurrency': opts.concurrency = Number(need(++i, a)); break;
      case '--budget-per-leaf': opts.budgetPerLeaf = Number(need(++i, a)); break;
      case '--max-total-usd': opts.maxTotalUsd = Number(need(++i, a)); break;
      case '--model': opts.model = need(++i, a); break;
      case '--out': opts.out = need(++i, a); break;
      case '--dry-run': opts.dryRun = true; break;
      case '--detach': opts.detach = true; break;
      case '--wait': opts.wait = Number(need(++i, a)); break;
      case '-h': case '--help': opts.help = true; break;
      default: throw new ToolFailure(`Unknown argument '${a}'.`);
    }
  }
  if (opts.help) return opts;
  if (!opts.project) throw new ToolFailure('--project <dir> is required.');
  if (!(opts.concurrency >= 1)) throw new ToolFailure('--concurrency must be >= 1.');
  if (!(opts.budgetPerLeaf > 0)) throw new ToolFailure('--budget-per-leaf must be > 0.');
  if (!(opts.maxTotalUsd > 0)) throw new ToolFailure('--max-total-usd must be > 0.');
  if (opts.wait !== undefined && !(opts.wait > 0)) throw new ToolFailure('--wait needs a number of seconds > 0.');
  opts.concurrency = Math.floor(opts.concurrency);
  opts.project = path.resolve(opts.project);
  if (!fs.existsSync(opts.project) || !fs.statSync(opts.project).isDirectory()) throw new ToolFailure(`project folder not found: ${opts.project}`);
  opts.out = path.resolve(opts.out || path.join(opts.project, '.claude', 'audits'));
  return opts;
}

// ---------------------------------------------------------------- source paths

const toPosix = (p) => p.split(path.sep).join('/').replace(/\\/g, '/');

/** Repo-relative, forward-slash path of `p` inside `project`, or null when outside. */
function relativeToProject(project, p) {
  const abs = path.resolve(project, p);
  const rel = path.relative(project, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return toPosix(rel);
}

/** Explicit --paths value: comma list or @listfile (one path per line, # comments). */
function parsePathsOption(value, readFile = (f) => fs.readFileSync(f, 'utf8')) {
  if (!value) return [];
  const items = value.startsWith('@')
    ? readFile(value.slice(1)).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    : value.split(',').map((s) => s.trim()).filter(Boolean);
  return items;
}

/** Normalize, dedupe and sort source paths; reject paths outside the project or missing. */
function normalizeSourcePaths(project, items, exists = (p) => fs.existsSync(p) && fs.statSync(p).isFile()) {
  const out = new Set();
  const problems = [];
  for (const item of items) {
    const rel = relativeToProject(project, item);
    if (!rel) { problems.push(`outside project: ${item}`); continue; }
    if (!exists(path.join(project, rel))) { problems.push(`missing file: ${rel}`); continue; }
    out.add(rel);
  }
  return { paths: [...out].sort(), problems };
}

function git(project, args) {
  const r = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8' });
  if (r.error) throw new ToolFailure(`git is not available: ${r.error.message}`);
  if (r.status !== 0) throw new ToolFailure(`git ${args.join(' ')} failed: ${(r.stderr || '').trim()}`);
  return r.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

/** Changed AL files: `<base>...HEAD`, plus staged/unstaged changes and untracked files. */
function gitSourcePaths(project, base, run = git) {
  try { run(project, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`]); }
  catch { throw new ToolFailure(`Base ref '${base}' not found in ${project}; pass --base <ref> or --paths.`); }
  return [
    ...run(project, ['diff', '--name-only', '--diff-filter=d', `${base}...HEAD`, '--', '*.al']),
    ...run(project, ['diff', '--name-only', '--diff-filter=d', 'HEAD', '--', '*.al']),
    ...run(project, ['ls-files', '--others', '--exclude-standard', '--', '*.al']),
  ];
}

function resolveSourcePaths(opts, deps = {}) {
  const items = opts.paths ? parsePathsOption(opts.paths, deps.readFile) : gitSourcePaths(opts.project, opts.base, deps.git);
  return normalizeSourcePaths(opts.project, items, deps.exists);
}

/** Line count as .NET ReadAllLines counts it (a trailing newline does not add a line). */
function splitLines(text) {
  const t = text.replace(/^﻿/, '');
  if (t === '') return [];
  const lines = t.split(/\r\n|\r|\n/);
  if (/(\r\n|\r|\n)$/.test(t)) lines.pop();
  return lines;
}

// ---------------------------------------------------------------- BCQuality tools (pwsh)

function pwshAvailable() {
  const r = spawnSync('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

/** Run an inline PowerShell script with a JSON argument file (no quoting of paths/arrays on the command line). */
function runPwsh(script, args, workDir) {
  const argsFile = path.join(workDir, `pwsh-args-${crypto.randomUUID()}.json`);
  fs.writeFileSync(argsFile, JSON.stringify(args));
  // UTF-8 stdout: the default console code page turns characters such as an arrow into control bytes.
  const full = `$ErrorActionPreference = 'Stop'\n[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)\n$OutputEncoding = [Text.UTF8Encoding]::new($false)\n$a =Get-Content -LiteralPath '${argsFile.replace(/'/g, "''")}' -Raw -Encoding utf8 | ConvertFrom-Json\n${script}`;
  const r = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(full, 'utf16le').toString('base64')],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  try { fs.unlinkSync(argsFile); } catch { /* ignore */ }
  if (r.error) throw new ToolFailure(`pwsh failed to start: ${r.error.message}`);
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

const arr = (name) => `[string[]]@($a.${name} | Where-Object { $_ })`;

function buildIndexes(bcq, hostDir) {
  const r = runPwsh(`
& (Join-Path $a.root 'tools/Build-SkillIndex.ps1') -BCQualityRoot $a.root -IndexPath $a.skillIndex | Out-Null
& (Join-Path $a.root 'tools/Build-KnowledgeIndex.ps1') -BCQualityRoot $a.root -IndexPath $a.knowledgeIndex 6>$null | Out-Null
'ok'`, { root: bcq, skillIndex: path.join(hostDir, 'skill-index.json'), knowledgeIndex: path.join(hostDir, 'knowledge-index.json') }, hostDir);
  if (r.status !== 0 || !/ok\s*$/.test(r.stdout)) throw new ToolFailure(`Index build failed: ${r.stderr || r.stdout}`);
  return { skillIndex: path.join(hostDir, 'skill-index.json'), knowledgeIndex: path.join(hostDir, 'knowledge-index.json') };
}

function resolveWorklist(bcq, skillIndex, layers, disabled, hostDir) {
  const r = runPwsh(`
$p = @{ BCQualityRoot = $a.root; IndexPath = $a.index; SuperSkillPath = $a.super }
$layers = ${arr('layers')}; if ($layers.Count) { $p.EnabledLayers = $layers }
$disabled = ${arr('disabled')}; if ($disabled.Count) { $p.DisabledSkills = $disabled }
& (Join-Path $a.root 'tools/Resolve-SkillWorklist.ps1') @p | ConvertTo-Json -Depth 20 -Compress`,
  { root: bcq, index: skillIndex, super: SUPER_SKILL_PATH, layers, disabled }, hostDir);
  if (r.status !== 0) throw new ToolFailure(`Resolve-SkillWorklist failed: ${r.stderr || r.stdout}`);
  return parseWorklist(r.stdout);
}

/** Parse Resolve-SkillWorklist.ps1 output (ConvertTo-Json) into a stable shape. */
function parseWorklist(text) {
  let j;
  try { j = JSON.parse(String(text).trim()); } catch (e) { throw new ToolFailure(`Worklist is not JSON: ${e.message}`); }
  const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  if (!j || !j.superSkill || !j.superSkill.id) throw new ToolFailure('Worklist has no superSkill.');
  const subSkills = list(j.subSkills).map((s) => ({ id: s.id, path: s.path, version: s.version, layer: s.layer, declaredPath: s.declaredPath }));
  const skipped = list(j.skipped).map((s) => ({ id: s.id, declaredPath: s.declaredPath, reason: s.reason }));
  for (const s of subSkills) if (!s.id || !s.path || s.version == null) throw new ToolFailure(`Malformed worklist entry ${JSON.stringify(s)}.`);
  return { superSkill: { id: j.superSkill.id, path: j.superSkill.path, version: j.superSkill.version }, subSkills, skipped };
}

/** Host-owned expected composition (DO input contract), fixed before dispatch. */
function buildExpectedComposition(worklist, skillIndexRows, inputKind = INPUT_KIND) {
  const byPath = new Map(skillIndexRows.map((r) => [r.path, r]));
  const subSkills = [];
  const skipped = [];
  for (const s of worklist.subSkills) {
    const row = byPath.get(s.path);
    if (row && Array.isArray(row.inputs) && !row.inputs.includes(inputKind)) skipped.push({ id: s.id, version: s.version, reason: 'not-applicable' });
    else subSkills.push({ id: s.id, version: s.version, path: s.path, layer: s.layer });
  }
  for (const s of worklist.skipped) {
    const row = byPath.get(s.declaredPath);
    if (!row) throw new ToolFailure(`Skipped slot '${s.declaredPath}' is not indexed; cannot record its version.`);
    skipped.push({ id: s.id, version: row.version, reason: s.reason || 'configuration' });
  }
  return { superSkill: { id: worklist.superSkill.id, version: worklist.superSkill.version }, subSkills, skipped, acceptedResults: [] };
}

/** Domains a leaf retrieves with READ's catalog helper (`-Domain x` in its Source section). */
function leafDomains(leafText) {
  return [...new Set((leafText.match(/-Domain\s+([a-z0-9-]+)/g) || []).map((m) => m.split(/\s+/)[1]))];
}

/** Full catalog for each domain: every Search-Knowledge page until complete. */
function fetchCatalogs(bcq, knowledgeIndex, domains, layers, ctx, hostDir) {
  const r = runPwsh(`
$out = [ordered]@{}
foreach ($d in ${arr('domains')}) {
  $pages = [Collections.Generic.List[object]]::new()
  $p = @{ BCQualityRoot = $a.root; IndexPath = $a.index; Domain = $d; Technologies = @('al') }
  $layers = ${arr('layers')}; if ($layers.Count) { $p.EnabledLayers = $layers }
  if ($a.bcVersion) { $p.BCVersion = [int]$a.bcVersion }
  $page = (& (Join-Path $a.root 'tools/Search-Knowledge.ps1') @p) | ConvertFrom-Json -Depth 50
  $pages.Add($page)
  while (-not $page.complete) {
    $p.Offset = $page.continuation.offset; $p.Snapshot = $page.continuation.snapshot
    $page = (& (Join-Path $a.root 'tools/Search-Knowledge.ps1') @p) | ConvertFrom-Json -Depth 50
    $pages.Add($page)
  }
  $out[$d] = @($pages)
}
$out | ConvertTo-Json -Depth 50 -Compress`, { root: bcq, index: knowledgeIndex, domains, layers, bcVersion: ctx.bcVersion || null }, hostDir);
  if (r.status !== 0) throw new ToolFailure(`Search-Knowledge failed: ${r.stderr || r.stdout}`);
  const raw = JSON.parse(r.stdout);
  const catalogs = {};
  for (const d of domains) catalogs[d] = mergeCatalogPages(d, raw[d]);
  return catalogs;
}

/** Union of one domain's catalog pages; fails when the union does not match the totals. */
function mergeCatalogPages(domain, pagesIn) {
  const pages = Array.isArray(pagesIn) ? pagesIn : [pagesIn];
  if (!pages.length || !pages[pages.length - 1].complete) throw new ToolFailure(`Catalog for '${domain}' is incomplete.`);
  const candidates = [];
  const excluded = [];
  for (const p of pages) {
    candidates.push(...(p.candidates || []));
    excluded.push(...(p.excludedByConfiguration || []));
  }
  const total = pages[0].totalCount;
  if (typeof total === 'number' && candidates.length !== total) throw new ToolFailure(`Catalog for '${domain}' returned ${candidates.length} of ${total} rows.`);
  const first = pages[0];
  return { domain, context: first.context, enabledLayers: first.enabledLayers, defaults: first.defaults, snapshot: first.snapshot,
    totalCount: total, excludedByConfigurationCount: first.excludedByConfigurationCount, candidates, excludedByConfiguration: excluded, complete: true };
}

/** Validate one findings-report with BCQuality's validator. Returns {ok, error, codes}. */
function validateReport(bcq, args, workDir) {
  const r = runPwsh(`
$p = @{ ReportPath = $a.reportPath; SkillKind = $a.skillKind; SourceRoot = $a.sourceRoot; BCQualityRoot = $a.root }
$p.SourcePaths = ${arr('sourcePaths')}
$p.RetrievedArticlePaths = ${arr('retrieved')}
if ($a.expectedCompositionPath) { $p.ExpectedCompositionPath = $a.expectedCompositionPath }
try { $null = & (Join-Path $a.root 'tools/Validate-FindingsReport.ps1') @p; '{"ok":true}' }
catch { [pscustomobject]@{ ok = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress }`,
  { root: bcq, ...args }, workDir);
  const line = r.stdout.trim().split(/\r?\n/).pop() || '';
  let res;
  try { res = JSON.parse(line); } catch { throw new ToolFailure(`Validator did not run: ${r.stderr || r.stdout}`); }
  return { ok: !!res.ok, error: res.error || null, codes: res.ok ? [] : validatorCodes(res.error || '') };
}

/** Error codes in a Validate-FindingsReport failure message ("CODE at path: msg; ..."). */
function validatorCodes(message) {
  const codes = String(message).match(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+(?= at )/g) || [];
  if (!codes.length && /schema|JSON/i.test(message)) return ['SCHEMA'];
  return codes;
}

// ---------------------------------------------------------------- leaf transport

/** Extract the findings-report JSON from a model's final message (transport only, no repair). */
function extractJson(text) {
  const t = String(text == null ? '' : text).trim();
  const tryParse = (s) => { try { const v = JSON.parse(s); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };
  let v = tryParse(t);
  if (v) return { value: v, text: t, method: 'exact' };
  const fences = [...t.matchAll(/```(?:json)?\s*\n([\s\S]*?)\n```/g)];
  if (fences.length === 1 && (v = tryParse(fences[0][1].trim()))) return { value: v, text: fences[0][1].trim(), method: 'fenced' };
  const i = t.indexOf('{');
  const j = t.lastIndexOf('}');
  if (i >= 0 && j > i && (v = tryParse(t.slice(i, j + 1)))) return { value: v, text: t.slice(i, j + 1), method: 'embedded' };
  return null;
}

/**
 * DO's bounded pre-gate normalization: remove `location.range` from findings whose range start
 * differs from `line`, only when every such finding is eligible. Returns null when not eligible
 * or nothing to do. The caller must re-validate the candidate in full.
 */
function normalizeRanges(report) {
  const candidate = JSON.parse(JSON.stringify(report));
  const removed = [];
  const posInt = (n) => Number.isInteger(n) && n > 0;
  for (const f of candidate.findings || []) {
    const loc = f && f.location;
    if (!loc || !loc.range || loc.range['start-line'] === loc.line) continue;
    const s = loc.range['start-line'];
    const e = loc.range['end-line'];
    if (!posInt(loc.line) || !posInt(s) || !posInt(e) || !(s <= loc.line && loc.line <= e) || Object.prototype.hasOwnProperty.call(f, 'suggested-code')) return null;
    removed.push({ findingId: f.id, file: loc.file, line: loc.line, startLine: s, endLine: e });
    delete loc.range;
  }
  return removed.length ? { candidate, removed } : null;
}

/** Knowledge articles a leaf opened in full: successful Read calls without offset/limit under the BCQuality root. */
function retrievedArticles(events, bcqRoot) {
  const rootNorm = path.resolve(bcqRoot).toLowerCase();
  const reads = new Map();
  const failed = new Set();
  for (const ev of events) {
    const content = ev && ev.message && Array.isArray(ev.message.content) ? ev.message.content : [];
    for (const c of content) {
      if (ev.type === 'assistant' && c.type === 'tool_use' && c.name === 'Read' && c.input && c.input.file_path) {
        const partial = (c.input.offset != null && Number(c.input.offset) > 1) || c.input.limit != null || c.input.pages != null;
        if (!partial) reads.set(c.id, c.input.file_path);
      }
      if (ev.type === 'user' && c.type === 'tool_result') {
        const body = Array.isArray(c.content) ? c.content.map((x) => x.text || '').join('') : String(c.content || '');
        if (c.is_error || /<tool_use_error>/.test(body) || /exceeds maximum allowed|File content \(.*\) exceeds/.test(body)) failed.add(c.tool_use_id);
      }
    }
  }
  const out = new Set();
  for (const [id, fp] of reads) {
    if (failed.has(id)) continue;
    const abs = path.resolve(fp);
    if (!abs.toLowerCase().startsWith(rootNorm + path.sep.toLowerCase()) && !abs.toLowerCase().startsWith(rootNorm + '/')) continue;
    const rel = toPosix(abs.slice(rootNorm.length + 1));
    if (/^(microsoft|community|custom)\/knowledge\/.+\.md$/.test(rel)) out.add(rel);
  }
  return [...out].sort();
}

/**
 * Host evidence rule: a leaf evaluates a worklist item by reading that article in full (READ
 * "Read an article's full file only after it makes the worklist"), so it cannot claim more
 * evaluated items than articles it opened in full. Returns an error message or null.
 */
function coverageEvidenceError(report, retrieved) {
  const n = report && report.summary && report.summary.coverage ? report.summary.coverage['items-evaluated'] : 0;
  return n > retrieved.length ? `report claims ${n} evaluated worklist item(s) but the leaf opened only ${retrieved.length} knowledge article(s) in full` : null;
}

/** Host-created failed validation result for a leaf (no findings). */
function failedLeafResult(id, version, reason) {
  return {
    skill: { id, version },
    outcome: 'failed',
    'outcome-reason': String(reason).replace(/\s+/g, ' ').slice(0, 600),
    summary: { counts: { blocker: 0, major: 0, minor: 0, info: 0 }, coverage: { 'worklist-size': 0, 'items-evaluated': 0 } },
    findings: [],
    suppressed: [],
  };
}

// ---------------------------------------------------------------- composition

const has = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const endLine = (f) => (f.location.range ? f.location.range['end-line'] : f.location.line);

function locationsOverlap(a, b) {
  if (!has(a, 'location') || !has(b, 'location')) return false;
  if (a.location.file !== b.location.file) return false;
  return a.location.line <= endLine(b) && b.location.line <= endLine(a);
}

function sameCorrection(a, b) {
  if (has(a, 'suggested-code') || has(b, 'suggested-code')) return has(a, 'suggested-code') && has(b, 'suggested-code') && a['suggested-code'] === b['suggested-code'];
  return a.message === b.message;
}

const refKey = (r) => `${r.path}\u0000${has(r, 'sha') ? r.sha : ''}`;
const refDomain = (r) => ((r && r.path) || '').split('/')[2] || '';

/** al-code-review "Outcome rollup" (DO): outcome from selected leaves and returned sub-results. */
function deriveSuperOutcome(subResults, missingCount = 0) {
  const outcomes = subResults.map((s) => s.outcome);
  const nonFailed = outcomes.filter((o) => o !== 'failed').length;
  if (missingCount > 0) return nonFailed ? 'partial' : 'failed';
  if (!outcomes.length) return 'not-applicable';
  if (!nonFailed) return 'failed';
  if (outcomes.includes('partial') || (outcomes.includes('failed') && nonFailed)) return 'partial';
  if (outcomes.every((o) => o === 'not-applicable')) return 'not-applicable';
  if (outcomes.includes('no-knowledge') && outcomes.every((o) => o === 'no-knowledge' || o === 'not-applicable')) return 'no-knowledge';
  return 'completed';
}

/**
 * Compose the super-skill report per al-code-review.md "Roll up sub-skill findings" and
 * "Summary and rollup". `selected` is the ordered expected selection; `accepted` maps leaf id to
 * its accepted (or host-failed) report; ids without an entry are missing (never invoked).
 * `leafDomainsById` maps leaf id to its knowledge domains (ownership specificity on merge).
 */
function composeSuperReport({ superSkill, selected, skipped, accepted, agentFindings = [], leafDomainsById = {} }) {
  const subResults = [];
  const missing = [];
  for (const s of selected) {
    if (accepted[s.id]) subResults.push(accepted[s.id]);
    else missing.push(s.id);
  }
  const rolled = [];
  const owners = [];
  for (const sub of subResults) {
    if (sub.outcome === 'failed') continue;
    const leafId = sub.skill.id;
    for (const f of sub.findings || []) {
      const top = { ...f, 'from-sub-skill': leafId };
      if (!(f.references || []).length) top.id = `${leafId}:${f.id}`;
      const knowledge = (f.references || []).length > 0;
      const dup = knowledge ? rolled.findIndex((r) => (r.references || []).length > 0 && locationsOverlap(r, top) && sameCorrection(r, top)) : -1;
      if (dup < 0) { rolled.push(top); owners.push(leafId); continue; }
      const existing = rolled[dup];
      const specific = (finding, id) => (leafDomainsById[id] || []).includes(refDomain(finding.references[0]));
      const newOwns = specific(top, leafId) && !specific(existing, owners[dup]);
      const owner = newOwns ? top : existing;
      const other = newOwns ? existing : top;
      const refs = [...owner.references];
      const seen = new Set(refs.map(refKey));
      for (const r of other.references) if (!seen.has(refKey(r))) { refs.push(r); seen.add(refKey(r)); }
      const merged = { ...owner, references: refs };
      if (SEV_RANK[other.severity] > SEV_RANK[merged.severity]) merged.severity = other.severity;
      if (CONF_RANK[other.confidence] > CONF_RANK[merged.confidence]) merged.confidence = other.confidence;
      rolled[dup] = merged;
      owners[dup] = newOwns ? leafId : owners[dup];
    }
  }
  const findings = missing.length ? rolled : [...rolled, ...agentFindings];
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s).length]));
  const coverage = { 'worklist-size': 0, 'items-evaluated': 0 };
  for (const s of subResults) {
    if (s.outcome === 'failed') continue;
    coverage['worklist-size'] += s.summary.coverage['worklist-size'];
    coverage['items-evaluated'] += s.summary.coverage['items-evaluated'];
  }
  const outcome = deriveSuperOutcome(subResults, missing.length);
  const report = { skill: { id: superSkill.id, version: superSkill.version }, outcome };
  if (outcome === 'partial' || outcome === 'failed' || (outcome === 'not-applicable' && !selected.length)) {
    const parts = [];
    for (const s of subResults) if (s.outcome === 'failed' || s.outcome === 'partial') parts.push(`${s.skill.id} ${s.outcome} (${s['outcome-reason'] || 'no reason'})`);
    if (missing.length) parts.push(`not invoked (budget): ${missing.join(', ')}`);
    if (!selected.length) parts.push('no sub-skill selected');
    const okCount = subResults.filter((s) => s.outcome !== 'failed' && s.outcome !== 'partial').length;
    if (okCount) parts.push(`${okCount} other sub-skill(s) returned accepted reports`);
    report['outcome-reason'] = parts.join('; ');
  }
  report.summary = { counts, coverage };
  report.findings = findings;
  report.suppressed = [];
  report['sub-results'] = subResults;
  if (skipped.length) report['skipped-sub-skills'] = skipped.map((s) => ({ skill: { id: s.id, version: s.version }, reason: s.reason }));
  return { report, missing };
}

/** Structural gate for the self-review's agent findings (DO "Agent findings", al-code-review self-review rules). */
function checkAgentFindings(findings, scope) {
  const errors = [];
  if (!Array.isArray(findings)) return ['agent-findings is not an array'];
  findings.forEach((f, i) => {
    const at = `agent-findings[${i}]`;
    if (!f || typeof f !== 'object') { errors.push(`${at} is not an object`); return; }
    if (f['from-sub-skill'] !== 'agent') errors.push(`${at}.from-sub-skill must be "agent"`);
    if (f.domain !== 'Agent') errors.push(`${at}.domain must be "Agent"`);
    if (!Array.isArray(f.references) || f.references.length) errors.push(`${at}.references must be []`);
    if (!/^agent:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(f.id))) errors.push(`${at}.id must be an agent: slug`);
    if (!['minor', 'info'].includes(f.severity)) errors.push(`${at}.severity must be minor or info`);
    if (!['medium', 'low'].includes(f.confidence)) errors.push(`${at}.confidence must be medium or low`);
    if (typeof f.message !== 'string' || !f.message.trim()) errors.push(`${at}.message must be non-empty`);
    if (has(f, 'location')) {
      const l = f.location;
      const n = scope[l && l.file];
      if (n == null) errors.push(`${at}.location.file is outside the source scope`);
      else if (!Number.isInteger(l.line) || l.line < 1 || l.line > n) errors.push(`${at}.location.line is not a line of ${l.file}`);
      if (l && l.range && (l.range['start-line'] !== l.line || !(l.range['end-line'] >= l.line) || l.range['end-line'] > n)) errors.push(`${at}.location.range is invalid`);
    }
  });
  return errors;
}

/** Verdict rules: certified only for a complete, validated, non-partial composition with a performed self-review. */
function decideVerdict({ report, validator, leaves, missing, selfReview }) {
  const reasons = [];
  if (!validator || !validator.ok) reasons.push(`super report failed Validate-FindingsReport.ps1 -SkillKind super: ${validator ? validator.error : 'not run'}`);
  if (report.outcome === 'partial' || report.outcome === 'failed') reasons.push(`super outcome is '${report.outcome}'`);
  const failed = leaves.filter((l) => l.outcome === 'failed' || l.hostFailed);
  if (failed.length) reasons.push(`failed leaf/leaves: ${failed.map((l) => l.id).join(', ')}`);
  const partial = leaves.filter((l) => l.outcome === 'partial');
  if (partial.length) reasons.push(`partial leaf/leaves: ${partial.map((l) => l.id).join(', ')}`);
  if (missing && missing.length) reasons.push(`leaves not invoked: ${missing.join(', ')}`);
  if (!selfReview || selfReview.status !== 'performed') reasons.push(`agent self-review pass not performed (${selfReview ? selfReview.status + (selfReview.reason ? ': ' + selfReview.reason : '') : 'missing'})`);
  return { verdict: reasons.length ? 'not-certified' : 'certified', reasons };
}

// ---------------------------------------------------------------- prompts

function readText(p) { return fs.readFileSync(p, 'utf8').replace(/^﻿/, ''); }

/** DO without the sections a leaf findings-report does not use. */
function doForLeaf(doText) {
  const cut = (text, from, to) => {
    const i = text.indexOf(from);
    const j = to ? text.indexOf(to, i + 1) : -1;
    if (i < 0) return text;
    return text.slice(0, i) + (j > i ? text.slice(j) : '');
  };
  return cut(doText, '\n## Development-guidance-report contract', '\n## Worked example');
}

function sourceBlock(project, sourcePaths) {
  return sourcePaths.map((p) => {
    const lines = splitLines(readText(path.join(project, p)));
    const w = String(lines.length).length;
    return `--- BEGIN SOURCE ${p} (${lines.length} lines) ---\n${lines.map((l, i) => `${String(i + 1).padStart(w)}| ${l}`).join('\n')}\n--- END SOURCE ${p} ---`;
  }).join('\n\n');
}

function sharedPreamble(contracts) {
  return [
    'You are a BCQuality worker executing one isolated step of a host-orchestrated al-code-review. The host (a deterministic program, not a model) owns dispatch, the acceptance gate, rollup and validation. Follow the BCQuality contracts below exactly; they are authoritative.',
    '',
    '=== BEGIN CONTRACT skills/read.md (READ) ===', contracts.read, '=== END CONTRACT skills/read.md ===',
    '',
    '=== BEGIN CONTRACT skills/do.md (DO; the development-guidance-report, knowledge-response and composition sections are omitted because this step does not produce them) ===',
    contracts.doLeaf, '=== END CONTRACT skills/do.md ===',
  ].join('\n');
}

function leafPrompt({ contracts, leaf, leafText, catalogs, ctx, project, bcq, sourcePaths, sources, retryNote }) {
  const bcqFs = toPosix(bcq);
  return [
    sharedPreamble(contracts),
    '',
    `=== BEGIN LEAF SKILL ${leaf.path} (id ${leaf.id}, version ${leaf.version}) ===`, leafText, '=== END LEAF SKILL ===',
    '',
    '=== TASK ===',
    `Execute exactly ONE leaf: \`${leaf.id}\` (version ${leaf.version}). Apply its Source -> Relevance -> Worklist -> Action steps to the input below and return its complete findings-report. You are one of several isolated leaf invocations dispatched by the host for the super-skill al-code-review (BCQuality al-code-review "Execution discipline"). Do not perform other leaves' domains and do not compose a rollup.`,
    '',
    'Task context supplied by the host:',
    `- Input kind: \`${INPUT_KIND}\`. The review scope is exactly these repo-relative source paths (project root: ${toPosix(project)}): ${sourcePaths.map((p) => '`' + p + '`').join(', ')}.`,
    `- technologies: [al]. bc-version: ${ctx.bcVersion ? ctx.bcVersion + ' (from app.json `application`)' : 'unknown'}. countries: ${ctx.countries ? JSON.stringify(ctx.countries) : 'not declared by the orchestrator'}. application-area: derive it from the changed objects per your Relevance step, otherwise unknown.`,
    `- enabled-layers: ${JSON.stringify(ctx.layers.length ? ctx.layers : ['microsoft', 'community', 'custom'])}. Orchestrator configuration permits conditionally applicable files (with READ's confidence and message rules).`,
    `- app.json files: ${ctx.appJsons.length ? ctx.appJsons.map((p) => '`' + p + '`').join(', ') : 'none found'}.`,
    '',
    'Host constraints for this invocation (they implement READ and DO in this context; they do not relax them):',
    `1. Catalog: the host already ran READ's bounded catalog retrieval (tools/Search-Knowledge.ps1 with -Technologies al${ctx.bcVersion ? ' -BCVersion ' + ctx.bcVersion : ''}, every page consumed until \`complete\` is true) for your domain(s). The complete catalog is below. It is your catalog snapshot: apply your Relevance and Worklist to it and copy every cited path verbatim from it. PowerShell helpers are not available to you.`,
    `2. Article bodies: open each worklisted article with the Read tool at \`${bcqFs}/<exact catalog path>\`, with no offset and no limit, so the whole file is read through EOF (READ's native bounded read). Only articles you opened that way count as retrieved; the host records them from your tool calls and the acceptance gate rejects any reference you did not open in full. Read a sibling .good.al/.bad.al sample only when your leaf asks for it.`,
    '3. Sources: the final-file snapshot of every in-scope source file is embedded below with 1-based line numbers (the `N| ` prefix is not part of the file). You may Read the same files under the project root. Every `location.file` MUST be one of the in-scope paths exactly as written above; `line` and any range MUST be final-file line numbers; when a range is present, `start-line` MUST equal `line`.',
    "4. Do not read the project's `.claude` folder or anything outside the in-scope sources, app.json files and the BCQuality root. You cannot and must not write files.",
    `5. Your final message MUST be exactly one strict JSON findings-report whose \`skill\` is {"id": "${leaf.id}", "version": ${leaf.version}} and nothing else: no prose, no markdown fences. It is a leaf report: no \`sub-results\`, no \`skipped-sub-skills\`, no \`from-sub-skill\`. \`skill\`, \`outcome\`, \`summary\` (counts and coverage), \`findings\` and \`suppressed\` are required for every outcome, including \`not-applicable\` and \`no-knowledge\` (use empty arrays). Every finding sets \`domain\` to the label your leaf's Output section requires. Apply DO's producer pre-emission checklist and reference-integrity gate before answering. The host validates it with tools/Validate-FindingsReport.ps1 -SkillKind leaf against the scope above and the set of articles you opened in full; any defect discards the whole report.`,
    retryNote ? `\nA previous attempt for this leaf was rejected by the host's acceptance gate with: ${retryNote}\nProduce a fresh, complete report that passes the gate. Do not salvage the previous answer.` : '',
    '',
    '=== BEGIN CATALOG (host-retrieved, complete) ===',
    JSON.stringify(Object.values(catalogs), null, 0),
    '=== END CATALOG ===',
    '',
    sources,
  ].join('\n');
}

function selfReviewPrompt({ contracts, superText, project, bcq, sourcePaths, sources, accepted, retrieved, retryNote }) {
  const section = (text, from, to) => {
    const i = text.indexOf(from); const j = text.indexOf(to, i + 1);
    return i < 0 ? '' : text.slice(i, j > i ? j : undefined).trim();
  };
  const selfReview = section(superText, '### Agent self-review pass', '### Suggested-code guidance');
  const suggested = section(superText, '### Suggested-code guidance', '### Summary and rollup');
  return [
    sharedPreamble(contracts),
    '',
    `=== BEGIN EXCERPT ${SUPER_SKILL_PATH} ===`, selfReview, '', suggested, '=== END EXCERPT ===',
    '',
    '=== TASK ===',
    'Perform ONLY the al-code-review super-skill "Agent self-review pass" (its own final iteration). Every selected leaf has already run in its own isolated context; the host accepted their findings-reports (below, in declared order) and composes the rollup itself. Reason over the cross-cutting concerns and the seams between leaf domains. Emitting zero agent findings is valid when no candidate clears DO\'s precision bar; never pad.',
    `Scope: these repo-relative source paths under ${toPosix(project)}: ${sourcePaths.map((p) => '`' + p + '`').join(', ')} (embedded below with 1-based line numbers; the \`N| \` prefix is not part of the file).`,
    `Knowledge the leaves loaded (opened in full): ${retrieved.length ? retrieved.map((p) => '`' + p + '`').join(', ') : 'none'}. You may Read any of them at \`${toPosix(bcq)}/<path>\` to validate a candidate.`,
    'Host rules for this step:',
    '1. A candidate already covered by a leaf finding at the same location: drop it (no duplicate).',
    '2. A candidate a loaded knowledge file explicitly contradicts: suppress it.',
    '3. A candidate a loaded knowledge file matches but no leaf finding covers: the host cannot add knowledge-backed findings that no leaf produced (the composed report is validated leaf-by-leaf), so do NOT emit it as a finding; list it under `knowledge-matched-candidates` for the human.',
    '4. Otherwise emit it as a super-skill agent finding: `from-sub-skill` "agent", `domain` "Agent", `references` [], `id` "agent:<kebab-slug>", `confidence` medium or low, `severity` minor or info, self-contained `message`, `location` on in-scope final-file lines (range start-line equals line), `suggested-code` or `suggested-code-omission-reason` per the guidance.',
    'Do not read the project\'s `.claude` folder. You cannot write files.',
    'Your final message MUST be exactly one strict JSON object and nothing else (no prose, no fences):',
    '{"agent-findings": [ ...findings... ], "knowledge-matched-candidates": [ {"path": "<knowledge path>", "file": "<source path>", "line": 1, "note": "..."} ], "cross-cutting-concerns-reviewed": ["short phrase", ...]}',
    retryNote ? `\nA previous attempt was rejected by the host's gate with: ${retryNote}\nProduce a fresh answer.` : '',
    '',
    '=== BEGIN ACCEPTED LEAF REPORTS (declared order) ===',
    JSON.stringify(accepted),
    '=== END ACCEPTED LEAF REPORTS ===',
    '',
    sources,
  ].join('\n');
}

// ---------------------------------------------------------------- neutral claude -p

function neutralSettings(project) {
  const home = os.homedir();
  const installed = (() => { try { return JSON.parse(fs.readFileSync(path.join(home, '.claude', 'plugins', 'installed_plugins.json'), 'utf8')); } catch { return {}; } })();
  const enabledPlugins = {};
  for (const k of Object.keys(installed.plugins || installed)) if (k.includes('@')) enabledPlugins[k] = false;
  const excludes = new Set([toPosix(path.join(home, '.claude', 'CLAUDE.md'))]);
  for (let d = project; ; d = path.dirname(d)) {
    for (const n of ['CLAUDE.md', 'CLAUDE.local.md', path.join('.claude', 'CLAUDE.md')]) excludes.add(toPosix(path.join(d, n)));
    if (path.dirname(d) === d) break;
  }
  return { enabledPlugins, autoMemoryEnabled: false, claudeMdExcludes: [...excludes] };
}

const ruleAbs = (p) => { const s = toPosix(path.resolve(p)); return /^[A-Za-z]:\//.test(s) ? '//' + s[0].toLowerCase() + s.slice(2) : s; };

function claudeArgs({ model, budget, project, bcq }) {
  return [
    '-p', '--model', model, '--output-format', 'stream-json', '--verbose', '--max-budget-usd', String(budget),
    '--setting-sources', 'project,local', '--settings', JSON.stringify(neutralSettings(project)),
    '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
    '--plugin-dir', bcq, '--add-dir', bcq,
    '--tools', 'Read,Grep,Glob', '--allowedTools', 'Read', 'Grep', 'Glob',
    '--disallowedTools', `Read(${ruleAbs(path.join(project, '.claude'))}/**)`, 'Write', 'Edit', 'Bash', 'PowerShell', 'Agent', 'Task', 'Skill', 'WebFetch', 'WebSearch',
    '--no-session-persistence',
  ];
}

function writeImmutable(file, data) {
  fs.writeFileSync(file, data, { flag: 'wx' });
  try { fs.chmodSync(file, 0o444); } catch { /* best effort */ }
}

/** One neutral `claude -p` call; raw stream saved immutably in `dir`. */
function runClaude({ dir, prompt, model, budget, project, bcq }) {
  fs.mkdirSync(dir, { recursive: true });
  writeImmutable(path.join(dir, 'prompt.txt'), prompt);
  const started = Date.now();
  return new Promise((resolve) => {
    const env = { ...process.env, ENABLE_CLAUDEAI_MCP_SERVERS: 'false' };
    delete env.CLAUDECODE;
    const child = spawn('claude', claudeArgs({ model, budget, project, bcq }), { cwd: project, env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    const out = [];
    const err = [];
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, LEAF_TIMEOUT_MS);
    child.stdout.on('data', (d) => out.push(d));
    child.stderr.on('data', (d) => err.push(d));
    child.on('error', (e) => err.push(Buffer.from(String(e))));
    child.on('close', (code) => {
      clearTimeout(timer);
      const stdout = Buffer.concat(out).toString('utf8');
      const stderr = Buffer.concat(err).toString('utf8');
      writeImmutable(path.join(dir, 'raw.jsonl'), stdout);
      writeImmutable(path.join(dir, 'stderr.txt'), stderr);
      const events = stdout.split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      const result = [...events].reverse().find((e) => e.type === 'result') || null;
      const text = result && typeof result.result === 'string' ? result.result : '';
      writeImmutable(path.join(dir, 'raw-return.txt'), text);
      resolve({ code, timedOut, events, result, text, cost: (result && result.total_cost_usd) || 0, seconds: Math.round((Date.now() - started) / 100) / 10, stderr });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(prompt);
  });
}

// ---------------------------------------------------------------- orchestration

function timestamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function envList(name) { return (process.env[name] || '').split(',').map((s) => s.trim()).filter(Boolean); }

/** Task context the host can determine reliably: BC version only when every app.json agrees. */
function taskContext(project) {
  const appJsons = [];
  const visit = (dir, depth) => {
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.') || ['node_modules', 'bin', 'obj', 'output'].includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isFile() && e.name.toLowerCase() === 'app.json') appJsons.push(toPosix(path.relative(project, full)));
      else if (e.isDirectory() && depth < 2) visit(full, depth + 1);
    }
  };
  visit(project, 0);
  const majors = new Set();
  for (const p of appJsons) {
    try { const m = /^(\d+)\./.exec(JSON.parse(readText(path.join(project, p))).application || ''); majors.add(m ? Number(m[1]) : null); } catch { majors.add(null); }
  }
  const bcVersion = majors.size === 1 ? [...majors][0] || null : null;
  return { appJsons: appJsons.sort(), bcVersion, countries: null, layers: envList('BCQUALITY_ENABLED_LAYERS'), disabled: envList('BCQUALITY_DISABLED_SKILLS') };
}

async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; results[i] = await fn(items[i], i); }
  });
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------- detach / wait
// A full review can outlast one shell call (Claude Code caps a Bash call at 10 min). The Conductor starts
// it with --detach and polls with --wait <seconds> until a verdict appears; the run itself is unchanged.

const jobFile = (opts) => path.join(opts.out, 'certified-current.json');

function detach(opts, argv) {
  fs.mkdirSync(opts.out, { recursive: true });
  const prior = readJsonFile(jobFile(opts));
  if (prior && prior.status === 'running' && pidAlive(prior.pid)) {
    console.log(`certified-review: already running (pid ${prior.pid}, started ${prior.started}); poll with --wait.`);
    return 0;
  }
  const log = path.join(opts.out, `certified-${timestamp()}.log`);
  const fd = fs.openSync(log, 'a');
  const child = spawn(process.execPath, [__filename, ...argv.filter((a) => a !== '--detach')],
    { cwd: opts.project, detached: true, stdio: ['ignore', fd, fd], windowsHide: true });
  child.unref();
  fs.writeFileSync(jobFile(opts), JSON.stringify({ status: 'running', pid: child.pid, started: new Date().toISOString(), log }, null, 2));
  console.log(`certified-review: started (pid ${child.pid}); log ${log}. Poll with --wait 540 until it prints a verdict.`);
  return 0;
}

function pidAlive(pid) { try { process.kill(pid, 0); return true; } catch { return false; } }
function readJsonFile(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

/** Newest verdict written after the detached job started, if any. */
function latestVerdict(opts, since) {
  let names = []; try { names = fs.readdirSync(opts.out); } catch { return null; }
  const v = names.filter((n) => /^bcquality-certified-.*\.verdict\.json$/.test(n)).map((n) => path.join(opts.out, n))
    .filter((p) => fs.statSync(p).mtimeMs >= since).sort().pop();
  return v ? { file: v, data: readJsonFile(v) } : null;
}

async function waitFor(opts) {
  const job = readJsonFile(jobFile(opts));
  if (!job) { console.error('certified-review: no detached review to wait for; start one with --detach.'); return 3; }
  const since = Date.parse(job.started) - 1000;
  const deadline = Date.now() + opts.wait * 1000;
  for (;;) {
    const v = latestVerdict(opts, since);
    if (v && v.data) {
      fs.writeFileSync(jobFile(opts), JSON.stringify({ ...job, status: 'done', verdict: v.data.verdict, file: v.file }, null, 2));
      console.log(`certified-review: ${v.data.verdict} — ${v.file}${(v.data.reasons || []).length ? ' — ' + v.data.reasons.join('; ') : ''}`);
      return v.data.verdict === 'certified' ? 0 : 1;
    }
    if (!pidAlive(job.pid)) {
      fs.writeFileSync(jobFile(opts), JSON.stringify({ ...job, status: 'failed' }, null, 2));
      console.error(`certified-review: the detached run ended without a verdict (tool failure); see ${job.log}.`);
      return 3;
    }
    if (Date.now() >= deadline) { console.log(`certified-review: still running (pid ${job.pid}, since ${job.started}); call --wait again.`); return 2; }
    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function main(argv) {
  let opts;
  try { opts = parseArgs(argv); } catch (e) { console.error(`certified-review: ${e.message}`); return 3; }
  if (opts.help) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(13, 22).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); return 0; }
  if (opts.detach) return detach(opts, argv);
  if (opts.wait !== undefined) return waitFor(opts);

  // 1. BCQuality root and pwsh.
  if (runtime.bcqualityDisabled(opts.project)) { console.error('certified-review: BCQuality is disabled for this project (aldc.yaml external.bcquality.enabled false).'); return 3; }
  const bcq = runtime.bcqualityRoot();
  if (!bcq || !fs.existsSync(path.join(bcq, 'tools', 'Validate-FindingsReport.ps1'))) { console.error('certified-review: BCQuality plugin not found (install bcquality or set BCQUALITY_HOME).'); return 3; }
  const ps = pwshAvailable();
  if (!ps) { console.error('certified-review: pwsh (PowerShell 7.5+) is required by BCQuality tools and was not found.'); return 3; }
  const prov = runtime.bcqualityProvenance(bcq);

  // 2. Source paths.
  let src;
  try { src = resolveSourcePaths(opts); } catch (e) { console.error(`certified-review: ${e.message}`); return 3; }
  if (src.problems.length) { console.error(`certified-review: invalid source paths: ${src.problems.join('; ')}`); return 3; }
  if (!src.paths.length) { console.error('certified-review: no AL source paths to review.'); return 3; }
  const sourcePaths = src.paths;
  const lineCounts = Object.fromEntries(sourcePaths.map((p) => [p, splitLines(readText(path.join(opts.project, p))).length]));

  // 3. Indexes, worklist, expected composition, catalogs.
  const ts = timestamp();
  const runRoot = path.join(opts.out, `certified-${ts}`);
  const hostDir = path.join(runRoot, '_host');
  const tmpHost = opts.dryRun ? fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-certified-')) : hostDir;
  fs.mkdirSync(tmpHost, { recursive: true });
  const ctx = taskContext(opts.project);
  let indexes, worklist, expected, catalogs, skillRows;
  try {
    indexes = buildIndexes(bcq, tmpHost);
    skillRows = JSON.parse(readText(indexes.skillIndex)).skills;
    worklist = resolveWorklist(bcq, indexes.skillIndex, ctx.layers, ctx.disabled, tmpHost);
    expected = buildExpectedComposition(worklist, skillRows);
  } catch (e) { console.error(`certified-review: ${e.message}`); return 3; }
  const leaves = expected.subSkills.map((s) => {
    const text = readText(path.join(bcq, s.path));
    return { ...s, text, domains: leafDomains(text) };
  });
  const allDomains = [...new Set(leaves.flatMap((l) => l.domains))];

  const plan = {
    project: opts.project, bcquality: { root: bcq, version: prov.version, pwsh: ps }, sourcePaths, base: opts.paths ? null : opts.base,
    taskContext: { bcVersion: ctx.bcVersion, appJsons: ctx.appJsons, enabledLayers: ctx.layers, disabledSkills: ctx.disabled },
    leaves: leaves.map((l) => ({ id: l.id, version: l.version, path: l.path, domains: l.domains })), skipped: expected.skipped,
    budget: { perCall: opts.budgetPerLeaf, maxTotalUsd: opts.maxTotalUsd, concurrency: opts.concurrency, model: opts.model,
      upperBoundUsd: Math.round((leaves.length + 1) * opts.budgetPerLeaf * 100) / 100,
      upperBoundWithRetriesUsd: Math.round((leaves.length * 2 + 2) * opts.budgetPerLeaf * 100) / 100 },
  };
  if (opts.dryRun) {
    console.log(JSON.stringify(plan, null, 2));
    console.log(`dry-run: ${sourcePaths.length} source file(s), ${leaves.length} leaf/leaves + 1 self-review call; worst case ${plan.budget.upperBoundUsd} USD without retries, ${plan.budget.upperBoundWithRetriesUsd} USD with one retry each (cap ${opts.maxTotalUsd} USD). Nothing launched.`);
    try { fs.rmSync(tmpHost, { recursive: true, force: true }); } catch { /* ignore */ }
    return 0;
  }

  try { catalogs = fetchCatalogs(bcq, indexes.knowledgeIndex, allDomains, ctx.layers, ctx, hostDir); } catch (e) { console.error(`certified-review: ${e.message}`); return 3; }
  const expectedPath = path.join(hostDir, 'expected-composition.json');
  const acceptedDir = path.join(hostDir, 'accepted');
  fs.mkdirSync(acceptedDir, { recursive: true });
  const writeExpected = () => fs.writeFileSync(expectedPath, JSON.stringify(expected, null, 2));
  writeExpected();
  fs.writeFileSync(path.join(hostDir, 'plan.json'), JSON.stringify(plan, null, 2));

  const contracts = { read: readText(path.join(bcq, 'skills', 'read.md')), doLeaf: doForLeaf(readText(path.join(bcq, 'skills', 'do.md'))) };
  const sources = sourceBlock(opts.project, sourcePaths);

  // 4-5. Leaves with budget accounting and the acceptance gate.
  let spent = 0;
  let reserved = 0;
  let budgetStop = false;
  const reserve = () => {
    if (budgetStop || spent + reserved + opts.budgetPerLeaf > opts.maxTotalUsd + 1e-9) { budgetStop = true; return false; }
    reserved += opts.budgetPerLeaf; return true;
  };
  const release = (cost) => { reserved -= opts.budgetPerLeaf; spent += cost; };
  const accepted = {};
  const leafRecords = [];
  const retrievedUnion = new Set();

  const runLeaf = async (leaf) => {
    const rec = { id: leaf.id, version: leaf.version, outcome: null, attempts: 0, cost_usd: 0, seconds: 0, attemptsDetail: [] };
    const leafDir = path.join(runRoot, leaf.id);
    let retryNote = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (!reserve()) { rec.notInvoked = rec.attempts === 0; break; }
      rec.attempts = attempt;
      const dir = path.join(leafDir, `attempt-${attempt}-${crypto.randomUUID()}`);
      const prompt = leafPrompt({ contracts, leaf, leafText: leaf.text, catalogs: Object.fromEntries(leaf.domains.map((d) => [d, catalogs[d]])), ctx, project: opts.project, bcq, sourcePaths, sources, retryNote });
      const run = await runClaude({ dir, prompt, model: opts.model, budget: opts.budgetPerLeaf, project: opts.project, bcq });
      release(run.cost);
      rec.cost_usd += run.cost; rec.seconds = Math.round((rec.seconds + run.seconds) * 10) / 10;
      const detail = { attempt, dir: toPosix(path.relative(runRoot, dir)), exit: run.code, subtype: run.result && run.result.subtype, cost_usd: run.cost, seconds: run.seconds };
      rec.attemptsDetail.push(detail);
      const retrieved = retrievedArticles(run.events, bcq);
      detail.retrieved = retrieved;
      let gate = null;
      if (!run.result || run.result.subtype !== 'success' || run.timedOut) gate = { ok: false, error: `claude -p did not finish successfully (${run.timedOut ? 'timeout' : (run.result && run.result.subtype) || 'no result, exit ' + run.code})` };
      const ext = gate ? null : extractJson(run.text);
      if (!gate && !ext) gate = { ok: false, error: 'final message is not a JSON object' };
      let acceptedText = null;
      if (!gate) {
        detail.extraction = ext.method;
        const candPath = path.join(dir, 'candidate.json');
        writeImmutable(candPath, ext.text);
        const vargs = { reportPath: candPath, skillKind: 'leaf', sourceRoot: opts.project, sourcePaths, retrieved };
        let v = validateReport(bcq, vargs, dir);
        acceptedText = v.ok ? ext.text : null;
        if (!v.ok && v.codes.length && v.codes.every((c) => c === 'RANGE_START_MISMATCH')) {
          const norm = normalizeRanges(ext.value);
          if (norm) {
            const normPath = path.join(dir, 'normalized-candidate.json');
            writeImmutable(normPath, JSON.stringify(norm.candidate));
            writeImmutable(path.join(dir, 'normalization.json'), JSON.stringify({ removedRanges: norm.removed }, null, 2));
            const v2 = validateReport(bcq, { ...vargs, reportPath: normPath }, dir);
            if (v2.ok) { v = v2; acceptedText = JSON.stringify(norm.candidate); detail.normalized = norm.removed.length; }
          }
        }
        gate = v;
        if (v.ok) {
          const report = JSON.parse(acceptedText);
          const evidence = coverageEvidenceError(report, retrieved);
          if (report.skill.id !== leaf.id || report.skill.version !== leaf.version) gate = { ok: false, error: `report identity ${JSON.stringify(report.skill)} differs from the dispatched leaf` };
          else if (evidence) gate = { ok: false, error: evidence };
          else if (report.outcome === 'failed' || report.outcome === 'partial') gate = { ok: false, valid: true, error: `leaf returned outcome '${report.outcome}': ${report['outcome-reason'] || ''}`, report };
        }
      }
      detail.gate = gate.ok ? 'accepted' : gate.error;
      if (gate.ok || (gate.valid && attempt === 2)) {
        const report = gate.ok ? JSON.parse(acceptedText) : gate.report;
        accepted[leaf.id] = report;
        rec.outcome = report.outcome;
        rec.findings = report.findings.length;
        for (const r of retrieved) retrievedUnion.add(r);
        const ap = path.join(acceptedDir, `${leaf.id}.json`);
        writeImmutable(ap, gate.ok ? acceptedText : JSON.stringify(report));
        rec.acceptedPath = ap;
        return rec;
      }
      retryNote = gate.error;
    }
    if (rec.attempts > 0) {
      const report = failedLeafResult(leaf.id, leaf.version, `host acceptance gate rejected every attempt: ${retryNote}`);
      accepted[leaf.id] = report;
      rec.outcome = 'failed'; rec.hostFailed = true; rec.error = retryNote;
      const ap = path.join(acceptedDir, `${leaf.id}.json`);
      writeImmutable(ap, JSON.stringify(report));
      rec.acceptedPath = ap;
    } else rec.outcome = 'not-invoked';
    return rec;
  };

  const records = await pool(leaves, opts.concurrency, async (leaf) => {
    const r = await runLeaf(leaf);
    process.stderr.write(`[certified-review] ${leaf.id}: ${r.outcome} (attempts ${r.attempts}, ${r.cost_usd.toFixed(3)} USD, ${r.seconds}s)\n`);
    return r;
  });
  leafRecords.push(...records);
  for (const l of leaves) {
    const r = records.find((x) => x.id === l.id);
    if (r.acceptedPath) expected.acceptedResults.push({ id: l.id, version: l.version, reportPath: toPosix(path.relative(hostDir, r.acceptedPath)) });
  }
  writeExpected();

  // 6. Agent self-review pass (model work), only when every selected leaf returned and none failed.
  const missingIds = leaves.filter((l) => !accepted[l.id]).map((l) => l.id);
  const anyFailed = leafRecords.some((r) => r.outcome === 'failed' || r.outcome === 'partial');
  let selfReview = { status: 'not-performed', reason: null, cost_usd: 0, seconds: 0, attempts: 0 };
  let agentFindings = [];
  if (missingIds.length) selfReview.reason = 'forbidden while selected leaves are missing (al-code-review Execution discipline)';
  else if (anyFailed) selfReview.reason = 'skipped: a leaf failed, so the composition cannot be certified';
  else {
    const acceptedOrdered = leaves.map((l) => accepted[l.id]);
    let note = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (!reserve()) { selfReview.reason = 'total budget cap reached before the self-review'; break; }
      selfReview.attempts = attempt;
      const dir = path.join(runRoot, '_self-review', `attempt-${attempt}-${crypto.randomUUID()}`);
      const prompt = selfReviewPrompt({ contracts, superText: readText(path.join(bcq, SUPER_SKILL_PATH)), project: opts.project, bcq, sourcePaths, sources, accepted: acceptedOrdered, retrieved: [...retrievedUnion].sort(), retryNote: note });
      const run = await runClaude({ dir, prompt, model: opts.model, budget: opts.budgetPerLeaf, project: opts.project, bcq });
      release(run.cost);
      selfReview.cost_usd += run.cost; selfReview.seconds = Math.round((selfReview.seconds + run.seconds) * 10) / 10;
      if (!run.result || run.result.subtype !== 'success') { note = `claude -p did not finish successfully (${(run.result && run.result.subtype) || 'exit ' + run.code})`; continue; }
      const ext = extractJson(run.text);
      if (!ext || !Array.isArray(ext.value['agent-findings'])) { note = 'final message is not a JSON object with an agent-findings array'; continue; }
      const errors = checkAgentFindings(ext.value['agent-findings'], lineCounts);
      if (errors.length) { note = errors.join('; '); continue; }
      agentFindings = ext.value['agent-findings'];
      selfReview = { ...selfReview, status: 'performed', reason: null, dir: toPosix(path.relative(runRoot, dir)), agentFindings: agentFindings.length,
        knowledgeMatchedCandidates: ext.value['knowledge-matched-candidates'] || [], concernsReviewed: ext.value['cross-cutting-concerns-reviewed'] || [] };
      writeImmutable(path.join(hostDir, 'self-review-accepted.json'), ext.text);
      break;
    }
    if (selfReview.status !== 'performed' && !selfReview.reason) selfReview.reason = `rejected by the host gate: ${note}`;
  }

  // 6b. Compose and 7. validate as super.
  const { report, missing } = composeSuperReport({
    superSkill: expected.superSkill, selected: expected.subSkills, skipped: expected.skipped, accepted, agentFindings,
    leafDomainsById: Object.fromEntries(leaves.map((l) => [l.id, l.domains])),
  });
  fs.mkdirSync(opts.out, { recursive: true });
  const reportPath = path.join(opts.out, `bcquality-certified-${ts}.json`);
  writeImmutable(reportPath, JSON.stringify(report, null, 2));
  let validator;
  try {
    validator = validateReport(bcq, { reportPath, skillKind: 'super', sourceRoot: opts.project, sourcePaths, retrieved: [...retrievedUnion].sort(), expectedCompositionPath: expectedPath }, hostDir);
  } catch (e) { console.error(`certified-review: ${e.message}`); return 3; }

  // 8. Verdict.
  const decision = decideVerdict({ report, validator, leaves: leafRecords, missing, selfReview });
  const total = Math.round((spent) * 10000) / 10000;
  const verdict = {
    verdict: decision.verdict, reasons: decision.reasons,
    report: toPosix(reportPath), run_dir: toPosix(runRoot), outcome: report.outcome, counts: report.summary.counts, coverage: report.summary.coverage,
    leaves: leafRecords.map((r) => ({ id: r.id, outcome: r.outcome, attempts: r.attempts, cost_usd: Math.round(r.cost_usd * 10000) / 10000, seconds: Math.round(r.seconds), findings: r.findings ?? 0, error: r.error, attempts_detail: r.attemptsDetail })),
    self_review: selfReview, total_cost_usd: total, budget: plan.budget, budget_stop: budgetStop,
    bcquality_version: prov.version, bcquality_root: toPosix(bcq), model: opts.model, source_paths: sourcePaths, task_context: plan.taskContext,
    validator_output: validator.ok ? 'PASS' : `FAIL: ${validator.error}`,
    retrieved_articles: [...retrievedUnion].sort(),
  };
  const verdictPath = path.join(opts.out, `bcquality-certified-${ts}.verdict.json`);
  writeImmutable(verdictPath, JSON.stringify(verdict, null, 2));
  const c = report.summary.counts;
  console.log(`BCQuality certified review: ${decision.verdict} | outcome ${report.outcome} | ${leafRecords.filter((r) => r.outcome && !['failed', 'not-invoked'].includes(r.outcome)).length}/${leaves.length} leaves accepted | findings B${c.blocker}/M${c.major}/m${c.minor}/i${c.info} | validator ${validator.ok ? 'PASS' : 'FAIL'} | ${total.toFixed(2)} USD | ${toPosix(verdictPath)}`);
  return decision.verdict === 'certified' ? 0 : 1;
}

module.exports = {
  parseArgs, parsePathsOption, normalizeSourcePaths, gitSourcePaths, resolveSourcePaths, splitLines, parseWorklist, buildExpectedComposition,
  leafDomains, mergeCatalogPages, validatorCodes, extractJson, normalizeRanges, retrievedArticles, coverageEvidenceError, failedLeafResult, deriveSuperOutcome,
  composeSuperReport, checkAgentFindings, decideVerdict, doForLeaf, neutralSettings, claudeArgs, validateReport, pwshAvailable, ToolFailure,
};

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (e) => { console.error(`certified-review: ${e && e.stack ? e.stack : e}`); process.exitCode = 3; });
}
