# Template — Phase Completion Report

Use this template verbatim when writing `.github/plans/<plan-name>/<plan-name>-phase-<N>-complete.md`. Replace placeholders, remove sections that do not apply (e.g. tests block when no tests were generated), do not invent additional structure.

---

```markdown
## Phase {N} Complete: {Title}

{Brief TL;DR. 1-3 sentences. State what was delivered and the value it produced. No technical detail here — that lives in the sections below.}

**AL Objects Created/Modified:**
- {Table/TableExtension ID and name}
- {Page/PageExtension ID and name}
- {Codeunit ID and name}
- {Event subscribers added}

**Files created/changed:**
- `/app/...` — {Description}
- `/test/...` — {Description}

**Functions created/changed:**
- {Function name in AL object}
- {Event subscriber signature}

**Tests created/changed:**
- {Test codeunit name}
- {Test procedure names}

(Omit the tests block if no tests were generated in this phase.)

**AL Patterns Applied:**
- {SetLoadFields usage}
- {Error handling pattern}
- {Performance optimizations}

**Skills Applied in This Phase:**

| Skill | Pattern Used | Evidence |
|-------|-------------|----------|
| skill-api | ODataKeyFields = SystemId | Page 50103 line 8 |
| skill-permissions | PermissionSet generation | CIECustAPIRead.PermissionSet.al |

(Consolidated from implement-subagent summary. Remove the table entirely if no domain skills were loaded in this phase. Do not list skills you did not actually apply.)

**BCQuality Evidence:** (omit only if BCQuality was not consulted this phase)
- Submodule SHA: {e.g. f562fba}
- Skills run: {al-performance-review, al-security-review, al-style-review}
- Outcome: {completed | no-knowledge | not-applicable | partial | failed}
- Findings: {N} (blocker/major/minor/info) — citations: {N}
- Raw report: `.github/plans/<plan>/<plan>-bcquality-phase-<N>.json`

**Review Status:** {APPROVED / APPROVED with minor recommendations / NEEDS_REVISION}

**Git Commit Message:**

{Following git-commit conventions: `fix/feat/chore/test/refactor: short description (max 50 chars)` + optional body wrapping at 72 chars.}
```

---

## Rules

- File name pattern: kebab-case, `<plan-name>-phase-<N>-complete.md`.
- One report per phase, including Phase 1 (planning) even when no code review applies.
- Keep the TL;DR at the top to 3 sentences max.
- Do not duplicate content from the spec or the architecture — reference them by path if needed.
- Skills table is optional; remove it if empty.
- Do not add sections beyond the ones above.
