---
name: skill-al-review-pipeline
description: Review an AL increment or audit scope using the configured BCQuality provider and evidence-based native coverage. Shared by Developer Reviewer, Conductor review and Dredd; does not implement fixes or run builds.
---
# AL review pipeline

Read [the provider contract](../../docs/templates/bcquality-provider-contract.md)
and [task-context guidance](../../docs/templates/bcquality-task-context.md).
Resolve these links from this installed skill, not a sibling repository.
This procedure supplements the caller's write scope, report format and human gate;
it grants no extra tools and never authorizes changes to the provider or AL code.

## Scope and independent evidence

Start from the requested files/diff and acceptance criteria. A standalone reviewer
resolves context itself; a Conductor reviewer consumes the supplied phase context
and reads precise references only for gaps. An explicitly attached object is a valid
scope without a Git diff. Missing source means no code review has occurred.
Read relevant rules explicitly; do not assume another agent loaded them for you.
Verify claims in an implementer's report against current code and evidence. Never
approve code generated in your own context as an independent review.

## Execute the selected provider

1. Select the provider from this project's configuration. In plugin mode discover
   the exact configured identity in the host and load its instructions here;
   `home`, `entryPoint` and `workspace` belong to multiroot selection. Do not fall
   back to a different clone or rename a skill implicitly.
2. Follow the loaded provider's execution model. For an instruction-based skill,
   loading starts the workflow: apply its Entry/routing, READ/DO and dispatched
   checks to the actual inputs. You produce their results; do not wait for the
   host to emit them automatically or recursively invoke the same skill. A tool
   invocation is required only when the loaded provider actually requires one.
3. Derive layers and filters from supported provider configuration/defaults.
   Preserve the actual routing result. Do not pick only the most obvious leaf:
   account for each dispatched check and each applicable child of a super-skill
   as completed, not applicable, skipped with reason, partial, failed or pending.
   Follow provider relevance rules; do not execute irrelevant checks merely to
   fill a table. Reuse already-read knowledge within this invocation.
   Entry may return **more than one top-level skill** in `dispatch[]` — for example the
   `al-code-review` super-skill plus the Community `al-agents-review` leaf, which is a
   first-level peer and not one of the super-skill's children. Execute every dispatched
   entry and retain **every** resulting findings-report; never treat the first report as
   the whole run. Roll each one into `sub-results` and account for it in coverage under
   its own domain label.
   When the provider documents bounded retrieval helpers (BCQuality: `tools/Search-Knowledge.ps1`
   for the catalog and `tools/Get-KnowledgeArticles.ps1` for bodies), prefer them over ad-hoc
   reads where an execution capability exists: they page deterministically, cap each response,
   and return per-article SHA-256 so a cited body is provably the one that was read. Without
   that capability, use the provider's native bounded reads through EOF and never treat a
   retrieval failure as an empty result.
4. Index refresh is independent. If writes/PowerShell are unavailable or forbidden,
   record `provider.index.status: not-attempted` and use the provider's documented
   path-based lookup.
   When the project carries an installer receipt (`.github/aldc-bcquality-index.json`) whose
   `corpusSha` matches the observed corpus revision, report `provider.index.status:
   prebuilt` with the receipt's generator, index path, SHA-256 and corpus revision; a
   bare status is refused. Map the receipt into the observation as `indexPath` →
   `index.path`, `indexSha256` → `index.sha256`; `generator` and `corpusSha` carry over
   unchanged. Then use the provider's index-backed retrieval —
   including its bounded pagination and per-article content-hash validation. A mismatched
   or absent receipt is `not-attempted`, not a failure.
   A missing fresh index alone does not cancel code review.
   If lookup fails, name the exact resource, attempted operation and observed error.
5. Retain actual sub-results and references. Reading a leaf or describing its
   intended behavior is not a completed check. An executed attempt can fail or be
   partial; `executed: true` does not mean success. Never reconstruct unobserved
   results afterwards as evidence. Zero findings is valid for completed checks.

## Cover gaps without inventing parity

Only completed provider results reduce native coverage. Check applicable ALDC
rules/skills for uncovered domains: naming, performance, error handling, events,
permissions, APIs and testing. Check extension boundaries, actual project layout,
and approved acceptance criteria. Do not require a particular folder layout merely
because it appears in an example; identify the project's governing rule.
Do not assume a custom BCQuality layer exists or covers ALDC conventions.
Where no native equivalent exists, report the coverage gap explicitly.

Separate findings from coverage. A valid minor convention finding need not imply a
compiler/runtime error. Cite the exact applicable rule and file location; retain,
resolve or retract it based on evidence, not because another provider found nothing.
`contracts.namingConvention` in aldc.yaml names planning documents, not AL files.

## Return an honest result

Use [the shared review report](../../docs/templates/review-report-contract.md)
for direct/Conductor reviews; Dredd keeps its advisory Audit-Report format.
In either format include a compact coverage list with domain/check, status,
source and evidence/reason, plus the provider identity and independent index state.
Keep original provider sub-results intact; coverage is the caller's summary.
A requested check left pending makes the overall result partial. Provider failure
with fully completed, adequate native coverage may still complete the stated native
scope, but must not be presented as a completed BCQuality review.

Compilation and tests are separate evidence: record current-artifact evidence as
validated or not validated and say whether supplied or actually executed. Static
analysis and Problems are not a build or a runtime test. For an explicitly static
review, absence of a build is a limitation, not an invented AL defect. For a delivery
gate requiring build/tests, missing evidence keeps that gate pending.
A partial/failed review never becomes approval merely because finding counts are zero.

When declared review criteria were supplied (`<req>.bcq-criteria.json`), report them
in `review.criteria` after the findings are final: a criterion is **unmet** when a
retained finding cites its `path` (match on `references[0].path`), **met** when its
domain was completed by the provider and no retained finding cites it, and
**not-evaluated** when that domain's check did not complete. Count house rules
(`layer: custom`) separately. This is bookkeeping over findings that already exist;
it adds no finding, changes no severity and never alters the verdict.
