---
name: skill-agent-toolkit
description: Build, configure, and integrate Business Central agents using the AI Development Toolkit and Agent SDK. Triggers on mentions of Agent SDK, Agent Metadata Provider, IAgentFactory, IAgentMetadata, IAgentTaskExecution, ConfigurationDialog, Agent Task Builder, Agent Session, Copilot Capability, agent instructions, or agent setup in BC context.
---

# BC Agent Toolkit Skill

Build complete Business Central agents using the AI Development Toolkit and Agent SDK.

## Two Development Paths

| Path                      | Use When              | What You Create                                            |
| ------------------------- | --------------------- | ---------------------------------------------------------- |
| **Designer (No-Code)**    | Prototyping, testing  | Agent via wizard with instructions/profile/permissions     |
| **SDK (Pro-Code)**        | Production, extensions| Coded agent via AL interfaces, shipped in .app             |

## Project Structure (from Agent Template)

```
app/
├── .resources/Instructions/InstructionsV1.txt    # Agent instructions (resource file)
├── Example/
│   ├── {Agent}CustomerCardExt.PageExt.al         # Page extension (task trigger example)
│   └── {Agent}PublicAPI.Codeunit.al              # Public API + Implementation
├── Integration/
│   ├── {Agent}CopilotCapability.EnumExt.al       # Copilot Capability enum
│   ├── {Agent}Install.Codeunit.al                # Install handler
│   └── {Agent}Upgrade.Codeunit.al                # Upgrade handler
└── Setup/
    ├── {Agent}Setup.Codeunit.al                  # Centralized setup logic (instructions, profile, permissions)
    ├── {Agent}Setup.Page.al                      # ConfigurationDialog page
    ├── {Agent}Setup.Table.al                     # Setup table (PK = User Security ID)
    ├── KPI/
    │   ├── {Agent}KPI.Page.al                    # Summary/hover card (CardPart)
    │   └── {Agent}KPI.Table.al                   # KPI tracking table
    ├── Metadata/
    │   ├── {Agent}Factory.Codeunit.al            # IAgentFactory implementation
    │   ├── {Agent}Metadata.Codeunit.al           # IAgentMetadata implementation
    │   └── {Agent}MetadataProvider.EnumExt.al    # Agent Metadata Provider enum
    ├── Permissions/
    │   └── {Agent}.permissionset.al              # PermissionSet (includes D365 BASIC)
    ├── Profile/
    │   ├── {Agent}Profile.Profile.al             # Agent profile
    │   ├── {Agent}RoleCenter.Page.al             # Agent role center
    │   └── {Agent}*.PageCustomization.al         # Page customizations
    └── TaskExecution/
        └── {Agent}TaskExecution.Codeunit.al      # IAgentTaskExecution implementation
```

## Agent SDK Architecture

### Registration (3 objects)

```al
// 1. Extend Copilot Capability — feature switch
enumextension 52100 "My Agent Copilot Capability" extends "Copilot Capability"
{
    value(52100; "My Agent Capability")
    {
        Caption = 'My Agent';
    }
}

// 2. Extend Agent Metadata Provider — links to 3 interface implementations
enumextension 52101 "My Agent Metadata Provider" extends "Agent Metadata Provider"
{
    value(52101; "My Agent")
    {
        Caption = 'My Agent';
        Implementation = IAgentFactory = MyAgentFactory,
                         IAgentMetadata = MyAgentMetadata,
                         IAgentTaskExecution = MyAgentTaskExecution;
    }
}

// 3. Install codeunit — register + unregister on install
codeunit 52101 "My Agent Install"
{
    Subtype = Install;
    Access = Internal;
    InherentEntitlements = X;
    InherentPermissions = X;

    trigger OnInstallAppPerDatabase()
    begin
        RegisterCapability();

        // Re-install instructions for existing agents
        var MyAgentSetup: Record "My Agent Setup";
        if MyAgentSetup.FindSet() then
            repeat
                InstallAgent(MyAgentSetup);
            until MyAgentSetup.Next() = 0;
    end;

    local procedure RegisterCapability()
    var
        CopilotCapability: Codeunit "Copilot Capability";
        LearnMoreUrlTxt: Label 'https://docs.example.com', Locked = true;
    begin
        if CopilotCapability.IsCapabilityRegistered(Enum::"Copilot Capability"::"My Agent Capability") then
            CopilotCapability.UnregisterCapability(Enum::"Copilot Capability"::"My Agent Capability");

        CopilotCapability.RegisterCapability(
            Enum::"Copilot Capability"::"My Agent Capability",
            Enum::"Copilot Availability"::Preview,
            "Copilot Billing Type"::"Microsoft Billed",
            LearnMoreUrlTxt);
    end;
}
```

### 3 Core Interfaces — Correct Signatures

**IAgentFactory** — Creation & defaults:

```al
codeunit 52100 MyAgentFactory implements IAgentFactory
{
    Access = Internal;

    procedure GetDefaultInitials(): Text[4]
    begin
        exit(MyAgentSetupCU.GetInitials());
    end;

    procedure GetFirstTimeSetupPageId(): Integer
    begin
        exit(MyAgentSetupCU.GetSetupPageId());
    end;

    procedure ShowCanCreateAgent(): Boolean
    begin
        exit(true); // or single-instance logic
    end;

    procedure GetCopilotCapability(): Enum "Copilot Capability"
    begin
        exit("Copilot Capability"::"My Agent Capability");
    end;

    procedure GetDefaultProfile(var TempAllProfile: Record "All Profile" temporary)
    begin
        MyAgentSetupCU.GetDefaultProfile(TempAllProfile);
    end;

    procedure GetDefaultAccessControls(var TempAccessControlTemplate: Record "Access Control Buffer" temporary)
    begin
        MyAgentSetupCU.GetDefaultAccessControls(TempAccessControlTemplate);
    end;

    var
        MyAgentSetupCU: Codeunit "My Agent Setup";
}
```

**IAgentMetadata** — Runtime UI:

```al
codeunit 52102 MyAgentMetadata implements IAgentMetadata
{
    Access = Internal;

    procedure GetInitials(AgentUserId: Guid): Text[4]
    begin
        exit(MyAgentSetupCU.GetInitials());
    end;

    procedure GetSetupPageId(AgentUserId: Guid): Integer
    begin
        exit(MyAgentSetupCU.GetSetupPageId());
    end;

    procedure GetSummaryPageId(AgentUserId: Guid): Integer
    begin
        exit(MyAgentSetupCU.GetSummaryPageId());
    end;

    procedure GetAgentTaskMessagePageId(AgentUserId: Guid; MessageId: Guid): Integer
    begin
        exit(Page::"Agent Task Message Card"); // default or custom
    end;

    procedure GetAgentAnnotations(AgentUserId: Guid; var Annotations: Record "Agent Annotation")
    begin
        Clear(Annotations);
        // Validate preconditions: licensing, configuration completeness
    end;

    var
        MyAgentSetupCU: Codeunit "My Agent Setup";
}
```

**IAgentTaskExecution** — Task processing:

```al
codeunit 52104 MyAgentTaskExecution implements IAgentTaskExecution
{
    Access = Internal;

    procedure AnalyzeAgentTaskMessage(
        AgentTaskMessage: Record "Agent Task Message";
        var Annotations: Record "Agent Annotation")
    begin
        if AgentTaskMessage.Type = AgentTaskMessage.Type::Output then
            PostProcessOutputMessage(AgentTaskMessage, Annotations)
        else
            ValidateInputMessage(AgentTaskMessage, Annotations);
    end;

    procedure GetAgentTaskUserInterventionSuggestions(
        AgentTaskUserInterventionRequestDetails: Record "Agent User Int Request Details";
        var Suggestions: Record "Agent Task User Int Suggestion")
    begin
        if AgentTaskUserInterventionRequestDetails.Type =
           AgentTaskUserInterventionRequestDetails.Type::Assistance then begin
            Suggestions.Summary := 'User-friendly summary';
            Suggestions.Description := 'System-facing condition (Locked)';
            Suggestions.Instructions := 'Steps for agent after user acts (Locked)';
            Suggestions.Insert();
        end;
    end;

    procedure GetAgentTaskPageContext(
        AgentTaskPageContextRequest: Record "Agent Task Page Context Req.";
        var AgentTaskPageContext: Record "Agent Task Page Context")
    begin
        // Populate page-specific context for the agent
    end;

    local procedure ValidateInputMessage(
        AgentTaskMessage: Record "Agent Task Message";
        var Annotations: Record "Agent Annotation")
    var
        AgentMessage: Codeunit "Agent Message";
        MessageText: Text;
    begin
        MessageText := AgentMessage.GetText(AgentTaskMessage);
        // Add Error annotation to stop task
        // Add Warning annotation to trigger user intervention
    end;

    local procedure PostProcessOutputMessage(
        AgentTaskMessage: Record "Agent Task Message";
        var Annotations: Record "Agent Annotation")
    var
        AgentMessage: Codeunit "Agent Message";
        OldText: Text;
    begin
        OldText := AgentMessage.GetText(AgentTaskMessage);
        AgentMessage.UpdateText(AgentTaskMessage, OldText + '\n---\nAgent Signature');
    end;
}
```

### Setup Codeunit (Centralized Logic)

The template introduces a **Setup Codeunit** that centralizes all agent configuration:

```al
codeunit 52103 "My Agent Setup"
{
    Access = Internal;

    procedure GetInitials(): Text[4]
    begin
        exit('AGT');
    end;

    procedure GetSetupPageId(): Integer
    begin
        exit(Page::"My Agent Setup");
    end;

    procedure GetSummaryPageId(): Integer
    begin
        exit(Page::"My Agent KPI");
    end;

    [NonDebuggable]
    procedure GetInstructions(): SecretText
    begin
        exit(NavApp.GetResourceAsText('Instructions/InstructionsV1.txt'));
    end;

    procedure GetDefaultProfile(var TempAllProfile: Record "All Profile" temporary)
    var
        CurrentModuleInfo: ModuleInfo;
    begin
        NavApp.GetCurrentModuleInfo(CurrentModuleInfo);
        Agent.PopulateDefaultProfile('MY AGENT PROFILE', CurrentModuleInfo.Id, TempAllProfile);
    end;

    procedure GetDefaultAccessControls(var TempAccessControlBuffer: Record "Access Control Buffer" temporary)
    var
        CurrentModuleInfo: ModuleInfo;
    begin
        NavApp.GetCurrentModuleInfo(CurrentModuleInfo);
        TempAccessControlBuffer."Company Name" := CopyStr(CompanyName(), 1, MaxStrLen(TempAccessControlBuffer."Company Name"));
        TempAccessControlBuffer.Scope := TempAccessControlBuffer.Scope::System;
        TempAccessControlBuffer."App ID" := CurrentModuleInfo.Id;
        TempAccessControlBuffer."Role ID" := 'MY AGENT';
        TempAccessControlBuffer.Insert();
    end;

    procedure InitializeSetupRecord(var TempSetup: Record "My Agent Setup" temporary; var AgentSetupBuffer: Record "Agent Setup Buffer")
    var
        AgentSetup: Codeunit "Agent Setup";
    begin
        // Load existing or set defaults
        if AgentSetupBuffer.IsEmpty() then
            AgentSetup.GetSetupRecord(
                AgentSetupBuffer,
                TempSetup."User Security ID",
                Enum::"Agent Metadata Provider"::"My Agent",
                'My Agent - ' + CompanyName(),
                'My Agent',
                'Description of what the agent does.');
    end;

    procedure SaveSetupRecord(var TempSetup: Record "My Agent Setup" temporary; var AgentSetupBuffer: Record "Agent Setup Buffer")
    var
        AgentSetup: Codeunit "Agent Setup";
        IsNewAgent: Boolean;
    begin
        IsNewAgent := IsNullGuid(AgentSetupBuffer."User Security ID");

        if AgentSetup.GetChangesMade(AgentSetupBuffer) then begin
            TempSetup."User Security ID" := AgentSetup.SaveChanges(AgentSetupBuffer);
            if IsNewAgent then
                Agent.SetInstructions(TempSetup."User Security ID", GetInstructions());
        end;
    end;

    var
        Agent: Codeunit Agent;
}
```

### ConfigurationDialog Page

```al
page 52100 "My Agent Setup"
{
    PageType = ConfigurationDialog;
    Extensible = false;
    SourceTable = "My Agent Setup";
    SourceTableTemporary = true;
    InherentEntitlements = X;
    InherentPermissions = X;

    layout
    {
        area(Content)
        {
            part(AgentSetupPart; "Agent Setup Part")  // MUST be first
            {
                ApplicationArea = All;
                UpdatePropagation = Both;
            }
            // Custom groups below...
        }
    }
    actions
    {
        area(SystemActions)
        {
            systemaction(OK) { Caption = 'Update'; Enabled = IsUpdated; }
            systemaction(Cancel) { Caption = 'Cancel'; }
        }
    }

    trigger OnOpenPage()
    begin
        if not AzureOpenAI.IsEnabled(Enum::"Copilot Capability"::"My Agent Capability") then
            Error(CapabilityNotEnabledErr);
        InitializePage();
    end;

    trigger OnQueryClosePage(CloseAction: Action): Boolean
    begin
        if CloseAction = CloseAction::Cancel then exit(true);
        CurrPage.AgentSetupPart.Page.GetAgentSetupBuffer(AgentSetupBuffer);
        MyAgentSetupCU.SaveSetupRecord(Rec, AgentSetupBuffer);
        MyAgentSetupCU.SaveCustomProperties(Rec);
        exit(true);
    end;
}
```

### Public API Pattern

```al
codeunit 52106 "My Agent Public API"
{
    Access = Public;

    procedure AssignTask(AgentUserSecurityID: Guid; TaskTitle: Text[150]; From: Text[250]; Message: Text): Record "Agent Task"
    begin
        exit(Impl.AssignTask(AgentUserSecurityID, TaskTitle, From, Message));
    end;

    // Overloads for ExternalId, Attachments, etc.

    var
        Impl: Codeunit "My Agent Public API Impl.";
}
```

### Task Creation (via Agent Task Builder)

```al
// Inside the Impl codeunit:
local procedure AssignTaskInternal(...): Record "Agent Task"
var
    AgentTaskBuilder: Codeunit "Agent Task Builder";
begin
    AgentTaskBuilder := AgentTaskBuilder
        .Initialize(AgentUserSecurityID, TaskTitle)
        .AddTaskMessage(From, Message);

    if ExternalId <> '' then
        AgentTaskBuilder.SetExternalId(ExternalId);

    exit(AgentTaskBuilder.Create());
end;
```

### Agent Session Detection

```al
// Detect any agent session
var AgentSession: Codeunit "Agent Session";
    AgentMetadataProvider: Enum "Agent Metadata Provider";
begin
    if not AgentSession.IsAgentSession(AgentMetadataProvider) then exit;
end;

// Performance: bind subscribers only for agent task duration
[EventSubscriber(ObjectType::Codeunit, Codeunit::"System Initialization", OnAfterInitialization, '', false, false)]
local procedure OnInit()
begin
    if not AgentSession.IsAgentSession(Provider::"My Agent") then exit;
    GlobalEvents.SetTaskID(AgentSession.GetCurrentSessionAgentTaskId());
    BindSubscription(GlobalEvents);
end;
```

## Task Integration Patterns

See `references/workflow-task.md` for all 8 patterns.

## Quick Start

VS Code: `Ctrl+Shift+P` → `AL: New Project` → choose **Agent** template.

Or run scaffold: `python scripts/scaffold_agent.py "Agent Name" ./src`

## Workflows

| Need                 | Reference                           |
| -------------------- | ----------------------------------- |
| Full coded agent     | `references/workflow-create.md`     |
| Task integration     | `references/workflow-task.md`       |
| Agent instructions   | `references/workflow-instructions.md` |
| Test generation      | `references/workflow-test.md`       |

## Troubleshooting

| Symptom               | Check                                                              |
| --------------------- | ------------------------------------------------------------------ |
| Agent doesn't appear  | Copilot capability registered? Install codeunit ran?               |
| Can't create instance | `ShowCanCreateAgent()` returns false?                              |
| Setup page error      | `SourceTableTemporary = true`? AgentSetupPart first? `Extensible = false`? |
| Wrong defaults        | Check Setup Codeunit: `GetDefaultProfile` / `GetDefaultAccessControls` |
| Input rejected        | `AnalyzeAgentTaskMessage` → Error annotation on input?             |
| No suggestions        | `GetAgentTaskUserInterventionSuggestions` → empty? Type filter?    |
| Events not firing     | `BindSubscription` in agent session? SingleInstance?               |
| Agent loses context   | MEMORIZE in instructions? Example format provided?                 |
| Capability not found  | `AzureOpenAI.IsEnabled()` → check Copilot & Agent Capabilities    |
