#!/usr/bin/env node
'use strict';
// aldc-claude: PreToolUse on Agent/Task for ALDC subagents.
// 1. Runs them in the foreground: a background subagent lets the orchestrator end its turn
//    "waiting", and headless runs abort the subagent (evals Oct 2026: 2 of 8 runs cut).
// 2. Guarantees the AL rules reach the subagent: auto-apply of .claude/rules does not fire
//    in subagents, and the conductor often did not pass them inline (13 of 13 runs).
// 3. Passes the autonomy mode, so a subagent never waits for an approval nobody will give.
// 4. Hands BCQuality candidate articles to reviewers (apply or justify) and to Architect/Spec. These are an
//    ALDC keyword match, never a BCQuality provider execution: design roles consult bcquality:al-knowledge when
//    it is installed and record the candidates only as a manual selection (review of 31 Oct 2026, H1-H3).
// Other subagent types are left untouched. aldc-extras roles (5.4.0) are ALDC subagents too: the core
// briefs them, so the agent builder gets the AL rules and al-agent-toolkit whether or not it is installed.
const runtime = require('./aldc-runtime');

const MARKER = '<!-- aldc-rules -->';
// Current agent names only (the 5.4.0 aliases were removed in 6.0.0).
const CODE_ROLES = /^(aldc:(al-implementer|al-reviewer|al-researcher|al-triage)|aldc-extras:al-agent-builder)$/;
const REVIEWERS = /^aldc:al-reviewer$/;
// The planner is left out: its contract forbids probing BCQuality during planning.
const DESIGNERS = /^aldc:(al-architect|al-spec-agent)$/;
const FLOW_ROLES = /^aldc:(al-researcher|al-implementer)$/;
const AGENT_SDK = /agent\s*sdk|IAgent(Factory|Metadata|TaskExecution)|agent\s*toolkit|al-agent-builder/i;

// Briefs handed out by PreToolUse and not yet claimed by the matching SubagentStart (5.5.0).
const PENDING_TTL_MS = 120000;
const pendingFile = (sessionId) => runtime.sessionFile(sessionId, 'briefed');

/** The context an ALDC subagent must start with. `prompt` is empty at SubagentStart (the host does not pass it). */
function sections(subagentType, cwd, prompt) {
  const extra = [];
  const role = subagentType;
  const payload = { cwd };
  // Checked by the rules' own headings, not by the marker: in the evals the conductor
  // wrote the marker followed by its own one-line paraphrase of the rules.
  if (CODE_ROLES.test(role)) {
    const agentApp = AGENT_SDK.test(prompt) || role === 'aldc-extras:al-agent-builder' || runtime.alSource(payload.cwd).includes('"agent metadata provider"');
    const rules = runtime.rulesBrief({ includeAgentToolkit: agentApp });
    const headings = rules.match(/^# .+$/gm) || [];
    if (rules && !headings.every((h) => prompt.includes(h.trim()))) extra.push(`${MARKER}\n## ALDC AL rules (binding; injected by the plugin because rule auto-apply does not reach subagents)\n\n${rules}`);
  }
  // M8: hand the reviewer the relevant BCQuality articles and the apply-or-justify rule.
  if (REVIEWERS.test(role) && !prompt.includes('## BCQuality selection')) {
    const sel = runtime.bcqualitySelection(payload.cwd, prompt);
    if (sel && sel.articles.length) extra.push('## BCQuality selection (ALDC keyword match on ' + sel.scope + '; not a BCQuality provider execution)\n\n' +
      sel.articles.map((a) => '- ' + sel.root + '/' + a.path + ' (' + a.domain + '): ' + a.title).join('\n') +
      '\n\nOpen each article and record it in review.bcquality.articles as applied, not-applicable (with reason) or dismissed ' +
      '(technical reason citing file:line). "Not requested by the requirement" is not a valid reason: an applicable article ' +
      'the code does not follow is a finding. Also fill review.security (rules/al-security.md).');
    else if (sel) extra.push('## BCQuality selection\n\nNo BCQuality article matched this app. Review natively and still fill review.security (rules/al-security.md).');
  }
  // Design roles: the real route is bcquality:al-knowledge; the keyword list is only a labelled manual fallback.
  if (DESIGNERS.test(role) && !prompt.includes('## BCQuality candidates')) {
    const sel = runtime.bcqualitySelection(payload.cwd, prompt, 10);
    if (sel && sel.articles.length) {
      const prov = runtime.bcqualityProvenance(sel.root);
      const knowledge = runtime.bcqualitySkill('al-knowledge');
      extra.push('## BCQuality candidates (ALDC hook keyword match on ' + sel.scope + ' and the brief; NOT a BCQuality consultation)\n\n' +
        `Provenance: root ${sel.root} (${prov.rootSource}) · bcquality ${prov.version || 'version unknown'}${prov.head ? ' · ' + prov.head : ''}\n\n` +
        sel.articles.map((a) => '- ' + sel.root + '/' + a.path + ' (' + a.domain + '): ' + a.title).join('\n') +
        '\n\n' + (knowledge
          ? 'For each knowledge domain your decisions need, consult `bcquality:al-knowledge` with the Skill tool: write the question first and pass it verbatim as the skill argument. The Skill tool only loads instructions and runs nothing: then execute them yourself (Entry, READ, the dispatched al-knowledge action) until you hold the knowledge-response JSON, and persist it unchanged in responses[] (docs/templates/bcquality-design-guidance.md). One invocation per domain. '
          : 'The installed BCQuality has no al-knowledge skill, so no consultation is possible here. ') +
        'You may also read the candidates above, but record any you use as `selection: manual` (or `mixed`) with `route: hook-candidates`: never place them in responses[] or label them al-knowledge. ' +
        'Cite each article path next to the decision it shapes and end with a "BCQuality references" list stating, for each, its route (al-knowledge or hook-candidates). This is design context, never review coverage.');
    }
  }
  // M9: investigate the standard flow before hooking into it.
  if (FLOW_ROLES.test(role) && !prompt.includes('Standard Flow'))
    extra.push('Standard Flow: before subscribing to a Base Application publisher, list its events in execution order from its symbols or source, and choose the event that runs after everything your logic depends on (amounts, discounts, status changes, inserts, posting). Planner: report it in the Standard Flow section. Implementer: write a one-line comment above each such subscriber saying why that event.');
  const mode = runtime.autonomy(payload.cwd);
  if (mode.gates === 'pre-approved' && !prompt.includes('ALDC autonomy: pre-approved'))
    extra.push('ALDC autonomy: pre-approved. Do not wait for approval and do not stop to ask: decide, state each assumption and decision in your structured output, and finish the task.');
  return extra;
}

/** PreToolUse on Agent/Task: forces the foreground and appends the context to the prompt (keyword selection sees it). */
function brief(payload) {
  const input = payload?.tool_input;
  if (!input || typeof input.subagent_type !== 'string' || !/^aldc(-extras)?:/.test(input.subagent_type)) return null;
  const prompt = String(input.prompt || '');
  const extra = sections(input.subagent_type, payload.cwd, prompt);
  const updated = { ...input, run_in_background: false };
  if (extra.length) updated.prompt = `${prompt}\n\n${extra.join('\n\n')}`;
  // Leave a claim for the SubagentStart this launch will fire, so the context is not given twice.
  if (payload.session_id) {
    const file = pendingFile(payload.session_id);
    const now = Date.now();
    const pending = (runtime.readState(file).pending || []).filter((p) => now - p.at < PENDING_TTL_MS);
    pending.push({ type: input.subagent_type, at: now });
    runtime.writeState(file, { pending });
  }
  return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', updatedInput: updated } };
}

/**
 * SubagentStart: the same context for ALDC subagents that no PreToolUse briefed. Phase 0 (spike A): agents a plugin
 * workflow launches fire SubagentStart/SubagentStop but not PreToolUse on Agent, so they started without the AL rules.
 */
function start(payload) {
  const type = payload?.agent_type;
  if (typeof type !== 'string' || !/^aldc(-extras)?:/.test(type)) return null;
  if (payload.session_id) {
    const file = pendingFile(payload.session_id);
    const now = Date.now();
    const pending = (runtime.readState(file).pending || []).filter((p) => now - p.at < PENDING_TTL_MS);
    const i = pending.findIndex((p) => p.type === type);
    if (i >= 0) { pending.splice(i, 1); runtime.writeState(file, { pending }); return null; }
  }
  const extra = sections(type, payload.cwd, '');
  if (!extra.length) return null;
  return { hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: extra.join('\n\n') } };
}

if (require.main === module) {
  try {
    const payload = runtime.readStdin();
    const out = payload?.hook_event_name === 'SubagentStart' ? start(payload) : brief(payload);
    if (out) console.log(JSON.stringify(out));
  } catch { /* never block a delegation because of the hook itself */ }
}
module.exports = { brief, start, sections, MARKER };
