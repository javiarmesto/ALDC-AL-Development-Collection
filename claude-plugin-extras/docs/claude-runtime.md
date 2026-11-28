# aldc-extras runtime rules in Claude Code

`aldc-extras` runs on top of the `aldc` plugin (6.0 or later) and has no runtime of its own.
Every agent and workflow of this plugin points here; this page only says where the
core lives and what differs.

## The core is binding

- `<aldc-root>` in these contracts is the installed `aldc` plugin folder. The
  `aldc-extras` SessionStart hook states it as `aldc-extras: aldc core root is <path>`.
  Without that line, use `~/.claude/plugins/cache/aldc-marketplace/aldc/<highest version>/`,
  or `claude-plugin/` beside this folder in a clone.
- Read `<aldc-root>/docs/claude-runtime.md` now: its gates, delegation, tools and
  evidence rules, paths and Copilot-term mapping are binding here. For LSP/MCP names
  and role grants read `<aldc-root>/docs/claude-al-tooling.md`.
- If the hook reports that `aldc` is missing, stop and tell the user to run
  `claude plugin install aldc@aldc-marketplace` and restart Claude Code.

## What differs in this plugin

| Item | Here |
|---|---|
| `${CLAUDE_PLUGIN_ROOT}` | This plugin's folder (agents, skills, this page), never the core |
| Own roles | `aldc-extras:al-presales`, `aldc-extras:al-agent-builder`; entry skills `/aldc-extras:presales`, `/aldc-extras:agent-builder` |
| Own workflows | `/aldc-extras:al-agent-create`, `/aldc-extras:al-agent-task`, `/aldc-extras:al-agent-instructions`, `/aldc-extras:al-agent-test` |
| Own knowledge skills | `aldc-extras:skill-estimation`, `aldc-extras:skill-agent-toolkit`, `aldc-extras:skill-agent-task-patterns`, `aldc-extras:skill-agent-instructions` |
| `@al-presales`, `@al-agent-builder` | `aldc-extras:al-presales`, `aldc-extras:al-agent-builder` |
| `@al-architect`, `/aldc:spec`, `@al-conductor` and other core roles | Still `aldc:<agent>` / `/aldc:<skill>`: delegate with `subagent_type: "aldc:<agent>"` |
| Templates | `<aldc-root>/docs/templates/` |
| Agent SDK rule (`al-agent-toolkit`) | `<aldc-root>/rules/al-agent-toolkit.md`, copied to `.claude/rules/` by `/aldc:al-initialize`; the core `agent-brief` hook also injects it into `aldc-extras:al-agent-builder` subagents |
| Requirement artifacts, memory | `.claude/plans/` (the core `aldc.yaml -> plans.root`) |
