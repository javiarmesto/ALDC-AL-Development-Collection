# ALDC Core Changelog

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
