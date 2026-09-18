---
applyTo: "**/*.Codeunit.al"
description: "AL Error handling patterns, debugging techniques, and troubleshooting guidelines for AL development"
---

# AL Error Handling — Micro Rules

Hard error handling rules for codeunits. Depth, patterns and examples in `skill-debug` and related skills.

1. **TryFunction mandatory** when the operation can fail due to external causes (HTTP services, parsing, calls to another app). Retrieve the text with `GetLastErrorText()`.
2. **TryFunction is not a rollback mechanism.** Database changes made inside a try method are **not** rolled back, and **online nothing prevents the write** — the partial data simply stays. Keep write transactions out of a try method. When an operation must be all-or-nothing, let the error propagate: an uncaught error aborts and rolls back the write transaction, and catching it is what prevents that. (On-premises the server rejects such a write by default, so the same mistake fails loudly there instead of silently.)
3. **Every error/warning/user message string goes in a `Label`** with `Comment` for translators. No inline `Error('...')` or `Message('...')` literals.
4. **Technical labels** (telemetry, keys, non-translatable identifiers): `Locked = true`.
5. **Custom telemetry** (`Session.LogMessage`) **only if the user explicitly requests it**. Do not add it on your own initiative.
6. **Never silence an error**. An `if not TryX() then exit;` without logging or propagating is a bug.

Rules 1–2 follow [Handling errors using try methods](https://learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-handling-errors-using-try-methods).
