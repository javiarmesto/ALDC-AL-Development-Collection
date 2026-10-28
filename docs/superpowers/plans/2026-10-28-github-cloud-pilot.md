# ALDC GitHub Cloud Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a source-traceable GitHub-native ALDC pilot using Directions v18 and start its architecture issue.

**Architecture:** A canonical-source projector produces short cloud agent entry points and complete adapted reference contracts. A Python preparer verifies and imports v18 into a fresh consumer, adds CI and immutable-fixture checks, and records provenance. The private consumer hosts issue/PR execution; ALDC's generator changes are delivered separately.

**Tech Stack:** Node.js 20+, existing js-yaml, Python 3 standard library, GitHub Actions, pinned Microsoft AL .NET tool.

**Spec:** `docs/superpowers/specs/2026-10-28-github-cloud-pilot-design.md`

## Global Constraints

- Preserve v18 source fixtures and manifests byte-for-byte.
- Generate from canonical sources; no generated sibling host is an input.
- Preserve human approvals and read-only review permissions.
- Private pilot, no autonomous deployment or merge.
- Report unavailable AL operations explicitly.

## Review Focus

- A destination collision must abort before writing any file.
- Archive traversal, symlink and case-insensitive duplicate entries must be rejected.
- An agent profile may be short while a referenced contract still contains unsupported host calls; inspect both.
- A changed acceptance test must fail independently of the generated feature.
- A green structural workflow must not imply AL build or BC runtime acceptance.

### Task 1: Canonical cloud projection

**Files:** `tools/github-pilot/project.js`, `tools/github-pilot/test-project.js`

**Interfaces:** `projectFiles(sourceRoot): Map<string, Buffer>`; `install({sourceRoot, destination, apply}): {files, applied}`.

- [ ] Write and run failing tests for canonical generation, cloud grants, complete resources, deterministic provenance, safe collision preflight and idempotence.
- [ ] Implement cloud adaptation and full canonical resource projection.
- [ ] Run the targeted tests and commit the independently testable projection.

### Task 2: Directions v18 consumer preparation

**Files:** `tools/github-pilot/prepare.py`, `tools/github-pilot/test_prepare.py`, `tools/github-pilot/templates/`, `tools/github-pilot/README.md`, `.github/workflows/github-cloud-pilot.yml`

**Interfaces:** `prepare(archive, destination, source_root)` verifies the pinned archive and invokes Task 1's projector; generated `scripts/verify-fixtures.py` validates locked upstream bytes.

- [ ] Write and run failing tests for hash mismatch, zip traversal/symlinks/duplicates, destination collisions, immutable fixture tampering and expected starter composition.
- [ ] Implement import, provenance, consumer scripts, CI, pinned AL tool setup, and the architecture-only task description.
- [ ] Run both targeted suites and ALDC's full existing suite; commit.

### Task 3: Review and publish the private pilot

**Files:** generated consumer under the plan's scratch area; status/evidence in `tools/github-pilot/README.md`.

**Interfaces:** consumes the validated consumer from Task 2; produces repository/issue/CI/session URLs and an ALDC draft PR.

- [ ] Review the entire branch with a fresh reviewer and address material findings.
- [ ] Create `javiarmesto/aldc-github-lab` privately, push the prepared baseline and create the first bounded architecture issue.
- [ ] Observe CI; start the `al-architect` task when enabled and report the actual result.
- [ ] Push the ALDC feature branch, create/attach a draft PR and record exact remaining runtime prerequisites.
