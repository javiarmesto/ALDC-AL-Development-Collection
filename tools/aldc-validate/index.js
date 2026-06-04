#!/usr/bin/env node
/**
 * ALDC Core Validator v1.1
 * Validates repository compliance against ALDC Core Spec v1.1.
 *
 * Checks:
 *   1. aldc.yaml exists and parses correctly
 *   2. .github/plans/ directory exists
 *   3. memory.md (global) exists
 *   4. Requirement sets are complete ({req_name}.spec.md + .architecture.md + .test-plan.md)
 *   5. Templates exist and are unmodified (optional hash check)
 *   6. Required agents, subagents, workflows, skills, instructions exist
 *   7. Copilot entrypoint coherence
 *
 * Usage:
 *   node tools/aldc-validate/index.js [--config aldc.yaml]
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml"); // npm i js-yaml

const args = process.argv.slice(2);
let configPath = "aldc.yaml";
const idx = args.indexOf("--config");
if (idx !== -1 && args[idx + 1]) configPath = args[idx + 1];

const S = { errors: [], warnings: [], info: [] };

function error(msg) { S.errors.push(msg); }
function warn(msg) { S.warnings.push(msg); }
function info(msg) { S.info.push(msg); }

function fileExists(p) { return fs.existsSync(p); }
function readFile(p) { return fs.readFileSync(p, "utf8"); }

// ─── 1. Parse aldc.yaml ───────────────────────────────────────────
if (!fileExists(configPath)) {
  error(`aldc.yaml not found at ${configPath}`);
  report();
  process.exit(1);
}

let cfg;
try {
  cfg = yaml.load(readFile(configPath));
  info(`aldc.yaml parsed (core version: ${cfg.core?.version})`);
} catch (e) {
  error(`aldc.yaml parse error: ${e.message}`);
  report();
  process.exit(1);
}

const root = cfg.toolkitRoot === "." ? "" : cfg.toolkitRoot + "/";
const rules = cfg.validation?.rules || {};
function severity(rule) { return rules[rule] || "warn"; }
function issue(rule, msg) { severity(rule) === "error" ? error(msg) : warn(msg); }

// ─── 2. Plans directory ───────────────────────────────────────────
const plansRoot = cfg.plans?.root || ".github/plans";
if (!fileExists(plansRoot)) {
  issue("missingPlansDir", `Plans directory not found: ${plansRoot}`);
} else {
  info(`Plans directory exists: ${plansRoot}`);
}

// ─── 3. Global memory ────────────────────────────────────────────
const memoryFile = cfg.contracts?.globalMemory || "memory.md";
const memoryPath = path.join(plansRoot, memoryFile);
if (!fileExists(memoryPath)) {
  issue("missingGlobalMemory", `Global memory not found: ${memoryPath}`);
} else {
  info(`Global memory exists: ${memoryPath}`);
}

// ─── 4. Requirement sets completeness ────────────────────────────
if (fileExists(plansRoot)) {
  const contractTypes = cfg.contracts?.types || ["spec", "architecture", "test-plan"];
  const files = fs.readdirSync(plansRoot).filter(f => f.endsWith(".md") && f !== memoryFile);
  
  // Extract unique req_names
  const reqNames = new Set();
  const filesByReq = {};
  
  for (const f of files) {
    for (const type of contractTypes) {
      const suffix = `.${type}.md`;
      if (f.endsWith(suffix)) {
        const reqName = f.slice(0, -suffix.length);
        reqNames.add(reqName);
        if (!filesByReq[reqName]) filesByReq[reqName] = [];
        filesByReq[reqName].push(type);
      }
    }
  }
  
  for (const reqName of reqNames) {
    const found = filesByReq[reqName] || [];
    const missing = contractTypes.filter(t => !found.includes(t));
    if (missing.length > 0) {
      issue("incompleteRequirementSets", 
        `Requirement "${reqName}" incomplete: missing ${missing.map(t => `${reqName}.${t}.md`).join(", ")}`);
    } else {
      info(`Requirement "${reqName}" has complete set (${contractTypes.length}/${contractTypes.length})`);
    }
  }
  
  if (reqNames.size === 0) {
    info("No requirement sets found in plans directory (may be initial setup)");
  }
}

// ─── 5. Templates ────────────────────────────────────────────────
const templates = cfg.required?.templates || [];
for (const t of templates) {
  const tp = root + t;
  if (!fileExists(tp)) {
    issue("missingTemplates", `Template not found: ${tp}`);
  } else {
    info(`Template exists: ${tp}`);
  }
}

// ─── 6. Required toolkit files ───────────────────────────────────

// 6a. Agents
const agents = cfg.required?.agents || [];
for (const a of agents) {
  const ap = root + a;
  if (!fileExists(ap)) {
    issue("missingToolkitFiles", `Agent not found: ${ap}`);
  } else {
    info(`Agent exists: ${ap}`);
  }
}

// 6b. Subagents
const subagents = cfg.required?.subagents || [];
for (const s of subagents) {
  const sp = root + s;
  if (!fileExists(sp)) {
    issue("missingToolkitFiles", `Subagent not found: ${sp}`);
  } else {
    info(`Subagent exists: ${sp}`);
  }
}

// 6c. Workflows
const workflows = cfg.required?.workflows || [];
for (const w of workflows) {
  const wp = root + w;
  if (!fileExists(wp)) {
    issue("missingToolkitFiles", `Workflow not found: ${wp}`);
  } else {
    info(`Workflow exists: ${wp}`);
  }
}

// 6d. Skills (required)
const requiredSkills = cfg.required?.skills?.required || [];
for (const sk of requiredSkills) {
  const skp = root + sk;
  if (!fileExists(skp)) {
    issue("missingSkills", `Required skill not found: ${skp}`);
  } else {
    info(`Required skill exists: ${skp}`);
  }
}

// 6e. Skills (recommended)
const recommendedSkills = cfg.required?.skills?.recommended || [];
for (const sk of recommendedSkills) {
  const skp = root + sk;
  if (!fileExists(skp)) {
    issue("missingRecommendedSkills", `Recommended skill not found: ${skp}`);
  } else {
    info(`Recommended skill exists: ${skp}`);
  }
}

// 6f. Instructions
const instructions = cfg.required?.instructions || [];
for (const i of instructions) {
  const ip = root + i;
  if (!fileExists(ip)) {
    issue("missingToolkitFiles", `Instruction not found: ${ip}`);
  } else {
    info(`Instruction exists: ${ip}`);
  }
}

// ─── 7. AL file naming convention ────────────────────────────────
// Verifies every *.al file in the project follows <ObjectName>.<ObjectType>.al.
// The narrow globs of type-specific instructions (al-performance, al-events,
// al-error-handling) depend on this pattern — a misnamed file silently loses
// its instructions.
const AL_OBJECT_TYPES = new Set([
  "Table", "TableExt",
  "Page", "PageExt", "PageCustomization",
  "Codeunit",
  "Report", "ReportExt",
  "Query",
  "XmlPort",
  "Enum", "EnumExt",
  "Interface",
  "ControlAddIn",
  "Profile",
  "PermissionSet", "PermissionSetExt",
  "Entitlement",
  "DotNet"
]);

function walkAlFiles(dir, acc) {
  if (!fileExists(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAlFiles(full, acc);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".al")) {
      acc.push(full);
    }
  }
  return acc;
}

const alFiles = walkAlFiles(".", []);
const malformed = [];
for (const f of alFiles) {
  const base = path.basename(f);
  // Expected: <Name>.<Type>.al where <Type> is in AL_OBJECT_TYPES
  const parts = base.split(".");
  if (parts.length < 3 || parts[parts.length - 1].toLowerCase() !== "al") {
    malformed.push(f);
    continue;
  }
  const type = parts[parts.length - 2];
  if (!AL_OBJECT_TYPES.has(type)) {
    malformed.push(f);
  }
}

if (alFiles.length === 0) {
  info("AL naming: no .al files found in project (skipping check)");
} else if (malformed.length === 0) {
  info(`AL naming: all ${alFiles.length} .al files follow <Name>.<Type>.al`);
} else {
  for (const f of malformed) {
    issue("malformedAlFileName",
      `AL file does not follow <ObjectName>.<ObjectType>.al pattern: ${f}`);
  }
  info(`AL naming: ${alFiles.length - malformed.length}/${alFiles.length} files compliant`);
}

// ─── 8. Copilot entrypoint coherence ─────────────────────────────
// Two modes (cfg.copilotEntrypointMode, default "mirror"):
//   "mirror"  — the entrypoint must be byte-identical to its source (install.js
//               copies source -> entrypoint; any drift is a stale copy).
//   "trimmed" — the entrypoint is an intentional lean subset of the source (the
//               ~31% always-on trim): we no longer require byte-identity, only
//               that it exists, is non-empty, and is genuinely smaller than the
//               source (a larger/equal "trim" means it went stale, not lean).
const entrypoint = cfg.copilotEntrypoint;
const source = cfg.copilotSource;
const entrypointMode = cfg.copilotEntrypointMode || "mirror";

if (entrypoint && !fileExists(entrypoint)) {
  issue("copilotEntrypointCoherence", `Copilot entrypoint not found: ${entrypoint}`);
} else if (entrypoint && source) {
  const sourcePath = root + source;
  if (fileExists(entrypoint) && fileExists(sourcePath)) {
    const ep = readFile(entrypoint).trim();
    const src = readFile(sourcePath).trim();
    if (entrypointMode === "trimmed") {
      if (ep.length === 0) {
        issue("copilotEntrypointCoherence", `Copilot entrypoint is empty: ${entrypoint}`);
      } else if (ep.length >= src.length) {
        issue("copilotEntrypointCoherence",
          `Copilot entrypoint is declared "trimmed" but is not smaller than its source (${entrypoint} ≥ ${sourcePath}) — likely stale, not a trim`);
      } else {
        info(`Copilot entrypoint is an intentional trim (${ep.length} vs ${src.length} source chars)`);
      }
    } else if (ep !== src) {
      issue("copilotEntrypointCoherence",
        `Copilot entrypoint drift detected: ${entrypoint} differs from ${sourcePath}`);
    } else {
      info("Copilot entrypoint is in sync with source");
    }
  }
}

// ─── Report ──────────────────────────────────────────────────────
function report() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║     ALDC Core Validator v1.1             ║");
  console.log("╚══════════════════════════════════════════╝\n");

  if (S.info.length) {
    console.log("ℹ️  Info:");
    S.info.forEach(m => console.log(`   ✓ ${m}`));
    console.log();
  }
  if (S.warnings.length) {
    console.log("⚠️  Warnings:");
    S.warnings.forEach(m => console.log(`   ⚠ ${m}`));
    console.log();
  }
  if (S.errors.length) {
    console.log("❌ Errors:");
    S.errors.forEach(m => console.log(`   ✗ ${m}`));
    console.log();
  }

  const total = S.errors.length + S.warnings.length;
  if (S.errors.length === 0) {
    console.log(`✅ ALDC Core v1.1 COMPLIANT (${S.warnings.length} warning(s))`);
  } else {
    console.log(`❌ NOT COMPLIANT — ${S.errors.length} error(s), ${S.warnings.length} warning(s)`);
  }

  // Summary table
  console.log("\n┌────────────────────┬───────┐");
  console.log("│ Check              │ Count │");
  console.log("├────────────────────┼───────┤");
  console.log(`│ Agents             │ ${agents.length.toString().padStart(5)} │`);
  console.log(`│ Subagents          │ ${subagents.length.toString().padStart(5)} │`);
  console.log(`│ Workflows          │ ${workflows.length.toString().padStart(5)} │`);
  console.log(`│ Skills (required)  │ ${requiredSkills.length.toString().padStart(5)} │`);
  console.log(`│ Skills (recommend) │ ${recommendedSkills.length.toString().padStart(5)} │`);
  console.log(`│ Instructions       │ ${instructions.length.toString().padStart(5)} │`);
  console.log(`│ Templates          │ ${templates.length.toString().padStart(5)} │`);
  console.log("└────────────────────┴───────┘");

  process.exit(S.errors.length > 0 ? 1 : 0);
}

report();
