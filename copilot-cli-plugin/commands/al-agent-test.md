---
description: 'Generate comprehensive test codeunits for Business Central Agent SDK integrations. Covers 6 categories: Registration, Factory, Metadata, TaskExecution, TaskIntegration, AgentSession. ALDC workflow (Copilot prompt al-agent.test); invoke explicitly.'
disable-model-invocation: true
---

> **Copilot CLI adapter — generated; do not edit this distribution.**
> Select a role using /agent or copilot --agent <id>. Role names in this contract
> are routing destinations, never chat mentions or evidence of an invocation.
> Delegate only through the native task tool, using the exact discovered agent ID
> as agent_type (for example al-planning-subagent). Inspect list_agents and the
> actual task schema first. Keep all canonical human gates. Pass bounded context
> inline; wait for completion (read_agent for a background task) before consuming
> the result. A delegated role returns questions to its caller for the human gate.
> If task or the requested custom agent is unavailable in this context, return
> the blocked handoff to the caller/user. Never impersonate a missing subagent,
> silently substitute general-purpose, or launch another CLI process to fake it.
> Tool aliases in frontmatter select capabilities; call the actual tools exposed
> by the host: view, glob, grep/rg, edit/create/apply_patch, bash/powershell,
> web_fetch, task. Use a capability only when granted to this role and available.
> Load domain skills through the host's skill mechanism when exposed, otherwise
> read the complete bundled SKILL.md. A read is not a native skill invocation.
> Resolve PLUGIN_ROOT to this installed agent's plugin directory (not the project
> or original checkout). It is a path placeholder here, not a promised global
> shell variable. Read docs/copilot-cli-al-tooling.md there for LSP/MCP bindings;
> it supersedes older availability examples in the shared terminal contract at
> skills/skill-migrate/references/cli-al-tools.md, never role duties or human gates.
> Project instructions and matching .github/instructions rules remain binding;
> pass the relevant excerpts to delegated roles. Canonical artifacts remain in
> .github/plans/. Role write scopes are behavioral, not filesystem sandboxes.
> AL execution requires a verified terminal command/runner or an actually exposed
> MCP capability. Reuse the configured AL LSP for Agents wrapper through native
> CLI semantic tools when exposed to this role. Inspect the catalog; do not invent
> tool aliases or broaden read-only grants to enable rename/write operations.
> Editor debugger controls remain separate from semantic navigation. Official AL
> MCP selectors use al/<tool>; only Developer/Implementer receive compile/build/
> restore. Discover the actual callable names and pass the correct App/Test path.
> No official publish/authentication tool is granted by this adapter.
> Symbol MCP: before any tools/call, verify AL CLI prerequisites are already
> provisioned; this provider may auto-install AL tools on first use. A read-only
> role must return that prerequisite to the caller, never bootstrap software.
> Load symbols via al_packages(action: load, path: absolute consumer path).
> The MCP process may run from the plugin cache; never assume its cwd is the
> consumer. Use the discovered schema and report missing .app packages explicitly.
> Record missing capabilities and unexecuted checks explicitly; never simulate.


# Workflow: Test Agent SDK Integration

Generates tests for all Agent SDK layers. Interface signatures come from `skill-agent-toolkit`; task pattern verification rules come from `skill-agent-task-patterns`.

**Load skills**: `skill-agent-toolkit` (interface signatures), `skill-agent-task-patterns` (Pattern C/D/H rules for integration tests).

## 6 required test categories

### 1. Registration tests

```al
[Test]
procedure CopilotCapabilityIsRegistered()
var
    CopilotCapability: Codeunit "Copilot Capability";
begin
    Assert.IsTrue(
        CopilotCapability.IsCapabilityRegistered(
            Enum::"Copilot Capability"::"{Agent} Capability"),
        'Copilot capability must be registered on install');
end;

[Test]
procedure AgentMetadataProviderEnumExists()
var
    Provider: Enum "Agent Metadata Provider";
begin
    Provider := Enum::"Agent Metadata Provider"::"{Agent}";
    Assert.AreEqual('{Agent}', Format(Provider), 'Enum must exist');
end;
```

### 2. Factory tests (IAgentFactory)

```al
[Test]
procedure FactoryReturnsSetupPageId()
var
    Factory: Codeunit {Agent}Factory;
begin
    Assert.AreNotEqual(0, Factory.GetFirstTimeSetupPageId(), 'Must return setup page ID');
end;

[Test]
procedure FactoryReturnsDefaultInitials()
var
    Factory: Codeunit {Agent}Factory;
begin
    Assert.AreNotEqual('', Factory.GetDefaultInitials(), 'Must return initials');
end;

[Test]
procedure FactoryReturnsCopilotCapability()
var
    Factory: Codeunit {Agent}Factory;
begin
    Assert.AreEqual(
        Enum::"Copilot Capability"::"{Agent} Capability",
        Factory.GetCopilotCapability(),
        'Must return correct capability');
end;

[Test]
procedure FactoryReturnsDefaultProfile()
var
    Factory: Codeunit {Agent}Factory;
    TempProfile: Record "All Profile" temporary;
begin
    Factory.GetDefaultProfile(TempProfile);
    Assert.RecordIsNotEmpty(TempProfile);
end;

[Test]
procedure FactoryReturnsDefaultPermissions()
var
    Factory: Codeunit {Agent}Factory;
    TempAccess: Record "Access Control Buffer" temporary;
begin
    Factory.GetDefaultAccessControls(TempAccess);
    Assert.RecordIsNotEmpty(TempAccess);
end;
```

### 3. Metadata tests (IAgentMetadata)

```al
[Test]
procedure MetadataReturnsSetupPageId()
var
    Metadata: Codeunit {Agent}Metadata;
    NullGuid: Guid;
begin
    Assert.AreNotEqual(0, Metadata.GetSetupPageId(NullGuid), 'Must return setup page');
end;

[Test]
procedure MetadataReturnsSummaryPageId()
var
    Metadata: Codeunit {Agent}Metadata;
    NullGuid: Guid;
begin
    Assert.AreNotEqual(0, Metadata.GetSummaryPageId(NullGuid), 'Must return summary page');
end;

[Test]
procedure MetadataReturnsMessagePageId()
var
    Metadata: Codeunit {Agent}Metadata;
    NullGuid: Guid;
begin
    Assert.AreNotEqual(0, Metadata.GetAgentTaskMessagePageId(NullGuid, NullGuid), 'Must return message page');
end;
```

### 4. Task Execution tests (IAgentTaskExecution)

```al
[Test]
procedure UserInterventionSuggestionsProvided()
var
    TaskExec: Codeunit {Agent}TaskExecution;
    RequestDetails: Record "Agent User Int Request Details";
    Suggestions: Record "Agent Task User Int Suggestion";
begin
    RequestDetails.Type := RequestDetails.Type::Assistance;
    TaskExec.GetAgentTaskUserInterventionSuggestions(RequestDetails, Suggestions);
    Assert.RecordIsNotEmpty(Suggestions);
end;
```

### 5. Task Integration tests

Apply Pattern C rules from `skill-agent-task-patterns`:

- Task created with correct ExternalId format
- Task NOT created when business condition is false
- Message contains all required context fields
- `[TryFunction]` does not block business events on failure
- Telemetry logged via `Session.LogMessage` on failure

### 6. Agent Session tests

```al
[Test]
procedure AgentSessionNotDetectedInNormalContext()
var
    AgentSession: Codeunit "Agent Session";
    Provider: Enum "Agent Metadata Provider";
begin
    Assert.IsFalse(AgentSession.IsAgentSession(Provider), 'Should not be in agent session');
end;
```

## Coverage matrix

| Category        | Test                     | Status |
| --------------- | ------------------------ | ------ |
| Registration    | CopilotCapability        |        |
| Registration    | EnumExists               |        |
| Factory         | SetupPageId              |        |
| Factory         | DefaultInitials          |        |
| Factory         | CopilotCapability        |        |
| Factory         | DefaultProfile           |        |
| Factory         | DefaultPermissions       |        |
| Factory         | CreationRules            |        |
| Metadata        | SetupPageId              |        |
| Metadata        | SummaryPageId            |        |
| Metadata        | MessagePageId            |        |
| Metadata        | Annotations              |        |
| TaskExecution   | InputValidation          |        |
| TaskExecution   | OutputPostProcess        |        |
| TaskExecution   | Suggestions              |        |
| TaskExecution   | PageContext              |        |
| TaskIntegration | Creation                 |        |
| TaskIntegration | ConditionFilter          |        |
| TaskIntegration | MessageContent           |        |
| TaskIntegration | ErrorHandling            |        |
| AgentSession    | Detection                |        |

## Skills Evidencing

End with:

```
**Skills loaded**: skill-agent-toolkit, skill-agent-task-patterns
**Patterns applied**:
- Interface signatures verified against skill-agent-toolkit
- Pattern C TryFunction + telemetry rules verified in integration tests
```
