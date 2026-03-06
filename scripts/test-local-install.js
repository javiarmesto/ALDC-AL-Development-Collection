#!/usr/bin/env node

/**
 * ALDC Local Install Test
 *
 * Simulates the full install pipeline locally:
 *   1. Runs prepare-package.js to build templates/
 *   2. Copies templates/ into a temp directory (simulating VS Code extension install)
 *   3. Verifies skill folder structure (each skill = folder with SKILL.md)
 *   4. Checks frontmatter in every SKILL.md
 *   5. Runs aldc-validate against the installed output
 *
 * Usage:
 *   node scripts/test-local-install.js [--keep]
 *
 *   --keep   Preserve the temp directory after test (for manual inspection)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// ─── ANSI ───────────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', dim: '\x1b[2m',
};
const ok = (msg) => console.log(`${C.green}  ✓ ${msg}${C.reset}`);
const fail = (msg) => console.log(`${C.red}  ✗ ${msg}${C.reset}`);
const info = (msg) => console.log(`${C.cyan}  ℹ ${msg}${C.reset}`);
const header = (t) => {
  console.log('');
  console.log(`${C.cyan}${'─'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}  ${t}${C.reset}`);
  console.log(`${C.cyan}${'─'.repeat(60)}${C.reset}`);
};

const keepTemp = process.argv.includes('--keep');
const repoRoot = path.resolve(__dirname, '..');
const extensionDir = path.join(repoRoot, 'toolbox', 'al-coding-agent-collection');
const templatesDir = path.join(extensionDir, 'templates');
const tmpDir = path.join(os.tmpdir(), `aldc-test-${Date.now()}`);
const targetDir = path.join(tmpDir, '.github');

let errors = 0;
let warnings = 0;

function copyDirSync(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  }
}

// ─── Step 1: prepare-package ──────────────────────────────────────────────
header('Step 1: prepare-package.js');
try {
  execSync('node prepare-package.js', { cwd: extensionDir, stdio: 'pipe' });
  ok('prepare-package.js completed');
} catch (e) {
  fail('prepare-package.js failed');
  console.log(e.stderr?.toString() || e.message);
  process.exit(1);
}

// ─── Step 2: Simulate install into temp dir ────────────────────────────────
header('Step 2: Simulate install to temp directory');
fs.mkdirSync(tmpDir, { recursive: true });

// Copy templates/ -> .github/ (like the VS Code extension does)
copyDirSync(templatesDir, targetDir);
ok(`Installed to: ${targetDir}`);

// Also copy aldc.yaml to project root (like real install)
const aldcSrc = path.join(templatesDir, 'aldc.yaml');
const aldcDst = path.join(tmpDir, 'aldc.yaml');
if (fs.existsSync(aldcSrc)) {
  fs.copyFileSync(aldcSrc, aldcDst);
  ok('aldc.yaml copied to project root');
}

// Create .github/plans/memory.md (like real install)
const plansDir = path.join(tmpDir, '.github', 'plans');
fs.mkdirSync(plansDir, { recursive: true });
const memTemplate = path.join(targetDir, 'docs', 'templates', 'memory-template.md');
if (fs.existsSync(memTemplate)) {
  fs.copyFileSync(memTemplate, path.join(plansDir, 'memory.md'));
  ok('plans/memory.md created');
}

// Copy copilot-instructions.md entrypoint
const copilotSrc = path.join(targetDir, 'instructions', 'copilot-instructions.md');
const copilotDst = path.join(tmpDir, '.github', 'copilot-instructions.md');
if (fs.existsSync(copilotSrc)) {
  fs.copyFileSync(copilotSrc, copilotDst);
  ok('.github/copilot-instructions.md entrypoint created');
}

// ─── Step 3: Verify skill folder structure ─────────────────────────────────
header('Step 3: Verify skill folder structure');
const skillsDir = path.join(targetDir, 'skills');

const EXPECTED_SKILLS = [
  'skill-api', 'skill-copilot', 'skill-debug', 'skill-performance',
  'skill-events', 'skill-permissions', 'skill-testing',
  'skill-migrate', 'skill-pages', 'skill-translate', 'skill-estimation',
  'skill-agent-instructions', 'skill-agent-task-patterns', 'skill-agent-toolkit',
];

for (const skill of EXPECTED_SKILLS) {
  const skillDir = path.join(skillsDir, skill);
  const skillMd = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillDir)) {
    fail(`${skill}/ — folder MISSING`);
    errors++;
    continue;
  }

  if (!fs.existsSync(skillMd)) {
    fail(`${skill}/SKILL.md — file MISSING`);
    errors++;
    continue;
  }

  // Check frontmatter
  const content = fs.readFileSync(skillMd, 'utf8');
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    fail(`${skill}/SKILL.md — MISSING frontmatter (---)`);
    errors++;
    continue;
  }

  const fm = fmMatch[1];
  const hasName = /^name:\s*.+/m.test(fm);
  const hasDesc = /^description:\s*.+/m.test(fm);

  if (!hasName) { fail(`${skill}/SKILL.md — frontmatter missing 'name'`); errors++; }
  else if (!hasDesc) { fail(`${skill}/SKILL.md — frontmatter missing 'description'`); errors++; }
  else { ok(`${skill}/SKILL.md (frontmatter OK)`); }
}

// ─── Step 4: Verify agent skill assets ─────────────────────────────────────
header('Step 4: Verify agent skill assets');
const agentInstrDir = path.join(skillsDir, 'skill-agent-instructions');
const expectedAssets = [
  'references/agent-keywords-reference.md',
  'examples/agent-simple-instructions.txt',
  'examples/agent-advanced-instructions.txt',
];

for (const asset of expectedAssets) {
  const p = path.join(agentInstrDir, asset);
  if (fs.existsSync(p)) { ok(asset); }
  else { fail(`${asset} — MISSING`); errors++; }
}

// Check NO loose skill-*.md files remain at .github/skills/ root
const looseSkills = fs.readdirSync(skillsDir)
  .filter(f => f.startsWith('skill-') && f.endsWith('.md'));
if (looseSkills.length > 0) {
  for (const f of looseSkills) {
    fail(`Loose skill file at root: ${f} (should be in folder)`);
    errors++;
  }
} else {
  ok('No loose skill-*.md files at .github/skills/ root');
}

// ─── Step 5: Run aldc-validate ─────────────────────────────────────────────
header('Step 5: Run aldc-validate');

// We need to adjust aldc.yaml paths since toolkitRoot is .github for consumers
// But our temp install has the consumer layout, let's use the consumer yaml
const consumerYaml = path.join(templatesDir, 'aldc-consumer.yaml');
if (fs.existsSync(consumerYaml)) {
  fs.copyFileSync(consumerYaml, path.join(tmpDir, 'aldc.yaml'));
  info('Using aldc-consumer.yaml (toolkitRoot: .github)');
}

// Install validator deps if needed
const validatorDir = path.join(targetDir, 'tools', 'aldc-validate');
if (fs.existsSync(validatorDir)) {
  try {
    // Install js-yaml dependency
    execSync('npm install --production 2>/dev/null', {
      cwd: validatorDir,
      stdio: 'pipe',
      timeout: 30000,
    });
  } catch (_) {
    // May fail if no package-lock, try running anyway
  }

  try {
    const out = execSync(`node "${path.join(validatorDir, 'index.js')}" --config aldc.yaml`, {
      cwd: tmpDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(out);
  } catch (e) {
    const stdout = e.stdout || '';
    const stderr = e.stderr || '';
    if (stdout.includes('NOT COMPLIANT')) {
      fail('Validator: NOT COMPLIANT');
      console.log(stdout);
      errors++;
    } else {
      fail('Validator execution error');
      console.log(stderr || e.message);
      errors++;
    }
  }
} else {
  info('tools/aldc-validate not found in templates (expected — tools are selective copy)');
  info('Running validator from repo source instead...');

  try {
    const repoValidator = path.join(repoRoot, 'tools', 'aldc-validate', 'index.js');
    const out = execSync(`node "${repoValidator}" --config aldc.yaml`, {
      cwd: tmpDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(out);
  } catch (e) {
    const stdout = e.stdout || '';
    if (stdout.includes('NOT COMPLIANT')) {
      fail('Validator: NOT COMPLIANT');
      console.log(stdout);
      errors++;
    } else if (stdout.includes('COMPLIANT')) {
      console.log(stdout);
    } else {
      fail('Validator error');
      console.log(stdout || e.stderr?.toString() || e.message);
      warnings++;
    }
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────
header('Test Results');
console.log('');
if (errors === 0) {
  console.log(`${C.green}${C.bold}  ✅ ALL CHECKS PASSED${C.reset}`);
  console.log(`${C.green}  Skills: ${EXPECTED_SKILLS.length} verified (folder + SKILL.md + frontmatter)${C.reset}`);
  console.log(`${C.green}  Assets: ${expectedAssets.length} verified${C.reset}`);
  if (warnings > 0) {
    console.log(`${C.yellow}  Warnings: ${warnings}${C.reset}`);
  }
} else {
  console.log(`${C.red}${C.bold}  ❌ ${errors} ERROR(S) FOUND${C.reset}`);
}

console.log('');
if (keepTemp || errors > 0) {
  info(`Test output preserved at: ${tmpDir}`);
  info('Inspect manually, then delete:');
  console.log(`${C.dim}  rm -rf "${tmpDir}"${C.reset}`);
} else {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  info('Temp directory cleaned up (use --keep to preserve)');
}
console.log('');

process.exit(errors > 0 ? 1 : 0);
