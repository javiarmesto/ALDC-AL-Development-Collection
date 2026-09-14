<!-- ALDC Core Template. Copy to the assigned .github/plans/{req_name}/{req_name}.spec.md.
     Maintainers evolve this source with the canonical Spec Agent; consumers fill a copy. -->

# {req_name} — Technical Specification

**Version:** {revision}
**Complexity:** {LOW / MEDIUM / HIGH}
**Status:** {Draft / Pending human approval / Approved}
**Approval:** {human, approved revision and reference; leave pending until obtained}

## 1. Overview

Business context, approved scope in/out, architecture path and decision references.
For multi-spec, assigned SPEC-ID, exact output path and approved architecture revision.
Keep single-spec compatibility; preserve existing assigned filenames on revision.

| Dependency type | Predecessor / contract consumed | Required revision / actual approval reference | Availability and effect |
| --- | --- | --- | --- |
| {generation_depends_on / implementation_depends_on / None} | {named result} | {current source or pending} | {authoring prerequisite or implementation order} |

| Shared resource / contract | Owner / approved allocation | Consumers | Change or coordination issue |
| --- | --- | --- | --- |
| {App/Test object/field IDs, output path, interface or manifest} | {architecture reference; no shared writes} | {SPEC-IDs} | {None or precise conflict for Architect} |

Read [architecture section 14](architecture-template.md) for decomposition rules.
Record only this unit's relevant contracts and coordination needs, not a second
copy of the architecture's complete decomposition.
LOW without architecture: approved requirement and why no architecture decision is needed.

### Governing sources

Sorted paths of applicable instruction bodies, domain guides and relevant source
references actually read. On resume reload the governing paths before changing
technical decisions; do not copy those instruction bodies here.

## 2. AL Object Inventory

| Project / app ID | Type | ID | Name | Repo-relative path | Extends / source | Purpose / decision |
| --- | --- | --- | --- | --- | --- | --- |
| {App/Test} | {type} | {verified range and collision check, or explicit gap} | {name} | {path} | {source} | {purpose} |

## 3. Data Contracts

| Object / field | Type / relation | Classification | Validation / default | Observable error or outcome |
| --- | --- | --- | --- | --- |
| {field} | {type} | {classification} | {contract} | {outcome} |

Include data lifecycle, migration/upgrade and invariants where applicable.

## 4. Procedure Contracts

| Owning object / procedure | Inputs / types / var / temporary | Return / outputs | Preconditions | Side effects / errors | Consumers / acceptance |
| --- | --- | --- | --- | --- | --- |
| {public contract} | {declaration contract} | {result} | {conditions} | {observable behavior} | {references} |

## 5. Event Contracts

| Target/version / publisher / event | Definition source and verification | Fields consumed | Intended effect | Order / state / persistence proof or pending check |
| --- | --- | --- | --- | --- |
| {event or unresolved candidate} | {exact source and claim proved} | {fields} | {effect} | {distinct behavioral claim} |

## 6. UI, Permissions and API Contracts

For applicable areas: page fields/actions and visibility/editability; object/data
permissions and least privilege; API entities, schemas, authorization, error and
compatibility behavior. Omit inapplicable areas with a brief reason.

## 7. Tests — Given / When / Then

| Test | Acceptance / decision | Given | When | Then | Required compiler/runtime check and owner |
| --- | --- | --- | --- | --- | --- |
| {scenario} | {references} | {initial state} | {business action} | {observable outcome} | {pending check} |

## 8. Verification and Open Questions

| Claim / contract | Verified definition / observed behavior / pending | Source or actual result | Materiality | Missing check / owner |
| --- | --- | --- | --- | --- |
| {claim} | {state} | {reference, not a planned result} | {blocking or bounded residual} | {action} |

List material business decisions separately from technical research owned by Spec.

## 9. Implementation Boundary

Decisions fixed by approved architecture and this spec; implementation mechanics
left to Implementer. Record identified HIGH risks and only the additional model
or pseudocode necessary to address them. No final AL or test implementation bodies.

## 10. AL-Go / CI Considerations

Applicable ID ranges, target dependencies, App/Test folders, analyzers, captions/XLF,
upgrade compatibility, downstream compiler/test/review checks. Do not change project
configuration or claim these checks have run during specification.

## 11. Acceptance Criteria

Functional business outcomes, technical contracts and downstream quality/review
criteria, with references to tests and pending proof. Include negative cases and
unchanged behavior where they matter.

## 12. Human Review and Next Step

What is complete; unresolved material decisions; affected changes since previous
approval. Record actual approval for this revision before the forward handoff.
For multi-spec, cite Architect's joint consistency review of the actual revisions
and the selected implementation increment; identify pending siblings separately.
A shared-contract change reopens affected consumers for review/approval, not all work.
MEDIUM/HIGH → Conductor; LOW → Developer. Carry both dependency types, current
spec/architecture paths, resource coordination and verification limits. No implicit
parallel implementation or change to existing Conductor gates.
