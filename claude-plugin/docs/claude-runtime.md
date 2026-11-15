# ALDC runtime rules in Claude Code

Every agent and workflow of this plugin points here. These rules are binding on this
surface; the contracts themselves define each role's responsibilities, gates and
evidence. For LSP/MCP names and role grants read
[`claude-al-tooling.md`](claude-al-tooling.md), then the shared role/evidence contract
`${CLAUDE_PLUGIN_ROOT}/skills/skill-migrate/references/cli-al-tools.md`. The tooling
guide supersedes older capability-availability examples, never role responsibilities
or human gates.

## Where you run

- **Main session.** `/aldc:<role>` loads a role's instructions into the current
  conversation. That does not apply the agent's frontmatter tool list; only
  `claude --agent aldc:<agent>` or a real delegation does.
- **Subagent.** A role launched with the Agent tool runs as a stateless subagent:
  one invocation, no follow-up turn, no user. It never asks or waits; it returns the
  structured output its contract defines, with any open questions inside it. A
  subagent cannot launch another subagent: the host does not give it the Agent tool.

## Human gates

The contracts were written for a host where a handoff is a button the human clicks.
Claude Code has no such button, so the gate is the role's to keep.

- Mode: `ALDC_GATES` (environment) > project `aldc.yaml` > plugin `aldc.yaml` >
  `human`. The session context states it as `ALDC autonomy: <mode>`.
- **`human` (default).** Stop at every gate (plan approval, phase checkpoints,
  handoffs). Present your output, ask with `AskUserQuestion`, and only delegate or
  route to another role after explicit approval. An ambiguous acknowledgement never
  advances a gate.
- **`pre-approved`.** The requester approved the gates in advance. Each gate becomes a
  recorded checkpoint in `<plans.root>/<req>/decisions.md` (decision and rationale)
  and the work continues. ⛔ hard stops still stop. `autonomy.commit: false` (the
  default) keeps git commits a human step.

## Delegation

- Use the Agent tool (`Task` on older hosts) with `subagent_type: "aldc:<agent>"`.
  Carry everything the subagent needs in that one prompt.
- Run ALDC subagents in the foreground and wait for the result in the same turn. A new
  phase, revision or review is a new Agent call, never `SendMessage` (the plugin blocks
  it while a plan is open). If the host moves a subagent to the background, continue
  when its completion notification arrives.
- The plugin's `PreToolUse` hook adds the AL rules, the autonomy mode, BCQuality
  candidates and the Standard Flow reminder to ALDC subagent prompts. Path-scoped rules
  do not auto-apply inside subagents; the hook is what delivers them.

## Tools and evidence

- Use only tools you can see in this session. A server or tool that is not loaded is
  `unavailable`; never simulate it, rename another tool as it, or claim its result.
- Diagnostics are not a fresh compile, and a compile is not an executed test. Record
  what did not run as `not-run` or `unavailable`.
- Compile, build and symbol download belong to `al-implementer` (official AL
  MCP alias `al`, or an installed ALTool/AL-Go runner through `Bash`). Publishing,
  BC authentication, debugging sessions and running tests against Business Central are
  human or CI steps unless `aldc.yaml -> testing.runner` names a runner.
- `git status` / `git diff` only through `Bash` where the role has it; otherwise read
  the diff the caller supplied, or return the request for it.
- Role write scopes are behavioural limits, not filesystem sandboxes.

## Paths

| Item | Location |
|---|---|
| Requirement artifacts, memory | `.claude/plans/` (`aldc.yaml -> plans.root`) |
| Audit reports (`al-reviewer` scope `audit`, saved by `/aldc:audit`) | `.claude/audits/` (`aldc.yaml -> audits.root`) |
| Templates | `${CLAUDE_PLUGIN_ROOT}/docs/templates/` |
| Skills | `Skill` tool (`aldc:<skill>`), or read `${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md` |
| AL rules | `${CLAUDE_PLUGIN_ROOT}/rules/`; `/aldc:al-initialize` copies them to `.claude/rules/` |
| `aldc.yaml` | `${CLAUDE_PROJECT_DIR}/aldc.yaml` if present, otherwise `${CLAUDE_PLUGIN_ROOT}/aldc.yaml` |
| Python helpers | `python` or `python3`, whichever exists (stdlib only) |

## Copilot terms still in the contracts

| Term | Meaning here |
|---|---|
| `@al-<role>` | The role `aldc:al-<role>`; entry skills `/aldc:architect`, `/aldc:spec`, `/aldc:conduct`, `/aldc:develop`, `/aldc:review`, `/aldc:triage`, `/aldc:audit`; `@al-presales` and `@al-agent-builder` are `aldc-extras:` roles (optional plugin) |
| handoff | A delegation or a recommendation to the user, under the gate rules above |
| `<Name from $ARGUMENTS>` | Take it from the skill arguments; ask with `AskUserQuestion` when missing |
| `.instructions.md` | The matching rule in `${CLAUDE_PLUGIN_ROOT}/rules/` |
| `al-symbols-mcp/*`, `context7`, `microsoft-docs` | `mcp__al-symbols-mcp__*`, `mcp__context7__*`, `mcp__microsoft-docs__*` (or the `mcp__plugin_aldc_…` form) |
| A bare `al_<tool>` name | The official AL MCP tool `mcp__al__al_<tool>`, only if your role is granted it (tooling guide) |
| **[human]** in a workflow step | A VS Code command or CI step: prepare it and hand it to the user |
