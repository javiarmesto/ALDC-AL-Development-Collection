---
agent: agent
tools: [edit/editFiles, search/codebase, 'al-symbols-mcp/*', ms-dynamics-smb.al/al_symbolsearch, ms-dynamics-smb.al/al_symbolrelations, sshadowsdk.al-lsp-for-agents/bclsp_goToDefinition, sshadowsdk.al-lsp-for-agents/bclsp_hover, sshadowsdk.al-lsp-for-agents/bclsp_findReferences, sshadowsdk.al-lsp-for-agents/bclsp_prepareCallHierarchy, sshadowsdk.al-lsp-for-agents/bclsp_incomingCalls, sshadowsdk.al-lsp-for-agents/bclsp_outgoingCalls, sshadowsdk.al-lsp-for-agents/bclsp_codeLens, sshadowsdk.al-lsp-for-agents/bclsp_codeQualityDiagnostics, sshadowsdk.al-lsp-for-agents/bclsp_documentSymbols, sshadowsdk.al-lsp-for-agents/bclsp_renameSymbol]
description: "End-to-end workflow to create a coded Business Central agent using the Agent SDK. Follows the official Agent Template project structure. Generates all required objects with correct interface signatures."
---

# Workflow: Create Coded Agent (Agent SDK)

You are an expert AL developer. This workflow creates a complete production-ready agent following the official BC Agent Template.

## Human Validation Gates

🛑 **STOP** markers require human approval before proceeding.

## Phase 1: Agent Specification

### Step 1.1 — Gather Requirements

Ask the developer for:

1. **Agent Purpose**: What business process does this agent automate?
2. **Creation Rules**: Single instance? Multi-instance? Always?
3. **Trigger Type**: Manual (Page Action) / EventSubscriber / Email / Mixed?
4. **Data Scope**: Tables and pages the agent needs access to
5. **Setup Properties**: Any agent-specific configuration beyond standard?
6. **Message Processing**: Input validation? Output post-processing?
7. **User Intervention Suggestions**: What help options when agent gets stuck?
8. **Summary KPIs**: What metrics to show on hover card?
9. **Annotations**: What preconditions to validate? (licensing, config completeness)

### Step 1.2 — Generate Agent Spec

```markdown
# Agent Specification: {Agent Name}

## Identity
- **Name**: {Name}
- **Initials**: {3-4 chars}
- **Object ID Range**: {52100-52199}

## Project Structure
app/
├── .resources/Instructions/InstructionsV1.txt
├── Example/{Agent}CustomerCardExt.PageExt.al + PublicAPI + Impl
├── Integration/{Agent}CopilotCapability.EnumExt.al + Install + Upgrade
└── Setup/{Agent}Setup.Codeunit/Page/Table + KPI + Metadata + Permissions + Profile + TaskExecution

## Creation Rules
- **Instance Model**: {Single / Multi / Always}

## Interfaces
### IAgentFactory
- **Setup Page**: Page {ID} "{Agent} Setup" (ConfigurationDialog)
- **Default Profile**: {Profile ID}
- **Default Permissions**: {PermissionSet ID}

### IAgentMetadata
- **Annotations**: {precondition checks}
- **Summary KPIs**: {metrics for hover card}
- **Custom Message Page**: {Yes/No}

### IAgentTaskExecution
- **Input Validation**: {what to check}
- **Output Post-Processing**: {signatures, formatting}
- **User Intervention Suggestions**: {list}
- **Page Context**: {any page-specific context}

## Task Integration
- **Triggers**: {events or page actions}
- **External ID Pattern**: {format}
```

🛑 **STOP — Review spec before proceeding.**

## Phase 2: Registration + Integration

Generate:
1. **Copilot Capability EnumExt** — unique value ID
2. **Metadata Provider EnumExt** — links 3 interface implementations
3. **Install Codeunit** — `OnInstallAppPerDatabase`, Unregister+Register, re-install instructions
4. **Upgrade Codeunit** — `OnUpgradePerDatabase`, instruction updates with UpgradeTag

🛑 **STOP — Verify enum IDs are unique.**

## Phase 3: Setup Infrastructure

Generate:
1. **Setup Table** — PK = `"User Security ID": Guid`, custom fields, `DataPerCompany = false`
2. **Setup Codeunit** — GetInitials, GetSetupPageId, GetSummaryPageId, GetInstructions (SecretText), GetDefaultProfile, GetDefaultAccessControls, InitializeSetupRecord, SaveSetupRecord, SaveCustomProperties
3. **ConfigurationDialog Page** — SourceTableTemporary, AgentSetupPart first, AzureOpenAI check, system actions

🛑 **STOP — Review setup infrastructure.**

## Phase 4: Interface Implementations

Generate:
1. **IAgentFactory** — delegates to Setup Codeunit. Methods: `GetDefaultInitials`, `GetFirstTimeSetupPageId`, `ShowCanCreateAgent`, `GetCopilotCapability`, `GetDefaultProfile`, `GetDefaultAccessControls`
2. **IAgentMetadata** — delegates to Setup Codeunit. Methods: `GetInitials`, `GetSetupPageId`, `GetSummaryPageId`, `GetAgentTaskMessagePageId`, `GetAgentAnnotations`
3. **IAgentTaskExecution** — Methods: `AnalyzeAgentTaskMessage` (uses `AgentMessage.GetText/UpdateText`), `GetAgentTaskUserInterventionSuggestions`, `GetAgentTaskPageContext`

🛑 **STOP — Review interface implementations.**

## Phase 5: Profile + Permissions + KPI

Generate:
1. **Profile** — with RoleCenter reference
2. **RoleCenter Page** — PageType = RoleCenter, relevant navigation actions
3. **PageCustomizations** — customize pages for agent's view
4. **PermissionSet** — includes D365 BASIC + domain permissions
5. **KPI Table** — PK = User Security ID, custom KPI fields
6. **KPI Page** — PageType = CardPart, cuegroup with metrics

🛑 **STOP — Review profile and permissions.**

## Phase 6: Task Integration + Public API

Generate:
1. **Public API Codeunit** (Access = Public) — AssignTask overloads, Deactivate, IsActive
2. **Public API Impl Codeunit** (Access = Internal) — uses Agent Task Builder
3. **Page Extension** — example integration (button that calls Public API)
4. **Agent Session Events** — SingleInstance + BindSubscription pattern (if needed)

🛑 **STOP — Review task integration.**

## Phase 7: Instructions + Tests

Generate:
1. **InstructionsV1.txt** — Responsibilities → Guidelines → Instructions with keywords
2. **Test Codeunit** — 6 categories: Registration, Factory, Metadata, TaskExecution, TaskIntegration, AgentSession

🛑 **STOP — Review instructions and tests.**

## Deliverables Checklist

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
