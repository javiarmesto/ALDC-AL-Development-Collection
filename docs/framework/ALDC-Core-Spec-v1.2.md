# ALDC Core Specification v1.2

## Status

- Version: 1.2.0
- Date: 2026-06-12
- Scope: AL (Business Central) repositories that adopt ALDC Core as their operational backbone.
- Change from v1.1: normalizes the **on-demand agent tier** (al-triage, dredd), the **BC Agents extension pack**, the **utility skills**, the optional **BCQuality knowledge layer**, the skills directory convention (`skill-{domain}/SKILL.md`), and the **conformance tooling** (check-conformance, sync-foundation) wired into CI.

## Normative Language

The words **MUST**, **SHOULD**, **MAY**, and their negations are interpreted as normative requirements.

## Purpose

ALDC Core defines the minimum verifiable baseline required to turn agent-based work into a flow that is:
- repeatable, with the same artifacts and gates every time,
- auditable, with traceable decisions and changes,
- governable, with automated validation and HITL.

v1.2 does not change the orchestration model of v1.1 (conductor + 3 subagents, Plan → TDD Implementation → Review → Commit, HITL gates per phase). It brings the normative document back in line with the shipped reality: every primitive that ships is now declared, tiered, and machine-checkable.

ALDC Core is designed for this routing model:

**MEDIUM/HIGH:** `@AL Architecture & Design Specialist` (design) → `al-spec.create` (technical spec) → `@AL Development Conductor` (orchestrated TDD: planning → implement → review) → HITL gates → delivery

**LOW:** `al-spec.create` (technical spec) → `@AL Implementation Specialist` (direct implementation) → delivery

**Reactive (NEW tier in v1.2):** bug/incident symptom → `@AL Triage` (read-only diagnosis) → minimal-fix recommendation → routed to `al-developer` or the conductor. Independent audit → `@Dredd` (read-only, advisory verdict, BCQuality-cited when available).

## Definitions

- **Toolkit**: the set of agents, instructions, prompts, and skills installed in the repository.
- **toolkitRoot**: the root path of the toolkit inside the repository, configurable in `aldc.yaml`.
- **Plans folder**: the canonical folder for shared contracts: `.github/plans/`.
- **Copilot entrypoint**: the repo-wide file that Copilot reads by convention: `.github/copilot-instructions.md`.
- **Skill**: a composable knowledge module loaded by agents on demand. It lives in `skills/skill-{domain}/SKILL.md` under `toolkitRoot` (directory convention; see Core Skills).
- **Requirement set**: the set of 3 contractual artifacts for a requirement (`{req_name}.spec.md`, `{req_name}.architecture.md`, `{req_name}.test-plan.md`).
- **Global memory**: the single append-only file (`.github/plans/memory.md`) that records cross-cutting decisions, inter-session context, and project state.
- **Template**: an immutable file in `docs/templates/`, modifiable only by a maintainer through RFC.
- **Tier** (NEW): the normative category of a primitive — **Core** (MUST ship), **On-Demand** (MUST ship, invoked reactively, read-only on code), **Extension** (MAY ship; optional packs), **Utility** (MAY ship; pipeline support).
- **BCQuality layer** (NEW): an optional, external, citable knowledge base consumed by review/audit agents (see Optional Knowledge Layer).

## Mandatory Repository Structure

An ALDC Core repository **MUST** contain:

- `aldc.yaml` at the repository root.
- `.github/plans/` with:
  - the mandatory global `memory.md`
  - requirement sets: `{req_name}.spec.md`, `{req_name}.architecture.md`, `{req_name}.test-plan.md` for every active requirement
- A repo-wide Copilot entrypoint at `.github/copilot-instructions.md`.
- A toolkit under `toolkitRoot` with:
  - `agents/` (user-invocable agents + internal subagents with `user-invocable: false`)
  - `instructions/`
  - `prompts/`
  - `skills/` (composable knowledge modules, one directory per skill)
  - `docs/templates/` (immutable templates)

Note: `toolkitRoot` **MAY** be `.` in framework repositories and `.github` in consumer repositories. Paths in primitive prose **MUST** use the consumer layout (`.github/`-prefixed) so they resolve after installation (decision of #60; regression guard in conformance tooling).

## Agent Tiers

### Tier 1 — Core Public Agents (`user-invocable: true`) — MUST

- **al-architect**: design, architecture, and strategic decisions. Loads skills by domain, such as API, Copilot, and performance.
- **al-conductor**: primary TDD orchestrator. Coordinates subagents via `runSubagent`. Cycle: Plan → Implement → Review → Commit.
- **al-developer**: tactical implementation and debugging. Loads skills based on the task. Directly invocable by the user.
- **al-presales**: project estimation and planning. Lives outside the delivery cycle.

### Tier 1 — Core Internal Subagents (`user-invocable: false`) — MUST

- **AL Planning Subagent**: AL-aware research and context gathering. Returns structured findings to the conductor.
- **AL Implementation Subagent**: TDD-only implementation. Creates tests FIRST, then code. Does not interact with the user.
- **AL Code Review Subagent**: code review against spec + architecture + test-plan. Returns an APPROVED/NEEDS_REVISION/FAILED verdict. Consumes the BCQuality layer when active (see Optional Knowledge Layer).

### Tier 2 — On-Demand Agents (`user-invocable: true`, read-only on code) — MUST (NEW in v1.2)

Introduced in product 4.1.0; this revision makes them normative.

- **al-triage**: reactive diagnosis. Reproduce → localize → root-cause → minimal-fix recommendation. **MUST NOT** modify product code; its only write surface is the diagnosis artifact.
- **dredd**: independent static auditor. On-demand audit against the BCQuality layer plus native checks; returns an advisory verdict. **MUST NOT** modify product code; its only write surface is the audit artifact.

On-demand agents are not part of the delivery cycle and **MUST NOT** be invoked by the conductor as subagents.

### Tier 3 — Extension Agents — MAY

- **al-agent-builder** (BC Agents pack): Business Central agent development with the AI Development Toolkit / Agent SDK. Ships with its own workflows and skills (see Extension Packs).

### Conductor Orchestration Flow (unchanged from v1.1)

```
al-conductor (orchestrator)
  ├── runSubagent → AL Planning Subagent (research, returns findings)
  ├── runSubagent → AL Implementation Subagent (TDD implementation, returns objects + tests)
  └── runSubagent → AL Code Review Subagent (review, returns verdict)
```

## Required Core Workflows — MUST

- **al-spec.create**: normalize requirements → `{req_name}.spec.md`. Verifies subscribed base-app events against symbols (spec-as-truth, #68).
- **al-build**: verification, compilation, and packaging
- **al-pr-prepare**: documentation and PR delivery
- **al-context.create**: generate or update project context
- **al-memory.create**: update the global `memory.md`
- **al-initialize**: initial environment setup, used infrequently

## Extension Workflows (BC Agents pack) — MAY (NEW in v1.2)

- **al-agent.create**, **al-agent.task**, **al-agent.instructions**, **al-agent.test**, **al-agent.build-instructions**

## Core Skills

### Definition

A **skill** is a composable knowledge module that lives in `skills/skill-{domain}/SKILL.md` under `toolkitRoot` (directory convention, replacing the flat `skill-{domain}.md` file of v1.1; directories MAY carry `references/` and `examples/` loaded just-in-time). Agents load skills on demand depending on task context.

### Characteristics

- Skills **MUST** carry skill frontmatter (`name`, `description`) and **MUST NOT** have agent frontmatter, because they are not directly invocable.
- Skills **MUST** be self-contained and include patterns, examples, workflows, and references.
- The `SKILL.md` body **SHOULD** stay under 500 lines; deeper material belongs in `references/` files loaded on demand.
- Skill directories **MUST** follow the naming convention `skill-{domain}/`.

### Required Core Skills — MUST (7)

| Skill | Content | Loaded by |
|-------|---------|-----------|
| `skill-api` | API design, OData/REST, versioning, BC API pages | architect (design), developer (implementation) |
| `skill-copilot` | Copilot capability, PromptDialog, AI generation, AI testing | architect (design), developer (implementation) |
| `skill-debug` | Debugging workflow, snapshot debugging, CPU profiling, root cause | developer, triage |
| `skill-performance` | Profiling, triage, SetLoadFields, FlowField, performance patterns | architect (analysis), developer (fixes) |
| `skill-events` | Event discovery, subscriber/publisher patterns, event recorder | developer, architect |
| `skill-permissions` | Permission set generation, security patterns, least privilege | developer |
| `skill-testing` | Test strategy design, Given/When/Then, AI Test Toolkit | conductor (strategy), developer (implementation) |

### Recommended Skills — SHOULD (4)

| Skill | Content | Loaded by |
|-------|---------|-----------|
| `skill-migrate` | Version migration, breaking changes, rollback | developer |
| `skill-pages` | Page Designer, page types, UX patterns | developer |
| `skill-translate` | XLF workflow, NAB tools, multilingual support | developer |
| `skill-estimation` | Cost models, SWOT, project structure | presales |

### Extension Skills (BC Agents pack) — MAY (3)

`skill-agent-toolkit`, `skill-agent-instructions`, `skill-agent-task-patterns`

### Utility Skills — MAY (2) (NEW in v1.2)

| Skill | Content |
|-------|---------|
| `skill-manifest` | Extension Manifest Generator: end-of-pipeline handoff contract so sibling collections (CIRCE — Copilot Studio; DELFOS — Power BI) can consume the extension's published surface via the BC MCP server |
| `skill-contribution-assistant` | Guided contribution workflow for the framework itself |

### Loading Mechanism

Skills are referenced by agents and loaded on demand by **reading the skill's `SKILL.md`** when the task matches its domain. The conductor passes skills to subagents as hints; the subagent reads the SKILL.md it needs (the `applyTo` auto-apply mechanism does not fire in subagent runtime). Agents **MUST** evidence which skills they loaded (Skills Evidencing principle).

### Creating New Skills

Skills follow the `docs/templates/skill-template.md` template. Any contributor **MAY** propose new skills through a pull request. Skills that alter Core behavior **MUST** follow the RFC process.

## Instructions — MUST (9, unchanged)

Passive rules auto-applied through `applyTo` patterns: `al-guidelines`, `al-code-style`, `al-naming-conventions`, `al-performance`, `al-error-handling`, `al-events`, `al-testing` (7 auto-applied `.instructions.md` files), plus `copilot-instructions.md` (repo-wide master coordination) and `al-agent-toolkit.instructions.md` (extension pack). `index.md` is a catalog, not an instruction.

The Copilot entrypoint at `.github/copilot-instructions.md` is an intentionally **trimmed** subset of `instructions/copilot-instructions.md` (`copilotEntrypointMode: trimmed` in `aldc.yaml`); the validator checks it is non-empty and smaller than the source.

## Optional Knowledge Layer — BCQuality (NEW in v1.2) — MAY

An external, citable knowledge base consumed by `al-review-subagent` (Step 0), `dredd`, and `al-triage` as an audit/citation layer. It does not replace instructions or skills.

- Configured under `external.bcquality` in `aldc.yaml`: `enabled: auto | true | false`, source `url`/`ref`/`pinnedCommit`, external clone `home`, multi-root `workspace`.
- The conductor resolves the `enabled` switch **once** and propagates the decision to subagents; subagents **MUST NOT** re-probe.
- When absent or disabled, agents **MUST** fall back to the native A–G checklist. A missing layer **MUST NOT** block or fail a review.
- Findings that cite BCQuality **MUST** resolve to real files; evidence JSON is validated in CI (`bcquality-evidence` workflow).

## Requirement Contracts in `.github/plans/`

(Unchanged from v1.1: structure, kebab-case naming, spec/architecture/test-plan contracts, global append-only `memory.md`, agent roles and artifact creation flows for MEDIUM/HIGH and LOW.)

## Immutable Templates

Templates live in `docs/templates/` and **MUST NOT** be modified by agents or workflows. Only a maintainer can change them through RFC.

Required templates (7): `spec-template.md`, `architecture-template.md`, `test-plan-template.md`, `memory-template.md`, `technical-spec-template.md`, `delivery-template.md`, `skill-template.md`.

Auxiliary templates (7, MAY): `plan-template.md`, `plan-complete-template.md`, `phase-complete-template.md`, `planning-findings-template.md`, `code-review-template.md`, `bcquality-task-context.md`, `mkdocs-site-prompt.md`.

## Core Principles

(Unchanged from v1.1: extension-only, event-driven, spec-driven, architecture-first for MEDIUM/HIGH, HITL, TDD, immutable templates, global memory, skills-based, skills evidencing.)

One addition:

- **Declared-equals-shipped** (NEW): every primitive that ships in the toolkit **MUST** be declared in `aldc.yaml` (required or optional) and accounted for in this specification's tier model. CI enforces this (see Conformance Tooling).

## HITL Gates (Mandatory — unchanged)

Complexity gate · Architecture gate (MEDIUM/HIGH) · Per-phase gate (conductor) · Review gate · Delivery gate.

## Conformance Tooling (NEW in v1.2) — MUST

The repository **MUST** run in CI, on every push and pull request:

1. `scripts/check-conformance.js` — declared paths exist; shipped primitives are declared; counters in entry documents match disk; `@import`/relative links resolve; frontmatter is well-formed; root ↔ `packages/foundation` byte-identity.
2. `scripts/sync-foundation.js --check` — `packages/foundation/` (the packaging source of the VS Code extension) has zero drift from the canonical root trees. `packages/foundation/` **MUST NOT** be edited by hand.

## Conformance Criteria (ALDC Core v1.2 Compliant)

A repository is **ALDC Core v1.2 compliant** if:

1. A valid `aldc.yaml` exists and conforms to the schema.
2. `.github/plans/memory.md` exists.
3. Every active requirement has the full set: `{req_name}.spec.md`, `.architecture.md`, `.test-plan.md`.
4. The 7 required immutable templates exist under `docs/templates/` without alteration.
5. The 4 Core agents + 3 internal subagents + 2 on-demand agents exist under `toolkitRoot`.
6. The 6 Core workflows exist under `toolkitRoot`.
7. The 7 required Core skills exist as `skills/skill-{domain}/SKILL.md` inside `toolkitRoot`.
8. All 9 instructions exist.
9. The `.github/copilot-instructions.md` entrypoint is coherent with `copilotEntrypointMode`.
10. For MEDIUM/HIGH, the flow spec → architecture → conductor(subagents) → review → delivery runs with HITL gates.
11. The conformance tooling (check-conformance + sync-foundation --check) passes in CI.
12. Every shipped primitive is declared in `aldc.yaml`.

## Extensibility

(Unchanged from v1.1.) Extensions **MAY** add domain-specific skills, specialized agents, and workflows; they **MUST NOT** break `.github/plans/` contracts, redefine Core names, weaken gates or extension-only rules, modify immutable templates, or delete/overwrite `memory.md`.

## Extension Packs

- **BC Agents** (`al-agent-builder` + 5 workflows + 3 skills): Business Central agent development with the AI Development Toolkit / Agent SDK.

Extension packs **MUST NOT** override Core agents or workflows, modify the Core contract structure, or weaken HITL gates.

## v1.2 Primitive Summary

| Type | Count | Tier | Details |
|------|-------|------|---------|
| Public agents | 4 | Core | architect, conductor, developer, presales |
| Internal subagents | 3 | Core | planning, implement, review |
| On-demand agents | 2 | On-Demand | triage, dredd |
| Extension agents | 1 | Extension | agent-builder |
| Workflows | 6 + 5 | Core + Extension | 6 core; 5 BC Agents pack |
| Skills | 7 + 4 + 3 + 2 | Core/Recommended/Extension/Utility | **16 skills** total |
| Instructions | 9 | Core (8) + Extension (1) | 7 auto-applied + copilot entrypoint source + agent-toolkit |
| Templates | 7 + 7 | Core + Auxiliary | 7 immutable required, 7 auxiliary |

Totals as shipped: **10 agents · 16 skills · 11 workflows · 9 instructions**.
