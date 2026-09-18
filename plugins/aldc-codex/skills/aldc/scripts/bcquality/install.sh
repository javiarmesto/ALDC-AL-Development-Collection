#!/usr/bin/env bash
#
# install.sh - set up the BCQuality knowledge base for an ALDC workspace.
#
# BCQuality is consumed from OUTSIDE the AL project (multi-root): this clones it to
# a sibling folder so its example .al files never enter your extension's compilation,
# then you open `aldc.code-workspace` to get it as a second workspace root the agents
# can read. Run this from the ROOT of the repo/folder you run the review/audit on.
#
# The source is CONFIGURABLE via aldc.yaml (external.bcquality): `url`, `ref` and
# optional `pinnedCommit`. Defaults to the canonical upstream (microsoft/BCQuality);
# point `url` at your own fork to use it instead.
#
#   bash install.sh
#   BCQUALITY_HOME=/some/other/path bash install.sh   # custom location
#
set -euo pipefail

ALDC_FILE="aldc.yaml"

# Use the shared YAML reader; never regex-match unrelated provider keys.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_JSON="$(node "$SCRIPT_DIR/config.js" "$PWD")"
read_config() { printf '%s' "$CONFIG_JSON" | node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>process.stdout.write(String(JSON.parse(s).bcquality[process.argv[1]])))' "$1"; }
if [ "$(read_config enabled)" = "false" ]; then
  printf '%s\n' 'BCQuality disabled; no clone or plugin operation performed.'
  exit 0
fi
if [ "$(read_config mode)" = "plugin" ]; then
  printf '%s\n' 'BCQuality plugin mode: install/load the configured plugin through your host. This multiroot installer performs no clone, discovery or execution.'
  exit 0
fi
BCQUALITY_URL="$(read_config url)"
BCQUALITY_REF="$(read_config ref)"
BCQUALITY_PIN="$(read_config pinnedCommit)"

# What to check out: the pin if set, otherwise the tracking ref (branch/tag).
TARGET="${BCQUALITY_PIN:-$BCQUALITY_REF}"

# Where the external knowledge base lives. Default: sibling of this repo, which
# matches the `../bcquality` root in aldc.code-workspace. MUST stay OUTSIDE the
# AL project so the AL compiler never sees its .al files.
BCQUALITY_HOME="${BCQUALITY_HOME:-$(read_config home)}"

say()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "git is required but was not found on PATH."

# --- Sanity: does this look like the root of an ALDC workspace? ---
if [ ! -f "$ALDC_FILE" ] && [ ! -d ".github" ]; then
  warn "No aldc.yaml or .github/ here - make sure you run this from the ROOT of your repo."
fi

# --- Guard: never let the knowledge base land inside the AL project ---
case "$BCQUALITY_HOME" in
  /*) : ;;                       # absolute path - fine
  ../*) : ;;                     # sibling/outside - fine
  *) warn "BCQUALITY_HOME ('$BCQUALITY_HOME') looks like it is INSIDE the project. Its .al examples will pollute your build. Use a path outside the AL project (e.g. ../bcquality)." ;;
esac

if [ -d "$BCQUALITY_HOME/.git" ]; then
  # --- Already cloned -> fetch + check out TARGET ---
  say "$BCQUALITY_HOME exists; fetching and checking out $TARGET"
  git -C "$BCQUALITY_HOME" fetch origin --tags --prune
  git -C "$BCQUALITY_HOME" checkout --quiet "$TARGET" \
    || die "Could not checkout '$TARGET' inside $BCQUALITY_HOME."
else
  # --- Fresh clone + check out TARGET (a plain clone, NOT a submodule of this repo) ---
  say "Cloning BCQuality ($BCQUALITY_URL) into $BCQUALITY_HOME (outside the AL project)"
  git clone "$BCQUALITY_URL" "$BCQUALITY_HOME" || die "git clone failed."
  git -C "$BCQUALITY_HOME" checkout --quiet "$TARGET" \
    || die "Could not checkout '$TARGET' inside $BCQUALITY_HOME."
fi

# --- Verify the agents will find what they need ---
[ -f "$BCQUALITY_HOME/skills/entry.md" ] \
  || die "Finished, but $BCQUALITY_HOME/skills/entry.md is missing - the agents won't find the contract."

ACTUAL="$(git -C "$BCQUALITY_HOME" rev-parse HEAD)"
say "BCQuality ready at $BCQUALITY_HOME (HEAD = $ACTUAL)"

# --- Knowledge index (best-effort accelerator) ---------------------------------
# BCQuality's Entry preparation step rebuilds this over the live clone. Building it
# here, right after a pinned checkout, means every read-only reviewer finds a fresh
# index without needing a shell. Never fatal: READ falls back to path discovery.
#
# The generator dot-sources Knowledge-Retrieval.ps1, which uses
# `ConvertFrom-Json -AsHashtable` (PowerShell 7 only), so it is always run through
# `pwsh` and never through a 5.x `powershell`.
GENERATOR="$BCQUALITY_HOME/tools/Build-KnowledgeIndex.ps1"
INDEX_PATH="$BCQUALITY_HOME/knowledge-index.json"
RECEIPT="$PWD/.github/aldc-bcquality-index.json"
if ! command -v pwsh >/dev/null 2>&1; then
  warn "PowerShell 7 (pwsh) not found; skipping the knowledge index. Reviewers will use path-based discovery."
elif [ ! -f "$GENERATOR" ]; then
  warn "Generator not found at $GENERATOR; skipping the knowledge index."
else
  # Remove any stale index first, so a failed build can never leave an old file
  # that looks fresh.
  rm -f "$INDEX_PATH"
  if pwsh -NoProfile -File "$GENERATOR" -BCQualityRoot "$BCQUALITY_HOME" && [ -f "$INDEX_PATH" ]; then
    if command -v sha256sum >/dev/null 2>&1; then
      INDEX_SHA="$(sha256sum "$INDEX_PATH" | cut -d" " -f1)"
    else
      INDEX_SHA="$(shasum -a 256 "$INDEX_PATH" | cut -d" " -f1)"   # macOS
    fi
    # Written by Node, which this installer already requires: it escapes the path
    # correctly and never emits a BOM, which JSON.parse would reject.
    node -e 'const fs=require("fs"),path=require("path");const[i,s,c,r]=process.argv.slice(1);fs.mkdirSync(path.dirname(r),{recursive:true});fs.writeFileSync(r,JSON.stringify({status:"prebuilt",indexPath:i,indexSha256:s,corpusSha:c,generatedAt:new Date().toISOString(),generator:"tools/Build-KnowledgeIndex.ps1"},null,2)+"\n")' \
      "$INDEX_PATH" "$INDEX_SHA" "$ACTUAL" "$RECEIPT"
    say "Knowledge index built (sha256 $(printf %.12s "$INDEX_SHA")...)."
  else
    warn "Knowledge index build failed; reviewers will use path-based discovery."
  fi
fi

if [ -n "$BCQUALITY_PIN" ]; then
  say "Pinned to $BCQUALITY_PIN (aldc.yaml)."
else
  warn "No pinnedCommit in aldc.yaml - tracking '$BCQUALITY_REF'. Set external.bcquality.pinnedCommit to a 40-hex SHA for reproducible, evidence-validated runs."
fi

say "Done. Open 'aldc.code-workspace' in VS Code - BCQuality appears as a second"
say "root the agents can read, while staying OUT of your extension's compilation."
