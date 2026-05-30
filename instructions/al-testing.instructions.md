---
applyTo: "**/test/**/*.al"
description: "AL Testing & Project Structure Rules - Ensure proper project organization and test implementation"
---

# AL Testing — Micro Rules

Hard rules for test files. Test patterns (given/when/then, libraries, asserts) and examples in `skill-testing`.

1. **Do not generate tests unless explicitly requested** ("create tests for…", "add test coverage", "write unit tests…"). Default focus is on the App.
2. **Strict AL-Go separation**: tests only in the `Test/` project, never in `App/`. The `app.json` of Test depends on App's; App's does **not** depend on Test.
3. **Test/ structure mirrors App/**: if `App/src/Sales/Invoice/...` exists, tests live in `Test/src/Sales/Invoice/...`. Shared helpers in `Test/src/Common/`.
4. **Codeunit with `Subtype = Test`** and standard dependencies: `Codeunit Assert`, `Library - <Module>` (Sales, Inventory, ERM, Random). Use those libraries to create data and post documents — do not build records by hand.
5. **Test method names in Given/When/Then pattern**: `GivenX_WhenY_ThenZ`. Each test ends with one or more explicit `Assert.*` calls.
