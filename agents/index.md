# Agents - Role-Based Specialists

**Role-based strategic consultants** implemented as `.agent.md` files with **MCP Tool Boundaries** for specialized AL development guidance in Business Central.

## How to Use Agents

Activate agents explicitly for strategic consultation:
```
Use al-architect
Use al-conductor
Use al-debugger
```

## Available Agents

### Strategic Specialists (7)

| Agent | Purpose |
|-------|---------|
| [al-architect](al-architect.agent.md) | Solution architecture & design |
| [al-developer](al-developer.agent.md) | Tactical implementation with full build tools |
| [al-debugger](al-debugger.agent.md) | Deep debugging & diagnosis |
| [al-tester](al-tester.agent.md) | Testing strategy & TDD |
| [al-api](al-api.agent.md) | API development specialist |
| [al-copilot](al-copilot.agent.md) | AI/Copilot feature development |
| [al-presales](al-presales.agent.md) | Project estimation & pre-sales analysis |

### Orchestra System (4)

| Agent | Purpose |
|-------|---------|
| [al-conductor](al-conductor.agent.md) | TDD orchestration: Planning → Implementation → Review → Commit |
| [al-planning-subagent](al-planning-subagent.agent.md) | Specification and test design |
| [al-implement-subagent](al-implement-subagent.agent.md) | Code implementation under conductor |
| [al-review-subagent](al-review-subagent.agent.md) | Code review and quality gates |

## Agent Selection Guide

| Need | Agent |
|------|-------|
| Design a solution | al-architect |
| Implement a feature | al-developer (simple) or al-conductor (complex) |
| Debug an issue | al-debugger |
| Write tests | al-tester |
| Build an API | al-api |
| Add AI features | al-copilot |
| Estimate a project | al-presales |

## Learn More

- [Full Documentation](../docs/agents/index.md)
- [Getting Started](../docs/getting-started.md)
- [AL Development Collection](../docs/al-development-collection.md)

---

**Version**: 2.11.0  
**Last Updated**: 2026-02-06
