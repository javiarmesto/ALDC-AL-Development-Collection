---
name: agent-builder
description: "Deprecated pointer, kept for one version (5.4.0) and removed in 6.0.0: Business Central agent building (Agent SDK) moved to the aldc-extras plugin. Invoke /aldc-extras:agent-builder instead."
disable-model-invocation: true
---

<!-- aldc-alias-of: aldc-extras:agent-builder -->
> **Moved.** `/aldc:agent-builder` moved to the `aldc-extras` plugin in ALDC 5.4.0; this pointer is removed in 6.0.0.

Do not act as the role and do not run anything. Tell the user exactly this, in one short message, and stop:

/aldc:agent-builder moved to the `aldc-extras` plugin: install with `claude plugin install aldc-extras@aldc-marketplace`, restart Claude Code, then run `/aldc-extras:agent-builder` (agent `aldc-extras:al-agent-builder`). If `aldc-extras` is already installed, run `/aldc-extras:agent-builder` directly.

Input (the user re-runs it with the new command): **$ARGUMENTS**
