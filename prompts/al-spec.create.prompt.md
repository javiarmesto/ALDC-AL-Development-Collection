---
agent: agent
model: Claude Opus 4.5 (Preview) (copilot)
description: 'Create a detailed technical specification (.spec.md) that serves as an implementable blueprint for Business Central features. Reads architecture.md if exists. Outputs to .github/plans/{req_name}/.'
tools: ['vscode', 'read', 'search', 'github/*', 'vscode/memory', 'ms-vscode.vscode-websearchforcopilot/websearch']
---

# AL Technical Specification Workflow

Your goal is to generate a **detailed implementable technical specification** for `${input:req_name}` (complexity: `${input:Complexity}`).

This is **NOT** the architecture phase. This phase produces the implementable blueprint: exact object IDs, field types, procedure signatures, event patterns, and AL code snippets.

## Guardrails

- **Never** create or modify real AL objects during this phase
- **Never** output to `/specs/` — always output to `.github/plans/{req_name}/`
- If `{req_name}.architecture.md` exists, read it first — the spec must implement what the architect designed
- If spec already exists, confirm with user before overwriting
- Complexity drives depth: LOW = lighter spec, MEDIUM/HIGH = full spec with all sections

## Step 1 — Read Context

### 1.1 Read global memory

```
Read .github/plans/memory.md
```

Extract: project app ID range, naming conventions (prefix), existing table IDs in use, current extension patterns.

### 1.2 Read architecture document (if exists)

```
Read .github/plans/${input:req_name}/${input:req_name}.architecture.md
```

If it exists: the spec MUST align with the architectural decisions (data flows, chosen patterns, integration points).
If it does not exist: proceed — spec will define structure from scratch (typical for LOW complexity).

### 1.3 Analyze codebase

Search for:
- Existing objects with similar patterns (`search`)
- Naming conventions in `/src`
- Available object ID ranges in `app.json`
- Existing event publishers relevant to this feature
- Existing API pages or codeunits if integration is involved

---

## Step 2 — Generate Specification

Create `.github/plans/${input:req_name}/${input:req_name}.spec.md` with the following structure:

---

```markdown
# ${input:req_name} — Technical Specification

**Version:** 1.0
**Date:** {current date}
**Complexity:** ${input:Complexity}
**Status:** Draft

## 1. Overview

### Business Context
[1-3 sentences describing what this feature does and why it is needed]

### Scope
[What is included. What is explicitly excluded.]

### Architecture Reference
[If architecture.md exists: "Implements {req_name}.architecture.md — {pattern chosen}". If not: "No architecture document — spec defines structure."]

---

## 2. AL Object Inventory

| Object Type | Object ID | Name | Extends / Source | Purpose |
|-------------|-----------|------|-----------------|---------|
| TableExtension | {ID from range} | {Prefix} {BaseName} Ext | {Base Table} | {Why this extension} |
| PageExtension  | {ID} | {Prefix} {BasePage} Ext | {Base Page} | {What fields/actions added} |
| Codeunit       | {ID} | {Prefix} {Name} Mgt | — | {Core business logic} |
| Codeunit       | {ID} | {Prefix} {Name} Subscriber | — | {Event subscriptions} |

> Object IDs MUST be within the app.json `idRanges`. Verify with codebase search before assigning.

---

## 3. Data Model

### Table Extensions / New Tables

For each table/extension:

```al
tableextension {ID} "{Prefix} {BaseName} Ext" extends "{BaseName}"
{
    fields
    {
        field({FieldID}; "{Prefix} {FieldName}"; {DataType}[{Length}])
        {
            Caption = '{Caption}', Comment = '{Translation key}';
            DataClassification = CustomerContent; // or ToBeClassified / SystemMetadata
            {CalcFormula / TableRelation / BlankZero / etc. if applicable}
        }
    }
}
```

> Specify GDPR DataClassification for every field.

### Field Catalogue

| Field No. | Field Name | Type | Length | Required | Relation | Description |
|-----------|-----------|------|--------|----------|---------|-------------|
| {ID} | {Prefix} {Name} | {Type} | {L} | Yes/No | {Table."Field"} | {Purpose} |

---

## 4. Business Logic — Codeunit Procedures

For each codeunit, list every public procedure with full signature:

```al
codeunit {ID} "{Prefix} {Name} Mgt"
{
    // Procedure: {What it does}
    // Called by: {who calls this}
    procedure {ProcedureName}({Param}: {Type}): {ReturnType}
    begin
        // AL code sketch for complex logic only
    end;

    // Internal helper
    local procedure {HelperName}({Param}: {Type})
    begin
    end;
}
```

---

## 5. Event Integration

### Publishers (new events this feature exposes)

```al
// In: {Codeunit name}
[IntegrationEvent(false, false)]
local procedure OnAfter{ActionName}({Param}: {Type})
begin
end;
```

### Subscribers (events this feature hooks into)

```al
[EventSubscriber(ObjectType::Codeunit, Codeunit::{Publisher}, '{EventName}', '', false, false)]
local procedure {EventName}_Handler({Param}: {Type})
begin
    // What this subscriber does
end;
```

---

## 6. Pages and UI

### Page Extensions / New Pages

```al
pageextension {ID} "{Prefix} {BasePage} Ext" extends "{BasePage}"
{
    layout
    {
        addafter({ExistingGroup})
        {
            group("{Prefix} {GroupName}")
            {
                Caption = '{Caption}';
                field("{Prefix} {FieldName}"; Rec."{Prefix} {FieldName}")
                {
                    ApplicationArea = All;
                    ToolTip = '{Explain what this field does}';
                }
            }
        }
    }

    actions
    {
        addafter({ExistingAction})
        {
            action("{Prefix} {ActionName}")
            {
                Caption = '{Caption}';
                ApplicationArea = All;
                Image = {IconName};
                trigger OnAction()
                begin
                    {Codeunit}.{Procedure}(Rec);
                end;
            }
        }
    }
}
```

---

## 7. Tests (Given/When/Then)

For each main scenario:

```al
codeunit {ID} "{Prefix} {Feature} Tests"
{
    Subtype = Test;

    [Test]
    procedure {ScenarioName}()
    // Given: {Initial state}
    // When: {Action performed}
    // Then: {Expected result}
    var
        {Var}: Record {Table};
    begin
        // Arrange

        // Act

        // Assert
        Assert.{AssertMethod}({Expected}, {Actual}, '{Message}');
    end;
}
```

| Test Name | Given | When | Then |
|-----------|-------|------|------|
| {Scenario1} | {State} | {Action} | {Result} |
| {Scenario2} | {State} | {Action} | {Result} |

---

## 8. Permission Sets

```al
permissionset {ID} "{Prefix} - {Feature}"
{
    Assignable = true;
    Caption = '{Caption}';

    Permissions =
        tabledata "{Table}" = RIMD,
        codeunit "{Codeunit}" = X;
}
```

---

## 9. API Endpoints (if applicable)

Only if this feature exposes or consumes APIs:

```al
page {ID} "{Prefix} {Entity} API"
{
    PageType = API;
    APIPublisher = '{publisher}';
    APIGroup = '{group}';
    APIVersion = 'v2.0';
    EntityName = '{entity}';
    EntitySetName = '{entities}';
    SourceTable = {Table};
    DelayedInsert = true;

    layout
    {
        area(Content)
        {
            repeater(Group)
            {
                field(id; Rec.SystemId) { }
                field({camelCaseField}; Rec."{Field Name}") { }
            }
        }
    }
}
```

---

## 10. AL-Go / CI Considerations

- [ ] New object IDs registered in `app.json` `idRanges`
- [ ] AppSourceCop rules: no hardcoded object IDs in code
- [ ] Build pipeline: no new BC version dependencies introduced
- [ ] Translations: all new Captions added to XLF

---

## 11. Acceptance Criteria

### Functional
- [ ] {User action / business outcome 1}
- [ ] {User action / business outcome 2}

### Technical
- [ ] All AL objects compile without errors
- [ ] Events are properly published and subscribed
- [ ] Permission sets cover all new objects
- [ ] No hardcoded values (use Setup table or constants)

### Quality
- [ ] Unit tests cover all main scenarios (Given/When/Then defined above)
- [ ] Code review passed by @AL Code Review Subagent
- [ ] Translation keys defined for all new Captions

---

## 12. Open Questions

| # | Question | Owner | Status |
|---|---------|-------|--------|
| 1 | {Question requiring human decision} | Human | Open |

---

## Next Steps

**Complexity: ${input:Complexity}**

> **MEDIUM / HIGH:**
>
> ✅ Spec complete. Next:
> 1. Human reviews and approves this spec
> 2. Start TDD orchestration:
>    ```
>    @AL Development Conductor
>    ```
>    Conductor will read this spec + architecture.md and orchestrate planning → implementation → review.

> **LOW:**
>
> ✅ Spec complete. Next:
> 1. Human reviews and approves this spec
> 2. Direct implementation:
>    ```
>    @AL Implementation Specialist
>    ```
>    Developer reads this spec and implements directly (no TDD orchestration needed).
```

---

## Handoff

| Complexity | Handoff to | Purpose |
|-----------|-----------|---------|
| MEDIUM / HIGH | `@AL Development Conductor` | TDD-orchestrated implementation (planning → implementation → review) |
| LOW | `@AL Implementation Specialist` | Direct implementation using this spec as blueprint |

## Success Criteria

- ✅ Spec file created at `.github/plans/${input:req_name}/${input:req_name}.spec.md`
- ✅ Object IDs verified against `app.json` idRanges
- ✅ Architecture document consulted (if exists)
- ✅ All AL signatures are complete (no "TBD" in procedure signatures)
- ✅ Test scenarios defined in Given/When/Then format
- ✅ Handoff section points to correct next agent per complexity
