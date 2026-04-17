---
name: New Agent Primitive
about: Propose a new Instruction, Agentic Workflow, or Agent
title: '[NEW PRIMITIVE] '
labels: new-primitive, enhancement
assignees: ''
---

## 🎯 Agent Primitive Proposal

### Primitive Details

**Name**: (e.g., `al-integration-testing`)
**Type**: 
- [ ] Instruction (`.instructions.md`)
- [ ] Agentic Workflow (`.prompt.md`)
- [ ] Agent (`.agent.md`)

**Category**: (e.g., Testing, Performance, Integration, Architecture)

## 📋 Description

Provide a clear, concise description of what this primitive does and why it's needed.

## 🎨 Frontmatter

```yaml
---
description: 'Your one-line description (max 100 chars)'
applyTo: ['**/*.al']  # Or specific pattern for instructions
# For agents, include:
# tools: [files, workspace_search, etc.]
# mcp: { allowed: [...], forbidden: [...] }
---
```

## 📝 Content Outline

### For Instructions

```markdown
# [Primitive Name]

## Rule 1: [Rule Title]

### Intent
What this rule accomplishes and why it matters.

### Implementation
How to implement this rule.

### Examples

#### ✅ Good Example
\`\`\`al
// Example of correct implementation
\`\`\`

#### ❌ Bad Example
\`\`\`al
// Example of what to avoid
\`\`\`

### Context Engineering
- **applyTo Pattern**: `**/*.al` (or more specific)
- **When to Apply**: [Describe conditions]
```

### For Agentic Workflows

```markdown
# [Workflow Name]

## Objective
What this workflow accomplishes.

## Prerequisites
- Required context
- Required tools
- Required knowledge

## Step-by-Step Process

### Step 1: [Step Name]
[Detailed instructions]

### Step 2: [Step Name]
[Detailed instructions]

## Validation Criteria
How to verify success.

## Common Issues & Solutions
Troubleshooting guide.
```

### For Agents

```markdown
# [Mode Name]

## Role & Specialization
Your role and expertise.

## Markdown Prompt Engineering
Core principles this mode follows.

## Tool Boundaries

### CAN
- Capability 1
- Capability 2

### CANNOT
- Restriction 1
- Restriction 2

## Context Engineering
How this mode manages context.

## Interaction Protocol
How users should interact with this mode.

## Example Interactions

### Scenario 1
**User**: [Example request]
**Mode**: [Example response]
```

## 🔗 Related Primitives

List existing primitives that this would complement or extend:
- Primitive 1: (How it relates)
- Primitive 2: (How it relates)

## 🧪 Testing Strategy

How should this primitive be tested?

- [ ] Manual testing with sample AL projects
- [ ] Validation script checks
- [ ] Integration with existing primitives
- [ ] Documentation review

## 📚 Documentation Needs

What documentation changes are needed?

- [ ] Update README.md
- [ ] Update docs/al-development.md
- [ ] Update collection manifest
- [ ] Add examples

## 🎯 Success Metrics

How will we measure if this primitive is successful?

- Metric 1:
- Metric 2:
- Metric 3:

## 👥 Target Users

Who would benefit most from this primitive?

- [ ] Junior AL developers
- [ ] Senior AL developers
- [ ] AL architects
- [ ] Teams/Organizations
- [ ] Specific industry (please specify)

## 🏗️ Implementation Checklist

If you're planning to implement this yourself:

- [ ] Draft primitive content
- [ ] Add frontmatter metadata
- [ ] Create examples
- [ ] Update collection manifest
- [ ] Test with validation script
- [ ] Update documentation
- [ ] Create PR

## 📎 Additional Resources

Links to relevant documentation, examples, or references:
- Microsoft Docs: 
- Related GitHub issues:
- External resources:

## 💬 Discussion

Any additional thoughts, alternatives, or concerns?
