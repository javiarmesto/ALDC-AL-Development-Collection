# Architecture Details

Detailed exploration of the AI Native-Instructions Architecture implementation.

## Component Structure

### Instructions Files

**Purpose**: Auto-applied persistent guidelines

**Structure**:

```yaml
---
applyTo:
  - "**/*.al"
  - "**/*.json"
priority: 100
---

# Instruction content in Markdown
```

**Features**:

- Glob pattern matching for automatic application
- Priority ordering for conflict resolution
- Persistent across sessions
- Context-aware loading

### Prompt Files

**Purpose**: Complete task execution workflows

**Structure**:

```yaml
---
name: al-workspace
description: Initialize AL workspace configuration
model: claude-sonnet-4.5
---

# Task description and execution steps
```

**Features**:

- Invoked explicitly via `@workspace use <name>`
- Model-specific targeting
- Multi-step validation gates
- Structured output requirements

### Agent Files

**Purpose**: Role-based specialist modes

**Structure**:

```yaml
---
description: Strategic architect for AL solutions
tools:
  - semantic_search
  - read_file
  - list_dir
---

# Role definition and capabilities
```

**Features**:

- Tool boundary enforcement
- Specialized knowledge domains
- MCP integration
- Security isolation

## File Naming Conventions

| Type | Pattern | Example |
|:-----|:--------|:--------|
| **Instruction** | `*.instructions.md` | `al-guidelines.instructions.md` |
| **Prompt** | `*.prompt.md` | `al-workspace.prompt.md` |
| **Agent** | `*.agent.md` | `al-architect.agent.md` |

## Directory Structure

```
AL-Development-Collection-for-GitHub-Copilot/
├── instructions/           # Auto-applied guidelines
│   ├── al-guidelines.instructions.md
│   ├── al-code-style.instructions.md
│   └── ...
├── prompts/               # Agentic workflows
│   ├── al-workspace.prompt.md
│   ├── al-build.prompt.md
│   └── ...
├── agents/             # 4 public agents + 3 internal subagents
│   ├── al-architect.agent.md
│   ├── al-developer.agent.md
│   ├── al-conductor.agent.md
│   ├── al-presales.agent.md
│   ├── al-planning-subagent.agent.md
│   ├── al-implement-subagent.agent.md
│   └── al-review-subagent.agent.md
├── skills/             # 11 composable skills
│   └── ...
└── collections/           # Collection manifest
    └── al-development.collection.yml
```

## Context Loading Strategy

### Automatic Loading

Instructions are loaded automatically based on `applyTo` patterns:

```yaml
applyTo:
  - "**/*.al"          # All AL files
  - "src/**/*.json"    # JSON in src/
  - "!test/**"         # Exclude test files
```

### Explicit Invocation

Prompts are invoked explicitly:

```bash
@workspace use al-workspace
```

### Mode Switching

Agents are activated via mode selection:

```text
@AL Architecture & Design Specialist

I need to [describe your requirement]
```

## Priority System

When multiple instructions apply to the same file:

1. **Explicit priority** in frontmatter (higher = more priority)
2. **Specificity** of `applyTo` pattern (more specific = higher priority)
3. **Alphabetical order** as tie-breaker

Example:

```yaml
# High priority
priority: 100

# Medium priority (default)
priority: 50

# Low priority
priority: 10
```

## Validation System

The collection includes a validation tool (`validate-al-collection.js`) that checks:

- ✅ Valid YAML frontmatter
- ✅ Required fields present
- ✅ File naming conventions
- ✅ No duplicate names
- ✅ Valid `applyTo` patterns
- ✅ Cross-platform compatibility

Run validation:

```bash
npm run validate
```

## Extension Points

### Adding New Instructions

1. Create file: `your-name.instructions.md`
2. Add frontmatter with `applyTo` patterns
3. Write guidelines in Markdown
4. Validate and test

### Adding New Prompts

1. Create file: `your-name.prompt.md`
2. Add frontmatter with name and description
3. Define workflow steps
4. Validate and test

### Adding New Agents

1. Create file: `your-name.agent.md`
2. Add frontmatter with description and tools
3. Define role and capabilities
4. Validate and test

## Best Practices

!!! tip "Optimization Tips"
    - Keep instructions focused and specific
    - Use precise `applyTo` patterns
    - Document all assumptions
    - Include validation criteria
    - Test with real-world scenarios

!!! warning "Common Pitfalls"
    - Overly broad `applyTo` patterns
    - Conflicting instructions without priorities
    - Missing required frontmatter fields
    - Inconsistent naming conventions

## Performance Considerations

- **Context Size**: Instructions add to token count
- **Pattern Matching**: Complex globs impact loading time
- **Priority Evaluation**: Many rules require more processing

**Optimization Strategies**:

- Use specific patterns over wildcards
- Set appropriate priorities
- Group related rules
- Exclude unnecessary paths

## Learn More

- [Framework Overview](overview.md)
- [Getting Started](../getting-started.md)
- [Contributing Guide](../CONTRIBUTING.md)
