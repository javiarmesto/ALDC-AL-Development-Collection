# Copilot — AI Generation Codeunit (Phase 3)

> Reference extracted from `skill-copilot/SKILL.md`. Load only when implementing the AI generation codeunit.

## Table of contents

- Pattern: Azure OpenAI Chat Completion
- Prompt Engineering Guidelines

---


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
