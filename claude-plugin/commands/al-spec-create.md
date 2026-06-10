---
description: >
  Create a detailed technical specification (.spec.md) that serves as an implementable
  blueprint for Business Central features. Use when you need to create a spec, write
  a specification, or detail a requirement. Reads architecture.md if exists.
  Outputs to .github/plans/{req_name}/.
allowed-tools: Read, Grep, Glob, Write, Edit, Bash, WebSearch
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
- Existing objects with similar patterns (`Grep`/`Glob`; **al-symbols-mcp** `al_search_objects` for symbol-level)
- Naming conventions in `/src`
- Available object ID ranges in `app.json`
- Existing event publishers relevant to this feature
- Existing API pages or codeunits if integration is involved

> **Verify every base-app event you subscribe to against symbols — this is the spec's job, not the planner's.** For each event the feature hooks into, confirm it **exists** in the current BC version via **al-symbols-mcp** (`al_search_object_members` / `al_get_object_definition`; download symbols first if absent). Record the **verified** publisher object + exact event name in §5. If you cannot confirm an event exists, it does **not** enter the spec as fact — move it to §12 Open Questions. (A wrong or nonexistent event name passed downstream silently becomes a blind search burst in planning and a defect the reviewer must catch. Verify it once, here, at the cheapest point.)

### 1.4 Ground the spec in the framework (token-light)

This spec is the blueprint `aldc:al-conductor` and `aldc:al-developer` implement from — it must be a **reliable guide**, not proposed from memory. Ground it without bloating this (cheap) primitive:

- **Instructions (always) — reference, don't recite.** The hard micro-rules under `rules-templates/` / the project's `.claude/rules/al-*` (naming ≤26 PascalCase, `DataClassification` on every field, extension-only, the performance/error-handling safety-net) govern every object you propose. They are tiny — honor them, and cite the governing one where a section depends on it.
- **Skills (on demand — one per domain the spec actually designs).** `Read` the `SKILL.md` for a domain **only when the spec covers it**: §5 events → `skill-events`; §6 pages → `skill-pages`; §8 permissions → `skill-permissions`; §9 API → `skill-api`; AI/Copilot → `skill-copilot`; performance-critical logic → `skill-performance`; §7 tests → `skill-testing`. Do **not** load skills for domains the spec doesn't touch; for **LOW** complexity keep it minimal.

This keeps the median cost low (most specs touch 1–2 domains) while making the spec a framework-grounded guide instead of a from-memory proposal.

---
---

## Step 2 — Generate Specification

Create `.github/plans/${input:req_name}/${input:req_name}.spec.md` with the following structure:

---
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

> **Verify each base-app event EXISTS — the spec is the source of truth for *which* events, symbols own the *signature*.** Before listing a subscriber, confirm the publisher+event exists with **al-symbols-mcp** (`al_search_objects` → the publisher object, `al_search_object_members` → the event). Record the **verified** publisher object, event name, and the **fields the handler consumes** in the table below — **not** the full parameter list (symbols own that; it drifts on version upgrade, so duplicating it here rots the spec). If an event you expected does **not** resolve, do not invent it: record it as an **Open Question** (§12) rather than guessing a name. `microsoft-docs`/`context7`/web stay fair game for *conceptual* "is there an event around X?" gaps — but the existence/identity check is symbols-first.

| Verified publisher (object) | Event name | Consumed fields | Purpose |
|-----------------------------|-----------|-----------------|---------|
| Codeunit "{Publisher}" | {EventName} | {Rec fields the handler reads/writes} | {why this subscription} |

---
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
---

## 10. AL-Go / CI Considerations

- [ ] New object IDs registered in `app.json` `idRanges`
- [ ] AppSourceCop rules: no hardcoded object IDs in code
- [ ] Build pipeline: no new BC version dependencies introduced
- [ ] Translations: all new Captions added to XLF

---
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
- [ ] Code review passed by @al-review-subagent
- [ ] Translation keys defined for all new Captions

---
---

## 12. Open Questions

| # | Question | Owner | Status |
|---|---------|-------|--------|
| 1 | {Question requiring human decision} | Human | Open |

---
---

## Next Steps

**Complexity: ${input:Complexity}**

> **MEDIUM / HIGH:**
>
> ✅ Spec complete. Next:
> 1. Human reviews and approves this spec
> 2. Start TDD orchestration:
>    ```
>    agent `al-conductor`
>    ```
>    Conductor will read this spec + architecture.md and orchestrate planning → implementation → review.

> **LOW:**
>
> ✅ Spec complete. Next:
> 1. Human reviews and approves this spec
> 2. Direct implementation:
>    ```
>    agent `al-developer`
>    ```
>    Developer reads this spec and implements directly (no TDD orchestration needed).
```

---
---

## Handoff

| Complexity | Handoff to | Purpose |
|-----------|-----------|---------|
| MEDIUM / HIGH | `agent al-conductor` | TDD-orchestrated implementation (planning → implementation → review) |
| LOW | `agent al-developer` | Direct implementation using this spec as blueprint |

## Success Criteria

- ✅ Spec file created at `.github/plans/${input:req_name}/${input:req_name}.spec.md`
- ✅ Object IDs verified against `app.json` idRanges
- ✅ Architecture document consulted (if exists)
- ✅ The feature's **own** procedure signatures are complete (no "TBD"); base-app event targets recorded as **verified publisher + event name + consumed fields** (exact param list resolved from symbols at code time, not transcribed)
- ✅ Every subscribed base-app event was symbol-verified to exist (unverifiable ones moved to Open Questions)
- ✅ Test scenarios defined in Given/When/Then format
- ✅ Handoff section points to correct next agent per complexity
