# AL tooling in Codex

This Codex-specific guide takes precedence over host availability examples in
`skills/skill-migrate/references/cli-al-tools.md`. It does not change ALDC's
workflow, independent reviews or human gates. Bootstrap does not install or
configure providers. Keep existing aliases, credentials and unrelated settings.

## LSP: explicit pending integration

AL LSP for Agents is the chosen provider, wrapping the Microsoft AL language
server. Its standalone entrypoint speaks LSP over stdio. The provider's
[standalone guide](https://github.com/SShadowS/al-lsp-for-agents/blob/6535989729036dfbbe99086bec93cb36c216ec79/docs/standalone.md)
explicitly says Codex CLI lacks LSP integration. The Codex configuration reference
inspected on 2026-09-20 exposes no native LSP registration. Therefore this package
ships neither a guessed LSP setting nor a second server.

Having the VS Code extension installed does not prove that the Codex IDE agent
can call it: editor navigation and agent tool exposure are separate observations.
Inspect the actual session catalog. Until a supported route and semantic query
are demonstrated, label source search or existing symbol MCP results as fallback
evidence, not LSP execution. Keep AL LSP for Agents installed for supported hosts.
Do not put its LSP executable under `mcp_servers`: the protocols differ.

**Decision left for review:** a supported provider/host integration should be
preferred when available. If Codex needs an LSP-to-tool bridge, approve a separate
bounded design covering initialization, App/Test roots, document versions,
query-only operations, cancellation, lifecycle, platform packaging and ownership.
This PR does not silently introduce that maintenance responsibility. P3 cannot
claim complete LSP coverage until the route is resolved and tested.

## Official AL MCP, separately from LSP

Reuse the existing official server (often named `al` or `almcp`). For a missing
server only, adapt this query-only example in user `~/.codex/config.toml` or a
trusted project's `.codex/config.toml`. Use the installed absolute executable
path when needed; on Windows use a TOML literal path such as
`'C:\Tools\AL\altool.exe'`. ALTool needs its supported AL installation and .NET 8.

```toml
[mcp_servers.al]
command = "altool"
args = ["launchmcpserver", "--transport", "stdio"]
enabled_tools = ["al_symbolsearch", "al_getdiagnostics", "al_getpackagedependencies"]
```

Inspect the discovered schema, including the `parameters` wrapper for symbol
search. Pass the selected project's absolute `projectPath` where supported;
handle App/Test separately and use matching dependency packages. A diagnostics
query does not prove a fresh compilation. Record tool, project and actual result.

ALDC's intended scopes are:

| Role | Official AL operations | Capture |
| --- | --- | --- |
| Conductor | Delegate, consume results | Delegate |
| Developer, Implementer | Queries plus compile/build/download symbols when authorized | Consume Triage evidence |
| Triage | Queries, diagnose; request builds from implementation | Optional dedicated proxies |
| Architect, Spec, Planning, reviewers, Dredd, Presales, Agent Builder | Queries | Consume evidence |

These scopes are **instructions**, not generated MCP permission filters. No
profile adds server transport or credentials. Existing filesystem sandbox modes
cannot constrain remote MCP effects; Dredd/Triage's report-only write limits
remain behavioral. Reading a role reference through the skill does not load its
TOML custom-agent profile. Parent runtime overrides also affect the final policy.

Codex supports MCP settings in custom-agent TOML. For an authorized implementation
context, a reviewed server binding can use the same transport and this allowlist:

```toml
[mcp_servers.al]
command = "altool"
args = ["launchmcpserver", "--transport", "stdio"]
enabled_tools = ["al_symbolsearch", "al_getdiagnostics", "al_getpackagedependencies", "al_compile", "al_build", "al_downloadsymbols"]
```

Apply a binding only after inspecting the actual alias and complete inherited
configuration. Do not paste duplicate tables or assume that a differently named
provider is filtered. Do not broaden an existing `disabled_tools` policy: denial
is applied after the allowlist. An implementation binding in the parent can be
inherited by reviewers. Check each child catalog; if isolation is not established,
use a separately configured query-only review session and return its evidence.
Do not claim enforced per-role MCP isolation from these examples alone.

Publication and login/logout are deliberately absent. Authentication or symbol
restore that opens a login flow needs its own explicit setup; never silently
install tools or change credentials to satisfy a query. The community symbols
provider may provision dependencies on first use: check prerequisites beforehand.
Tests require a real test runner; compilation alone is not executed tests.

## Optional profiling and snapshot in Triage

These BC29/runtime 18 preview capabilities remain optional; BC28 work can use
supplied logs, profiles and debugger evidence. Register only a missing dedicated
proxy in the reviewed Triage context, not by default in all sessions. Examples:

```toml
[mcp_servers.bc-profiling]
command = "altool"
args = ["launchprofilingmcpproxy", "--environmenttype", "Sandbox", "--environmentname", "YOUR_SANDBOX", "--tenant", "YOUR_TENANT"]
env_vars = ["BC_ACCESS_TOKEN"]

[mcp_servers.bc-snapshot]
command = "altool"
args = ["launchsnapshotmcpproxy", "--environmenttype", "Sandbox", "--environmentname", "YOUR_SANDBOX", "--tenant", "YOUR_TENANT"]
env_vars = ["BC_ACCESS_TOKEN"]
```

Use a provisioned environment token or the provider's separately authorized
sign-in flow. Never embed token values in shared TOML or evidence. The examples
expose the dedicated proxy catalogs; inspect actual tool names before choosing
an `enabled_tools` subset. No invented tool list or general BC data API is implied.
Other roles must not inherit capture tools: verify their effective catalogs or
use a separately configured Triage session. Reading the Triage role alone does
not establish that separation.

Confirm the sandbox, identity, target and capture window. Profiling selects a
numeric session; stop and collect the owned schedule. Another user's session
needs D365 ATTACH DEBUG. Snapshot capture requires D365 Snapshot Debug and
D365 ATTACH DEBUG: arm the authorized scope, let the human reproduce, then stop
and collect. A session ID is optional when arming the next reproduction. Do not
profile and snapshot the same session simultaneously. Retain capture status,
artifact location and cleanup failures; do not widen targets after a failure.
Keep artifacts in the approved location. Snapshot playback and variable inspection
remain an explicit handoff to a compatible debugger, not an assumed agent ability.

## Acceptance and rollback

1. In an isolated consumer, preview/apply/update/verify/rollback ALDC and confirm
   existing user/project MCP and LSP configuration survives. Resolve plugin versus
   local-skill precedence; inspect the complete loaded custom-agent profile.
2. Capture the effective catalogs in the parent, an implementation child, a
   reviewer and Triage. A TOML parse or `codex mcp list` is configuration evidence,
   not connection, role isolation or successful invocation. Do not execute a
   forbidden operation merely to test absence.
3. Query a known project/dependency symbol and diagnostics. Compile an authorized
   App/Test fixture as Developer/Implementer; record version, path, call and result.
4. Resolve the LSP route before claiming support; then verify definitions and
   App/Test references in a role and relevant subagent.
5. If the optional BC environment is available, validate each capture separately,
   including stop/collection and useful evidence. Otherwise mark it unavailable.

Undo only intentionally added configuration, after stopping owned captures.
Preserve existing providers and credentials. Rollback of ALDC's files does not
roll back manual MCP settings. No release, tenant mutation or deployment is part
of installation validation. Host/runtime gaps keep this candidate in draft.

## Sources inspected 2026-09-20

- [Codex MCP](https://developers.openai.com/codex/mcp/)
- [Custom agents and inheritance](https://developers.openai.com/codex/subagents/)
- [Configuration reference](https://developers.openai.com/codex/config-reference/)
- [Official AL MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-mcp-server)
- [Profiling MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/scheduled-performance-profiler-overview#profiling-with-an-ai-agent-mcp-server)
- [Snapshot MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-snapshot-debugging#snapshot-debugging-with-an-ai-agent-mcp-server)
