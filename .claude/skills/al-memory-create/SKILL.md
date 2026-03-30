---
name: al-memory-create
description: >
  Generate or update memory.md file tracking decisions, changes, and learnings
  throughout project development for continuity across sessions. Use when you need
  to create or update memory, track decisions, or maintain session continuity.
allowed-tools: Read Grep Glob Write Edit
disable-model-invocation: true
---

# AL Memory File Generator

Generate and maintain a `memory.md` file that serves as the **project memory** - tracking decisions, changes, learnings, and important conversations across development sessions.

## Purpose

The `memory.md` file provides:
- **Session Continuity**: What happened in previous sessions
- **Decision Log**: Why things were done a certain way
- **Problem/Solution Patterns**: What issues occurred and how they were solved
- **TODO Tracking**: What needs to be done next
- **Learning Journal**: Insights gained during development
- **Context for AI**: Prevents re-asking questions or repeating mistakes

This enables AI assistants and developers to pick up where they left off and build on previous work.

## Execution Steps

### 1. Initialize Memory Structure

If `memory.md` doesn't exist, create with this template:

```markdown
# Project Memory - [Extension Name]

> **Purpose**: Continuous memory across development sessions  
> **Maintained by**: AI assistants and developers  
> **Last Updated**: [Date]

## Quick Reference

**Current Focus**: [What we're working on now]  
**Next Steps**: [ImMEDIUMte next actions]  
**Blockers**: [Current blockers if any]

---
---

## Session Log

### [Date] - Session [N]

**Focus**: [What was worked on]

**Completed**:
- [Task 1]
- [Task 2]

**Decisions Made**:
- **[Decision]**: [Rationale]

**Problems Encountered**:
- **[Problem]**: [Solution or workaround]

**Next Session**:
- [ ] [Task to continue]
- [ ] [Task to start]

**Notes**:
- [Any important observations]

---
---

## Decision Log

### [Date] - [Decision Title]

**Context**: [Why this decision needed to be made]  
**Options Considered**:
1. [Option 1]: [Pros/Cons]
2. [Option 2]: [Pros/Cons]

**Decision**: [What was chosen]  
**Rationale**: [Why this option]  
**Impact**: [What this affects]  
**Review Date**: [When to revisit if applicable]

---
---

## Problem/Solution Patterns

### [Problem Category] - [Specific Issue]

**Symptom**: [What we observed]  
**Root Cause**: [What was actually wrong]  
**Solution**: [How we fixed it]  
**Prevention**: [How to avoid in future]  
**Related Code**: [File paths or line numbers]

---
---

## Learning Journal

### [Date] - [Topic/Insight]

**What We Learned**: [Key insight or pattern discovered]  
**Why It Matters**: [Impact on project]  
**Where Applied**: [Code locations]  
**Resources**: [Links to docs, articles that helped]

---
---

## Code Evolution

### [Feature/Module Name]

**v1.0** - [Date]
- Initial implementation
- [Key characteristics]

**v1.1** - [Date]
- Changed: [What changed]
- Reason: [Why it changed]
- Migration: [How to adapt if needed]

---
---

## TODO & Backlog

### High Priority
- [ ] [Task] - [Why important] - [Target date]

### Medium Priority
- [ ] [Task] - [Context]

### Future Ideas
- [ ] [Idea] - [Rationale]

### Done ✅
- [x] [Completed task] - [Date completed]

---
---

## Questions & Answers

### [Question]
**Asked**: [Date]  
**Answer**: [The answer found]  
**Source**: [Where answer came from - docs, testing, expert]

---
---

## Integration Points

### [External System/Extension Name]

**First Integrated**: [Date]  
**Current Status**: [Active/Deprecated/Planned]  
**Contact Point**: [Method - API/Event/etc]  
**Issues Encountered**: [Problems and solutions]  
**Dependencies**: [What depends on this]

---
---

## Performance Tracking

### [Feature/Operation]

**Baseline**: [Initial performance metrics]  
**Optimizations Applied**:
- [Date]: [Change] → [Result]

**Current State**: [Latest metrics]  
**Target**: [Performance goal]

---
---

## Testing Insights

### [Test Scenario]

**First Tested**: [Date]  
**Results**: [What we found]  
**Edge Cases Discovered**:
- [Edge case 1]: [How handled]

**Regression History**: [If this broke before, when and why]

---
---

## Communication Log

### [Date] - [Stakeholder/Team Member]

**Topic**: [What was discussed]  
**Decisions**: [Agreements reached]  
**Action Items**: [Who does what]  
**Follow-up**: [When to check back]

---
---

## Environment Notes

### Development Setup

**Last Working Config**: [Date]
- BC Version: [Version]
- Extensions: [Key extensions used]
- Settings: [Important VS Code/AL settings]

**Known Issues**:
- [Issue]: [Workaround]

---
---

## Deprecated Patterns

### [Pattern Name]

**Used**: [Date range when this was used]  
**Replaced By**: [New pattern]  
**Migration Guide**: [How to update old code]  
**Reason for Deprecation**: [Why we stopped using it]

---
---

## Useful Snippets

### [Snippet Name]
```al
[Code snippet that proved useful]
```
**Use Case**: [When to use this]  
**Source**: [Where this came from]

---
---

## Meeting Notes

### [Date] - [Meeting Type]

**Attendees**: [Who was there]  
**Topics**: [What was discussed]  
**Decisions**: [What was decided]  
**Actions**: [Who does what by when]

---
---

## Maintenance Log

### [Date] - [Maintenance Activity]

**What**: [What was maintained]  
**Why**: [Reason for maintenance]  
**Changes**: [What changed]  
**Impact**: [What this affects]
```

### 2. If Memory File Exists - Update It

**Add new session entry:**
```powershell
# Check for recent changes
@changes

# Check current problems
@problems

# Check TODOs
@todos
```

**Update with:**
- New session log entry at the top
- Any decisions made in this session
- Problems solved
- Learnings discovered
- Progress on existing TODOs
- New TODOs identified

### 3. Session Entry Creation

For each development session, document:

**Format:**
```markdown
### [Today's Date] - Session N

**Focus**: [Main task(s) worked on]

**Completed**:
- ✅ [Specific accomplishment 1]
- ✅ [Specific accomplishment 2]

**Decisions Made**:
- **[Decision Topic]**: [Choice made and brief reason]

**Problems Encountered**:
- **[Problem Description]**: 
  - Symptom: [What we saw]
  - Cause: [Root cause if known]
  - Solution: [How fixed or workaround]

**Learnings**:
- [Insight gained from this session]

**Next Session**:
- [ ] [Continue/start task 1]
- [ ] [Continue/start task 2]

**Files Changed**:
- `[file path]`: [What changed]

**Notes**:
- [Any other important context]
```

### 4. Decision Documentation

When architectural/technical decisions are made:

```markdown
### [Date] - [Decision Title]

**Context**: 
[What situation required this decision? What were we trying to solve?]

**Options Considered**:
1. **[Option 1]**
   - Pros: [Benefits]
   - Cons: [Drawbacks]
   
2. **[Option 2]**
   - Pros: [Benefits]
   - Cons: [Drawbacks]

**Decision**: [What we chose]

**Rationale**: 
[Why this option was best given the context, constraints, and requirements]

**Implementation Notes**:
- [Key points about how this was implemented]

**Impact**: 
- Code: [What code was affected]
- Performance: [Performance implications if any]
- Maintenance: [Ongoing maintenance considerations]

**Review Date**: [Optional - when to revisit this decision]

**References**:
- [Links to documentation, discussions, etc.]
```

### 5. Problem/Solution Pattern Documentation

When bugs are fixed or challenges overcome:

```markdown
### [Category] - [Problem Title]

**Date Encountered**: [Date]

**Symptom**: 
[What behavior did we observe? What was wrong?]

**Context**:
[When does this happen? What conditions trigger it?]

**Root Cause**: 
[What was actually causing the problem?]

**Solution**: 
[How we fixed it - code changes, configuration, etc.]

**Code Changed**:
```al
// Before
[problematic code]

// After
[fixed code]
```

**Prevention**: 
[How to avoid this in the future - pattern to follow, test to add, etc.]

**Related**:
- Files: `[file paths]`
- Similar issues: [References to related problems]
- Documentation: [Links to relevant docs]
```

### 6. Learning Capture

When discovering new patterns or insights:

```markdown
### [Date] - [Topic]

**What We Learned**:
[The key insight, pattern, or understanding gained]

**How We Learned It**:
[Through debugging, documentation, experimentation, etc.]

**Why It Matters**:
[Impact on the project, development efficiency, code quality, etc.]

**Where Applied**:
- `[file path]`: [How this learning was applied]

**Best Practice**:
[If this leads to a best practice for this project]

**Resources**:
- [Links to documentation that helped]
- [Code examples from BC or other sources]
```

### 7. Update Quick Reference

At the end of each session, update the top section:

```markdown
## Quick Reference

**Current Focus**: [Update with current work]  
**Last Session**: [Date of last session]  
**Next Steps**: 
1. [Most imMEDIUMte next action]
2. [Second priority]

**Active Blockers**: 
- [Blocker 1]: [Status]

**Recent Achievements** (Last 7 days):
- [Achievement 1]
- [Achievement 2]

**Active Branch**: [Git branch if relevant]
```

### 8. Maintenance & Cleanup

**Weekly:**
- Move completed TODOs to "Done" section
- Archive old session entries (keep last 10, summarize older ones)
- Update code evolution section if major changes

**Monthly:**
- Review decision log - mark outdated decisions
- Consolidate similar problem/solution patterns
- Clean up deprecated patterns section
- Update environment notes if setup changed

## Output Format

Deliver:
1. ✅ Created/updated `memory.md` at project root
2. ✅ Summary of key additions made
3. ✅ Highlight any important patterns/decisions documented
4. ✅ Suggest next session focus based on TODOs

## Integration with Development Workflow

### At Session Start
```markdown
**AI Assistant**: Load memory.md to understand:
- What was done last session
- What the plan was for this session
- Any blockers or important context
```

### During Development
```markdown
**Capture**:
- Decisions as they're made
- Problems as they're encountered
- Learnings as they're discovered
```

### At Session End
```markdown
**Update**:
- Session log with completion status
- TODOs with progress
- Quick Reference with next steps
```

## Key Principles

- **Chronological**: Most recent first for quick access
- **Searchable**: Use clear headings and keywords
- **Contextual**: Include enough context to understand later
- **Actionable**: TODOs and next steps are concrete
- **Honest**: Document failures and mistakes - they're learning opportunities
- **Linked**: Reference files, line numbers, other sections
- **Concise**: Important but brief - detailed docs go in context.md

## Success Criteria

A successful `memory.md` enables:
- ✅ Picking up project after weeks away
- ✅ Understanding why code is the way it is
- ✅ Avoiding repeat mistakes
- ✅ Building on previous learnings
- ✅ Tracking progress over time
- ✅ AI assistant continuity across sessions

## Collaboration

When multiple developers work on the project:
- Each adds their session entries
- Decisions are collaborative - note who participated
- Problem solutions are shared learning
- TODOs can be assigned to people
- Communication log tracks cross-team discussions
