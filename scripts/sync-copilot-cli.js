#!/usr/bin/env node
/**
 * Generate the Copilot CLI distribution from the terminal-oriented Claude source.
 * Never edit copilot-cli-plugin/ directly. --check detects drift, including orphans.
 * Workflow bodies are retained in full; only host vocabulary and initialization
 * are translated. Copilot model selection remains sourced from root agents/.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { HOST_PREFACE, translateHost } = require('./copilot-cli-adapter');
const ROOT = path.resolve(__dirname, '..');
const DEST = 'copilot-cli-plugin';
const toolMap = {
  Read: 'read', Glob: 'search', Grep: 'search', Write: 'edit', Edit: 'edit',
  Bash: 'execute', Task: 'task', Agent: 'task', WebSearch: 'web', WebFetch: 'web',
};
function split(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---([\s\S]*)$/);
  if (!match) throw new Error('Missing frontmatter');
  return { data: yaml.load(match[1]), body: match[2] };
}
function toolsFor(value) {
  return [...new Set(value.split(',').map(t => t.trim()).map(t => {
    if (toolMap[t]) return toolMap[t];
    const m = t.match(/^mcp__(?:plugin_aldc_)?(al-symbols-mcp|context7|microsoft-docs)__\*$/);
    if (m) return `${m[1]}/*`;
    throw new Error(`Unmapped Claude tool: ${t}`);
  }))];
}
/**
 * The Claude Code adapter preamble (the binding Copilot -> Claude Code mapping
 * table that sync-plugin-support.js prepends to every adapted contract) is
 * meaningless in a Copilot host: it would map Copilot surfaces onto themselves.
 * Drop the leading block quote and restate the terminal-host contract instead.
 */
function stripAdapterPreamble(body) {
  return body.replace(/^\n*(?:>[^\n]*\n)+\n?/, '');
}
const CLI_PREFACE = HOST_PREFACE;
const agentBody = (body) => HOST_PREFACE + bodyFor(stripAdapterPreamble(body));
function bodyFor(text) {
  text = text.replace(/\]\(\.\.\/agents\/([a-z0-9-]+)\.md\)/g, '](../agents/$1.agent.md)');
  return translateHost(text
    .replace(/Claude Code/g, 'Copilot CLI')
    .replace(/`Task`/g, '`agent`').replace(/\bTask tool\b/g, 'agent tool')
    .replace(/the TodoWrite list/g, 'the current task list or plan document')
    .replace(/`?\bTodoWrite\b`?/g, 'the available task-list tool (or update the plan document)')
    .replace(/\bBash\b/g, 'execute')
    .replace(/`Read`/g, '`read`').replace(/`(?:Glob|Grep)`/g, '`search`')
    .replace(/`(?:Write|Edit)`/g, '`edit`')
    .replace(/`(?:WebSearch|WebFetch)`/g, '`web`')
    .replace(/aldc:/g, '')
    .replace(/\.claude\/rules/g, '.github/instructions')
    .replace(/\.claude\/plans/g, '.github/plans')
    .replace(/CLAUDE_PLUGIN_ROOT/g, 'PLUGIN_ROOT')
    // Plugin-layout paths translated to this distribution's own folder names.
    .replace(/(\$\{PLUGIN_ROOT\}\/)rules\//g, '$1rules-templates/')
    .replace(/(\$\{PLUGIN_ROOT\}\/)rules-templates\/([a-z*-]+)\.md/g, '$1rules-templates/$2.instructions.md')
    .replace(/(\$\{PLUGIN_ROOT\}\/)agents\/([a-z0-9-]+)\.md/g, '$1agents/$2.agent.md')
    .replace(/(\$\{PLUGIN_ROOT\}\/)skills\/(al-[a-z-]+)\/SKILL\.md/g, '$1commands/$2.md')
    .replace(/[\t ]+$/gm, ''));
}
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
function expected(root = ROOT) {
  const files = new Map();
  const read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
  const put = (p, text) => files.set(`${DEST}/${p}`, text);
  const manifest = JSON.parse(read('plugin.json'));
  delete manifest.userConfig;
  manifest.name = 'aldc-cli';
  manifest.description = 'ALDC for Copilot CLI: terminal-adapted agents, skills and commands; conditional BC29/AL18 capability checks and canonical human gates.';
  manifest.commands = 'commands/';
  // PR #108 (c6f57c0): the old scoped npm package does not exist. Project this
  // fix only into CLI while the shared manifest/other hosts stay untouched.
  // Once #108 lands, its already-correct declaration passes through unchanged.
  const symbols = manifest.mcpServers?.['al-symbols-mcp'];
  if (symbols?.command === 'npx' && symbols.args?.includes('@nicholasglazer/al-symbols-mcp')) {
    symbols.args = symbols.args.map(arg => arg === '@nicholasglazer/al-symbols-mcp' ? 'al-mcp-server@2.5.0' : arg);
  }
  put('plugin.json', JSON.stringify(manifest, null, 2) + '\n');
  for (const file of walk(path.join(root, 'claude-plugin/agents'))) {
    const name = path.basename(file, '.md');
    const src = split(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
    const canonical = split(read(`agents/${name}.agent.md`));
    // Translate the existing Copilot model identifier, never infer it from AL18.
    const models = { 'Claude Sonnet 4.6 (copilot)': 'claude-sonnet-4.6' };
    const model = models[canonical.data.model];
    if (!model) throw new Error(`Unmapped Copilot model: ${canonical.data.model}`);
    const data = { name, description: bodyFor(src.data.description), tools: toolsFor(src.data.tools), model };
    if (data.tools.includes('task')) data.tools.push('list_agents', 'read_agent');
    for (const field of ['user-invocable', 'disable-model-invocation']) {
      if (canonical.data[field] !== undefined) data[field] = canonical.data[field];
    }
    let body = agentBody(src.body);
    // Keep the host profile below the documented size limit without deleting
    // workflow steps. Reading the complete external contract is mandatory.
    if (body.length > 29000) {
      const contract = `references/agent-contracts/${name}.md`;
      put(contract, body);
      body = HOST_PREFACE + `# ${name}\n\nBefore any role action, use view to read the COMPLETE contract at\n\`\${PLUGIN_ROOT}/${contract}\`. Read all remaining ranges if the host\ntruncates a response. This is your own role contract, not a substitute agent.\nIf it cannot be read completely, report the missing contract and stop.\nDo not plan, delegate, implement or approve anything from this entry alone.\n`;
    }
    put(`agents/${name}.agent.md`, '---\n' + yaml.dump(data, { lineWidth: -1 }) + '---' + body);
  }
  // ALDC workflows ship as explicitly invoked skills in the Claude Code plugin
  // (`disable-model-invocation: true`); Copilot CLI keeps them as commands.
  const { WORKFLOWS, workflowSkillName } = require('./sync-plugin-support');
  for (const prompt of WORKFLOWS) {
    const name = workflowSkillName(prompt);
    const file = path.join(root, `claude-plugin/skills/${name}/SKILL.md`);
    const src = split(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
    let body = bodyFor(stripAdapterPreamble(src.body));
    if (name === 'al-initialize') {
      const start = body.indexOf('## Phase 0:');
      const end = body.indexOf('## Phase 1:');
      if (start < 0 || end <= start) throw new Error('Initialization structure changed');
      body = body.slice(0, start) + `## Phase 0: ALDC instructions (Copilot CLI)

Locate the installed plugin root through the plugin list. Run its scripts/init.js
with Node 20+ and --project <directory> to preview project changes. After reviewing
the plan, repeat with --apply. Existing customized rules remain visible collisions;
use --force only for reviewed replacement, with a recoverable backup. This adds a
managed AGENTS.md block, preserving
surrounding project instructions and .github/plans/memory.md. Use --verify for
receipt drift and --rollback to restore the preceding initialization. Neither
operation installs software or configures MCP servers. Discover command labels in
the installed CLI. Confirm instruction loading and the human review gate.

` + body.slice(end);
      // Environment setup is host behavior: do not ask CLI consumers to install
      // Chat or certify readiness through editor completion/Problems UI.
      const phase = (heading, next, replacement) => {
        const a = body.indexOf(heading), b = body.indexOf(next, a);
        if (a < 0 || b <= a) throw Error(`Initialization anchor changed: ${heading}`);
        body = body.slice(0, a) + replacement + '\n\n' + body.slice(b);
      };
      phase('## Phase 1:', '## Phase 2:', `## Phase 1: Copilot CLI environment\n\nVerify copilot --version, authentication, plugin installation and the actual\n/agent, /skills list and /mcp catalogs in a new session. Node 20+ is required by\nthe bootstrap. Inspect the project's AL compiler, symbol-download and test\ncommands; record missing operations as unavailable. No Copilot Chat extension\nis required. Do not install software or change credentials automatically.`);
      phase('## Phase 3:', '## Phase 4:', `## Phase 3: Runtime configuration\n\nReview target environment, authentication and credential handling with the\nhuman before writing runtime configuration or deploying. Use the existing\nterminal/CI runner's configuration. Editor launch.json is optional, only when\nexplicitly requested for editor debugging; it does not configure this CLI.`);
      phase('## Phase 5:', '## Next Steps', `## Phase 5: Verification\n\nInspect loaded project instructions and the selected plugin source. Verify\nDoctor readiness and run only the approved available build/test commands.\nDistinguish configured, loaded, invoked and result-verified. A successful\nbootstrap or compiler run does not certify agents or Business Central runtime.\n\n## Troubleshooting\n\nFor authentication, use the host's /login flow. For missing symbols, inspect\nthe configured terminal runner and actual app.json dependencies. For missing\nroles or outdated behavior, check first-found-wins collisions, reinstall the\nlocal plugin or update the marketplace plugin, and restart the session. Never\nclear credentials or reinstall software automatically.\n\n## Success Criteria\n\nReport observed CLI version, selected sources, instruction loading, symbol\navailability and actual build/test results. List every unverified operation.`);
      body = body.replace('This workflow covers both initial environment setup (VS Code, GitHub Copilot) and AL workspace configuration (project structure, symbols, dependencies).',
        'This workflow configures Copilot CLI and the approved AL project. Bootstrap alone adds no AL sources or manifest; project scaffolding below requires its own approved scope.');
      body = body.replace('**Environment Initialization Complete! 🎉**\n\nYour AL development environment is ready for Business Central development with optimized AI assistance.',
        '**Report initialization results and remaining unavailable operations.**');
    }
    // Commands are instructions, not a permission bypass; CLI agent allowlists
    // and interactive permissions govern execution. Claude allowed-tools is omitted.
    const data = { description: bodyFor(src.data.description), 'disable-model-invocation': true };
    put(`commands/${name}.md`, '---\n' + yaml.dump(data, { lineWidth: -1 }) + '---' + HOST_PREFACE + body);
  }
  // Only the knowledge skills travel: the workflow skills became commands above and
  // the short role entry skills are a Claude Code affordance Copilot does not need.
  for (const file of walk(path.join(root, 'claude-plugin/skills'))) {
    const rel = path.relative(path.join(root, 'claude-plugin/skills'), file).split(path.sep).join('/');
    if (!rel.startsWith('skill-')) continue;
    const content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    // Shared contracts explicitly compare hosts; preserve their names and citations.
    const neutral = ['cli-al-tools.md', 'al18-capabilities.md'].includes(path.basename(file));
    put('skills/' + rel, neutral ? content : bodyFor(content));
  }
  for (const file of walk(path.join(root, 'claude-plugin/rules'))) {
    const src = split(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
    const data = { applyTo: src.data.paths.join(','), description: src.data.description };
    const body = bodyFor(stripAdapterPreamble(src.body)).replace(/\]\(\.\/(al-[^)]+)\.md\)/g, '](./$1.instructions.md)');
    put(`rules-templates/${path.basename(file, '.md')}.instructions.md`, '---\n' + yaml.dump(data, { lineWidth: -1 }) + '---' + body);
  }
  put('README.md', `# ALDC for Copilot CLI

Generated by scripts/sync-copilot-cli.js from claude-plugin/ with explicit host
translation and model IDs from agents/. Do not edit this directory manually.

From a checkout containing the canonical BC29 adaptation (main after PR #97):

\`\`\`shell
copilot plugin install ./copilot-cli-plugin
copilot plugin list
\`\`\`

Restart the CLI, inspect /agent and /skills list, and verify the loaded source.
Reinstall the local path after updates (the CLI caches plugins). Use a separate
test project; existing project/personal agents or skills can shadow the plugin.
Do not install both aldc and aldc-cli into the same CLI test session.

Read skills/skill-migrate/references/cli-al-tools.md for toolchain checks, BC28/BC29
scope, evidence and graph ownership. No VS Code language-model tools are bundled.
The existing community/documentation MCP servers retain their configuration.
No Claude hooks are imported; the agents retain their optional BCQuality backstop.

Role write scopes are behavioral contracts, not filesystem sandboxes. The CLI
edit capability translates Claude Write/Edit, both of which can overwrite files;
execute/Bash is also broader than a report directory. Dredd and Triage must write
only their reports as specified. Host tool/path approvals remain necessary;
this package does not claim an enforced per-role filesystem boundary.

Install, update, precedence, bootstrap and validation: [Copilot CLI guide](docs/copilot-cli-plugin.md).
Legacy format is retained intentionally. All agent entry bodies stay below 29,000
characters; Conductor must load its complete bundled reference before acting.
No canonical workflow is truncated. Authenticated invocation and delegation still
need host evidence; installation and catalogs alone do not certify them.
`);
  const { support } = require('./sync-plugin-support');
  for (const [p,b] of support('cli', root)) put(p,b);
  const { adaptInitializer } = require('./copilot-cli-bootstrap');
  put('scripts/init.js', adaptInitializer(read('scripts/init-plugin.js')));
  put('scripts/cli-bootstrap.js', read('scripts/copilot-cli-bootstrap.js'));
  put('docs/copilot-cli-plugin.md', read('docs/copilot-cli-plugin.md'));
  const { walk: paths, provenance } = require('./package-provenance');
  const sources = paths(root, 'claude-plugin').filter(p => !p.endsWith('/provenance.json'));
  sources.push('scripts/sync-plugin-support.js', 'scripts/copilot-cli-adapter.js', 'scripts/copilot-cli-bootstrap.js', 'docs/copilot-cli-plugin.md');
  sources.push(...paths(root, 'tools/bcquality'), 'tools/aldc-validate/package.json', 'tools/aldc-validate/index.js', ...paths(root, 'tools/context-doctor'), ...paths(root, 'agents'), 'plugin.json', 'scripts/sync-plugin-support.js',
    'scripts/install-transaction.js', 'scripts/init-plugin.js', ...paths(root, 'docs/templates'));
  put('provenance.json', provenance(root, sources,
    new Map([...files].map(([p,b]) => [p.slice(DEST.length+1),b])), 'scripts/sync-copilot-cli.js'));
  return files;
}
function sync(check = false, root = ROOT) {
  const files = expected(root);
  let drift = 0;
  for (const [rel, text] of files) {
    const dest = path.join(root, rel);
    if (fs.existsSync(dest) && fs.readFileSync(dest, 'utf8').replace(/\r\n/g, '\n') === text.toString().replace(/\r\n/g, '\n')) continue;
    drift++;
    if (check) console.error(`drift: ${rel}`);
    else { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, text); }
  }
  for (const file of walk(path.join(root, DEST))) {
    if (files.has(path.relative(root, file).split(path.sep).join('/'))) continue;
    drift++;
    if (check) console.error(`orphan: ${file}`);
    else fs.unlinkSync(file);
  }
  console.log(`Copilot CLI: ${files.size} generated files; ${drift} ${check ? 'differences' : 'updated/removed'}`);
  return check && drift ? 1 : 0;
}
if (require.main === module) process.exitCode = sync(process.argv.includes('--check'));
module.exports = { expected, split, bodyFor, toolsFor, sync, stripAdapterPreamble, agentBody, CLI_PREFACE };
