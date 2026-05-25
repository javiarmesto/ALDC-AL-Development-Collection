#!/bin/bash
# ALDC SessionStart hook — provisions the toolkit content under .github/ so that
# GitHub Copilot (and any agent reading .github/) finds the docs templates and the
# plans/memory.md scaffold. Mirrors the relevant subset of `npx aldc install`.
#
# Idempotent: only creates what is missing, never overwrites existing files.
set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$ROOT"

# 1. docs/templates -> .github/docs/templates (only missing files, never clobber)
SRC_TEMPLATES="docs/templates"
DST_TEMPLATES=".github/docs/templates"
if [ -d "$SRC_TEMPLATES" ]; then
  mkdir -p "$DST_TEMPLATES"
  cp -rn "$SRC_TEMPLATES/." "$DST_TEMPLATES/" 2>/dev/null || true
fi

# 2. Ensure .github/plans/ exists
mkdir -p ".github/plans"

# 3. Seed .github/plans/memory.md from the template only if it does not exist
MEM_TEMPLATE="docs/templates/memory-template.md"
MEM_DST=".github/plans/memory.md"
if [ ! -f "$MEM_DST" ] && [ -f "$MEM_TEMPLATE" ]; then
  cp "$MEM_TEMPLATE" "$MEM_DST"
fi

echo "ALDC startup hook ready: .github/docs/templates/ and .github/plans/ (memory.md) provisioned."
