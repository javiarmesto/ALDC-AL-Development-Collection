# ALDC Skills Catalog

## What are Skills?

Skills are composable knowledge modules in markdown format that agents load on demand based on task context. They encapsulate domain-specific patterns, workflows, and best practices.

Skills follow the GitHub Copilot Agent Skills structure (`skills/{skill-name}/SKILL.md`). Copilot auto-loads skills based on their `description` frontmatter — agents no longer need `@file` references.

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

## Workflow skills (invoked explicitly)

Workflows that used to ship as `.prompt.md` files. Each one sets
`disable-model-invocation: true`, so it runs only when you type its slash
command, for example `/al-spec-create`. Text typed after the command is passed
to the workflow.

| Skill | Purpose |
|-------|---------|
| [al-spec-create](al-spec-create/SKILL.md) | Create or revise the technical specification through AL Spec Agent |
| [al-build](al-build/SKILL.md) | Build and package AL extensions |
| [al-pr-prepare](al-pr-prepare/SKILL.md) | Prepare a pull request draft |
| [al-memory-create](al-memory-create/SKILL.md) | Create or update `memory.md` |
| [al-context-create](al-context-create/SKILL.md) | Create or update `context.md` |
| [al-initialize](al-initialize/SKILL.md) | Set up the AL environment and workspace |
| [al-agent-create](al-agent-create/SKILL.md) | Create a coded Business Central agent (Agent SDK) |
| [al-agent-task](al-agent-task/SKILL.md) | Generate Agent SDK task integration code |
| [al-agent-instructions](al-agent-instructions/SKILL.md) | Write agent instructions |
| [al-agent-test](al-agent-test/SKILL.md) | Generate Agent SDK test codeunits |

## Creating New Skills

1. Create folder `skills/skill-{domain}/`
2. Copy `docs/templates/skill-template.md` to `skills/skill-{domain}/SKILL.md`
3. Fill in all sections (including frontmatter with `name` and `description`)
4. Keep under 500 lines (context window optimization)
5. Submit PR (required skills need RFC approval)

## Shared review procedure

[skill-al-review-pipeline](skill-al-review-pipeline/SKILL.md) is used by Developer Reviewer, the Conductor review subagent and Dredd. It separates execution, coverage and index generation.
