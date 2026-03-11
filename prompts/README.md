# AL Development Workflows

This directory contains agentic workflows for specific AL development tasks. These workflows are designed to be invoked via `@workspace use [workflow-name]` in GitHub Copilot Chat.

## Quick Decision Guide

### When to Use Workflows vs Orchestra

```
Simple task (1-2 files, quick operation)?
  ├─ YES → Use standalone workflow
  └─ NO → Continue...

Need TDD with automatic tests?
  ├─ YES → Use al-conductor (Orchestra)
  └─ NO → Continue...

Complex feature (3+ AL objects)?
  ├─ YES → Use al-conductor (Orchestra)
  └─ NO → Use standalone workflow

Need quality gates and documentation trail?
  ├─ YES → Use al-conductor (Orchestra)
  └─ NO → Use standalone workflow
```

**Rule of Thumb**: If the task requires multiple commits and thorough testing, use `al-conductor`. Otherwise, use direct workflows.

---

## Workflow Categories

### 🚀 Environment & Setup

Use these **before** starting development or when setting up new environments.

| Workflow | Description | When to Use | Orchestra Prerequisite? |
|----------|-------------|-------------|------------------------|
| **[al-initialize](./al-initialize.prompt.md)** | Setup AL environment, install extensions, configure workspace | First time setup, new workspace | ✅ Yes |
| **[al-context.create](./al-context.create.prompt.md)** | Generate project context.md for AI assistants | After initialization, before planning | ✅ Recommended |
| **[al-memory.create](./al-memory.create.prompt.md)** | Create session memory.md for continuity | Between development sessions | ⚠️ Optional |
| **[al-spec.create](./al-spec.create.prompt.md)** | Create feature specifications | Before implementing features | ✅ Recommended |

**Typical Setup Flow**: 
```
al-initialize → al-context.create → al-spec.create → al-conductor
```

---

### 🔨 Build & Deploy

Use these for **standalone deployment** tasks. Orchestra uses build tools internally via `AL Implementation Subagent`.

| Workflow | Description | When to Use Directly | When Orchestra Handles It |
|----------|-------------|---------------------|--------------------------|
| **[al-build](./al-build.prompt.md)** | Build, package, and deploy extensions to Dev/Test/Prod | Manual deployments, emergency hotfixes, production releases | Automatic during TDD implementation phases |

**When to use directly**: Manual deployments, production releases requiring human approval gates.

**When Orchestra handles it**: During development (automatic builds after each code change to verify tests).

---

### 🐛 Diagnostics & Debugging

Use these for **troubleshooting** after development or when investigating issues.

| Workflow | Description | Use Case | Relationship with Orchestra |
|----------|-------------|----------|----------------------------|
| **[al-diagnose](./al-diagnose.prompt.md)** | Debug runtime issues, attach debugger, snapshot debugging | Investigating bugs, runtime errors | Use AFTER Orchestra if tests fail or issues found |
| **[al-performance](./al-performance.prompt.md)** | Deep performance profiling with CPU profiles | Slow operations, optimization | Can be a phase in al-conductor plan |
| **[al-performance.triage](./al-performance.triage.prompt.md)** | Quick performance analysis without profiling | Fast performance check | Standalone diagnostic |

**Typical Debug Flow**: 
```
al-conductor implements → Tests fail → al-diagnose investigates → Fix identified → Continue Orchestra
```

---

### 🎨 Feature Implementation

These workflows can be **invoked directly** for simple tasks or **become phases** in `al-conductor` plans for complex features.

| Workflow | Description | Simple Use (Direct) | Complex Use (Orchestra Phase) |
|----------|-------------|--------------------|-----------------------------|
| **[al-events](./al-events.prompt.md)** | Create/manage event subscribers and publishers | Add 1 event subscriber | Design complete event architecture with tests |
| **[al-pages](./al-pages.prompt.md)** | Create/modify AL pages and page extensions | Add 1 field to existing page | Multi-page feature with actions and tests |
| **[al-permissions](./al-permissions.prompt.md)** | Generate permission sets for extension objects | Generate one permission set | Final phase in Orchestra plan for complete feature |
| **[al-translate](./al-translate.prompt.md)** | Add translations and localization | Quick translation of labels | i18n for complex multi-object feature |
| **[al-migrate](./al-migrate.prompt.md)** | Data migration and upgrade codeunits | ⚠️ Complex - Consider Orchestra | Migration logic with comprehensive tests |

**Decision Pattern**:
- **One object, no tests needed** → Use workflow directly
- **Related set of objects with tests** → Use `al-conductor` (workflow patterns become phases)

**Example**:
```
Simple: "Add email validation to Customer" 
  → @workspace use al-events (create one subscriber)

Complex: "Add approval workflow with email notifications"
  → Use al-conductor mode (multi-phase plan using al-events + al-pages patterns)
```

---

### 🤖 AI/Copilot Features

Specialized workflows for building **Business Central Copilot features**. These are often complex enough to benefit from Orchestra.

| Workflow | Description | Standalone? | Orchestra Phase? |
|----------|-------------|-------------|-----------------|
| **[al-copilot-capability](./al-copilot-capability.prompt.md)** | Register Copilot capability (enum extension, install codeunit) | ✅ Simple registration | ⚠️ If part of larger AI feature |
| **[al-copilot-promptdialog](./al-copilot-promptdialog.prompt.md)** | Create PromptDialog pages for AI interactions | ✅ Single dialog page | ⚠️ If multiple dialogs + backend logic |
| **[al-copilot-generate](./al-copilot-generate.prompt.md)** | Generate complete Copilot features end-to-end | ❌ Too complex | ✅ Use al-conductor instead |
| **[al-copilot-test](./al-copilot-test.prompt.md)** | Test Copilot features with AI Test Toolkit | ✅ Standalone testing | ✅ Can be test phase in Orchestra plan |

**Recommendation**: For production Copilot features involving multiple objects, use `Use al-conductor mode` with these workflows as reference for individual phases.

**Example Orchestra Plan for Copilot Feature**:
```
Phase 1: Register capability (al-copilot-capability patterns)
Phase 2: Create PromptDialog (al-copilot-promptdialog patterns)
Phase 3: Implement backend logic with tests
Phase 4: Test with AI Test Toolkit (al-copilot-test patterns)
```

---

### 📋 Documentation & PR Preparation

Use these **after** development for documentation and pull request preparation.

| Workflow | Description | Use After Orchestra? | Purpose |
|----------|-------------|---------------------|---------|
| **[al-pr-prepare](./al-pr-prepare.prompt.md)** | Prepare pull request with description, checklist, changes summary | ✅ Yes - After all commits | Generate PR description from commits |
| **[al-context.create](./al-context.create.prompt.md)** | Update project context documentation | ✅ Yes - Reflect new features | Keep context current for future AI sessions |
| **[al-memory.create](./al-memory.create.prompt.md)** | Update session memory with decisions made | ✅ Yes - Document architectural decisions | Preserve knowledge between sessions |

**Typical Post-Development Flow**: 
```
al-conductor completes → All phases committed → al-pr-prepare → Create GitHub PR → al-context.create (update docs)
```

---

## Integration with al-conductor Orchestra

The **al-conductor** multi-agent system leverages these workflows as building blocks for structured TDD implementation.

### How Orchestra Uses Workflows

**1. Planning Phase** (`AL Planning Subagent`):
- Uses patterns from `al-events`, `al-pages`, `al-permissions` to understand existing codebase
- References `al-context.create` output if available for project context
- Identifies AL objects and patterns similar to those in workflows

**2. Implementation Phase** (`AL Implementation Subagent`):
- Applies implementation patterns from:
  - `al-events.prompt.md` → Event subscriber implementation patterns
  - `al-pages.prompt.md` → Page creation and extension patterns
  - `al-permissions.prompt.md` → Permission set generation patterns
  - `al-copilot-*.prompt.md` → AI feature implementation patterns
- Calls build tools from `al-build` workflow
- Follows TDD: Tests first (RED) → Code (GREEN) → Refactor

**3. Review Phase** (`AL Code Review Subagent`):
- Validates against patterns documented in workflows
- Checks performance patterns from `al-performance` workflow
- Ensures event-driven architecture from `al-events` patterns
- Verifies AL best practices compliance

### Example: Orchestra Plan Leveraging Workflows

```markdown
Plan: Add Sales Approval Workflow with Email Notifications

AL Context:
- Base Objects: Sales Header (Table 36), Sales-Post (Codeunit 80)
- Extension Pattern: Event subscribers, TableExtension, PageExtension
- AL-Go Structure: /app and /test separation

Phases:

Phase 1: Setup & Dependencies (al-initialize patterns)
- Download symbols for Base Application
- Verify SMTP configuration exists
- Test: Symbols available ✓

Phase 2: Event Architecture (al-events patterns)
- Publish OnBeforePostSalesDoc integration event
- Subscribe to Sales Header OnAfterValidateEvent
- Test: Events fire correctly ✓

Phase 3: Approval Table & Logic (custom implementation)
- Create Table "Approval Entry"
- Create Codeunit "Approval Management"
- Test: Approval requests create entries ✓

Phase 4: Approval UI (al-pages patterns)
- Create Page "Approval Requests" (List)
- Extend Page "Sales Order" with Approval Status
- Test: Pages display approval data ✓

Phase 5: Email Integration (custom + error handling)
- Implement SMTP email sending with TryFunction
- Add error handling and telemetry
- Test: Emails send on approval/rejection ✓

Phase 6: Permissions (al-permissions patterns)
- Generate permission sets for Approval objects
- Test: Users can access with correct permissions ✓

Phase 7: Performance Optimization (al-performance patterns)
- Add SetLoadFields for Sales Header queries
- Add early filtering with SetRange
- Test: No performance regressions ✓

Phase 8: Integration Tests
- Test complete workflow: Order → Approval → Email → Post
- Test error cases: Invalid email, no approver
- Test: All scenarios pass ✓
```

In this example:
- **Phase 1** uses `al-initialize` patterns for setup
- **Phase 2** uses `al-events` patterns for event architecture
- **Phases 4** uses `al-pages` patterns for UI
- **Phase 6** uses `al-permissions` patterns for security
- **Phase 7** uses `al-performance` patterns for optimization
- **Phases 3, 5, 8** are custom implementation with TDD

---

## Workflow Reference Table

Quick reference for all available workflows:

| Workflow | Category | Complexity | TDD Recommended? | Orchestra Compatible? |
|----------|----------|------------|------------------|----------------------|
| al-initialize | Setup | Simple | No | Prerequisite |
| al-context.create | Documentation | Simple | No | Recommended before |
| al-memory.create | Documentation | Simple | No | Optional |
| al-spec.create | Planning | Simple | No | Recommended before |
| al-build | Build/Deploy | Simple | No | Used internally |
| al-diagnose | Debugging | Moderate | No | Use after |
| al-performance | Optimization | Moderate | Yes | Can be phase |
| al-performance.triage | Optimization | Simple | No | Standalone |
| al-events | Implementation | Simple-Moderate | Yes | Can be phase |
| al-pages | Implementation | Simple-Moderate | Yes | Can be phase |
| al-permissions | Security | Simple | No | Often final phase |
| al-translate | i18n | Simple | No | Can be phase |
| al-migrate | Migration | Complex | Yes | Recommended |
| al-copilot-capability | AI Feature | Moderate | Yes | Can be phase |
| al-copilot-promptdialog | AI Feature | Moderate | Yes | Can be phase |
| al-copilot-generate | AI Feature | Complex | Yes | Use al-conductor |
| al-copilot-test | Testing | Moderate | N/A | Can be phase |
| al-pr-prepare | Documentation | Simple | No | Use after |

---

## Best Practices

### When to Use Workflows Directly

✅ **DO use workflows directly when:**
- Task is simple and focused (1-2 files)
- No tests are needed (setup, deployment, documentation)
- Quick one-off operations (build, diagnose, translate)
- Exploratory work or prototyping

### When to Use al-conductor (Orchestra)

✅ **DO use al-conductor when:**
- Complex features requiring 3+ AL objects
- Need comprehensive test coverage with TDD
- Production features requiring code review
- Features with multiple related changes
- Need documentation trail for team review
- Learning AL patterns through guided implementation

### Combining Workflows with Orchestra

```
Pre-Development:
1. al-initialize (setup environment)
2. al-context.create (document project)
3. al-spec.create (define feature)

Development:
4. al-conductor (implement with TDD)
   ├─ Uses al-events patterns in Phase 2
   ├─ Uses al-pages patterns in Phase 3
   └─ Uses al-permissions patterns in Phase 5

Post-Development:
5. al-diagnose (if issues found)
6. al-performance (if optimization needed)
7. al-pr-prepare (create pull request)
8. al-context.create (update documentation)
```

---

## Getting Help

- **For workflow usage**: Check individual workflow files (`.prompt.md`)
- **For Orchestra**: See [`agents/orchestration/README.md`](../agents/orchestration/README.md)
- **For AL best practices**: See [`instructions/al-guidelines.instructions.md`](../instructions/al-guidelines.instructions.md)
- **For collection overview**: See [main README.md](../README.md)

---

**Framework**: [AI Native-Instructions Architecture](https://danielmeppiel.github.io/awesome-ai-native/)  
**Collection**: AL Development Collection v2.6.0  
**Total Workflows**: 18  
**Orchestra Agents**: 4 (Conductor + 3 Subagents)
