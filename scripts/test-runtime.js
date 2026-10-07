'use strict';
// Test prerequisites only. Probe installed interpreters; never install one or
// change the user's PATH, execution aliases or Python configuration.
const { spawnSync } = require('node:child_process');

let python;
function runPython(args, options = {}) {
  const env = { ...process.env, ...options.env, PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1' };
  if (!python) {
    const candidates = process.env.ALDC_TEST_PYTHON
      ? [[process.env.ALDC_TEST_PYTHON, []]]
      : process.platform === 'win32'
        ? [['py', ['-3']], ['python', []], ['python3', []]]
        : [['python3', []], ['python', []]];
    for (const [command, prefix] of candidates) {
      const probe = spawnSync(command, [...prefix, '-c', 'import sys; assert sys.version_info >= (3, 9); print("aldc-python-ready")'],
        { env, encoding: 'utf8', timeout: 10000 });
      if (!probe.error && probe.status === 0 && probe.stdout.trim() === 'aldc-python-ready') {
        python = { command, prefix };
        break;
      }
    }
    if (!python) throw Error('Tests require an installed Python 3.9+. Set ALDC_TEST_PYTHON to its executable path; no interpreter was installed.');
  }
  return spawnSync(python.command, [...python.prefix, '-X', 'utf8', ...args], { ...options, env });
}

let powershell;
function shellScript(base) {
  if (process.platform !== 'win32') return { command: 'bash', args: [base + '.sh'] };
  if (!powershell) {
    powershell = ['pwsh', 'powershell'].find(command => {
      const probe = spawnSync(command, ['-NoProfile', '-Command', 'exit 0'], { timeout: 10000, windowsHide: true });
      return !probe.error && probe.status === 0;
    });
    if (!powershell) throw Error('Windows tests require an installed PowerShell; no shell was installed.');
  }
  return { command: powershell, args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', base + '.ps1'] };
}

module.exports = { runPython, shellScript };
