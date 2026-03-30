# ALDC — AL Development Collection for Claude Code

AI-Native Development toolkit for Microsoft Dynamics 365 Business Central.

## Installation

### From Plugin Marketplace (recommended)

```
/plugin install aldc
```

### Local Development

```bash
claude --plugin-dir ./claude-plugin
```

## First-Time Setup

After installing the plugin, initialize your project:

```
/aldc:al-initialize
```

This will:
1. Copy path-scoped AL rules to your project's `.claude/rules/`
2. Generate a `CLAUDE.md` for your project
3. Set up VS Code workspace configuration
4. Configure launch.json for debugging

## Agents

| Agent | Command | Purpose |
|-------|---------|---------|
| AL Architect | `agent "aldc:al-architect"` | Solution design, data modeling, integration strategy |
| AL Conductor | `agent "aldc:al-conductor"` | TDD orchestration: plan, implement, review, commit |
| AL Developer | `agent "aldc:al-developer"` | Tactical implementation, debugging, code generation |
| AL Pre-Sales | `agent "aldc:al-presales"` | PERT estimation, SWOT analysis, cost breakdown |
| Agent Builder | `agent "aldc:al-agent-builder"` | Create custom agents for BC AI Development Toolkit |

### Agent Routing

```
New feature (MEDIUM/HIGH)?  -> aldc:al-architect -> /aldc:al-spec-create -> aldc:al-conductor
New feature (LOW)?          -> /aldc:al-spec-create -> aldc:al-developer
Bug fix / debugging?        -> aldc:al-developer
Architecture review?        -> aldc:al-architect
Full TDD cycle?             -> aldc:al-conductor
Project estimation?         -> aldc:al-presales
```

## Workflows (Skills)

| Workflow | Command | Purpose |
|----------|---------|---------|
| Spec Create | `/aldc:al-spec-create` | Create functional-technical specifications |
| Build | `/aldc:al-build` | Build, package, deploy extensions |
| PR Prepare | `/aldc:al-pr-prepare` | Prepare pull requests with validation |
| Memory Create | `/aldc:al-memory-create` | Generate session continuity memory |
| Context Create | `/aldc:al-context-create` | Generate project context for AI |
| Initialize | `/aldc:al-initialize` | Full environment and workspace setup |

## Knowledge Skills

Loaded automatically by agents when needed:

| Skill | Domain |
|-------|--------|
| `skill-api` | API pages, OData, REST |
| `skill-copilot` | AI features, PromptDialog |
| `skill-debug` | Debugging, snapshot debugging |
| `skill-events` | Event subscribers, publishers |
| `skill-pages` | Page types, FastTabs, actions |
| `skill-performance` | CPU profiling, FlowField optimization |
| `skill-permissions` | Permission sets, XLIFF, security |
| `skill-testing` | TDD, AL Test Toolkit |
| `skill-translate` | XLF translation, NAB AL Tools |
| `skill-migrate` | BC version migration |
| `skill-estimation` | PERT estimation, complexity scoring |

## Core Principles

- **Extension-only development** — Never modify base application objects
- **Human-in-the-Loop (HITL)** — Critical decisions require user confirmation
- **TDD / spec-driven** — Features follow: spec -> architecture -> test-plan -> implementation -> review
- **Event-driven architecture** — Use integration events for extensibility
- **Skills Evidencing** — Agents declare which skills they loaded and patterns applied

## MCP Servers Included

- **al-symbols-mcp** — AL symbol resolution and navigation
- **context7** — Library documentation lookup
- **microsoft-docs** — Microsoft Learn documentation search

## Requirements

- Claude Code CLI v1.0.0+
- Visual Studio Code with AL Language extension
- Business Central sandbox or on-premises environment

## License

MIT

## Author

[javiarmesto](https://github.com/javiarmesto)
