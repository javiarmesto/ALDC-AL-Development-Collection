# ALDC Architecture Diagrams

Visual reference for ALDC Core v1.1 structure and flows.

---

## Diagram 1 — Framework Architecture

The full ALDC Core v1.1 component map: 4 public agents, 3 internal subagents, 11 composable skills, 6 workflows.

```mermaid
graph TB
    subgraph PUBLIC["Public Agents (user-invocable)"]
        ARCH["@AL Architecture & Design Specialist\nSolution Architect"]
        DEV["@AL Implementation Specialist\nImplementation Specialist"]
        COND["@AL Development Conductor\nTDD Orchestrator"]
        PRE["@AL Pre-Sales & Project Estimation Specialist\nEstimation & Scoping"]
    end

    subgraph INTERNAL["Internal Subagents (conductor-only)"]
        PLAN["AL Planning Subagent\nContext Research"]
        IMPL["AL Implementation Subagent\nTDD Implementation"]
        REV["AL Code Review Subagent\nCode Review"]
    end

    subgraph SKILLS_REQ["Required Skills (7)"]
        SK1[skill-api]
        SK2[skill-copilot]
        SK3[skill-debug]
        SK4[skill-performance]
        SK5[skill-events]
        SK6[skill-permissions]
        SK7[skill-testing]
    end

    subgraph SKILLS_REC["Recommended Skills (4)"]
        SK8[skill-migrate]
        SK9[skill-pages]
        SK10[skill-translate]
        SK11[skill-estimation]
    end

    subgraph WORKFLOWS["6 Retained Workflows"]
        W1[al-spec.create]
        W2[al-build]
        W3[al-pr-prepare]
        W4[al-context.create]
        W5[al-memory.create]
        W6[al-initialize]
    end

    subgraph INSTRUCTIONS["9 Auto-Applied Instructions"]
        I1[copilot-instructions]
        I2[al-guidelines]
        I3[al-code-style]
        I4[al-naming-conventions]
        I5[al-performance]
        I6[al-error-handling]
        I7[al-events]
        I8[al-testing]
        I9[index]
    end

    ARCH -->|loads on demand| SKILLS_REQ
    DEV -->|loads on demand| SKILLS_REQ
    DEV -->|loads on demand| SKILLS_REC
    PRE -->|loads| SK11
    COND -->|invokes| INTERNAL
    IMPL -->|loads on demand| SKILLS_REQ

    W1 -->|produces spec for| ARCH
    W1 -->|produces spec for| COND
    INSTRUCTIONS -.->|auto-applied to all| PUBLIC
```

---

## Diagram 2 — Development Flow by Complexity

```mermaid
flowchart TD
    REQ[Requirement] --> CLASSIFY{Complexity?}

    CLASSIFY -->|LOW| SPEC_LOW[al-spec.create]
    SPEC_LOW --> DEV[@AL Implementation Specialist\nDirect Implementation]

    CLASSIFY -->|MEDIUM/HIGH| ARCH[@AL Architecture & Design Specialist\nSolution Architect]
    ARCH -->|Produces architecture.md| ARCH_DOC[(architecture.md)]
    ARCH --> DECOMPOSE{Decompose\ninto sub-requirements?}

    DECOMPOSE -->|Yes| SPEC_A[al-spec.create\n→ spec-A.md]
    DECOMPOSE -->|Yes| SPEC_B[al-spec.create\n→ spec-B.md]
    DECOMPOSE -->|No| SPEC_SINGLE[al-spec.create\n→ spec.md]

    SPEC_A --> COND_A[@AL Development Conductor\nTDD Orchestration A]
    SPEC_B --> COND_B[@AL Development Conductor\nTDD Orchestration B]
    SPEC_SINGLE --> COND[@AL Development Conductor\nTDD Orchestration]

    COND_A --> DONE_A[Delivery A]
    COND_B --> DONE_B[Delivery B]
    COND --> DONE[Delivery]
    DEV --> DONE_LOW[Delivery]

    style ARCH fill:#9C27B0,color:#fff
    style DEV fill:#2196F3,color:#fff
    style COND fill:#FF9800,color:#fff
    style COND_A fill:#FF9800,color:#fff
    style COND_B fill:#FF9800,color:#fff
```

---

## Diagram 3 — TDD Orchestration Cycle (Conductor)

```mermaid
flowchart TD
    START([User: @AL Development Conductor\nwith spec.md]) --> PHASE1

    subgraph PHASE1["Phase 1: Planning"]
        P1A[AL Planning Subagent\nContext Research]
        P1B[Conductor creates\nPhased Plan]
        P1C{HITL Gate\nPlan Approval}
        P1D[phase-1-complete.md]
        P1A --> P1B --> P1C
        P1C -->|Approved| P1D
        P1C -->|Revise| P1B
    end

    P1D --> PHASE_N

    subgraph PHASE_N["Phase N: Implementation"]
        PN1[AL Implementation Subagent]
        subgraph TDD["TDD Cycle"]
            RED["RED\nWrite failing tests\nVerify failure"]
            GREEN["GREEN\nMinimal code\nTests pass"]
            REFACTOR["REFACTOR\nAL patterns\nOptimize"]
            RED --> GREEN --> REFACTOR
        end
        PN2[AL Code Review Subagent\nValidates vs spec+arch]
        PN3{Review Decision}
        PN4[phase-N-complete.md]

        PN1 --> TDD --> PN2 --> PN3
        PN3 -->|APPROVED| PN4
        PN3 -->|NEEDS_REVISION| PN1
    end

    PN4 --> MORE{More phases?}
    MORE -->|Yes| PHASE_N
    MORE -->|No| COMPLETE

    subgraph COMPLETE["Plan Complete"]
        FINAL_HITL{HITL Gate\nFinal Approval}
        PLAN_COMPLETE[plan-complete.md]
        FINAL_HITL -->|Approved| PLAN_COMPLETE
    end

    style RED fill:#f44336,color:#fff
    style GREEN fill:#4CAF50,color:#fff
    style REFACTOR fill:#2196F3,color:#fff
```

---

## Diagram 4 — Contract Structure per Requirement

```mermaid
graph TB
    subgraph PLANS[".github/plans/"]
        MEMORY[("memory.md\nGlobal — cross-session context\nNever deleted, only appended")]

        subgraph REQ_A["{req_name}/"]
            ARCH_A["{req_name}.architecture.md\nFrom: @AL Architecture & Design Specialist"]
            SPEC_A["{req_name}.spec.md\nFrom: al-spec.create"]
            TP_A["{req_name}.test-plan.md\nFrom: al-spec.create or conductor"]
            PLAN_A["{req_name}-plan.md\nFrom: @AL Development Conductor Phase 1"]
            PH1["{req_name}-phase-1-complete.md"]
            PHN["{req_name}-phase-N-complete.md"]
            DONE["{req_name}-plan-complete.md"]
        end

        subgraph REQ_B["Another {req_name}/"]
            SPEC_B["{req_name}.spec.md"]
            TP_B["{req_name}.test-plan.md"]
            PLAN_B["{req_name}-plan.md"]
        end
    end

    ARCH["@AL Architecture & Design Specialist"] -->|produces| ARCH_A
    SPEC_WF["al-spec.create"] -->|produces| SPEC_A
    SPEC_WF -->|produces| TP_A
    COND["@AL Development Conductor"] -->|produces| PLAN_A
    COND -->|produces| PH1
    COND -->|produces| PHN
    COND -->|produces| DONE
    ALL_AGENTS["All Agents"] -->|read/update| MEMORY

    style MEMORY fill:#FF9800,color:#fff
    style ARCH_A fill:#9C27B0,color:#fff
    style SPEC_A fill:#2196F3,color:#fff
    style TP_A fill:#2196F3,color:#fff
```

---

*ALDC Core v1.1 — Updated 2026-03-04*
