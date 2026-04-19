# :material-cog-play: AL Implementation Subagent

<div class="agent-card" markdown>

| | |
|---|---|
| **Agent ID** | `al-implement-subagent` |
| **Model** | Claude Sonnet 4.5 |
| **Type** | Internal · TDD executor |
| **Invoked by** | AL Development Conductor |
| **User-invocable** | No |

</div>

---

## Purpose

Executes the strict **RED → GREEN → REFACTOR** TDD cycle for AL Business Central code. Creates test codeunits first, then production code to make them pass, then refactors. Returns structured results to the Conductor.

## TDD cycle

```
1. VERIFY  — Check test infrastructure (idRanges, Library Assert dependency)
2. RED     — Write failing test procedures (Given/When/Then)
3. GREEN   — Create production AL objects to pass tests
4. REFACTOR — Clean up, apply AL performance patterns
5. REPORT  — Return phase summary to Conductor
```

## Constraints

| Rule | Detail |
|---|---|
| **No user interaction** | Receives instructions from Conductor only |
| **No architectural decisions** | Implements what the plan specifies |
| **No phase advancement** | Returns results; Conductor decides next step |
| **Extension-only** | Never modifies base BC objects |
| **Tests first** | Production code is always written after tests |

## Tools available

`readFile`, `editFiles`, `createFile`, `codebase search`, `textSearch`, `runInTerminal`, `al_downloadsymbols`, `al_symbolsearch`

---

<small>Source: [`agents/al-implement-subagent.agent.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/agents/al-implement-subagent.agent.md)</small>