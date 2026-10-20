# Native AL tools for the canonical workflow

Applies only to the opt-in `bc29-native` profile in **GitHub Copilot Chat in VS Code**.
Read before the first tool, dependency or evidence decision under this profile, then
reuse within that invocation. The existing role, human gates, TDD flow and plans
remain authoritative. Copilot CLI requires
an independent check; these names and schemas do not apply to Claude Code or Codex.

## Discover before calling

Record the actual VS Code, Copilot and AL Language versions, target App/Test
projects and connected environment, if needed. Inspect each relevant installed
tool schema once. A grant declares permission; it does not discover a capability.
Do not probe tools just to complete a checklist or repeatedly guess failed inputs.

The [official VS Code catalog](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-language-model-tools-vscode)
documents LM tools since AL17. Native build/search/debug tools are not all AL18 novelties.
Frontmatter uses `ms-dynamics-smb.al/` followed by the installed
`toolReferenceName`. This can differ from the registration/operation name:

| Operation | Chat reference | Use and boundary |
| --- | --- | --- |
| `al_symbolsearch` | `al_symbolsearch` | Discover target objects/members and relevant dependencies. |
| `al_getnextobjectid` | `al_getnextobjectid` | Find project-scoped object IDs before authorized scaffolding (AL18+). No reservation. |
| `al_getdiagnostics` | `al_get_diagnostics` | Read current diagnostics; not a fresh build. |
| `al_build` | `al_build` | Compile the selected project(s); not a runtime test. |
| `al_downloadsymbols` | `al_downloadsymbols` | Provision approved dependencies for the selected project. |
| `al_debug` | `al_debug` | Authorized runtime diagnosis without implying publication. |
| `al_setbreakpoint` | `al_setbreakpoint` | Scoped breakpoints for diagnosis. |
| `al_snapshotdebugging` | `al_snapshotdebugging` | Authorized snapshot investigation. |

No default `al_publish` grant is added. A tool's suggested next action does not
authorize deployment. Do not invent `al_graph` or
`al_symbolrelations`. MCP-only operations and argument wrappers are outside this profile.

Installed AL18.1 registers `al_getdiagnostics` but contributes
`toolReferenceName: al_get_diagnostics`. Copilot grants therefore use
`ms-dynamics-smb.al/al_get_diagnostics`; the former registration name is not the
picker reference. Official AL MCP keeps `al/al_getdiagnostics` and its own schema.
This distinction follows the [VS Code tool contract](https://code.visualstudio.com/api/extension-guides/ai/tools)
and was exposed by the manual host smoke; changing it adds no permissions.

## Ownership

| Owner | Calls | Graph responsibility |
| --- | --- | --- |
| Architect | Search, diagnostics | Frame a design question; consume results. |
| Spec Agent / `al-spec.create` | Search, diagnostics | Independent specification and technical research; consume results. Documentation only. |
| Planning Subagent | Search, diagnostics | Fill a concrete plan gap; reuse evidence. |
| Developer | Search, diagnostics, object IDs, download, build, debugging | Own bounded extraction/query/export via existing terminal. |
| Implementation Subagent | Search, diagnostics, object IDs, download, build | Own bounded extraction/query/export via existing terminal. |
| Developer Reviewer | Search, diagnostics | Independent direct-increment evidence review; no implementation operations. |
| Review Subagent | Search, diagnostics | Check source and actual results; no builds/debugging. |
| Dredd | Search, diagnostics | Independent questions and raw evidence review; request execution from an owner. |
| Triage (installed Chat) | Search, diagnostics, debugging | Request restore/build from implementation; delegate graph execution. |
| Presales | Search | Resolve material feasibility questions; consume findings. |
| Agent Builder | Search, diagnostics | Resolve SDK questions; delegate build/graph work. |
| Conductor | No native grants | Coordinate owners and preserve references in existing handoffs. |

Loading this reference or a skill does not expand a role's permissions. Broad
editor tools retained for compatibility do not authorize another role's duties.

## Local and environment search

Use the [VS Code search shape](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-tool-symbol-search)
without the standalone MCP `parameters` wrapper. Read App/Test `app.json` and
resolved package identities first; reuse relevant current findings. Search objects
with `query`/`kinds`; `objectName` filters members inside an object, not objects:

```json
{"query":"Customer","filters":{"kinds":["Table"],"limit":10}}
```

When local search is insufficient:

1. Check the intended environment is connected and the installed schema supports
   `filters.source = "environment"`. Otherwise record the missing capability.
2. Search the environment for the bounded object; keep the returned `appId`,
   `appName`, `appPublisher`, `appVersion`, declaration and raw-output reference.
   Do not fill missing metadata. Inspect `truncated`; narrow incomplete results.
3. Architect/spec proposes the necessary dependency, not all installed apps.
4. Only the authorized setup/implementation owner changes `app.json`, downloads
   symbols and records the chosen target/cache/result.
5. Repeat local search after provisioning; validate the selected declaration at
   implementation time and compile against the actual dependencies.

Conditional example (inspect the installed filter schema first):

```json
{"query":"Synthetic Publisher","filters":{"kinds":["Codeunit"],"source":"environment"}}
```

An environment match identifies an owner; it proves neither a usable dependency
nor successful compilation. An absent result may reflect scope or truncation.
If a bounded native query returns nothing, distinguish that result from a failed
language-server startup. Check available AL output/host evidence before inferring
missing objects or packages; existing `.alpackages` and CLI compilation do not
prove that the editor's language server started. Request a scoped setup check
when unavailable instead of repeatedly broadening wildcard searches.
Microsoft Learn now documents `source` (AL18+), and installed AL Language
18.1.2842859 declares it. VS Code resolves the environment from the active
`launch.json`; local `scope` is ignored for an environment search. Installed
schema support does not prove a reachable tenant or a successful invocation.

## Safe object IDs

The [object ID tool](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-tool-get-next-object-id)
is granted only to Developer and Implementation Subagent. In installed AL Language
18.1.2842859, `name` and `toolReferenceName` are both `al_getnextobjectid`:

```json
{"objectType":"Codeunit","count":1,"projectPath":"C:/src/Solution/Test"}
```

`objectType` is required; `count` is 1–50. Optional `rangeStart` and `rangeEnd`
must be paired and intersect the project's `idRanges`. `projectPath` selects the
project when App/Test is ambiguous. Inspect the actual result status, returned
`ids`, count, `ranges`, `outOfRange` and `warnings`. Partial allocation is not
success; never scaffold with `nextOutOfRangeId` or widen a manifest automatically.
Learn calls the status field `succeeded`; the installed description says
`success=false`. Preserve the returned field name and check the actual result.

The scan sees project syntax only, excluding installed dependencies and other
extensions on the sandbox. Retain that warning and check known allocations where
relevant. It covers object IDs, not field IDs. IDs are not reserved: save the
object before requesting another ID, or request a batch for the same type.
Concurrent writers need distinct approved allocations or owner coordination.
Revalidate a fixed approved spec ID against current sources and known allocations;
for a new object, constrain `rangeStart` and `rangeEnd` to that same approved ID.
If occupied, return the conflict to its owner; do not replace it with a different
returned ID or reopen approved architecture. Editing an existing intended object
does not allocate a new ID.
If unavailable, use the approved manifest ranges and source scan, record that
fallback and its limits, then compile. Unknown/exhausted ranges remain unresolved.

## Build, dependencies and proportional gates

For [VS Code build](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-tool-build),
use `{"scope":"current"}` after selecting the intended project; use
`{"scope":"all"}` only when the entire workspace is authorized. Installed
18.1.2842859 also declares native `enableCodeAnalysis` and `codeAnalyzers`; use
approved analyzer configuration and retain which analyzers actually ran.
Do not import MCP `projectPath` into this native build schema. Save sources and
verify each returned App/Test identity, revision and artifact, including the Test
dependency on the current App. If unavailable, use the existing approved build task or ALTool after
checking its installed help, and record which method actually ran.
In the inspected Insiders/AL18.1 multi-root host, keep an AL text editor from the
intended project visible alongside Chat in the sidebar. Open that file in Insiders
with Ctrl+P; attaching it to Chat or asking a tool to read it does not select the
editor's project. With no AL editor, `scope: "current"` can fail before compilation;
diagnostics scoped to Test cannot prove that the build selected Test. Verify the
project in AL output before retrying. With cached symbols, local packaging worked
without `launch.json`; connected symbol download, publication and debugging need
their own valid target configuration. To diagnose selection without another model
call, use the inspected `AL: Package` command and record it as a VS Code action,
not as a successful Copilot invocation.
Some native versions return only a generic success message and an output-panel
reference. Inspect AL output and the generated package manifest/path/hash separately
to establish project identity and artifact existence. Do not fill absent result fields.

Test-library versions need not numerically equal the extension's version.
Check app identity, declared minimum dependency version, available package version,
runtime and required API compatibility. A missing package or uncertain API goes
into existing assumptions/Open Questions with an owner and the affected validation.
It does not automatically prevent writing architecture or a specification.
Do not mark affected compilation/tests as passed, nor bypass existing delivery gates.
Architecture resolves viability; it does not exhaustively transcribe declarations.

`al_getdiagnostics` reads Problems, without compiling. After edits, project switches,
symbol changes or reconnects, correlate diagnostics with a completed build of the
same saved inputs. The installed schema supports `projectPath`, severity/source
filters and a limit; an empty, filtered or truncated list does not prove freshness
or analyzer execution. Preserve the build result as the compilation evidence.

Use the approved test runner and actual results. Tests written, App compiled,
Test compiled and tests executed are separate states. Runtime RED requires a
real failing assertion; missing objects or dependencies can instead prevent
compilation. GREEN and post-refactor results require execution against matching
deployed packages. Keep per-test pass/fail/skip counts, environment, package/revision
and raw output in existing phase artifacts. Missing execution stays pending and
cannot satisfy a required delivery gate. Conductor requests this evidence from
the implementation owner; Reviewer checks it without gaining execution permissions.
`TestHandlers` is optional instrumentation, not a runner. No environment upgrade
or publication is authorized by this profile.

## Optional ALTool, LSP and capture surfaces

These are distinct from VS Code LM tools. Check installed version/help and actual
host connection before choosing them; never add hypothetical native selectors.

| Surface | Available capability | Boundary |
| --- | --- | --- |
| VS Code LM | Search, IDs, build, diagnostics, restore, debug/snapshot | Explicit role grants; no publish. |
| Official AL MCP | Queries, build; `al_compile`, `al_getpackagedependencies` are MCP-only | Discover its own schema and loaded projects. |
| ALTool `launchlspserver` | Semantic LSP over JSON-RPC/stdio, including multi-project resolution | Not an MCP executable or automatically a Chat tool. Existing optional LSP bridge may expose navigation. |
| ALTool `runtests` | Real server tests; structured JSON by default in installed 18.1; optional `--testgroups` | Implementation owner, approved runner/target and matching deployed App/Test. Never publish as an implicit prerequisite. |
| `TestHandlers` | BC29/runtime18 lifecycle instrumentation | Inspect actual target declarations; existing testing/migration skill checks still apply. |
| Profiling / snapshot MCP proxies | Optional capture on a compatible BC29 server | Triage's discovered capture scope, target permissions, bounded window and owned cleanup. |

Installed ALTool `18.1.43.24897` confirms `launchlspserver`, `runtests`, `graph` and
both proxy commands in help. The standalone `al` alias is absent on this machine;
the extension-bundled `bin/altool.exe` works. Availability in help is not execution
evidence. A compatible SDK/runtime requirement must come from that installation,
not an assumed .NET version.

AL18's snapshot proxy adds `run_tests`. This is separate from native
`al_snapshotdebugging` (`initialize`/`finish`/`view`). Chat Triage uses explicit
initialize/status/stop selectors, avoiding a wildcard that would admit test
execution. Snapshot test runs and `snapshotVerbosity=Full` are optional, require
separately scoped authorization and live schema/target checks, and are not granted
by default. Learn's snapshot article still labels the MCP server capability preview.

## Optional static AL graph

`al graph` provides optional static analysis of AL source relationships. Use it only
when it helps answer a concrete engineering question.

Developer/Implementer checks `al --version`, `al graph --help`, then the installed
help for `extract-whole`, `query` and `export` before executing a material question.
If a command is unavailable, note that once and proceed with unaffected work.
The following examples require confirmation against the installed help before use.

```powershell
al --version
al graph --help
al graph extract-whole --help
al graph query --help
al graph export --help
# Replace paths and app ID with approved project inputs after checking help:
al graph extract-whole --corpus 'C:\src\App' --corpus 'C:\src\Dependency' --out '.\graph-work\shards' --graph '.\graph-work\g.jsonl'
al graph query --graph '.\graph-work\g.jsonl' --from 'access:public' --to 'access:internal+app:<app-id>' --paths
al graph query --graph '.\graph-work\g.jsonl' --from 'access:public' --to '!debuggable+app:<app-id>' --paths
```

Use public-to-internal paths, cross-app relationships and debuggability boundaries
only when relevant. Quote selectors containing `!`, `+`, `*` or spaces. Optional
DGML/GraphML/SARIF export depends on installed support; obtain its graph/output
arguments from help. Keep large outputs outside AL source folders and reference
them from the existing plan/phase-complete/review artifacts.

Cross-app extraction needs the relevant source corpus. Symbol packages do not
guarantee complete procedure bodies. Record missing dependencies, bodies, event
and dynamic-dispatch coverage. Static reachability proves neither runtime
execution, data leakage nor a vulnerability. No path does not establish isolation
when coverage is incomplete. `al workspace map` is not a source call graph.
`extract-all` compiles apps separately and misses cross-app direct calls;
`extract-whole` resolves them together. `--paths` is capped: no emitted path
does not prove unreachability; an unfiltered reachability query is a different
check. Record excluded nodes and coverage along with results.

## Evidence in existing artifacts

Use the existing planning findings, specification, phase-complete, review and
memory documents. Do not introduce a new required execution registry. For each
material claim record:

- **Declared:** role/frontmatter and capability name.
- **Read:** resource path/revision and the relevant rule applied, only after reading it.
- **Executed:** actual tool/command and arguments, installed version, source revision,
  project and package/corpus identities, result/exit status and raw-output locator.
- **Limitation:** missing capability, source coverage or runtime test, and its impact.

An instruction to read is not proof it was read. A rendered manifest is not proof
of execution. Reviewers check the actual outputs; Conductor transfers references.
BCQuality remains optional via a configured provider or installed plugin. Preserve
its actual provenance; use existing native review when absent, without requiring a fork.
Legacy provider-specific clone instructions apply only when that provider is selected;
an installed plugin may supply the knowledge instead. BC Atlas and community symbol/LSP
bridges are not prerequisites. When native coverage is insufficient, record the gap
and use available source or a bounded human check, without claiming semantic parity.

## Source and status

Checked 2026-10-13 against the [official Marketplace changelog](https://marketplace.visualstudio.com/items/ms-dynamics-smb.al/changelog),
the official changelog shipped in AL Language 18.1.2842859, its contributed
tool schemas, installed ALTool help and the linked Microsoft Learn references.
VS Code Insiders is `1.142.0-insider`. These are documentation/installation checks,
not live Copilot or BC execution. See [the reproducible smoke test](native-bc29-smoke.md).
Microsoft's
[BC29 preview overview](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/whatsnew/whatsnew-update-29-0)
announces static graph analysis, environment discovery, test lifecycle extensions,
isolation controls, namespace translations and AL0926. Announcement does not verify
installed flags, declarations or behavior. Language-specific checks are in the
existing migration, performance, testing, translation and debugging skills.

BCQuality provider selection, exact skill identity, execution evidence and index
limits follow [the shared contract](../templates/bcquality-provider-contract.md).
A configured plugin does not grant execution tools or reduce native coverage.


## Snapshot diagnosis evidence

Triage follows [the shared snapshot evidence contract](../../skills/skill-debug/references/snapshot-evidence.md)
inside the existing diagnosis report: capture, inspection, diagnosis and fix validation
remain distinct. Cite actual readable observations for supported claims; missing state
requires insufficiency and the next observation. A structural validator is available
explicitly; it proves neither causality nor tool execution. Optional host acceptance
uses an authorized sandbox and does not grant publishing or test execution to Triage.
