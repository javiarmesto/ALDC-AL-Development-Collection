---
name: skill-debug
description: "AL debugging and diagnostics for Business Central. Use when performing snapshot debugging, CPU profiling, analyzing telemetry, or troubleshooting runtime issues."
---

# Skill: AL Debugging & Diagnostics

## Purpose

Systematic diagnosis and root cause analysis for AL Business Central issues: runtime errors, logic bugs, intermittent failures, performance bottlenecks, and configuration problems.

## When to Load

This skill should be loaded when:
- A runtime error, exception, or unexpected behavior is reported
- A logic bug needs root cause analysis (not just a symptom fix)
- An intermittent issue needs snapshot capture
- A performance bottleneck needs CPU profiling
- Configuration issues (auth, symbols, build, publishing) block development
- An event subscriber is not firing as expected

## Core Patterns

### Pattern 1: Choose Debugging Strategy

Select the right tool before starting:

| Issue Type | Strategy | Tool |
|---|---|---|
| Consistent runtime error | Standard debugger | `al_debug_without_publish` |
| Already deployed code | Debug without publish | `al_debug_without_publish` |
| Rapid dev cycle | Incremental publish | `al_incremental_publish` |
| Intermittent / hard-to-reproduce | Snapshot debugging | `al_initalize_snapshot_debugging` |
| Slow performance | CPU profiling | `al_generate_cpu_profile_file` |
| Auth / symbols / build | Configuration troubleshoot | See Workflow Step 2b |
| Copilot AI feature | Agent session debug | `launch.json` with `clientType: Agent` |

### Pattern 2: Data Flow Tracing

```
Scenario: "Value is wrong after posting"

1. Set breakpoint at final location (where value is wrong)
2. Work backwards to find where value is set
3. Use `usages` tool to find all assignments
4. Set breakpoints at each assignment point
5. Step through to find which execution path is taken
6. Inspect conditions and variable states at each point
```

### Pattern 3: Event Subscriber Not Firing

```
Scenario: "My event subscriber doesn't execute"

1. Verify subscriber signature exactly matches publisher (name, parameters, types)
2. Check SkipOnMissingLicense and SkipOnMissingPermission attributes
3. Confirm the extension containing the publisher is active and published
4. Set breakpoint inside subscriber body
5. Verify the publisher event is actually being raised (breakpoint in publisher)
6. Check if IsHandled = true is set before your subscriber runs
7. Inspect subscriber execution order (EventPriority)
```

### Pattern 4: Performance Bottleneck

```al
// ❌ N+1 pattern — common cause of slow pages
repeat
    Item.Get(SalesLine."No.");      // DB call inside loop
    SalesLine.Amount := Item.Price * SalesLine.Quantity;
until SalesLine.Next() = 0;

// ✅ Use SetLoadFields + single pass
SalesLine.SetLoadFields("No.", Quantity, Amount);
if SalesLine.FindSet() then
    repeat
        // ...
    until SalesLine.Next() = 0;
```

CPU profile analysis focus:
- Top time-consuming procedures (hotspots)
- Frequently called procedures in loops
- Expensive database operations
- FlowField CalcFormula complexity

### Pattern 5: Snapshot Debugging for Intermittent Issues

```
⚠️ HUMAN GATE: Snapshots may capture sensitive runtime data.
Before initializing:
1. Confirm what data will be captured
2. Security review for sensitive information
3. Obtain explicit user approval

Commands:
  al_initalize_snapshot_debugging   ← start capture session
  [reproduce scenario 10-20 times]
  al_finish_snapshot_debugging      ← end capture
  al_snapshots                      ← view and compare

Compare snapshots between success and failure cases:
- Variable values at failure point
- Timing differences
- Execution paths taken
- Data state variations
```

## Workflow

### Step 1: Context Gathering (MANDATORY before any debugging)

Read existing plans context first:
```
.github/plans/memory.md              ← project state and recent decisions
.github/plans/*-diagnosis.md         ← previous debug sessions (similar issues)
```

Gather issue information:
- What is the **expected** behavior vs **actual** behavior?
- When does it happen: always / sometimes / specific conditions?
- Exact error message and stack trace
- Recent code changes (potential regression source)
- User/permission set and environment where it occurs

**Stop criterion**: can reproduce the issue consistently (≥80% success rate).

### Step 2a: Isolate the Problem (Runtime / Logic)

1. Narrow down scope with `search` and `usages` tools
2. Identify suspect objects (tables, pages, codeunits, event subscribers)
3. Attach debugger with selected strategy (Pattern 1)
4. Set strategic breakpoints:
   - Just before the error occurs
   - At data modification points
   - In event subscribers and validation triggers
5. Inspect: variable values, record filters, call stack, parameter values
6. Step execution: F10 (step over), F11 (step into), Shift+F11 (step out)

### Step 2b: Configuration Troubleshooting

**Authentication failures** (401/403, cannot download symbols):
```
⚠️ HUMAN GATE: Clearing credentials disconnects active sessions.
Confirm impact and obtain approval before:
  al_clear_credentials_cache
Then re-authenticate and verify launch.json authentication method.
```

**Missing symbols** (unresolved references, red squiggles):
```
al_download_symbols      ← first attempt
al_download_source       ← if symbols persist
al_build                 ← verify compilation
```
Check `app.json` dependencies version alignment.

**Build errors — common codes**:
- `AL0896` — Recursive FlowField: map dependency graph, break circular chain
- `AL0185` — Object ID conflict: check ID range in `app.json`, no duplicates
- `AL0118` — Field length mismatch: align extension field length with base table

**Publishing failures**: check environment connectivity, extension version increment, dependency resolution via `al_get_package_dependencies`.

### Step 3: Diagnose Root Cause

Identify the **exact point of failure** and — critically — **WHY** it occurs:

Common AL root causes by scenario:

| Symptom | Root Cause Candidates |
|---|---|
| Record Not Found | Wrong key values, filters blocking read, wrong company context, permission on read |
| FlowField wrong value | `CalcFields` not called, incorrect `CalcFormula` filters, circular dependency (AL0896) |
| OnValidate not firing | Direct assignment without `Validate()`, `IsHandled = true` in subscriber, disabled trigger |
| Custom event not firing | Signature mismatch, wrong `ObjectType`/`ObjectId`, publisher not raising event, compilation error in subscriber |
| Slow page | Missing `SetLoadFields`, N+1 loop, FlowField `CalcFormula` too complex, missing index/key |
| Intermittent failure | Race condition, timing dependency, data-state dependency, environment-specific |

### Step 4: Document Diagnosis (MANDATORY)

Create `.github/plans/<issue-kebab-case>-diagnosis.md` before proposing any fix:

```markdown
# Debug Session: <Issue Title>

**Date**: YYYY-MM-DD
**Severity**: Critical / High / Medium / Low
**Status**: Investigating → Diagnosed → Fixed → Verified

## Issue Summary
[Brief description]

## Symptoms
- Expected: [what should happen]
- Actual: [what happens — include exact error text]

## Reproduction Steps
1. [Step]
2. [Step]
**Reproducibility**: Always / Sometimes / Rare

## Root Cause
[Technical explanation with evidence — code snippet, line reference]

## Recommended Fix
[Specific solution. Short-term hotfix + long-term if needed]

## Testing Strategy
- Unit: [what to mock/test]
- Regression: [related functionality to verify]

## Next Steps
1. [Action]
2. [Action]
```

File naming: `sales-posting-error-diagnosis.md`, `slow-customer-list-diagnosis.md`.

### Step 5: Propose Fix & Handoff (MANDATORY HITL gate)

1. Design fix addressing **root cause** (never symptoms only)
2. Consider edge cases and side effects
3. **PAUSE — present diagnosis and proposed fix to user for approval**
4. After approval: handoff implementation to `al-developer` (simple) or via `al-conductor` TDD cycle (complex refactor)
5. After fix: run tests, re-profile if performance issue, verify regression scenarios

Clean up: remove debugging artifacts, breakpoints, and temporary logging from code.

## References

- [AL Debugger — Microsoft Docs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-debugging)
- [Snapshot Debugging](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-snapshot-debugging)
- [AL Code Analysis — AL0896](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/analyzers/codecop-aa0896)
- [Performance Profiler](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/performance-profiler-overview)

## Constraints

- This skill covers **diagnosis and root cause analysis only** — code changes are implemented by `al-developer` or via `al-conductor`
- **NEVER** guess solutions without evidence from debugging tools
- **NEVER** skip Step 4 (diagnosis document) for non-trivial issues (>5 min investigation)
- **NEVER** proceed to fix without user approval (Step 5 HITL gate)
- **NEVER** leave debugging code, breakpoints, or temporary logging in production code
- Performance deep-dive (SetLoadFields, FlowField patterns, query optimization) → load `skill-performance.md`
- Event publisher/subscriber design patterns → load `skill-events.md`
- Permission set generation → load `skill-permissions.md`
