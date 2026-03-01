# Instructions - Auto-Applied Guidelines

**Markdown Prompt Engineering** implemented as modular `.instructions.md` files with **Context Engineering** via `applyTo` patterns. These files customize GitHub Copilot's behavior for AL development in Business Central.

## How Instructions Work

Instructions are **auto-applied coding guidelines** that:
- Load automatically based on `applyTo` patterns (e.g., `**/*.al`)
- Provide persistent context to GitHub Copilot during code generation
- Implement best practices through structured markdown rules

**No activation needed** — when you open an AL file, matching instructions load automatically.

## Available Instructions (9 files)

### Always Active (apply to `**/*.al`)

| File | Purpose |
|------|---------|
| [al-guidelines.instructions.md](al-guidelines.instructions.md) | Master hub referencing all guidelines |
| [al-code-style.instructions.md](al-code-style.instructions.md) | Code formatting & structure (PascalCase, 120 char lines) |
| [al-naming-conventions.instructions.md](al-naming-conventions.instructions.md) | Naming standards (26-char limit, suffixes) |
| [al-performance.instructions.md](al-performance.instructions.md) | Performance optimization (SetLoadFields, early filtering) |

### Context-Triggered

| File | Purpose | Activates When |
|------|---------|----------------|
| [al-error-handling.instructions.md](al-error-handling.instructions.md) | Error patterns, TryFunctions, telemetry | Handling errors in AL code |
| [al-events.instructions.md](al-events.instructions.md) | Event-driven development patterns | Working with events |
| [al-testing.instructions.md](al-testing.instructions.md) | Testing guidelines, AL-Go structure | Working with test files |

### Integration

| File | Purpose |
|------|---------|
| [copilot-instructions.md](copilot-instructions.md) | Master Copilot integration and coordination |

## Learn More

- [Full Documentation](../docs/instructions/index.md)
- [Getting Started](../docs/getting-started.md)
- [AL Development Collection](../docs/al-development-collection.md)

---

**Version**: 2.11.0  
**Last Updated**: 2026-02-06
