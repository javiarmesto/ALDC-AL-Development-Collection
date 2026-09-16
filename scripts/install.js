#!/usr/bin/env node

/**
 * ALDC Core v1.2 — Local Installer
 *
 * Installs the ALDC toolkit into any AL project.
 *
 * Usage:
 *   npx aldc install [--target-dir <dir>] [--yes] [--force]
 *   npx aldc validate [--target-dir <dir>]
 *   npx aldc --help
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

const log = (msg, c = '') => console.log(`${c}${msg}${C.reset}`);
const ok = (msg) => log(`  + ${msg}`, C.green);
const err = (msg) => log(`  x ${msg}`, C.red);
const info = (msg) => log(msg, C.cyan);
const header = (title) => {
  console.log('');
  log('='.repeat(60), C.cyan);
  log(` ${title}`, C.bold);
  log('='.repeat(60), C.cyan);
};

/**
 * Show the ALDC banner
 */
function banner() {
  console.log('');
  console.log(`${C.cyan}    ╔══════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}                                                      ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}      ${C.bold}█████╗ ██╗     ██████╗  ██████╗${C.reset}               ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}      ${C.bold}██╔══██╗██║     ██╔══██╗██╔════╝${C.reset}               ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}      ${C.bold}███████║██║     ██║  ██║██║${C.reset}                    ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}      ${C.bold}██╔══██║██║     ██║  ██║██║${C.reset}                    ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}      ${C.bold}██║  ██║███████╗██████╔╝╚██████╗${C.reset}               ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}      ${C.bold}╚═╝  ╚═╝╚══════╝╚═════╝  ╚═════╝${C.reset}               ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}                                                      ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}      ${C.dim}AL Development Collection${C.reset}                        ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}      ${C.green}Core v1.2${C.reset} ${C.dim}— Skills-based AI-native toolkit${C.reset}     ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ║${C.reset}                                                      ${C.cyan}║${C.reset}`);
  console.log(`${C.cyan}    ╚══════════════════════════════════════════════════════╝${C.reset}`);
  console.log('');
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
  const previousProfile = fs.existsSync(markerPath)
    ? JSON.parse(fs.readFileSync(markerPath, 'utf8')).profile : 'bc28';
  const profile = opts.profile || previousProfile;
  if (!['bc28', 'bc29-native'].includes(profile)) throw new Error('Unknown installed ALDC profile');
  const existingPrimitives = ['agents', 'prompts', 'skills', 'instructions'].some(dir => fs.existsSync(path.join(targetDir, dir)));
  if (profile !== previousProfile && existingPrimitives && !opts.force) {
    throw new Error('Profile switch requires --force to replace managed toolkit files coherently. Review/back up local customizations first.');
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
  console.log('');
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
  const files = new Map();
  const relative = dst => path.relative(projectDir, dst).split(path.sep).join('/');
  const add = (src, dst, seed = false) => {
    let content = fs.readFileSync(src);
    if (transform) content = transform(src, content);
    const rel = relative(dst);
    if (files.has(rel)) throw new Error(`Duplicate installation destination: ${rel}`);
    files.set(rel, { content, seed });
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
  add(path.join(packageDir, 'aldc.code-workspace'), path.join(projectDir, 'aldc.code-workspace'));
  add(path.join(packageDir, '.github/copilot-instructions.md'), path.join(projectDir, '.github/copilot-instructions.md'));
  add(path.join(packageDir, 'docs/templates/memory-template.md'), path.join(projectDir, '.github/plans/memory.md'), true);
  const relTarget = relative(targetDir) || '.';
  files.set('aldc.yaml', { content: fs.readFileSync(path.join(packageDir, 'aldc.yaml'), 'utf8')
    .replace(/^toolkitRoot:\s*"\."/m, `toolkitRoot: ${JSON.stringify(relTarget)}`) });
  files.set(relative(markerPath), { content: JSON.stringify({ profile, surface: 'copilot-chat-vscode' }, null, 2) + '\n' });
  const result = apply({ root: projectDir, surface: 'chat', files, force: opts.force, dryRun: opts.dryRun });
  for (const file of result.files) if (file.action !== 'unchanged') log(`  ${file.action}: ${file.path}`);
  if (opts.dryRun) { info('Dry run: no files written.'); return; }
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

  console.log('');
  log('Next steps:', C.bold);
  log('  1. Open VS Code in your AL project', C.blue);
  log('  2. Try: @al-architect to design a solution', C.blue);
  log('  3. Or:  @workspace /al-initialize to set up environment', C.blue);
  console.log('');

  if (!opts.force && totalSkipped > 0) {
    log('Tip: Use --force to overwrite existing files on next run.', C.dim);
    console.log('');
  }
}

// ─── VALIDATE command ──────────────────────────────────────────────────────
async function validate(opts) {
  const projectDir = process.cwd();
  const targetDir = path.resolve(projectDir, opts.targetDir || '.github');

  banner();
  header('ALDC Core v1.2 — Validation');
  info(`Checking: ${targetDir}`);
  console.log('');

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
  console.log('');
  if (errors === 0) {
    log('='.repeat(60), C.green);
    log(` VALID — ${totalFiles} files, ${warnings} warning(s)`, C.green);
    log('='.repeat(60), C.green);
  } else {
    log('='.repeat(60), C.red);
    log(` INVALID — ${errors} error(s), ${warnings} warning(s)`, C.red);
    log('='.repeat(60), C.red);
    console.log('');
    log('Run "npx aldc install" to fix missing components.', C.cyan);
  }
  console.log('');
}

// ─── HELP ──────────────────────────────────────────────────────────────────
function showHelp() {
  banner();
  console.log(`
${C.bold}ALDC Core v1.2 — CLI${C.reset}

${C.cyan}Usage:${C.reset}
  npx aldc <command> [options]

${C.cyan}Commands:${C.reset}
  install     Install ALDC toolkit into current project
  validate    Verify installation is complete
  --help      Show this help

${C.cyan}Options:${C.reset}
  --profile <name>    bc28 (default for new installs) or bc29-native (Copilot Chat)
  --target-dir <dir>  Installation directory (default: .github)
  --yes, -y           Skip confirmation prompts
  --force, -f         Replace reviewed collisions with backup
  --dry-run          Preview all file actions without writes

${C.cyan}Examples:${C.reset}
  ${C.green}# Install to default .github/ directory${C.reset}
  npx aldc install

  ${C.green}# Install to custom directory, non-interactive${C.reset}
  npx aldc install --target-dir .copilot --yes

  ${C.green}# Force-update all files${C.reset}
  npx aldc install --force --yes
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
  console.log('');

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
        console.log(out);
      } else {
        log('  Validator not found in installed output (tools/ not copied by default)', C.dim);
      }
    } catch (e) {
      err('Validator failed:');
      console.log(e.stdout || e.message);
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
  console.log('');
  info(`Test output preserved at: ${tmpProject}`);
  log('Delete manually when done: rm -rf "' + tmpBase + '"', C.dim);
  console.log('');

  process.chdir(origCwd);
}

// ─── Main ──────────────────────────────────────────────────────────────────
const opts = parseArgs(process.argv);

switch (opts.command) {
  case 'help':
    showHelp();
    break;
  case 'rollback':
    try { console.log(require('./install-transaction').rollback(process.cwd(), 'chat')); }
    catch (e) { err(e.message); process.exitCode = 1; }
    break;
  case 'verify-install':
    try {
      const changed = require('./install-transaction').drift(process.cwd(), 'chat');
      console.log(changed.length ? 'Drift: ' + changed.join(', ') : 'Managed files match installation receipt; host loading remains unverified.');
      if (changed.length) process.exitCode = 1;
    } catch (e) { err(e.message); process.exitCode = 1; }
    break;
  case 'validate':
    validate(opts).catch((e) => { err(e.message); process.exit(1); });
    break;
  case 'test-local':
    testLocal().catch((e) => { err(e.message); process.exit(1); });
    break;
  case 'install':
  default:
    install(opts).catch((e) => { err(e.message); process.exit(1); });
    break;
}
