---
agent: agent
tools: ["codebase", "editFiles"]
description: "Generate AL code for Business Central Agent SDK task integration. Applies the patterns from bc-agent-task-patterns skill to generate production-ready codeunits, page extensions, and event subscribers."
---

# Workflow: Generate Agent Task Integration Code

You are an expert AL developer. Generate production-ready AL code for agent task integration.

The skill `bc-agent-task-patterns` provides the 8 integration patterns and SDK codeunit reference. Use it as your knowledge base.

## Step 1 — Gather Context

Before generating code, determine:

1. **Agent name and prefix**: Read from `app.json` or ask the developer
2. **Object ID range**: Check existing objects in `app/` to find the next available IDs
3. **Which pattern(s)**: Ask the developer or infer from their request:
   - "I need a Public API" → Pattern A
   - "Add a button to send work to the agent" → Pattern B (calls A)
   - "Trigger agent on posting/releasing" → Pattern C (calls A)
   - "Agent needs to process files" → Pattern D (combine with A/B/C)
   - "Continue an existing task" → Pattern E
   - "Run code only in agent context" → Pattern G/H
4. **ExternalId format**: Convention is `{PREFIX}-{No.}` (e.g., `LEAD-001`, `SO-1001`)
5. **Target page/table**: Which page extension or event subscriber is needed?

## Step 2 — Generate Code

For each requested pattern:

1. **Search the codebase** for existing agent objects (Setup table, Public API, enums) to reuse
2. **Generate the AL objects** following the pattern from the skill, substituting:
   - `{Agent}` → actual agent name/prefix
   - `{id}` → actual object IDs
   - Record names, field names, enum values → actual project values
3. **Place files** in the correct project structure folder:
   - Public API + Impl → `app/Example/`
   - Page extensions → `app/Example/`
   - Session events → `app/Setup/TaskExecution/`
4. **Verify** generated code references correct enum values and codeunit names from the project

## Step 3 — Validate

- [ ] All generated codeunits compile (correct parameter types, return types)
- [ ] Public API has `Access = Public`, Implementation has `Access = Internal`
- [ ] Event-driven task creation uses `[TryFunction]`
- [ ] Business conditions checked BEFORE task creation
- [ ] Failures logged via `Session.LogMessage`
- [ ] ExternalId follows the agreed format convention
- [ ] Page extensions use `AgentSetup.OpenAgentLookup()` for agent selection

🛑 **STOP — Review generated code with the developer.**
