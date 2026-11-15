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
| `/aldc:develop` | `aldc:al-developer` | `${CLAUDE_PLUGIN_ROOT}/agents/al-developer.md` |
| `/aldc:review` | `aldc:al-developer-reviewer` | `${CLAUDE_PLUGIN_ROOT}/agents/al-developer-reviewer.md` |
| `/aldc:triage` | `aldc:al-triage` | `${CLAUDE_PLUGIN_ROOT}/agents/al-triage.md` |
| `/aldc:presales` | `aldc:al-presales` | `${CLAUDE_PLUGIN_ROOT}/agents/al-presales.md` |
| `/aldc:agent-builder` | `aldc:al-agent-builder` | `${CLAUDE_PLUGIN_ROOT}/agents/al-agent-builder.md` |
| `/aldc:audit` | `aldc:dredd` | `${CLAUDE_PLUGIN_ROOT}/agents/dredd.md` |

Four agents have no entry skill and run only as subagents, launched with the Agent tool:

| Agent | Launched by |
|---|---|
| `aldc:al-planning-subagent`, `aldc:al-implement-subagent`, `aldc:al-review-subagent` | `aldc:al-conductor` (TDD cycle) |
| `aldc:al-knowledge-consultant` | Architect, Spec and Conductor: one BCQuality `al-knowledge` consultation per knowledge domain |

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
| `/aldc:al-spec-create` | `skills/al-spec-create/SKILL.md` |
| `/aldc:al-build` | `skills/al-build/SKILL.md` |
| `/aldc:al-pr-prepare` | `skills/al-pr-prepare/SKILL.md` |
| `/aldc:al-memory-create` | `skills/al-memory-create/SKILL.md` |
| `/aldc:al-context-create` | `skills/al-context-create/SKILL.md` |
| `/aldc:al-initialize` | `skills/al-initialize/SKILL.md` |
| `/aldc:al-agent-create` | `skills/al-agent-create/SKILL.md` |
| `/aldc:al-agent-task` | `skills/al-agent-task/SKILL.md` |
| `/aldc:al-agent-instructions` | `skills/al-agent-instructions/SKILL.md` |
| `/aldc:al-agent-test` | `skills/al-agent-test/SKILL.md` |

## Rules

Nine path-scoped AL rules live in `rules/`. `/aldc:al-initialize` copies them to the
project's `.claude/rules/` for auto-application in the main session. Subagents do not
get path-scoped rules; the plugin's `PreToolUse` hook appends the eight always-on rules
(nine with `al-agent-toolkit` for agent apps) to every code-touching ALDC subagent.

## Plans and audits

Requirement artifacts live under `.claude/plans/` (`aldc.yaml -> plans.root`) and Dredd's
audit reports under `.claude/audits/` (`aldc.yaml -> audits.root`). The canonical
repository keeps `.github/plans` and `.github/audits`, which is what the Copilot
deployment and the VS Code extension read.
