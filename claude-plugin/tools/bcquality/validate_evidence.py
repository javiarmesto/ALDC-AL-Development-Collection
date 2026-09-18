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


def primary_citations(report: dict) -> set[str]:
    """Each retained finding's PRIMARY knowledge path, recursively.

    Declared review criteria are keyed on `references[0].path`, and the findings
    that answer them usually live in the provider's sub-results rather than at the
    top level, so a top-level-only lookup would call every criterion uncited.
    """
    paths: set[str] = set()
    for finding in report.get("findings") or []:
        if not isinstance(finding, dict):
            continue
        refs = finding.get("references") or []
        if refs and isinstance(refs[0], dict) and refs[0].get("path"):
            paths.add(refs[0]["path"])
    for sub in report.get("sub-results") or []:
        if isinstance(sub, dict):
            paths |= primary_citations(sub)
    return paths


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
SEVERITIES = ("blocker", "major", "minor", "info")
CONFIDENCES = ("high", "medium", "low")
CAPPED_CONFIDENCES = ("medium", "low")   # native/agent findings


def nonempty_str(value) -> bool:
    return isinstance(value, str) and value.strip() != ""


def check_criteria(where: str, scope: str, section: dict, report: dict, errors: list[str]) -> None:
    """Declared review criteria are bookkeeping over findings that already exist.

    So the only two things that can be wrong are arithmetic (the buckets do not add
    up to what was declared) and an unmet criterion that no retained finding cites.
    Neither produces a finding or touches the verdict; both mean the table lies.
    """
    criteria = section.get("criteria")
    if criteria is None:
        return
    if not isinstance(criteria, dict):
        errors.append(f"{where}'{scope}.criteria' must be an object.")
        return

    counts = {}
    for key in ("declared", "met", "house-rules-unmet"):
        value = criteria.get(key)
        if not isinstance(value, int) or isinstance(value, bool):
            errors.append(f"{where}'{scope}.criteria.{key}' must be an integer (got {value!r}).")
        else:
            counts[key] = value

    unmet = criteria.get("unmet")
    unmet_paths: list[str] = []
    if not isinstance(unmet, list):
        errors.append(f"{where}'{scope}.criteria.unmet' must be an array.")
        unmet = None
    else:
        for i, row in enumerate(unmet):
            if not isinstance(row, dict):
                errors.append(f"{where}'{scope}.criteria.unmet[{i}]' must be an object.")
            elif not nonempty_str(row.get("path")):
                errors.append(f"{where}'{scope}.criteria.unmet[{i}].path' must be a non-empty string.")
            else:
                unmet_paths.append(row["path"])

    not_evaluated = criteria.get("not-evaluated")
    if not isinstance(not_evaluated, list):
        errors.append(f"{where}'{scope}.criteria.not-evaluated' must be an array.")
        not_evaluated = None
    elif any(not nonempty_str(p) for p in not_evaluated):
        errors.append(f"{where}'{scope}.criteria.not-evaluated' entries must be non-empty strings.")

    if "declared" in counts and "met" in counts and unmet is not None and not_evaluated is not None:
        total = counts["met"] + len(unmet) + len(not_evaluated)
        if counts["declared"] != total:
            errors.append(f"{where}'{scope}.criteria': declared {counts['declared']} \u2260 "
                          f"met {counts['met']} + unmet {len(unmet)} + not-evaluated "
                          f"{len(not_evaluated)} = {total}.")

    cited = primary_citations(report)
    for path in unmet_paths:
        if path not in cited:
            errors.append(f"{where}'{scope}.criteria': unmet criterion {path!r} is cited by no "
                          f"retained finding (match is on references[0].path).")


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
            severity = finding.get("severity")
            if severity is not None and severity not in SEVERITIES:
                errors.append(f"{where}findings[{i}].severity must be one of "
                              f"{', '.join(SEVERITIES)} (got {severity!r}).")
            confidence = finding.get("confidence")
            if confidence is not None and confidence not in CONFIDENCES:
                errors.append(f"{where}findings[{i}].confidence must be one of "
                              f"{', '.join(CONFIDENCES)} (got {confidence!r}).")
            refs = finding.get("references")
            if refs is not None and not isinstance(refs, list):
                errors.append(f"{where}findings[{i}].references must be an array.")
                continue
            # An absent citation list is an empty one, not a reason to stop checking:
            # native and agent findings are exactly the ones that carry no references,
            # and they are the ones the identity and cap rules below are about.
            refs = refs or []
            for j, ref in enumerate(refs):
                if not isinstance(ref, dict):
                    errors.append(f"{where}findings[{i}].references[{j}] must be an object.")
                elif "path" in ref and not nonempty_str(ref["path"]):
                    errors.append(f"{where}findings[{i}].references[{j}].path must be a non-empty string.")

            # DO: a citation-based finding's id IS its primary knowledge path.
            fid = finding.get("id")
            paths = [r.get("path") for r in refs if isinstance(r, dict) and r.get("path")]
            if paths:
                if fid != paths[0]:
                    errors.append(f"{where}findings[{i}].id must equal references[0].path "
                                  f"(id={fid!r}, references[0].path={paths[0]!r}).")
            elif nonempty_str(fid):
                # Native and agent findings carry no citation and are advisory-capped.
                if fid.startswith(("agent:", "native:")):
                    if confidence is not None and confidence not in CAPPED_CONFIDENCES:
                        errors.append(f"{where}findings[{i}]: {fid.split(':', 1)[0]} findings "
                                      f"cap confidence at medium (got {confidence!r}).")
                    if fid.startswith("agent:") and severity in ("blocker", "major"):
                        errors.append(f"{where}findings[{i}]: agent findings are advisory; "
                                      f"severity caps at minor (got {severity!r}).")
                else:
                    errors.append(f"{where}findings[{i}].id {fid!r} has no references and no "
                                  f"native:/agent: prefix; it is neither a citation, a native "
                                  f"check nor an agent finding.")

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
        check_criteria(where, scope, section, report, errors)
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
