# AL tooling in Codex

This Codex-specific guide takes precedence over host availability examples in
`skills/skill-migrate/references/cli-al-tools.md`. It does not change ALDC's
workflow, independent reviews or human gates. Bootstrap does not install or
configure providers. Keep existing aliases, credentials and unrelated settings.

## Confirm the active installation

Verify the session's working directory, actual skill path and native profile
invocation separately from bootstrap's file verification. In the owner's Windows
IDE smoke on 2026-09-21, starting in the App subfolder of a non-Git scenario still
exposed an older globally enabled plugin from the 4.2.0 cache. The scenario-root
plugin override existed on disk, but its use by that session was not established.
Opening the scenario root in a new IDE window and starting a fresh session exposed
the intended `.agents/skills/aldc/SKILL.md` and native `al-architect` profile.
This is an observed recovery, not a guarantee about every host's config discovery.

Before changing configuration, inspect the active skill path, project trust and
effective plugin settings. Preserve unrelated global settings and other surfaces.
Bootstrap `--verify` with no drift still reports `hostLoading: unverified`; it does
not certify discovery. A missing Python interpreter blocked Doctor in this smoke,
but did not prevent the Node bootstrap or subsequent AL MCP calls.

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

### Server workspace and live schemas

A connected server is not necessarily a loaded AL workspace. In the owner's
2026-09-20 Claude smoke, a dependency query with an absolute `projectPath` returned
`No projects are loaded`. A separately authorized setup call to `al_addproject`
with the existing App folder loaded it; subsequent delegated queries succeeded.
This is a provider prerequisite to check in this host, not runtime validation of
this surface. Read the installed tool's description first: register an existing
folder containing `app.json`; do not scaffold an application, change files,
download symbols or initiate authentication as a query fallback.

Prepare the same live server connection that the specialist will use. Another
alias, a separate setup process or a restarted server may have different state.
Recheck after reconnecting. Keep App and Test identities explicit: do not assume
`scope: project` selects one particular folder when several projects are loaded.
An ambiguous workspace-wide operation must stop until its scope is resolved.

Discover every operation's schema, including any wrapper. The following behavior
was observed in Claude against the installed Microsoft server; its executable
version was not captured, so verify it again in each host/version:

| Operation | Observed input and effect |
| --- | --- |
| `al_addproject` | Required `projectPath`; registers an existing project in the live server workspace |
| `al_symbolsearch` | Top-level `query` and optional `filters`; `parameters` deprecated; no `projectPath`; `filters.scope` uses the loaded workspace |
| `al_getpackagedependencies` | Optional `projectPath` and `name`; a path does not itself load the project |
| `al_getdiagnostics` | Project/folder/file filters according to schema; existing server diagnostics, not a fresh compile |
| `al_compile` | Validates the loaded workspace without a `.app`; no `projectPath` in the observed schema; inspect the exact options shape |
| `al_build` | Observed flat `projectPath` and `scope: current`; generates a `.app` |

A no-diagnostics response does not establish analyzer execution. Enable CodeCop
or AppSourceCop only for authorized work and record their actual configuration.
A package path reported by `al_build` and a subsequent file-existence check are
separate evidence. Neither compilation nor packaging proves tests were run.
Never copy a Claude wire prefix, execution-mode setting or runtime PASS into
this host's acceptance record.

### Preparation belongs to the connection that executes the query

The owner's 2026-09-21 Codex IDE smoke showed a successful parent registration,
then `No projects are loaded` in native `al-architect`, while the parent could
still query dependencies. Explicitly authorized `al_addproject` followed by
`al_getpackagedependencies` in the child succeeded for SalesMargin (five BC 29
dependencies). This demonstrates different observed workspace state; it does not
establish process IDs, server topology or every host's lifecycle.

The query-only example intentionally omits `al_addproject`. If preparation is
needed, an explicitly reviewed binding may additionally expose that single setup
operation to the executing agent. It is no longer a query-only binding. Generated
profiles do not add transports or change tool filters, sandbox modes or denials.
An absent/denied setup tool is a blocker, not permission to reconfigure the host.

For a role that performs AL queries, preparation is allowed only when the user
has explicitly authorized it, including authorization carried by a delegation.
Use the exact existing App/Test folder containing `app.json`, confirmed by the
owner or a permitted read-only check, and inspect the installed tool schema.
Register it in that agent's own live connection. If a query returns the specific
no-projects-loaded error, allow one authorized registration and one retry in the
same connection. Other failures must be reported, not treated as setup requests.
Do not scaffold, edit source, restore symbols, authenticate, compile or publish
as a preparation fallback. Existing authorization need not be requested again.

Conductor passes the target and existing authorization to the delegated role;
it does not register projects itself. New children, aliases and reconnects must
not assume they inherit prepared state. Never restart solely to switch filters
and claim state survived. Inspect actual inherited catalogs: exposing setup does
not establish per-role enforcement, and filesystem sandbox modes do not enforce
remote MCP scopes. Preserve credentials and denials.

The successful smoke used candidate `f9d93d7` with an explicit diagnostic prompt.
The revised generated instructions still need a refreshed host session to prove
their behavior without that prompt. See repository evidence
`docs/evidence/codex-al-tooling/host-smoke-2026-09-21.md` for scope and limitations.


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
