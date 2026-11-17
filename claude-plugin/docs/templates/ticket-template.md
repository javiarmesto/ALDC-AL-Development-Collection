---
id: T-01
title: {one line, the outcome a user can observe}
depends_on: []
mode: afk
object_ids: [50100-50109]
acceptance: [AC-01]
bcq: []
shared_files: []
status: ready
---

<!--
One file per ticket: <plans.root>/<req>/tickets/T-NN.md. It is the implementer's only
input besides the files it points to. `/aldc:tickets` writes it; `tickets.js` validates it
and moves `status`. Do not edit `status` by hand; run
`node "${CLAUDE_PLUGIN_ROOT}/tools/tickets/tickets.js" set <req> T-NN <status>`.

Frontmatter (a small YAML subset: scalars, `[a, b]` lists or `- item` lines):
- depends_on: ticket ids that must be `done` first. Keep it short; most tickets depend on one or none.
- mode: `afk` when it needs no human decision; `hitl` when it does (say which in Scope).
- object_ids: ID ranges reserved for this ticket, disjoint from every other ticket and
  inside an app.json `idRanges` entry. Test objects take their range from the test app.
- acceptance: AC-NN ids from tickets/criteria.md that this ticket closes.
- bcq: BCQuality knowledge paths from <req>.bcq-criteria.json that apply to its objects.
- shared_files: files other tickets also touch (permission sets, app.json, XLF). The
  ticket adds its own entries and leaves the rest of the file alone.
-->

## Scope

{What this ticket delivers end to end: table, logic, page, test and permissions it needs.
Vertical: it works and can be verified on its own once its depends_on are done.}

## Objects

| Type | ID | Name | New / extends |
|---|---|---|---|
| {table} | {50100} | {Name} | {new} |

## Tests

| Test | Criterion | Given / When / Then |
|---|---|---|
| {procedure name} | AC-01 | {one line} |

## Pointers

- Spec: `{req}.spec.md` §{n}
- Research: `research.md` §{n} (Standard Flow for the events used here)
- Architecture decisions: {ids or none}

## Out of scope

{What a neighbour ticket does instead, so the implementer does not drift into it.}
