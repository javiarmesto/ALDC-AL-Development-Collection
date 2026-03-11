# BC Agent Builder

> Optional component for building Business Central Agents with the AI Development Toolkit and Agent SDK.

## Contents

| Type | Name | Description |
|------|------|-------------|
| Agent | @AL Agent Builder | Specialist in designing and coding BC agents (Designer + SDK paths) |
| Skill | skill-agent-instructions | Generate/review natural language instructions for BC agents |
| Skill | skill-agent-task-patterns | 8 task integration patterns (Public API, Page Action, Business Event, etc.) |
| Skill | skill-agent-toolkit | Agent SDK reference: interfaces, setup patterns, troubleshooting, quality checklist |
| Workflow | al-agent.create | End-to-end coded agent creation (7 phases with gates) |
| Workflow | al-agent.task | Generate task integration code |
| Workflow | al-agent.instructions | Generate optimized agent instructions |
| Workflow | al-agent.test | Test agent SDK integration (6 categories) |
| Instruction | al-agent-toolkit | Agent SDK reference and conventions |
| Tool | scaffold_agent.py | Python scaffolder for Agent Template structure |
| Tool | validate_agent_config.sh | Bash validator for agent SDK configuration |
| Reference | agent-keywords-reference | Official instruction keywords quick reference |
| Example | simple-instructions.txt | Minimal single-task agent (credit check) |
| Example | advanced-instructions.txt | Multi-task with handoff (lead qualification) |

## Integration with ALDC Core

### Standalone mode (LOW complexity / prototyping)

Invoke the agent builder directly:
```
@AL Agent Builder
Create an agent for [purpose]
```
The agent runs its own 7-phase workflow with HITL gates.

### Integrated with Core (MEDIUM/HIGH complexity / production)

```
@AL Architecture & Design Specialist (loads skill-agent-task-patterns + skill-agent-instructions)
  → designs agent: interfaces, patterns, permissions, profile
  → generates architecture.md

al-spec.create
  → details AL objects for the agent
  → generates spec.md

@AL Development Conductor
  → implements with TDD
  → implement-subagent loads skill-agent-task-patterns for correct SDK usage
  → review-subagent validates against SDK patterns
```

### Skills loading by ALDC agents

| ALDC Agent | Loads these skills |
|------------|---------------------|
| @AL Architecture & Design Specialist | skill-agent-task-patterns (architecture decisions), skill-agent-instructions (instruction design) |
| AL Implementation Subagent | skill-agent-task-patterns (correct SDK code generation) |
| AL Code Review Subagent | skill-agent-task-patterns (SDK compliance check) |
| @AL Implementation Specialist | skill-agent-task-patterns (quick fixes) |

## Validation

```bash
# Validate agent project structure and SDK compliance
./tools/bc-agents/validate_agent_config.sh <project-dir>

# Scaffold new agent from template
python tools/bc-agents/scaffold_agent.py --name "My Agent" --prefix "MA" --range 52100-52199
```

## Requirements

- ALDC Core v1.1 (for integrated mode)
- Business Central v25+ with AI Development Toolkit
- GitHub Copilot or Claude Code

## References

- [AI Development Toolkit Overview](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-overview)
- [Agent SDK Task API](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-tasks-api)
- [Agent Instructions](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-instructions)
- [Agent Permissions & Profiles](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-permissions-profiles)
