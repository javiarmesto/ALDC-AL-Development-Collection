#!/usr/bin/env python3
"""
Scaffold a new BC Agent SDK integration following the official Agent Template.

Generates the complete project structure:
  app/
  ├── .resources/Instructions/InstructionsV1.txt
  ├── Example/{Agent}CustomerCardExt.PageExt.al + PublicAPI + Impl
  ├── Integration/CopilotCapability + Install + Upgrade
  └── Setup/Setup.Codeunit + Setup.Page + Setup.Table + KPI + Metadata + Permissions + Profile + TaskExecution

Usage:
    python scaffold_agent.py <agent-name> <output-dir> [--start-id 52100]

Example:
    python scaffold_agent.py "Credit Checker" ./app --start-id 52200
"""

import argparse, os, re, textwrap


def safe(name):
    """PascalCase without spaces: 'Credit Checker' → 'CreditChecker'"""
    return re.sub(r'[^a-zA-Z0-9]', '', name.title().replace(' ', ''))


def label_safe(name):
    """Keep original casing for labels"""
    return name


# ═══════════════════════════════════════════════════════
# INTEGRATION
# ═══════════════════════════════════════════════════════

def gen_copilot_enum(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;
        using System.AI;

        enumextension {sid} "{s} Copilot Capability" extends "Copilot Capability"
        {{
            value({sid}; "{s} Capability")
            {{
                Caption = '{name}';
            }}
        }}
    """)


def gen_metadata_provider_enum(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;
        using System.Agents;

        enumextension {sid + 1} "{s} Metadata Provider" extends "Agent Metadata Provider"
        {{
            value({sid + 1}; "{s}")
            {{
                Caption = '{name}';
                Implementation = IAgentFactory = {s}Factory,
                                 IAgentMetadata = {s}Metadata,
                                 IAgentTaskExecution = {s}TaskExecution;
            }}
        }}
    """)


def gen_install(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        using System.Agents;
        using System.AI;

        codeunit {sid + 2} "{s} Install"
        {{
            Subtype = Install;
            Access = Internal;
            InherentEntitlements = X;
            InherentPermissions = X;

            trigger OnInstallAppPerDatabase()
            var
                {s}Setup: Record "{s} Setup";
            begin
                RegisterCapability();

                if not {s}Setup.FindSet() then
                    exit;

                repeat
                    InstallAgent({s}Setup);
                until {s}Setup.Next() = 0;
            end;

            local procedure InstallAgent(var Setup: Record "{s} Setup")
            var
                Agent: Codeunit Agent;
                SetupCU: Codeunit "{s} Setup";
            begin
                Agent.SetInstructions(Setup."User Security ID", SetupCU.GetInstructions());
            end;

            local procedure RegisterCapability()
            var
                CopilotCapability: Codeunit "Copilot Capability";
                LearnMoreUrlTxt: Label 'TODO-add-documentation-url', Locked = true;
            begin
                if CopilotCapability.IsCapabilityRegistered(
                    Enum::"Copilot Capability"::"{s} Capability") then
                    CopilotCapability.UnregisterCapability(
                        Enum::"Copilot Capability"::"{s} Capability");

                CopilotCapability.RegisterCapability(
                    Enum::"Copilot Capability"::"{s} Capability",
                    Enum::"Copilot Availability"::Preview,
                    "Copilot Billing Type"::"Microsoft Billed",
                    LearnMoreUrlTxt);
            end;
        }}
    """)


def gen_upgrade(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        codeunit {sid + 3} "{s} Upgrade"
        {{
            Subtype = Upgrade;
            Access = Internal;
            InherentEntitlements = X;
            InherentPermissions = X;

            trigger OnUpgradePerDatabase()
            begin
                // TODO: Upgrade instructions with UpgradeTag pattern
            end;
        }}
    """)


# ═══════════════════════════════════════════════════════
# SETUP
# ═══════════════════════════════════════════════════════

def gen_setup_table(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        table {sid + 10} "{s} Setup"
        {{
            Access = Internal;
            Caption = '{name} Setup';
            DataClassification = CustomerContent;
            InherentEntitlements = RIMDX;
            InherentPermissions = RIMDX;
            ReplicateData = false;
            DataPerCompany = false;

            fields
            {{
                field(1; "User Security ID"; Guid)
                {{
                    Caption = 'User Security ID';
                    DataClassification = SystemMetadata;
                    Editable = false;
                }}
                // TODO: Add agent-specific configuration fields
                field(10; "Custom Property"; Text[100])
                {{
                    Caption = 'Custom Property';
                    DataClassification = CustomerContent;
                }}
            }}
            keys
            {{
                key(Key1; "User Security ID") {{ Clustered = true; }}
            }}
        }}
    """)


def gen_setup_codeunit(name, sid):
    s = safe(name)
    initials = s[:3].upper()
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        using System.Agents;
        using System.Reflection;
        using System.Security.AccessControl;

        codeunit {sid + 11} "{s} Setup"
        {{
            Access = Internal;

            procedure GetInitials(): Text[4]
            begin
                exit('{initials}');
            end;

            procedure GetSetupPageId(): Integer
            begin
                exit(Page::"{s} Setup");
            end;

            procedure GetSummaryPageId(): Integer
            begin
                exit(Page::"{s} KPI");
            end;

            [NonDebuggable]
            procedure GetInstructions(): SecretText
            var
                Instructions: Text;
            begin
                Instructions := NavApp.GetResourceAsText('Instructions/InstructionsV1.txt');
                exit(Instructions);
            end;

            internal procedure GetDefaultProfile(var TempAllProfile: Record "All Profile" temporary)
            var
                CurrentModuleInfo: ModuleInfo;
            begin
                NavApp.GetCurrentModuleInfo(CurrentModuleInfo);
                Agent.PopulateDefaultProfile('{s} Profile', CurrentModuleInfo.Id, TempAllProfile);
            end;

            internal procedure GetDefaultAccessControls(var TempAccessControlBuffer: Record "Access Control Buffer" temporary)
            var
                CurrentModuleInfo: ModuleInfo;
            begin
                NavApp.GetCurrentModuleInfo(CurrentModuleInfo);
                Clear(TempAccessControlBuffer);
                TempAccessControlBuffer."Company Name" := CopyStr(CompanyName(), 1, MaxStrLen(TempAccessControlBuffer."Company Name"));
                TempAccessControlBuffer.Scope := TempAccessControlBuffer.Scope::System;
                TempAccessControlBuffer."App ID" := CurrentModuleInfo.Id;
                TempAccessControlBuffer."Role ID" := '{s}';
                TempAccessControlBuffer.Insert();
            end;

            internal procedure InitializeSetupRecord(var TempSetup: Record "{s} Setup" temporary; var AgentSetupBuffer: Record "Agent Setup Buffer")
            var
                ExistingSetup: Record "{s} Setup";
                AgentSetup: Codeunit "Agent Setup";
            begin
                if not IsNullGuid(TempSetup."User Security ID") then
                    if ExistingSetup.Get(TempSetup."User Security ID") then
                        TempSetup.TransferFields(ExistingSetup, false);

                if TempSetup.IsEmpty() then
                    TempSetup.Insert();

                if AgentSetupBuffer.IsEmpty() then
                    AgentSetup.GetSetupRecord(
                        AgentSetupBuffer,
                        TempSetup."User Security ID",
                        Enum::"Agent Metadata Provider"::"{s}",
                        '{name} - ' + CompanyName(),
                        '{name}',
                        'TODO: Description of what the agent does.');
            end;

            internal procedure SaveSetupRecord(var TempSetup: Record "{s} Setup" temporary; var AgentSetupBuffer: Record "Agent Setup Buffer")
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

            internal procedure SaveCustomProperties(var TempSetup: Record "{s} Setup" temporary)
            var
                ExistingSetup: Record "{s} Setup";
            begin
                if not ExistingSetup.Get(TempSetup."User Security ID") then begin
                    ExistingSetup.Init();
                    ExistingSetup."User Security ID" := TempSetup."User Security ID";
                end;
                ExistingSetup."Custom Property" := TempSetup."Custom Property";
                if not ExistingSetup.Modify() then
                    ExistingSetup.Insert();
            end;

            var
                Agent: Codeunit Agent;
        }}
    """)


def gen_setup_page(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        using System.Agents;
        using System.AI;

        page {sid + 12} "{s} Setup"
        {{
            PageType = ConfigurationDialog;
            Extensible = false;
            ApplicationArea = All;
            Caption = 'Set up {name}';
            SourceTable = "{s} Setup";
            SourceTableTemporary = true;
            InherentEntitlements = X;
            InherentPermissions = X;

            layout
            {{
                area(Content)
                {{
                    part(AgentSetupPart; "Agent Setup Part")
                    {{
                        ApplicationArea = All;
                        UpdatePropagation = Both;
                    }}
                    group(AdditionalConfiguration)
                    {{
                        Caption = 'Additional Configuration';
                        field(CustomProperty; Rec."Custom Property")
                        {{
                            ApplicationArea = All;
                            ToolTip = 'TODO: Describe this property.';
                            trigger OnValidate()
                            begin
                                IsUpdated := true;
                            end;
                        }}
                    }}
                }}
            }}
            actions
            {{
                area(SystemActions)
                {{
                    systemaction(OK) {{ Caption = 'Update'; Enabled = IsUpdated; }}
                    systemaction(Cancel) {{ Caption = 'Cancel'; }}
                }}
            }}

            trigger OnOpenPage()
            begin
                if not AzureOpenAI.IsEnabled(Enum::"Copilot Capability"::"{s} Capability") then
                    Error(CapabilityNotEnabledErr);
                InitializePage();
            end;

            trigger OnQueryClosePage(CloseAction: Action): Boolean
            var
                SetupCU: Codeunit "{s} Setup";
            begin
                if CloseAction = CloseAction::Cancel then exit(true);
                CurrPage.AgentSetupPart.Page.GetAgentSetupBuffer(AgentSetupBuffer);
                SetupCU.SaveSetupRecord(Rec, AgentSetupBuffer);
                SetupCU.SaveCustomProperties(Rec);
                exit(true);
            end;

            local procedure InitializePage()
            var
                SetupCU: Codeunit "{s} Setup";
            begin
                CurrPage.AgentSetupPart.Page.GetAgentSetupBuffer(AgentSetupBuffer);
                SetupCU.InitializeSetupRecord(Rec, AgentSetupBuffer);
                CurrPage.AgentSetupPart.Page.SetAgentSetupBuffer(AgentSetupBuffer);
                CurrPage.AgentSetupPart.Page.Update(false);
                IsUpdated := CurrPage.AgentSetupPart.Page.GetChangesMade();
            end;

            var
                AgentSetupBuffer: Record "Agent Setup Buffer";
                AzureOpenAI: Codeunit "Azure OpenAI";
                IsUpdated: Boolean;
                CapabilityNotEnabledErr: Label 'The {name} capability is not enabled in Copilot capabilities.\\\\Please enable it before setting up the agent.';
        }}
    """)


# ═══════════════════════════════════════════════════════
# METADATA (Factory, Metadata, TaskExecution)
# ═══════════════════════════════════════════════════════

def gen_factory(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        using System.Agents;
        using System.AI;
        using System.Reflection;
        using System.Security.AccessControl;

        codeunit {sid + 20} {s}Factory implements IAgentFactory
        {{
            Access = Internal;

            procedure GetDefaultInitials(): Text[4]
            begin
                exit(SetupCU.GetInitials());
            end;

            procedure GetFirstTimeSetupPageId(): Integer
            begin
                exit(SetupCU.GetSetupPageId());
            end;

            procedure ShowCanCreateAgent(): Boolean
            begin
                // TODO: Single-instance → check Setup.IsEmpty()
                exit(true);
            end;

            procedure GetCopilotCapability(): Enum "Copilot Capability"
            begin
                exit("Copilot Capability"::"{s} Capability");
            end;

            procedure GetDefaultProfile(var TempAllProfile: Record "All Profile" temporary)
            begin
                SetupCU.GetDefaultProfile(TempAllProfile);
            end;

            procedure GetDefaultAccessControls(var TempAccessControlTemplate: Record "Access Control Buffer" temporary)
            begin
                SetupCU.GetDefaultAccessControls(TempAccessControlTemplate);
            end;

            var
                SetupCU: Codeunit "{s} Setup";
        }}
    """)


def gen_metadata(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        using System.Agents;

        codeunit {sid + 21} {s}Metadata implements IAgentMetadata
        {{
            Access = Internal;

            procedure GetInitials(AgentUserId: Guid): Text[4]
            begin
                exit(SetupCU.GetInitials());
            end;

            procedure GetSetupPageId(AgentUserId: Guid): Integer
            begin
                exit(SetupCU.GetSetupPageId());
            end;

            procedure GetSummaryPageId(AgentUserId: Guid): Integer
            begin
                exit(SetupCU.GetSummaryPageId());
            end;

            procedure GetAgentTaskMessagePageId(AgentUserId: Guid; MessageId: Guid): Integer
            begin
                exit(Page::"Agent Task Message Card");
            end;

            procedure GetAgentAnnotations(AgentUserId: Guid; var Annotations: Record "Agent Annotation")
            begin
                Clear(Annotations);
                // TODO: Validate preconditions (licensing, config completeness)
            end;

            var
                SetupCU: Codeunit "{s} Setup";
        }}
    """)


def gen_task_execution(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        using System.Agents;

        codeunit {sid + 22} {s}TaskExecution implements IAgentTaskExecution
        {{
            Access = Internal;

            procedure AnalyzeAgentTaskMessage(AgentTaskMessage: Record "Agent Task Message"; var Annotations: Record "Agent Annotation")
            begin
                if AgentTaskMessage.Type = AgentTaskMessage.Type::Output then
                    PostProcessOutputMessage(AgentTaskMessage, Annotations)
                else
                    ValidateInputMessage(AgentTaskMessage, Annotations);
            end;

            procedure GetAgentTaskUserInterventionSuggestions(
                AgentTaskUserInterventionRequestDetails: Record "Agent User Int Request Details";
                var Suggestions: Record "Agent Task User Int Suggestion")
            var
                SuggestionInstructionsLbl: Label 'TODO: Steps for the agent after user acts.', Locked = true;
                SummaryLbl: Label 'TODO: User-friendly summary';
                DescriptionLbl: Label 'TODO: When to show this suggestion.', Locked = true;
            begin
                if AgentTaskUserInterventionRequestDetails.Type = AgentTaskUserInterventionRequestDetails.Type::Assistance then begin
                    Suggestions.Summary := SummaryLbl;
                    Suggestions.Description := DescriptionLbl;
                    Suggestions.Instructions := SuggestionInstructionsLbl;
                    Suggestions.Insert();
                end;
            end;

            procedure GetAgentTaskPageContext(
                AgentTaskPageContextRequest: Record "Agent Task Page Context Req.";
                var AgentTaskPageContext: Record "Agent Task Page Context")
            begin
                // TODO: Populate page-specific context
            end;

            local procedure ValidateInputMessage(AgentTaskMessage: Record "Agent Task Message"; var Annotations: Record "Agent Annotation")
            var
                AgentMessage: Codeunit "Agent Message";
                MessageText: Text;
            begin
                MessageText := AgentMessage.GetText(AgentTaskMessage);
                // TODO: Validate relevance and required data
                // Error → stops task, Warning → requests user intervention
            end;

            local procedure PostProcessOutputMessage(AgentTaskMessage: Record "Agent Task Message"; var Annotations: Record "Agent Annotation")
            var
                AgentMessage: Codeunit "Agent Message";
                OldText: Text;
            begin
                OldText := AgentMessage.GetText(AgentTaskMessage);
                AgentMessage.UpdateText(AgentTaskMessage, OldText);
                // TODO: Add signatures, formatting, etc.
            end;
        }}
    """)


# ═══════════════════════════════════════════════════════
# KPI + PERMISSIONS + PROFILE
# ═══════════════════════════════════════════════════════

def gen_kpi_table(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        table {sid + 30} "{s} KPI"
        {{
            Access = Internal;
            Caption = '{name} KPI';
            DataClassification = CustomerContent;
            InherentEntitlements = RIMDX;
            InherentPermissions = RIMDX;
            ReplicateData = false;
            DataPerCompany = false;

            fields
            {{
                field(1; "User Security ID"; Guid)
                {{
                    Caption = 'User Security ID';
                    DataClassification = EndUserPseudonymousIdentifiers;
                    Editable = false;
                }}
                // TODO: Add KPI fields
                field(10; "Custom KPI"; Integer)
                {{
                    Caption = 'Custom KPI';
                    DataClassification = CustomerContent;
                }}
            }}
            keys
            {{
                key(Key1; "User Security ID") {{ Clustered = true; }}
            }}
        }}
    """)


def gen_kpi_page(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        page {sid + 31} "{s} KPI"
        {{
            PageType = CardPart;
            ApplicationArea = All;
            Caption = '{name} Summary';
            SourceTable = "{s} KPI";
            Editable = false;
            Extensible = false;

            layout
            {{
                area(Content)
                {{
                    cuegroup(KeyMetrics)
                    {{
                        Caption = 'Key Performance Indicators';
                        field(CustomKPI; Rec."Custom KPI")
                        {{
                            Caption = 'Custom KPI';
                            ToolTip = 'TODO: Describe this KPI.';
                        }}
                    }}
                }}
            }}
        }}
    """)


def gen_permissionset(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        using System.Security.AccessControl;

        permissionset {sid + 40} "{s}"
        {{
            Caption = '{name}';
            Assignable = true;
            IncludedPermissionSets = "D365 BASIC";
        }}
    """)


def gen_profile(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        profile "{s} Profile"
        {{
            Caption = '{name}';
            Description = 'Profile for {name} agent';
            RoleCenter = "{s} Role Center";
            // TODO: Add Customizations
        }}
    """)


def gen_rolecenter(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        page {sid + 41} "{s} Role Center"
        {{
            PageType = RoleCenter;
            Caption = '{name} Role Center';

            layout
            {{
                area(RoleCenter)
                {{
                }}
            }}
            actions
            {{
                // TODO: Add navigation actions
            }}
        }}
    """)


# ═══════════════════════════════════════════════════════
# EXAMPLE (Public API + Page Extension)
# ═══════════════════════════════════════════════════════

def gen_public_api(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        using System.Agents;

        codeunit {sid + 50} "{s} Public API"
        {{
            Access = Public;

            procedure AssignTask(AgentUserSecurityID: Guid; TaskTitle: Text[150]; From: Text[250]; Message: Text): Record "Agent Task"
            begin
                exit(Impl.AssignTask(AgentUserSecurityID, TaskTitle, From, Message));
            end;

            procedure AssignTask(AgentUserSecurityID: Guid; TaskTitle: Text[150]; ExternalId: Text[2048]; From: Text[250]; Message: Text): Record "Agent Task"
            begin
                exit(Impl.AssignTask(AgentUserSecurityID, TaskTitle, ExternalId, From, Message));
            end;

            procedure Deactivate(AgentUserSecurityID: Guid)
            begin
                Impl.Deactivate(AgentUserSecurityID);
            end;

            procedure IsActive(AgentUserSecurityID: Guid): Boolean
            begin
                exit(Impl.IsActive(AgentUserSecurityID));
            end;

            var
                Impl: Codeunit "{s} Public API Impl.";
        }}
    """)


def gen_public_api_impl(name, sid):
    s = safe(name)
    return textwrap.dedent(f"""\
        namespace DefaultPublisher;

        using System.Agents;

        codeunit {sid + 51} "{s} Public API Impl."
        {{
            Access = Internal;

            procedure AssignTask(AgentUserSecurityID: Guid; TaskTitle: Text[150]; From: Text[250]; Message: Text): Record "Agent Task"
            begin
                exit(AssignTaskInternal(AgentUserSecurityID, TaskTitle, '', From, Message));
            end;

            procedure AssignTask(AgentUserSecurityID: Guid; TaskTitle: Text[150]; ExternalId: Text[2048]; From: Text[250]; Message: Text): Record "Agent Task"
            begin
                exit(AssignTaskInternal(AgentUserSecurityID, TaskTitle, ExternalId, From, Message));
            end;

            procedure Deactivate(AgentUserSecurityID: Guid)
            begin
                Agent.Deactivate(AgentUserSecurityID);
            end;

            procedure IsActive(AgentUserSecurityID: Guid): Boolean
            begin
                exit(Agent.IsActive(AgentUserSecurityID));
            end;

            local procedure AssignTaskInternal(AgentUserSecurityID: Guid; TaskTitle: Text[150]; ExternalId: Text[2048]; From: Text[250]; Message: Text): Record "Agent Task"
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

            var
                Agent: Codeunit Agent;
        }}
    """)


def gen_instructions(name):
    return textwrap.dedent(f"""\
        **RESPONSIBILITY**: TODO — Define what the {name} agent is accountable for.

        **GUIDELINES**:
        - ALWAYS request user review before posting documents or sending communications
        - DO NOT proceed if required fields are missing
        - When encountering ambiguous data, request user intervention with specific details

        **INSTRUCTIONS**:

        ## Task: TODO — Primary Task

        1. Navigate to the "TODO — Page Name" page
           a. Search for the record using "No." field
           b. Open the record

        2. Read and validate required fields
           a. Read the "TODO — Field Name" field
           b. **MEMORIZE** TODO-value-name: example-format

        3. Process the record
           a. Set field "TODO — Field Name" to TODO-value
           b. Invoke action "TODO — Action Name"

        4. Document the outcome
           a. Add comment: "{name} - [Date] | Action: [X] | Result: [Y]"
    """)


# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='Scaffold BC Agent SDK (Agent Template structure)')
    parser.add_argument('agent_name', help='Agent display name (e.g., "Credit Checker")')
    parser.add_argument('output_dir', help='Output directory (e.g., ./app)')
    parser.add_argument('--start-id', type=int, default=52100, help='Starting object ID')
    args = parser.parse_args()

    s = safe(args.agent_name)
    sid = args.start_id
    base = args.output_dir

    # Create directory structure
    dirs = [
        f'{base}/.resources/Instructions',
        f'{base}/Example',
        f'{base}/Integration',
        f'{base}/Setup',
        f'{base}/Setup/KPI',
        f'{base}/Setup/Metadata',
        f'{base}/Setup/Permissions',
        f'{base}/Setup/Profile',
        f'{base}/Setup/TaskExecution',
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    # Generate files
    files = {
        # Instructions
        f'{base}/.resources/Instructions/InstructionsV1.txt': gen_instructions(args.agent_name),
        # Integration
        f'{base}/Integration/{s}CopilotCapability.EnumExt.al': gen_copilot_enum(args.agent_name, sid),
        f'{base}/Integration/{s}MetadataProvider.EnumExt.al': gen_metadata_provider_enum(args.agent_name, sid),  # Extra copy for clarity
        f'{base}/Integration/{s}Install.Codeunit.al': gen_install(args.agent_name, sid),
        f'{base}/Integration/{s}Upgrade.Codeunit.al': gen_upgrade(args.agent_name, sid),
        # Setup
        f'{base}/Setup/{s}Setup.Table.al': gen_setup_table(args.agent_name, sid),
        f'{base}/Setup/{s}Setup.Codeunit.al': gen_setup_codeunit(args.agent_name, sid),
        f'{base}/Setup/{s}Setup.Page.al': gen_setup_page(args.agent_name, sid),
        # Setup/Metadata
        f'{base}/Setup/Metadata/{s}Factory.Codeunit.al': gen_factory(args.agent_name, sid),
        f'{base}/Setup/Metadata/{s}Metadata.Codeunit.al': gen_metadata(args.agent_name, sid),
        f'{base}/Setup/Metadata/{s}MetadataProvider.EnumExt.al': gen_metadata_provider_enum(args.agent_name, sid),
        # Setup/TaskExecution
        f'{base}/Setup/TaskExecution/{s}TaskExecution.Codeunit.al': gen_task_execution(args.agent_name, sid),
        # Setup/KPI
        f'{base}/Setup/KPI/{s}KPI.Table.al': gen_kpi_table(args.agent_name, sid),
        f'{base}/Setup/KPI/{s}KPI.Page.al': gen_kpi_page(args.agent_name, sid),
        # Setup/Permissions
        f'{base}/Setup/Permissions/{s}.permissionset.al': gen_permissionset(args.agent_name, sid),
        # Setup/Profile
        f'{base}/Setup/Profile/{s}Profile.Profile.al': gen_profile(args.agent_name, sid),
        f'{base}/Setup/Profile/{s}RoleCenter.Page.al': gen_rolecenter(args.agent_name, sid),
        # Example
        f'{base}/Example/{s}PublicAPI.Codeunit.al': gen_public_api(args.agent_name, sid),
        f'{base}/Example/{s}PublicAPIImpl.Codeunit.al': gen_public_api_impl(args.agent_name, sid),
    }

    for fp, content in files.items():
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  ✅ {fp}')

    print(f'\n🎯 Scaffold complete for "{args.agent_name}" ({len(files)} files)')
    print(f'   Object IDs: {sid} - {sid + 51}')
    print(f'   Structure: Agent Template layout')
    print(f'\n📋 Next steps:')
    print(f'   1. Fill TODO placeholders in all .al files')
    print(f'   2. Write instructions in .resources/Instructions/InstructionsV1.txt')
    print(f'   3. Add PageCustomizations for the agent profile')
    print(f'   4. Add a page extension example in Example/')
    print(f'   5. Build and deploy to sandbox')
    print(f'   6. Enable "{s} Capability" in Copilot & Agent Capabilities')
    print(f'   7. Create agent instance and test')


if __name__ == '__main__':
    main()
