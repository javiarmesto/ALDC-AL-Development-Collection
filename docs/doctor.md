# ALDC Doctor — field manual

Doctor answers one question: **what is actually configured in this workspace right
now?** It reads files and reports what it found. It never compiles, never runs
tests, never starts a provider and never installs anything.

That boundary is the point. A green Doctor run does not mean your extension
builds. It means nothing in the local configuration is blocking the attempt.

---

## Running it

| Where | How |
| --- | --- |
| Project Manager panel | **Run Doctor**. The report is rendered in the panel; **Export JSON** saves the raw report. |
| Command Palette | `AL Collection: Run Doctor` |
| Terminal | `python3 .github/tools/context-doctor/aldc_context_doctor.py --workspace . --host chat --toolkit .github` |

Doctor needs Python 3.9 or newer, already installed. It uses the standard library
only. The extension looks for `python3`, `python` and `py -3`; set
`al-collection.pythonPath` if yours lives elsewhere.

Useful flags:

| Flag | What it does |
| --- | --- |
| `--json` | Machine-readable report. This is what the panel consumes. |
| `--operation <name>` | Inspect one operation only. Repeatable. |
| `--host chat\|claude\|cli\|codex` | Which host layout to expect. The extension always uses `chat`. |
| `--toolkit <dir>` | Where the installed toolkit lives. Defaults to the workspace. |
| `--bcquality-config <file>` | Configuration snapshot from `tools/bcquality/config.js`. Without it, BCQuality is not inspected. |
| `--runtime <file>` | Host observations supplied by a caller. Never generated automatically. |

---

## What it inspects

- **AL projects.** `appFolders` and `testFolders` from `.AL-Go/settings.json` when
  present; otherwise it scans at most three folder levels, skipping hidden
  folders, dependencies, build output and symlinks. Folders named `Test`,
  `Tests`, `test-*`, or ending in `.Test` or `.Tests` (AL-Go names the suite
  after the app), are treated as test projects. Each manifest reports its own
  application target, separately from the installed profile.
- **Workflow sources.** Whether the agent and workflow files exist under the
  toolkit directory, and whether a new entrypoint links to a role that is missing
  (an incomplete update).
- **Profile marker.** `aldc-profile.json` and whether it holds `bc28` or
  `bc29-native`.
- **Host configuration.** `.vscode/settings.json`, `tasks.json`, `launch.json` and
  `mcp.json` are parsed as JSON. A broken file is reported against the operations
  it affects.
- **BCQuality configuration**, when a snapshot is supplied. Doctor checks the
  snapshot against the bytes of `aldc.yaml`; a stale snapshot is rejected.

Presence of a file is configuration. It is never proof that your host loaded it.

---

## The four operations

| Operation | Covers |
| --- | --- |
| `specify` | Producing a specification: workflow sources, agent roles, discovered projects. |
| `compile-app` | Compiling the App project. |
| `compile-test` | Compiling the Test project. |
| `execute-tests` | Running tests against a BC environment. Compilation alone is not enough. |

---

## Operation status values

The raw key is what the JSON report carries; the label is what the panel shows.

| Status | Panel label | What it means | What to do |
| --- | --- | --- | --- |
| `unobserved` | Execution not observed | The default. No runtime observation was supplied, so this is neither success nor failure. | Nothing is wrong. Run the operation in your host when you want it done. |
| `available-reported` | Availability reported | A caller reported that a capability exists. | Use it. Loading, execution and result each still need their own observation. |
| `executed-reported` | Execution reported, result pending | Something ran; no result evidence came with it. | Inspect the result yourself. Do not assume success. |
| `verified-reported` | Successful result reported | A caller reported a successful result for a stated scope. | Keep it. Repeat only if the source or environment changed. |
| `failed-reported` | Failure reported | A caller reported a failure. | Fix the cause, then repeat that operation only. |
| `unavailable` | Capability not available | Discovery or loading was reported as unavailable. Affects this operation only. | Install or enable the missing capability. |
| `configuration-blocked` | Configuration pending | A configuration problem blocks the attempt. The offending files are listed. | Repair exactly what is listed, then repeat. |
| `not-applicable` | Not applicable | The operation has no target, typically no Test project. | Configure `testFolders` if your tests live elsewhere. |

An unfamiliar value is shown as **Unrecognised state** with the original data kept
underneath: that means the report is newer than the extension.

---

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | No blocking configuration problem and nothing reported unavailable or failed. **Not** a claim that anything works. |
| `1` | A selected operation was reported unavailable or failed. |
| `2` | Malformed input, or a blocking configuration problem. |

`unobserved` everywhere gives exit 0. That is the normal state of a clean install
where nothing has run yet.

---

## BCQuality status values

Supply `--bcquality-config` (the panel does this automatically) or BCQuality stays
uninspected.

| Status | Panel label | What it means |
| --- | --- | --- |
| `configuration-uninspected` | Configuration not inspected | No snapshot supplied; no provider was probed. |
| `configured` | Configured | The snapshot matches `aldc.yaml`. Discovery, loading and execution remain unobserved. |
| `disabled` | Disabled | Turned off in configuration. The native A–G checklist applies. |
| `discovered-reported` | Discovery reported | A catalog entry was reported. Not loaded, not executed. |
| `loaded-reported` | Loading reported | Loading was reported. Execution and result are separate. |
| `executed-reported` | Execution reported | An execution was reported with an outcome. Freshness and coverage still need review evidence. |
| `unavailable-reported` | Unavailable reported | The provider was reported unavailable. Native review remains required. |
| `incompatible-reported` | Identity mismatch reported | The observed version or source differs from the configured expectation. |
| `identity-unverified` | Identity unverified | An expectation is configured but the observed identity was not reported. |

### The three stages

BCQuality observations move through `discovered` → `loaded` → `executed`, in that
order. A later stage reported without its predecessors is rejected as invalid
input, not silently accepted. An execution must carry the actual outcome text.

### Index

| Value | Meaning |
| --- | --- |
| `unobserved` | Nothing was reported about the index. |
| `not-attempted` | Reported as not attempted, with detail. |
| `failed` | Reported as failed, with detail. |
| `generated` | Requires command, exit code 0, an absolute readable path, a SHA-256 that matches the file on disk, and freshness evidence. Doctor re-hashes the file. |

---

## Reading the report in the panel

- **Stale.** After any installation, update or restore, the shown report is marked
  stale. It describes the workspace as it was before that change. Run Doctor again.
- **Configuration problems.** Listed with the operations they affect. A problem in
  `mcp.json` is advisory; the rest are blocking.
- **Configuration snapshot.** If the BCQuality snapshot could not be produced, the
  panel says so and the rest of the report is still valid.
- **Export JSON.** The raw report, unchanged. This is what to attach to a bug
  report.

---

## Common problems

| Symptom | Cause and fix |
| --- | --- |
| "No Python 3.9+ interpreter was found" | Install Python, or point `al-collection.pythonPath` at an interpreter. ALDC never installs Python. |
| "Doctor did not finish within the time limit" | Large workspace. Raise `al-collection.doctorTimeoutSeconds`, or narrow the workspace. |
| "configuration snapshot is stale or belongs to another workspace" | `aldc.yaml` changed after the snapshot was taken, or the snapshot came from another folder. Run Doctor again. |
| "no App app.json found (depth <= 3)" | Your App project sits deeper than three levels. Declare it in `.AL-Go/settings.json` under `appFolders`. |
| `compile-app` and `compile-test` both blocked | `.vscode/tasks.json` does not parse. Repair the JSON. |
| Profile reported invalid | `aldc-profile.json` holds something other than `bc28` or `bc29-native`. Reinstall or restore the toolkit. |

---

## What Doctor never claims

It does not claim that an agent was loaded by your host, that the AL compiler ran,
that tests passed, or that a provider executed. Everything a caller reports is
labelled as reported, never as verified. Exit 0 means "nothing local is blocking",
and nothing more.
