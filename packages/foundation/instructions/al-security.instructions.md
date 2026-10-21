---
applyTo: "**/*.al"
description: "Security defaults for Business Central extensions: least privilege for APIs, MCP and permission sets, secrets, and events that must not bypass checks"
---

# AL Security — Micro Rules

Hard security defaults. They come from audits of agent-built apps (October 2026), where every solution failed the same four points.

- **Least privilege for writes.** API pages and MCP tools are read-only unless the scenario needs writes. Set `InsertAllowed`, `ModifyAllowed` and `DeleteAllowed` explicitly. In the MCP server configuration, enable create, modify or delete only for the entities and operations the scenario names. Never enable all of them by default.
- **Permission sets per role.** Use one assignable set per role, with only the objects and tabledata that role uses. Never use `tabledata * = RIMD` or wildcard object grants. A bot or agent user gets its own minimal set, never the human role's set.
- **Secrets are `SecretText`.** Keep API keys and tokens in `SecretText` variables and parameters. Store them with `IsolatedStorage.SetEncrypted(Key, Value, DataScope::Module)` (the `SecretText` overload; at most 215 plain characters), and read them back into a `SecretText` with `IsolatedStorage.Get`. Never put them in table fields, Labels, telemetry, `Message` or `Error` text. Mark procedures that unwrap a secret with `[NonDebuggable]`.
- **No event can switch off a check.** Do not publish events whose `var` parameters (`IsHandled`, `Skip…`, a result flag) let a subscriber skip a permission, approval or validation check. Run security checks outside any handled pattern.
- **Validate at the table, not the page.** Business rules and range checks go in table `OnValidate`/`OnInsert`/`OnModify`, so APIs, MCP tools and agents cannot bypass them through another page.
- **Outbound calls.** Use only HTTPS endpoints. Send secrets in headers (`SecretText`), never in the URL. Do not log request or response bodies that can hold personal data.
