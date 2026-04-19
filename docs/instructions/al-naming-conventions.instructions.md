# :material-tag-text-outline: AL Naming Conventions

<div class="agent-card" markdown>

| | |
|---|---|
| **File** | `al-naming-conventions.instructions.md` |
| **Applies to** | `**/*.al` |
| **Activation** | Always active |
| **Role** | Naming standards |

</div>

---

## Purpose

Comprehensive naming standards for all AL artifacts — objects, files, variables, and functions. Ensures discoverability, consistency, and proper localization support.

## Key rules

| Rule | Convention | Example |
|---|---|---|
| **Object names** | PascalCase, max 26 chars (+ 4 prefix) | `Customer Ledger Entry` |
| **File names** | `<ObjectName>.<ObjectType>.al` | `SalesInvoice.Page.al` |
| **Variables** | PascalCase, descriptive | `TotalAmount`, `IsValidTransaction` |
| **Functions** | PascalCase, verb-first | `CalculateCustomerBalance` |
| **Test files** | `<Feature>Tests.Codeunit.al` | `SalesPostingTests.Codeunit.al` |
| **Interfaces** | `I` prefix | `INoSeries.Interface.al` |

## Object name limits

| Constraint | Value |
|---|---|
| Max total length | 30 characters |
| Max name portion | 26 characters |
| Reserved for prefix | 3 chars + 1 space |

!!! warning "Avoid"
    Abbreviations like `CustLE`, `SIPoster`, `SalesInv` — use full descriptive names.

---

<small>Source: [`instructions/al-naming-conventions.instructions.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/instructions/al-naming-conventions.instructions.md)</small>