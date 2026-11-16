---
name: al-spec-create
description: "Deprecated alias of /aldc:spec, kept for one version (5.4.0) and removed in 6.0.0. Invoke /aldc:spec instead."
disable-model-invocation: true
---

<!-- aldc-alias-of: spec -->
> **Deprecated alias.** `/aldc:al-spec-create` and `/aldc:spec` led to the same contract; ALDC 5.4.0 keeps `/aldc:spec` as the one entry and removes this alias in 6.0.0.

Read `${CLAUDE_PLUGIN_ROOT}/skills/spec/SKILL.md` and do exactly what it says with the input below: it makes you act as [the canonical specification contract](${CLAUDE_PLUGIN_ROOT}/agents/al-spec-agent.md) under `${CLAUDE_PLUGIN_ROOT}/docs/claude-runtime.md`. Add one line to your output saying that `/aldc:al-spec-create` is deprecated in favour of `/aldc:spec`.

Input: **$ARGUMENTS**
