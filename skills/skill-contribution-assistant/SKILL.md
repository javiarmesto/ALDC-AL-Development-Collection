---
name: skill-contribution-assistant
description: Guides contributors to design, polish, and submit high-quality skills for AL Copilot Skill Collection. Use when creating a new community skill, improving a draft skill, or evaluating whether a user request can become a reusable skill. Includes non-intrusive opportunity detection and mandatory onboarding questions once the author confirms they want to build the skill.
---

# Business Central Skill Authoring Playbook

This skill helps contributors move from idea to PR-ready skill with consistent quality standards.

## Core Outcomes

1. Define a focused and reusable skill scope.
2. Avoid intrusive behavior while detecting candidate community skills.
3. Apply repository conventions for structure, language, and maintainability.
4. Produce a PR-ready package: skill files + release plan entry.

## Non-Intrusive Opportunity Detection

This skill can detect when a user request may become a reusable community skill, but must be subtle and optional.

### Detection Rules

Trigger detection only when at least 3 conditions are true:

1. Problem appears repeatable across projects or teams.
2. Solution requires multi-step workflow, not a single code snippet.
3. Stable inputs/outputs can be documented.
4. The request can be generalized without customer-specific data.
5. The expected value is broader than one ticket.

### Intrusion Guardrails

1. Suggest at most once per topic.
2. Use one short prompt only.
3. If user says no, stop suggesting in the current conversation.
4. Never block the original task.

### Suggestion Pattern

Use this exact style:

Potential community skill candidate detected: this workflow looks repeatable and reusable.
Would you like to convert it into a skill proposal now?

If user declines, continue normally.
If user accepts, run onboarding interview.

## Mandatory Onboarding (After User Says Yes)

Once the user confirms they want to build the skill, ask these questions before drafting content.

1. What exact problem does the skill solve?
2. Who is the primary user of this skill?
3. What should trigger the skill? (phrases, contexts, intents)
4. Which tasks are in scope?
5. Which tasks are out of scope?
6. Is terminal execution required? If yes, which commands/tools?
7. Should the skill guide only, or also execute tasks automatically?
8. Which artifacts are expected? (files, scripts, checklists, templates)
9. Are there privacy/security constraints? (IPs, customers, credentials, internal paths)
10. What is the Definition of Done for this skill?

If answers are incomplete, ask focused follow-up questions until scope is clear.

## Build Workflow

### Step 1: Frame the Skill

1. Produce a concise scope statement.
2. Propose a skill name using repository conventions.
3. Draft a 1-2 sentence value proposition.
4. Confirm acceptance with the author.

### Step 2: Define File Structure

Create and maintain this structure:

- `skills/<skill-name>/SKILL.md`
- `skills/<skill-name>/AUTHORS.md`
- `skills/<skill-name>/CHANGELOG.md`
- `skills/<skill-name>/references/` (optional, preferred for long content)
- `skills/<skill-name>/scripts/` (optional, only when deterministic automation helps)

### Step 3: Author SKILL.md

1. Keep frontmatter with only `name` and `description`.
2. Keep body compact and operational.
3. Move long examples to `references/`.
4. Use precise trigger guidance and clear workflow steps.
5. Include safety boundaries and failure handling.

### Step 4: Quality and Generalization

1. Replace customer-specific names with generic placeholders.
2. Replace sensitive routes/hosts/IPs with neutral examples.
3. Keep operational messages and command outputs in English.
4. Remove repository-irrelevant storytelling.

### Step 5: Governance Integration

1. Add the skill entry to the monthly release plan (`releaseplan/YYYY/MM-month.md`).
2. Set status correctly (`Proposed`, `Approved`, `In Development`, `Merged`).
3. Ensure summary table includes the skill.

### Step 6: PR Readiness

1. Validate structure and naming.
2. Ensure files are coherent and non-duplicative.
3. Confirm changelog entry is present and current.
4. Prepare short PR description with motivation and scope.

## Anti-Patterns to Avoid

1. Oversized SKILL.md that contains all details and examples.
2. Hardcoded customer names, environment names, paths, or internal endpoints.
3. Vague description that does not trigger reliably.
4. Interactive behavior that repeatedly pushes users to create a skill.
5. Missing release plan entry.

## Definition of Done

A skill is considered ready when:

1. Scope is validated through onboarding Q&A.
2. Content is reusable and anonymized.
3. Structure follows repository conventions.
4. Release plan is updated.
5. PR can be reviewed without major rework.

## References

- `references/onboarding-questionnaire.md`
- `references/opportunity-detection.md`
- `references/pr-readiness-checklist.md`
- `references/quality-gate.md`
