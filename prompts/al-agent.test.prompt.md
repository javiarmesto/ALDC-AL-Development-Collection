---
agent: agent
tools: ["codebase", "editFiles"]
description: "Generate comprehensive test codeunits for Business Central Agent SDK integrations. Covers 6 categories with correct interface signatures."
---

# Workflow: Test Agent SDK Integration

You are an expert AL test developer. Generate tests for all Agent SDK layers.

## 6 Required Test Categories

### 1. Registration Tests

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

### 2. Factory Tests (IAgentFactory)

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

### 3. Metadata Tests (IAgentMetadata)

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

### 4. Task Execution Tests (IAgentTaskExecution)

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

### 5. Task Integration Tests

- Task created with correct External ID format
- Task NOT created when business condition is false
- Message contains all required context fields
- TryFunction does not block business events on failure

### 6. Agent Session Tests

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

## Coverage Matrix

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
| TaskExecution   | PageContext               |        |
| TaskIntegration | Creation                 |        |
| TaskIntegration | ConditionFilter          |        |
| TaskIntegration | MessageContent           |        |
| TaskIntegration | ErrorHandling            |        |
| AgentSession    | Detection                |        |
