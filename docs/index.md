---
hide:
  - navigation
  - toc
---

# ALDC

<div class="hero">
<a class="hero-banner" href="#whats-new">
  <span class="hero-banner__badge">UPCOMING</span>
  <span class="hero-banner__text">ALDC 4.3.0 · candidate under validation</span>
  <span class="hero-banner__arrow">→</span>
</a>
<div class="hero-eyebrow">ALDC · AL Agentic Engineering System · Business Central · <a href="index-es/">Español</a></div>
<h2 class="hero-title">From business requirements to AL development.</h2>
<div class="hero-annotation">Engineering systems, visibly reasoned.</div>
<p class="hero-tagline"><strong>Specialist AI agents. Human review.</strong> Design the architecture, define connected specifications, and coordinate implementation, testing and review for Business Central. You decide at key checkpoints.</p>
<div class="hero-actions">
  <a class="md-button md-button--primary" href="start/">Install ALDC</a>
  <a class="md-button" href="#whats-new">Explore what is new</a>
  <a class="md-button" href="https://github.com/javiarmesto/ALDC-AL-Development-Collection">GitHub</a>
</div>
<p class="hero-subnote">Marketplace remains on 4.2.0. The 4.3.0 capabilities are under validation and have not been published yet.</p>
<div class="hero-pills">
  <span class="pill">Architect → Spec → Conductor</span>
  <span class="pill pill--accent">Copilot Chat · CLI · Claude Code · Codex</span>
  <span class="pill pill--accent">AL18 · Tools · MCP</span>
  <span class="pill pill--version"><b>4.3.0 candidate</b> · MIT</span>
</div>
</div>

## What is coming { #whats-new .section-title }

<div class="grid cards" markdown="1">

-   **Architect → Spec**

    ---

    Architect defines units, shared contracts and dependencies. Spec develops each contract and returns contradictions for joint review.

-   **AL18 · Tools · MCP**

    ---

    Optional BC29-native guidance for AL tools available in Copilot Chat. BC28 remains the default; selecting a profile does not install tools or change app.json.

-   **Doctor · BCQuality**

    ---

    Operation-specific diagnostics and optional BCQuality reviews. Configuration, discovery, loading and execution are recorded as separate facts.

-   **Recoverable updates**

    ---

    Review collisions, verify installed content and restore the preceding transaction when integrity checks permit it. Restoration protects later edits.

</div>

## From design to reviewable implementation { #whats-aldc .section-title }

Architect determines how many specifications a solution needs, what they share and which can be drafted independently. Drafting and implementation dependencies are evaluated separately. Actual concurrency depends on the host and execution; a plan does not demonstrate that agents ran in parallel.

Spec develops technical contracts and acceptance criteria within the approved design. Joint review checks the current revisions before handoff to Conductor or Developer. Conductor coordinates planning, test-first implementation and review. Skills supply domain guidance when the task calls for it.

[Explore Spec Agent](spec-agent/) · [BC28 / BC29-native profiles](native-bc29/)

## Reviews with BCQuality { #bcquality .section-title }

BCQuality is optional and installed separately. Choose plugin or external-workspace mode in `aldc.yaml`, with the exact provider identity. Review evidence distinguishes discovery, loading, execution and index generation; native coverage is retained when external results are insufficient.

[Configure BCQuality](bcquality/)

## Your environment. Your starting point. { #install .section-title }

<p class="section-lead">Choose where you work. Get the installation steps, checks and a first request for that surface.</p>
<div class="aldc-install-grid">
<a class="aldc-install-card" href="start/?surface=vscode"><span class="resource-kicker">Published extension</span><h3>GitHub Copilot</h3><p>VS Code</p><span class="resource-arrow">→</span></a>
<a class="aldc-install-card" href="start/?surface=copilot-cli"><span class="resource-kicker">Candidate source</span><h3>GitHub Copilot</h3><p>CLI</p><span class="resource-arrow">→</span></a>
<a class="aldc-install-card" href="start/?surface=claude"><span class="resource-kicker">Candidate source</span><h3>Claude Code</h3><p>Plugin</p><span class="resource-arrow">→</span></a>
<a class="aldc-install-card" href="start/?surface=codex"><span class="resource-kicker">Candidate source</span><h3>Codex</h3><p>Project setup</p><span class="resource-arrow">→</span></a>
</div>
<p class="hero-subnote">The VSIX updates the VS Code extension. Each project toolkit and each terminal plugin has its own update step.</p>

---

## Resources { #resources .section-title }

Everything ALDC-related lives here. Pick your path.

<div class="resource-grid">

  <a class="resource-card" href="getting-started/">
    <span class="resource-kicker">Start here</span>
    <h3>Getting Started</h3>
    <p>Install the toolkit and prepare your first requirement.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="al-development/">
    <span class="resource-kicker">Guide</span>
    <h3>Collection Guide</h3>
    <p>The public guide to ALDC: architecture, primitives, flow, validation and adoption.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="agents/">
    <span class="resource-kicker">Roles</span>
    <h3>Agents</h3>
    <p>Architect, Spec, Developer, Conductor, Pre-Sales — plus on-demand Triage &amp; Dredd. What each one does and when.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="prompts/">
    <span class="resource-kicker">Automation</span>
    <h3>Workflows</h3>
    <p>Workflows from initialization to PR preparation. Invocable from chat.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="instructions/">
    <span class="resource-kicker">Standards</span>
    <h3>Instructions</h3>
    <p>Scoped AL coding instructions. Style, perf, naming, errors, events.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="workflows/complete-development-flow/">
    <span class="resource-kicker">Execution</span>
    <h3>Complete Development Flow</h3>
    <p>See the end-to-end path from requirement intake to validated delivery.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="events/">
    <span class="resource-kicker">Talks</span>
    <h3>Events & Talks</h3>
    <p>Conference sessions, community talks and upcoming public appearances.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="reproducible-example/">
    <span class="resource-kicker">Example</span>
    <h3>Reproducible Example</h3>
    <p>Walk through a concrete ALDC setup with a documented starting point.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="CONTRIBUTING/">
    <span class="resource-kicker">Contribute</span>
    <h3>Contributing</h3>
    <p>Open issues, submit improvements and propose new primitives with the repo guidelines.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="https://github.com/javiarmesto/ALDC-AL-Development-Collection">
    <span class="resource-kicker">Open source</span>
    <h3>Source code</h3>
    <p>Every agent, skill and workflow. MIT licensed. Star and fork welcome.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="https://github.com/javiarmesto/ALDC-AL-Development-Collection/discussions">
    <span class="resource-kicker">Community</span>
    <h3>Discussions</h3>
    <p>Ask questions, share patterns and propose primitives with the community.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="CHANGELOG/">
    <span class="resource-kicker">History</span>
    <h3>Changelog</h3>
    <p>Track releases, fixes and the evolution of the collection over time.</p>
    <span class="resource-arrow">→</span>
  </a>

</div>

---

## Events & talks { #events .section-title }

<p class="section-lead">ALDC also exists outside the repo: conference talks, Dev Days and hands-on sessions where the collection, workflow and delivery model are the topic. Here you only see confirmed upcoming talks.</p>

<div class="cta-row">
  <a class="md-button md-button--primary" href="events/">See upcoming talks</a>
  <a class="md-button" href="start/">Install ALDC</a>
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
    <a href="https://github.com/javiarmesto/ALDC-AL-Development-Collection/issues/new/choose">Open an issue →</a>
  </div>

  <div class="collab-card">
    <div class="collab-num">02</div>
    <h3>Contribute a primitive</h3>
    <p>Have a skill, workflow or agent you'd pay for? Propose it.
    Fork, follow the contribution guide, open a PR.</p>
    <a href="https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/CONTRIBUTING.md">Contribution guide →</a>
  </div>

  <div class="collab-card">
    <div class="collab-num">03</div>
    <h3>Shape v1.2</h3>
    <p>Priorities are discussed openly. Vote on trade-offs, challenge assumptions,
    and propose alternatives with the community.</p>
    <a href="https://github.com/javiarmesto/ALDC-AL-Development-Collection/discussions">Join the discussion →</a>
  </div>

  <div class="collab-card">
    <div class="collab-num">04</div>
    <h3>Share the workflow</h3>
    <p>Star the repo. Mention ALDC in your BC community, internal enablement
    docs or session notes. Useful references beat generic hype.</p>
    <a href="https://github.com/javiarmesto/ALDC-AL-Development-Collection">Star on GitHub →</a>
  </div>

</div>

---

<div class="footer-cta" markdown="1">

### Ready to ship BC features with confidence? { .footer-cta-title }

[Install ALDC :material-download:](getting-started.md){ .md-button .md-button--primary }
[Open the collection guide :material-book-open-page-variant:](al-development.md){ .md-button }
[:material-star: &nbsp; Star the repo](https://github.com/javiarmesto/ALDC-AL-Development-Collection){ .md-button }

</div>

<div class="status-footer" markdown="1">

`✓ ALDC Core v1.1 COMPLIANT` &nbsp;·&nbsp; `v4.1.0` &nbsp;·&nbsp; `MIT` &nbsp;·&nbsp; Made by [Javier Armesto](https://www.linkedin.com/in/javiarmesto)
Reference model: [AI Native-Instructions Architecture](https://danielmeppiel.github.io/awesome-ai-native/)

</div>
