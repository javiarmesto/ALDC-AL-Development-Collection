# :material-magnify-scan: AL Planning Subagent

<div class="agent-card" markdown>

| | |
|---|---|
| **Agent ID** | `al-planning-subagent` |
| **Model** | Claude Sonnet 4.5 |
| **Type** | Internal · Research |
| **Invoked by** | AL Development Conductor |
| **User-invocable** | No |

</div>

---

## Purpose

AL-aware research and context gathering for Business Central development. Explores the codebase to understand object architecture, event patterns, extension structure, and dependencies. Returns structured findings to the Conductor for plan creation.

## Research scope

| Area | What it discovers |
|---|---|
| **AL objects** | Tables, Pages, Codeunits, Reports, Enums involved |
| **Extensions** | TableExtension, PageExtension, EnumExtension usage |
| **Events** | Existing subscribers/publishers, integration points |
| **Project structure** | AL-Go structure, app vs test separation |
| **Performance** | Large tables requiring SetLoadFields, filtering needs |
| **Dependencies** | `.alpackages/`, `app.json` dependencies, symbol references |

## Discovery pattern

```
1. Search for base object name (e.g., "Customer", "Sales Header")
2. Find TableExtensions of that object
3. Identify related Codeunits and event handlers
4. Check PageExtensions for UI impact
5. Review test codeunits for patterns
6. Map event subscribers/publishers
```

## Constraints

| Rule | Detail |
|---|---|
| **No user interaction** | Returns findings to Conductor only |
| **No code writing** | Research only — never creates/edits files |
| **No decisions** | Gathers data; Conductor makes the plan |

## Output

Structured research report with: objects found, patterns identified, risks, recommended approach, and ID ranges available.

---

<small>Source: [`agents/al-planning-subagent.agent.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/agents/al-planning-subagent.agent.md)</small>