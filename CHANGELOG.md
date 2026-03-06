# ALDC Core Changelog

## [3.2.0] - 2026-03-06

### Fixed

- Typo `user-invokable` corrected to `user-invocable` across all files
- Added `disable-model-invocation: true` to 3 internal subagents
- Fixed skill paths: `.github/skills/` corrected to `skills/` in aldc.yaml, collections, docs
- Fixed instruction counter: 7 corrected to 9 in copilot-instructions overview
- Fixed overview.md counters (primitives, agents, workflows, instructions)
- Fixed ROADMAP subagent count: 2 corrected to 3
- Version aligned to 3.2.0 across package.json, README, CHANGELOG

## [3.1.0] - 2026-03-05

### BC Agents Extension Pack

First ALDC Extension Pack — domain-specific tooling for Business Central Agent development.

**Added:**
- @al-agent-builder agent (Designer + SDK paths, 7-phase workflow with gates)
- skill-agent-instructions (Responsibilities-Guidelines-Instructions framework, official keywords)
- skill-agent-task-patterns (8 integration patterns: Public API, Page Action, Business Event, Attachment, Multi-Turn, Lifecycle, Session Detection, Session Event Binding)
- skill-agent-toolkit (Agent SDK reference: 3 core interfaces, setup patterns, troubleshooting, quality checklist)
- al-agent.create workflow (end-to-end coded agent creation)
- al-agent.task workflow (task integration code generation)
- al-agent.instructions workflow (instruction authoring)
- al-agent.test workflow (6-category test coverage)
- al-agent-toolkit instruction (Agent SDK reference and conventions)
- scaffold_agent.py tool (Agent Template project scaffolder)
- validate_agent_config.sh tool (SDK configuration validator with anti-pattern detection)
- Agent keywords reference (official BC runtime keywords)
- Example instructions: simple (credit check) + advanced (lead qualification with handoff)
- Extension Pack manifest and documentation
- Extension Packs section in ALDC Core Spec v1.1

**Framework:**
- Defined Extension Pack contract (MUST NOT override Core, MAY add agents/skills/workflows/tools)
- Added packs section to aldc.yaml for pack registration
- Integrated pack skills with Core agents (architect, implement-subagent, review-subagent load pack skills)

## v1.1.0 (2026-03-01)

### Added
- **Skills system**: 11 composable knowledge modules (`skills/` directory)
  - 7 required: api, copilot, debug, performance, events, permissions, testing
  - 4 recommended: migrate, pages, translate, estimation
- **Per-requirement contracts**: `{req_name}.{type}.md` naming convention in `.github/plans/`
- **Global memory**: single acumulativo `memory.md` replacing per-requirement memory files
- **Skill template**: `docs/templates/skill-template.md` (7th immutable template)
- **Skills catalog**: `skills/index.md`
- **Migration guide**: `docs/framework/ALDC-Migration-v1.0-to-v1.1.md`
- **Validator checks**: skills existence, requirement set completeness, global memory
- **Schema**: `skills`, `contracts`, `subagents` sections in `aldc.schema.json`
- **al-implement-subagent**: restored as TDD-only subagent with full AL development capabilities + skill loading

### Changed
- **Agent model reorganized**: 11 agents → 4 public + 3 internal subagents (skills-based modularization with preserved orchestration)
  - Public: al-architect, al-conductor, al-developer, al-presales
  - Internal: al-planning-subagent, al-implement-subagent, al-review-subagent
- **Workflow model simplified**: 18 prompts → 6 workflows
  - Retained: spec.create, build, pr-prepare, memory.create, context.create, initialize
  - 12 prompts absorbed into skills
- **aldc.yaml**: new `contracts`, `subagents`, `skills` sections
- **Compliance checklist**: expanded with skills and requirement set checks
- **Governance**: added skills governance (required = RFC, recommended = PR)

### Removed (absorbed into skills)
- Agents: al-debugger, al-tester, al-api, al-copilot
- Prompts: al-diagnose, al-events, al-performance, al-performance.triage, al-permissions, al-migrate, al-pages, al-translate, al-copilot-capability, al-copilot-promptdialog, al-copilot-generate, al-copilot-test

### Unchanged
- 9 instruction files (identical)
- Core principles (extension-only, HITL, TDD, spec-driven, architecture-first)
- 6 existing templates (spec, architecture, test-plan, memory, technical-spec, delivery)
- CI workflow structure

## v1.0.0 (2026-02-22)

- Initial release: ALDC Core backbone
- 4 canonical contracts in `.github/plans/`
- 5 Core agents + extension agents
- 5 Core workflows
- 9 instructions
- 6 immutable templates
- JSON schema + validator + CI action
- Governance model (founder-led, RFC process)
