# {T-NN} result: {title}

<!--
<plans.root>/<req>/tickets/T-NN.result.md, written by the Conductor when the ticket's
review closes, before `tickets.js set <req> T-NN done`. A new session resumes from these
files, so state facts and evidence only; nothing here may depend on the conversation.
-->

**Status:** {done | blocked} · **Date:** {ISO timestamp} · **Wave:** {n} · **Integration:** {merged <merge commit> into aldc/<req> | refused/conflict -> rebuilt | blocked}

<!-- The per-ticket review was removed in 5.5.0: the final review covers the whole requirement.
There is no review per ticket, with git or without it. -->
**Review:** {final review | APPROVED | NEEDS_REVISION -> fixed | blocked}

## What changed

| File | Object | Change |
|---|---|---|
| {App/src/...} | {table 50100 Name} | {new} |

Event subscribers: {base object + event + why this point in the Standard Flow, or none}.

## Evidence

| Check | Result | Source |
|---|---|---|
| Build in the worktree (freno 1) | {green / blocked N times -> green / not-run} | {SubagentStop message from aldc-verify} |
| Integration | {merged / refused: reason} | `{T-NN}.integration.json` |
| Build after integration | {green / red / not-run (reason)} | {al-build-validator summary on aldc/<req>} |
| Tests | {executed: X/Y pass / not-run (no test runner)} | {runner output or "compiled only"} |
| Shared file entries | {applied in the integration step / none} | {files} |

## Acceptance

| Criterion | Status | How it is shown |
|---|---|---|
| AC-01 | {met / not verified} | {test name or reason} |

## Not verified

{Anything this ticket could not prove, with the reason. "Nothing" only when it is true.}

## Notes for the next tickets

{Facts a later ticket needs: a procedure it should call, a field it must not rename, a
shared file entry it must keep. No narrative.}
