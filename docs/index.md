---
hide:
  - navigation
  - toc
---

# ALDC

<div class="hero" markdown>

<div class="hero-eyebrow">AL Development Collection · v3.2.0</div>

## We don't generate AL code.<br>We **orchestrate** how it gets shipped. { .hero-title }

Spec first. Tests first. Humans in the loop. ALDC is the opinionated framework
for building Business Central extensions with AI agents that actually understand
how BC development works. { .hero-tagline }

[Install ALDC :material-rocket-launch:](getting-started.md){ .md-button .md-button--primary }
[Read the spec :material-file-document-outline:](framework/ALDC-Core-Spec-v1.1.md){ .md-button }
[:fontawesome-brands-github: &nbsp; GitHub](https://github.com/javiarmesto/ALDC-AL-Development-Collection){ .md-button }

<div class="hero-pills">
  <span class="pill"><b>4</b> agents</span>
  <span class="pill"><b>11</b> skills</span>
  <span class="pill"><b>6</b> workflows</span>
  <span class="pill pill--accent">MIT</span>
  <span class="pill pill--accent">Copilot + Claude Code</span>
</div>

</div>

---

## What's ALDC { #whats-aldc .section-title }

<div class="two-col">
<div class="two-col-text" markdown>

Most AI coding tools generate a file and hope for the best. **ALDC is different.**

Every feature starts with a **spec contract** — functional, technical, testable —
kept in `.github/plans/{req_name}/`. Architecture and test plans live next to it.

A **conductor agent** orchestrates a TDD cycle: the Implementation Subagent
writes tests first, code second, then refactors. A Review Subagent validates
against the spec. You approve every phase.

Underneath it all, **11 composable skills** (API, events, performance, testing…)
load on demand so agents only know what they need for the task in front of them.

The result: AL code that passes review the first time, with traceable
decisions from requirement to merge.

</div>
<div class="two-col-visual" markdown>

```mermaid
flowchart TD
    R([Requirement]) --> S[Spec Contract<br/><small>functional + technical</small>]
    S --> A[Architecture<br/><small>decisions + diagrams</small>]
    A --> T[Test Plan<br/><small>RED before GREEN</small>]
    T --> I[TDD Implementation<br/><small>subagent loop</small>]
    I --> V[Review<br/><small>vs spec</small>]
    V --> M([Merged])

    style R fill:#5E35B1,color:#fff,stroke:none
    style M fill:#00C853,color:#fff,stroke:none
    style S fill:#7E57C2,color:#fff,stroke:none
    style A fill:#7E57C2,color:#fff,stroke:none
    style T fill:#FF6D00,color:#fff,stroke:none
    style I fill:#FF6D00,color:#fff,stroke:none
    style V fill:#FF6D00,color:#fff,stroke:none
```

</div>
</div>

---

## Why it matters { .section-title }

<div class="grid cards" markdown>

-   :material-file-document-check-outline: &nbsp; **Spec-driven, not prompt-and-pray**

    ---

    No more "please re-explain the requirement for the 5th time".
    Every feature has a written contract that agents consult.

-   :material-test-tube: &nbsp; **TDD enforced, not suggested**

    ---

    The Implementation Subagent refuses to write code before tests.
    RED → GREEN → REFACTOR is hardcoded in the agent.

-   :material-account-check-outline: &nbsp; **You approve every phase**

    ---

    Agents stop at architecture, plan, implementation, review, deploy.
    Nothing ships without a human saying yes.

-   :material-shield-lock-outline: &nbsp; **Extension-only discipline**

    ---

    Never touches base app objects. Always tableextensions, pageextensions,
    event subscribers. Least-privilege permissions by default.

-   :material-compare-horizontal: &nbsp; **One framework, two runtimes**

    ---

    Same primitives work in **GitHub Copilot** and **Claude Code**.
    Pick the tool your team already uses.

-   :material-puzzle-outline: &nbsp; **Skills load on demand**

    ---

    11 composable skills replace 300kb of prompt soup.
    Agents only load what's relevant to the task.

</div>

---

## Quick start { .section-title }

=== ":fontawesome-brands-github: GitHub Copilot (VS Code)"

    ```bash
    git clone https://github.com/javiarmesto/ALDC-AL-Development-Collection.git
    cd ALDC-AL-Development-Collection
    npm install
    npx aldc init
    ```

    Then in VS Code with Copilot enabled:

    ```text
    @workspace use al-initialize
    ```

=== ":material-robot-outline: Claude Code"

    ```bash
    /plugin install aldc
    ```

    Then:

    ```text
    /aldc:al-initialize
    ```

=== ":material-magnify: Just exploring?"

    ```bash
    git clone https://github.com/javiarmesto/ALDC-AL-Development-Collection.git
    cd ALDC-AL-Development-Collection
    npm install && npm run validate
    ```

---

## Resources { #resources .section-title }

Everything ALDC-related lives here. Pick your path.

<div class="resource-grid">

  <a class="resource-card" href="getting-started.md">
    <span class="resource-icon">:material-rocket-launch-outline:</span>
    <h3>Getting Started</h3>
    <p>Install, configure and ship your first feature in under 10 minutes.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="framework/ALDC-Core-Spec-v1.1.md">
    <span class="resource-icon">:material-file-document-check-outline:</span>
    <h3>Core Spec v1.1</h3>
    <p>The normative specification. Read this to understand every primitive.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="agents/index.md">
    <span class="resource-icon">:material-account-group-outline:</span>
    <h3>Agents</h3>
    <p>Architect, Developer, Conductor, Pre-Sales. What each one does and when.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="prompts/index.md">
    <span class="resource-icon">:material-cog-transfer-outline:</span>
    <h3>Workflows</h3>
    <p>6 workflows from initialize to PR prepare. Invocable from chat.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="instructions/index.md">
    <span class="resource-icon">:material-ruler-square:</span>
    <h3>Instructions</h3>
    <p>9 always-on AL coding standards. Style, perf, naming, errors, events.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="framework/ALDC-Architecture-Diagrams.md">
    <span class="resource-icon">:material-sitemap-outline:</span>
    <h3>Architecture</h3>
    <p>Mermaid diagrams of how agents, skills, workflows and contracts fit.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="framework/ALDC-Migration-v1.0-to-v1.1.md">
    <span class="resource-icon">:material-map-marker-path:</span>
    <h3>Migration v1.0 → v1.1</h3>
    <p>Breaking changes, upgrade checklist, deprecated primitives.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="framework/ROADMAP-2026.md">
    <span class="resource-icon">:material-road:</span>
    <h3>Roadmap 2026</h3>
    <p>What's shipping next. v1.2 priorities, community asks.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="framework/ALDC-Manifesto.md">
    <span class="resource-icon">:material-heart-outline:</span>
    <h3>Manifesto</h3>
    <p>Why spec-driven. Why HITL. Why skills. The philosophy.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="https://github.com/javiarmesto/ALDC-AL-Development-Collection">
    <span class="resource-icon">:fontawesome-brands-github:</span>
    <h3>Source code</h3>
    <p>Every agent, skill and workflow. MIT licensed. Star & fork welcome.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="https://github.com/javiarmesto/ALDC-AL-Development-Collection/discussions">
    <span class="resource-icon">:material-forum-outline:</span>
    <h3>Discussions</h3>
    <p>Ask questions, share patterns, propose primitives. Community-first.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="framework/ALDC-Governance.md">
    <span class="resource-icon">:material-scale-balance:</span>
    <h3>Governance</h3>
    <p>How decisions are made. How primitives are accepted. Compliance model.</p>
    <span class="resource-arrow">→</span>
  </a>

</div>

---

## Events & talks { #events .section-title }

Where ALDC has been shown, and where it's going next.

<div class="timeline">

  <div class="timeline-item">
    <div class="timeline-date">2025 · EMEA</div>
    <div class="timeline-body">
      <div class="timeline-kind">:material-microphone: &nbsp; Community Keynote</div>
      <h3>ALDC: Spec-driven BC development with Copilot</h3>
      <p>Keynote walkthrough: from requirement to shipped feature using agents,
      skills and contracts. Live demo of the TDD loop.</p>
      <a href="sessions/2025-EMEA-CommunityKeynote/readme.md">Session materials →</a>
    </div>
  </div>

  <div class="timeline-item">
    <div class="timeline-date">2025 · Web</div>
    <div class="timeline-body">
      <div class="timeline-kind">:material-book-open-variant: &nbsp; Talk + Deck</div>
      <h3>GitHub Copilot — 10+1 practical tips for AL</h3>
      <p>Practitioner-focused deck with tips and tricks, including the ALDC
      workflow for complex features.</p>
      <a href="sessions/Github Copilot-A practical approach to AL in 10 plus1 tips and tricks/README.md">Open materials →</a>
    </div>
  </div>

  <div class="timeline-item timeline-item--upcoming">
    <div class="timeline-date">Coming up</div>
    <div class="timeline-body">
      <div class="timeline-kind">:material-calendar-star: &nbsp; Your event?</div>
      <h3>Want to invite ALDC to your event?</h3>
      <p>I love talking about this at meetups, user groups and conferences
      — in Spanish or English.</p>
      <a href="https://www.linkedin.com/in/javiarmesto">Reach out on LinkedIn →</a>
    </div>
  </div>

</div>

---

## How to collaborate { #collaborate .section-title }

Four ways to make ALDC better. No contribution is too small.

<div class="collab-grid">

  <div class="collab-card">
    <div class="collab-num">01</div>
    <h3>Try it and tell me</h3>
    <p>Install, build something real, and open an issue with what broke,
    what felt awkward, or what you wish existed. Bug reports are gold.</p>
    <a href="https://github.com/javiarmesto/ALDC-AL-Development-Collection/issues/new/choose">Open an issue :material-arrow-right:</a>
  </div>

  <div class="collab-card">
    <div class="collab-num">02</div>
    <h3>Contribute a primitive</h3>
    <p>Have a skill, workflow or agent you'd pay for? Propose it.
    Fork, follow the contribution guide, open a PR.</p>
    <a href="https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/CONTRIBUTING.md">Contribution guide :material-arrow-right:</a>
  </div>

  <div class="collab-card">
    <div class="collab-num">03</div>
    <h3>Shape v1.2</h3>
    <p>The roadmap is open. Vote on priorities, argue against trade-offs,
    propose alternatives in Discussions.</p>
    <a href="framework/ROADMAP-2026.md">See the roadmap :material-arrow-right:</a>
  </div>

  <div class="collab-card">
    <div class="collab-num">04</div>
    <h3>Spread the word</h3>
    <p>Star the repo. Talk about ALDC in your BC community.
    Write a blog post. Tag us on LinkedIn. Word of mouth works.</p>
    <a href="https://github.com/javiarmesto/ALDC-AL-Development-Collection">Star on GitHub :material-arrow-right:</a>
  </div>

</div>

---

<div class="footer-cta" markdown>

### Ready to ship BC features with confidence? { .footer-cta-title }

[Install ALDC :material-download:](getting-started.md){ .md-button .md-button--primary }
[Read the spec :material-file-document:](framework/ALDC-Core-Spec-v1.1.md){ .md-button }
[:material-star: &nbsp; Star the repo](https://github.com/javiarmesto/ALDC-AL-Development-Collection){ .md-button }

</div>

<div class="status-footer" markdown>

`✓ ALDC Core v1.1 COMPLIANT` &nbsp;·&nbsp; `v3.2.0` &nbsp;·&nbsp; `MIT` &nbsp;·&nbsp; Made by [Javier Armesto](https://www.linkedin.com/in/javiarmesto)
Framework: [AI Native-Instructions Architecture](https://danielmeppiel.github.io/awesome-ai-native/)

</div>
