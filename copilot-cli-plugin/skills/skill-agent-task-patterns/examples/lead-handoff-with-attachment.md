// Pattern D + C combined: Business event triggers agent task with attachment.
// Rescued from al-agent-toolkit.instructions.md — the canonical end-to-end example
// for hot-lead handoff to the Quote Builder agent.

procedure HandoffLeadToQuoteBuilder(var Lead: Record Lead; var EstimateBlob: Codeunit "Temp Blob")
var
    AgentTaskBuilder: Codeunit "Agent Task Builder";
    AgentTaskMsgBuilder: Codeunit "Agent Task Message Builder";
    ContentStream: InStream;
    QBSetup: Record "QB Agent Setup";
    MessageText: Text;
begin
    // 1. Validate prerequisites BEFORE doing anything
    if not QBSetup.FindFirst() then
        Error('Quote Builder agent not configured.');
    if IsNullGuid(QBSetup."User Security ID") then
        Error('Quote Builder agent Security ID missing.');

    // 2. Build the message with full lead context
    MessageText := BuildHandoffMessage(Lead);
    AgentTaskMsgBuilder.Initialize(CopyStr(UserId(), 1, 250), MessageText);

    // 3. Attach the estimate PDF if present
    if EstimateBlob.HasValue() then begin
        EstimateBlob.CreateInStream(ContentStream);
        AgentTaskMsgBuilder.AddAttachment(
            CopyStr('Lead_' + Lead."No." + '_Estimate.pdf', 1, 250),
            'application/pdf',
            ContentStream);
    end;

    // 4. Build and create the task
    AgentTaskBuilder := AgentTaskBuilder
        .Initialize(
            QBSetup."User Security ID",
            CopyStr('Convert Hot Lead ' + Lead."No." + ' to Quote', 1, 150))
        .SetExternalId('LEAD-' + Lead."No.")
        .AddTaskMessage(AgentTaskMsgBuilder);

    AgentTaskBuilder.Create();

    // 5. Persist handoff ID for traceability
    Lead."BCA2A Handoff ID" := 'QB-' + Lead."No.";
    Lead.Modify(false);

    // 6. Telemetry — never silent
    Session.LogMessage(
        'BCA2A-HANDOFF',
        StrSubstNo('Lead %1 handed off to QB', Lead."No."),
        Verbosity::Normal,
        DataClassification::SystemMetadata,
        TelemetryScope::ExtensionPublisher,
        'Category', 'BCA2A');
end;
