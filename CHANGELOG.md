# ALDC Core Changelog

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
