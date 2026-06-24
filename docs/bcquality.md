# BCQuality — external citable knowledge for reviews & audits

BCQuality is an **optional** layer that gives ALDC's review/audit agents a curated,
**citable** Business Central knowledge base. When it is mounted, `al-review-subagent`,
`@dredd`, and `@al-triage` back their findings with a real knowledge file; when it is
**absent (the default)**, they fall back to the native A–G checklist + auto-applied
instructions and **never block**. You only need this if you want BCQuality-cited
reviews.

## How the integration works

- **Consumed externally — not a submodule.** ALDC clones BCQuality **outside** your
  AL project (a sibling folder, default `../bcquality`). Because that clone has no
  `app.json`, the AL compiler never builds it, so its example `.al` files can't
  pollute your extension's error list.
- **The source is configurable; the default is the canonical upstream.** Out of the
  box `aldc.yaml → external.bcquality.url` points at **[`microsoft/BCQuality`](https://github.com/microsoft/BCQuality)**
  (the source of truth). Point `url` at **your own fork** if you maintain one. By
  default it tracks the `ref` branch (`main`); set `pinnedCommit` to a 40-hex SHA for
  reproducible, evidence-validated runs.
- **ALDC "hooks in" by calling the meta-skill `entry.md`.** The agents do **not**
  hardcode which BCQuality skills to run. They read the entry point
  (`<home>/skills/entry.md`, per `aldc.yaml`) and **execute whatever its `dispatch[]`
  returns** — Entry owns the routing. As BCQuality's coverage grows, ALDC picks it up
  with no change on this side.
- **Configuration lives in `aldc.yaml → external.bcquality`**: `enabled`
  (`auto` | `true` | `false`), `url`, `ref`, optional `pinnedCommit`, `home` (clone
  location), `entryPoint` (`skills/entry.md`), the multi-root `workspace`, and the
  absent-path `fallback` policy. The install scripts read `url`/`ref`/`pinnedCommit`
  from here — it is the single source of truth.
- **The `enabled` switch is resolved ONCE by `al-conductor`** and propagated to the
  subagents (recorded in the plan doc): `auto` probes to detect, `true` expects it
  (probe + warn if absent), `false` disables it entirely (native A–G, **no probe**).
  Subagents consume that decision and do not re-probe — except `@dredd`/`@al-triage`
  run standalone, so they read `enabled` and probe themselves.

## Knowledge index (Source-step acceleration)

Recent BCQuality versions add a **knowledge index** — a single `knowledge-index.json`
at the clone root that the review skills read at their `Source` step instead of
opening every knowledge file to parse its frontmatter. It changes only **how**
candidate knowledge files are discovered, never **which** are selected, so findings
and citations are identical with or without it.

- **Owned by BCQuality, not ALDC.** The generator (`tools/Build-KnowledgeIndex.ps1`)
  ships inside the clone, next to the skills and knowledge it derives from. ALDC does
  not re-implement the parser — it just runs that generator.
- **Built once at install.** Because ALDC consumes the **full** clone (it filters by
  `enabled-layers` / `disabled-skills` in the task-context, it does **not** prune the
  clone by allow/deny policy), the index is stable between installs. The install
  scripts build it right after the clone (`install.ps1` runs under PowerShell;
  `install.sh` needs `pwsh` on `PATH`). `entry.md`'s preparation step rebuilds it on
  demand at runtime if it is absent or stale, so the two paths reinforce each other.
- **Never blocks.** A missing generator (older BCQuality), a missing `pwsh`, or a
  failed build all fall back to path-based discovery. Review still works — it just
  loses the index acceleration. Same principle as the absent-layer fallback: BCQuality
  is additive and never fails the review.

See `tools/bcquality/README.md` for the exact install-time behaviour.

## Install (only if you want BCQuality-backed reviews)

From your **AL project root**:

1. **Clone the knowledge base.**
   - macOS / Linux / Git Bash / WSL: `bash tools/bcquality/install.sh`
   - Windows (PowerShell): `pwsh -File tools/bcquality/install.ps1`

   This reads `url` / `ref` / `pinnedCommit` from `aldc.yaml` and clones BCQuality to
   `../bcquality` (default upstream `microsoft/BCQuality`; override the location with
   `$BCQUALITY_HOME`). The scripts are idempotent and verify `skills/entry.md` exists.
   To use your own fork or a fixed version, edit `external.bcquality` in `aldc.yaml`
   before running.

2. **Open the multi-root workspace.** Open `aldc.code-workspace` in VS Code. It adds
   two roots — your extension (compiled) and `../bcquality` (knowledge, *not*
   compiled). If the second root shows as missing, re-run the install script.

3. **Use it.** Run a review/audit as usual:
   - `@al-conductor` review phases, `@dredd` (independent audit), `@al-triage`
     (diagnosis) each **probe** `aldc.yaml → external.bcquality.home`, read
     `entry.md`, and fold cited findings into their output.
   - If the probe fails (not installed / disabled), they record BCQuality as
     `not-applicable`, review against the full **A–G** native checklist, and carry
     on — nothing blocks.

## Pin & evidence

`aldc.yaml → external.bcquality` is the **single source of truth** for `url`, `ref`
and the optional `pinnedCommit`; the install scripts and the `bcquality-evidence` CI
workflow read it from there (nothing is hardcoded). Pinning is **optional**: set
`pinnedCommit` to a 40-hex SHA for reproducible runs, or leave it empty to track the
`ref` branch. Either way, `tools/bcquality/validate_evidence.py` checks that every
citation in a persisted review/audit report resolves to a real file **inside** the
clone — a hallucinated citation fails the build.

To change the source or version, edit `url` / `ref` / `pinnedCommit` in `aldc.yaml`.

## Notes

- **Absent is the default.** A fresh ALDC install does not clone BCQuality; you opt
  in with the install script.
- BCQuality is a **citation/audit layer** — it does not replace the auto-applied
  `*.instructions.md` or the domain skills; it adds evidence-backed findings on top.
