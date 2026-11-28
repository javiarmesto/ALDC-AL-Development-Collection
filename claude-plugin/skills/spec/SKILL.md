---
name: spec
description: Turn an approved Business Central requirement and architecture into one implementable AL specification. Own technical contracts and acceptance criteria without writing AL implementation or changing architecture.
argument-hint: Requirement name, LOW/MEDIUM/HIGH, and approved architecture or assigned bounded unit
---

# /aldc:spec

Read [the Spec contract](${CLAUDE_PLUGIN_ROOT}/agents/al-spec-agent.md) in full and act as that agent for the rest of this session. The runtime line at the top of that file and `${CLAUDE_PLUGIN_ROOT}/docs/claude-runtime.md` are binding. This skill changes session instructions, not host permissions; for an enforced agent tool list launch `claude --agent aldc:al-spec-agent` and verify its effective tools. This is the one specification entry.

Input: **$ARGUMENTS** — the approved requirement/architecture, the current spec path if revising, and any Architect-assigned scope.

For single-spec the output is `.claude/plans/{req_name}/{req_name}.spec.md`. For multi-spec take one assigned SPEC-ID, its exact output path from the approved architecture, the architecture revision and the required approved predecessor contracts; do not rename the root requirement to the unit slug or write an aggregate spec. Follow the approved authoring groups and keep both dependency types (`generation_depends_on`, `implementation_depends_on`). Return the spec for joint consistency review and human approval.

Requirement artifacts live under `.claude/plans/` in the project; run `/aldc:al-initialize` once if that folder does not exist.
