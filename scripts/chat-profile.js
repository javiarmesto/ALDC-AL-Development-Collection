'use strict';

// Copilot Chat installation only. Never imported by terminal surface generators.
const path = require('path');
const { project: normalize, roles } = require('./native-profile');
// Confirmed from the user's local VS Code model selector on 2026-10-05.
const chatModel = 'Claude Sonnet 5.5 (copilot)';
const lspQueries = [
  'bclsp_goToDefinition', 'bclsp_hover', 'bclsp_findReferences',
  'bclsp_prepareCallHierarchy', 'bclsp_incomingCalls', 'bclsp_outgoingCalls',
  'bclsp_codeLens', 'bclsp_codeQualityDiagnostics', 'bclsp_documentSymbols',
  'bclsp_symbolRelations', 'bclsp_inspectPage',
];
const queries = ['al_symbolsearch', 'al_getdiagnostics', 'al_getpackagedependencies'];
const writes = ['al_compile', 'al_build', 'al_downloadsymbols'];
// AL18 adds run_tests to this proxy. Triage owns capture, not test execution.
const snapshotCaptures = ['initialize_snapshot_debugging', 'get_snapshot_status', 'stop_snapshot_debugging'];
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
  // Only explicit Chat selections change; model-less prompts keep inheriting.
  front = front.replace(/^(\s*)model: [^\n]+$/gm, (_, indent) => `${indent}model: ${chatModel}`);
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
    tools.push(...lspQueries.map(t => `SShadowSdk.al-lsp-for-agents/${t}`));
    tools.push(...queries.map(t => `al/${t}`));
  }
  if (implementation) tools.push(...writes.map(t => `al/${t}`));
  if (setup) tools.push('al/al_downloadsymbols');
  if (triage) tools.push('bc-profiling/*', ...snapshotCaptures.map(t => `bc-snapshot/${t}`));
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
  if (role === 'al-implement-subagent') {
    body = body.replace('- If **Library Assert** dependency is missing → add it and run `AL: Download Symbols`', '- Resolve the actual assertion codeunit owner/version/API; change only approved dependencies and restore with the granted tool')
      .replace('- If **Any** dependency is missing → add it and run `AL: Download Symbols`', '- Resolve Any only when the test uses it; do not add unused test libraries')
      .replace(/3\. Verify these dependencies exist;[\s\S]*?(?=### Test Object ID Management)/, `3. Identify only the libraries actually referenced by the planned tests. Resolve their owning app ID, publisher, compatible version and codeunit API from the target project's manifests and available symbols.
4. Propose missing dependencies to the approved implementation owner; restore only approved changes with the available provider. Never copy example IDs or versions into app.json.

### Test Library References

Use the assertion codeunit name and API resolved from this project's symbols. Names can differ between dependency versions; neither Assert nor Library Assert is universally correct. Add Any only when its API is used by the test, and omit unused library variables.

`)
      .replace(/Assert: Codeunit "Library Assert";/g, 'Assert: Codeunit "<resolved assertion codeunit>";')
      .replace(/^\s*Any: Codeunit Any;\r?\n/gm, '\n        // Add other library variables only when the test uses their resolved API.\n');
  }
  if (profile === 'bc29-native') {
    const research = ['al-architect', 'al-spec-agent', 'al-spec.create'].includes(role);
    const creator = ['al-developer', 'al-implement-subagent'].includes(role);
    const reviewer = ['al-developer-reviewer', 'al-review-subagent', 'dredd'].includes(role);
    const guidance = [];
    if (research) guidance.push('Ground material contracts in App/Test manifests, resolved package identities and target declarations. Use bounded workspace symbol search first; if insufficient and connected, inspect filters.source="environment" and retain appId/appName/appPublisher/appVersion plus truncation and raw results. Propose only the necessary dependency; request restore from its implementation/setup owner. Preserve approved architecture, assigned spec boundaries, BCQuality consultation and human gates.');
    if (creator) {
      guidance.push('Before scaffolding, verify the approved project/type/ID allocation. For a new object, use al_getnextobjectid with the actual schema and explicit App/Test projectPath when ambiguous. For a fixed spec ID, constrain rangeStart=rangeEnd=approved ID; a collision returns to the owner, never silently substitute the next free ID. For an unassigned object, use only the approved manifest allocation. Check the returned status, count, ranges, outOfRange and warnings; never use nextOutOfRangeId or silently widen idRanges. IDs are not reserved: save before requesting more and coordinate overlapping writers. Check known dependency/environment allocations as well; editing the existing intended object does not require allocating it again. Field IDs remain separate.');
      body = body.replace('object IDs not specified (ask for the range/convention)', 'approved object ID/range cannot be resolved from the spec and manifest (ask for the missing allocation)');
    }
    if (implementation) guidance.push('Save current sources, build the authorized App and Test projects, and retain each project identity, package path, revision and build result. al_getdiagnostics reads existing Problems: after edits, project switches, restores or reconnects, correlate it with a completed build of the same inputs; an empty or filtered/truncated list is not a fresh build. Keep tests created, Test compiled and tests executed separate. Runtime RED/GREEN requires real per-test pass/fail/skip output from the approved runner and matching deployed package; a compiler error is not a failing runtime test. If execution is unavailable, report it as pending and preserve the delivery gate. Publication requires separate explicit authorization.');
    if (role === 'al-implement-subagent') {
      body = body.replace('- If **Library Assert** dependency is missing → add it and run `AL: Download Symbols`', '- Resolve the actual Library Assert owner/version/API; change only approved dependencies and restore with the granted tool')
        .replace('- If **Any** dependency is missing → add it and run `AL: Download Symbols`', '- Resolve Any only when the test uses it; do not add unused test libraries')
        .replace('### Step 2: Create TEST Files FIRST (RED State)', '### Step 2: Create TEST Files FIRST (RED execution pending)')
        .replace('- Tests MUST fail at this point (objects under test don\'t exist yet)', '- Obtain a real failing test result before claiming runtime RED. Missing objects can prevent compilation; report that separately and keep runtime verification pending.')
        .replace('### Step 4: Create Production AL Code (GREEN State)', '### Step 4: Create Production AL Code (verify GREEN by execution)')
        .replace('4. If no separate test range exists, use the LAST portion of the main range', '4. Use only the approved Test project allocation; never borrow App IDs without an approved allocation');
    }
    if (coordinator && role === 'al-conductor') guidance.push('Require the implementation owner to return separate App build, Test build and runtime RED/GREEN results with revision, deployed package, environment and raw-output references. Tests created or clean diagnostics alone cannot satisfy a runtime gate. Route missing execution evidence to its owner and keep the affected phase pending; coordinate without calling AL tools yourself.');
    if (reviewer) guidance.push('Check source revision, App/Test build identities, deployed package and actual per-test results in the supplied evidence. Report stale, missing or unexecuted checks as pending; request fresh evidence from the implementation owner without obtaining build, allocation, test or capture permissions.');
    if (triage) body = body.replace('analyze, debug, search, navigate, build/run to reproduce', 'analyze, debug, search, navigate, consume owner build/test evidence to reproduce');
    if (guidance.length) body = '\n\n## Native AL evidence for this role\n\n' + guidance.join('\n\n') + body;
    // Keep the native invocation spelling consistent with its picker selector.
    // The separate MCP alias al/al_getdiagnostics retains its own operation name.
    body = body.replace(/(?<!al\/)\bal_getdiagnostics\b/g, 'al_get_diagnostics');
  }
  return Buffer.from((front + '\n---' + body).replace(/\n/g, eol));
}

module.exports = { project, chatModel, lspQueries, queries, writes };
