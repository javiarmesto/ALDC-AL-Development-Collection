#!/bin/bash
# ALDC provisioning script — run by the GitHub Copilot coding agent sessionStart hook
# (.github/hooks/aldc-provision.json).
#
# Mirrors the relevant subset of `npx aldc install` (scripts/install.js): on session start
# it ensures the toolkit content GitHub Copilot relies on is present under .github/:
#   - docs/templates/         -> .github/docs/templates/
#   - .github/plans/memory.md  (seeded from docs/templates/memory-template.md if missing)
#
# Idempotent: only creates what is missing, never overwrites existing files.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
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

echo "ALDC provision: .github/docs/templates/ and .github/plans/ (memory.md) ready."
