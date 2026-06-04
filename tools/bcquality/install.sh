#!/usr/bin/env bash
#
# install.sh - set up the BCQuality knowledge base for an ALDC test repo.
#
# BCQuality is consumed from OUTSIDE the AL project (Option B / multi-root): this
# clones it to a sibling folder so its example .al files never enter your
# extension's compilation, then you open `aldc.code-workspace` to get it as a
# second workspace root the agents can read. Run this from the ROOT of the
# repo/folder you want to run the review/audit test on.
#
#   bash install.sh
#   BCQUALITY_HOME=/some/other/path bash install.sh   # custom location
#
set -euo pipefail

# --- Pin: keep in sync with aldc.yaml (external.bcquality.pinnedCommit) ---
BCQUALITY_URL="https://github.com/javiarmesto/bcquality.git"
BCQUALITY_PIN="07efef6bc719f32c7dded1b2e00d1d12080a2830"

# Where the external knowledge base lives. Default: sibling of this repo, which
# matches the `../bcquality` root in aldc.code-workspace. MUST stay OUTSIDE the
# AL project so the AL compiler never sees its .al files.
BCQUALITY_HOME="${BCQUALITY_HOME:-../bcquality}"

say()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "git is required but was not found on PATH."

# --- Sanity: does this look like the root of an ALDC workspace? ---
if [ ! -f "aldc.yaml" ] && [ ! -d ".github" ]; then
  warn "No aldc.yaml or .github/ here - make sure you run this from the ROOT of your test repo."
fi

# --- Guard: never let the knowledge base land inside the AL project ---
case "$BCQUALITY_HOME" in
  /*) : ;;                       # absolute path - fine
  ../*) : ;;                     # sibling/outside - fine
  *) warn "BCQUALITY_HOME ('$BCQUALITY_HOME') looks like it is INSIDE the project. Its .al examples will pollute your build. Use a path outside the AL project (e.g. ../bcquality)." ;;
esac

if [ -d "$BCQUALITY_HOME/.git" ]; then
  # --- Already cloned -> fetch + pin ---
  say "$BCQUALITY_HOME exists; fetching and pinning to $BCQUALITY_PIN"
  git -C "$BCQUALITY_HOME" fetch origin
  git -C "$BCQUALITY_HOME" checkout --quiet "$BCQUALITY_PIN" \
    || die "Could not checkout $BCQUALITY_PIN inside $BCQUALITY_HOME."
else
  # --- Fresh clone + pin (a plain clone, NOT a submodule of this repo) ---
  say "Cloning BCQuality into $BCQUALITY_HOME (outside the AL project)"
  git clone "$BCQUALITY_URL" "$BCQUALITY_HOME" || die "git clone failed."
  git -C "$BCQUALITY_HOME" checkout --quiet "$BCQUALITY_PIN" \
    || die "Could not checkout $BCQUALITY_PIN inside $BCQUALITY_HOME."
fi

# --- Verify the agents will find what they need ---
[ -f "$BCQUALITY_HOME/skills/entry.md" ] \
  || die "Finished, but $BCQUALITY_HOME/skills/entry.md is missing - the agents won't find the contract."

ACTUAL_PIN="$(git -C "$BCQUALITY_HOME" rev-parse HEAD)"
say "BCQuality ready at $BCQUALITY_HOME (HEAD = $ACTUAL_PIN)"

# --- Warn if aldc.yaml records a different pin ---
if [ -f "aldc.yaml" ]; then
  if grep -q "$BCQUALITY_PIN" aldc.yaml 2>/dev/null; then
    say "aldc.yaml pin matches."
  else
    warn "aldc.yaml does not mention $BCQUALITY_PIN - align the pin to keep the evidence validator happy."
  fi
fi

say "Done. Open 'aldc.code-workspace' in VS Code - BCQuality appears as a second"
say "root the agents can read, while staying OUT of your extension's compilation."
