<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# GitHub Copilot Instructions for AL Development

## Overview

This workspace contains AL (Application Language) code for Microsoft Dynamics 365 Business Central. It uses the **ALDC Core v1.1** skills-based architecture: **4 agents + 11 skills + 6 workflows + 7 instructions**.

## Core Principles

These principles apply to ALL work in this repository:

- **Extension-only development** — Never modify base application objects. Use tableextensions, pageextensions, event subscribers.
- **Human-in-the-Loop (HITL)** — All critical decisions require user confirmation before proceeding.
- **TDD / spec-driven** — Features follow the flow: `spec.create → architecture → test-plan → implementation → review`.
- **Least privilege** — Generate only the minimum permissions required. Use XLIFF for all user-facing strings.

## Agent Routing

Choose the right agent for your task:

| Intent | Agent | What it does |
|--------|-------|-------------|
| Designing, analyzing architecture, strategic decisions? | `@al-architect` | Solution design, data modeling, integration strategy |
| Implementing, coding, debugging, fixing? | `@al-developer` | Tactical implementation with full AL MCP tools |
| Building a feature with TDD orchestration (plan → implement → review → commit)? | `@al-conductor` | Orchestrates planning, implementation, and review subagents |
| Estimating a project, sizing, proposals? | `@al-presales` | PERT estimation, SWOT analysis, cost breakdown |

### Quick routing guide

```
New feature (MEDIUM/HIGH)? → @al-architect → al-spec.create → @al-conductor
New feature (LOW)?         → al-spec.create → @al-developer
Bug fix / debugging?       → @al-developer
Architecture review?       → @al-architect
Full TDD cycle?            → @al-conductor
Project estimation?        → @al-presales
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

## Skills Evidencing

Agents MUST declare which skills they loaded and which patterns they applied:

- **al-architect** → `> **Skills applied**: skill-api, skill-events` at top of architecture.md
- **al-developer** → `> **Skills loaded**: skill-debug (root cause analysis)` at start of response
- **al-implement-subagent** → `### Skills Loaded` section in Phase Summary returned to Conductor
- **al-review-subagent** → `Skills Compliance Check` checklist verifying patterns were applied
- **al-conductor** → `Skills Applied in This Phase` table in phase-complete.md; `Skills Utilization Summary` in plan-complete.md

This traceability chain ensures every skill application is auditable end-to-end.

## Auto-Applied Instructions

These instruction files activate automatically based on file type — no invocation needed:

### Always active on `*.al` files

- **al-guidelines.instructions.md** — Master hub referencing all guidelines
- **al-code-style.instructions.md** — 2-space indentation, PascalCase, feature-based folders
- **al-naming-conventions.instructions.md** — File naming, object names (max 26 chars + prefix), variables
- **al-performance.instructions.md** — Early filtering, SetLoadFields, temporary tables

### Context-activated

- **al-error-handling.instructions.md** — TryFunctions, error labels, telemetry (activates when handling errors)
- **al-events.instructions.md** — Event subscriber patterns, handler suffix (activates when working with events)
- **al-testing.instructions.md** — AL-Go structure, Given/When/Then, test libraries (activates on test files)

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

1. `@al-architect` — Designs solution, creates `.github/plans/{req_name}/{req_name}.architecture.md`
2. `@workspace use al-spec.create` — Reads architecture, generates `.github/plans/{req_name}/{req_name}.spec.md` (detailed blueprint: object IDs, procedure signatures, AL code)
3. `@al-conductor` — Reads spec + architecture from `.github/plans/{req_name}/`, orchestrates TDD: planning → implementation → review
4. `@workspace use al-pr-prepare` — Prepares PR referencing the plan

**LOW:**

1. `@workspace use al-spec.create` — Generates `.github/plans/{req_name}/{req_name}.spec.md` directly from codebase
2. `@al-developer` — Implements directly using spec as blueprint

## Complexity-Based Tool Selection

When a user provides requirements, assess complexity to route correctly:

**LOW** — Limited scope, single phase, no integrations
→ `al-spec.create` → `@al-developer` direct implementation

**MEDIUM** — 2-3 functional areas, internal integrations, conditional logic
→ `@al-architect` → `al-spec.create` → `@al-conductor` TDD orchestration

**HIGH** — Enterprise scope, 4+ phases, external integrations, complex workflows
→ `@al-architect` design first → `al-spec.create` → `@al-conductor` implement

Present the assessment and wait for user confirmation before proceeding.

## Code Generation Examples

### Table with Validation

```al
// Ask Copilot: "Create a table for customer addresses with validation"
table 50100 "Customer Address"
{
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Customer No."; Code[20])
        {
            TableRelation = Customer."No.";
            NotBlank = true;
        }
        field(2; "Address Line 1"; Text[100])
        {
            Caption = 'Address Line 1';
        }
        field(3; "City"; Text[50])
        {
            Caption = 'City';
        }
        field(4; "Post Code"; Code[20])
        {
            Caption = 'Post Code';
        }
    }

    keys
    {
        key(PK; "Customer No.")
        {
            Clustered = true;
        }
    }
}
```

**Auto-applied**: al-code-style, al-naming-conventions, al-performance

### Event Subscriber

```al
// Ask: "Create event subscriber for customer validation"
[EventSubscriber(ObjectType::Table, Database::Customer, 'OnBeforeValidateEvent', 'Email', false, false)]
local procedure ValidateCustomerEmail(var Rec: Record Customer)
begin
    if Rec.Email <> '' then
        if not Rec.Email.Contains('@') then
            Error('Email must contain @');
end;
```

**Auto-applied**: al-events.instructions.md, al-error-handling.instructions.md

## Best Practices for Copilot Interaction

### 1. Start with Context

- **Good**: "I'm building a customer approval workflow that needs to send notifications"
- **Avoid**: "Create a workflow"

### 2. Use the Right Tool

- **Strategic questions** → Use agents (`@al-architect`, `@al-developer`, etc.)
- **Tactical tasks** → Use workflows (`@workspace use al-build`)
- **Normal coding** → Let auto-applied instructions work in background

### 3. Trust the Auto-Instructions

The instruction files work automatically:
- You don't need to ask for proper naming (al-naming-conventions handles it)
- You don't need to request performance optimization (al-performance suggests it)
- Error handling patterns apply automatically (al-error-handling activates)

### 4. Review Generated Code

Always review Copilot suggestions:
- Verify compliance with project guidelines
- Test in sandbox environment
- Check security implications
- Validate performance impact

## Workspace Structure

```
ALDC-Core/
├── instructions/
│   ├── copilot-instructions.md            # This file
│   ├── al-guidelines.instructions.md      # Master hub (*.al, *.json)
│   ├── al-code-style.instructions.md      # Code formatting (*.al)
│   ├── al-naming-conventions.instructions.md
│   ├── al-performance.instructions.md
│   ├── al-error-handling.instructions.md
│   ├── al-events.instructions.md
│   └── al-testing.instructions.md         # Testing (test files)
├── agents/
│   ├── al-architect.agent.md              # Architecture & design
│   ├── al-developer.agent.md              # Tactical implementation
│   ├── al-conductor.agent.md              # TDD orchestrator
│   ├── al-presales.agent.md               # Estimation & planning
│   ├── al-planning-subagent.agent.md      # Research (internal, user-invokable: false)
│   ├── al-implement-subagent.agent.md     # TDD implementation (internal)
│   └── al-review-subagent.agent.md        # Code review (internal)
├── skills/                                # Composable knowledge modules (11)
│   ├── skill-api.md
│   ├── skill-copilot.md
│   ├── skill-debug.md
│   ├── skill-events.md
│   ├── skill-estimation.md
│   ├── skill-migrate.md
│   ├── skill-pages.md
│   ├── skill-performance.md
│   ├── skill-permissions.md
│   ├── skill-testing.md
│   └── skill-translate.md
├── prompts/                               # Workflows (6)
│   ├── al-spec.create.prompt.md
│   ├── al-build.prompt.md
│   ├── al-pr-prepare.prompt.md
│   ├── al-memory.create.prompt.md
│   ├── al-context.create.prompt.md
│   └── al-initialize.prompt.md
├── docs/
│   ├── framework/
│   │   └── ALDC-Core-Spec-v1.1.md         # Normative specification
│   └── templates/                         # Immutable templates
├── .github/plans/                         # Requirement sets & memory
├── src/                                   # Your AL code
└── app.json
```

## BC Agents Pack (Extension)

For agent development with AI Development Toolkit:
- @al-agent-builder — standalone agent builder (7-phase workflow)
- skill-agent-task-patterns — 8 SDK integration patterns
- skill-agent-instructions — instruction authoring framework
- al-agent.create / al-agent.task / al-agent.instructions / al-agent.test — workflows

Integrated mode: @al-architect + al-spec.create + @al-conductor
(architect loads skill-agent-task-patterns for design decisions)

## Reference Documentation

### Microsoft Documentation

- [AL Language Reference](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-reference-overview)
- [Business Central Development](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/)
- [VS Code Copilot Guide](https://code.visualstudio.com/docs/copilot)

### This Project's Documentation

- [ALDC Core Spec v1.1](../docs/framework/ALDC-Core-Spec-v1.1.md) — Normative specification
- [Instructions Index](index.md) — Guide to all instruction files
- [AL Guidelines](al-guidelines.instructions.md) — Master guidelines

## Troubleshooting Copilot

### No Suggestions Appearing

1. Check Copilot extension is enabled (View → Extensions)
2. Verify file type is `.al`
3. Try reloading VS Code window

### Suggestions Don't Follow Guidelines

1. Ensure instruction files are in correct locations
2. Check file glob patterns in instruction frontmatter
3. Reference specific guidelines: "Follow al-code-style patterns"

---

**Framework**: ALDC Core v1.1 (Skills-Based Architecture)
**Version**: 1.1.0
**Last Updated**: 2026-03-01
**Workspace**: AL Development for Business Central
**Primitives**: 4 agents + 3 subagents + 11 skills + 6 workflows + 7 instructions
