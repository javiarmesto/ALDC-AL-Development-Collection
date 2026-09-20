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


test('official AL MCP grants are explicit and compilation belongs to implementation', () => {
  const { toolsForRole } = require('./copilot-cli-adapter');
  const roles = fs.readdirSync(path.join(pluginRoot, 'agents')).map(n => n.replace('.agent.md', ''));
  for (const id of roles) {
    const expected = id === 'al-conductor' ? [] : ['al/al_symbolsearch', 'al/al_getdiagnostics', 'al/al_getpackagedependencies'];
    if (['al-developer', 'al-implement-subagent'].includes(id)) expected.push('al/al_compile', 'al/al_build', 'al/al_downloadsymbols');
    assert.deepEqual(toolsForRole(id).filter(t => t.startsWith('al/')).sort(), expected.sort(), id);
  }
  const manifest = JSON.parse(read(pluginRoot, 'plugin.json'));
  assert.equal(manifest.lspServers, undefined, 'no duplicate AL LSP registration');
  for (const server of ['al', 'bc-profiling', 'bc-snapshot']) assert.equal(manifest.mcpServers[server], undefined, 'optional providers do not autostart');
});

test('capture grants stay in Triage and Dredd cannot write, execute or delegate', () => {
  const { toolsForRole } = require('./copilot-cli-adapter');
  for (const file of fs.readdirSync(path.join(pluginRoot, 'agents'))) {
    const id = file.replace('.agent.md', '');
    for (const proxy of ['bc-profiling/*', 'bc-snapshot/*']) assert.equal(toolsForRole(id).includes(proxy), id === 'al-triage', id);
  }
  const dredd = toolsForRole('dredd');
  for (const tool of ['edit', 'execute', 'task', 'list_agents', 'read_agent', '*']) assert.ok(!dredd.includes(tool), tool);
  const body = read(pluginRoot, 'agents/dredd.agent.md');
  assert.ok(body.includes('persistence pending'));
  assert.ok(!body.includes('Otherwise **persist**'));
  assert.ok(body.includes('${PLUGIN_ROOT}/scripts/save-audit.js'));
  assert.throws(() => require('./copilot-cli-adapter').adaptDreddPersistence('Changed contract'), /anchor changed/);
});

test('Dredd saver preserves bytes, never overwrites, and writes only reports', t => {
  const { saveAudit } = require('../copilot-cli-plugin/scripts/save-audit');
  const project = temp(t);
  write(project, 'src/Example.al', 'original AL');
  const report = '{\n "audit":{"gate":"advisory","verdict":"INCOMPLETE"}, "summary":{}, "findings":[], "note":"Do not execute $(touch escape) or ../src/Example.al"\n}\n';
  const first = saveAudit({ project, report }), second = saveAudit({ project, report });
  assert.notEqual(first.path, second.path);
  for (const receipt of [first, second]) {
    assert.equal(path.dirname(receipt.path), path.join(project, '.github/audits'));
    assert.equal(fs.readFileSync(receipt.path, 'utf8'), report);
    assert.equal(receipt.sha256, require('node:crypto').createHash('sha256').update(report).digest('hex'));
  }
  assert.equal(read(project, 'src/Example.al'), 'original AL');
  assert.equal(fs.existsSync(path.join(project, 'escape')), false);
});

test('Dredd saver rejects invalid reports and symlinked audit destinations', t => {
  const { saveAudit } = require('../copilot-cli-plugin/scripts/save-audit');
  const project = temp(t);
  for (const report of ['not JSON', '[]', '{}', '{"audit":{"gate":"blocking","verdict":"PASS"},"summary":{},"findings":[]}']) {
    assert.throws(() => saveAudit({ project, report }));
    assert.equal(fs.existsSync(path.join(project, '.github')), false);
  }
  const report = '{"audit":{"gate":"advisory","verdict":"PASS"},"summary":{},"findings":[]}';
  const outside = temp(t);
  fs.symlinkSync(outside, path.join(project, '.github'), 'junction');
  assert.throws(() => saveAudit({ project, report }), /real directory/);
  assert.deepEqual(fs.readdirSync(outside), []);
  fs.unlinkSync(path.join(project, '.github'));
  fs.mkdirSync(path.join(project, '.github'));
  fs.symlinkSync(outside, path.join(project, '.github/audits'), 'junction');
  assert.throws(() => saveAudit({ project, report }), /real directory/);
  assert.deepEqual(fs.readdirSync(outside), []);
});

test('CLI audit writer accepts stdin verbatim and rejects invalid UTF-8', t => {
  const { spawnSync } = require('node:child_process');
  const project = temp(t);
  const script = path.join(pluginRoot, 'scripts/save-audit.js');
  const args = [script, '--project', project, '--input', '-'];
  const report = '{"audit":{"gate":"advisory","verdict":"PASS"},"findings":[],"summary":{"note":"á"}}\r\n';
  const saved = spawnSync(process.execPath, args, { input: report, encoding: 'utf8' });
  assert.equal(saved.status, 0, saved.stderr);
  assert.equal(fs.readFileSync(JSON.parse(saved.stdout).path, 'utf8'), report);
  const invalid = spawnSync(process.execPath, args, { input: Buffer.from([0xff]), encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.equal(fs.readdirSync(path.join(project, '.github/audits')).length, 1);
});

test('CLI bootstrap leaves existing provider configuration unchanged through update and rollback', t => {
  const project = temp(t);
  const settings = {
    '.mcp.json': '{"mcpServers":{"my-official-al":{"command":"existing-altool"}}}\n',
    '.github/mcp.json': '{"mcpServers":{"custom":{"command":"existing"}}}\n',
    '.github/lsp.json': '{"lspServers":{"existing-al":{"command":"existing-wrapper","fileExtensions":{".al":"al"}}}}\n',
    '.claude/settings.json': '{"enabledPlugins":{"existing-lsp@marketplace":true}}\n',
  };
  for (const [file, content] of Object.entries(settings)) write(project, file, content);
  for (const operation of [{}, { apply: true }, { apply: true }, { check: true }, { rollback: true }]) {
    initialize({ project, pluginRoot, ...operation });
    for (const [file, content] of Object.entries(settings)) assert.equal(read(project, file), content, file);
  }
});
