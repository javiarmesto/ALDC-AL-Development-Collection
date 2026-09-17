# GitHub Copilot Instructions for AL Development

<!-- Workspace-specific custom instructions for Copilot. Reference: https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Overview

This workspace contains AL (Application Language) code for Microsoft Dynamics 365 Business Central. It uses the **ALDC Core v1.2** skills-based architecture. The installed distribution contains **12 agents (including 3 subagents), 16 skills, 11 prompts and 8 scoped instructions**; required and optional components are defined in `aldc.yaml`.

## Core Principles

These principles apply to ALL work in this repository:

- **Extension-only development** — Never modify base application objects. Use tableextensions, pageextensions, event subscribers.
- **Human-in-the-Loop (HITL)** — All critical decisions require user confirmation before proceeding.
- **TDD / spec-driven** — Features follow the flow: `architecture (MEDIUM/HIGH) → spec.create → test-plan → implementation → review`.
- **Least privilege** — Generate only the minimum permissions required. Use XLIFF for all user-facing strings.
- **Output language: English** — All persisted artifacts under `.github/plans/**` (architecture.md, spec.md, plan.md, phase-N-complete.md, plan-complete.md, test-plan.md, delivery.md, review reports, Dredd audit reports, BCQuality findings JSON) MUST be written in English regardless of the chat conversation language. Inline chat responses MAY follow the user's language; persisted artifacts stay in English.

## Agent Routing

Choose the right agent for your task:

| Intent | Agent | What it does |
|--------|-------|-------------|
| Specifying approved requirements/designs? | `@AL Spec Agent` through `al-spec.create` | Technical contracts; human approval before implementation |
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

The 11 core knowledge modules below are part of the 16 shipped skills, including optional modules. Agents load relevant skills on demand. You don't invoke skills directly — agents load them automatically when the task requires domain-specific knowledge.

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

BCQuality is an optional citable review provider. Follow the shared
`docs/templates/bcquality-provider-contract.md`: `external.bcquality.mode` selects
`plugin` or `external-multiroot`, and `enabled: false` skips every probe. Plugin
mode loads the exact configured skill (default `bcquality-al-review`); multiroot
reads the configured external Entry. Keep full native A–G until actual results
establish domain coverage. Track discovery, loading, execution and best-effort
index generation separately. Expected versions/revisions are not observed facts.
See `docs/bcquality.md` for setup and limitations.

## Skills Evidencing

Agents MUST declare which skills they loaded and which patterns they applied:

- **al-architect** → `> **Skills applied**: skill-api, skill-events` at top of architecture.md
- **al-developer** → `> **Skills loaded**: skill-debug (root cause analysis)` at start of response
- **AL Implementation Subagent** → `### Skills Loaded` section in Phase Summary returned to Conductor
- **AL Code Review Subagent** → returns a single `### Review-Report (JSON)` (its only output; read-only, cannot persist) carrying findings, verdict, and `review.skills-compliance`
- **al-conductor** → gates on the JSON, **renders** the human review from it (light checkpoint + full `code-review-template.md` in phase-complete.md), and persists the BCQuality leaf reports (from the JSON `sub-results`) to `.github/plans/<plan>/<plan>-bcquality-phase-<N>.json`; fills `Skills Applied`/`Skills Utilization` + the `BCQuality Evidence` block (phase) and roll-up (plan)

This traceability chain ensures every skill application is auditable end-to-end.

### BCQuality evidence

Persist actual findings, cited paths and observed provider identity. CI checks
report structure and, only with an available matching corpus, resolves citations.
Neither CI exit zero nor a catalog listing proves that a plugin loaded, executed
or refreshed its index. Keep those scoped observations in the review evidence.

## Auto-Applied Instructions

Each instruction loads automatically when the file you're editing matches its `applyTo` glob. There is no semantic activation — only glob matching. The framework ships **8 scoped instructions**: the 7 core rules below plus the optional `al-agent-toolkit.instructions.md`. Narrow globs are deliberate: editing a Table or Page no longer drags codeunit-only rules into the prompt.

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
2. `@workspace use al-spec.create` — Reads architecture, generates `.github/plans/{req_name}/{req_name}.spec.md` (technical contracts: object IDs, procedure signatures, acceptance; no AL implementation bodies)
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

**Framework**: ALDC Core v1.2 (Skills-Based Architecture)
**Version**: 1.2.0
**Last Updated**: 2026-09-14
**Workspace**: AL Development for Business Central
**Primitives**: 12 agents (including 3 subagents) + 16 skills + 11 prompts + 8 scoped instructions; 6 core workflows

For direct Developer increments, use AL Developer Reviewer in an independent context before human approval. Dredd remains the advisory auditor. Both load skill-al-review-pipeline; Conductor phases keep their own review subagent.
