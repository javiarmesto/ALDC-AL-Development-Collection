# AL review report contract

Used by AL Code Review Subagent and AL Developer Reviewer. Dredd retains its
Audit-Report and advisory gate, using the same coverage/evidence discipline.
Load the shared review pipeline before issuing a report. A reported skill name
is metadata, not proof that instructions were read or executed.

Return one fenced JSON block headed `### Review-Report (JSON)`:

- `skill`: `{id: "al-review-subagent" | "al-developer-reviewer", version: 1}`.
- `outcome`: `completed | partial | failed` for the requested review scope.
- `review.phase`: `{plan, number}` from Conductor, or `{plan: "direct", number: 0}`.
- `review.verdict`: `APPROVED | APPROVED_WITH_RECOMMENDATIONS | NEEDS_REVISION | FAILED`.
- `review.verdict-basis`: short reason and actual scope; `review.notes`: limitations.
- `review.bcquality`: `{provider, submodule-sha, outcome, skills-run}`. `provider`
  is the evidence object defined in [the provider contract](bcquality-provider-contract.md),
  not a string. `submodule-sha` is an observed revision or null, never a copied expectation.
- `review.coverage`: `[{check, source, status, evidence, reason}]` where status is
  `completed | not-applicable | skipped | partial | failed | pending`. Evidence
  identifies actual files/rules, results or diagnostics; non-completed checks
  require a reason. Preserve provider dispatch and child coverage in sub-results;
  if unavailable, say so instead of synthesizing a completed provider report.
- `review.build` and `review.runtime-tests`: each `{status: "validated" | "not-validated",
  evidence-refs: [], origin: "supplied" | "executed" | "none", reason}`. These
  reviewers do not run builds/tests; examine current evidence supplied by the owner.
- `review.skills-compliance`: `[{domain, status}]`: `✓` native check completed,
  `↗bcq` provider completed, `∅` not applicable. Uncovered domains belong in coverage
  as pending/partial, never a pass. Do not infer compliance from an implementer claim.
- `summary.counts`: `{blocker, major, minor, info}` across all retained findings.
- `findings`: `[{id, source, domain, severity, actionable, message,
  location: {file, line, range}, references: [{path, sha}], confidence,
  fix-hint, from-sub-skill?, native-rule?, suggested-code?,
  suggested-code-omission-reason?}]`.
- `suppressed`: findings removed with a concrete evidence-based reason.
- `sub-results`: provider results verbatim, not recreated from a summary.

Preserve provider citation IDs and locations. For BCQuality-cited findings use the
knowledge path as ID (`references[0].path`); distinguish occurrences by ID + location,
not ID alone. Native/agent findings use `native:<domain>:<slug>` / `agent:<slug>`,
`references: []`, confidence at most medium, and an applicable ALDC `native-rule`
path where available. Symbol/tool evidence is separate from knowledge references.
Small mechanical fixes can include literal suggested replacement text, without
editing the source. Every actionable finding, including minor, has `actionable: true`.

## Verdict

For a completed review: blocker/major → NEEDS_REVISION; minor →
APPROVED_WITH_RECOMMENDATIONS; otherwise APPROVED. A fundamental defect may be FAILED
with explanation. For a partial review use NEEDS_REVISION with the missing review
work in notes/coverage, not fabricated code findings; a failed review is FAILED.
Missing required build/test evidence keeps delivery approval pending. An explicitly
static verdict applies only to that scope. Human approval remains separate.
