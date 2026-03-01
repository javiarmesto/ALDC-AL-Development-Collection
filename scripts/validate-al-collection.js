/**
 * Validation script for AL Development Collection
 * Validates collection manifest, file existence, and frontmatter compliance
 * 
 * Usage: node validate-al-collection.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Validation results
let errors = [];
let warnings = [];
let successes = [];

/**
 * Log message with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Add error
 */
function addError(message) {
  errors.push(message);
  log(`❌ ERROR: ${message}`, 'red');
}

/**
 * Add warning
 */
function addWarning(message) {
  warnings.push(message);
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

/**
 * Add success
 */
function addSuccess(message) {
  successes.push(message);
  log(`✅ ${message}`, 'green');
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Read YAML file
 */
function readYaml(filePath) {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents);
  } catch (e) {
    addError(`Failed to parse YAML file ${filePath}: ${e.message}`);
    return null;
  }
}

/**
 * Read markdown frontmatter
 */
function readFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Support both Unix (\n) and Windows (\r\n) line endings
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) {
      return null;
    }
    return yaml.load(match[1]);
  } catch (e) {
    addWarning(`Failed to parse frontmatter in ${filePath}: ${e.message}`);
    return null;
  }
}

/**
 * Validate collection manifest structure
 */
function validateCollectionManifest(manifest, manifestPath) {
  log('\n📋 Validating Collection Manifest...', 'cyan');
  
  // Required fields
  const requiredFields = ['id', 'name', 'description', 'items'];
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      addError(`Collection manifest missing required field: ${field}`);
    }
  });
  
  // Validate ID format (lowercase with hyphens)
  if (manifest.id && !/^[a-z0-9-]+$/.test(manifest.id)) {
    addError(`Collection ID must be lowercase with hyphens only: ${manifest.id}`);
  } else if (manifest.id) {
    addSuccess(`Collection ID is valid: ${manifest.id}`);
  }
  
  // Validate items array
  if (!Array.isArray(manifest.items)) {
    addError('Collection items must be an array');
  } else {
    addSuccess(`Collection has ${manifest.items.length} items`);
  }
  
  // Validate tags (if present)
  if (manifest.tags && !Array.isArray(manifest.tags)) {
    addError('Collection tags must be an array');
  } else if (manifest.tags) {
    addSuccess(`Collection has ${manifest.tags.length} tags`);
  }
  
  // Validate display settings
  if (manifest.display) {
    if (manifest.display.ordering && !['alpha', 'manual'].includes(manifest.display.ordering)) {
      addError(`Invalid display ordering: ${manifest.display.ordering} (must be 'alpha' or 'manual')`);
    }
    if (typeof manifest.display.show_badge !== 'undefined' && typeof manifest.display.show_badge !== 'boolean') {
      addError('Display show_badge must be a boolean');
    }
  }
}

/**
 * Validate collection items (file existence and frontmatter)
 */
function validateCollectionItems(manifest) {
  log('\n📁 Validating Collection Items...', 'cyan');
  
  const validKinds = ['instruction', 'prompt', 'agent'];
  const itemsByKind = {
    'instruction': 0,
    'prompt': 0,
    'agent': 0
  };
  
  manifest.items.forEach((item, index) => {
    const itemNum = index + 1;
    
    // Check required fields
    if (!item.path) {
      addError(`Item ${itemNum}: Missing required field 'path'`);
      return;
    }
    if (!item.kind) {
      addError(`Item ${itemNum}: Missing required field 'kind'`);
      return;
    }
    
    // Validate kind
    if (!validKinds.includes(item.kind)) {
      addError(`Item ${itemNum}: Invalid kind '${item.kind}' (must be one of: ${validKinds.join(', ')})`);
    } else {
      itemsByKind[item.kind]++;
    }
    
    // Check file existence
    if (!fileExists(item.path)) {
      addError(`Item ${itemNum}: File not found: ${item.path}`);
      return;
    }
    
    // Check file extension matches kind
    const ext = path.extname(item.path);
    const basename = path.basename(item.path, ext);
    
    switch (item.kind) {
      case 'instruction':
        if (!item.path.endsWith('.instructions.md')) {
          addWarning(`Item ${itemNum}: Instruction file should end with .instructions.md: ${item.path}`);
        }
        break;
      case 'prompt':
        if (!item.path.endsWith('.prompt.md')) {
          addWarning(`Item ${itemNum}: Prompt file should end with .prompt.md: ${item.path}`);
        }
        break;
      case 'agent':
        if (!item.path.endsWith('.agent.md')) {
          addWarning(`Item ${itemNum}: Agent file should end with .agent.md: ${item.path}`);
        }
        break;
    }
    
    // Validate frontmatter
    const frontmatter = readFrontmatter(item.path);
    if (!frontmatter) {
      addWarning(`Item ${itemNum}: No frontmatter found in ${item.path}`);
    } else {
      // Check for description
      if (!frontmatter.description) {
        addWarning(`Item ${itemNum}: Missing description in frontmatter: ${item.path}`);
      }
      
      // Validate specific frontmatter by kind
      if (item.kind === 'instruction') {
        if (!frontmatter.applyTo && !frontmatter.globs) {
          addWarning(`Item ${itemNum}: Instruction missing 'applyTo' or 'globs' in frontmatter: ${item.path}`);
        }
      }
      
      if (item.kind === 'prompt') {
        // Support both 'mode' (legacy) and 'agent' (new GitHub Copilot convention)
        if (!frontmatter.mode && !frontmatter.agent) {
          addWarning(`Item ${itemNum}: Prompt missing 'mode' or 'agent' in frontmatter: ${item.path}`);
        }
        if (!frontmatter.tools) {
          addWarning(`Item ${itemNum}: Prompt missing 'tools' in frontmatter: ${item.path}`);
        }
        if (!frontmatter.model) {
          addWarning(`Item ${itemNum}: Prompt missing 'model' in frontmatter: ${item.path}`);
        }
      }
      
      if (item.kind === 'agent') {
        if (!frontmatter.tools) {
          addWarning(`Item ${itemNum}: Agent missing 'tools' in frontmatter: ${item.path}`);
        }
        if (!frontmatter.model) {
          addWarning(`Item ${itemNum}: Agent missing 'model' in frontmatter: ${item.path}`);
        }
      }
      
      addSuccess(`Item ${itemNum}: ${path.basename(item.path)} validated`);
    }
    
    // Validate agent usage field
    if (item.kind === 'agent') {
      if (item.usage && !['recommended', 'optional'].includes(item.usage)) {
        addWarning(`Item ${itemNum}: Agent usage should be 'recommended' or 'optional': ${item.usage}`);
      }
    }
  });
  
  // Summary by kind
  log('\n📊 Items by Kind:', 'cyan');
  Object.entries(itemsByKind).forEach(([kind, count]) => {
    log(`   ${kind}: ${count}`, 'blue');
  });
}

/**
 * Validate file naming conventions
 */
function validateFileNaming(manifest) {
  log('\n🏷️  Validating File Naming Conventions...', 'cyan');
  
  manifest.items.forEach((item, index) => {
    const filename = path.basename(item.path);
    
    // Check for lowercase with hyphens
    const nameWithoutExt = filename.replace(/\.(instructions|prompt|agent)\.md$/, '');
    if (!/^[a-z0-9-]+$/.test(nameWithoutExt)) {
      addWarning(`Item ${index + 1}: Filename should be lowercase with hyphens: ${filename}`);
    }
    
    // Check for proper prefix (al- for this collection)
    if (!nameWithoutExt.startsWith('al-')) {
      addWarning(`Item ${index + 1}: Filename should start with 'al-' prefix: ${filename}`);
    }
  });
  
  addSuccess('File naming conventions validated');
}

/**
 * Validate collection documentation exists
 */
function validateDocumentation(manifest) {
  log('\n📖 Validating Documentation...', 'cyan');
  
  const docFile = `${manifest.id}.md`;
  if (!fileExists(docFile)) {
    addError(`Collection documentation not found: ${docFile}`);
  } else {
    addSuccess(`Collection documentation exists: ${docFile}`);
    
    // Validate documentation content
    const docContent = fs.readFileSync(docFile, 'utf8');
    
    // Check for required sections
    const requiredSections = [
      '# ',  // Title
      'What\'s Included',
      'Quick Start',
      'Requirements'
    ];
    
    requiredSections.forEach(section => {
      if (!docContent.includes(section)) {
        addWarning(`Documentation missing recommended section: ${section}`);
      }
    });
  }
}

/**
 * Check for duplicate IDs or paths
 */
function validateUniqueness(manifest) {
  log('\n🔍 Validating Uniqueness...', 'cyan');
  
  const paths = new Set();
  let duplicates = 0;
  
  manifest.items.forEach((item, index) => {
    if (paths.has(item.path)) {
      addError(`Duplicate path found: ${item.path}`);
      duplicates++;
    } else {
      paths.add(item.path);
    }
  });
  
  if (duplicates === 0) {
    addSuccess('No duplicate paths found');
  }
}

/**
 * Validate directory structure
 */
function validateDirectoryStructure() {
  log('\n📂 Validating Directory Structure...', 'cyan');
  
  const requiredDirs = [
    'instructions',
    'prompts',
    'agents',
    'collections'
  ];
  
  requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      addWarning(`Recommended directory not found: ${dir}`);
    } else {
      addSuccess(`Directory exists: ${dir}`);
    }
  });
}

/**
 * Main validation function
 */
function validateCollection() {
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║   AL Development Collection Validator v1.0    ║', 'cyan');
  log('╚════════════════════════════════════════════════╝', 'cyan');
  log(`\n🕐 Started: ${new Date().toISOString()}\n`, 'blue');
  
  const manifestPath = 'collections/al-development.collection.yml';
  
  // Check if manifest exists
  if (!fileExists(manifestPath)) {
    addError(`Collection manifest not found: ${manifestPath}`);
    return printSummary();
  }
  
  addSuccess(`Collection manifest found: ${manifestPath}`);
  
  // Load manifest
  const manifest = readYaml(manifestPath);
  if (!manifest) {
    return printSummary();
  }
  
  // Run validations
  validateCollectionManifest(manifest, manifestPath);
  validateCollectionItems(manifest);
  validateFileNaming(manifest);
  validateDocumentation(manifest);
  validateUniqueness(manifest);
  validateDirectoryStructure();
  
  // Print summary
  printSummary();
}

/**
 * Print validation summary
 */
function printSummary() {
  log('\n' + '═'.repeat(50), 'cyan');
  log('📊 VALIDATION SUMMARY', 'cyan');
  log('═'.repeat(50), 'cyan');
  
  log(`\n✅ Successes: ${successes.length}`, 'green');
  log(`⚠️  Warnings:  ${warnings.length}`, 'yellow');
  log(`❌ Errors:    ${errors.length}`, 'red');
  
  if (errors.length === 0 && warnings.length === 0) {
    log('\n🎉 Collection is fully compliant and ready for contribution!', 'green');
    log('═'.repeat(50) + '\n', 'cyan');
    process.exit(0);
  } else if (errors.length === 0) {
    log('\n✅ Collection is valid but has some warnings to address.', 'yellow');
    log('═'.repeat(50) + '\n', 'cyan');
    process.exit(0);
  } else {
    log('\n❌ Collection has errors that must be fixed before contribution.', 'red');
    log('═'.repeat(50) + '\n', 'cyan');
    process.exit(1);
  }
}

// Run validation if executed directly
if (require.main === module) {
  validateCollection();
}

module.exports = { validateCollection };