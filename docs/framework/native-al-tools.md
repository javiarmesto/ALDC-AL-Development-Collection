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
Frontmatter uses `ms-dynamics-smb.al/` followed by the exact identifier:

| Identifier | Use and boundary |
| --- | --- |
| `al_symbolsearch` | Discover target objects/members and relevant dependencies. |
| `al_getdiagnostics` | Read current diagnostics; not a fresh build. |
| `al_build` | Compile the selected project(s); not a runtime test. |
| `al_downloadsymbols` | Provision approved dependencies for the selected project. |
| `al_debug` | Authorized runtime diagnosis without implying publication. |
| `al_setbreakpoint` | Scoped breakpoints for diagnosis. |
| `al_snapshotdebugging` | Authorized snapshot investigation. |

No default `al_publish` grant is added. A tool's suggested next action does not
authorize deployment. Do not invent `al_graph`, `al_get_diagnostics` or
`al_symbolrelations`. MCP-only operations and argument wrappers are outside this profile.

## Ownership

| Owner | Calls | Graph responsibility |
| --- | --- | --- |
| Architect | Search, diagnostics | Frame a design question; consume results. |
| `al-spec.create` workflow | Search, diagnostics | Specify decisions; consume results. No separate Spec Agent. |
| Planning Subagent | Search, diagnostics | Fill a concrete plan gap; reuse evidence. |
| Developer | Search, diagnostics, download, build, debugging | Own bounded extraction/query/export via existing terminal. |
| Implementation Subagent | Search, diagnostics, download, build | Own bounded extraction/query/export via existing terminal. |
| Review Subagent | Search, diagnostics | Check source and actual results; no builds/debugging. |
| Dredd | Search, diagnostics | Independent questions and raw evidence review; request execution from an owner. |
| Triage | Search, diagnostics, download, debugging | Consume paths to localize symptoms; delegate graph execution. |
| Presales | Search | Resolve material feasibility questions; consume findings. |
| Agent Builder | Search, diagnostics | Resolve SDK questions; delegate build/graph work. |
| Conductor | No native grants | Coordinate owners and preserve references in existing handoffs. |

Loading this reference or a skill does not expand a role's permissions. Broad
editor tools retained for compatibility do not authorize another role's duties.

## Local and environment search

Use the [VS Code search shape](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-tool-symbol-search)
without the standalone MCP `parameters` wrapper:

```json
{"query":"Customer","filters":{"kinds":["Table"],"limit":10}}
```

When local search is insufficient:

1. Check the intended environment is connected and the installed schema supports
   `filters.source = "environment"`. Otherwise record the missing capability.
2. Search the environment for the bounded object; keep the returned owner app ID,
   name, publisher and version, preserving raw field names. Do not fill missing metadata.
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
The published search reference consulted on 2026-09-11 does not yet list `source`;
BC29 preview notes describe environment discovery, but the installed schema must
confirm its actual input shape.

## Build, dependencies and proportional gates

For [VS Code build](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-tool-build),
use `{"scope":"current"}` after selecting the intended project; use
`{"scope":"all"}` only when the entire workspace is authorized. Do not import
MCP-only `projectPath` or analysis flags. Verify returned App/Test identities and
artifacts. If unavailable, use the existing approved build task or ALTool after
checking its installed help, and record which method actually ran.

Test-library versions need not numerically equal the extension's version.
Check app identity, declared minimum dependency version, available package version,
runtime and required API compatibility. A missing package or uncertain API goes
into existing assumptions/Open Questions with an owner and the affected validation.
It does not automatically prevent writing architecture or a specification.
Do not mark affected compilation/tests as passed, nor bypass existing delivery gates.
Architecture resolves viability; it does not exhaustively transcribe declarations.

Use the approved test runner and actual results. Tests written, tests compiled and
tests executed are separate states. `TestHandlers` is optional instrumentation,
not a runner. No environment upgrade or publication is authorized by this profile.

## Optional static AL graph

`al graph` provides optional static analysis of AL source relationships. Use it only
when it helps answer a concrete engineering question.

Developer/Implementer checks `al version`, `al graph --help`, then the installed
help for `extract-whole`, `query` and `export` before executing a material question.
If a command is unavailable, note that once and proceed with unaffected work.
The following examples require confirmation against the installed help before use.

```powershell
al version
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

Checked 2026-09-11. Microsoft's
[BC29 preview overview](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/whatsnew/whatsnew-update-29-0)
announces static graph analysis, environment discovery, test lifecycle extensions,
isolation controls, namespace translations and AL0926. Announcement does not verify
installed flags, declarations or behavior. Language-specific checks are in the
existing migration, performance, testing, translation and debugging skills.
