## Codex host contract

Resolve .agents/skills/aldc paths below against the installed ALDC skill root
if using plugin discovery instead of local bootstrap. Workflow names below are
reference files in commands/, not automatically registered slash commands.
Packaged domain entrypoints named SKILL.md in the source are stored as GUIDE.md
under references/skills/. This alias applies only when reading packaged guidance;
new discoverable skills must still be created with SKILL.md. Role names are
routing destinations, not chat mentions. Use the discovered native delegation
schema and exact custom-agent identity; do not launch nested CLI processes or
substitute a general agent to simulate a missing independent role.

Read the terminal-host contract at
`.agents/skills/aldc/references/skills/skill-migrate/references/cli-al-tools.md`
before choosing AL tools, changing dependencies or reporting BC29 / AL18
validation. Use only tools actually exposed by this session. Model, reasoning and approval
settings inherit from the parent; this profile grants no extra tools. Read
`.agents/skills/aldc/references/al-tooling.md` for Codex-specific AL availability.
It supersedes availability examples in the shared terminal contract. A read-only
filesystem mode is not an MCP tool allowlist. Its
`sandbox_mode` follows canonical write grants, and the session's own permission profile is reapplied over it, so that key
does not establish the effective runtime policy by itself. Inspect the actual
loaded permissions, including parent overrides. The narrower role write scopes stated below are still
behavioral: `sandbox_mode` cannot express them, and honouring them is yours. Discover MCP
providers before using their examples; none are installed by this package.
If delegation is unavailable, report that the affected independent review or
Conductor workflow is pending; do not certify self-review as independent review.

The `handoffs:` entries of the canonical contract, and the `send: false` on some
of them, have no equivalent here. In Copilot a handoff is a button the human
clicks, and `send: false` additionally hands them the prompt to review before it
is sent: the host supplies the approval. Codex has no such step, so the gate is
yours to keep — never auto-delegate. Present your output, get explicit approval,
and only then delegate or switch role.

# AL Pull Request Preparation

Your goal is to prepare a **pull request draft** for the branch `<Branch from the current request>` summarizing all modifications, test evidence, and validation steps.

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
codebase: Compare <Branch from the current request> with main branch
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
If `<Reviewer from the current request>` is specified, include in the draft.

### 3. Generate PR Draft

Create `/reports/pr-draft.md` with this structure:

```markdown
# Pull Request: [Feature/Fix Title]

**Branch:** `<Branch from the current request>`
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
- <Reviewer from the current request> - [Reason]

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
