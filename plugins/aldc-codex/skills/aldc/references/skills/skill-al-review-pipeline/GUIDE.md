---
name: skill-al-review-pipeline
description: Review an AL increment or audit scope using the configured BCQuality provider and evidence-based native coverage. Shared by Developer Reviewer, Conductor review and Dredd; does not implement fixes or run builds.
---
# AL review pipeline

Read [the provider contract](../../templates/bcquality-provider-contract.md)
and [task-context guidance](../../templates/bcquality-task-context.md).
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
4. Index refresh is independent. If writes/PowerShell are unavailable or forbidden,
   record `provider.index.status: not-attempted` and use the provider's documented
   path-based lookup. A missing fresh index alone does not cancel code review.
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

Use [the shared review report](../../templates/review-report-contract.md)
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
