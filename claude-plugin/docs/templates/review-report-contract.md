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
- `review.criteria` (only when criteria were supplied): `{declared, met, unmet:
  [{path, findings: [ids]}], not-evaluated: [paths], house-rules-unmet}`. Derived
  from retained findings and coverage; never a source of findings or verdict.
- `summary.counts`: `{blocker, major, minor, info}` across all retained findings.
- `findings`: `[{id, source, domain, severity, actionable, message,
  location: {file, line, range}, references: [{path, sha}], confidence,
  fix-hint, from-sub-skill?, native-rule?, suggested-code?,
  suggested-code-omission-reason?}]`.
- `suppressed`: findings removed with a concrete evidence-based reason.
- `sub-results`: provider results verbatim, not recreated from a summary.
- `review.security` (aldc-claude, **mandatory**): `{status: completed | partial, checks: [{check, status, evidence, reason}]}`
  with exactly these checks, each `ok | finding | not-applicable` (a reason is required for
  `not-applicable`): `write-scope` (API pages and MCP configuration expose writes only where
  the scenario needs them), `permission-sets` (per role, no wildcard RIMD, own minimal set for
  bot/agent users), `secrets` (`SecretText`, encrypted isolated storage, never in fields, text
  or telemetry), `event-bypass` (no published `var` parameter can skip a permission, approval
  or validation check), `table-validation` (rules enforced in table triggers, not only pages).
  Each `finding` has a matching entry in `findings` with `domain: "Security"` and
  `native-rule: "rules/al-security.md"`. A missing `review.security` makes the review `partial`.
- `review.bcquality.articles` (aldc-claude, **mandatory when BCQuality articles were selected
  or read**): `[{path, status, reason, evidence}]`, one entry per article in the plugin's
  *BCQuality selection* and per other article you read. `status`: `applied` (the code follows
  it, or a finding cites it), `not-applicable` (it does not concern the changed code; say why)
  or `dismissed` (it applies and the code does not follow it, with a technical reason citing
  `file:line`). "Not requested by the requirement", "out of scope" or "future work" are **not**
  valid reasons: an applicable article the code does not follow is a finding. A selected
  article with no entry makes the review `partial`.
  `review.bcquality.outcome` is `selection-completed` when every selected article has a
  disposition and the provider's Entry flow was not run, `completed` when the provider
  flow completed, and `not-applicable` when BCQuality is not installed. Neither of the
  first two makes the review `partial` (see the review pipeline, *Two execution paths*).
- `review.agent-sdk` (aldc-claude, **mandatory when the app extends `Agent Metadata Provider`**):
  `{status, checks: [{check, status, evidence, reason}]}` with the checks `interfaces`,
  `instructions-upgrade`, `access-controls`, `input-analysis` and `creation-policy`
  (see `${CLAUDE_PLUGIN_ROOT}/rules/al-agent-toolkit.md`, *Completeness checklist*). Each
  `finding` has a matching entry in `findings` with `domain: "Agents"`.

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
