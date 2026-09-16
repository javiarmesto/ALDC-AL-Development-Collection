# BCQuality — optional cited reviews

ALDC supports two explicit BCQuality providers with the same evidence and native
fallback contract. Existing projects retain `external-multiroot`; plugin mode is
opt-in. No provider is installed or invoked simply by declaring it in `aldc.yaml`.

| Mode | Source | Entry | When unavailable |
|---|---|---|---|
| `plugin` | Host-installed plugin with the configured identity | Configured skill, default `bcquality-al-review` | Full native A–G; no automatic clone substitution |
| `external-multiroot` | External folder configured by `home` | `entryPoint`, default `skills/entry.md` | Full native A–G |
| Either with `enabled: false` | None read | No probe or invocation | Full native A–G |

## Plugin configuration

Merge this small block into the **project's** configuration, preserving other
settings. Install the intended plugin through the chosen host first.

```yaml
external:
  bcquality:
    mode: plugin
    enabled: auto
    plugin:
      id: bcquality
      skill: bcquality-al-review
      expectedVersion: "0.1.0"
      sourceRef: "" # Optional full commit SHA; verify against the actual installation.
```

This selects a compatible adapter exposing that skill; it does not imply that
current upstream supplies it. Inspect the installed manifest and skill body.
If a different release exposes `al-code-review`, configure that exact skill and
its actual expected version explicitly. A renamed skill is not a discovery alias.
An expected revision/version that cannot be observed remains unverified; an
observed mismatch uses native fallback. Do not copy consumer fork layers or pins
into shared defaults.

The configured skill owns routing, supported layer controls and index preparation.
Pass the real request and paths, and retain actual dispatch results unchanged.
`pilotSkills` is a multiroot policy, not an implicit plugin denylist.

## External multiroot setup

Keep BCQuality outside AL source folders. Configuration supports `url`, `ref`,
optional full `pinnedCommit`, `home`, `entryPoint` and the existing `pilotSkills`.
`BCQUALITY_HOME` overrides the install location. Open the external folder in the
host so the reviewer can actually read it.

From the project root, after installing ALDC's declared npm dependencies:

```sh
bash tools/bcquality/install.sh
# Windows alternative:
pwsh -File tools/bcquality/install.ps1
```

These commands clone/update only in enabled multiroot mode. In plugin mode or
when disabled, they exit before any Git/provider operation. YAML is parsed by the
shared `tools/bcquality/config.js`, so another provider's `url` or `ref` is not
mistaken for BCQuality's. An installed toolkit can obtain the YAML dependency by
explicitly running `npm install --prefix <toolkit>/tools/aldc-validate`.

## Review and index evidence

Conductor passes selection and task-context; the executing reviewer loads the
appropriate provider instructions. Dredd and Triage use the same contract when
invoked independently. Native coverage shrinks only for domains covered by actual
completed results. ALDC hard rules remain in force.

| Observation | What it establishes |
|---|---|
| Configured | Project selected a provider and expectations |
| Discovered | Host catalog or external entry found |
| Loaded | Exact skill/entry body read in the executing context |
| Executed | An actual result returned for these review inputs, with its outcome |
| Index generated | Successful generator invocation plus verified output and freshness evidence |

Index generation is best-effort. Missing PowerShell, read-only cache, an execution
restriction or generator failure must be recorded; use the provider's path-based
fallback. A pre-existing `knowledge-index.json` alone proves no refresh. Doctor
never runs the generator, compiles AL or installs a provider.

See [the shared provider contract](templates/bcquality-provider-contract.md),
[task-context](templates/bcquality-task-context.md) and
[Doctor usage](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/tools/context-doctor/README.md).

## Validation limits

`validate_evidence.py` checks report shape and resolves citations only when a
matching corpus is available. Plugin mode requires an explicit `--bcquality-root`
for this offline check; it never borrows `home` from a multiroot setup. A configured
pin is compared with an observable Git revision, when available. Missing corpus
or unobservable identity is reported as **UNVERIFIED**, not citation success.
CI does not certify plugin discovery, loading, execution or index freshness.
