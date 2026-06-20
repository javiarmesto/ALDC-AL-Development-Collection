// ALDC Canvas Extensions — PROTOTYPE (reference spike; NOT shipped, NOT declared in aldc.yaml).
// Pilot from the study .github/plans/canvas-extensions-pack.md §4:
//   the al-conductor TDD pipeline canvas for the GitHub Copilot app.
//
// Honesty caveat: the Copilot-app canvas host API (capability registration / UI push) is in
// technical preview and not fully public. The `host` binding below follows the documented
// *concepts* (agent-callable capabilities + bidirectional shared state) and MUST be reconciled
// with the official extension.mjs surface before anything ships.
//
// Invariant (study §4): the markdown under .github/plans/ is the single source of truth.
// Every capability re-derives its view from those files; writes append to the markdown phase
// report — the canvas never becomes a second store.

import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PHASE_RE = /^##\s+Phase\s+(\d+)\s+Complete:\s*(.+?)\s*$/m;
const REVIEW_RE = /^\*\*Review Status:\*\*\s*(.+?)\s*$/m;
const H1_RE = /^#\s+(.+)$/m;

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };
const readIf = async (p) => ((await exists(p)) ? readFile(p, 'utf8') : '');

// --- read model (re-derived from disk on every call) ----------------------------------------

async function loadRun(planDir, reqName) {
  const base = join(planDir, reqName);
  const [spec, testPlan, arch] = await Promise.all([
    readIf(join(base, `${reqName}.spec.md`)),
    readIf(join(base, `${reqName}.test-plan.md`)),
    readIf(join(base, `${reqName}.architecture.md`)),
  ]);
  return {
    reqName,
    title: (spec.match(H1_RE) || [, reqName])[1],
    hasSpec: !!spec,
    hasTestPlan: !!testPlan,
    hasArchitecture: !!arch,
  };
}

async function renderPhases(planDir, reqName) {
  const base = join(planDir, reqName);
  let entries = [];
  try { entries = await readdir(base); } catch { /* dir not created yet */ }
  const re = new RegExp(`^${reqName}-phase-(\\d+)-complete\\.md$`);
  const phases = [];
  for (const file of entries) {
    const m = file.match(re);
    if (!m) continue;
    const body = await readFile(join(base, file), 'utf8');
    const review = (body.match(REVIEW_RE) || [, 'PENDING'])[1];
    phases.push({
      n: Number(m[1]),
      title: (body.match(PHASE_RE) || [, , '(untitled)'])[2],
      review,
      gate: gateOf(review),
      file,
    });
  }
  return phases.sort((a, b) => a.n - b.n);
}

const gateOf = (review) => {
  const r = (review || '').toUpperCase();
  if (r.startsWith('APPROVED')) return 'passed';
  if (r.includes('NEEDS_REVISION')) return 'blocked';
  return 'pending';
};

const renderGates = (phases) => phases.map((p) => ({ phase: p.n, gate: p.gate, detail: p.review }));

// --- write model (HITL; appends to the markdown phase report) --------------------------------

const approveGate = (planDir, reqName, phaseN, approver = 'human') =>
  appendToPhase(planDir, reqName, phaseN,
    `\n> **HITL gate APPROVED** by ${approver} at ${new Date().toISOString()}\n`);

const requestRevision = (planDir, reqName, phaseN, note, approver = 'human') =>
  appendToPhase(planDir, reqName, phaseN,
    `\n> **HITL gate NEEDS_REVISION** by ${approver} at ${new Date().toISOString()}: ${note}\n`);

async function appendToPhase(planDir, reqName, phaseN, line) {
  const file = join(planDir, reqName, `${reqName}-phase-${phaseN}-complete.md`);
  if (!(await exists(file))) throw new Error(`No phase report to write back to: ${file}`);
  await writeFile(file, (await readFile(file, 'utf8')) + line);
  return { file, appended: line.trim() };
}

// --- canvas host binding (concepts only — reconcile with the official preview API) -----------

export default function createConductorCanvas(host, { planDir = '.github/plans' } = {}) {
  // `capabilities` are what the Copilot agent may call; the human drives the same shared state
  // through the canvas UI actions the host renders from `view()`.
  const capabilities = {
    loadRun: ({ reqName }) => loadRun(planDir, reqName),
    renderPhases: ({ reqName }) => renderPhases(planDir, reqName),
    renderGates: async ({ reqName }) => renderGates(await renderPhases(planDir, reqName)),
    approveGate: ({ reqName, phase, approver }) => approveGate(planDir, reqName, phase, approver),
    requestRevision: ({ reqName, phase, note, approver }) =>
      requestRevision(planDir, reqName, phase, note, approver),
  };
  // host?.registerCapabilities?.(capabilities); // ← official registration API TBD (preview)
  return {
    capabilities,
    async view(reqName) {
      const [run, phases] = await Promise.all([
        loadRun(planDir, reqName),
        renderPhases(planDir, reqName),
      ]);
      return { run, phases, gates: renderGates(phases) };
    },
  };
}

// --- standalone runner: demonstrates the read path with no Copilot app -----------------------
// Usage: node extension.mjs [planDir] [reqName]   (defaults: fixture sample-req)
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [planDir = 'fixture', reqName = 'sample-req'] = process.argv.slice(2);
  createConductorCanvas(null, { planDir })
    .view(reqName)
    .then((v) => console.log(JSON.stringify(v, null, 2)))
    .catch((err) => { console.error(err.message); process.exit(1); });
}
