# ALDC for GitHub Copilot CLI

This is the terminal CLI distribution, independent of Copilot Chat, Claude Code,
Codex and the VSIX. Sources are `scripts/sync-copilot-cli.js`,
`scripts/copilot-cli-adapter.js` and `scripts/copilot-cli-bootstrap.js`.
`copilot-cli-plugin/` is generated. Never patch its files directly.

## Architecture and format decision

Retain the supported **legacy** manifest. It already describes the CLI-specific
agents, skills, commands and MCP configuration. Agent Plugins 1.0 would make
skills and MCP portable, but would relocate CLI agents/commands without making
those roles portable. There is no observed incompatibility requiring migration.
Do not add the Agent Plugins schema to the current layout.

| Component | Ownership and behavior |
| --- | --- |
| `plugin.json` | Legacy manifest, `aldc-cli`; no hooks imported from Claude |
| `agents/` | 12 custom-agent profiles; explicit tools and canonical model |
| `references/agent-contracts/` | Complete Conductor workflow; mandatory read before action; entry stays below 29,000 characters |
| `skills/` | 16 domain skills, loaded when needed |
| `commands/` | 11 explicit workflows; `disable-model-invocation: true` |
| MCP | Existing `al-symbols-mcp`, `context7`, `microsoft-docs`; declared is not connected |
| `rules-templates/` | Scoped rules copied by project bootstrap |
| `scripts/init.js` | CLI-only adaptation of the shared transaction engine; no change to other hosts |
| Project | `AGENTS.md`, scoped rules, memory and approved requirement artifacts |

The adapter removes Chat mentions and tool calls. The native delegation tool is
`task`, with the discovered ID in `agent_type`, not a chat mention. It preserves
approval gates, independent reviews, Spec ownership and the Conductor workflow.
Tool availability is contextual: inspect the host schema and catalog. If a
delegated context cannot call `task`, return the blocked handoff to its caller;
do not simulate a role or spawn a nested CLI process. Nested custom-agent
delegation remains unverified until the host transcript demonstrates it.

Frontmatter aliases select capabilities, while the body calls actual CLI tools.
Reviewers keep read-only grants; Spec does not gain execution or delegation.
AL compilation can use the explicitly granted official AL MCP operations or a
verified project command; tests require a real test runner. Native AL LSP is
configured separately, and its availability inside restricted agents must be
verified. See [AL tooling](copilot-cli-al-tooling.md) for setup, role grants,
optional Triage captures and Dredd's separate report-persistence step.
`${PLUGIN_ROOT}` in a Markdown contract denotes the installed package root;
resolve it from the host source path, not the consumer's current directory.
It is not a promise that the invoking shell has that environment variable.

## Install in an isolated consumer

Use a clean directory outside the ALDC checkout and outside an AL project:

```powershell
$consumer = 'C:\DynamicsMinds2026\ALDC-CopilotCLI-Test\consumer'
New-Item -ItemType Directory -Force $consumer | Out-Null
Set-Location $consumer
copilot --version
```

For an entirely isolated test profile, set `COPILOT_HOME` and
`COPILOT_CACHE_HOME` to separate test directories before installation. Such a
profile needs its own Copilot authentication. The GitHub connector's login is
not the CLI's login. Never commit authentication files or raw credential logs.

### Local checkout

```powershell
$plugin = 'C:\path\to\ALDC-AL-Development-Collection\copilot-cli-plugin'
copilot plugin install $plugin
copilot plugin list --json
```

Confirm `name`, `version`, `enabled`, `source`, and `installedFrom` if emitted.
CLI 1.0.86 emits no `installedFrom` in the observed listing; do not invent it.
Record the install command and component paths as source evidence. Reinstall
after changes: direct path installs are cached. Start a new session afterwards.
CLI 1.0.86 warns that direct installs are deprecated; keep this as a development
test and use the marketplace for distribution. A directory-source marketplace
may load live instead; do not infer direct-install cache behavior from that case.

### Canonical marketplace

```powershell
copilot plugin marketplace add javiarmesto/ALDC-AL-Development-Collection
copilot plugin marketplace browse aldc-marketplace --json
copilot plugin install aldc-cli@aldc-marketplace
copilot plugin list --json
```

The existing `.github/plugin/marketplace.json` names `aldc-marketplace` and
resolves `aldc-cli` to `./copilot-cli-plugin`. Select **aldc-cli**, not the `aldc`
entry intended for a different surface. Avoid installing both in a CLI profile.

Until this PR is merged, the unqualified repository route installs **main**,
not this branch. Test the candidate in a separate profile:

```powershell
copilot plugin marketplace add 'javiarmesto/ALDC-AL-Development-Collection#feat/copilot-cli-al-tooling'
copilot plugin install aldc-cli@aldc-marketplace
```

Do not register main and branch under the same marketplace name in one profile
and then assume which one won. Capture the marketplace listing and resolved SHA.

### Update and lifecycle

```powershell
copilot plugin marketplace update aldc-marketplace
copilot plugin update aldc-cli
copilot plugin disable aldc-cli
copilot plugin enable aldc-cli
```

Inspect `plugin list --json` and restart after changes. For a local direct source,
reinstall its directory. This PR leaves the base version 5.0.1 unchanged; record the
source SHA and hashes to distinguish the candidate from the published release.
No release or tag is created by this work.

## Inspect the actual host

In a fresh `copilot` session:

```text
/plugin list
/agent
/skills list
/mcp
/env
```

Noninteractive inventory is also available:

```powershell
copilot skill list --json
copilot mcp list --json
copilot instruction list --json
```

The skill catalog can include the 11 command files alongside the 16 domain
skills. Count by source path, excluding built-ins. Commands use their filenames:
`/al-spec-create`, `/al-build`, `/al-pr-prepare`, `/al-memory-create`,
`/al-context-create`, `/al-initialize`, `/al-agent-create`, `/al-agent-task`,
`/al-agent-instructions`, `/al-agent-build-instructions`, `/al-agent-test`.

Expected role IDs: `al-agent-builder`, `al-architect`, `al-conductor`,
`al-developer`, `al-developer-reviewer`, `al-implement-subagent`,
`al-planning-subagent`, `al-presales`, `al-review-subagent`, `al-spec-agent`,
`al-triage`, `dredd`. Subagents retain `user-invocable: false`; inspect host
discovery separately from the user-selectable picker. A disk count is not
evidence that these roles were parsed, selected or invoked.

## Precedence and project bootstrap

Agents and skills can be hidden by earlier matching sources. Agent identity is
the profile filename; skill identity is its frontmatter name. Check project,
parent and personal sources, extra trusted roots, and custom skill directories.
MCP name collisions have different precedence; inspect the winning configuration
and connection rather than assuming the same rules as agents. Bootstrap reports
potential duplicates without deleting or renaming them. Its scan is advisory;
the live host catalog is authoritative.

Preview, review the file plan, then apply:

```powershell
node "$plugin\scripts\init.js" --project $consumer
node "$plugin\scripts\init.js" --project $consumer --apply
node "$plugin\scripts\init.js" --project $consumer --verify
```

Bootstrap copies scoped rules, seeds memory only if missing, and updates only
the managed CLI block in **AGENTS.md**. It preserves `AGENTS.override.md` without
using it as a CLI entrypoint. It installs no agents, skills, MCP servers, software,
AL sources or app manifest. Existing rule customizations are visible collisions;
`--force` is only for reviewed replacement. `--rollback` restores the preceding
transaction and refuses to overwrite later edits. Verify instruction discovery
with `copilot instruction list --json` and `/instructions` in the live session.

## Two bounded invocation checks

These are product acceptance checks, separate from the workshop smoke test.

1. In `/agent`, select **al-architect**. Submit:

   > Add a delivery note field to Customer and expose it on Customer Card.
   > Return only complexity, architecture and the next role. Do not modify files.

   Capture host-selected ID/source and invocation events, not merely an answer
   claiming to be Architect. Confirm the consumer files are unchanged.

2. Select **al-conductor** and approve exactly one read-only delegation:

   > Host delegation check only. I approve one delegation to
   > al-planning-subagent to research the delivery-note requirement above.
   > No writes, implementation, review, commit or further delegation. Read your
   > complete role contract, invoke the native task tool once, wait for the
   > result, summarize it and stop. If this context cannot delegate to that
   > custom agent, report the actual limitation without simulating it.

   Require a native `task` call naming `al-planning-subagent`, its parent link,
   completed result and Conductor response. Record failure/unsupported if that
   route is unavailable. Human role switching is not a passed delegation test.

For reproducible read-only checks, use host permission restrictions as well as
the prompt: deny `write` and `shell`; scope read access to the consumer and
installed plugin. Do not use blanket auto-approval. Logs and `/share` exports
must be reviewed/redacted before committing them.

## Evidence levels and current limits

| Level | Required evidence |
| --- | --- |
| Present | Generated files and provenance |
| Installed | Actual CLI install result and plugin listing |
| Discovered | Host catalog with source paths |
| Loaded | Host session selection/loading evidence |
| Invoked | Native invocation events and result |
| Verified | Acceptance result for the requested behavior |

See `docs/evidence/copilot-cli/validation.md` in the repository for this change's
recorded results. No authenticated Architect/Conductor pass is claimed without
the events above. MCP configuration listing is distinct from server connection,
tool discovery and successful tool invocation.

## Symbol MCP provider

CLI projects the symbol-provider fix from [PR #108](https://github.com/javiarmesto/ALDC-AL-Development-Collection/pull/108):
`al-symbols-mcp` starts `npx -y al-mcp-server@2.5.0` over stdio.
The server ID and role grants stay unchanged. The source fix lives in
`scripts/sync-copilot-cli.js`; the shared manifest and other distributions are
untouched. When the corrected shared declaration lands, it passes through.

The published package was verified against Stefan Maron's
[AL Dependency MCP Server](https://github.com/StefanMaron/AL-Dependency-MCP-Server).
Copilot CLI connected it and displayed six tools: `al_search_objects`,
`al_get_object_definition`, `al_find_references`, `al_search_object_members`,
`al_get_object_summary`, and `al_packages`. Its MCP handshake reports server
version `1.0.0`; npm package version is `2.5.0`. These are distinct evidence fields.
Actual symbol queries against an AL corpus remain unverified.

Let the host start the command with stdin/stdout pipes. Running the package
directly in an interactive terminal selects its installer, which can configure
other editors. Its first tool call also checks AL CLI and may install missing
AL tools. Provision and verify those prerequisites separately; a read-only role
must not use a symbol query as an implicit software bootstrap.

The observed CLI launches the plugin MCP from its cached plugin directory.
Use `al_packages` with `action: "load"` and an **absolute consumer project or
package-directory path**, then query that loaded corpus. Do not rely on the
server's working directory or treat an empty database as proof of missing AL
objects. Inspect the actual discovered schema before calls. An isolated consumer
without `.app` packages can validate connection/discovery, not symbol correctness.

After changing the generated manifest, reinstall the local plugin or update its
marketplace installation and start a new session. `/mcp` shows connection and
the server's Details view shows the tools. Offline package checks and an explicit
registry lookup are available separately:

```shell
node scripts/test-copilot-cli-mcp.js
node scripts/test-copilot-cli-mcp.js --registry
```

Registry success is not server startup, tool invocation or AL symbol validation.

## Maintenance and sources

```shell
node scripts/sync-copilot-cli.js
node scripts/sync-copilot-cli.js --check
node scripts/test-cli-plugins.js
node --test scripts/test-copilot-cli-surface.js
```

Only CLI sources and outputs are changed. Shared generators, canonical role
contracts, Claude/Codex payloads, VSIX/foundation, marketplace and version files
must stay unchanged in this delivery.

Official references checked 2026-09-19:

- [Plugin format, marketplace, cache and precedence](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
- [Creating and testing a plugin](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)
- [Custom agents for CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli)
- [CLI commands, tools, instructions, MCP, skills and hooks](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
- [Custom-agent configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)

Hooks are supported by the host, but ALDC CLI intentionally ships none in this
adaptation: importing Claude event payloads or enforcing a new hook policy would
be a separate behavior change. Existing canonical BCQuality role contracts remain.
