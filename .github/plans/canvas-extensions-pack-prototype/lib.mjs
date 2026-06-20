// Shared read-only core for ALDC methodology canvases (prototype).
// Pure functions over the .github/plans/ markdown — the "stable artifact schema" the
// agent-consumption evaluation (../canvas-extensions-catalog.md §3C) depends on. Every canvas
// (Conductor, Spec Studio, Test-Plan, …) builds its view on top of these helpers, so there is
// one parser to keep in sync with the templates, not one per canvas.

import { readFile, access } from 'node:fs/promises';

export const exists = async (p) => { try { await access(p); return true; } catch { return false; } };
export const readIf = async (p) => ((await exists(p)) ? readFile(p, 'utf8') : '');

export const firstHeading = (md) => (md.match(/^#\s+(.+?)\s*$/m) || [, ''])[1];
export const sectionHeadings = (md) => [...md.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);

// Acceptance criteria from either a table row `| AC-01 | … |` or a bold bullet `- **AC-01** — …`.
// Returns a de-duplicated, numerically-sorted [{ id, text }].
export function acceptanceCriteria(md) {
  const out = [];
  const seen = new Set();
  const push = (id, text) => {
    if (id && !seen.has(id)) { seen.add(id); out.push({ id, text: text.trim() }); }
  };
  for (const m of md.matchAll(/^\|\s*(AC-\d+)\s*\|(.+)$/gm)) {
    push(m[1], m[2].split('|').map((c) => c.trim()).filter(Boolean).join(' — '));
  }
  for (const m of md.matchAll(/^\s*[-*]\s*\*\*(AC-\d+)\*\*\s*[—-]?\s*(.+)$/gm)) {
    push(m[1], m[2]);
  }
  return out.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}
