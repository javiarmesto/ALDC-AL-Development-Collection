# ALDC Core Specification v1.1

## Status

- Version: 1.1.0
- Date: 2026-03-01
- Scope: AL (Business Central) repositories that adopt ALDC Core as their operational backbone.
- Change from v1.0: skills-based modularization, per-requirement contracts, global memory.

## Normative Language

The words **MUST**, **SHOULD**, **MAY**, and their negations are interpreted as normative requirements.

## Purpose

ALDC Core defines the minimum verifiable baseline required to turn agent-based work into a flow that is:
- repeatable, with the same artifacts and gates every time,
- auditable, with traceable decisions and changes,
- governable, with automated validation and HITL.

ALDC Core v1.1 reorganizes capabilities into composable modules (skills) while preserving rigorous TDD orchestration. Reducing public agents from 11 to 4 simplifies user choice, while the internal orchestration model (conductor + 3 subagents) preserves the full cycle: Plan → TDD Implementation → Review → Commit with HITL gates for each phase.

ALDC Core is designed for this routing model:

**MEDIUM/HIGH:** `@AL Architecture & Design Specialist` (design) → `al-spec.create` (technical spec) → `@AL Development Conductor` (orchestrated TDD: planning → implement → review) → HITL gates → delivery

**LOW:** `al-spec.create` (technical spec) → `@AL Implementation Specialist` (direct implementation) → delivery

## Definitions

- **Toolkit**: the set of agents, instructions, prompts, and skills installed in the repository.
- **toolkitRoot**: the root path of the toolkit inside the repository, configurable in `aldc.yaml`.
- **Plans folder**: the canonical folder for shared contracts: `.github/plans/`.
- **Copilot entrypoint**: the repo-wide file that Copilot reads by convention: `.github/copilot-instructions.md`.
- **Skill**: a composable knowledge module loaded by agents on demand. It lives in `skills/` under `toolkitRoot`.
- **Requirement set**: the set of 3 contractual artifacts for a requirement (`{req_name}.spec.md`, `{req_name}.architecture.md`, `{req_name}.test-plan.md`).
- **Global memory**: the single append-only file (`.github/plans/memory.md`) that records cross-cutting decisions, inter-session context, and project state.
- **Template**: an immutable file in `docs/templates/`, modifiable only by a maintainer through RFC.

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
  - `skills/` (composable knowledge modules)
  - `docs/templates/` (immutable templates)

Note: `toolkitRoot` **MAY** be `.` in framework repositories and `.github` in consumer repositories.

## Required Core Agents

ALDC Core v1.1 adopts a simplified model of **4 public agents + 3 internal subagents**.

### Public Agents (`user-invocable: true`)

- **al-architect**: design, architecture, and strategic decisions. Loads skills by domain, such as API, Copilot, and performance.
- **al-conductor**: primary TDD orchestrator. Coordinates subagents via `runSubagent`. Cycle: Plan → Implement → Review → Commit.
- **al-developer**: tactical implementation and debugging. Loads skills based on the task, such as debug, events, permissions, and more. Directly invocable by the user.
- **al-presales**: project estimation and planning. Lives outside the delivery cycle.

### Internal Subagents (`user-invocable: false`)

- **AL Planning Subagent**: AL-aware research and context gathering. Returns structured findings to the conductor.
- **AL Implementation Subagent**: TDD-only implementation. Creates tests FIRST, then code. Loads skills by domain. Does not interact with the user.
- **AL Code Review Subagent**: code review against spec + architecture + test-plan. Returns an APPROVED/NEEDS_REVISION/FAILED verdict.

### Conductor Orchestration Flow

```
al-conductor (orchestrator)
  ├── runSubagent → AL Planning Subagent (research, returns findings)
  ├── runSubagent → AL Implementation Subagent (TDD implementation, returns objects + tests)
  └── runSubagent → AL Code Review Subagent (review, returns verdict)
```

Conductor frontmatter:
```yaml
tools: ['runSubagent', ...]
agents: ['AL Planning Subagent', 'AL Code Review Subagent', 'AL Implementation Subagent']
```

Note: `AL Implementation Subagent` is TDD-only and does not interact with the user. `al-developer` remains directly invocable for tactical tasks.

### Agents Removed from v1.0

The following agents are absorbed into the simplified model:

| Removed | Absorbed into |
|---------|---------------|
| `al-debugger` | `al-developer` + `skill-debug` |
| `al-tester` | `al-conductor` (TDD is inherent) + `skill-testing` |
| `al-api` | `al-architect` + `skill-api` (design) / `al-developer` + `skill-api` (implementation) |
| `al-copilot` | `al-architect` + `skill-copilot` (design) / `al-developer` + `skill-copilot` (implementation) |

## Required Core Workflows

To execute the Core flow, the toolkit **MUST** include:

- **al-spec.create**: normalize requirements → `{req_name}.spec.md`
- **al-build**: verification, compilation, and packaging
- **al-pr-prepare**: documentation and PR delivery
- **al-context.create**: generate or update project context
- **al-memory.create**: update the global `memory.md`
- **al-initialize**: initial environment setup, used infrequently

### Workflows Removed from v1.0

| Removed | Absorbed into |
|---------|---------------|
| `al-diagnose` | `al-developer` + `skill-debug` |
| `al-events` (prompt) | `skill-events` |
| `al-performance` + `al-performance.triage` | `skill-performance` |
| `al-permissions` | `skill-permissions` |
| `al-migrate` | `skill-migrate` |
| `al-pages` | `skill-pages` |
| `al-translate` | `skill-translate` |
| `al-copilot-capability` | `skill-copilot` (phase 1) |
| `al-copilot-promptdialog` | `skill-copilot` (phase 2) |
| `al-copilot-generate` | `skill-copilot` (phase 3) |
| `al-copilot-test` | `skill-copilot` (phase 4) |

## Core Skills

### Definition

A **skill** is a composable knowledge module in markdown format that lives in `skills/` under `toolkitRoot`. Agents load skills on demand depending on task context.

### Characteristics

- Skills **MUST NOT** have agent frontmatter because they are not directly invocable.
- Skills **MUST** be self-contained and include patterns, examples, workflows, and references.
- Skills **SHOULD** stay under 500 lines to optimize context window usage.
- Skills **MUST** follow the naming convention `skill-{domain}.md`.

### Required Core Skills

The toolkit **MUST** include the following minimum set of skills to cover absorbed capabilities:

| Skill | Content | Loaded by |
|-------|---------|-----------|
| `skill-api.md` | API design, OData/REST, versioning, BC API pages | architect (design), developer (implementation) |
| `skill-copilot.md` | Copilot capability, PromptDialog, AI generation, AI testing, complete lifecycle | architect (design), developer (implementation) |
| `skill-debug.md` | Debugging workflow, snapshot debugging, CPU profiling, root cause analysis | developer |
| `skill-performance.md` | Profiling, triage, SetLoadFields, FlowField, performance patterns | architect (analysis), developer (fixes) |
| `skill-events.md` | Event discovery, subscriber/publisher patterns, event recorder | developer, architect |
| `skill-permissions.md` | Permission set generation, security patterns, least privilege | developer |
| `skill-testing.md` | Test strategy design, Given/When/Then, AI Test Toolkit | conductor (strategy), developer (implementation) |

### Recommended Skills (SHOULD)

| Skill | Content | Loaded by |
|-------|---------|-----------|
| `skill-migrate.md` | Version migration, breaking changes, rollback | developer |
| `skill-pages.md` | Page Designer, page types, UX patterns | developer |
| `skill-translate.md` | XLF workflow, NAB tools, multilingual support | developer |
| `skill-estimation.md` | Cost models, SWOT, project structure | presales |

### Loading Mechanism

In GitHub Copilot, agents reference skills conditionally:

```markdown
## Domain Skills

This agent works with the following skills from skills/.
Copilot loads them automatically when relevant to the task:

- **skill-api** — When designing or implementing API pages, OData endpoints
- **skill-debug** — When performing debugging, CPU profiling, diagnostics
```

### Creating New Skills

Skills follow the `docs/templates/skill-template.md` template. Any contributor **MAY** propose new skills through a pull request. Skills that alter Core behavior **MUST** follow the RFC process.

## Instructions (Unchanged)

The 9 instruction files remain unchanged. They are passive rules auto-applied through `applyTo` patterns:

- `al-guidelines.instructions.md`: master hub (`**/*.{al,json}`)
- `al-code-style.instructions.md`: code formatting (`**/*.al`)
- `al-naming-conventions.instructions.md`: naming rules (`**/*.al`)
- `al-performance.instructions.md`: performance patterns (`**/*.al`)
- `al-error-handling.instructions.md`: error handling (`**/*.al`)
- `al-events.instructions.md`: event patterns (`**/*.al`)
- `al-testing.instructions.md`: testing rules (`**/test/**/*.al`)
- `copilot-instructions.md`: master coordination (repo-wide)
- `index.md`: catalog

## Requirement Contracts in `.github/plans/`

### Structure

```
.github/plans/
  memory.md                              ← GLOBAL (single, append-only)
  {req_name}/                            ← one directory per requirement
    {req_name}.spec.md
    {req_name}.architecture.md
    {req_name}.test-plan.md
    {req_name}-phase-<N>-complete.md     ← generated by al-conductor
    {req_name}-complete.md               ← generated by al-conductor
  archive/                               ← completed requirements
```

### Naming Convention

- `{req_name}` **MUST** be kebab-case, for example `customer-discount` or `api-integration`
- `{req_name}` **MUST** be consistent across every file in the set and in the directory name
- The supported contract types are `spec`, `architecture`, and `test-plan`
- The full pattern is `.github/plans/{req_name}/{req_name}.{type}.md`

### `{req_name}.spec.md` Contract

It **MUST** contain:
- context and objective
- scope and out-of-scope
- normalized requirements (R1…Rn)
- acceptance criteria (AC-F, AC-T, AC-Q)
- constraints, including extension-only
- technical specification, required for MEDIUM/HIGH

### `{req_name}.architecture.md` Contract

It **MUST** contain:
- high-level design
- AL object map
- event architecture
- security and permissions
- performance considerations
- decisions, including rationale and alternatives

### `{req_name}.test-plan.md` Contract

It **MUST** contain:
- test strategy
- scenario matrix (Given/When/Then)
- test data
- quality gates

### Global Memory (`memory.md`)

This file is single and append-only. It **MUST NOT** be deleted or overwritten.

It **MUST** contain:
- current project status
- active requirements table
- recorded decisions, both cross-cutting and per requirement
- scope changes
- lessons learned
- inter-session context
- next steps

Agents and humans **SHOULD** update `memory.md` at every significant handoff.

### Agent Roles and Produced Artifacts

| Agent / Workflow | Role | Produces |
|------------------|------|----------|
| `@AL Architecture & Design Specialist` | Solution Architect: designs the solution, data flows, and strategic decisions | `.github/plans/{req_name}/{req_name}.architecture.md` |
| `al-spec.create` | Detailed technical spec: reads `architecture.md` and generates an implementable blueprint with IDs, signatures, and AL code | `.github/plans/{req_name}/{req_name}.spec.md` |
| `@AL Development Conductor` | TDD orchestrator: reads spec + architecture and coordinates planning → implement → review | implementation + `.github/plans/{req_name}/{req_name}.test-plan.md` |
| `@AL Implementation Specialist` | Direct tactical implementation: reads the spec, without orchestrated TDD | implementation |

### Artifact Creation Flow

#### MEDIUM / HIGH (with architecture + TDD)

1. Assign `{req_name}` in kebab-case.
2. `@AL Architecture & Design Specialist` generates `.github/plans/{req_name}/{req_name}.architecture.md` with the approved design.
   - ⚠️ **GATE**: architecture must be approved before continuing
3. `@workspace use al-spec.create` reads `architecture.md` and the codebase, then generates `.github/plans/{req_name}/{req_name}.spec.md`
   - Technical spec includes object IDs, field types, procedure signatures, and Given/When/Then tests
   - ⚠️ **GATE**: spec must be approved before implementation
4. Update the global `memory.md` with the requirement context.
5. `@AL Development Conductor` orchestrates the TDD cycle from `.github/plans/{req_name}/`:
   - planning-subagent (research) → implement-subagent (TDD) → review-subagent (review)
   - ⚠️ **GATE**: human validation for each phase
6. Delivery → `@workspace use al-pr-prepare` → update `memory.md`
7. Archive the completed set in `archive/` if desired

#### LOW (without formal architecture)

1. Assign `{req_name}` in kebab-case.
2. `@workspace use al-spec.create` generates `.github/plans/{req_name}/{req_name}.spec.md` directly from the codebase
   - ⚠️ **GATE**: spec must be approved before implementation
3. Update the global `memory.md`
4. `@AL Implementation Specialist` implements directly using the spec as a blueprint
5. Deliver and update `memory.md`

## Immutable Templates

Templates live in `docs/templates/` and **MUST NOT** be modified by agents or workflows. Only a maintainer can change them through RFC.

Required templates (7):
- `spec-template.md`
- `architecture-template.md`
- `test-plan-template.md`
- `memory-template.md` for initializing global memory
- `technical-spec-template.md`
- `delivery-template.md`
- `skill-template.md` (NEW in v1.1)

Agents **MUST** copy the template, fill it in, and write the output into plans. They must never edit the template directly.

## Core Principles

The repository and its agents **MUST** operate according to the following principles:

- **Extension-only**: they **MUST NOT** modify base objects directly.
- **Event-driven**: they **SHOULD** use subscribers and publishers.
- **Spec-driven**: a behavior contract **MUST** exist before implementation begins.
- **Architecture-first** for MEDIUM/HIGH: an approved `{req_name}.architecture.md` **MUST** exist.
- **HITL**: a human remains the decision maker and gates are mandatory.
- **TDD**: for MEDIUM/HIGH, RED → GREEN → REFACTOR **SHOULD** be applied.
- **Immutable templates**: templates can only be modified by a maintainer through RFC.
- **Global memory**: `memory.md` is append-only and is never deleted.
- **Skills-based**: specialized capabilities are encapsulated in composable skills.
- **Skills evidencing**: agents **MUST** declare which skills they loaded and which patterns they applied. The implement-subagent declares `### Skills Loaded` in each Phase Summary, the review-subagent validates via `Skills Compliance Check`, the conductor consolidates into `Skills Applied in This Phase` in phase-complete files and `Skills Utilization Summary` in plan-complete files, and the architect declares `> **Skills applied**:` in `architecture.md`.

## HITL Gates (Mandatory)

- **Complexity gate**: the system **MUST** wait for human confirmation before routing.
- **Architecture gate** for MEDIUM/HIGH: `{req_name}.architecture.md` **MUST** be approved.
- **Per-phase gate** for MEDIUM/HIGH: `al-conductor` **MUST** request human validation.
- **Review gate**: implementation **MUST** pass review against spec + architecture + test-plan.
- **Delivery gate**: delivery **MUST** be free from known errors and include updated documentation.

## Conformance Criteria (ALDC Core v1.1 Compliant)

A repository is **ALDC Core v1.1 compliant** if:

1. A valid `aldc.yaml` exists and conforms to the schema.
2. `.github/plans/memory.md` exists.
3. Every active requirement has the full set: `{req_name}.spec.md`, `.architecture.md`, `.test-plan.md`.
4. The 7 immutable templates exist under `docs/templates/` without alteration.
5. The 4 Core agents + 3 internal subagents exist under `toolkitRoot`.
6. The 6 Core workflows exist under `toolkitRoot`.
7. The 7 required Core skills exist under `skills/` inside `toolkitRoot`.
8. All 9 instructions exist.
9. The `.github/copilot-instructions.md` entrypoint is coherent.
10. For MEDIUM/HIGH, the flow spec → architecture → conductor(subagents) → review → delivery runs with HITL gates.

## Extensibility

Extensions **MAY** add:
- additional domain-specific skills
- specialized agents, as extensions rather than Core agents
- additional workflows

But they **MUST NOT**:
- break `.github/plans/` contracts
- redefine Core agent, workflow, or skill names
- weaken gates or extension-only rules
- modify immutable templates
- delete or overwrite `memory.md` content

## Optional Components

Optional components add domain-specific capabilities without altering Core.

Available optional components:

- **BC Agent Builder**: `@AL Agent Builder`, plus 3 skills and 4 workflows for AI Development Toolkit / Agent SDK development

Optional components **MUST NOT**:

- override Core agents or workflows
- modify the Core contract structure
- weaken HITL gates

Optional components **MAY**:

- add new user-invocable agents
- add new skills that Core agents can load
- add new workflows
- add domain-specific tools and validators

## v1.1 Primitive Summary

| Type | Count | Details |
|------|-------|---------|
| Public agents | 4 | architect, conductor, developer, presales |
| Internal subagents | 3 | planning-subagent, implement-subagent, review-subagent |
| Workflows | 6 | spec.create, build, pr-prepare, memory.create, context.create, initialize |
| Required skills | 7 | api, copilot, debug, performance, events, permissions, testing |
| Recommended skills | 4 | migrate, pages, translate, estimation |
| Instructions | 9 | Unchanged |
| Templates | 7 | +1 `skill-template.md` |
| **Total** | **40** | compared to 38 in v1.0, with +1 implement-subagent and lower cognitive complexity |
