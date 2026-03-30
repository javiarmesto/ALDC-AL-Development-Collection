# ALDC — Claude Code Instructions

@import ./docs/framework/ALDC-Core-Spec-v1.1.md

## Overview

AL (Application Language) workspace for Microsoft Dynamics 365 Business Central.
Architecture: **ALDC Core v1.1** — 4 agents + 11 skills + 6 workflows + 9 instructions.

## Core Principles

- **Extension-only development** — Never modify base application objects. Use tableextensions, pageextensions, event subscribers.
- **Human-in-the-Loop (HITL)** — All critical decisions require user confirmation before proceeding.
- **TDD / spec-driven** — Features follow: `spec.create` -> architecture -> test-plan -> implementation -> review.
- **Least privilege** — Generate only the minimum permissions required. Use XLIFF for all user-facing strings.

## Agent Routing

| Intent | Agent | What it does |
|--------|-------|-------------|
| Design, architecture, strategy | delegate to agent `al-architect` | Solution design, data modeling, integration strategy |
| Implement, code, debug, fix | delegate to agent `al-developer` | Tactical implementation with full AL MCP tools |
| TDD orchestration (plan -> implement -> review -> commit) | delegate to agent `al-conductor` | Orchestrates planning, implementation, and review subagents |
| Estimate, size, propose | delegate to agent `al-presales` | PERT estimation, SWOT analysis, cost breakdown |

### Quick Routing

```
New feature (MEDIUM/HIGH)? -> al-architect -> /al-spec.create -> al-conductor
New feature (LOW)?         -> /al-spec.create -> al-developer
Bug fix / debugging?       -> al-developer
Architecture review?       -> al-architect
Full TDD cycle?            -> al-conductor
Project estimation?        -> al-presales
```

## Workflows

6 workflows invoked via `/workflow-name`:

| Workflow | When to use |
|----------|-------------|
| `/al-spec.create` | Create functional-technical specifications before development |
| `/al-build` | Build, package, and deploy extensions |
| `/al-pr-prepare` | Prepare pull requests with documentation and validation |
| `/al-memory.create` | Generate/update memory.md for session continuity |
| `/al-context.create` | Generate project context.md for AI assistants |
| `/al-initialize` | Complete environment and workspace setup |

## Skills

11 composable knowledge modules loaded on-demand by agents (not invoked directly):

| Skill | Domain | Loaded by |
|-------|--------|-----------|
| `/skill-debug` | Debugging, snapshot debugging | al-developer |
| `/skill-api` | API pages, OData, REST | al-developer, al-architect |
| `/skill-copilot` | AI features, PromptDialog | al-developer, al-architect |
| `/skill-events` | Event subscribers, publishers | al-developer, al-architect |
| `/skill-permissions` | Permission sets, XLIFF, security | al-developer |
| `/skill-pages` | Page types, FastTabs, actions | al-developer |
| `/skill-migrate` | BC version migration, upgrade codeunits | al-developer |
| `/skill-translate` | XLF translation, NAB AL Tools | al-developer |
| `/skill-performance` | CPU profiling, FlowField optimization | al-developer, al-architect |
| `/skill-testing` | TDD, test strategy, AL Test Toolkit | al-architect, al-conductor |
| `/skill-estimation` | PERT estimation, complexity scoring | al-presales |

### Skills Evidencing

Agents MUST declare which skills they loaded and which patterns they applied:
- **al-architect** -> `> **Skills applied**: skill-api, skill-events` at top of architecture.md
- **al-developer** -> `> **Skills loaded**: skill-debug (root cause analysis)` at start of response
- **al-conductor** -> `Skills Applied in This Phase` table in phase-complete.md

## Auto-Applied Instructions

Active automatically based on file type (no invocation needed):

**Always on `*.al`**: al-guidelines, al-code-style, al-naming-conventions, al-performance
**Context-activated**: al-error-handling (errors), al-events (events), al-testing (test files)

See `instructions/` directory for full content.

## Plans

Requirement sets live in `.github/plans/`, one subdirectory per requirement:

```
.github/plans/
  memory.md                          # Global memory (cross-session decisions)
  {req_name}/
    {req_name}.spec.md               # Functional-technical specification
    {req_name}.architecture.md       # Architecture decisions
    {req_name}.test-plan.md          # Test plan with acceptance criteria
    {req_name}-phase-<N>-complete.md # Phase completion reports
    {req_name}-complete.md           # Final completion report
```

### Workflow with Plans

**MEDIUM / HIGH complexity:**
1. `al-architect` designs solution, creates `{req_name}.architecture.md`
2. `/al-spec.create` reads architecture, generates `{req_name}.spec.md`
3. `al-conductor` reads spec + architecture, orchestrates TDD
4. `/al-pr-prepare` prepares PR referencing the plan

**LOW complexity:**
1. `/al-spec.create` generates spec directly from codebase
2. `al-developer` implements using spec as blueprint

## Complexity-Based Routing

| Level | Scope | Route |
|-------|-------|-------|
| **LOW** | Single phase, no integrations | `/al-spec.create` -> `al-developer` |
| **MEDIUM** | 2-3 areas, internal integrations | `al-architect` -> `/al-spec.create` -> `al-conductor` |
| **HIGH** | 4+ phases, external integrations | `al-architect` -> `/al-spec.create` -> `al-conductor` |

Present the assessment and wait for user confirmation before proceeding.

## BC Agents Pack (Extension)

For agent development with AI Development Toolkit. Includes al-agent-builder agent and skill-agent-task-patterns (8 SDK integration patterns). Workflows: `/al-agent.create`, `/al-agent.task`, `/al-agent.instructions`, `/al-agent.test`.

## Build & Test

```bash
# Download symbols (requires app.json configured)
al-language: Download Symbols

# Build the extension
al-language: Package

# Publish to sandbox
al-language: Publish without Debugging

# Run tests
al-language: Run Tests
```

No npm/yarn build steps. AL compilation is handled by the AL Language VS Code extension.

## Project Structure

```
instructions/          # Auto-applied instruction files (7)
agents/                # Agent definitions (4 user-facing + 3 internal subagents)
skills/                # Composable knowledge modules (11 skill directories)
prompts/               # Workflow definitions (6 prompt files)
docs/framework/        # Normative spec (ALDC-Core-Spec-v1.1.md)
docs/templates/        # Immutable templates
.github/plans/         # Requirement sets & memory
src/                   # AL source code
app.json               # Extension manifest
```

## Reference

- [ALDC Core Spec v1.1](./docs/framework/ALDC-Core-Spec-v1.1.md) — Normative specification
- [AL Language Reference](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-reference-overview)
- [BC Development Docs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/)

---
**Framework**: ALDC Core v1.1 | **Primitives**: 4 agents + 3 subagents + 11 skills + 6 workflows + 7 instructions
