#!/usr/bin/env node

/**
 * ALDC Core v1.1 — Local Installer
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
const skip = (msg) => log(`  - ${msg} (exists, skipped)`, C.yellow);
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
  console.log(`${C.cyan}    ║${C.reset}      ${C.green}Core v1.1${C.reset} ${C.dim}— Skills-based AI-native toolkit${C.reset}     ${C.cyan}║${C.reset}`);
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
    // withPacks removed — bc-agents components are now regular optional content
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--target-dir' && args[i + 1]) {
      parsed.targetDir = args[++i];
    } else if (a === '--yes' || a === '-y') {
      parsed.yes = true;
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
 * Copy a directory recursively.
 * @param {string} src  Source directory
 * @param {string} dst  Destination directory
 * @param {boolean} force  Overwrite existing files
 * @returns {{ copied: number, skipped: number }}
 */
function copyDir(src, dst, force = false, depth = 0) {
  if (!fs.existsSync(src)) return { copied: 0, skipped: 0 };
  ensureDir(dst);

  let copied = 0;
  let skipped = 0;

  const ALWAYS_EXCLUDE = new Set(['node_modules', 'package-lock.json', '.git', '.gitignore', '.npmignore']);
  const ROOT_EXCLUDE = new Set(['install.js', 'validate-al-collection.js']);

  for (const item of fs.readdirSync(src)) {
    if (ALWAYS_EXCLUDE.has(item)) continue;
    if (depth === 0 && ROOT_EXCLUDE.has(item)) continue;

    const srcPath = path.join(src, item);
    const dstPath = path.join(dst, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      const r = copyDir(srcPath, dstPath, force, depth + 1);
      copied += r.copied;
      skipped += r.skipped;
    } else if (force || !fs.existsSync(dstPath)) {
      fs.copyFileSync(srcPath, dstPath);
      ok(path.relative(dst, dstPath) || item);
      copied++;
    } else {
      skip(path.relative(dst, dstPath) || item);
      skipped++;
    }
  }

  return { copied, skipped };
}

/**
 * Copy a single file. Returns true if copied.
 */
function copyFile(src, dst, force = false) {
  if (!fs.existsSync(src)) {
    err(`Source not found: ${src}`);
    return false;
  }
  if (!force && fs.existsSync(dst)) {
    skip(path.basename(dst));
    return false;
  }
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
  ok(path.basename(dst));
  return true;
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

// ─── ALDC Core v1.1 component map ──────────────────────────────────────────
const COMPONENTS = [
  { name: 'Agents',      src: 'agents',             count: '5 agents (4 public + 1 optional) + 3 subagents' },
  { name: 'Skills',      src: 'skills',             count: '14 skills (7 required + 4 recommended + 3 optional)' },
  { name: 'Prompts',     src: 'prompts',            count: '10 workflows (6 core + 4 agent-builder)' },
  { name: 'Instructions',src: 'instructions',       count: '10 auto-applied' },
  { name: 'Templates',   src: 'docs/templates',     count: '7 contract templates' },
  { name: 'Framework',   src: 'docs/framework',     count: 'spec + docs' },
  { name: 'Validator',   src: 'tools/aldc-validate', count: 'compliance checker' },
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

  banner();
  header('ALDC Core v1.1 — Installer');

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
      log('Merge mode: existing files will be preserved (use --force to overwrite).', C.dim);
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

  let totalCopied = 0;
  let totalSkipped = 0;

  // 1. Copy each component into target dir
  for (const comp of COMPONENTS) {
    header(`Installing ${comp.name} (${comp.count})`);
    const src = path.join(packageDir, comp.src);
    const dst = path.join(targetDir, comp.src);
    const r = copyDir(src, dst, opts.force);
    totalCopied += r.copied;
    totalSkipped += r.skipped;
  }

  // 2. Copy collections/ into target dir
  header('Installing Collections');
  const colSrc = path.join(packageDir, 'collections');
  if (fs.existsSync(colSrc)) {
    const r = copyDir(colSrc, path.join(targetDir, 'collections'), opts.force);
    totalCopied += r.copied;
    totalSkipped += r.skipped;
  } else {
    log('  collections/ not found (optional)', C.dim);
  }

  // 3. Copy aldc.yaml to project root and update toolkitRoot
  header('Installing Configuration');
  const aldcYamlDst = path.join(projectDir, 'aldc.yaml');
  if (copyFile(
    path.join(packageDir, 'aldc.yaml'),
    aldcYamlDst,
    opts.force
  )) {
    totalCopied++;
    // Update toolkitRoot to match the target directory relative to project root
    const relTarget = path.relative(projectDir, targetDir).replace(/\\/g, '/') || '.';
    if (relTarget !== '.') {
      let yamlContent = fs.readFileSync(aldcYamlDst, 'utf8');
      yamlContent = yamlContent.replace(/^toolkitRoot:\s*"\."/m, `toolkitRoot: "${relTarget}"`);
      fs.writeFileSync(aldcYamlDst, yamlContent, 'utf8');
      ok(`toolkitRoot updated to "${relTarget}"`);
    }
  } else { totalSkipped++; }

  // 4. Copy copilot-instructions.md entrypoint to .github/
  const copilotSrc = path.join(packageDir, 'instructions', 'copilot-instructions.md');
  const copilotDst = path.join(projectDir, '.github', 'copilot-instructions.md');
  if (copyFile(copilotSrc, copilotDst, opts.force)) {
    totalCopied++;
  } else {
    totalSkipped++;
  }

  // 5. Create .github/plans/ and memory.md from template
  header('Initializing Plans & Memory');
  const plansDir = path.join(projectDir, '.github', 'plans');
  ensureDir(plansDir);
  ok('plans/ directory');

  const memoryTemplate = path.join(packageDir, 'docs', 'templates', 'memory-template.md');
  const memoryDst = path.join(plansDir, 'memory.md');
  if (copyFile(memoryTemplate, memoryDst, false)) {
    totalCopied++;
  } else {
    totalSkipped++;
  }

  // 6. Install validator dependencies (js-yaml)
  const validatorDir = path.join(targetDir, 'tools', 'aldc-validate');
  if (fs.existsSync(path.join(validatorDir, 'package.json'))) {
    try {
      const { execSync } = require('child_process');
      execSync('npm install --production --silent', { cwd: validatorDir, stdio: 'ignore' });
      ok('Validator dependencies installed');
    } catch {
      log('  ! Could not install validator dependencies (run npm install in tools/aldc-validate/)', C.yellow);
    }
  }

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
  header('ALDC Core v1.1 — Validation');
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
${C.bold}ALDC Core v1.1 — CLI${C.reset}

${C.cyan}Usage:${C.reset}
  npx aldc <command> [options]

${C.cyan}Commands:${C.reset}
  install     Install ALDC toolkit into current project
  validate    Verify installation is complete
  --help      Show this help

${C.cyan}Options:${C.reset}
  --target-dir <dir>  Installation directory (default: .github)
  --yes, -y           Skip confirmation prompts
  --force, -f         Overwrite existing files

${C.cyan}Examples:${C.reset}
  ${C.green}# Install to default .github/ directory${C.reset}
  npx aldc install

  ${C.green}# Install to custom directory, non-interactive${C.reset}
  npx aldc install --target-dir .copilot --yes

  ${C.green}# Force-update all files${C.reset}
  npx aldc install --force --yes

  ${C.green}# Install from local .tgz${C.reset}
  npm install ./al-development-collection-3.2.0.tgz
  npx aldc install

  ${C.green}# Validate current installation${C.reset}
  npx aldc validate

${C.cyan}What gets installed:${C.reset}
  ${C.bold}Core:${C.reset}
  <target-dir>/
    agents/           5 agents (4 public + 1 optional) + 3 subagents
    skills/           14 skills (7 required + 4 recommended + 3 optional)
    prompts/          10 workflows (6 core + 4 agent-builder)
    instructions/     10 auto-applied guidelines
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
  header('ALDC Core v1.1 — Local Test');
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
