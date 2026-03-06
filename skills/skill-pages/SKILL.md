---
name: skill-pages
description: "AL page design patterns for Business Central. Use when creating Card, List, ListPart, Document pages, implementing page extensions, or designing UX layouts."
---

# Skill: AL Page Design

## Purpose

Design and customize Business Central pages: Card, List, Document, Worksheet, and RoleCenter page types, page extensions with `addafter`/`addbefore`/`modify`, dynamic UI (visibility, styling), FastTab layout, promoted actions, and FactBoxes.

## When to Load

This skill should be loaded when:
- Creating a new page (any type) for a custom or extended table
- Extending a standard BC page with custom fields, groups, or actions
- Designing a Document page with header-lines structure
- Implementing dynamic visibility, conditional styling, or field importance
- Optimizing page performance (FlowField limits, lazy loading)

## Core Patterns

### Pattern 1: Card Page

Single-record display with FastTab groups:

```al
page 50100 "Contoso Project Card"
{
    PageType = Card;
    SourceTable = "Contoso Project";
    Caption = 'Project Card';
    UsageCategory = None;          // accessed from list, not search

    layout
    {
        area(Content)
        {
            group(General)
            {
                Caption = 'General';
                field("No."; Rec."No.")
                {
                    ApplicationArea = All;
                    Importance = Promoted;      // visible in collapsed FastTab
                }
                field(Description; Rec.Description)
                {
                    ApplicationArea = All;
                    Importance = Promoted;
                }
                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                    StyleExpr = StatusStyleExpr;
                }
                field("Starting Date"; Rec."Starting Date")
                {
                    ApplicationArea = All;
                }
            }
            group(Details)
            {
                Caption = 'Details';
                Visible = DetailsVisible;       // dynamic visibility

                field("Project Manager"; Rec."Project Manager")
                {
                    ApplicationArea = All;
                }
                field(Budget; Rec.Budget)
                {
                    ApplicationArea = All;
                }
            }
        }
        area(FactBoxes)
        {
            systempart(Notes; Notes) { ApplicationArea = All; }
            systempart(Links; Links) { ApplicationArea = All; }
        }
    }

    actions
    {
        area(Processing)
        {
            action(Release)
            {
                ApplicationArea = All;
                Caption = 'Release';
                Image = ReleaseDoc;
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;

                trigger OnAction()
                begin
                    Rec.TestField(Status, Rec.Status::Open);
                    Rec.Validate(Status, Rec.Status::Released);
                    Rec.Modify(true);
                end;
            }
        }
        area(Navigation)
        {
            action(Entries)
            {
                ApplicationArea = All;
                Caption = 'Ledger Entries';
                Image = LedgerEntries;
                RunObject = page "Contoso Project Entries";
                RunPageLink = "Project No." = field("No.");
            }
        }
    }

    var
        StatusStyleExpr: Text;
        DetailsVisible: Boolean;

    trigger OnAfterGetRecord()
    begin
        StatusStyleExpr := GetStatusStyle();
        DetailsVisible := Rec.Status <> Rec.Status::Open;
    end;

    local procedure GetStatusStyle(): Text
    begin
        case Rec.Status of
            Rec.Status::Open:
                exit('Standard');
            Rec.Status::Released:
                exit('Favorable');
            Rec.Status::Closed:
                exit('Subordinate');
        end;
    end;
}
```

### Pattern 2: List Page

Multi-record display with filters and navigation:

```al
page 50101 "Contoso Project List"
{
    PageType = List;
    SourceTable = "Contoso Project";
    Caption = 'Projects';
    UsageCategory = Lists;
    ApplicationArea = All;
    CardPageId = "Contoso Project Card";
    Editable = false;

    layout
    {
        area(Content)
        {
            repeater(Group)
            {
                field("No."; Rec."No.") { ApplicationArea = All; }
                field(Description; Rec.Description) { ApplicationArea = All; }
                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                    StyleExpr = StatusStyleExpr;
                }
                field("Starting Date"; Rec."Starting Date") { ApplicationArea = All; }
                // Limit FlowFields on list pages — max 3-4 for performance
                field("Total Budget"; Rec."Total Budget") { ApplicationArea = All; }
            }
        }
    }

    var
        StatusStyleExpr: Text;

    trigger OnAfterGetRecord()
    begin
        StatusStyleExpr := GetStatusStyle();
    end;
}
```

**List page rules:**
- Set `Editable = false` — use Card for editing
- Set `CardPageId` for drill-down navigation
- Limit FlowFields to 3-4 maximum (each triggers a query per row)
- Use `UsageCategory = Lists` for search/Tell Me discoverability

### Pattern 3: Document Page (Header + Lines)

```al
page 50102 "Contoso Sales Document"
{
    PageType = Document;
    SourceTable = "Contoso Document Header";
    Caption = 'Sales Document';

    layout
    {
        area(Content)
        {
            group(General)
            {
                Caption = 'General';
                field("No."; Rec."No.") { ApplicationArea = All; }
                field("Customer No."; Rec."Customer No.")
                {
                    ApplicationArea = All;
                    Importance = Promoted;

                    trigger OnValidate()
                    begin
                        CurrPage.Update();      // refresh lines after customer change
                    end;
                }
                field("Document Date"; Rec."Document Date") { ApplicationArea = All; }
            }
            part(Lines; "Contoso Document Subpage")
            {
                ApplicationArea = All;
                SubPageLink = "Document No." = field("No.");
                UpdatePropagation = Both;       // sync header ↔ lines
            }
        }
    }
}
```

```al
// Lines subpage
page 50103 "Contoso Document Subpage"
{
    PageType = ListPart;
    SourceTable = "Contoso Document Line";
    Caption = 'Lines';
    AutoSplitKey = true;            // auto-increment Line No.

    layout
    {
        area(Content)
        {
            repeater(Lines)
            {
                field(Type; Rec.Type) { ApplicationArea = All; }
                field("No."; Rec."No.") { ApplicationArea = All; }
                field(Description; Rec.Description) { ApplicationArea = All; }
                field(Quantity; Rec.Quantity) { ApplicationArea = All; }
                field("Unit Price"; Rec."Unit Price") { ApplicationArea = All; }
                field("Line Amount"; Rec."Line Amount")
                {
                    ApplicationArea = All;
                    Editable = false;
                }
            }
        }
    }
}
```

### Pattern 4: Page Extension

Extend standard BC pages without modifying them:

```al
pageextension 50100 "Customer Card Ext" extends "Customer Card"
{
    layout
    {
        addafter(General)
        {
            group(ContosoInfo)
            {
                Caption = 'Contoso Information';

                field("Contoso Loyalty Points"; Rec."Contoso Loyalty Points")
                {
                    ApplicationArea = All;
                    ToolTip = 'Total loyalty points for this customer.';
                }
            }
        }
        modify(Name)
        {
            // Change properties of existing fields
            StyleExpr = NameStyleExpr;
        }
        moveafter("Post Code"; City)        // reorder fields
    }

    actions
    {
        addlast(Processing)
        {
            action(ContosoCalculatePoints)
            {
                ApplicationArea = All;
                Caption = 'Recalculate Points';
                Image = Calculate;
                Promoted = true;
                PromotedCategory = Process;

                trigger OnAction()
                var
                    LoyaltyMgt: Codeunit "Contoso Loyalty Management";
                begin
                    LoyaltyMgt.RecalculatePoints(Rec."No.");
                    CurrPage.Update(false);
                end;
            }
        }
    }

    var
        NameStyleExpr: Text;

    trigger OnAfterGetRecord()
    begin
        NameStyleExpr := GetNameStyle();
    end;
}
```

**Extension placement keywords:**
- `addafter(AnchorField)` / `addbefore(AnchorField)` — position relative to existing field
- `addlast(GroupName)` / `addfirst(GroupName)` — at end/start of group
- `modify(FieldName)` — change properties of existing field
- `moveafter(Target; FieldToMove)` / `movebefore(Target; FieldToMove)` — reorder

### Pattern 5: Field Importance and Promoted Actions

Control visibility and prominence:

```al
// Field importance — controls FastTab collapsed behavior
field(CriticalField; Rec.CriticalField)
{
    ApplicationArea = All;
    Importance = Promoted;         // always visible (even when FastTab collapsed)
}
field(StandardField; Rec.StandardField)
{
    ApplicationArea = All;
    Importance = Standard;         // visible when FastTab expanded (default)
}
field(RareField; Rec.RareField)
{
    ApplicationArea = All;
    Importance = Additional;       // hidden unless "Show more" clicked
}
```

```al
// Promoted actions — modern actionref syntax (BC 22+)
actions
{
    area(Processing)
    {
        action(Post) { Caption = 'Post'; Image = Post; }
        action(Release) { Caption = 'Release'; Image = ReleaseDoc; }
    }
    area(Promoted)
    {
        group(Category_Process)
        {
            Caption = 'Process';
            actionref(Post_Promoted; Post) { }
            actionref(Release_Promoted; Release) { }
        }
    }
}
```

## Workflow

### Step 1: Determine Page Type

| Need | PageType | Key Properties |
|---|---|---|
| Single record editing | `Card` | `UsageCategory = None`, has Card groups |
| Multi-record browsing | `List` | `CardPageId`, `Editable = false`, FlowField limits |
| Header + lines editing | `Document` | `part()` with ListPart subpage, `UpdatePropagation` |
| Batch data entry | `Worksheet` | Editable repeater, no Card drill-down |
| Dashboard/home page | `RoleCenter` | `part()` with cues, activities, headlines |
| Embed in another page | `ListPart`/`CardPart` | Used inside `part()` only |

### Step 2: Design Layout

1. Group related fields into FastTabs (`group()`)
2. Set `Importance` — Promoted for key fields, Additional for rare ones
3. Add FactBoxes (`area(FactBoxes)`) for contextual info
4. Add Notes and Links system parts
5. For Document pages, create the ListPart subpage with `AutoSplitKey`

### Step 3: Add Actions and Navigation

1. Define actions in `area(Processing)` and `area(Navigation)`
2. Promote key actions using `area(Promoted)` with `actionref` (BC 22+)
3. Set appropriate `Image` identifiers
4. Add `RunObject` / `RunPageLink` for navigation actions

### Step 4: Implement Dynamic UI

1. `Visible` / `Editable` expressions — control field/group visibility based on state
2. `StyleExpr` — conditional formatting (Favorable, Unfavorable, Attention, Subordinate, Strong)
3. `Enabled` — disable actions based on record state
4. Update expressions in `OnAfterGetRecord` trigger

### Step 5: Build and Test

1. Build: `al_build`
2. Publish: `al_incremental_publish`
3. Verify layout, navigation, and field behavior
4. Test dynamic visibility and styling with different record states

## References

- [Page Types — Microsoft Docs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-page-types-and-layouts)
- [Page Extension Object](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-page-ext-object)
- [Actions Overview](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-actions-overview)
- [Promoted Actions (actionref)](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-promoted-actions)
- [Field Importance](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/properties/devenv-importance-property)
- [Styling with StyleExpr](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/properties/devenv-styleexpr-property)

## Constraints

- This skill covers **page design, layout, extensions, and dynamic UI patterns**
- Do NOT modify standard BC pages directly — use `pageextension` objects only
- Do NOT place more than 3-4 FlowFields on List pages (performance impact)
- Do NOT skip `ApplicationArea` on any field or action
- API page design → `skill-api.md` | Performance (FlowFields, SetLoadFields) → `skill-performance.md` | Page testing → `skill-testing.md`
