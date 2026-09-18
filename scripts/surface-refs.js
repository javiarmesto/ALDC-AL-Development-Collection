'use strict';
/**
 * Bundled-reference resolution, shared by the packaging tests.
 *
 * Each distribution anchors its references its own way: the Claude Code plugin
 * with `${CLAUDE_PLUGIN_ROOT}`, the Copilot CLI one with `${PLUGIN_ROOT}`, the
 * mirrored `.claude/` workspace with `${CLAUDE_PROJECT_DIR}`, and the canonical
 * trees and Codex with relative paths. One resolver, so a test asserts that a
 * reference is reachable in its own host instead of pinning one spelling.
 */
const path = require('path');

// [distribution prefix, anchor token, repository path the token stands for]
const ANCHORS = [
  ['claude-plugin/', '${CLAUDE_PLUGIN_ROOT}/', 'claude-plugin/'],
  ['copilot-cli-plugin/', '${PLUGIN_ROOT}/', 'copilot-cli-plugin/'],
  ['.claude/', '${CLAUDE_PROJECT_DIR}/', ''],
  // Codex resolves its own references against the installed ALDC skill root.
  ['plugins/aldc-codex/', '.agents/skills/aldc/', 'plugins/aldc-codex/skills/aldc/'],
];

const REF = String.raw`(?:\.{1,2}\/|\.agents\/skills\/aldc\/|\$\{CLAUDE_PLUGIN_ROOT\}\/|\$\{PLUGIN_ROOT\}\/|\$\{CLAUDE_PROJECT_DIR\}\/)`;

/** Resolve a reference found in `from` to a repository-relative path. */
function resolveRef(from, ref) {
  for (const [dist, token, base] of ANCHORS) {
    if (from.startsWith(dist) && ref.startsWith(token)) {
      return path.posix.normalize(path.posix.join(base, ref.slice(token.length)));
    }
  }
  return path.posix.normalize(path.posix.join(path.posix.dirname(from), ref));
}

/**
 * Every anchored markdown reference in `text`, as written. Placeholder notation
 * (`<skill-name>`, `al-*.md`) names a shape, not a file, so it is not a reference.
 */
const PLACEHOLDER = /[<>*{}]/;
const refsIn = (text) =>
  [...text.matchAll(new RegExp(String.raw`\]\((${REF}[^)\s]+\.md)\)|\`(${REF}[^\`\s]+\.md)\``, 'g'))]
    .map((m) => m[1] || m[2])
    .filter((ref) => !PLACEHOLDER.test(ref.replace(/^\$\{[A-Z_]+\}/, '')));

module.exports = { resolveRef, refsIn, REF, ANCHORS };
