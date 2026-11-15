---
name: presales
description: "Deprecated pointer, kept for one version (5.4.0) and removed in 6.0.0: pre-sales (estimation, SWOT, proposals) moved to the aldc-extras plugin. Invoke /aldc-extras:presales instead."
disable-model-invocation: true
---

<!-- aldc-alias-of: aldc-extras:presales -->
> **Moved.** `/aldc:presales` moved to the `aldc-extras` plugin in ALDC 5.4.0; this pointer is removed in 6.0.0.

Do not act as the role and do not run anything. Tell the user exactly this, in one short message, and stop:

/aldc:presales moved to the `aldc-extras` plugin: install with `claude plugin install aldc-extras@aldc-marketplace`, restart Claude Code, then run `/aldc-extras:presales` (agent `aldc-extras:al-presales`). If `aldc-extras` is already installed, run `/aldc-extras:presales` directly.

Input (the user re-runs it with the new command): **$ARGUMENTS**
