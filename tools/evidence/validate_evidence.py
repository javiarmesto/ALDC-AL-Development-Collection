#!/usr/bin/env python3
"""Validate ALDC Evidence Model v1 records embedded in JSON reports.

Stdlib-only structural validation. Provider-specific resolvability remains owned by
provider validators (for example tools/bcquality/validate_evidence.py).
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import subprocess
import sys

DOMAINS = {"project", "standard", "quality"}
STATUSES = {"verified", "partial", "unavailable", "contradicted"}
SHA_RE = re.compile(r"^[0-9a-fA-F]{7,40}$")


def repo_root() -> str:
    return subprocess.check_output(["git", "rev-parse", "--show-toplevel"]).decode().strip()


def iter_evidence(report: dict):
    for ev in report.get("evidence") or []:
        yield "report", ev
    for idx, finding in enumerate(report.get("findings") or []):
        for ev in finding.get("evidence") or []:
            yield f"findings[{idx}]", ev
    for idx, sub in enumerate(report.get("sub-results") or []):
        for where, ev in iter_evidence(sub):
            yield f"sub-results[{idx}].{where}", ev


def validate_record(ev: dict, where: str) -> list[str]:
    errors: list[str] = []
    required = ("id", "domain", "provider", "kind", "claim", "locator", "verification", "status")
    for field in required:
        if field not in ev:
            errors.append(f"{where}: evidence missing '{field}'")
    if errors:
        return errors

    if not isinstance(ev["id"], str) or not ev["id"].strip():
        errors.append(f"{where}: id must be a non-empty string")
    if ev["domain"] not in DOMAINS:
        errors.append(f"{where}: invalid domain '{ev['domain']}'")
    if not isinstance(ev["provider"], str) or not ev["provider"].strip():
        errors.append(f"{where}: provider must be a non-empty string")
    if not isinstance(ev["kind"], str) or not ev["kind"].strip():
        errors.append(f"{where}: kind must be a non-empty string")
    if not isinstance(ev["claim"], str) or not ev["claim"].strip():
        errors.append(f"{where}: claim must be a non-empty string")
    if not isinstance(ev["locator"], dict) or not ev["locator"]:
        errors.append(f"{where}: locator must be a non-empty object")
    verification = ev["verification"]
    if not isinstance(verification, dict) or not isinstance(verification.get("method"), str) or not verification.get("method", "").strip():
        errors.append(f"{where}: verification.method must be a non-empty string")
    if ev["status"] not in STATUSES:
        errors.append(f"{where}: invalid status '{ev['status']}'")

    provider = ev["provider"]
    locator = ev["locator"] if isinstance(ev["locator"], dict) else {}
    if provider == "bc-code-atlas":
        if ev["domain"] != "standard":
            errors.append(f"{where}: bc-code-atlas evidence domain must be 'standard'")
        if not locator.get("country"):
            errors.append(f"{where}: bc-code-atlas locator requires country")
        commit_sha = locator.get("commit_sha")
        if commit_sha is not None and not SHA_RE.match(str(commit_sha)):
            errors.append(f"{where}: invalid bc-code-atlas commit_sha '{commit_sha}'")
    elif provider == "bcquality":
        if ev["domain"] != "quality":
            errors.append(f"{where}: bcquality evidence domain must be 'quality'")
        if not locator.get("path"):
            errors.append(f"{where}: bcquality locator requires path")
    return errors


def main() -> int:
    ap = argparse.ArgumentParser(description="Validate ALDC Evidence Model v1 records")
    ap.add_argument("--plans-dir", default=".github/plans")
    ap.add_argument("--audits-dir", default=".github/audits")
    args = ap.parse_args()

    try:
        root = repo_root()
    except subprocess.CalledProcessError:
        print("setup error: not inside a git repository", file=sys.stderr)
        return 2

    files: list[str] = []
    for base in (args.plans_dir, args.audits_dir):
        files.extend(glob.glob(os.path.join(root, base, "**", "*.json"), recursive=True))
    files = sorted(set(files))

    errors: list[str] = []
    total = 0
    for path in files:
        rel = os.path.relpath(path, root)
        try:
            with open(path, encoding="utf-8") as fh:
                report = json.load(fh)
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"{rel}: cannot parse JSON ({exc})")
            continue

        seen: set[str] = set()
        top_level_ids = {ev.get("id") for ev in report.get("evidence") or [] if isinstance(ev, dict)}
        for where, ev in iter_evidence(report):
            total += 1
            if not isinstance(ev, dict):
                errors.append(f"{rel}:{where}: evidence must be an object")
                continue
            ev_id = ev.get("id")
            if ev_id in seen:
                errors.append(f"{rel}: duplicate evidence id '{ev_id}'")
            if ev_id:
                seen.add(ev_id)
            errors.extend(f"{rel}:{e}" for e in validate_record(ev, where))

        for idx, finding in enumerate(report.get("findings") or []):
            for ev_id in finding.get("evidence_ids") or []:
                if ev_id not in top_level_ids:
                    errors.append(f"{rel}: findings[{idx}] evidence_ids references unknown top-level evidence '{ev_id}'")

    if errors:
        print("ALDC evidence validation FAILED:")
        for error in errors:
            print(f"  x {error}")
        return 1

    print(f"ALDC evidence validation PASSED ({total} evidence record(s) across {len(files)} JSON file(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
