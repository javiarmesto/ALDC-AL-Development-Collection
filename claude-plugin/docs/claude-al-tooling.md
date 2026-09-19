# Claude Code AL tooling

Claude-specific bindings, reviewed 2026-09-19. This guide overrides older
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

Pass the consumer project's absolute `projectPath` according to each discovered
schema, selecting App or Test deliberately. `al_symbolsearch` uses a `parameters`
wrapper; do not copy that shape to other tools. Keep cache/project identities in
the evidence. Diagnostic results can reflect the server's existing session and
are not proof of a fresh build. Preserve BC28; do not change runtime, manifests or
dependencies just to exercise a tool. No connection/authentication is attempted by
Doctor or installation on behalf of this guide.

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

No authenticated Claude/LSP invocation has been performed by the packaging tests.

## Sources

- [Claude plugin LSP configuration](https://code.claude.com/docs/en/plugins-reference#lsp-servers)
- [Claude subagents and plugin restrictions](https://code.claude.com/docs/en/sub-agents)
- [AL LSP for Agents source and setup](https://github.com/SShadowS/al-lsp-for-agents)

- [Microsoft AL MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-mcp-server)

- [Microsoft profiling MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/scheduled-performance-profiler-overview#profiling-with-an-ai-agent-mcp-server)
- [Microsoft snapshot MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-snapshot-debugging#snapshot-debugging-with-an-ai-agent-mcp-server)
