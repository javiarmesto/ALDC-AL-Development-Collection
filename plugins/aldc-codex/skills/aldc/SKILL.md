---
name: aldc
description: Use canonical ALDC architecture, implementation, TDD orchestration, review and specification workflows for AL / Business Central projects.
---

Read the relevant role or workflow below in full before acting. Resolve these
links from this skill directory, including when a plugin cache holds it. Load
applicable rules from references/rules/ and domain guidance from
references/skills/ (GUIDE.md) on demand. These domain references are not duplicate
discoverable skills. Recover approved work from .github/plans/ and memory.md.

For MEDIUM/HIGH work, preserve architecture → specification → Conductor order.
The al-spec-create workflow loads the same al-spec-agent contract as direct role invocation.
Human material gates and current session authorization govern actions. Plugin
installation alone does not authorize compilation, publishing or deployment.

Use discovered project custom agents when available. Otherwise read the selected
role as instructions in this session; when independent subagents are required
and unavailable, report the affected step as pending. Do not invent a tool name
or claim independent review from a sequential role change.

## Roles

- [al-agent-builder](references/agents/al-agent-builder.md): Agent Toolkit Builder specialist in designing and coding Business Central agents using the AI Development Toolkit and Agent SDK. Follows the official Agent Template project structure. Handles both Designer (no-code) and SDK (pro-code) paths. Use when building BC agents or agent SDK integrations.
- [al-architect](references/agents/al-architect.md): AL Architecture and Design assistant for Business Central extensions. Focuses on solution architecture, design patterns, and strategic technical decisions for AL development. Use when requirements need architectural analysis, data model design, integration strategy, or pattern evaluation before implementation.
- [al-conductor](references/agents/al-conductor.md): Orchestrates Planning, Implementation, Review, and Commit cycle for AL Development. Enforces TDD and quality gates for Business Central extensions. Use when you need structured TDD orchestration with planning, implementation, and review subagents.
- [al-developer-reviewer](references/agents/al-developer-reviewer.md): Independent read-only review of an AL increment implemented directly by Developer, without Conductor. Checks acceptance, BCQuality and current validation evidence before human approval.
- [al-developer](references/agents/al-developer.md): Tactical implementation specialist for Business Central extensions. Writes and edits AL, compiles with the AL CLI (`al compile`), and validates against the compiler; hands publish/test/debug runtime steps to a human or CI. Implements features following specifications without architectural decisions. Use when you need to implement, code, debug, or fix AL code directly.
- [al-implement-subagent](references/agents/al-implement-subagent.md): Internal TDD implementation subagent. Only invoked by al-conductor via subagent delegation tool. Executes RED-GREEN-REFACTOR cycle: writes tests FIRST, then minimal code to pass, then refactors. Creates AL objects following strict TDD methodology.
- [al-planning-subagent](references/agents/al-planning-subagent.md): Internal AL-aware research and context gathering subagent for Business Central development. Only invoked by al-conductor via subagent delegation tool. Returns structured findings to Conductor for plan creation.
- [al-presales](references/agents/al-presales.md): Technical PreSales Agent for AL/Business Central projects. Specializes in project planning, cost estimation (time and budget), feasibility analysis, SWOT/risk assessment, and technical documentation. Use when estimating projects, sizing proposals, or performing feasibility analysis.
- [al-review-subagent](references/agents/al-review-subagent.md): AL Code Review Subagent - Quality assurance for Business Central AL code. Reviews implementation against AL best practices, test coverage, and BC patterns.
- [al-spec-agent](references/agents/al-spec-agent.md): Turn an approved Business Central requirement and architecture into one implementable AL specification. Own technical contracts and acceptance criteria without writing AL implementation or changing architecture.
- [al-triage](references/agents/al-triage.md): Reactive diagnosis specialist for EXISTING Business Central AL code — reproduce, localize, root-cause, and recommend a minimal fix for bugs, regressions, and incidents. Read-only on code: produces a diagnosis and hands the fix to al-developer. The dynamic counterpart to dredd (static audit). Use when you start from a symptom ("this throws", "this is slow", "broke after the last change").
- [dredd](references/agents/dredd.md): Independent, on-demand AL codebase auditor for Business Central. Judges the code against BCQuality (citable knowledge) plus native checks for what BCQuality does not reach. Read-only; advisory verdict. Default scope: objects changed vs main; full codebase on request.

## Workflows

- [al-agent-create](references/commands/al-agent-create.md): End-to-end workflow to create a coded Business Central agent using the Agent SDK. Follows the official Agent Template project structure. Generates all required objects with correct interface signatures. Use when creating a new BC agent.
- [al-agent-instructions-create](references/commands/al-agent-instructions-create.md): Generate optimized natural language instructions for Business Central agents (Designer or SDK). Follows Responsibilities-Guidelines-Instructions framework. Use when writing agent instructions or creating InstructionsV1.txt.
- [al-agent-task](references/commands/al-agent-task.md): Generate AL code for Business Central Agent SDK task integration. Applies patterns from skill-agent-task-patterns to generate production-ready codeunits, page extensions, and event subscribers. Use when implementing agent task integrations.
- [al-agent-test](references/commands/al-agent-test.md): Generate comprehensive test codeunits for Business Central Agent SDK integrations. Covers 6 categories with correct interface signatures. Use when creating tests for BC agents or agent SDK code.
- [al-build](references/commands/al-build.md): Build, package, and deploy AL extensions to Business Central environments. Use when you need to build, compile, package, publish, or deploy an AL extension.
- [al-context-create](references/commands/al-context-create.md): Generate or update context.md file documenting project structure, architecture, and key patterns for AI assistants and developers. Use when you need to create project context documentation or update the context file.
- [al-initialize](references/commands/al-initialize.md): Initialize AL development environment and workspace for Business Central. Use when setting up a new project, initializing the workspace, or configuring the development environment.
- [al-memory-create](references/commands/al-memory-create.md): Generate or update memory.md file tracking decisions, changes, and learnings throughout project development for continuity across sessions. Use when you need to create or update memory, track decisions, or maintain session continuity.
- [al-pr-prepare](references/commands/al-pr-prepare.md): Prepare a clean, documented pull request draft for AL features or fixes with summary, testing notes, and checklist. Use when preparing a PR, creating a pull request, or documenting changes for review.
- [al-spec-create](references/commands/al-spec-create.md): Create or revise the canonical AL technical specification through AL Spec Agent, preserving approved architecture and human approval.
