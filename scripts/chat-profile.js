'use strict';

// Copilot Chat installation only. Never imported by terminal surface generators.
const path = require('path');
const { project: normalize, roles } = require('./native-profile');
const lspQueries = [
  'bclsp_goToDefinition', 'bclsp_hover', 'bclsp_findReferences',
  'bclsp_prepareCallHierarchy', 'bclsp_incomingCalls', 'bclsp_outgoingCalls',
  'bclsp_codeLens', 'bclsp_codeQualityDiagnostics', 'bclsp_documentSymbols',
  'bclsp_symbolRelations', 'bclsp_inspectPage',
];
const queries = ['al_symbolsearch', 'al_getdiagnostics', 'al_getpackagedependencies'];
const writes = ['al_compile', 'al_build', 'al_downloadsymbols'];
const prompts = new Set(['al-agent.build-instructions', 'al-agent.create',
  'al-agent.instructions', 'al-agent.task', 'al-agent.test', 'al-build',
  'al-context.create', 'al-initialize', 'al-memory.create', 'al-pr-prepare', 'al-spec.create']);

function project(relative, input, profile) {
  const rel = relative.replace(/\\/g, '/');
  if (!/^(agents\/[^/]+\.agent|prompts\/[^/]+\.prompt)\.md$/.test(rel)) return input;
  if (!['bc28', 'bc29-native'].includes(profile)) throw new Error(`Unknown Chat profile: ${profile}`);
  const role = path.basename(rel).replace(/\.(agent|prompt)\.md$/, '');
  const isAgent = rel.startsWith('agents/');
  if (isAgent ? !roles[role] : !prompts.has(role)) throw new Error(`Chat role assignment missing: ${role}`);
  // Reuse the existing correction of obsolete tool instructions and the build
  // deployment gate. This is a Chat projection, not certification of BC29 tools.
  const eol = input.toString().includes('\r\n') ? '\r\n' : '\n';
  let text = normalize(rel, input).toString().replace(/\r\n/g, '\n');
  const end = text.indexOf('\n---', 3);
  let front = text.slice(0, end);
  let body = text.slice(end + 4);
  const coordinator = role === 'al-conductor' || role === 'al-memory.create';
  const implementation = ['al-developer', 'al-implement-subagent', 'al-build'].includes(role);
  const setup = role === 'al-initialize';
  const triage = role === 'al-triage';
  const toolLine = front.match(/^tools: \[(.*)\]$/m);
  let tools = toolLine[1].split(',').map(s => s.trim()).filter(Boolean);
  // BC28 keeps a source/LSP/MCP fallback without assuming the BC29 native catalog.
  // Triage requests dependency restore from an implementation owner in both modes.
  tools = tools.filter(t => !t.startsWith('ms-dynamics-smb.al/') ||
    (profile === 'bc29-native' && !(triage && t.endsWith('/al_downloadsymbols'))));
  if (!coordinator) {
    tools.push(...lspQueries.map(t => `sshadowsdk.al-lsp-for-agents/${t}`));
    tools.push(...queries.map(t => `al/${t}`));
  }
  if (implementation) tools.push(...writes.map(t => `al/${t}`));
  if (setup) tools.push('al/al_downloadsymbols');
  if (triage) tools.push('bc-profiling/*', 'bc-snapshot/*');
  front = front.replace(toolLine[0], `tools: [${[...new Set(tools)].join(', ')}]`);
  front = front.replace('builds with native AL tools or the terminal', 'builds with available AL tools or the terminal');
  body = body.replace('## BC29 native capability contract', '## Copilot Chat AL tooling contract')
    .replace('Profile: **bc29-native**', `Profile: **${profile}**`)
    .replace('[the native tool contract](../docs/framework/native-al-tools.md)', '[the Chat tool contract](../docs/framework/copilot-chat-al-tooling.md)')
    .replace('Use only the native operations declared here;', 'Use only the operations declared here;')
    .replace('Use the granted native AL tools under the shared native contract.', 'Use the granted AL tools under the Chat contract.')
    .replace('Inspect app.json, available symbols and the installed native build schema.', 'Inspect app.json, available symbols and the selected provider’s build schema.')
    .replace('Use `al_build` with `scope: current` for the selected project; use\n   `scope: all` only when every project in the workspace is authorized.', 'Use the selected provider’s `al_build` schema for the authorized project.\n   Discover supported `scope`, `projectPath` and output options for that provider; never transpose schemas.')
    .replace('installed `al_downloadsymbols` schema', 'selected provider’s `al_downloadsymbols` schema');
  const scope = coordinator ? 'Coordinate and consume evidence; do not execute AL providers.' :
    implementation ? 'Query AL and compile/build/restore only the authorized App/Test scope. Publication and authentication are separate human steps.' :
    setup ? 'Query AL and restore only explicitly approved dependencies. Do not compile, publish or change authentication in this setup workflow.' :
    triage ? 'Query AL; request builds/restores from implementation. Optional profiling/snapshot capture belongs here only, after confirming target, permissions and capture window. Stop and collect owned captures.' :
    'Query AL only. Do not compile, build, restore dependencies, rename symbols or start captures. Request implementation/Triage evidence when needed.';
  body = '\n\n' + scope + '\n\nThe Chat contract governs tool availability even when older skills describe broader tools.\nPreserve existing artifact write limits, independent review and human handoff gates.\nAL MCP aliases here are examples: inspect the actual catalog and adapt exact selectors; never broaden them to a whole AL server.\n' + body;
  return Buffer.from((front + '\n---' + body).replace(/\n/g, eol));
}

module.exports = { project, lspQueries, queries, writes };
