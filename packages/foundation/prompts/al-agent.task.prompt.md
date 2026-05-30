---
agent: agent
tools: [vscode/askQuestions, vscode/toolSearch, edit/editFiles, search/codebase, 'microsoft-docs/*', 'upstash/context7/*', 'al-symbols-mcp/*', ms-dynamics-smb.al/al_symbolrelations]
description: "Generate AL code for Business Central Agent SDK task integration. Applies the patterns from skill-agent-task-patterns to produce production-ready codeunits, page extensions, and event subscribers — verified against the runtime API availability matrix."
---

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
