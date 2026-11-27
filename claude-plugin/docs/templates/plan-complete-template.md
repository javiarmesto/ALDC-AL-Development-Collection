# Template — Plan Completion Report

Use this template verbatim when writing `<plans.root>/<plan-name>/<plan-name>-complete.md`. Consolidate data from every `tickets/T-NN.result.md` and the final review. Replace placeholders, remove sections that do not apply, do not invent additional structure.

---

```markdown
## Plan Complete: {Task Title}

{2-4 sentence summary describing what was built and the value delivered.}

**AL Extension Summary:**
- Extension Type: {TableExtension, Codeunit, Page, etc.}
- Base Objects Extended: {List standard BC objects}
- Event Architecture: {Subscribers and publishers added}
- AL-Go Compliance: ✅ {App and Test projects properly structured}

**Tickets Completed:** {N} of {N} in {W} wave(s)
1. ✅ T-01: {Title} (wave 1)
2. ✅ T-02: {Title} (wave 1)
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
| Final review (spec axis) | {verdict} | `<plan>-review-final.json` |
| Certified BCQuality review | {certified / not-certified / not-run: reason} | {verdict file} |

Write `not-run` with its reason for anything you did not execute. Never write "passing" for tests that did not run.

**Requirement coverage:** (from `traceability.md`; omit when the spec has no Requirement points)
| REQ | What was asked | Criteria | Verdict |
|-----|----------------|----------|---------|
| REQ-01 | {as asked} | {AC-01} | {met, executed / met, not executed / met by review only / not evaluated / unmet / not covered} |

**Not verified:** {everything the client should not assume: tests not executed, behaviour not exercised in a real company, integrations not called, assumptions that were not checked}

**Decisions taken without a human:** (from `decisions.md`; omit in `human` mode when every gate was approved by the user)
- {D-id}: {decision} — {why}

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

| Skill | Tickets | Key Patterns Used |
|-------|---------------|-------------------|
| skill-api | T-02, T-03 | ODataKeyFields, APIPublisher, bound action |
| skill-testing | T-01, T-02, T-03 | Given/When/Then, Library Assert |
| skill-permissions | T-03 | READ/CALC permission sets |
| skill-performance | T-02 | SetLoadFields, CalcFields grouping |

(Consolidate from every ticket result and the implementers' skills lines. List only skills actually applied. Omit table if empty.)

**BCQuality Evidence Roll-up:** (omit if BCQuality was not consulted)

| Review | Skills run | Outcome | Findings (b/M/m/i) | Citations | Raw report |
|-------|-----------|---------|--------------------|-----------|------------|
| final | al-performance-review, al-security-review | completed | 0/1/1/0 | 2 | `<plan>-bcquality-final.json` |

- Observed provider revisions: {full SHA, or unverified}
- Citations validated by `bcquality-evidence` CI: ✅ / ❌

**Recommendations for Next Steps:**
- {Optional suggestion}
```

---

## Rules

- File name pattern: kebab-case, `<plan-name>-complete.md` (no ticket or review suffix).
- One report per plan, written at the end.
- Reference the ticket results for detail rather than duplicating their content.
- Skills summary aggregates the ticket results; do not invent skills that did not appear in any ticket.
- Fill *Verification*, *Not verified*, *Decisions taken without a human* and *Open risks* from evidence, never from intent.
- Do not add sections beyond the ones above.
