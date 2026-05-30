---
applyTo: "**/*Factory.Codeunit.al, **/*Metadata.Codeunit.al, **/*TaskExecution.Codeunit.al, **/*Setup.Codeunit.al"
description: "AL Agent Toolkit / BC Agents Pack — non-negotiable rules for code involving the AI Development Toolkit or Agent SDK"
---

# AL Agent Toolkit — Always-On Rules

Rules that apply whenever AL code related to the AI Development Toolkit or Agent SDK is edited. Rules only. Detailed knowledge (architecture, interface signatures, patterns) lives in skills.

## Knowledge sources

For detailed content, load the corresponding skill:

| Skill                          | When                                                                     |
| ------------------------------ | ------------------------------------------------------------------------ |
| `skill-agent-toolkit`          | SDK architecture, 3 interfaces, Setup Codeunit, ConfigurationDialog, Install/Upgrade, project structure |
| `skill-agent-task-patterns`    | Public API, Agent Task Builder, attachments, multi-turn, session detection, API availability per runtime |
| `skill-agent-instructions`     | Authoring `InstructionsV1.txt` (RGI framework + keywords)                |

## Non-negotiable rules

1. **Public API is the standard entry point** — all task creation goes through a codeunit with `Access = Public`; all other patterns (page action, event subscriber, multi-turn) call through here.
2. **TryFunction mandatory for event-driven task creation** — a posting/release/approval must never be blocked by an agent failure.
3. **Filter before creating** — the business condition is evaluated BEFORE the task builder's `Create()`, never inside it.
4. **Telemetry on every failure** — `Session.LogMessage` with category and `GetLastErrorText()`. No exceptions.
5. **ExternalId with convention `{PREFIX}-{No.}`** — `SO-1001`, `LEAD-001`, `INV-103456`, `EMAIL-{threadId}`. Never a GUID, never a sequential number.
6. **Task message contains ALL the context** — the agent only knows what is passed via the message + attachments.
7. **Agent Task Message Builder** is used for attachments and sanitization control; builder fields are never manipulated via reflection.
8. **Instructions in English** — the runtime safeguards are optimized for English.

## Naming conventions

| Object                       | Pattern                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| Copilot Capability EnumExt   | `"{Agent} Copilot Capability"` extends `"Copilot Capability"` |
| Metadata Provider EnumExt    | `"{Agent} Metadata Provider"` extends `"Agent Metadata Provider"` |
| Factory codeunit             | `{Agent}Factory` implements `IAgentFactory`                 |
| Metadata codeunit            | `{Agent}Metadata` implements `IAgentMetadata`               |
| Task Execution codeunit      | `{Agent}TaskExecution` implements `IAgentTaskExecution`     |
| Setup codeunit               | `"{Agent} Setup"` — centralized logic                       |
| Install codeunit             | `"{Agent} Install"` (Subtype = Install)                     |
| Upgrade codeunit             | `"{Agent} Upgrade"` (Subtype = Upgrade)                     |
| Public API codeunit          | `"{Agent} Public API"` (Access = Public) + Impl internal    |
| Setup table                  | `"{Agent} Setup"` (PK = `"User Security ID": Guid`)         |
| KPI table / page             | `"{Agent} KPI"` / CardPart                                  |
| Setup page                   | `"{Agent} Setup"` (PageType = ConfigurationDialog)          |
| Profile / RoleCenter         | `"{Agent} Profile"` / `"{Agent} Role Center"`               |
| PermissionSet                | `"{Agent}"` (Assignable, includes D365 BASIC)               |

## ConfigurationDialog page — invariants

`PageType = ConfigurationDialog` requires:

- `SourceTableTemporary = true`
- `Extensible = false`
- `InherentEntitlements = X` + `InherentPermissions = X`
- First layout element: `part(AgentSetupPart; "Agent Setup Part")`
- `OnOpenPage` checks `AzureOpenAI.IsEnabled(<capability>)`
- `OnQueryClosePage` delegates to the Setup Codeunit
- System actions: `OK` (gated by `IsUpdated`) + `Cancel`, no custom triggers

## Project structure (reference)

```
app/
├── .resources/Instructions/InstructionsV1.txt
├── Example/        (PageExt + PublicAPI + Impl)
├── Integration/    (CopilotCapability EnumExt + Install + Upgrade)
└── Setup/
    ├── {Agent}Setup.{Codeunit,Page,Table}.al
    ├── KPI/
    ├── Metadata/   (Factory + Metadata + MetadataProvider EnumExt)
    ├── Permissions/
    ├── Profile/    (Profile + RoleCenter + PageCustomizations)
    └── TaskExecution/
```

Details on each folder and complete examples in `skill-agent-toolkit`.
