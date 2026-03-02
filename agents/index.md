# Agents - ALDC Core v1.1

**Role-based specialists** implemented as `.agent.md` files for AL development in Business Central.

## Public Agents (4)

| Agent | Purpose | Loads Skills |
|-------|---------|--------------|
| [@al-architect](al-architect.agent.md) | Solution architecture & design | skill-api, skill-copilot, skill-performance, skill-events, skill-testing |
| [@al-conductor](al-conductor.agent.md) | TDD orchestration: Planning → Implementation → Review → Commit | skill-testing |
| [@al-developer](al-developer.agent.md) | Tactical implementation with full build tools | skill-debug, skill-api, skill-copilot, skill-events, skill-permissions, skill-pages, skill-migrate, skill-translate, skill-performance |
| [@al-presales](al-presales.agent.md) | Project estimation & pre-sales analysis | skill-estimation |

## Subagents (3)

| Agent | Purpose | Invoked By |
|-------|---------|------------|
| [al-planning-subagent](al-planning-subagent.agent.md) | AL-aware research & context gathering | @al-conductor |
| [al-implement-subagent](al-implement-subagent.agent.md) | TDD implementation (RED→GREEN→REFACTOR) | @al-conductor |
| [al-review-subagent](al-review-subagent.agent.md) | Code review and quality gates | @al-conductor |

## Agent Selection Guide

| Need | Agent |
|------|-------|
| Design a solution | @al-architect |
| Implement a feature (simple) | @al-developer |
| Implement a feature (complex, TDD) | @al-conductor |
| Estimate a project | @al-presales |

## Requirement Contracts

All agents read/write to `.github/plans/`:
- `{req_name}.spec.md` — Technical specification
- `{req_name}.architecture.md` — Architectural design
- `{req_name}.test-plan.md` — Test strategy
- `memory.md` — Global memory (append-only)

---

**Version**: 1.1.0
**Last Updated**: 2026-03-01
