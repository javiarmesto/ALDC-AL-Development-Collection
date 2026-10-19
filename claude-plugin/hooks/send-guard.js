#!/usr/bin/env node
'use strict';
// aldc-claude: PreToolUse on SendMessage. While an ALDC plan started in this session is open,
// do not continue a subagent by message: the message is delivered asynchronously, so the
// orchestrator ends its turn "waiting" and a headless run kills the subagent 10 minutes after
// the last turn (M17, October 2026: the conductor drove phases 2-6 through one implementer
// with 8 SendMessage calls and lost phase 6). A fresh foreground Agent call per phase or
// revision is what the contract asks for (subagents are stateless).
const runtime = require('./aldc-runtime');
const { pendingPlans } = require('./stop-guard');

function guard(payload) {
  if (!payload?.cwd || payload.tool_name !== 'SendMessage') return null;
  const state = runtime.readState(runtime.sessionFile(payload.session_id));
  if (!state.start || !pendingPlans(payload.cwd, state.start).length) return null;
  return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason:
    'ALDC: an ALDC plan is in progress. Do not continue a subagent with SendMessage: it runs asynchronously and can be cut ' +
    'off before it reports. Launch a new foreground Agent call instead (subagent_type "aldc:al-implement-subagent" for an ' +
    'implementation phase or revision, "aldc:al-review-subagent" for a review), with the full brief: phase objective, the ' +
    'files and previous report it needs, and the review findings to fix. Wait for its result in this turn.' } };
}

if (require.main === module) {
  try { const out = guard(runtime.readStdin()); if (out) console.log(JSON.stringify(out)); }
  catch { /* never block work because of the hook itself */ }
}
module.exports = { guard };
