# :material-file-document-edit-outline: AL Spec Agent — Specification Owner

**Role:** Turn an approved Business Central requirement and architecture into one implementable AL specification. Owns technical contracts and acceptance criteria; never writes AL implementation or changes the architecture.

## When it is used

- After `al-architect` approves the design (MEDIUM / HIGH complexity), through the `al-spec.create` workflow.
- Directly for LOW complexity requirements with clear requisites.
- To revise an existing `{req_name}.spec.md` when Architect assigns a bounded scope or a contradiction is found.

Architect decides the specification boundaries, shared contracts and dependencies. Spec Agent develops the assigned contracts and acceptance criteria, identifies missing prerequisites and returns material contradictions to Architect instead of resolving them alone. A joint review of the current specification revisions precedes implementation.

## Inputs and outputs

| Input | Output |
|-------|--------|
| Approved `{req_name}.architecture.md` (or requisites for LOW complexity) | `.github/plans/{req_name}/{req_name}.spec.md` following the specification template |
| Current spec path when revising | Object IDs, field types, procedure signatures, event patterns and acceptance criteria |
| Architect-assigned scope and dependencies | Open questions and unresolved prerequisites, kept explicit rather than guessed |

## Boundaries

- Reads `app.json`, target-version sources and symbols to resolve contracts; asks the implementation owner to download symbols or change dependencies.
- No builds, tests, dependency changes, AL bodies at MEDIUM complexity or code review.
- The specification is approved by a human before `al-conductor` or `al-developer` implements it.

## Relationship with other agents

`al-architect` → **al-spec-agent** (`/al-spec.create`) → human approval → `al-conductor` (MEDIUM / HIGH) or `al-developer` (LOW). Specifications eligible for parallel drafting are not permission for concurrent code changes.

Source contract: [`agents/al-spec-agent.agent.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/agents/al-spec-agent.agent.md) · Workflow: [Specifications](../prompts/al-spec.create.prompt.md) · [Spec Agent and architecture contracts](../spec-agent.md)
