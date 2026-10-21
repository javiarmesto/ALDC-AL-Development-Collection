# Template — Plan Completion Report

Use this template verbatim when writing `<plans.root>/<plan-name>/<plan-name>-complete.md`. Consolidate data from all phase-complete files. Replace placeholders, remove sections that do not apply, do not invent additional structure.

---

```markdown
## Plan Complete: {Task Title}

{2-4 sentence summary describing what was built and the value delivered.}

**AL Extension Summary:**
- Extension Type: {TableExtension, Codeunit, Page, etc.}
- Base Objects Extended: {List standard BC objects}
- Event Architecture: {Subscribers and publishers added}
- AL-Go Compliance: ✅ {App and Test projects properly structured}

**Phases Completed:** {N} of {N}
1. ✅ Phase 1: {Title}
2. ✅ Phase 2: {Title}
...

**All AL Objects Created/Modified:**
- Table/TableExtension {ID}: {Name}
- Codeunit {ID}: {Name}
- Page/PageExtension {ID}: {Name}
...

**All Files Created/Modified:**
- `/app/...`
- `/test/...`

**Key Functions/Event Subscribers Added:**
- {Function/procedure name}
- {Event subscriber signature}

**Verification (what was checked, and how):**
| Check | Result | Evidence |
|-------|--------|----------|
| Compilation (App, Test) | {passed / failed / not-run} | {validator or compiler output, per project} |
| Code analyzers | {n errors, n warnings / not-run} | {source} |
| Tests executed | {n passed of n / not-run: reason} | {test runner output, environment} |
| Review | {verdict per phase} | `<plan>-review-phase-N.json` |

Write `not-run` with its reason for anything you did not execute. Never write "passing" for tests that did not run.

**Not verified:** {everything the client should not assume: tests not executed, behaviour not exercised in a real company, integrations not called, assumptions that were not checked}

**Decisions taken without a human:** {each decision taken without explicit user approval, with why; "None" when the user approved every gate}

**Open risks:** {security checks with status `finding`, BCQuality articles `dismissed`, recommendations not applied, and any process gap recorded in a phase}

**Test Coverage:**
- Total test codeunits: {count}
- Total test procedures: {count}
- AL-Go structure: {✅ / ❌}

(Omit the test coverage block if no tests were generated.)

**AL Performance & Quality:**
- SetLoadFields used: {Yes/No}
- Event-driven: ✅ {No base modifications}
- Naming conventions: ✅ {26-char limit}
- Error handling: ✅

**Skills Utilization Summary:**

| Skill | Phases Applied | Key Patterns Used |
|-------|---------------|-------------------|
| skill-api | Phase 2, 3 | ODataKeyFields, APIPublisher, bound action |
| skill-testing | Phase 1, 2, 3 | Given/When/Then, Library Assert |
| skill-permissions | Phase 3 | READ/CALC permission sets |
| skill-performance | Phase 2 | SetLoadFields, CalcFields grouping |

(Consolidate from every phase-complete file. List only skills actually applied. Omit table if empty.)

**BCQuality Evidence Roll-up:** (omit if BCQuality was not consulted in any phase)

| Phase | Skills run | Outcome | Findings (b/M/m/i) | Citations | Raw report |
|-------|-----------|---------|--------------------|-----------|------------|
| 2 | al-performance-review, al-security-review | completed | 0/1/1/0 | 2 | `<plan>-bcquality-phase-2.json` |

- Observed provider revisions per phase: {full SHA, or unverified}
- Citations validated by `bcquality-evidence` CI: ✅ / ❌

**Recommendations for Next Steps:**
- {Optional suggestion}
```

---

## Rules

- File name pattern: kebab-case, `<plan-name>-complete.md` (no phase suffix).
- One report per plan, written at the end.
- Reference phase-complete files for detail rather than duplicating their content.
- Skills summary aggregates phase reports; do not invent skills that did not appear in any phase.
- Do not add sections beyond the ones above.
