#!/usr/bin/env node
'use strict';

// Build a local archive and validate exactly what consumers receive. Never publish.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-package-'));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run through npm run test:package');
function npm(args, cwd) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd, encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, npm_config_offline: 'true', npm_config_audit: 'false', npm_config_fund: 'false' },
  });
  if (result.status !== 0) throw new Error(`npm ${args.join(' ')} failed: ${result.error || ''}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
try {
  const [archive] = JSON.parse(npm(['pack', '--json', '--pack-destination', temp], root));
  const extract = spawnSync('tar', ['-xf', path.join(temp, archive.filename), '-C', temp], { encoding: 'utf8' });
  if (extract.status !== 0) throw new Error(`Archive extraction failed: ${extract.error || extract.stderr}`);
  const installed = path.join(temp, 'package');
  // Reuse dependencies installed by npm ci from the repository lockfile. The
  // source payload is exclusively the archive; no registry resolution is needed.
  fs.cpSync(path.join(root, 'node_modules'), path.join(installed, 'node_modules'), { recursive: true });
  // Payloads the installer and Doctor read at runtime must arrive byte for byte.
  for (const rel of ['tools/context-doctor/aldc_context_doctor.py', 'tools/context-doctor/README.md', 'scripts/test-doctor.py',
    'known-installations.json']) {
    if (!fs.readFileSync(path.join(installed, rel)).equals(fs.readFileSync(path.join(root, rel)))) throw Error(`Archive payload differs: ${rel}`);
  }
  const output = npm(['run', 'validate'], installed);
  console.log(output.split('\n').filter(line => /PASS:|packaging:|generated files/.test(line)).join('\n'));
  console.log('Packaged distribution: archive extracted and validated offline with lockfile-installed dependencies; no publication.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
