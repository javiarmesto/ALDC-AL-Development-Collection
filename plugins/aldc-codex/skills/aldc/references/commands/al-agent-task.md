## Codex host contract

Resolve .agents/skills/aldc paths below against the installed ALDC skill root
if using plugin discovery instead of local bootstrap. Workflow names below are
reference files in commands/, not automatically registered slash commands.
Packaged domain entrypoints named SKILL.md in the source are stored as GUIDE.md
under references/skills/. This alias applies only when reading packaged guidance;
new discoverable skills must still be created with SKILL.md.

Use only tools actually exposed by this session. Model, reasoning, sandbox and
approval settings inherit from the parent; this profile grants no extra tools.
Role write scopes below are behavioral, not filesystem sandboxes. Discover MCP
providers before using their examples; none are installed by this package.
If delegation is unavailable, report that the affected independent review or
Conductor workflow is pending; do not certify self-review as independent review.

# Workflow: Generate Agent Task Integration Code

Generates production-ready AL code for agent task integration. This prompt does not contain pattern knowledge — it applies the patterns from `skill-agent-task-patterns`.

**Load skill first**: `skill-agent-task-patterns` (8 patterns A–H, SDK codeunits, API availability matrix, OnPrem-only restrictions, workarounds).

## Step 1 — Gather context

Before generating code, determine:

1. **Agent name and prefix** — read from `app.json` or ask the developer
2. **Object ID range** — check existing objects in `app/` for the next available IDs
3. **Which pattern(s)** — ask or infer from the request:
   - "I need a Public API" → Pattern A
   - "Add a button to send work to the agent" → Pattern B (calls A)
   - "Trigger agent on posting/releasing" → Pattern C (calls A)
   - "Agent needs to process files" → Pattern D (combine with A/B/C)
   - "Continue an existing task" → Pattern E (verify `AddToTask` availability against the matrix)
   - "Run code only in agent context" → Pattern G/H
   - "Force human review" → Warning annotation workaround (matrix: `SetRequiresReview` OnPrem-only)
4. **ExternalId format** — convention `{PREFIX}-{No.}` (e.g. `LEAD-001`, `SO-1001`)
5. **Target page/table** — which page extension or event subscriber is needed?

## Step 2 — Verify availability

**Before writing any code**, check each method against the API Availability Matrix in `skill-agent-task-patterns`. Any method marked OnPrem-only or "Not in 17.0" requires the documented workaround.

## Step 3 — Generate code

For each requested pattern:

1. **Search the codebase** for existing agent objects (Setup table, Public API, enums) to reuse
2. **Generate AL objects** following the pattern from the skill, substituting:
   - `{Agent}` → actual agent name/prefix
   - `{id}` → actual object IDs
   - Record names, field names, enum values → actual project values
3. **Place files** in the correct folder of the project structure:
   - Public API + Impl → `app/Example/`
   - Page extensions → `app/Example/`
   - Session events → `app/Setup/TaskExecution/`
4. **Verify** generated code references correct enum values and codeunit names

## Step 4 — Validate

- [ ] All generated codeunits compile (correct parameter types, return types)
- [ ] Public API has `Access = Public`, Implementation has `Access = Internal`
- [ ] Event-driven task creation uses `[TryFunction]`
- [ ] Business conditions checked BEFORE task creation (outside TryFunction)
- [ ] Failures logged via `Session.LogMessage`
- [ ] ExternalId follows the agreed format convention
- [ ] Page extensions use `AgentSetup.OpenAgentLookup()` for agent selection
- [ ] No OnPrem-only methods invoked from Extension scope
- [ ] If `AddToTask` was needed, follow-up task workaround is in place

🛑 **STOP — Review generated code with the developer.**

## Skills Evidencing

End with:

```
**Skills loaded**: skill-agent-task-patterns
**Patterns applied**:
- Pattern {X} — {file where applied}
- API matrix verified: {list any OnPrem/future methods that triggered workarounds}
```
