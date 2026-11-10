# AL Development for Business Central

**ALDC (AL Development Collection)** framework for Microsoft Dynamics 365 Business Central.
Spec-first, architecture-driven, TDD-orchestrated development with GitHub Copilot agents
and human-in-the-loop gates.

**ALDC Core**: v1.2 | **Skills-based modularization with preserved orchestration**

## Architecture Overview

ALDC organizes development through **5 core agents**, **3 on-demand specialists**,
**4 internal subagents**, **16 knowledge skills**, **10 workflows** and **9 scoped
instruction files**, plus one optional BC Agent Builder agent, governed by
per-requirement contracts and a global memory system.

### Agents (5 core)

| Agent | Role | When to use |
|-------|------|-------------|
| `@AL Architecture & Design Specialist` | Solution Architect: designs solutions, information flows, technical decisions, requirement decomposition | New features, architecture decisions, MEDIUM/HIGH complexity |
| `@AL Spec Agent` | Specification owner: technical contracts and acceptance criteria from an approved design | After the design is approved, before implementation (`/al-spec-create`) |
| `@AL Implementation Specialist` | Developer: implements, debugs, quick adjustments | LOW complexity, bug fixes, direct changes |
| `@AL Development Conductor` | Conductor: orchestrates TDD implementation with subagents | MEDIUM/HIGH complexity after architecture is defined |
| `@AL Pre-Sales & Project Estimation Specialist` | Pre-sales: estimation, scoping, effort analysis | Project planning, customer estimation |

### On-demand specialists (3, read-only on code)

| Agent | Role |
|-------|------|
| `@AL Triage` | Reactive diagnosis: reproduce, root-cause and recommend a minimal fix |
| `@Dredd` | Independent audit with an advisory verdict |
| `@AL Developer Reviewer` | Independent review of a direct Developer increment |

`@AL Agent Builder` is an optional agent for Business Central agents built with the Agent SDK.

### Subagents (4 internal - launched by Architect, Spec Agent or Conductor)

| Subagent | Role |
|----------|------|
| `AL Planning Subagent` | Research and context gathering (BC objects, events, patterns) |
| `AL Implementation Subagent` | TDD-only implementation: tests FIRST, code SECOND (RED-GREEN-REFACTOR) |
| `AL Code Review Subagent` | Code review against spec + architecture |
| `AL Knowledge Consultant` | One BCQuality knowledge consultation per question |

### Composable Skills (16)

Skills are domain knowledge modules loaded on demand by agents. Each skill provides
patterns, rules, and AL-specific guidance for its domain.

**Required (8)**:
- `skill-api` — API page patterns, OData, custom endpoints
- `skill-copilot` — Copilot capability, PromptDialog, AI Test Toolkit
- `skill-debug` — Systematic diagnosis, CPU profiling, telemetry
- `skill-performance` — SetLoadFields, early filtering, set-based operations
- `skill-events` — Event subscribers/publishers, integration events
- `skill-permissions` — Permission sets, entitlements, GDPR
- `skill-testing` — AL-Go test structure, Given/When/Then, Library Assert
- `skill-al-review-pipeline` — Shared review procedure for Developer Reviewer, the review subagent and Dredd

**Recommended (4)**:
- `skill-migrate` — BC version upgrade, deprecated API handling
- `skill-pages` — Page Designer, UX patterns, page types
- `skill-translate` — XLF translation management
- `skill-estimation` — Effort estimation, complexity assessment

**Optional (4)**:
- `skill-agent-toolkit`, `skill-agent-task-patterns`, `skill-agent-instructions` — Business Central Agent SDK
- `skill-contribution-assistant` — Guided contribution to the collection

### Workflows (10)

Invoke as a slash command, `/[workflow-name]`:

| Workflow | Purpose |
|----------|---------|
| `al-spec-create` | Generate technical blueprint (spec.md) from requirement |
| `al-build` | Build, package, publish operations |
| `al-pr-prepare` | Pull request preparation |
| `al-memory-create` | Generate/update memory.md for session continuity |
| `al-context-create` | Generate project context for AI assistants |
| `al-initialize` | Environment and workspace setup |
| `al-agent-create` | Create a coded Business Central agent (optional BC Agent Builder) |
| `al-agent-task` | Generate Agent SDK task integration code (optional) |
| `al-agent-instructions` | Write agent instructions (optional) |
| `al-agent-test` | Generate Agent SDK test codeunits (optional) |

### Instructions (9 scoped rules + the Copilot entrypoint)

Coding standards that apply automatically via `applyTo` patterns:

- `al-guidelines` — Master hub referencing all patterns
- `al-code-style` — Feature-based organization, 2-space indentation, XML docs
- `al-naming-conventions` — PascalCase, 26-character limits
- `al-performance` — Early filtering, SetLoadFields, temporary tables
- `al-error-handling` — TryFunctions, error labels, telemetry
- `al-events` — Event subscriber/publisher patterns
- `al-testing` — AL-Go structure, Given/When/Then
- `al-security` — Least privilege, SecretText, secure events and outbound calls
- `al-agent-toolkit` — Agent SDK contracts (optional)
- `copilot-instructions` — Always-on entrypoint, not a scoped rule

## Development Flow

### By Complexity

```
LOW complexity:
  al-spec-create -> @AL Implementation Specialist

MEDIUM/HIGH complexity:
  @AL Architecture & Design Specialist -> al-spec-create -> @AL Development Conductor
```

### TDD Orchestration (conductor)

The conductor enforces Test-Driven Development through subagents:

1. **Planning**: planning-subagent researches context (BC objects, events, patterns)
2. **HITL Gate**: Human approves plan
3. **Implementation** (per phase):
   a. implement-subagent writes tests FIRST (RED)
   b. implement-subagent writes code to pass tests (GREEN)
   c. implement-subagent refactors (REFACTOR)
4. **Review**: review-subagent validates against spec + architecture
5. **HITL Gate**: Human approves each phase
6. **Completion**: Memory updated, delivery documented

### Contracts per Requirement

Each requirement produces a contract set in `.github/plans/{req_name}/`; `memory.md` stays in `.github/plans/`:

- `{req_name}.spec.md` — Technical blueprint (from al-spec-create)
- `{req_name}.architecture.md` — Solution design (from @AL Architecture & Design Specialist)
- `{req_name}.test-plan.md` — Test strategy
- `memory.md` — Global context across sessions (append-only)

### Skills Evidencing

Agents declare which skills they load and which specific patterns they applied:
```
Skills loaded: [skill-events, skill-testing, skill-performance]
Patterns applied:
  - skill-events: OnAfterPostSalesDoc integration event
  - skill-testing: Given/When/Then with Library Assert
  - skill-performance: SetLoadFields on Customer table
```

## Quick Start

1. Install the extension
2. Open your AL project
3. Run: `AL Collection: Install Toolkit to Workspace`
4. Validate: `node .github/tools/aldc-validate/index.js --config aldc.yaml`
5. Start with: `/al-spec-create` with your requirement
6. Follow the guided flow

### For LOW Complexity

```
/al-spec-create
-> generates {req_name}.spec.md
-> @AL Implementation Specialist implements directly
```

### For MEDIUM/HIGH Complexity

```
@AL Architecture & Design Specialist -> designs architecture
-> /al-spec-create -> generates spec
-> @AL Development Conductor -> TDD orchestration with subagents
-> Each phase: RED -> GREEN -> REFACTOR -> HITL approval
-> Final review + delivery
```

## Common Workflows

### Building a New Feature (MEDIUM)

```
1. @AL Architecture & Design Specialist -> Design solution architecture
2. /al-spec-create -> Generate technical spec
3. @AL Development Conductor -> TDD orchestration
   - Planning: context research
   - Phase 1-N: implement + review per phase
   - Each phase: HITL gate
4. /al-pr-prepare -> Prepare PR
```

### Quick Fix (LOW)

```
1. @AL Implementation Specialist -> Direct implementation
2. /al-build -> Deploy
```

### Debugging

```
1. @AL Implementation Specialist with skill-debug -> Systematic diagnosis
2. Fix implementation
3. /al-build -> Deploy
```

## Validation

Run the ALDC validator to check compliance:

```bash
node .github/tools/aldc-validate/index.js --config aldc.yaml
```

Expected: a final line starting with `ALDC Core v1.1 COMPLIANT`. The validator's banner still reads v1.1; it checks the Core v1.2 manifest in `aldc.yaml`.

## Installed Structure

After installation, your workspace has:

```
.github/
  agents/          (13 agents, 4 of them internal subagents)
  instructions/    (9 scoped rules + Copilot entrypoint)
  skills/          (16 knowledge skills + 10 workflow skills)
  plans/
    memory.md      (global memory template)
  docs/
    schema/        (aldc.schema.json)
    templates/     (7 document templates)
  tools/
    aldc-validate/ (compliance validator)
aldc.yaml          (configuration at workspace root)
```

## Framework Compliance

**Framework**: ALDC Core v1.2
**Version**: 5.3.0
**Agents**: 13 (5 core + 3 on-demand + 4 internal subagents + 1 optional)
**Skills**: 16 knowledge skills (8 required + 4 recommended + 4 optional)
**Workflows**: 10 (6 core + 4 optional BC Agent Builder)
**Instructions**: 9 scoped rules + Copilot entrypoint
**Templates**: 7
**Status**: ALDC Core v1.2 Compliant

## Requirements

- Visual Studio Code with AL Language extension
- GitHub Copilot enabled
- Business Central development environment (sandbox recommended)

## Resources

- [ALDC Core Specification v1.2](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/docs/framework/ALDC-Core-Spec-v1.2.md)
- [Repository](https://github.com/javiarmesto/ALDC-AL-Development-Collection)
