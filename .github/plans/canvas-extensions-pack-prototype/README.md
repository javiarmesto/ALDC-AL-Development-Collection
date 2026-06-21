# Prototype — al-conductor TDD pipeline canvas

Reference spike for the study [`../canvas-extensions-pack.md`](../canvas-extensions-pack.md) §4. It makes a
Conductor run **visible and steerable** in the GitHub Copilot app, while keeping the markdown under
`.github/plans/` as the single source of truth.

> **This is NOT shipped.** It is not declared in `aldc.yaml`, touches no Core agent/workflow/template,
> and modifies no normative spec — so it cannot affect conformance or CI. It exists only to make the
> proposal concrete and to de-risk the §6 execution plan. The Copilot-app canvas host API is in
> **technical preview**; the `host` binding in `extension.mjs` follows the documented *concepts*
> (agent-callable capabilities + bidirectional state) and must be reconciled with the official surface
> before anything ships.

## Capabilities (study §4)

| Capability | Direction | Backing artifact |
|---|---|---|
| `loadRun` | read | `{req}.spec.md`, `{req}.architecture.md`, `{req}.test-plan.md` |
| `renderPhases` | read | `{req}-phase-N-complete.md` (parses title + `Review Status`) |
| `renderGates` | read | derived gate state per phase (`passed` / `blocked` / `pending`) |
| `approveGate` | **write (HITL)** | appends an approval line to the phase report |
| `requestRevision` | **write (HITL)** | appends a `NEEDS_REVISION` note to the phase report |

**Source-of-truth invariant:** every write goes back to the git-versioned markdown; the view is always
re-derived from disk. The canvas never holds private state.

## Try the read path (no Copilot app needed)

```bash
cd .github/plans/canvas-extensions-pack-prototype
node extension.mjs fixture sample-req     # or: npm run demo
```

Prints the derived view model (`run`, `phases`, `gates`) for the bundled `fixture/sample-req/` plan —
demonstrating P0/P1 of the study's execution plan against real markdown.

## Files

| File | Role |
|------|------|
| `lib.mjs` | shared read-only core (markdown parsers) used by the per-requirement canvases |
| `extension.mjs` | **C4** Conductor Pipeline canvas + standalone runner |
| `spec-studio.mjs` | **C1** Spec Studio canvas (read path) |
| `test-plan.mjs` | **C3** Test-Plan Checklist canvas (read path) |
| `review-audit.mjs` | **C5** Review/Audit Board (read + HITL triage over the Dredd Audit-Report JSON) |
| `agent-consume.mjs` | demonstrates agent consumption of capabilities (read + HITL write) |
| `demo-all.mjs` | loads C1 + C3 + C4 over one plan dir |
| `demo-audit.mjs` | C5 read board + HITL triage write (sidecar) |
| `fixture/sample-req/` | sample plan the per-requirement runners read |
| `fixture/audits/` | sample Dredd Audit-Report JSON the C5 runner reads |

## Multi-canvas demo

```bash
node demo-all.mjs        # prints C1, C3 and C4 view models for fixture/sample-req
node demo-audit.mjs      # C5 Review/Audit Board: triage board + HITL assign to al-developer (sidecar)
```

Shows the catalog pattern generalizing across artifacts: the per-requirement canvases (C1/C3/C4) share
the `lib.mjs` markdown core, and C5 binds to the canonical Dredd Audit-Report JSON. See
[`../canvas-extensions-catalog.md`](../canvas-extensions-catalog.md).
