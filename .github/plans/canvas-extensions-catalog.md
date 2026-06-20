# Study (companion) — ALDC methodology canvases + agent-consumption evaluation

**Status:** PROPOSED (exploration). Companion to [`canvas-extensions-pack.md`](./canvas-extensions-pack.md). Nothing shipped.
**Scope:** (1) design a catalog of canvases oriented to the **ALDC methodology**; (2) evaluate whether they can be **consumed by agents**.
**Pilot:** the Conductor canvas (study §4) is prototyped in [`canvas-extensions-pack-prototype/`](./canvas-extensions-pack-prototype/); this doc generalizes it to the whole methodology and answers the agent-consumption question.

---

## 1. Design principle — canvases follow the methodology, not the tool

ALDC's methodology is a **spec-driven TDD pipeline with HITL gates**. Every stage already emits a structured markdown artifact under `.github/plans/`. A *methodology canvas* is a **view/controller over one such artifact**.

> **Design rule:** one canvas per methodology artifact; the artifact is the source of truth; the canvas never holds private state. This is what makes the catalog coherent *and* agent-consumable (§3).

## 2. The canvas catalog (mapped to ALDC stages)

| # | Canvas | Stage / owner | Backing artifact (source of truth) | Reads | HITL writes |
|---|--------|---------------|-----------------------------------|-------|-------------|
| **C1** | Spec Studio | `/al-spec.create` | `{req}.spec.md` | sections + acceptance-criteria table | approve spec · edit AC |
| **C2** | Architecture Board | `al-architect` | `{req}.architecture.md` | 14 sections · `TD-xx` decisions · risks | approve · flag a decision to revisit |
| **C3** | Test-Plan Checklist | skill-testing | `{req}.test-plan.md` | `AC-xx` pass/fail | toggle AC · link to test codeunit |
| **C4** ⭐ | **Conductor Pipeline** (prototyped) | `al-conductor` | `{req}-phase-N-complete.md` + gates | RED·GREEN·REFACTOR · quality gates | approve / redirect a gate |
| **C5** | Review / Audit Board | `al-triage` · `dredd` · review-subagent | findings + `*-bcquality-*.json` | findings by severity + citations | accept / dismiss / assign to `al-developer` |
| **C6** | Estimation Dashboard | `al-presales` | estimation artifact (PERT / SWOT) | estimate ranges · risk matrix | adjust assumptions → re-estimate |
| **C7** | Release Checklist | `/al-build` · `/al-pr-prepare` | build / PR-prep output + `memory.md` | pre/post-deploy checks · PR readiness | gate the release |
| **C8** | Memory Lens (cross-cutting) | global | `.github/plans/memory.md` | cross-session decisions | pin / append a decision |

**Notes.** C4 is the cheapest first build (already prototyped). C1–C3 reuse the same parse-markdown-headers approach as C4 against existing templates. C5 is the highest-value *new* surface (turns `dredd`/`al-triage` verdicts into a triage board). C8 is a side-panel rendered alongside any other canvas, not a standalone.

## 3. Agent-consumption evaluation — *can agents consume these?*

There are **two distinct consumption paths**, and the answer differs by path.

### 3A. In-host — the Copilot-app agent ↔ canvas capabilities (native, supported ✅)

Per GitHub's docs, "both people and agents interact with that same shared state through UI actions and **agent-callable capabilities**," and you can "ask the agent to **call capabilities** exposed by the canvas to update data or take actions." So inside the Copilot app the agent consumes the canvas **directly** by invoking its capabilities — the `capabilities` object the prototype exports. The companion `agent-consume.mjs` (§5) demonstrates exactly this call pattern.

### 3B. Cross-host — ALDC's own agents ↔ shared markdown (indirect, via the artifact)

ALDC's agents (`al-conductor`, `al-developer`, subagents, `dredd`) run in **Claude Code / Copilot Chat**, **not** in the Copilot app, so they **cannot call the canvas object directly**. They interoperate through the **shared `.github/plans/` markdown**, which is already ALDC's source of truth:

```
ALDC agent  ──writes──▶  {req}-phase-N-complete.md  ──renders──▶  Canvas (Copilot app)
                                   ▲                                     │
   next agent run ──reads──────────┴──────────writes-back (HITL)────────┘  human steers
```

→ **Indirect but robust**: the markdown **templates are the interop schema**; no shared runtime is required. This works precisely because ALDC already enforces *spec-as-truth* + HITL on these files.

### 3C. What "agent-consumable" requires

| Requirement | Why it matters | Prototype status |
|---|---|---|
| Stable artifact schema | canvas + agents must parse the same headers | uses existing templates' headers |
| Versioned capability contract | in-host agents bind to capability names/params | thin `capabilities` object |
| Append-only / idempotent writes | human + agent edits must not clobber | append-only; git is the merge surface |
| No hidden canvas state | agents must see what the human did | source-of-truth invariant |

### 3D. Risks specific to agent-consumption

| Risk | Mitigation |
|---|---|
| Template drift breaks the canvas parser | pin parsing to template version; add a template-contract test |
| Capability API preview/unstable | keep logic in **pure functions over markdown** + a thin host binding (the prototype's structure) |
| Cross-host race (human vs. agent edit) | append-only writes; reconcile via git |
| Canvas silently overwrites agent-authored status | canvas **records** human intent, never rewrites the canonical status line (TD-01) |

### TD-01: approve = *record*, not *overwrite*

- **Problem:** should `approveGate` flip the gate by rewriting `**Review Status:**`?
- **Decision:** no — it **appends** a human-approval record; the canonical status line stays agent-authored.
- **Rationale:** prevents the canvas from becoming a second source of truth; keeps `al-conductor` the authority on status; reconciliation stays explicit and auditable. (This is why, in the §5 demo, the gate intentionally does **not** auto-flip after `approveGate`.)

## 4. Verdict

**Yes — methodology canvases are agent-consumable on both paths:** directly in-host (Copilot agent ↔ capabilities) and indirectly cross-host (ALDC agents ↔ shared markdown). The enabling choice is the one already in the prototype: **pure functions over `.github/plans/` markdown + a thin capability binding**, with the markdown templates as the interop schema.

**Recommended sequencing:** build the **read path** for C1–C4 first (cheap — reuses the Conductor parser), keep all writes append-only, add C5 (audit board) as the first high-value new surface, and **defer in-host capability *registration* until the Canvas API leaves technical preview**.

## 5. Demonstrated

[`canvas-extensions-pack-prototype/agent-consume.mjs`](./canvas-extensions-pack-prototype/agent-consume.mjs) invokes the canvas capabilities **programmatically — the same way an agent does** — proving read + HITL-write consumption against markdown, with no Copilot app:

```bash
cd .github/plans/canvas-extensions-pack-prototype
node agent-consume.mjs
```

---

### References

- Working with canvas extensions — GitHub Docs: `https://docs.github.com/en/copilot/how-tos/github-copilot-app/working-with-canvas-extensions`
- GitHub Copilot app: the agent-native desktop experience — GitHub Blog: `https://github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience/`
- Canvas Extensions — Awesome GitHub Copilot: `https://awesome-copilot.github.com/extensions/`
