---
description: Generate optimized natural language instructions for Business Central agents (Designer or SDK). Applies the Responsibilities-Guidelines-Instructions framework from skill-agent-instructions. Output stored in .resources/Instructions/InstructionsV1.txt for SDK agents. ALDC workflow (Copilot prompt al-agent.build-instructions); invoke explicitly.
disable-model-invocation: true
---

> **Copilot CLI adapter — generated; do not edit this distribution.**
> Select a role using /agent or copilot --agent <id>. Role names in this contract
> are routing destinations, never chat mentions or evidence of an invocation.
> Delegate only through the native task tool, using the exact discovered agent ID
> as agent_type (for example al-planning-subagent). Inspect list_agents and the
> actual task schema first. Keep all canonical human gates. Pass bounded context
> inline; wait for completion (read_agent for a background task) before consuming
> the result. A delegated role returns questions to its caller for the human gate.
> If task or the requested custom agent is unavailable in this context, return
> the blocked handoff to the caller/user. Never impersonate a missing subagent,
> silently substitute general-purpose, or launch another CLI process to fake it.
> Tool aliases in frontmatter select capabilities; call the actual tools exposed
> by the host: view, glob, grep/rg, edit/create/apply_patch, bash/powershell,
> web_fetch, task. Use a capability only when granted to this role and available.
> Load domain skills through the host's skill mechanism when exposed, otherwise
> read the complete bundled SKILL.md. A read is not a native skill invocation.
> Resolve PLUGIN_ROOT to this installed agent's plugin directory (not the project
> or original checkout). It is a path placeholder here, not a promised global
> shell variable. Read skills/skill-migrate/references/cli-al-tools.md there.
> Project instructions and matching .github/instructions rules remain binding;
> pass the relevant excerpts to delegated roles. Canonical artifacts remain in
> .github/plans/. Role write scopes are behavioral, not filesystem sandboxes.
> AL execution requires a verified terminal command/runner or an actually exposed
> MCP capability. Editor-only debugging/navigation is unavailable in this CLI.
> Record missing capabilities and unexecuted checks explicitly; never simulate.


# Workflow: Generate Agent Instructions

Applies the Responsibilities-Guidelines-Instructions framework from `skill-agent-instructions` to produce a runtime-ready instruction file. This prompt does not contain the framework — it executes it.

**Load skill first**: `skill-agent-instructions` (framework, keywords table, validation checklist, anti-patterns).

## Output modes

- **Designer mode** → text ready to paste into the Agent Designer wizard
- **SDK mode** → text stored in `.resources/Instructions/InstructionsV1.txt`, loaded via `NavApp.GetResourceAsText()` returning `SecretText`, applied via `Agent.SetInstructions(UserSecurityId, InstructionsText)`

## Workflow

### 1. Gather inputs

From the developer:

1. **Agent purpose** — one-sentence business goal
2. **Pages in scope** — pages included in the agent's profile
3. **Fields to read/write** — exact field names from those pages
4. **Actions to invoke** — exact action captions on those pages
5. **Decision criteria** — business rules for branching (if/then)
6. **Output format** — how should the agent report results?
7. **Safety gates** — which actions need user intervention?

### 2. Draft RESPONSIBILITY

One sentence with business domain + outcome. No paragraphs.

### 3. Draft GUIDELINES

3–7 cross-task rules. Required: at least one **ALWAYS**, one **DO NOT**, one safety gate for critical actions, one data-access boundary (read-only vs read-write).

### 4. Draft INSTRUCTIONS per task

For each task:

1. Start with navigation (how does the agent reach the data?)
2. Read and **MEMORIZE** context before decisions
3. Apply business logic with explicit if/then branches
4. Execute actions using proper keywords (see `skill-agent-instructions` keywords table)
5. Report results with structured **Reply** format
6. Include error handling at the end of the task

### 5. Validate

Run through the validation checklist from `skill-agent-instructions`. Key items:

- [ ] Page/field/action names match agent profile exactly
- [ ] **MEMORIZE** placed BEFORE value is needed in later steps
- [ ] **MEMORIZE** includes example format
- [ ] Critical actions gated by user intervention or review
- [ ] Written in English
- [ ] Environment-agnostic (no hardcoded company names, URLs, user IDs)
- [ ] Error handling section per task
- [ ] No references to "Tell Me"
- [ ] Guidelines count is 3–7
- [ ] Stored in `.resources/Instructions/InstructionsV1.txt` (SDK mode)

### 6. Test and iterate

Deploy → observe timeline → refine. Apply the "less is more" principle.

## Reference

For the framework details, keyword tables, anti-patterns, and complete examples, consult `skill-agent-instructions` and `${PLUGIN_ROOT}/skills/skill-agent-instructions/examples/`.

## Skills Evidencing

End with:

```
**Skills loaded**: skill-agent-instructions
**Patterns applied**:
- RGI framework — Responsibilities/Guidelines/Instructions structure
- Keywords applied: {list keywords used: Navigate to, Memorize, Reply, etc.}
- Safety gates: {list user intervention / review points}
```
