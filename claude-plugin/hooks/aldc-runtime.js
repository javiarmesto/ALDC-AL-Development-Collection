'use strict';
// aldc-claude: shared helpers for the plugin hooks. Read-only and dependency-free
// (no js-yaml): hooks must work in any project, before `npm install` of anything.
const fs = require('fs');
const os = require('os');
const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const GATES = ['human', 'pre-approved'];

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

/** Value of `<block>:` → `<key>:` in a simple two-level YAML file (comments and quotes stripped). */
function yamlValue(text, block, key) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  let inBlock = false;
  for (const line of lines) {
    if (/^\S/.test(line)) inBlock = new RegExp(`^${block}:\\s*(#.*)?$`).test(line);
    else if (inBlock) {
      const m = line.match(new RegExp(`^\\s+${key}:\\s*("([^"]*)"|'([^']*)'|([^#\\s]+))`));
      if (m) return m[2] ?? m[3] ?? m[4];
    }
  }
  return null;
}

/** Autonomy mode and where it came from: env ALDC_GATES > project aldc.yaml > plugin aldc.yaml > human. */
function autonomy(cwd) {
  const env = (process.env.ALDC_GATES || '').trim();
  if (GATES.includes(env)) return { gates: env, source: 'ALDC_GATES', commit: false };
  for (const [file, source] of [[path.join(cwd || '.', 'aldc.yaml'), 'project aldc.yaml'], [path.join(PLUGIN_ROOT, 'aldc.yaml'), 'plugin aldc.yaml']]) {
    const text = read(file);
    const gates = yamlValue(text, 'autonomy', 'gates');
    if (GATES.includes(gates)) return { gates, source, commit: yamlValue(text, 'autonomy', 'commit') === 'true' };
  }
  return { gates: 'human', source: 'default', commit: false };
}

/** Test runner command: env ALDC_TEST_RUNNER > project aldc.yaml testing.runner > none. */
function testRunner(cwd) {
  const env = (process.env.ALDC_TEST_RUNNER || '').trim();
  if (env) return { command: env, source: 'ALDC_TEST_RUNNER' };
  const own = yamlValue(read(path.join(cwd || '.', 'aldc.yaml')), 'testing', 'runner');
  return own ? { command: own, source: 'project aldc.yaml' } : null;
}

/** plans.root of the project, falling back to the Claude surface default. */
function plansRoot(cwd) {
  const own = yamlValue(read(path.join(cwd, 'aldc.yaml')), 'plans', 'root');
  return path.resolve(cwd, own || '.claude/plans');
}

/** Whether the bcquality plugin is installed for this user (installed_plugins.json). */
function bcqualityInstalled() {
  const file = path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json');
  const data = readJson(file);
  if (!data) return null;
  return Object.keys(data.plugins || data).some((k) => /^bcquality@/.test(k));
}

/** The plugin's AL rules, without frontmatter or adapter banner, for inline injection. */
function rulesBrief({ includeAgentToolkit = false } = {}) {
  const dir = path.join(PLUGIN_ROOT, 'rules');
  let names = [];
  try { names = fs.readdirSync(dir).filter((n) => n.endsWith('.md')).sort(); } catch { return ''; }
  if (!includeAgentToolkit) names = names.filter((n) => n !== 'al-agent-toolkit.md');
  return names.map((n) => (read(path.join(dir, n)) || '')
    .replace(/^---[\s\S]*?---\s*/, '')
    .replace(/^(>.*\r?\n)+\s*/m, '')
    .trim()).filter(Boolean).join('\n\n');
}

/** Per-session state file. `kind` separates writers (session/stop guard vs Flow Scout): sharing
 *  one file let a concurrent Flow Scout write wipe the session start (M17, October 2026). */
function sessionFile(sessionId, kind = 'session') {
  return path.join(os.tmpdir(), `aldc-claude-${kind}-${String(sessionId || 'none').replace(/[^\w-]/g, '')}.json`);
}

/** Read JSON state; a missing or half-written file reads as {} (callers never write that back blindly). */
function readState(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } }

/** Atomic write: temp file + rename, so a concurrent reader never sees a partial file. */
function writeState(file, state) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  try { fs.writeFileSync(tmp, JSON.stringify(state)); fs.renameSync(tmp, file); } catch { try { fs.unlinkSync(tmp); } catch { /* ignore */ } }
}

function readStdin() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8')); } catch { return null; }
}

/** Root of the bcquality plugin, the same one the host loads its skills from:
 *  BCQUALITY_HOME, else a directory-sourced marketplace (the host loads skills from that
 *  folder, not from the cache), else the installed cache path. A different root from the
 *  skill's made the reviewer distrust the selection and skip the provider (evals Oct 2026). */
function bcqualityRoot() {
  if (process.env.BCQUALITY_HOME && fs.existsSync(process.env.BCQUALITY_HOME)) return process.env.BCQUALITY_HOME;
  const data = readJson(path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json'));
  const entry = Object.entries(data?.plugins || {}).find(([k]) => /^bcquality@/.test(k));
  const market = entry && readJson(path.join(os.homedir(), '.claude', 'plugins', 'known_marketplaces.json'))?.[entry[0].split('@')[1]];
  const dir = market?.source?.source === 'directory' ? (market.installLocation || market.source.path) : null;
  if (dir && fs.existsSync(path.join(dir, 'skills', 'al-code-review', 'SKILL.md'))) return dir;
  const install = Array.isArray(entry?.[1]) ? entry[1][0]?.installPath : entry?.[1]?.installPath;
  return install && fs.existsSync(install) ? install : null;
}

/** BCQuality knowledge articles {path, domain, keywords, title}; cached per root. */
function bcqualityArticles(root) {
  const cache = path.join(os.tmpdir(), 'aldc-claude-bcq-' + Buffer.from(root).toString('hex').slice(-24) + '.json');
  const cached = readJson(cache);
  if (cached?.root === root) return cached.articles;
  const articles = [];
  const walk = (dir) => {
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.md') && e.name !== 'README.md') {
        const text = read(full) || '';
        const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!front) continue;
        const keywords = ((front[1].match(/^keywords:\s*\[(.*)\]/m) || [])[1] || '').split(',').map((k) => k.trim()).filter(Boolean);
        if (!keywords.length) continue;
        articles.push({ path: path.relative(root, full).split(path.sep).join('/'), domain: ((front[1].match(/^domain:\s*(.+)$/m) || [])[1] || '').trim(),
          keywords, title: ((text.match(/^# (.+)$/m) || [])[1] || e.name).trim() });
      }
    }
  };
  for (const layer of ['microsoft', 'community', 'custom']) walk(path.join(root, layer, 'knowledge'));
  try { fs.writeFileSync(cache, JSON.stringify({ root, articles })); } catch { /* best effort */ }
  return articles;
}

/** Lower-cased AL source of the project (bounded), skipping hidden, symbol and output folders. */
function alSource(cwd, limit = 2000000) {
  let out = '';
  const walk = (dir, depth) => {
    if (depth > 8 || out.length > limit) return;
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.') || ['node_modules', 'bin', 'obj', 'output'].includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (/\.al$/i.test(e.name)) out += '\n' + (read(full) || '').toLowerCase();
    }
  };
  walk(cwd, 0);
  return out;
}

/** AL files named in a brief that exist under cwd (the phase's changed files, when the brief lists them). */
function briefFiles(cwd, brief) {
  const names = String(brief || '').match(/[\w./\\-]+\.al\b/gi) || [];
  const found = new Set();
  for (const n of names) {
    const p = path.isAbsolute(n) ? n : path.join(cwd, n);
    if (fs.existsSync(p)) found.add(path.resolve(p));
  }
  return [...found];
}

/** Whether the project opts out of BCQuality: external.bcquality.enabled false in its aldc.yaml.
 *  Disabled means no probe and no load, so callers check it before any provider discovery. */
function bcqualityDisabled(cwd) {
  const text = read(path.join(cwd || '.', 'aldc.yaml'));
  if (!text) return false;
  let inExternal = false, bcqIndent = -1;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const indent = line.match(/^\s*/)[0].length;
    if (indent === 0) { inExternal = /^external:\s*(#.*)?$/.test(line); bcqIndent = -1; continue; }
    if (!inExternal) continue;
    if (bcqIndent >= 0 && indent <= bcqIndent) bcqIndent = -1;
    if (bcqIndent < 0) { if (/^\s+bcquality:\s*(#.*)?$/.test(line)) bcqIndent = indent; continue; }
    const m = line.match(/^\s+enabled:\s*["']?([^"'#\s]+)/);
    if (m) return m[1] === 'false';
  }
  return false;
}

/** Up to max BCQuality articles whose keywords occur in the phase's AL files (or the whole project) and the brief.
 *  Scoped to the files the brief names, so a small phase gets a short, relevant list (aldc-claude M11).
 *  Null when the project disabled BCQuality: nothing is discovered or scanned. */
function bcqualitySelection(cwd, brief, max = 15) {
  if (bcqualityDisabled(cwd)) return null;
  const root = bcqualityRoot();
  if (!root) return null;
  const files = briefFiles(cwd, brief);
  const source = files.length ? files.map((f) => (read(f) || '').toLowerCase()).join('\n') : alSource(cwd);
  const haystack = source + '\n' + String(brief || '').toLowerCase();
  const words = (k) => k.toLowerCase().split('-').filter((w) => w.length > 3);
  const scored = bcqualityArticles(root)
    .map((a) => ({ a, s: a.keywords.reduce((n, k) => n + (words(k).length && words(k).every((w) => haystack.includes(w)) ? 1 : 0), 0) }))
    .filter((x) => x.s >= 2).sort((x, y) => y.s - x.s).slice(0, max);
  return { root: root.split(path.sep).join('/'), articles: scored.map((x) => x.a), scope: files.length ? `${files.length} file(s) named in the brief` : 'whole project' };
}

/** Whether a plugin id prefix is installed for this user (installed_plugins.json). */
function pluginInstalled(prefix) {
  const data = readJson(path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json'));
  if (!data) return null;
  return Object.keys(data.plugins || data).some((k) => k.startsWith(prefix + '@'));
}

module.exports = { testRunner, readState, writeState, bcqualityDisabled, bcqualityRoot, bcqualityArticles, bcqualitySelection, alSource, briefFiles, pluginInstalled, PLUGIN_ROOT, autonomy, plansRoot, bcqualityInstalled, rulesBrief, sessionFile, readStdin, yamlValue, read };
