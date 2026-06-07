---
name: skill-agent-task-patterns
description: "Agent SDK task integration patterns for Business Central. Triggers on: Agent Task Builder, Agent Task Message Builder, Public API, AssignTask, ExternalId, agent session detection, BindSubscription, TryFunction agent task, multi-turn agent conversation, agent attachment, task lifecycle management, OnPrem-only methods, AddToTask, SetRequiresReview, SetSkipMessageSanitization, runtime availability."
argument-hint: "Describe the integration pattern needed (Public API, page action, business event, multi-turn, attachment...)"
---

# BC Agent Task Integration Patterns

Knowledge base for every Agent SDK task integration pattern, with runtime-availability matrix and Extension-safe workarounds. For SDK architecture and the 3 interfaces, see `skill-agent-toolkit`.

**References**:
- [Tasks AL API](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-tasks-api)
- [Agent SDK overview](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-overview)

## API availability matrix (Runtime 17.0 / Platform 27.0)

**Critical**: not every documented method works in Extension scope today. Verify here before designing.

| Method                                       | Scope            | Status         | Workaround                                              |
| -------------------------------------------- | ---------------- | -------------- | ------------------------------------------------------- |
| `AddTaskMessage(From, Text)`                 | Extension        | ✅ Available    | —                                                       |
| `AddAttachment(Name, MediaType, InStream)`   | Extension        | ✅ Available    | —                                                       |
| `SetExternalId(Text)`                        | Extension        | ✅ Available    | —                                                       |
| `SetRequiresReview(true)`                    | **OnPrem only**  | ❌ Ext. blocked | Use `IAgentTaskExecution` Warning annotation            |
| `SetSkipMessageSanitization(true)`           | **OnPrem only**  | ❌ Ext. blocked | Pre-format message text upstream                        |
| `AddToTask(AgentTask)`                       | Future           | ❌ Not in 17.0  | Create a new follow-up task referencing original ExternalId |
| `Custom Agent.GetCustomAgents()`             | Future           | ❌ Not in 17.0  | Use `Agent Setup.OpenAgentLookup()`                     |

OnPrem-only methods are documented but throw at runtime when invoked from a cloud Extension. Treat the workarounds as the canonical Extension pattern.

## SDK codeunits — quick reference

| Codeunit                       | Purpose                                      | Key methods                                                |
| ------------------------------ | -------------------------------------------- | ---------------------------------------------------------- |
| `Agent Task Builder`           | Create new tasks (fluent API)                | `.Initialize(Guid, Text).SetExternalId(Text).AddTaskMessage(Text, Text).Create()` |
| `Agent Task Message Builder`   | Build messages with options                  | `.Initialize(From, Text)`, `.AddAttachment(Name, MediaType, InStream)`, `.AddToTask(Record)` |
| `Agent Task`                   | Query/manage existing tasks                  | `GetTaskByExternalId(Guid, Text)`, `CanSetStatusToReady(Record)`, `SetStatusToReady(Record)` |
| `Agent Message`                | Read/update message text                     | `GetText(Record)`, `UpdateText(Record, Text)`              |
| `Agent Setup`                  | Agent lookup + setup management              | `OpenAgentLookup(Enum, var Guid)`, `GetSetupRecord(...)`, `SaveChanges(...)` |
| `Agent`                        | Core agent operations                        | `SetInstructions(Guid, SecretText)`, `Deactivate(Guid)`, `IsActive(Guid)`, `GetDisplayName(Guid)`, `PopulateDefaultProfile(...)` |
| `Agent Session`                | Detect agent runtime context                 | `IsAgentSession(var Enum)`, `IsAgentSession(Enum)`, `GetCurrentSessionAgentTaskId()` |

## 8 integration patterns

### Pattern A — Public API (standard entry point)

**When**: every reusable task-creation surface. All other patterns call through here.

**Architecture**: Public codeunit (`Access = Public`) + Internal implementation codeunit.

**Contract**:

```al
// Overload 1: basic task
procedure AssignTask(AgentUserSecurityID: Guid; TaskTitle: Text[150]; From: Text[250]; Message: Text): Record "Agent Task"

// Overload 2: with ExternalId for tracking / multi-turn
procedure AssignTask(AgentUserSecurityID: Guid; TaskTitle: Text[150]; ExternalId: Text[2048]; From: Text[250]; Message: Text): Record "Agent Task"

// Overload 3: with attachments
procedure AssignTaskWithAttachment(AgentUserSecurityID: Guid; TaskTitle: Text[150]; From: Text[250]; Message: Text; var TempAttachments: Record "Agent Task File"): Record "Agent Task"

// Lifecycle
procedure Deactivate(AgentUserSecurityID: Guid)
procedure IsActive(AgentUserSecurityID: Guid): Boolean
```

**Implementation** (Impl codeunit, `Access = Internal`):

```al
local procedure AssignTaskInternal(
    AgentUserSecurityID: Guid;
    TaskTitle: Text[150];
    ExternalId: Text[2048];
    From: Text[250];
    Message: Text;
    var TempAttachments: Record "Agent Task File" temporary): Record "Agent Task"
var
    AgentTaskBuilder: Codeunit "Agent Task Builder";
    AgentTaskMsgBuilder: Codeunit "Agent Task Message Builder";
    ContentStream: InStream;
begin
    AgentTaskMsgBuilder.Initialize(From, Message);

    if TempAttachments.FindSet() then
        repeat
            TempAttachments.Content.CreateInStream(ContentStream);
            AgentTaskMsgBuilder.AddAttachment(
                TempAttachments."File Name",
                TempAttachments."Content Type",
                ContentStream);
        until TempAttachments.Next() = 0;

    AgentTaskBuilder := AgentTaskBuilder
        .Initialize(AgentUserSecurityID, TaskTitle)
        .AddTaskMessage(AgentTaskMsgBuilder);

    if ExternalId <> '' then
        AgentTaskBuilder.SetExternalId(ExternalId);

    exit(AgentTaskBuilder.Create());
end;
```

### Pattern B — Page action (user-initiated)

**When**: a button on a page sends work to an agent.

**Flow**: `AgentSetup.OpenAgentLookup()` → user picks agent → `PublicAPI.AssignTask()`.

```al
trigger OnAction()
var
    AgentSetup: Codeunit "Agent Setup";
    MyAgentAPI: Codeunit "My Agent Public API";
    AgentUserSecurityId: Guid;
begin
    if not AgentSetup.OpenAgentLookup(
        Enum::"Agent Metadata Provider"::"My Agent", AgentUserSecurityId) then
        exit;

    MyAgentAPI.AssignTask(
        AgentUserSecurityId,
        CopyStr(StrSubstNo('Process: %1', Rec.Name), 1, 150),
        'LEAD-' + Rec."No.",
        CopyStr(UserId(), 1, 250),
        StrSubstNo('Please process customer %1 (No. %2).', Rec.Name, Rec."No."));
end;
```

### Pattern C — Business event (automated)

**When**: a business event (posting, releasing, approval) auto-triggers an agent task.

**Non-negotiable rules**:

1. **Always wrap in `[TryFunction]`** — never block the business event on agent failure.
2. **Always filter by business condition BEFORE creating the task** — not inside the TryFunction.
3. **Always log failures via `Session.LogMessage`** with category and `GetLastErrorText()`.

```al
[EventSubscriber(ObjectType::Codeunit, Codeunit::"Release Sales Document",
                 OnBeforeReleaseSalesDoc, '', false, false)]
local procedure OnBeforeRelease(var SalesHeader: Record "Sales Header")
begin
    if SalesHeader."Document Type" <> SalesHeader."Document Type"::Order then exit;
    if not MeetsCondition(SalesHeader) then exit;

    if not TryCreateTask(SalesHeader) then
        Session.LogMessage('BCA2A-FAIL',
            StrSubstNo('Task creation failed for %1: %2', SalesHeader."No.", GetLastErrorText()),
            Verbosity::Error, DataClassification::SystemMetadata,
            TelemetryScope::ExtensionPublisher, 'Category', 'BCA2A');
end;

[TryFunction]
local procedure TryCreateTask(var SalesHeader: Record "Sales Header")
var
    PublicAPI: Codeunit "My Agent Public API";
begin
    PublicAPI.AssignTask(
        GetAgentSecurityId(),
        'Validate SO ' + SalesHeader."No.",
        'SO-' + SalesHeader."No.",
        'System',
        BuildMessage(SalesHeader));
end;
```

### Pattern D — Attachment task

**When**: agent needs to process files (PDFs, images, CSVs, Excel).

**Signature**: `AddAttachment(Name: Text[250]; MediaType: Text; ContentStream: InStream)`

```al
procedure CreateTaskWithAttachment(AgentUserId: Guid; var DocumentBlob: Codeunit "Temp Blob")
var
    AgentTaskBuilder: Codeunit "Agent Task Builder";
    AgentTaskMsgBuilder: Codeunit "Agent Task Message Builder";
    ContentStream: InStream;
begin
    DocumentBlob.CreateInStream(ContentStream);

    AgentTaskMsgBuilder.Initialize(CopyStr(UserId(), 1, 250), 'Review attached document.');
    AgentTaskMsgBuilder.AddAttachment('Document.pdf', 'application/pdf', ContentStream);

    AgentTaskBuilder := AgentTaskBuilder
        .Initialize(AgentUserId, 'Process Document')
        .SetExternalId('DOC-1001')
        .AddTaskMessage(AgentTaskMsgBuilder);

    AgentTaskBuilder.Create();
end;
```

**Common MIME types**: `application/pdf`, `image/png`, `image/jpeg`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel xlsx), `text/csv`.

When you need a canonical end-to-end example combining attachment + business condition + telemetry + lead handoff, load `examples/lead-handoff-with-attachment.md`.

### Pattern E — Multi-turn conversation

**When**: continue an existing task with follow-up messages.

**Flow**: `GetTaskByExternalId()` → build follow-up → **workaround needed** (see below) → `SetStatusToReady()`.

**Status (Runtime 17.0)**: `AgentTaskMessageBuilder.AddToTask()` is **not available in Extension scope yet**. Until it ships, create a new task that references the original ExternalId:

```al
procedure SendFollowUpTask(AgentUserId: Guid; OriginalExternalId: Text; AdditionalInfo: Text)
var
    AgentTaskBuilder: Codeunit "Agent Task Builder";
    AgentTaskMsgBuilder: Codeunit "Agent Task Message Builder";
begin
    AgentTaskMsgBuilder.Initialize(CopyStr(UserId(), 1, 250), AdditionalInfo);

    AgentTaskBuilder := AgentTaskBuilder
        .Initialize(AgentUserId, CopyStr('Update for ' + OriginalExternalId, 1, 150))
        .SetExternalId(OriginalExternalId + '-UPD')
        .AddTaskMessage(AgentTaskMsgBuilder);

    AgentTaskBuilder.Create();
end;
```

**When `AddToTask` becomes available** in a future runtime, the canonical pattern will be:

```al
// FUTURE — not yet in Extension scope
AgentTaskRecord := AgentTaskCU.GetTaskByExternalId(AgentSecurityId, ExternalId);
AgentTaskMsgBuilder.Initialize('User', FollowUpText);
AgentTaskMsgBuilder.AddToTask(AgentTaskRecord);
if AgentTaskCU.CanSetStatusToReady(AgentTaskRecord) then
    AgentTaskCU.SetStatusToReady(AgentTaskRecord);
```

### Pattern F — Lifecycle management

**When**: monitor, restart, or stop tasks programmatically.

| Operation             | Method                                                   |
| --------------------- | -------------------------------------------------------- |
| Check active          | `Agent.IsActive(AgentUserSecurityId)`                    |
| Deactivate            | `Agent.Deactivate(AgentUserSecurityId)`                  |
| Find by ExternalId    | `AgentTask.GetTaskByExternalId(AgentUserId, ExternalId)` |
| Resume paused task    | `if AgentTask.CanSetStatusToReady(Rec) then AgentTask.SetStatusToReady(Rec)` |
| Display name lookup   | `Agent.GetDisplayName(AgentUserSecurityId)`              |

### Pattern G — Agent session detection

**When**: AL code must run only inside an agent session (not in normal user sessions).

```al
// Any agent
var
    AgentSession: Codeunit "Agent Session";
    Provider: Enum "Agent Metadata Provider";
begin
    if not AgentSession.IsAgentSession(Provider) then exit;
    // agent-specific logic
end;

// Specific agent
if not AgentSession.IsAgentSession(Enum::"Agent Metadata Provider"::"Lead Qualifier") then exit;
```

### Pattern H — Agent session event binding (performance)

**When**: event subscribers should be active only during agent tasks, never in normal user sessions.

**Architecture**: SingleInstance codeunit + BindSubscription on `System Initialization.OnAfterInitialization`.

```al
codeunit 52120 "My Agent Session Events"
{
    Access = Internal;
    SingleInstance = true;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"System Initialization",
                     OnAfterInitialization, '', false, false)]
    local procedure OnInit()
    var
        AgentSession: Codeunit "Agent Session";
    begin
        if not AgentSession.IsAgentSession(
            Enum::"Agent Metadata Provider"::"My Agent") then exit;

        GlobalEvents.SetAgentTaskID(AgentSession.GetCurrentSessionAgentTaskId());
        if BindSubscription(GlobalEvents) then;
    end;

    var
        GlobalEvents: Codeunit "My Agent Events";
}
```

## Human review without `SetRequiresReview`

`SetRequiresReview` is OnPrem-only. To force human review from an Extension, add a Warning annotation in `IAgentTaskExecution.AnalyzeAgentTaskMessage`:

```al
procedure AnalyzeAgentTaskMessage(
    AgentTaskMessage: Record "Agent Task Message";
    var Annotations: Record "Agent Annotation")
var
    AgentMessage: Codeunit "Agent Message";
    MessageText: Text;
begin
    MessageText := AgentMessage.GetText(AgentTaskMessage);

    if MessageText.Contains('DISQUALIFICATION') then begin
        Annotations.Severity := Annotations.Severity::Warning;
        Annotations.Message :=
            'Disqualification requires human approval. Review before proceeding.';
        Annotations.Insert();
    end;
end;
```

Warning annotations trigger the user-intervention flow via `GetAgentTaskUserInterventionSuggestions`. Error annotations stop the task.

## Agent discovery — current state

Until `Custom Agent.GetCustomAgents()` becomes available in Extension scope, use `Agent Setup.OpenAgentLookup()` for user selection and `Agent.GetDisplayName(Guid)` for display:

```al
trigger OnLookup(var Text: Text): Boolean
var
    AgentSetup: Codeunit "Agent Setup";
    SelectedAgentUserId: Guid;
begin
    if AgentSetup.OpenAgentLookup(
        Enum::"Agent Metadata Provider"::"Quote Builder", SelectedAgentUserId) then begin
        Rec."Target Agent Security ID" := SelectedAgentUserId;
        Text := Format(SelectedAgentUserId);
        exit(true);
    end;
    exit(false);
end;

local procedure GetAgentDisplayText(AgentSecurityId: Guid): Text
var
    AgentCU: Codeunit Agent;
begin
    if IsNullGuid(AgentSecurityId) then exit('');
    exit(AgentCU.GetDisplayName(AgentSecurityId) + ' (' + Format(AgentSecurityId) + ')');
end;
```

## Pattern selection guide

| Situation                                  | Pattern(s)        |
| ------------------------------------------ | ----------------- |
| Standard reusable task creation            | A (Public API)    |
| User clicks button to assign work          | B → A             |
| Business event triggers agent              | C → A             |
| Agent processes uploaded files             | D + (A, B, or C)  |
| Follow-up on existing task                 | E                 |
| Monitor / restart / stop tasks             | F                 |
| Code runs only in agent context            | G                 |
| Performance: subscribers only during tasks | H                 |
| Need to force human review (Extension)     | Warning annotation in `AnalyzeAgentTaskMessage` |

## Non-negotiable rules

1. **Public API is the entry point** — all other patterns call through it.
2. **TryFunction for event-driven creation** — never block posting, releasing, approval.
3. **Filter before creating** — business condition checked outside the TryFunction.
4. **Log failures to telemetry** — `Session.LogMessage` with category and error text.
5. **Mensaje contiene todo el contexto** — el agente solo sabe lo que le pasas por el mensaje + attachments.
6. **ExternalId follows `{PREFIX}-{No.}`** — `SO-1001`, `LEAD-001`, `EMAIL-{threadId}`. Never GUIDs or auto-increments.
7. **Use `Agent Task Message Builder`** for attachments — never manipulate the underlying records directly.
8. **Verify availability** against the matrix above before designing — don't ship code that relies on OnPrem-only methods.

## Examples

Load an example only when you need its concrete template:

- When implementing an end-to-end attachment + business condition + telemetry + handoff flow, load `examples/lead-handoff-with-attachment.md`.
- When wiring Pattern H with a companion Events codeunit, load `examples/session-events-binding.md`.
