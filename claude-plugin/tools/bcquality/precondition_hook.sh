#!/usr/bin/env bash
#
# BCQuality precondition hook — detects whether the external BCQuality clone is
# mounted and INJECTS a directive into the agent session via additionalContext.
#
# This is the single source of the "what to do about BCQuality" rule (Layer 2 of
# the precondition-hook design). It replaces the precondition prose duplicated in
# each consuming agent: detection is deterministic here, the agent just enacts the
# injected directive. The agents keep a thin prose backstop (#49/#54) in case the
# hook does not fire.
#
# Wired from .github/hooks/bcquality-precondition.json on sessionStart /
# subagentStart. Reads aldc.yaml for home + entryPoint (override: $BCQUALITY_HOME).
# Emits the Copilot hook output contract on stdout:
#   {"hookSpecificOutput":{"hookEventName":"<Event>","additionalContext":"<text>"}}
#
# NOTE (Preview): event-key casing and the bash/powershell config props may differ
# across VS Code Copilot hook versions — verify against your install. The messages
# below deliberately avoid " and \ so a plain printf yields valid JSON with no
# dependency on python/jq.
set -euo pipefail

EVENT="${1:-SessionStart}"
ALDC="aldc.yaml"

home="../bcquality"
entry="skills/entry.md"
if [ -f "$ALDC" ]; then
  h=$(grep -E '^[[:space:]]*home:' "$ALDC" | head -1 | sed -E 's/.*home:[[:space:]]*"?([^"#]+)"?.*/\1/' | tr -d '[:space:]' || true)
  e=$(grep -E '^[[:space:]]*entryPoint:' "$ALDC" | head -1 | sed -E 's/.*entryPoint:[[:space:]]*"?([^"#]+)"?.*/\1/' | tr -d '[:space:]' || true)
  [ -n "${h:-}" ] && home="$h"
  [ -n "${e:-}" ] && entry="$e"
fi
home="${BCQUALITY_HOME:-$home}"
entrypath="$home/$entry"

emit() {
  # $1 must be free of " and \ (kept that way below) so this stays valid JSON.
  printf '{"hookSpecificOutput":{"hookEventName":"%s","additionalContext":"%s"}}\n' "$EVENT" "$1"
}

if [ -f "$entrypath" ]; then
  sha=$(git -C "$home" rev-parse --short HEAD 2>/dev/null || echo unknown)
  emit "BCQuality is PRESENT at ${home} (SHA ${sha}). Treat it as the citation source of truth for review/audit: read ${entry} and follow its entry then read then do dispatch; record the SHA in your report."
else
  emit "BCQuality is ABSENT (no ${entrypath}). Apply the BCQuality precondition: set bcquality.outcome to not-applicable, skip the BCQuality consultation, and review natively via the FULL A-G checklist (reactivate B Naming via al-naming-conventions, D Performance via al-performance plus skill-performance, E Error-handling via al-error-handling, and the commit-in-subscriber part of A via al-events; permissions via skill-permissions). Cap confidence at medium; secrets and security have no native check. NEVER block or fail the review for the missing layer. This is the pre-BCQuality ALDC review, not a stub."
fi
