---
name: skill-events
description: "AL event-driven architecture for Business Central. Use when creating EventSubscribers, IntegrationEvents, BusinessEvents, or implementing publisher/subscriber patterns in extensions."
---

# Skill: AL Event-Driven Architecture

## Purpose

Discover, design, and implement event-driven patterns in AL Business Central extensions: event discovery via Event Recorder, subscriber/publisher creation, IsHandled patterns, and extensibility design.

## When to Load

This skill should be loaded when:
- Extending standard BC functionality (posting, validation, master data changes)
- Designing custom integration events for a new codeunit or extension
- A subscriber is not firing and needs investigation
- An architecture requires extensibility points for future consumers
- Implementing document posting interventions, workflow triggers, or UI customizations

## Core Patterns

### Pattern 1: Event Discovery with Event Recorder

Before writing any subscriber, discover which events are raised during the business process:

```
1. al_open_Event_Recorder            ← open the recorder in VS Code
2. Start recording
3. Execute the business process in BC (e.g., post a sales order)
4. Stop recording
5. Analyze the event list — filter by object or keyword
6. Identify the OnBefore/OnAfter event closest to your extension point
```

Use `al_search_objects` and `al_get_object_definition` to inspect publisher signatures.
Use `al_find_references` to see who else subscribes to the same event.

### Pattern 2: Event Subscriber

```al
// Subscriber codeunit — name with "Handler" suffix
codeunit 50100 "Sales Document Events Handler"
{
    // Attribute breakdown:
    //   ObjectType  — Table, Codeunit, Page, Report, etc.
    //   ObjectId    — Database::"Sales Header" or Codeunit::"Customer Management"
    //   EventName   — exact name of the publisher procedure (e.g., OnBeforeInsert)
    //   ElementName — '' for table/codeunit events; field name for page field triggers
    //   SkipOnMissingLicense  — false (recommended: always run)
    //   SkipOnMissingPermission — false (recommended: always run)

    [EventSubscriber(ObjectType::Table, Database::"Sales Header",
                     OnBeforeInsert, '', false, false)]
    local procedure OnBeforeInsertSalesHeader(
        var SalesHeader: Record "Sales Header";
        RunTrigger: Boolean)
    begin
        ValidateCustomFields(SalesHeader);
    end;
}
```

**Subscriber rules:**
- Procedure MUST be `local`
- Parameter signature MUST exactly match the publisher (name, type, order)
- One subscriber per event per codeunit (keep handler codeunits focused)
- Never use `Commit` inside a subscriber unless absolutely necessary

### Pattern 3: Integration Event Publisher with IsHandled

The standard extensibility pattern: `OnBefore` allows interception, `OnAfter` allows reaction.

```al
codeunit 50101 "Customer Management"
{
    procedure CreateCustomer(var Customer: Record Customer): Boolean
    var
        IsHandled: Boolean;
    begin
        // 1. Raise OnBefore — subscribers can validate, modify, or skip
        OnBeforeCreateCustomer(Customer, IsHandled);
        if IsHandled then
            exit(true);

        // 2. Default logic
        if not Customer.Insert(true) then
            exit(false);

        // 3. Raise OnAfter — subscribers can react (logging, integration, etc.)
        OnAfterCreateCustomer(Customer);
        exit(true);
    end;

    [IntegrationEvent(false, false)]
    local procedure OnBeforeCreateCustomer(
        var Customer: Record Customer;
        var IsHandled: Boolean)
    begin
        // Empty body — subscribers provide the implementation
        // IsHandled = true → skip default logic
    end;

    [IntegrationEvent(false, false)]
    local procedure OnAfterCreateCustomer(var Customer: Record Customer)
    begin
        // Empty body — subscribers react after creation
    end;
}
```

**IntegrationEvent attribute:**
- `IntegrationEvent(IncludeSender, GlobalVarAccess)`
- `IncludeSender = false` — recommended for clean API (no coupling to publisher internals)
- `GlobalVarAccess = false` — recommended (prevent subscribers from accessing publisher global vars)

### Pattern 4: Business Event

Business events are user-disablable — use for optional, non-critical functionality:

```al
[BusinessEvent(IncludeSender)]
local procedure OnCustomerCreditLimitExceeded(
    Customer: Record Customer;
    RequestedAmount: Decimal)
begin
    // Subscribers may send notification, log, or block — user can disable
end;
```

| Attribute | Cannot be disabled | Use for |
|---|---|---|
| `IntegrationEvent` | Correct | Critical business logic, posting interventions |
| `BusinessEvent` | Can be disabled by user | Optional features, external integrations, notifications |

### Pattern 5: Well-Designed Event Parameters

```al
// ✅ Good — rich context, var where modification expected, IsHandled for OnBefore
[IntegrationEvent(false, false)]
local procedure OnBeforePostDocument(
    var DocumentHeader: Record "Sales Header";   // var — subscriber may modify
    var DocumentLines: Record "Sales Line";      // var — subscriber may modify
    PostingDate: Date;                           // value — read-only context
    var IsHandled: Boolean)                      // var — subscriber may skip default
begin
end;

// ✅ Good — results context for OnAfter
[IntegrationEvent(false, false)]
local procedure OnAfterPostDocument(
    DocumentHeader: Record "Sales Header";       // value — read-only (already posted)
    PostedDocumentNo: Code[20];                  // result reference
    PostingResult: Boolean)                      // success/failure
begin
end;
```

**Parameter design rules:**
- `var Record` — when subscribers should be able to modify the record
- Non-var `Record` — when record is read-only context
- Always include `var IsHandled: Boolean` in `OnBefore` events
- Include result/outcome parameters in `OnAfter` events
- Use meaningful parameter names that describe business intent

## Workflow

### Step 1: Discover Events

1. Open Event Recorder: `al_open_Event_Recorder`
2. Execute the target business process in BC
3. Review recorded events — filter by relevant object
4. Use `al_get_object_definition` to inspect publisher signatures
5. Use `al_find_references` to check existing subscribers (avoid conflicts)

### Step 2: Design Event Architecture

For **subscribing to existing events**:
1. Identify the right OnBefore / OnAfter event from Step 1
2. Match the parameter signature exactly
3. Create a handler codeunit with naming: `"{Domain} Events Handler"`

For **creating new integration events** in your codeunit:
1. Identify logical extension points in your business logic
2. Add `OnBefore` event with `IsHandled` pattern before key operations
3. Add `OnAfter` event after key operations with result context
4. Follow naming: `OnBefore{Action}` / `OnAfter{Action}`
5. Choose `IntegrationEvent` (critical) or `BusinessEvent` (optional)

### Step 3: Implement

Use `al_insert_event` to scaffold subscriber/publisher structures, then fill the body:

```al
// Subscriber handler codeunit
codeunit 50102 "Customer Validation Handler"
{
    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Customer Management",
                     OnBeforeCreateCustomer, '', false, false)]
    local procedure ValidateOnBeforeCreate(
        var Customer: Record Customer;
        var IsHandled: Boolean)
    begin
        ValidateCustomerCreditLimit(Customer);

        if ShouldSkipDefaultProcessing(Customer) then
            IsHandled := true;
    end;
}
```

### Step 4: Verify

1. Build: `al_build` — check for compilation errors (signature mismatches)
2. Set breakpoint inside subscriber
3. Debug: `al_debug_without_publish`
4. Execute the business process — confirm subscriber fires
5. If subscriber does NOT fire, check:
   - Signature mismatch (most common cause)
   - Wrong `ObjectType` / `ObjectId`
   - Extension not published/active
   - Another subscriber set `IsHandled = true` before yours
   - SkipOnMissingLicense / SkipOnMissingPermission attributes

## Common Scenarios

| Scenario | Event Source | Pattern |
|---|---|---|
| Validate before posting | `OnBeforePost*` on Codeunit "Sales-Post" | Subscriber + IsHandled |
| Add fields to sales order | `OnAfterInsert` on Table "Sales Header" | Subscriber (set defaults) |
| External integration trigger | `OnAfterPostDocument` (custom) | Publisher in your codeunit |
| Custom approval workflow | `OnBeforeRelease*` | Subscriber + IsHandled to block |
| UI field validation | Page trigger `OnAfterValidate` on field | Subscriber with ElementName |
| Master data change audit | `OnAfterModify` on Table "Customer" | Subscriber (log changes) |

## References

- [Event Recorder — Microsoft Docs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-events-discoverability)
- [Events in AL](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-events-in-al)
- [IntegrationEvent Attribute](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/attributes/devenv-integrationevent-attribute)
- [BusinessEvent Attribute](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/attributes/devenv-businessevent-attribute)
- [EventSubscriber Attribute](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/attributes/devenv-eventsubscriber-attribute)

## Constraints

- This skill covers **event discovery, design, and implementation patterns** — it does NOT duplicate the passive rules in `al-events.instructions.md` (auto-applied to all `.al` files)
- Do NOT create publishers without an `OnBefore` + `OnAfter` pair at minimum
- Do NOT use `Commit` inside event subscribers unless absolutely required
- Do NOT set `IsHandled = true` without clear documentation of why default logic is skipped
- Subscriber debugging (breakpoints, snapshots) → load `skill-debug.md`
- Subscriber performance overhead analysis → load `skill-performance.md`
