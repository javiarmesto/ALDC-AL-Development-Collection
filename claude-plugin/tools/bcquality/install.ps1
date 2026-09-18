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

# Shared YAML normalization; plugin/disabled modes stop before any git operation.
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node is required to read BCQuality configuration; no provider operation performed.' }
$ConfigJson = & node (Join-Path $PSScriptRoot 'config.js') (Get-Location).Path
if ($LASTEXITCODE -ne 0) { throw 'BCQuality configuration could not be read; no provider operation performed.' }
$BcqualityConfig = (($ConfigJson -join "`n") | ConvertFrom-Json).bcquality
if ($BcqualityConfig.enabled -eq $false) {
    Write-Host 'BCQuality disabled; no clone or plugin operation performed.'
    exit 0
}
if ($BcqualityConfig.mode -eq 'plugin') {
    Write-Host 'BCQuality plugin mode: install/load through your host. No clone, discovery or execution performed.'
    exit 0
}
$BcqualityUrl = $BcqualityConfig.url
$BcqualityRef = $BcqualityConfig.ref
$BcqualityPin = $BcqualityConfig.pinnedCommit

# What to check out: the pin if set, otherwise the tracking ref (branch/tag).
$Target = if ($BcqualityPin) { $BcqualityPin } else { $BcqualityRef }

# External knowledge-base location. Default: sibling of this repo, matching the
# `../bcquality` root in aldc.code-workspace. MUST stay OUTSIDE the AL project.
$BcqualityHome = if ($env:BCQUALITY_HOME) { $env:BCQUALITY_HOME } else { $BcqualityConfig.home }

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

# --- Knowledge index (best-effort accelerator) ---------------------------------
# BCQuality's Entry preparation step rebuilds this over the live clone. Building it
# here, right after a pinned checkout, means every read-only reviewer finds a fresh
# index without needing a shell. Never fatal: READ falls back to path discovery.
#
# The generator dot-sources Knowledge-Retrieval.ps1, which uses
# `ConvertFrom-Json -AsHashtable` (PowerShell 7 only). This installer may be running
# under Windows PowerShell 5, so the generator is always launched through `pwsh`.
$generator = Join-Path $BcqualityHome 'tools/Build-KnowledgeIndex.ps1'
$indexPath = Join-Path $BcqualityHome 'knowledge-index.json'
$receipt   = Join-Path (Get-Location).Path '.github/aldc-bcquality-index.json'
$pwsh      = Get-Command pwsh -ErrorAction SilentlyContinue
if (-not $pwsh) {
    Warn 'PowerShell 7 (pwsh) not found; skipping the knowledge index. Reviewers will use path-based discovery.'
} elseif (-not (Test-Path $generator)) {
    Warn "Generator not found at $generator; skipping the knowledge index."
} else {
    # Remove any stale index first, so a failed build can never leave an old file
    # that looks fresh. `pwsh` is a native executable, so $LASTEXITCODE is reliable.
    Remove-Item -LiteralPath $indexPath -ErrorAction SilentlyContinue
    & $pwsh.Source -NoProfile -File $generator -BCQualityRoot (Resolve-Path $BcqualityHome).Path
    if ($LASTEXITCODE -eq 0 -and (Test-Path $indexPath)) {
        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $indexPath).Hash.ToLower()
        New-Item -ItemType Directory -Force -Path (Split-Path $receipt) | Out-Null
        $json = [ordered]@{
            status      = 'prebuilt'
            indexPath   = $indexPath
            indexSha256 = $hash
            corpusSha   = $actual
            generatedAt = (Get-Date).ToUniversalTime().ToString('o')
            generator   = 'tools/Build-KnowledgeIndex.ps1'
        } | ConvertTo-Json
        # UTF-8 WITHOUT BOM. Windows PowerShell's `-Encoding utf8` writes a BOM and
        # Node's JSON.parse rejects it, which would make the receipt unreadable.
        [IO.File]::WriteAllText($receipt, $json, [Text.UTF8Encoding]::new($false))
        Say "Knowledge index built (sha256 $($hash.Substring(0,12))...)."
    } else {
        Warn 'Knowledge index build failed; reviewers will use path-based discovery.'
    }
}

if ($BcqualityPin) {
    Say "Pinned to $BcqualityPin (aldc.yaml)."
} else {
    Warn "No pinnedCommit in aldc.yaml - tracking '$BcqualityRef'. Set external.bcquality.pinnedCommit to a 40-hex SHA for reproducible, evidence-validated runs."
}

Say "Done. Open 'aldc.code-workspace' in VS Code - BCQuality appears as a second"
Say "root the agents can read, while staying OUT of your extension's compilation."
