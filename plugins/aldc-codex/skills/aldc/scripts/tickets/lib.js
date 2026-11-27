'use strict';
// ALDC ticket tools: shared configuration, with no host dependencies (Node 20+, no npm packages).
// The same files ship on every surface (Claude Code plugin, Codex, Copilot CLI) and in this
// repository, so nothing here may assume a host.
//
// plans.root: the project's aldc.yaml, else the aldc.yaml of the surface that ships these files
// (the nearest one above this folder: .claude/plans, .agents/plans or .github/plans), else
// .github/plans.
const fs = require('fs');
const path = require('path');

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/** Value of `<block>:` → `<key>:` in a simple two-level YAML file (comments and quotes stripped). */
function yamlValue(text, block, key) {
  if (!text) return null;
  let inBlock = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\S/.test(line)) inBlock = new RegExp(`^${block}:\\s*(#.*)?$`).test(line);
    else if (inBlock) {
      const m = line.match(new RegExp(`^\\s+${key}:\\s*("([^"]*)"|'([^']*)'|([^#\\s]+))`));
      if (m) return m[2] ?? m[3] ?? m[4];
    }
  }
  return null;
}

/** The aldc.yaml of the surface that ships these tools: the nearest one above this folder. */
function surfaceYaml(from = __dirname) {
  let dir = from;
  for (let i = 0; i < 5; i++) {
    const file = path.join(dir, 'aldc.yaml');
    if (fs.existsSync(file)) return file;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

/** First value of block.key: project aldc.yaml, then the surface aldc.yaml. */
function setting(project, block, key) {
  const own = yamlValue(read(path.join(project || '.', 'aldc.yaml')), block, key);
  if (own != null) return { value: own, source: 'project aldc.yaml' };
  const surface = surfaceYaml();
  const shipped = surface ? yamlValue(read(surface), block, key) : null;
  return shipped != null ? { value: shipped, source: 'surface aldc.yaml' } : null;
}

function plansRoot(project) {
  const s = setting(project, 'plans', 'root');
  return path.resolve(project, s ? s.value : '.github/plans');
}

/** How many ticket implementers may run at once: ALDC_PARALLEL > aldc.yaml tickets.parallel > 3. */
function parallel(project) {
  const valid = (v) => /^\d+$/.test(String(v || '').trim()) && +v >= 1;
  const env = (process.env.ALDC_PARALLEL || '').trim();
  if (valid(env)) return { parallel: +env, source: 'ALDC_PARALLEL' };
  const s = setting(project, 'tickets', 'parallel');
  if (s && valid(s.value)) return { parallel: +s.value, source: s.source };
  return { parallel: 3, source: 'default' };
}

module.exports = { read, yamlValue, surfaceYaml, setting, plansRoot, parallel };
