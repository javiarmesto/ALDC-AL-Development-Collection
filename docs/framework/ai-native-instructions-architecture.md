# AI Native-Instructions Architecture Implementation

This document describes the implementation of the AI Native-Instructions Architecture framework in this repository, following the principles from [danielmeppiel.github.io/awesome-ai-native](https://danielmeppiel.github.io/awesome-ai-native/docs/getting-started/).

## What Changed

This repository has been refactored to follow the **AI Native-Instructions Architecture** principles, which provides a systematic approach to building AI Native Development workflows through:

1. **Markdown Prompt Engineering** - Structured instructions using semantic markdown
2. **Agent Primitives** - Configurable tools (instructions, agents, prompts)
3. **Context Engineering** - Strategic management of LLM context windows

## Repository Structure

All Agent Primitives now reside in the `.github/` directory following VSCode Copilot conventions:

```
AL-Development-Collection-for-GitHub-Copilot
├── copilot-instructions.md              # Master integration guide
├── instructions/                        # Modular, context-scoped guidelines
│   ├── al-guidelines.instructions.md    # (applyTo: **/*.{al,json})
│   ├── al-code-style.instructions.md    # (applyTo: **/*.al)
│   ├── al-naming-conventions.instructions.md
│   ├── al-performance.instructions.md
│   ├── al-error-handling.instructions.md
│   ├── al-events.instructions.md
│   └── al-testing.instructions.md       # (applyTo: **/test/**/*.al)
├── prompts/                             # Agentic workflows
│   ├── al-workspace.prompt.md
│   ├── al-build.prompt.md
│   ├── al-debug.prompt.md
│   ├── al-events.prompt.md
│   ├── al-performance.prompt.md
│   ├── al-permissions.prompt.md
│   ├── al-troubleshoot.prompt.md
│   ├── al-migrate.prompt.md
│   ├── al-pages.prompt.md
│   └── al-workflow.prompt.md
└── agents/                           # Role-based specialists
    ├── al-orchestrator.agent.md
    ├── al-architect.agent.md
    ├── al-debugger.agent.md
    ├── al-tester.agent.md
    ├── al-api.agent.md
    └── al-copilot.agent.md
```

## Key Improvements

### 1. Instructions with `applyTo` Patterns

All instruction files now use the `applyTo` frontmatter field instead of `globs` for selective context loading:

```yaml
---
applyTo: "**/*.al"
description: "AL Code structure, formatting, and folder organization guidelines"
---
```

This enables **Context Engineering** by loading only relevant instructions for the current file type.

### 2. Agents with Tool Boundaries

All agent files now include:
- **Explicit tool lists** - Security through MCP tool boundaries
- **Model specification** - Claude Sonnet 4 for strategic modes
- **Tool Boundaries section** - Clear CAN/CANNOT lists

Example:
```yaml
---
description: 'AL Architecture specialist'
tools: ['codebase', 'search', 'usages', 'al_get_package_dependencies']
model: Claude Sonnet 4.5
---

## Tool Boundaries

**CAN:**
- Analyze codebase structure
- Design solution architecture

**CANNOT:**
- Execute builds or deployments
- Modify production code
```

This prevents security breaches and cross-domain interference, like professional licensing.

### 3. Prompts as Agentic Workflows

All prompt files now include:
- **Model specification** - gpt-4 for execution workflows
- **Context Loading Phase** - Links to relevant instructions
- **Structured Output Requirements** - Checklists for deliverables
- **Human Validation Gates** - Explicit approval points

Example:
```yaml
---
mode: 'agent'
description: 'Complete end-to-end AL development workflow'
tools: ['al_build', 'al_package', 'al_publish']
model: gpt-4
---

## Context Loading Phase
Review [AL Guidelines](../instructions/al-guidelines.instructions.md)

## Structured Output Requirements
- [ ] Code follows naming conventions
- [ ] Build succeeds without warnings
- [ ] Tests pass with >90% coverage

## Human Validation Gate
🚨 **STOP**: Confirm architecture alignment before deployment
```

### 4. Enhanced Markdown Prompt Engineering

Instructions now use:
- **Context Loading** - Links to related resources
- **Semantic Headers** - Clear structure for AI reasoning
- **Role Activation** - "You are an expert..." patterns
- **Precision Language** - Unambiguous instructions

## Benefits

### For Developers
- **Clearer tool boundaries** - Know what each mode can/cannot do
- **Better context management** - Instructions load only when needed
- **Systematic workflows** - Structured processes with validation gates
- **Security by design** - Tool boundaries prevent accidents

### For AI Agents
- **Optimized context windows** - Selective instruction loading
- **Deterministic execution** - Clear structured output requirements
- **Professional boundaries** - Like real-world licensing
- **Validation checkpoints** - Human oversight at critical points

## Compliance

The refactored structure is fully compliant with:
- ✅ [VSCode Copilot Customization](https://code.visualstudio.com/docs/copilot/copilot-customization)
- ✅ [AI Native-Instructions Architecture principles](https://danielmeppiel.github.io/awesome-ai-native/docs/getting-started/)
- ✅ Repository validation script (all 34 checks passing)

## Migration Path

### For Users

No changes required! The collection works the same way:

```markdown
# Instructions still auto-apply
# Just code in *.al files

# Prompts work the same
@workspace use al-workspace

# Modes work the same
Use al-architect mode
```

### For Contributors

When adding new files:
1. Place in appropriate `.github/` subdirectory
2. Use proper file extensions (`.instructions.md`, `.prompt.md`, `.agent.md`)
3. Include required frontmatter fields
4. Run `npm run validate` to verify compliance

## Validation

Run validation at any time:

```bash
npm install
npm run validate
```

Expected output:
```
✅ Successes: 34
⚠️  Warnings:  0
❌ Errors:    0

🎉 Collection is fully compliant and ready for contribution!
```

## References

- [AI Native-Instructions Architecture](https://danielmeppiel.github.io/awesome-ai-native/docs/getting-started/)
- [VSCode Copilot Customization](https://code.visualstudio.com/docs/copilot/copilot-customization)
- [AGENTS.md Standard](https://agents.md)
- [GitHub Copilot Agents (Chat Modes)](https://code.visualstudio.com/docs/copilot/chat/chat-modes)

## Version History

- **v2.2** (2025-10-19) - Implemented AI Native-Instructions Architecture
  - Moved all files to `.github/` directory
  - Updated frontmatter with `applyTo`, `model`, and `tools`
  - Added Context Loading, Validation Gates, and Tool Boundaries
  - Enhanced Markdown Prompt Engineering throughout
  - Updated validation script and documentation

---

**Status**: ✅ Fully Compliant with AI Native-Instructions Architecture  
**Last Updated**: 2025-10-19  
**Framework Version**: Based on AI Native Development Guide
