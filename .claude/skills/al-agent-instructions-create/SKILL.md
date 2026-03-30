---
name: al-agent-instructions-create
description: >
  Generate optimized natural language instructions for Business Central agents
  (Designer or SDK). Follows Responsibilities-Guidelines-Instructions framework.
  Use when writing agent instructions or creating InstructionsV1.txt.
allowed-tools: Read Grep Glob Write Edit
disable-model-invocation: true
---

# Workflow: Generate Agent Instructions

You are an expert in Business Central agent instruction authoring.

## Output Modes

- **Designer Mode**: Text ready to paste into Agent Designer wizard
- **SDK Mode**: Text stored in `.resources/Instructions/InstructionsV1.txt`, loaded via `NavApp.GetResourceAsText()` returning `SecretText`, applied via `Agent.SetInstructions(UserSecurityId, InstructionsText)`

## Framework: Responsibilities → Guidelines → Instructions

```
**RESPONSIBILITY**: {One-line accountability}

**GUIDELINES**:
- ALWAYS {mandatory rule}
- DO NOT {prohibited action}
- MEMORIZE {values to retain across steps}

**INSTRUCTIONS**:

## Task: {Primary Task Name}

1. Navigate to "{Page Name}"
   a. Search for {value} in "{Field Name}"
   b. Read "{Field Name}" → **MEMORIZE** {description}: {example}
2. If {condition}: {action}
   a. **DO NOT** {prohibited action}
   b. Request user intervention with: {details}
3. Set field "{Field Name}" to {value}
4. Invoke action "{Action Name}"
5. Add comment: "{Agent Name} - [Date] | {outcome format}"
```

## Keywords Reference

| Keyword                     | Purpose                   |
| --------------------------- | ------------------------- |
| `Navigate to`               | Page navigation           |
| `Search for`                | List filtering            |
| `Set field`                 | Value assignment          |
| `Invoke action`             | Action execution          |
| `MEMORIZE`                  | Retain value across steps |
| `DO NOT` (bold)             | Prohibit critical action  |
| `ALWAYS` (bold)             | Mandate critical action   |
| `Request user intervention` | Human-in-the-loop         |

## Validation Checklist

- [ ] Page names match agent profile and page customizations exactly
- [ ] Field names match page fields exactly
- [ ] MEMORIZE placed BEFORE value is needed
- [ ] All critical actions (posting, sending, releasing) gated by user intervention
- [ ] Written in English — safeguards optimized for English
- [ ] Environment-agnostic (no hardcoded company names, URLs, etc.)
- [ ] Concise — shorter often performs better
- [ ] Stored in `.resources/Instructions/InstructionsV1.txt` (SDK mode)
