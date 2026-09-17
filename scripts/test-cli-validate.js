'use strict';
// `aldc validate` is a gate, so its exit code is its answer. A fresh install
// must validate, and a broken one must fail the build that runs it — a red
// summary line with exit 0 is what let this ship unnoticed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'scripts', 'install.js');

const project = t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ALDC validate á '));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
    execFileSync(process.execPath, [CLI, 'install', '--profile', 'bc28', '--yes'], { cwd: dir, stdio: 'ignore' });
    return dir;
};
const validate = cwd => spawnSync(process.execPath, [CLI, 'validate'], { cwd, encoding: 'utf8' });

test('a fresh install validates and exits 0', t => {
    const result = validate(project(t));
    assert.match(result.stdout, /VALID —/);
    assert.doesNotMatch(result.stdout, /INVALID/);
    assert.equal(result.status, 0, 'a clean install must not fail the build');
});

test('a missing component makes validate fail the build', t => {
    const dir = project(t);
    fs.renameSync(path.join(dir, '.github', 'tools', 'bc-agents'), path.join(dir, 'moved-away'));
    const result = validate(dir);
    assert.match(result.stdout, /INVALID —/);
    assert.equal(result.status, 1, 'an invalid verdict must be readable from the exit code');
});
