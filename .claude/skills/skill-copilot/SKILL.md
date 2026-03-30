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

### Pattern: Azure OpenAI Chat Completion

```al
namespace Contoso.CopilotFeatures;

using System.AI;

codeunit 50110 "Contoso Forecast Generation"
{
    trigger OnRun()
    begin
        GenerateProposal();
    end;

    procedure SetUserPrompt(Input: Text)
    begin
        UserPrompt := Input;
    end;

    procedure SetPeriod(Period: Option "Next Month","Next Quarter","Next Year")
    begin
        ForecastPeriod := Period;
    end;

    procedure GetResult(var TmpResult: Record "Contoso Forecast Proposal" temporary)
    begin
        TmpResult.Copy(TmpProposal, true);
    end;

    internal procedure GetCompletionResult(): Text
    begin
        exit(CompletionResult);
    end;

    local procedure GenerateProposal()
    var
        JResponse: JsonToken;
        JItems: JsonToken;
    begin
        CompletionResult := Chat(BuildSystemPrompt(), BuildUserPrompt());

        if not JResponse.ReadFrom(CompletionResult) then
            Error('Failed to parse AI response as JSON.');
        if not JResponse.AsObject().Get('items', JItems) then
            Error('AI response missing "items" array.');

        ParseResults(JItems.AsArray());
    end;

    local procedure Chat(SystemPrompt: Text; ChatUserPrompt: Text): Text
    var
        AzureOpenAI: Codeunit "Azure OpenAI";
        AOAIOperationResponse: Codeunit "AOAI Operation Response";
        AOAIChatCompletionParams: Codeunit "AOAI Chat Completion Params";
        AOAIChatMessages: Codeunit "AOAI Chat Messages";
        AOAIDeployments: Codeunit "AOAI Deployments";
    begin
        // --- Authorization ---
        // Production (Microsoft-managed):
        AzureOpenAI.SetManagedResourceAuthorization(
            Enum::"AOAI Model Type"::"Chat Completions",
            AOAIDeployments.GetGPT4oLatest());

        // Development (own subscription) — uncomment and configure:
        // var Storage: Codeunit "Contoso Isolated Storage";
        // AzureOpenAI.SetAuthorization(
        //     Enum::"AOAI Model Type"::"Chat Completions",
        //     Storage.GetEndpoint(), Storage.GetDeployment(), Storage.GetSecretKey());

        AzureOpenAI.SetCopilotCapability(
            Enum::"Copilot Capability"::"Sales Forecasting");

        // --- Parameters ---
        AOAIChatCompletionParams.SetMaxTokens(2500);
        AOAIChatCompletionParams.SetTemperature(0);    // 0 = deterministic
        AOAIChatCompletionParams.SetJsonMode(true);     // force JSON output

        // --- Messages ---
        AOAIChatMessages.AddSystemMessage(SystemPrompt);
        AOAIChatMessages.AddUserMessage(ChatUserPrompt);

        // --- Call ---
        AzureOpenAI.GenerateChatCompletion(
            AOAIChatMessages, AOAIChatCompletionParams, AOAIOperationResponse);

        if AOAIOperationResponse.IsSuccess() then
            exit(AOAIChatMessages.GetLastMessage());

        HandleAIError(AOAIOperationResponse);
    end;

    local procedure HandleAIError(AOAIOperationResponse: Codeunit "AOAI Operation Response")
    begin
        case AOAIOperationResponse.GetStatusCode() of
            402:
                Error('Your Entra tenant ran out of AI quota. Ensure billing is set up correctly.');
            429:
                Error('Too many requests — please wait a moment and try again.');
            503:
                Error('AI service is temporarily unavailable. Please try again shortly.');
            else
                Error('Azure OpenAI error: %1', AOAIOperationResponse.GetError());
        end;
    end;

    local procedure BuildSystemPrompt(): Text
    var
        SysPrompt: TextBuilder;
    begin
        SysPrompt.AppendLine('# Role');
        SysPrompt.AppendLine('You are a sales forecasting expert for Business Central.');
        SysPrompt.AppendLine('');
        SysPrompt.AppendLine('# Task');
        SysPrompt.AppendLine('Analyze historical sales data and predict future demand.');
        SysPrompt.AppendLine('');
        SysPrompt.AppendLine('# Rules');
        SysPrompt.AppendLine('- Base predictions only on the data provided.');
        SysPrompt.AppendLine('- Provide clear explanations for each prediction.');
        SysPrompt.AppendLine('- Do not hallucinate item numbers — only use IDs from the data.');
        SysPrompt.AppendLine('');
        SysPrompt.AppendLine('# Output Format (JSON)');
        SysPrompt.AppendLine('{"items":[{"itemNo":"...","description":"...","forecastQty":0,"explanation":"...","confidence":0.0}]}');
        exit(SysPrompt.ToText());
    end;

    local procedure BuildUserPrompt(): Text
    var
        UserMsg: TextBuilder;
    begin
        UserMsg.AppendLine('# Historical Sales Data');
        UserMsg.AppendLine(GetSalesContext());
        UserMsg.AppendLine('');
        UserMsg.AppendLine('# Forecast Period');
        UserMsg.AppendLine(Format(ForecastPeriod));
        UserMsg.AppendLine('');
        UserMsg.AppendLine('# User Request');
        UserMsg.AppendLine(UserPrompt);
        exit(UserMsg.ToText());
    end;

    local procedure GetSalesContext(): Text
    var
        SalesLine: Record "Sales Line";
        Ctx: TextBuilder;
    begin
        SalesLine.SetLoadFields("No.", Description, Quantity, "Line Amount");
        SalesLine.SetRange("Posting Date", CalcDate('-12M', Today), Today);
        if SalesLine.FindSet() then
            repeat
                Ctx.AppendLine(StrSubstNo('Item: %1 | Desc: %2 | Qty: %3 | Amount: %4',
                    SalesLine."No.", SalesLine.Description,
                    SalesLine.Quantity, SalesLine."Line Amount"));
            until SalesLine.Next() = 0;
        exit(Ctx.ToText());
    end;

    local procedure ParseResults(JArray: JsonArray)
    var
        JItem: JsonToken;
        JField: JsonToken;
        i: Integer;
    begin
        TmpProposal.DeleteAll();
        for i := 0 to JArray.Count() - 1 do begin
            JArray.Get(i, JItem);

            TmpProposal.Init();
            if JItem.AsObject().Get('itemNo', JField) then
                TmpProposal."Item No." := CopyStr(JField.AsValue().AsText(), 1, MaxStrLen(TmpProposal."Item No."));
            if JItem.AsObject().Get('description', JField) then
                TmpProposal.Description := CopyStr(JField.AsValue().AsText(), 1, MaxStrLen(TmpProposal.Description));
            if JItem.AsObject().Get('forecastQty', JField) then
                TmpProposal."Forecast Qty" := JField.AsValue().AsDecimal();
            if JItem.AsObject().Get('explanation', JField) then
                TmpProposal.Explanation := CopyStr(JField.AsValue().AsText(), 1, MaxStrLen(TmpProposal.Explanation));
            if JItem.AsObject().Get('confidence', JField) then
                TmpProposal."Confidence Score" := JField.AsValue().AsDecimal();
            TmpProposal.Insert();
        end;
    end;

    var
        TmpProposal: Record "Contoso Forecast Proposal" temporary;
        UserPrompt: Text;
        CompletionResult: Text;
        ForecastPeriod: Option "Next Month","Next Quarter","Next Year";
}
```

### Prompt Engineering Guidelines

**System prompt structure:**
1. **Role** — who the AI is ("sales forecasting expert")
2. **Task** — what it must do ("analyze data, predict demand")
3. **Rules** — constraints ("only use provided data", "no hallucinated IDs")
4. **Output format** — exact JSON schema with field descriptions

**User prompt structure:**
1. **Context data** — BC records formatted as text (items, customers, history)
2. **Parameters** — user-selected options (period, filters)
3. **Request** — the user's free-text input

**Key parameters:**
| Parameter | Value | Effect |
|---|---|---|
| `Temperature` | `0` | Deterministic, consistent results |
| `Temperature` | `0.7` | Creative, varied results |
| `MaxTokens` | `2500` | Limits response length |
| `SetJsonMode(true)` | — | Forces valid JSON output |

## Phase 4: Testing with AI Test Toolkit

### Dependency Setup

Add to **Test app** `app.json`:
```json
{
    "dependencies": [
        {
            "id": "2156302a-872f-4568-be0b-60968696f0d5",
            "publisher": "Microsoft",
            "name": "AI Test Toolkit",
            "version": "26.0.0.0"
        }
    ]
}
```

### Pattern: Copilot Test Codeunit

```al
namespace Contoso.CopilotFeatures.Tests;

using System.TestLibraries.AI;

codeunit 50200 "Contoso Forecast Copilot Tests"
{
    Subtype = Test;
    TestPermissions = Disabled;

    var
        Assert: Codeunit Assert;
        AITTestContext: Codeunit "AIT Test Context";

    // --- Happy Path ---

    [Test]
    procedure Generate_ValidInput_ReturnsStructuredJSON()
    var
        GenCU: Codeunit "Contoso Forecast Generation";
        TmpResult: Record "Contoso Forecast Proposal" temporary;
    begin
        // [SCENARIO] Valid prompt returns non-empty structured proposals
        Initialize();
        CreateTestSalesData();

        GenCU.SetUserPrompt('Top 5 selling items next quarter');
        Assert.IsTrue(GenCU.Run(), 'Generation should succeed');
        GenCU.GetResult(TmpResult);

        // [THEN] Results are not empty and fields are populated
        Assert.RecordIsNotEmpty(TmpResult);
        TmpResult.FindFirst();
        Assert.AreNotEqual('', TmpResult."Item No.", 'Item No. must be populated');
        Assert.AreNotEqual('', TmpResult.Explanation, 'Explanation must be populated');
        Assert.IsTrue(
            (TmpResult."Confidence Score" >= 0) and (TmpResult."Confidence Score" <= 1),
            'Confidence must be 0..1');
    end;

    // --- AI Test Toolkit Dataset Test ---

    [Test]
    procedure Generate_AITDataset_OutputMatchesSchema()
    var
        GenCU: Codeunit "Contoso Forecast Generation";
        TestInput: Text;
        TestOutput: Text;
    begin
        // [SCENARIO] AI Test Toolkit dataset input produces valid output
        Initialize();
        CreateTestSalesData();

        TestInput := AITTestContext.GetInput().ValueAsText();

        GenCU.SetUserPrompt(TestInput);
        GenCU.Run();
        TestOutput := GenCU.GetCompletionResult();

        Assert.AreNotEqual('', TestOutput, 'AI should return non-empty response');
        VerifyJSONStructure(TestOutput);

        AITTestContext.SetTestOutput(TestOutput);
    end;

    // --- Edge Cases ---

    [Test]
    procedure Generate_EmptyInput_HandlesGracefully()
    var
        GenCU: Codeunit "Contoso Forecast Generation";
    begin
        // [SCENARIO] Empty prompt does not crash
        Initialize();
        GenCU.SetUserPrompt('');
        GenCU.Run();
        // No error = graceful handling
    end;

    [Test]
    procedure Generate_VeryLongInput_HandlesGracefully()
    var
        GenCU: Codeunit "Contoso Forecast Generation";
        LongText: TextBuilder;
        i: Integer;
    begin
        // [SCENARIO] Very long prompt (near token limit) does not crash
        Initialize();
        for i := 1 to 500 do
            LongText.Append('Predict sales ');
        GenCU.SetUserPrompt(LongText.ToText());
        GenCU.Run();
    end;

    // --- Consistency ---

    [Test]
    procedure Generate_SameInput_ConsistentResults()
    var
        GenCU: Codeunit "Contoso Forecast Generation";
        TmpResult1: Record "Contoso Forecast Proposal" temporary;
        TmpResult2: Record "Contoso Forecast Proposal" temporary;
    begin
        // [SCENARIO] Same input with Temperature=0 produces consistent results
        Initialize();
        CreateTestSalesData();

        GenCU.SetUserPrompt('Top 3 items');
        GenCU.Run();
        GenCU.GetResult(TmpResult1);

        GenCU.SetUserPrompt('Top 3 items');
        GenCU.Run();
        GenCU.GetResult(TmpResult2);

        Assert.AreEqual(TmpResult1.Count(), TmpResult2.Count(),
            'Same input should produce same count with Temperature=0');
    end;

    // --- Performance ---

    [Test]
    procedure Generate_StandardPrompt_RespondsUnder10Seconds()
    var
        GenCU: Codeunit "Contoso Forecast Generation";
        StartDT: DateTime;
        ElapsedMs: Integer;
    begin
        Initialize();
        CreateTestSalesData();

        StartDT := CurrentDateTime;
        GenCU.SetUserPrompt('Top 5 items');
        GenCU.Run();
        ElapsedMs := CurrentDateTime - StartDT;

        Assert.IsTrue(ElapsedMs < 10000,
            StrSubstNo('Response time %1ms should be < 10000ms', ElapsedMs));
    end;

    // --- Helpers ---

    local procedure Initialize()
    begin
        // reset state if needed
    end;

    local procedure CreateTestSalesData()
    var
        Item: Record Item;
        SalesLine: Record "Sales Line";
    begin
        // Create minimal test items + sales lines
        // Use Library - Sales / Library - Inventory for realistic data
    end;

    local procedure VerifyJSONStructure(ResponseText: Text)
    var
        JResponse: JsonToken;
        JItems: JsonToken;
    begin
        Assert.IsTrue(JResponse.ReadFrom(ResponseText), 'Response must be valid JSON');
        Assert.IsTrue(JResponse.AsObject().Get('items', JItems), 'Must contain "items" array');
        Assert.IsTrue(JItems.AsArray().Count() > 0, 'Items array should not be empty');
    end;
}
```

### AI Test Toolkit Workflow

1. Open BC → search **"AI Test Suite"**
2. Create a new test suite for your Copilot feature
3. Define **input datasets** — each row is a test prompt + expected behavior description
4. Run the suite — each input is passed via `AITTestContext.GetInput()`
5. Validate output **structure** (JSON schema), NOT exact text (AI varies)
6. Use `AITTestContext.SetTestOutput()` to log results for manual review

**Key testing principles for AI features:**
- Assert structure and constraints, not exact wording
- Use `Temperature = 0` for consistency tests
- Test edge cases: empty input, long input, special characters, no data
- Test error codes: 402 (quota), 429 (rate limit), 503 (unavailable)
- Test that suggested IDs actually exist in BC data (no hallucinations)

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
