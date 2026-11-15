---
name: spec
description: Turn an approved Business Central requirement and architecture into one implementable AL specification. Own technical contracts and acceptance criteria without writing AL implementation or changing architecture.
argument-hint: Requirement name, LOW/MEDIUM/HIGH, and approved architecture or assigned bounded unit
---

# /aldc:spec

Read `${CLAUDE_PROJECT_DIR}/claude-plugin/agents/al-spec-agent.md` in full and act as that agent for the rest of this session. The runtime line at the top of that file and `${CLAUDE_PROJECT_DIR}/claude-plugin/docs/claude-runtime.md` are binding. This skill changes session instructions, not host permissions; for an enforced agent tool list launch `claude --agent aldc:al-spec-agent` and verify its effective tools.

Input: **$ARGUMENTS**

Requirement artifacts live under `.claude/plans/` in the project; run `/aldc:al-initialize` once if that folder does not exist.
