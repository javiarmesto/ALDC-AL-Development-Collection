#!/usr/bin/env node
// Static packaging/permission gates. Does not claim that a host or AL was run.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { expected, bodyFor, agentBody } = require('./sync-copilot-cli');
const { split } = require('./generation-utils');
const { toolsForRole } = require('./copilot-cli-adapter');
// Only the Claude-specific preamble check below strips a generated blockquote.
const stripAdapterPreamble = body => body.replace(/^\n*(?:>[^\n]*\n)+\n?/, '');
const { build: buildPlugin, rewritePaths, plansRootFor, AGENTS, WORKFLOWS, workflowSkillName } = require('./sync-plugin-support');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
const generated = expected();
const manifest = JSON.parse(generated.get('copilot-cli-plugin/plugin.json'));
const catalog = JSON.parse(read('.github/plugin/marketplace.json'));
check(catalog.plugins.find(p => p.name === manifest.name)?.source === './copilot-cli-plugin', 'CLI catalog resolves dedicated distribution');
for (const component of ['agents', 'skills', 'commands']) {
  check([...generated.keys()].some(p => p.startsWith('copilot-cli-plugin/' + manifest[component])), `Manifest ${component} resolves`);
}
const sourceServers = JSON.parse(read('plugin.json')).mcpServers;
const expectedServers = JSON.parse(JSON.stringify(sourceServers));
expectedServers['al-symbols-mcp'].args = expectedServers['al-symbols-mcp'].args.map(a => a === '@nicholasglazer/al-symbols-mcp' ? 'al-mcp-server@2.5.0' : a);
check(JSON.stringify(manifest.mcpServers) === JSON.stringify(expectedServers), 'Only PR108 symbol package correction; server identity, other providers and settings retained');
require('./test-copilot-cli-mcp').validateManifest(manifest);
check(!manifest.hooks, 'No incompatible Claude hooks imported');
for (const [file, content] of generated) {
  if (!file.endsWith('.md')) continue;
  check(!/\bTodoWrite\b/.test(content), `${file}: no Claude task-list tool remains`);
  // Verify actual packaged links for new contracts rather than repo-only links.
  for (const match of content.matchAll(/\]\(([^)]+(?:cli-al-tools|al18-capabilities|bcquality-provider-contract|bcquality-task-context)\.md)\)/g)) {
    // Links are either relative to the file or anchored at the distribution root.
    const anchored = match[1].startsWith('${PLUGIN_ROOT}/');
    const target = anchored
      ? path.posix.join('copilot-cli-plugin', match[1].slice('${PLUGIN_ROOT}/'.length))
      : path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]));
    check(generated.has(target), `${file}: bundled reference ${target}`);
  }
  if (file.includes('/agents/')) {
    const agent = split(content);
    check(Array.isArray(agent.data.tools) && agent.data.tools.length > 0, `${file}: explicit tools`);
    check(!agent.data.tools.includes('*'), `${file}: no unrestricted grant`);
    check(agent.data.tools.every(t => /^(read|search|edit|execute|task|list_agents|read_agent|web)$/.test(t) || /^(al-symbols-mcp|context7|microsoft-docs)\/\*$/.test(t) || /^al\/(al_symbolsearch|al_getdiagnostics|al_getpackagedependencies|al_compile|al_build|al_downloadsymbols)$/.test(t)), `${file}: host tool vocabulary`);
    check(agent.data.model === 'claude-sonnet-4.6', `${file}: retains canonical Copilot model`);
    const source = split(read(`agents/${agent.data.name}.agent.md`));
    const contractPath = `copilot-cli-plugin/references/agent-contracts/${agent.data.name}.md`;
    const fullBody = generated.get(contractPath) || agent.body;
    check(fullBody === agentBody(source.body), `${file}: complete source workflow retained`);
    check(agent.body.length <= 29000, `${file}: host entry size`);
    if (generated.has(contractPath)) check(agent.body.includes('${PLUGIN_ROOT}/references/agent-contracts/' + agent.data.name + '.md'), `${file}: mandatory full contract is reachable`);
    check(!/@(?:al-|dredd)|#runSubagent|vscode\/|#(?:search|usages|problems|changes|githubRepo)/.test(fullBody), `${file}: no operational Chat vocabulary`);
  }
  if (file.includes('/commands/')) {
    const command = split(content);
    check(!('allowed-tools' in command.data), `${file}: no Claude command permissions`);
    check(command.data['disable-model-invocation'] === true, `${file}: explicit workflow stays explicit`);
    check(!content.includes('.claude/rules'), `${file}: no Claude instruction destination`);
  }
}
// claude-plugin/ used to hold hand-maintained copies, so the Conductor body was
// pinned here by hash: nothing else would have noticed an edit. It is generated
// now, so the check is the generator itself — every file matches what the
// canonical sources produce, and the Conductor contract survives the adapter
// intact rather than merely matching one recorded digest.
const pluginFiles = buildPlugin().files;
const handEdited = [...pluginFiles].filter(([rel, content]) => read('claude-plugin/' + rel) !== content).map(([rel]) => rel);
check(handEdited.length === 0, `claude-plugin is generated, not hand-edited: ${handEdited.join(', ')}`);
// Claude preambles remain separable from the canonical body for this check.
// CLI and Codex now read canonical bodies directly and do not strip blockquotes.
for (const rel of [...AGENTS.map(a => `agents/${a.id}.agent.md`), ...WORKFLOWS.map(w => `prompts/${w}.prompt.md`)]) {
  check(!/^\s*>/.test(split(read(rel)).body), `${rel}: canonical body must not open with a block quote`);
}
// `${input:Name}` is a Copilot prompt variable with no Claude Code equivalent; the
// adapter rewrites every one, including inside fenced blocks and directory trees.
// The mapping table names the Copilot surface it maps, so the check is on the body
// the preamble introduces — which also exercises the strip on every real file.
for (const rel of [...AGENTS.map(a => `agents/${a.id}.md`), ...WORKFLOWS.map(w => `skills/${workflowSkillName(w)}/SKILL.md`)]) {
  const body = stripAdapterPreamble(split(pluginFiles.get(rel)).body);
  check(!/^\s*>/.test(body), `claude-plugin/${rel}: the adapter preamble strips cleanly`);
  check(!body.includes('${input:'), `claude-plugin/${rel}: no Copilot input variable survives the adapter`);
}
const conductor = split(read('claude-plugin/agents/al-conductor.md'));
const canonicalConductor = rewritePaths(split(read('agents/al-conductor.agent.md')).body, plansRootFor(ROOT));
check(conductor.body.endsWith(canonicalConductor), 'Claude Conductor workflow, including the explicit BCQuality provider contract, carried from the canonical contract without edits');
check(crypto.createHash('sha256').update(canonicalConductor).digest('hex').length === 64, 'Conductor body is hashable evidence, not a transcription');
check(conductor.data.model === 'haiku', 'Claude Conductor model unchanged');
check(!conductor.data.tools.includes('mcp__'), 'Conductor does not acquire AL MCP execution');
for (const file of fs.readdirSync(path.join(ROOT, 'claude-plugin/agents'))) {
  const agent = split(read('claude-plugin/agents/' + file));
  check(agent.body.includes('${CLAUDE_PLUGIN_ROOT}/skills/skill-migrate/references/cli-al-tools.md'), `${file}: contract is directly reachable`);
  if (file === 'al-conductor.md') continue;
  for (const server of ['al-symbols-mcp', 'context7', 'microsoft-docs']) {
    check(agent.data.tools.includes(`mcp__plugin_aldc_${server}__*`) && agent.data.tools.includes(`mcp__${server}__*`), `${file}: plugin and workspace MCP allowlists`);
  }
}
const reference = 'skills/skill-migrate/references/al18-capabilities.md';
check(read(reference) === read('claude-plugin/' + reference), 'AL18 capability reference agrees with canonical source');
check(generated.get('copilot-cli-plugin/' + reference) === read(reference), 'CLI capability reference agrees with canonical source');
check(generated.get('copilot-cli-plugin/skills/skill-migrate/references/cli-al-tools.md') === read('claude-plugin/skills/skill-migrate/references/cli-al-tools.md'), 'Host comparison contract is not mistranslated');
for (const [file, text] of generated) {
  if (!file.includes('/rules-templates/')) continue;
  const rule = split(text);
  check(file.endsWith('.instructions.md') && typeof rule.data.applyTo === 'string' && !rule.data.paths, `${file}: Copilot scoped instructions`);
  for (const link of text.matchAll(/\]\((\.\/[^)]+)\)/g)) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), link[1]));
    check(generated.has(target), `${file}: generated sibling rule link resolves: ${target}`);
  }
}
// These roles return findings to their caller; none owns persistent reports.
// Keep Dredd separate: its existing report-persistence contract is behavioral.
const queryTools = new Set(['read', 'search', 'web', 'al-symbols-mcp/*', 'context7/*', 'microsoft-docs/*', 'al/al_symbolsearch', 'al/al_getdiagnostics', 'al/al_getpackagedependencies']);
for (const name of ['al-planning-subagent', 'al-review-subagent', 'al-developer-reviewer']) {
  const role = split(generated.get(`copilot-cli-plugin/agents/${name}.agent.md`));
  check(role.data.tools.every(tool => queryTools.has(tool)), `${name}: query-only tools, no edit, shell or delegation escape`);
  check(role.data.tools.includes('read') && role.data.tools.includes('search'), `${name}: research capabilities retained`);
}
assert.throws(() => toolsForRole('unknown-role'), /Unmapped Copilot CLI role/); checks++;
const oversized = [...generated].filter(([p, c]) => p.includes('/agents/') && split(c).body.length > 30000).map(([p]) => path.basename(p));
console.log(`CLI plugin packaging: ${checks} checks passed (static only).`);
check(oversized.length === 0, 'All CLI agent entries fit the documented size guidance');
console.log('Agent entry sizes verified; authenticated host loading/invocation remains a separate check. No workflow was truncated.');
// Keep the CLI-specific bootstrap regressions in the existing CI entrypoint.
const result = require('child_process').spawnSync(process.execPath,
  ['--test', path.join(__dirname, 'test-copilot-cli-surface.js')], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
