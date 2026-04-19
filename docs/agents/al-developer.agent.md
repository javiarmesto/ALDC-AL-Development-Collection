# :material-code-braces: AL Implementation Specialist

<div class="agent-card" markdown>

| | |
|---|---|
| **Agent ID** | `al-developer` |
| **Model** | Claude Sonnet 4.5 |
| **Type** | User-facing · Tactical |
| **Invocation** | `@AL Implementation Specialist` |

</div>

---

## Purpose

Tactical implementation specialist that **executes and codes** Business Central AL extensions. Creates files, runs builds, fixes bugs, and validates with tests. Follows established patterns — does not make architectural decisions.

## When to use

- Implementing features from an existing spec
- Bug fixes and debugging
- Code refactoring within established patterns
- Building tables, pages, codeunits, reports
- Running builds and tests
- LOW complexity features (single phase, no integrations)

## Key capabilities

| Capability | Detail |
|---|---|
| **Create / edit AL objects** | Tables, pages, codeunits, reports, queries, enums |
| **Extensions** | TableExtension, PageExtension, EnumExtension |
| **Events** | Event subscribers and publishers |
| **Build & test** | `al_build`, `al_package`, `al_publish`, run tests |
| **Skill loading** | `skill-debug`, `skill-api`, `skill-copilot`, `skill-performance`, `skill-testing` on demand |

## Stopping rules

| Condition | Action |
|---|---|
| Architectural decision needed | Delegate to `@al-architect` |
| Complex multi-phase TDD needed | Delegate to `@al-conductor` |
| Build fails 3+ times | Pause for user guidance |

## Handoffs

| Destination | When |
|---|---|
| **AL Architecture & Design Specialist** | Strategic design decisions required |
| **AL Development Conductor** | Multi-phase TDD orchestration needed |

## Workflow position

```
al-spec.create (SPEC) → al-developer (IMPLEMENT)     # LOW complexity
al-conductor → al-developer (via subagent)             # MEDIUM/HIGH
```

---

<small>Source: [`agents/al-developer.agent.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/agents/al-developer.agent.md)</small>