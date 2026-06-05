# tools/bcquality

Tooling that clones (outside the AL project) and validates the BCQuality
knowledge base for this repo. Three files, each with one job.

## install.sh / install.ps1 — clone the knowledge base at the pinned commit

Use one of these on a fresh ALDC test repo before invoking any review or audit.
BCQuality is consumed from **outside the AL project** (multi-root): the scripts
clone it to `../bcquality` (override `$BCQUALITY_HOME`) so its example `.al`
files never enter your extension's compilation. Then open `aldc.code-workspace`
to get it as a second root. Without `skills/entry.md` present, agents fall back
to native checks only and the BCQuality citation layer is silent.

| Script | Shell | Notes |
|---|---|---|
| `install.sh` | bash | Linux, macOS, Git Bash, WSL. The repo's root `.gitattributes` pins `tools/bcquality/*.sh` to `eol=lf` so it stays runnable after a Windows clone. |
| `install.ps1` | PowerShell | Native Windows alternative. Same pin, same clone logic, same `entry.md` verification. |

Both scripts are idempotent and handle two situations:

1. **Clone already present** at `$BCQUALITY_HOME` → fetch + checkout at the pin.
2. **Not present yet** → `git clone` then checkout the pin (a plain clone outside
   the AL project, **not** a submodule of this repo).

After completion they:

- Verify `<home>/skills/entry.md` exists; fail loudly if not.
- Print the actual HEAD SHA of the clone so you can confirm it matches `aldc.yaml`.
- Warn if `aldc.yaml` doesn't record the same pin (the evidence validator would fail).

The canonical pin lives in **three** places: `aldc.yaml` under `external.bcquality.pinnedCommit` (the source of truth) and the hardcoded `BCQUALITY_PIN` / `$BcqualityPin` in `install.sh` and `install.ps1`. If you ever bump the pin, update all three in the same commit — `validate_evidence.py` (and the `bcquality-evidence` CI workflow) fails the build if any of them drift.

### Run from the repo root

```bash
# bash
bash tools/bcquality/install.sh
```

```powershell
# PowerShell
pwsh tools/bcquality/install.ps1
# or, if your policy is strict:
powershell -ExecutionPolicy Bypass -File tools\bcquality\install.ps1
```

## validate_evidence.py — falsifiable citation check

Used by the `.github/workflows/bcquality-evidence.yaml` workflow on every PR that touches `.github/plans/**`, `.github/audits/**`, `aldc.yaml`, `tools/bcquality/**`, or the workflow file itself. CI clones BCQuality at the pin and passes `--bcquality-root`.

It enforces two things:

1. **Pin coherence** — the canonical `external.bcquality.pinnedCommit` in `aldc.yaml` matches the `BCQUALITY_PIN` in `install.sh` and the `$BcqualityPin` in `install.ps1`.
2. **Citation resolvability** — for every persisted findings-report under `.github/plans/**/*-review-phase-*.json`, `.github/plans/**/*-bcquality-*.json`, and `.github/audits/**/*-audit-*.json`, every `references[].path` (collected recursively, including from `sub-results`) resolves to a real file inside the external BCQuality clone (`--bcquality-root`, cloned at the pinned commit). With no clone available, citation resolution is skipped with a note.

A hallucinated citation, a drifted pin, or a malformed JSON fails the build.

### Run locally

```bash
python3 tools/bcquality/validate_evidence.py
```

Flags (defaults shown):

- `--plans-dir .github/plans`
- `--audits-dir .github/audits`
- `--bcquality-root ../bcquality` (or set `$BCQUALITY_HOME` / `external.bcquality.home`)

Useful for catching a bad citation before you push.

## Why these three live together

They're the "BCQuality lifecycle" toolbox: `install` puts the knowledge there at the right commit, `validate_evidence` proves your reports cite it honestly. If we add more BCQuality-adjacent tooling (a pin bumper, a knowledge cache warmer), it goes here too.
