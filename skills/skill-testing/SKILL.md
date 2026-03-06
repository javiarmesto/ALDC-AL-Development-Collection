---
name: skill-testing
description: "AL test development patterns for Business Central. Use when creating test codeunits, writing Given/When/Then test procedures, using Library Assert, configuring test projects, or implementing TDD workflows."
---

# Skill: AL Testing & Test Strategy

## Purpose

Design test strategies, implement Given/When/Then test patterns, build reusable library codeunits, test Copilot features with AI Test Toolkit, and integrate testing into the conductor's TDD cycle for AL Business Central extensions.

## When to Load

This skill should be loaded when:
- A test strategy or test plan needs to be designed for a feature
- Test codeunits need to be created (unit, integration, UI)
- The conductor runs a TDD cycle (RED → GREEN → REFACTOR)
- Copilot/AI-powered features need testing with AI Test Toolkit
- Test data builders or library codeunits need to be created
- Test failures need analysis or coverage gaps need to be addressed

## Core Patterns

### Pattern 1: Given/When/Then Test Structure

Every test follows GWT with explicit comments and a descriptive name:

```al
codeunit 50100 "Discount Calculation Tests"
{
    Subtype = Test;
    TestPermissions = Disabled;

    var
        Assert: Codeunit Assert;
        LibrarySales: Codeunit "Library - Sales";
        LibraryRandom: Codeunit "Library - Random";
        IsInitialized: Boolean;

    [Test]
    procedure CalculateLineDiscount_VolumeOver100_Applies15Percent()
    var
        SalesLine: Record "Sales Line";
        DiscountMgt: Codeunit "Contoso Discount Management";
        Result: Decimal;
    begin
        // [SCENARIO] Volume discount is correctly applied for quantities ≥ 100
        Initialize();

        // [GIVEN] A sales line with quantity 100 and unit price 10
        CreateSalesLineWithQty(SalesLine, 100, 10);

        // [GIVEN] Volume discount setup: 100+ units → 15%
        CreateVolumeDiscountSetup(100, 15);

        // [WHEN] Discount is calculated
        Result := DiscountMgt.CalculateLineDiscount(SalesLine);

        // [THEN] Discount percentage is 15%
        Assert.AreEqual(15, Result, 'Volume discount not applied for qty >= 100');

        // [THEN] Line amount reflects the discount
        Assert.AreEqual(850, SalesLine."Line Amount",
            'Line amount should be 100 * 10 * (1 - 0.15) = 850');
    end;

    local procedure Initialize()
    begin
        if IsInitialized then
            exit;
        // One-time setup: number series, general setup, etc.
        IsInitialized := true;
    end;
}
```

**Naming convention**: `Action_Condition_ExpectedOutcome` — reads as a sentence.

### Pattern 2: Library Codeunit (Reusable Test Helpers)

Encapsulate test data creation in library codeunits — one per domain:

```al
codeunit 50200 "Library - Contoso Sales"
{
    /// Creates a customer with standard defaults for testing.
    procedure CreateCustomer(var Customer: Record Customer)
    var
        LibrarySales: Codeunit "Library - Sales";
    begin
        LibrarySales.CreateCustomer(Customer);   // standard BC library
        Customer."Credit Limit (LCY)" := 100000;
        Customer.Modify();
    end;

    /// Creates a released sales order with one line.
    procedure CreateReleasedSalesOrder(
        var SalesHeader: Record "Sales Header";
        CustomerNo: Code[20];
        ItemNo: Code[20];
        Qty: Decimal)
    var
        SalesLine: Record "Sales Line";
        LibrarySales: Codeunit "Library - Sales";
    begin
        LibrarySales.CreateSalesHeader(
            SalesHeader, SalesHeader."Document Type"::Order, CustomerNo);
        LibrarySales.CreateSalesLine(
            SalesLine, SalesHeader, SalesLine.Type::Item, ItemNo, Qty);
        LibrarySales.ReleaseSalesDocument(SalesHeader);
    end;
}
```

**Rules:**
- Always delegate to standard BC library codeunits (`Library - Sales`, `Library - Inventory`, `Library - ERM`, `Library - Random`) for base data creation
- Add extension-specific fields on top
- Keep helpers stateless — no global variables in library codeunits
- Place in `Test/src/Libraries/` folder

### Pattern 3: Test Data Builder (Fluent API)

For complex test scenarios with many optional parameters:

```al
codeunit 50201 "Sales Order Builder"
{
    var
        SalesHeader: Record "Sales Header";
        LineCount: Integer;

    procedure Create(): Codeunit "Sales Order Builder"
    begin
        SalesHeader.Init();
        SalesHeader."Document Type" := SalesHeader."Document Type"::Order;
        SalesHeader.Insert(true);
        exit(this);
    end;

    procedure WithCustomer(CustomerNo: Code[20]): Codeunit "Sales Order Builder"
    begin
        SalesHeader.Validate("Sell-to Customer No.", CustomerNo);
        SalesHeader.Modify(true);
        exit(this);
    end;

    procedure WithLine(ItemNo: Code[20]; Qty: Decimal): Codeunit "Sales Order Builder"
    var
        SalesLine: Record "Sales Line";
    begin
        LineCount += 10000;
        SalesLine.Init();
        SalesLine."Document Type" := SalesHeader."Document Type";
        SalesLine."Document No." := SalesHeader."No.";
        SalesLine."Line No." := LineCount;
        SalesLine.Insert(true);
        SalesLine.Validate(Type, SalesLine.Type::Item);
        SalesLine.Validate("No.", ItemNo);
        SalesLine.Validate(Quantity, Qty);
        SalesLine.Modify(true);
        exit(this);
    end;

    procedure Build(): Record "Sales Header"
    begin
        exit(SalesHeader);
    end;
}

// Usage in test:
[Test]
procedure PostOrder_TwoLines_CreatesInvoice()
var
    SalesHeader: Record "Sales Header";
    Builder: Codeunit "Sales Order Builder";
begin
    Initialize();
    SalesHeader := Builder.Create()
        .WithCustomer('C001')
        .WithLine('ITEM-A', 10)
        .WithLine('ITEM-B', 5)
        .Build();
    // ...
end;
```

### Pattern 4: Handler Functions (Dialogs, Messages, Confirms)

When the code under test raises dialogs, declare handlers at the test procedure level:

```al
[Test]
[HandlerFunctions('ConfirmYesHandler,MessageHandler')]
procedure PostSalesOrder_WithValidation_CreatesLedgerEntry()
var
    SalesHeader: Record "Sales Header";
    LibrarySales: Codeunit "Library - Sales";
begin
    // [SCENARIO] Posting order with custom validation creates ledger entry
    Initialize();

    // [GIVEN] A released sales order
    CreateReleasedOrder(SalesHeader);

    // [WHEN] Order is posted (triggers confirm + message)
    LibrarySales.PostSalesDocument(SalesHeader, true, true);

    // [THEN] Custom ledger entry exists
    VerifyCustomLedgerEntry(SalesHeader."No.");
end;

[ConfirmHandler]
procedure ConfirmYesHandler(Question: Text; var Reply: Boolean)
begin
    Reply := true;
end;

[MessageHandler]
procedure MessageHandler(Msg: Text)
begin
    // Absorb expected messages
end;

[PageHandler]
procedure CustomerCardHandler(var CustomerCard: TestPage "Customer Card")
begin
    CustomerCard."Credit Limit (LCY)".SetValue(50000);
    CustomerCard.OK().Invoke();
end;
```

Handler types: `ConfirmHandler`, `MessageHandler`, `PageHandler`, `ModalPageHandler`, `ReportHandler`, `RequestPageHandler`, `SendNotificationHandler`, `RecallNotificationHandler`, `HyperlinkHandler`, `StrMenuHandler`.

### Pattern 5: TestPage for UI Testing

```al
[Test]
procedure CustomerCard_SetHighCreditLimit_ShowsWarning()
var
    Customer: Record Customer;
    CustomerCard: TestPage "Customer Card";
begin
    // [SCENARIO] Setting very high credit limit shows warning
    Initialize();
    CreateCustomerWithSalesHistory(Customer, 10000);

    // [WHEN] User opens card and sets excessive credit limit
    CustomerCard.OpenEdit();
    CustomerCard.GoToRecord(Customer);

    // [THEN] Validation error is raised
    asserterror CustomerCard."Credit Limit (LCY)".SetValue(99999999);
    Assert.ExpectedError('Credit limit exceeds');
end;

[Test]
procedure DiscountList_FilterByCustomerGroup_ShowsFiltered()
var
    DiscountList: TestPage "Contoso Discount List";
begin
    Initialize();
    CreateDiscountsForGroups();

    DiscountList.OpenView();
    DiscountList.Filter.SetFilter("Customer Group", 'PREMIUM');

    // [THEN] Only premium discounts visible
    Assert.IsTrue(DiscountList.First(), 'Should have at least one premium discount');
    Assert.AreEqual('PREMIUM', DiscountList."Customer Group".Value,
        'Filtered record should be PREMIUM group');
end;
```

### Pattern 6: AI Test Toolkit (Copilot Feature Testing)

For testing Copilot capabilities (PromptDialog pages, AI-generated suggestions):

```al
codeunit 50210 "Copilot Suggestion Tests"
{
    Subtype = Test;
    TestPermissions = Disabled;

    var
        Assert: Codeunit Assert;
        AITTestContext: Codeunit "AIT Test Context";

    [Test]
    procedure GenerateSuggestion_ValidInput_ReturnsExpectedFormat()
    var
        TestInput: Text;
        TestOutput: Text;
    begin
        // [SCENARIO] Copilot suggestion generates correct structured output
        Initialize();

        // [GIVEN] A valid input prompt from the test dataset
        TestInput := AITTestContext.GetInput().ValueAsText();

        // [WHEN] The AI generation procedure is invoked
        TestOutput := GenerateSuggestion(TestInput);

        // [THEN] Output is non-empty and contains expected structure
        Assert.AreNotEqual('', TestOutput, 'AI should return non-empty suggestion');
        AITTestContext.SetTestOutput(TestOutput);
    end;
}
```

**AI Test Toolkit workflow:**
1. Create test suite in BC: search "AI Test Suite" page
2. Define input datasets (prompts + expected behavior descriptions)
3. Run suite — each input is passed via `AITTestContext.GetInput()`
4. Validate output structure, not exact text (AI responses vary)
5. Use `AITTestContext.SetTestOutput()` to log results for review

**Key assertions for AI features:**
- Output is non-empty
- Output contains required fields/structure (JSON schema validation)
- No hallucinated object IDs (validate against real BC data)
- Response time within acceptable bounds

## Workflow

### Step 1: Design Test Strategy

Read the requirement contracts before creating any tests:
```
.github/plans/{req_name}.spec.md          ← acceptance criteria to test
.github/plans/{req_name}.architecture.md   ← components to cover
.github/plans/{req_name}.test-plan.md      ← existing plan (if any)
.github/plans/memory.md                    ← context and conventions
```

Categorize test scenarios:
- **Unit** — isolated logic: calculations, validations, transformations
- **Integration** — component interaction: posting, event subscribers, API calls
- **UI** — page behavior: field validation, actions, navigation (TestPage)
- **Edge/Error** — boundaries, invalid inputs, missing data, permission errors
- **AI** — Copilot features (AI Test Toolkit)

Coverage targets:
| Area | Target |
|---|---|
| Core business logic | 95% |
| Integration paths | 85% |
| UI interactions | 70% |
| Error handling paths | 100% |
| Overall | 85%+ |

### Step 2: Create Test Plan Document

Create `.github/plans/{req_name}.test-plan.md` using `docs/templates/test-plan-template.md`:
- List every scenario as Given/When/Then with a test method name
- Group by unit / integration / UI / edge case
- Define library codeunits needed
- Set coverage targets
- **PAUSE — wait for user approval before implementing**

### Step 3: Implement Tests (TDD Integration)

**When called by `al-conductor` in TDD cycle:**

```
RED phase:
  1. Write failing test(s) for the current requirement
  2. Run: al_build → verify compilation
  3. Run test → confirm it FAILS (no implementation yet)

GREEN phase:
  4. Implement minimum code to make test(s) pass
  5. Run test → confirm it PASSES

REFACTOR phase:
  6. Improve code quality while keeping tests green
  7. Run all tests → confirm no regressions
```

**When called standalone (tests for existing code):**
1. Create test codeunit per feature: `"Feature Name Tests"`
2. Create library codeunit per domain: `"Library - Feature Name"`
3. Implement tests following GWT pattern (Pattern 1)
4. Add handlers (Pattern 4) for any dialogs
5. Run: `al_build` + test execution

### Step 4: Test Isolation

Each test MUST be independent — no shared mutable state between tests:

```al
// ✅ Initialize procedure resets state
local procedure Initialize()
begin
    if IsInitialized then
        exit;
    // Setup number series, general posting setup, etc.
    // Use standard Library codeunits:
    //   LibraryERM.SetupGenPostingGroups()
    //   LibrarySales.SetupNoSeries()
    IsInitialized := true;
end;

// ✅ Each test creates its own data
[Test]
procedure Test_A()
begin
    Initialize();
    CreateOwnTestData();  // isolated
    // ...
end;

[Test]
procedure Test_B()
begin
    Initialize();
    CreateOwnTestData();  // independent from Test_A
    // ...
end;
```

**Transaction isolation**: AL test framework auto-rolls back after each `[Test]` procedure when `TestPermissions = Disabled`. No manual cleanup needed.

### Step 5: Validate and Report

1. Run full test suite
2. Verify all tests pass — zero tolerance for flaky tests
3. Update coverage metrics in `.github/plans/{req_name}.test-plan.md`
4. Update `memory.md` with test results summary

## References

- [AL Test Framework — Microsoft Docs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-testing-application)
- [Test Codeunits and Methods](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-test-codeunits-and-test-methods)
- [TestPage Data Type](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/methods-auto/testpage/testpage-data-type)
- [Handler Functions](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-creating-handler-methods-in-tests)
- [AI Test Toolkit](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-ai-test-toolkit)
- [Library Assert](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-library-assert)

## Constraints

- This skill covers **active test design, patterns, and TDD integration** — it does NOT duplicate passive rules in `al-testing.instructions.md` (auto-applied to `**/test/**/*.al`)
- Tests MUST live in the Test project, NEVER in the App folder (per AL-Go structure)
- Do NOT generate tests without explicit user request
- Do NOT create interdependent tests that rely on execution order
- Do NOT write tests without assertions — every `[Test]` must verify something
- Do NOT test private implementation details — test public contracts only
- For debugging test failures → load `skill-debug.md`
- For event subscriber testing → load `skill-events.md`
- For permission testing with `TestPermissions = Restrictive` → load `skill-permissions.md`
