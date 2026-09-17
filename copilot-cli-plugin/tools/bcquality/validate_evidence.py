#!/usr/bin/env python3
"""Validate report structure and available corpus citations, not host execution.

Configuration is normalized by config.js (Node + declared js-yaml dependency).
Absent plugin corpus leaves citation resolution explicitly unverified.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import subprocess
import sys

def repo_root() -> str:
    return subprocess.check_output(["git", "rev-parse", "--show-toplevel"]).decode().strip()


def provider_config(root):
    script = os.path.join(os.path.dirname(__file__), "config.js")
    return json.loads(subprocess.check_output(["node", script, root], text=True))["bcquality"]


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


# The declared shape of a review report (docs/templates/review-report-contract.md).
# Presence alone was the whole gate, so a report claiming `outcome: "BANANA"`
# with a numeric `skill` passed: the evidence a human approves could be any
# JSON carrying three keys.
OUTCOMES = ("completed", "partial", "failed")
VERDICTS = ("APPROVED", "APPROVED_WITH_RECOMMENDATIONS", "NEEDS_REVISION", "FAILED")
COVERAGE_STATUS = ("completed", "not-applicable", "skipped", "partial", "failed", "pending")


def nonempty_str(value) -> bool:
    return isinstance(value, str) and value.strip() != ""


def check_shape(rel: str, report: dict, errors: list[str], depth: int = 0) -> None:
    where = f"{rel}: " if depth == 0 else f"{rel}: sub-result: "

    skill = report.get("skill")
    if not isinstance(skill, dict):
        errors.append(f"{where}'skill' must be an object with id and version.")
    else:
        if not nonempty_str(skill.get("id")):
            errors.append(f"{where}'skill.id' must be a non-empty string.")
        version = skill.get("version")
        if not isinstance(version, int) or isinstance(version, bool):
            errors.append(f"{where}'skill.version' must be an integer.")

    outcome = report.get("outcome")
    if outcome not in OUTCOMES:
        errors.append(f"{where}'outcome' must be one of {', '.join(OUTCOMES)} (got {outcome!r}).")

    findings = report.get("findings")
    if not isinstance(findings, list):
        errors.append(f"{where}'findings' must be an array.")
    else:
        for i, finding in enumerate(findings):
            if not isinstance(finding, dict):
                errors.append(f"{where}findings[{i}] must be an object.")
                continue
            refs = finding.get("references")
            if refs is None:
                continue
            if not isinstance(refs, list):
                errors.append(f"{where}findings[{i}].references must be an array.")
                continue
            for j, ref in enumerate(refs):
                if not isinstance(ref, dict):
                    errors.append(f"{where}findings[{i}].references[{j}] must be an object.")
                elif "path" in ref and not nonempty_str(ref["path"]):
                    errors.append(f"{where}findings[{i}].references[{j}].path must be a non-empty string.")

    for scope in ("review", "audit"):
        section = report.get(scope)
        if section is None:
            continue
        if not isinstance(section, dict):
            errors.append(f"{where}'{scope}' must be an object.")
            continue
        verdict = section.get("verdict")
        if verdict is not None and verdict not in VERDICTS:
            errors.append(f"{where}'{scope}.verdict' must be one of {', '.join(VERDICTS)} (got {verdict!r}).")
        coverage = section.get("coverage")
        if coverage is None:
            continue
        if not isinstance(coverage, list):
            errors.append(f"{where}'{scope}.coverage' must be an array.")
            continue
        for i, row in enumerate(coverage):
            if not isinstance(row, dict):
                errors.append(f"{where}'{scope}.coverage[{i}]' must be an object.")
            elif row.get("status") not in COVERAGE_STATUS:
                errors.append(f"{where}'{scope}.coverage[{i}].status' must be one of "
                              f"{', '.join(COVERAGE_STATUS)} (got {row.get('status')!r}).")

    subs = report.get("sub-results")
    if subs is None:
        return
    if not isinstance(subs, list):
        errors.append(f"{where}'sub-results' must be an array.")
        return
    for sub in subs:
        if not isinstance(sub, dict):
            errors.append(f"{where}each sub-result must be an object.")
        else:
            check_shape(rel, sub, errors, depth + 1)


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

    try:
        config = provider_config(root)
    except (OSError, ValueError, subprocess.CalledProcessError) as exc:
        print(f"setup error: BCQuality configuration unavailable: {exc}", file=sys.stderr)
        return 2
    plugin = config["mode"] == "plugin"
    pinned = config["plugin"]["sourceRef"] if plugin else config["pinnedCommit"]
    # An explicit corpus may validate historical reports even when disabled.
    bcq_root = args.bcquality_root
    if not bcq_root and not plugin and config["enabled"] is not False:
        bcq_root = os.environ.get("BCQUALITY_HOME") or config["home"]
    bcq_abs = os.path.realpath(os.path.join(root, bcq_root)) if bcq_root else None
    populated = bool(bcq_abs) and os.path.isfile(os.path.join(bcq_abs, "skills", "entry.md"))
    identity_verified = not pinned
    actual = None
    if populated:
        try:
            git_root = subprocess.check_output(["git", "-C", bcq_abs, "rev-parse", "--show-toplevel"], text=True, stderr=subprocess.DEVNULL).strip()
            if os.path.realpath(git_root) != bcq_abs:
                raise ValueError("Corpus is not its own Git root")
            actual = subprocess.check_output(["git", "-C", bcq_abs, "rev-parse", "HEAD"], text=True, stderr=subprocess.DEVNULL).strip()
            identity_verified = not pinned or actual == pinned
            if not identity_verified:
                errors.append(f"Corpus revision mismatch: expected {pinned}, observed {actual}")
        except (OSError, ValueError, subprocess.CalledProcessError):
            notes.append("Corpus has no observable git revision; configured pin remains unverified.")
    if not populated:
        notes.append("Matching BCQuality corpus unavailable; citation resolution UNVERIFIED. Plugin mode requires an explicit --bcquality-root, never legacy home.")
    else:
        notes.append(f"Citation corpus: {bcq_abs}; this does not prove plugin loading/execution.")

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
        if not isinstance(report, dict):
            errors.append(f"{rel}: expected a report object.")
            continue
        check_shape(rel, report, errors)
        try:
            cites = collect_citations(report)
            if any(not isinstance(c, str) or not c for c in cites):
                raise ValueError("citation paths must be non-empty strings")
            for scope in ("review", "audit"):
                bcq = report.get(scope, {}).get("bcquality", {})
                declared = bcq.get("provider", {}).get("observedSourceRef") or bcq.get("submodule-sha")
                if declared and populated:
                    if actual and declared != actual:
                        errors.append(f"{rel}: reported revision {declared} differs from corpus {actual}")
                    elif not actual:
                        identity_verified = False
                        notes.append(f"{rel}: reported revision cannot be checked against this corpus.")
        except (AttributeError, TypeError, ValueError) as exc:
            errors.append(f"{rel}: invalid report/citation shape ({exc}).")
            continue
        total_cites += len(cites)
        for c in cites:
            if not populated:
                continue
            # A citation must resolve to a file INSIDE the BCQuality clone. Reject
            # absolute paths and any ".." traversal that would escape the clone —
            # otherwise a crafted report could cite an arbitrary on-disk file and pass.
            base = os.path.realpath(bcq_abs)
            target = os.path.realpath(os.path.join(base, c))
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
        f"\nBCQuality report structure PASSED; citation resolution {'CHECKED' if populated and identity_verified else 'UNVERIFIED'} "
        f"({total_cites} citation(s) across {len(evidence)} file(s))."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
