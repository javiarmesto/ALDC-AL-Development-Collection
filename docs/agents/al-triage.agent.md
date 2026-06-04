# :material-stethoscope: AL Triage — Reactive Diagnosis Specialist

<div class="agent-card" markdown>

| | |
|---|---|
| **Agent ID** | `al-triage` |
| **Model** | Claude Sonnet 4.6 |
| **Type** | User-facing · Reactive diagnosis |
| **Invocation** | `@AL Triage` |
| **User-invocable** | Yes |

</div>

---

## Purpose

Reactive support for **existing** Business Central AL code — reproduce, localize, root-cause, and recommend the **smallest safe fix** for bugs, regressions, and incidents. Starts from a *symptom*, not a requirement. **Read-only on code**: produces a diagnosis and hands the fix to `@AL Developer`. The dynamic counterpart to [Dredd](dredd.agent.md) (static audit).

## When to use

- A bug, regression, or production incident in code that already exists
- "This throws", "this is slow", "this broke after the last change"
- You have a symptom and need the root cause + a minimal fix recommendation

> **Routing**: a symptom in existing behaviour → Triage. A *new* thing to build → `@AL Developer` (small) or `@AL Development Conductor` (multi-phase). The starting point decides, not the size.

## The reactive loop

1. **Reproduce (hard gate)** — establish the symptom with evidence; pause and ask the human if it can't be reproduced. Never guess a fix.
2. **Localize** — narrow to suspect objects (`al_symbolsearch`, `bclsp_goToDefinition`; `changes` for regressions).
3. **Root-cause** — trace data/flow via `skill-debug` (which owns the method).
4. **Knowledge (optional, cited)** — probe the external **BCQuality** layer (`external.bcquality.home`); if mounted, fold cited findings into the diagnosis. Degrades gracefully when absent.
5. **Diagnose & hand off** — write the diagnosis and route the fix.

## Constraints

| Rule | Detail |
|---|---|
| **Read-only on code** | Analyze / debug / search / navigate — never edit AL source |
| **`edit` scope** | Only to write the diagnosis under `.github/plans/` |
| **Reproduce-first** | No fix without reproduction or an evidence-backed root cause |

## Handoffs

| To | When |
|---|---|
| **AL Implementation Specialist** | Apply the minimal fix (root cause, `file:line`, regression test) |
| **AL Development Conductor** | The diagnosis calls for a multi-phase refactor |

---

<small>Source: [`agents/al-triage.agent.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/agents/al-triage.agent.md)</small>
