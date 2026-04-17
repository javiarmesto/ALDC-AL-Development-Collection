---
hide:
  - navigation
  - toc
---

# ALDC

<div class="hero" markdown>

## AI-Native Development for Business Central { .hero-title }

Spec-driven, TDD-orchestrated, human-in-the-loop.
Build AL extensions with **4 agents**, **11 skills** and **6 workflows** that actually know Business Central. { .hero-tagline }

[Get started :material-rocket-launch:](getting-started.md){ .md-button .md-button--primary }
[See the agents :material-account-group:](agents/index.md){ .md-button }
[View on GitHub :fontawesome-brands-github:](https://github.com/javiarmesto/ALDC-AL-Development-Collection){ .md-button }

</div>

---

## Why ALDC { .section-title }

<div class="grid cards" markdown>

-   :material-file-document-check-outline: &nbsp; **Spec-driven, not prompt-and-pray**

    ---

    Every feature starts with a functional-technical spec, architecture doc, and test plan.
    Contracts live in `.github/plans/{req_name}/` and guide every agent.

-   :material-test-tube: &nbsp; **TDD enforced by design**

    ---

    The Implementation Subagent writes tests **first**, code **second**, then refactors.
    RED → GREEN → REFACTOR is hardcoded — not a suggestion.

-   :material-account-check: &nbsp; **Human-in-the-Loop gates**

    ---

    Agents stop at phase transitions, architecture choices, and deployments.
    You approve. Nothing ships without your review.

-   :material-puzzle-outline: &nbsp; **Skills, not monoliths**

    ---

    11 composable skills (API, events, performance, testing…) load on demand.
    Agents only know what they need. No 300kb prompt soup.

-   :material-shield-lock-outline: &nbsp; **Extension-only discipline**

    ---

    Never modify base objects. Always `tableextensions`, `pageextensions`, event subscribers.
    Least-privilege permissions. XLIFF for every user-facing string.

-   :material-compare-horizontal: &nbsp; **Dual-runtime ready**

    ---

    First-class support for **GitHub Copilot** and **Claude Code**.
    Same agents, same skills, same contracts — choose your runtime.

</div>

---

## Framework at a glance { .section-title }

<div class="stats-grid">
  <div class="stat"><span class="num">4</span><span class="lbl">Public agents</span></div>
  <div class="stat"><span class="num">3</span><span class="lbl">Subagents</span></div>
  <div class="stat"><span class="num">11</span><span class="lbl">Skills</span></div>
  <div class="stat"><span class="num">6</span><span class="lbl">Workflows</span></div>
  <div class="stat"><span class="num">9</span><span class="lbl">Instructions</span></div>
  <div class="stat"><span class="num">7</span><span class="lbl">Templates</span></div>
</div>

=== ":material-brain: Agents"

    | Agent | Role |
    |-------|------|
    | **@AL Architecture & Design** | Designs solutions, information flow, decomposes requirements |
    | **@AL Implementation Specialist** | Implements, debugs, quick fixes (LOW complexity) |
    | **@AL Development Conductor** | Orchestrates TDD with planning + implement + review subagents |
    | **@AL Pre-Sales & Estimation** | PERT estimation, SWOT, project scoping |

=== ":material-puzzle: Skills"

    | Skill | Domain |
    |-------|--------|
    | `skill-api` | OData pages, REST endpoints, HttpClient |
    | `skill-copilot` | PromptDialog, capabilities, AI features |
    | `skill-events` | Publishers, subscribers, integration events |
    | `skill-performance` | SetLoadFields, FlowFields, profiling |
    | `skill-testing` | Library Assert, test codeunits, TDD |
    | `skill-debug` | Snapshot debug, CPU profile, telemetry |
    | `skill-pages` | Card/List/Document pages, FastTabs |
    | `skill-permissions` | Permission sets, GDPR, XLIFF |
    | `skill-migrate` | BC version upgrades, breaking changes |
    | `skill-translate` | XLF, NAB AL Tools, localization |
    | `skill-estimation` | Effort modeling, complexity scoring |

=== ":material-cog-transfer: Workflows"

    | Workflow | What it does |
    |----------|--------------|
    | `al-spec.create` | Generate functional-technical spec from a requirement |
    | `al-build` | Compile, package, publish the extension |
    | `al-pr-prepare` | Assemble PR with docs, test report, checklist |
    | `al-memory.create` | Append session decisions to global memory |
    | `al-context.create` | Produce AI context document for the project |
    | `al-initialize` | Bootstrap environment, rules, launch.json |

---

## How it works { .section-title }

```mermaid
flowchart LR
    A([Requirement]) --> B{Complexity?}
    B -->|LOW| D[al-spec.create]
    B -->|MED / HIGH| C[@AL Architect]
    C --> D
    D --> E[@AL Conductor]
    E --> F[Planning Subagent]
    F --> G{HITL: approve plan}
    G -->|yes| H[Implement Subagent<br/>RED → GREEN → REFACTOR]
    H --> I[Review Subagent]
    I --> J{HITL: approve phase}
    J -->|yes| K([Merged])

    style A fill:#5E35B1,color:#fff,stroke:#fff
    style K fill:#00C853,color:#fff,stroke:#fff
    style G fill:#FF6D00,color:#fff,stroke:#fff
    style J fill:#FF6D00,color:#fff,stroke:#fff
```

The architect **DESIGNS**. `al-spec.create` **DETAILS**. The conductor **EXECUTES**. You **APPROVE** at every gate.

---

## Quick start { .section-title }

=== ":material-microsoft-visual-studio-code: GitHub Copilot (VS Code)"

    ```bash
    # Clone into your AL workspace
    git clone https://github.com/javiarmesto/ALDC-AL-Development-Collection.git
    cd ALDC-AL-Development-Collection
    npm install

    # Initialize your project
    npx aldc init
    ```

    Then in VS Code with Copilot enabled:

    ```text
    @workspace use al-initialize
    ```

=== ":material-robot: Claude Code"

    ```bash
    # From Plugin Marketplace
    /plugin install aldc

    # Or local development
    claude --plugin-dir ./claude-plugin
    ```

    Then initialize:

    ```text
    /aldc:al-initialize
    ```

=== ":material-github: Clone & explore"

    ```bash
    git clone https://github.com/javiarmesto/ALDC-AL-Development-Collection.git
    cd ALDC-AL-Development-Collection

    # Validate the collection
    npm install && npm run validate
    ```

---

## Deep dive { .section-title }

<div class="grid cards" markdown>

-   :material-book-open-page-variant: &nbsp; **Specification**

    ---

    The normative spec that governs every primitive in the framework.

    [Read ALDC Core v1.1 →](framework/ALDC-Core-Spec-v1.1.md)

-   :material-sitemap: &nbsp; **Architecture**

    ---

    Mermaid diagrams of agents, skills, workflows and data flow.

    [Architecture diagrams →](framework/ALDC-Architecture-Diagrams.md)

-   :material-map-marker-path: &nbsp; **Migration guide**

    ---

    Moving from v1.0 to v1.1? Follow the breaking-change checklist.

    [v1.0 → v1.1 migration →](framework/ALDC-Migration-v1.0-to-v1.1.md)

-   :material-scale-balance: &nbsp; **Governance**

    ---

    How decisions are made, how primitives are proposed, compliance checklist.

    [Governance + Compliance →](framework/ALDC-Governance.md)

-   :material-heart-outline: &nbsp; **Manifesto**

    ---

    The philosophy behind ALDC. Why spec-driven, why HITL, why skills.

    [Read the manifesto →](framework/ALDC-Manifesto.md)

-   :material-road: &nbsp; **Roadmap**

    ---

    What's shipping in 2026 and beyond.

    [2026 roadmap →](framework/ROADMAP-2026.md)

</div>

---

## What's new in v3.2.0 { .section-title }

!!! success "Skills-based modularization"
    11 composable skills replace 7 specialized agents + 12 prompts. Smaller surface, clearer boundaries, same power.

!!! success "Hardcoded TDD"
    The Implementation Subagent enforces RED → GREEN → REFACTOR. No way to skip tests.

!!! success "Per-requirement contracts"
    `.github/plans/{req_name}/` groups spec + architecture + test plan + phase reports for every feature.

!!! success "HITL gates everywhere"
    Plan approval, phase transitions, deployments — all pause for your review.

!!! success "Dual-runtime"
    Same primitives on GitHub Copilot and Claude Code. Pick the tool that fits your team.

---

<div class="footer-cta" markdown>

### Ready to ship BC features with confidence? { .footer-cta-title }

[Install ALDC :material-download:](getting-started.md){ .md-button .md-button--primary }
[Star on GitHub :material-star:](https://github.com/javiarmesto/ALDC-AL-Development-Collection){ .md-button }
[Read the spec :material-file-document:](framework/ALDC-Core-Spec-v1.1.md){ .md-button }

</div>

<div class="status-footer" markdown>

`✓ ALDC Core v1.1 COMPLIANT` &nbsp;&nbsp;·&nbsp;&nbsp; `v3.2.0` &nbsp;&nbsp;·&nbsp;&nbsp; `MIT`
Framework: [AI Native-Instructions Architecture](https://danielmeppiel.github.io/awesome-ai-native/)

</div>
