# :material-format-paint: AL Code Style

<div class="agent-card" markdown>

| | |
|---|---|
| **File** | `al-code-style.instructions.md` |
| **Applies to** | `**/*.al` |
| **Activation** | Always active |
| **Role** | Formatting & structure |

</div>

---

## Purpose

Ensures consistent code structure and organization across AL projects. Covers indentation, formatting, folder layout, and documentation patterns.

## Key rules

| Rule | Description |
|---|---|
| **Consistent indentation** | 2-space indentation throughout the project |
| **Feature-based folders** | `src/feature/subfeature/` structure, shared components in `Common/` |
| **Code documentation** | Meaningful comments at procedure and business logic level |
| **PascalCase** | For all variable names, function names, and object names |

## Folder structure example

```
src/
├── NoSeries/
│   ├── NoSeries.Table.al
│   ├── NoSeries.Page.al
│   └── NoSeriesSetup.Codeunit.al
├── Sales/
│   ├── Invoice/
│   │   └── SalesInvoice.Page.al
│   └── Order/
│       └── SalesOrder.Page.al
└── Common/
    └── Helpers/
        └── DateHelper.Codeunit.al
```

!!! warning "Avoid"
    Organizing by object type (`Tables/`, `Pages/`, `Codeunits/`) — use feature-based structure instead.

---

<small>Source: [`instructions/al-code-style.instructions.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/instructions/al-code-style.instructions.md)</small>