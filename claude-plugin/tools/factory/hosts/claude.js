'use strict';
// ALDC factory host adapter: Claude Code. One role call = one `claude -p` subsession.
//
// The subsession runs in the role's cwd (the ticket's worktree for an implementer) with
// ALDC_GATES=pre-approved, so the ALDC and aldc-verify hooks of each subsession still apply
// (agent briefs, SubagentStop/Stop compile gates, the evidence Stop hook).
//
// Options (create) or environment:
//   model       ALDC_FACTORY_MODEL         default sonnet
//   pluginDirs  ALDC_FACTORY_PLUGIN_DIRS   path-delimited list passed as --plugin-dir (for evals)
//   settings    ALDC_FACTORY_SETTINGS      JSON string or file passed as --settings
//   bin         ALDC_FACTORY_CLAUDE        the claude executable (default: claude)
// The permission mode is bypassPermissions: the factory runs unattended, the guard hook of
// aldc-verify still denies merges, force pushes and pushes to the default branch.
const { spawn } = require('child_process');
const path = require('path');

function create(options = {}) {
  const model = options.model || process.env.ALDC_FACTORY_MODEL || 'sonnet';
  const pluginDirs = options.pluginDirs || (process.env.ALDC_FACTORY_PLUGIN_DIRS || '').split(path.delimiter).filter(Boolean);
  const settings = options.settings || process.env.ALDC_FACTORY_SETTINGS || null;
  const bin = options.bin || process.env.ALDC_FACTORY_CLAUDE || 'claude';
  const spawnImpl = options.spawn || spawn;

  function argsFor(call) {
    const args = ['-p', call.prompt, '--model', model, '--output-format', 'json', '--permission-mode', 'bypassPermissions'];
    if (call.agent) args.push('--agent', call.agent);
    if (call.budget) args.push('--max-budget-usd', String(Math.max(0.05, +call.budget.toFixed(2))));
    for (const d of pluginDirs) args.push('--plugin-dir', d);
    if (settings) args.push('--settings', settings);
    // The plan folder lives in the main checkout; a worktree subsession must be able to read it.
    if (call.project && path.resolve(call.cwd) !== path.resolve(call.project)) args.push('--add-dir', call.project);
    return args;
  }

  return {
    name: 'claude',
    describe: () => ({ name: 'claude', model, subsessions: 'claude -p', pluginDirs }),
    argsFor,
    run(call) {
      return new Promise((resolve) => {
        const started = Date.now();
        const env = { ...process.env, ALDC_GATES: 'pre-approved', CLAUDE_CODE_DISABLE_BACKGROUND_TASKS: '1' };
        const child = spawnImpl(bin, argsFor(call), { cwd: call.cwd, env, windowsHide: true });
        let stdout = '', stderr = '';
        child.stdout?.on('data', (d) => { stdout += d; });
        child.stderr?.on('data', (d) => { stderr += d; });
        const timer = call.timeoutMs ? setTimeout(() => child.kill('SIGTERM'), call.timeoutMs) : null;
        child.on('error', (e) => { if (timer) clearTimeout(timer); resolve({ ok: false, exit: 127, cost: 0, seconds: (Date.now() - started) / 1000, text: '', session: null, error: `${bin}: ${e.message}` }); });
        child.on('close', (code) => {
          if (timer) clearTimeout(timer);
          let json = {};
          try { json = JSON.parse(stdout.slice(stdout.indexOf('{'))); } catch { /* not JSON: a crash or a kill */ }
          const exit = code ?? 1;
          resolve({
            ok: exit === 0 && !json.is_error,
            exit,
            cost: json.total_cost_usd || 0,
            seconds: (Date.now() - started) / 1000,
            text: json.result || '',
            session: json.session_id || null,
            error: exit === 0 ? undefined : stderr.slice(-2000),
          });
        });
      });
    },
  };
}

module.exports = { create };
