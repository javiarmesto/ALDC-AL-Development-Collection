---
name: Feature Request
about: Suggest an idea or enhancement for the collection
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## 🚀 Feature Request

A clear and concise description of the feature you'd like to see.

## 🎯 Problem Statement

Describe the problem this feature would solve:
- What AL development challenge are you facing?
- How does this align with the A-Instructions Architecture framework?
- Which layer does this affect? (Layer 1: Markdown Prompt Engineering, Layer 2: Agent Primitives, Layer 3: Context Engineering)

## 💡 Proposed Solution

Describe your proposed solution:

### Agent Primitive Type

- [ ] New Instruction (`.instructions.md`)
- [ ] New Agentic Workflow (workflow skill, `skills/al-*/SKILL.md`)
- [ ] New Agent (`.agent.md`)
- [ ] Enhancement to existing primitive
- [ ] Other (please specify)

### Implementation Details

```markdown
If proposing a new primitive, provide a rough outline:

---
description: 'Your description'
applyTo: ['**/*.al']  # Or other pattern
---

# Your Primitive Name

## Purpose
What this primitive does...

## Tool Boundaries (if agent)
CAN:
- Action 1
- Action 2

CANNOT:
- Restriction 1
- Restriction 2
```

## 🔄 Alternatives Considered

Describe any alternative solutions you've considered:
- Could existing primitives be enhanced instead?
- Have you tried combining multiple existing primitives?
- Are there workarounds you're currently using?

## 📊 Use Cases

Provide specific examples of when this feature would be useful:

1. **Use Case 1**: 
2. **Use Case 2**:
3. **Use Case 3**:

## 🎨 User Experience

How would users interact with this feature?

```markdown
Example interaction:
/[new-primitive-name]

Expected output...
```

## 🏗️ Framework Alignment

How does this feature align with the A-Instructions Architecture?

- **Markdown Prompt Engineering**: (How does it use structured markdown?)
- **Agent Primitives**: (What primitive type and why?)
- **Context Engineering**: (What `applyTo` patterns would it use?)

## 📈 Impact Assessment

- **Complexity**: Low / Medium / High
- **Maintenance**: Easy / Moderate / Complex
- **Breaking Changes**: Yes / No
- **Dependencies**: (List any dependencies)

## 📚 Additional Context

Add any other context, screenshots, or examples about the feature request here.

## ✅ Success Criteria

How would we know this feature is successful?

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
