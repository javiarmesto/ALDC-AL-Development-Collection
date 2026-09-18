'use strict';
// The index state is evidence, so the only thing worth asserting is that it cannot
// be claimed without a receipt that matches the corpus actually on disk. `prebuilt`
// is the one status a reviewer may report without running anything, which is exactly
// why a stale or absent receipt has to fall back to `not-attempted` rather than pass.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const idx = require('../tools/bcquality/index-state');

const RECEIPT = '.github/aldc-bcquality-index.json';
const yaml = (mode, enabled, home) =>
    `external:\n  bcquality:\n    mode: "${mode}"\n    enabled: ${enabled}\n    home: "${home}"\n`;

// A workspace plus a sibling corpus that is a real Git repository, because the
// freshness rule compares against `git rev-parse HEAD` and nothing else.
function fixture(t, { mode = 'external-multiroot', enabled = 'auto', corpus = true } = {}) {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-bcq-index-'));
    t.after(() => fs.rmSync(base, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
    const ws = path.join(base, 'project');
    const home = path.join(base, 'corpus');
    fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(path.join(ws, 'aldc.yaml'), yaml(mode, enabled, '../corpus'));
    let head = null;
    if (corpus) {
        fs.mkdirSync(path.join(home, 'skills'), { recursive: true });
        fs.writeFileSync(path.join(home, 'skills', 'entry.md'), 'fixture');
        const git = args => execFileSync('git', ['-C', home, ...args], { stdio: 'ignore' });
        execFileSync('git', ['init', '--quiet', home], { stdio: 'ignore' });
        git(['config', 'user.email', 'fixture@example.invalid']);
        git(['config', 'user.name', 'fixture']);
        git(['add', '-A']);
        git(['commit', '--quiet', '-m', 'fixture']);
        head = execFileSync('git', ['-C', home, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    }
    return { ws, home, head };
}
const fixtureHead = home =>
    execFileSync('git', ['-C', home, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const writeIndex = (home, body = '{"articles":[],"articleCount":0}') => {
    fs.writeFileSync(path.join(home, 'knowledge-index.json'), body);
    return crypto.createHash('sha256').update(Buffer.from(body)).digest('hex');
};
const writeReceipt = (ws, receipt, { bom = false } = {}) => {
    const file = path.join(ws, RECEIPT);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, (bom ? '\uFEFF' : '') + JSON.stringify(receipt, null, 2) + '\n');
};
// BCQUALITY_HOME outranks the configured home, so a stray one would silently
// redirect every case below.
const withoutEnvHome = t => {
    const previous = process.env.BCQUALITY_HOME;
    delete process.env.BCQUALITY_HOME;
    t.after(() => { if (previous !== undefined) process.env.BCQUALITY_HOME = previous; });
};

test('a mode that does not read a clone is not applicable, not a failure', t => {
    withoutEnvHome(t);
    const { ws } = fixture(t, { mode: 'plugin' });
    for (const result of [idx.status(ws), idx.build(ws)]) {
        assert.equal(result.status, 'unobserved');
        assert.ok(idx.OK_STATES.has(result.status), 'not applicable must exit 0');
    }
});

test('a disabled provider is never probed', t => {
    withoutEnvHome(t);
    const { ws } = fixture(t, { enabled: 'false' });
    assert.equal(idx.status(ws).status, 'unobserved');
    assert.equal(idx.build(ws).status, 'unobserved');
});

test('an absent corpus or index reports not-attempted', t => {
    withoutEnvHome(t);
    const missing = fixture(t, { corpus: false });
    assert.deepEqual(
        [idx.status(missing.ws).status, idx.status(missing.ws).detail],
        ['not-attempted', 'corpus not installed']);

    const present = fixture(t);
    assert.deepEqual(
        [idx.status(present.ws).status, idx.status(present.ws).detail],
        ['not-attempted', 'no knowledge-index.json']);
});

test('an index without a receipt is not prebuilt', t => {
    withoutEnvHome(t);
    const { ws, home } = fixture(t);
    writeIndex(home);
    const result = idx.status(ws);
    assert.equal(result.status, 'not-attempted');
    assert.equal(result.detail, 'no receipt');
});

test('a receipt matching this corpus and this index reports prebuilt', t => {
    withoutEnvHome(t);
    const { ws, home, head } = fixture(t);
    const sha = writeIndex(home);
    writeReceipt(ws, { status: 'prebuilt', indexSha256: sha, corpusSha: head, generatedAt: '2026-09-18T00:00:00.000Z' });
    const result = idx.status(ws);
    assert.equal(result.status, 'prebuilt');
    assert.equal(result.indexSha256, sha);
    assert.equal(result.corpus, head);
    assert.equal(result.generatedAt, '2026-09-18T00:00:00.000Z');
    assert.ok(idx.OK_STATES.has(result.status));
});

test('a receipt for another corpus, or another index, is stale', t => {
    withoutEnvHome(t);
    const { ws, home, head } = fixture(t);
    const sha = writeIndex(home);

    writeReceipt(ws, { status: 'prebuilt', indexSha256: sha, corpusSha: '0'.repeat(40) });
    assert.equal(idx.status(ws).status, 'not-attempted', 'a different corpus revision');

    writeReceipt(ws, { status: 'prebuilt', indexSha256: '0'.repeat(64), corpusSha: head });
    assert.equal(idx.status(ws).status, 'not-attempted', 'a different index file');

    // Rebuilding the index without rewriting the receipt must not stay green.
    writeReceipt(ws, { status: 'prebuilt', indexSha256: sha, corpusSha: head });
    writeIndex(home, '{"articles":[],"articleCount":1}');
    assert.equal(idx.status(ws).status, 'not-attempted', 'the index changed under the receipt');
});

test('a receipt written by Windows PowerShell with a BOM is still readable', t => {
    withoutEnvHome(t);
    const { ws, home, head } = fixture(t);
    const sha = writeIndex(home);
    writeReceipt(ws, { status: 'prebuilt', indexSha256: sha, corpusSha: head }, { bom: true });
    assert.equal(idx.status(ws).status, 'prebuilt');
});

test('an unreadable receipt is reported, not thrown', t => {
    withoutEnvHome(t);
    const { ws, home } = fixture(t);
    writeIndex(home);
    const file = path.join(ws, RECEIPT);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'not json at all');
    assert.equal(idx.status(ws).status, 'not-attempted');
});

test('a build this machine could never attempt does not fail the caller', t => {
    withoutEnvHome(t);
    const { ws, home } = fixture(t);
    // The generator has to exist, or the run stops earlier for a different reason.
    fs.mkdirSync(path.join(home, 'tools'), { recursive: true });
    fs.writeFileSync(path.join(home, 'tools', 'Build-KnowledgeIndex.ps1'), '# fixture');
    const result = idx.build(ws);
    if (result.attemptable !== false) return t.skip('PowerShell 7 is available here');
    assert.equal(result.status, 'not-attempted');
    assert.equal(idx.ok(result), true, 'a machine without pwsh must not fail the build that asked');
});

test('the exit rule separates nothing-to-do from something-to-fix', t => {
    withoutEnvHome(t);
    // Read as a rule, independent of the machine running the suite.
    assert.equal(idx.ok({ status: 'unobserved' }), true);
    assert.equal(idx.ok({ status: 'prebuilt' }), true);
    assert.equal(idx.ok({ status: 'generated' }), true);
    assert.equal(idx.ok({ status: 'failed' }), false);
    assert.equal(idx.ok({ status: 'not-attempted' }), false, 'a buildable gap is actionable');
    assert.equal(idx.ok({ status: 'not-attempted', attemptable: false }), true, 'an unbuildable one is not');

    // And on a machine that can build, an absent index really is actionable.
    const { ws } = fixture(t);
    const observed = idx.status(ws);
    if (observed.attemptable === false) return t.skip('PowerShell 7 is unavailable here');
    assert.equal(idx.ok(observed), false);
});

test('status and build agree about what this machine can do', t => {
    withoutEnvHome(t);
    const { ws, home } = fixture(t);
    const observed = idx.status(ws);
    const attempted = idx.build(ws);
    if (attempted.attemptable !== false) return t.skip('PowerShell 7 is available here');
    // Telling the user to run --build on a machine where --build cannot work was the
    // one place the two commands contradicted each other.
    assert.equal(observed.attemptable, false, 'status must reach the same conclusion as build');
    assert.equal(idx.ok(observed), true, 'an unreachable index is not an actionable failure');

    // A fresh index needs no probe and carries no such flag: it is simply the answer.
    const sha = writeIndex(home);
    const head = fixtureHead(home);
    writeReceipt(ws, { status: 'prebuilt', indexSha256: sha, corpusSha: head });
    const ready = idx.status(ws);
    assert.equal(ready.status, 'prebuilt');
    assert.equal('attemptable' in ready, false);
});

test('build refuses to invent an index it could not generate', t => {
    withoutEnvHome(t);
    const { ws } = fixture(t);
    const result = idx.build(ws);
    // Without the generator on disk this is `failed`; without PowerShell 7 it is
    // `not-attempted`. Neither may leave a receipt behind.
    assert.ok(['failed', 'not-attempted'].includes(result.status), `unexpected ${result.status}`);
    assert.equal(fs.existsSync(path.join(ws, RECEIPT)), false, 'no receipt without a real build');
});
