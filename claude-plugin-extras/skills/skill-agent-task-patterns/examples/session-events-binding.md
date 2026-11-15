// Pattern H: Agent session event binding.
// Performance optimization — event subscribers active only during agent task execution.
// Two codeunits: the binder (SingleInstance) + the actual events container.

codeunit 52120 "My Agent Session Binder"
{
    Access = Internal;
    SingleInstance = true;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"System Initialization",
                     OnAfterInitialization, '', false, false)]
    local procedure OnAfterInit()
    var
        AgentSession: Codeunit "Agent Session";
    begin
        if not AgentSession.IsAgentSession(
            Enum::"Agent Metadata Provider"::"My Agent") then
            exit;

        // Capture task context for the entire agent session
        AgentEvents.SetAgentTaskID(AgentSession.GetCurrentSessionAgentTaskId());

        // Bind only inside the agent session — subscribers above this point fire normally,
        // subscribers inside AgentEvents only fire while the agent is running.
        if BindSubscription(AgentEvents) then;
    end;

    var
        AgentEvents: Codeunit "My Agent Events";
}

codeunit 52121 "My Agent Events"
{
    Access = Internal;
    EventSubscriberInstance = Manual; // critical — bound dynamically by the binder

    procedure SetAgentTaskID(NewAgentTaskId: Guid)
    begin
        AgentTaskId := NewAgentTaskId;
    end;

    [EventSubscriber(ObjectType::Page, Page::"Customer Card",
                     OnAfterValidateEvent, 'Credit Limit (LCY)', false, false)]
    local procedure OnCustomerCreditLimitChanged(var Rec: Record Customer)
    begin
        // This subscriber only fires while an agent is running.
        // Use AgentTaskId for telemetry / audit / cross-page context.
        Session.LogMessage(
            'MYAGENT-CTX',
            StrSubstNo('Agent task %1 changed credit limit on customer %2',
                       AgentTaskId, Rec."No."),
            Verbosity::Verbose,
            DataClassification::SystemMetadata,
            TelemetryScope::ExtensionPublisher,
            'Category', 'MyAgent');
    end;

    var
        AgentTaskId: Guid;
}
