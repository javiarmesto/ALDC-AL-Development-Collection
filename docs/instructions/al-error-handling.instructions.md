# :material-alert-circle-outline: AL Error Handling

<div class="agent-card" markdown>

| | |
|---|---|
| **File** | `al-error-handling.instructions.md` |
| **Applies to** | `**/*.al` |
| **Activation** | Context-activated (error handling code) |
| **Role** | Error patterns & telemetry |

</div>

---

## Purpose

Robust error handling patterns for reliable Business Central applications. Covers TryFunctions, error labels, telemetry logging, and structured exception management.

## Key rules

| Rule | What it enforces |
|---|---|
| **TryFunctions** | Wrap risky operations (external calls, data ops) in `[TryFunction]` procedures |
| **Error labels** | All messages via `Label` variables, never hardcoded strings |
| **Locked labels** | Technical/telemetry messages use `Locked = true` |
| **Comment parameter** | Every label with `%1`, `%2` includes `Comment` for translators |
| **Telemetry** | Log errors with `LogError()` for post-mortem analysis |

## Pattern: TryFunction with labels

```al
procedure ProcessPayment(Amount: Decimal): Boolean
var
  PaymentFailedLbl: Label 'Payment processing failed: %1',
    Comment = '%1 = Error message';
  PaymentFailedTelemetryLbl: Label 'Payment processing failed',
    Locked = true;
begin
  if not TryProcessPaymentInternal(Amount) then begin
    LogError(PaymentFailedTelemetryLbl, GetLastErrorText());
    Message(PaymentFailedLbl, GetLastErrorText());
    exit(false);
  end;
  exit(true);
end;

[TryFunction]
local procedure TryProcessPaymentInternal(Amount: Decimal)
begin
  PaymentService.ProcessPayment(Amount);
end;
```

!!! warning "Avoid"
    Hardcoded error strings, unhandled exceptions on external service calls, or missing telemetry on failures.

---

<small>Source: [`instructions/al-error-handling.instructions.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/instructions/al-error-handling.instructions.md)</small>