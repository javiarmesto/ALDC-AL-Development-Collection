#!/usr/bin/env node
'use strict';
// aldc-claude: PreToolUse on Agent/Task for ALDC subagents.
// 1. Runs them in the foreground: a background subagent lets the orchestrator end its turn
//    "waiting", and headless runs abort the subagent (evals Oct 2026: 2 of 8 runs cut).
// 2. Guarantees the AL rules reach the subagent: auto-apply of .claude/rules does not fire
//    in subagents, and the conductor often did not pass them inline (13 of 13 runs).
// 3. Passes the autonomy mode, so a subagent never waits for an approval nobody will give.
// Other subagent types are left untouched.
const runtime = require('./aldc-runtime');

const MARKER = '<!-- aldc-rules -->';
const CODE_ROLES = /^aldc:(al-implement-subagent|al-review-subagent|al-developer-reviewer|al-developer|al-planning-subagent|al-triage|dredd|al-agent-builder)$/;
const REVIEWERS = /^aldc:(al-review-subagent|al-developer-reviewer|dredd)$/;
const FLOW_ROLES = /^aldc:(al-planning-subagent|al-implement-subagent|al-developer)$/;
const AGENT_SDK = /agent\s*sdk|IAgent(Factory|Metadata|TaskExecution)|agent\s*toolkit|al-agent-builder/i;

function brief(payload) {
  const input = payload?.tool_input;
  if (!input || typeof input.subagent_type !== 'string' || !input.subagent_type.startsWith('aldc:')) return null;
  const extra = [];
  const prompt = String(input.prompt || '');
  // Checked by the rules' own headings, not by the marker: in the evals the conductor
  // wrote the marker followed by its own one-line paraphrase of the rules.
  if (CODE_ROLES.test(input.subagent_type)) {
    const agentApp = AGENT_SDK.test(prompt) || input.subagent_type === 'aldc:al-agent-builder' || runtime.alSource(payload.cwd).includes('"agent metadata provider"');
    const rules = runtime.rulesBrief({ includeAgentToolkit: agentApp });
    const headings = rules.match(/^# .+$/gm) || [];
    if (rules && !headings.every((h) => prompt.includes(h.trim()))) extra.push(`${MARKER}\n## ALDC AL rules (binding; injected by the plugin because rule auto-apply does not reach subagents)\n\n${rules}`);
  }
  // M8: hand the reviewer the relevant BCQuality articles and the apply-or-justify rule.
  if (REVIEWERS.test(input.subagent_type) && !prompt.includes('## BCQuality selection')) {
    const sel = runtime.bcqualitySelection(payload.cwd, prompt);
    if (sel && sel.articles.length) extra.push('## BCQuality selection (from the plugin: articles whose keywords match ' + sel.scope + ')\n\n' +
      sel.articles.map((a) => '- ' + sel.root + '/' + a.path + ' (' + a.domain + '): ' + a.title).join('\n') +
      '\n\nOpen each article and record it in review.bcquality.articles as applied, not-applicable (with reason) or dismissed ' +
      '(technical reason citing file:line). "Not requested by the requirement" is not a valid reason: an applicable article ' +
      'the code does not follow is a finding. Also fill review.security (rules/al-security.md).');
    else if (sel) extra.push('## BCQuality selection\n\nNo BCQuality article matched this app. Review natively and still fill review.security (rules/al-security.md).');
  }
  // M9: investigate the standard flow before hooking into it.
  if (FLOW_ROLES.test(input.subagent_type) && !prompt.includes('Standard Flow'))
    extra.push('Standard Flow: before subscribing to a Base Application publisher, list its events in execution order from its symbols or source, and choose the event that runs after everything your logic depends on (amounts, discounts, status changes, inserts, posting). Planner: report it in the Standard Flow section. Implementer: write a one-line comment above each such subscriber saying why that event.');
  const mode = runtime.autonomy(payload.cwd);
  if (mode.gates === 'pre-approved' && !prompt.includes('ALDC autonomy: pre-approved'))
    extra.push('ALDC autonomy: pre-approved. Do not wait for approval and do not stop to ask: decide, state each assumption and decision in your structured output, and finish the task.');
  const updated = { ...input, run_in_background: false };
  if (extra.length) updated.prompt = `${prompt}\n\n${extra.join('\n\n')}`;
  return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', updatedInput: updated } };
}

if (require.main === module) {
  try { const out = brief(runtime.readStdin()); if (out) console.log(JSON.stringify(out)); }
  catch { /* never block a delegation because of the hook itself */ }
}
module.exports = { brief, MARKER };
