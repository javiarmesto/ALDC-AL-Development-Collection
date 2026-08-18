# ALDC Evidence Model v1

## Purpose

ALDC Evidence Model is the provider-neutral contract used by agents, subagents, audits, and gates to record **why a technical claim is trusted**.

It separates evidence from reasoning and from findings. A finding may have zero or more evidence records; evidence identifies the source, target, reproducibility coordinates, and verification method.

## Evidence domains

ALDC currently recognizes three evidence domains:

| Domain | Question answered | Typical provider |
|---|---|---|
| `project` | What does the current extension/workspace contain or execute? | workspace, AL symbols, compiler, tests |
| `standard` | What does Microsoft Business Central standard actually implement? | BC Code Atlas |
| `quality` | What quality rule or curated guidance governs this code? | BCQuality |

These domains are orthogonal. One finding can combine them.

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
- `kind` — evidence type, provider-specific but stable enough for tooling.
- `claim` — concise statement the evidence supports.
- `locator` — reproducibility coordinates. Shape varies by provider.
- `verification.method` — tool/process used to obtain the evidence.
- `status` — `verified | partial | unavailable | contradicted`.

`verification.exact` SHOULD be `true` when evidence is re-read from an authoritative exact source rather than inferred from semantic search.

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

Examples of `kind`: `source`, `symbol`, `diagnostic`, `test-result`, `call-reference`.

### Standard evidence — BC Code Atlas

Provider: `bc-code-atlas`.

The locator MUST include `country` and resolved `commit_sha` whenever a non-default corpus is used. `version` is human-readable context; `commit_sha` is the reproducible selector.

```json
{
  "country": "es",
  "version": "27.5",
  "commit_sha": "<resolved commit>",
  "symbol": "Table 36 Sales Header::ValidateShortcutDimCode"
}
```

Examples of `kind`: `search-candidate`, `graph-relationship`, `signature`, `procedure-source`, `object-source`, `version-diff`, `symbol-history`.

Semantic search alone MUST NOT be recorded as decisive evidence for a behavioral claim. It can be `search-candidate`; decisive claims SHOULD be backed by graph or exact source evidence.

### Quality evidence — BCQuality

Provider: `bcquality`.

Typical locator:

```json
{
  "path": "microsoft/skills/review/al-performance-review.md",
  "sha": "<BCQuality commit>"
}
```

Examples of `kind`: `knowledge-citation`, `quality-rule`.

For Review-Report v1 compatibility, BCQuality findings MAY continue to populate legacy `references[]`. When `evidence[]` is also present, the BCQuality citation SHOULD be represented there too. The two forms must agree.

## Findings and evidence

A finding owns an `evidence[]` array. Evidence does not determine severity by itself; it establishes factual support.

```json
{
  "id": "native:events:posting-order",
  "source": "native",
  "domain": "events",
  "severity": "major",
  "message": "The subscriber assumes a posting sequence that differs from standard BC 27.5.",
  "evidence": [
    {
      "id": "ev-project-001",
      "domain": "project",
      "provider": "workspace",
      "kind": "source",
      "claim": "The subscriber executes custom validation after the selected event.",
      "locator": { "path": "src/Posting/Handler.Codeunit.al", "line": 42 },
      "verification": { "method": "readFile", "exact": true },
      "status": "verified"
    },
    {
      "id": "ev-standard-001",
      "domain": "standard",
      "provider": "bc-code-atlas",
      "kind": "procedure-source",
      "claim": "Standard BC performs the relevant validation earlier in the posting flow.",
      "locator": {
        "country": "es",
        "version": "27.5",
        "commit_sha": "<sha>",
        "symbol": "Codeunit 80::PostSalesDoc"
      },
      "verification": { "method": "bcatlas_get_procedure_body", "exact": true },
      "status": "verified"
    }
  ]
}
```

## Report-level evidence

Reports MAY also include top-level `evidence[]` for evidence reused by several findings. Findings SHOULD reference those records through `evidence_ids[]` rather than duplicating large records.

For v1, both forms are accepted:

- inline `finding.evidence[]` for local evidence;
- top-level `evidence[]` + `finding.evidence_ids[]` for reusable evidence.

An evidence ID MUST resolve to exactly one record in the report.

## Degraded providers

Tool/provider failure is not a code defect.

When evidence cannot be obtained, record an evidence item with `status: unavailable` only when the missing evidence itself matters to the audit trail. Do not fabricate a locator or a claim.

If a conclusion materially depends on unavailable evidence, the agent MUST lower confidence, mark the conclusion partial, or stop at the relevant human gate according to the owning workflow.

## Compatibility

Review-Report v1 fields remain valid. This model adds `evidence[]` and `evidence_ids[]` without changing the semantics of existing `references[]`.

`references[]` remains a BCQuality compatibility field until a future Review-Report version removes that coupling. New providers MUST use ALDC Evidence Model records, never overload `references[]`.

## Design principles

1. **Provider-neutral at the finding layer.** Findings consume evidence, not provider-specific prose conventions.
2. **Reproducible coordinates.** Version labels are insufficient when a provider exposes immutable commits; retain the immutable selector.
3. **Discovery is not proof.** Semantic retrieval can locate candidates; exact source, graph structure, compiler output, or test execution proves material claims.
4. **Evidence is composable.** Project + standard + quality evidence may jointly support one finding.
5. **Failures are explicit.** Missing providers degrade evidence, not code quality scores by themselves.
6. **No knowledge dump.** Store compact locators and claims, not entire source bodies.