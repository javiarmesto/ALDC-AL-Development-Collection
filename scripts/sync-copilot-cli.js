#!/usr/bin/env node
/**
 * Generate the Copilot CLI distribution directly from the canonical source trees.
 * Never edit copilot-cli-plugin/ directly. --check detects drift, including orphans.
 * Workflow bodies are retained in full; only host vocabulary and initialization
 * are translated. Copilot model selection remains sourced from root agents/.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { HOST_PREFACE, translateHost, toolsForRole, adaptDreddPersistence } = require('./copilot-cli-adapter');
const { split, WORKFLOWS, workflowSkillName, oneLine, withPeriod, rewritePaths, knowledgeContent } = require('./generation-utils');
const { support } = require('./plugin-runtime');
const ROOT = path.resolve(__dirname, '..');
const DEST = 'copilot-cli-plugin';
const CLI_PREFACE = HOST_PREFACE;
const agentBody = (body, name) => HOST_PREFACE + bodyFor(canonicalPaths((name === 'dredd' ? adaptDreddPersistence(body) : body).replace(/^\n/, '')));
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
function canonicalPaths(text) {
  const base = '${PLUGIN_ROOT}';
  return rewritePaths(text, {
    instructions: `${base}/docs/copilot-instructions.md`,
    rules: `${base}/rules-templates/`, rule: name => `${base}/rules-templates/${name}.instructions.md`,
    workflow: name => `${base}/commands/${name}.md`, invoke: name => `/${name}`,
    agent: name => `${base}/agents/${name}.agent.md`, templates: `${base}/docs/templates/`,
    skills: `${base}/skills/`, tools: name => `${base}/tools/${name}/`, plans: '.github/plans',
  });
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
  const sources = [];
  const read = p => { sources.push(p); return fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n'); };
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
  for (const file of walk(path.join(root, 'agents')).filter(p => p.endsWith('.agent.md'))) {
    const name = path.basename(file, '.agent.md');
    const canonical = split(read(`agents/${name}.agent.md`));
    const src = canonical;
    // Translate the existing Copilot model identifier, never infer it from AL18.
    const models = { 'Claude Sonnet 4.6 (copilot)': 'claude-sonnet-4.6' };
    const model = models[canonical.data.model];
    if (!model) throw new Error(`Unmapped Copilot model: ${canonical.data.model}`);
    const data = { name, description: bodyFor(oneLine(src.data.description)), tools: toolsForRole(name), model };
    for (const field of ['user-invocable', 'disable-model-invocation']) {
      if (canonical.data[field] !== undefined) data[field] = canonical.data[field];
    }
    let body = agentBody(src.body, name);
    // Keep the host profile below the documented size limit without deleting
    // workflow steps. Reading the complete external contract is mandatory.
    if (body.length > 29000) {
      const contract = `references/agent-contracts/${name}.md`;
      put(contract, body);
      body = HOST_PREFACE + `# ${name}\n\nBefore any role action, use view to read the COMPLETE contract at\n\`\${PLUGIN_ROOT}/${contract}\`. Read all remaining ranges if the host\ntruncates a response. This is your own role contract, not a substitute agent.\nIf it cannot be read completely, report the missing contract and stop.\nDo not plan, delegate, implement or approve anything from this entry alone.\n`;
    }
    put(`agents/${name}.agent.md`, '---\n' + yaml.dump(data, { lineWidth: -1 }) + '---' + body);
  }
  // Copilot CLI exposes canonical workflows as explicitly invoked commands.
  for (const prompt of WORKFLOWS) {
    const name = workflowSkillName(prompt);
    const src = split(read(`prompts/${prompt}.prompt.md`));
    const text = src.body.replace(/^\n/, '').replace('for `${input:req_name}` (complexity `${input:Complexity}`)',
      'with the requirement, complexity and scope in `$ARGUMENTS`');
    let body = bodyFor(canonicalPaths(text));
    if (name === 'al-initialize') {
      const start = body.indexOf('## Phase 1:');
      const end = start;
      if (start < 0) throw new Error('Initialization structure changed');
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
    const data = { description: bodyFor(`${withPeriod(oneLine(src.data.description || ''))} ALDC workflow (Copilot prompt ${prompt}); invoke explicitly.`), 'disable-model-invocation': true };
    put(`commands/${name}.md`, '---\n' + yaml.dump(data, { lineWidth: -1 }) + '---' + HOST_PREFACE + body);
  }
  // Only canonical knowledge skills travel; workflows became commands above.
  for (const file of walk(path.join(root, 'skills'))) {
    const rel = path.relative(path.join(root, 'skills'), file).split(path.sep).join('/');
    if (!rel.startsWith('skill-')) continue;
    const content = knowledgeContent('skills/' + rel, read('skills/' + rel), canonicalPaths);
    // Shared contracts explicitly compare hosts; preserve their names and citations.
    const neutral = ['cli-al-tools.md', 'al18-capabilities.md'].includes(path.basename(file));
    put('skills/' + rel, neutral ? content : bodyFor(content));
  }
  for (const file of walk(path.join(root, 'instructions')).filter(p => p.endsWith('.instructions.md'))) {
    const src = split(read('instructions/' + path.basename(file)));
    const name = path.basename(file, '.instructions.md');
    const data = { applyTo: String(src.data.applyTo || '**/*.al').split(',').map(p => p.trim()).filter(Boolean).join(','),
      description: `${withPeriod(oneLine(String(src.data.description || name)))} ALDC always-on AL micro-rules (instruction ${name}); path-scoped.` };
    const body = bodyFor(canonicalPaths(src.body.replace(/^\n+/, ''))).replace(/\]\(\.\/(al-[^)]+)\.md\)/g, '](./$1.instructions.md)');
    put(`rules-templates/${name}.instructions.md`, '---\n' + yaml.dump(data, { lineWidth: -1 }) + '---' + body);
  }
  put('README.md', `# ALDC for Copilot CLI

Generated by scripts/sync-copilot-cli.js from canonical sources with explicit host
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

Read [CLI AL tooling](docs/copilot-cli-al-tooling.md) for native LSP reuse,
optional official AL MCP and Triage. Then read the shared
skills/skill-migrate/references/cli-al-tools.md for toolchain checks, BC28/BC29
scope, evidence and graph ownership. No VS Code language-model tools are bundled.
The existing community/documentation MCP servers retain their configuration.
No Claude hooks are imported; the agents retain their optional BCQuality backstop.

Role write scopes are behavioral contracts, not filesystem sandboxes. The CLI
edit capability translates Claude Write/Edit, both of which can overwrite files;
execute/Bash is also broader than a report directory. Dredd has no edit, shell or
delegation grant: it returns its complete JSON for explicit caller/human saving
with scripts/save-audit.js, which writes only a new report under .github/audits/.
Triage retains behavioral report-write limits. Host approvals remain necessary;
this package does not claim an enforced per-role filesystem boundary.

Install, update, precedence, bootstrap and validation: [Copilot CLI guide](docs/copilot-cli-plugin.md).
Legacy format is retained intentionally. All agent entry bodies stay below 29,000
characters; Conductor must load its complete bundled reference before acting.
No canonical workflow is truncated. Authenticated invocation and delegation still
need host evidence; installation and catalogs alone do not certify them.
`);
  for (const [p,b] of support('cli', root)) put(p,b);
  const { adaptInitializer } = require('./copilot-cli-bootstrap');
  put('scripts/init.js', adaptInitializer(read('scripts/init-plugin.js')));
  put('scripts/cli-bootstrap.js', read('scripts/copilot-cli-bootstrap.js'));
  put('docs/copilot-cli-plugin.md', read('docs/copilot-cli-plugin.md'));
  put('docs/copilot-cli-al-tooling.md', read('scripts/copilot-cli-al-tooling.md'));
  put('scripts/save-audit.js', read('scripts/copilot-cli-save-audit.js'));
  const { walk: paths, provenance } = require('./package-provenance');
  sources.push(...paths(root, 'tools/bcquality'), 'tools/aldc-validate/package.json', 'tools/aldc-validate/index.js', ...paths(root, 'tools/context-doctor'),
    'aldc.yaml', 'scripts/plugin-runtime.js', 'scripts/generation-utils.js', 'scripts/copilot-cli-adapter.js', 'scripts/copilot-cli-bootstrap.js',
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
module.exports = { expected, split, bodyFor, sync, agentBody, CLI_PREFACE };
