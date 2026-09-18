#!/usr/bin/env node
'use strict';
// Adapted from Lab b2ce9d9.../hooks/session-context.mjs: bounded, read-only routing.
const fs = require('fs');
const path = require('path');
function hasApp(root, depth = 0) {
  if (depth > 3) return false;
  let entries; try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return false; }
  const manifest = entries.find(e => e.isFile() && e.name === 'app.json');
  if (manifest) {
    try {
      const app = JSON.parse(fs.readFileSync(path.join(root,manifest.name),'utf8'));
      if (typeof app.application === 'string' || typeof app.runtime === 'string') return true;
    } catch { /* Not a readable AL manifest; other bounded children may qualify. */ }
  }
  return entries.some(e =>
    e.isDirectory() && !e.name.startsWith('.') && !['node_modules','bin','obj'].includes(e.name) && hasApp(path.join(root,e.name),depth+1));
}
function context(payload, pluginRoot = path.resolve(__dirname, '..')) {
  if (typeof payload?.cwd !== 'string' || !payload.cwd) return null;
  const cwd = payload.cwd;
  if (!fs.existsSync(path.join(cwd,'aldc.yaml')) && !hasApp(cwd)) return null;
  return { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext:
    fs.readFileSync(path.join(pluginRoot,'project-guidance.md'),'utf8') +
    `Read the terminal tool contract at ${path.join(pluginRoot,'skills/skill-migrate/references/cli-al-tools.md')}. Plugin root: ${pluginRoot}. Initialization is an explicit user action; this hook writes nothing.\n` } };
}
if (require.main === module) {
  try { const result = context(JSON.parse(fs.readFileSync(0,'utf8'))); if (result) console.log(JSON.stringify(result)); }
  catch { /* Malformed hook input is not an AL capability failure. */ }
}
module.exports = { context, hasApp };
