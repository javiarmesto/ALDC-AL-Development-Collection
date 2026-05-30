---
agent: agent
tools: [vscode/memory, vscode/askQuestions, edit/editFiles, search/codebase, 'microsoft-docs/*', 'microsoft/markitdown/*', 'al-symbols-mcp/*', ms-dynamics-smb.al/al_symbolsearch, ms-dynamics-smb.al/al_symbolrelations, sshadowsdk.al-lsp-for-agents/bclsp_goToDefinition, sshadowsdk.al-lsp-for-agents/bclsp_hover, sshadowsdk.al-lsp-for-agents/bclsp_findReferences, sshadowsdk.al-lsp-for-agents/bclsp_prepareCallHierarchy, sshadowsdk.al-lsp-for-agents/bclsp_incomingCalls, sshadowsdk.al-lsp-for-agents/bclsp_outgoingCalls, sshadowsdk.al-lsp-for-agents/bclsp_codeLens, sshadowsdk.al-lsp-for-agents/bclsp_codeQualityDiagnostics, sshadowsdk.al-lsp-for-agents/bclsp_documentSymbols, sshadowsdk.al-lsp-for-agents/bclsp_renameSymbol, todo]
description: "Generate comprehensive test codeunits for Business Central Agent SDK integrations. Covers 6 categories: Registration, Factory, Metadata, TaskExecution, TaskIntegration, AgentSession."
---

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
