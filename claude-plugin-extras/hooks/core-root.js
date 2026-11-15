#!/usr/bin/env node
'use strict';
// aldc-extras: SessionStart. The extras contracts read core files as <aldc-root>/... because
// ${CLAUDE_PLUGIN_ROOT} names only this plugin. This hook finds the installed aldc plugin and
// states its folder, or warns that aldc (a declared dependency) is missing. Read-only.
const fs = require('fs');
const os = require('os');
const path = require('path');

const EXTRAS_ROOT = path.resolve(__dirname, '..');
const INSTALL = 'claude plugin install aldc@aldc-marketplace';
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const isCore = (dir) => typeof dir === 'string' && fs.existsSync(path.join(dir, 'docs', 'claude-runtime.md')) &&
  (readJson(path.join(dir, '.claude-plugin', 'plugin.json')) || {}).name === 'aldc';
const byVersionDesc = (a, b) => {
  const pa = a.split(/[.-]/).map(Number), pb = b.split(/[.-]/).map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pb[i] || 0) !== (pa[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
  return 0;
};

/** The aldc core folder: installed_plugins.json first, then a clone, then the plugin cache. */
function coreRoot(home = os.homedir(), extrasRoot = EXTRAS_ROOT) {
  const data = readJson(path.join(home, '.claude', 'plugins', 'installed_plugins.json'));
  const plugins = data ? (data.plugins || data) : {};
  for (const [id, entries] of Object.entries(plugins)) {
    if (!/^aldc@/.test(id)) continue;
    const found = [].concat(entries).map((e) => e && e.installPath).find(isCore);
    if (found) return path.resolve(found);
  }
  const candidates = [path.join(extrasRoot, '..', 'claude-plugin')];
  const cache = path.join(extrasRoot, '..', '..', 'aldc');
  try { candidates.push(...fs.readdirSync(cache).sort(byVersionDesc).map((v) => path.join(cache, v))); } catch { /* not a cache layout */ }
  const found = candidates.find(isCore);
  return found ? path.resolve(found) : null;
}

function context(home, extrasRoot) {
  const root = coreRoot(home, extrasRoot);
  if (root) return { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext:
    `aldc-extras: aldc core root is ${root}. In aldc-extras contracts <aldc-root> means that folder; ${path.join(root, 'docs', 'claude-runtime.md')} is binding.\n` } };
  const warn = `aldc-extras needs the aldc plugin (^5.4.0) and it was not found. Install it with \`${INSTALL}\` and restart Claude Code. ` +
    'Until then /aldc-extras roles cannot read the shared runtime rules, templates or the al-agent-toolkit rule: stop and tell the user.';
  return { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: `⚠️ ${warn}\n` }, systemMessage: `⚠️ ${warn}` };
}

if (require.main === module) {
  try { console.log(JSON.stringify(context())); } catch { /* never block a session because of this hook */ }
}
module.exports = { coreRoot, context };
