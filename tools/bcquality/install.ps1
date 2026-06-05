<#
.SYNOPSIS
    Set up the BCQuality knowledge base for an ALDC test repo (Windows/PowerShell).

.DESCRIPTION
    PowerShell-native equivalent of install.sh. BCQuality is consumed from OUTSIDE
    the AL project (Option B / multi-root): this clones it to a sibling folder so
    its example .al files never enter your extension's compilation, then you open
    `aldc.code-workspace` to get it as a second workspace root the agents can read.

    Run from the ROOT of the repo/folder you want to run the review/audit test on:

        powershell -ExecutionPolicy Bypass -File tools\bcquality\install.ps1

    Override the location with the BCQUALITY_HOME environment variable.
#>
[CmdletBinding()]
param()

# Native git writes progress/notices to stderr; under 'Stop' PowerShell 5 turns
# that into a terminating error even when git exits 0. Use 'Continue' and gate on
# $LASTEXITCODE explicitly.
$ErrorActionPreference = 'Continue'

# --- Pin: keep in sync with aldc.yaml (external.bcquality.pinnedCommit) ---
$BcqualityUrl = 'https://github.com/javiarmesto/bcquality.git'
$BcqualityPin = '07efef6bc719f32c7dded1b2e00d1d12080a2830'

# External knowledge-base location. Default: sibling of this repo, matching the
# `../bcquality` root in aldc.code-workspace. MUST stay OUTSIDE the AL project.
$BcqualityHome = if ($env:BCQUALITY_HOME) { $env:BCQUALITY_HOME } else { '../bcquality' }

function Say  ($m) { Write-Host "==> $m" -ForegroundColor Cyan }
function Warn ($m) { Write-Host "[!] $m"  -ForegroundColor Yellow }
function Die  ($m) { Write-Host "[x] $m"  -ForegroundColor Red; exit 1 }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Die 'git is required but was not found on PATH.'
}

if (-not (Test-Path 'aldc.yaml') -and -not (Test-Path '.github')) {
    Warn 'No aldc.yaml or .github\ here - make sure you run this from the ROOT of your test repo.'
}

# Guard: never let the knowledge base land inside the AL project.
if (-not ($BcqualityHome -match '^([A-Za-z]:[\\/]|/|\.\.[\\/])')) {
    Warn "BCQUALITY_HOME ('$BcqualityHome') looks like it is INSIDE the project. Its .al examples will pollute your build. Use a path outside the AL project (e.g. ..\bcquality)."
}

if (Test-Path (Join-Path $BcqualityHome '.git')) {
    Say "$BcqualityHome exists; fetching and pinning to $BcqualityPin"
    git -C $BcqualityHome fetch origin
    git -C $BcqualityHome checkout --quiet $BcqualityPin
    if ($LASTEXITCODE -ne 0) { Die "Could not checkout $BcqualityPin inside $BcqualityHome." }
}
else {
    Say "Cloning BCQuality into $BcqualityHome (outside the AL project)"
    git clone $BcqualityUrl $BcqualityHome
    if ($LASTEXITCODE -ne 0) { Die 'git clone failed.' }
    git -C $BcqualityHome checkout --quiet $BcqualityPin
    if ($LASTEXITCODE -ne 0) { Die "Could not checkout $BcqualityPin inside $BcqualityHome." }
}

$entry = Join-Path $BcqualityHome 'skills\entry.md'
if (-not (Test-Path $entry)) {
    Die "Finished, but $entry is missing - the agents won't find the contract."
}

$actualPin = (git -C $BcqualityHome rev-parse HEAD).Trim()
Say "BCQuality ready at $BcqualityHome (HEAD = $actualPin)"

if (Test-Path 'aldc.yaml') {
    if (Select-String -Path 'aldc.yaml' -SimpleMatch -Pattern $BcqualityPin -Quiet) {
        Say 'aldc.yaml pin matches.'
    } else {
        Warn "aldc.yaml does not mention $BcqualityPin - align the pin to keep the evidence validator happy."
    }
}

Say "Done. Open 'aldc.code-workspace' in VS Code - BCQuality appears as a second"
Say "root the agents can read, while staying OUT of your extension's compilation."
