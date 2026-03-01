#!/usr/bin/env node

/**
 * AL Development Collection - Installation Script
 * 
 * Installs the AL Development toolkit into a user's project by copying
 * agents, instructions, and prompts to .github/copilot/ directory.
 * 
 * Usage:
 *   npm install al-development-collection
 *   npx al-collection install [target-directory]
 * 
 * Or interactively:
 *   npx al-collection install
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Log formatted message
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Log section header
 */
function header(message) {
  console.log('');
  log('═'.repeat(60), 'cyan');
  log(message, 'bright');
  log('═'.repeat(60), 'cyan');
  console.log('');
}

/**
 * Copy directory recursively with merge support
 * Does not overwrite existing files, only adds new ones
 * Excludes npm-related files and directories
 */
function copyDirectory(source, destination, merge = false) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);
  let copiedCount = 0;
  let skippedCount = 0;

  // Files and directories to exclude from copying
  const excludeList = [
    'node_modules',
    'package.json',
    'package-lock.json',
    '.git',
    '.gitignore',
    '.npmignore',
    'validate-al-collection.js',
    'install.js'
  ];

  items.forEach(item => {
    // Skip excluded items
    if (excludeList.includes(item)) {
      return;
    }

    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      const result = copyDirectory(sourcePath, destPath, merge);
      copiedCount += result.copied;
      skippedCount += result.skipped;
    } else {
      // Check if file exists when merging
      if (merge && fs.existsSync(destPath)) {
        log(`  ⊘ ${item} (already exists, skipped)`, 'yellow');
        skippedCount++;
      } else {
        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
        log(`  ✓ ${item}`, 'green');
      }
    }
  });

  return { copied: copiedCount, skipped: skippedCount };
}

/**
 * Create quick start guide
 */
function createQuickStartGuide(targetDir) {
  const quickStartContent = `# 🚀 AL Development Collection - Quick Start

You've successfully installed the AL Development Collection!

## What's Installed

The following directories have been copied to \`.github/\`:

- **agents/** - 7 role-based strategic agents + 4 orchestra subagents with MCP tool boundaries
- **instructions/** - 9 auto-applied coding guidelines
- **prompts/** - 18 agentic workflows for common tasks
- **collections/** - Collection manifest for validation
- **getting-started.md** - This guide

## Quick Start Guide

### 1. Understanding the Structure

**Instructions** (Auto-applied):
- Automatically activate based on file patterns (\`applyTo\`)
- Enforce coding standards, naming conventions, and best practices
- No manual invocation needed

**Prompts** (Manual workflows):
- Invoke with: \`@workspace use [prompt-name]\`
- Example: \`@workspace use al-initialize\` (setup new project)
- Example: \`@workspace use al-diagnose\` (debug issues)

**Agents** (Strategic modes):
- Switch with: \`Use [agent-name] mode\`
- Example: \`Use al-architect mode\` (design solutions)
- Example: \`Use al-debugger mode\` (diagnose problems)

### 2. Essential First Steps

**Start here for new features:**
\`\`\`
Use al-architect mode
\`\`\`
Then describe what you want to accomplish. The architect will design your solution.

**Common workflows:**
- **New project setup**: \`@workspace use al-initialize\`
- **Debug runtime issue**: \`@workspace use al-diagnose\`
- **Build & deploy**: \`@workspace use al-build\`
- **Performance analysis**: \`@workspace use al-performance\`

### 3. Key Agents

- **al-architect** - Solution design and architecture (START HERE)
- **al-developer** - Tactical implementation with build tools
- **al-debugger** - Systematic debugging and diagnosis
- **al-tester** - Test strategy and TDD
- **al-api** - API design and implementation
- **al-copilot** - AI-powered features design

**Orchestra System** (Multi-agent TDD for MEDIUM/HIGH complexity):
- **al-conductor** - Main orchestration agent (use: \`Use al-conductor mode\`)
- **al-planning-subagent** - AL-aware research specialist
- **al-implement-subagent** - TDD-focused implementation
- **al-review-subagent** - Code review validation

### 4. Auto-Applied Guidelines

These activate automatically based on file type:
- **al-guidelines** - Master hub referencing all patterns
- **al-code-style** - 2-space indent, PascalCase, feature folders
- **al-naming-conventions** - 26-char limits, descriptive names
- **al-performance** - SetLoadFields, early filtering, temp tables
- **al-error-handling** - TryFunctions, error labels (context-activated)
- **al-events** - Event subscribers, integration events (context-activated)
- **al-testing** - AL-Go structure, test patterns
- **copilot-instructions** - Master coordination document
- **index** - Complete instructions catalog

### 5. Complete Workflow List

**Project Setup:**
- \`al-initialize\` - Environment setup (VS Code, extensions, symbols)

**Development:**
- \`al-events\` - Event-driven development patterns
- \`al-pages\` - Page development with Page Designer
- \`al-permissions\` - Permission set generation

**Quality & Testing:**
- \`al-build\` - Build, package, publish
- \`al-diagnose\` - Debug runtime issues
- \`al-performance\` - Deep profiling with CPU profiles
- \`al-performance.triage\` - Quick static analysis

**AI Features:**
- \`al-copilot-capability\` - Register Copilot capability
- \`al-copilot-promptdialog\` - Create PromptDialog pages
- \`al-copilot-test\` - Test Copilot features
- \`al-copilot-generate\` - Generate AI feature code

**Collaboration & Documentation:**
- \`al-spec.create\` - Generate technical specifications
- \`al-pr-prepare\` - Prepare pull request descriptions
- \`al-context.create\` - Generate project context.md for AI assistants
- \`al-memory.create\` - Generate/update session memory.md
- \`al-translate\` - XLF translation workflows
- \`al-migrate\` - Migration assistance

### 6. Best Practices

**Event-Driven Development:**
AL extensions cannot modify base objects. Use:
- Table Extensions to add fields
- Page Extensions to add UI elements
- Event Subscribers to react to base app events
- Integration Events for extensibility

**Feature-Based Organization:**
Organize by business capability, not object type:
\`\`\`
src/
├── CustomerManagement/
│   ├── Data/
│   ├── Processing/
│   └── UI/
└── SalesWorkflow/
\`\`\`

**Performance Patterns:**
- Use early filtering (SetRange before FindSet)
- Load only needed fields (SetLoadFields)
- Use temporary tables for intermediate processing

### 7. Getting Help

**Within the collection:**
- Check \`agents/index.md\` for complete agent guide
- Check \`prompts/index.md\` for workflow descriptions
- Check \`instructions/index.md\` for coding guidelines

**Online resources:**
- GitHub: https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot
- Issues: https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot/issues
- Documentation: https://javiarmesto.github.io/AL-Development-Collection-for-GitHub-Copilot/

### 8. Validation

To validate your setup works correctly:
1. Open any \`.al\` file - instructions should auto-apply
2. Try: \`@workspace use al-initialize\` - should execute
3. Try: \`Use al-architect mode\` - should switch context

### 9. Updates

To update to the latest version:
\`\`\`bash
npm update al-development-collection
npx al-collection install
\`\`\`

This will overwrite files in \`.github/copilot/\`.

---

## Next Steps

1. **Start with the architect**: \`Use al-architect mode\` and describe your feature
2. **Initialize a project**: \`@workspace use al-initialize\` to set up your environment
3. **Explore the collection**: Browse the files in \`.github/copilot/\` to understand what's available

**Happy coding with AL Development Collection! 🚀**

---

*Version: ${require('../package.json').version}*
*Framework: AI Native-Instructions Architecture (3 layers)*
*Total Primitives: 38 (9 instructions + 18 workflows + 7 agents + 4 orchestra)*
`;

  const destPath = path.join(targetDir, 'getting-started.md');
  fs.writeFileSync(destPath, quickStartContent, 'utf8');
  log(`  ✓ getting-started.md`, 'green');
}

/**
 * Detect if current directory is an AL project
 */
function isALProject(directory) {
  const appJsonPath = path.join(directory, 'app.json');
  return fs.existsSync(appJsonPath);
}

/**
 * Find AL projects in directory tree
 */
function findALProjects(startDir, maxDepth = 2) {
  const projects = [];
  
  function search(dir, depth) {
    if (depth > maxDepth) return;
    
    try {
      const items = fs.readdirSync(dir);
      
      // Check if this directory is an AL project
      if (items.includes('app.json')) {
        projects.push(dir);
        return; // Don't search subdirectories of AL projects
      }
      
      // Search subdirectories
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            search(fullPath, depth + 1);
          }
        } catch (err) {
          // Skip directories we can't access
        }
      });
    } catch (err) {
      // Skip directories we can't read
    }
  }
  
  search(startDir, 0);
  return projects;
}

/**
 * Get target directory from user or command line
 */
async function getTargetDirectory() {
  const args = process.argv.slice(2);
  
  // Check if directory provided as argument
  if (args.length > 1 && args[0] === 'install') {
    return path.resolve(process.cwd(), args[1]);
  }

  // Auto-detect AL projects
  const currentDir = process.cwd();
  const isCurrentAL = isALProject(currentDir);
  
  if (isCurrentAL) {
    log(`\n✓ AL project detected in current directory!`, 'green');
    const defaultPath = path.join(currentDir, '.github');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(
        `${colors.cyan}Install to ${defaultPath}? (Y/n): ${colors.reset}`,
        (answer) => {
          rl.close();
          if (!answer || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            resolve(defaultPath);
          } else {
            resolve(getTargetDirectoryInteractive());
          }
        }
      );
    });
  }
  
  // Search for AL projects nearby
  log(`\n🔍 Searching for AL projects...`, 'cyan');
  const foundProjects = findALProjects(currentDir);
  
  if (foundProjects.length > 0) {
    log(`\n✓ Found ${foundProjects.length} AL project(s):`, 'green');
    foundProjects.forEach((proj, idx) => {
      log(`  ${idx + 1}. ${proj}`, 'blue');
    });
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(
        `${colors.cyan}\nSelect project number (1-${foundProjects.length}) or Enter for manual path: ${colors.reset}`,
        (answer) => {
          rl.close();
          const selection = parseInt(answer);
          if (selection >= 1 && selection <= foundProjects.length) {
            resolve(path.join(foundProjects[selection - 1], '.github'));
          } else {
            resolve(getTargetDirectoryInteractive());
          }
        }
      );
    });
  }

  // No AL projects found, interactive mode
  return getTargetDirectoryInteractive();
}

/**
 * Get target directory interactively
 */
async function getTargetDirectoryInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    const defaultPath = path.join(process.cwd(), '.github');
    
    rl.question(
      `${colors.cyan}Install location (default: ${defaultPath}): ${colors.reset}`,
      (answer) => {
        rl.close();
        resolve(answer.trim() || defaultPath);
      }
    );
  });
}

/**
 * Check if target directory exists and determine merge mode
 */
async function checkMergeMode(targetDir) {
  // Check if .github exists
  if (!fs.existsSync(targetDir)) {
    return { merge: false, reason: 'new' };
  }

  // Check if any of our directories exist
  const agentsPath = path.join(targetDir, 'agents');
  const instructionsPath = path.join(targetDir, 'instructions');
  const promptsPath = path.join(targetDir, 'prompts');

  const existingDirs = [];
  if (fs.existsSync(agentsPath)) existingDirs.push('agents/');
  if (fs.existsSync(instructionsPath)) existingDirs.push('instructions/');
  if (fs.existsSync(promptsPath)) existingDirs.push('prompts/');

  if (existingDirs.length === 0) {
    return { merge: false, reason: 'empty' };
  }

  // Some directories exist, need to merge
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    log(`\n⚠️  Found existing directories: ${existingDirs.join(', ')}`, 'yellow');
    log('Existing files will be preserved. Only new files will be added.', 'cyan');
    rl.question(
      `${colors.cyan}Continue with merge? (Y/n): ${colors.reset}`,
      (answer) => {
        rl.close();
        const proceed = !answer || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
        resolve({ 
          merge: proceed, 
          reason: proceed ? 'merge' : 'cancelled',
          existingDirs 
        });
      }
    );
  });
}

/**
 * Check if target directory exists and confirm overwrite
 * @deprecated Use checkMergeMode instead
 */
async function confirmOverwrite(targetDir) {
  if (!fs.existsSync(targetDir)) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    log(`\n⚠️  Directory ${targetDir} already exists.`, 'yellow');
    rl.question(
      `${colors.yellow}Overwrite existing files? (y/N): ${colors.reset}`,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      }
    );
  });
}

/**
 * Main installation function
 */
async function install() {
  header('🚀 AL Development Collection - Installer');

  log('This will install the AL Development toolkit into your project.', 'cyan');
  log('The following will be copied to .github/:', 'cyan');
  log('  • agents/      - 7 strategic agents + 4 orchestra subagents', 'blue');
  log('  • instructions/ - 9 auto-applied guidelines', 'blue');
  log('  • prompts/     - 18 agentic workflows', 'blue');
  log('  • collections/ - Collection manifest', 'blue');
  log('  • getting-started.md - Quick start guide', 'blue');

  // Get target directory
  const targetDir = await getTargetDirectory();
  log(`\n📁 Target directory: ${targetDir}`, 'cyan');

  // Check merge mode and confirm
  const mergeMode = await checkMergeMode(targetDir);
  
  if (!mergeMode.merge && mergeMode.reason === 'cancelled') {
    log('\n❌ Installation cancelled.', 'red');
    process.exit(0);
  }

  // Create .github directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    log(`\n✓ Created directory: ${targetDir}`, 'green');
  }

  // Get source directory (package root, one level up from scripts/)
  const packageDir = path.join(__dirname, '..');
  let totalCopied = 0;
  let totalSkipped = 0;

  const isMerge = mergeMode.reason === 'merge';
  
  if (isMerge) {
    log('\n📦 Merge mode: Preserving existing files, adding new ones only', 'cyan');
  }

  // Copy agents
  header('📋 Installing Agents');
  const agentsSource = path.join(packageDir, 'agents');
  const agentsDest = path.join(targetDir, 'agents');
  const agentsResult = copyDirectory(agentsSource, agentsDest, isMerge);
  totalCopied += agentsResult.copied;
  totalSkipped += agentsResult.skipped;

  // Copy instructions
  header('📋 Installing Instructions');
  const instructionsSource = path.join(packageDir, 'instructions');
  const instructionsDest = path.join(targetDir, 'instructions');
  const instructionsResult = copyDirectory(instructionsSource, instructionsDest, isMerge);
  totalCopied += instructionsResult.copied;
  totalSkipped += instructionsResult.skipped;

  // Copy prompts
  header('📋 Installing Prompts');
  const promptsSource = path.join(packageDir, 'prompts');
  const promptsDest = path.join(targetDir, 'prompts');
  const promptsResult = copyDirectory(promptsSource, promptsDest, isMerge);
  totalCopied += promptsResult.copied;
  totalSkipped += promptsResult.skipped;

  // Copy collections
  header('📋 Installing Collections');
  const collectionsSource = path.join(packageDir, 'collections');
  const collectionsDest = path.join(targetDir, 'collections');
  if (fs.existsSync(collectionsSource)) {
    const collectionsResult = copyDirectory(collectionsSource, collectionsDest, isMerge);
    totalCopied += collectionsResult.copied;
    totalSkipped += collectionsResult.skipped;
  } else {
    log('  ⊘ collections directory not found (optional)', 'yellow');
  }

  // Create/update quick start guide
  header('📋 Creating Quick Start Guide');
  const quickStartPath = path.join(targetDir, 'getting-started.md');
  if (isMerge && fs.existsSync(quickStartPath)) {
    log(`  ⊘ getting-started.md (already exists, skipped)`, 'yellow');
    totalSkipped++;
  } else {
    createQuickStartGuide(targetDir);
    totalCopied++;
  }

  // Success summary
  header('✅ Installation Complete!');
  log(`Files copied: ${totalCopied}`, 'green');
  if (totalSkipped > 0) {
    log(`Files skipped (already exist): ${totalSkipped}`, 'yellow');
  }
  log(`Installation directory: ${targetDir}`, 'cyan');
  
  console.log('');
  log('🎯 Next Steps:', 'bright');
  log('  1. Open VS Code in your AL project', 'blue');
  log(`  2. Read: ${path.join(targetDir, 'getting-started.md')}`, 'blue');
  log('  3. Try: Use al-architect mode', 'blue');
  log('  4. Or try: @workspace use al-initialize', 'blue');
  
  console.log('');
  log('📚 Documentation:', 'bright');
  log('  GitHub: https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot', 'blue');
  log('  Docs: https://javiarmesto.github.io/AL-Development-Collection-for-GitHub-Copilot/', 'blue');
  
  console.log('');
  if (isMerge) {
    log('💡 Tip: Existing files were preserved. Check skipped files for updates.', 'cyan');
    console.log('');
  }
  log('Happy coding! 🚀', 'green');
  console.log('');
}

/**
 * Update existing installation
 */
async function updateToolkit() {
  header('🔄 AL Development Collection - Update');

  log('This will update your existing installation.', 'cyan');
  log('Existing files will be preserved. Only new files will be added.', 'cyan');

  // Find existing installation
  const currentDir = process.cwd();
  const possiblePaths = [
    path.join(currentDir, '.github'),
    path.join(currentDir, '.github', 'copilot')
  ];

  let existingPath = null;
  for (const testPath of possiblePaths) {
    const agentsPath = path.join(testPath, 'agents');
    if (fs.existsSync(agentsPath)) {
      existingPath = testPath;
      break;
    }
  }

  if (!existingPath) {
    log('\n⚠️  No existing installation found.', 'yellow');
    log('Use "install" command instead.', 'cyan');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(
        `${colors.cyan}Run install command now? (Y/n): ${colors.reset}`,
        async (answer) => {
          rl.close();
          if (!answer || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            await install();
          }
          resolve();
        }
      );
    });
  }

  log(`\n✓ Found installation at: ${existingPath}`, 'green');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(
      `${colors.cyan}Update this installation? (Y/n): ${colors.reset}`,
      async (answer) => {
        rl.close();
        if (!answer || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          // Use install with merge mode
          process.argv = ['node', 'install.js', 'install', existingPath];
          await install();
        }
        resolve();
      }
    );
  });
}

/**
 * Validate existing installation
 */
async function validateInstallation() {
  header('✓ AL Development Collection - Validation');

  // Find installation
  const currentDir = process.cwd();
  const possiblePaths = [
    path.join(currentDir, '.github'),
    path.join(currentDir, '.github', 'copilot')
  ];

  let installPath = null;
  for (const testPath of possiblePaths) {
    const agentsPath = path.join(testPath, 'agents');
    if (fs.existsSync(agentsPath)) {
      installPath = testPath;
      break;
    }
  }

  if (!installPath) {
    log('\n❌ No installation found in .github/', 'red');
    log('Run "npx al-collection install" first.', 'cyan');
    return;
  }

  log(`\n📁 Checking installation at: ${installPath}`, 'cyan');
  
  // Check required directories
  const requiredDirs = [
    { name: 'agents', desc: 'Agent modes' },
    { name: 'instructions', desc: 'Instruction files' },
    { name: 'prompts', desc: 'Workflow prompts' }
  ];

  let allValid = true;
  let totalFiles = 0;

  for (const dir of requiredDirs) {
    const dirPath = path.join(installPath, dir.name);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      totalFiles += files.length;
      log(`  ✓ ${dir.name}/ (${files.length} files) - ${dir.desc}`, 'green');
    } else {
      log(`  ✗ ${dir.name}/ - Missing!`, 'red');
      allValid = false;
    }
  }

  // Check getting-started.md
  const gettingStartedPath = path.join(installPath, 'getting-started.md');
  if (fs.existsSync(gettingStartedPath)) {
    log(`  ✓ getting-started.md`, 'green');
  } else {
    log(`  ⚠ getting-started.md - Missing (optional)`, 'yellow');
  }

  console.log('');
  if (allValid) {
    log('═'.repeat(60), 'green');
    log(`✅ Installation is valid! (${totalFiles} files found)`, 'green');
    log('═'.repeat(60), 'green');
    console.log('');
    log('🚀 Next steps:', 'bright');
    log('  1. Open any .al file in VS Code', 'blue');
    log('  2. Try: Use al-architect mode', 'blue');
    log('  3. Or: @workspace use al-initialize', 'blue');
  } else {
    log('═'.repeat(60), 'red');
    log('❌ Installation is incomplete!', 'red');
    log('═'.repeat(60), 'red');
    console.log('');
    log('Run "npx al-collection update" to fix.', 'cyan');
  }
  console.log('');
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colors.bright}AL Development Collection - CLI${colors.reset}

${colors.cyan}Usage:${colors.reset}
  npx al-collection <command> [options]

${colors.cyan}Commands:${colors.reset}
  install [path]      Install toolkit to specified path (default: .github)
  update              Update existing installation (preserves files)
  validate            Verify installation is complete and valid
  --help, -h          Show this help message

${colors.cyan}Examples:${colors.reset}
  ${colors.green}# Interactive installation (auto-detects AL projects)${colors.reset}
  npx al-collection install

  ${colors.green}# Install to specific path${colors.reset}
  npx al-collection install .github

  ${colors.green}# Update existing installation${colors.reset}
  npx al-collection update

  ${colors.green}# Validate installation${colors.reset}
  npx al-collection validate

${colors.cyan}Features:${colors.reset}
  ✓ Auto-detects AL projects (searches for app.json)
  ✓ Interactive project selection if multiple found
  ✓ Merge mode preserves existing files
  ✓ Validation ensures complete installation

${colors.cyan}What gets installed:${colors.reset}
  • agents/           - 7 strategic agents + 4 orchestra subagents
  • instructions/     - 9 auto-applied coding guidelines  
  • prompts/          - 18 agentic workflows
  • collections/      - Collection manifest (optional)
  • getting-started.md - Quick start documentation

${colors.cyan}Merge behavior:${colors.reset}
  When updating or installing to existing location:
  - Preserves all existing files (no overwriting)
  - Only adds new files from the collection
  - Shows summary of copied vs skipped files

${colors.cyan}More info:${colors.reset}
  GitHub: https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot
  Docs: https://javiarmesto.github.io/AL-Development-Collection-for-GitHub-Copilot/
`);
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
} else if (!command || command === 'install') {
  install().catch(err => {
    log(`\n❌ Installation failed: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  });
} else if (command === 'update') {
  updateToolkit().catch(err => {
    log(`\n❌ Update failed: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  });
} else if (command === 'validate') {
  validateInstallation().catch(err => {
    log(`\n❌ Validation failed: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  });
} else {
  log(`\n❌ Unknown command: ${command}`, 'red');
  log('Use --help for usage information.', 'cyan');
  process.exit(1);
}
