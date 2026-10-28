'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const yaml = require('js-yaml');
const ROOT = path.resolve(__dirname, '../..');
const PROJECTOR = path.join(__dirname, 'project.js');
function api() {
  assert.ok(fs.existsSync(PROJECTOR), 'GitHub cloud projection is not implemented');
  return require(PROJECTOR);
}
function temp(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-cloud-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function frontmatter(bytes) {
  const match = bytes.toString().match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, 'profile has YAML frontmatter');
  return yaml.load(match[1]);
}

test('canonical projection emits discoverable profiles with cloud grants and complete long contracts', () => {
  const files = api().projectFiles(ROOT);
  const profiles = [...files.keys()].filter(p => p.startsWith('.github/agents/'));
  assert.equal(profiles.length, 12);
  for (const name of profiles) {
    const bytes = files.get(name);
    const fm = frontmatter(bytes);
    assert.equal(fm.target, 'github-copilot');
    assert.equal(fm.model, undefined);
    assert.equal(fm.handoffs, undefined);
    assert.ok(bytes.toString().length < 30000, name);
    for (const tool of fm.tools) {
      assert.ok(['read', 'search', 'edit', 'execute', 'agent', 'github/*', 'microsoft-docs/*'].includes(tool), `${name}: ${tool}`);
    }
    const id = path.basename(name, '.agent.md');
    assert.ok(files.has(`.github/agent-contracts/${id}.md`));
  }
  assert.ok(files.get('.github/agent-contracts/al-conductor.md').length > 30000, 'retain the complete long contract outside the profile');
  for (const id of ['al-review-subagent', 'al-developer-reviewer', 'al-planning-subagent', 'dredd']) {
    const fm = frontmatter(files.get(`.github/agents/${id}.agent.md`));
    for (const grant of ['edit', 'execute', 'agent']) assert.ok(!fm.tools.includes(grant), `${id}: ${grant}`);
  }
  const spec = frontmatter(files.get('.github/agents/al-spec-agent.agent.md'));
  assert.ok(spec.tools.includes('edit'));
  assert.ok(!spec.tools.includes('execute'));
  assert.ok(!spec.tools.includes('agent'));
  for (const id of ['al-planning-subagent', 'al-implement-subagent', 'al-review-subagent']) {
    assert.equal(frontmatter(files.get(`.github/agents/${id}.agent.md`))['user-invocable'], false);
  }
  assert.equal(frontmatter(files.get('.github/agents/al-conductor.agent.md')).tools.includes('agent'), true);
});

test('cloud translation maps executable editor calls and routes to root-relative resources', () => {
  const translated = api().translate('#runSubagent vscode/askQuestions read/readFile ms-dynamics-smb.al/al_build ../docs/templates/plan-template.md ../agents/al-conductor.agent.md al_debug bclsp_findReferences edit/createFile');
  assert.ok(!translated.includes('#runSubagent'));
  assert.ok(!translated.includes('vscode/'));
  assert.ok(!translated.includes('ms-dynamics-smb.al/'));
  assert.ok(translated.includes('.github/docs/templates/plan-template.md'));
  assert.ok(translated.includes('.github/agents/al-conductor.agent.md'));
  assert.ok(!translated.includes('al_debug'));
  assert.ok(!translated.includes('bclsp_findReferences'));
  assert.ok(!translated.includes('edit/createFile'));
});

test('generation is deterministic and provenance binds actual canonical inputs and output bytes', () => {
  const first = api().projectFiles(ROOT), second = api().projectFiles(ROOT);
  assert.deepEqual([...first], [...second]);
  const lock = JSON.parse(first.get('.github/aldc-cloud-lock.json'));
  assert.equal(lock.surface, 'github-copilot');
  assert.ok(lock.sources['agents/al-conductor.agent.md']);
  assert.ok(lock.sources['tools/github-pilot/project.js']);
  assert.ok(lock.outputs['.github/agents/al-conductor.agent.md']);
  for (const p of Object.keys(lock.sources)) {
    assert.ok(!p.startsWith('claude-plugin/') && !p.startsWith('copilot-cli-plugin/') && !p.startsWith('plugins/'));
  }
  for (const p of ['.github/docs/templates/spec-template.md', '.github/skills/skill-api/SKILL.md', '.github/prompts/al-spec.create.prompt.md', '.github/tools/aldc-validate/index.js', 'aldc.yaml']) assert.ok(first.has(p), p);
});

test('all projected executable references drop editor-only and unconfigured concrete call identities', () => {
  const forbidden = /\b(?:al_[a-z]\w*|bclsp_\w+|mcp_[\w-]+(?:\/[\w-]+)?|create_directory|create_file|websearch)\b|AL: Download Symbols|After user approval, COPY/;
  for (const [name, bytes] of api().projectFiles(ROOT)) {
    if (!name.endsWith('.md') || !['.github/agent-contracts/', '.github/skills/', '.github/prompts/'].some(prefix => name.startsWith(prefix))) continue;
    assert.equal(bytes.toString('utf8').match(forbidden)?.[0], undefined, `${name}: incompatible call identity`);
  }
});

test('preview writes nothing, apply is idempotent, and collision preflight prevents partial writes', t => {
  const destination = temp(t);
  const before = fs.readdirSync(destination);
  const preview = api().install({ sourceRoot: ROOT, destination });
  assert.equal(preview.applied, false);
  assert.deepEqual(fs.readdirSync(destination), before);
  api().install({ sourceRoot: ROOT, destination, apply: true });
  assert.equal(api().install({ sourceRoot: ROOT, destination, apply: true }).changed, 0);
  const changed = path.join(destination, '.github/agents/al-architect.agent.md');
  fs.writeFileSync(changed, 'My custom agent');
  const other = path.join(destination, '.github/agents/al-developer.agent.md');
  fs.unlinkSync(other);
  assert.throws(() => api().install({ sourceRoot: ROOT, destination, apply: true }), /collision/i);
  assert.equal(fs.readFileSync(changed, 'utf8'), 'My custom agent');
  assert.equal(fs.existsSync(other), false, 'nothing is installed before all collisions are checked');
});

test('output directory symlinks are refused before writes', t => {
  const root = temp(t), outside = temp(t);
  fs.symlinkSync(outside, path.join(root, '.github'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => api().install({ sourceRoot: ROOT, destination: root, apply: true }), /symlink|regular path/i);
  assert.deepEqual(fs.readdirSync(outside), []);
});
