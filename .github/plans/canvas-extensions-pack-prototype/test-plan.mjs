// C3 — Test-Plan Checklist canvas (read path). Backing artifact: {req}.test-plan.md (skill-testing).
// See ../canvas-extensions-catalog.md §2. Read-only for now; HITL writes (toggle AC, link test
// codeunit) follow the same append-to-markdown pattern as the Conductor canvas.

import { join } from 'node:path';
import { readIf, firstHeading, acceptanceCriteria } from './lib.mjs';

async function loadTestPlan(planDir, reqName) {
  const md = await readIf(join(planDir, reqName, `${reqName}.test-plan.md`));
  const criteria = acceptanceCriteria(md);
  return { reqName, title: firstHeading(md) || reqName, total: criteria.length, criteria };
}

export default function createTestPlanCanvas(host, { planDir = '.github/plans' } = {}) {
  const capabilities = {
    loadTestPlan: ({ reqName }) => loadTestPlan(planDir, reqName),
    renderCriteria: async ({ reqName }) => (await loadTestPlan(planDir, reqName)).criteria,
  };
  // host?.registerCapabilities?.(capabilities); // ← official registration API TBD (preview)
  return { capabilities, view: (reqName) => loadTestPlan(planDir, reqName) };
}
