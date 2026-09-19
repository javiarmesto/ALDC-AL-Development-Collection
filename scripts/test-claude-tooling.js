'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build, AGENTS } = require('./sync-plugin-support');
const { split } = require('./generation-utils');
const { initialize } = require('./init-plugin');
const root = path.resolve(__dirname, '..');
const files = build().files;
const tools = id => split(files.get(`agents/${id}.md`)).data.tools.split(/,\s*/);

test('Claude specialists can request LSP while research agents cannot write or delegate', () => {
  for (const { id } of AGENTS) {
    assert.equal(tools(id).includes('LSP'), id !== 'al-conductor', id);
  }
  for (const id of ['al-planning-subagent', 'al-review-subagent', 'al-developer-reviewer']) {
    for (const forbidden of ['Write', 'Edit', 'Bash', 'Task', 'Agent']) {
      assert.ok(!tools(id).includes(forbidden), `${id}: ${forbidden}`);
    }
  }
});

test('ALDC does not register a duplicate LSP or replace existing MCP providers', () => {
  const manifest = JSON.parse(files.get('.claude-plugin/plugin.json'));
  assert.equal(manifest.lspServers, undefined);
  assert.equal(files.has('.lsp.json'), false);
  assert.deepEqual(manifest.mcpServers, JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'))).mcpServers);
  assert.ok(files.has('docs/claude-al-tooling.md'));
});

test('Claude initialization, update, verification and rollback preserve provider settings', t => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-claude-tooling-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const preserved = {
    '.mcp.json': '{"mcpServers":{"existing-al":{"command":"existing-wrapper","args":[]}}}\n',
    '.claude/settings.json': '{"enabledPlugins":{"existing-al-lsp@local":true},"env":{"ENABLE_LSP_TOOL":"1"}}\n',
    '.claude/settings.local.json': '{"permissions":{"deny":["Bash(curl *)"]}}\n',
    '.lsp.json': '{"al":{"command":"existing-lsp","extensionToLanguage":{".al":"al"}}}\n',
  };
  for (const [rel, content] of Object.entries(preserved)) {
    fs.mkdirSync(path.dirname(path.join(project, rel)), { recursive: true });
    fs.writeFileSync(path.join(project, rel), content);
  }
  const options = { project, pluginRoot: path.join(root, 'claude-plugin') };
  for (const operation of [{}, { apply: true }, { apply: true }, { check: true }, { rollback: true }]) {
    initialize({ ...options, ...operation });
    for (const [rel, content] of Object.entries(preserved)) {
      assert.equal(fs.readFileSync(path.join(project, rel), 'utf8'), content, rel);
    }
  }
});
