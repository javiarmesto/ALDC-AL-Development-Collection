# Template — Code Review Report

Use this template verbatim when the AL Code Review Subagent reports back to the Conductor. Replace placeholders, remove sections that do not apply, do not invent additional structure.

---

```markdown
## Code Review: {Phase Name}

**Status:** {APPROVED | NEEDS_REVISION | FAILED}

**Summary:** {Brief assessment of implementation quality, 1-2 sentences.}

**AL Objects Reviewed:**
- {Type} {ID} "{Name}" (extends Table {Base ID} if applicable)

**Strengths:**
- {Good AL patterns applied}
- {Solid practices followed}
- {Positive aspects of code or tests}

**Issues Found:** {if none, write "None"}

- **[CRITICAL]** {Issue title}
  - Location: {File path:line}
  - Problem: {What is wrong}
  - Impact: {Why it matters — e.g. base object modification will fail in SaaS}
  - Fix: {Specific corrective action}

- **[MAJOR]** {Issue title}
  - Location: {File path:line}
  - Problem: {Details}
  - Impact: {Consequences}
  - Fix: {Recommended fix}

- **[MINOR]** {Issue title}
  - Location: {File path:line}
  - Problem: {Details}
  - Suggestion: {Improvement recommendation}

**Recommendations:**
- {Specific suggestion for improvement}
- {Code quality enhancement}
- {Test or coverage improvement}

**External Knowledge Findings (BCQuality):**
(From the Step 0 BCQuality consultation. If the consultation returned `no-knowledge` / `not-applicable`, write "No applicable knowledge". If it `failed` / `partial`, note what ran. BCQuality CRITICAL/MAJOR findings raise the overall Status above.)

- BCQuality commit: {the `pinnedCommit` from `aldc.yaml`; `n/a` if not consulted}
- Skills run: {e.g. al-performance-review, al-security-review, al-style-review}
- Outcome: {completed | no-knowledge | not-applicable | partial | failed}

| Severity | Location | Finding | Cite (knowledge file) | Confidence |
|---|---|---|---|---|
| {CRITICAL/MAJOR/MINOR} | {File:line} | {Message} | {microsoft\|community\|custom/knowledge/<domain>/<slug>.md} | {high/med/low} |

Suppressed (knowledge overridden by layer precedence / disabled layer — omit if none):
- {path/to/knowledge.md} — {layer-precedence | configuration}

**Skills Compliance Check:**
(Mark N/A for skills not applicable to the phase under review.)

- [ ] **skill-api** — ODataKeyFields, APIPublisher, EntityName conventions | N/A
- [ ] **skill-performance** — SetLoadFields, early CalcFields grouping, early filtering | N/A
- [ ] **skill-events** — EventSubscriber attributes correct, IsHandled pattern used | N/A
- [ ] **skill-permissions** — PermissionSet generated for all new objects | N/A
- [ ] **skill-testing** — Given/When/Then, Library Assert, IsInitialized pattern | N/A

**AL Best Practices Compliance:**

- Event-Driven Architecture: {✅ Pass / ❌ Fail}
- Naming Conventions (26-char): {✅ Pass / ❌ Fail}
- AL-Go Structure: {✅ Pass / ❌ Fail}
- Performance Patterns: {✅ Pass / ⚠️ Could improve / ❌ Fail}
- Error Handling: {✅ Pass / ⚠️ Could improve / ❌ Fail}
- Test Coverage: {✅ Pass / ⚠️ Partial / ❌ Fail}
- Feature Organization: {✅ Pass / ⚠️ Mixed / ❌ Fail}

**Test Results:**

- Total Tests: {count}
- Passing: {count} ✅
- Failing: {count} ❌ {if any, list them}

**Next Steps:**
- If APPROVED: "Proceed to commit phase"
- If NEEDS_REVISION: "Address {critical/major} issues, then re-review"
- If FAILED: "Consult user for guidance on {specific problem}"
```

---

## Status criteria

### APPROVED ✅
- No CRITICAL issues.
- No MAJOR issues (or 1-2 minor majors with workarounds).
- Tests pass.
- AL best practices mostly followed.
- Code achieves the phase objective.

### NEEDS_REVISION 🔄
- 1-2 fixable CRITICAL issues, or several MAJOR issues, or partial test failures, or correctable AL pattern violations. The Conductor will pass the specific fixes to the Implement Subagent.

### FAILED ❌
- Multiple CRITICAL issues, fundamentally wrong approach (e.g. trying to modify base objects), complete test failure, or requires user / architect decision. Escalate to the Conductor; user intervention needed.

---

## Rules

- Every review MUST include the **Skills Compliance Check** section.
- Every review MUST include the **External Knowledge Findings (BCQuality)** section; if the consultation found nothing applicable, say so explicitly rather than omitting it.
- BCQuality findings map by severity: `blocker`→CRITICAL, `major`→MAJOR, `minor`→MINOR, `info`→Recommendation. A BCQuality CRITICAL/MAJOR affects Status exactly like a native one.
- Always cite the knowledge-file path BCQuality returned in `references`; never present a BCQuality finding without its citation.
- Mark unused skills as N/A; do not invent compliance on skills the implementer did not load.
- Issues use exactly three severities: CRITICAL, MAJOR, MINOR. Do not invent new ones.
- Provide specific file:line references when possible.
- Status must match the body: APPROVED requires no CRITICAL issues; FAILED requires multiple CRITICAL or fundamental design problem.
