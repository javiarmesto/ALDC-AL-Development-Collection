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

Preserve each provider finding's `domain` display label verbatim, including labels that
do not match the folder name: the UI leaf emits `"Accessibility"` (not "UI"), the
Community Agent SDK leaf emits `"Agents"`, and a super-skill's own cross-cutting
findings emit `"Agent"`. Treat `domain` as display text, never as an identifier: do not
lowercase, slugify or tokenize it for deduplication keys.

## Verdict

A finding is **gating** when its severity is `blocker` or `major` **and** it is either
knowledge-backed with `confidence: high` (non-empty `references`) or a native check with
an applicable `native-rule`. Native checks gate on severity alone: their capped
confidence reflects the absence of citable authority, not doubt. Agent findings
(`agent:` id, no `references`, no `native-rule`) are advisory and **never** gate.

For a completed review: any gating finding → NEEDS_REVISION; otherwise, any
non-gating actionable finding → APPROVED_WITH_RECOMMENDATIONS; otherwise APPROVED.
A fundamental defect may be FAILED with explanation.

`actionable: true` marks a finding the implementer can act on. Only gating findings and
non-gating findings carrying `suggested-code` are routed as revision work; every other
finding is recorded as a recommendation in the phase-complete document and is not a task.

A partial or failed review is about **coverage**, not code: never fabricate code findings
for it. Retry only the missing checks once; if the gap persists, return the review with
the uncovered domains named explicitly and take it to the human gate. Do not send the
implementer work for a provider failure. Missing required build/test evidence keeps
delivery approval pending. An explicitly static verdict applies only to that scope.
Human approval remains separate.

State the applied predicate in `review.verdict-basis`, e.g.
`"2 gating (1 blocker knowledge-backed high, 1 major native:A); 7 recommendations"`.
