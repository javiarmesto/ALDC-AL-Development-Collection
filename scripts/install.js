#!/usr/bin/env node

/**
 * ALDC Core v1.2 — Local Installer
 *
 * Installs the ALDC toolkit into any AL project.
 *
 * Usage:
 *   npx aldc install [--target-dir <dir>] [--yes] [--force] [--dry-run] [--json]
 *   npx aldc status [--target-dir <dir>] [--json]
 *   npx aldc verify-install [--json]
 *   npx aldc rollback [--json]
 *   npx aldc validate [--target-dir <dir>]
 *   npx aldc bcq-index [--build] [--json]
 *   npx aldc --help
 *
 * --json prints one structured document on stdout for hosts such as the VS Code
 * extension; the human output stays the default and is not part of that contract.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ─── ANSI helpers ───────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

let JSON_MODE = false;
const out = (...args) => { if (!JSON_MODE) console.log(...args); };
const log = (msg, c = '') => out(`${c}${msg}${C.reset}`);
const ok = (msg) => log(`  + ${msg}`, C.green);
const err = (msg) => log(`  x ${msg}`, C.red);
const info = (msg) => log(msg, C.cyan);
const header = (title) => {
  out('');
  log('='.repeat(60), C.cyan);
  log(` ${title}`, C.bold);
  log('='.repeat(60), C.cyan);
};

/**
 * Show the ALDC banner
 */
function banner() {
  out('');
  out(`${C.cyan}    ╔══════════════════════════════════════════════════════╗${C.reset}`);
  out(`${C.cyan}    ║${C.reset}                                                      ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ║${C.reset}      ${C.bold}█████╗ ██╗     ██████╗  ██████╗${C.reset}               ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ║${C.reset}      ${C.bold}██╔══██╗██║     ██╔══██╗██╔════╝${C.reset}               ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ║${C.reset}      ${C.bold}███████║██║     ██║  ██║██║${C.reset}                    ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ║${C.reset}      ${C.bold}██╔══██║██║     ██║  ██║██║${C.reset}                    ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ║${C.reset}      ${C.bold}██║  ██║███████╗██████╔╝╚██████╗${C.reset}               ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ║${C.reset}      ${C.bold}╚═╝  ╚═╝╚══════╝╚═════╝  ╚═════╝${C.reset}               ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ║${C.reset}                                                      ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ║${C.reset}      ${C.dim}AL Development Collection${C.reset}                        ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ║${C.reset}      ${C.green}Core v1.2${C.reset} ${C.dim}— Skills-based AI-native toolkit${C.reset}     ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ║${C.reset}                                                      ${C.cyan}║${C.reset}`);
  out(`${C.cyan}    ╚══════════════════════════════════════════════════════╝${C.reset}`);
  out('');
}

// ─── CLI argument parsing ───────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = {
    command: null,
    targetDir: null,
    yes: false,
    force: false,
    profile: null,
    json: false,
    write: false,
    expectPlan: null,
    build: false,          // bcq-index --build
    // withPacks removed — bc-agents components are now regular optional content
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--target-dir' && args[i + 1]) {
      parsed.targetDir = args[++i];
    } else if (a === '--profile') {
      if (!args[i + 1] || !['bc28', 'bc29-native'].includes(args[i + 1])) {
        throw new Error('--profile must be bc28 or bc29-native');
      }
      parsed.profile = args[++i];
    } else if (a === '--yes' || a === '-y') {
      parsed.yes = true;
    } else if (a === '--dry-run') {
      parsed.dryRun = true;
    } else if (a === '--json') {
      parsed.json = true;
      parsed.yes = true; // A structured caller never answers interactive prompts.
    } else if (a === '--expect-plan') {
      if (!args[i + 1] || !/^[0-9a-f]{64}$/.test(args[i + 1])) throw new Error('--expect-plan expects the SHA-256 plan digest from a --dry-run --json preview');
      parsed.expectPlan = args[++i];
    } else if (a === '--write') {
      parsed.write = true;
    } else if (a === '--build') {
      parsed.build = true;
    } else if (a === '--force' || a === '-f') {
      parsed.force = true;
    } else if (a === '--help' || a === '-h') {
      parsed.command = 'help';
    } else if (!a.startsWith('-') && !parsed.command) {
      parsed.command = a;
    }
  }

  return parsed;
}

// ─── Filesystem helpers ────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Count files recursively in a directory (for folder-based skills).
 */
function countFiles(dir) {
  let count = 0;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      count += countFiles(full);
    } else {
      count++;
    }
  }
  return count;
}

// ─── Prompt helper ─────────────────────────────────────────────────────────
function ask(question, defaultYes = true) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const hint = defaultYes ? '(Y/n)' : '(y/N)';
  return new Promise((resolve) => {
    rl.question(`${C.cyan}${question} ${hint}: ${C.reset}`, (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      if (!a) return resolve(defaultYes);
      resolve(a === 'y' || a === 'yes');
    });
  });
}

// ─── ALDC Core v1.2 component map ──────────────────────────────────────────
const COMPONENTS = [
  { name: 'Agents',      src: 'agents',             count: '12 agents (5 public + 3 on-demand + 3 subagents + 1 optional)' },
  { name: 'Skills',      src: 'skills',             count: '17 skills (8 required + 4 recommended + 5 optional)' },
  { name: 'Prompts',     src: 'prompts',            count: '11 workflows (6 core + 5 agent-builder)' },
  { name: 'Instructions',src: 'instructions',       count: '9 instruction files (8 auto-applied + copilot entrypoint)' },
  { name: 'Templates',   src: 'docs/templates',     count: '7 contract templates' },
  { name: 'Framework',   src: 'docs/framework',     count: 'spec + docs' },
  { name: 'Doctor',      src: 'tools/context-doctor', count: 'read-only Python environment diagnostics' },
  { name: 'Validator',   src: 'tools/aldc-validate', count: 'compliance checker' },
  { name: 'BCQuality',   src: 'tools/bcquality', count: 'optional provider configuration and evidence tools' },
  { name: 'BC Tools',    src: 'tools/bc-agents',    count: 'scaffolder + validator' },
];

// What this package installs into this project: the single enumeration used both
// to perform an installation and to validate one. `validate` asks the same question
// the installer answers, so the two can never drift into disagreeing about what a
// complete installation contains.
function resolvePackageDir() {
  // When run from scripts/install.js (repo), go up one level.
  // When run from aldc-core-X.Y.Z/install.js (tgz), __dirname IS the package.
  return process.env.ALDC_PACKAGE_DIR ||
    (path.basename(__dirname) === 'scripts' ? path.resolve(__dirname, '..') : path.resolve(__dirname));
}

function plannedFiles({ packageDir, projectDir, targetDir, profile, transform = null }) {
  const files = new Map();
  const markerPath = path.join(targetDir, 'aldc-profile.json');
    const relative = dst => path.relative(projectDir, dst).split(path.sep).join('/');
    const known = knownInstallations(packageDir);
    const prior = rel => Array.isArray(known[rel]) ? known[rel] : undefined;
    const add = (src, dst, seed = false) => {
      let content = fs.readFileSync(src);
      if (transform) content = transform(src, content);
      const rel = relative(dst);
      if (files.has(rel)) throw new Error(`Duplicate installation destination: ${rel}`);
      files.set(rel, { content, seed, prior: prior(rel) });
    };
    const tree = (src, dst) => {
      if (!fs.existsSync(src)) return;
      for (const e of fs.readdirSync(src, { withFileTypes: true })) {
        if (['node_modules', 'package-lock.json', '.git', '.gitignore', '.npmignore'].includes(e.name)) continue;
        if (e.isSymbolicLink()) throw new Error(`Symlink source: ${src}/${e.name}`);
        if (e.isDirectory()) tree(path.join(src, e.name), path.join(dst, e.name));
        else add(path.join(src, e.name), path.join(dst, e.name));
      }
    };
    for (const comp of COMPONENTS) tree(path.join(packageDir, comp.src), path.join(targetDir, comp.src));
    tree(path.join(packageDir, 'collections'), path.join(targetDir, 'collections'));
    tree(path.join(packageDir, 'tools/bcquality'), path.join(projectDir, 'tools/bcquality'));
    // Keep the shared YAML reader and its declared dependency location adjacent
    // in both the toolkit target and the project-level compatibility tools.
    tree(path.join(packageDir, 'tools/aldc-validate'), path.join(projectDir, 'tools/aldc-validate'));
    // The multi-root workspace definition belongs to the developer: their folder list,
    // names and settings live here. Seed it once and never replace it, not even with
    // --force, exactly like project memory.
    add(path.join(packageDir, '.github/copilot-instructions.md'), path.join(projectDir, '.github/copilot-instructions.md'));
    add(path.join(packageDir, 'docs/templates/memory-template.md'), path.join(projectDir, '.github/plans/memory.md'), true);
    // The extension's "Getting Started" command opens this file from the install
    // target, so packaging it without installing it left a command that could
    // never succeed. The VSIX flattens it to the payload root; the repo and tgz
    // surfaces keep it under docs/.
    for (const candidate of ['getting-started.md', 'docs/getting-started.md']) {
      const src = path.join(packageDir, candidate);
      if (fs.existsSync(src)) { add(src, path.join(targetDir, 'getting-started.md')); break; }
    }
    const relTarget = relative(targetDir) || '.';
    const solution = detectSolution(projectDir);
    files.set('aldc.yaml', { prior: prior('aldc.yaml'), content: fs.readFileSync(path.join(packageDir, 'aldc.yaml'), 'utf8')
      .replace(/^toolkitRoot:\s*"\."/m, `toolkitRoot: ${JSON.stringify(relTarget)}`)
      .replace(/^(\s{4}application:)\s*""/m, `$1 ${JSON.stringify(solution.application)}`)
      .replace(/^(\s{4}test:)\s*""/m, `$1 ${JSON.stringify(solution.test)}`) });
    // The developer's multi-root definition: written when absent, never replaced.
    files.set('aldc.code-workspace', { content: workspaceSeed(projectDir, solution, '../bcquality'), seed: true, prior: prior('aldc.code-workspace') });
    files.set(relative(markerPath), { prior: prior(relative(markerPath)), content: JSON.stringify({ profile, surface: 'copilot-chat-vscode', version: packageVersion(packageDir) }, null, 2) + '\n' });
  return files;
}

// ─── INSTALL command ───────────────────────────────────────────────────────
async function install(opts) {
  // When run from scripts/install.js (repo), go up one level.
  // When run from aldc-core-X.Y.Z/install.js (tgz), __dirname IS the package.
  const packageDir = process.env.ALDC_PACKAGE_DIR ||
    (path.basename(__dirname) === 'scripts'
      ? path.resolve(__dirname, '..')
      : path.resolve(__dirname));
  const projectDir = process.cwd();
  const targetDir = path.resolve(projectDir, opts.targetDir || '.github');

  const markerPath = path.join(targetDir, 'aldc-profile.json');
  const marker = readProfileMarker(markerPath);
  if (marker.problem) throw failure(`Invalid installed profile marker (${path.relative(projectDir, markerPath)}): ${marker.problem}. Inspect it before installing.`, 'invalid-profile-marker');
  const previousProfile = marker.profile || 'bc28';
  const profile = opts.profile || previousProfile;
  if (!['bc28', 'bc29-native'].includes(profile)) throw failure('Unknown installed ALDC profile', 'unknown-profile');
  const existingPrimitives = ['agents', 'prompts', 'skills', 'instructions'].some(dir => fs.existsSync(path.join(targetDir, dir)));
  if (profile !== previousProfile && existingPrimitives && !opts.force) {
    throw failure('Profile switch requires --force to replace managed toolkit files coherently. Review/back up local customizations first.', 'profile-switch-requires-force');
  }
  // Preflight every projection before writing any installation files.
  let transform = null;
  if (profile === 'bc29-native') {
    const { project } = require('./native-profile');
    const projected = new Map();
    for (const dir of ['agents', 'prompts']) {
      for (const name of fs.readdirSync(path.join(packageDir, dir))) {
        const src = path.join(packageDir, dir, name);
        projected.set(src, project(`${dir}/${name}`, fs.readFileSync(src)));
      }
    }
    if (!fs.existsSync(path.join(packageDir, 'docs/framework/native-al-tools.md'))) throw new Error('Native contract missing from package');
    transform = (src, data) => projected.get(src) || data;
  }

  banner();
  header('ALDC Core v1.2 — Installer');
  info(`Profile: ${profile} (selection does not certify installed AL capabilities)`);

  info('Components to install:');
  for (const c of COMPONENTS) {
    log(`  ${c.name.padEnd(14)} ${c.count}`, C.blue);
  }
  out('');
  info(`Target directory: ${targetDir}`);
  info(`Project root:     ${projectDir}`);

  // Check for existing installation
  const hasExisting = fs.existsSync(targetDir) &&
    (fs.existsSync(path.join(targetDir, 'agents')) ||
     fs.existsSync(path.join(targetDir, 'skills')));

  if (hasExisting) {
    log('\nExisting ALDC installation detected.', C.yellow);
    if (opts.force) {
      log('--force: existing files will be overwritten.', C.yellow);
    } else if (!opts.yes) {
      const update = await ask('\nUpdate existing installation? (overwrites changed files)', true);
      if (update) {
        opts.force = true;
        log('Update mode: existing files will be overwritten.', C.yellow);
      } else {
        log('Merge mode: existing files will be preserved.', C.dim);
      }
    } else {
      log('Tracked unchanged files can update; customized files remain visible collisions.', C.dim);
    }
  }

  // Confirm unless --yes
  if (!opts.yes) {
    const proceed = await ask('\nProceed with installation?');
    if (!proceed) {
      log('\nInstallation cancelled.', C.red);
      process.exit(0);
    }
  }

  // Build every destination in memory before the first project write.
  const { apply } = require('./install-transaction');
  const files = plannedFiles({ packageDir, projectDir, targetDir, profile, transform });
  const relative = dst => path.relative(projectDir, dst).split(path.sep).join('/');
  const relTarget = relative(targetDir) || '.';
  const result = apply({ root: projectDir, surface: 'chat', files, force: opts.force, dryRun: opts.dryRun, expectDigest: opts.expectPlan });
  for (const file of result.files) if (file.action !== 'unchanged') log(`  ${file.action}: ${file.path}`);
  const summary = {};
  for (const file of result.files) summary[file.action] = (summary[file.action] || 0) + 1;
  const recognised = result.files.filter(f => f.recognised).map(f => f.path);
  const structured = { ok: true, command: 'install', dryRun: Boolean(opts.dryRun), profile, previousProfile,
    profileSwitch: existingPrimitives && profile !== previousProfile, existingInstallation: existingPrimitives,
    targetDir: relTarget, force: Boolean(opts.force), digest: result.digest, transaction: result.transaction || null,
    files: result.files, summary, collisions: result.files.filter(f => f.action === 'collision').map(f => f.path),
    replaced: result.files.filter(f => f.action === 'replace' && f.customized).map(f => f.path), recognised,
    doctorScript: relative(path.join(targetDir, 'tools/context-doctor/aldc_context_doctor.py')) };
  if (opts.dryRun) { info('Dry run: no files written.'); return structured; }
  const totalCopied = result.files.filter(f => ['add', 'replace'].includes(f.action)).length;
  const totalSkipped = result.files.filter(f => ['preserve', 'collision'].includes(f.action)).length;
  if (result.transaction) info(`Backup transaction: ${result.transaction}; use aldc rollback to restore.`);
  info('Environment diagnostics: run an available Python 3.9+ interpreter with ' + path.join(targetDir, 'tools/context-doctor/aldc_context_doctor.py') + ' --workspace . --host chat --toolkit ' + targetDir + '. See its README; exit 0 does not certify runtime execution.');
  info('Validator dependencies are not installed automatically. Run npm install in the installed tools/aldc-validate directory if needed.');

  // ─── Summary ──────────────────────────────────────────────────────────────
  header('Installation Complete');
  log(`Files copied:  ${totalCopied}`, C.green);
  if (totalSkipped > 0) {
    log(`Files skipped: ${totalSkipped} (already exist)`, C.yellow);
  }
  log(`Location:      ${targetDir}`, C.cyan);

  out('');
  log('Next steps:', C.bold);
  log('  1. Open VS Code in your AL project', C.blue);
  log('  2. Try: @al-architect to design a solution', C.blue);
  log('  3. Or:  @workspace /al-initialize to set up environment', C.blue);
  out('');

  if (!opts.force && totalSkipped > 0) {
    log('Tip: Use --force to overwrite existing files on next run.', C.dim);
    out('');
  }
  return structured;
}

function failure(message, code) { return Object.assign(new Error(message), { code }); }

function readProfileMarker(markerPath) {
  if (!fs.existsSync(markerPath)) return { present: false, profile: null, version: null, problem: null };
  try {
    const value = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
    const profile = value && typeof value === 'object' && !Array.isArray(value) ? value.profile : undefined;
    if (!['bc28', 'bc29-native'].includes(profile)) return { present: true, profile: null, version: null, problem: 'expected bc28 or bc29-native profile' };
    // Installations written before 4.3.1 carry no version; that is reported, not repaired.
    const version = typeof value.version === 'string' && /^\d+\.\d+\.\d+/.test(value.version) ? value.version : null;
    return { present: true, profile, version, problem: null };
  } catch (error) {
    return { present: true, profile: null, version: null, problem: error instanceof SyntaxError ? 'malformed JSON' : error.message };
  }
}

// What previous releases wrote, so their untouched content is recognised instead of
// being reported as a local change. Absent or unreadable means nothing is recognised.
function knownInstallations(packageDir) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(packageDir, 'known-installations.json'), 'utf8'));
    if (data.schema !== 1 || !data.paths || typeof data.paths !== 'object') return {};
    return data.paths;
  } catch { return {}; }
}

// The version of the payload being installed. A host that packages the payload
// without its manifest -- the VS Code extension ships templates/ alone -- states
// it instead, because an empty version in the receipt is worse than none: the
// panel would report an installed toolkit it cannot name.
function packageVersion(packageDir) {
  const stated = String(process.env.ALDC_PACKAGE_VERSION || '').trim();
  if (stated) return stated;
  try { return String(JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version || ''); } catch { return ''; }
}

const IGNORED_SCAN = new Set(['node_modules', '.git', '.alpackages', '.altestrunner', '.snapshots', 'out', 'bin', 'obj']);

// Conventional test folder names, including AL-Go's "<app>.Test" sibling. Kept
// identical to Doctor's rule so both pieces classify a solution the same way.
function isTestFolder(name) {
  const n = name.toLowerCase();
  return n === 'test' || n === 'tests' || n.startsWith('test-') || n.endsWith('.test') || n.endsWith('.tests');
}

// Folders holding an app.json, at most three levels down, pruning hidden folders,
// dependencies and build output, never following symlinks. Same reach as Doctor,
// because AL-Go names the app folder after the app rather than src or app.
function discoverManifests(projectDir) {
  const found = [];
  const walk = (dir, depth) => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    if (depth > 0 && entries.some(e => e.isFile() && e.name === 'app.json')) {
      found.push(path.relative(projectDir, dir).split(path.sep).join('/'));
      return; // a project is a leaf; nothing nested inside it is a separate root
    }
    if (depth >= 3) return;
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || entry.name.startsWith('.') || IGNORED_SCAN.has(entry.name)) continue;
      walk(path.join(dir, entry.name), depth + 1);
    }
  };
  walk(projectDir, 0);
  return found.sort();
}

// Which folders this solution actually has. AL-Go declares them when it has them;
// otherwise they are discovered. Nothing is ever created here.
function detectSolution(projectDir) {
  const manifest = rel => rel && fs.existsSync(path.join(projectDir, rel, 'app.json')) ? rel.replace(/\\/g, '/') : '';
  let declared = {};
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(projectDir, '.AL-Go/settings.json'), 'utf8'));
    declared = { application: manifest((settings.appFolders || [])[0]), test: manifest((settings.testFolders || [])[0]) };
  } catch { declared = {}; }
  const discovered = discoverManifests(projectDir);
  const tests = discovered.filter(rel => rel.split('/').some(isTestFolder));
  const apps = discovered.filter(rel => !tests.includes(rel));
  return { application: declared.application || apps[0] || '', test: declared.test || tests[0] || '' };
}

// ─── SOLUTION command ──────────────────────────────────────────────────────
// aldc.yaml is read and rewritten as text, never reserialized: only the two root
// values change, so every comment and every other setting survives byte for byte.
// A file whose solution block ALDC cannot recognise is reported, never reformatted.
const ROOT_KEYS = ['application', 'test'];

// The scalar after "key:", plus whatever trailing comment followed it.
function scalar(rest) {
  const lead = /^\s*/.exec(rest)[0];
  const text = rest.slice(lead.length);
  if (!text || text.startsWith('#')) return { value: '', comment: text ? rest : '' };
  if (text[0] === '"' || text[0] === "'") {
    const end = text.indexOf(text[0], 1);
    if (end === -1) return null;
    return { value: text.slice(1, end), comment: text.slice(end + 1) };
  }
  const comment = text.search(/\s#/);
  return comment === -1 ? { value: text.trimEnd(), comment: '' } : { value: text.slice(0, comment).trimEnd(), comment: text.slice(comment) };
}

// Where solution.roots.application and solution.roots.test live in the file.
function solutionRoots(text) {
  const lines = text.split(/\r?\n/);
  const indent = line => line.length - line.trimStart().length;
  let i = lines.findIndex(line => /^solution:\s*(#.*)?$/.test(line));
  if (i === -1) return { problem: 'no top-level `solution:` block' };
  let level = null, rootsAt = -1;
  for (i++; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (indent(line) === 0) break; // the solution block ended
    if (level === null) level = indent(line);
    if (indent(line) !== level) continue; // nested under another key
    if (/^roots:\s*(#.*)?$/.test(line.trim())) { rootsAt = i; break; }
  }
  if (rootsAt === -1) return { problem: 'no `roots:` mapping inside `solution:`' };
  const found = {};
  for (i = rootsAt + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (indent(line) <= level) break;
    const match = /^(\s+)([A-Za-z0-9_-]+):(.*)$/.exec(line);
    if (!match) return { problem: `unrecognised line inside solution.roots: ${line.trim()}` };
    if (!ROOT_KEYS.includes(match[2])) continue;
    const parsed = scalar(match[3]);
    if (!parsed) return { problem: `unreadable value for solution.roots.${match[2]}` };
    found[match[2]] = { at: i, indent: match[1], ...parsed };
  }
  for (const key of ROOT_KEYS) if (!found[key]) return { problem: `solution.roots.${key} is not declared` };
  return { roots: found };
}

function rewriteRoots(text, block, values) {
  const lines = text.split(/\r?\n/);
  for (const key of ROOT_KEYS) {
    const entry = block.roots[key];
    if (values[key] === entry.value) continue;
    lines[entry.at] = `${entry.indent}${key}: ${JSON.stringify(values[key])}${entry.comment}`;
  }
  return lines.join(text.includes('\r\n') ? '\r\n' : '\n');
}

// Re-read the layout from disk. A declared root that still holds a manifest is never
// overridden: the developer may have picked one app among several, and discovery
// cannot know that. Only a root that is undeclared, or declared at a folder that no
// longer holds an app.json, is proposed for replacement, and nothing is ever cleared.
function solution(opts) {
  const projectDir = process.cwd();
  const configPath = path.join(projectDir, 'aldc.yaml');
  if (!fs.existsSync(configPath)) throw failure('No aldc.yaml in this project. Install the toolkit before re-detecting the layout.', 'no-configuration');
  const text = fs.readFileSync(configPath, 'utf8');
  const block = solutionRoots(text);
  if (block.problem) throw failure(`Cannot read the declared layout from aldc.yaml: ${block.problem}. Nothing was written; edit the file by hand.`, 'unreadable-solution');
  const configured = Object.fromEntries(ROOT_KEYS.map(key => [key, block.roots[key].value]));
  const detected = detectSolution(projectDir);
  const holdsManifest = rel => Boolean(rel) && fs.existsSync(path.join(projectDir, rel, 'app.json'));
  const verified = Object.fromEntries(ROOT_KEYS.map(key => [key, holdsManifest(configured[key])]));
  const changes = ROOT_KEYS.filter(key => !verified[key] && detected[key] && detected[key] !== configured[key])
    .map(key => ({ key, from: configured[key], to: detected[key] }));
  const stale = ROOT_KEYS.filter(key => configured[key] && !verified[key] && !changes.some(c => c.key === key));
  const describe = value => value ? JSON.stringify(value) : '(none)';
  const result = { ok: true, command: 'solution', configPath: 'aldc.yaml', configured, detected, verified, changes, stale,
    matches: changes.length === 0, written: false, backup: null,
    message: changes.length ? 'Re-detected: ' + changes.map(c => `${c.key} ${describe(c.from)} -> ${describe(c.to)}`).join('; ')
      : stale.length ? `Declared but no app.json found there, and nothing was discovered to replace it: ${stale.join(', ')}. Declare the folder in .AL-Go/settings.json or correct aldc.yaml by hand.`
      : 'The declared layout already matches the folders on disk.' };
  if (!opts.write || !changes.length) return result;
  const applied = Object.fromEntries(ROOT_KEYS.map(key => [key, changes.find(c => c.key === key)?.to ?? configured[key]]));
  const backup = `.aldc-install/solution/${new Date().toISOString().replace(/[:.]/g, '-')}.aldc.yaml`;
  fs.mkdirSync(path.dirname(path.join(projectDir, backup)), { recursive: true });
  const ignore = path.join(projectDir, '.aldc-install/.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '*\n');
  fs.writeFileSync(path.join(projectDir, backup), text);
  fs.writeFileSync(configPath, rewriteRoots(text, block, applied));
  return { ...result, written: true, backup, matches: true, configured: applied,
    message: `solution.roots updated in aldc.yaml (${changes.map(c => c.key).join(', ')}); the previous file is kept at ${backup}. aldc.yaml now differs from the installed content, so the next update reports it as a local change and preserves it.` };
}

// Seeded once, then owned by the developer. Comments survive because the file is text.
function workspaceSeed(projectDir, solution, bcqualityHome) {
  const folders = [{ name: path.basename(projectDir) || 'AL solution', path: '.' }];
  if (solution.application) folders.push({ name: 'Application', path: solution.application });
  if (solution.test) folders.push({ name: 'Tests', path: solution.test });
  if (bcqualityHome) folders.push({ name: 'BCQuality (knowledge, not compiled)', path: bcqualityHome });
  return ['{',
    '  // Multi-root workspace for this AL solution, seeded by ALDC from the folders that',
    '  // existed at installation. ALDC never rewrites this file: adjust it freely.',
    '  // The declared layout lives in aldc.yaml under `solution.roots`.',
    '  //',
    '  // The BCQuality root has no app.json, so the AL compiler never builds it and its',
    '  // example objects cannot reach your extension. Run tools/bcquality/install.sh',
    '  // (install.ps1 on Windows) if that root shows as missing.',
    '  "folders": ' + JSON.stringify(folders, null, 2).split('\n').join('\n  ') + ',',
    '  "settings": {',
    '    "git.detectSubmodules": false',
    '  }',
    '}', ''].join('\n');
}

// Read-only installation state for hosts. Never installs, repairs or writes.
function status(opts) {
  const projectDir = process.cwd();
  const targetDir = path.resolve(projectDir, opts.targetDir || '.github');
  const state = require('./install-transaction').inspect(projectDir, 'chat');
  const marker = readProfileMarker(path.join(targetDir, 'aldc-profile.json'));
  const relTarget = path.relative(projectDir, targetDir).split(path.sep).join('/') || '.';
  // The receipt records the profile marker under the installed target; another requested target is reported, never verified.
  const markerKey = state.receipt === 'valid' ? (state.paths || []).find(p => p === 'aldc-profile.json' || p.endsWith('/aldc-profile.json')) : null;
  const receiptTarget = markerKey ? (markerKey.includes('/') ? markerKey.slice(0, markerKey.lastIndexOf('/')) : '.') : null;
  const targetMismatch = receiptTarget !== null && receiptTarget !== relTarget ? receiptTarget : null;
  // BCQuality knowledge index — observation only, never a probe of the provider.
  let bcqIndex = { status: 'unobserved', detail: 'not evaluated' };
  try { bcqIndex = require('../tools/bcquality/index-state').status(projectDir); } catch { /* non-fatal */ }
  const bcqIcon = { prebuilt: '🟢', generated: '🟢', 'not-attempted': '⚪', failed: '🔴', unobserved: '⚪' }[bcqIndex.status] || '⚪';
  const bcqLine = `${bcqIcon} BCQuality index: ${bcqIndex.status} — ${bcqIndex.detail}`
    + (bcqIndex.status === 'not-attempted' && bcqIndex.attemptable !== false
        ? '\n   run: npx aldc bcq-index --build' : '');
  return { ok: state.receipt === 'valid' && state.drift.length === 0 && targetMismatch === null, command: 'status', targetDir: relTarget, receiptTarget, targetMismatch,
    profile: marker.profile, profileMarker: marker.present ? (marker.problem ? 'invalid' : 'valid') : 'absent', profileProblem: marker.problem, installedVersion: marker.version,
    toolkitPresent: ['agents', 'prompts', 'skills', 'instructions'].some(dir => fs.existsSync(path.join(targetDir, dir))),
    doctorScript: fs.existsSync(path.join(targetDir, 'tools/context-doctor/aldc_context_doctor.py')) ? relTarget + '/tools/context-doctor/aldc_context_doctor.py' : null,
    bcqIndex,
    message: (state.receipt === 'absent' ? 'No installation receipt. Older toolkit copies may have no receipt; Install reviews existing-file collisions.'
      : state.receipt === 'invalid' ? `Invalid installation receipt (${state.receiptPath}): ${state.receiptProblem}. Preserve the receipt/backups and inspect before replacing anything.`
      : targetMismatch ? `Installation receipt records target "${targetMismatch}", not "${relTarget}". Verify and restore apply to the recorded target; install to "${relTarget}" only after moving or rolling back the recorded installation.`
      : state.drift.length ? 'Drift: ' + state.drift.join(', ')
      : 'Managed files match installation receipt; host loading remains unverified.')
      + '\n' + bcqLine,
    ...state };
}

// ─── VALIDATE command ──────────────────────────────────────────────────────
async function validate(opts) {
  const projectDir = process.cwd();
  const targetDir = path.resolve(projectDir, opts.targetDir || '.github');

  banner();
  header('ALDC Core v1.2 — Validation');
  info(`Checking: ${targetDir}`);
  out('');

  let errors = 0;
  let warnings = 0;
  let totalFiles = 0;

  // Check each component directory
  for (const comp of COMPONENTS) {
    const dir = path.join(targetDir, comp.src);
    if (fs.existsSync(dir)) {
      const count = countFiles(dir);
      totalFiles += count;
      ok(`${comp.src}/ (${count} files) — ${comp.name}`);
    } else {
      err(`${comp.src}/ — MISSING`);
      errors++;
    }
  }

  // A directory that exists says nothing about what is inside it, which is how a
  // deleted agent passed as VALID while the count quietly dropped by one. Ask the
  // installer what a complete installation contains and compare file by file. The
  // profile comes from the receipt, because a bc29-native installation projects a
  // different set from a bc28 one.
  const marker = readProfileMarker(path.join(targetDir, 'aldc-profile.json'));
  let planned = null;
  try {
    planned = plannedFiles({ packageDir: resolvePackageDir(), projectDir, targetDir,
      profile: marker.profile || 'bc28' });
  } catch (error) {
    log(`  ! expected file list unavailable (${error.message}) — presence not compared`, C.yellow);
    warnings++;
  }
  if (planned) {
    if (!marker.profile) {
      log('  ! no installed profile recorded; comparing against the default profile', C.yellow);
      warnings++;
    }
    const absent = [], absentSeeds = [];
    for (const [rel, entry] of planned) {
      if (fs.existsSync(path.join(projectDir, rel))) continue;
      (entry.seed ? absentSeeds : absent).push(rel);
    }
    const list = names => names.slice(0, 10).map(n => `      ${n}`).join('\n') +
      (names.length > 10 ? `\n      … and ${names.length - 10} more` : '');
    if (absent.length) {
      err(`${absent.length} expected file(s) missing:`);
      out(list(absent));
      errors += absent.length;
    } else {
      ok(`every expected file is present (${planned.size - absentSeeds.length} checked)`);
    }
    // Seeds are written once and then belong to the developer, so their absence is
    // reported without failing the build.
    if (absentSeeds.length) {
      log(`  ! ${absentSeeds.length} seeded file(s) absent (created at install, never replaced):`, C.yellow);
      out(list(absentSeeds));
      warnings += absentSeeds.length;
    }
  }

  // Check aldc.yaml
  const aldcYaml = path.join(projectDir, 'aldc.yaml');
  if (fs.existsSync(aldcYaml)) {
    ok('aldc.yaml');
  } else {
    err('aldc.yaml — MISSING');
    errors++;
  }

  // Check copilot-instructions.md entrypoint
  const copilotEntry = path.join(projectDir, '.github', 'copilot-instructions.md');
  if (fs.existsSync(copilotEntry)) {
    ok('.github/copilot-instructions.md');
  } else {
    log(`  ! .github/copilot-instructions.md — missing (recommended)`, C.yellow);
    warnings++;
  }

  // Check plans directory and memory
  const plansDir = path.join(projectDir, '.github', 'plans');
  if (fs.existsSync(plansDir)) {
    ok('.github/plans/');
    const memory = path.join(plansDir, 'memory.md');
    if (fs.existsSync(memory)) {
      ok('.github/plans/memory.md');
    } else {
      log(`  ! .github/plans/memory.md — missing (recommended)`, C.yellow);
      warnings++;
    }
  } else {
    err('.github/plans/ — MISSING');
    errors++;
  }

  // Summary
  out('');
  if (errors === 0) {
    log('='.repeat(60), C.green);
    log(` VALID — ${totalFiles} files, ${warnings} warning(s)`, C.green);
    log('='.repeat(60), C.green);
  } else {
    log('='.repeat(60), C.red);
    log(` INVALID — ${errors} error(s), ${warnings} warning(s)`, C.red);
    log('='.repeat(60), C.red);
    out('');
    log('Run "npx aldc install" to fix missing components.', C.cyan);
    // A verdict nobody can act on is not a verdict: a script that runs this in
    // CI reads the exit code, not the colour of the summary line.
    process.exitCode = 1;
  }
  out('');
}

// ─── HELP ──────────────────────────────────────────────────────────────────
function showHelp() {
  banner();
  out(`
${C.bold}ALDC Core v1.2 — CLI${C.reset}

${C.cyan}Usage:${C.reset}
  npx aldc <command> [options]

${C.cyan}Commands:${C.reset}
  install     Install ALDC toolkit into current project
  solution    Report the declared AL layout against the folders on disk (--write to update it)
  validate    Verify installation is complete
  bcq-index   Report the BCQuality knowledge-index state (--build to create it).
              Exit 1 means a usable index is missing on a machine that could build one.
  --help      Show this help

${C.cyan}Options:${C.reset}
  --profile <name>    bc28 (default for new installs) or bc29-native (Copilot Chat)
  --target-dir <dir>  Installation directory (default: .github)
  --yes, -y           Skip confirmation prompts
  --force, -f         Replace reviewed collisions with backup
  --dry-run          Preview all file actions without writes
  --json             Structured stdout for hosts (implies --yes); human output is the default
  --expect-plan <d>  Apply only if the plan still matches the digest of a --dry-run --json preview
  --write            solution: rewrite solution.roots in aldc.yaml after keeping a copy

${C.cyan}Examples:${C.reset}
  ${C.green}# Install to default .github/ directory${C.reset}
  npx aldc install

  ${C.green}# Install to custom directory, non-interactive${C.reset}
  npx aldc install --target-dir .copilot --yes

  ${C.green}# Force-update all files${C.reset}
  npx aldc install --force --yes
  npx aldc status
  npx aldc verify-install
  npx aldc rollback

  ${C.green}# Install from local .tgz${C.reset}
  npm install ./al-development-collection-3.2.0.tgz
  npx aldc install

  ${C.green}# Validate current installation${C.reset}
  npx aldc validate

${C.cyan}What gets installed:${C.reset}
  ${C.bold}Core:${C.reset}
  <target-dir>/
    agents/           12 agents (including 3 subagents)
    skills/           17 skills (8 required + 4 recommended + 5 optional)
    prompts/          11 workflows (6 core + 5 agent-builder)
    instructions/     8 scoped instructions + copilot entrypoint
    docs/framework/   Core specification & docs
    docs/templates/   7 contract templates
    collections/      Collection manifest
    tools/bc-agents/  Agent SDK scaffolder + validator
  <project-root>/
    aldc.yaml         ALDC Core configuration
    .github/copilot-instructions.md   Copilot entrypoint
    .github/plans/memory.md           Global memory template
`);
}

// ─── TEST-LOCAL command ──────────────────────────────────────────────────
async function testLocal() {
  const os = require('os');
  const tmpBase = path.join(os.tmpdir(), 'aldc-test-' + Date.now());
  const tmpProject = path.join(tmpBase, 'test-project');
  fs.mkdirSync(tmpProject, { recursive: true });

  banner();
  header('ALDC Core v1.2 — Local Test');
  info(`Test directory: ${tmpProject}`);
  out('');

  // Run install into temp dir
  const origCwd = process.cwd();
  process.chdir(tmpProject);
  await install({ targetDir: '.github', yes: true, force: true });

  // Validate skills structure
  header('Verifying Skills Folder Structure');
  const skillsDir = path.join(tmpProject, '.github', 'skills');
  let skillErrors = 0;
  let skillCount = 0;

  if (!fs.existsSync(skillsDir)) {
    err('skills/ directory not found in target');
    skillErrors++;
  } else {
    for (const entry of fs.readdirSync(skillsDir)) {
      const entryPath = path.join(skillsDir, entry);
      if (!fs.statSync(entryPath).isDirectory()) {
        if (entry === 'index.md') continue;
        log(`  ? ${entry} (loose file, expected folder)`, C.yellow);
        continue;
      }
      const skillMd = path.join(entryPath, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        // Check frontmatter
        const content = fs.readFileSync(skillMd, 'utf8');
        const hasFrontmatter = content.startsWith('---');
        if (hasFrontmatter) {
          ok(`${entry}/SKILL.md (frontmatter OK)`);
        } else {
          err(`${entry}/SKILL.md (MISSING frontmatter)`);
          skillErrors++;
        }
        skillCount++;
      } else {
        err(`${entry}/ — SKILL.md MISSING`);
        skillErrors++;
      }
    }
  }

  // Verify agent-instructions has assets
  const agentInstrDir = path.join(skillsDir, 'skill-agent-instructions');
  if (fs.existsSync(agentInstrDir)) {
    const refs = path.join(agentInstrDir, 'references', 'agent-keywords-reference.md');
    const ex1 = path.join(agentInstrDir, 'examples', 'agent-simple-instructions.txt');
    const ex2 = path.join(agentInstrDir, 'examples', 'agent-advanced-instructions.txt');
    if (fs.existsSync(refs)) ok('references/agent-keywords-reference.md'); else { err('references/ missing'); skillErrors++; }
    if (fs.existsSync(ex1)) ok('examples/agent-simple-instructions.txt'); else { err('examples/ missing'); skillErrors++; }
    if (fs.existsSync(ex2)) ok('examples/agent-advanced-instructions.txt'); else { err('examples/ missing'); skillErrors++; }
  }

  // Run ALDC validator on the installed output
  header('Running ALDC Validator on Installed Output');
  const aldcYamlDst = path.join(tmpProject, 'aldc.yaml');
  if (fs.existsSync(aldcYamlDst)) {
    const { execSync } = require('child_process');
    try {
      const validatorPath = path.join(tmpProject, '.github', 'tools', 'aldc-validate', 'index.js');
      if (fs.existsSync(validatorPath)) {
        const out = execSync(`node "${validatorPath}" --config aldc.yaml`, {
          cwd: tmpProject,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        out(out);
      } else {
        log('  Validator not found in installed output (tools/ not copied by default)', C.dim);
      }
    } catch (e) {
      err('Validator failed:');
      out(e.stdout || e.message);
    }
  }

  // Summary
  header('Test Results');
  log(`Skills verified: ${skillCount}`, C.green);
  if (skillErrors === 0) {
    log('ALL CHECKS PASSED', C.green + C.bold);
  } else {
    log(`${skillErrors} error(s) found`, C.red);
  }
  out('');
  info(`Test output preserved at: ${tmpProject}`);
  log('Delete manually when done: rm -rf "' + tmpBase + '"', C.dim);
  out('');

  process.chdir(origCwd);
}

// ─── Main ──────────────────────────────────────────────────────────────────
let opts;
try { opts = parseArgs(process.argv); }
catch (e) {
  if (process.argv.includes('--json')) console.log(JSON.stringify({ ok: false, command: null, code: 'invalid-arguments', error: e.message }));
  else err(e.message);
  process.exit(1);
}
JSON_MODE = opts.json;
const emit = (value, exitCode = 0) => { console.log(JSON.stringify(value, null, 2)); process.exitCode = exitCode; };
const fail = (command, e, exitCode = 1) => {
  if (JSON_MODE) emit({ ok: false, command, code: e.code || null, error: e.message }, exitCode);
  else { err(e.message); process.exitCode = exitCode; }
};

switch (opts.command) {
  case 'help':
    showHelp();
    break;
  case 'rollback':
    try {
      const result = require('./install-transaction').rollback(process.cwd(), 'chat');
      if (JSON_MODE) emit({ ok: true, command: 'rollback', ...result }); else out(result);
    } catch (e) { fail('rollback', e); }
    break;
  case 'status':
    try {
      const result = status(opts);
      if (JSON_MODE) emit(result); else out(result.message);
    } catch (e) { fail('status', e); }
    break;
  case 'verify-install':
    try {
      if (JSON_MODE) { const result = status(opts); emit({ ...result, command: 'verify-install' }, result.ok ? 0 : 1); break; }
      const changed = require('./install-transaction').drift(process.cwd(), 'chat');
      out(changed.length ? 'Drift: ' + changed.join(', ') : 'Managed files match installation receipt; host loading remains unverified.');
      if (changed.length) process.exitCode = 1;
    } catch (e) { fail('verify-install', e); }
    break;
  case 'solution':
    try {
      const result = solution(opts);
      if (JSON_MODE) emit(result); else out(result.message);
    } catch (e) { fail('solution', e); }
    break;
  case 'bcq-index':
    try {
      // Inside the try: config.js throws a stated error when the YAML reader is
      // absent, and that belongs in fail(), not in an uncaught stack trace.
      const idx = require('../tools/bcquality/index-state');
      const result = opts.build ? idx.build(process.cwd()) : idx.status(process.cwd());
      if (JSON_MODE) emit(result, idx.ok(result) ? 0 : 1);
      else { out(`BCQuality index: ${result.status} — ${result.detail}`); process.exitCode = idx.ok(result) ? 0 : 1; }
    } catch (e) { fail('bcq-index', e); }
    break;
  case 'validate':
    validate(opts).catch((e) => { err(e.message); process.exit(1); });
    break;
  case 'test-local':
    testLocal().catch((e) => { err(e.message); process.exit(1); });
    break;
  case 'install':
  default:
    install(opts).then(result => { if (JSON_MODE) emit(result); })
      .catch((e) => { fail('install', e); if (!JSON_MODE) process.exit(1); });
    break;
}
