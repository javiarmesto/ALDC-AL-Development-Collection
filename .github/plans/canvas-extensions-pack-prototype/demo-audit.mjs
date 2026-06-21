// C5 Review/Audit Board demo — read the triage board from a real Dredd Audit-Report JSON, then
// exercise the HITL triage write. The write goes to a SIDECAR in a temp dir so the committed
// fixture (and, in real use, Dredd's CI-validated report) stays immutable (TD-01).
// Run: node demo-audit.mjs

import { mkdtemp, copyFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createReviewAuditCanvas from './review-audit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureAuditsDir = join(here, 'fixture', 'audits');
const auditName = 'dredd-audit-2026-06-20-0900.json';

// 1) READ — triage board straight from the committed fixture (no mutation)
const ro = createReviewAuditCanvas(null, { auditsDir: fixtureAuditsDir });
console.log('Capabilities an agent can call:', Object.keys(ro.capabilities).join(', '));
const board = await ro.capabilities.renderBoard();
console.log(`\nVerdict: ${board.verdict}  | counts: ${JSON.stringify(board.counts)}  | BCQuality sha: ${board.bcqualitySha}`);
for (const f of board.findings) console.log(`  [${f.severity}] ${f.at}  ${f.id}${f.citation ? `  (cite: ${f.citation})` : ''}`);

// 2) HITL WRITE — assign the major finding to al-developer. Sidecar keeps Dredd's report immutable.
const tmp = await mkdtemp(join(tmpdir(), 'aldc-audit-'));
await copyFile(join(fixtureAuditsDir, auditName), join(tmp, auditName));
const rw = createReviewAuditCanvas(null, { auditsDir: tmp });
const res = await rw.capabilities.triageFinding({
  findingId: 'performance/al-performance.md#setloadfields',
  action: 'assign',
  assignee: 'al-developer',
  note: 'fix before release',
});
console.log(`\n[write] triage decision → ${res.sidecar} (${res.total} decision)`);
console.log('sidecar the next agent (al-developer) consumes:\n' + (await readFile(join(tmp, res.sidecar), 'utf8')).trim());
