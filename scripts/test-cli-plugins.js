#!/usr/bin/env node
// Static packaging/permission gates. Does not claim that a host or AL was run.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { expected, split, bodyFor, toolsFor } = require('./sync-copilot-cli');
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
check(JSON.stringify(manifest.mcpServers) === JSON.stringify(JSON.parse(read('plugin.json')).mcpServers), 'MCP config retained without new servers');
check(!manifest.hooks, 'No incompatible Claude hooks imported');
for (const [file, content] of generated) {
  if (!file.endsWith('.md')) continue;
  check(!/\bTodoWrite\b/.test(content), `${file}: no Claude task-list tool remains`);
  // Verify actual packaged links for new contracts rather than repo-only links.
  for (const match of content.matchAll(/\]\(([^)]+(?:cli-al-tools|al18-capabilities|bcquality-provider-contract|bcquality-task-context)\.md)\)/g)) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]));
    check(generated.has(target), `${file}: bundled reference ${target}`);
  }
  if (file.includes('/agents/')) {
    const agent = split(content);
    check(Array.isArray(agent.data.tools) && agent.data.tools.length > 0, `${file}: explicit tools`);
    check(!agent.data.tools.includes('*'), `${file}: no unrestricted grant`);
    check(agent.data.tools.every(t => /^(read|search|edit|execute|agent|web)$/.test(t) || /^(al-symbols-mcp|context7|microsoft-docs)\/\*$/.test(t)), `${file}: host tool vocabulary`);
    check(agent.data.model === 'claude-sonnet-4.6', `${file}: retains canonical Copilot model`);
    const source = split(read(`claude-plugin/agents/${agent.data.name}.md`));
    check(agent.body === bodyFor(source.body), `${file}: complete source workflow retained`);
  }
  if (file.includes('/commands/')) {
    const command = split(content);
    check(!('allowed-tools' in command.data), `${file}: no Claude command permissions`);
    check(!content.includes('.claude/rules'), `${file}: no Claude instruction destination`);
  }
}
const conductor = split(read('claude-plugin/agents/al-conductor.md'));
const originalBody = conductor.body.slice(conductor.body.indexOf('\n# AL Conductor Agent'));
check(crypto.createHash('sha256').update(originalBody).digest('hex') === '78c25bb0a3972cf1b6448203dfedbf38583de3aac03ac89e1ecf16f43c1ee42d', 'Claude Conductor workflow baseline, including explicit BCQuality provider contract, preserved byte for byte');
check(conductor.data.model === 'haiku', 'Claude Conductor model unchanged');
check(!conductor.data.tools.includes('mcp__'), 'Conductor does not acquire AL MCP execution');
for (const file of fs.readdirSync(path.join(ROOT, 'claude-plugin/agents'))) {
  const agent = split(read('claude-plugin/agents/' + file));
  check(agent.body.includes('../skills/skill-migrate/references/cli-al-tools.md'), `${file}: contract is directly reachable`);
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
assert.throws(() => toolsFor('Read, UnknownTool'), /Unmapped Claude tool/); checks++;
const oversized = [...generated].filter(([p, c]) => p.includes('/agents/') && split(c).body.length > 30000).map(([p]) => path.basename(p));
console.log(`CLI plugin packaging: ${checks} checks passed (static only).`);
console.log(`Pending host load/size verification: ${oversized.join(', ')}. No workflow was truncated.`);
