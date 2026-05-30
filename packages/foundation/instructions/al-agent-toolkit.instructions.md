---
applyTo: "**/*.al"
---

# AL Agent Development Toolkit Guidelines

You are an expert AL developer specializing in the Business Central AI Development Toolkit and Agent SDK. Follow these guidelines when developing agents or code that interacts with the agent framework.

## Architecture Overview

The AI Development Toolkit provides two development paths:

1. **Agent Designer (No-Code)**: Configure agents via wizard — instructions, profile, permissions
2. **Agent SDK (Pro-Code)**: Define agents programmatically in AL via 3 core interfaces + enum registration

Both paths share the same runtime: agents are BC users that interact with the UI via a logical UI API.

## Agent SDK — Core Interfaces

### Registration Pattern

Every coded agent requires:

1. **Extend `Copilot Capability` enum** — feature switch + Copilot & Agent Capabilities overview
2. **Extend `Agent Metadata Provider` enum** — registers agent type + links 3 interface implementations
3. **Install codeunit** — registers Copilot capability via `CopilotCapability.RegisterCapability()`
4. **Implement 3 interfaces**:

| Interface             | Purpose              | Key Methods                                                                                     |
| --------------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| `IAgentFactory`       | Creation & defaults  | `GetDefaultInitials`, `GetFirstTimeSetupPageId`, `ShowCanCreateAgent`, `GetCopilotCapability`, `GetDefaultProfile`, `GetDefaultAccessControls` |
| `IAgentMetadata`      | Runtime UI & metadata| `GetInitials`, `GetSetupPageId`, `GetSummaryPageId`, `GetAgentTaskMessagePageId`, `GetAgentAnnotations` |
| `IAgentTaskExecution` | Task processing      | `AnalyzeAgentTaskMessage`, `GetAgentTaskUserInterventionSuggestions`, `GetAgentTaskPageContext`  |

5. **Setup Codeunit** — centralizes instructions, profile, permissions, initialization, save logic

### Quick Start

Use VS Code: `Ctrl+Shift+P` → `AL: New Project` → choose `Agent` template.

## Project Structure

Follow the official Agent Template structure:

```
app/
├── .resources/Instructions/InstructionsV1.txt
├── Example/
│   ├── {Agent}CustomerCardExt.PageExt.al
│   ├── {Agent}PublicAPI.Codeunit.al
│   └── {Agent}PublicAPIImpl.Codeunit.al
├── Integration/
│   ├── {Agent}CopilotCapability.EnumExt.al
│   ├── {Agent}Install.Codeunit.al
│   └── {Agent}Upgrade.Codeunit.al
└── Setup/
    ├── {Agent}Setup.Codeunit.al
    ├── {Agent}Setup.Page.al
    ├── {Agent}Setup.Table.al
    ├── KPI/{Agent}KPI.Table.al + {Agent}KPI.Page.al
    ├── Metadata/{Agent}Factory.Codeunit.al + Metadata + MetadataProvider.EnumExt.al
    ├── Permissions/{Agent}.permissionset.al
    ├── Profile/{Agent}Profile.Profile.al + RoleCenter + PageCustomizations
    └── TaskExecution/{Agent}TaskExecution.Codeunit.al
```

## Naming Conventions

### Objects

| Object                  | Name Pattern                                              |
| ----------------------- | --------------------------------------------------------- |
| Copilot Capability enum | `"{Agent} Copilot Capability"` extends `"Copilot Capability"` |
| Metadata Provider enum  | `"{Agent} Metadata Provider"` extends `"Agent Metadata Provider"` |
| Factory codeunit        | `{Agent}Factory` implements `IAgentFactory`               |
| Metadata codeunit       | `{Agent}Metadata` implements `IAgentMetadata`             |
| Task Execution codeunit | `{Agent}TaskExecution` implements `IAgentTaskExecution`   |
| Setup codeunit          | `"{Agent} Setup"` (centralized logic)                     |
| Install codeunit        | `"{Agent} Install"` (Subtype = Install)                   |
| Upgrade codeunit        | `"{Agent} Upgrade"` (Subtype = Upgrade)                   |
| Public API codeunit     | `"{Agent} Public API"` (Access = Public)                  |
| Setup table             | `"{Agent} Setup"` (PK = `"User Security ID": Guid`)      |
| KPI table               | `"{Agent} KPI"` (PK = `"User Security ID": Guid`)        |
| Setup page              | `"{Agent} Setup"` (PageType = ConfigurationDialog)        |
| KPI page                | `"{Agent} KPI"` (PageType = CardPart)                     |
| Profile                 | `"{Agent} Profile"`                                       |
| RoleCenter              | `"{Agent} Role Center"` (PageType = RoleCenter)           |
| PermissionSet           | `"{Agent}"` (Assignable, includes D365 BASIC)             |

### External IDs

- Pattern: `{ENTITY-PREFIX}-{Record.No.}` or `{THREAD-ID}` for email
- Examples: `SO-1001`, `INV-103456`, `EMAIL-thread-abc123`
- **DO NOT** use GUIDs or auto-incremented numbers

## Setup Codeunit Pattern

Every agent needs a centralized Setup Codeunit that delegates from Factory/Metadata:

```al
codeunit {id} "{Agent} Setup"
{
    Access = Internal;

    procedure GetInitials(): Text[4]
    procedure GetSetupPageId(): Integer
    procedure GetSummaryPageId(): Integer

    [NonDebuggable]
    procedure GetInstructions(): SecretText  // Load from .resources

    procedure GetDefaultProfile(var TempAllProfile: Record "All Profile" temporary)
    procedure GetDefaultAccessControls(var TempAccessControlBuffer: Record "Access Control Buffer" temporary)
    procedure InitializeSetupRecord(var TempSetup: Record "{Agent} Setup" temporary; var AgentSetupBuffer: Record "Agent Setup Buffer")
    procedure SaveSetupRecord(var TempSetup: Record "{Agent} Setup" temporary; var AgentSetupBuffer: Record "Agent Setup Buffer")
    procedure SaveCustomProperties(var TempSetup: Record "{Agent} Setup" temporary)
}
```

Key implementation details:
- Instructions loaded via `NavApp.GetResourceAsText('Instructions/InstructionsV1.txt')`
- Profile populated via `Agent.PopulateDefaultProfile(ProfileId, ModuleInfo.Id, TempAllProfile)`
- Permissions use `CurrentModuleInfo.Id` as `"App ID"` for the permission set
- `SaveSetupRecord` calls `AgentSetup.SaveChanges()` then `Agent.SetInstructions()` for new agents

## ConfigurationDialog Page Type

Setup pages for agents **must** use `PageType = ConfigurationDialog`:

- `SourceTableTemporary = true` — mandatory, enables reversible changes
- `Extensible = false` — mandatory for this page type
- `InherentEntitlements = X` + `InherentPermissions = X`
- First element in layout must be `part(AgentSetupPart; "Agent Setup Part")`
- Use `systemaction(OK)` and `systemaction(Cancel)` — no custom triggers
- Track changes with `IsUpdated: Boolean`, enable OK button conditionally
- `OnOpenPage`: Check `AzureOpenAI.IsEnabled()` for the capability
- `OnQueryClosePage`: Delegate to Setup Codeunit's `SaveSetupRecord` + `SaveCustomProperties`

### Card Toggle Pattern

Boolean field with `ShowCaption = false` as first child of group = toggle on card header.

## IAgentTaskExecution — Message Processing

### AnalyzeAgentTaskMessage

Signature: `procedure AnalyzeAgentTaskMessage(AgentTaskMessage: Record "Agent Task Message"; var Annotations: Record "Agent Annotation")`

- Check `AgentTaskMessage.Type` for Input vs Output
- Use `AgentMessage.GetText(AgentTaskMessage)` to read message content
- Use `AgentMessage.UpdateText(AgentTaskMessage, NewText)` to modify output
- Add `Agent Annotation` records: Severity::Error stops task, Severity::Warning triggers review

### GetAgentTaskUserInterventionSuggestions

Signature: `procedure GetAgentTaskUserInterventionSuggestions(AgentTaskUserInterventionRequestDetails: Record "Agent User Int Request Details"; var Suggestions: Record "Agent Task User Int Suggestion")`

- Filter by `AgentTaskUserInterventionRequestDetails.Type` (Assistance, etc.)
- `Summary`: User-friendly title (translatable Label)
- `Description`: System-facing condition (Locked = true)
- `Instructions`: Steps for agent (Locked = true)

### GetAgentTaskPageContext

Signature: `procedure GetAgentTaskPageContext(AgentTaskPageContextRequest: Record "Agent Task Page Context Req."; var AgentTaskPageContext: Record "Agent Task Page Context")`

- Provides contextual data when agent navigates specific pages

## Install Pattern

```al
trigger OnInstallAppPerDatabase()
begin
    RegisterCapability();
    // Re-install instructions for existing agents
end;

local procedure RegisterCapability()
begin
    if CopilotCapability.IsCapabilityRegistered(...) then
        CopilotCapability.UnregisterCapability(...);
    CopilotCapability.RegisterCapability(
        Enum, Availability::Preview, BillingType::"Microsoft Billed", LearnMoreUrl);
end;
```

**Key**: Always Unregister then Register to handle version updates cleanly.

## Tasks API

### Basic Task Creation

```al
var
    AgentTaskBuilder: Codeunit "Agent Task Builder";
    AgentTaskMsgBuilder: Codeunit "Agent Task Message Builder";
begin
    AgentTaskMsgBuilder.Initialize(From, MessageText);

    AgentTask := AgentTaskBuilder
        .Initialize(AgentUserSecurityId, TaskTitle)
        .SetExternalId('PREFIX-' + Rec."No.")
        .AddTaskMessage(AgentTaskMsgBuilder)
        .Create();
end;
```

### Rules

- Always filter by business condition before creating event-driven tasks
- Wrap task creation in error handling (TryFunction) — never block business events
- Use `Agent Task Message Builder` for attachments and sanitization control
- Use `SetRequiresReview(true)` for messages needing human approval
- Log failures via `Session.LogMessage` for telemetry

## Advanced Task Creation Patterns

### API Availability Matrix (Runtime 17.0 / Platform 27.0)

| Method | Scope | Status | Alternative |
|--------|-------|--------|-------------|
| `AddTaskMessage(From, Text)` | Extension | ✅ Available | — |
| `AddAttachment(Name, MediaType, InStream)` | Extension | ✅ Available | — |
| `SetRequiresReview(true)` | **OnPrem only** | ❌ Extension blocked | Use `IAgentTaskExecution` annotations |
| `SetSkipMessageSanitization(true)` | **OnPrem only** | ❌ Extension blocked | Pre-format message text |
| `AddToTask(AgentTask)` | Future | ❌ Not in runtime 17.0 | Create new follow-up task |
| `Custom Agent.GetCustomAgents()` | Future | ❌ Not in current symbols | Use `Agent Setup.OpenAgentLookup()` |

### 1. Attach Files to Tasks

Use when passing supporting documents (quotes, specifications, contracts) to an agent.

**Signature**: `AddAttachment(Name: Text[250]; MediaType: Text; ContentStream: InStream)`

```al
// With InStream directly
procedure CreateTaskWithAttachment(AgentUserId: Guid; var ContentStream: InStream)
var
    AgentTaskBuilder: Codeunit "Agent Task Builder";
    AgentTaskMsgBuilder: Codeunit "Agent Task Message Builder";
begin
    AgentTaskMsgBuilder.Initialize(CopyStr(UserId(), 1, 250),
        'Review lead estimate and create quote.');
    AgentTaskMsgBuilder.AddAttachment('Estimate.pdf', 'application/pdf', ContentStream);

    AgentTaskBuilder := AgentTaskBuilder
        .Initialize(AgentUserId, 'Convert Lead')
        .SetExternalId('LEAD-1001')
        .AddTaskMessage(AgentTaskMsgBuilder);
    AgentTaskBuilder.Create();
end;

// With TempBlob (convenience — convert to InStream first)
procedure CreateTaskFromBlob(AgentUserId: Guid; var DocumentBlob: Codeunit "Temp Blob")
var
    ContentStream: InStream;
    AgentTaskBuilder: Codeunit "Agent Task Builder";
    AgentTaskMsgBuilder: Codeunit "Agent Task Message Builder";
begin
    DocumentBlob.CreateInStream(ContentStream);
    AgentTaskMsgBuilder.Initialize(CopyStr(UserId(), 1, 250), 'Review attached document.');
    AgentTaskMsgBuilder.AddAttachment('Document.pdf', 'application/pdf', ContentStream);

    AgentTaskBuilder := AgentTaskBuilder
        .Initialize(AgentUserId, 'Process Document')
        .SetExternalId('DOC-1001')
        .AddTaskMessage(AgentTaskMsgBuilder);
    AgentTaskBuilder.Create();
end;
```

**Common MIME types**: `application/pdf`, `image/png`, `image/jpeg`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel)

### 2. Human Review via IAgentTaskExecution (Extension-Safe)

`SetRequiresReview` is OnPrem scope only. For Extensions, use `IAgentTaskExecution.AnalyzeAgentTaskMessage` to add error/warning annotations that force human review:

```al
// In your IAgentTaskExecution implementation
procedure AnalyzeAgentTaskMessage(AgentTaskMessage: Record "Agent Task Message"; var Annotations: Record "Agent Annotation")
var
    AgentMessage: Codeunit "Agent Message";
    MessageText: Text;
begin
    MessageText := AgentMessage.GetText(AgentTaskMessage);

    // Force review for disqualification tasks
    if MessageText.Contains('DISQUALIFICATION') then begin
        Annotations.Severity := Annotations.Severity::Warning;
        Annotations.Message := 'Disqualification requires human approval. Review before proceeding.';
        Annotations.Insert();
    end;
end;
```

**Effect**: Warning annotations trigger user intervention flow via `GetAgentTaskUserInterventionSuggestions`.

### 3. Follow-Up Tasks (Workaround for AddToTask)

`AddToTask` is not available in runtime 17.0. Create a new task referencing the original external ID:

```al
procedure SendFollowUpTask(AgentUserId: Guid; OriginalLeadNo: Code[20]; AdditionalInfo: Text)
var
    AgentTaskBuilder: Codeunit "Agent Task Builder";
begin
    AgentTaskBuilder := AgentTaskBuilder
        .Initialize(AgentUserId,
            CopyStr('Update for Lead ' + OriginalLeadNo, 1, 150))
        .SetExternalId('LEADUPD-' + OriginalLeadNo)
        .AddTaskMessage(CopyStr(UserId(), 1, 250), AdditionalInfo);
    AgentTaskBuilder.Create();
end;
```

### Combined Example: Lead Handoff with Attachment

```al
procedure HandoffLeadToQuoteBuilder(var Lead: Record Lead; var EstimateBlob: Codeunit "Temp Blob")
var
    AgentTaskBuilder: Codeunit "Agent Task Builder";
    AgentTaskMsgBuilder: Codeunit "Agent Task Message Builder";
    ContentStream: InStream;
    QBSetup: Record "QB Agent Setup";
    MessageText: Text;
begin
    if not QBSetup.FindFirst() then
        Error('Quote Builder agent not configured.');
    if IsNullGuid(QBSetup."User Security ID") then
        Error('Quote Builder agent Security ID missing.');

    MessageText := BuildHandoffMessage(Lead);

    AgentTaskMsgBuilder.Initialize(CopyStr(UserId(), 1, 250), MessageText);

    // Attach estimate if available
    if EstimateBlob.HasValue() then begin
        EstimateBlob.CreateInStream(ContentStream);
        AgentTaskMsgBuilder.AddAttachment(
            CopyStr('Lead_' + Lead."No." + '_Estimate.pdf', 1, 250),
            'application/pdf', ContentStream);
    end;

    AgentTaskBuilder := AgentTaskBuilder
        .Initialize(QBSetup."User Security ID",
            CopyStr('Convert Hot Lead ' + Lead."No." + ' to Quote', 1, 150))
        .SetExternalId('LEAD-' + Lead."No.")
        .AddTaskMessage(AgentTaskMsgBuilder);
    AgentTaskBuilder.Create();

    Lead."BCA2A Handoff ID" := 'QB-' + Lead."No.";
    Lead.Modify(false);

    Session.LogMessage('BCA2A-HANDOFF',
        StrSubstNo('Lead %1 handed off to QB', Lead."No."),
        Verbosity::Normal, DataClassification::SystemMetadata,
        TelemetryScope::ExtensionPublisher, 'Category', 'BCA2A');
end;
```

### OnPrem-Only Reference (Future Extension Availability)

These methods are documented in the Tasks API but currently restricted to OnPrem scope:

```al
// OnPrem only — DO NOT use in Extension development
AgentTaskMsgBuilder.SetRequiresReview(true);           // Forces human approval
AgentTaskMsgBuilder.SetSkipMessageSanitization(true);  // Preserves raw JSON/XML
AgentTaskMsgBuilder.AddToTask(AgentTaskRec);           // Appends to existing task
```

## Agent Session Detection

Use `Codeunit "Agent Session"` to detect and customize agent execution:

```al
var
    AgentSession: Codeunit "Agent Session";
    AgentMetadataProvider: Enum "Agent Metadata Provider";
begin
    if not AgentSession.IsAgentSession(AgentMetadataProvider) then exit;
    // Agent-specific code here
end;
```

### Agent-Specific Session Check

Filter logic by specific agent type using the MetadataProvider enum value:

```al
local procedure DoCustomAgentWork()
var
    AgentSession: Codeunit "Agent Session";
    AgentMetadataProvider: Enum "Agent Metadata Provider";
begin
    if not AgentSession.IsAgentSession(AgentMetadataProvider::"Lead Qualifier") then
        exit;

    // Lead Qualifier agent-specific code goes here...
end;
```

### Event Binding Pattern

For performance, bind EventSubscribers only during agent sessions:
- Subscribe to `System Initialization.OnAfterInitialization`
- Check `AgentSession.IsAgentSession()`
- Use `BindSubscription()` on a SingleInstance codeunit

## Agent Discovery & Lookup

### Current: Agent Setup Lookup (Available)

Use `Agent Setup.OpenAgentLookup()` to let users select agents in setup pages:

```al
trigger OnLookup(var Text: Text): Boolean
var
    AgentSetup: Codeunit "Agent Setup";
    SelectedAgentUserId: Guid;
begin
    if AgentSetup.OpenAgentLookup(SelectedAgentUserId) then begin
        Rec."Target Agent Security ID" := SelectedAgentUserId;
        Text := Format(SelectedAgentUserId);
        exit(true);
    end;
    exit(false);
end;
```

Use `Agent.GetDisplayName(Guid)` to resolve agent names for display:

```al
local procedure GetAgentDisplayText(AgentSecurityId: Guid): Text
var
    AgentCU: Codeunit Agent;
begin
    if IsNullGuid(AgentSecurityId) then exit('');
    exit(AgentCU.GetDisplayName(AgentSecurityId) + ' (' + Format(AgentSecurityId) + ')');
end;
```

### Future: Custom Agent Discovery API (Not Yet Available)

The Tasks API documentation describes `Custom Agent.GetCustomAgents()` for discovering all registered agents at runtime. This API is not yet available in Extension scope:

```al
// FUTURE — Not available in runtime 17.0 / platform 27.0
local procedure GetAllAgents()
var
    CustomAgent: Codeunit "Custom Agent";
    TempAgentInfo: Record "Custom Agent Info" temporary;
begin
    CustomAgent.GetCustomAgents(TempAgentInfo);

    if TempAgentInfo.FindSet() then
        repeat
            // TempAgentInfo."User Security ID" — agent's user ID (Guid)
            // TempAgentInfo."User Name" — agent's display name
        until TempAgentInfo.Next() = 0;
end;
```

## Public API Pattern

Every agent should expose a Public API codeunit (`Access = Public`). Available overloads:

| Method | Purpose | Status |
|--------|---------|--------|
| `AssignTask(...)` | Basic task with text message | ✅ Available |
| `AssignTaskWithAttachment(...)` | Task with InStream or TempBlob attachment | ✅ Available |

## Testing Requirements

Every agent must include tests for:

1. **Registration**: Copilot capability registered, enum compiles
2. **Factory**: Setup page returned, default profile/permissions correct, creation rules
3. **Metadata**: Annotations generated correctly, summary page KPIs
4. **Task Execution**: Input validation (error/warning annotations), output post-processing, user intervention suggestions
5. **Task Integration**: Creation, condition filtering, message content, lifecycle, error handling
6. **Agent Session**: Detection works, event binding fires only in agent context

## Instruction Writing (for Agent Configuration)

- Store in `.resources/Instructions/InstructionsV1.txt`
- Load via `NavApp.GetResourceAsText()` returning `SecretText`
- Structure as: **Responsibilities** → **Guidelines** → **Instructions**
- Use **MEMORIZE**, **DO NOT**, **ALWAYS**, **Navigate to**, **Set field**, **Invoke action**
- Reference specific page/field names matching agent's profile
- Write in **English** — safeguards optimized for English
