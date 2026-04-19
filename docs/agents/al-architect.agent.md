# :material-compass-outline: AL Architecture & Design Specialist

<div class="agent-card" markdown>

| | |
|---|---|
| **Agent ID** | `al-architect` |
| **Model** | Claude Sonnet 4.5 |
| **Type** | User-facing · Strategic |
| **Invocation** | `@AL Architecture & Design Specialist` |

</div>

---

## Purpose

Designs robust, scalable, and maintainable architectures for Business Central AL extensions. Evaluates patterns, data models, integration strategies, and makes strategic technical decisions **before** any code is written.

## When to use

- Need strategic architectural decisions (patterns, integrations, data models)
- Exploring multiple design options interactively
- Reviewing the architecture of an existing solution
- Planning major refactoring or redesign
- Designing for scalability, security, or integration

## Key capabilities

| Capability | Detail |
|---|---|
| **Solution design** | Data models, table relationships, page architecture |
| **Pattern evaluation** | Events vs extensions, publisher/subscriber, CQRS |
| **Integration strategy** | API design, external systems, webhooks |
| **Skill loading** | Loads `skill-api`, `skill-events`, `skill-copilot`, `skill-performance` on demand |
| **Decomposition** | Detects when a requirement needs multiple specs |

## Outputs

- `{req_name}.architecture.md` — Architecture decision document
- Mermaid diagrams (data flow, component, sequence)
- Pattern recommendation with tradeoff analysis

## Handoffs

| Destination | When |
|---|---|
| **AL Development Conductor** | Architecture approved → implement with TDD orchestration |
| **AL Implementation Specialist** | LOW complexity → direct implementation |

## Workflow position

```
al-architect (DESIGN) → al-spec.create (SPEC) → al-conductor (IMPLEMENT)
```

!!! tip "Architect vs Planning Subagent"
    **al-architect** is a strategic consultant that interacts with you and makes decisions.
    **AL Planning Subagent** is a tactical researcher called internally by the Conductor to gather data.

---

<small>Source: [`agents/al-architect.agent.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/agents/al-architect.agent.md)</small>