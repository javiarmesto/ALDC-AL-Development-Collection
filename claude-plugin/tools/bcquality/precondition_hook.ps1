<#
.SYNOPSIS
    BCQuality precondition hook (PowerShell) — Windows-native equivalent of
    precondition_hook.sh.

.DESCRIPTION
    Detects whether the external BCQuality clone is mounted and INJECTS a
    directive into the agent session via additionalContext. Single source of the
    "what to do about BCQuality" rule (Layer 2). Reads aldc.yaml for home +
    entryPoint (override: $env:BCQUALITY_HOME). Emits the Copilot hook output
    contract on stdout. Messages avoid " and \ so plain interpolation is valid JSON.

    NOTE (Preview): verify event-key casing / config props against your VS Code
    Copilot hook version.
#>
param([string]$Event = 'SessionStart')

$ErrorActionPreference = 'Continue'
$aldc = 'aldc.yaml'

$home  = '../bcquality'
$entry = 'skills/entry.md'
if (Test-Path $aldc) {
    $h = (Select-String -Path $aldc -Pattern '^\s*home:\s*"?([^"#]+)"?' -AllMatches |
          Select-Object -First 1).Matches.Groups[1].Value
    $e = (Select-String -Path $aldc -Pattern '^\s*entryPoint:\s*"?([^"#]+)"?' -AllMatches |
          Select-Object -First 1).Matches.Groups[1].Value
    if ($h) { $home  = $h.Trim() }
    if ($e) { $entry = $e.Trim() }
}
if ($env:BCQUALITY_HOME) { $home = $env:BCQUALITY_HOME }
$entrypath = Join-Path $home $entry

function Emit($text) {
    # $text must be free of " and \ (kept that way below) so this stays valid JSON.
    Write-Output ('{"hookSpecificOutput":{"hookEventName":"' + $Event + '","additionalContext":"' + $text + '"}}')
}

if (Test-Path $entrypath) {
    $sha = (git -C $home rev-parse --short HEAD 2>$null)
    if (-not $sha) { $sha = 'unknown' }
    Emit "BCQuality is PRESENT at $home (SHA $sha). Treat it as the citation source of truth for review/audit: read $entry and follow its entry then read then do dispatch; record the SHA in your report."
}
else {
    Emit "BCQuality is ABSENT (no $entrypath). Apply the BCQuality precondition: set bcquality.outcome to not-applicable, skip the BCQuality consultation, and review natively via the FULL A-G checklist (reactivate B Naming via al-naming-conventions, D Performance via al-performance plus skill-performance, E Error-handling via al-error-handling, and the commit-in-subscriber part of A via al-events; permissions via skill-permissions). Cap confidence at medium; secrets and security have no native check. NEVER block or fail the review for the missing layer. This is the pre-BCQuality ALDC review, not a stub."
}
