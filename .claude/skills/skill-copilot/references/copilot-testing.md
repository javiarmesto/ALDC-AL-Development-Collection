# Copilot — Testing with AI Test Toolkit (Phase 4)

> Reference extracted from `skill-copilot/SKILL.md`. Load only when writing Copilot tests.

## Table of contents

- Dependency Setup
- Pattern: Copilot Test Codeunit
- AI Test Toolkit Workflow

---


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
