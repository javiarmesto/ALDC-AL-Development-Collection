---
name: skill-copilot
description: "AL Copilot capability development for Business Central. Use when implementing PromptDialog pages, AI generation features, or integrating with the Copilot toolkit."
---

# Skill: AL Copilot Development (Full Lifecycle)

## Purpose

Build AI-powered Copilot experiences in Business Central end-to-end: capability registration, PromptDialog page design, Azure OpenAI generation codeunit, and testing with AI Test Toolkit.

## When to Load

This skill should be loaded when:
- A new Copilot/AI feature is being designed or implemented
- A PromptDialog page needs to be created or modified
- Azure OpenAI integration is required (chat completions, JSON mode)
- AI Test Toolkit tests need to be created for a Copilot feature
- Prompt engineering guidance is needed (system/user prompt design)
- A capability needs to be registered in BC's Copilot admin page

## Phase 1: Capability Registration

### Objects Required

1. **Enum Extension** — extend `"Copilot Capability"` to register your feature
2. **Install Codeunit** — register the capability on app install
3. **Isolated Storage Wrapper** — manage Azure OpenAI secrets securely

### Pattern: Enum Extension

```al
namespace Contoso.CopilotFeatures;

using System.AI;

enumextension 50100 "Contoso Copilot Capabilities" extends "Copilot Capability"
{
    value(50100; "Sales Forecasting")
    {
        Caption = 'Sales Forecasting with Copilot';
    }
}
```

### Pattern: Install Codeunit

```al
namespace Contoso.CopilotFeatures;

using System.AI;

codeunit 50100 "Contoso Copilot Setup"
{
    Subtype = Install;
    InherentEntitlements = X;
    InherentPermissions = X;
    Access = Internal;

    trigger OnInstallAppPerDatabase()
    begin
        RegisterCapability();
    end;

    local procedure RegisterCapability()
    var
        CopilotCapability: Codeunit "Copilot Capability";
        LearnMoreUrlTxt: Label 'https://learn.microsoft.com/dynamics365/business-central/', Locked = true;
    begin
        if not CopilotCapability.IsCapabilityRegistered(
            Enum::"Copilot Capability"::"Sales Forecasting") then
            CopilotCapability.RegisterCapability(
                Enum::"Copilot Capability"::"Sales Forecasting",
                Enum::"Copilot Availability"::Preview,
                LearnMoreUrlTxt);
    end;
}
```

**Availability options:** `Preview` (opt-in), `GA` (general availability).

After publishing, verify the capability appears in BC: search **"Copilot & AI Capabilities"** page.

### Pattern: Isolated Storage Wrapper (Secrets)

```al
codeunit 50101 "Contoso Isolated Storage"
{
    Access = Internal;

    procedure GetSecretKey(): SecretText
    var
        Secret: Text;
    begin
        if IsolatedStorage.Get('AzureOpenAIKey', DataScope::Module, Secret) then
            exit(Secret);
        Error('Azure OpenAI key not configured.');
    end;

    procedure SetSecretKey(NewKey: SecretText)
    begin
        IsolatedStorage.Set('AzureOpenAIKey', NewKey, DataScope::Module);
    end;

    procedure GetEndpoint(): Text
    var
        Endpoint: Text;
    begin
        if IsolatedStorage.Get('AzureOpenAIEndpoint', DataScope::Module, Endpoint) then
            exit(Endpoint);
        Error('Azure OpenAI endpoint not configured.');
    end;

    procedure SetEndpoint(NewEndpoint: Text)
    begin
        IsolatedStorage.Set('AzureOpenAIEndpoint', NewEndpoint, DataScope::Module);
    end;

    procedure GetDeployment(): Text
    var
        Deployment: Text;
    begin
        if IsolatedStorage.Get('AzureOpenAIDeployment', DataScope::Module, Deployment) then
            exit(Deployment);
        exit('gpt-4o');   // default model
    end;

    procedure SetDeployment(NewDeployment: Text)
    begin
        IsolatedStorage.Set('AzureOpenAIDeployment', NewDeployment, DataScope::Module);
    end;
}
```

**Production vs Development:**
- **Development**: configure own Azure OpenAI credentials via `SetSecretKey`/`SetEndpoint`/`SetDeployment`
- **Production**: use `SetManagedResourceAuthorization` (Microsoft-managed, no secrets needed)

## Phase 2: PromptDialog Page

### Page Areas

| Area | Purpose | Contains |
|---|---|---|
| `PromptOptions` | User settings/filters | Option/Enum fields only |
| `Prompt` | User text input | Free-text field with `InstructionalText` |
| `Content` | AI output display | Text field or `part` subpage with results |
| `PromptGuide` (actions) | Example prompts | Actions that pre-fill the Prompt field |
| `SystemActions` (actions) | Generate / OK / Cancel | `systemaction(Generate)`, `systemaction(OK)`, etc. |

### PromptMode Options

| Mode | Behavior | Use when |
|---|---|---|
| `Prompt` | Shows input first, user clicks Generate | User needs to provide context |
| `Generate` | Auto-runs generation when page opens | Context is pre-filled from calling page |
| `Content` | Shows content only, no generation | Displaying previously generated results |

### Pattern: Complete PromptDialog Page

```al
namespace Contoso.CopilotFeatures;

using System.AI;

page 50110 "Contoso Sales Forecast Copilot"
{
    PageType = PromptDialog;
    Extensible = false;
    IsPreview = true;
    Caption = 'Sales Forecast with Copilot';
    PromptMode = Prompt;

    layout
    {
        area(PromptOptions)
        {
            field(ForecastPeriod; SelectedPeriod)
            {
                ApplicationArea = All;
                Caption = 'Forecast Period';
                ToolTip = 'Select the forecast time horizon.';
            }
        }

        area(Prompt)
        {
            field(UserInput; UserPromptText)
            {
                ShowCaption = false;
                MultiLine = true;
                ApplicationArea = All;
                InstructionalText = 'Describe what you want to forecast (e.g., "top 10 items for next quarter")';

                trigger OnValidate()
                begin
                    CurrPage.Update();
                end;
            }
        }

        area(Content)
        {
            // Option A: simple text response
            field(AIResponse; AIResponseText)
            {
                ApplicationArea = All;
                Caption = 'Copilot Suggestion';
                MultiLine = true;
                Editable = false;
            }

            // Option B: structured results via subpage
            // part(Proposals; "Contoso Forecast Proposal Sub")
            // {
            //     ApplicationArea = All;
            // }
        }
    }

    actions
    {
        area(PromptGuide)
        {
            action(ExampleTopItems)
            {
                ApplicationArea = All;
                Caption = 'Top selling items next quarter';
                ToolTip = 'Predict the best-selling items for the next quarter.';

                trigger OnAction()
                begin
                    UserPromptText := 'What will be the top 10 selling items next quarter based on historical sales?';
                    CurrPage.Update(false);
                end;
            }

            action(ExampleSlowMovers)
            {
                ApplicationArea = All;
                Caption = 'Slow-moving inventory';
                ToolTip = 'Identify items with declining sales trends.';

                trigger OnAction()
                begin
                    UserPromptText := 'Which items show declining sales over the last 6 months?';
                    CurrPage.Update(false);
                end;
            }
        }

        area(SystemActions)
        {
            systemaction(Generate)
            {
                Caption = 'Generate';
                ToolTip = 'Generate AI forecast suggestions.';

                trigger OnAction()
                begin
                    RunGeneration();
                end;
            }

            systemaction(Regenerate)
            {
                Caption = 'Regenerate';
                ToolTip = 'Generate different suggestions.';

                trigger OnAction()
                begin
                    RunGeneration();
                end;
            }

            systemaction(OK)
            {
                Caption = 'Keep it';
                ToolTip = 'Accept and apply the forecast.';
            }

            systemaction(Cancel)
            {
                Caption = 'Discard';
                ToolTip = 'Discard suggestions.';
            }
        }
    }

    trigger OnQueryClosePage(CloseAction: Action): Boolean
    begin
        if CloseAction = CloseAction::OK then
            ApplySuggestions();
    end;

    local procedure RunGeneration()
    var
        GenerationCU: Codeunit "Contoso Forecast Generation";
    begin
        AIResponseText := '';
        GenerationCU.SetUserPrompt(UserPromptText);
        GenerationCU.SetPeriod(SelectedPeriod);

        if GenerationCU.Run() then
            AIResponseText := GenerationCU.GetCompletionResult()
        else
            Error('Generation failed: %1', GetLastErrorText());

        CurrPage.Update(false);
    end;

    local procedure ApplySuggestions()
    begin
        // Apply user-approved results to BC data
    end;

    /// Call from external page to set context before opening
    procedure SetItemFilter(ItemCategoryCode: Code[20])
    begin
        ContextItemCategory := ItemCategoryCode;
    end;

    var
        UserPromptText: Text;
        AIResponseText: Text;
        SelectedPeriod: Option "Next Month","Next Quarter","Next Year";
        ContextItemCategory: Code[20];
}
```

### Pattern: Temporary Table for Structured Output

When AI returns a list of proposals (not just text), use a temporary table:

```al
table 50110 "Contoso Forecast Proposal"
{
    TableType = Temporary;
    Caption = 'Forecast Proposal';

    fields
    {
        field(1; "Entry No."; Integer) { AutoIncrement = true; }
        field(10; "Item No."; Code[20]) { Caption = 'Item No.'; }
        field(20; Description; Text[100]) { Caption = 'Description'; }
        field(30; "Forecast Qty"; Decimal) { Caption = 'Forecast Quantity'; }
        field(40; Explanation; Text[250]) { Caption = 'AI Explanation'; }
        field(50; "Confidence Score"; Decimal) { Caption = 'Confidence'; MinValue = 0; MaxValue = 1; }
    }

    keys
    {
        key(PK; "Entry No.") { Clustered = true; }
    }
}
```

Display via a `ListPart` subpage linked by `part()` in the Content area.

## Phase 3: AI Generation Codeunit

Builds the Azure OpenAI chat-completion codeunit and the structured-output handling (temporary tables).

**When implementing the generation codeunit, load** `references/copilot-ai-generation.md`.

## Phase 4: Testing with AI Test Toolkit

Validates the Copilot experience with the AI Test Toolkit: dependency setup, the test codeunit pattern, and the test workflow.

**When writing Copilot tests, load** `references/copilot-testing.md`.

## Workflow

### Step 1: Design Copilot Experience

Define before coding:
1. **User problem** — what task does this Copilot help with?
2. **PromptMode** — Prompt (user types) vs Generate (auto-run)?
3. **Input** — free text, options, context from calling page?
4. **Output** — simple text or structured proposals (temp table + subpage)?
5. **AI model** — Temperature (deterministic vs creative), MaxTokens

### Step 2: Implement (Phase 1 → Phase 3)

1. Register capability (Phase 1: enum + install codeunit)
2. Create PromptDialog page (Phase 2: areas, system actions, prompt guide)
3. Create generation codeunit (Phase 3: Azure OpenAI + JSON parsing)
4. Build: `al_build`

### Step 3: Test (Phase 4)

1. Add AI Test Toolkit dependency to Test app
2. Create test codeunit with happy path, edge cases, consistency, performance
3. Create AI Test Suite dataset in BC for systematic prompt evaluation
4. Run tests and iterate on prompts

### Step 4: Responsible AI Review

Before shipping:
- User transparency — users know they're interacting with AI
- Content filtering — no raw AI output without validation
- Data privacy — no sensitive data in prompts without sanitization
- Feedback — users can accept/reject AI suggestions (OK/Cancel)
- Error handling — graceful handling of all Azure OpenAI error codes

## References

- [Build Copilot Capability in AL](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/ai-build-capability-in-al)
- [Build Copilot User Experience](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/ai-build-experience)
- [PromptDialog Page Type](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-page-type-promptdialog)
- [Azure OpenAI Module in AL](https://learn.microsoft.com/en-us/dynamics365/business-central/application/system-application/codeunit/system.ai.azure-openai)
- [AI Test Toolkit](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-ai-test-toolkit)
- [BCTech Samples — Copilot](https://github.com/microsoft/BCTech/tree/master/samples/AzureOpenAI)
- [Responsible AI — Microsoft](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/ai-responsible-ai-overview)

## Constraints

- Do NOT expose raw AI responses without validation — always parse and verify structure
- Do NOT include sensitive customer data in prompts without sanitization
- Do NOT deploy Copilot features without Responsible AI compliance review
- Do NOT skip AI Test Toolkit testing — every Copilot feature MUST have test coverage
- Do NOT use deprecated `SetAuthorization` in production — use `SetManagedResourceAuthorization`
- Do NOT hardcode Azure OpenAI credentials — always use `IsolatedStorage`
- Permission set generation → `skill-permissions.md`
- Debugging AI integration issues → `skill-debug.md`
- Test strategy design → `skill-testing.md`
