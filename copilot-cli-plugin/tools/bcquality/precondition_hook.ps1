# Compatibility notice only; never probes or runs a provider.
param([ValidateSet('SessionStart','SubagentStart')][string]$Event = 'SessionStart')
if (-not (Test-Path -LiteralPath 'aldc.yaml' -PathType Leaf)) { exit 0 }
@{ hookSpecificOutput = @{
    hookEventName = $Event
    additionalContext = 'For an authorized review, read the packaged docs/templates/bcquality-provider-contract.md and current project external.bcquality configuration. Disabled means no probe. Select plugin or external-multiroot explicitly. Discovery, loading, execution and index generation need separate observations. This hook has not probed any provider; keep native coverage until completed results establish coverage.'
} } | ConvertTo-Json -Compress
