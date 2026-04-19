# :material-speedometer: AL Performance

<div class="agent-card" markdown>

| | |
|---|---|
| **File** | `al-performance.instructions.md` |
| **Applies to** | `**/*.al` |
| **Activation** | Always active |
| **Role** | Optimization patterns |

</div>

---

## Purpose

Performance optimization guidelines for writing scalable AL code. Focuses on data retrieval efficiency, query optimization, and resource-conscious patterns.

## Key rules

| Rule | What it does |
|---|---|
| **Early filtering** | Apply `SetRange`/`SetFilter` before `FindSet`, never filter in-loop |
| **SetLoadFields** | Load only needed fields; place *before* Get/Find operations |
| **Temporary tables** | Use for intermediate processing to avoid database round-trips |
| **Set-based operations** | Prefer `ModifyAll`, `DeleteAll` over record-by-record loops |
| **Avoid unnecessary loops** | Use `Count`, `IsEmpty` instead of iterating |

## Pattern: Early filtering

```al
// Good — filter before processing
Customer.SetRange(City, CityFilter);
Customer.SetRange(Blocked, Customer.Blocked::" ");
if Customer.FindSet() then
  repeat
    // Process only matching records
  until Customer.Next() = 0;
```

## Pattern: SetLoadFields

```al
// Good — load only needed fields
Item.SetRange("Third Party Item Exists", false);
Item.SetLoadFields("Item Category Code");
Item.FindFirst();
```

!!! warning "Avoid"
    Filtering inside loops, loading all fields when only one is needed, or using `SetLoadFields` after the Find operation.

---

<small>Source: [`instructions/al-performance.instructions.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/instructions/al-performance.instructions.md)</small>