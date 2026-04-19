# :material-shield-check: AL Code Review Subagent

<div class="agent-card" markdown>

| | |
|---|---|
| **Agent ID** | `al-review-subagent` |
| **Model** | Claude Sonnet 4.5 |
| **Type** | Internal · Quality assurance |
| **Invoked by** | AL Development Conductor |
| **User-invocable** | No |

</div>

---

## Purpose

Quality assurance gate for Business Central AL code. Reviews each implementation phase against AL best practices, test coverage, BC patterns, and the original requirements. Returns a verdict to the Conductor.

## Review checklist

| Category | Validates |
|---|---|
| **Event-driven architecture** | Base BC objects never modified directly |
| **Extension patterns** | Proper use of TableExtension, PageExtension |
| **Test coverage** | `[Test]` procedures exist, Given/When/Then pattern, Library Assert |
| **Performance** | SetLoadFields, early filtering, no unnecessary CalcFields |
| **Naming** | PascalCase, prefix conventions, file naming |
| **Error handling** | TryFunction, error labels, telemetry |
| **Skills compliance** | Patterns from loaded skills were applied |

## Verdicts

| Verdict | Meaning |
|---|---|
| **APPROVED** | Phase passes all checks → Conductor commits |
| **NEEDS_REVISION** | Issues found → returns to Implementation Subagent |
| **FAILED** | Critical problems → Conductor escalates |

## Constraints

| Rule | Detail |
|---|---|
| **No user interaction** | Returns verdict to Conductor only |
| **No code editing** | Reviews only — never modifies files |
| **Read-only tools** | `search`, `usages`, `problems`, `changes`, `testFailure` |

---

<small>Source: [`agents/al-review-subagent.agent.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/agents/al-review-subagent.agent.md)</small>