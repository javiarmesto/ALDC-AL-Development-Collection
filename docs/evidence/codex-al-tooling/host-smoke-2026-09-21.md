# Codex IDE owner smoke — 2026-09-21

Recorded on 2026-09-22 for PR #114. Source: owner-supplied session reports and
literal tool responses in the ALDC surface-validation conversation. These were
not independently replayed here; no complete raw host transcript was supplied.
Claude results are not Codex evidence.

## Candidate and environment

- Candidate: `f9d93d7be0e5799ed9f28507d28d9a332bb1074d`.
- Windows, VS Code Insiders extension `openai.chatgpt-26.5908.31748-win32-x64`;
  bundled runtime reported `codex-cli 0.154.0-alpha.6.1`.
- Scenario: `C:\ALDC-Forge-Tests\SalesMarginALDC_STD`; App: `app`; Test: `test`.
  No Git worktree was detected for the scenario or App folder.
- Bootstrap verification: `{"drift":[],"hostLoading":"unverified"}`.
- Initial App-folder session exposed the globally enabled `aldc-codex:aldc`
  plugin from `aldc-canonical-local` cache `4.2.0`. A scenario-root disable
  override existed, but its effective loading was not established in that session.
- After opening the scenario root in a fresh IDE window/session, the catalog
  exposed `aldc` from `.agents/skills/aldc/SKILL.md`. Native `al-architect` was
  invoked through the host's `collaboration.spawn_agent` with
  `agent_type: "al-architect"`; loading the skill alone is not this proof.
- Initially neither project nor global Codex configuration contained an AL MCP
  binding. The resolved executable was the user's `.dotnet\tools\al.exe`;
  `altool` did not resolve. The provider version was not captured.
- The reviewed project binding named `al` used `launchmcpserver --transport stdio`
  and exposed only `al_addproject`, `al_symbolsearch`, `al_getdiagnostics` and
  `al_getpackagedependencies`. This is setup plus queries, not query-only access.
- Doctor could not run: `No installed Pythons found!`. This did not block the
  subsequent MCP calls. General BC business-action connector tools were present
  earlier but do not establish AL development capabilities.

## Calls and workspace-state observation

All calls below used the same exact project argument:

```json
{"projectPath":"C:\\ALDC-Forge-Tests\\SalesMarginALDC_STD\\app"}
```

The owner confirmed App and Test `app.json` files through PowerShell enumeration.
Earlier missing-path reports included an incorrect `SalesMarginALDC\_STD` path;
they do not establish that the actual project was missing or inaccessible.

| Execution context | Tool | Observed result |
| --- | --- | --- |
| Parent | `mcp__al__al_addproject` | Success; no warnings |
| Native `al-architect` | `mcp__al__al_getpackagedependencies` | No projects loaded |
| Parent, without re-registering | `mcp__al__al_getpackagedependencies` | Success; five dependencies |
| Child setup/query diagnostic, explicitly authorized | `mcp__al__al_addproject` | Success; no warnings |
| Same diagnostic child | `mcp__al__al_getpackagedependencies` | Success; five dependencies |

The final report lists the two child calls in sequence; it does not identify
whether that child resumed the earlier failed agent or was freshly instantiated.
No process IDs or transport logs were captured. The evidence supports preparing
the executing connection rather than assuming parent state is shared; it does
not prove that every Codex child starts a separate server process.

Literal failed child response:

```json
{"succeeded":false,"message":"[Error] No projects are loaded in the workspace. Use the al_addproject tool to add a project, then retry.\r\n","dependencies":[]}
```

Literal final registration response:

```json
{"succeeded":true,"message":"Successfully added project: C:\\ALDC-Forge-Tests\\SalesMarginALDC_STD\\app","nextSteps":[],"warnings":[]}
```

Literal final dependency response:

```json
{"succeeded":true,"moduleName":"SalesMargin","dependencies":[{"name":"System","publisher":"Microsoft","id":"8874ed3a-0643-4247-9ced-7a7002f7135d","version":"29.0.53948.0"},{"name":"System Application","publisher":"Microsoft","id":"63ca2fa4-4f03-4f2b-a480-172fef340d3f","version":"29.0.54011.54125"},{"name":"Business Foundation","publisher":"Microsoft","id":"f3552374-a1f2-4356-848e-196002525837","version":"29.0.54011.54125"},{"name":"Base Application","publisher":"Microsoft","id":"437dbf0e-84ff-417a-965d-ed2bb9650972","version":"29.0.54011.54125"},{"name":"Application","publisher":"Microsoft","id":"c1335042-3002-4257-bf8a-75c898ccb1b8","version":"29.0.54011.54125"}]}
```

## Result and remaining scope

Confirmed by the owner: local skill discovery, native Architect invocation,
official MCP discovery, and a successful dependency query after explicit setup
in the executing child. Setup authorization does not authorize source changes,
symbol downloads, compilation, publication or authentication. No such operations
were reported for this Codex diagnostic.

The new role guidance permits only already-authorized, exact-project registration
through an available tool; it cannot change host filters or bypass a denial.
Conductor continues to delegate. This is a behavioral contract, not enforced
role isolation. Parent/child catalog checks for all other roles remain pending.

This smoke predates the generated-instruction adjustment. Refresh the candidate
installation and validate that guidance in a new host session; the diagnostic
prompt's success is not proof that the new contracts execute correctly.

Still unverified here: native LSP, symbol/diagnostics queries, App/Test compile
and build, actual tests, reviewer isolation, nested Conductor execution and its
human gates, BCQuality execution, optional profiling/snapshot. Keep the PR draft;
do not transfer Claude's successful LSP/build tests to this acceptance record.
