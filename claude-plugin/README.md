# ALDC — AL Development Collection for Claude Code

AI-Native Development toolkit for Microsoft Dynamics 365 Business Central.

## Installation

### From Plugin Marketplace (recommended)

Add the marketplace, then install the plugin:

```
/plugin marketplace add javiarmesto/ALDC-AL-Development-Collection
/plugin install aldc@aldc-marketplace
```

### Local Development / Testing

From the cloned repo, register this directory as a local marketplace and install:

```
/plugin marketplace add ./claude-plugin
/plugin install aldc@aldc-marketplace
```

Verify registration:

```
/plugin
/agents
/
```

You should see 5 user-facing agents (`al-architect`, `al-conductor`, `al-developer`, `al-presales`, `al-agent-builder`) and 10 slash commands prefixed with `/aldc:`.

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

## Workflows (Slash Commands)

Invoked explicitly from the chat input. Implemented as plugin slash commands under `commands/`.

| Workflow | Command | Purpose |
|----------|---------|---------|
| Spec Create | `/aldc:al-spec-create` | Create functional-technical specifications |
| Build | `/aldc:al-build` | Build, package, deploy extensions |
| PR Prepare | `/aldc:al-pr-prepare` | Prepare pull requests with validation |
| Memory Create | `/aldc:al-memory-create` | Generate session continuity memory |
| Context Create | `/aldc:al-context-create` | Generate project context for AI |
| Initialize | `/aldc:al-initialize` | Full environment and workspace setup |
| Agent Create | `/aldc:al-agent-create` | Create a coded BC agent (Agent SDK) |
| Agent Task | `/aldc:al-agent-task` | Generate agent task integration code |
| Agent Test | `/aldc:al-agent-test` | Generate test codeunits for agents |
| Agent Instructions | `/aldc:al-agent-instructions-create` | Generate agent NL instructions |

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

## Plugin Structure

```
claude-plugin/
├── .claude-plugin/
│   ├── plugin.json        # Plugin manifest (name, version, MCP servers, hooks ref)
│   └── marketplace.json   # Marketplace entry (for local / remote distribution)
├── agents/                # 5 user-facing agents + 3 internal subagents (TDD)
├── commands/              # 10 slash commands (/aldc:*)
├── skills/                # 15 knowledge skills (auto-loaded by agents)
├── rules-templates/       # AL coding rules copied by /aldc:al-initialize
├── hooks/hooks.json       # PostToolUse + Stop reminders
├── .mcp.json              # MCP server config (al-symbols, context7, microsoft-docs)
├── CLAUDE.md              # Plugin-level guidance loaded by Claude Code
└── README.md              # This file
```

## Requirements

- Claude Code CLI v1.0.0+
- Visual Studio Code with AL Language extension
- Business Central sandbox or on-premises environment

## License

MIT

## Author

[javiarmesto](https://github.com/javiarmesto)
