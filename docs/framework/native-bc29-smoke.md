# Copilot Chat BC29 native App/Test smoke

This is a reproducible **manual host acceptance test**, not an AL runtime result.
Use a disposable BC29 App/Test solution and a separately authorized sandbox.
No release, extension update, provider installation or publication is performed
by this document or ALDC's build workflow. Keep evidence in the existing project's
architecture/spec, plan, phase-complete and review artifacts; no new registry.

## Baseline inspected on 2026-10-13

ALDC source baseline: `4f99d7d4c3f997ac4bef036d891070122a8a7d8a` (5.0.3).
The preceding Marketplace publication was closed: the downloaded VSIX matched
the validated SHA-256 and all 230 extension files. This candidate changes no
package versions, tags, Marketplace catalogs or `aldc-vscode-extension` files.

Already present before this change:

- Opt-in native projection, role-limited search/build/restore/debug/snapshot,
  prompt projection, model selection and a separate build/publication handoff.
- Independent Spec Agent, approved architecture/spec, decomposition rules,
  BCQuality `al-knowledge`, Human Gates, independent review and Conductor TDD.
- Local/environment research guidance, optional static graph, test instrumentation
  checks and optional profiling/snapshot providers.
- Installer regressions for default/native/switch/update/rollback, preservation
  of user MCP configuration and separate terminal-surface generation.

Gaps addressed: native object-ID grants only for implementation; stale wording
about Spec Agent; current environment-search and build schemas; scoped dependency
research, fresh App/Test build evidence and real RED/GREEN evidence; snapshot
capture selectors excluding the newly added test-execution operation.
Shared role/skill sources and their terminal permissions/models are preserved.

| Local check | Observed result | What it does not prove |
| --- | --- | --- |
| Insiders CLI `--version` | `1.142.0-insider`, commit `e9eaf94e8bb01badde47d2518e16d3e1cdab1dd9` | Effective Copilot session/model/tool picker |
| Installed AL Language manifest | `18.1.2842859`; native IDs, environment search, build/analyzers, diagnostics, restore and debug/snapshot schemas | Successful invocation or reachable BC tenant |
| Extension-bundled ALTool `--version` | `18.1.43.24897+799e32e9b48e151929e79fa662a5ddd4a2d4ebce` | Compiler/runtime acceptance of App/Test |
| ALTool `--help`, `runtests --help`, `graph --help`, `launchlspserver --help` | Commands present; tests support JSON output and `--testgroups` | Executed AL tests, graph extraction or LSP connection |
| Standalone toolchain | No `al`/`altool` PATH alias; no .NET SDK found; bundled ALTool help works | A need to install/upgrade anything for native Chat |
| Current toolkit workspace | No App/Test `app.json` or BC `launch.json` supplied | An authorized/authenticated runtime target |

Repository checks actually executed for this candidate:

- `npm run validate`: passed, including 434 native-profile installation/contract
  checks, both Chat profiles (46 projections), Spec/Reviewer/BCQuality contracts,
  plugin checks and installer regressions. Its final Node suite passed 58 tests;
  two alternative no-PowerShell cases were skipped because PowerShell 7 exists.
- `node scripts/test-native-profile.js` and `node scripts/test-chat-profile.js`:
  passed; include permission boundaries, prompt precedence and Windows CRLF.
- `npm run sync:plugins` and `npm run sync:foundation`: zero changed generated
  files. Terminal agents/models/permissions and Foundation remain byte-identical.
- `npm run test:surface-isolation`: five tests passed on a clean copy of the
  candidate's tracked files, excluding local release artifacts and unrelated
  untracked work. The first root-workspace attempt was interrupted while copying
  those artifacts. No test or assertion was replaced or simulated.

Installer tests were rerun outside the Windows sandbox after it blocked atomic
renames in temporary fixtures. These are real installer tests, not BC execution.

**BC runtime status: NOT RUN.** At the initial inspection no consumer App/Test
solution or live Copilot session had been supplied. The subsequent operator checks
below establish local tooling behavior, not BC29 server or runtime acceptance.
Node installer/contract tests are not substitutes for those host/runtime checks.

### Operator-assisted local host checks, 2026-10-13 to 2026-10-15

An isolated consumer using BC28/runtime16.1 was then provided. It exercises the
AL18 native tooling profile without upgrading the application or proving BC29
server compatibility. Retained operator tool responses/screenshots, compiler logs
and package manifests/hashes establish the following separate results:

| Check | Actual result | Limit |
| --- | --- | --- |
| Spec native workspace symbol search | One matching codeunit with project path/signature | No connected-environment search or full architecture/spec acceptance |
| Developer native object-ID query | Codeunit 50305 within Test's 50300..50349 range; project-only warning retained | Query does not reserve or create an object |
| Native App build and scoped diagnostics | Build success and zero diagnostics; App output/package identity independently verified | Not AL runtime execution |
| Native Test build and scoped diagnostics | Test build success, five source files and matching Test package; operator reports zero errors | Cropped screenshot does not establish the effective custom role or reproduce the full diagnostic payload |
| Controlled compiler error | Native build failed; diagnostic identified the temporary Test file/line and Text-to-Integer error; compiler output independently supplies AL0122 | Screenshot used built-in Agent; validates native behavior, not ALDC role grants. PACKAGE_CREATION_FAILED is the build code, not the compiler diagnostic code |
| Cleanup and recovery | Temporary fixture removed; all 38 original AL/manifests unchanged. CLI Test recovery passed with zero diagnostics. A later VS Code packaging action rebuilt App (31 files) and Test (five files), with new packages verified | Final recovery was a VS Code action, not a new successful Copilot invocation; scoped native diagnostics were not rerun after it |

The temporary codeunit was validated with ALTool before introducing its deliberate
type error. This proves a locally created valid object, not Developer scaffolding
through Copilot. The previous Test `.app` remained on disk after the failing build;
its existence did not certify the failed source state. A separate custom Developer
attempt without an open AL editor reported failure despite zero diagnostics, which
correctly left recovery pending until the later VS Code action.

Architect/Conductor/Reviewer functional sessions, Developer scaffolding in Chat,
environment research and real RED/GREEN execution remain unexecuted. Their static
contracts/permissions were checked; that is not full seven-scenario host acceptance.

The initial native search was empty because the editor language server failed to
start against an incomplete .NET acquisition folder, despite existing symbols and
successful CLI compilations. An extension-scoped `existingDotnetPath` setting and
reload were prepared as local recovery. Later successful sessions acquired a
working runtime in the regular Insiders profile; the evidence does not establish
that the override was used in every session. This is optional host setup, not an
automatic installer setting or a reason to require a new SDK globally.

The host build exposed a selector regression: native diagnostics was ungranted
under its registration name. AL18.1 contributes `toolReferenceName:
al_get_diagnostics`; the projector now grants that exact Chat reference and keeps
MCP's `al_getdiagnostics` spelling. The operator subsequently invoked native
diagnostics successfully after updating/reloading the consumer.

### Minimal local regression without repeated agent conversations

After repository validation, reuse the successful symbol/ID/App evidence rather
than replaying it. For this tooling change, the remaining focused checks were a
native Test build, a deliberate compiler error with native diagnostics, and cleanup
followed by a successful rebuild. Prepare/remove the fixture locally, keep Chat
answers short, and inspect output/packages outside Copilot. A direct VS Code
packaging action can diagnose editor context without model calls, provided its
result remains distinct from Chat acceptance. This focused check does not replace
the seven scenarios when claiming complete role or BC29 runtime acceptance.

## Official evidence and optional capabilities

Start with the [Marketplace AL Language page](https://marketplace.visualstudio.com/items?itemName=ms-dynamics-smb.al)
and its [official changelog](https://marketplace.visualstudio.com/items/ms-dynamics-smb.al/changelog).
The Marketplace changelog page exposed no body through web retrieval in this run;
the full official `changelog.md` bundled with installed 18.1.2842859 was inspected.
Its 18.0 entries describe object IDs, environment discovery, graph, LSP, test
execution and capture proxies; 18.1 lists a Word-layout fix. Compare with:

- [VS Code LM catalog](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-language-model-tools-vscode): native tools; no native `al_compile` or package-dependency query.
- [Object IDs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-tool-get-next-object-id): AL18+, project syntax only, no reservation; actual response fields must be retained.
- [Symbol search](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/al-agent-tools/al-tool-symbol-search): environment source AL18+, owning app metadata and truncation.
- [ALTool reference](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-al-tool): `launchlspserver` is LSP/stdio; graph is static source analysis; `runtests` executes server tests.
- [Snapshot debugging](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-snapshot-debugging#snapshot-debugging-with-an-ai-agent-mcp-server): BC29/runtime18 MCP capture is still documented as preview; target permissions apply.

The bundled changelog adds snapshot `run_tests` and optional `snapshotVerbosity`.
Neither is a native LM operation or a default Triage grant. `TestHandlers` is
optional BC29/runtime18 instrumentation, covered by the existing testing/migration
skills; inspect target definitions and verify callbacks only when used. Profiling,
snapshot, graph and LSP tests can be skipped independently with a stated reason.
Do not configure a second provider merely to run this smoke.

## Prepare the isolated consumer

1. Copy an approved BC29 solution to a disposable directory with distinct `App`
   and `Test` projects. Preserve app identities, compatible dependency versions,
   runtime, actual symbol caches and approved object ranges. Test must reference
   the current App identity/version and only the libraries its tests use.
2. Use a separate Insiders window/profile with isolated user-data/extensions
   directories. Verify the actual Copilot session, model and AL version. Disable
   competing ALDC definitions in this window, including stale extension/project
   and `.claude/agents` copies. Do not update the working user's installation.
3. From the disposable solution root, install the candidate from its checkout:

   ```powershell
   node C:/path/to/ALDC/scripts/install.js install --profile bc29-native --dry-run
   node C:/path/to/ALDC/scripts/install.js install --profile bc29-native --yes
   node C:/path/to/ALDC/scripts/install.js verify-install
   ```

   Review collisions instead of adding `--force`. Reload the isolated window.
   Record the candidate commit and actual loaded `.github/agents`/prompts.
4. Open a multi-root workspace containing both App and Test. Verify active
   project selection, symbols and existing provider aliases. Open the intended
   project's AL file with Ctrl+P **in Insiders**, then keep its text editor visible
   alongside Chat in the sidebar; a Chat attachment alone does not select it.
   Record the effective agent/model picker as well as the tool identity. Missing
   AL editor context can make native `scope: "current"` fail before the compiler,
   even when scoped diagnostics return zero. Verify project identity in AL output.
   A valid target `launch.json` is needed for connected operations, not for the
   observed local packaging with symbols already cached.
   Hash an existing `.vscode/mcp.json` before/after installation; bytes must match.
   Inspect each tool's actual picker ID and schema, including overriding prompts
   and child definitions. The exact native grant uses `ms-dynamics-smb.al/<name>`.
5. Keep deployment as a separate human gate. Runtime tests require the matching
   App/Test packages already deployed through a separately authorized process.
   If that prerequisite is absent, stop runtime acceptance at **pending**.

## Run the seven scenarios

Use this small requirement: an App codeunit `Native Smoke Calculator` exposes
`Add(Left: Integer; Right: Integer): Integer`; a Test codeunit verifies `Add(2, 3)`
returns `5`. Scope/ranges and a minimal failing stub must be approved in the spec.
Spec records fixed IDs from approved ranges and current source; Developer verifies
each new fixed ID with `rangeStart=rangeEnd=<approved ID>` so native allocation
does not silently change the approved contract. Use the project's naming convention.
The test can fail with `Error` on a mismatch
without adding an unused assertion library. Keep an existing dependency such as
System Application as the bounded research target; for environment discovery use
a known sandbox object whose owner is not already in App's dependencies.

| Scenario | Prompt/action in the selected role | Required evidence and boundary |
| --- | --- | --- |
| 1. Architect | “Inspect this App/Test solution and its resolved dependencies for the calculator requirement. Identify the reusable target contracts and any material missing dependency; propose architecture.” | Manifest/package identities and bounded local symbol results. If relevant, environment result with owner metadata. No manifest edits, restore or build. Present architecture for human approval. |
| 2. Spec Agent | After architecture approval: “Create the assigned calculator specification. Verify target symbols and the missing dependency using environment search if available; preserve the approved architecture.” | Raw symbol results, exact definition/version and pending facts in the assigned spec/BCQuality sidecars only. No AL edits, build, ID allocation or restore. Human spec approval remains required. |
| 3. Developer / Implementer | “Implement the approved increment, tests first. Obtain the approved Test/App codeunit IDs using the native tool constrained to each fixed ID, and save each object before another allocation.” | Actual `al_getnextobjectid` input/result, explicit project, ranges and warnings. Fixed approved IDs stay fixed; a collision returns to its owner. Saved files use valid IDs; no out-of-range scaffold, manifest widening or unsaved reservation. |
| 4. Developer build | “Save and build authorized App and Test; inspect their current diagnostics. Resolve only approved dependencies.” | Actual `al_build` results, project identities and `.app` paths, plus scoped native `al_get_diagnostics`. Native build has `scope`, optional analyzers, no `projectPath`; ID/diagnostics tools do support project selection. Record both compilations separately. If the tool returns only generic success, inspect output/package identity separately. |
| 5. Conductor | “Coordinate RED → GREEN → REFACTOR for this approved phase, retaining the implementation owner's actual execution evidence.” | Tests written first. A missing SUT initially may cause a compiler error: do not call that runtime RED. Build the approved minimal stub (`Add` returns `0`) and Test; after separate deployment approval, execute and retain the failing assertion. Change to `Left + Right`, rebuild both and obtain matching deployed-package GREEN and post-refactor results. Conductor never invokes AL tools. |
| 6. Reviewer | In a separate reviewer context: “Review this increment, current App/Test builds and actual RED/GREEN results. Report any stale or pending evidence.” | Current sources and raw build/test outputs checked against revision, target and deployed package. No implementation, allocation, builds, runtime tests or captures. Independent Review-Report, then existing human gate. |
| 7. Publication boundary | Inspect all effective agent/prompt/child catalogs. In build workflow request packaging and confirm its handoff. Inspect optional snapshot Triage tools. | No default `al_publish`, publish alias or terminal workaround; no automatic deployment after build. Triage exposes initialize/status/stop, not `run_tests` or snapshot wildcard. Explicit publication authorization remains separate. |

For a deliberate freshness check, add a temporary syntax/type error in the approved
disposable App or Test scope, save, build and retain the real error. Query scoped
diagnostics even after the expected build failure. Fix/remove the fixture, open an
existing AL file from that same project, save and rebuild. Compare fresh scoped
diagnostics with the completed build, then verify App/Test project identities.
Preserve the actual tool/command used for recovery; CLI or direct VS Code success
cannot be relabeled as a Copilot invocation. Never use an earlier empty list or an
old package left after failure to certify changed sources. Remove the deliberate
error and verify existing sources/manifests are unchanged before closing the check.

If ALTool is the approved runner, inspect its installed help first. One supported
shape in the inspected bundle is:

```powershell
# Replace paths/ID with the actual inspected runner and approved Test inputs.
& 'C:/path/to/altool.exe' runtests <TestCodeunitId> --project 'C:/path/to/Solution/Test' --company '<approved company>'
```

Keep stdout's actual structured result, stderr and exit status together. Resolve
cloud/on-prem options from the real target/help, not this example; never add a
publish or sign-in command as an automatic recovery. A `.app` file on disk does
not prove that this version was deployed. Nonzero test counts, expected methods,
per-method results and matching package identity are needed; zero tests is pending.

## Report acceptance

In the existing phase-complete/review artifacts record each scenario as
**passed**, **failed** or **not run (reason/owner/next check)** with source commit,
App/Test identities, host/provider versions, exact tool/arguments, raw output,
build artifacts and deployed package/target. Preserve compiler failures separately
from test assertions and pass/fail/skip counts. Optional absence cannot become a
simulated PASS. Close only owned captures and retain their cleanup result.

Repository validation covers generation/contracts/permissions and installation;
the seven real host scenarios must be completed independently before claiming
Copilot Chat/BC29 runtime acceptance.
