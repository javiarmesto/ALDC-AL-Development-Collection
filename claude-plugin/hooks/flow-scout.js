#!/usr/bin/env node
'use strict';
// aldc-claude M14: BC Flow Scout. Blocks, once per publisher, writing an [EventSubscriber]
// to a publisher nobody in this session has looked at (read its source or symbols, searched
// it, or received it in a Standard Flow brief). In the October 2026 evals the decisive
// correctness case was won by agents that inspected the standard flow before hooking in.
// PreToolUse: investigation tools are recorded; Write/Edit of .al files are checked.
const runtime = require('./aldc-runtime');

const SUBSCRIBER = /EventSubscriber\s*\(\s*ObjectType::(Codeunit|Table|Page|Report)\s*,\s*(?:Codeunit|Database|Page|Report)::"?([^",)]+?)"?\s*,\s*'?"?([A-Za-z0-9_]+)/g;
const INVESTIGATION = /^(Read|Grep|Glob|Agent|Task|mcp__.*(al-symbols|microsoft-docs|al__).*)$/;
const LIMIT = 400000;


function scout(payload) {
  if (!payload?.tool_name) return null;
  const file = runtime.sessionFile(payload.session_id, 'scout'); // own file: never touches the session state
  const state = runtime.readState(file);
  const input = payload.tool_input || {};
  if (INVESTIGATION.test(payload.tool_name)) {
    state.investigated = ((state.investigated || '') + ' ' + JSON.stringify(input).toLowerCase()).slice(-LIMIT);
    runtime.writeState(file, state);
    return null;
  }
  if (!/^(Write|Edit|MultiEdit)$/.test(payload.tool_name)) return null;
  if (!/\.al$/i.test(String(input.file_path || ''))) return null;
  const text = String(input.content ?? input.new_string ?? (input.edits || []).map((e) => e.new_string).join('\n'));
  const denied = new Set(state.flowDenied || []);
  for (const m of text.matchAll(SUBSCRIBER)) {
    const publisher = m[2].trim();
    const event = m[3];
    const key = publisher.toLowerCase();
    if ((state.investigated || '').includes(key) || denied.has(key)) continue;
    denied.add(key);
    state.flowDenied = [...denied];
    runtime.writeState(file, state);
    return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason:
      `ALDC BC Flow Scout: before subscribing to "${publisher}".${event}, inspect that publisher. ` +
      `List its events (for example al_search_object_members objectName="${publisher}" memberType=procedures pattern="On*", ` +
      `or read its source), find where ${event} fires relative to the standard steps your logic depends on ` +
      '(calculations such as discounts or amounts, status changes, inserts, posting), and pick the event that runs ' +
      'after everything you need is computed. Then write the subscriber again with a one-line comment above it saying ' +
      'why this event is the right point. This check blocks only once per publisher.' } };
  }
  return null;
}

if (require.main === module) {
  try { const out = scout(runtime.readStdin()); if (out) console.log(JSON.stringify(out)); }
  catch { /* never block work because of the hook itself */ }
}
module.exports = { scout, SUBSCRIBER };
