// C1 — Spec Studio canvas (read path). Backing artifact: {req}.spec.md (owner: /al-spec.create).
// See ../canvas-extensions-catalog.md §2. Read-only for now; HITL writes (approve spec, edit AC)
// follow the same append-to-markdown pattern as the Conductor canvas.

import { join } from 'node:path';
import { readIf, firstHeading, sectionHeadings, acceptanceCriteria } from './lib.mjs';

async function loadSpec(planDir, reqName) {
  const md = await readIf(join(planDir, reqName, `${reqName}.spec.md`));
  return {
    reqName,
    title: firstHeading(md) || reqName,
    sections: sectionHeadings(md),
    acceptanceCriteria: acceptanceCriteria(md),
  };
}

export default function createSpecStudioCanvas(host, { planDir = '.github/plans' } = {}) {
  const capabilities = {
    loadSpec: ({ reqName }) => loadSpec(planDir, reqName),
    renderAcceptanceCriteria: async ({ reqName }) => (await loadSpec(planDir, reqName)).acceptanceCriteria,
  };
  // host?.registerCapabilities?.(capabilities); // ← official registration API TBD (preview)
  return { capabilities, view: (reqName) => loadSpec(planDir, reqName) };
}
