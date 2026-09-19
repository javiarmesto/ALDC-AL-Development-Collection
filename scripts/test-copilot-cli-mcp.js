#!/usr/bin/env node
'use strict';
// Scoped adaptation of PR #108 scripts/test-mcp-packages.js (c6f57c0).
// Offline checks always run; --registry explicitly verifies the published
// package. Registry failures are unverified/failing, never a silent pass.
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function validateManifest(manifest) {
  const servers = manifest.mcpServers;
  assert.ok(servers && servers['al-symbols-mcp'], 'Missing al-symbols-mcp declaration');
  const symbol = servers['al-symbols-mcp'];
  assert.equal(symbol.type, 'stdio');
  assert.equal(symbol.command, 'npx');
  assert.equal(symbol.args.length, 2);
  assert.equal(symbol.args[0], '-y');
  const pkg = symbol.args[1];
  assert.match(pkg, /^al-mcp-server@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'Symbol package must be the verified provider with an exact version pin');
  for (const [name, server] of Object.entries(servers)) {
    if (server.type === 'http') assert.ok(server.url?.startsWith('https://'), `${name}: HTTPS endpoint required`);
  }
  assert.equal(servers['microsoft-docs']?.url, 'https://learn.microsoft.com/api/mcp');
  return pkg;
}
function verifyRegistry(pkg) {
  // Validate before passing anything to npm.cmd's shell on Windows.
  assert.match(pkg, /^al-mcp-server@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['view', pkg, 'name', 'version', 'repository.url', '--json'],
    { encoding: 'utf8', timeout: 45000, shell: process.platform === 'win32' });
  if (result.error || result.status !== 0) throw Error(`Registry UNVERIFIED for ${pkg}: ${result.error?.message || result.stderr}`);
  const record = JSON.parse(result.stdout);
  assert.equal(record.name, 'al-mcp-server');
  assert.equal(record.version, pkg.slice(pkg.lastIndexOf('@') + 1));
  assert.equal(record['repository.url'], 'git+https://github.com/StefanMaron/AL-Dependency-MCP-Server.git');
  return record;
}
if (require.main === module) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../copilot-cli-plugin/plugin.json')));
    const pkg = validateManifest(manifest);
    console.log(`CLI MCP shape passed: ${pkg}`);
    if (process.argv.includes('--registry')) console.log(JSON.stringify({ registry: 'verified', ...verifyRegistry(pkg) }, null, 2));
    else console.log('Registry not queried (offline checks only); use --registry. Server startup/tool calls are separate checks.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { validateManifest, verifyRegistry };
