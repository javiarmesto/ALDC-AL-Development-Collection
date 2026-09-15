#!/usr/bin/env bash
# Compatibility notice only. Selection belongs to the shared provider contract.
# No external files, catalogs, Git commands or index generators are consulted.
set -euo pipefail
[ -f aldc.yaml ] || exit 0
case "${1:-SessionStart}" in
  SessionStart|SubagentStart) EVENT="${1:-SessionStart}" ;;
  *) exit 0 ;;
esac
printf '{"hookSpecificOutput":{"hookEventName":"%s","additionalContext":"For an authorized review, read the packaged docs/templates/bcquality-provider-contract.md and current project external.bcquality configuration. Disabled means no probe. Select plugin or external-multiroot explicitly. Discovery, loading, execution and index generation need separate observations. This hook has not probed any provider; keep native coverage until completed results establish coverage."}}\n' "$EVENT"
