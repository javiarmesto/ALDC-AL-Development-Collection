#!/usr/bin/env node
'use strict';
// Canonical role bootstrap, adapted from Lab b2ce9d9.../install_runtime.py.
// No historical Core snapshot, Graph overlay, Python runtime or model override.
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { split, stripAdapterPreamble } = require('./sync-copilot-cli');
const { support, plansRootFor, auditsRootFor } = require('./sync-plugin-support');
const { walk, provenance, normalized } = require('./package-provenance');
const ROOT = path.resolve(__dirname,'..'), DEST = 'plugins/aldc-codex';
const REF = '.agents/skills/aldc/references';
// Requirement artifacts follow the surface, beside the `.agents/skills/aldc` tree.
// The Claude adapter is this adapter's input, so both spellings reach us here.
const PLANS = plansRootFor(ROOT, 'codex');
const AUDITS = auditsRootFor(ROOT, 'codex');
const toPlansRoot = (text) => text.split('.claude/plans').join(PLANS).split('.github/plans').join(PLANS);
// Codex's permission surface, and the closest thing it has to the `tools` grant the
// canonical contract already carries. Legal values are read-only, workspace-write and
// danger-full-access (codex-rs/protocol/src/config_types.rs); nothing here needs the
// third. Derive the value from that grant rather than from the role's prose: a role
// that holds `edit` or `execute` writes in the workspace even when it calls itself
// read-only on code, which is exactly how dredd and al-triage persist their report.
// An absent key inherits from the parent; the session's own permission profile is
// reapplied over the role config, so this declaration narrows and never grants.
const WRITE_TOOLS = ['edit', 'execute'];
function sandboxModeFor(tools) {
  const granted = (Array.isArray(tools) ? tools : String(tools ?? '').split(','))
    .map((tool) => String(tool).trim())
    .some((tool) => WRITE_TOOLS.some((write) => tool === write || tool.startsWith(`${write}/`)));
  return granted ? 'workspace-write' : 'read-only';
}
function presalesMcpForCodex(body) {
  // This source section includes a nonexistent Context7 package, obsolete tool
  // names and VS Code-only setup. Adapt only Codex; other surfaces keep their
  // own sources and generators. Fail visibly if the source section moves.
  const start = body.indexOf('### 2.2 MCP Tools Verification');
  const end = body.indexOf('### 2.3 Complexity Assessment', start);
  if (start < 0 || end < start) throw Error('Presales MCP verification structure changed');
  return body.slice(0, start) + `### 2.2 MCP Tools Verification

Discover the MCP providers and exact tool schemas exposed by this Codex session.
Read \`.agents/skills/aldc/references/mcp-setup.md\` for provider endpoints,
configuration examples and the bounded connection check. Resolve that path
against the installed ALDC skill root when using plugin discovery.

- AL symbols: query the configured provider against the target project's packages.
- Context7: discover library resolution and documentation query tools; names vary
  by server version. Do not assume the older get-library-docs tool exists.
- Microsoft Learn: use the configured remote documentation provider. Installing
  a VS Code extension does not register an MCP server with Codex.
- GitHub: use an existing authorized repository connector if available; do not
  require a new MCP server or request a Personal Access Token as a default.

Record configured, connected, tools discovered and read-only query executed as
separate observations. If unavailable, identify the missing capability and use
available source/documentation evidence; mark the affected estimates uncertain.
Do not install servers, modify configuration or duplicate existing providers
automatically. A successful ALDC Doctor report does not verify MCP connectivity.

` + body.slice(end);
}
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
    .replace(/\.claude\/plans/g, PLANS).replace(/\.github\/plans/g, PLANS)
    .replace(/\.github\/audits/g, AUDITS)
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
  const pkg = JSON.parse(read('package.json'));
  const version = pkg.version;
  files.set('skills/aldc/references/mcp-setup.md', read('scripts/codex-mcp-setup.md'));
  // Field set verified against codex-rs/core-plugins/src/manifest.rs (RawPluginManifest,
  // RawPluginManifestInterface). `keywords` and `interface.websiteURL` are read there;
  // `homepage`/`repository` are not — they belong to the separate `$schema` Agent Plugins
  // manifest (agent_plugin_manifest.rs), so declaring them here would be ignored noise.
  // `capabilities` is a free-form Vec<String> used for display; it is left out rather
  // than guessed, and an empty array is indistinguishable from absent to the host.
  const manifest = { name:'aldc-codex', version, description:'Canonical ALDC roles and workflows for Codex; local bootstrap with recoverable updates.',
    author:{name:'javiarmesto'}, license:'MIT', keywords:pkg.keywords, skills:'./skills/',
    interface:{displayName:'ALDC for Codex',shortDescription:'Business Central development workflows',longDescription:'Canonical roles, AL rules, workflow references and local project initialization.',developerName:'javiarmesto',category:'Productivity',
      websiteURL:pkg.homepage,
      defaultPrompt:['Use ALDC to continue the approved Business Central work.','Design a Business Central extension with al-architect.','Audit the AL objects changed against main with dredd.']} };
  files.set('.codex-plugin/plugin.json',JSON.stringify(manifest,null,2)+'\n');
  const roles = [], commands = [];
  for (const p of walk(root,'docs/templates')) {
    // Bundled templates stay byte-identical to the canonical ones on every surface —
    // Claude Code ships them unrewritten under .claude/plans too, and
    // test-spec-contract.js enforces it. The surface plans root lives in the adapter
    // bodies that reference these templates, not in the templates themselves.
    files.set('skills/aldc/references/templates/' + p.slice('docs/templates/'.length), read(p));
    files.delete(p); // Codex has one reference tree; no extra discovery roots.
  }
  const preface = `## Codex host contract\n\nResolve .agents/skills/aldc paths below against the installed ALDC skill root\nif using plugin discovery instead of local bootstrap. Workflow names below are\nreference files in commands/, not automatically registered slash commands.\nPackaged domain entrypoints named SKILL.md in the source are stored as GUIDE.md\nunder references/skills/. This alias applies only when reading packaged guidance;\nnew discoverable skills must still be created with SKILL.md.\n\nRead the terminal-host contract at\n\`.agents/skills/aldc/references/skills/skill-migrate/references/cli-al-tools.md\`\nbefore choosing AL tools, changing dependencies or reporting BC29 / AL18\nvalidation. Use only tools actually exposed by this session. Model, reasoning and approval\nsettings inherit from the parent; this profile grants no extra tools. Its\n\`sandbox_mode\` is derived from the write scope the canonical contract grants this\nrole, and the session's own permission profile is reapplied over it, so that key\nnarrows and never grants. The narrower role write scopes stated below are still\nbehavioral: \`sandbox_mode\` cannot express them, and honouring them is yours. Discover MCP\nproviders before using their examples; none are installed by this package.\nIf delegation is unavailable, report that the affected independent review or\nConductor workflow is pending; do not certify self-review as independent review.\n\nThe \`handoffs:\` entries of the canonical contract, and the \`send: false\` on some\nof them, have no equivalent here. In Copilot a handoff is a button the human\nclicks, and \`send: false\` additionally hands them the prompt to review before it\nis sent: the host supplies the approval. Codex has no such step, so the gate is\nyours to keep — never auto-delegate. Present your output, get explicit approval,\nand only then delegate or switch role.\n`;
  for (const p of walk(root,'claude-plugin/agents')) {
    const src = split(read(p)), name = path.basename(p,'.md');
    if (!fs.existsSync(path.join(root,`agents/${name}.agent.md`))) throw Error(`Noncanonical role: ${name}`);
    // sandbox_mode is derived from the canonical tool grant, not from the adapter's
    // frontmatter: the Claude adapter has already rewritten `tools` into Claude Code's
    // vocabulary, where the `edit`/`execute` grant this reads no longer exists.
    const canonical = split(read(`agents/${name}.agent.md`));
    let adapted = bodyFor(stripAdapterPreamble(src.body));
    if (name === 'al-presales') adapted = presalesMcpForCodex(adapted);
    const body = preface + adapted;
    files.set(`skills/aldc/references/agents/${name}.md`,body);
    const instructions = 'Resolve relative links in this profile from .agents/skills/aldc/references/agents/.\n\n' + body;
    // JSON basic strings are TOML-compatible for these strings; validate with tomllib.
    files.set(`agents/${name}.toml`,`name = ${JSON.stringify(name)}\ndescription = ${JSON.stringify(bodyFor(src.data.description))}\nsandbox_mode = ${JSON.stringify(sandboxModeFor(canonical.data.tools))}\ndeveloper_instructions = ${JSON.stringify(instructions)}\n`);
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
    `Read the relevant role or workflow below in full before acting. Resolve these\nlinks from this skill directory, including when a plugin cache holds it. Load\napplicable rules from references/rules/ and domain guidance from\nreferences/skills/ (GUIDE.md) on demand. These domain references are not duplicate\ndiscoverable skills. Recover approved work from ${PLANS}/ and memory.md.\n\nFor MEDIUM/HIGH work, preserve architecture → specification → Conductor order.\nThe al-spec-create workflow loads the same al-spec-agent contract as direct role invocation.\nHuman material gates and current session authorization govern actions. Plugin\ninstallation alone does not authorize compilation, publishing or deployment.\n\nUse discovered project custom agents when available. Otherwise read the selected\nrole as instructions in this session; when independent subagents are required\nand unavailable, report the affected step as pending. Do not invent a tool name\nor claim independent review from a sequential role change.\n\n## Roles\n\n${links(roles,'agents')}\n\n## Workflows\n\n${links(commands,'commands')}\n`);
  files.set('README.md', `# ALDC for Codex\n\nGenerated by scripts/sync-codex.js from canonical terminal sources. No manual\nedits. Node 20+ is the only bootstrap interpreter; no Python/PATH setup is needed.\n\nFrom a checkout, preview a separate project:\n\n\`node plugins/aldc-codex/scripts/init.js --project /path/to/project\`\n\nRepeat with --apply after reviewing the plan. This installs one local ALDC skill,\n${roles.length} .codex/agents profiles, AL rules and a managed AGENTS.md block (or the existing\nAGENTS.override.md). Models, sandbox, approvals and MCP settings are inherited.\n--force backs up reviewed collisions; --verify checks receipt drift; --rollback\nrestores the preceding transaction if later project edits would not be lost.\n\nThe package manifest supports plugin distribution, but no marketplace entry is\ncreated. Use either plugin skill discovery or local bootstrap, never both in the\nsame project. Plugin discovery alone does not install the project TOML profiles.\n\nRestart Codex, inspect /skills and loaded instruction sources, then request a\nbounded read-only role invocation and inspect its full loaded profile. Counting\nfiles is not this host test. Full Conductor/Architect bodies remain intact and\nmust load completely in the installed host. See ../../docs/plugin-packaging.md\nfor installation behavior and compatibility requirements.\n`);
  files.set('README.md', files.get('README.md') + `\n## MCP setup and verification\n\nALDC for Codex declares no MCP servers and does not copy the repository's\n\`.mcp.json\` or another host's plugin manifest. Existing Codex providers are inherited.\nSee [MCP setup](skills/aldc/references/mcp-setup.md) for the corrected AL symbols\npackage from PR #108, official documentation endpoints and a bounded smoke check.\nDoctor does not inspect Codex MCP configuration or establish connectivity.\n`);
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
