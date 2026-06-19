# Study — ALDC Canvas Extensions pack (GitHub Copilot app surface)

**Status:** PROPOSED — awaiting go/no-go (HITL). Nothing shipped; this is a decision-ready proposal.
**Scope:** A *new optional* **Extension-tier** pack. **No** changes to Core agents, workflows, or immutable templates.
**Why:** GitHub Copilot's *canvases* are visible, steerable, bidirectional work surfaces. ALDC already **produces** the structured pipeline state (`spec.md`, `test-plan.md`, `*-phase-N-complete.md`, `memory.md`) that today lives as static markdown buried in the repo. A canvas turns that latent state into an inspectable, dirigible surface. ALDC is also **already multi-surface** (a top-level GitHub Copilot distribution + a `claude-plugin/` Claude Code distribution), so adding a Copilot-app surface extends an existing strategy rather than introducing a foreign concept.

> This study follows the register of `.github/plans/claude-plugin-tool-modernization.md` (a framework-level study), **not** `docs/templates/architecture-template.md` — that template is for BC/AL *feature* architecture (Data Model, Permission sets, DataClassification) and does not fit a tooling pack.

---

## 1. What GitHub Copilot Canvas Extensions are

A feature of the **GitHub Copilot app** — the agent-native *desktop* experience, in **technical preview** (availability expanded June 2026). A *canvas* is a **shared, interactive, bidirectional surface** for a work artifact (plan, triage board, browser session, release checklist, dashboard, incident, spreadsheet) that opens in the app's side panel. The agent updates the canvas while it works; the human edits / reorders / approves / redirects on that **same** surface, instead of the state being buried in a chat thread.

**Runtime shape (confirmed from docs + community):**

| Aspect | Detail |
|--------|--------|
| Location | One subdirectory per extension under `.github/extensions` (project scope) or `~/.copilot/extensions` (user scope) |
| Manifest | `package.json` (metadata + dependencies) |
| Entry point | **Must** be `extension.mjs` — **ES modules only** — defines canvas behavior + **agent-callable capabilities** |
| State | Optional JSON artifacts for persisted canvas data/state |
| Authoring | `/create-canvas` scaffolds; you iterate with the agent to add / remove / revise capabilities |
| Interaction | Humans use UI actions; agents invoke the exposed *capabilities* against the same shared state |

> **Host distinction (important):** ALDC's existing "Copilot" distribution targets **Copilot Chat inside VS Code** (uses `#problems` context-variables and the `ms-dynamics-smb.al/*` MCP). Canvas Extensions target the **standalone GitHub Copilot app** — same brand, **different runtime**. A canvas `extension.mjs` does **not** run in Claude Code or in VS Code Copilot Chat.

## 2. Why it fits ALDC

ALDC already emits the exact structured state a canvas wants to render — it just renders it as static markdown today. The mapping is close to 1:1:

| ALDC artifact / agent (today) | Natural canvas |
|---|---|
| **`al-conductor`** TDD loop (plan→implement→review→commit, quality gates, HITL checkpoints, `*-phase-N-complete.md`) | **Pipeline / checklist** — RED-GREEN-REFACTOR + gates, visible and dirigible ⭐ **best pilot** |
| `{req}.spec.md` + `{req}.test-plan.md` (acceptance criteria) | **Plan / checklist** (editable) |
| `al-presales` (PERT, SWOT, cost) | **Dashboard** (estimate ranges, risk matrix) |
| `al-triage` + `dredd` (findings, severity, recommended fix) | **Triage board** |
| `/al-build` + `/al-pr-prepare` | **Release checklist** |

## 3. Where it sits in the framework

- **Tier:** Tier 3 — **Extension (MAY)**, identical tier to the existing **BC Agents pack** (`al-agent-builder` + 5 workflows + 3 skills).
- **Hard constraints** (spec §Extension Packs): a pack **MUST NOT** override Core agents/workflows, modify the Core contract structure, or weaken HITL gates. This pack honors all three — it is **additive and read-mostly** over `.github/plans/`.
- **Declared-equals-shipped** (spec §Validation): anything that ships **MUST** be declared in `aldc.yaml` (as *optional*) and accounted for in the spec's tier model; `check-conformance` / `sync-foundation` (CI) enforce this. So shipping the pack is a 3-part change: pack files + `aldc.yaml` entry + a spec tier-model line.
- **Physical layout:** the pack's canvases live under `.github/extensions/aldc-<name>/` (the Copilot-app convention); ALDC pack metadata/docs live alongside the other packs. The markdown under `.github/plans/` remains untouched and authoritative.

## 4. The pilot — `al-conductor` TDD pipeline canvas

A single read-mostly canvas that makes a Conductor run visible and steerable. **The markdown in `.github/plans/` stays the source of truth; the canvas is a view/controller over it.**

**Capability surface (names, not code):**

| Capability | Direction | Reads / writes |
|---|---|---|
| `loadRun(reqName)` | read | `{req}.spec.md`, `{req}.architecture.md`, `{req}.test-plan.md` |
| `renderPhases()` | read | derives RED-GREEN-REFACTOR + phase list from `*-phase-N-complete.md` |
| `renderGates()` | read | quality gates + HITL checkpoints + skills/BCQuality evidence rows |
| `approveGate(phaseId)` | **write (HITL)** | records human approval, appends to phase report |
| `requestRevision(phaseId, note)` | **write (HITL)** | redirects the Conductor with a human note |
| `syncMemory()` | read | surfaces relevant `.github/plans/memory.md` decisions |

**Invariant:** the canvas never becomes a second source of truth. Every write goes back to the markdown artifact (git-versioned, PR-reviewable); the canvas re-derives its view from those files.

## 5. Blocking decisions (HITL — for you)

1. **Go / no-go now, or wait for GA?** Canvas is technical-preview; the API may shift. Adopt as an optional pack now, or shelve until GA?
2. **Pilot scope:** Conductor canvas only (recommended), or also triage/estimation in the first cut?
3. **Source-of-truth invariant:** confirm markdown-under-`.github/plans/` stays authoritative and the canvas is view/controller only (recommended).
4. **Distribution host:** ship the pack from the top-level distribution, or as its own `packages/` package consumed by the collection?

## 6. Proposed execution (only if approved)

| Phase | Deliverable | Exit criterion |
|---|---|---|
| **P0 — Spike** | One read-only canvas reading a real `{req}.test-plan.md` in the Copilot app | Renders a live plan; no writes |
| **P1 — Conductor (read)** | `loadRun` + `renderPhases` + `renderGates` | A real Conductor run renders phases + gates correctly |
| **P2 — Conductor (HITL write)** | `approveGate` / `requestRevision` writing back to phase reports | A gate approval round-trips to markdown + git |
| **P3 — Framework wiring** | `aldc.yaml` *optional* entry + spec tier-model line + docs | `check-conformance` green; declared-equals-shipped satisfied |
| **P4 — Extend (optional)** | Triage board + estimation dashboard canvases | Each re-derives from existing artifacts only |

## 7. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Preview API churn breaks the canvas | High | Med | Keep capabilities thin; pin pack as *optional*; isolate from Core so churn never blocks the pipeline |
| New JS (`extension.mjs`) runtime = new security/governance surface vs. ALDC's *least-privilege* / *extension-only* ethos | Med | Med | No secrets/network in the pack; read-mostly; all writes go through git-visible markdown; document the trust boundary |
| Two-host parity cost (Copilot app vs. existing surfaces) | Med | Low | Pack is additive & optional; nothing in Core depends on it; markdown remains the universal artifact |
| Canvas drifts into a second source of truth | Low | High | Hard invariant (§4): canvas re-derives from `.github/plans/`; every write targets the markdown |

## 8. Out of scope

- **Core changes** — no Core agent/workflow/template is modified.
- **VS Code Copilot Chat distribution** — unaffected; its `ms-dynamics-smb.al/*` references stay correct *there*.
- **`claude-plugin/` (Claude Code)** — canvases do not run in that host; not a target.
- **Replacing markdown artifacts** — explicitly *not* a goal; the canvas augments them.

## Recommendation

**Proceed — but as an optional Tier-3 Extension pack, piloting only the Conductor canvas, with markdown as the immutable source of truth.** The conceptual fit is strong and aligns with ALDC's existing multi-surface strategy; the only real costs (preview churn, a new JS runtime, two-host parity) are all contained by keeping the pack additive, read-mostly, and isolated from Core. Gate the start on the §5 decisions.

---

### References

- Working with canvas extensions — GitHub Docs: `https://docs.github.com/en/copilot/how-tos/github-copilot-app/working-with-canvas-extensions`
- GitHub Copilot app: the agent-native desktop experience — GitHub Blog: `https://github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience/`
- Expanded technical preview availability — GitHub Changelog (2026-06-02): `https://github.blog/changelog/2026-06-02-expanded-technical-preview-availability-for-the-github-copilot-app/`
- Canvas Extensions — Awesome GitHub Copilot: `https://awesome-copilot.github.com/extensions/`
