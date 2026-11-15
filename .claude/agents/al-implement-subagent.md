---
name: al-implement-subagent
description: Deprecated alias of al-implementer (mode phase), kept for external callers in 5.4.0 and removed in 6.0.0. Do not select it; launch aldc:al-implementer instead.
tools: Read, Glob, Grep, LSP, Write, Edit, Bash, WebSearch, WebFetch, mcp__al-symbols-mcp__*, mcp__plugin_aldc_al-symbols-mcp__*, mcp__context7__*, mcp__plugin_aldc_context7__*, mcp__microsoft-docs__*, mcp__plugin_aldc_microsoft-docs__*, mcp__al__al_symbolsearch, mcp__al__al_getdiagnostics, mcp__al__al_getpackagedependencies, mcp__al__al_compile, mcp__al__al_build, mcp__al__al_downloadsymbols, Skill, AskUserQuestion
model: sonnet
color: green
---

<!-- aldc-alias-of: al-implementer mode=phase -->
> **Deprecated alias.** `aldc:al-implement-subagent` was merged into `aldc:al-implementer` in ALDC 5.4.0 and will be removed in 6.0.0. Update the caller to launch `aldc:al-implementer` in mode `phase`.

Read `${CLAUDE_PROJECT_DIR}/claude-plugin/agents/al-implementer.md` in full now and act exactly as that agent in mode `phase` for this whole task: its runtime line, its contract and `${CLAUDE_PROJECT_DIR}/claude-plugin/docs/claude-runtime.md` are binding, and your tool list is the same as its tool list. Add one line to your output saying that `al-implement-subagent` is deprecated in favour of `al-implementer`.
