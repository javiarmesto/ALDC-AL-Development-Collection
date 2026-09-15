# Canonical ALDC Doctor

Read-only Python 3.9+ stdlib diagnostics. Use an already available interpreter
(`python3`, `python`, or `py -3` on Windows); Doctor does not install Python or
modify PATH. Run at session start or after an environment change. Repeat only
the affected operation using `--operation`, which can be repeated.

Examples below are for the **canonical Chat checkout only**. For an installed
terminal plugin, select its script path and host from the table instead.

```sh
python3 tools/context-doctor/aldc_context_doctor.py --workspace /project --host chat --toolkit /toolkit
python3 tools/context-doctor/aldc_context_doctor.py --workspace /project --host chat --operation compile-app --json
```

| Surface | Doctor path | `--toolkit` |
| --- | --- | --- |
| Canonical checkout | `tools/context-doctor/aldc_context_doctor.py` | Checkout root for Chat sources |
| Installed Chat | `.github/tools/context-doctor/aldc_context_doctor.py` | Project root (or custom installation directory) |
| Claude plugin | `tools/context-doctor/aldc_context_doctor.py` below installed plugin | Installed plugin root |
| Copilot CLI plugin | `tools/context-doctor/aldc_context_doctor.py` below installed plugin | Installed plugin root |
| Codex plugin | `skills/aldc/scripts/aldc_context_doctor.py` below installed plugin | Installed plugin root |
| Codex local bootstrap | `.agents/skills/aldc/scripts/aldc_context_doctor.py` | Project root |

Select `--host chat|claude|cli|codex` explicitly for terminals. Workspace means
the AL solution root, independently of toolkit/plugin location. Each multiroot
workspace folder is inspected separately; Doctor never traverses another root
implicitly. For a custom Chat target, point `--toolkit` at the directory holding
`agents/` and `prompts/`; its aldc-profile.json is diagnosed there, including
invalid profile values. The default installation uses .github/aldc-profile.json.
It does not parse `toolkitRoot` from aldc.yaml.

App/Test discovery reads `.AL-Go/settings.json` appFolders/testFolders. Non-empty
lists are authoritative per role; otherwise scan at most three folder levels,
pruning hidden folders, dependencies, build output and symlinks. Test/Tests/test-*
folder names imply Test; explicitly configure other names. UTF-8 BOM, JSONC
comments and trailing commas are accepted. Each manifest reports its application
target (including BC28/BC29) separately from the installed profile. Missing
application with a valid AL runtime leaves the BC target unknown. This is basic
manifest/discovery validation, not the AL compiler's full manifest schema.

The four operations are `specify`, `compile-app`, `compile-test`, `execute-tests`.
Specification uses the existing Architect and specification workflow; it does
not require Spec Agent in legacy installations or an App manifest before project
creation. New entrypoints link to the Spec Agent contract: Doctor reports its
presence separately and diagnoses a missing linked role as an incomplete update.
Presence does not prove host loading.
Missing Test projects are not applicable, with an action to configure their
folders if they exist elsewhere. Invalid App/Test manifests affect their own
compilation and any specification based on them. Invalid AL-Go discovery blocks
operations until project scope can be established.

Doctor reports readable host JSON settings/tasks/launch/MCP declarations separately
from runtime. Invalid tasks affect compilation, launch affects runtime tests,
MCP parse errors are advisory because native alternatives may suffice; invalid
shared settings/profile affect all selected operations. An actual unavailable
capability is diagnosed through the host observation for that operation. It does not validate arbitrary provider schemas, YAML, Codex TOML,
credentials, package compatibility, or host permissions. A launch declaration,
compiler path, agent tool name or `.app` file cannot prove a working runner,
loaded native tool, compilation or successful tests. Native capabilities require
no redundant community MCP server. Unknown runtime remains `unobserved`, even in
a correct BC29-native installation with no community provider.

## Optional observations from the current host

The host can supply `--runtime /temporary/current-observations.json`. This is an
optional caller report, not a new persistent state system or an independent
verification. Do not reuse it after source/environment changes: Doctor checks
workspace/host/target scope, but cannot certify freshness or authenticate claims.
Use the existing worklog to retain the relevant result if needed. Do not store
credentials or connection strings in details.

```json
{
  "workspace": "/absolute/project",
  "host": "chat",
  "operations": {
    "compile-app": {
      "provider": "native host compiler",
      "discovered": true,
      "loaded": true,
      "executed": true,
      "verified": true,
      "targets": ["App/app.json"],
      "detail": "Current session compiled App; inspect the compiler result in the session log."
    },
    "execute-tests": {
      "discovered": false,
      "detail": "This session exposes no test runner or reachable BC test environment."
    }
  }
}
```

`configured` describes only the local prerequisites inspected for that operation;
it does not assert compiler, runner or host capability availability.
Stages are independently reported or null. Contradictory booleans are rejected;
verification requires execution, and executed compile/test reports must cover
exactly the current manifests of that role. `verified-reported` never means
Doctor executed the operation. Compilation does not satisfy execute-tests, and
passing tests does not automatically certify requirement coverage. A reported
missing runner gives only execute-tests `unavailable`; a failed executed run is
`failed-reported`. Local configuration problems take precedence over positive
runtime claims. Use the underlying observation when deciding the next action.

Exit 0: no blocking configuration problem or reported unavailable/failed operation
among those selected (unknown runtime and not-applicable are included).
Exit 1: selected operation reported unavailable or failed.
Exit 2: malformed input or affected configuration problem.
**Exit 0 is not functional success.** JSON retains each operation's state.

## Maintenance

The canonical script and host adapters are synchronized by the repository generators.
The behavioral checks run with `python3 -B scripts/test-doctor.py` from a source checkout.

## Optional BCQuality observations

Doctor remains Python stdlib-only and never parses YAML with a partial parser.
Export the current configuration explicitly with the packaged YAML reader:

```sh
node tools/bcquality/config.js /absolute/project > /tmp/bcquality-config.json
python3 tools/context-doctor/aldc_context_doctor.py --workspace /absolute/project --host claude --bcquality-config /tmp/bcquality-config.json --runtime /tmp/runtime.json --json
```

The exporter requires the declared `js-yaml` dependency (root npm install or an
explicit install in `tools/aldc-validate`). For Codex local bootstrap, tools live
under `.agents/skills/aldc/scripts/`, including `bcquality/config.js` and
`aldc-validate/package.json`. Use those paths instead of `tools/`. Export as UTF-8;
in Windows PowerShell 5 use `[IO.File]::WriteAllText` with UTF8Encoding rather than
its default UTF-16 redirection.

The optional runtime JSON retains `workspace`, `host` and `operations` (use `{}`
when only BCQuality is observed), and adds a `bcquality` object matching the
[provider contract](templates/bcquality-provider-contract.md) evidence
shape. `executed: true` additionally requires `outcome`. Doctor checks snapshot
workspace/source hash, exact configured plugin/skill, consistent stages, expected
identity and index output bytes/hash when generation is reported. Stages and
freshness are caller reports, not independent proof. Missing export is
`configuration-uninspected`; a catalog-only observation is `discovered-reported`,
never loaded or executed. An unavailable optional provider does not block other
Doctor operations. Invalid evidence input returns 2 for repair; that is not an AL
review verdict.
