# Getting Started with ALDC v3.2.0

Welcome to the **AL Development Collection** (ALDC Core v1.1).
This guide helps you start developing Business Central extensions
with structured, contract-driven, TDD-orchestrated workflows.

## What was installed

Your workspace now has the ALDC toolkit in `.github/`:

```text
.github/
  agents/          4 public agents + 3 internal subagents
  instructions/    9 auto-applied coding standards
  prompts/         6 workflows
  skills/          11 composable skills (7 required + 4 recommended)
  plans/
    memory.md      Global memory (append-only, cross-session context)
  docs/
    schema/        aldc.schema.json (configuration schema)
    templates/     7 document templates (spec, architecture, test-plan, etc.)
  tools/
    aldc-validate/ Compliance validator
aldc.yaml          Configuration file (workspace root)
```

## Validate your installation

Run the ALDC validator to confirm everything is in place:

```bash
cd your-workspace
node .github/tools/aldc-validate/index.js --config aldc.yaml
```

Expected output: `ALDC Core v1.1 COMPLIANT (0 warning(s))`

## Your first requirement

### Step 1: Create a spec

```text
@workspace use al-spec.create

"I need to add a Loyalty Points field to the Customer table,
incremented on each posted sales order."
```

This generates `{req_name}.spec.md` in `.github/plans/`.

### Step 2: Choose your path

**LOW complexity** (simple field, single table extension):

```text
@AL Implementation Specialist implement the spec
```

**MEDIUM/HIGH complexity** (multi-table, events, business logic):

```text
@AL Architecture & Design Specialist design the architecture first
```

Then:

```text
@AL Development Conductor orchestrate TDD implementation
```

### Step 3: Follow the flow

```text
LOW:      al-spec.create -> @AL Implementation Specialist
MED/HIGH: @AL Architecture & Design Specialist -> al-spec.create -> @AL Development Conductor
```

The conductor enforces TDD through subagents:

1. Planning subagent researches context
2. You approve the plan (HITL gate)
3. Implement subagent: tests FIRST, code SECOND (RED-GREEN-REFACTOR)
4. Review subagent validates against spec + architecture
5. You approve each phase (HITL gate)

## Available agents

| Agent | What it does |
|-------|-------------|
| `@AL Architecture & Design Specialist` | Designs solutions, decomposes requirements, creates architecture docs |
| `@AL Implementation Specialist` | Implements code, debugs, makes quick adjustments |
| `@AL Development Conductor` | Orchestrates multi-phase TDD with subagents |
| `@AL Pre-Sales & Project Estimation Specialist` | Estimates effort, scopes projects |

## Available workflows

| Workflow | Invoke with |
|----------|-------------|
| Create spec | `@workspace use al-spec.create` |
| Build/deploy | `@workspace use al-build` |
| Prepare PR | `@workspace use al-pr-prepare` |
| Update memory | `@workspace use al-memory.create` |
| Generate context | `@workspace use al-context.create` |
| Initialize project | `@workspace use al-initialize` |

## Composable skills

Skills are domain knowledge loaded on demand by agents.
They provide AL-specific patterns and rules:

- **skill-api**: API pages, OData, custom endpoints
- **skill-copilot**: Copilot capability, PromptDialog
- **skill-debug**: Diagnosis, CPU profiling, telemetry
- **skill-performance**: SetLoadFields, early filtering
- **skill-events**: Event subscribers/publishers
- **skill-permissions**: Permission sets, GDPR
- **skill-testing**: AL-Go tests, Library Assert
- **skill-migrate**: BC version upgrades
- **skill-pages**: Page Designer, UX patterns
- **skill-translate**: XLF translation
- **skill-estimation**: Effort estimation

## Contracts and memory

Each requirement generates a contract set in `.github/plans/`:

- `{req_name}.spec.md` - Technical blueprint
- `{req_name}.architecture.md` - Solution design
- `{req_name}.test-plan.md` - Test strategy
- `memory.md` - Global context (append-only, shared across sessions)

## Need help?

- Run validation: `node .github/tools/aldc-validate/index.js --config aldc.yaml`
- Check the [ALDC Core Spec v1.1](https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot/blob/main/docs/framework/ALDC-Core-Spec-v1.1.md)
- Report issues: [GitHub Issues](https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot/issues)
