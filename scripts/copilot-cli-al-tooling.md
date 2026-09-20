# AL tooling in Copilot CLI

Reviewed 2026-09-20. This CLI-specific guide supersedes old capability-availability
examples in the shared terminal contract. Role responsibilities, human gates and
evidence rules still apply. Installation does not invoke AL operations.

## LSP: reuse the installed AL LSP for Agents wrapper

Inspect `copilot lsp list --json` and `/lsp` before setup. Reuse the existing
provider for `.al`; Claude's enabled plugins do not configure Copilot CLI. Record
the CLI, wrapper and Microsoft AL Language versions. Use the provider's installed
platform binary; do not copy the Claude manifest or install software implicitly.

If CLI has no AL provider and setup is requested, merge this definition into
`.github/lsp.json` or the user's `lsp-config.json`, preserving other definitions:

```json
{"lspServers":{"al":{"command":"/absolute/path/to/al-lsp-wrapper","args":[],"fileExtensions":{".al":"al",".dal":"al"},"rootUri":"."}}}
```

Windows uses the corresponding `.exe` and a JSON-escaped absolute path. The
wrapper's `--launcher claude-code` is intentionally absent. Select the consumer
workspace root, not ALDC's cache; set `rootUri` appropriately for App/Test layouts.
Same-name precedence is project, plugin, user. Different names may still represent
the same provider: inspect all sources, not just the `al` key. ALDC deliberately
does not register another server from its manifest.

Use the actual host's semantic operations for definitions, references and
dependencies. No Claude `LSP` or VS Code tool identifier is copied into CLI grants.
The CLI documentation does not establish a separate query-only LSP alias for
custom agents. Existing read/search grants are retained; verify the effective LSP
tools in a selected specialist and delegated Planning before claiming support.
If filtering hides them, report the missing binding; do not widen to `*` or grant
a combined rename/write capability to research/review roles. Semantic access from
those roles remains an acceptance item, not a claim made by this configuration.

`/lsp test al` starts a temporary server and then stops it; configuration listing
alone neither starts the provider nor proves a semantic query worked. Check the
real query result on the authorized App/Test fixture. Text search is source
evidence, not semantic evidence.

## Official AL MCP: separate opt-in configuration

Inspect `/mcp` and reuse an existing official Microsoft server. The shipped
community `al-symbols-mcp` remains a distinct provider. After requested setup and
checking the installed `altool` path/help and .NET 8, merge this into the existing
CLI MCP configuration (`.mcp.json`, `.github/mcp.json` or user `mcp-config.json`):

```json
{"mcpServers":{"al":{"type":"local","command":"altool","args":["launchmcpserver","--transport","stdio"],"tools":["al_symbolsearch","al_getdiagnostics","al_getpackagedependencies","al_compile","al_build","al_downloadsymbols"]}}}
```

The explicit server filter omits publish/login/logout. Agent frontmatter then
selects `al/<tool>`: query operations for specialists, additionally compile/build/
restore for Developer and Implementer, none for Conductor. No `al/*` grant. Names
in frontmatter are selectors; call the actual names/schema discovered by CLI.
An existing different alias needs a matching reviewed host-local agent binding,
not a duplicate connection. Leave other MCP settings and tokens intact.

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

The normal server filter above intentionally excludes workspace preparation.
If registration is required, an authorized parent setup context must explicitly
include `al_addproject` in that server's `tools` list before starting the shared
connection. Packaged role selectors remain query/implementation-specific and do
not grant `al/al_addproject` to specialists. Verify the actual parent/child
catalogs and shared connection in CLI; stop if preparation cannot be separated.
Do not broaden a specialist to `al/*`, or assume a setup-only process initializes
a later query-only process. Preserve BC28, approved dependencies and credentials.


## Triage: optional profiling and snapshot

BC29/runtime 18 preview only. BC28 continues with source/log evidence. Reuse
dedicated proxies if configured. Otherwise, after requested setup, add separately
under `mcpServers`, with the approved environment in place of the example:

```json
{
  "bc-profiling": {"type":"local","command":"altool","args":["launchprofilingmcpproxy","--environmenttype","Sandbox","--environmentname","sandbox","--tenant","contoso.onmicrosoft.com"],"tools":["*"]},
  "bc-snapshot": {"type":"local","command":"altool","args":["launchsnapshotmcpproxy","--environmenttype","Sandbox","--environmentname","sandbox","--tenant","contoso.onmicrosoft.com"],"tools":["*"]}
}
```

Only Triage receives `bc-profiling/*` and `bc-snapshot/*`. These are whole-proxy
grants, not per-operation boundaries. Do not assign those names to the general BC
API server. Inspect the live catalog and argument schemas before capture; do not
invent tool IDs from documentation labels. Reuse cached authentication; never put
secrets in args or tracked configuration. No proxy is autostarted by ALDC.

Profiling needs the authorized numeric session and bounded duration. Capture,
stop and collect that schedule; retain paths and timing/correlation evidence.
Another user's session requires D365 ATTACH DEBUG. Save required profiles before
local retention removes them; supplied profiles can also be analyzed locally.

Snapshot needs an authorized reproduction and client/user scope; a session ID is
optional when arming the next reproduction. It requires both D365 Snapshot Debug
and D365 ATTACH DEBUG through MCP. Report when armed, let the human reproduce,
query status and stop/collect the archive. Hand it to the available snapshot
debugger; archive capture does not establish autonomous stepping or variable
inspection. Do not profile and snapshot the same session simultaneously.

Report failed captures and known cleanup state without broadening the target.
Keep business-data artifacts in an approved location. Triage hands evidence to
Developer; other roles consume it without capture grants. Existing shell/file
permissions remain broader than role instructions; these are not path sandboxes.

## Dredd: independent findings, separate persistence

Dredd has no edit, shell or delegation grant. It returns the complete unchanged
Audit-Report JSON and states whether persistence is pending or forbidden. The
caller or human can explicitly save that returned JSON with the bundled helper:

```sh
node /path/to/aldc-cli/scripts/save-audit.js --project /path/to/consumer --input /path/to/returned-report.json
```

`--input -` reads stdin. The helper preserves the exact JSON bytes, checks the
basic advisory-report envelope, creates only a new randomly named JSON file in
`.github/audits/`, refuses symlinked destination directories and never overwrites.
It reports the resulting path/hash. It does not execute payload strings or certify
findings, citations or provider use. Run it in an ordinary trusted workspace;
it is not a sandbox against concurrent hostile filesystem mutation. It is not
exposed as an MCP tool and Dredd cannot run it itself. If persistence is forbidden,
chat delivery completes reporting; otherwise keep persistence pending until a
real save receipt exists. No new writer agent or workflow coordinator is added.

## Acceptance and rollback

Record configuration, connection, invocation and useful result separately in the
existing plan/triage artifacts. The owner's acceptance of #109 remains valid;
it does not assert execution of these new capabilities.

1. Install this candidate in an isolated CLI configuration; inspect plugin/agent
   precedence and confirm existing MCP/LSP settings survive init/update/rollback.
2. Resolve a real definition and dependency symbol from Architect/Spec and an
   App/Test reference from foreground Planning. Check effective tools, including
   absence of write/rename/compile for research and review. Check background modes
   separately if used. Do not perform forbidden operations to test absence.
3. Compile the authorized fixture via official MCP as Developer; retain actual
   project, version, call and result. Compilation is not executed tests.
4. Run Dredd on a small change; hand its JSON to the separate saver and compare
   bytes/hash. Dredd should have no editing capability.
5. In a compatible authorized sandbox, validate a profile and snapshot separately,
   including stop/collection. Otherwise record optional capability unavailable.

Remove only newly added configuration entries to undo setup, after ending owned
captures. Preserve existing providers and credentials. ALDC initialization does
not configure MCP/LSP, invoke builds or captures, or publish anything.

## Sources

- [CLI LSP configuration](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/add-lsp-servers)
- [CLI LSP behavior](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/lsp-servers)
- [Agent tool selectors](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [CLI MCP schema](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#mcp-server-configuration)
- [Chosen AL LSP provider](https://github.com/SShadowS/al-lsp-for-agents)
- [Official AL MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-mcp-server)
- [Profiling](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/scheduled-performance-profiler-overview#profiling-with-an-ai-agent-mcp-server)
- [Snapshot](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-snapshot-debugging#snapshot-debugging-with-an-ai-agent-mcp-server)
