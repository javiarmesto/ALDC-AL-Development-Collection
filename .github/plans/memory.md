# Project Memory (Global)

> **Rule**: This file is APPEND-ONLY. Never delete or overwrite existing content.
> New entries go at the bottom of each section or as new sections.

## Project Info

- **Project**: {project_name}
- **Repository**: {repo_url}
- **Started**: {date}
- **ALDC Core**: v1.1

## Active Requirements

| req_name | Complexity | Status | Last Updated |
|----------|-----------|--------|--------------|

## Completed Requirements

| req_name | Completed | Archived |
|----------|-----------|----------|

## Decisions Log

### 2026-09-16 — Requirement sets live in a folder

Two normative documents disagreed: the specification said the contracts sit flat in
`.github/plans/`, while CLAUDE.md and every agent contract write
`.github/plans/{req_name}/{req_name}.*.md`. The folder is what is actually written, so
the specification was corrected, not the agents. `tools/aldc-validate` had implemented
the flat reading, which is why `incompleteRequirementSets` had never fired on a real
project. A decomposed requirement is satisfied by its assigned unit specs; the archive
folder is history; contracts left in the plans root are reported, not ignored.

The plans root is host-neutral on purpose (configurable under `plans.root`, the same
location for Copilot Chat, Copilot CLI, Claude Code and Codex). Only `toolkitRoot`
changes per host, so a team using different assistants shares one set of contracts.

### 2026-09-16 — The Visor shows the state of the contract chain, not an agent log

The templates already carry the HITL gate in the document itself
(`architecture-template.md` `**Status**`, `spec-template.md` `**Status:**` and
`**Approval:**`) and nothing reads it. That is what the Visor will show, from two honest
sources: which contracts exist (the rule just fixed above) and what each document
declares about itself. An untouched placeholder is *undeclared*, never `Draft` — the same
discipline Doctor applies to unobserved execution.

A log of agent invocations was considered and rejected: VS Code exposes no hook into
Copilot Chat agent calls, so any such log would be self-reported by the agents and
incomplete. It would be the one part of the product that claims what it has not observed.

A graph of the documentation chain was also considered. The per-requirement chain is a
fixed four-node line and a graph of it is decoration. The real graph is the decomposition
table in the architecture (SPEC-IDs with `generation_depends_on` /
`implementation_depends_on` and authoring groups), which decides authoring and
implementation order. That comes second, on top of the same document parser.

## Scope Changes

_No scope changes recorded yet._

## Lessons Learned

_No lessons recorded yet._

## Inter-Session Context

### 2026-09-16

Canonical branch `feat/canonical-spec-decomposition`, extension branch
`feat/project-manager-bcquality-mcp`. 4.3.1 closed: known-installation manifest,
AL-Go discovery aligned between installer and Doctor, `aldc solution` layout
re-detection, and the requirement-set validation fix above.

Two checks could not run in that session because the network policy denies the
Marketplace CDN and the VS Code update service: `scripts/test-upgrade-420.js` (needs the
published 4.2.0 VSIX) and the host smoke test. Both pending a run with network or in CI.
While fixing the first, its preview call was found to request no `--json`, so its three
assertions about the collision reduction could never have executed; corrected.

## Next Steps

1. Define first requirement using `al-spec.create`
2. Visor: parse the declared state of each contract (`Status` / `Approval`), treating an
   untouched template placeholder as undeclared, with fixtures for each case.
3. Visor: show per requirement which contracts exist, what state they declare and what
   the next gate is; report an architecture revised after the spec derived from it.
4. Then: the decomposition DAG from the architecture table, on the same parser.
