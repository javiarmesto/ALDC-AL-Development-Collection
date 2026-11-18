#!/usr/bin/env node
'use strict';
// Pilot-only projection. Canonical sources are inputs; no sibling distribution is read.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const yaml = require('js-yaml');
const { split, rewritePaths, knowledgeContent } = require('../../scripts/generation-utils');
const { checked } = require('../../scripts/install-transaction');
const ROOT = path.resolve(__dirname, '../..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const READ = ['read', 'search', 'github/*', 'microsoft-docs/*'];
const ROLE_TOOLS = {
  'al-architect': [...READ, 'edit'],
  'al-spec-agent': [...READ, 'edit'],
  'al-conductor': [...READ, 'edit', 'agent'],
  'al-developer': [...READ, 'edit', 'execute', 'agent'],
  'al-developer-reviewer': READ,
  'al-planning-subagent': READ,
  'al-implement-subagent': [...READ, 'edit', 'execute'],
  'al-review-subagent': READ,
  'al-presales': [...READ, 'edit', 'execute', 'agent'],
  'al-agent-builder': [...READ, 'edit', 'agent'],
  'al-triage': [...READ, 'edit', 'execute'],
  dredd: READ,
};
const POLICY = `# ALDC on GitHub — pilot runtime contract

Use the selected custom agent and read its complete .github/agent-contracts/<id>.md
before acting. All paths in those contracts are relative to the repository root.
Load relevant skills through the host when exposed; otherwise read their complete
.github/skills/<name>/SKILL.md and distinguish a file read from a native invocation.
Read matching .github/instructions rules explicitly and pass applicable rules and
bounded verified facts to delegated agents. Persist plan artifacts in English.

## Tools and delegation

Use only the tools actually exposed and granted to the current role. Cloud aliases
are read, search, edit, execute and agent. GitHub MCP is read-only by default.
Delegate through the native custom-agent tool using the discovered role ID; inspect
the actual schema and wait for the result. If unavailable, return the precise
handoff to the human/caller. Never impersonate another role or start a nested CLI.
VS Code APIs, Problems, editor tasks, debugger controls, model names, slash prompts
and handoff buttons are not cloud bindings. Read .github/prompts/<workflow>.prompt.md
as reference instructions; do not claim a slash command was executed.

The official Microsoft Learn MCP is configured per profile. Other symbol, AL LSP,
AL MCP and BCQuality providers must be configured and verified separately. No
provider installation or invocation is implied by reading a contract. Missing
BCQuality uses the canonical native A–G fallback, never an invented provider PASS.
Read-only roles cannot run setup, compilation or shell commands. They consume
actual recorded evidence and return missing prerequisites to an authorized caller.
Developer/Implementer may use the pinned repo-local AL tool and verified project
commands. Compilation, packaging, runtime tests and manual UI acceptance are
separate results. Missing symbols or a sandbox runner means pending, never passing.
Publishing to BC requires a separately authorized environment and operation.

## Human approvals across sessions

An issue assignment authorizes the requested task, not a future architecture,
specification, phase, commit, merge or deployment. Preserve every canonical gate.
MEDIUM/HIGH starts with architecture; stop with an architecture PR for human review.
After explicit human approval of that revision, create the specification and stop
again before implementation. Record the human, URL, reviewed commit and exact
artifact hashes. Agent-written approval flags and agent-generated comments are
not approval. A changed approved input invalidates the affected gate.

At a gate, put the bounded next action, pending questions and missing evidence in
the PR description and .github/plans/<requirement>/handoff.md, then end the session.
Resume only on the human's explicit instruction covering that revision. A delegated
role returns questions to its caller. Never approve your own work or merge a PR.
Reviewers/Dredd return their full reports; the authorized caller persists them.
Do not grant edit/shell to a read-only role just to save a report.
`;

function translate(text) {
  text = text.replace(/## Tool surface \(authoritative[^\n]*\)[\s\S]*?(?=## CAN \/ CANNOT)/,
    '## Tool surface (GitHub cloud)\n\nUse the granted cloud file/search/shell tools and only actually configured AL providers.\nRead .github/ALDC-CLOUD.md for bindings, approval gates and evidence requirements.\nThe repo-local AL compiler needs compatible symbols; runtime tests need a real BC runner.\nEditor APIs and debugger controls have no cloud binding.\n\n');
  text = rewritePaths(text, {
    instructions: '.github/copilot-instructions.md', rules: '.github/instructions/',
    rule: name => `.github/instructions/${name}.instructions.md`,
    workflow: name => `.github/prompts/${name === 'al-spec-create' ? 'al-spec.create' : name}.prompt.md`,
    invoke: name => `read the ${name} workflow and select its responsible cloud agent`,
    agent: name => `.github/agents/${name}.agent.md`, templates: '.github/docs/templates/',
    skills: '.github/skills/', tools: name => `.github/tools/${name}/`, plans: '.github/plans',
  });
  return text
    .replace(/@(?:al-[a-z-]+|dredd)\b/g, s => s.slice(1))
    .replace(/@AL Architecture & Design Specialist/g, 'al-architect')
    .replace(/@AL Implementation Specialist/g, 'al-developer')
    .replace(/@AL Development Conductor/g, 'al-conductor')
    .replace(/@workspace\s+/g, '')
    .replace(/#?runSubagent\b|\bTask tool\b|\bAgent tool\b/g, 'the native custom-agent tool')
    .replace(/#?(?:vscode\/)?askQuestions\b|\bAskUserQuestion\b/g, 'return the question at the human approval gate')
    .replace(/\bread\/readFile\b|\bread\/skill\b/g, 'read')
    .replace(/\bvscode\/[\w/]+\b/g, 'the applicable repository artifact or human handoff')
    .replace(/#?(?:ms-dynamics-smb\.al|sshadowsdk\.al-lsp-for-agents)\/[\w]+/g, 'the corresponding verified AL command/provider (unavailable until configured)')
    .replace(/\bal_(?:debug|setbreakpoint|snapshotdebugging)\b/g, 'editor debugger capability (unavailable in this cloud pilot)')
    .replace(/\bbclsp_\w+\b/g, 'configured semantic-provider operation (otherwise unavailable)')
    .replace(/\bal_(?:get_diagnostics|downloadsymbols|download_symbols|build|package|full_package|symbolsearch|symbolrelations)\b/g, 'the corresponding verified AL command/provider')
    .replace(/#?\bal_[a-z]\w*\b/g, 'the corresponding AL provider operation (return a prerequisite if unavailable)')
    .replace(/\bmcp_[\w-]+(?:\/[\w-]+)?\b/g, 'the corresponding configured MCP capability (inspect its actual schema)')
    .replace(/\b(?:create_directory|create_file)\b/g, 'the granted edit capability')
    .replace(/\b(?:search_code|search_repositories)\b/g, 'the available GitHub repository read capability')
    .replace(/\b(?:microsoft_docs_search|microsoft_docs_fetch)\b/g, 'the available Microsoft Learn capability')
    .replace(/\b(?:resolve-library-id|get-library-docs)\b/g, 'a separately configured Context7 capability')
    .replace(/\bwebsearch\b/g, 'available source-backed documentation search')
    .replace(/AL: Download Symbols/g, 'restore symbols through the authorized project command (no editor command binding)')
    .replace(/#(?:problems|testFailure)\b|\bread\/problems\b/g, 'actual recorded compiler/test output')
    .replace(/\b(read|edit|search|execute)\/[a-zA-Z]+\b/g, '$1')
    .replace(/vscode\.mermaid-chat-features\/renderMermaidDiagram/g, 'write a Mermaid diagram in the architecture document')
    .replace(/#(?:todos|todo)\b/g, 'persisted plan progress')
    .replace(/#(?:usages|search|codebase|changes|githubRepo)\b/g, 'available repository search/evidence')
    .replace(/\bweb\/githubTextSearch\b/g, 'available GitHub repository search')
    .replace(/\bexecute\/runInTerminal\b|\brunInTerminal\b/g, 'the granted shell tool')
    .replace(/\bupstash\/context7\//g, 'context7/')
    .replace(/\bmicrosoft-learn\//g, 'microsoft-docs/')
    .replace(/\$\{(?:CLAUDE_PLUGIN_ROOT|PLUGIN_ROOT)\}/g, '.github')
    .replace(/\$\{CLAUDE_PROJECT_DIR\}/g, '.')
    .replace(/\$\{input:([A-Za-z_][\w]*)\}/g, '<$1 from the GitHub task>');
}

function dreddPersistence(body) {
  // Keep the canonical report schema while removing the editor-only persistence grant.
  return body
    .replace(/Your `edit` tool is used for \*\*one thing only\*\*:[^\n]+/, 'You have no edit, shell or delegation grant. Return the full audit JSON; an authorized caller persists it.')
    .replace(/^1\. If the user forbids writes,[^\n]+/m, '1. Return the complete Audit-Report JSON verbatim. State persistence pending, or skipped when forbidden. The authorized caller may save it under .github/audits; Dredd never writes files.')
    .replace(/The path of the persisted report, and the full `### Audit-Report \(JSON\)` block\./, 'The pending/skipped persistence status, an actual path only when a save receipt is supplied, and the full `### Audit-Report (JSON)` block.')
    .replace(/3\. Close the reporting task once the report is delivered \(persisted when allowed\)\./, '3. Close reporting after returning the full JSON; keep audit coverage and persistence status separate.');
}

function architectureApproval(body) {
  const anchor = /## 🚨 Critical: Automatic Architecture Document Creation[\s\S]*?(?=## Tool Boundaries)/;
  if (!anchor.test(body)) throw Error('Architect approval anchor changed; review the cloud interaction');
  return body
    .replace(/- \*\*Documentation-Driven\*\*:[^\n]+/, '- **Documentation-Driven**: Copy the architecture template to a concrete Proposed artifact and open a draft PR for approval. Never edit templates or approve your own proposal.')
    .replace(anchor, `## GitHub architecture proposal and human approval\n\nThe authorized architecture task permits a draft artifact before approval.\nDerive the requirement ID from the issue (customer-review for this pilot), copy\nthe architecture template, and persist a complete Proposed architecture in a\ndraft PR. Record assumptions, alternatives, sources and missing symbol evidence.\nPreserve existing work; propose an explicit revision when an artifact already exists.\nAppend actual observations to memory and request review of the exact artifact hash\nand commit. End the session at that gate. Only a subsequent explicit human approval\nof that revision allows specification work; the agent never changes Proposed to\nApproved on its own. Issue assignment does not approve the architecture.\n\n`)
    .replace('1. Present design options, discuss trade-offs, get user approval.', '1. Persist the Proposed design and alternatives in a draft PR so the human can review a concrete artifact.')
    .replace(/2\. \*\*AUTOMATIC after approval\*\*:[^\n]+/, '2. End the session for human approval of the proposed revision. Apply the GitHub architecture proposal and human approval procedure above; specification remains gated.');
}

function projectFiles(sourceRoot = ROOT) {
  const files = new Map(), sources = {};
  const read = rel => {
    const bytes = fs.readFileSync(checked(sourceRoot, rel));
    sources[rel] = sha(bytes);
    return bytes;
  };
  const put = (rel, content) => {
    if (files.has(rel)) throw Error(`Duplicate output: ${rel}`);
    files.set(rel, Buffer.from(content));
  };
  const copyTree = (from, to, transform = b => b) => {
    for (const entry of fs.readdirSync(path.join(sourceRoot, from), { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name, 'en'))) {
      if (['node_modules', '__pycache__', '.git', '.DS_Store'].includes(entry.name) || /\.py[co]$/.test(entry.name)) continue;
      if (entry.isSymbolicLink()) throw Error(`Symlink source: ${from}/${entry.name}`);
      const rel = `${from}/${entry.name}`, dest = `${to}/${entry.name}`;
      if (entry.isDirectory()) copyTree(rel, dest, transform);
      else put(dest, transform(read(rel), rel));
    }
  };
  // Provenance includes the generator and shared helpers, not generated siblings.
  for (const rel of ['tools/github-pilot/project.js', 'scripts/generation-utils.js', 'scripts/install-transaction.js']) read(rel);
  for (const entry of fs.readdirSync(path.join(sourceRoot, 'agents')).filter(n => n.endsWith('.agent.md')).sort()) {
    const id = entry.slice(0, -'.agent.md'.length);
    if (!Object.hasOwn(ROLE_TOOLS, id)) throw Error(`Unmapped GitHub cloud role: ${id}`);
    const { data, body } = split(read(`agents/${entry}`).toString('utf8'));
    const adapted = id === 'dredd' ? dreddPersistence(body) : id === 'al-architect' ? architectureApproval(body) : body;
    const contract = translate(adapted);
    put(`.github/agent-contracts/${id}.md`, `> Generated GitHub cloud contract. Read .github/ALDC-CLOUD.md first.\n${contract}`);
    const fm = { name: data.name || id, description: data.description, target: 'github-copilot', tools: [...ROLE_TOOLS[id]],
      'mcp-servers': { 'microsoft-docs': { type: 'http', url: 'https://learn.microsoft.com/api/mcp', tools: ['*'] } } };
    if (['al-planning-subagent', 'al-implement-subagent', 'al-review-subagent'].includes(id)) fm['user-invocable'] = false;
    const profile = `---\n${yaml.dump(fm, { lineWidth: -1 })}---\n\nRead .github/ALDC-CLOUD.md and the COMPLETE .github/agent-contracts/${id}.md before acting.\nThe referenced canonical contract defines this role's duties, output and human gates.\nRead applicable .github/instructions and domain skills; report actual tool/provider evidence.\nReturn unavailable tools, delegation or approval as a bounded handoff; never simulate them.\n`;
    if (profile.length >= 30000) throw Error(`GitHub profile exceeds limit: ${id}`);
    put(`.github/agents/${entry}`, profile);
  }
  copyTree('skills', '.github/skills', (bytes, rel) => {
    const text = bytes.toString('utf8').replace(/\r\n/g, '\n');
    return Buffer.from(['cli-al-tools.md', 'al18-capabilities.md'].includes(path.basename(rel)) ? translate(text) : knowledgeContent(rel, text, translate));
  });
  copyTree('instructions', '.github/instructions', bytes => Buffer.from(translate(bytes.toString('utf8'))));
  copyTree('prompts', '.github/prompts', (bytes, rel) => {
    if (!rel.endsWith('.prompt.md')) return Buffer.from(translate(bytes.toString('utf8')));
    const { data, body } = split(bytes.toString('utf8'));
    return Buffer.from(`---\n${yaml.dump({ description: data.description }, { lineWidth: -1 })}---\n\n> Reference workflow for GitHub cloud; select its responsible agent explicitly.\n${translate(body)}`);
  });
  copyTree('docs/templates', '.github/docs/templates', bytes => Buffer.from(translate(bytes.toString('utf8'))));
  copyTree('docs/framework', '.github/docs/framework');
  copyTree('docs/schema', '.github/docs/schema');
  for (const tool of ['context-doctor', 'aldc-validate', 'bcquality']) copyTree(`tools/${tool}`, `.github/tools/${tool}`);
  // Validator/shared readers use these relative paths in the normal installed layout.
  for (const file of ['plans-root.js', 'read-yaml.js']) {
    const rel = `scripts/${file}`;
    if (fs.existsSync(path.join(sourceRoot, rel))) put(`.github/scripts/${file}`, read(rel));
  }
  const config = yaml.load(read('aldc.yaml').toString('utf8'));
  config.toolkitRoot = '.github';
  config.solution = { workspaceFile: 'directions.code-workspace', roots: { application: 'App', test: 'Test' } };
  config.external.bcquality.mode = 'external-multiroot';
  config.external.bcquality.home = '.bcquality';
  config.external.bcquality.enabled = false;
  config.copilotEntrypointMode = 'mirror';
  put('aldc.yaml', yaml.dump(config, { lineWidth: -1, noRefs: true }));
  files.set('.github/instructions/copilot-instructions.md', Buffer.from(POLICY));
  put('.github/copilot-instructions.md', POLICY);
  put('.github/ALDC-CLOUD.md', POLICY);
  const lock = { schema: 1, surface: 'github-copilot', sourceVersion: JSON.parse(read('package.json')).version,
    sources: Object.fromEntries(Object.entries(sources).sort()),
    outputs: Object.fromEntries([...files].sort(([a],[b]) => a.localeCompare(b, 'en')).map(([p,b]) => [p, sha(b)])) };
  put('.github/aldc-cloud-lock.json', JSON.stringify(lock, null, 2) + '\n');
  return files;
}

function install({ sourceRoot = ROOT, destination, apply = false }) {
  if (!destination) throw Error('A destination is required');
  destination = path.resolve(destination);
  const files = projectFiles(sourceRoot), pending = [];
  for (const [rel, bytes] of files) {
    const output = checked(destination, rel);
    if (fs.existsSync(output)) {
      if (!fs.readFileSync(output).equals(bytes)) throw Error(`Destination collision: ${rel}`);
    } else pending.push([output, bytes]);
  }
  if (apply) for (const [output, bytes] of pending) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, bytes, { flag: 'wx' });
  }
  return { files: files.size, changed: pending.length, applied: apply };
}
module.exports = { projectFiles, translate, install };
if (require.main === module) {
  try {
    const args = process.argv.slice(2), index = args.indexOf('--destination');
    if (index < 0 || !args[index + 1] || args.some((a,i) => a !== '--apply' && a !== '--destination' && i !== index + 1)) throw Error('Usage: node tools/github-pilot/project.js --destination <folder> [--apply]');
    process.stdout.write(JSON.stringify(install({ destination: args[index + 1], apply: args.includes('--apply') })) + '\n');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
