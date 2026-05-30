# Instructions — Auto-Applied Guidelines

**Markdown Prompt Engineering** implemented as modular `.instructions.md` files with **Context Engineering** via `applyTo` patterns. These files customize GitHub Copilot's behavior for AL development in Business Central.

## How Instructions Work

Instructions are auto-applied coding guidelines that load when the file you're editing matches their `applyTo` glob. There is **no semantic activation** — Copilot does not pick instructions based on the topic of your prompt, only on the file path.

- Open a `.al` file → matching instructions load.
- Open a non-AL file → only `copilot-instructions.md` is in scope.
- Edit a Table or Page → codeunit-only instructions (`al-performance`, `al-error-handling`, `al-events`) do **not** load. This is by design.

**Naming is infrastructure.** Files must follow the pattern `<ObjectName>.<ObjectType>.al`. A misnamed file silently misses its type-specific instructions. `aldc-validate` enforces the convention.

## Instructions in this framework (7 files)

| File | `applyTo` | Purpose |
|------|-----------|---------|
| [al-guidelines.instructions.md](al-guidelines.instructions.md)               | `**/*.al`                              | Core principles (event-driven, App focus, Test separation, naming) |
| [al-code-style.instructions.md](al-code-style.instructions.md)               | `**/*.al`                              | 2-space indent, PascalCase, feature-based folders |
| [al-naming-conventions.instructions.md](al-naming-conventions.instructions.md) | `**/*.al`                            | 26-char object name limit, `<Name>.<Type>.al` pattern, `I`/`Impl` |
| [al-performance.instructions.md](al-performance.instructions.md)             | `**/*.Codeunit.al`, `**/*.Query.al`    | SetRange/SetLoadFields before Find, CalcSums, no DB-calls in loops |
| [al-error-handling.instructions.md](al-error-handling.instructions.md)       | `**/*.Codeunit.al`                     | TryFunctions, mandatory `Label`, telemetry only when asked |
| [al-events.instructions.md](al-events.instructions.md)                       | `**/*.Codeunit.al`                     | Subscribers `local` with exact signature, no `Commit` in subscribers |
| [al-testing.instructions.md](al-testing.instructions.md)                     | `**/test/**/*.al`                      | Tests only when explicitly requested, Given/When/Then, libraries |

> [copilot-instructions.md](copilot-instructions.md) is the **always-on entrypoint** — it loads in every chat turn regardless of file context. It is not an instruction with `applyTo`. This `index.md` is documentation.

## Design notes

- **Format**: each instruction is a *micro-instruction* — 3-5 hard rules, no code-block examples. Tutorial-level material lives in the corresponding skill (`skill-events`, `skill-performance`, `skill-debug`, `skill-pages`, `skill-testing`).
- **Glob discipline**: codeunit-only rules use `**/*.Codeunit.al` so they don't bleed into tables, pages, enums, etc. This is the main lever for reducing per-turn token overhead.
- **Coverage gap**: if a file is misnamed (e.g. `MyObj.al` instead of `MyObj.Codeunit.al`), type-specific instructions won't match. Treat the naming convention as a hard requirement, not a style preference.

## Learn more

- [Full Documentation](../docs/instructions/index.md)
- [Getting Started](../docs/getting-started.md)
- [AL Development Collection](../docs/al-development-collection.md)

---

**Version**: 1.1.0
**Last Updated**: 2026-05-18
