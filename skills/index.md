# ALDC Skills Catalog

## What are Skills?

Skills are composable knowledge modules in markdown format that agents load on demand based on task context. They encapsulate domain-specific patterns, workflows, and best practices.

Skills are NOT invocable directly — agents reference them via `@file` when the task requires specialized knowledge.

## Required Skills (MUST exist)

| Skill | Domain | Loaded by |
|-------|--------|-----------|
| [skill-api](skill-api/SKILL.md) | API design, OData/REST, versioning | architect, developer |
| [skill-copilot](skill-copilot/SKILL.md) | Copilot capability lifecycle | architect, developer |
| [skill-debug](skill-debug/SKILL.md) | Debugging, profiling, root cause | developer |
| [skill-performance](skill-performance/SKILL.md) | Performance patterns, triage | architect, developer |
| [skill-events](skill-events/SKILL.md) | Event subscriber/publisher patterns | architect, developer |
| [skill-permissions](skill-permissions/SKILL.md) | Permission sets, security | developer |
| [skill-testing](skill-testing/SKILL.md) | Test strategy, Given/When/Then | conductor, developer |

## Recommended Skills (SHOULD exist)

| Skill | Domain | Loaded by |
|-------|--------|-----------|
| [skill-migrate](skill-migrate/SKILL.md) | Version migration, breaking changes | developer |
| [skill-pages](skill-pages/SKILL.md) | Page types, UX patterns | developer |
| [skill-translate](skill-translate/SKILL.md) | XLF, multi-language | developer |
| [skill-estimation](skill-estimation/SKILL.md) | Project estimation, SWOT | presales |

## Creating New Skills

1. Create folder `skills/skill-{domain}/`
2. Copy `docs/templates/skill-template.md` to `skills/skill-{domain}/SKILL.md`
3. Fill in all sections (including frontmatter with `name` and `description`)
4. Keep under 500 lines (context window optimization)
5. Submit PR (required skills need RFC approval)
