---
name: skill-agent-toolkit
description: Build, configure, and integrate Business Central agents using the AI Development Toolkit and Agent SDK. Triggers on Agent SDK, Agent Metadata Provider, IAgentFactory, IAgentMetadata, IAgentTaskExecution, ConfigurationDialog, Agent Task Builder, Agent Session, Copilot Capability, agent instructions, or agent setup in BC context.
---

# BC Agent Toolkit Skill

Manual del Agent SDK: arquitectura, registro, las 3 interfaces, Setup Codeunit, ConfigurationDialog, Install/Upgrade, project structure. Para patterns de creación de tasks ver `skill-agent-task-patterns`. Para redactar instrucciones de agente ver `skill-agent-instructions`.

**Reference oficial**: https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-overview

## Two development paths

| Path                      | Use when              | Result                                                     |
| ------------------------- | --------------------- | ---------------------------------------------------------- |
| **Designer (No-Code)**    | Prototyping, testing  | Agent via wizard with .github/instructions/profile/permissions     |
| **SDK (Pro-Code)**        | Production, extensions| Coded agent via AL interfaces, shipped in .app             |

Both share the same runtime: an agent is a BC user that interacts with the UI via a logical UI API.

## Project structure (Agent Template)

```
app/
├── .resources/Instructions/InstructionsV1.txt    # Agent instructions (resource file)
├── Example/
│   ├── {Agent}CustomerCardExt.PageExt.al         # Page extension (task trigger example)
│   ├── {Agent}PublicAPI.Codeunit.al              # Public API (Access = Public)
│   └── {Agent}PublicAPIImpl.Codeunit.al          # Implementation (Access = Internal)
├── Integration/
│   ├── {Agent}CopilotCapability.EnumExt.al
│   ├── {Agent}Install.Codeunit.al
│   └── {Agent}Upgrade.Codeunit.al
└── Setup/
    ├── {Agent}Setup.Codeunit.al                  # Centralized setup logic
    ├── {Agent}Setup.Page.al                      # ConfigurationDialog
    ├── {Agent}Setup.Table.al                     # PK = User Security ID
    ├── KPI/{Agent}KPI.{Table,Page}.al            # CardPart for hover summary
    ├── Metadata/
    │   ├── {Agent}Factory.Codeunit.al            # IAgentFactory
    │   ├── {Agent}Metadata.Codeunit.al           # IAgentMetadata
    │   └── {Agent}MetadataProvider.EnumExt.al
    ├── Permissions/{Agent}.permissionset.al      # Includes D365 BASIC
    ├── Profile/
    │   ├── {Agent}Profile.Profile.al
    │   ├── {Agent}RoleCenter.Page.al
    │   └── {Agent}*.PageCustomization.al
    └── TaskExecution/
        └── {Agent}TaskExecution.Codeunit.al      # IAgentTaskExecution
```

## Registration — 4 required objects

### 1. Copilot Capability EnumExt (feature switch)

```al
enumextension 52100 "My Agent Copilot Capability" extends "Copilot Capability"
{
    value(52100; "My Agent Capability") { Caption = 'My Agent'; }
}
```

### 2. Agent Metadata Provider EnumExt (links to the 3 interfaces)

```al
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
```

### 3. Install codeunit — Unregister + Register pattern

Always unregister before register to handle version updates cleanly. Re-install instructions for existing agent setup records.

```al
codeunit 52101 "My Agent Install"
{
    Subtype = Install;
    Access = Internal;
    InherentEntitlements = X;
    InherentPermissions = X;

    trigger OnInstallAppPerDatabase()
    var
        MyAgentSetup: Record "My Agent Setup";
    begin
        RegisterCapability();

        if MyAgentSetup.FindSet() then
            repeat
                InstallAgentInstructions(MyAgentSetup);
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

### 4. Upgrade codeunit

Trigger `OnUpgradePerDatabase` — manage instruction updates per UpgradeTag.

## The 3 core interfaces

### IAgentFactory — creation & defaults

| Method                                                                     | Purpose                              |
| -------------------------------------------------------------------------- | ------------------------------------ |
| `GetDefaultInitials(): Text[4]`                                           | Agent avatar initials                 |
| `GetFirstTimeSetupPageId(): Integer`                                       | Setup page on first creation         |
| `ShowCanCreateAgent(): Boolean`                                            | Single-instance vs multi gate         |
| `GetCopilotCapability(): Enum "Copilot Capability"`                       | Feature switch reference              |
| `GetDefaultProfile(var TempAllProfile: Record "All Profile" temporary)`    | Default UI profile                    |
| `GetDefaultAccessControls(var TempAccessControlBuffer: Record temporary)`  | Default permission template           |

Delegate every method to the Setup Codeunit:

```al
codeunit 52100 MyAgentFactory implements IAgentFactory
{
    Access = Internal;

    procedure GetDefaultInitials(): Text[4] begin exit(SetupCU.GetInitials()); end;
    procedure GetFirstTimeSetupPageId(): Integer begin exit(SetupCU.GetSetupPageId()); end;
    procedure ShowCanCreateAgent(): Boolean begin exit(true); end;
    procedure GetCopilotCapability(): Enum "Copilot Capability"
        begin exit("Copilot Capability"::"My Agent Capability"); end;
    procedure GetDefaultProfile(var TempAllProfile: Record "All Profile" temporary)
        begin SetupCU.GetDefaultProfile(TempAllProfile); end;
    procedure GetDefaultAccessControls(var TempAccessControlBuffer: Record "Access Control Buffer" temporary)
        begin SetupCU.GetDefaultAccessControls(TempAccessControlBuffer); end;

    var
        SetupCU: Codeunit "My Agent Setup";
}
```

### IAgentMetadata — runtime UI

| Method                                                                                       |
| -------------------------------------------------------------------------------------------- |
| `GetInitials(AgentUserId: Guid): Text[4]`                                                    |
| `GetSetupPageId(AgentUserId: Guid): Integer`                                                 |
| `GetSummaryPageId(AgentUserId: Guid): Integer`                                               |
| `GetAgentTaskMessagePageId(AgentUserId: Guid; MessageId: Guid): Integer`                     |
| `GetAgentAnnotations(AgentUserId: Guid; var Annotations: Record "Agent Annotation")`         |

`GetAgentAnnotations` is where you validate preconditions: licensing checks, configuration completeness, missing master data.

### IAgentTaskExecution — message processing

| Method                                                                                      |
| ------------------------------------------------------------------------------------------- |
| `AnalyzeAgentTaskMessage(AgentTaskMessage; var Annotations: Record "Agent Annotation")`     |
| `GetAgentTaskUserInterventionSuggestions(RequestDetails; var Suggestions)`                  |
| `GetAgentTaskPageContext(PageContextRequest; var AgentTaskPageContext)`                     |

`AnalyzeAgentTaskMessage` is the core hook. Use `AgentMessage.GetText()` to read and `AgentMessage.UpdateText()` to mutate output.

```al
codeunit 52104 MyAgentTaskExecution implements IAgentTaskExecution
{
    Access = Internal;

    procedure AnalyzeAgentTaskMessage(
        AgentTaskMessage: Record "Agent Task Message";
        var Annotations: Record "Agent Annotation")
    begin
        if AgentTaskMessage.Type = AgentTaskMessage.Type::Output then
            PostProcessOutput(AgentTaskMessage, Annotations)
        else
            ValidateInput(AgentTaskMessage, Annotations);
    end;

    procedure GetAgentTaskUserInterventionSuggestions(
        RequestDetails: Record "Agent User Int Request Details";
        var Suggestions: Record "Agent Task User Int Suggestion")
    begin
        if RequestDetails.Type = RequestDetails.Type::Assistance then begin
            Suggestions.Summary := 'User-friendly summary';                  // translatable Label
            Suggestions.Description := 'System-facing condition';            // Locked = true
            Suggestions.Instructions := 'Steps for agent after user acts';   // Locked = true
            Suggestions.Insert();
        end;
    end;

    procedure GetAgentTaskPageContext(
        Request: Record "Agent Task Page Context Req.";
        var Context: Record "Agent Task Page Context")
    begin
        // Inject page-specific context. See "Page-specific dynamic instructions" below.
    end;

    local procedure ValidateInput(
        AgentTaskMessage: Record "Agent Task Message";
        var Annotations: Record "Agent Annotation")
    var
        AgentMessage: Codeunit "Agent Message";
        MessageText: Text;
    begin
        MessageText := AgentMessage.GetText(AgentTaskMessage);
        // Severity::Error → stops task
        // Severity::Warning → triggers user intervention flow
    end;

    local procedure PostProcessOutput(
        AgentTaskMessage: Record "Agent Task Message";
        var Annotations: Record "Agent Annotation")
    var
        AgentMessage: Codeunit "Agent Message";
        OldText: Text;
    begin
        OldText := AgentMessage.GetText(AgentTaskMessage);
        AgentMessage.UpdateText(AgentTaskMessage, OldText + '\n---\nAgent signature');
    end;
}
```

## Setup Codeunit — centralized configuration

Every agent has a Setup Codeunit that Factory and Metadata delegate to. It owns:

- Initials, setup page ID, summary page ID
- Instructions loaded via `NavApp.GetResourceAsText()` returning `SecretText`
- Default profile via `Agent.PopulateDefaultProfile()`
- Default permissions populated into `Access Control Buffer`
- `InitializeSetupRecord` / `SaveSetupRecord` / `SaveCustomProperties`

```al
codeunit 52103 "My Agent Setup"
{
    Access = Internal;

    procedure GetInitials(): Text[4] begin exit('AGT'); end;
    procedure GetSetupPageId(): Integer begin exit(Page::"My Agent Setup"); end;
    procedure GetSummaryPageId(): Integer begin exit(Page::"My Agent KPI"); end;

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

    procedure GetDefaultAccessControls(var TempBuf: Record "Access Control Buffer" temporary)
    var
        CurrentModuleInfo: ModuleInfo;
    begin
        NavApp.GetCurrentModuleInfo(CurrentModuleInfo);
        TempBuf."Company Name" := CopyStr(CompanyName(), 1, MaxStrLen(TempBuf."Company Name"));
        TempBuf.Scope := TempBuf.Scope::System;
        TempBuf."App ID" := CurrentModuleInfo.Id;
        TempBuf."Role ID" := 'MY AGENT';
        TempBuf.Insert();
    end;

    procedure InitializeSetupRecord(
        var TempSetup: Record "My Agent Setup" temporary;
        var AgentSetupBuffer: Record "Agent Setup Buffer")
    var
        AgentSetup: Codeunit "Agent Setup";
    begin
        if AgentSetupBuffer.IsEmpty() then
            AgentSetup.GetSetupRecord(
                AgentSetupBuffer, TempSetup."User Security ID",
                Enum::"Agent Metadata Provider"::"My Agent",
                'My Agent - ' + CompanyName(), 'My Agent',
                'Description of what the agent does.');
    end;

    procedure SaveSetupRecord(
        var TempSetup: Record "My Agent Setup" temporary;
        var AgentSetupBuffer: Record "Agent Setup Buffer")
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

    procedure SaveCustomProperties(var TempSetup: Record "My Agent Setup" temporary)
    begin
        // Persist agent-specific properties (e.g. thresholds, target agent refs)
    end;

    var
        Agent: Codeunit Agent;
}
```

## ConfigurationDialog page — complete template

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
            part(AgentSetupPart; "Agent Setup Part")    // MUST be first
            {
                ApplicationArea = All;
                UpdatePropagation = Both;
            }
            group(General)
            {
                ShowCaption = false;
                field(Active; ActiveTok)                // boolean with ShowCaption = false
                {                                       // = toggle on card header
                    ApplicationArea = All;
                    ShowCaption = false;
                    trigger OnValidate() begin IsUpdated := true; end;
                }
            }
        }
    }

    actions
    {
        area(SystemActions)
        {
            systemaction(OK)
            {
                Caption = 'Update';
                Enabled = IsUpdated;
            }
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
        SetupCU.SaveSetupRecord(Rec, AgentSetupBuffer);
        SetupCU.SaveCustomProperties(Rec);
        exit(true);
    end;

    var
        AzureOpenAI: Codeunit "Azure OpenAI";
        SetupCU: Codeunit "My Agent Setup";
        AgentSetupBuffer: Record "Agent Setup Buffer";
        IsUpdated: Boolean;
        ActiveTok: Boolean;
        CapabilityNotEnabledErr: Label 'AI capability is not enabled for this environment.';
}
```

### Card toggle pattern

A boolean field with `ShowCaption = false` placed as first child of a group renders as a toggle on the card header. Wire its `OnValidate` to set `IsUpdated := true`.

## Page-specific dynamic instructions

`IAgentTaskExecution.GetAgentTaskPageContext` can inject context per page. The runtime resolves Liquid-style conditionals at execution time:

```
Consider the following fields:
{% if page.id == 42 %}
Field "The Answer" — the meaning of the universe
{% else %}
Field "Business Data" — standard business field
{% endif %}
```

## Quick start

VS Code: `Ctrl+Shift+P` → `AL: New Project` → choose **Agent** template.

## Troubleshooting

| Symptom               | Check                                                              |
| --------------------- | ------------------------------------------------------------------ |
| Agent doesn't appear  | Copilot capability registered? Install codeunit ran? `AzureOpenAI.IsEnabled` returns true? |
| Can't create instance | `ShowCanCreateAgent()` returns false?                              |
| Setup page error      | `SourceTableTemporary = true`? AgentSetupPart first in layout? `Extensible = false`? |
| Wrong defaults        | Setup Codeunit `GetDefaultProfile` / `GetDefaultAccessControls`?   |
| Input rejected        | `AnalyzeAgentTaskMessage` adding Error annotation on Input?        |
| No suggestions        | `GetAgentTaskUserInterventionSuggestions` empty? Type filter?      |
| Capability not found  | Check Copilot & Agent Capabilities page in BC                      |

For task-creation troubleshooting (event subscribers not firing, agent loses context across pages, multi-turn failures), see `skill-agent-task-patterns`.

## Related skills

- `skill-agent-task-patterns` — 8 task integration patterns + API availability matrix per runtime
- `skill-agent-instructions` — natural-language instructions for the agent runtime
