#!/usr/bin/env node
'use strict';
// `plans.root` is read on the user's machine, without a YAML parser. A wrong
// answer here is silent: the installer would seed memory.md in one folder and
// report another as missing. These tests pin the one rule that prevents it —
// the default applies only when there is nothing to read; anything declared but
// unreadable throws.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { readPlansRoot, plansRootOf, DEFAULT_PLANS_ROOT } = require('./plans-root');

const root = path.resolve(__dirname, '..');
const temp = (t) => {
  const p = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-plans-'));
  t.after(() => fs.rmSync(p, { recursive: true, force: true }));
  return p;
};

test('a declared root is read through quotes, comments and CRLF', () => {
  assert.equal(readPlansRoot('plans:\n  root: ".claude/plans"\n'), '.claude/plans');
  assert.equal(readPlansRoot("plans:\n  root: '.claude/plans'\n"), '.claude/plans');
  assert.equal(readPlansRoot('plans:\n  root: .claude/plans\n'), '.claude/plans');
  assert.equal(readPlansRoot('plans:\r\n  root: ".claude/plans"\r\n'), '.claude/plans');
  assert.equal(readPlansRoot('\ufeffplans:\n  root: ".claude/plans"\n'), '.claude/plans');
  assert.equal(readPlansRoot('plans:\n  root: ".claude/plans" # where they live\n'), '.claude/plans');
  assert.equal(readPlansRoot("plans:\n  root: '.claude/plans'  # where they live\n"), '.claude/plans');
  assert.equal(readPlansRoot('plans:\n  root: .claude/plans # where they live\n'), '.claude/plans');
  assert.equal(readPlansRoot('plans: # where they live\n  # a note\n\n  root: ".claude/plans"\n'), '.claude/plans');
  assert.equal(readPlansRoot('plans:\n\troot: ".claude/plans"\n'), '.claude/plans');
});

test('the value is normalized, not reinterpreted', () => {
  assert.equal(readPlansRoot('plans:\n  root: ".claude/plans/"\n'), '.claude/plans');
  assert.equal(readPlansRoot("plans:\n  root: '.claude\\plans'\n"), '.claude/plans');
  // A double-quoted scalar may escape the separator; this parser does not
  // unescape, so the repeat collapses instead of leaking through.
  assert.equal(readPlansRoot('plans:\n  root: ".claude\\\\plans"\n'), '.claude/plans');
  // A '#' without preceding whitespace is part of the value, as in YAML.
  assert.equal(readPlansRoot('plans:\n  root: plans#1\n'), 'plans#1');
});

test('the block ends at the next top-level key', () => {
  assert.equal(readPlansRoot('plans:\n  root: ".claude/plans"\ncontracts:\n  root: "elsewhere"\n'), '.claude/plans');
  // A `plans:` nested under another key is not the top-level knob.
  assert.equal(readPlansRoot('other:\n  plans:\n    root: "x"\n'), null);
});

test('an absent key falls back; it never fails', () => {
  assert.equal(readPlansRoot('core:\n  version: "1.2.0"\n'), null, 'no plans block');
  assert.equal(readPlansRoot(''), null, 'empty file');
  // plans.root has existed since 4.2.0, but a project may predate it or have
  // removed it. Failing here would break every such installation.
  assert.equal(readPlansRoot('plans:\n  archive: "x"\n'), null, 'block without a root key');
  assert.equal(readPlansRoot('plans:\n'), null, 'empty block');
  assert.equal(readPlansRoot('plans:\n\ncontracts:\n  globalMemory: "memory.md"\n'), null, 'block closed by the next key');
});

test('declared but unreadable throws instead of defaulting', () => {
  assert.throws(() => readPlansRoot('plans: {root: ".claude/plans"}\n'), /not an inline value/);
  assert.throws(() => readPlansRoot('plans:\n  root: ".claude/plans\n'), /unterminated/);
  assert.throws(() => readPlansRoot('plans:\n  root: ".claude/plans" oops\n'), /trailing content/);
  assert.throws(() => readPlansRoot('plans:\n  root:\n'), /no value/);
  assert.throws(() => readPlansRoot('plans:\n  root: "" \n'), /no value/);
  assert.throws(() => readPlansRoot('plans:\n  root: # only a comment\n'), /no value/);
  assert.throws(() => readPlansRoot('plans:\n  root: ".claude/plans"\n  root: "elsewhere"\n'), /more than once/);
  assert.throws(() => readPlansRoot('plans:\n  root: &anchor x\n'), /notation/);
  assert.throws(() => readPlansRoot('plans:\n  root: |\n    x\n'), /notation/);
  assert.throws(() => readPlansRoot('plans:\n  - root: x\n'), /unreadable line/);
});

test('an escaping or absolute root is refused', () => {
  assert.throws(() => readPlansRoot('plans:\n  root: "/etc/plans"\n'), /relative to the project/);
  assert.throws(() => readPlansRoot('plans:\n  root: "C:\\\\plans"\n'), /relative to the project/);
  assert.throws(() => readPlansRoot('plans:\n  root: "../plans"\n'), /inside the project/);
  assert.throws(() => readPlansRoot('plans:\n  root: ".claude/../../plans"\n'), /inside the project/);
});

test('the error names the file it could not read', () => {
  assert.throws(() => readPlansRoot('plans:\n  root: "x\n', '/tmp/p/aldc.yaml'), /\/tmp\/p\/aldc\.yaml: plans\.root has an unterminated/);
});

test('a block this parser cannot walk is unreadable, not absent', () => {
  // Absence has to be established, not assumed: a shape it cannot walk might
  // well declare root, so it refuses instead of quietly defaulting.
  assert.throws(() => readPlansRoot('plans:\n  - root: x\n'), /unreadable line/);
  assert.throws(() => readPlansRoot('plans: {archive: "x"}\n'), /not an inline value/);
});

test('plansRootOf walks the candidate directories in order', (t) => {
  const dir = temp(t), second = temp(t);
  assert.equal(plansRootOf(dir, second), DEFAULT_PLANS_ROOT, 'no aldc.yaml anywhere');
  fs.writeFileSync(path.join(second, 'aldc.yaml'), 'plans:\n  root: ".github/plans"\n');
  fs.writeFileSync(path.join(dir, 'aldc.yaml'), 'core:\n  version: "1.2.0"\n');
  assert.equal(plansRootOf(dir, second), '.github/plans', 'a file without a plans block defers to the next');
  fs.writeFileSync(path.join(dir, 'aldc.yaml'), 'plans:\n  root: ".claude/plans"\n');
  assert.equal(plansRootOf(dir, second), '.claude/plans', 'the project copy wins');
  assert.equal(plansRootOf(null, undefined, dir), '.claude/plans', 'empty candidates are skipped');
  fs.writeFileSync(path.join(dir, 'aldc.yaml'), 'plans:\n  root: "/absolute"\n');
  assert.throws(() => plansRootOf(dir, second), /relative to the project/, 'a bad project copy is not silently skipped');
});

test('the shipped configurations resolve to their surface root', () => {
  assert.equal(plansRootOf(root), '.github/plans', 'canonical: Copilot and the VSIX');
  assert.equal(plansRootOf(path.join(root, 'claude-plugin')), '.claude/plans', 'Claude Code plugin');
});
