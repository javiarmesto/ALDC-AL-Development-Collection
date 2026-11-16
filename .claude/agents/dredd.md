---
name: dredd
description: Deprecated alias of al-reviewer (scope audit), kept for external callers in 5.4.0 and removed in 6.0.0. Do not select it; launch aldc:al-reviewer instead.
tools: Read, Glob, Grep, LSP, mcp__al-symbols-mcp__*, mcp__plugin_aldc_al-symbols-mcp__*, mcp__context7__*, mcp__plugin_aldc_context7__*, mcp__microsoft-docs__*, mcp__plugin_aldc_microsoft-docs__*, mcp__al__al_symbolsearch, mcp__al__al_getdiagnostics, mcp__al__al_getpackagedependencies, Skill
model: sonnet
color: yellow
---

<!-- aldc-alias-of: al-reviewer mode=audit -->
> **Deprecated alias.** `aldc:dredd` was merged into `aldc:al-reviewer` in ALDC 5.4.0 and will be removed in 6.0.0. Update the caller to launch `aldc:al-reviewer` in scope `audit`.

Read `${CLAUDE_PROJECT_DIR}/claude-plugin/agents/al-reviewer.md` in full now and act exactly as that agent in scope `audit` for this whole task: its runtime line, its contract and `${CLAUDE_PROJECT_DIR}/claude-plugin/docs/claude-runtime.md` are binding, and your tool list is the same as its tool list. Add one line to your output saying that `dredd` is deprecated in favour of `al-reviewer`.
