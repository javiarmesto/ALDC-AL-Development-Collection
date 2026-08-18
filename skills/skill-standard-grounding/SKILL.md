---
name: skill-standard-grounding
description: "Ground AL architecture, implementation, debugging, reviews, and upgrade decisions in the real Microsoft Business Central standard source through BC Code Atlas. Use whenever a task depends on how standard BC actually implements, validates, calls, publishes, subscribes, extends, or changes behavior across versions/localizations."
---

# Skill: Business Central Standard Grounding

## Purpose

Use **BC Code Atlas** as ALDC's Standard Grounding Provider. The goal is to replace guesses about Microsoft standard behavior with evidence from the real Business Central AL source and official documentation.

This skill does **not** copy Base Application, Business Foundation, or System Application into the consuming project. Agents query BC Code Atlas through MCP and load only the evidence required for the current decision.

## Grounding model

ALDC separates three evidence domains:

1. **Project grounding** — the current workspace answers what the customization does.
2. **Standard grounding** — BC Code Atlas answers what Microsoft Business Central does.
3. **Quality grounding** — BCQuality answers what AL quality guidance applies.

Do not substitute one domain for another. A BCQuality rule is not proof of standard implementation, and a standard source excerpt is not proof of the customization's behavior.

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
3. an explicit target version supplied by the user/spec/upgrade plan;
4. BC Code Atlas default corpus only when no version can be established and the result is explicitly marked as default-corpus evidence.

Normalize the version to the most specific useful major/minor value, e.g. `27.5` or `28.3`.

### 2. Determine country/localization

Use explicit project/customer localization metadata when available. Otherwise use `w1`.

Never invent a country. If localization materially affects the answer and cannot be established, query `w1` and state the limitation.

### 3. Resolve the BC Code Atlas corpus

For any non-default target corpus:

1. `bcatlas_resolve_version(country=<country>, spec=<version>)`.
2. If unresolved, use `bcatlas_list_versions(country=<country>)` to find the nearest valid specification.
3. If resolved but not warm, check `bcatlas_list_warm_versions()`.
4. If the exact target is required, call `bcatlas_request_version(country=<country>, spec=<version>)` and use `bcatlas_version_status(...)` until ready when the runtime permits waiting/polling.
5. Use the returned **`commit_sha`** as the `version` argument in subsequent search/graph/source calls. Do not pass `version_string` as the version selector.

Do not silently fall back from an exact requested version to another version. If the exact corpus is unavailable, say which corpus was used.

## Query strategy

Use the cheapest evidence path that can answer the question.

### Semantic discovery

Use `bcatlas_search` when you know the behavior/concept but not the exact symbol.

Examples:

- `sales order posting validation`
- `item availability before sales line posting`
- `document date validation sales header`

Treat semantic results as **candidates**, not final proof.

### Structural investigation

Use graph tools when the question is about relationships:

- `bcatlas_query_graph`
- `bcatlas_get_node`
- `bcatlas_get_neighbors`
- `bcatlas_shortest_path`

Prefer structural evidence for claims such as "X calls Y", "Z subscribes to event E", or "this page extends object O".

### Exact source verification

Before making a material implementation or review decision, verify the selected candidate with exact source when practical:

- `bcatlas_get_signature` — cheapest exact declaration check;
- `bcatlas_get_procedure_body` — exact implementation of a procedure/trigger;
- `bcatlas_get_object_source` — full object only when narrower evidence is insufficient.

Do not pull a full object when a signature or procedure body is enough.

### Version/change investigation

Use:

- `bcatlas_diff` for a scoped comparison between two versions;
- `bcatlas_symbol_history` for real change points of a specific symbol.

Never claim a BC-version behavioral change from memory when version-diff evidence is available.

## Evidence contract

Any Standard Grounding conclusion that affects architecture, implementation, review severity, or upgrade risk must capture:

```text
STANDARD EVIDENCE
provider: bc-code-atlas
country: <country>
requested-version: <version>
resolved-version: <version_string when returned>
commit: <commit_sha when version-resolved>
symbol: <object/procedure/event>
evidence: <search | graph | signature | procedure-body | object-source | diff | history>
conclusion: <one concise statement supported by the evidence>
```

When source evidence is unavailable, mark the conclusion as unverified instead of presenting it as standard behavior.

## Decision workflow

For a standard-dependent task:

1. Inspect workspace/spec and identify the exact standard question.
2. Resolve BC version and country.
3. Discover candidate symbols with semantic search if needed.
4. Follow structural relationships when the claim concerns calls/subscribers/dependencies.
5. Verify the decisive symbol using exact source.
6. Compare versions when the task is an upgrade/regression/collision investigation.
7. Return only the relevant evidence to the parent agent; do not dump large source objects into context.
8. Keep Project, Standard, and Quality evidence separate in the final reasoning/report.

## Failure and fallback policy

BC Code Atlas is an evidence provider, not a hard runtime dependency for every ALDC task.

If the provider is unavailable:

- do not fabricate standard-source evidence;
- continue only when the task can be completed safely from project symbols/workspace evidence;
- mark standard-dependent conclusions as **UNVERIFIED STANDARD BEHAVIOR**;
- for architecture, code review, specification, or upgrade decisions where standard behavior is decisive, request human confirmation before treating an unverified assumption as accepted evidence.

`al-symbols-mcp` may verify symbols available in installed `.app` dependencies, but it is not a replacement for BC Code Atlas source/graph/version-history evidence.

## Anti-patterns

Do not:

- clone or vendor the entire Microsoft BaseApp into an ALDC consuming project merely to give an agent context;
- load complete standard objects when a narrow signature/body answers the question;
- use the default `w1-28` corpus while claiming evidence for another version;
- present semantic similarity as proof of a call relationship;
- use model memory as evidence when BC Code Atlas can verify the claim;
- mix BCQuality guidance with Microsoft standard-source evidence in a single citation/evidence statement.

## Provider abstraction

Agents depend on the **Standard Grounding capability**, not on BC Code Atlas internals. BC Code Atlas is the first provider and may be replaced or supplemented later without changing the evidence contract above.

Conceptual capability surface:

```text
resolve_standard_context(version, country)
search_standard(query)
inspect_standard_symbol(symbol)
trace_standard_relationships(symbol)
compare_standard_versions(symbol, from, to)
```

Map these capabilities to the available `bcatlas_*` tools at runtime.
