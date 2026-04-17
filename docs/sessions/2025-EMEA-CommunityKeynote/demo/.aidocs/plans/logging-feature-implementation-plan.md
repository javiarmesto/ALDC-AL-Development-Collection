# Feature Implementation Plan: Data Braider Endpoint Logging

**Work Item**: #68 - Add logging to Data Braider  
**Child Tasks**: #69 (Log reads/writes), #70 (Store request/response JSON)  
**Date**: November 12, 2025  
**Status**: Planning

---

## 1. Business Requirement

### Summary
Implement comprehensive logging functionality for Data Braider API endpoints to capture all API calls (reads and writes) with full request/response information for troubleshooting and auditing purposes.

### Clarified Requirements (from stakeholder feedback)
1. ✅ **What to log**: All API calls (both successful and failed) - Option A
2. ✅ **Data captured**: All fields - Config Code, Timestamp, Operation Type, Request/Response JSON, Record Count, User ID, Duration, Success/Error status, Error messages
3. ✅ **Retention**: Auto-cleanup using DateFormula on Data Braider Setup (automatic)
4. ✅ **Performance**: Synchronous logging (simpler implementation)
5. ✅ **Access**: New page "Data Braider Logs" accessible from Config Header
6. ✅ **Permissions**: Standard (same as endpoint config viewing)
7. ✅ **JSON storage**: Store full JSON (no truncation)
8. ✅ **Telemetry**: Completely separate from existing telemetry system

---

## 2. Technical Analysis

### Affected Components

#### New Components to Create
1. **Table**: `SPB DBraider Endpoint Log` (ID: 71033630)
   - Location: `src/Logging/SPBDBraiderEndpointLog.Table.al`
   - Purpose: Store log entries
   
2. **Codeunit**: `SPB DBraider Logging` (ID: 71033631)
   - Location: `src/Logging/SPBDBraiderLogging.Codeunit.al`
   - Purpose: Logging engine with insert/cleanup procedures
   
3. **Page**: `SPB DBraider Endpoint Logs` (ID: 71033632)
   - Location: `src/Logging/SPBDBraiderEndpointLogs.Page.al`
   - Purpose: List page for viewing/filtering logs

#### Components to Modify
1. **Table**: `SPB DBraider Setup` (ID: 71033600)
   - File: `src/.setup/SPBDBraiderSetup.Table.al`
   - Change: Add field for log retention DateFormula
   
2. **Page**: `SPB DBraider Setup` (ID: 71033600)
   - File: `src/.setup/SPBDBraiderSetup.Page.al`
   - Change: Add UI control for log retention setting
   
3. **Page**: `SPB DBraider API JSON` (ID: 71033609)
   - File: `src/API-Endpoints/SPBDBraiderAPIJSON.Page.al`
   - Change: Add logging calls in `GenerateData()` procedure
   
4. **Page**: `SPB DBraider Write API` (ID: 71033611)
   - File: `src/API-Endpoints/SPBDBraiderWriteAPI.Page.al`
   - Change: Add logging calls after `ProcessWriteData()`
   
5. **Page**: `SPB DBraider Configuration` (ID: 71033602)
   - File: `src/Configuration/SPBDBraiderConfiguration.Page.al`
   - Change: Add action to view logs for the current endpoint

### Integration Points

#### Read API Flow
```
User calls Read API
  → SPBDBraiderAPIJSON.OnFindRecord()
    → GenerateData()
      → DBraiderEngine.GenerateData()
      → [NEW] SPBDBraiderLogging.LogAPICall() ← Insert logging here
```

#### Write API Flow
```
User calls Write API
  → SPBDBraiderWriteAPI.OnInsertRecord()
    → ProcessWriteData()
      → [NEW] SPBDBraiderLogging.LogAPICall() ← Insert logging here
```

#### Cleanup Flow
```
Daily job or on-demand
  → SPBDBraiderLogging.CleanupOldLogs()
    → Check Setup."Log Retention Period"
    → Delete logs older than threshold
```

---

## 3. Implementation Approach

### Phase 1: Core Infrastructure (Tasks #69, #70)
**Estimated Time**: 2-3 hours

1. **Create Log Table** (`SPBDBraiderEndpointLog.Table.al`)
   - Auto-increment Entry No. (BigInteger)
   - Config Code with TableRelation
   - FlowField for Config Description
   - Operation Type (Enum reference to existing `SPB DBraider Endpoint Type`)
   - Timestamp (DateTime)
   - User ID with TableRelation to User
   - Record Count, Duration, Success, Error Message
   - Request JSON and Response JSON (BLOB fields)
   - Helper procedures: SetRequestJSON(), GetRequestJSON(), SetResponseJSON(), GetResponseJSON()
   - Keys: PK on Entry No., ConfigTimestamp, Timestamp

2. **Create Logging Codeunit** (`SPBDBraiderLogging.Codeunit.al`)
   - `LogAPICall()` - Main logging procedure
     - Parameters: Config Code, Operation Type, Request JSON, Response JSON, Record Count, Duration, Success, Error Message
     - Auto-populate: Timestamp, User ID
     - Handle BLOB writing via helper methods
   - `CleanupOldLogs()` - Retention cleanup
     - Read Setup."Log Retention Period"
     - Calculate cutoff date
     - Delete logs older than cutoff
   - `GetLogsForEndpoint()` - Helper for filtered retrieval

3. **Add Setup Field** (`SPBDBraiderSetup.Table.al`)
   - Field: "Log Retention Period" (DateFormula)
   - InitValue: `<-30D>` (30 days back = keep 30 days)
   - Caption: 'Log Retention Period'

4. **Update Setup Page** (`SPBDBraiderSetup.Page.al`)
   - Add field control for "Log Retention Period"
   - ToolTip explaining DateFormula and auto-cleanup

### Phase 2: UI Components
**Estimated Time**: 1-2 hours

5. **Create Logs Page** (`SPBDBraiderEndpointLogs.Page.al`)
   - PageType: List
   - SourceTable: SPB DBraider Endpoint Log
   - Layout: Entry No., Config Code, Config Description (FlowField), Timestamp, Operation Type, User ID, Record Count, Duration, Success, Error Message
   - Filters: By Config Code, Date range, Success/Failure
   - Actions:
     - View Request JSON (opens Large Text View)
     - View Response JSON (opens Large Text View)
     - Cleanup Old Logs (calls logging codeunit)
     - Refresh
   - Sorting: Descending by Timestamp (newest first)

6. **Add Configuration Drill-Down** (`SPBDBraiderConfiguration.Page.al`)
   - New Action: "View Endpoint Logs"
   - Opens SPBDBraiderEndpointLogs filtered by current Config Code

### Phase 3: Integration
**Estimated Time**: 1-2 hours

7. **Hook Read API** (`SPBDBraiderAPIJSON.Page.al`)
   - In `GenerateData()` procedure
   - After data generation completes
   - Capture start time before generation
   - Calculate duration after generation
   - Determine success based on error state
   - Call `SPBDBraiderLogging.LogAPICall()`
   - Parameters from context: DBraiderConfig.Code, FilterJson, JsonResult, record counts, etc.

8. **Hook Write API** (`SPBDBraiderWriteAPI.Page.al`)
   - In `OnInsertRecord()` trigger
   - After `ProcessWriteData()` completes
   - Capture timing and results
   - Call `SPBDBraiderLogging.LogAPICall()`

### Phase 4: Cleanup Job
**Estimated Time**: 1 hour

9. **Add Daily Cleanup**
   - Subscribe to `Codeunit "Telemetry Management"::OnSendDailyTelemetry`
   - Call `SPBDBraiderLogging.CleanupOldLogs()`
   - Similar pattern to existing telemetry in `SPBDBraiderTelemetry.Codeunit.al`

---

## 4. Data Structures

### Log Table Schema
```al
Table 71033630 "SPB DBraider Endpoint Log"
├── Entry No. (BigInteger, AutoIncrement, PK)
├── Config. Code (Code[20], TableRelation)
├── Config. Description (Text[100], FlowField, CalcFormula)
├── Operation Type (Enum "SPB DBraider Endpoint Type")
├── Timestamp (DateTime)
├── User ID (Code[50], TableRelation to User)
├── Record Count (Integer)
├── Execution Duration (ms) (Integer)
├── Success (Boolean)
├── Error Message (Text[2048])
├── Request JSON (BLOB)
└── Response JSON (BLOB)

Keys:
- PK: Entry No. (Clustered)
- ConfigTimestamp: Config. Code, Timestamp
- Timestamp: Timestamp
```

### Setup Table Addition
```al
Field 90: "Log Retention Period" (DateFormula)
  - InitValue: '<-30D>'
  - Used by cleanup to calculate cutoff date
```

---

## 5. Error Handling

### Logging Failures Should Not Break API Calls
- Wrap all logging calls in try-catch
- If logging fails, log error to Event Log but continue API processing
- Never throw exceptions from logging code

### BLOB Handling
- Check for empty/null JSON before writing to BLOB
- Use UTF8 encoding consistently
- Handle InStream/OutStream errors gracefully

### Cleanup Safety
- Use transactions when deleting logs
- Commit in batches (e.g., 1000 records at a time) to avoid long locks
- Log cleanup results to Event Log

---

## 6. Testing Strategy

### Unit Tests (in Test folder)
1. **Test Log Creation**
   - Create log entry with all fields populated
   - Verify auto-increment works
   - Verify BLOB storage/retrieval

2. **Test JSON Storage**
   - Store large JSON (>10KB)
   - Retrieve and verify integrity
   - Test empty JSON handling

3. **Test Cleanup Logic**
   - Create logs with various dates
   - Run cleanup with different DateFormulas
   - Verify correct logs are deleted

### Integration Tests
4. **Test Read API Logging**
   - Call Read API endpoint
   - Verify log entry created
   - Verify all fields populated correctly

5. **Test Write API Logging**
   - Call Write API endpoint
   - Verify log entry created
   - Verify request/response JSON stored

6. **Test Error Logging**
   - Trigger API error
   - Verify log captures error message
   - Verify Success = false

### Manual Testing Checklist
- [ ] Enable logging on test endpoint
- [ ] Call Read API multiple times
- [ ] Call Write API multiple times
- [ ] Verify logs appear in Logs page
- [ ] View Request JSON from log
- [ ] View Response JSON from log
- [ ] Filter logs by date range
- [ ] Filter logs by endpoint
- [ ] Test cleanup with different retention periods
- [ ] Verify cleanup doesn't delete recent logs
- [ ] Check performance impact (measure API response time)

---

## 7. Performance Considerations

### Impact Assessment
- **Synchronous logging**: Adds ~10-50ms per API call (acceptable per stakeholder)
- **BLOB storage**: Minimal index impact (BLOBs stored separately)
- **Cleanup**: Run during off-hours, batch deletes to avoid locks

### Optimization Strategies
- Use BLOB fields (not Text[max]) for large JSON
- Index on Config Code + Timestamp for fast filtering
- Cleanup in batches with commits

### Monitoring
- Track log table size growth
- Monitor API response time before/after logging
- Alert if cleanup job fails

---

## 8. Documentation Requirements

### Wiki Updates

#### Setup Guide (`Setup.md` or new `Setup/Logging.md`)
```markdown
## Endpoint Logging

Data Braider can log all API calls for troubleshooting and auditing.

### Enable Logging
1. Open **Data Braider Setup**
2. Set **Log Retention Period** (e.g., `<-30D>` keeps logs for 30 days)
3. Open endpoint configuration
4. Enable **Logging Enabled** field

### View Logs
1. Open **Data Braider Configuration**
2. Select endpoint
3. Click **View Endpoint Logs** action
4. Filter by date, user, or success/failure
5. Click **View Request JSON** or **View Response JSON** to see details

### Cleanup
Logs are automatically cleaned up daily based on retention period.
To manually cleanup: Open **Data Braider Endpoint Logs** → **Cleanup Old Logs**
```

#### Usage Guide (`Usage-Guide.md`)
- Add section on using logs for troubleshooting
- Show example of finding failed API calls
- Explain how to interpret log entries

#### Support Guide (`Support-Guide.md`)
- Add troubleshooting section: "How to use logs to diagnose API issues"
- Common patterns in logs
- What to look for when API calls fail

### Code Documentation
- XML comments on all public procedures
- Inline comments for complex logic
- Examples in procedure documentation

---

## 9. Dependencies

### AL Extensions/Features Required
- None (all standard BC functionality)

### Table References
- `SPB DBraider Config. Header` (existing)
- `User` (standard BC table)

### Enum References
- `SPB DBraider Endpoint Type` (existing)

---

## 10. Rollout Plan

### Phase 1: Core Implementation
1. Create all objects
2. Test in isolation
3. Commit with proper messages

### Phase 2: Integration
4. Hook into API pages
5. Test end-to-end
6. Performance validation

### Phase 3: Documentation
7. Update wiki pages
8. Add inline documentation
9. Create troubleshooting examples

### Phase 4: Release
10. Update work items
11. Mark tasks #69, #70 as complete
12. Move Epic #68 to Done

---

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Logging slows down API calls | High | Synchronous is acceptable per stakeholder; monitor performance |
| Large JSON causes DB bloat | Medium | Auto-cleanup with configurable retention |
| Logging failure breaks API | Critical | Wrap all logging in try-catch; never throw exceptions |
| Users don't enable logging | Low | Document benefits; consider default-enabled |
| Cleanup job fails silently | Medium | Log cleanup results; add telemetry event |

---

## 12. Completion Criteria

### Definition of Done
- [x] Requirements clarified with stakeholder
- [ ] All objects created with proper naming (SPBD prefix)
- [ ] All fields populated correctly in log entries
- [ ] Request and Response JSON stored and retrievable
- [ ] Cleanup job working correctly
- [ ] Read API logs all calls
- [ ] Write API logs all calls
- [ ] Logs page functional with all actions
- [ ] Configuration page has drill-down to logs
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Manual testing checklist completed
- [ ] Wiki documentation updated
- [ ] Code compiles without warnings
- [ ] Performance validated (no significant degradation)
- [ ] Work items #69, #70, #68 marked complete

---

## 13. Implementation Order

1. ✅ Create implementation plan (this document)
2. Create log table
3. Create logging codeunit
4. Add setup field and page control
5. Create logs viewer page
6. Hook Read API
7. Hook Write API
8. Add cleanup subscriber
9. Add drill-down from Config page
10. Write unit tests
11. Perform integration testing
12. Update wiki documentation
13. Final validation and commit
14. Update work items

---

## Notes

- **AL Object ID Range**: 71033600 to 71033649 (per app.json)
- **Available IDs**: 71033630-71033649 (using 71033630, 71033631, 71033632)
- **Existing Logging Folder**: Currently empty (`src/Logging/`)
- **Pattern to Follow**: See `SPBDBraiderTelemetry.Codeunit.al` for event subscription pattern
- **Date Formula Examples**: `<-30D>` = 30 days ago, `<-1W>` = 1 week ago, `<-3M>` = 3 months ago

---

**Next Step**: Begin implementation starting with log table creation.
