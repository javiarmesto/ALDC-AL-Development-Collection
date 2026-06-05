# BCQuality — external citable knowledge for reviews & audits

BCQuality is an **optional** layer that gives ALDC's review/audit agents a curated,
**citable** Business Central knowledge base. When it is mounted, `al-review-subagent`,
`@dredd`, and `@al-triage` back their findings with a real knowledge file; when it is
**absent (the default)**, they fall back to the native A–G checklist + auto-applied
instructions and **never block**. You only need this if you want BCQuality-cited
reviews.

## How the integration works

- **It is a fork, consumed externally — not a submodule.** ALDC pins a fork of
  BCQuality (`https://github.com/javiarmesto/bcquality.git`) at a known commit and
  clones it **outside** your AL project (a sibling folder, default `../bcquality`).
  Because that clone has no `app.json`, the AL compiler never builds it, so its
  example `.al` files can't pollute your extension's error list.
- **ALDC "hooks in" by calling the meta-skill `entry.md`.** The agents do **not**
  hardcode which BCQuality skills to run. They read the entry point
  (`<home>/skills/entry.md`, per `aldc.yaml`) and **execute whatever its `dispatch[]`
  returns** — Entry owns the routing. As the fork's coverage grows, ALDC picks it up
  with no change on this side.
- **Configuration lives in `aldc.yaml → external.bcquality`**: the fork `url`, the
  `pinnedCommit`, the `home` (clone location), the `entryPoint` (`skills/entry.md`),
  the multi-root `workspace`, and the absent-path `fallback` policy.

## Install (only if you want BCQuality-backed reviews)

From your **AL project root**:

1. **Clone the pinned fork.**
   - macOS / Linux / Git Bash / WSL: `bash tools/bcquality/install.sh`
   - Windows (PowerShell): `pwsh -File tools/bcquality/install.ps1`

   This clones `javiarmesto/bcquality` to `../bcquality` at the pinned commit
   (override the location with `$BCQUALITY_HOME`). The scripts are idempotent and
   verify `skills/entry.md` exists.

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

The fork is **pinned** to one commit, asserted in three places that must agree:
`external.bcquality.pinnedCommit` in `aldc.yaml` and the hardcoded pin in both
install scripts. `tools/bcquality/validate_evidence.py` (run by the
`bcquality-evidence` CI workflow) checks that coherence **and** that every citation
in a persisted review/audit report resolves to a real file **inside** the pinned
clone — a drifted pin or a hallucinated citation fails the build.

To bump the BCQuality version, update the pin in all three places together.

## Notes

- **Absent is the default.** A fresh ALDC install does not clone BCQuality; you opt
  in with the install script.
- BCQuality is a **citation/audit layer** — it does not replace the auto-applied
  `*.instructions.md` or the domain skills; it adds evidence-backed findings on top.
