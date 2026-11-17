# {T-NN} result: {title}

<!--
<plans.root>/<req>/tickets/T-NN.result.md, written by the Conductor when the ticket's
review closes, before `tickets.js set <req> T-NN done`. A new session resumes from these
files, so state facts and evidence only; nothing here may depend on the conversation.
-->

**Status:** {done | blocked} · **Date:** {ISO timestamp} · **Review:** {APPROVED | NEEDS_REVISION -> fixed | blocked}

## What changed

| File | Object | Change |
|---|---|---|
| {App/src/...} | {table 50100 Name} | {new} |

Event subscribers: {base object + event + why this point in the Standard Flow, or none}.

## Evidence

| Check | Result | Source |
|---|---|---|
| Build (aldc-verify) | {green / red / not-run (reason)} | {al-build-validator summary or state.json entry time} |
| Tests | {executed: X/Y pass / not-run (no test runner)} | {runner output or "compiled only"} |
| Review | {verdict, gating findings} | `{T-NN}.review.json` |

## Acceptance

| Criterion | Status | How it is shown |
|---|---|---|
| AC-01 | {met / not verified} | {test name or reason} |

## Not verified

{Anything this ticket could not prove, with the reason. "Nothing" only when it is true.}

## Notes for the next tickets

{Facts a later ticket needs: a procedure it should call, a field it must not rename, a
shared file entry it must keep. No narrative.}
