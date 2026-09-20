---
description: Prepare a clean, documented pull request draft for AL features or fixes with summary, testing notes, and checklist. ALDC workflow (Copilot prompt al-pr-prepare); invoke explicitly.
disable-model-invocation: true
---

> **Copilot CLI adapter — generated; do not edit this distribution.**
> Select a role using /agent or copilot --agent <id>. Role names in this contract
> are routing destinations, never chat mentions or evidence of an invocation.
> Delegate only through the native task tool, using the exact discovered agent ID
> as agent_type (for example al-planning-subagent). Inspect list_agents and the
> actual task schema first. Keep all canonical human gates. Pass bounded context
> inline; wait for completion (read_agent for a background task) before consuming
> the result. A delegated role returns questions to its caller for the human gate.
> If task or the requested custom agent is unavailable in this context, return
> the blocked handoff to the caller/user. Never impersonate a missing subagent,
> silently substitute general-purpose, or launch another CLI process to fake it.
> Tool aliases in frontmatter select capabilities; call the actual tools exposed
> by the host: view, glob, grep/rg, edit/create/apply_patch, bash/powershell,
> web_fetch, task. Use a capability only when granted to this role and available.
> Load domain skills through the host's skill mechanism when exposed, otherwise
> read the complete bundled SKILL.md. A read is not a native skill invocation.
> Resolve PLUGIN_ROOT to this installed agent's plugin directory (not the project
> or original checkout). It is a path placeholder here, not a promised global
> shell variable. Read docs/copilot-cli-al-tooling.md there for LSP/MCP bindings;
> it supersedes older availability examples in the shared terminal contract at
> skills/skill-migrate/references/cli-al-tools.md, never role duties or human gates.
> Project instructions and matching .github/instructions rules remain binding;
> pass the relevant excerpts to delegated roles. Canonical artifacts remain in
> .github/plans/. Role write scopes are behavioral, not filesystem sandboxes.
> AL execution requires a verified terminal command/runner or an actually exposed
> MCP capability. Reuse the configured AL LSP for Agents wrapper through native
> CLI semantic tools when exposed to this role. Inspect the catalog; do not invent
> tool aliases or broaden read-only grants to enable rename/write operations.
> Editor debugger controls remain separate from semantic navigation.
> Symbol MCP: before any tools/call, verify AL CLI prerequisites are already
> provisioned; this provider may auto-install AL tools on first use. A read-only
> role must return that prerequisite to the caller, never bootstrap software.
> Load symbols via al_packages(action: load, path: absolute consumer path).
> The MCP process may run from the plugin cache; never assume its cwd is the
> consumer. Use the discovered schema and report missing .app packages explicitly.
> Record missing capabilities and unexecuted checks explicitly; never simulate.


# AL Pull Request Preparation

Your goal is to prepare a **pull request draft** for the branch `<Branch from $ARGUMENTS>` summarizing all modifications, test evidence, and validation steps.

## 🔒 Human Gate: Pre-PR Review

**Before generating PR draft document:**

1. **Review code changes** - Present summary of all modifications
2. **Security check** - Confirm no sensitive data in commits
3. **Quality validation** - Verify tests pass and build succeeds
4. **Human approval required** - Obtain confirmation before creating PR draft

## Process

### 1. Change Analysis

#### Inspect Branch Differences

Use `codebase` to analyze modifications:
```
codebase: Compare <Branch from $ARGUMENTS> with main branch
```

Use `githubRepo` to gather context:
```
githubRepo: Get branch information and commit history
```

**Gather:**
- Modified files and line counts
- New files added
- Deleted files
- Commit messages and references
- Related issues or work items

#### Classify Changes

Categorize into:

1. **New Features** - New AL objects, functionality, APIs
2. **Bug Fixes** - Corrections, refactors, optimizations
3. **Tests** - Test codeunits, scenarios, data
4. **Configuration** - app.json, permissions, dependencies
5. **Documentation** - README, comments, API docs

### 2. Extract Metadata

**Find References:**
Scan commit messages for:
- Issue references (#123)
- Work item IDs
- Requirement numbers

**Pattern matching:**
- Fixes #123
- Closes #456
- Related to WORK-789

**Identify Reviewers:**
If `<Reviewer from $ARGUMENTS>` is specified, include in the draft.

### 3. Generate PR Draft

Create `/reports/pr-draft.md` with this structure:

```markdown
# Pull Request: [Feature/Fix Title]

**Branch:** `<Branch from $ARGUMENTS>`
**Target:** `main`
**Author:** [Author Name]
**Date:** [Current Date]

## Overview

[2-3 sentence description of changes]

**Type of Change:**
- [ ] New Feature
- [ ] Bug Fix
- [ ] Refactoring
- [ ] Performance Improvement
- [ ] Documentation
- [ ] Configuration Change

## Related Issues

- Closes #[issue-number]
- Relates to #[issue-number]

## Changes Summary

### File Changes

| Category | Files | +Lines | -Lines |
|----------|-------|--------|--------|
| New Features | [#] | [#] | [#] |
| Bug Fixes | [#] | [#] | [#] |
| Tests | [#] | [#] | [#] |
| Docs | [#] | [#] | [#] |
| **Total** | **[#]** | **[#]** | **[#]** |

### AL Objects Modified

#### New Objects

| Type | ID | Name | Purpose |
|------|----|----- |---------|
| Table | [ID] | [Name] | [Purpose] |
| Page | [ID] | [Name] | [Purpose] |
| Codeunit | [ID] | [Name] | [Purpose] |

#### Modified Objects

| Type | ID | Name | Changes |
|------|----|----- |---------|
| TableExt | [ID] | [Name] | [Description] |
| PageExt | [ID] | [Name] | [Description] |

#### Deleted Objects

| Type | ID | Name | Reason |
|------|----|----- |-------|
| [Type] | [ID] | [Name] | [Reason] |

## Technical Details

### Architecture Changes
[Describe design pattern or architecture changes]

### Dependencies
**New:** [List new dependencies]
**Modified:** [old version → new version]
**Removed:** [List removed dependencies]

### Database Changes
- [ ] New tables
- [ ] New fields
- [ ] Modified fields
- [ ] New keys

**Migration Notes:** [Any data migration needed]

### API Changes
**New Endpoints:**
- `GET /api/[endpoint]` - [Description]

**Modified Endpoints:**
- `[Method] /api/[endpoint]` - [Changes]

**Breaking Changes:** [List breaking changes]

### Events
**Published:** [New events and purpose]
**Subscribed:** [New subscribers and purpose]

## Testing

### Test Scenarios

1. **Scenario:** [Description]
   - **Steps:** [How to test]
   - **Expected:** [Expected result]
   - **Result:** ✅ Pass / ❌ Fail

### Automated Tests

- ✅ Unit Tests: [X/Y passed]
- ✅ Integration Tests: [X/Y passed]
- ✅ Code Coverage: [X]%

### Performance Impact

- [ ] No impact
- [ ] Improvement: [Details]
- [ ] Potential impact: [Mitigation]

## Review Checklist

### Code Quality
- [ ] Follows AL naming conventions
- [ ] Follows AL style guidelines
- [ ] No compiler warnings
- [ ] Error handling implemented
- [ ] Logging adequate

### Security
- [ ] No hardcoded secrets
- [ ] Permissions reviewed
- [ ] Input validation
- [ ] No SQL injection risks

### Testing
- [ ] All tests pass
- [ ] New code has tests
- [ ] Edge cases tested
- [ ] Manual testing done

### Documentation
- [ ] Code comments added
- [ ] API docs updated
- [ ] README updated
- [ ] Help text added

### BC Specific
- [ ] Object IDs in range
- [ ] Event patterns correct
- [ ] Page layouts user-friendly
- [ ] Translations handled

### Deployment
- [ ] Build succeeds
- [ ] Package creates
- [ ] Deployment steps documented
- [ ] Rollback plan ready

## Deployment Notes

### Steps
1. [Deployment instructions]
2. [Configuration changes]
3. [Verification steps]

### Prerequisites
[Requirements for deployment]

### Rollback Plan
[How to rollback if needed]

## Screenshots

### Before
[Previous state]

### After
[New state]

## Additional Notes

### Known Issues
[Limitations or known issues]

### Future Enhancements
[Potential improvements]

### Breaking Changes
[Breaking changes affecting existing functionality]

## Reviewer Notes

**Suggested Reviewers:**
- <Reviewer from $ARGUMENTS> - [Reason]

**Focus Areas:**
1. [Area to review carefully]
2. [Another focus area]

**Questions:**
[Specific questions or concerns]

---

**Generated by:** AL PR Preparation Workflow
**Generated on:** [Timestamp]
```

## Output

**Primary:** `/reports/pr-draft.md`
**Format:** Complete markdown document ready for PR creation

## Success Criteria

- ✅ PR draft file created under `/reports/pr-draft.md`
- ✅ Changes summarized by category
- ✅ All modified AL objects documented
- ✅ Related issues referenced
- ✅ Review checklist complete
- ✅ Deployment notes clear

## Common PR Patterns

### Feature Addition
- Emphasize new capabilities
- User benefit focus
- Comprehensive testing
- Document APIs/events

### Bug Fix
- Reference original issue
- Explain root cause
- Show before/after
- Include regression tests

### Refactoring
- Explain motivation
- Show no functional changes
- Highlight improvements
- Demonstrate coverage

### Performance Optimization
- Include benchmarks
- Show improvements
- Document approach
- Note trade-offs

## Tips

- Be concise but thorough
- Use tables for structure
- Include file names and line numbers
- Link to related documentation
- Provide context for changes
- Make reviewer's job easy
- Include visual evidence
- Anticipate questions
- Document decisions
- Keep security visible

## Next Steps

**For final validation:**
```
al-conductor   # TDD orchestration with review subagent
al-developer   # Direct testing and fixes
```

---

**PR draft ready for GitHub submission.**
