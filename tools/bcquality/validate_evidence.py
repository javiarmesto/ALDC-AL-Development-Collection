#!/usr/bin/env python3
"""Validate BCQuality evidence in an ALDC repository.

Two independent checks (Nivel 4 of the evidencing design):

  1. Pinned-SHA consistency — the BCQuality pin lives in THREE places that must
     agree: `external.bcquality.pinnedCommit` in aldc.yaml (canonical) and the
     hardcoded pin in both `tools/bcquality/install.sh` and `install.ps1`. A
     drift in any of them fails the build (the install scripts silently regressed
     before this guard existed). BCQuality is consumed from OUTSIDE the AL project
     (multi-root), so there is no in-repo submodule gitlink to check.

  2. Citation resolvability — every knowledge-file path cited in a persisted
     report (`.github/plans/**/*-review-phase-*.json`, the canonical superset,
     and `**/*-bcquality-*.json`, the derived BCQuality view) must resolve to a
     real file inside the external BCQuality clone given by `--bcquality-root`
     (CI clones it at the pinned SHA). collect_citations recurses into
     sub-results. A hallucinated citation fails the build. When no clone is
     available, citation resolution is skipped with a note (pin coherence still runs).

Stdlib only — no third-party dependencies. Exit codes: 0 pass, 1 validation
failure, 2 setup error.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import subprocess
import sys

SHA_RE = re.compile(r'pinnedCommit:\s*"?([0-9a-f]{40})"?')

# Hardcoded pin assignment in the install scripts (bash + PowerShell):
#   BCQUALITY_PIN="<sha>"   /   $BcqualityPin = '<sha>'
INSTALL_PIN_RE = re.compile(r'(?:BCQUALITY_PIN|BcqualityPin)\s*=\s*["\']?([0-9a-f]{40})')

# Files that hardcode the pin and must match aldc.yaml's canonical value.
INSTALL_PIN_FILES = (
    "tools/bcquality/install.sh",
    "tools/bcquality/install.ps1",
)


def repo_root() -> str:
    return subprocess.check_output(["git", "rev-parse", "--show-toplevel"]).decode().strip()


def pinned_sha_from_aldc(root: str) -> str | None:
    path = os.path.join(root, "aldc.yaml")
    try:
        with open(path, encoding="utf-8") as fh:
            m = SHA_RE.search(fh.read())
        return m.group(1) if m else None
    except OSError:
        return None


HOME_RE = re.compile(r'^\s*home:\s*"?([^"\n#]+?)"?\s*(?:#.*)?$', re.MULTILINE)


def home_from_aldc(root: str) -> str | None:
    """external.bcquality.home — the external clone location (relative to repo root)."""
    path = os.path.join(root, "aldc.yaml")
    try:
        with open(path, encoding="utf-8") as fh:
            m = HOME_RE.search(fh.read())
        return m.group(1).strip() if m else None
    except OSError:
        return None


def install_pin(root: str, rel_path: str) -> str | None:
    path = os.path.join(root, rel_path)
    try:
        with open(path, encoding="utf-8") as fh:
            m = INSTALL_PIN_RE.search(fh.read())
        return m.group(1) if m else None
    except OSError:
        return None


def collect_citations(report: dict) -> list[str]:
    """All knowledge-file paths cited anywhere in a findings-report (recursive)."""
    cites: list[str] = []
    for finding in report.get("findings") or []:
        for ref in finding.get("references") or []:
            if ref.get("path"):
                cites.append(ref["path"])
    for entry in report.get("suppressed") or []:
        ref = entry.get("reference") or {}
        if ref.get("path"):
            cites.append(ref["path"])
    for sub in report.get("sub-results") or []:
        cites.extend(collect_citations(sub))
    return cites


def main() -> int:
    ap = argparse.ArgumentParser(description="Validate BCQuality evidence.")
    ap.add_argument("--plans-dir", default=".github/plans")
    ap.add_argument("--audits-dir", default=".github/audits")
    ap.add_argument("--bcquality-root", default=None,
                    help="path to the external BCQuality clone "
                         "(default: $BCQUALITY_HOME or aldc.yaml external.bcquality.home)")
    args = ap.parse_args()

    try:
        root = repo_root()
    except subprocess.CalledProcessError:
        print("setup error: not inside a git repository.", file=sys.stderr)
        return 2

    errors: list[str] = []
    notes: list[str] = []

    # --- Check 1: pinned-SHA consistency (aldc.yaml <-> both install scripts) -
    pinned = pinned_sha_from_aldc(root)
    if not pinned:
        errors.append("aldc.yaml: external.bcquality.pinnedCommit missing or not a 40-hex SHA.")

    # Install scripts hardcode the pin; assert they match aldc.yaml (canonical).
    for rel in INSTALL_PIN_FILES:
        script_pin = install_pin(root, rel)
        if script_pin is None:
            errors.append(f"{rel}: BCQuality pin assignment not found or not a 40-hex SHA.")
        elif pinned and script_pin != pinned:
            errors.append(f"SHA mismatch: aldc.yaml={pinned} but {rel}={script_pin}.")
        elif pinned:
            notes.append(f"pinned SHA consistent: {rel} == aldc.yaml")

    # --- Resolve the external BCQuality clone (multi-root; no in-repo submodule) ---
    bcq_root = args.bcquality_root or os.environ.get("BCQUALITY_HOME") or home_from_aldc(root)
    bcq_abs = None
    if bcq_root:
        bcq_abs = bcq_root if os.path.isabs(bcq_root) else os.path.normpath(os.path.join(root, bcq_root))
    populated = bool(bcq_abs) and os.path.isfile(os.path.join(bcq_abs, "skills", "entry.md"))
    if not populated:
        notes.append(
            "BCQuality clone not available (no --bcquality-root / $BCQUALITY_HOME / aldc home, "
            "or skills/entry.md missing) — citation resolution skipped."
        )
    else:
        notes.append(f"BCQuality clone: {bcq_abs}")

    # --- Check 2: citation resolvability -------------------------------------
    # Review-report (superset) + derived BCQuality view, under plans-dir; plus Dredd
    # audit reports under audits-dir. collect_citations recurses into sub-results, so a
    # superset/audit report covers its BCQuality citations too.
    evidence = []
    for suffix in ("*-review-phase-*.json", "*-bcquality-*.json"):
        evidence.extend(glob.glob(os.path.join(root, args.plans_dir, "**", suffix), recursive=True))
    evidence.extend(glob.glob(os.path.join(root, args.audits_dir, "**", "*-audit-*.json"), recursive=True))
    evidence = sorted(set(evidence))
    if not evidence:
        notes.append("no evidence files (review-phase / bcquality / audit) found — nothing to validate.")

    total_cites = 0
    for ef in evidence:
        rel = os.path.relpath(ef, root)
        try:
            with open(ef, encoding="utf-8") as fh:
                report = json.load(fh)
        except (json.JSONDecodeError, OSError) as exc:
            errors.append(f"{rel}: cannot parse JSON ({exc}).")
            continue
        for field in ("skill", "outcome", "findings"):
            if field not in report:
                errors.append(f"{rel}: missing required field '{field}'.")
        cites = collect_citations(report)
        total_cites += len(cites)
        for c in cites:
            if not populated:
                continue
            # A citation must resolve to a file INSIDE the BCQuality clone. Reject
            # absolute paths and any ".." traversal that would escape the clone —
            # otherwise a crafted report could cite an arbitrary on-disk file and pass.
            base = os.path.normpath(bcq_abs)
            target = os.path.normpath(os.path.join(base, c))
            inside = target == base or target.startswith(base + os.sep)
            if os.path.isabs(c) or not inside:
                errors.append(f"{rel}: citation escapes the BCQuality clone (absolute path or '..' traversal): {c}")
            elif not os.path.isfile(target):
                errors.append(f"{rel}: citation does not resolve in BCQuality clone: {c}")
        notes.append(f"{rel}: outcome={report.get('outcome', '?')}, {len(cites)} citation(s).")

    # --- Report --------------------------------------------------------------
    for n in notes:
        print(f"  - {n}")
    if errors:
        print("\nBCQuality evidence validation FAILED:")
        for e in errors:
            print(f"  x {e}")
        return 1
    print(
        f"\nBCQuality evidence validation PASSED "
        f"({total_cites} citation(s) across {len(evidence)} file(s))."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
