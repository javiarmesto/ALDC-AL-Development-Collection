---
applyTo: "**/*.al"
description: "AL Core principles — transversal rules for Microsoft Dynamics 365 Business Central development"
---

# AL Core Principles

Transversal framework principles. Concrete rules for style, naming, performance, errors, events and testing live in their own micro-instructions.

1. **Event-driven model**. Never modify Business Central base objects; extend via event subscribers or table/page extensions.
2. **App focus by default**. Main implementation in `App/`; tests **are only generated if the user explicitly requests them**.
3. **AL-Go App/Test separation**. The `Test/` project depends on `App/`; never the other way around. Do not mix application logic with tests.
4. **Naming is infrastructure**. The pattern `<ObjectName>.<ObjectType>.al` is not aesthetic: the narrow globs in other instructions depend on it. A misnamed file silently misses its rules.
