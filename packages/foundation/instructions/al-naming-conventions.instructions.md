---
applyTo: "**/*.al"
description: "Comprehensive naming conventions for AL files, objects, variables, and functions"
---

# AL Naming Conventions — Micro Rules

Hard naming rules. File naming is **framework infrastructure**: the narrow globs in other instructions depend on it.

1. **PascalCase** everywhere: object names (table, page, codeunit, report…), variables, parameters and procedures.
2. **30-character limit** on object names; reserve 4 for prefix/suffix → **the own name must not exceed 26 characters**. No cryptic abbreviations (`CustLE`, `SIPoster`).
3. **File name**: `<ObjectName>.<ObjectType>.al` (e.g. `NoSeries.Table.al`, `SalesPosting.Codeunit.al`, `Customer.PageExt.al`). **Requirement**, not style: if the file does not follow the pattern, its type-specific instructions will not load.
4. **Interfaces** with prefix `I` (`INoSeries`). **Implementations** with suffix `Impl` (`NoSeriesImpl`). Same root name as the interface.
5. **Event subscriber parameters** should be descriptive (`SalesHeader`, `Customer`), never generic (`Rec`, `xRec` unless the event signature requires it).
