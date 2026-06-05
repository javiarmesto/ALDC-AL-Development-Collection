# GitHub Copilot Instructions for AL Development

<!-- Workspace-specific custom instructions for Copilot. Reference: https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Overview

This workspace contains AL (Application Language) code for Microsoft Dynamics 365 Business Central. It uses the **ALDC Core v1.1** skills-based architecture: **4 agents + 11 skills + 6 workflows + 7 instructions**.

## Core Principles

These principles apply to ALL work in this repository:

- **Extension-only development** — Never modify base application objects. Use tableextensions, pageextensions, event subscribers.
- **Human-in-the-Loop (HITL)** — All critical decisions require user confirmation before proceeding.
- **TDD / spec-driven** — Features follow the flow: `spec.create → architecture → test-plan → implementation → review`.
- **Least privilege** — Generate only the minimum permissions required. Use XLIFF for all user-facing strings.
- **Output language: English** — All persisted artifacts under `.github/plans/**` (architecture.md, spec.md, plan.md, phase-N-complete.md, plan-complete.md, test-plan.md, delivery.md, review reports, Dredd audit reports, BCQuality findings JSON) MUST be written in English regardless of the chat conversation language. Inline chat responses MAY follow the user's language; persisted artifacts stay in English.

## Agent Routing

Choose the right agent for your task:

| Intent | Agent | What it does |
|--------|-------|-------------|
| Designing, analyzing architecture, strategic decisions? | `@AL Architecture & Design Specialist` | Solution design, data modeling, integration strategy |
| Implementing, coding, debugging, fixing? | `@AL Implementation Specialist` | Tactical implementation with full AL MCP tools |
| Building a feature with TDD orchestration (plan → implement → review → commit)? | `@AL Development Conductor` | Orchestrates planning, implementation, and review subagents |
| Estimating a project, sizing, proposals? | `@AL Pre-Sales & Project Estimation Specialist` | PERT estimation, SWOT analysis, cost breakdown |
| Auditing code independently against BCQuality (changes vs main, or all)? | `@Dredd` | Independent read-only auditor; advisory verdict with citations |

### Quick routing guide

```
New feature (MEDIUM/HIGH)? → @AL Architecture & Design Specialist → al-spec.create → @AL Development Conductor
New feature (LOW)?         → al-spec.create → @AL Implementation Specialist
Bug fix / debugging?       → @AL Implementation Specialist
Architecture review?       → @AL Architecture & Design Specialist
Full TDD cycle?            → @AL Development Conductor
Project estimation?        → @AL Pre-Sales & Project Estimation Specialist
```

## Workflows

6 workflows available via `@workspace use [name]`:

| Workflow | When to use |
|----------|-------------|
| `al-spec.create` | Create functional-technical specifications before development |
| `al-build` | Build, package, and deploy extensions |
| `al-pr-prepare` | Prepare pull requests with documentation and validation |
| `al-memory.create` | Generate/update memory.md for session continuity |
| `al-context.create` | Generate project context.md for AI assistants |
| `al-initialize` | Complete environment and workspace setup |

### Usage

```
@workspace use al-spec.create    # Create specification
@workspace use al-build          # Build & deploy
@workspace use al-pr-prepare     # Prepare PR
@workspace use al-initialize     # Setup project
```

## Skills

11 composable knowledge modules loaded on-demand by agents. You don't invoke skills directly — agents load them automatically when the task requires domain-specific knowledge.

| Skill | Domain | Loaded by |
|-------|--------|-----------|
| `skill-debug` | Debugging, diagnosis, snapshot debugging | al-developer |
| `skill-api` | API pages, OData, REST endpoints | al-developer, al-architect |
| `skill-copilot` | AI features, PromptDialog, AI Test Toolkit | al-developer, al-architect |
| `skill-events` | Event subscribers, publishers, handled pattern | al-developer, al-architect |
| `skill-permissions` | Permission sets, XLIFF, security | al-developer |
| `skill-pages` | Page types, FastTabs, actions, dynamic UI | al-developer |
| `skill-migrate` | BC version migration, upgrade codeunits, rollback | al-developer |
| `skill-translate` | XLF translation, NAB AL Tools, quality review | al-developer |
| `skill-performance` | CPU profiling, FlowField optimization, set-based ops | al-developer, al-architect |
| `skill-testing` | TDD, test strategy, AL Test Toolkit | al-architect, al-conductor |
| `skill-estimation` | PERT estimation, complexity scoring, SWOT | al-presales |

## External Knowledge: BCQuality

[BCQuality](https://github.com/microsoft/BCQuality) — a curated, citable knowledge base of Business Central guidance (atomic knowledge files + review skills) — is consumed from **outside the AL project**: a clone added as a second VS Code workspace root (multi-root via `aldc.code-workspace`), so its example `.al` files never enter your extension's compilation. Source/version is configurable in `aldc.yaml → external.bcquality` (defaults to upstream; point it at your own fork). See [`docs/bcquality.md`](../docs/bcquality.md) for install + usage.

BCQuality is a **citation/audit layer, not a replacement** for the 7 auto-applied instructions or the 11 skills. The **AL Code Review Subagent** consults it (its "Step 0") before the A-G checklist: it routes via the BCQuality entry point (`<home>/skills/entry.md`, per `aldc.yaml`), runs the dispatched review skills, and folds the resulting findings — each backed by a knowledge-file citation — into the review report. A BCQuality `blocker`/`major` raises the review verdict like a native CRITICAL/MAJOR.

> **Pilot scope**: only `al-performance-review`, `al-security-review`, and `al-style-review` are enabled. Run `bash tools/bcquality/install.sh` to clone BCQuality (to `../bcquality`), then open `aldc.code-workspace`.

## Skills Evidencing

Agents MUST declare which skills they loaded and which patterns they applied:

- **al-architect** → `> **Skills applied**: skill-api, skill-events` at top of architecture.md
- **al-developer** → `> **Skills loaded**: skill-debug (root cause analysis)` at start of response
- **AL Implementation Subagent** → `### Skills Loaded` section in Phase Summary returned to Conductor
- **AL Code Review Subagent** → returns a single `### Review-Report (JSON)` (its only output; read-only, cannot persist) carrying findings, verdict, and `review.skills-compliance`
- **al-conductor** → gates on the JSON, **renders** the human review from it (light checkpoint + full `code-review-template.md` in phase-complete.md), and persists the BCQuality leaf reports (from the JSON `sub-results`) to `.github/plans/<plan>/<plan>-bcquality-phase-<N>.json`; fills `Skills Applied`/`Skills Utilization` + the `BCQuality Evidence` block (phase) and roll-up (plan)

This traceability chain ensures every skill application is auditable end-to-end.

### BCQuality evidence: declarative vs falsifiable

The chain above is **declarative** — an agent could in principle claim a BCQuality consultation it did not perform. Two mechanisms make it **falsifiable**:

1. **Persisted findings-report** — the raw JSON on disk (`*-bcquality-phase-<N>.json`) carries each finding's `references[].path` (the cited knowledge file) and the pinned BCQuality SHA.
2. **CI validation** — the `bcquality-evidence` workflow runs `tools/bcquality/validate_evidence.py`, which (a) asserts the pin agrees across `aldc.yaml` and both install scripts, and (b) verifies **every** citation resolves to a real file in the BCQuality clone (cloned at the pin via `--bcquality-root`). A hallucinated citation or a drifted pin fails the check.

## Auto-Applied Instructions

Each instruction loads automatically when the file you're editing matches its `applyTo` glob. There is no semantic activation — only glob matching. The framework ships **7 instructions** (1 transversal + 6 domain). Narrow globs are deliberate: editing a Table or Page no longer drags codeunit-only rules into the prompt.

| File | `applyTo` | What it enforces |
|------|-----------|------------------|
| `al-guidelines.instructions.md`         | `**/*.al`                              | Core principles (event-driven, App focus, Test separation, naming as infrastructure) |
| `al-code-style.instructions.md`         | `**/*.al`                              | 2-space indent, PascalCase, feature-based folders |
| `al-naming-conventions.instructions.md` | `**/*.al`                              | 26-char object name limit, `<ObjectName>.<ObjectType>.al` file pattern, `I`/`Impl` for interfaces |
| `al-performance.instructions.md`        | `**/*.Codeunit.al`, `**/*.Query.al`    | SetRange/SetLoadFields before Find, CalcSums, no DB-calls in loops |
| `al-error-handling.instructions.md`     | `**/*.Codeunit.al`                     | TryFunctions, mandatory `Label`, telemetry only when explicitly requested |
| `al-events.instructions.md`             | `**/*.Codeunit.al`                     | Never modify base objects, subscribers `local` with exact signature, no `Commit` in subscribers |
| `al-testing.instructions.md`            | `**/test/**/*.al`                      | Tests only when asked, Given/When/Then, standard libraries |

> `copilot-instructions.md` and `instructions/index.md` are **not** instructions in this sense — they have no `applyTo`. `copilot-instructions.md` is the always-on entrypoint; `index.md` is documentation.

> **Naming is infrastructure**: a file that doesn't follow `<ObjectName>.<ObjectType>.al` won't match the type-specific globs and will silently miss its instructions. `aldc-validate` checks the convention.

## Plans

Requirement sets live in `.github/plans/`, one subdirectory per requirement:

```
.github/plans/
├── memory.md                              # Global memory (decisions, context across sessions)
└── {req_name}/                            # One directory per requirement
    ├── {req_name}.spec.md                 # Functional-technical specification
    ├── {req_name}.architecture.md         # Architecture decisions
    ├── {req_name}.test-plan.md            # Test plan with acceptance criteria
    ├── {req_name}-phase-<N>-complete.md   # Phase completion reports (conductor)
    └── {req_name}-complete.md             # Final completion report (conductor)
```

> `memory.md` is GLOBAL and lives directly in `.github/plans/` (not in a subdirectory).

### Workflow with plans

**MEDIUM / HIGH:**

1. `@AL Architecture & Design Specialist` — Designs solution, creates `.github/plans/{req_name}/{req_name}.architecture.md`
2. `@workspace use al-spec.create` — Reads architecture, generates `.github/plans/{req_name}/{req_name}.spec.md` (detailed blueprint: object IDs, procedure signatures, AL code)
3. `@AL Development Conductor` — Reads spec + architecture from `.github/plans/{req_name}/`, orchestrates TDD: planning → implementation → review
4. `@workspace use al-pr-prepare` — Prepares PR referencing the plan

**LOW:**

1. `@workspace use al-spec.create` — Generates `.github/plans/{req_name}/{req_name}.spec.md` directly from codebase
2. `@AL Implementation Specialist` — Implements directly using spec as blueprint

## Complexity-Based Tool Selection

When a user provides requirements, assess complexity to route correctly:

**LOW** — Limited scope, single phase, no integrations
→ `al-spec.create` → `@AL Implementation Specialist` direct implementation

**MEDIUM** — 2-3 functional areas, internal integrations, conditional logic
→ `@AL Architecture & Design Specialist` → `al-spec.create` → `@AL Development Conductor` TDD orchestration

**HIGH** — Enterprise scope, 4+ phases, external integrations, complex workflows
→ `@AL Architecture & Design Specialist` design first → `al-spec.create` → `@AL Development Conductor` implement

Present the assessment and wait for user confirmation before proceeding.

## Further Reference

Human-facing reference material — examples, workspace layout, links, troubleshooting — lives in [`docs/copilot-reference.md`](../docs/copilot-reference.md) to keep this entrypoint lean (it is injected on every request). It covers:

- **Code Generation Examples** — table + event-subscriber snippets with the auto-applied instructions each triggers
- **Best Practices for Copilot Interaction** — how to prompt, when to use agents vs workflows
- **Workspace Structure** — full directory tree of the ALDC framework
- **BC Agents Pack (Extension)** — AI Development Toolkit agents/skills/workflows
- **Reference Documentation** — Microsoft + project doc links
- **Troubleshooting Copilot**

---

**Framework**: ALDC Core v1.1 (Skills-Based Architecture)
**Version**: 1.1.0
**Last Updated**: 2026-05-31
**Workspace**: AL Development for Business Central
**Primitives**: 4 agents + 3 subagents + 11 skills + 6 workflows + 7 instructions (1 transversal + 6 domain)
