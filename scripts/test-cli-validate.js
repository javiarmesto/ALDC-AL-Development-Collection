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

test('a missing file, not only a missing folder, fails the build', t => {
    const dir = project(t);
    // A component directory that still exists told validate nothing about what was
    // inside it, so a deleted agent passed while the file count quietly dropped.
    fs.unlinkSync(path.join(dir, '.github', 'agents', 'al-architect.agent.md'));
    const result = validate(dir);
    assert.match(result.stdout, /expected file\(s\) missing/);
    assert.match(result.stdout, /al-architect\.agent\.md/);
    assert.equal(result.status, 1, 'an incomplete installation must fail the build');
});

test('a seeded file the developer owns is reported without failing the build', t => {
    const dir = project(t);
    // memory.md is written once and then belongs to the project, so its absence is
    // worth saying out loud and not worth failing on.
    fs.unlinkSync(path.join(dir, '.github', 'plans', 'memory.md'));
    const result = validate(dir);
    assert.match(result.stdout, /seeded file\(s\) absent/);
    assert.equal(result.status, 0);
});
