# AL Development for Business Central

**ALDC (AL Development Collection)** framework for Microsoft Dynamics 365 Business Central.
Spec-first, architecture-driven, TDD-orchestrated development with GitHub Copilot agents
and human-in-the-loop gates.

**ALDC Core**: v1.1 | **Skills-based modularization with preserved orchestration**

## Architecture Overview

ALDC organizes development through **4 public agents**, **3 internal subagents**,
**11 composable skills**, **6 workflows**, and **9 instruction sets**, governed by
per-requirement contracts and a global memory system.

### Agents (4 public)

| Agent | Role | When to use |
|-------|------|-------------|
| `@al-architect` | Solution Architect: designs solutions, information flows, technical decisions, requirement decomposition | New features, architecture decisions, MEDIUM/HIGH complexity |
| `@al-developer` | Developer: implements, debugs, quick adjustments | LOW complexity, bug fixes, direct changes |
| `@al-conductor` | Conductor: orchestrates TDD implementation with subagents | MEDIUM/HIGH complexity after architecture is defined |
| `@al-presales` | Pre-sales: estimation, scoping, effort analysis | Project planning, customer estimation |

### Subagents (3 internal - invoked by conductor)

| Subagent | Role |
|----------|------|
| `al-planning-subagent` | Research and context gathering (BC objects, events, patterns) |
| `al-implement-subagent` | TDD-only implementation: tests FIRST, code SECOND (RED-GREEN-REFACTOR) |
| `al-review-subagent` | Code review against spec + architecture |

### Composable Skills (11)

Skills are domain knowledge modules loaded on demand by agents. Each skill provides
patterns, rules, and AL-specific guidance for its domain.

**Required (7)**:
- `skill-api` — API page patterns, OData, custom endpoints
- `skill-copilot` — Copilot capability, PromptDialog, AI Test Toolkit
- `skill-debug` — Systematic diagnosis, CPU profiling, telemetry
- `skill-performance` — SetLoadFields, early filtering, set-based operations
- `skill-events` — Event subscribers/publishers, integration events
- `skill-permissions` — Permission sets, entitlements, GDPR
- `skill-testing` — AL-Go test structure, Given/When/Then, Library Assert

**Recommended (4)**:
- `skill-migrate` — BC version upgrade, deprecated API handling
- `skill-pages` — Page Designer, UX patterns, page types
- `skill-translate` — XLF translation management
- `skill-estimation` — Effort estimation, complexity assessment

### Workflows (6)

Invoke with `@workspace use [workflow-name]`:

| Workflow | Purpose |
|----------|---------|
| `al-spec.create` | Generate technical blueprint (spec.md) from requirement |
| `al-build` | Build, package, publish operations |
| `al-pr-prepare` | Pull request preparation |
| `al-memory.create` | Generate/update memory.md for session continuity |
| `al-context.create` | Generate project context for AI assistants |
| `al-initialize` | Environment and workspace setup |

### Instructions (9 auto-applied)

Coding standards that apply automatically via `applyTo` patterns:

- `al-guidelines` — Master hub referencing all patterns
- `al-code-style` — Feature-based organization, 2-space indentation, XML docs
- `al-naming-conventions` — PascalCase, 26-character limits
- `al-performance` — Early filtering, SetLoadFields, temporary tables
- `al-error-handling` — TryFunctions, error labels, telemetry
- `al-events` — Event subscriber/publisher patterns
- `al-testing` — AL-Go structure, Given/When/Then
- `copilot-instructions` — Master coordination document (auto-loaded)
- `index` — Instructions catalog

## Development Flow

### By Complexity

```
LOW complexity:
  al-spec.create -> @al-developer

MEDIUM/HIGH complexity:
  @al-architect -> al-spec.create -> @al-conductor
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

Each requirement produces a contract set in `.github/plans/`:

- `{req_name}.spec.md` — Technical blueprint (from al-spec.create)
- `{req_name}.architecture.md` — Solution design (from @al-architect)
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
5. Start with: `@workspace use al-spec.create` with your requirement
6. Follow the guided flow

### For LOW Complexity

```
@workspace use al-spec.create
-> generates {req_name}.spec.md
-> @al-developer implements directly
```

### For MEDIUM/HIGH Complexity

```
@al-architect -> designs architecture
-> @workspace use al-spec.create -> generates spec
-> @al-conductor -> TDD orchestration with subagents
-> Each phase: RED -> GREEN -> REFACTOR -> HITL approval
-> Final review + delivery
```

## Common Workflows

### Building a New Feature (MEDIUM)

```
1. @al-architect -> Design solution architecture
2. @workspace use al-spec.create -> Generate technical spec
3. @al-conductor -> TDD orchestration
   - Planning: context research
   - Phase 1-N: implement + review per phase
   - Each phase: HITL gate
4. @workspace use al-pr-prepare -> Prepare PR
```

### Quick Fix (LOW)

```
1. @al-developer -> Direct implementation
2. @workspace use al-build -> Deploy
```

### Debugging

```
1. @al-developer with skill-debug -> Systematic diagnosis
2. Fix implementation
3. @workspace use al-build -> Deploy
```

## Validation

Run the ALDC validator to check compliance:

```bash
node .github/tools/aldc-validate/index.js --config aldc.yaml
```

Expected: `ALDC Core v1.1 COMPLIANT`

## Installed Structure

After installation, your workspace has:

```
.github/
  agents/          (4 public + 3 subagents)
  instructions/    (9 files)
  prompts/         (6 workflows)
  skills/          (11 composable skills)
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

**Framework**: ALDC Core v1.1
**Version**: 3.2.0
**Agents**: 4 public + 3 internal subagents
**Skills**: 11 composable (7 required + 4 recommended)
**Workflows**: 6
**Instructions**: 9
**Templates**: 7
**Status**: ALDC Core v1.1 Compliant

## Requirements

- Visual Studio Code with AL Language extension
- GitHub Copilot enabled
- Business Central development environment (sandbox recommended)

## Resources

- [ALDC Core Specification v1.1](https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot/blob/main/docs/framework/ALDC-Core-Spec-v1.1.md)
- [Repository](https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot)
