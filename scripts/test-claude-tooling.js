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
// 5.4.0: al-presales and al-agent-builder ship in the optional aldc-extras plugin; their grants are checked there.
const agentText = id => files.get(`agents/${id}.md`) ?? fs.readFileSync(path.join(root, 'claude-plugin-extras', 'agents', `${id}.md`), 'utf8');
const tools = id => split(agentText(id)).data.tools.split(/,\s*/);
// 6.0.0: the 5.4.0 aliases are gone from the Claude plugin; their canonical contracts stay on the other surfaces.
const REMOVED = ['al-developer', 'al-implement-subagent', 'al-review-subagent', 'al-developer-reviewer', 'dredd', 'al-planning-subagent'];
const CLAUDE_AGENTS = AGENTS.filter(({ id }) => !REMOVED.includes(id));

test('Claude specialists can request LSP while research agents cannot write or delegate', () => {
  for (const { id } of CLAUDE_AGENTS) {
    assert.equal(tools(id).includes('LSP'), id !== 'al-conductor', id);
  }
  // 5.4.0: al-researcher and al-reviewer (every scope, audit included) are read-only; the old names are aliases.
  for (const id of ['al-researcher', 'al-reviewer']) {
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


test('official AL MCP writes belong only to implementation, never a wildcard', () => {
  const queries = ['al_symbolsearch', 'al_getdiagnostics', 'al_getpackagedependencies'];
  const writes = ['al_compile', 'al_build', 'al_downloadsymbols'];
  for (const id of [...new Set([...CLAUDE_AGENTS.map((a) => a.id), 'al-implementer', 'al-reviewer', 'al-researcher'])]) {
    const names = tools(id);
    const expected = id === 'al-conductor' ? [] : queries.map(n => `mcp__al__${n}`);
    if (id === 'al-implementer') expected.push(...writes.map(n => `mcp__al__${n}`));
    assert.deepEqual(names.filter(n => n.startsWith('mcp__al__')).sort(), expected.sort(), id);
    for (const field of ['hooks', 'mcpServers', 'permissionMode']) {
      assert.equal(split(agentText(id)).data[field], undefined, `${id}: unsupported ${field}`);
    }
  }
});


test('capture proxy grants stay in Triage and no optional server is autostarted', () => {
  for (const { id } of CLAUDE_AGENTS) {
    for (const proxy of ['bc-profiling', 'bc-snapshot']) {
      assert.equal(tools(id).includes(`mcp__${proxy}__*`), id === 'al-triage', `${id}: ${proxy}`);
    }
  }
  const servers = JSON.parse(files.get('.mcp.json')).mcpServers;
  for (const name of ['al', 'bc-profiling', 'bc-snapshot']) assert.equal(servers[name], undefined);
});
