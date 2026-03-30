---
name: al-pr-prepare
description: >
  Prepare a clean, documented pull request draft for AL features or fixes with
  summary, testing notes, and checklist. Use when preparing a PR, creating a
  pull request, or documenting changes for review.
allowed-tools: Read Grep Glob Write Edit Bash
disable-model-invocation: true
---

# AL Pull Request Preparation

Your goal is to prepare a **pull request draft** for the branch `${input:Branch}` summarizing all modifications, test evidence, and validation steps.

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
codebase: Compare ${input:Branch} with main branch
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
If `${input:Reviewer}` is specified, include in the draft.

### 3. Generate PR Draft

Create `/reports/pr-draft.md` with this structure:

```markdown
# Pull Request: [Feature/Fix Title]

**Branch:** `${input:Branch}`
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
- ${input:Reviewer} - [Reason]

**Focus Areas:**
1. [Area to review carefully]
2. [Another focus area]

**Questions:**
[Specific questions or concerns]

---
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
agent `al-conductor`   # TDD orchestration with review subagent
agent `al-developer`   # Direct testing and fixes
```

---
---

**PR draft ready for GitHub submission.**
