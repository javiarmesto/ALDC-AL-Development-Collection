# Agent Context & Memory System

**Version**: 1.0.0  
**Purpose**: Enable agent collaboration through shared context files

## Simplified Structure

**All files in**: `.github/plans/`

```text
.github/plans/
├── memory.md                              # Global context (all agents read/update)
└── {req_name}/                            # Per-requirement subdirectory
    ├── {req_name}.architecture.md         # Architecture design (@AL Architecture & Design Specialist)
    ├── {req_name}.spec.md                 # Technical spec (al-spec.create)
    ├── {req_name}.test-plan.md            # Test strategy (al-spec.create or conductor)
    ├── {req_name}-plan.md                 # Execution plan (@AL Development Conductor Phase 1)
    ├── {req_name}-phase-1-complete.md     # Phase completion (@AL Development Conductor)
    ├── {req_name}-phase-N-complete.md
    └── {req_name}-plan-complete.md        # Final report (@AL Development Conductor)
```

**Why single directory?**
- ✅ Easier for agents to discover all context
- ✅ Simpler file references
- ✅ Clear chronology of project evolution
- ✅ Less directory management overhead

## Agent Responsibilities

### 🏗️ al-architect
**Creates**: `.github/plans/<feature>-arch.md`
**Reads**: 
- `.github/plans/project-context.md` (if exists)
- `.github/plans/*-spec.md` (if exists)

**Agent Instructions to Add**:
```markdown
## Output Documentation

After completing architectural design, create `.github/plans/<feature>-arch.md`:

**Template**:
```markdown
# Architecture: <Feature Name>

**Date**: YYYY-MM-DD  
**Complexity**: LOW/MEDIUM/HIGH  
**Author**: al-architect

## Overview
[Brief description]

## Design Decisions
### Data Model
[Tables, fields, relationships]

### Integration Points
[Events, APIs, webhooks]

### UI/UX Design
[Pages, actions, flows]

## Implementation Phases
1. Phase 1: [Description]
2. Phase 2: [Description]
...

## Dependencies
- Base objects referenced
- External integrations
- Performance considerations

## Next Steps
Recommended to proceed with: al-conductor mode OR @workspace use al-spec.create
```

**Reads**:
- `.github/context/project-context.md`
- `.github/specs/*.spec.md` (if exists)

### 💻 al-developer
**No file creation** - Executes direct implementation
**Reads**: All context files for guidance

### 🐛 al-debugger
**Creates**: `.github/debug/<issue>-diagnosis.md`

**Template**:
```markdown
# Debug Session: <Issue Title>

**Date**: YYYY-MM-DD  
**Issue**: [Brief description]  
**Author**: al-debugger

## Symptoms
[What was observed]

## Investigation Steps
1. [Step 1]
2. [Step 2]
...

## Root Cause Analysis
[Detailed explanation]

## Findings
- Finding 1
- Finding 2

## Recommended Fix
[Proposed solution]

## Related Files
- File 1
- File 2

## Next Steps
Proceed with: al-developer mode OR al-architect mode (if architectural)
```

**Reads**:
- `.github/context/project-context.md`
- `.github/plans/*.md` (to understand recent changes)

### ✅ al-tester
**Creates**: `.github/testing/<feature>-test-plan.md`

**Template**:
```markdown
# Test Plan: <Feature Name>

**Date**: YYYY-MM-DD  
**Feature**: [Brief description]  
**Author**: al-tester

## Test Strategy
- Approach: [Unit/Integration/E2E]
- Coverage Target: X%
- Test Framework: AL Test Toolkit

## Test Scenarios
### Scenario 1: [Name]
**Given**: [Precondition]  
**When**: [Action]  
**Then**: [Expected result]

### Scenario 2: [Name]
...

## Test Data Requirements
[Library codeunits, fixtures]

## Dependencies
- Required test codeunits
- Test permissions needed

## Execution Plan
1. [Step 1]
2. [Step 2]

## Next Steps
Proceed with: al-conductor mode (TDD) OR al-developer mode (direct implementation)
```

**Updates**: `.github/testing/<feature>-coverage.md` (after test runs)

**Reads**:
- `.github/specs/*.spec.md`
- `.github/plans/*.md`

### 🌐 al-api
**Creates**: `.github/api/<endpoint>-design.md`

**Template**:
```markdown
# API Design: <Endpoint Name>

**Date**: YYYY-MM-DD  
**Type**: REST/OData  
**Author**: al-api

## Endpoint Overview
**Path**: `/api/v1/<resource>`  
**Methods**: GET, POST, PUT, DELETE  
**Authentication**: OAuth2.0

## Data Model
[Entities exposed]

## Request/Response Examples
### GET
```json
{
  "id": "123",
  "name": "Example"
}
```

## Security Considerations
- Permission sets required
- Rate limiting
- Data filtering

## Implementation Notes
[AL API Page patterns]

## Next Steps
Proceed with: al-conductor mode (structured TDD) OR al-developer mode
```

**Reads**:
- `.github/context/architecture/*.md`
- `.github/specs/*.spec.md`

### 🤖 al-copilot
**Creates**: `.github/copilot/<feature>-ux-design.md`

**Template**:
```markdown
# Copilot UX Design: <Feature Name>

**Date**: YYYY-MM-DD  
**Capability**: [Brief description]  
**Author**: al-copilot

## User Experience Flow
1. User triggers: [Action]
2. Copilot prompts: [Interaction]
3. AI processes: [Backend]
4. User receives: [Result]

## PromptDialog Design
[Areas: Input, Content, PromptGuide]

## AI Integration
- Azure OpenAI model: [Model]
- System prompt template
- Function calling structure

## Responsible AI Considerations
- Transparency
- Fairness
- Privacy

## Implementation Components
- Capability enum
- Install codeunit
- PromptDialog page
- AI processing codeunit

## Next Steps
Proceed with: @workspace use al-copilot-capability OR al-conductor mode
```

**Reads**:
- `.github/context/project-context.md`
- `.github/specs/*.spec.md`

### 🎭 al-conductor
**Creates**:
- `.github/plans/<task>-plan.md` (after user approval)
- `.github/plans/<task>-phase-<N>-complete.md` (after each phase commit)
- `.github/plans/<task>-complete.md` (final report)

**Reads**:
- `.github/context/architecture/<feature>-arch.md` (if from al-architect)
- `.github/specs/<feature>.spec.md` (if from al-spec.create)
- `.github/testing/<feature>-test-plan.md` (if from al-tester)
- `.github/api/<endpoint>-design.md` (if from al-api)

### 🔍 AL Planning Subagent (Orchestra)
**No file creation** - Returns research to al-conductor

**Reads**:
- All `.github/context/` files
- All `.github/specs/` files
- All `.github/context/architecture/` files

### 💻 AL Implementation Subagent (Orchestra)
**No file creation** - Implements code per conductor instructions

**Reads**:
- Current plan from al-conductor
- `.github/specs/` for object structure
- `.github/context/architecture/` for patterns

### ✅ AL Code Review Subagent (Orchestra)
**No file creation** - Returns review results to al-conductor

**Reads**:
- Current phase code
- Plan requirements
- AL best practices guidelines

## Workflow Examples

### Example 1: New Feature (MEDIUM Complexity)

```
1. User provides requirements.md
2. Use al-architect mode
   → Creates: .github/context/architecture/customer-loyalty-arch.md
3. Use al-conductor mode
   → Reads: architecture file
   → AL Planning Subagent reads: all context
   → Creates: .github/plans/customer-loyalty-plan.md (after approval)
   → AL Implementation Subagent implements Phase 1
   → AL Code Review Subagent validates
   → Creates: .github/plans/customer-loyalty-phase-1-complete.md
   → Repeat for remaining phases
   → Creates: .github/plans/customer-loyalty-complete.md
```

### Example 2: Bug Investigation

```
1. User reports issue
2. Use al-debugger mode
   → Reads: .github/context/project-context.md
   → Reads: .github/plans/*.md (recent changes)
   → Creates: .github/debug/sales-posting-error-diagnosis.md
3. Use al-developer mode (if simple fix)
   OR Use al-conductor mode (if complex, requires TDD)
```

### Example 3: API Development

```
1. User needs API endpoint
2. Use al-api mode (design)
   → Reads: .github/context/architecture/*.md
   → Creates: .github/api/customer-endpoint-design.md
3. Use al-conductor mode (implementation)
   → Reads: API design
   → Structured TDD implementation
```

## File Naming Conventions

- Use **kebab-case**: `customer-loyalty-plan.md`
- Use **descriptive names**: `sales-order-posting-fix-diagnosis.md`
- Include **date** in content, not filename
- Use **feature/issue name** as base: `<feature>-<type>.md`

## Context File Lifecycles

| File Type | Created | Updated | Archived |
|-----------|---------|---------|----------|
| Architecture | al-architect | Manual (ADR) | Never (reference) |
| Plans | al-conductor | Never | After 6 months |
| Specs | al-spec.create | Manual | When superseded |
| Debug | al-debugger | Never | After issue closed |
| Testing | al-tester | al-tester (coverage) | After feature complete |
| API | al-api | Manual (version updates) | When deprecated |

## Best Practices

### For Agents

1. **Always check for existing context** before creating new files
2. **Read relevant context files** before making decisions
3. **Use consistent templates** for file structure
4. **Include dates and authors** in all files
5. **Reference other files** using relative links
6. **Keep files focused** - one concern per file

### For Users

1. **Run `@workspace use al-context.create`** at project start
2. **Update `session-memory.md`** via `@workspace use al-memory.create` periodically
3. **Review architecture files** before major changes
4. **Archive completed plans** to keep directory clean
5. **Use specs for clear object structure** before implementation

## Integration with Workflows

### al-spec.create workflow
Creates: `.github/specs/<feature>.spec.md`

### al-context.create workflow
Creates: `.github/context/project-context.md`

### al-memory.create workflow
Creates/Updates: `.github/context/session-memory.md`

## Version History

- **v1.0.0** (2025-11-10): Initial Agent Context System design

---

**Implementation Status**: 🚧 Pending - Requires agent updates to implement file creation/reading
