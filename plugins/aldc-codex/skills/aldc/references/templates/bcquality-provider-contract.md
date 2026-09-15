# BCQuality provider contract

This is the shared contract for Conductor, reviewers, Dredd, Triage and terminal
adapters. Configuration is `external.bcquality` in the **current project's**
`aldc.yaml`; consumer examples are not defaults. ALDC never installs BCQuality
implicitly. `tools/bcquality/config.js` normalizes YAML without probing a provider.

## Selection and fallback

| Configuration | Action | Native review |
|---|---|---|
| `enabled: false` | Do not probe, load, execute or refresh BCQuality | Full A–G |
| `mode: plugin`, `enabled: auto` or `true` | Discover configured plugin ID and skill in the selected host; load that exact skill when available | Full A–G until an actual result establishes domain coverage |
| `mode: external-multiroot`, `enabled: auto` or `true` | Read configured external `home/entryPoint` once; route actual task-context through Entry | Same rule |
| Missing, incompatible, failed or inaccessible provider | Explain limitation; continue native checks; `true` additionally means an expected provider is missing | Full A–G, or affected domains for partial results |

Missing mode retains `external-multiroot`; missing enabled retains `auto`.
Do not silently switch from plugin to a sibling clone: it may be a different
revision or corpus. Native fallback never turns a provider failure into an AL
code defect. ALDC's hard rules, extensions-only boundary and human gates remain.

## Plugin identity and invocation

`plugin.id` defaults to `bcquality`; `plugin.skill` defaults to
`bcquality-al-review`. `expectedVersion` and `sourceRef` are optional **expected**
identity, not installation commands or observed facts. A renamed skill requires
explicit configuration; never infer equivalence by name. In particular a package
exposing `al-code-review` does not establish that `bcquality-al-review` is loaded.
An observed version/revision mismatch is incompatible; an unavailable revision
is unverified. If a configured expectation cannot be checked, keep native review
active and report that limitation rather than certifying the provider.

Use the host's actual installed root and manifest, then load the configured skill
body and follow its instructions. Reading this body in a host that executes skills
as instructions constitutes loading, not completed review. Do not recursively call
the same skill through another catalog. Pass the real request and actual paths/diff;
derive optional target dimensions only from evidence. Entry owns routing, and only
active dispatches run. Multiroot pilot limits come from `pilotSkills`; plugin routing
and supported layer/skill settings come from the loaded adapter. Do not transplant
a multiroot denylist, fork layers or unsupported configuration into a plugin.

## Evidence and scope

Record `provider` inside `review.bcquality` (or `audit.bcquality`):

```json
{
  "mode": "plugin",
  "id": "bcquality",
  "skill": "bcquality-al-review",
  "configured": true,
  "expectedVersion": "0.1.0",
  "expectedSourceRef": null,
  "observedVersion": null,
  "observedSourceRef": null,
  "discovered": null,
  "loaded": null,
  "executed": null,
  "detail": "No host observation yet",
  "index": { "status": "unobserved", "detail": "No generation observed" }
}
```

Stages are independent boolean/null observations for the current host, workspace,
invocation and review inputs. Catalog presence establishes only `discovered`.
`loaded` requires the exact skill body/entry to have been read in the executing
context; `executed` requires an actual invocation result (successful or failed).
Preserve its outcome, citations and sub-results. Delegated contexts must load their
own applicable instructions; the parent's load is not the child's load. Cache reads
within an invocation, and invalidate evidence when host, config, revision or inputs
change. Conductor passes selection and task-context once; it does not manufacture
execution evidence or freeze observations for later phases.

Only completed domain results justify reduced native coverage. A catalog hit,
loaded body, empty dispatch, failure or unknown outcome cannot mark a domain covered.
Keep legacy `submodule-sha` only as an alias of an **observed** revision, or null;
never copy `pinnedCommit`/`sourceRef` into it as proof. Status lines say discovered,
loaded, executed (with outcome), or native fallback; avoid an ambiguous “active”.

## Best-effort knowledge index

Follow the **loaded provider's** index policy. When it requests
`tools/Build-KnowledgeIndex.ps1`, use an available authorized execution capability
at the actual provider root. ALDC Doctor never runs it. Read-only reviewers must
report `not-attempted` with the missing capability and use the provider's path-based
fallback. No PowerShell, a read-only cache or a build failure does not block review.

Index states: `unobserved`, `not-attempted`, `failed`, `generated`.
Claim `generated` only with an observed successful generator command, valid output
JSON read at that root, and output SHA-256 plus freshness evidence tied to this run
(before/after metadata or generator trace). A pre-existing file, catalog listing,
or exit zero alone is insufficient. Retain the command, exit code, output path/hash,
freshness detail and actual failure when known. Never claim the index was refreshed
merely because a skill says it normally refreshes it.

## Doctor and packaging

Export configuration explicitly with
`node tools/bcquality/config.js <workspace>` to a UTF-8 JSON file outside tracked
sources. Pass it to Doctor with `--bcquality-config <file>` and optional scoped
`--runtime <file>`. Doctor checks snapshot/workspace binding and source hash and
reports caller-supplied stages; it does not certify host execution. Without an
export it says configuration is uninspected. The exporter needs ALDC's declared
`js-yaml` dependency (root npm installation or `tools/aldc-validate` installation).
Installed plugins ship that validator dependency manifest; install dependencies
explicitly when this exporter is needed. No dependency installation is implicit.
For Codex local bootstrap the exporter is
`.agents/skills/aldc/scripts/bcquality/config.js` and its dependency manifest is
in the adjacent `scripts/aldc-validate/` directory; resolve from the installed
skill root when using plugin discovery instead.

Source templates and tools are copied by ALDC's package generators. Regeneration
does not update an already installed VSIX or certify a host/plugin test.
