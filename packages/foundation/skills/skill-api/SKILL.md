---
name: skill-api
description: "AL API development patterns for Business Central. Use when creating OData/REST API pages, HttpClient integrations, webhook implementations, or any external system integration via API."
---

# Skill: AL API Development

## Purpose

Design and implement RESTful API pages for Business Central: API page v2.0 patterns, OData conventions, versioning, bound/unbound actions, webhooks, header-lines navigation, and performance-optimized endpoints.

## When to Load

This skill should be loaded when:
- A new API page (PageType = API) needs to be designed or implemented
- Existing BC data must be exposed to external consumers (Power Platform, mobile apps, 3rd-party)
- Custom bound or unbound actions are needed on API endpoints
- An API versioning strategy or deprecation plan is required
- Webhook subscriptions need to be configured for change notifications
- API performance or filtering needs optimization

## Core Patterns

### Pattern 1: API Page v2.0 (Standard CRUD Endpoint)

```al
page 50100 "Contoso Sales Orders API"
{
    APIVersion = 'v2.0';
    APIPublisher = 'contoso';
    APIGroup = 'sales';

    EntityCaption = 'Sales Order';
    EntitySetCaption = 'Sales Orders';
    EntityName = 'salesOrder';               // singular — used in URL for single entity
    EntitySetName = 'salesOrders';           // plural — used in URL for collection

    PageType = API;
    SourceTable = "Sales Header";
    SourceTableView = where("Document Type" = const(Order));
    DelayedInsert = true;                    // required — defers insert until all fields set
    ODataKeyFields = SystemId;               // required — use SystemId for stable GUIDs

    layout
    {
        area(Content)
        {
            repeater(Group)
            {
                field(id; Rec.SystemId)
                {
                    Caption = 'Id';
                    Editable = false;
                }
                field(number; Rec."No.")
                {
                    Caption = 'Number';
                    Editable = false;
                }
                field(orderDate; Rec."Order Date")
                {
                    Caption = 'Order Date';
                }
                field(customerNumber; Rec."Sell-to Customer No.")
                {
                    Caption = 'Customer Number';
                }
                field(customerName; Rec."Sell-to Customer Name")
                {
                    Caption = 'Customer Name';
                    Editable = false;
                }
                field(totalAmountIncludingVAT; Rec."Amount Including VAT")
                {
                    Caption = 'Total Amount Including VAT';
                    Editable = false;
                }
                field(status; Rec.Status)
                {
                    Caption = 'Status';
                    Editable = false;
                }
                field(lastModifiedDateTime; Rec.SystemModifiedAt)
                {
                    Caption = 'Last Modified Date Time';
                    Editable = false;
                }
            }
        }
    }
}
```

**Resulting endpoint:**
```
GET  /api/contoso/sales/v2.0/companies({companyId})/salesOrders
GET  /api/contoso/sales/v2.0/companies({companyId})/salesOrders({id})
POST /api/contoso/sales/v2.0/companies({companyId})/salesOrders
PATCH /api/contoso/sales/v2.0/companies({companyId})/salesOrders({id})
DELETE /api/contoso/sales/v2.0/companies({companyId})/salesOrders({id})
```

**Property rules:**
- `ODataKeyFields = SystemId` — always use `SystemId` for stable, immutable keys
- `DelayedInsert = true` — mandatory on API pages (lets BC set defaults before committing)
- `SourceTableView` — pre-filter the source if the table serves multiple document types
- Field names use **camelCase** (OData convention): `customerNumber`, not `Customer_Number`
- `Editable = false` on computed/system fields to prevent consumer confusion

### Pattern 2: Header-Lines with Navigation Property

Expose parent-child relationships via `part` subpages:

```al
// Add inside the header API page's repeater:
part(salesOrderLines; "Contoso Sales Order Lines API")
{
    Caption = 'Lines';
    EntityName = 'salesOrderLine';
    EntitySetName = 'salesOrderLines';
    SubPageLink = "Document Type" = field("Document Type"),
                  "Document No." = field("No.");
}
```

```al
// Lines API page (subpage)
page 50101 "Contoso Sales Order Lines API"
{
    APIVersion = 'v2.0';
    APIPublisher = 'contoso';
    APIGroup = 'sales';

    EntityCaption = 'Sales Order Line';
    EntitySetCaption = 'Sales Order Lines';
    EntityName = 'salesOrderLine';
    EntitySetName = 'salesOrderLines';

    PageType = API;
    SourceTable = "Sales Line";
    DelayedInsert = true;
    ODataKeyFields = SystemId;

    layout
    {
        area(Content)
        {
            repeater(Group)
            {
                field(id; Rec.SystemId) { Editable = false; }
                field(lineNumber; Rec."Line No.") { Editable = false; }
                field(lineType; Rec.Type) { Caption = 'Type'; }
                field(itemNumber; Rec."No.") { Caption = 'Item Number'; }
                field(description; Rec.Description) { Caption = 'Description'; }
                field(quantity; Rec.Quantity) { Caption = 'Quantity'; }
                field(unitPrice; Rec."Unit Price") { Caption = 'Unit Price'; }
                field(lineAmount; Rec."Line Amount") { Caption = 'Line Amount'; Editable = false; }
            }
        }
    }
}
```

**Consumer usage:**
```http
# Get order with lines expanded
GET /salesOrders({id})?$expand=salesOrderLines

# Get lines for a specific order
GET /salesOrders({id})/salesOrderLines

# Add a line to an order
POST /salesOrders({id})/salesOrderLines
{ "lineType": "Item", "itemNumber": "ITEM-001", "quantity": 10 }
```

### Pattern 3: Bound Actions (Operate on Entity)

Bound actions trigger business logic on a specific entity:

```al
// Inside the API page's actions area:
actions
{
    area(Processing)
    {
        // POST /salesOrders({id})/Microsoft.NAV.post
        action(post)
        {
            ApplicationArea = All;
            Caption = 'Post';

            trigger OnAction()
            var
                SalesPost: Codeunit "Sales-Post";
            begin
                Rec.TestField(Status, Rec.Status::Released);
                SalesPost.Run(Rec);
            end;
        }

        // POST /salesOrders({id})/Microsoft.NAV.release
        action(release)
        {
            ApplicationArea = All;
            Caption = 'Release';

            trigger OnAction()
            var
                ReleaseSalesDoc: Codeunit "Release Sales Document";
            begin
                ReleaseSalesDoc.PerformManualRelease(Rec);
            end;
        }

        // POST /salesOrders({id})/Microsoft.NAV.reopen
        action(reopen)
        {
            ApplicationArea = All;
            Caption = 'Reopen';

            trigger OnAction()
            var
                ReleaseSalesDoc: Codeunit "Release Sales Document";
            begin
                ReleaseSalesDoc.PerformManualReopen(Rec);
            end;
        }
    }
}
```

**Consumer call:**
```http
POST /salesOrders({id})/Microsoft.NAV.post
Content-Type: application/json
```

### Pattern 4: Unbound Actions (Standalone Operations)

Unbound actions are not tied to a specific entity — use a virtual/dummy source table:

```al
page 50102 "Contoso Utility API"
{
    APIVersion = 'v2.0';
    APIPublisher = 'contoso';
    APIGroup = 'utilities';

    EntityName = 'utilityFunction';
    EntitySetName = 'utilityFunctions';

    PageType = API;
    SourceTable = "Company Information";    // read-only singleton as base
    SourceTableTemporary = true;
    InsertAllowed = false;
    ModifyAllowed = false;
    DeleteAllowed = false;

    layout
    {
        area(Content)
        {
            repeater(Group)
            {
                field(companyName; Rec.Name) { Editable = false; }
            }
        }
    }
    actions
    {
        area(Processing)
        {
            // POST /utilityFunctions/Microsoft.NAV.calculateShipping
            action(calculateShipping)
            {
                ApplicationArea = All;
                Caption = 'Calculate Shipping';

                trigger OnAction()
                var
                    ShippingMgt: Codeunit "Contoso Shipping Management";
                    Weight: Decimal;
                    DestCode: Code[20];
                begin
                    Evaluate(Weight, GetActionContext().GetText('weight'));
                    DestCode := CopyStr(GetActionContext().GetText('destinationCode'), 1, 20);
                    SetActionResponse(CreateJsonResponse(
                        ShippingMgt.CalculateCost(Weight, DestCode)));
                end;
            }
        }
    }
}
```

### Pattern 5: API Versioning and Deprecation

Maintain backward compatibility while evolving the API:

```al
// v1.0 — deprecated, keep running for existing consumers
page 50100 "Contoso Sales Orders API v1"
{
    APIVersion = 'v1.0';
    APIPublisher = 'contoso';
    APIGroup = 'sales';
    EntityName = 'salesOrder';
    EntitySetName = 'salesOrders';
    PageType = API;
    SourceTable = "Sales Header";
    ObsoleteState = Pending;
    ObsoleteReason = 'Use v2.0. Will be removed in 2027.';
    // ... limited field set from original v1 design ...
}

// v2.0 — current stable version
page 50110 "Contoso Sales Orders API"
{
    APIVersion = 'v2.0';
    APIPublisher = 'contoso';
    APIGroup = 'sales';
    EntityName = 'salesOrder';
    EntitySetName = 'salesOrders';
    PageType = API;
    SourceTable = "Sales Header";
    // ... full field set, navigation properties, actions ...
}

// beta — preview of next breaking change
page 50120 "Contoso Sales Orders API v3"
{
    APIVersion = 'beta';
    APIPublisher = 'contoso';
    APIGroup = 'sales';
    EntityName = 'salesOrder';
    EntitySetName = 'salesOrders';
    PageType = API;
    SourceTable = "Sales Header";
    // ... new structure, breaking changes ...
}
```

**Versioning rules:**
- Same `EntityName`/`EntitySetName` across versions — only `APIVersion` and page ID differ
- Mark deprecated versions with `ObsoleteState = Pending` + `ObsoleteReason`
- Use `beta` version for preview of breaking changes before promoting to stable
- Never break an existing stable version — add new fields, don't rename or remove

### Pattern 6: Webhooks (Subscription Notifications)

BC supports webhook subscriptions for entity change notifications:

```http
# Register a webhook subscription
POST /api/v2.0/subscriptions
Content-Type: application/json

{
    "resource": "companies({companyId})/salesOrders",
    "notificationUrl": "https://yourapp.com/webhook/bc-sales-orders",
    "clientState": "your-secret-state-token"
}
```

BC sends POST to `notificationUrl` when `salesOrders` are created, modified, or deleted:
```json
{
    "value": [
        {
            "subscriptionId": "...",
            "clientState": "your-secret-state-token",
            "changeType": "updated",
            "resource": "companies({companyId})/salesOrders({id})"
        }
    ]
}
```

**Webhook design considerations:**
- `notificationUrl` must be HTTPS and publicly accessible
- BC sends a validation request on subscription creation (return 200 with the same body)
- Subscriptions expire after 3 days — implement renewal logic in the consumer
- Use `clientState` to validate incoming notifications are from BC
- Webhooks provide notification only — consumer must call the API to get the actual data
- Use `$filter` on subscription `resource` to limit scope: `salesOrders?$filter=status eq 'Released'`

### Pattern 7: Error Handling in API Triggers

Validate data and return meaningful error messages:

```al
trigger OnInsertRecord(BelowxRec: Boolean): Boolean
begin
    if Rec."Sell-to Customer No." = '' then
        Error('Field "customerNumber" is required.');

    ValidateCustomerIsActive(Rec."Sell-to Customer No.");
    exit(true);
end;

trigger OnModifyRecord(): Boolean
begin
    if Rec.Status = Rec.Status::Released then
        Error('Cannot modify a released order. Call .../Microsoft.NAV.reopen first.');
    exit(true);
end;

trigger OnDeleteRecord(): Boolean
begin
    Rec.TestField(Status, Rec.Status::Open);
    if HasPostedDocuments(Rec) then
        Error('Cannot delete order %1: posted documents exist.', Rec."No.");
    exit(true);
end;

local procedure ValidateCustomerIsActive(CustomerNo: Code[20])
var
    Customer: Record Customer;
begin
    if not Customer.Get(CustomerNo) then
        Error('Customer %1 does not exist.', CustomerNo);
    if Customer.Blocked <> Customer.Blocked::" " then
        Error('Customer %1 is blocked.', CustomerNo);
end;
```

## Workflow

### Step 1: Design API Contract

Before implementing, define:
1. **Resource model** — entities, relationships, navigation properties
2. **Operations** — which HTTP methods per resource (GET/POST/PATCH/DELETE)
3. **Actions** — custom operations (bound: per entity, unbound: global)
4. **Filtering** — which fields consumers can `$filter` on (add corresponding keys)
5. **Versioning** — initial version and deprecation plan
6. **Authentication** — OAuth 2.0 scope, permission sets needed

Document in `.github/plans/{req_name}.architecture.md` or a dedicated API design section.
**PAUSE — wait for user approval before implementing.**

### Step 2: Implement API Pages

1. Create header API page (Pattern 1)
2. Create subpage(s) for lines/children (Pattern 2)
3. Add bound actions for entity operations (Pattern 3)
4. Add unbound actions if needed (Pattern 4)
5. Add error handling triggers (Pattern 7)
6. Build: `al_build`

### Step 3: Optimize for Performance

Add keys for filterable fields:
```al
tableextension 50100 "Contoso Sales Header Ext" extends "Sales Header"
{
    keys
    {
        key(APICustomerDate; "Sell-to Customer No.", "Order Date") { }
        key(APIStatus; Status, "Order Date") { }
    }
}
```

Key OData query patterns:

- **Projection**: `?$select=number,customerNumber` — reduces payload
- **Filtering**: `?$filter=customerNumber eq 'C00001' and orderDate ge 2025-01-01` — server-side
- **Expansion**: `?$expand=salesOrderLines` — inline children
- **Delta links**: initial GET returns `@odata.deltaLink`; subsequent call with `$deltatoken` returns only changes
- **Pagination**: `?$top=50&$skip=100`

### Step 4: Generate Permission Sets

Create role-based permission sets (full access + read-only) for the API pages. Follow `skill-permissions.md` for the hierarchy pattern. Minimum: one set granting `X` on all API pages + `RIMD` on table data, one read-only set with `R` only.

### Step 5: Test

- Test CRUD operations (create, read, update, delete)
- Test bound actions (post, release, reopen)
- Test `$filter`, `$select`, `$expand` query options
- Test error responses (missing required fields, blocked customer, invalid state)
- Test permission sets (read-only user cannot POST/PATCH/DELETE)
- Test `If-Match` / ETag for optimistic concurrency on PATCH and DELETE

## References

- [API Page Type — Microsoft Docs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-api-pagetype)
- [API v2.0 Standard Endpoints](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/)
- [OData Query Parameters](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-connect-apps-filtering)
- [Custom APIs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-develop-custom-api)
- [Webhook Subscriptions](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/dynamics-subscriptions)
- [API Performance](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/performance/performance-developer#writing-efficient-api-pages)

## Constraints

- This skill covers **API page design, implementation patterns, and OData conventions**
- Do NOT modify base BC objects — create API pages as extensions only
- Do NOT expose internal implementation details (codeunit internals, temp tables) in API responses
- Do NOT skip `APIVersion` — every API page MUST have an explicit version
- Do NOT create breaking changes on stable versions — use `beta` for previewing changes, then promote
- Do NOT skip error handling — `OnInsertRecord`, `OnModifyRecord`, `OnDeleteRecord` must validate
- Permission set hierarchy → `skill-permissions.md` | Performance deep-dive → `skill-performance.md` | API testing → `skill-testing.md`
