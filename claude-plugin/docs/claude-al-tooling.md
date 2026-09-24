# Claude Code AL tooling

Claude-specific bindings, reviewed 2026-09-20. This guide overrides older
availability examples in the shared terminal contract; its role responsibilities,
human gates and evidence requirements still apply. Providers remain external and
optional. Missing tooling does not prevent source-based work.

## Reuse AL LSP for Agents

Use the existing [AL LSP for Agents](https://github.com/SShadowS/al-lsp-for-agents)
companion. It wraps Microsoft's AL language server; it is distinct from AL MCP.
Inspect `/plugin` and the active `.al` provider before configuring anything. Record
Claude, companion and AL Language versions. Follow the companion's platform setup
only if absent and installation is requested. ALDC does not ship `.lsp.json`,
install binaries, alter enabled plugins or start another AL language server.

All specialist agent definitions include Claude's `LSP` tool; Conductor delegates
AL investigation. Use only operations exposed in the current session. Test a
definition, App/Test references and a dependency symbol against the consumer
project. The plugin cache is not the workspace. Text search remains useful source
evidence but does not demonstrate semantic navigation.

Verify main-session, foreground-subagent and any used background-subagent access
separately. A declared tool is not proof of availability in every mode. If a mode
cannot access LSP, return that limitation and the unresolved query to the caller;
do not claim semantic success or install a bridge to conceal it.

### Execution mode on Claude Code 2.1.278

The owner's Windows smoke found LSP in the main Architect session and in a
foreground Architect subagent, but not in newly spawned background Architect or
Reviewer agents. Claude's documented background built-in filter excludes LSP;
listing it in frontmatter does not override that filter. MCP queries remained
available in background agents. See [available tools and execution mode](https://code.claude.com/docs/en/sub-agents#available-tools).

For an explicitly selected foreground test, launch from the consumer directory
in Windows Terminal (not PowerShell ISE). This setting lasts only in the child
process and makes delegated work foreground, affecting concurrency:

```powershell
cmd /c "set CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1&& claude --plugin-dir C:\ALDC-Lab-20260920\fuentes\claude\claude-plugin"
```

Adapt the example path to the actual candidate. Do not persist this setting or
change user defaults during initialization. In this mode Architect discovered
LSP with `ToolSearch` and executed `documentSymbol`. A resumed instance then
executed definition/reference queries; that is not evidence for a newly spawned
background agent. Keep normal MCP background work available as a separate choice.
Do not broaden agent grants or replace the native role with a conversation fork
to evade these differences.

On this version `/agents` reports that its wizard was removed. Inspect `/plugin`
and the actual Agent/skill catalog; absence from that old wizard is not a loading
failure. Confirm the candidate directory as well as the plugin name/version.

## Role loading and permissions

`/aldc:<role>` loads instructions into the existing main conversation. Reading an
agent file does not apply its frontmatter as host permissions. For the agent's
explicit tool list use `claude --agent aldc:<agent-id>` or genuine host delegation,
and inspect the resulting tools. Planning and both review roles have no shell,
file-writing or delegation grant. Dredd retains its pre-existing report-writing
grant; its report path remains a behavioral limit, not a filesystem sandbox.

Plugin-agent `mcpServers`, `hooks` and `permissionMode` fields are ignored by Claude.
Do not use those fields to claim a boundary. Session-wide settings and any parent
tool restrictions still apply. Record the loading mode with each permission test.

## Official AL MCP: opt-in connection

Inspect `/mcp` before setup. Reuse an existing Microsoft AL MCP connection and
check its actual tool catalog/schema. The community `al-symbols-mcp` is a distinct
provider and remains configured. ALDC does not remove it or equate it with the
Microsoft server. The plugin's initializer leaves all provider configuration alone.

For a requested new connection, after verifying `altool` and its version/help,
merge this entry into the project's existing `.mcp.json` without replacing other
servers. It requires Microsoft's AL toolchain and .NET 8. Use the installed
executable's absolute path if it is not on PATH.

```json
{"mcpServers":{"al":{"command":"altool","args":["launchmcpserver","--transport","stdio"]}}}
```

These agent definitions bind the user/project alias `al`, yielding
`mcp__al__<tool>`. If an existing official server uses another alias, do not start
a duplicate or rename it silently. Inspect its effective names and adapt a
host-local agent definition's explicit names before claiming role support. An
unmatched alias is unavailable to the packaged allowlist. Plugin-scoped providers
have different names; the shipped community aliases do not identify this server.

| Roles | Additional official AL tools |
| --- | --- |
| Architect, Spec, Planning, Presales, Agent Builder, both reviewers, Dredd, Triage | `al_symbolsearch`, `al_getdiagnostics`, `al_getpackagedependencies` |
| Developer, Implementer | The query set plus `al_compile`, `al_build`, `al_downloadsymbols` |
| Conductor | None; delegate to the appropriate role |

There is no `mcp__al__*` grant. Publishing, login and logout are not granted;
keep the existing separately authorized human/CI path. An allowed compile or
restore still needs the implementation task's authorization. Agent allowlists
limit exposed MCP names, not filesystem paths or commands reachable through a
role's existing shell. Entry skills do not apply those allowlists.

### Prepare the live MCP workspace before role queries

A connection and an absolute `projectPath` do not load a project automatically.
The host smoke first returned `No projects are loaded`. From an authorized setup
conversation, inspect `mcp__al__al_addproject` and register the existing folder
containing `app.json`. The observed schema required only `projectPath`; the call
succeeded without scaffolding or source changes. Then delegate the query to the
native specialist on the same live connection. A restricted `--agent` session
may not expose this setup operation; return the prerequisite rather than using
shell, another alias or a generic delegate to bypass that role's tool list.

`al_addproject` remains outside specialist grants. Preparation is an explicit
caller/human action, not a query fallback or an automatic initializer action.
Do not download symbols, change credentials or create a new project as setup
side effects. A second alias or restarted server may have a separate workspace;
recheck registration after reconnecting. An editor opening the folder does not
prove that this standalone MCP connection loaded it.

### Discover schemas per operation

The owner's installed server exposed the following behavior; its executable
version was not retained, so these are observations, not version-wide promises:

| Operation | Observed behavior |
| --- | --- |
| `al_symbolsearch` | Top-level `query` and optional `filters`; `parameters` deprecated, no `projectPath`; scope is relative to the loaded workspace |
| `al_getpackagedependencies` | Optional `projectPath` and `name`; successful after registration |
| `al_getdiagnostics` | Supports project/folder/file filters; reports existing server diagnostics |
| `al_compile` | Validates the loaded workspace, no `.app` output and no `projectPath`; inspect its actual options envelope |
| `al_build` | Flat `projectPath` and `scope: current` produced a `.app` |

Do not hard-code an old `parameters` wrapper or transpose inputs between tools.
The copied compile report described an `options` envelope but displayed a flat
argument; the exact raw request remains unverified. Preserve this uncertainty
instead of turning that snippet into an example. Record expanded tool inputs.

Select App/Test deliberately. For operations without a path parameter, establish
which projects the live workspace covers; stop if the requested scope is
ambiguous. Zero diagnostics does not prove CodeCop/AppSourceCop ran. Compiler
validation, package generation, file-existence checks and executed tests are
separate claims. Preserve BC28, manifests and approved dependencies. Doctor and
installation do not connect, register projects or authenticate automatically.

To undo a manually added connection, remove only that entry from its original
configuration scope; retain pre-existing entries, credentials and LSP configuration.

## Optional Triage profiling and snapshot

These are BC29/runtime 18 preview capabilities. Their absence on BC28 is expected;
continue source/log triage. Reuse configured dedicated proxies, with environment
MCP enabled and the current user's required permissions. Setup is separate from
permission to capture. After explicit connection setup, use these entries under
`mcpServers`, replacing the example target with the approved sandbox:

```json
{
  "bc-profiling": {
    "command": "altool",
    "args": ["launchprofilingmcpproxy", "--environmenttype", "Sandbox", "--environmentname", "sandbox", "--tenant", "contoso.onmicrosoft.com"]
  },
  "bc-snapshot": {
    "command": "altool",
    "args": ["launchsnapshotmcpproxy", "--environmenttype", "Sandbox", "--environmentname", "sandbox", "--tenant", "contoso.onmicrosoft.com"]
  }
}
```

Reuse cached ALTool sign-in. If authentication is absent, return that prerequisite;
do not initiate login, clear tokens or change permissions as a diagnostic probe.
Do not put credentials in command arguments or tracked configuration.

Only Triage has `mcp__bc-profiling__*` and `mcp__bc-snapshot__*`. These grants cover
**all tools exposed by those dedicated proxies**, not a per-operation boundary.
Never point the aliases at the general Business Central API server or another
provider. Inspect the actual catalog and schemas before use; do not derive wire
names from documentation's human-readable labels. A changed/broader catalog needs
review before capture. No proxy is declared in ALDC's manifest or autostarted.

For profiling, obtain the authorized numeric session ID and bounded window before
scheduling. Another user's session also requires D365 ATTACH DEBUG. Stop and collect
that schedule; keep artifact paths, timings and correlation details in the triage
report. Save needed recordings before local retention removes them. Previously
captured profiles may be analyzed locally through the available proxy operation.

For snapshot, identify the reproduction, client/user scope and relevant snappoints.
A session ID is optional when arming the next reproduction. Both D365 Snapshot
Debug and D365 ATTACH DEBUG are required by MCP. Report when armed, let the human
reproduce the authorized scenario, then query status and finalize. Collect the
archive and hand it to the configured snapshot debugger; capture does not prove
that Claude can step through it or inspect variable values autonomously.

Do not combine profiling and snapshot on the same session. If capture fails, report
its known schedule/snapshot identity and cleanup status; do not retry with a wider
target. Preserve business-data artifacts in the approved project location, not the
plugin cache or repository by default. Triage hands findings and coverage limits
to Developer; it does not implement the fix or replay business actions implicitly.
To revert setup, remove only the newly added proxy entries after ending any owned
capture. Other roles consume evidence without being granted these proxy tools.

## Evidence before acceptance

Use existing plan/triage artifacts. Separate configuration detected, connection
observed, invocation performed and functional result. Record provider versions,
project/revision, exact tool names, operation inputs without secrets, and output
references. Static packaging tests do not satisfy this host smoke test.

- Reuse the already enabled companion; confirm a single active `.al` provider.
- From Architect or Spec, resolve a real definition and dependency symbol.
- From a foreground Planning subagent, resolve an App/Test reference. Inspect its
  effective tools and confirm there is no shell, write or delegation access.
- From Developer, compile the authorized App/Test fixture through the discovered
  official MCP and retain the result; reviewers must not receive compile, restore,
  publish or authentication tools. Do not run forbidden operations to test absence.
- In a compatible sandbox, separately validate one bounded profile and one
  snapshot through Triage: catalog, target, capture, stop and retrievable artifact.
  Record snapshot inspection separately. An unavailable optional capability is
  reported as such, not as a failed BC28 installation.
- Check a background mode separately if it is part of the intended workflow.
- Initialize/update ALDC and verify existing MCP and LSP settings are unchanged.

Packaging tests do not perform authenticated host calls. The owner supplied a
separate Windows host smoke on 2026-09-20: main/foreground Architect LSP, background
MCP queries, nested Conductor-to-Planning MCP, Developer compile/build and a
Reviewer tool-catalog check. This is partial acceptance: Spec, Planning LSP,
App/Test crossings, dependency LSP, BCQuality, human gates, analyzer execution and
optional captures still require their own evidence. The repo evidence is at
`docs/evidence/claude-al-tooling/host-smoke-2026-09-20.md` (not a packaged path).

## Sources

- [Claude plugin LSP configuration](https://code.claude.com/docs/en/plugins-reference#lsp-servers)
- [Claude subagents and plugin restrictions](https://code.claude.com/docs/en/sub-agents)
- [AL LSP for Agents source and setup](https://github.com/SShadowS/al-lsp-for-agents)

- [Microsoft AL MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-mcp-server)

- [Microsoft profiling MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/scheduled-performance-profiler-overview#profiling-with-an-ai-agent-mcp-server)
- [Microsoft snapshot MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-snapshot-debugging#snapshot-debugging-with-an-ai-agent-mcp-server)
