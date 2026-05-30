---
applyTo: "**/*.Codeunit.al"
description: "Guidelines for implementing event-driven patterns and extensibility in AL development"
---

# AL Events — Micro Rules

Hard event rules for codeunits. Patterns (integration events, handled, OnBefore/OnAfter) and examples live in `skill-events`.

1. **Never modify Business Central base objects**. All extensions go through event subscribers or table/page extensions.
2. **Event subscribers `local`**, with the **exact signature** of the published event (types, `var`, order). A misaligned signature compiles but does not hook.
3. **OnBefore/OnAfter pair** around extensible operations (`OnBeforeCreateX`/`OnAfterCreateX`), with `IsHandled` when the subscriber must be able to abort the default flow.
4. **`Commit` is forbidden inside an event subscriber**. It breaks the publisher's transaction and leaves inconsistent data.
5. **Codeunits that only subscribe end in `Handler`** (`SalesPostingHandler`) and contain only subscribers — no own business logic.
