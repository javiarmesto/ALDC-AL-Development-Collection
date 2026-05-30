# ALDC Core Changelog

## [4.0.0] - 2026-05-30

### Token Efficiency & Foundation Restructure

**Breaking Changes:**

- Primitives reorganized into a `packages/foundation/` structure (agents, instructions, prompts, skills) alongside the existing root layout
- Agent, instruction, and skill content condensed to reduce token consumption — wording and structure changed, behavior preserved

**Added:**

- `packages/foundation/` package layout for framework primitives
- Architecture Decision Records (`docs/decisions/`): ADR-0001 (Phase 1 restructure), ADR-0002 (distribution lifecycle), ADR-0003 (package structure)
- `al-agent.build-instructions` prompt
- `skill-manifest` SKILL entry and `skill-agent-task-patterns` usage examples

**Changed:**

- Agents, instructions, and skills optimized for lower token footprint while preserving behavior and orchestration
- Documentation templates (spec, architecture, delivery, technical-spec, test-plan) condensed for token efficiency
- Prompts revised for conciseness and clearer GitHub Copilot alignment
- All instruction files and templates translated to English

## [3.2.3] - 2026-04-24

### Updated
- Agents updated with improved model references and refined LLM prompting strategies
- Prompts revised for clarity and better GitHub Copilot alignment
- Tools and workflows enhanced with latest framework improvements
- New `skill-manifest` skill: Extension Manifest Generator for BC extensions
- Claude plugin updated: commands, rules, and skills aligned with framework v3.2.3

## [3.2.0] - 2026-03-06

### Fixed

- Corrected `user-invocable` frontmatter across all agents
- Internal subagents now declare `disable-model-invocation: true`
- Skill paths aligned to `skills/` convention in all config and documentation
- Counters and version references aligned across the framework

## [3.1.0] - 2026-03-05

### BC Agent Builder

Optional agent and skills for Business Central Agent development with the AI Development Toolkit and Agent SDK.

- **@AL Agent Builder** agent — Designer (no-code) and SDK (pro-code) paths, 7-phase workflow with HITL gates
- **skill-agent-instructions** — Responsibilities-Guidelines-Instructions authoring framework
- **skill-agent-task-patterns** — 8 integration patterns (Public API, Page Action, Business Event, Attachment, Multi-Turn, Lifecycle, Session Detection, Session Event Binding)
- **skill-agent-toolkit** — Agent SDK reference (core interfaces, setup, troubleshooting, quality checklist)
- Workflows: al-agent.create, al-agent.task, al-agent.instructions, al-agent.test
- Tools: scaffold_agent.py (project scaffolder), validate_agent_config.sh (SDK validator)

## [1.1.0] - 2026-03-01

### Added

- **Skills system** — 11 composable knowledge modules loaded on demand by agents
  - 7 required: api, copilot, debug, performance, events, permissions, testing
  - 4 recommended: migrate, pages, translate, estimation
- **Per-requirement contracts** — `{req_name}.spec.md`, `.architecture.md`, `.test-plan.md` in `.github/plans/`
- **Global memory** — cross-session `memory.md` for project-wide decisions and context
- **Skill template** — 7th immutable template for creating new skills

### Changed

- **Agent model**: 11 agents → 4 public + 3 internal subagents
  - Public: al-architect, al-conductor, al-developer, al-presales
  - Internal: AL Planning Subagent, AL Implementation Subagent, AL Code Review Subagent
- **Workflow model**: 18 prompts → 6 workflows (spec.create, build, pr-prepare, memory.create, context.create, initialize)
- Specialized agent capabilities (debug, events, API, etc.) absorbed into composable skills

### Removed

- Public agents: al-debugger, al-tester, al-api, al-copilot (capabilities preserved as skills)
- 12 single-purpose prompts (replaced by skill system)

## [1.0.0] - 2026-02-22

- Initial release — ALDC Core backbone
- 4 canonical contracts, 5 agents, 5 workflows, 9 instructions, 6 templates
- JSON schema, validator, CI action
- Governance model (founder-led, RFC process)
