# Agents - ALDC Core v1.1

**Role-based specialists** implemented as `.agent.md` files for AL development in Business Central.

## Public Agents (4)

| Agent | Purpose | Loads Skills |
|-------|---------|--------------|
| [@AL Architecture & Design Specialist](al-architect.agent.md) | Solution architecture & design | skill-api, skill-copilot, skill-performance, skill-events, skill-testing |
| [@AL Development Conductor](al-conductor.agent.md) | TDD orchestration: Planning → Implementation → Review → Commit | skill-testing |
| [@AL Implementation Specialist](al-developer.agent.md) | Tactical implementation with full build tools | skill-debug, skill-api, skill-copilot, skill-events, skill-permissions, skill-pages, skill-migrate, skill-translate, skill-performance |
| [@AL Pre-Sales & Project Estimation Specialist](al-presales.agent.md) | Project estimation & pre-sales analysis | skill-estimation |

## Subagents (3)

| Agent | Purpose | Invoked By |
|-------|---------|------------|
| [AL Planning Subagent](al-planning-subagent.agent.md) | AL-aware research & context gathering | @AL Development Conductor |
| [AL Implementation Subagent](al-implement-subagent.agent.md) | TDD implementation (RED→GREEN→REFACTOR) | @AL Development Conductor |
| [AL Code Review Subagent](al-review-subagent.agent.md) | Code review and quality gates | @AL Development Conductor |

## Agent Selection Guide

| Need | Agent |
|------|-------|
| Design a solution | @AL Architecture & Design Specialist |
| Implement a feature (simple) | @AL Implementation Specialist |
| Implement a feature (complex, TDD) | @AL Development Conductor |
| Estimate a project | @AL Pre-Sales & Project Estimation Specialist |

## Requirement Contracts

All agents read/write to `.github/plans/`:
- `{req_name}.spec.md` — Technical specification
- `{req_name}.architecture.md` — Architectural design
- `{req_name}.test-plan.md` — Test strategy
- `memory.md` — Global memory (append-only)

---

**Version**: 1.1.0
**Last Updated**: 2026-03-01
