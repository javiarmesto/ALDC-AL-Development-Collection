# AL Development Collection for GitHub Copilot

> **ALDC** — Skills-based, spec-driven, TDD-orchestrated development framework for Microsoft Dynamics 365 Business Central with GitHub Copilot agents.
>
> From vibe coding to controlled engineering.

[![ALDC Core](https://img.shields.io/badge/ALDC%20Core-v1.1%20Compliant-purple.svg)](docs/framework/ALDC-Core-Spec-v1.1.md)
[![Version](https://img.shields.io/badge/version-3.2.0-blue)](CHANGELOG.md)
[![Framework](https://img.shields.io/badge/framework-AI--Native--Instructions-purple)](https://danielmeppiel.github.io/awesome-ai-native/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/javiarmesto/AL-Development-Collection-for-GitHub-Copilot)](https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot/issues)
[![GitHub Stars](https://img.shields.io/github/stars/javiarmesto/AL-Development-Collection-for-GitHub-Copilot)](https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot/stargazers)

---

## What is ALDC?

ALDC (AL Development Collection) transforms how you develop Business Central extensions with GitHub Copilot. Instead of ad-hoc code generation, ALDC provides **structured, contract-driven development** with human-in-the-loop gates.

---

## Key Features

**4 Public Agents** — Specialized roles for every development phase

- `@AL Architecture & Design Specialist` — Solution Architect: designs solutions, information flows, technical decisions
- `@AL Implementation Specialist` — Developer: implements, debugs, quick adjustments
- `@AL Development Conductor` — Conductor: orchestrates TDD implementation with subagents
- `@AL Pre-Sales & Project Estimation Specialist` — Pre-sales: estimation and scoping

**3 Internal Subagents** — Autonomous specialists within the conductor

- `AL Planning Subagent` — Research and context gathering
- `AL Implementation Subagent` — TDD-only implementation (tests FIRST, code SECOND)
- `AL Code Review Subagent` — Code review against spec + architecture

**11 Composable Skills** — Domain knowledge loaded on demand

- Required: api, copilot, debug, performance, events, permissions, testing
- Recommended: migrate, pages, translate, estimation

**6 Workflows** — Automated processes

- `al-spec.create`, `al-build`, `al-pr-prepare`, `al-context.create`, `al-memory.create`, `al-initialize`

**9 Instructions** — Auto-applied coding standards (always active)

- al-guidelines, al-code-style, al-naming-conventions, al-performance, al-error-handling, al-events, al-testing, copilot-instructions, index

**Contracts per Requirement** — Structured documentation in `.github/plans/{req_name}/`

- `{req_name}.architecture.md` — Solution design (from architect)
- `{req_name}.spec.md` — Technical blueprint (from spec.create)
- `{req_name}.test-plan.md` — Test strategy
- `memory.md` — Global context across sessions (in `.github/plans/`)

---

## Development Flow

```text
LOW complexity:
  al-spec.create → @AL Implementation Specialist

MEDIUM/HIGH complexity:
  @AL Architecture & Design Specialist → al-spec.create → @AL Development Conductor
```

The architect designs the solution and can decompose complex requirements into multiple specs, each implemented independently by the conductor.

```mermaid
flowchart TD
    REQ[Requirement] --> CLASSIFY{Complexity?}
    CLASSIFY -->|LOW| SPEC_LOW[al-spec.create]
    SPEC_LOW --> DEV[@AL Implementation Specialist]

    CLASSIFY -->|MEDIUM/HIGH| ARCH[@AL Architecture & Design Specialist]
    ARCH -->|Designs solution| ARCH_DOC[architecture.md]
    ARCH --> DECOMPOSE{Decompose?}
    DECOMPOSE -->|Yes| SPEC_A[al-spec.create → spec-A]
    DECOMPOSE -->|Yes| SPEC_B[al-spec.create → spec-B]
    DECOMPOSE -->|No| SPEC_SINGLE[al-spec.create → spec.md]
    SPEC_A --> COND_A[@AL Development Conductor]
    SPEC_B --> COND_B[@AL Development Conductor]
    SPEC_SINGLE --> COND[@AL Development Conductor]
```

---

## TDD Orchestration

The conductor enforces Test-Driven Development:

```mermaid
flowchart LR
    PLAN[Phase 1\nPlanning] --> IMPL[Phase N\nImplementation]
    IMPL --> REVIEW[Review\nSubagent]
    REVIEW --> HITL{HITL Gate}
    HITL -->|Approved| NEXT[Next Phase]
    HITL -->|Revise| IMPL

    subgraph IMPL_DETAIL[Implement Subagent - TDD]
        RED[RED\nWrite failing tests] --> GREEN[GREEN\nMinimal code]
        GREEN --> REFACTOR[REFACTOR\nAL patterns]
    end
```

1. Planning subagent researches context
2. Implement subagent creates tests FIRST (RED)
3. Implement subagent writes code to pass tests (GREEN)
4. Implement subagent refactors to AL patterns (REFACTOR)
5. Review subagent validates against spec + architecture
6. Human approves each phase (HITL gate)

---

## Framework Architecture

```mermaid
graph TB
    subgraph PUBLIC["Public Agents (user-invocable)"]
        ARCH[@AL Architecture & Design Specialist]
        DEV[@AL Implementation Specialist]
        COND[@AL Development Conductor]
        PRE[@AL Pre-Sales & Project Estimation Specialist]
    end

    subgraph INTERNAL["Internal Subagents (conductor-only)"]
        PLAN[AL Planning Subagent]
        IMPL[AL Implementation Subagent]
        REV[AL Code Review Subagent]
    end

    subgraph SKILLS["11 Composable Skills"]
        S1[skill-api]
        S2[skill-copilot]
        S3[skill-debug]
        S4[skill-performance]
        S5[skill-events]
        S6[skill-permissions]
        S7[skill-testing]
        S8[skill-migrate]
        S9[skill-pages]
        S10[skill-translate]
        S11[skill-estimation]
    end

    subgraph WORKFLOWS["6 Retained Workflows"]
        W1[al-spec.create]
        W2[al-build]
        W3[al-pr-prepare]
        W4[al-context.create]
        W5[al-memory.create]
        W6[al-initialize]
    end

    ARCH --> SKILLS
    DEV --> SKILLS
    COND --> INTERNAL
    PRE --> SKILLS

    W1 --> ARCH
    W1 --> COND
```

---

## Contract Structure

```text
.github/
└── plans/
    ├── memory.md                          ← Global (cross-session context)
    └── {req_name}/
        ├── {req_name}.architecture.md    ← From @AL Architecture & Design Specialist
        ├── {req_name}.spec.md            ← From al-spec.create
        ├── {req_name}.test-plan.md       ← From al-spec.create or conductor
        ├── {req_name}-plan.md            ← From @AL Development Conductor (Planning)
        ├── {req_name}-phase-1-complete.md
        └── {req_name}-phase-N-complete.md
```

---

## Installation

Install from VS Code Marketplace or:

```bash
code --install-extension JavierArmesto.aldc-al-development-collection
```

After installation, use the Command Palette:

- `AL Collection: Install Toolkit to Workspace` — copies framework to your project's `.github/` directory
- `AL Collection: Update Toolkit` — merges new version preserving your customizations
- `AL Collection: Validate Installation` — verifies compliance

---

## Quick Start

1. Install the extension
2. Open your AL project
3. Run: `AL Collection: Install Toolkit to Workspace`
4. Start with: `@workspace use al-spec.create` with your requirement
5. Follow the guided flow

See [QUICKSTART.md](aldc-core-v1.1/docs/framework/QUICKSTART.md) for the full onboarding guide.

---

## Routing Guide

| Complexity | Route | When |
| ---------- | ----- | ---- |
| **LOW** | `al-spec.create` → `@AL Implementation Specialist` | Simple field, validation, single UI change |
| **MEDIUM** | `@AL Architecture & Design Specialist` → `al-spec.create` → `@AL Development Conductor` | Business logic, event-driven feature |
| **HIGH** | `@AL Architecture & Design Specialist` → `al-spec.create` → `@AL Development Conductor` | Multi-module, external integration, architectural change |

**Not sure where to start?**

```text
@AL Architecture & Design Specialist

I need to [describe your requirement]
```

The architect analyzes requirements, designs the solution, and recommends the appropriate workflow.

---

## Validation

```bash
node tools/aldc-validate/index.js --config aldc.yaml
```

Expected result: `✅ ALDC Core v1.1 COMPLIANT`

---

## File Structure

```text
AL-Development-Collection-for-GitHub-Copilot/
├── .github/
│   ├── copilot-instructions.md           # Master coordination (matches instructions/)
│   └── plans/
│       ├── memory.md                     # Global memory (cross-session)
│       └── {req_name}/                   # Per-requirement contracts
│           ├── {req_name}.architecture.md
│           ├── {req_name}.spec.md
│           └── {req_name}.test-plan.md
├── agents/                               # 4 public agents + 3 subagents
│   ├── al-architect.agent.md
│   ├── al-conductor.agent.md
│   ├── al-developer.agent.md
│   ├── al-presales.agent.md
│   ├── al-planning-subagent.agent.md     # user-invocable: false
│   ├── al-implement-subagent.agent.md    # user-invocable: false
│   └── al-review-subagent.agent.md       # user-invocable: false
├── skills/                               # 11 composable skills
│   ├── skill-api/SKILL.md
│   ├── skill-copilot/SKILL.md
│   ├── skill-debug/SKILL.md
│   ├── skill-performance/SKILL.md
│   ├── skill-events/SKILL.md
│   ├── skill-permissions/SKILL.md
│   ├── skill-testing/SKILL.md
│   ├── skill-migrate/SKILL.md
│   ├── skill-pages/SKILL.md
│   ├── skill-translate/SKILL.md
│   └── skill-estimation/SKILL.md
├── prompts/                              # 6 retained workflows
│   ├── al-spec.create.prompt.md
│   ├── al-build.prompt.md
│   ├── al-pr-prepare.prompt.md
│   ├── al-memory.create.prompt.md
│   ├── al-context.create.prompt.md
│   └── al-initialize.prompt.md
├── instructions/                         # 9 auto-applied coding standards
│   ├── copilot-instructions.md
│   ├── al-guidelines.instructions.md
│   ├── al-code-style.instructions.md
│   ├── al-naming-conventions.instructions.md
│   ├── al-performance.instructions.md
│   ├── al-error-handling.instructions.md
│   ├── al-events.instructions.md
│   └── al-testing.instructions.md
├── docs/
│   ├── framework/
│   │   ├── ALDC-Core-Spec-v1.1.md        # Normative specification
│   │   ├── ALDC-Manifesto.md             # Philosophy
│   │   ├── ALDC-Governance.md            # Contribution governance
│   │   ├── ALDC-Compliance-Model.md      # Compliance checklist
│   │   └── ALDC-Architecture-Diagrams.md # Mermaid diagrams
│   └── templates/                        # Immutable contract templates (7)
│       ├── spec-template.md
│       ├── architecture-template.md
│       ├── test-plan-template.md
│       ├── memory-template.md
│       ├── technical-spec-template.md
│       ├── delivery-template.md
│       └── skill-template.md
├── archive/v2.11.0/                      # Archived agents and prompts
├── tools/aldc-validate/                  # ALDC Core validator
├── aldc.yaml                             # Core v1.1 configuration
├── CHANGELOG.md                          # Version history
└── README.md                             # This file

# ALDC Core v1.1: 4 agents + 3 subagents + 11 skills + 6 workflows + 9 instructions
```

---

## What's New in v3.2.0 (ALDC Core v1.1)

- **Skills-based architecture**: 11 composable skills that agents load on demand — api, copilot, debug, performance, events, permissions, testing, migrate, pages, translate, estimation
- **Simplified agent model**: 4 public agents (@AL Architecture & Design Specialist, @AL Implementation Specialist, @AL Development Conductor, @AL Pre-Sales & Project Estimation Specialist) + 3 internal subagents for TDD orchestration
- **Contracts per requirement**: spec, architecture, and test-plan per requirement in `.github/plans/{req_name}/`
- **Global memory**: cross-session `memory.md` for project-wide decisions
- **HITL gates**: mandatory stops at plan approval, each TDD phase, and completion
- **BC Agent Builder** (optional): @AL Agent Builder agent, 3 skills, 4 workflows for Business Central Agent SDK development

### Breaking Changes from v2.x

- Agent count: 11 → 4 public + 3 internal subagents
- Agent invocation: `Use al-architect mode` → `@AL Architecture & Design Specialist`
- Plans directory: flat `.github/plans/` → per-requirement `.github/plans/{req_name}/`
- Specialized agents (al-debugger, al-tester, al-api, al-copilot) absorbed into composable skills

See [CHANGELOG.md](CHANGELOG.md) for full details.

---

## BC Agent Builder (optional)

Build Business Central Agents with the AI Development Toolkit and Agent SDK.
Includes: @AL Agent Builder agent, 3 skills, 4 workflows, validation tools.
See [BC Agent Builder documentation](docs/bc-agent-builder.md).

---

## Framework Documentation

- [Core Specification v1.1](docs/framework/ALDC-Core-Spec-v1.1.md)
- [Architecture Diagrams](docs/framework/ALDC-Architecture-Diagrams.md)
- [Manifesto](aldc-core-v1.1/docs/framework/ALDC-Manifesto.md)
- [Quickstart](aldc-core-v1.1/docs/framework/QUICKSTART.md)
- [Governance](docs/framework/ALDC-Governance.md)
- [Compliance Model](docs/framework/ALDC-Compliance-Model.md)
- [Migration Guide v1.0→v1.1](docs/framework/ALDC-Migration-v1.0-to-v1.1.md)

---

## MCP Servers Integration

| Server | Purpose |
| ------ | ------- |
| [al-symbols-mcp](https://github.com/StefanMaron/AL-Dependency-MCP-Server) | AL object analysis from compiled .app packages |
| [context7](https://github.com/upstash/context7) | Up-to-date library documentation retrieval |
| [microsoft-docs](https://github.com/nicholasglazer/microsoft-docs-mcp) | Official Microsoft/Azure documentation search |

---

## Requirements

- **Visual Studio Code**: 1.85.0 or higher
- **GitHub Copilot**: Required for agent and skill features
- **AL Language Extension**: For Business Central development
- **Node.js**: 14+ (for validator)

---

## Author

**Javier Armesto González**
Microsoft MVP (Business Central & Azure AI Services)
Head of R&D & AI at VS Sistemas
[LinkedIn](https://www.linkedin.com/in/jarmesto/) · [Tech Sphere Dynamics](https://techspheredynamics.com)

---

## Support & Contributing

- Report issues: [GitHub Issues](https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot/issues)
- Ask questions: [GitHub Discussions](https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot/discussions)
- See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines

---

## License

MIT — See [LICENSE](LICENSE) for details.

---

**Status**: ✅ ALDC Core v1.1 COMPLIANT
**Version**: 3.2.0 (ALDC Core v1.1)
**Last Updated**: 2026-03-04
