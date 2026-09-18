## Codex host contract

Resolve .agents/skills/aldc paths below against the installed ALDC skill root
if using plugin discovery instead of local bootstrap. Workflow names below are
reference files in commands/, not automatically registered slash commands.
Packaged domain entrypoints named SKILL.md in the source are stored as GUIDE.md
under references/skills/. This alias applies only when reading packaged guidance;
new discoverable skills must still be created with SKILL.md.

Read the terminal-host contract at
`.agents/skills/aldc/references/skills/skill-migrate/references/cli-al-tools.md`
before choosing AL tools, changing dependencies or reporting BC29 / AL18
validation. Use only tools actually exposed by this session. Model, reasoning and approval
settings inherit from the parent; this profile grants no extra tools. Its
`sandbox_mode` is derived from the write scope the canonical contract grants this
role, and the session's own permission profile is reapplied over it, so that key
narrows and never grants. The narrower role write scopes stated below are still
behavioral: `sandbox_mode` cannot express them, and honouring them is yours. Discover MCP
providers before using their examples; none are installed by this package.
If delegation is unavailable, report that the affected independent review or
Conductor workflow is pending; do not certify self-review as independent review.

The `handoffs:` entries of the canonical contract, and the `send: false` on some
of them, have no equivalent here. In Copilot a handoff is a button the human
clicks, and `send: false` additionally hands them the prompt to review before it
is sent: the host supplies the approval. Codex has no such step, so the gate is
yours to keep — never auto-delegate. Present your output, get explicit approval,
and only then delegate or switch role.

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

For the framework details, keyword tables, anti-patterns, and complete examples, consult `skill-agent-instructions` and `.agents/skills/aldc/references/skills/skill-agent-instructions/examples/`.

## Skills Evidencing

End with:

```
**Skills loaded**: skill-agent-instructions
**Patterns applied**:
- RGI framework — Responsibilities/Guidelines/Instructions structure
- Keywords applied: {list keywords used: Navigate to, Memorize, Reply, etc.}
- Safety gates: {list user intervention / review points}
```
