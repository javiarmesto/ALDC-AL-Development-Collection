---
name: skill-agent-instructions
description: "Generate, review, and optimize natural language instructions for Business Central agents (Designer or SDK). Triggers on: agent instructions, InstructionsV1.txt, InstructionsV2.txt, MEMORIZE, qualification rules, agent behavior, instruction keywords, agent task instructions, iterate instructions, or improve agent accuracy. Single source of truth for the Responsibilities-Guidelines-Instructions framework and runtime keywords."
argument-hint: "Describe the agent's purpose and tasks, or paste existing instructions to review"
---

# BC Agent Instructions Skill

Single source of truth for writing the natural-language instructions that guide Business Central agents. These instructions tell the agent runtime how to navigate the UI, read/set fields, invoke actions, and communicate with users.

For SDK architecture and how instructions are loaded see `skill-agent-toolkit`. For task-creation patterns (Public API, attachments, multi-turn) see `skill-agent-task-patterns`.

## Storage modes

| Mode         | Storage                                    | Loaded by                                          |
| ------------ | ------------------------------------------ | -------------------------------------------------- |
| **SDK**      | `.resources/Instructions/InstructionsV1.txt` | `NavApp.GetResourceAsText()` → `SecretText` → `Agent.SetInstructions()` |
| **Designer** | Paste into Agent Designer wizard text field | Runtime reads directly from configuration          |

**References**:
- [Write effective instructions](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-instructions)
- [Instruction keywords](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-instruction-keywords)
- [Best practices](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-best-practices)

## Key facts about the runtime

- Instructions are the PRIMARY lever for controlling agent behavior
- The runtime has specific tools: field setting, lookups, action invocation, page navigation, email composition
- Instructions must use specific keywords to activate these tools effectively
- Only English is fully supported — safeguards are optimized for English
- Shorter, well-structured instructions often outperform verbose ones
- The agent retains action history but NOT page state — use **MEMORIZE**

## Framework: Responsibilities → Guidelines → Instructions

Every instruction file follows this three-part structure.

### 1. RESPONSIBILITY (one line)

A single sentence defining the agent's accountability. Anchors all behavior.

```
**RESPONSIBILITY**: {What the agent is accountable for — one sentence}
```

Rules:
- One sentence only — no paragraphs
- State the business outcome, not technical implementation
- Include the key domain nouns ("leads", "sales orders", "credit checks")

### 2. GUIDELINES (cross-task rules)

Rules that apply across all tasks.

```
**GUIDELINES**:
- ALWAYS {mandatory behavior}
- DO NOT {prohibited action}
- ALWAYS {safety/review gate}
```

Rules:
- **ALWAYS** (bold) for mandatory behaviors
- **DO NOT** (bold) for prohibited actions
- Gate ALL critical actions (posting, sending, releasing, deleting) with user intervention
- Include data access boundaries (read-only vs. read-write)
- Include reply/output keywords the agent should use for structured responses
- Keep to 3-7 guidelines — more causes confusion

### 3. INSTRUCTIONS (step-by-step per task)

Ordered steps for each task, using runtime keywords.

```
**INSTRUCTIONS**:

## Task: {Task Name}

1. {Action using keyword}
   a. {Sub-step with detail}
   b. {Sub-step with detail}
2. If {condition}: {action}
   a. **DO NOT** {prohibited action in this context}
3. {Next action}
```

Rules:
- One `## Task:` section per distinct workflow
- Numbered steps with lettered sub-steps
- Use official keywords (table below) to activate runtime tools
- Place **MEMORIZE** BEFORE the value is needed in later steps
- Include error handling at the end of each task
- Provide example formats for memorized data

## Official runtime keywords

| Keyword                       | Runtime tool           | Usage                                                                 |
| ----------------------------- | ---------------------- | --------------------------------------------------------------------- |
| `Navigate to "{Page Name}"`   | Page navigation        | Opens a page. Name MUST match the agent's profile pages exactly.      |
| `Search for {value} in "{Field}"` | List filtering     | Filters a list page by a field value.                                 |
| `Set field "{Field}" to {value}` | Field setter        | Sets a field. Field name must match the page exactly.                 |
| `Use lookup`                  | Lookup trigger         | Opens a lookup on the current field.                                  |
| `Invoke action "{Action}"`    | Action invocation      | Triggers a page action. Name must match the action caption exactly.   |
| `Read "{Field}"`              | Value retrieval        | Reads a field's current value for decision-making.                    |
| `**Memorize**`                | State retention        | Stores a key-value pair for reference in later steps.                 |
| `**Reply**`                   | Message output         | Agent responds to the task. All outgoing messages require review.     |
| `Write an email`              | Email composition      | Composes an email. Requires user review before sending.               |
| `Request user intervention`   | Human-in-the-loop      | Pauses the agent and asks the user for input/decision.                |
| `Request a review`            | Review gate            | Asks user to review work before the agent continues.                  |
| `Ask for assistance`          | Help request           | Agent seeks help when stuck or encounters an error.                   |

**Critical keyword rules**:
- Page, field, and action names MUST match exactly what the agent sees in its profile
- **MEMORIZE** must include an example format: `**Memorize**: "Customer: ACME Corp | Credit: 50,000"`
- **Reply** keywords should include structured output patterns for programmatic parsing
- The agent does NOT have access to "Tell Me" — all navigation must be via explicit page names

## Step-by-step creation workflow

1. **Gather inputs**: agent purpose (1 sentence), pages in scope, fields to read/write, actions to invoke, decision criteria, output format, safety gates
2. **Draft RESPONSIBILITY**: one sentence with domain + outcome
3. **Draft GUIDELINES**: 3-7 rules — at least one ALWAYS, one DO NOT, one safety gate
4. **Draft INSTRUCTIONS per task**: navigate → read+MEMORIZE → branch → execute → Reply
5. **Validate** with the checklist below
6. **Test and iterate**: deploy → observe timeline → refine. Simpler instructions often perform better.

## Validation checklist

- [ ] Page names match agent profile and page customizations exactly
- [ ] Field names match the fields visible on the agent's pages exactly
- [ ] Action names match the action captions visible on the agent's pages
- [ ] **MEMORIZE** placed BEFORE the memorized value is needed in later steps
- [ ] **MEMORIZE** includes example format (e.g., "Key: value | Key: value")
- [ ] All critical actions (posting, sending, releasing, deleting) gated by user intervention or review
- [ ] Written in English — agent safeguards are optimized for English
- [ ] Environment-agnostic — no hardcoded company names, URLs, user IDs
- [ ] Concise — no redundant prose; each line serves a purpose
- [ ] Error handling section covers: not found, unavailable pages, failed actions
- [ ] Reply formats use consistent keywords for structured parsing
- [ ] No references to "Tell Me" (agents cannot use it)
- [ ] Guidelines count is 3-7 (not too few, not too many)
- [ ] Each task has numbered steps with lettered sub-steps

## Anti-patterns

| Anti-pattern                          | Problem                                           | Fix                                                    |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| No MEMORIZE before cross-page use     | Agent loses field values when navigating away      | Add MEMORIZE immediately after reading the value        |
| Vague field names ("the amount")      | Agent cannot resolve which field to set            | Use exact field name: `Set field "Estimated Budget"`    |
| Missing error handling                | Agent halts or produces confusing output           | Add error Reply for each failure scenario               |
| Too many guidelines (>7)              | Agent behavior becomes inconsistent                | Consolidate into fewer, broader rules                   |
| Referencing pages not in profile      | Agent cannot navigate there                        | Verify all pages are in the agent's profile             |
| No user intervention on critical ops  | Agent posts/sends/releases without human check     | Add `Request user intervention` or `Request a review`   |
| Contradictory guidelines              | Unpredictable behavior on each run                 | Remove contradictions, prioritize by specificity        |
| Hard-coded environment values         | Instructions break across environments             | Use generic references, let setup tables hold specifics |
| Referencing specific tools by name    | Tool renames cause regressions                     | Describe WHAT to do, not WHICH tool to use              |

## Advanced concepts

### Page-specific dynamic instructions

For SDK agents, `IAgentTaskExecution.GetAgentTaskPageContext` injects dynamic context per page using Liquid-style conditionals:

```
Consider the following fields:
{% if page.id == 42 %}
Field "The Answer" — the meaning of the universe
{% else %}
Field "Business Data" — standard business field
{% endif %}
```

### Multi-task instructions

When an agent handles multiple tasks, create separate `## Task:` sections. The agent selects the task based on input message content. Use distinct keywords in the Reply for programmatic routing:

```
## Task: Qualify Lead
...Reply: "qualification successful | ..."

## Task: Re-evaluate Lead
...Reply: "re-evaluation complete | ..."
```

### Agent-to-agent handoff

When one agent creates tasks for another:
- Verify the target agent is configured (check setup fields)
- Use page actions that trigger task creation (the action handles the API call)
- MEMORIZE the handoff result for the final reply
- Include fallback instructions if the handoff action is unavailable

## Examples

Load an example only when you need a concrete template:

- When writing a minimal single-task agent, see [Simple instructions](./examples/agent-simple-instructions.txt) (credit check).
- When building a multi-task agent with handoff and error handling, see [Advanced instructions](./examples/agent-advanced-instructions.txt) (lead qualifier).
- If you need to look up a runtime keyword, see [Keywords reference](./references/agent-keywords-reference.md).
