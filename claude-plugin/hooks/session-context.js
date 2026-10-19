#!/usr/bin/env node
'use strict';
// Adapted from Lab b2ce9d9.../hooks/session-context.mjs: bounded, read-only routing.
// aldc-claude: also states the autonomy mode, warns visibly about what would silently
// degrade the run (no rules for the main session, no BCQuality), and records the
// session start so the Stop hook only guards plans created in this session.
const fs = require('fs');
const path = require('path');
const runtime = require('./aldc-runtime');
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
function warnings(cwd) {
  const out = [];
  if (!fs.existsSync(path.join(cwd, '.claude', 'rules', 'al-guidelines.md')))
    out.push('ALDC rules are not in .claude/rules/: the main session will not auto-apply them. Run /aldc:al-initialize to install them (ALDC subagents still receive them inline from the plugin).');
  if (runtime.bcqualityInstalled() === false)
    out.push('BCQuality plugin is not installed: reviews run with ALDC native checks only. Install it (claude plugin install bcquality@bcquality) for citable BCQuality findings.');
  if (runtime.pluginInstalled('aldc-verify') === false)
    out.push('aldc-verify is not installed: ALDC has no compile/analyzer evidence for its phases (it relies on aldc-verify instead of duplicating it). Install it for verified builds.');
  return out;
}
function gateText(mode) {
  if (mode.gates !== 'pre-approved')
    return `ALDC autonomy: human (from ${mode.source}). Stop at every human gate and wait for explicit approval.\n`;
  return `ALDC autonomy: pre-approved (from ${mode.source}). The requester approved the gates in advance: every human gate ` +
    '(plan approval, phase checkpoints, handoffs) is a recorded checkpoint in <plans.root>/<req>/decisions.md and the work ' +
    `continues without waiting. ⛔ hard stops still stop. Git commits: ${mode.commit ? 'allowed' : 'not allowed; leave the commit message in the phase file'}.\n`;
}
function testText(runner) {
  if (!runner) return 'ALDC tests: no test runner configured (aldc.yaml testing.runner); tests are compiled, not executed. Report them as not-run.\n';
  return `ALDC tests: run \`${runner.command}\` from the project root after each phase compiles (from ${runner.source}); pass its PASS/FAIL output to the reviewer and record it in the phase file and the final Verification table.\n`;
}
function context(payload, pluginRoot = path.resolve(__dirname, '..')) {
  if (typeof payload?.cwd !== 'string' || !payload.cwd) return null;
  const cwd = payload.cwd;
  if (!fs.existsSync(path.join(cwd,'aldc.yaml')) && !hasApp(cwd)) return null;
  runtime.writeState(runtime.sessionFile(payload.session_id), { cwd, start: Date.now() });
  const warn = warnings(cwd).map((w) => `⚠️ ALDC: ${w}\n`).join('');
  return { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext:
    fs.readFileSync(path.join(pluginRoot,'project-guidance.md'),'utf8') + gateText(runtime.autonomy(cwd)) + testText(runtime.testRunner(cwd)) + warn +
    `Read the terminal tool contract at ${path.join(pluginRoot,'skills/skill-migrate/references/cli-al-tools.md')}. Plugin root: ${pluginRoot}. Initialization is an explicit user action.\n` },
    ...(warn ? { systemMessage: warn.trim() } : {}) };
}
if (require.main === module) {
  try { const result = context(runtime.readStdin()); if (result) console.log(JSON.stringify(result)); }
  catch { /* Malformed hook input is not an AL capability failure. */ }
}
module.exports = { context, hasApp, warnings };
