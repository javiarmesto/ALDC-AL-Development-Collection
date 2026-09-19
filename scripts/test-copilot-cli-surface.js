'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { initialize } = require('../copilot-cli-plugin/scripts/init');
const { inspectShadowing } = require('./copilot-cli-bootstrap');
const { verify } = require('./package-provenance');
const root = path.resolve(__dirname, '..');
const pluginRoot = path.join(root, 'copilot-cli-plugin');
function temp(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-cli-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }
function write(root, name, content) { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), content); }
const read = (dir, name) => fs.readFileSync(path.join(dir, name), 'utf8');

test('CLI MCP rejects nonexistent provider and floating/range pins without changing tool identity', () => {
  const { validateManifest } = require('./test-copilot-cli-mcp');
  const manifest = JSON.parse(read(pluginRoot, 'plugin.json'));
  assert.equal(validateManifest(manifest), 'al-mcp-server@2.5.0');
  for (const pkg of ['@nicholasglazer/al-symbols-mcp', '@nicholasglazer/al-symbols-mcp@1.0.0', 'al-mcp-server', 'al-mcp-server@latest', 'al-mcp-server@2.x', 'al-mcp-server@2.5', 'al-mcp-server@^2.5.0']) {
    const invalid = structuredClone(manifest);
    invalid.mcpServers['al-symbols-mcp'].args[1] = pkg;
    assert.throws(() => validateManifest(invalid), /exact version pin/, pkg);
  }
  const correctedSource = structuredClone(manifest.mcpServers);
  assert.deepEqual(Object.keys(correctedSource), ['al-symbols-mcp', 'context7', 'microsoft-docs']);
});

test('CLI bootstrap uses AGENTS.md even beside a Codex override; no role copies', t => {
  const project = temp(t);
  write(project, 'AGENTS.md', 'My instructions\r\n');
  write(project, 'AGENTS.override.md', 'Codex-only instructions\n');
  write(project, '.github/plans/memory.md', 'Approved memory');
  verify(pluginRoot);
  const preview = initialize({ project, pluginRoot });
  assert.equal(preview.guidance, 'AGENTS.md');
  assert.equal(read(project, 'AGENTS.md'), 'My instructions\r\n');
  assert.equal(fs.existsSync(path.join(project, '.aldc-install')), false);
  initialize({ project, pluginRoot, apply: true });
  assert.match(read(project, 'AGENTS.md'), /^My instructions\r\n/);
  assert.match(read(project, 'AGENTS.md'), /BEGIN ALDC CLI/);
  assert.equal(read(project, 'AGENTS.override.md'), 'Codex-only instructions\n');
  assert.equal(read(project, '.github/plans/memory.md'), 'Approved memory');
  for (const dir of ['.github/agents', '.github/skills', '.agents', '.claude', '.vscode']) assert.equal(fs.existsSync(path.join(project, dir)), false, dir);
  assert.equal(initialize({ project, pluginRoot, apply: true }).transaction, null);
  initialize({ project, pluginRoot, rollback: true });
  assert.equal(read(project, 'AGENTS.md'), 'My instructions\r\n');
  assert.equal(read(project, 'AGENTS.override.md'), 'Codex-only instructions\n');
});

test('precedence inspection detects ID/name collisions across project, parent and user', t => {
  const dir = temp(t), project = path.join(dir, 'project'), home = path.join(dir, 'home');
  fs.mkdirSync(project);
  write(project, '.github/agents/al-architect.agent.md', 'custom');
  write(project, '.agents/skills/different-folder/SKILL.md', "---\nname: 'skill-api'\n---\ncustom");
  write(dir, '.github/agents/al-conductor.agent.md', 'parent');
  write(home, '.copilot/agents/dredd.md', 'user');
  write(project, '.claude/commands/al-build.md', 'custom command');
  const result = inspectShadowing(project, pluginRoot, { home, env: {} });
  assert.deepEqual(result.filter(x => x.name).map(x => x.name).sort(), ['al-architect', 'al-build', 'al-conductor', 'dredd', 'skill-api']);
  assert.equal(read(project, '.github/agents/al-architect.agent.md'), 'custom');
});

test('CLI customized instructions remain a collision; force/rollback preserves later edits', t => {
  const project = temp(t);
  const rule = '.github/instructions/al-guidelines.instructions.md';
  write(project, rule, 'My AL rules');
  let result = initialize({ project, pluginRoot, apply: true });
  assert.equal(result.files.find(f => f.path === rule).action, 'collision');
  assert.equal(read(project, rule), 'My AL rules');
  initialize({ project, pluginRoot, apply: true, force: true });
  initialize({ project, pluginRoot, rollback: true });
  assert.equal(read(project, rule), 'My AL rules');
  initialize({ project, pluginRoot, apply: true, force: true });
  write(project, rule, 'Later edits');
  assert.throws(() => initialize({ project, pluginRoot, rollback: true }), /Changed since installation/);
  assert.equal(read(project, rule), 'Later edits');
});

test('candidate does not broaden reviewer or Spec execution grants', () => {
  const { split } = require('./sync-copilot-cli');
  for (const id of ['al-review-subagent', 'al-developer-reviewer', 'al-spec-agent']) {
    const { data } = split(read(pluginRoot, `agents/${id}.agent.md`));
    for (const tool of ['execute', 'task', 'agent', 'bash', 'powershell']) assert.ok(!data.tools.includes(tool), `${id}: ${tool}`);
    if (id !== 'al-spec-agent') assert.ok(!data.tools.includes('edit'));
  }
  for (const id of ['al-planning-subagent', 'al-implement-subagent', 'al-review-subagent']) {
    assert.equal(split(read(pluginRoot, `agents/${id}.agent.md`)).data['user-invocable'], false);
  }
});
