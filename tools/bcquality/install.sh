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

# --- Defaults (used when aldc.yaml is absent or a key is unset) ---
BCQUALITY_URL="https://github.com/microsoft/BCQuality.git"
BCQUALITY_REF="main"
BCQUALITY_PIN=""

# Read a scalar key from aldc.yaml (single source of truth). First match wins.
read_aldc() {
  [ -f "$ALDC_FILE" ] || return 0
  grep -E "^[[:space:]]*$1:" "$ALDC_FILE" 2>/dev/null | head -1 \
    | sed -E "s/.*$1:[[:space:]]*\"?([^\"#]*)\"?.*/\1/" | tr -d '[:space:]'
}
if [ -f "$ALDC_FILE" ]; then
  u="$(read_aldc url)";          [ -n "$u" ] && BCQUALITY_URL="$u"
  r="$(read_aldc ref)";          [ -n "$r" ] && BCQUALITY_REF="$r"
  p="$(read_aldc pinnedCommit)"; [ -n "$p" ] && BCQUALITY_PIN="$p"
fi

# What to check out: the pin if set, otherwise the tracking ref (branch/tag).
TARGET="${BCQUALITY_PIN:-$BCQUALITY_REF}"

# Where the external knowledge base lives. Default: sibling of this repo, which
# matches the `../bcquality` root in aldc.code-workspace. MUST stay OUTSIDE the
# AL project so the AL compiler never sees its .al files.
BCQUALITY_HOME="${BCQUALITY_HOME:-../bcquality}"

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

if [ -n "$BCQUALITY_PIN" ]; then
  say "Pinned to $BCQUALITY_PIN (aldc.yaml)."
else
  warn "No pinnedCommit in aldc.yaml - tracking '$BCQUALITY_REF'. Set external.bcquality.pinnedCommit to a 40-hex SHA for reproducible, evidence-validated runs."
fi

say "Done. Open 'aldc.code-workspace' in VS Code - BCQuality appears as a second"
say "root the agents can read, while staying OUT of your extension's compilation."
