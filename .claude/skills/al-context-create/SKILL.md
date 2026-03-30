---
name: al-context-create
description: >
  Generate or update context.md file documenting project structure, architecture,
  and key patterns for AI assistants and developers. Use when you need to create
  project context documentation or update the context file.
allowed-tools: Read Grep Glob Write Edit Bash
disable-model-invocation: true
---

# AL Context File Generator

Generate a comprehensive `context.md` file that serves as the **master context document** for AI assistants and developers working on this AL/Business Central project.

## Purpose

The `context.md` file provides:
- **Project Overview**: What this extension does and its business purpose
- **Architecture Snapshot**: How the code is organized and key patterns used
- **Critical Decisions**: Important architectural choices and their rationale
- **Integration Points**: Dependencies, events, APIs exposed/consumed
- **Quick Navigation**: Where to find specific functionality

This enables AI assistants to load complete project context quickly and make informed suggestions.

## Execution Steps

### 1. Analyze Project Structure

**Load project metadata:**
```powershell
# Get app.json configuration
@read_file app.json

# Understand dependencies
@al_get_package_dependencies

# Map directory structure
@list_dir src/
```

**Identify key patterns:**
```powershell
# Find all table extensions
@search "tableextension" *.al

# Find all page extensions
@search "pageextension" *.al

# Find event subscribers
@search "EventSubscriber" *.al

# Find published integration events
@search "IntegrationEvent" *.al

# Find API pages
@search "APIPublisher\|APIVersion" *.al
```

### 2. Analyze Business Domain

**Understand what the extension does:**
- Read README.md if exists
- Analyze table/page names to understand business entities
- Check codeunit names for business processes
- Review comments and XML docs for business rules

**Key questions to answer:**
- What business problem does this solve?
- Who are the end users?
- What standard BC functionality does it extend?
- What industry/vertical is this for (if applicable)?

### 3. Document Architecture Patterns

**Identify and document:**
- **Organization Strategy**: Feature-based vs object-type folders?
- **Naming Conventions**: Prefixes, suffixes, patterns used
- **Extension Patterns**: How are standard objects extended?
- **Event Usage**: Subscriber patterns, custom events published
- **Data Model**: Key tables and their relationships
- **Processing Logic**: Main codeunits and their responsibilities
- **UI Structure**: Page organization and user flows

### 4. Map Integration Points

**Document:**
- **Dependencies**: What other extensions are required?
- **Events Subscribed**: Which standard BC events are hooked?
- **Events Published**: What integration events does this extension provide?
- **APIs**: REST/OData endpoints exposed
- **External Integrations**: External systems connected (if any)
- **Web Services**: SOAP services published (if any)

### 5. Capture Critical Decisions

**Document key architectural choices:**
- Why certain tables are structured in specific ways
- Why specific event patterns were chosen
- Performance optimization decisions
- Security/permission design rationale
- Any constraints or limitations to be aware of

### 6. Generate context.md

Create the file at project root with this structure:

```markdown
# Project Context - [Extension Name]

> **Auto-generated**: [Date]  
> **Purpose**: Master context document for AI assistants and developers

## 1. Project Overview

### Business Purpose
[What business problem does this extension solve?]

### Target Users
- [User role 1]: [What they do with this extension]
- [User role 2]: [What they do with this extension]

### Extension Metadata
- **App ID**: [from app.json]
- **Version**: [current version]
- **Publisher**: [publisher name]
- **Platform**: [Business Central version target]
- **License**: [if applicable]

## 2. Architecture Overview

### Organization Strategy
[Describe how code is organized - feature-based folders, naming patterns, etc.]

```
src/
├── [Feature1]/
│   ├── Data/          # Tables, table extensions
│   ├── Processing/    # Codeunits, business logic
│   └── UI/            # Pages, page extensions
└── [Feature2]/
    └── ...
```

### Key Design Patterns
- **[Pattern 1]**: [Description and rationale]
- **[Pattern 2]**: [Description and rationale]

### Naming Conventions
- **Tables**: [Pattern, e.g., "Prefix_EntityName"]
- **Pages**: [Pattern]
- **Codeunits**: [Pattern]
- **Fields**: [Pattern]
- **Variables**: [Pattern]

## 3. Data Model

### Core Tables
| Table | Object ID | Purpose | Key Relationships |
|-------|-----------|---------|-------------------|
| [Table 1] | [ID] | [Purpose] | → [Related tables] |
| [Table 2] | [ID] | [Purpose] | → [Related tables] |

### Table Extensions
| Extends | New Fields | Purpose |
|---------|------------|---------|
| [Standard Table] | [Field 1, Field 2] | [Why extended] |

### Key FlowFields
- **[Table].[FlowField]**: [What it calculates and why]

## 4. Processing Logic

### Main Codeunits
| Codeunit | Purpose | Key Methods |
|----------|---------|-------------|
| [Name] | [Responsibility] | [Method1(), Method2()] |

### Business Flows
1. **[Flow Name]** (e.g., "Order Approval Flow")
   - Entry point: [Where it starts]
   - Steps: [Key processing steps]
   - Events: [Events published/subscribed]
   - Output: [What it produces]

## 5. UI Structure

### Main Pages
| Page | Type | Purpose | Extends |
|------|------|---------|---------|
| [Page Name] | Card/List/Document | [Purpose] | [Base page if extension] |

### User Flows
1. **[User Task]**: [Navigation path and steps]

## 6. Integration Points

### Dependencies
```json
[List key dependencies from app.json]
```

### Event Subscribers
| Event | Publisher | Purpose |
|-------|-----------|---------|
| OnBefore[Action] | [Standard Codeunit] | [Why subscribed] |

### Published Events
| Event | Purpose | When to Subscribe |
|-------|---------|-------------------|
| OnBefore[CustomAction] | [Purpose] | [Use cases for consumers] |

### APIs / Web Services
- **[API Name]**: [Endpoint, purpose, auth method]

### External Systems
- **[System Name]**: [Integration type, data exchanged]

## 7. Critical Decisions & Rationale

### Decision 1: [Title]
**Problem**: [What problem was being solved]  
**Decision**: [What was decided]  
**Rationale**: [Why this approach]  
**Trade-offs**: [What was given up]

### Decision 2: [Title]
[Same structure]

## 8. Performance Considerations

- **[Optimization 1]**: [Description, where implemented]
- **[Optimization 2]**: [Description, where implemented]

### Known Bottlenecks
- **[Area]**: [Description and mitigation strategy]

## 9. Security & Permissions

### Permission Sets
- **[Permission Set]**: [Purpose, scope]

### Data Security
- [How sensitive data is protected]

## 10. Testing Strategy

### Test Coverage
- Unit tests: [Scope]
- Integration tests: [Scope]
- UI tests: [Scope if any]

### Test Data
- [How test data is generated/managed]

## 11. Quick Navigation Guide

### To Find...
- **Customer-related logic**: `src/[FeatureFolder]/`
- **Posting logic**: `src/[ProcessingFolder]/`
- **API endpoints**: `src/[APIFolder]/`
- **Event subscribers**: Search for `[EventSubscriber]`

### Common Tasks
- **Adding a new field**: [Process/pattern to follow]
- **Subscribing to events**: [Pattern/location]
- **Creating API endpoint**: [Pattern/location]

## 12. Known Limitations

- **[Limitation 1]**: [Description and workaround if any]
- **[Limitation 2]**: [Description and workaround if any]

## 13. Future Roadmap

- **Planned Features**: [If documented]
- **Deprecations**: [Anything being phased out]

## 14. Development Guidelines

### Before Making Changes
1. [Guideline 1]
2. [Guideline 2]

### Code Review Checklist
- [ ] Follows naming conventions
- [ ] XML documentation added
- [ ] Events used instead of modifications
- [ ] Permission sets updated
- [ ] Tests added/updated

## 15. Useful Commands

```powershell
# Build project
al_build

# Download symbols
al_downloadsymbols

# Run tests
@workspace /al-test

# Generate permissions
al_generatepermissionset
```

## 16. References

- **Documentation**: [Link to detailed docs if exists]
- **Wiki**: [Link to wiki if exists]
- **Related Extensions**: [Dependencies or companion extensions]

---
---

**Maintenance**: Update this file when:
- Major architectural changes occur
- New features/modules are added
- Integration points change
- Critical decisions are made

**Usage**: AI assistants should load this file first when providing assistance on this project.
```

### 7. Validation Gates

**Before finalizing:**
- ✅ File is under 500 lines for quick loading
- ✅ All sections have actual content (remove empty sections)
- ✅ Links to code examples are accurate
- ✅ Metadata from app.json is correct
- ✅ Architecture diagrams are clear
- ✅ Navigation paths are tested

### 8. Placement & Integration

**Where to create:**
- Place `context.md` at project root (next to app.json)
- If multiple projects, create in each project root

**Git configuration:**
```gitignore
# Add to .gitignore if context contains sensitive info:
# context.md
```

**README integration:**
Update README.md to reference context.md:
```markdown
## For AI Assistants
See [context.md](./context.md) for complete project context.
```

## Output Format

Deliver:
1. ✅ Complete `context.md` file at project root
2. ✅ Summary of what was documented
3. ✅ List of any sections that need manual review/input
4. ✅ Recommendation on update frequency

## Key Principles

- **Concise but Complete**: Include everything AI needs, nothing it doesn't
- **Code-Focused**: Link to actual code, not just describe
- **Living Document**: Easy to update as project evolves
- **Quick Load**: Optimized for AI context window efficiency
- **Self-Contained**: Should make sense without external docs

## Success Criteria

A successful `context.md` enables:
- ✅ New AI assistant can understand project in <2 minutes
- ✅ Developers can orient themselves quickly
- ✅ Architectural decisions are clear and justified
- ✅ Navigation to specific functionality is straightforward
- ✅ Integration points are well-documented
