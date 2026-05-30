---
name: skill-performance
description: "AL performance optimization patterns for Business Central. Use when optimizing queries with SetLoadFields, working with FlowFields and CalcFields, profiling codeunits, or resolving performance issues."
---

# Skill: AL Performance Optimization

## Purpose

Identify, analyze, and fix performance bottlenecks in AL code: inefficient queries, FlowField issues, loop anti-patterns, and data-volume problems in Business Central.

## When to Load

This skill should be loaded when:
- A page, report, or batch process is slow or timing out
- CPU profiling is needed to identify hotspots
- A static triage of the codebase is requested for performance issues
- A feature involves large-dataset processing or high-frequency code paths
- AL0896 (circular FlowField) errors appear
- Architecture review requires performance analysis of a new design

## Core Patterns

### Pattern 1: SetLoadFields + Early Filtering

Always filter before finding, and load only needed fields. Order matters.

```al
// ✅ Correct: SetRange first, SetLoadFields before Find
Item.SetRange("Third Party Item Exists", false);
Item.SetLoadFields("Item Category Code", Description);
if Item.FindSet() then
    repeat
        // Only "Item Category Code" and Description loaded from DB
    until Item.Next() = 0;

// ❌ Wrong: SetLoadFields after SetRange (ignored), loads all fields
Item.SetLoadFields("Item Category Code");
Item.SetRange("Third Party Item Exists", false);
Item.FindFirst();

// ❌ Wrong: No filter — full table scan
procedure GetCustomersByCity(CityFilter: Text): Integer
var
    Customer: Record Customer;
    Count: Integer;
begin
    if Customer.FindSet() then       // loads entire Customer table
        repeat
            if Customer.City = CityFilter then
                Count += 1;
        until Customer.Next() = 0;
end;

// ✅ Correct: Filter pushed to DB
procedure GetCustomersByCity(CityFilter: Text): Integer
var
    Customer: Record Customer;
begin
    Customer.SetRange(City, CityFilter);
    Customer.SetRange(Blocked, Customer.Blocked::" ");
    exit(Customer.Count());
end;
```

### Pattern 2: Set-Based Aggregation (CalcSums / CalcFields)

Avoid manual loops for aggregation — push the sum to the database.

```al
// ❌ Loop accumulation — N rows fetched and processed in AL
procedure GetTotalSales(CustomerNo: Code[20]): Decimal
var
    Entry: Record "Cust. Ledger Entry";
    Total: Decimal;
begin
    Entry.SetRange("Customer No.", CustomerNo);
    if Entry.FindSet() then
        repeat
            Total += Entry.Amount;
        until Entry.Next() = 0;
    exit(Total);
end;

// ✅ CalcSums — single aggregation query at DB level
procedure GetTotalSales(CustomerNo: Code[20]): Decimal
var
    Entry: Record "Cust. Ledger Entry";
begin
    Entry.SetRange("Customer No.", CustomerNo);
    Entry.CalcSums(Amount);
    exit(Entry.Amount);
end;
```

For FlowFields accessed outside a page context, always call `CalcFields` before reading:
```al
Customer.SetLoadFields("Balance (LCY)");
Customer.Get(CustomerNo);
Customer.CalcFields("Balance (LCY)");   // required — not auto-calculated in code
```

### Pattern 3: Temporary Tables / Dictionary / List

Pre-load data once, then process in-memory multiple times.

```al
// ✅ Temporary table — structured record data, multi-pass processing
procedure ProcessSalesData(var TempSalesLine: Record "Sales Line" temporary)
var
    SalesLine: Record "Sales Line";
begin
    SalesLine.SetLoadFields("No.", Quantity, "Unit Price", Amount);
    if SalesLine.FindSet() then
        repeat
            TempSalesLine := SalesLine;
            TempSalesLine.Insert();
        until SalesLine.Next() = 0;

    // Process in-memory — zero additional DB hits
    ApplyDiscounts(TempSalesLine);
    CalculateTotals(TempSalesLine);
end;

// ✅ Dictionary — key-value lookup cache
procedure CacheCustomerNames(): Dictionary of [Code[20], Text]
var
    Customer: Record Customer;
    Cache: Dictionary of [Code[20], Text];
begin
    Customer.SetLoadFields("No.", Name);
    if Customer.FindSet() then
        repeat
            Cache.Add(Customer."No.", Customer.Name);
        until Customer.Next() = 0;
    exit(Cache);
end;

// ✅ List — simple value collection
procedure GetBlockedCustomerNos(): List of [Code[20]]
var
    Customer: Record Customer;
    Result: List of [Code[20]];
begin
    Customer.SetRange(Blocked, Customer.Blocked::All);
    Customer.SetLoadFields("No.");
    if Customer.FindSet() then
        repeat
            Result.Add(Customer."No.");
        until Customer.Next() = 0;
    exit(Result);
end;
```

### Pattern 4: Batch Processing and Avoiding Nested DB Calls

Move database operations outside loops; batch writes.

```al
// ❌ Nested DB call inside loop — O(n²) database hits
if MainTable.FindSet() then
    repeat
        OtherTable.SetRange(Field, MainTable.Field);
        if OtherTable.FindSet() then          // DB call per iteration
            repeat
                // process
            until OtherTable.Next() = 0;
    until MainTable.Next() = 0;

// ✅ Pre-load into temp table, then join in memory
if OtherTable.FindSet() then
    repeat
        TempOther := OtherTable;
        TempOther.Insert();
    until OtherTable.Next() = 0;

if MainTable.FindSet() then
    repeat
        if TempOther.Get(MainTable.Field) then
            // process — no DB hit
    until MainTable.Next() = 0;
```

Batch writes — collect changes, write once:
```al
// ✅ Calculate all values first, then single Modify
procedure UpdateCustomerStats(CustomerNo: Code[20])
var
    Customer: Record Customer;
    TotalBalance: Decimal;
    LastPaymentDate: Date;
begin
    CalculateCustomerTotals(CustomerNo, TotalBalance, LastPaymentDate);

    Customer.SetLoadFields("Balance (LCY)", "Last Payment Date");
    if Customer.Get(CustomerNo) then begin
        Customer."Balance (LCY)" := TotalBalance;
        Customer."Last Payment Date" := LastPaymentDate;
        Customer.Modify(true);   // single write
    end;
end;
```

Scale-aware processing:
```al
procedure UpdatePricesForItems(var Item: Record Item)
begin
    if Item.Count() > 1000 then
        UpdatePricesInBatches(Item)    // job queue / chunked
    else
        UpdatePricesDirectly(Item);
end;
```

### Pattern 5: FlowField Optimization (AL0896)

Circular FlowField references cause infinite evaluation (AL0896 error):

```
❌ Circular dependency:
Table Customer: FlowField "Total Sales" → CalcFormula from Sales Statistics
Table Sales Statistics: FlowField "Customer Balance" → CalcFormula from Customer

Compiler error AL0896: recursive dependency detected
```

Resolution strategies (in order of preference):
1. **Break the chain** — convert one FlowField to a regular field updated via trigger
2. **Use CalcSums** — replace FlowField with explicit `CalcSums` in code
3. **Restructure** — move the calculation to a dedicated codeunit called on demand
4. **SumIndexFields** — use SIFT keys for frequently summed values

Avoid FlowFields:
- With complex nested `CalcFormula` expressions
- Called inside `repeat...until` loops (call `CalcFields` once, outside loop if possible)
- Where the source table is large and unfiltered

## Workflow

### Step 1: Triage (Static Code Analysis)

Scan the codebase before profiling to identify structural issues:

Patterns to detect manually or with `search` + `problems`:
- `FindSet()` / `FindFirst()` without preceding `SetRange` / `SetFilter`
- `SetLoadFields` placed after `SetRange` (wrong order)
- Database calls (`Get`, `FindSet`, `FindFirst`) inside `repeat...until`
- `CalcFields` inside loops
- FlowField `CalcFormula` referencing tables that reference back (AL0896)
- `Commit` inside loops (locks + performance risk)
- Missing keys for columns used in `SetRange`

Severity assessment:
- 🔴 **Critical** — DB call in loop over large table, circular FlowField, timeout-causing query
- 🟡 **High** — Missing `SetLoadFields` in high-frequency path, nested loops
- 🟢 **Medium** — Suboptimal aggregation (loop instead of `CalcSums`)
- 🔵 **Low** — Best-practice suggestion, minimal current impact

### Step 2: Profile (Runtime Measurement)

Generate CPU profile for runtime bottleneck identification:
```
al_generate_cpu_profile_file
```

Analyze profile for:
- **Hotspots** — procedures with highest cumulative execution time
- **Frequency** — procedures called most often (especially in loops)
- **DB operations** — expensive `FindSet` / `Get` calls
- **FlowField evaluations** — unexpectedly costly `CalcFields`

Compare before/after optimizations by re-profiling after each fix.

⚠️ **Human Gate — cleanup**: Before clearing codelenses, confirm all findings are documented:
```
al_clear_profile_codelenses   ← only after approval
```

### Step 3: Fix

Apply fixes in priority order (critical first). For each fix:
1. Apply targeted change (Pattern 1–5 above)
2. Rebuild: `al_build`
3. Re-profile to verify improvement

Performance targets:
| Metric | Target |
|---|---|
| Page load | < 2 seconds |
| Report generation | < 10 seconds (standard dataset) |
| API response | < 500 ms |
| Batch processing | > 1,000 records/minute |

### Step 4: Document Findings

For significant optimizations, create a triage report at `.github/plans/perf-triage-<scope>.md`:

```markdown
# Performance Triage — <Scope>

**Date**: YYYY-MM-DD
**Analyzed**: [path or objects]

## Findings

| Severity | Location | Issue | Recommendation |
|---|---|---|---|
| 🔴 | `File.al:42` | Nested DB call in loop | Pre-load into TempTable |
| 🟡 | `File.al:87` | Missing SetLoadFields | Add SetLoadFields("No.", Name) |

## Changes Applied

1. [Change] — before/after metric
2. [Change] — before/after metric

## Remaining Items

[Issues not yet fixed, prioritized]
```

⚠️ **Human Gate — report**: Review findings before saving; confirm no sensitive code patterns are exposed.

## References

- [SetLoadFields — Microsoft Docs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/methods-auto/record/record-setloadfields-method)
- [Performance Best Practices for AL](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/performance/performance-developer)
- [AL0896 — Circular FlowField](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/analyzers/codecop-aa0896)
- [SumIndexFields (SIFT)](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-sift-and-performance)
- [CPU Profiler](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/performance-profiler-overview)

## Constraints

- This skill covers **analysis and fix patterns** — it does NOT duplicate the passive rules in `al-performance.instructions.md` (auto-applied to all `.al` files)
- Do **NOT** modify source code automatically during triage — generate report and get approval first
- Do **NOT** clear profile codelenses without human confirmation
- Do **NOT** save triage report without human gate review
- For runtime debugging of a specific issue (breakpoints, snapshots) → load `skill-debug.md`
- For event subscriber performance issues → load `skill-events.md`
