# ALDC Evidence Model v1

## Purpose

ALDC Evidence Model is the provider-neutral contract used by agents, subagents, audits, and gates to record **why a technical claim is trusted**.

It separates four concepts:

1. **Evidence** — reproducible factual support.
2. **Claim** — what that evidence establishes.
3. **Finding** — an actionable or informational conclusion drawn from claims.
4. **Verdict/Gate** — workflow decision derived from findings plus evidence sufficiency.

A finding can compose evidence from project, Microsoft standard, and quality knowledge without coupling the finding schema to a specific provider.

## Evidence domains

| Domain | Question answered | Typical providers |
|---|---|---|
| `project` | What does the current extension/workspace contain or execute? | workspace, AL symbols, compiler, tests, git |
| `standard` | What does Microsoft Business Central standard actually implement? | BC Code Atlas |
| `quality` | What quality rule or curated guidance governs this code? | BCQuality |

These domains are orthogonal. One finding can combine all three.

## Canonical evidence record

```json
{
  "id": "ev-std-001",
  "domain": "standard",
  "provider": "bc-code-atlas",
  "kind": "procedure-source",
  "claim": "Sales-Post validates the document before posting.",
  "locator": {
    "country": "w1",
    "version": "28.3",
    "commit_sha": "<resolved commit>",
    "symbol": "Codeunit 80::PostSalesDoc"
  },
  "verification": {
    "method": "bcatlas_get_procedure_body",
    "exact": true
  },
  "status": "verified"
}
```

## Required fields

Every evidence record MUST contain:

- `id` — unique within the report.
- `domain` — `project | standard | quality`.
- `provider` — stable provider identifier.
- `kind` — stable evidence type.
- `claim` — concise statement the evidence supports.
- `locator` — reproducibility coordinates.
- `verification.method` — tool/process used.
- `status` — `verified | partial | unavailable | contradicted`.

`verification.exact` SHOULD be `true` when evidence is re-read from an authoritative exact source rather than inferred from retrieval.

## Provider contracts

### Project evidence

Provider examples: `workspace`, `al-symbols`, `compiler`, `tests`, `git`.

Typical locator:

```json
{
  "path": "src/Sales/SalesHandler.Codeunit.al",
  "line": 84,
  "symbol": "HandleBeforePost",
  "commit_sha": "<optional repository commit>"
}
```

Typical `kind`: `source`, `symbol`, `diagnostic`, `test-result`, `call-reference`.

### Standard evidence — BC Code Atlas

Provider: `bc-code-atlas`.

For a non-default corpus the locator MUST retain `country`, human-readable `version`, and resolved immutable `commit_sha`.

```json
{
  "country": "es",
  "version": "27.5",
  "commit_sha": "<resolved commit>",
  "symbol": "Table 36 Sales Header::ValidateShortcutDimCode"
}
```

Typical `kind`: `search-candidate`, `graph-relationship`, `signature`, `procedure-source`, `object-source`, `version-diff`, `symbol-history`.

**Discovery is not proof.** Semantic search alone MUST NOT be decisive evidence for a behavioral claim. It may locate a candidate; decisive behavior SHOULD be verified with graph structure or exact source.

### Quality evidence — BCQuality

Provider: `bcquality`.

```json
{
  "path": "microsoft/skills/review/al-performance-review.md",
  "sha": "<BCQuality commit>"
}
```

Typical `kind`: `knowledge-citation`, `quality-rule`.

For Review-Report v1 compatibility, BCQuality findings MAY continue to populate legacy `references[]`. When typed `evidence[]` is also present, both representations MUST agree.

## Findings and evidence

Evidence does not determine severity. It establishes factual support.

Prefer report-level reusable evidence:

```json
{
  "evidence": [
    {
      "id": "ev-standard-001",
      "domain": "standard",
      "provider": "bc-code-atlas",
      "kind": "procedure-source",
      "claim": "Standard BC performs the validation before the selected event.",
      "locator": {
        "country": "es",
        "version": "27.5",
        "commit_sha": "<sha>",
        "symbol": "Codeunit 80::PostSalesDoc"
      },
      "verification": { "method": "bcatlas_get_procedure_body", "exact": true },
      "status": "verified"
    }
  ],
  "findings": [
    {
      "id": "native:events:posting-order",
      "severity": "major",
      "message": "The subscriber assumes a posting sequence that differs from standard BC.",
      "evidence_requirement": "material",
      "evidence_ids": ["ev-standard-001"]
    }
  ]
}
```

Inline `finding.evidence[]` remains valid for evidence used only once.

An evidence ID MUST resolve to exactly one record in the report.

## Evidence requirement

A finding MAY declare:

- `evidence_requirement: "none"` — the finding is self-evident from its own location/rule and does not require an additional evidence record.
- `evidence_requirement: "supporting"` — evidence improves traceability/confidence but the finding remains valid without it.
- `evidence_requirement: "material"` — the finding's conclusion or severity materially depends on the referenced evidence.

Default when omitted: `supporting` for findings that contain `evidence_ids`/inline evidence; otherwise `none`.

Use `material` deliberately, for example when claiming:

- standard BC executes a particular validation/order/side effect;
- a behavior differs between BC versions/localizations;
- an executable test/diagnostic is required to establish a defect;
- a quality finding depends on a specific external knowledge rule.

Do not mark trivial source-local defects as `material` just to force extra tooling.

## Evidence-aware gate semantics

The workflow owner (Conductor for phase reviews; Dredd for advisory audit) applies these rules **after** normal finding severity calculation.

For each finding with `evidence_requirement: material`:

1. Resolve every `evidence_id`; missing/duplicate IDs make the report structurally invalid.
2. At least one relevant evidence record MUST exist.
3. If all relevant evidence is `verified`, normal severity/verdict logic applies.
4. If decisive evidence is `partial`, the finding MUST NOT be `high` confidence; the gate may continue only if the normal workflow allows the uncertainty and records it.
5. If decisive evidence is `unavailable`, provider failure is **not** a code defect, but a blocking/major conclusion that depends on it cannot be treated as fully proven. The workflow must lower confidence and either request/retry evidence or stop at its human gate.
6. If decisive evidence is `contradicted`, the original claim cannot remain accepted: revise/suppress it or emit a contradiction finding.

The evidence gate is therefore **epistemic**, not another quality score. It prevents ALDC from confidently gating on an unproven material claim.

## Confidence guidance

- Exact source/compiler/test evidence with `verified` status may justify high confidence.
- Semantic retrieval alone does not justify high confidence for behavior.
- `partial` cannot alone justify high confidence.
- `unavailable` cannot be converted into a defect.
- `contradicted` requires claim reconsideration.

## Reuse across agents

Evidence is intended to flow through the graph:

```text
Implementation Subagent
  produces project/standard evidence
           ↓
Review Subagent
  reuses + verifies + adds quality/standard evidence
           ↓
Conductor
  validates evidence integrity + gates findings

Dredd
  independently produces the same evidence contract
```

A consumer SHOULD reuse a compatible evidence record rather than re-querying the provider. Re-query only when the corpus/claim/locator is incompatible, stale for the target, or the prior status is insufficient for the decision.

## Degraded providers

Tool/provider failure is not a code defect.

Record `status: unavailable` only when the missing evidence matters to the audit trail. Never fabricate a locator or claim.

If a conclusion materially depends on unavailable evidence, lower confidence or stop at the owning human gate according to workflow policy.

## Compatibility

Review-Report v1 remains valid. This model adds:

- top-level `evidence[]`;
- `finding.evidence[]`;
- `finding.evidence_ids[]`;
- `finding.evidence_requirement`.

`references[]` remains a BCQuality compatibility field until a future Review-Report version removes that coupling. New providers MUST use ALDC Evidence Model records, never overload `references[]`.

## Design principles

1. **Provider-neutral findings.** Findings consume evidence, not provider prose conventions.
2. **Reproducible coordinates.** Retain immutable selectors when available.
3. **Discovery is not proof.** Retrieval locates; exact source/graph/compiler/tests prove.
4. **Composable evidence.** Project + standard + quality may jointly support one finding.
5. **Explicit degradation.** Missing providers degrade evidence, not quality scores.
6. **Evidence-aware gating.** Material claims cannot silently become confident verdicts without sufficient evidence.
7. **No knowledge dump.** Persist compact locators and claims, not entire source bodies.
