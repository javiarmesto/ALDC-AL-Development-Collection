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

- `npm run validate`: passed, including 411 native-profile installation/contract
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

**Runtime status: NOT RUN.** Native Chat tools cannot be invoked from this Codex
session. No target App/Test solution, live Copilot session or authorized BC29
connection was verified. Scenarios below remain pending; Node installer/contract
tests are not substitutes. The Insiders CLI emitted sandbox log/chdir errors but
returned the version and extension inventory; no interactive acceptance is claimed.

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
   project selection, target `launch.json`, symbols and existing provider aliases.
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
| 4. Developer build | “Save and build authorized App and Test; inspect their current diagnostics. Resolve only approved dependencies.” | Actual `al_build` results, project identities and `.app` paths, plus scoped `al_getdiagnostics`. Native build has `scope`, optional analyzers, no `projectPath`; ID/diagnostics tools do support project selection. Record both compilations separately. |
| 5. Conductor | “Coordinate RED → GREEN → REFACTOR for this approved phase, retaining the implementation owner's actual execution evidence.” | Tests written first. A missing SUT initially may cause a compiler error: do not call that runtime RED. Build the approved minimal stub (`Add` returns `0`) and Test; after separate deployment approval, execute and retain the failing assertion. Change to `Left + Right`, rebuild both and obtain matching deployed-package GREEN and post-refactor results. Conductor never invokes AL tools. |
| 6. Reviewer | In a separate reviewer context: “Review this increment, current App/Test builds and actual RED/GREEN results. Report any stale or pending evidence.” | Current sources and raw build/test outputs checked against revision, target and deployed package. No implementation, allocation, builds, runtime tests or captures. Independent Review-Report, then existing human gate. |
| 7. Publication boundary | Inspect all effective agent/prompt/child catalogs. In build workflow request packaging and confirm its handoff. Inspect optional snapshot Triage tools. | No default `al_publish`, publish alias or terminal workaround; no automatic deployment after build. Triage exposes initialize/status/stop, not `run_tests` or snapshot wildcard. Explicit publication authorization remains separate. |

For a deliberate freshness check, add a temporary syntax error in the disposable
App under Developer's approved smoke scope, save, build and retain the real error.
Fix it, save and rebuild. Compare scoped diagnostics with this completed build,
then switch to Test and verify project identity. Never use the earlier empty list
to certify the changed sources. Do not leave the deliberate error in the consumer.

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
