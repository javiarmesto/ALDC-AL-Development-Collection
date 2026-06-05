# Template — Plan Completion Report

Use this template verbatim when writing `.github/plans/<plan-name>/<plan-name>-complete.md`. Consolidate data from all phase-complete files. Replace placeholders, remove sections that do not apply, do not invent additional structure.

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

**Test Coverage:**
- Total test codeunits: {count}
- Total test procedures: {count}
- All tests passing: ✅
- AL-Go structure: ✅

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

- Submodule SHA (all phases): {e.g. f562fba}
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
