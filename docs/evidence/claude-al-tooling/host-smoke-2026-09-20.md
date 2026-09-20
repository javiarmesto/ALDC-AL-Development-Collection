# Claude AL tooling: owner-operated Windows smoke, 2026-09-20

## Provenance and limits

Javier Armesto ran the candidate in Windows Terminal and supplied screenshots and
copied Claude reports in the project conversation. This record summarizes that
owner-provided evidence; the repository editing environment did not execute the
Windows host, collect full transcripts, or independently inspect the consumer.
Some pasted reports were truncated. Successful tool outputs, self-reported tool
catalogs and independently checked artifacts are distinguished below.

- Candidate: PR #112, expected checkout `fe87e92e2e30816f8d81227b3cc46935b9bcfeda`,
  plugin `aldc` 5.0.1, loaded with `--plugin-dir`. A host `git rev-parse` receipt
  was not captured; the SHA identifies the supplied candidate, not a verified
  fingerprint of the owner's local tree.
- Host: Claude Code 2.1.278 on Windows. Screenshots showed Opus 5 in the general
  session and Sonnet 5 in the native Architect session.
- LSP companion: `al-language-server-go-windows` from
  `SShadowS/al-lsp-for-agents`; exact wrapper/AL Language versions not retained.
- Fixture: `<lab>/proyectos/claude/SalesMargin_AL/app`, existing SalesMargin App;
  37 AL files reported. The separate BC_Bootcamp folder had no AL files.
- Official MCP startup observed: `al launchmcpserver --transport stdio`, 16 tools.
  The executable version was not retained. Dependency output reported BC 29.0;
  this does not establish the compiler or MCP executable version.
- Fixture source/App/Test revisions and package hash were not captured.

The initial user-scoped official alias was `almcp`, while the candidate's exact
role selectors use `al`. The test added `al` to the consumer `.mcp.json`, retaining
`almcp`; calls below explicitly selected `al`. This left two registrations. It
was a laboratory configuration, not a recommended deployment or a change to
ALDC's initializer. Cleanup/consolidation on the owner's machine is not verified.
For deployment, inspect and bind the existing alias in reviewed consumer-local
roles instead of silently duplicating or renaming an existing connection.

## Results

| Operation | Executor/mode | Observed result | Evidence limit |
| --- | --- | --- | --- |
| Agent/skill discovery | General session | 12 `aldc:` agents and 25 skills reported | Catalog presence, not full contract execution |
| LSP `documentSymbol` | Architect as main agent, `--agent aldc:al-architect` | Table 50201 and 7 symbols | Owner-provided tool output |
| LSP discovery/invocation | Newly spawned background Architect | LSP and ToolSearch absent; no LSP call possible | Repeated attempt, not a provider error |
| Reviewer catalog | Background Developer Reviewer | Same LSP absence | Applies to this role/mode observation |
| `al_getpackagedependencies` before setup | Main Architect | `succeeded:false`, `No projects are loaded` despite `projectPath` | Alias/tool access worked; workspace not prepared |
| `al_addproject` | Authorized general setup session | Existing App loaded, `succeeded:true`, no warnings | Source-preservation statement is operator/agent report |
| `al_getpackagedependencies` after setup | Background Architect | Success; 5 Microsoft dependencies reported | Copied JSON/path truncated; not retained as exact JSON |
| `al_symbolsearch` | Background Architect | `SMC Margin Setup` Table and correct App source path | Object result alone did not expose numeric ID/fields |
| Nested `al_symbolsearch` | Background Conductor → Planning via Agent | Table and Card page found; result returned through Conductor | Full nested transcripts not independently collected |
| `al_compile` | Background Developer | `succeeded:true`, empty diagnostics, no package | Analyzer execution unverified; exact input envelope unresolved |
| `al_build` | Background Developer | `.app` generated, no warnings returned | Not publication or executed tests |
| Package existence | Parent session, read-only `ls -l` | `Circe_SalesMargin_1.0.0.1.app`, 30,726 bytes | Parent did not build; no hash collected |
| `al_getdiagnostics` | Background Developer Reviewer | `succeeded:true`, `diagnostics:[]`, `errorCount:0`, `truncated:false` | Existing server state, not a fresh compile/code review |
| LSP `documentSymbol` | New foreground Architect via Agent | ToolSearch discovered LSP; 7 symbols returned | Host setting below was selected explicitly |
| LSP definition/references | Same Architect resumed via SendMessage | Definition and 5 references across 5 files | Retained tool pool; not a new background agent test |

The Reviewer reported 18 tools, without `Bash`, `Write`, `Edit`, `Agent`,
`al_compile`, `al_build`, `al_downloadsymbols` or `al_publish`. That is an effective
catalog observation, not a whole-machine sandbox proof. No prohibited write was
attempted to test absence. Other roles' full catalogs remain unverified.

## LSP execution mode

The foreground test used a child-process-only setting, from the consumer folder:

```powershell
cmd /c "set CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1&& claude --plugin-dir C:\ALDC-Lab-20260920\fuentes\claude\claude-plugin"
```

This was not persisted or installed as an ALDC default. Native Architect first
used `ToolSearch("select:LSP")`, then `LSP` `documentSymbol` on
`app/src/MarginControl/Setup/SMCMarginSetup.Table.al`, line 1, character 1.

The resumed agent read the Card page only to locate its `SourceTable` identifier.
Both subsequent results came from LSP, not MCP or text-search substitutes:

- `goToDefinition` on `SMCMarginSetupCard.Page.al`, line 4, character 20 →
  `SMCMarginSetup.Table.al:1:13`.
- `findReferences` on the same position →
  `Evaluation/SMCMarginEvaluationMgt.Codeunit.al:71:29`,
  `Permissions/SMCMarginFinance.PermissionSet.al:9:15`,
  `Setup/SMCMarginSetup.Table.al:1:13`,
  `Setup/SMCMarginSetupCard.Page.al:4:17`,
  `Permissions/SMCMarginRead.PermissionSet.al:7:15`.

Paths above are relative to `app/src/MarginControl/`. Other locations were not
independently opened by the parent. Results are consistent with the earlier
Table declaration and document-symbol output.

Claude's documented background filtering and resumed-agent tool retention explain
this mode-dependent result. Foreground success must not be advertised as LSP
availability in newly spawned background roles. Sources checked 2026-09-20:
[tool filtering](https://code.claude.com/docs/en/sub-agents#available-tools),
[execution modes](https://code.claude.com/docs/en/sub-agents#run-subagents-in-foreground-or-background),
[resume behavior](https://code.claude.com/docs/en/sub-agents#resume-subagents).

## Provider setup and schema observations

`al_addproject` accepted the existing App folder as its required `projectPath`.
Preparation and the later delegated queries used the same running `al` server.
No specialist permission was broadened to add this operation. Restarting the
server or preparing another alias is not proven to preserve this workspace.

The Architect's exact reported search input was:

```json
{"query":"SMC Margin Setup","filters":{"kinds":["Table"],"scope":"project","match":"name"}}
```

The installed schema used top-level `query`/`filters`, deprecated `parameters`,
and did not accept `projectPath`. The query scope depended on the loaded workspace.
Planning omitted the `kinds` filter and returned both Table and Page.

Dependency and diagnostic queries accepted the explicit App `projectPath`.
`al_compile` was reported to validate the loaded workspace without a package or
`projectPath` input. Its copied report described an optional `options` object but
showed a flat `{ "onlyErrors": false }` request. The success is retained, but that
inconsistency prevents publishing a verified request example or certifying the
onlyErrors setting. No analyzer configuration was captured; zero returned
diagnostics is not evidence of CodeCop/AppSourceCop coverage.

`al_build` used flat `projectPath` (the App folder) and `scope: "current"` and
reported `Package generated: .../app/Circe_SalesMargin_1.0.0.1.app`. The parent's
read-only file listing corroborated that path and size after the build.

## Acceptance boundary and follow-up

This completes a basic LSP/MCP smoke for the observed Claude modes, not all of P1
or the release gates. Remaining coverage includes:

- LSP from Spec and Conductor → Planning, App/Test crossings and dependency symbols.
- Test-app compilation, executed tests, analyzers and a code-review/BCQuality flow.
- Spec/Human Gate behavior and full effective catalogs for other roles.
- Owner-host install/update/rollback preservation checks; static tests are separate.
- Optional Triage profiling, snapshot capture and debugger handoff.
- Exact provider/fixture versions, raw transcripts and package hash if required
  for release evidence.

Transfer workspace preparation, alias matching, schema discovery and compile/build
semantics to each surface's own guide. Do not transfer the Claude execution-mode
setting or these PASS results to CLI, Codex or Chat. Those hosts retain their
separate runtime gates. No release, merge, Marketplace publication, VSIX or BC
service deployment was performed by this smoke; one local App package was built.
