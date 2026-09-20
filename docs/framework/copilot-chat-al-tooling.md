# AL tooling in Copilot Chat / VS Code

This Chat-only contract takes precedence over availability examples in the native
contract and shared skills. It preserves ALDC roles, artifacts, independent review
and human gates. The installer projects agents AND prompts: prompt tool lists can
override an agent's list. Canonical primitives and terminal plugins are unchanged.

## AL LSP for Agents

Reuse the installed `sshadowsdk.al-lsp-for-agents` extension. It wraps Microsoft's
AL language server and exposes additional Chat tools. Do not register its LSP
executable as MCP or install a second language server. Every specialist receives
explicit navigation/diagnostic selectors; Conductor only coordinates. Symbol
rename is intentionally absent, including from documentation/test-agent prompts.

Check the extension's actual tool catalog, workspace roots and symbol cache.
Query a known definition and its references in App and Test, recording URI,
provider/version and result. A VS Code Go to Definition command alone does not
prove agent access. `inspectPage` can require AL build-tool prerequisites: missing
dependencies go to the setup owner; a query never authorizes provisioning.
If unavailable, use supplied source/symbol evidence and label the fallback.

## Official AL MCP (separate from LSP)

Workspace configuration is **`.vscode/mcp.json`**, with a top-level `servers` map.
The installer never creates, replaces, merges or deletes this user-owned file,
including on force/profile switch/rollback. Inspect workspace AND user-profile
servers before proposing a missing registration. Preserve JSONC comments, inputs,
credentials and existing aliases. Example only, not installed configuration:

```json
{
  "servers": {
    "al": {
      "type": "stdio",
      "command": "altool",
      "args": ["launchmcpserver", "--transport", "stdio"]
    }
  }
}
```

Use the actual executable path and supported ALTool/.NET 8 installation. Do not
start another server when an equivalent one is already configured. The generated
`al/<operation>` selectors assume alias `al`; resolve the tool picker IDs for the
installed version/alias and change only this consumer's Chat bindings as needed.
Discovery and a configured selector are not proof of connection or invocation.
Do not replace the explicit AL query list with `al/*`.

| Role/workflow | Official AL MCP | Optional capture |
| --- | --- | --- |
| Conductor / memory | None; consume results | None |
| Developer / Implementer / build | symbolsearch, getdiagnostics, getpackagedependencies; compile, build, downloadsymbols | Consume Triage evidence |
| Initialize | Queries; authorized downloadsymbols | None |
| Triage | Queries; request builds/restores from implementation | Dedicated profiling/snapshot proxies |
| Other specialists and prompts | Queries only | Consume evidence |

Operation names above have the `al_` prefix. Native VS Code tools are separate:
`bc29-native` retains its explicit native catalog; `bc28` uses LSP/MCP or supplied
source evidence without assuming BC29 native availability. Both profiles reuse
the existing normalization of obsolete tool names and the build/publication gate.
This changes installed Chat output, not the shared canonical agent files.

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

Select the actual provider/tool-picker entry and inspect its schema; native tools
and MCP can both use `scope`, but their full schemas must not be transposed.
For a standalone MCP that needs registration, a human or explicitly authorized
setup conversation can select the exact `al_addproject` tool to load the existing
folder on that same connection. Packaged specialist and prompt grants do not add
this operation; do not bypass their scope with terminal or generic delegation.
An editor workspace may already be loaded by a native provider, but that does not
prove the standalone MCP is initialized. Inspect each connection independently.
Keep `.vscode/mcp.json` user-owned. Publish, login/logout and credential reset
remain ungranted; setup requiring authentication is a separate human step.


These selectors constrain the Chat tool selection, not the whole machine. Some
existing roles retain terminal/editor/delegation tools for their original work;
the narrower AL scope remains a behavioral rule through those routes. Inspect
the actual agent, prompt, child and tool picker. Do not use terminal, command,
tool discovery or a delegated generic agent to bypass the role's AL scope.
Dredd may write only its existing audit artifacts; Triage does not edit AL code.

## Optional profiling and snapshot: Triage

BC29/runtime 18 preview capture is optional. BC28 can use existing logs, supplied
profiles and debugger evidence. The AL extension can discover proxies through
`launch.json`: inspect those before adding manual servers. Reuse the discovered
proxy IDs in Triage's tool list; do not duplicate discovery with manual startup.
The example selectors `bc-profiling/*` and `bc-snapshot/*` refer only to dedicated
capture servers, never to a general Business Central data or administration API.
Verify the actual catalog before any capture. No guessed operation names ship.

Only if a required proxy is absent, an explicitly reviewed `.vscode/mcp.json`
registration can use `altool` with these argument arrays:

```json
{
  "servers": {
    "bc-profiling": {
      "type": "stdio",
      "command": "altool",
      "args": ["launchprofilingmcpproxy", "--environmenttype", "Sandbox", "--environmentname", "YOUR_SANDBOX", "--tenant", "YOUR_TENANT"]
    },
    "bc-snapshot": {
      "type": "stdio",
      "command": "altool",
      "args": ["launchsnapshotmcpproxy", "--environmenttype", "Sandbox", "--environmentname", "YOUR_SANDBOX", "--tenant", "YOUR_TENANT"]
    }
  }
}
```

Use the provider's separately approved sign-in or securely provisioned
`BC_ACCESS_TOKEN`; never put token values into committed configuration or reports.
Confirm sandbox, identity, target and bounded capture window. Profiling selects a
numeric session; another user's session requires D365 ATTACH DEBUG. Snapshot
requires D365 Snapshot Debug and D365 ATTACH DEBUG: arm the authorized scope,
let the human reproduce, stop and collect. A session ID is optional when arming
the next reproduction. Do not profile and snapshot the same session together.
Record status, artifact location and cleanup failures. Stop only owned captures;
do not widen targets after failure. Snapshot playback/variable inspection remains
a handoff to a compatible debugger, not a presumed agent capability.

## Isolated acceptance and future release

Use a disposable consumer and separate VS Code user-data/extensions directories.
Do not install the candidate over the current profile. Check agent discovery,
including competing `.claude/agents` discovery; do not synchronize mirrors.
Record host and Copilot versions, session type, provider versions, actual tool
IDs and input/output for LSP queries, AL MCP queries and an authorized build.
Check effective catalogs for Spec, a reviewer, Implementer, Triage, Conductor and
the overriding prompts. Capture tests are separate and optional; absence stays
pending, not passed. Agent Host sessions receive forwarded MCP configuration from
VS Code and interactive inputs may not be supported; verify that session type
without moving the workspace configuration to a different filename.

Exercise installation, update, profile switch and rollback with an existing
`.vscode/mcp.json`; its bytes must remain identical. Rollback of ALDC does not undo
manual provider changes. Stop owned captures before intentionally removing only
registrations added for this test.

This work remains an unmerged candidate. No version bump, tag, Marketplace
publication, current-profile install or tenant deployment is included. A final
VSIX requires a separately selected matching canonical/extension version, clean
input commits, recorded provenance and host acceptance. Do not bypass that gate.

## Sources inspected 2026-09-20

- [Provider tool catalog](https://github.com/SShadowS/al-lsp-for-agents/blob/6535989729036dfbbe99086bec93cb36c216ec79/vscode-extension/package.json)
- [VS Code custom agents and prompt precedence](https://code.visualstudio.com/docs/agent-customization/custom-agents)
- [VS Code MCP configuration](https://code.visualstudio.com/docs/agent-customization/mcp-servers)
- [Official AL MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-mcp-server)
- [Profiling MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/scheduled-performance-profiler-overview#profiling-with-an-ai-agent-mcp-server)
- [Snapshot MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-snapshot-debugging#snapshot-debugging-with-an-ai-agent-mcp-server)
