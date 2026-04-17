# Pull Request

## 📋 Description

Provide a clear description of what this PR accomplishes.

## 🎯 Type of Change

- [ ] New Agent Primitive (Instruction, Workflow, or Agent)
- [ ] Enhancement to existing primitive
- [ ] Bug fix
- [ ] Documentation update
- [ ] Framework alignment improvement
- [ ] Validation script improvement
- [ ] Other (please describe)

## 🔗 Related Issues

Closes #(issue number)
Relates to #(issue number)

## 🏗️ A-Instructions Architecture Compliance

### Layer Impact

- [ ] **Layer 1**: Markdown Prompt Engineering changes
- [ ] **Layer 2**: Agent Primitives changes (Instructions/Workflows/Agents)
- [ ] **Layer 3**: Context Engineering changes (applyTo patterns, AGENTS.md)

### Changes Made

#### Agent Primitives Modified/Added

| File | Type | Change Type |
|------|------|-------------|
| `file-name.md` | Instruction/Workflow/Agent | New/Modified/Fixed |

#### Frontmatter Details

```yaml
---
description: 'Your description'
applyTo: ['pattern']  # If applicable
---
```

## 🧪 Testing

### Validation

- [ ] Ran `npm run validate` successfully
- [ ] All file paths are correct
- [ ] Frontmatter is properly formatted
- [ ] No naming convention violations

**Validation Output**:
```
✅ Successes: X
⚠️ Warnings: Y
❌ Errors: 0
```

### Manual Testing

- [ ] Tested with sample AL project
- [ ] Verified GitHub Copilot integration
- [ ] Tested with VS Code
- [ ] Verified applyTo patterns work correctly

**Testing Environment**:
- VS Code Version:
- GitHub Copilot Version:
- Business Central Version:
- Operating System:

### Test Scenarios

Describe how you tested this change:

1. **Scenario 1**:
   - Steps:
   - Expected:
   - Actual:

2. **Scenario 2**:
   - Steps:
   - Expected:
   - Actual:

## 📖 Documentation

- [ ] Updated README.md (if needed)
- [ ] Updated docs/al-development.md (if needed)
- [ ] Updated collection manifest
- [ ] Added/updated examples
- [ ] Updated CONTRIBUTING.md (if process changed)

## 🔄 Breaking Changes

- [ ] This PR introduces breaking changes

If yes, describe:
- What breaks:
- Migration path:
- Affected users:

## 📸 Screenshots/Examples

If applicable, add screenshots or code examples showing the change in action.

### Before
```al
// Code before change
```

### After
```al
// Code after change
```

## ✅ Checklist

### Code Quality

- [ ] Code follows A-Instructions Architecture principles
- [ ] Markdown is properly formatted
- [ ] No markdown lint errors
- [ ] File names follow conventions (lowercase-with-hyphens)
- [ ] Proper use of frontmatter metadata

### Content Quality

- [ ] Clear, concise descriptions
- [ ] Proper grammar and spelling
- [ ] Consistent terminology (Agent Primitives, Agentic Workflows, etc.)
- [ ] Examples are clear and correct
- [ ] Tool boundaries defined (for agents)

### Framework Compliance

- [ ] Follows Markdown Prompt Engineering principles
- [ ] Proper Agent Primitive categorization
- [ ] Context Engineering patterns documented
- [ ] applyTo patterns are specific and correct

### Collaboration

- [ ] PR title is descriptive
- [ ] PR description is complete
- [ ] Linked to related issues
- [ ] Ready for review

## 🤔 Questions for Reviewers

Any specific areas you'd like reviewers to focus on?

1. Question 1:
2. Question 2:

## 📚 Additional Context

Add any other context about the pull request here.

## 🙏 Acknowledgments

If this PR is based on someone else's work or suggestion, acknowledge them here.

---

**Note for Reviewers**: 
- Please verify validation passes
- Test with actual AL projects if possible
- Check framework alignment
- Verify documentation is updated
