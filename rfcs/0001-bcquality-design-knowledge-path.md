# BCQuality design knowledge path

Date: 2026-10-06
Status: Accepted for 5.0.3 (maintainer requested release on 2026-10-07)

## Context

The supplied Step 5 handoff reports four failures in a Copilot Architect session:
manual fallback because no skill-invocation tool existed, truncated article bodies
reported as loaded, unqueried domains reported as consulted, and missing UI/error
domains. The canonical design guidance predates the knowledge consultation path.

## Proposal

Update the shared design guidance to route domain questions through the installed
`al-knowledge` skill and its real Entry dispatch. Instruction-based hosts execute
the loaded steps inline. Persist actual responses and use explicit manual fallback
for affected domains. Require full body reads, bounded retrieval continuations and
honest consultation status. Extend Architect/Spec domain mappings for pages and
user-facing errors. Clarify Spec's already-required selection/criteria sidecars.

## Impact and migration

The shared template changes, so this RFC records the change under ALDC Governance.
Regenerate Foundation, Copilot CLI, Claude Code, the Claude workspace and Codex.
Installed consumer projects still need a reviewed toolkit update. Existing manual
selection artifacts remain historical evidence; future consultations add responses
and domain observations. No tool grant, model, approval gate or review policy changes.

## Risks

Provider versions and host execution capabilities vary. Use the loaded provider's
contract and native file fallback; do not build an index or invent execution.
Record corpus differences and verify spec citations in the downstream review corpus.
Static packaging checks cannot establish live agent behavior.

## Acceptance

- Every shipped Architect/Spec contract resolves the updated shared guide.
- All five handoff corrections reach every distribution; templates remain identical.
- Spec retains its existing non-execution grants and documentation-only scope.
- Generation drift and applicable contract/packaging checks pass.
- The supplied Hogargas cookbook's plugin, Spec and manual-fallback host tests
  remain live acceptance work; no result is claimed without an actual session.
