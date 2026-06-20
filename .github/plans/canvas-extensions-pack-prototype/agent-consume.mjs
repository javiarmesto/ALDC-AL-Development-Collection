// Demonstrates AGENT CONSUMPTION of the canvas capabilities WITHOUT the Copilot app UI.
//
// An in-host Copilot agent would call these capabilities the same way (see
// ../canvas-extensions-catalog.md §3A). Cross-host ALDC agents instead share the same
// .github/plans/ markdown artifact (§3B). This harness exercises the capability surface
// directly against a throwaway temp plan dir, so it never touches the committed fixture.
//
// Run: node agent-consume.mjs

import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import createConductorCanvas from './extension.mjs';

// --- arrange: a throwaway plan dir with one phase mid-review ---------------------------------
const root = await mkdtemp(join(tmpdir(), 'aldc-canvas-'));
const reqName = 'demo-req';
await mkdir(join(root, reqName), { recursive: true });
await writeFile(join(root, reqName, `${reqName}.spec.md`), '# Demo Requirement\n');
await writeFile(
  join(root, reqName, `${reqName}-phase-1-complete.md`),
  '## Phase 1 Complete: RED — failing tests written\n\n**Review Status:** NEEDS_REVISION\n',
);

const canvas = createConductorCanvas(null, { planDir: root });

// --- act + assert: an agent consuming the capability surface ---------------------------------
console.log('Capabilities an agent can call:', Object.keys(canvas.capabilities).join(', '));

// 1) READ — agent inspects pipeline gate state
console.log('\n[read]  renderGates →', JSON.stringify(await canvas.capabilities.renderGates({ reqName })));

// 2) HITL WRITE — agent records a human gate decision back to the markdown (append-only)
const w = await canvas.capabilities.approveGate({ reqName, phase: 1, approver: 'agent-on-behalf-of-human' });
console.log('[write] approveGate appended →', JSON.stringify(w.appended));

// 3) RE-DERIVE — view is read straight from markdown; gate stays driven by the canonical
//    Review Status line (TD-01: approve records intent, it does NOT overwrite agent-authored status).
console.log('[read]  renderGates →', JSON.stringify(await canvas.capabilities.renderGates({ reqName })),
  '  ← intentionally still blocked (TD-01)');

const persisted = (await readFile(join(root, reqName, `${reqName}-phase-1-complete.md`), 'utf8')).trim();
console.log('\nPersisted to the source of truth (last line):\n  ' + persisted.split('\n').at(-1));
