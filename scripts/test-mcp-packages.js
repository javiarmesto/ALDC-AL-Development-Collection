#!/usr/bin/env node
// Every MCP server ALDC declares must be resolvable. Two npm packages shipped in
// 5.0.0 did not exist at all (E404), so `al-symbols-mcp` and `microsoft-docs` closed
// their connection on every start, in every host, since they were introduced - and
// nothing here noticed, because no check ever asked the registry whether a declared
// package was real.
//
// Two tiers, deliberately:
//   shape     - offline, always runs, never fails for reasons outside this repo.
//   registry  - asks npm. Skipped, loudly, when the registry is unreachable; a
//               network outage must not turn a green tree red, but a silent skip
//               would recreate exactly the blind spot this test exists to close.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }

// Manifests that reach a user. `.mcp.json` is this repository's own development
// config: it must resolve, but it may track a floating version.
const DISTRIBUTED = ['plugin.json', 'claude-plugin/.claude-plugin/plugin.json',
  'claude-plugin/.mcp.json', 'copilot-cli-plugin/plugin.json'];
const DEVELOPMENT = ['.mcp.json'];

function servers(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return [];
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
  return Object.entries(data.mcpServers || {}).map(([name, spec]) => ({ file, name, spec }));
}

// The package is the first argument that is not a flag: `npx -y <pkg>`.
const packageOf = spec => (spec.args || []).find(a => !a.startsWith('-'));
const numeric = '(?:0|[1-9][0-9]*)';
const prerelease = `(?:${numeric}|[0-9]*[A-Za-z-][0-9A-Za-z-]*)`;
const exactVersion = new RegExp(`^${numeric}\\.${numeric}\\.${numeric}(?:-${prerelease}(?:\\.${prerelease})*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$`);
const unversioned = pkg => {
  // A scope leads with '@', so only a later '@' carries the version. A dist-tag
  // (`@latest`) is not a pin: it resolves to whatever was published last, so two
  // installs of the same ALDC release can run different code.
  const at = pkg.lastIndexOf('@');
  return at <= 0 || !exactVersion.test(pkg.slice(at + 1));
};

for (const name of ['al-mcp-server', '@scope/server']) {
  for (const version of ['2.5.0', '0.0.0', '2.5.0-rc.1', '2.5.0+build.01']) {
    check(!unversioned(`${name}@${version}`), `Accept exact version: ${name}@${version}`);
  }
  for (const version of ['', 'latest', '2', '2.5', '2.x', '2.5.*', '^2.5.0', '~2.5.0',
    '>=2.5.0', '2.5.0 || 3.0.0', '2.5.0 - 3.0.0', '02.5.0', '2.5.0-01', '2.5.0junk']) {
    check(unversioned(`${name}@${version}`), `Reject non-exact version: ${name}@${version}`);
  }
  check(unversioned(name), `Reject missing version: ${name}`);
}

const declared = [...DISTRIBUTED, ...DEVELOPMENT].flatMap(servers);
check(declared.length > 0, 'Found MCP server declarations to check');

// --- shape -----------------------------------------------------------------
const npm = [];
for (const { file, name, spec } of declared) {
  if (spec.command !== 'npx') {
    // Anything not launched through npx is out of the registry's reach. An http
    // server is checked by its URL shape only; a local command (ALMCP's `al`) can
    // not be resolved on CI at all and belongs to Doctor, not here.
    if (spec.type === 'http') check(/^https:\/\//.test(spec.url || ''), `${file}: ${name} uses https`);
    continue;
  }
  const pkg = packageOf(spec);
  check(!!pkg, `${file}: ${name} names a package`);
  if (DISTRIBUTED.includes(file)) {
    check(!unversioned(pkg), `${file}: ${name} pins a version (${pkg}) - a distributed manifest must be reproducible`);
  }
  npm.push({ file, name, pkg });
}

// --- registry --------------------------------------------------------------
function reachable() {
  try { execFileSync('npm', ['ping'], { stdio: 'ignore', timeout: 20000 }); return true; }
  catch { return false; }
}

const unique = [...new Set(npm.map(e => e.pkg))];
if (!unique.length) {
  console.log('MCP packages: no npx-launched servers declared');
} else if (!reachable()) {
  // Loud on purpose. This is the tier that catches a nonexistent package.
  console.log(`MCP packages: registry unreachable, ${unique.length} package(s) NOT verified to exist:`);
  for (const pkg of unique) console.log(`  unverified  ${pkg}`);
} else {
  for (const pkg of unique) {
    let resolved = null;
    try {
      resolved = execFileSync('npm', ['view', pkg, 'version'], { encoding: 'utf8', timeout: 60000 }).trim();
    } catch (error) {
      const detail = `${error.stdout || ''}${error.stderr || ''}`;
      const missing = /E404|404 Not Found/.test(detail);
      assert.fail(`${pkg} ${missing ? 'does not exist in the npm registry' : 'could not be resolved'}`
        + ` (declared by ${npm.filter(e => e.pkg === pkg).map(e => `${e.file}:${e.name}`).join(', ')})`);
    }
    check(!!resolved, `${pkg} resolves (${resolved})`);
  }
}

console.log(`MCP package checks passed (${checks} checks, ${unique.length} package(s))`);
