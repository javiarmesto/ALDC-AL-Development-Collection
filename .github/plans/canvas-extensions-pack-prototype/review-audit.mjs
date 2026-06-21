// C5 — Review/Audit Board canvas (read + HITL triage). See ../canvas-extensions-catalog.md §2/§5.
// Backing artifact: the canonical Dredd Audit-Report JSON at .github/audits/dredd-audit-*.json
// (owner: dredd; schema per agents/dredd.agent.md Step 4 — verdict PASS|PASS_WITH_FINDINGS|FAIL,
// severity blocker|major|minor|info, findings[].location {file,line} + references[].path).
//
// TD-01 applied: Dredd's report is CI-validated and stays IMMUTABLE. Human triage decisions
// (accept / dismiss / assign) are appended to a SIDECAR <audit>.triage.json that the next agent
// (al-developer) consumes — the canvas never becomes a second source of truth.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SEVERITY_RANK = ['blocker', 'major', 'minor', 'info'];

async function latestAuditFile(auditsDir) {
  let files = [];
  try { files = await readdir(auditsDir); } catch { return null; }
  return files.filter((f) => /^dredd-audit-.*\.json$/.test(f)).sort().at(-1) ?? null;
}

const at = (f) => (f.location ? `${f.location.file}:${f.location.line}` : null);

function normalizeFinding(f) {
  return {
    id: f.id,
    severity: f.severity,
    domain: f.domain,
    source: f.source,
    at: at(f),
    message: f.message,
    fixHint: f['fix-hint'] ?? null,
    citation: f.references?.[0]?.path ?? null,
  };
}

async function loadAudit(auditsDir) {
  const file = await latestAuditFile(auditsDir);
  if (!file) return { found: false, auditsDir };
  const report = JSON.parse(await readFile(join(auditsDir, file), 'utf8'));
  return {
    found: true,
    file,
    verdict: report.audit?.verdict ?? 'UNKNOWN',
    target: report.audit?.target ?? null,
    bcqualitySha: report.audit?.bcquality?.['submodule-sha'] ?? null,
    counts: report.summary?.counts ?? {},
    findings: (report.findings ?? []).map(normalizeFinding),
  };
}

function renderBoard(audit) {
  const rank = (s) => { const i = SEVERITY_RANK.indexOf(s); return i < 0 ? 99 : i; };
  const findings = [...(audit.findings ?? [])].sort((a, b) => rank(a.severity) - rank(b.severity));
  return { verdict: audit.verdict, counts: audit.counts, bcqualitySha: audit.bcqualitySha, findings };
}

// HITL: append a triage decision to the sidecar; Dredd's JSON is never touched (TD-01).
async function appendTriage(auditsDir, auditFile, decision) {
  const sidecarName = auditFile.replace(/\.json$/, '.triage.json');
  const sidecar = join(auditsDir, sidecarName);
  let log = { audit: auditFile, decisions: [] };
  try { log = JSON.parse(await readFile(sidecar, 'utf8')); } catch { /* first decision */ }
  log.decisions.push({ ...decision, at: new Date().toISOString() });
  await writeFile(sidecar, JSON.stringify(log, null, 2) + '\n');
  return { sidecar: sidecarName, total: log.decisions.length };
}

export default function createReviewAuditCanvas(host, { auditsDir = '.github/audits' } = {}) {
  const capabilities = {
    loadAudit: () => loadAudit(auditsDir),
    renderBoard: async () => renderBoard(await loadAudit(auditsDir)),
    // decision = { findingId, action: 'accept' | 'dismiss' | 'assign', assignee?, note? }
    triageFinding: async (decision) => {
      const audit = await loadAudit(auditsDir);
      if (!audit.found) throw new Error(`No dredd audit found in ${auditsDir}`);
      return appendTriage(auditsDir, audit.file, decision);
    },
  };
  // host?.registerCapabilities?.(capabilities); // ← official registration API TBD (preview)
  return { capabilities, view: async () => renderBoard(await loadAudit(auditsDir)) };
}
