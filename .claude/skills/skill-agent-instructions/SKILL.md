---
name: skill-agent-instructions
description: "Generate, review, and optimize natural language instructions for Business Central agents (Designer or SDK). Triggers on: agent instructions, InstructionsV1.txt, InstructionsV2.txt, MEMORIZE, qualification rules, agent behavior, instruction keywords, agent task instructions, iterate instructions, or improve agent accuracy. Follows the Responsibilities-Guidelines-Instructions framework with official BC agent runtime keywords."
argument-hint: "Describe the agent's purpose and tasks, or paste existing instructions to review"
---

# BC Agent Instructions Skill

Generate production-quality natural language instructions that guide Business Central agents. These instructions define what the agent does, how it behaves, and what steps it follows in the BC UI.

## Context: What Are Agent Instructions?

Agent instructions are natural language text stored in `.resources/Instructions/InstructionsV1.txt` (SDK agents) or pasted into the Agent Designer wizard (no-code agents). The BC agent runtime interprets these instructions to navigate pages, read/set fields, invoke actions, and communicate with users.

**Key facts**:
- Instructions are the PRIMARY lever for controlling agent behavior
- The agent runtime has specific tools: field setting, lookups, action invocation, page navigation, email composition
- Instructions must use specific keywords to activate these runtime tools effectively
- Only English is fully supported — safeguards are optimized for English
- Shorter, well-structured instructions often outperform verbose ones

**References**:
- [Write effective instructions](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-instructions)
- [Instruction keywords](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-instruction-keywords)
- [Best practices](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-best-practices)

## Storage Modes

| Mode         | Storage                                    | Loaded By                                          |
| ------------ | ------------------------------------------ | -------------------------------------------------- |
| **SDK**      | `.resources/Instructions/InstructionsV1.txt` | `NavApp.GetResourceAsText()` → `SecretText` → `Agent.SetInstructions()` |
| **Designer** | Paste into Agent Designer wizard text field | Runtime reads directly from configuration          |

## Framework: Responsibilities → Guidelines → Instructions

Every instruction file follows this three-part structure:

### 1. RESPONSIBILITY (one line)

A single sentence defining the agent's accountability. This anchors all behavior.

```
**RESPONSIBILITY**: {What the agent is accountable for — one sentence}
```

**Rules**:
- One sentence only — no paragraphs
- State the business outcome, not technical implementation
- Include the key domain nouns (e.g., "leads", "sales orders", "credit checks")

### 2. GUIDELINES (cross-task rules)

Rules that apply across ALL tasks. These constrain the agent's behavior globally.

```
**GUIDELINES**:
- ALWAYS {mandatory behavior}
- DO NOT {prohibited action}
- ALWAYS {safety/review gate}
```

**Rules**:
- Use **ALWAYS** (bold) for mandatory behaviors
- Use **DO NOT** (bold) for prohibited actions
- Gate ALL critical actions (posting, sending, releasing, deleting) with user intervention
- Include data access boundaries (read-only vs. read-write)
- Include reply/output keywords the agent should use for structured responses
- Keep to 3-7 guidelines — more causes confusion

### 3. INSTRUCTIONS (step-by-step per task)

Ordered steps for each specific task, using runtime keywords.

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

**Rules**:
- One `## Task:` section per distinct workflow
- Numbered steps with lettered sub-steps
- Use official keywords (see below) to activate runtime tools
- Place **MEMORIZE** BEFORE the value is needed in later steps
- Include error handling at the end of each task
- Provide example formats for memorized data

## Official Instruction Keywords

These keywords trigger specific tools in the BC agent runtime:

| Keyword                       | Runtime Tool           | Usage                                                                 |
| ----------------------------- | ---------------------- | --------------------------------------------------------------------- |
| `Navigate to "{Page Name}"`   | Page navigation        | Opens a page. Name MUST match the agent's profile pages exactly.      |
| `Search for {value} in "{Field}"` | List filtering     | Filters a list page by a field value.                                 |
| `Set field "{Field}" to {value}` | Field setter        | Sets a field to a value. Field name must match the page exactly.      |
| `Use lookup`                  | Lookup trigger         | Opens a lookup on the current field.                                  |
| `Invoke action "{Action}"`    | Action invocation      | Triggers a page action. Name must match the action caption exactly.   |
| `Read "{Field}"`              | Value retrieval        | Reads a field's current value for decision-making.                    |
| `**Memorize**`                | State retention        | Stores a key-value pair for reference in later steps.                 |
| `**Reply**`                   | Message output         | Agent responds to the task. All outgoing messages require review.     |
| `Write an email`              | Email composition      | Composes an email. Requires user review before sending.               |
| `Request user intervention`   | Human-in-the-loop      | Pauses the agent and asks the user for input/decision.                |
| `Request a review`            | Review gate            | Asks user to review work before the agent continues.                  |
| `Ask for assistance`          | Help request           | Agent seeks help when stuck or encounters an error.                   |

### Critical keyword rules:
- Page names, field names, and action names MUST match exactly what the agent sees in its profile
- **MEMORIZE** must include an example format: `**Memorize**: "Customer: ACME Corp | Credit: 50,000"`
- **Reply** keywords should include structured output patterns for programmatic parsing
- The agent does NOT have access to "Tell Me" — all navigation must be via explicit page names or role center links

## Agent History & State

The agent retains:
- Every action performed in the current session
- Every search run on list pages, with results

The agent does NOT retain:
- Full state of every page visited
- Values from previous pages unless explicitly **Memorized**

This is why **MEMORIZE** is critical — without it, the agent loses context when navigating between pages.

## Step-by-Step Creation Workflow

### Step 1: Gather inputs

Before writing instructions, collect:

1. **Agent purpose**: One-sentence business goal
2. **Pages in scope**: Which pages does the agent's profile include?
3. **Fields to read/write**: Exact field names from those pages
4. **Actions to invoke**: Exact action captions available on those pages
5. **Decision criteria**: Business rules for branching (if/then)
6. **Output format**: How should the agent report results?
7. **Safety gates**: Which actions need user intervention?

### Step 2: Draft the RESPONSIBILITY

Write one sentence capturing the agent's accountability. Include the business domain and outcome.

### Step 3: Draft GUIDELINES

Write 3-7 rules:
- At least one **ALWAYS** rule for mandatory behavior
- At least one **DO NOT** rule for prohibited actions
- At least one safety gate for critical actions
- Data access boundary (read-only lookups vs. field modifications)

### Step 4: Draft INSTRUCTIONS per task

For each task:
1. Start with navigation: how does the agent reach the data?
2. Read and MEMORIZE context before making decisions
3. Apply business logic with explicit if/then branches
4. Execute actions using proper keywords
5. Report results with structured Reply format
6. Handle errors with fallback Reply messages

### Step 5: Validate

Run through the [Validation Checklist](#validation-checklist) below.

### Step 6: Test and iterate

Deploy the instructions → observe agent behavior via timeline → refine. Follow the "less is more" principle: simpler instructions often perform better than verbose ones.

## Validation Checklist

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

## Anti-Patterns

| Anti-Pattern                          | Problem                                           | Fix                                                    |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| No MEMORIZE before cross-page use     | Agent loses field values when navigating away      | Add MEMORIZE immediately after reading the value        |
| Vague field names ("the amount")      | Agent cannot resolve which field to set            | Use exact field name: `Set field "Estimated Budget"`    |
| Missing error handling                | Agent halts or produces confusing output           | Add error Reply for each failure scenario               |
| Too many guidelines (>7)             | Agent behavior becomes inconsistent                | Consolidate into fewer, broader rules                   |
| Referencing pages not in profile     | Agent cannot navigate there                        | Verify all pages are in the agent's profile             |
| No user intervention on critical ops | Agent posts/sends/releases without human check     | Add `Request user intervention` or `Request a review`   |
| Contradictory guidelines             | Unpredictable behavior on each run                 | Remove contradictions, prioritize by specificity        |
| Hard-coded environment values        | Instructions break in different environments       | Use generic references, let setup tables hold specifics |
| Referencing specific tools by name   | Tool renames cause regressions                     | Describe WHAT to do, not WHICH tool to use              |

## Advanced Concepts

### Page-specific dynamic instructions

For SDK agents, `IAgentTaskExecution.GetAgentTaskPageContext` can inject dynamic context per page:

```
Consider the following fields:
{% if page.id == 42 %}
Field "The Answer" — the meaning of the universe
{% else %}
Field "Business Data" — standard business field
{% endif %}
```

### Multi-task instructions

When an agent handles multiple tasks, create separate `## Task:` sections. The agent selects the appropriate task based on the input message content. Use distinct keywords in the Reply to help programmatic routing:

```
## Task: Qualify Lead
...Reply: "qualification successful | ..."

## Task: Re-evaluate Lead
...Reply: "re-evaluation complete | ..."
```

### Agent-to-agent handoff instructions

When one agent creates tasks for another:
- Verify the target agent is configured (check setup fields)
- Use page actions that trigger task creation (the action handles the API call)
- MEMORIZE the handoff result for the final reply
- Include fallback instructions if the handoff action is unavailable

## Examples

See the `examples/` directory for complete instruction files:
- [Simple instructions](./examples/agent-simple-instructions.txt) — minimal single-task agent
- [Advanced instructions](./examples/agent-advanced-instructions.txt) — multi-task with handoff, error handling, and structured replies
