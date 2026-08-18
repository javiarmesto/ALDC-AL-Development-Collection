---
name: skill-standard-grounding
description: "Ground AL architecture, implementation, debugging, reviews, and upgrade decisions in the real Microsoft Business Central standard source through BC Code Atlas. Use whenever a task depends on how standard BC actually implements, validates, calls, publishes, subscribes, extends, or changes behavior across versions/localizations."
---

# Skill: Business Central Standard Grounding

## Purpose

Use **BC Code Atlas** as ALDC's Standard Grounding Provider. Replace guesses about Microsoft standard behavior with evidence from the real Business Central AL source and official documentation.

This skill does **not** copy Base Application, Business Foundation, or System Application into the consuming project. Agents query BC Code Atlas through MCP and load only the evidence required for the current decision.

## Grounding model

ALDC separates three evidence domains:

1. **Project grounding** — current workspace answers what the customization does.
2. **Standard grounding** — BC Code Atlas answers what Microsoft Business Central does.
3. **Quality grounding** — BCQuality answers what AL quality guidance applies.

Do not substitute one domain for another. All machine-readable evidence follows `docs/framework/ALDC-Evidence-Model-v1.md`.

## Provider

Current provider: **BC Code Atlas**

Hosted MCP endpoint:

`https://bc-code-atlas.stefanmaron.dev/mcp`

All provider tools are prefixed `bcatlas_`.

## When Standard Grounding is mandatory

Use this skill before making a material claim about standard BC when the task includes any of the following:

- extending or intercepting a standard posting/validation process;
- selecting a standard event or extension point;
- explaining why a standard field, table, page, report, codeunit, enum, interface, or procedure behaves as it does;
- reviewing custom code that replaces, duplicates, bypasses, or depends on standard logic;
- diagnosing regressions caused by a Business Central update;
- checking whether a Microsoft object/field/event/procedure exists in a target version;
- checking whether standard behavior changed between Business Central versions;
- assessing collisions between custom objects/fields and newer standard versions;
- tracing callers, subscribers, dependencies, extension targets, or execution paths in standard BC.

Standard Grounding is optional for purely custom logic that does not depend on Microsoft standard behavior.

## Context resolution

### 1. Determine target version

Read the nearest relevant `app.json` before querying version-specific standard source.

Use, in order:

1. `application` when it identifies the Business Central application version;
2. `platform` only when the application version is unavailable;
3. explicit target version supplied by user/spec/upgrade plan;
4. BC Code Atlas default corpus only when no version can be established and the result is explicitly marked as default-corpus evidence.

Normalize to the most specific useful major/minor value, e.g. `27.5` or `28.3`.

### 2. Determine country/localization

Use explicit project/customer localization metadata when available. Otherwise use `w1`.

Never invent a country. If localization materially affects the answer and cannot be established, query `w1` and state the limitation.

### 3. Resolve the BC Code Atlas corpus

For any non-default target corpus:

1. `bcatlas_resolve_version(country=<country>, spec=<version>)`.
2. If unresolved, use `bcatlas_list_versions(country=<country>)` to find a valid specification.
3. If resolved but not warm, check `bcatlas_list_warm_versions()`.
4. If the exact target is required, call `bcatlas_request_version(...)` and use `bcatlas_version_status(...)` when the runtime permits polling.
5. Use returned **`commit_sha`** as the `version` argument in subsequent search/graph/source calls. Do not use `version_string` as the selector.

Do not silently fall back from an exact requested version to another version.

## Query strategy

Use the cheapest evidence path that can answer the question.

### Semantic discovery

Use `bcatlas_search` when you know the behavior/concept but not the exact symbol. Treat results as **candidates**, never final proof.

### Structural investigation

Use graph tools for relationship claims:

- `bcatlas_query_graph`
- `bcatlas_get_node`
- `bcatlas_get_neighbors`
- `bcatlas_shortest_path`

Prefer structural evidence for claims such as "X calls Y", "Z subscribes to E", or "this object extends O".

### Exact source verification

Before a material implementation/review decision, verify the selected candidate with exact source when practical:

- `bcatlas_get_signature`
- `bcatlas_get_procedure_body`
- `bcatlas_get_object_source`

Do not pull a full object when a signature or procedure body is enough.

### Version/change investigation

Use `bcatlas_diff` for scoped comparisons and `bcatlas_symbol_history` for real change points. Never claim a version behavior change from memory when version evidence is available.

## Machine-readable evidence contract

Every Standard Grounding conclusion that affects architecture, implementation, review severity, audit verdict, or upgrade risk MUST produce an **ALDC Evidence Model v1 record**.

Required shape:

```json
{
  "id": "ev-standard-<unique>",
  "domain": "standard",
  "provider": "bc-code-atlas",
  "kind": "procedure-source",
  "claim": "<one concise statement actually supported>",
  "locator": {
    "country": "<country>",
    "version": "<requested/resolved human version>",
    "commit_sha": "<resolved immutable commit>",
    "symbol": "<object/procedure/event when applicable>"
  },
  "verification": {
    "method": "<bcatlas_* tool>",
    "exact": true
  },
  "status": "verified"
}
```

Rules:

- `commit_sha` is mandatory for persisted BC Code Atlas evidence.
- `kind: search-candidate` is allowed for discovery but MUST NOT be the sole decisive evidence of a behavioral claim.
- `graph-relationship` may be decisive for relationship claims.
- `signature`, `procedure-source`, `object-source`, `version-diff`, and `symbol-history` should identify the exact verification tool.
- `status` is one of `verified | partial | unavailable | contradicted`.
- When evidence is reused by multiple findings, preserve one top-level evidence record and reference it via `evidence_ids[]`; do not duplicate it with new IDs.
- Never put Atlas paths/URLs into legacy BCQuality `references[]`.

### Subagent return requirement

When this skill is loaded by an implementation/review subagent, append to its normal output:

```markdown
### Evidence (JSON)
```json
[
  { "id": "...", "domain": "standard", "provider": "bc-code-atlas", "kind": "...", "claim": "...", "locator": {"country":"...","version":"...","commit_sha":"..."}, "verification": {"method":"bcatlas_...","exact":true}, "status": "verified" }
]
```
```

If no decisive Standard Grounding evidence was produced, do not invent a record.

## Decision workflow

For a standard-dependent task:

1. Inspect workspace/spec and identify the exact standard question.
2. Resolve BC version and country.
3. Discover candidate symbols if needed.
4. Follow structural relationships for calls/subscribers/dependencies.
5. Verify decisive symbol using exact source.
6. Compare versions for upgrade/regression/collision work.
7. Produce compact typed evidence.
8. Return only relevant evidence to parent agent; do not dump large standard source bodies.
9. Keep Project, Standard, and Quality evidence separate.

## Failure and fallback policy

BC Code Atlas is an evidence provider, not a hard dependency for every ALDC task.

If unavailable:

- do not fabricate standard-source evidence;
- continue only when task can be completed safely from project symbols/workspace evidence;
- when the missing evidence matters, produce an `unavailable` record with a real locator only if known and useful;
- never convert provider outage into a code defect;
- for a material claim, let the owning workflow apply its evidence gate (`EVIDENCE_REQUIRED` / human confirmation).

`al-symbols-mcp` may verify symbols available in installed dependencies, but it is not a replacement for source/graph/version-history evidence.

## Anti-patterns

Do not:

- clone/vendor the entire Microsoft BaseApp into a consuming project for context;
- load complete standard objects when a narrow signature/body answers the question;
- use default `w1-28` while claiming another version;
- present semantic similarity as proof of a call relationship;
- use model memory as evidence when Atlas can verify the claim;
- mix BCQuality guidance with standard-source evidence in one citation;
- create multiple evidence IDs for the same claim + locator just because another agent consumes it.

## Provider abstraction

Agents depend on the **Standard Grounding capability**, not BC Code Atlas internals. BC Code Atlas is the first provider and may be replaced/supplemented later without changing the ALDC Evidence Model.

Conceptual capability surface:

```text
resolve_standard_context(version, country)
search_standard(query)
inspect_standard_symbol(symbol)
trace_standard_relationships(symbol)
compare_standard_versions(symbol, from, to)
```

Map these to available `bcatlas_*` tools at runtime.
