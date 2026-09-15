#!/usr/bin/env node
'use strict';
// Artifact integration/permission checks, not a simulated model or host run.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { split } = require('./sync-copilot-cli');
const { project } = require('./native-profile');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
const agent = split(read('agents/al-spec-agent.agent.md'));
const prompt = split(read('prompts/al-spec.create.prompt.md'));
check(prompt.data.agent === agent.data.name, 'Chat prompt selects registered role name');
check(!prompt.data.model, 'Prompt does not override host model selection');
for (const handoff of agent.data.handoffs) {
  check(handoff.send === false, 'Forward handoff is not automatically submitted');
}
for (const source of ['agents/al-spec-agent.agent.md', 'prompts/al-spec.create.prompt.md']) {
  for (const profile of ['bc28', 'bc29-native']) {
    const doc = split(profile === 'bc28' ? read(source) : project(source, Buffer.from(read(source))).toString());
    check(doc.data.tools.some(t => t.startsWith('edit/')), `${profile} can author the spec`);
    check(!doc.data.tools.some(t => /execute|rename|al_build|al_download|al_debug|publish|runCommand/i.test(t)), `${profile} has no execution, setup or AL rename grant`);
  }
}
const surfaces = [
  ['prompts/al-spec.create.prompt.md', 'agents/al-spec-agent.agent.md'],
  ['packages/foundation/prompts/al-spec.create.prompt.md', 'packages/foundation/agents/al-spec-agent.agent.md'],
  ['claude-plugin/commands/al-spec-create.md', 'claude-plugin/agents/al-spec-agent.md'],
  ['copilot-cli-plugin/commands/al-spec-create.md', 'copilot-cli-plugin/agents/al-spec-agent.agent.md'],
  ['plugins/aldc-codex/skills/aldc/references/commands/al-spec-create.md', 'plugins/aldc-codex/skills/aldc/references/agents/al-spec-agent.md'],
];
for (const [entry, role] of surfaces) {
  if (entry.startsWith('packages/foundation/') && !fs.existsSync(path.join(root, 'packages/foundation'))) continue; // npm uses root sources, not the VSIX staging tree.
  const entryBody = entry.includes('aldc-codex') ? read(entry) : split(read(entry)).body;
  const links = [...entryBody.matchAll(/\]\(([^)]+)\)/g)].map(m => path.posix.normalize(path.posix.join(path.posix.dirname(entry), m[1])));
  check(links.includes(role), `${entry} resolves the single role contract`);
  checkReferences(role);
}
function checkReferences(role) {
  const body = role.includes('aldc-codex') ? read(role) : split(read(role)).body;
  const refs = [...body.matchAll(/\]\((\.\.\/[^)]+\.md)\)|`(\.\.\/[^`]+\.md)`/g)].map(m => m[1] || m[2]);
  check(refs.length >= 8, `${role} explicitly routes template and domain guides`);
  for (const ref of refs) {
    check(fs.existsSync(path.resolve(root, path.dirname(role), ref)), `${role}: bundled governing reference ${ref}`);
  }
}
if (fs.existsSync(path.join(root, '.claude/agents/al-spec-agent.md'))) checkReferences('.claude/agents/al-spec-agent.md');
// Every authoring surface must resolve the same decomposition template, including
// the separately mirrored Claude Architect and Codex's relocated references.
const architectureRoles = [
  ['agents/al-architect.agent.md', 'docs/templates/architecture-template.md'],
  ['agents/al-spec-agent.agent.md', 'docs/templates/architecture-template.md'],
  ['packages/foundation/agents/al-architect.agent.md', 'packages/foundation/docs/templates/architecture-template.md'],
  ['packages/foundation/agents/al-spec-agent.agent.md', 'packages/foundation/docs/templates/architecture-template.md'],
  ['claude-plugin/agents/al-architect.md', 'claude-plugin/docs/templates/architecture-template.md'],
  ['claude-plugin/agents/al-spec-agent.md', 'claude-plugin/docs/templates/architecture-template.md'],
  ['copilot-cli-plugin/agents/al-architect.agent.md', 'copilot-cli-plugin/docs/templates/architecture-template.md'],
  ['copilot-cli-plugin/agents/al-spec-agent.agent.md', 'copilot-cli-plugin/docs/templates/architecture-template.md'],
  ['plugins/aldc-codex/skills/aldc/references/agents/al-architect.md', 'plugins/aldc-codex/skills/aldc/references/templates/architecture-template.md'],
  ['plugins/aldc-codex/skills/aldc/references/agents/al-spec-agent.md', 'plugins/aldc-codex/skills/aldc/references/templates/architecture-template.md'],
  ['.claude/agents/al-architect.md', 'docs/templates/architecture-template.md'],
  ['.claude/agents/al-spec-agent.md', 'docs/templates/architecture-template.md'],
];
for (const [role, template] of architectureRoles) {
  if ((role.startsWith('packages/foundation/') || role.startsWith('.claude/')) && !fs.existsSync(path.join(root, role))) continue;
  const links = [...read(role).matchAll(/\]\(([^)]+architecture-template\.md)\)/g)]
    .map(m => path.posix.normalize(path.posix.join(path.posix.dirname(role), m[1])));
  check(links.includes(template), `${role}: decomposition template resolves in this host`);
  check(read(template) === read('docs/templates/architecture-template.md'), `${role}: complete current decomposition template is bundled`);
}

for (const rel of ['claude-plugin/agents/al-spec-agent.md', 'copilot-cli-plugin/agents/al-spec-agent.agent.md']) {
  const tools = split(read(rel)).data.tools;
  check(!/\b(?:Bash|Task|execute|agent)\b/.test(Array.isArray(tools) ? tools.join(',') : tools), `${rel}: no delegated execution grant`);
}
console.log(`Spec integration: ${checks} routing/reference/permission checks; no model behavior or host loading claimed.`);
