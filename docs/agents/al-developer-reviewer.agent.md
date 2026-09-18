# :material-clipboard-check-outline: AL Developer Reviewer — Independent Increment Review

**Role:** Independent, read-only review of an AL increment implemented directly by `al-developer`, without Conductor. Checks the increment against its acceptance criteria, the configured BCQuality provider and the current build/test evidence before a human approves it.

## When it is used

- After a direct Developer implementation (LOW complexity or a bounded fix) and before human approval.
- Not for Conductor phases: Conductor keeps its own review subagent. Not as an audit of the wider codebase: that is `dredd`.

Run it in an independent context from the implementation. One bounded correction round is expected: findings go back to Developer, the reviewer re-checks only the affected scope, and a human takes the final decision.

## What it checks

| Dimension | Evidence it uses |
|-----------|------------------|
| Acceptance | The approved specification and its acceptance criteria |
| Quality | The shared review pipeline (`skill-al-review-pipeline`): BCQuality provider when configured and loaded, native A–G checklist otherwise |
| Validation | Build and test evidence supplied by the implementation owner; it does not build, execute tests or modify code |
| Coverage | Reports the reviewed scope explicitly; an incomplete review is reported as incomplete even with zero findings |

## Boundaries

- Read-only on AL and configuration; no fixes, builds, deployments or dependency changes.
- Does not certify BCQuality execution from a catalog entry or a loaded skill: discovery, loading, execution and result are separate evidence.
- The report follows the shared review report contract so direct and Conductor reviews read the same way.

## Relationship with other agents

`al-developer` → **al-developer-reviewer** → human approval. `dredd` remains the advisory auditor for selected files or the whole codebase; `al-conductor` phases keep their review subagent.

Source contract: [`agents/al-developer-reviewer.agent.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/agents/al-developer-reviewer.agent.md) · [Dredd (Audit)](dredd.agent.md) · [BCQuality configuration](../bcquality.md)
