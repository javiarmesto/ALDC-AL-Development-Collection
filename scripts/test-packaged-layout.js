'use strict';
// install.js runs from two shapes: this repository, where the toolkit trees sit
// beside scripts/, and a package — the VSIX or the npm tarball — where it sits at
// the root and the trees are wherever ALDC_PACKAGE_DIR points. Only the first shape
// was ever exercised, so a require written as '../tools/...' passed every test here
// and resolved to nothing once packaged: the BCQuality index reported itself
// unobserved from a real installation and `aldc bcq-index` could not load.
// These tests run the installer from the packaged shape and assert it reaches the
// same modules, so the next one written against __dirname fails here instead of
// in someone's editor.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repo = path.resolve(__dirname, '..');

// Inside the repository, not in os.tmpdir(): a packaged installer resolves js-yaml by
// walking up from the toolkit tree to the package's own node_modules, which is what
// the VSIX provides and what a detached temp directory would not have.
function packaged(t) {
    const base = fs.mkdtempSync(path.join(repo, '.aldc-packaged-layout-'));
    t.after(() => fs.rmSync(base, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
    // One level below the temporary root, so the parent of the package holds no
    // tools/ of its own: a require written as '../tools/...' has to fail here the
    // way it fails in an installed extension, instead of finding this repository's.
    const pkg = path.join(base, 'pkg');
    fs.mkdirSync(pkg);
    // Every sibling module install.js requires relatively, taken from the source so a
    // new dependency is carried here instead of being forgotten.
    const siblings = [...fs.readFileSync(path.join(__dirname, 'install.js'), 'utf8')
        .matchAll(/require\(\s*'\.\/([\w.-]+)'\s*\)/g)].map(m => m[1].replace(/\.js$/, '') + '.js');
    assert.ok(siblings.includes('plans-root.js'), 'the sibling scan found nothing to copy');
    for (const name of new Set(siblings)) fs.copyFileSync(path.join(__dirname, name), path.join(pkg, name));
    fs.copyFileSync(path.join(__dirname, 'install.js'), path.join(pkg, 'install.js'));
    fs.cpSync(path.join(repo, 'tools', 'bcquality'), path.join(pkg, 'tools', 'bcquality'), { recursive: true });
    const project = path.join(base, 'project');
    fs.mkdirSync(path.join(project, 'App'), { recursive: true });
    fs.writeFileSync(path.join(project, 'App', 'app.json'), '{"application":"29.0.0.0"}');
    return { pkg, project };
}

const status = ({ pkg, project }) => JSON.parse(execFileSync(process.execPath,
    [path.join(pkg, 'install.js'), 'status', '--json'],
    { cwd: project, encoding: 'utf8', env: { ...process.env, ALDC_PACKAGE_DIR: pkg } }));

test('the installer loads from a package root that is not this repository', t => {
    const report = status(packaged(t));
    assert.equal(report.receipt, 'absent');
});

test('the BCQuality index is observed from the packaged layout, not reported unobserved', t => {
    const report = status(packaged(t));
    // 'unobserved' is what the catch around the require produces. It is a real status
    // for a host that supplies none, but this one runs the engine: anything it says
    // here is an observation, and 'unobserved' means the module was never reached.
    assert.notEqual(report.bcqIndex.status, 'unobserved',
        `index-state was not reachable from the package root: ${report.bcqIndex.detail}`);
});
