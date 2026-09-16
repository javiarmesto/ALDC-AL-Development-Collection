---
description: "ALDC agent roles for Business Central development."
---
# ALDC agents

| Role | Purpose |
|---|---|
| [Architect](al-architect.agent.md) | Architecture and specification decomposition |
| [Spec](al-spec-agent.agent.md) | Approved architecture to specification contracts |
| [Developer](al-developer.agent.md) | Direct implementation |
| [Developer Reviewer](al-developer-reviewer.agent.md) | Independent direct-increment review before human approval |
| [Conductor](al-conductor.agent.md) | Orchestrated planning, implementation and review |
| [Pre-Sales](al-presales.agent.md) | Estimation and discovery |
| [Dredd](dredd.agent.md) | Independent advisory audit; no AL edits |
| [Triage](al-triage.agent.md) | Diagnosis and runtime investigation |
| [Agent Builder](al-agent-builder.agent.md) | Optional agent extension work |

Conductor owns the internal [Planning](al-planning-subagent.agent.md),
[Implementation](al-implement-subagent.agent.md) and
[Review](al-review-subagent.agent.md) subagents.
Developer Reviewer and Dredd are directly invocable; they have different purposes.
Reviewers use [the shared pipeline](../skills/skill-al-review-pipeline/SKILL.md).
Architecture, specs, plans and memory stay in `.github/plans/`; Dredd may write
only its audit reports under `.github/audits/`, unless the user requests chat only.
