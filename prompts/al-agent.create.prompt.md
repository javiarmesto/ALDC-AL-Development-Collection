---
agent: agent
tools: [edit/editFiles, search/codebase, 'al-symbols-mcp/*', ms-dynamics-smb.al/al_symbolsearch, ms-dynamics-smb.al/al_symbolrelations, sshadowsdk.al-lsp-for-agents/bclsp_goToDefinition, sshadowsdk.al-lsp-for-agents/bclsp_hover, sshadowsdk.al-lsp-for-agents/bclsp_findReferences, sshadowsdk.al-lsp-for-agents/bclsp_prepareCallHierarchy, sshadowsdk.al-lsp-for-agents/bclsp_incomingCalls, sshadowsdk.al-lsp-for-agents/bclsp_outgoingCalls, sshadowsdk.al-lsp-for-agents/bclsp_codeLens, sshadowsdk.al-lsp-for-agents/bclsp_codeQualityDiagnostics, sshadowsdk.al-lsp-for-agents/bclsp_documentSymbols, sshadowsdk.al-lsp-for-agents/bclsp_renameSymbol]
description: "End-to-end workflow to create a coded Business Central agent using the Agent SDK. Orchestrates the 7 phases following the official Agent Template structure. Generates all required objects by applying patterns from skill-agent-toolkit, skill-agent-task-patterns and skill-agent-instructions."
---

# Workflow: Create Coded Agent (Agent SDK)

End-to-end orchestration to produce a production-ready agent. This prompt does not contain SDK knowledge — it applies patterns from the loaded skills:

- `skill-agent-toolkit` → registration, 3 interfaces, Setup Codeunit, ConfigurationDialog, project structure
- `skill-agent-task-patterns` → Patterns A–H for task integration (Phase 6)
- `skill-agent-instructions` → Responsibilities-Guidelines-Instructions framework (Phase 7)

## Human validation gates

🛑 markers require human approval before proceeding to the next phase.

## Phase 1 — Agent specification

### 1.1 Gather requirements

Ask the developer:

1. **Agent purpose** — business process being automated
2. **Creation rules** — single instance? multi? always?
3. **Trigger type** — manual (page action) / EventSubscriber / email / mixed?
4. **Data scope** — tables and pages the agent needs access to
5. **Setup properties** — any agent-specific configuration beyond standard?
6. **Message processing** — input validation? output post-processing?
7. **User intervention suggestions** — what help options when stuck?
8. **Summary KPIs** — what metrics on hover card?
9. **Annotations** — what preconditions to validate (licensing, config completeness)?

### 1.2 Generate Agent Spec

```markdown
# Agent Specification: {Agent Name}

## Identity
- Name: {Name}
- Initials: {3-4 chars}
- Object ID Range: {e.g. 52100-52199}

## Project Structure
See skill-agent-toolkit project structure section.

## Creation Rules
- Instance Model: {Single / Multi / Always}

## Interfaces
### IAgentFactory
- Setup Page: Page {ID} "{Agent} Setup" (ConfigurationDialog)
- Default Profile: {Profile ID}
- Default Permissions: {PermissionSet ID}

### IAgentMetadata
- Annotations: {precondition checks}
- Summary KPIs: {metrics for hover card}
- Custom Message Page: {Yes/No}

### IAgentTaskExecution
- Input Validation: {what to check}
- Output Post-Processing: {signatures, formatting}
- User Intervention Suggestions: {list}
- Page Context: {page-specific context}

## Task Integration
- Triggers: {events or page actions}
- ExternalId Pattern: {format}
- Patterns Applied: {A / B / C / D / E / F / G / H}
```

🛑 **STOP — Review spec before proceeding.**

## Phase 2 — Registration + Integration

Apply: `skill-agent-toolkit` → "Registration — 4 required objects".

Generate:

1. **Copilot Capability EnumExt** — unique value ID
2. **Metadata Provider EnumExt** — links the 3 interface implementations
3. **Install Codeunit** — `OnInstallAppPerDatabase`, Unregister+Register, re-install instructions for existing setup records
4. **Upgrade Codeunit** — `OnUpgradePerDatabase`, instruction updates with `UpgradeTag`

🛑 **STOP — Verify enum IDs are unique.**

## Phase 3 — Setup Infrastructure

Apply: `skill-agent-toolkit` → "Setup Codeunit" and "ConfigurationDialog page".

Generate:

1. **Setup Table** — PK = `"User Security ID": Guid`, `DataPerCompany = false`, custom fields
2. **Setup Codeunit** — `GetInitials`, `GetSetupPageId`, `GetSummaryPageId`, `GetInstructions (SecretText)`, `GetDefaultProfile`, `GetDefaultAccessControls`, `InitializeSetupRecord`, `SaveSetupRecord`, `SaveCustomProperties`
3. **ConfigurationDialog Page** — invariants from the skill (SourceTableTemporary, AgentSetupPart first, AzureOpenAI check, system actions)

🛑 **STOP — Review setup infrastructure.**

## Phase 4 — Interface implementations

Apply: `skill-agent-toolkit` → "The 3 core interfaces".

Generate the 3 codeunits delegating to Setup Codeunit. `IAgentTaskExecution.AnalyzeAgentTaskMessage` uses `AgentMessage.GetText()` / `UpdateText()` — never raw record fields.

🛑 **STOP — Review interface implementations.**

## Phase 5 — Profile + Permissions + KPI

Generate:

1. **Profile** with RoleCenter reference
2. **RoleCenter Page** (`PageType = RoleCenter`) with navigation actions
3. **PageCustomizations** to tailor pages for the agent's view
4. **PermissionSet** including D365 BASIC + domain permissions
5. **KPI Table** (PK = User Security ID, custom KPI fields)
6. **KPI Page** (`PageType = CardPart`, cuegroup with metrics)

🛑 **STOP — Review profile and permissions.**

## Phase 6 — Task Integration + Public API

Apply: `skill-agent-task-patterns` → relevant patterns (A always, plus B/C/D/E/H depending on spec). **Verify each method against the API Availability Matrix** before generating code.

Generate:

1. **Public API codeunit** (`Access = Public`) — Pattern A, with the standard overloads
2. **Public API Impl codeunit** (`Access = Internal`) — uses Agent Task Builder
3. **Page Extension** — example integration (Pattern B)
4. **EventSubscriber codeunit** — if Pattern C applies (TryFunction + telemetry)
5. **Agent Session Events** — if Pattern H applies (SingleInstance + BindSubscription)

🛑 **STOP — Review task integration.**

## Phase 7 — Instructions + Tests

Apply: `skill-agent-instructions` → RGI framework + keywords.
Apply: `al-agent.test` prompt for the test codeunit.

Generate:

1. **InstructionsV1.txt** — Responsibilities → Guidelines → Instructions, English, environment-agnostic
2. **Test Codeunit** — 6 categories (run `al-agent.test`)

🛑 **STOP — Review instructions and tests.**

## Deliverables checklist

- [ ] `{Agent}CopilotCapability.EnumExt.al`
- [ ] `{Agent}MetadataProvider.EnumExt.al`
- [ ] `{Agent}Install.Codeunit.al`
- [ ] `{Agent}Upgrade.Codeunit.al`
- [ ] `{Agent}Setup.Table.al`
- [ ] `{Agent}Setup.Codeunit.al`
- [ ] `{Agent}Setup.Page.al`
- [ ] `{Agent}Factory.Codeunit.al` (implements IAgentFactory)
- [ ] `{Agent}Metadata.Codeunit.al` (implements IAgentMetadata)
- [ ] `{Agent}TaskExecution.Codeunit.al` (implements IAgentTaskExecution)
- [ ] `{Agent}KPI.Table.al` + `{Agent}KPI.Page.al`
- [ ] `{Agent}Profile.Profile.al` + `{Agent}RoleCenter.Page.al`
- [ ] `{Agent}.permissionset.al`
- [ ] `{Agent}PublicAPI.Codeunit.al` + Impl
- [ ] `{Agent}*Ext.PageExt.al` (example integration)
- [ ] `.resources/Instructions/InstructionsV1.txt`
- [ ] Test codeunit (6 categories)
- [ ] Agent specification document

## Skills Evidencing

End the workflow declaring:

```
**Skills loaded**: skill-agent-toolkit, skill-agent-task-patterns, skill-agent-instructions
**Patterns applied**: {list each pattern with the file where it was applied}
```
