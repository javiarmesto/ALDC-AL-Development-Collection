#!/usr/bin/env node
'use strict';
// Canonical role bootstrap, adapted from Lab b2ce9d9.../install_runtime.py.
// No historical Core snapshot, Graph overlay, Python runtime or model override.
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { split, stripAdapterPreamble } = require('./sync-copilot-cli');
const { support } = require('./sync-plugin-support');
const { walk, provenance, normalized } = require('./package-provenance');
const ROOT = path.resolve(__dirname,'..'), DEST = 'plugins/aldc-codex';
const REF = '.agents/skills/aldc/references';
function bodyFor(text) {
  // Plugin-layout paths first: the Claude Code adapter emits ${CLAUDE_PLUGIN_ROOT}.
  return text
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/rules\//g, `${REF}/rules/`)
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/skills\//g, `${REF}/skills/`)
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/docs\/templates\//g, `${REF}/templates/`)
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/agents\//g, `${REF}/agents/`)
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/tools\//g, '.agents/skills/aldc/scripts/')
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}\//g, '.agents/skills/aldc/')
    .replace(/\$\{CLAUDE_PROJECT_DIR\}\//g, '')
    .replace(/\.claude\/plans/g, '.github/plans')
    .replaceAll('../../docs/templates/', '../../templates/').replaceAll('../docs/templates/', '../templates/').replaceAll('../rules-templates/', '../rules/').replace(/Claude Code/g,'Codex')
    .replace(/`?\bTodoWrite\b`?/g,'the available planning tool (or the plan document)')
    .replace(/\bTask tool\b/g,'subagent delegation tool').replace(/`Task`/g,'subagent delegation')
    .replace(/\bBash\b/g,'shell').replace(/`Read`/g,'Read').replace(/`(?:Glob|Grep)`/g,'Search')
    .replace(/`Write`/g,'Write').replace(/`Edit`/g,'Edit')
    .replace(/`WebSearch`/g,'web search').replace(/`WebFetch`/g,'web retrieval')
    .replace(/aldc:/g,'').replace(/\.claude\/rules/g,'.agents/skills/aldc/references/rules')
    .replace(/\.github\/instructions/g,'.agents/skills/aldc/references/rules')
    .replace(/\.github\/skills/g,'.agents/skills/aldc/references/skills')
    .replace(/\/?al-spec\.create/g,'al-spec-create')
    .replace(/instructions\/al-\*\.instructions\.md/g,'.agents/skills/aldc/references/rules/al-*.md')
    .replace(/docs\/templates\//g,'.agents/skills/aldc/references/templates/')
    .replace(/(skill-[a-z0-9-]+\/)SKILL\.md/g,'$1GUIDE.md').replace(/[\t ]+$/gm,'');
}
function expected(root = ROOT) {
  const files = support('codex', root), sources = [];
  const read = p => { sources.push(p); return normalized(fs.readFileSync(path.join(root,p))).toString('utf8'); };
  const version = JSON.parse(read('package.json')).version;
  const manifest = { name:'aldc-codex', version, description:'Canonical ALDC roles and workflows for Codex; local bootstrap with recoverable updates.',
    author:{name:'javiarmesto'}, license:'MIT', skills:'./skills/',
    interface:{displayName:'ALDC for Codex',shortDescription:'Business Central development workflows',longDescription:'Canonical roles, AL rules, workflow references and local project initialization.',developerName:'javiarmesto',category:'Productivity',capabilities:[],defaultPrompt:'Use ALDC to continue the approved Business Central work.'} };
  files.set('.codex-plugin/plugin.json',JSON.stringify(manifest,null,2)+'\n');
  const roles = [], commands = [];
  for (const p of walk(root,'docs/templates')) {
    files.set('skills/aldc/references/templates/' + p.slice('docs/templates/'.length), read(p));
    files.delete(p); // Codex has one reference tree; no extra discovery roots.
  }
  const preface = `## Codex host contract\n\nResolve .agents/skills/aldc paths below against the installed ALDC skill root\nif using plugin discovery instead of local bootstrap. Workflow names below are\nreference files in commands/, not automatically registered slash commands.\nPackaged domain entrypoints named SKILL.md in the source are stored as GUIDE.md\nunder references/skills/. This alias applies only when reading packaged guidance;\nnew discoverable skills must still be created with SKILL.md.\n\nUse only tools actually exposed by this session. Model, reasoning, sandbox and\napproval settings inherit from the parent; this profile grants no extra tools.\nRole write scopes below are behavioral, not filesystem sandboxes. Discover MCP\nproviders before using their examples; none are installed by this package.\nIf delegation is unavailable, report that the affected independent review or\nConductor workflow is pending; do not certify self-review as independent review.\n`;
  for (const p of walk(root,'claude-plugin/agents')) {
    const src = split(read(p)), name = path.basename(p,'.md');
    if (!fs.existsSync(path.join(root,`agents/${name}.agent.md`))) throw Error(`Noncanonical role: ${name}`);
    sources.push(`agents/${name}.agent.md`);
    const body = preface + bodyFor(stripAdapterPreamble(src.body));
    files.set(`skills/aldc/references/agents/${name}.md`,body);
    const instructions = 'Resolve relative links in this profile from .agents/skills/aldc/references/agents/.\n\n' + body;
    // JSON basic strings are TOML-compatible for these strings; validate with tomllib.
    files.set(`agents/${name}.toml`,`name = ${JSON.stringify(name)}\ndescription = ${JSON.stringify(bodyFor(src.data.description))}\ndeveloper_instructions = ${JSON.stringify(instructions)}\n`);
    roles.push([name,bodyFor(src.data.description).trim()]);
  }
  const { WORKFLOWS, workflowSkillName } = require('./sync-plugin-support');
  for (const prompt of WORKFLOWS) {
    const name = workflowSkillName(prompt);
    const src = split(read(`claude-plugin/skills/${name}/SKILL.md`));
    let body = bodyFor(stripAdapterPreamble(src.body));
    if (name === 'al-spec-create') body = body.replace('with the requirement, complexity and scope in `$ARGUMENTS`', 'with the requirement, complexity and scope supplied in the current request');
    if (name === 'al-initialize') {
      const a=body.indexOf('## Phase 0:'), b=body.indexOf('## Phase 1:');
      if (a < 0 || b < a) throw Error('Initialization structure changed');
      body = body.slice(0,a) + `## Phase 0: Codex project initialization\n\nRun the installed package scripts/init.js with --project <directory> to preview.\nAfter reviewing the plan, repeat with --apply. Preserve collisions unless the\nuser authorizes --force replacement. Use --verify for drift and --rollback for\nthe preceding transaction. Do not combine plugin discovery with local bootstrap\ncopies of the same ALDC skill. Confirm loaded sources before environment setup.\n\n` + body.slice(b);
    }
    files.set(`skills/aldc/references/commands/${name}.md`,preface+body);
    commands.push([name,bodyFor(src.data.description).trim()]);
  }
  for (const p of walk(root,'claude-plugin/skills')) {
    const rel = p.slice('claude-plugin/skills/'.length).replace(/SKILL\.md$/,'GUIDE.md');
    // Workflow skills become commands above; role entry skills are Claude-only.
    if (!rel.startsWith('skill-')) continue;
    const neutral = ['cli-al-tools.md','al18-capabilities.md'].includes(path.basename(p));
    files.set(`skills/aldc/references/skills/${rel}`,neutral ? read(p) : bodyFor(read(p)));
  }
  for (const p of walk(root,'claude-plugin/rules')) {
    const src = split(read(p));
    const content = `Applies to: ${src.data.paths.join(', ')}\n` + bodyFor(stripAdapterPreamble(src.body));
    files.set(`rules-templates/${path.basename(p)}`,content);
    files.set(`skills/aldc/references/rules/${path.basename(p)}`,content);
  }
  const links = (items,dir) => items.map(([name,description])=>`- [${name}](references/${dir}/${name}.md): ${description.replace(/\n/g,' ')}`).join('\n');
  files.set('skills/aldc/SKILL.md', '---\n' + yaml.dump({name:'aldc',description:'Use canonical ALDC architecture, implementation, TDD orchestration, review and specification workflows for AL / Business Central projects.'},{lineWidth:-1}) + '---\n\n' +
    `Read the relevant role or workflow below in full before acting. Resolve these\nlinks from this skill directory, including when a plugin cache holds it. Load\napplicable rules from references/rules/ and domain guidance from\nreferences/skills/ (GUIDE.md) on demand. These domain references are not duplicate\ndiscoverable skills. Recover approved work from .github/plans/ and memory.md.\n\nFor MEDIUM/HIGH work, preserve architecture → specification → Conductor order.\nThe al-spec-create workflow loads the same al-spec-agent contract as direct role invocation.\nHuman material gates and current session authorization govern actions. Plugin\ninstallation alone does not authorize compilation, publishing or deployment.\n\nUse discovered project custom agents when available. Otherwise read the selected\nrole as instructions in this session; when independent subagents are required\nand unavailable, report the affected step as pending. Do not invent a tool name\nor claim independent review from a sequential role change.\n\n## Roles\n\n${links(roles,'agents')}\n\n## Workflows\n\n${links(commands,'commands')}\n`);
  files.set('README.md', `# ALDC for Codex\n\nGenerated by scripts/sync-codex.js from canonical terminal sources. No manual\nedits. Node 20+ is the only bootstrap interpreter; no Python/PATH setup is needed.\n\nFrom a checkout, preview a separate project:\n\n\`node plugins/aldc-codex/scripts/init.js --project /path/to/project\`\n\nRepeat with --apply after reviewing the plan. This installs one local ALDC skill,\n${roles.length} .codex/agents profiles, AL rules and a managed AGENTS.md block (or the existing\nAGENTS.override.md). Models, sandbox, approvals and MCP settings are inherited.\n--force backs up reviewed collisions; --verify checks receipt drift; --rollback\nrestores the preceding transaction if later project edits would not be lost.\n\nThe package manifest supports plugin distribution, but no marketplace entry is\ncreated. Use either plugin skill discovery or local bootstrap, never both in the\nsame project. Plugin discovery alone does not install the project TOML profiles.\n\nRestart Codex, inspect /skills and loaded instruction sources, then request a\nbounded read-only role invocation and inspect its full loaded profile. Counting\nfiles is not this host test. Full Conductor/Architect bodies remain intact and\nmust load completely in the installed host. See ../../docs/plugin-packaging.md\nfor installation behavior and compatibility requirements.\n`);
  sources.push(...walk(root,'tools/bcquality'),'tools/aldc-validate/package.json','tools/aldc-validate/index.js',...walk(root,'tools/context-doctor'),'scripts/sync-plugin-support.js','scripts/install-transaction.js','scripts/init-plugin.js','scripts/sync-copilot-cli.js','docs/templates/memory-template.md');
  files.set('provenance.json',provenance(root,sources,files,'scripts/sync-codex.js'));
  return files;
}
function sync(check = false) {
  const files=expected(), dest=path.join(ROOT,DEST);let drift=0;
  for (const [rel,b] of files) {
    const p=path.join(dest,rel);
    if(fs.existsSync(p)&&normalized(fs.readFileSync(p)).equals(normalized(Buffer.from(b))))continue;
    drift++;if(check)console.error(`drift: ${DEST}/${rel}`);else{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}
  }
  for(const rel of walk(dest))if(!files.has(rel)){drift++;if(check)console.error(`orphan: ${DEST}/${rel}`);else fs.unlinkSync(path.join(dest,rel));}
  console.log(`Codex: ${files.size} generated files; ${drift} differences`);return check&&drift?1:0;
}
if(require.main===module)process.exitCode=sync(process.argv.includes('--check'));
module.exports={expected,sync,bodyFor};
