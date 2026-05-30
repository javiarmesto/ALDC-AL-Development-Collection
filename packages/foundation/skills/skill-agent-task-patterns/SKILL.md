---
name: skill-agent-task-patterns
description: "Agent SDK task integration patterns for Business Central. Triggers on: Agent Task Builder, Agent Task Message Builder, Public API, AssignTask, ExternalId, agent session detection, BindSubscription, TryFunction agent task, multi-turn agent conversation, agent attachment, or task lifecycle management."
argument-hint: "Describe the task integration pattern you need (Public API, page action, business event, multi-turn, etc.)"
---

# BC Agent Task Integration Patterns

Knowledge base for all Agent SDK task integration patterns. Use this to understand how to create, manage, and extend agent tasks in Business Central.

**References**:
- [Tasks AL API](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-tasks-api)
- [Agent SDK overview](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/ai-development-toolkit-overview)

## SDK Codeunits for Task Management

| Codeunit                       | Purpose                                      | Key Methods                                                |
| ------------------------------ | -------------------------------------------- | ---------------------------------------------------------- |
| `Agent Task Builder`           | Create new tasks (fluent API)                | `.Initialize(Guid, Text).SetExternalId(Text).AddTaskMessage(Text, Text).Create()` |
| `Agent Task Message Builder`   | Build messages with options                  | `.Initialize(Text, Text)`, `.AddAttachment(Record)`, `.AddToTask(Record)`, `.SetSkipMessageSanitization(Boolean)`, `.SetRequiresReview(Boolean)` |
| `Agent Task`                   | Query/manage existing tasks                  | `GetTaskByExternalId(Guid, Text)`, `CanSetStatusToReady(Record)`, `SetStatusToReady(Record)` |
| `Agent Message`                | Read/update message text                     | `GetText(Record "Agent Task Message")`, `UpdateText(Record "Agent Task Message", Text)` |
| `Agent Setup`                  | Agent lookup + setup management              | `OpenAgentLookup(Enum, var Guid)`, `GetSetupRecord(...)`, `SaveChanges(...)` |
| `Agent`                        | Core agent operations                        | `SetInstructions(Guid, SecretText)`, `Deactivate(Guid)`, `IsActive(Guid)` |
| `Agent Session`                | Detect agent runtime context                 | `IsAgentSession(var Enum)`, `IsAgentSession(Enum)`, `GetCurrentSessionAgentTaskId()` |

## 8 Integration Patterns

### Pattern A: Public API (Standard Entry Point)

**When**: You want a clean, reusable interface for task creation. This is the **recommended** pattern — all other patterns should call through it.

**Architecture**: Public codeunit (Access = Public) + Internal implementation codeunit.

**Public API contract**:
```al
// Overload 1: Basic task
procedure AssignTask(AgentUserSecurityID: Guid; TaskTitle: Text[150]; From: Text[250]; Message: Text): Record "Agent Task"

// Overload 2: With ExternalId for tracking/multi-turn
procedure AssignTask(AgentUserSecurityID: Guid; TaskTitle: Text[150]; ExternalId: Text[2048]; From: Text[250]; Message: Text): Record "Agent Task"

// Overload 3: With attachments
procedure AssignTask(AgentUserSecurityID: Guid; TaskTitle: Text[150]; From: Text[250]; Message: Text; var TempAttachments: Record "Agent Task File"): Record "Agent Task"

// Lifecycle
procedure Deactivate(AgentUserSecurityID: Guid)
procedure IsActive(AgentUserSecurityID: Guid): Boolean
```

**Implementation pattern** (Internal codeunit):
```al
local procedure AssignTaskInternal(AgentUserSecurityID: Guid; TaskTitle: Text[150]; ExternalId: Text[2048]; From: Text[250]; Message: Text; var TempAttachments: Record "Agent Task File" temporary): Record "Agent Task"
var
    AgentTaskBuilder: Codeunit "Agent Task Builder";
begin
    AgentTaskBuilder := AgentTaskBuilder
        .Initialize(AgentUserSecurityID, TaskTitle)
        .AddTaskMessage(From, Message);

    if ExternalId <> '' then
        AgentTaskBuilder.SetExternalId(ExternalId);

    if TempAttachments.FindSet() then
        repeat
            AgentTaskBuilder.GetTaskMessageBuilder().AddAttachment(TempAttachments);
        until TempAttachments.Next() = 0;

    exit(AgentTaskBuilder.Create());
end;
```

### Pattern B: Page Action (User-Initiated)

**When**: A user clicks a button on a page to send work to an agent.

**Flow**: `AgentSetup.OpenAgentLookup()` → user picks agent → `PublicAPI.AssignTask()` → confirmation.

**Key code**:
```al
trigger OnAction()
var
    AgentSetup: Codeunit "Agent Setup";
    MyAgentAPI: Codeunit "{Agent} Public API";
    AgentUserSecurityId: Guid;
begin
    if not AgentSetup.OpenAgentLookup(
        Enum::"Agent Metadata Provider"::"{Agent}", AgentUserSecurityId) then
        exit;

    MyAgentAPI.AssignTask(
        AgentUserSecurityId,
        CopyStr(StrSubstNo('Process: %1', Rec.Name), 1, 150),
        CopyStr(UserId(), 1, 250),
        StrSubstNo('Please process customer %1 (No. %2).', Rec.Name, Rec."No."));
end;
```

### Pattern C: Business Event (Automated)

**When**: A business event (posting, releasing, approval) should automatically trigger an agent task.

**Critical rules**:
- **ALWAYS** wrap in `[TryFunction]` — never block the business event
- **ALWAYS** filter by business condition BEFORE creating tasks
- **ALWAYS** log failures via `Session.LogMessage` for telemetry

**Flow**: EventSubscriber → condition check → TryFunction → Agent Task Builder.

**Key code**:
```al
[EventSubscriber(ObjectType::Codeunit, Codeunit::"Release Sales Document", OnBeforeReleaseSalesDoc, '', false, false)]
local procedure OnBeforeRelease(var SalesHeader: Record "Sales Header")
begin
    if SalesHeader."Document Type" <> SalesHeader."Document Type"::Order then exit;
    if not MeetsCondition(SalesHeader) then exit;
    if not TryCreateTask(SalesHeader) then
        LogFailure(SalesHeader."No.", GetLastErrorText());
end;

[TryFunction]
local procedure TryCreateTask(var SalesHeader: Record "Sales Header")
var
    AgentTaskMsgBuilder: Codeunit "Agent Task Message Builder";
    AgentTaskBuilder: Codeunit "Agent Task Builder";
begin
    AgentTaskMsgBuilder.Initialize('System', BuildMessage(SalesHeader));
    AgentTaskMsgBuilder.SetSkipMessageSanitization(true);

    AgentTaskBuilder
        .Initialize(GetAgentSecurityId(), 'Validate SO ' + SalesHeader."No.")
        .SetExternalId('SO-' + SalesHeader."No.")
        .AddTaskMessage(AgentTaskMsgBuilder)
        .Create();
end;
```

### Pattern D: Attachment Task

**When**: The agent needs to process files (PDFs, images, CSVs).

**Key**: Use `AgentTaskBuilder.GetTaskMessageBuilder().AddAttachment()` in a loop over temporary `Agent Task File` records. Combine with any other pattern (A, B, or C).

### Pattern E: Multi-Turn Conversation

**When**: You need to continue an existing task with follow-up messages.

**Flow**: `GetTaskByExternalId()` → build follow-up message → `AddToTask()` → `SetStatusToReady()`.

**Key code**:
```al
var
    AgentTaskRecord: Record "Agent Task";
    AgentTaskCU: Codeunit "Agent Task";
    AgentTaskMsgBuilder: Codeunit "Agent Task Message Builder";
begin
    AgentTaskRecord := AgentTaskCU.GetTaskByExternalId(AgentSecurityId, ExternalId);

    AgentTaskMsgBuilder.Initialize('User', FollowUpText);
    AgentTaskMsgBuilder.SetRequiresReview(true);
    AgentTaskMsgBuilder.AddToTask(AgentTaskRecord);

    if AgentTaskCU.CanSetStatusToReady(AgentTaskRecord) then
        AgentTaskCU.SetStatusToReady(AgentTaskRecord);
end;
```

### Pattern F: Lifecycle Management

**When**: Monitor, restart, or stop agent tasks programmatically.

**Key methods**: `Agent.IsActive(Guid)`, `Agent.Deactivate(Guid)`, `AgentTask.CanSetStatusToReady()`, `AgentTask.SetStatusToReady()`.

### Pattern G: Agent Session Detection

**When**: Run AL code ONLY when executing inside an agent's session (not in normal user context).

**Key code**:
```al
var
    AgentSession: Codeunit "Agent Session";
    Provider: Enum "Agent Metadata Provider";
begin
    // Detect ANY agent session:
    if not AgentSession.IsAgentSession(Provider) then exit;

    // Or check SPECIFIC agent:
    if not AgentSession.IsAgentSession(Enum::"Agent Metadata Provider"::"{Agent}") then exit;
end;
```

### Pattern H: Agent Session Event Binding

**When**: You need event subscribers that are active ONLY during an agent task (performance optimization — avoids running subscribers in normal user sessions).

**Architecture**: SingleInstance codeunit + BindSubscription on System Initialization.

**Key code**:
```al
codeunit {id} "{Agent} Session Events"
{
    Access = Internal;
    SingleInstance = true;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"System Initialization", OnAfterInitialization, '', false, false)]
    local procedure OnInit()
    var
        AgentSession: Codeunit "Agent Session";
        Provider: Enum "Agent Metadata Provider";
    begin
        if not AgentSession.IsAgentSession(Provider::"{Agent}") then exit;
        GlobalEvents.SetAgentTaskID(AgentSession.GetCurrentSessionAgentTaskId());
        if BindSubscription(GlobalEvents) then;
    end;

    var
        GlobalEvents: Codeunit "{Agent} Events";
}
```

## Pattern Selection Guide

| Situation                                  | Pattern(s)       |
| ------------------------------------------ | ---------------- |
| Standard reusable task creation            | A (Public API)   |
| User clicks button to assign work         | B → A            |
| Business event triggers agent              | C → A            |
| Agent processes uploaded files             | D + (A, B, or C) |
| Follow-up on existing task                 | E                |
| Monitor/restart/stop tasks                 | F                |
| Code runs only in agent context            | G                |
| Performance: subscribers only during tasks | H                |

## Rules (Non-Negotiable)

1. **Public API is the standard entry point** — all other patterns should call through it
2. **TryFunction for event-driven creation** — never block posting, releasing, or approval
3. **Filter before creating** — always check business conditions before task creation
4. **Log failures to telemetry** — `Session.LogMessage` with category and error text
5. **Include ALL relevant context in the message** — the agent only knows what you tell it
6. **Use Agent Task Message Builder** for attachments and sanitization control
7. **ExternalId format convention** — use a prefix pattern like `SO-{No.}`, `LEAD-{No.}` for traceability
