# :material-gavel: Dredd — AL Independent Auditor

<div class="agent-card" markdown>

| | |
|---|---|
| **Agent ID** | `dredd` |
| **Model** | Claude Sonnet 4.6 |
| **Type** | User-facing · Independent audit |
| **Invocation** | `@Dredd` |
| **User-invocable** | Yes |

</div>

---

## Purpose

**Independent, on-demand** auditor of Business Central AL code. Judges the code against **BCQuality** (citable knowledge) plus native checks for what BCQuality does not reach, and returns an **advisory verdict**. Not part of the `@AL Development Conductor` TDD loop — you invoke it directly. The static counterpart to [AL Triage](al-triage.agent.md) (dynamic diagnosis).

## When to use

- An on-demand quality audit of changed code (default scope: objects changed vs `main`)
- A full-codebase audit on request ("audit everything")
- An independent second opinion that trusts the *artifact*, not self-declared intent

## Audit pipeline

1. **Scope & worklist** — default = `*.al` changed vs `main` (local git, read-only); full codebase on request. Batched by module/folder.
2. **BCQuality first** — select `external.bcquality.mode` and load the exact plugin skill or external Entry; review each batch → cited findings. Native checks cover only what BCQuality doesn't reach (expand to the full **A–G** residual when it's absent).
3. **Verdict** — advisory, with severity-tagged findings.
4. **Persist** — write the audit report under `.github/audits/`; CI checks JSON structure and citation paths only with an available matching corpus; it does not prove plugin execution.

## Constraints

| Rule | Detail |
|---|---|
| **Read-only on code** | Analyze / diagnose / search — never edit AL source, build, or fix |
| **`edit` scope** | Only to write the audit report under `.github/audits/` |
| **Independent** | Trusts no "Skills Loaded" self-declaration — judges the artifact against the evidence |

## Handoffs

| To | When |
|---|---|
| **AL Implementation Specialist** | Apply the fixes from the actionable findings |

---

<small>Source: [`agents/dredd.agent.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/agents/dredd.agent.md)</small>

Provider identity, discovered/loaded/executed stages, best-effort index evidence
and native fallback follow [the shared contract](../templates/bcquality-provider-contract.md).
