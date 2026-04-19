# :material-connection: AL Events

<div class="agent-card" markdown>

| | |
|---|---|
| **File** | `al-events.instructions.md` |
| **Applies to** | `**/*.al` |
| **Activation** | Context-activated (event code) |
| **Role** | Event-driven patterns |

</div>

---

## Purpose

Event-driven architecture patterns for extensible Business Central applications. Covers EventSubscribers, IntegrationEvents, BusinessEvents, and the publisher/subscriber model.

## Key rules

| Rule | What it enforces |
|---|---|
| **EventSubscriber** | Subscribe to BC events (`OnBeforeInsert`, `OnAfterModify`, etc.) |
| **Handler suffix** | Subscriber codeunits end with `Handler` |
| **IntegrationEvent** | Create extensibility points in your own code |
| **Handled pattern** | Use `IsHandled: Boolean` parameter for overridable logic |
| **No direct modification** | Never modify base objects — always use events |

## Pattern: EventSubscriber

```al
codeunit 50100 "Sales Document Events Handler"
{
  [EventSubscriber(ObjectType::Table,
    Database::"Sales Header",
    OnBeforeInsert, '', false, false)]
  local procedure OnBeforeInsertSalesHeader(
    var SalesHeader: Record "Sales Header";
    RunTrigger: Boolean)
  begin
    ValidateCustomFields(SalesHeader);
  end;
}
```

## Pattern: IntegrationEvent with Handled

```al
procedure CreateCustomer(
  var Customer: Record Customer): Boolean
var
  IsHandled: Boolean;
begin
  OnBeforeCreateCustomer(Customer, IsHandled);
  if IsHandled then
    exit(true);
  Customer.Insert(true);
  OnAfterCreateCustomer(Customer);
  exit(true);
end;

[IntegrationEvent(false, false)]
procedure OnBeforeCreateCustomer(
  var Customer: Record Customer;
  var IsHandled: Boolean)
begin
end;
```

---

<small>Source: [`instructions/al-events.instructions.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/instructions/al-events.instructions.md)</small>