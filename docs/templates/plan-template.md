# Template — Plan Document

Use this template verbatim when writing `.github/plans/<plan-name>/<plan-name>-plan.md` after the Phase 1 (Planning) handoff in the AL Conductor workflow. Replace placeholders, remove sections that do not apply, do not invent additional structure.

---

```markdown
## Plan: {Task Title (2-10 words)}

{Brief TL;DR — what, how, why. 1-3 sentences.}

**AL Context:**
- Base Objects: {Standard BC objects involved}
- Extension Pattern: {TableExtension, PageExtension, EventSubscriber, etc.}
- AL-Go Structure: {App project path, Test project path}
- Dependencies: {Required extensions or packages}

**Phases ({3-10}):**

1. **Phase {N}: {Title}**
   - **Objective:** {What is to be achieved}
   - **AL Objects to Create/Modify:** {Table/TableExtension/Codeunit/Page with IDs and names}
   - **Event Architecture:** {Subscribers to create, integration events to publish}
   - **Files/Functions to Modify/Create:** {Path in app/ or test/}
   - **Tests to Write:** {Test codeunit names, specific test procedures}
   - **AL Patterns:** {SetLoadFields, error handling, performance considerations}
   - **Steps:**
     1. Create test codeunit in `/test`
     2. Write failing tests
     3. Run tests to verify failure
     4. Create AL objects in `/app`
     5. Implement minimal code to pass tests
     6. Run tests to verify pass
     7. Verify no regressions in full test suite
     8. Apply linting/formatting

**Open Questions ({1-5}, ~5-25 words each):**

1. {Clarifying question? Option A / Option B / Option C}
```

---

## Plan writing rules

- Include AL-specific context (base objects, extension patterns, AL-Go structure).
- Specify AL object types and IDs.
- Document event architecture (subscribers/publishers).
- Reference AL performance patterns (do not duplicate them — they live in `al-performance.instructions.md`).
- Follow AL-Go structure (`app/` vs `test/` separation).
- **Do NOT include code blocks**; describe changes and link to relevant files.
- **No manual testing/validation** unless explicitly requested.
- Each phase is incremental and self-contained with a strict TDD cycle.
- Avoid red/green processes spanning multiple phases for the same code.
