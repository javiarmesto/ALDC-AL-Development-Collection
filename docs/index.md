# AL Development Collection for GitHub Copilot

> **ALDC** — Skills-based, spec-driven, TDD-orchestrated development framework for Microsoft Dynamics 365 Business Central with GitHub Copilot agents.
>
> ALDC Core v1.1 | Extension v3.2.0

[![ALDC Core](https://img.shields.io/badge/ALDC%20Core-v1.1%20Compliant-purple.svg)](framework/ALDC-Core-Spec-v1.1.md)
[![Version](https://img.shields.io/badge/version-3.2.0-blue)](../CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](../LICENSE)

---

## What is ALDC?

ALDC transforms how you develop Business Central extensions with GitHub Copilot. Instead of ad-hoc code generation, ALDC provides **structured, contract-driven development** with human-in-the-loop gates and skills-based modularization with preserved orchestration.

---

## Framework Components

| Component | Count | Description |
| --------- | ----- | ----------- |
| **Public Agents** | 4 | @AL Architecture & Design Specialist, @AL Implementation Specialist, @AL Development Conductor, @AL Pre-Sales & Project Estimation Specialist |
| **Internal Subagents** | 3 | AL Planning Subagent, AL Implementation Subagent, AL Code Review Subagent |
| **Composable Skills** | 11 | Domain knowledge loaded on demand |
| **Workflows** | 6 | Automated processes (spec.create, build, pr-prepare, …) |
| **Instructions** | 9 | Auto-applied coding standards (always active) |
| **Immutable Templates** | 7 | Contract document templates |

---

## Development Flow

```text
LOW complexity:
  al-spec.create → @AL Implementation Specialist

MEDIUM/HIGH complexity:
  @AL Architecture & Design Specialist → al-spec.create → @AL Development Conductor
```

The architect is a **Solution Architect** (DESIGNS). The spec.create workflow produces the **Technical Blueprint** (DETAILS). The conductor orchestrates **TDD Implementation** (EXECUTES).

---

## Key Framework Documents

### Normative

- [ALDC Core Specification v1.1](framework/ALDC-Core-Spec-v1.1.md) — The normative spec. Read this first.
- [Architecture Diagrams](framework/ALDC-Architecture-Diagrams.md) — Mermaid diagrams of the framework

### Guides

- [Quickstart](../aldc-core-v1.1/docs/framework/QUICKSTART.md) — Onboarding in minutes
- [Migration v1.0 → v1.1](framework/ALDC-Migration-v1.0-to-v1.1.md) — Upgrade guide

### Governance

- [ALDC Governance](framework/ALDC-Governance.md) — Contribution and change process
- [Compliance Model](framework/ALDC-Compliance-Model.md) — Compliance checklist
- [Manifesto](../aldc-core-v1.1/docs/framework/ALDC-Manifesto.md) — Philosophy

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
        ├── {req_name}-plan.md            ← From @AL Development Conductor
        └── {req_name}-phase-N-complete.md
```

---

## What's New in v3.2.0

- **Skills-based modularization**: 11 composable skills replace 7 specialized agents + 12 prompts
- **Restored TDD enforcement**: `AL Implementation Subagent` with hardcoded RED→GREEN→REFACTOR
- **Contracts per requirement**: `.github/plans/{req_name}/` subdirectory structure
- **Skills evidencing**: agents declare loaded skills and patterns applied
- **HITL gates enforced**: mandatory stops at plan approval, each phase, completion
- **Test infrastructure checks**: Library Assert, Any dependency, ID range verification

---

## Getting Started

1. Install the VS Code extension from the Marketplace
2. Open your AL project
3. Run: `AL Collection: Install Toolkit to Workspace`
4. Start: `@workspace use al-spec.create` with your requirement

---

**Status**: ✅ ALDC Core v1.1 COMPLIANT
**Framework**: [AI Native-Instructions Architecture](https://danielmeppiel.github.io/awesome-ai-native/)
**Last Updated**: 2026-03-04
