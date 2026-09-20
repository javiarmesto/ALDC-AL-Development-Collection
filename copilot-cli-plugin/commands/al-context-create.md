---
description: Generate or update context.md file documenting project structure, architecture, and key patterns for AI assistants and developers. ALDC workflow (Copilot prompt al-context.create); invoke explicitly.
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
> Editor debugger controls remain separate from semantic navigation. Official AL
> MCP selectors use al/<tool>; only Developer/Implementer receive compile/build/
> restore. Discover the actual callable names and pass the correct App/Test path.
> No official publish/authentication tool is granted by this adapter. Triage alone
> receives the optional dedicated bc-profiling and bc-snapshot proxies; discover
> their schemas and confirm an authorized target/window before capture. Other
> roles consume evidence. Capture does not prove autonomous snapshot debugging.
> Symbol MCP: before any tools/call, verify AL CLI prerequisites are already
> provisioned; this provider may auto-install AL tools on first use. A read-only
> role must return that prerequisite to the caller, never bootstrap software.
> Load symbols via al_packages(action: load, path: absolute consumer path).
> The MCP process may run from the plugin cache; never assume its cwd is the
> consumer. Use the discovered schema and report missing .app packages explicitly.
> Record missing capabilities and unexecuted checks explicitly; never simulate.


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
official AL MCP dependency query when granted, or manifest/symbol inspection

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
official AL MCP build when granted, or verified project build/package command

# Download symbols
official AL MCP symbol restore when granted, or verified terminal restore

# Run tests
/al-test

# Generate permissions
reviewed permission-set authoring through file tools
```

## 16. References

- **Documentation**: [Link to detailed docs if exists]
- **Wiki**: [Link to wiki if exists]
- **Related Extensions**: [Dependencies or companion extensions]

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
