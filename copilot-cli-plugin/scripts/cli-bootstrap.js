'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

// Advisory inspection only. Never copy, rename or remove a competing component.
// The host catalog remains authoritative, especially with extra trusted roots.
function filesAt(dir, suffix) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) return [];
    return e.isDirectory() ? filesAt(p, suffix) : e.name.endsWith(suffix) ? [p] : [];
  });
}
function skillName(file) {
  const text = fs.readFileSync(file, 'utf8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const value = fm?.[1].match(/^name:\s*([a-zA-Z0-9-]+|"[a-zA-Z0-9-]+"|'[a-zA-Z0-9-]+')\s*(?:#.*)?$/m)?.[1];
  return value?.replace(/^['"]|['"]$/g, '');
}
function inspectShadowing(project, pluginRoot, { home = os.homedir(), env = process.env } = {}) {
  const agents = new Set(filesAt(path.join(pluginRoot, 'agents'), '.agent.md').map(p => path.basename(p, '.agent.md')));
  const skills = new Set(filesAt(path.join(pluginRoot, 'skills'), 'SKILL.md').map(skillName).filter(Boolean));
  const commands = new Set(filesAt(path.join(pluginRoot, 'commands'), '.md').map(p => path.basename(p, '.md')));
  const roots = new Map();
  const add = (dir, kind) => roots.set(path.resolve(dir), kind);
  const copilotHome = env.COPILOT_HOME || path.join(home, '.copilot');
  add(path.join(copilotHome, 'agents'), 'agent');
  add(path.join(copilotHome, 'skills'), 'skill');
  add(path.join(home, '.agents/skills'), 'skill');
  for (let dir = path.resolve(project); ; dir = path.dirname(dir)) {
    add(path.join(dir, '.github/agents'), 'agent');
    add(path.join(dir, '.github/skills'), 'skill');
    if (dir === path.resolve(project)) {
      add(path.join(dir, '.agents/skills'), 'skill');
      add(path.join(dir, '.claude/skills'), 'skill');
      add(path.join(dir, '.claude/commands'), 'command');
    }
    if (path.dirname(dir) === dir) break;
  }
  for (const dir of (env.COPILOT_SKILLS_DIRS || '').split(',').filter(Boolean)) add(dir, 'skill');
  const shadowing = [];
  for (const [dir, kind] of roots) for (const file of filesAt(dir, kind === 'skill' ? 'SKILL.md' : '.md')) {
    const name = kind === 'agent' ? path.basename(file).replace(/(?:\.agent)?\.md$/, '')
      : kind === 'command' ? path.basename(file, '.md') : skillName(file);
    if ((kind === 'agent' ? agents : new Set([...skills, ...commands])).has(name)) {
      shadowing.push({ kind, name, path: file, status: 'potential-shadow', action: 'Inspect the host-selected source; preserve custom files until reviewed.' });
    } else if (kind === 'skill' && !name) {
      shadowing.push({ kind, path: file, status: 'unparsed-name', action: 'Inspect this skill in the host catalog.' });
    }
  }
  return shadowing;
}

// Adapt only the CLI's generated initializer. Shared source stays byte-identical
// so Claude, Codex and VSIX bootstrap behavior is unaffected.
function adaptInitializer(source) {
  const old = "if (surface !== 'claude' && tx.read(project, 'AGENTS.override.md') !== null) guidance = 'AGENTS.override.md';";
  const anchor = 'const result = tx.apply({ root: project, surface, files, force, dryRun: !apply });';
  if (!source.includes(old) || !source.includes(anchor)) throw Error('Shared initializer structure changed; review CLI projection');
  return source.replace(old, '// Copilot CLI reads AGENTS.md; preserve AGENTS.override.md without using it.')
    .replace(anchor, "const shadowing = require('./cli-bootstrap').inspectShadowing(project, pluginRoot);\n  " + anchor)
    .replace('...result, surface, guidance,', '...result, surface, guidance, shadowing,')
    .replace('Review collisions. Restart the host and inspect loaded sources; do not combine a Codex plugin install with its local bootstrap copies.',
      'Review collisions and potential shadowing. Bootstrap installs no agents or skills. Restart Copilot CLI and inspect actual loaded sources, including any extra trusted roots.');
}
module.exports = { inspectShadowing, adaptInitializer };
