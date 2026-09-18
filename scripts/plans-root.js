'use strict';
/**
 * ALDC — `plans.root`, read without a YAML dependency.
 *
 * The installer runs on the user's machine, from payloads that may not carry
 * node_modules, so it cannot require js-yaml. That is a reason to parse
 * narrowly — it is not a licence to guess. Resolving the wrong folder here is a
 * silent failure in someone's project, not a red build: it would seed memory.md
 * in one place and report another as missing.
 *
 * So the contract turns on absence versus unreadability:
 *
 *   - the key is ABSENT (no `aldc.yaml`, no `plans:` block, or a block that
 *     simply does not declare `root`) -> the default. This is the normal case:
 *     `plans.root` has existed since 4.2.0, but a project may predate it or have
 *     removed it, and failing there would break every such installation.
 *   - the key is PRESENT but cannot be read with confidence — an unterminated
 *     quote, an empty value, a shape this parser does not cover, an absolute or
 *     escaping path — -> **throw**, naming the file.
 */
const fs = require('fs');
const path = require('path');

/** What a Copilot deployment and the VSIX use, and what a project inherits. */
const DEFAULT_PLANS_ROOT = '.github/plans';

/** Read one YAML scalar: quoted or bare, with a trailing comment allowed. */
function scalar(raw, where) {
  const text = raw.trim();
  if (!text) throw Error(`${where}: plans.root has no value`);
  const quote = text[0];
  if (quote === '"' || quote === "'") {
    const end = text.indexOf(quote, 1);
    if (end < 0) throw Error(`${where}: plans.root has an unterminated ${quote} quote`);
    const rest = text.slice(end + 1).trim();
    if (rest && !rest.startsWith('#')) throw Error(`${where}: plans.root has trailing content after the closing quote`);
    return text.slice(1, end);
  }
  // Anchors, aliases, flow collections and block scalars are shapes this parser
  // does not cover. Refusing beats reading half of one.
  if (/^[[{&*!|>%@`]/.test(text)) throw Error(`${where}: plans.root must be a plain or quoted string, not YAML "${text[0]}" notation`);
  // A '#' opens a comment only when whitespace precedes it.
  const comment = text.search(/(?:^|\s)#/);
  return (comment < 0 ? text : text.slice(0, comment)).trim();
}

function validate(value, where) {
  if (/[\r\n\0]/.test(value)) throw Error(`${where}: plans.root must be a single line`);
  // Windows separators become POSIX ones, and repeats collapse: a double-quoted
  // YAML scalar may carry `\\` as an escaped backslash, which this parser does
  // not unescape, and `a//b` is degenerate either way.
  const normalized = value.split('\\').join('/').replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  if (!normalized) throw Error(`${where}: plans.root has no value`);
  if (path.posix.isAbsolute(normalized) || path.win32.isAbsolute(value)) {
    throw Error(`${where}: plans.root must be relative to the project (got "${value}")`);
  }
  if (normalized.split('/').includes('..')) {
    throw Error(`${where}: plans.root must stay inside the project (got "${value}")`);
  }
  return normalized;
}

/**
 * Resolve `plans.root` from the text of an `aldc.yaml`.
 * Returns the normalized path, or `null` when the key is absent — the case where
 * a caller's default is the right answer. Throws when it is present but
 * unreadable. A `plans:` block in a shape this parser cannot walk also throws:
 * absence has to be something it established, not something it assumed.
 */
function readPlansRoot(text, where = 'aldc.yaml') {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((line) => /^plans:[ \t]*(#.*)?$/.test(line));
  if (start < 0) {
    if (lines.some((line) => /^plans:[ \t]*\S/.test(line))) {
      throw Error(`${where}: plans must be a block with a root key, not an inline value`);
    }
    return null;
  }
  let root = null;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\S/.test(line)) break; // the next top-level key closes the block
    if (/^[ \t]*(#.*)?$/.test(line)) continue; // blank or comment
    const entry = line.match(/^[ \t]+([A-Za-z_][\w-]*):[ \t]*(.*)$/);
    if (!entry) throw Error(`${where}: unreadable line inside the plans block: ${line.trim()}`);
    if (entry[1] !== 'root') continue;
    if (root !== null) throw Error(`${where}: plans.root is declared more than once`);
    root = validate(scalar(entry[2], where), where);
  }
  return root; // null: the block declares no root, so the caller's default stands
}

/** First `aldc.yaml` among `dirs` that declares a plans root wins. */
function plansRootOf(...dirs) {
  for (const dir of dirs) {
    if (!dir) continue;
    const file = path.join(dir, 'aldc.yaml');
    if (!fs.existsSync(file)) continue;
    const found = readPlansRoot(fs.readFileSync(file, 'utf8'), file);
    if (found !== null) return found;
  }
  return DEFAULT_PLANS_ROOT;
}

module.exports = { plansRootOf, readPlansRoot, DEFAULT_PLANS_ROOT };
