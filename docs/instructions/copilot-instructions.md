# :material-robot-outline: Copilot Integration

<div class="agent-card" markdown>

| | |
|---|---|
| **File** | `copilot-instructions.md` |
| **Applies to** | Workspace-wide |
| **Activation** | Always active |
| **Role** | Master workspace instructions |

</div>

---

## Purpose

Workspace-level instructions for GitHub Copilot. Defines the ALDC Core v1.1 architecture, agent routing, workflow invocation, skill loading, and complexity-based task routing.

## What it configures

| Section | What it does |
|---|---|
| **Core principles** | Extension-only, HITL, TDD/spec-driven, least privilege |
| **Agent routing** | Maps intent → agent (architect, developer, conductor, presales) |
| **Workflow catalog** | 6 workflows: `al-spec.create`, `al-build`, `al-pr-prepare`, etc. |
| **Skills catalog** | 11 composable knowledge modules loaded on-demand |
| **Complexity routing** | LOW → spec+developer; MEDIUM/HIGH → architect+spec+conductor |
| **Plans structure** | `.github/plans/{req}/` with spec, architecture, test-plan files |
| **Auto-instructions** | Lists which `.instructions.md` files activate and when |

## Complexity routing

| Level | Scope | Route |
|---|---|---|
| **LOW** | Single phase, no integrations | `al-spec.create` → Implementation Specialist |
| **MEDIUM** | 2-3 areas, internal integrations | Architect → `al-spec.create` → Conductor |
| **HIGH** | 4+ phases, external integrations | Architect → `al-spec.create` → Conductor |

## Best practices for Copilot

1. **Start with context** — Describe what you're building, not just "create a workflow"
2. **Use the right tool** — Agents for strategy, workflows for tactical tasks
3. **Trust auto-instructions** — Naming, performance, and error patterns apply automatically
4. **Review generated code** — Verify compliance, test in sandbox, check security

---

<small>Source: [`instructions/copilot-instructions.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/instructions/copilot-instructions.md)</small>