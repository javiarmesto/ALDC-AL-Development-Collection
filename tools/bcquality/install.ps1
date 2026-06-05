<#
.SYNOPSIS
    Set up the BCQuality knowledge base for an ALDC workspace (Windows/PowerShell).

.DESCRIPTION
    PowerShell-native equivalent of install.sh. BCQuality is consumed from OUTSIDE
    the AL project (multi-root): this clones it to a sibling folder so its example
    .al files never enter your extension's compilation, then you open
    `aldc.code-workspace` to get it as a second workspace root the agents can read.

    The source is CONFIGURABLE via aldc.yaml (external.bcquality): `url`, `ref` and
    optional `pinnedCommit`. Defaults to the canonical upstream (microsoft/BCQuality);
    point `url` at your own fork to use it instead.

    Run from the ROOT of the repo/folder you run the review/audit on:

        powershell -ExecutionPolicy Bypass -File tools\bcquality\install.ps1

    Override the location with the BCQUALITY_HOME environment variable.
#>
[CmdletBinding()]
param()

# Native git writes progress/notices to stderr; under 'Stop' PowerShell 5 turns
# that into a terminating error even when git exits 0. Use 'Continue' and gate on
# $LASTEXITCODE explicitly.
$ErrorActionPreference = 'Continue'

$AldcFile = 'aldc.yaml'

# --- Defaults (used when aldc.yaml is absent or a key is unset) ---
$BcqualityUrl = 'https://github.com/microsoft/BCQuality.git'
$BcqualityRef = 'main'
$BcqualityPin = ''

# Read a scalar key from aldc.yaml (single source of truth). First match wins.
function Read-Aldc($key) {
    if (-not (Test-Path $AldcFile)) { return '' }
    $line = Select-String -Path $AldcFile -Pattern ("^\s*" + $key + ":") | Select-Object -First 1
    if (-not $line) { return '' }
    $m = [regex]::Match($line.Line, ($key + ':\s*"?([^"#]*)"?'))
    if ($m.Success) { return $m.Groups[1].Value.Trim() }
    return ''
}
if (Test-Path $AldcFile) {
    $u = Read-Aldc 'url';          if ($u) { $BcqualityUrl = $u }
    $r = Read-Aldc 'ref';          if ($r) { $BcqualityRef = $r }
    $p = Read-Aldc 'pinnedCommit'; if ($p) { $BcqualityPin = $p }
}

# What to check out: the pin if set, otherwise the tracking ref (branch/tag).
$Target = if ($BcqualityPin) { $BcqualityPin } else { $BcqualityRef }

# External knowledge-base location. Default: sibling of this repo, matching the
# `../bcquality` root in aldc.code-workspace. MUST stay OUTSIDE the AL project.
$BcqualityHome = if ($env:BCQUALITY_HOME) { $env:BCQUALITY_HOME } else { '../bcquality' }

function Say  ($m) { Write-Host "==> $m" -ForegroundColor Cyan }
function Warn ($m) { Write-Host "[!] $m"  -ForegroundColor Yellow }
function Die  ($m) { Write-Host "[x] $m"  -ForegroundColor Red; exit 1 }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Die 'git is required but was not found on PATH.'
}

if (-not (Test-Path $AldcFile) -and -not (Test-Path '.github')) {
    Warn 'No aldc.yaml or .github\ here - make sure you run this from the ROOT of your repo.'
}

# Guard: never let the knowledge base land inside the AL project.
if (-not ($BcqualityHome -match '^([A-Za-z]:[\\/]|/|\.\.[\\/])')) {
    Warn "BCQUALITY_HOME ('$BcqualityHome') looks like it is INSIDE the project. Its .al examples will pollute your build. Use a path outside the AL project (e.g. ..\bcquality)."
}

if (Test-Path (Join-Path $BcqualityHome '.git')) {
    Say "$BcqualityHome exists; fetching and checking out $Target"
    git -C $BcqualityHome fetch origin --tags --prune
    git -C $BcqualityHome checkout --quiet $Target
    if ($LASTEXITCODE -ne 0) { Die "Could not checkout '$Target' inside $BcqualityHome." }
}
else {
    Say "Cloning BCQuality ($BcqualityUrl) into $BcqualityHome (outside the AL project)"
    git clone $BcqualityUrl $BcqualityHome
    if ($LASTEXITCODE -ne 0) { Die 'git clone failed.' }
    git -C $BcqualityHome checkout --quiet $Target
    if ($LASTEXITCODE -ne 0) { Die "Could not checkout '$Target' inside $BcqualityHome." }
}

$entry = Join-Path $BcqualityHome 'skills\entry.md'
if (-not (Test-Path $entry)) {
    Die "Finished, but $entry is missing - the agents won't find the contract."
}

$actual = (git -C $BcqualityHome rev-parse HEAD).Trim()
Say "BCQuality ready at $BcqualityHome (HEAD = $actual)"

if ($BcqualityPin) {
    Say "Pinned to $BcqualityPin (aldc.yaml)."
} else {
    Warn "No pinnedCommit in aldc.yaml - tracking '$BcqualityRef'. Set external.bcquality.pinnedCommit to a 40-hex SHA for reproducible, evidence-validated runs."
}

Say "Done. Open 'aldc.code-workspace' in VS Code - BCQuality appears as a second"
Say "root the agents can read, while staying OUT of your extension's compilation."
