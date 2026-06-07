# API — Advanced Patterns (Versioning, Webhooks, Error Handling)

> Reference extracted from `skill-api/SKILL.md`. Load only when you need versioning/deprecation, webhooks, or trigger-level error handling.

## Table of contents

- Pattern 5: API Versioning and Deprecation
- Pattern 6: Webhooks (Subscription Notifications)
- Pattern 7: Error Handling in API Triggers

---

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
