---
name: al-review-subagent
description: Deprecated alias of al-reviewer (scope phase), kept for external callers in 5.4.0 and removed in 6.0.0. Do not select it; launch aldc:al-reviewer instead.
tools: Read, Glob, Grep, LSP, mcp__al-symbols-mcp__*, mcp__plugin_aldc_al-symbols-mcp__*, mcp__context7__*, mcp__plugin_aldc_context7__*, mcp__microsoft-docs__*, mcp__plugin_aldc_microsoft-docs__*, mcp__al__al_symbolsearch, mcp__al__al_getdiagnostics, mcp__al__al_getpackagedependencies, Skill
model: sonnet
color: yellow
---

<!-- aldc-alias-of: al-reviewer mode=phase -->
> **Deprecated alias.** `aldc:al-review-subagent` was merged into `aldc:al-reviewer` in ALDC 5.4.0 and will be removed in 6.0.0. Update the caller to launch `aldc:al-reviewer` in scope `phase`.

Read `${CLAUDE_PROJECT_DIR}/claude-plugin/agents/al-reviewer.md` in full now and act exactly as that agent in scope `phase` for this whole task: its runtime line, its contract and `${CLAUDE_PROJECT_DIR}/claude-plugin/docs/claude-runtime.md` are binding, and your tool list is the same as its tool list. Add one line to your output saying that `al-review-subagent` is deprecated in favour of `al-reviewer`.
