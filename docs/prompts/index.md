# Agentic Workflows

A workflow is a complete, explicit process for one AL development task: write a
specification, build, prepare a pull request. Since 5.3.0 workflows ship as skills at
`skills/<name>/SKILL.md`, not as `.prompt.md` files, because VS Code's Copilot harness
does not load prompt files.

## How to run a workflow

Type its slash command in the chat. Text after the command is passed to the workflow:

```text
/al-spec-create customer loyalty points
/al-build
```

A workflow runs only when you invoke it (`disable-model-invocation: true`) and uses the
tools of the agent that is active. `/al-spec-create` hands the work to AL Spec Agent.

| Host | Command |
|------|---------|
| VS Code Copilot Chat | `/al-spec-create` |
| Copilot CLI | `/al-spec-create` |
| Claude Code plugin | `/aldc:al-spec-create` |

Codex reads the same workflows as references of its single ALDC skill.

## Core workflows (6)

| Command | Purpose | When to use |
|---------|---------|-------------|
| [`/al-initialize`](al-initialize.prompt.md) | Set up the AL environment and workspace | First-time setup, new projects, onboarding |
| [`/al-context-create`](al-context.create.prompt.md) | Create or update `context.md` | Giving assistants the project context |
| [`/al-memory-create`](al-memory.create.prompt.md) | Create or update `memory.md` | Keeping continuity between sessions |
| [`/al-spec-create`](al-spec.create.prompt.md) | Create or revise the technical specification through AL Spec Agent | After the architecture is approved, before implementation |
| [`/al-build`](al-build.prompt.md) | Build and package AL extensions | Verification, compilation and packaging |
| [`/al-pr-prepare`](al-pr-prepare.prompt.md) | Prepare a pull request draft | Before review or merge |

## BC Agents pack workflows (4)

| Command | Purpose |
|---------|---------|
| `/al-agent-create` | Create a coded Business Central agent (Agent SDK) |
| `/al-agent-task` | Generate Agent SDK task integration code |
| `/al-agent-instructions` | Write agent instructions |
| `/al-agent-test` | Generate Agent SDK test codeunits |

## Names that changed in 5.3.0

`@workspace use <name>` is no longer how a workflow is called. Names that had a dot now
have a hyphen:

| Before 5.3.0 | Now |
|--------------|-----|
| `al-spec.create` | `/al-spec-create` |
| `al-context.create` | `/al-context-create` |
| `al-memory.create` | `/al-memory-create` |
| `al-agent.create` | `/al-agent-create` |
| `al-agent.task` | `/al-agent-task` |
| `al-agent.instructions` | `/al-agent-instructions` |
| `al-agent.test` | `/al-agent-test` |
| `al-agent.build-instructions` | Removed; use `/al-agent-instructions` |

`al-build`, `al-pr-prepare` and `al-initialize` keep their names.

Updating an installed toolkit removes the `.github/prompts/` files that ALDC installed
and keeps a backup. A prompt you edited stays in place and is reported on every update.

## Domains that are knowledge skills, not workflows

Earlier releases shipped workflows such as `al-diagnose`, `al-performance`,
`al-permissions`, `al-events`, `al-pages`, `al-migrate`, `al-translate` and the
`al-copilot-*` set. These domains are now knowledge skills that an agent loads when the
task needs them, so there is no workflow command to run for them.

| Domain | Skill |
|--------|-------|
| Debugging and diagnosis | `skill-debug` |
| Performance | `skill-performance` |
| Permission sets | `skill-permissions` |
| Events | `skill-events` |
| Pages | `skill-pages` |
| Version migration | `skill-migrate` |
| Translation | `skill-translate` |
| Copilot capabilities | `skill-copilot` |

## Related resources

- [Skills catalog](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/skills/index.md)
- [Agents](../agents/index.md)
- [Instructions](../instructions/index.md)
- [Complete development flow](../workflows/complete-development-flow.md)
