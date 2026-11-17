# ALDC — AL Development Collection for Claude Code

AI-Native development toolkit for Microsoft Dynamics 365 Business Central.
This directory is maintained directly as the Claude Code edition of ALDC (see
[SURFACE.md](SURFACE.md)); runtime rules are in [docs/claude-runtime.md](docs/claude-runtime.md).

## Installation

`aldc` requires two plugins and installs them with it: **aldc-verify** (compile and
analyzer brakes, listed in this marketplace from `javiarmesto/aldc-verify-plugin`) and
**bcquality** (Microsoft's BCQuality, from its own marketplace). Add BCQuality's
marketplace first, or the install stops with *"Is the bcquality marketplace added?"*:

```
/plugin marketplace add microsoft/BCQuality
/plugin marketplace add javiarmesto/ALDC-AL-Development-Collection
/plugin install aldc@aldc-marketplace
```

If you installed aldc-verify earlier from its own `aldc-verify-dev` marketplace, uninstall
that copy (`/plugin uninstall aldc-verify@aldc-verify-dev`): with two copies every compile
gate runs twice, and the session start warns about it.

From a clone, register this directory as a local marketplace:

```
/plugin marketplace add ./claude-plugin
/plugin install aldc@aldc-marketplace
```

Verify with `/plugin`, the actual Agent catalog and `/`. Claude 2.1.278 removed the `/agents` wizard. You should see 14 agents
(8 core agents and 6 deprecated aliases),
7 role entry skills (plus the `presales` and `agent-builder` pointers), 5 workflow
skills (plus the deprecated `al-spec-create` alias) and 12 knowledge skills, all
prefixed `aldc:`. Plugin loading,
tool availability and any Business Central operation still need local
verification; installation certifies none of them.

## Optional: aldc-extras

Pre-sales (`al-presales`, `skill-estimation`) and Business Central agent building
(`al-agent-builder`, the `al-agent-*` workflows and the `skill-agent-*` skills) moved in
5.4.0 to the optional `aldc-extras` plugin of the same marketplace, which requires this one:

```
/plugin install aldc-extras@aldc-marketplace
```

`/aldc:presales` and `/aldc:agent-builder` stay for one version as pointers that say
so and stop; they are removed in 6.0.0. The `al-agent-toolkit` rule stays in this
plugin: the implementer and reviewer apply it (and `review.agent-sdk`) to any app that
extends `Agent Metadata Provider`, with or without `aldc-extras`. From a clone, install
`aldc-extras` from the repository-root marketplace (`/plugin marketplace add .`).

## First-time setup

```
/aldc:al-initialize
```

Initialization runs `scripts/init.js`: preview with `--project <dir>`, apply with
`--apply`, inspect drift with `--verify`, restore with `--rollback`. Customized
files stay collisions unless a reviewed replacement uses `--force`. Node 20+ is
required. It copies the path-scoped AL rules to `.claude/rules/`, seeds
`.claude/plans/memory.md` and adds a managed block to the project's `CLAUDE.md`.

## Layout

```
claude-plugin/
├── .claude-plugin/plugin.json      # manifest (MCP servers, userConfig)
├── .claude-plugin/marketplace.json # marketplace entry
├── agents/                         # 8 agent contracts + 6 deprecated aliases
├── skills/<role>/                  # 7 short role entry skills + 2 pointers to aldc-extras
├── skills/<workflow>/              # 5 explicit workflow skills + 1 deprecated alias
├── skills/skill-*/                 # 12 knowledge skills
├── rules/                          # 9 path-scoped AL rules
├── docs/claude-runtime.md          # binding runtime rules on this surface
├── docs/claude-al-tooling.md       # LSP/MCP bindings and role grants
├── docs/templates/                 # requirement artifact templates
├── tools/                          # Context Doctor, BCQuality, validator
├── hooks/                          # 7 hooks on 5 events, plus shared modules (see below)
├── aldc.yaml                       # toolkit root (plans.root: .claude/plans)
├── CLAUDE.md                       # plugin guidance
└── README.md                       # this file
```

## Hooks

`hooks/hooks.json` registers eight commands on five events:

| Event | Hook | Does |
|---|---|---|
| SessionStart | `session-context.js` | Routing, autonomy mode, test runner, missing rules/BCQuality warnings, missing or duplicated aldc-verify |
| SessionStart | `tools/bcquality/precondition_hook.sh` | BCQuality precondition check |
| PreToolUse (Agent/Task) | `agent-brief.js` | Foreground ALDC (and `aldc-extras`) subagents; appends AL rules, autonomy, BCQuality candidates, Standard Flow |
| SubagentStart (`aldc:*`, `aldc-extras:*`) | `agent-brief.js` | The same context for subagents no PreToolUse briefed, such as those a workflow launches |
| PreToolUse (reads, writes, MCP) | `flow-scout.js` | Blocks once an event subscriber to a publisher nobody investigated |
| PreToolUse (SendMessage) | `send-guard.js` | Blocks continuing a subagent by message while a plan is open |
| PostToolUse (Write/Edit) | `artifact-gate.js` | Checks review reports and subscriber comments |
| Stop | `stop-guard.js` | In `pre-approved` mode, stops a session ending with a plan half done (on the ticket path, any ticket not `done` or `blocked`), or with a final report the evidence does not back (`hooks/evidence.js`: red or stale aldc-verify compile, tests reported as passed without a runner, tables without tabledata in a permission set) |

## AL language tooling

Read [Claude AL tooling](docs/claude-al-tooling.md) to reuse the existing AL LSP
for Agents companion and verify access from each agent mode. ALDC declares no
second LSP server and does not change user or project provider configuration.

## MCP servers

**al-symbols-mcp** (read-only AL symbol queries), **context7** (library docs) and
**microsoft-docs** (Microsoft Learn). A declaration in the manifest is not proof
of connection: a server that is not loaded is `unavailable`, never simulated.

The Microsoft AL MCP is optional and separately configured under user/project
alias `al`; see [setup and role grants](docs/claude-al-tooling.md). ALDC grants
its query operations explicitly and compilation/build/restore only to
`al-implementer`. It does not start that server or grant publish/authentication.
Optional BC29 profiling/snapshot proxies are granted only to Triage after explicit
connection setup; see the same guide for capture scope and runtime acceptance.

## Tickets and resumable work (5.5.0)

New requirements are cut into tickets rather than phases. `/aldc:tickets <req>` cuts the approved spec into vertical tickets under `.claude/plans/<req>/tickets/T-NN.md`. Each ticket has its dependencies, its own object ID range and the acceptance criteria it closes. `tools/tickets/tickets.js` checks the cut deterministically, without a model:

- the dependency graph has no cycles;
- ID ranges do not overlap and sit inside `app.json`;
- every criterion in `tickets/criteria.md` is covered.

The same tool gives the next ticket to build. `/aldc:conduct <req>` builds one ticket at a time, each with a new implementer, and writes `T-NN.result.md` for each. Research is saved in `research.md`.

When a session stops partway, the next one is told at start which requirement is unfinished. Running `/aldc:conduct <req>` again picks up from the files: it does not repeat the research, the cut or tickets already done. Plans started by phases in 5.4.0 still finish by phases.

## Renamed in 5.4.0

Overlapping agents were merged; each old name stays as a deprecated alias until
6.0.0. An alias keeps its old `aldc:<name>` and the new agent's tools, and tells the
model to read the new contract and act in the fixed mode below. Entry skills keep
their names (`/aldc:develop`, `/aldc:review`, `/aldc:audit`, `/aldc:conduct`).

| Old agent | New agent and mode |
|---|---|
| `al-developer` | `al-implementer`, mode `direct` |
| `al-implement-subagent` | `al-implementer`, mode `phase` |
| `al-developer-reviewer` | `al-reviewer`, scope `increment` |
| `al-review-subagent` | `al-reviewer`, scope `phase` |
| `dredd` | `al-reviewer`, scope `audit` |
| `al-planning-subagent` | `al-researcher` |

The `/aldc:al-spec-create` workflow is now a deprecated alias of `/aldc:spec`, the
one specification entry; it reads `skills/spec/SKILL.md` and is removed in 6.0.0.

Behaviour changes: `al-reviewer` has no write or shell tool in any scope, so
`/aldc:audit` computes the changed-file list with `git diff` and saves the returned
Audit-Report under `.claude/audits/` itself; `/aldc:review` passes the changed-file
list the same way. Report `skill.id` values (`al-review-subagent`,
`al-developer-reviewer`, `dredd`) are unchanged. Update any caller that launches an
old name; the aliases are removed in 6.0.0.

## Requirements

Claude Code CLI, Node 20+, and — for AL compilation — the AL command-line tool.
Publishing, running tests and debugging remain human- or CI-gated steps.

## License

MIT · [javiarmesto](https://github.com/javiarmesto)
