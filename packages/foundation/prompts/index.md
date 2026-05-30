# Agentic Workflows

**Complete execution processes** implemented as `.prompt.md` files providing **systematic workflows** for specific AL development tasks in Business Central.

## How to Use Workflows

Activate workflows explicitly when needed:
```
@workspace use al-initialize
@workspace use al-diagnose
@workspace use al-build
```

## Available Workflows (18 files)

### Environment & Setup

| Workflow | Purpose |
|----------|---------|
| [al-initialize](al-initialize.prompt.md) | Complete environment and workspace setup |
| [al-context.create](al-context.create.prompt.md) | Generate project context for AI assistants |
| [al-memory.create](al-memory.create.prompt.md) | Create session memory for continuity |

### Development

| Workflow | Purpose |
|----------|---------|
| [al-build](al-build.prompt.md) | Build & deploy extensions |
| [al-events](al-events.prompt.md) | Event implementation |
| [al-pages](al-pages.prompt.md) | Page designer & UI |
| [al-spec.create](al-spec.create.prompt.md) | Functional-technical specifications |

### Debugging & Performance

| Workflow | Purpose |
|----------|---------|
| [al-diagnose](al-diagnose.prompt.md) | Runtime debugging & troubleshooting |
| [al-performance](al-performance.prompt.md) | Deep performance analysis with CPU profiling |
| [al-performance.triage](al-performance.triage.prompt.md) | Quick performance diagnosis |

### Quality & Security

| Workflow | Purpose |
|----------|---------|
| [al-permissions](al-permissions.prompt.md) | Permission set management |
| [al-pr-prepare](al-pr-prepare.prompt.md) | Pull request preparation |
| [al-translate](al-translate.prompt.md) | XLF translation file management |

### Maintenance

| Workflow | Purpose |
|----------|---------|
| [al-migrate](al-migrate.prompt.md) | Version migration |

### AI/Copilot Features

| Workflow | Purpose |
|----------|---------|
| [al-copilot-capability](al-copilot-capability.prompt.md) | Register Copilot capability |
| [al-copilot-promptdialog](al-copilot-promptdialog.prompt.md) | Create PromptDialog pages |
| [al-copilot-generate](al-copilot-generate.prompt.md) | AI-assisted code generation |
| [al-copilot-test](al-copilot-test.prompt.md) | Test with AI Test Toolkit |

## Workflows vs Orchestra

- **Simple task** (1-2 files) → Use standalone workflow
- **Complex feature** (3+ objects, TDD needed) → Use `al-conductor`

## Learn More

- [Full Documentation](../docs/prompts/index.md)
- [Detailed Workflow Guide](README.md)
- [Getting Started](../docs/getting-started.md)

---

**Version**: 2.11.0  
**Last Updated**: 2026-02-06
