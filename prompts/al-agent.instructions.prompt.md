---
agent: agent
tools: [read, edit/createFile, edit/editFiles, search/codebase, 'microsoft-docs/*', 'al-symbols-mcp/*', ms-dynamics-smb.al/al_symbolrelations, sshadowsdk.al-lsp-for-agents/bclsp_goToDefinition, sshadowsdk.al-lsp-for-agents/bclsp_hover, sshadowsdk.al-lsp-for-agents/bclsp_findReferences, sshadowsdk.al-lsp-for-agents/bclsp_prepareCallHierarchy, sshadowsdk.al-lsp-for-agents/bclsp_incomingCalls, sshadowsdk.al-lsp-for-agents/bclsp_outgoingCalls, sshadowsdk.al-lsp-for-agents/bclsp_codeLens, sshadowsdk.al-lsp-for-agents/bclsp_codeQualityDiagnostics, sshadowsdk.al-lsp-for-agents/bclsp_documentSymbols, sshadowsdk.al-lsp-for-agents/bclsp_renameSymbol]
description: "Generate optimized natural language instructions for Business Central agents (Designer or SDK). Applies the Responsibilities-Guidelines-Instructions framework from skill-agent-instructions. Output stored in .resources/Instructions/InstructionsV1.txt for SDK agents."
---

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

For the framework details, keyword tables, anti-patterns, and complete examples, consult `skill-agent-instructions` and `.github/skills/skill-agent-instructions/examples/`.

## Skills Evidencing

End with:

```
**Skills loaded**: skill-agent-instructions
**Patterns applied**:
- RGI framework — Responsibilities/Guidelines/Instructions structure
- Keywords applied: {list keywords used: Navigate to, Memorize, Reply, etc.}
- Safety gates: {list user intervention / review points}
```
