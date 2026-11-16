# ALDC Plugin Instructions

This plugin runs the ALDC contracts in the **Claude Code harness**. It is maintained
directly in this folder (see `SURFACE.md`); the contracts started as GitHub Copilot
Chat contracts and some of their vocabulary remains.

Read `${CLAUDE_PLUGIN_ROOT}/docs/claude-runtime.md` for the binding runtime rules (gates,
delegation, tools, paths, Copilot terms left in the contracts) and
`${CLAUDE_PLUGIN_ROOT}/docs/claude-al-tooling.md` for this surface's LSP/MCP bindings.
Each agent and workflow links the runtime doc explicitly, because a plugin-root
CLAUDE.md is not auto-loaded into a subagent.

## Roles

| Entry skill | Agent | Contract |
|---|---|---|
| `/aldc:architect` | `aldc:al-architect` | `${CLAUDE_PLUGIN_ROOT}/agents/al-architect.md` |
| `/aldc:spec` | `aldc:al-spec-agent` | `${CLAUDE_PLUGIN_ROOT}/agents/al-spec-agent.md` |
| `/aldc:conduct` | `aldc:al-conductor` | `${CLAUDE_PLUGIN_ROOT}/agents/al-conductor.md` |
| `/aldc:develop` | `aldc:al-implementer` (mode `direct`) | `${CLAUDE_PLUGIN_ROOT}/agents/al-implementer.md` |
| `/aldc:review` | `aldc:al-reviewer` (scope `increment`) | `${CLAUDE_PLUGIN_ROOT}/agents/al-reviewer.md` |
| `/aldc:triage` | `aldc:al-triage` | `${CLAUDE_PLUGIN_ROOT}/agents/al-triage.md` |
| `/aldc:audit` | `aldc:al-reviewer` (scope `audit`) | `${CLAUDE_PLUGIN_ROOT}/agents/al-reviewer.md` |

`/aldc:presales` and `/aldc:agent-builder` are pointers (5.4.0, removed in 6.0.0): pre-sales
and agent building moved to the optional `aldc-extras` plugin (`/aldc-extras:presales`,
`/aldc-extras:agent-builder`, the `al-agent-*` workflows and the estimation and agent SDK
skills). The `al-agent-toolkit` rule stays here, because the implementer and reviewer apply it.

Two agents have no entry skill and run only as subagents, launched with the Agent tool;
`al-implementer` and `al-reviewer` also run as the Conductor's phase subagents:

| Agent | Launched by |
|---|---|
| `aldc:al-researcher` | `aldc:al-conductor` (research) |
| `aldc:al-implementer` (mode `phase`), `aldc:al-reviewer` (scope `phase`) | `aldc:al-conductor` (TDD cycle) |
| `aldc:al-knowledge-consultant` | Architect, Spec and Conductor: one BCQuality `al-knowledge` consultation per knowledge domain |

## Deprecated agent aliases (5.4.0, removed in 6.0.0)

Eight core agents plus six aliases kept only for external callers. Each alias has the
old name and the new agent's tools, and tells the model to read the new contract
and act in a fixed mode. The plugin itself (entry skills, Conductor, hooks) launches
only the new names.

| Alias | Now |
|---|---|
| `aldc:al-developer` | `aldc:al-implementer`, mode `direct` |
| `aldc:al-implement-subagent` | `aldc:al-implementer`, mode `phase` |
| `aldc:al-developer-reviewer` | `aldc:al-reviewer`, scope `increment` |
| `aldc:al-review-subagent` | `aldc:al-reviewer`, scope `phase` |
| `aldc:dredd` | `aldc:al-reviewer`, scope `audit` |
| `aldc:al-planning-subagent` | `aldc:al-researcher` |

## Gates

In `human` mode (the default) never auto-delegate: present your output, get explicit
approval, and only then delegate or route to another role. In `pre-approved` mode
(`ALDC_GATES` or `aldc.yaml -> autonomy.gates`) delegate directly and record each gate
decision in `.claude/plans/<req>/decisions.md`; ⛔ hard stops still stop. Details in the
runtime doc.

## Workflows

Explicitly invoked; `disable-model-invocation: true` keeps the model from firing them.

| Skill | File |
|---|---|
| `/aldc:al-build` | `skills/al-build/SKILL.md` |
| `/aldc:al-pr-prepare` | `skills/al-pr-prepare/SKILL.md` |
| `/aldc:al-memory-create` | `skills/al-memory-create/SKILL.md` |
| `/aldc:al-context-create` | `skills/al-context-create/SKILL.md` |
| `/aldc:al-initialize` | `skills/al-initialize/SKILL.md` |

`/aldc:al-spec-create` is a deprecated alias of the `/aldc:spec` entry skill (5.4.0,
removed in 6.0.0): it reads `skills/spec/SKILL.md` and adds a deprecation line.

## Rules

Nine path-scoped AL rules live in `rules/`. `/aldc:al-initialize` copies them to the
project's `.claude/rules/` for auto-application in the main session. Subagents do not
get path-scoped rules; the plugin's `PreToolUse` hook appends the eight always-on rules
(nine with `al-agent-toolkit` for agent apps) to every code-touching ALDC subagent,
including `aldc-extras:al-agent-builder` when that plugin is installed.

## Plans and audits

Requirement artifacts live under `.claude/plans/` (`aldc.yaml -> plans.root`) and the
audit reports `/aldc:audit` saves under `.claude/audits/` (`aldc.yaml -> audits.root`). The canonical
repository keeps `.github/plans` and `.github/audits`, which is what the Copilot
deployment and the VS Code extension read.
