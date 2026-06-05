# Template — Planning Findings

Use this template verbatim when the AL Planning Subagent returns research findings to the Conductor. Replace placeholders, remove sections that do not apply, do not invent additional structure.

---

```markdown
## AL Planning Findings: {Task Name}

### Relevant AL Objects

- **Base Objects**: {list with type, ID and name}
- **Existing Extensions**: {list with type, ID, name, base object it extends, file path}
- **Related AL Objects**: {codeunits, pages, page extensions touched by the feature}

### Event Architecture

- **Subscribers Available**: {OnBefore/OnAfter events on relevant tables, with event name and target field/object}
- **Publishers to Call**: {integration events to fire, if any}
- **Pattern**: {short rationale, e.g. "OnBefore for validation, OnAfter for integration"}

### AL-Go Structure

- **App Project**: {path and `app.json` dependencies}
- **Test Project**: {path and `app.json` "test" scope dependency on app}
- **Follows**: AL-Go for GitHub conventions

### Key Functions/Classes to Reference

- **{FileName}.al**:
  - {Procedure name}: {one-line purpose}
- **Test patterns** in `/test`:
  - {Existing test files and their relevant pattern}

### Patterns & Conventions

- **Object IDs**: {range reserved for the feature}
- **Naming**: 26-char limit, PascalCase
- **Folders**: feature-based
- **Tests**: separate project with `"test"` scope
- **Performance**: notable patterns already in use (SetLoadFields, FlowFields, etc.)

### Performance Considerations

- {Per-table specifics: large tables → SetLoadFields, filter early, no DB calls in loops}

### Dependencies

- **Required Symbols**: {e.g. "Base Application", "System Application"}
- **Extension Dependencies**: {other apps required, or "None"}
- **Packages**: {check `.alpackages/` for available symbols}

### Implementation Options

1. **Option A: {Name}** ({Recommended/Not Recommended})
   - Pros: {1-2 bullets}
   - Cons: {1-2 bullets}
   - Pattern: {short description}
2. **Option B: ...**
3. **Option C: ...**

**Recommendation**: {Pick one with a one-line rationale}

### Open Questions

- {Question? Option A / Option B / Option C}
- {Question?}

### Existing Tests

- Found: {test file names and what they cover}
- Pattern: {how they assert, what attributes}
- Coverage: {basic / partial / complete}
- Need: {edge cases or scenarios still missing}

### Uncertainties (optional)

- ❓ {Anything you could not confirm — flag clearly, do not invent}
```

---

## Rules

- Document file paths exactly (no abbreviations).
- Use real object IDs from the codebase, never placeholders.
- 2-3 implementation options per "Implementation Options" section, with pros/cons.
- Open Questions: 1-5 entries, ~5-25 words each, in the form `Question? Option A / Option B / Option C`.
- Do NOT include code blocks in the findings — describe and link to files instead.
- Do NOT draft a plan; the Conductor drafts the plan from these findings.
