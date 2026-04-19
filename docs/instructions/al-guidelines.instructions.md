# :material-book-open-variant: AL Guidelines

<div class="agent-card" markdown>

| | |
|---|---|
| **File** | `al-guidelines.instructions.md` |
| **Applies to** | `**/*.al`, `**/*.json` |
| **Activation** | Always active |
| **Role** | Master hub |

</div>

---

## Purpose

Master integration hub that references all other instruction files. Establishes the core AL development philosophy: event-driven programming, extension-only development, and AI-optimized coding rules for Business Central.

## Core principles

| Principle | Rule |
|---|---|
| **Event-driven** | Never modify standard objects; use events |
| **AL-Go structure** | Separate App and Test projects |
| **Feature-based folders** | `src/feature/subfeature/`, not by object type |
| **Performance first** | Filter early, use SetLoadFields, temporary tables |
| **Test on demand** | Only generate tests when explicitly requested |

## Context loading

This file acts as the entry point — Copilot reads it first and loads the referenced domain-specific guidelines:

- `al-code-style` — Formatting and structure
- `al-naming-conventions` — Naming patterns
- `al-performance` — Optimization
- `al-error-handling` — Error patterns and telemetry
- `al-events` — Event-driven development
- `al-testing` — Test implementation

## Key rules summary

| Area | Convention |
|---|---|
| File naming | `<ObjectName>.<ObjectType>.al` |
| Code style | 2-space indent, PascalCase, 120 char lines |
| Folders | `src/feature/subfeature/` |
| AI behavior | Concise, actionable, with AL method references |

---

<small>Source: [`instructions/al-guidelines.instructions.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/instructions/al-guidelines.instructions.md)</small>