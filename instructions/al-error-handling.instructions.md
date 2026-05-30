---
applyTo: "**/*.Codeunit.al"
description: "AL Error handling patterns, debugging techniques, and troubleshooting guidelines for AL development"
---

# AL Error Handling — Micro Rules

Hard error handling rules for codeunits. Depth, patterns and examples in `skill-debug` and related skills.

1. **TryFunction mandatory** when the operation can fail due to external causes (HTTP services, parsing, calls to another app) or needs rollback. Retrieve the text with `GetLastErrorText()`.
2. **Every error/warning/user message string goes in a `Label`** with `Comment` for translators. No inline `Error('...')` or `Message('...')` literals.
3. **Technical labels** (telemetry, keys, non-translatable identifiers): `Locked = true`.
4. **Custom telemetry** (`Session.LogMessage`) **only if the user explicitly requests it**. Do not add it on your own initiative.
5. **Never silence an error**. An `if not TryX() then exit;` without logging or propagating is a bug.
