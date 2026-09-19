#!/usr/bin/env node
'use strict';
/**
 * ALDC — Claude Code plugin generator.
 *
 * `claude-plugin/` is a DERIVED VIEW of the canonical trees at the repository
 * root (agents/, prompts/, skills/, instructions/, docs/templates/, tools/,
 * aldc.yaml, plugin.json). Nothing under `claude-plugin/` is written by hand:
 * this generator emits every file, and `--check` fails on drift or on an
 * orphan the generator no longer produces.
 *
 * The adapter may change exactly four things:
 *   1. frontmatter — the host schema, plus the permission surface frozen in
 *      AGENTS below (tools/model/color are host facts, not canonical);
 *   2. paths — the Copilot deployment layout rewritten to the plugin layout;
 *   3. tool vocabulary — Copilot surfaces named as their Claude Code equivalent;
 *   4. the binding Copilot -> Claude Code mapping preamble.
 * Everything else in a contract travels verbatim. A change that does not fit in
 * those four is a canonical change, not an adapter change.
 *
 *   node scripts/sync-plugin-support.js          # write claude-plugin/
 *   node scripts/sync-plugin-support.js --check  # fail on drift (CI)
 *
 * Primitive mapping (GitHub Copilot -> Claude Code plugin):
 *   agents/<id>.agent.md        -> agents/<id>.md        (roles and subagents)
 *   agents/<id>.agent.md        -> skills/<role>/SKILL.md (short entry skill)
 *   prompts/<wf>.prompt.md      -> skills/<wf>/SKILL.md   (disable-model-invocation)
 *   instructions/<r>.instructions.md -> rules/<r>.md      (applyTo -> paths)
 *   skills/<name>/**            -> skills/<name>/**
 *   docs/templates/, tools/, scripts/ -> docs/templates/, tools/, scripts/
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const { walk, provenance, normalized } = require('./package-provenance');
const root = path.resolve(__dirname, '..');
const { split, WORKFLOWS, workflowSkillName } = require('./generation-utils');
const { support, projectGuidance, plansRootFor, auditsRootFor } = require('./plugin-runtime');

const PLUGIN = 'aldc';
const DEST = 'claude-plugin';

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

/**
 * Every ALDC agent, with the host permission surface the plugin declares.
 *
 * `tools`, `model` and `color` are NOT derivable from the canonical contract:
 * the canonical declares Copilot tool identifiers and a Copilot model name.
 * These values are the Claude Code host surface, frozen from the plugin files
 * they were maintained in, and they are the plugin's own permission boundary —
 * never widen one to make a body compile.
 *
 * No `maxTurns`: a turn cap is a budget, not a contract, and the hand-written
 * plugin's caps (50 for a role, 30 for a subagent) were never canonical. A
 * contract that stops mid-gate because it ran out of turns is worse than one
 * that runs long, so the plugin declares none.
 *
 * `mode` selects the adapter preamble: `main` roles run in the main session and
 * own the human gates; `subagent` roles are launched stateless by the Conductor.
 */
const MCP_ALL = 'mcp__al-symbols-mcp__*, mcp__plugin_aldc_al-symbols-mcp__*, mcp__context7__*, mcp__plugin_aldc_context7__*, mcp__microsoft-docs__*, mcp__plugin_aldc_microsoft-docs__*';
// Optional user/project server alias `al`; no server is installed by this adapter.
const AL_QUERY = ['al_symbolsearch', 'al_getdiagnostics', 'al_getpackagedependencies']
  .map(name => `mcp__al__${name}`).join(', ');
const AL_IMPLEMENT = ['al_compile', 'al_build', 'al_downloadsymbols']
  .map(name => `mcp__al__${name}`).join(', ');
const READ_ONLY = `Read, Glob, Grep, LSP, ${MCP_ALL}, ${AL_QUERY}`;
const FULL = `Read, Glob, Grep, LSP, Write, Edit, Bash, Task, WebSearch, WebFetch, ${MCP_ALL}, ${AL_QUERY}`;

const AGENTS = [
  { id: 'al-agent-builder', mode: 'main', model: 'sonnet', color: 'cyan', tools: `Read, Glob, Grep, LSP, Write, Edit, Bash, Task, ${MCP_ALL}, ${AL_QUERY}` },
  { id: 'al-architect', mode: 'main', model: 'sonnet', color: 'blue', tools: FULL },
  { id: 'al-conductor', mode: 'main', model: 'haiku', color: 'purple', tools: 'Read, Glob, Grep, Write, Edit, Bash, Task, WebSearch, WebFetch' },
  { id: 'al-developer', mode: 'main', model: 'sonnet', color: 'green', tools: `${FULL}, ${AL_IMPLEMENT}` },
  { id: 'al-developer-reviewer', mode: 'main', model: 'sonnet', color: 'yellow', tools: READ_ONLY },
  { id: 'al-implement-subagent', mode: 'subagent', model: 'sonnet', color: 'yellow', tools: `Read, Glob, Grep, LSP, Write, Edit, Bash, Task, ${MCP_ALL}, ${AL_QUERY}, ${AL_IMPLEMENT}` },
  { id: 'al-planning-subagent', mode: 'subagent', model: 'sonnet', color: 'yellow', tools: `${READ_ONLY}, WebSearch, WebFetch` },
  { id: 'al-presales', mode: 'main', model: 'sonnet', color: 'red', tools: FULL },
  { id: 'al-review-subagent', mode: 'subagent', model: 'sonnet', color: 'yellow', tools: READ_ONLY },
  { id: 'al-spec-agent', mode: 'main', model: 'sonnet', color: 'cyan', tools: `Read, Glob, Grep, LSP, Write, Edit, WebSearch, WebFetch, ${MCP_ALL}, ${AL_QUERY}` },
  { id: 'al-triage', mode: 'main', model: 'sonnet', color: 'orange', tools: `Read, Glob, Grep, LSP, Bash, Write, Task, ${MCP_ALL}, ${AL_QUERY}, mcp__bc-profiling__*, mcp__bc-snapshot__*` },
  { id: 'dredd', mode: 'auditor', model: 'sonnet', color: 'yellow', tools: `${READ_ONLY}, Write` },
];

/**
 * Short role entry skills — the Claude Code equivalent of "switch to @agent".
 * One per user-invocable role; the canonical `user-invocable: false` subagents
 * deliberately get none, because their contract says only the Conductor may
 * launch them and a slash command would contradict it.
 */
const ENTRY_SKILLS = [
  { name: 'architect', agent: 'al-architect' },
  { name: 'spec', agent: 'al-spec-agent' },
  { name: 'conduct', agent: 'al-conductor' },
  { name: 'develop', agent: 'al-developer' },
  { name: 'review', agent: 'al-developer-reviewer' },
  { name: 'triage', agent: 'al-triage' },
  { name: 'presales', agent: 'al-presales' },
  { name: 'agent-builder', agent: 'al-agent-builder' },
  { name: 'audit', agent: 'dredd' },
];

/** Runtime helpers shipped verbatim; `tools/` layout is preserved. */
const RUNTIME_FILES = [
  'tools/context-doctor/aldc_context_doctor.py',
  'tools/context-doctor/README.md',
  'tools/bcquality/precondition_hook.sh',
  'tools/bcquality/precondition_hook.ps1',
  'tools/bcquality/config.js',
  'tools/bcquality/index-state.js',
  'tools/bcquality/validate_evidence.py',
  'tools/bcquality/install.sh',
  'tools/bcquality/install.ps1',
  'tools/aldc-validate/package.json',
  'tools/aldc-validate/index.js',
];

/** Plugin-root hooks: canonical assets under tools/claude-hooks/, copied verbatim. */
const HOOK_FILES = [
  ['tools/claude-hooks/hooks.json', 'hooks/hooks.json'],
  ['tools/claude-hooks/session-context.js', 'hooks/session-context.js'],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const yamlString = (value) => JSON.stringify(value);
const withPeriod = (text) => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);
const oneLine = (text) => text.replace(/\s*\n\s*/g, ' ').trim();

/**
 * Path rewrites from the Copilot deployment layout to the plugin layout.
 * Order matters: specific rules first.
 */
const PLANS_ROOT_TOKEN = '__ALDC_PLANS_ROOT__';
const PLUGIN_ROOT = '${CLAUDE_PLUGIN_ROOT}';
// A deployment path may be written from the repository root (`.github/agents/…`),
// relative to a sibling tree (`../../docs/templates/…`) or bare. `OPT` accepts any
// of the three; `REQ` demands a prefix for the folder names that are ambiguous on
// their own — a bare `skills/entry.md` is BCQuality's corpus, not an ALDC skill.
const OPT = '(?:(?:\\.{1,2}\\/)+)?(?:\\.github\\/)?';
const REQ = '(?:(?:\\.{1,2}\\/)+|\\.github\\/)';
const START = '(?<![\\w-])';
const re = (body) => new RegExp(START + body, 'g');
const PATH_REWRITES = [
  [re(`${OPT}instructions\\/copilot-instructions\\.md`), `${PLUGIN_ROOT}/docs/copilot-instructions.md`],
  [re(`${OPT}instructions\\/([a-z*-]+)\\.instructions\\.md`), `${PLUGIN_ROOT}/rules/$1.md`],
  [re(`${REQ}instructions\\/`), `${PLUGIN_ROOT}/rules/`],
  [re(`${OPT}prompts\\/([a-z.-]+)\\.prompt\\.md`), (_, name) => `${PLUGIN_ROOT}/skills/${workflowSkillName(name)}/SKILL.md`],
  [/@workspace use ([a-z][a-z.-]*[a-z])/g, (_, name) => `/${PLUGIN}:${workflowSkillName(name)}`],
  [re(`${OPT}agents\\/([a-z-]+)\\.agent\\.md`), `${PLUGIN_ROOT}/agents/$1.md`],
  [re(`${OPT}docs\\/templates\\/`), `${PLUGIN_ROOT}/docs/templates/`],
  [re(`${REQ}skills\\/`), `${PLUGIN_ROOT}/skills/`],
  [re(`${OPT}tools\\/(context-doctor|bcquality|aldc-validate)\\/`), `${PLUGIN_ROOT}/tools/$1/`],
  [/\.github\/plans/g, PLANS_ROOT_TOKEN],
  // `${input:Name}` prompt variables are supplied through $ARGUMENTS.
  [/\$\{input:([A-Za-z_][\w]*)\}/g, '<$1 from $ARGUMENTS>'],
];

function rewritePaths(text, plansRoot) {
  let out = text;
  for (const [pattern, replacement] of PATH_REWRITES) out = out.replace(pattern, replacement);
  return out
    .replace(/(\$\{CLAUDE_PLUGIN_ROOT\}\/)+/g, '${CLAUDE_PLUGIN_ROOT}/')
    .split(PLANS_ROOT_TOKEN).join(plansRoot);
}

// ---------------------------------------------------------------------------
// Adapter preamble — the binding Copilot -> Claude Code mapping
// ---------------------------------------------------------------------------

function mappingTable(plansRoot) {
  const roles = ENTRY_SKILLS.map((e) => `\`/${PLUGIN}:${e.name}\``).join(', ');
  const mentions = ENTRY_SKILLS.map((e) => `\`@${e.agent}\``).join(', ');
  return `> | Copilot surface in the contract | Claude Code equivalent |
> | --- | --- |
> | \`#runSubagent\` / \`runSubagent\` / \`agents:\` | The \`Task\` tool with \`subagent_type: "${PLUGIN}:<agent>"\`; one invocation carries everything inline (subagents are stateless) |
> | \`#askQuestions\` / \`vscode/askQuestions\` | \`AskUserQuestion\` (main session only; a subagent returns its questions in its structured output) |
> | \`handoffs:\` entries, and \`send: false\` on one | **No equivalent — the gate is yours to keep.** In Copilot a handoff is a button the human clicks, and \`send: false\` additionally hands them the prompt to review before it is sent; the host supplies the approval. Claude Code delegates through the \`Task\` tool, with no click and no review step. So never auto-delegate: present your output, get explicit approval, and only then delegate or route to another role. The handoff's routing is carried by the plugin's role entry skills; its human gate is carried by this rule |
> | ${mentions} | ${roles} (or \`claude --agent ${PLUGIN}:<agent>\`) |
> | \`@workspace use <workflow>\` | \`/${PLUGIN}:<workflow>\` with dots replaced by dashes (\`al-spec.create\` -> \`/${PLUGIN}:al-spec-create\`); already rewritten below |
> | \`\${input:Name}\` prompt variables | Take the value from \`$ARGUMENTS\`; ask through \`AskUserQuestion\` when missing. Already rewritten below as \`<Name from $ARGUMENTS>\` |
> | \`execute\` / \`runInTerminal\`, AL compilation or symbol restore | Developer/Implementer: discovered official AL MCP \`mcp__al__al_compile\` / \`mcp__al__al_build\` / \`mcp__al__al_downloadsymbols\`, or an installed ALTool/AL-Go runner through \`Bash\`. Use the correct App/Test project; unavailable capabilities are never simulated. Publishing retains its separate human/CI gate and is not granted by this adapter |
> | \`edit\`, \`read/readFile\`, \`search\`, \`#codebase\` | \`Edit\`/\`Write\`, \`Read\`, \`Grep\`/\`Glob\` |
> | \`#changes\`, \`changes\`, \`search/changes\` | Read-only \`git status\` / \`git diff\` through \`Bash\` only where granted; otherwise read the caller-supplied diff artifact or return the missing evidence request |
> | \`read/problems\`, \`al_get_diagnostics\`, \`#testFailure\` | Discovered \`mcp__al__al_getdiagnostics\` for the explicit project, or actual compiler/test output. Diagnostics are not evidence of a fresh compile or executed tests. No result: record \`not-run\` / \`unavailable\` |
> | \`al-symbols-mcp/*\`, \`upstash/context7/*\`, \`microsoft-learn/*\`, \`microsoft-docs/*\` | Tools named \`mcp__al-symbols-mcp__*\`, \`mcp__context7__*\`, \`mcp__microsoft-docs__*\` (or the \`mcp__plugin_${PLUGIN}_…\` form). A server that is not loaded is \`unavailable\`; do not simulate it |
> | \`sshadowsdk.al-lsp-for-agents/*\`, \`#usages\`, semantic definition/reference queries | Claude \`LSP\` with the existing AL LSP for Agents companion; discover the actual operations and project context first. VS Code tool identifiers are not Claude tool names |
> | \`ms-dynamics-smb.al/*\`, \`vscode.mermaid-chat-features/*\` | VS Code tool identifiers do not exist here. Use only a separately discovered Claude capability; never rename community tools as Microsoft tools |
> | \`vscode/memory\`, \`vscode/*\` | Not available; keep state in the canonical \`${plansRoot}/\` artifacts of the project |
> | \`todo\` | \`TodoWrite\` for in-session tracking; durable state stays in \`${plansRoot}/\` |
> | "load \`skill-x\`" | The \`Skill\` tool (\`${PLUGIN}:<skill-name>\`) or read \`\${CLAUDE_PLUGIN_ROOT}/skills/<skill-name>/SKILL.md\` |
> | \`.github/instructions/*.instructions.md\` (\`applyTo\`) | \`\${CLAUDE_PLUGIN_ROOT}/rules/*.md\` (\`paths:\`); \`/${PLUGIN}:al-initialize\` copies them to the project's \`.claude/rules/\` for auto-apply in the main session; inject inline for subagents exactly as the contract says |
> | \`.github/skills/\`, \`.github/plans/…\`, \`docs/templates/\` | \`\${CLAUDE_PLUGIN_ROOT}/skills/\`, \`${plansRoot}/…\` (project-owned, \`aldc.yaml -> plans.root\`), \`\${CLAUDE_PLUGIN_ROOT}/docs/templates/\`; already rewritten below |
> | \`python …\` runtime helpers, \`--aldc-root\` | Paths already point at \`\${CLAUDE_PLUGIN_ROOT}\`; use \`python\` or \`python3\`, whichever exists (stdlib only) |
> | \`aldc.yaml\` | \`\${CLAUDE_PROJECT_DIR}/aldc.yaml\` when the project has one, otherwise \`\${CLAUDE_PLUGIN_ROOT}/aldc.yaml\` |`;
}

const HOST_CONTRACT = 'Read `${CLAUDE_PLUGIN_ROOT}/docs/claude-al-tooling.md` for this surface’s LSP/MCP bindings, then `${CLAUDE_PLUGIN_ROOT}/skills/skill-migrate/references/cli-al-tools.md` for the shared role/evidence contract. The Claude guide supersedes older capability-availability examples, never role responsibilities or human gates.';

function provenanceLine(sourceRel, sourceHash) {
  return `> **Claude Code adapter — generated by \`scripts/sync-plugin-support.js\`, do not edit.**
> Canonical source: \`${sourceRel}\` (sha256 \`${sourceHash}\`).`;
}

function adapterPreamble(agent, sourceRel, sourceHash, plansRoot) {
  const shared = `${provenanceLine(sourceRel, sourceHash)}
> The contract below was written for GitHub Copilot Chat. In Claude Code apply
> these harness mappings and treat everything else as binding:
>
${mappingTable(plansRoot)}
>
> ${HOST_CONTRACT}
> The Copilot \`tools:\`/\`model:\`/\`agents:\` declarations of the source are superseded
> by this file's frontmatter when the host loads this agent definition. Reading
> this file through a role entry skill does not apply its tool allowlist. The routing in \`handoffs:\` is carried by the plugin's
> role entry skills and the human gate it relied on by the mapping row above.
> Triage alone receives the optional dedicated \`bc-profiling\` and \`bc-snapshot\`
> proxies. Read the Claude tooling guide before capture; use discovered schemas
> and an authorized target/window. Other roles consume the resulting evidence.
> Role write scopes are behavioral limits, not filesystem sandboxes. Human gates,
> evidence semantics and the "never simulate a capability" rule do not change
> with the harness.`;

  if (agent.mode === 'subagent') {
    return `${shared}
>
> **You run as a stateless Claude Code subagent.** There is no follow-up turn and
> no user: never ask questions, never wait, return the structured output the
> contract defines and stop.`;
  }
  if (agent.mode === 'auditor') {
    return `${shared}
>
> **You run as an independent auditor.** Build your own bounded context from the
> current repository state and the scope you were given; ignore prior agent
> conclusions unless the user explicitly hands them to you.`;
  }
  return `${shared}
>
> **You run in the main Claude Code session.** Approval Gates use
> \`AskUserQuestion\`; delegation uses the \`Task\` tool with the plugin's
> subagents. Ambiguous acknowledgements never advance a gate.`;
}

function workflowPreamble(sourceRel, sourceHash, plansRoot) {
  return `${provenanceLine(sourceRel, sourceHash)}
> This workflow was written for \`@workspace use …\` in GitHub Copilot Chat.
> Apply these harness mappings and treat everything else as binding:
>
${mappingTable(plansRoot)}
>
> ${HOST_CONTRACT}`;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function builder(rootDir, files, sources, modes) {
  const readSource = (rel) => {
    const raw = normalized(fs.readFileSync(path.join(rootDir, rel)));
    sources.add(rel);
    return raw;
  };
  const put = (rel, content) => {
    if (files.has(rel)) throw Error(`Duplicate plugin output: ${rel}`);
    files.set(rel, typeof content === 'string' ? content : content.toString('utf8'));
  };
  // A shipped script keeps the mode of its canonical source: the BCQuality and
  // install hooks are executable, and a copy that is not stops being runnable.
  const copy = (sourceRel, destRel = sourceRel) => {
    put(destRel, readSource(sourceRel));
    if (fs.statSync(path.join(rootDir, sourceRel)).mode & 0o111) modes.set(destRel, 0o755);
  };
  return { readSource, put, copy };
}

function buildAgent(agent, ctx, plansRoot) {
  const sourceRel = `agents/${agent.id}.agent.md`;
  const raw = ctx.readSource(sourceRel);
  const hash = sha256(raw);
  const { data, body } = split(raw.toString('utf8'));
  const fm = {
    name: agent.id,
    description: oneLine(data.description || ''),
    tools: agent.tools,
    model: agent.model,
    color: agent.color,
  };
  ctx.put(`agents/${agent.id}.md`,
    `---\n${yaml.dump(fm, { lineWidth: -1 })}---\n\n${adapterPreamble(agent, sourceRel, hash, plansRoot)}\n${rewritePaths(body, plansRoot)}`);
}

function buildEntrySkill(entry, ctx, plansRoot) {
  const sourceRel = `agents/${entry.agent}.agent.md`;
  const raw = ctx.readSource(sourceRel);
  const { data } = split(raw.toString('utf8'));
  const fm = { name: entry.name, description: oneLine(data.description || '') };
  if (data['argument-hint']) fm['argument-hint'] = oneLine(String(data['argument-hint']));
  ctx.put(`skills/${entry.name}/SKILL.md`,
    `---\n${yaml.dump(fm, { lineWidth: -1 })}---\n\n` +
    `# /${PLUGIN}:${entry.name}\n\n` +
    `<!-- Generated by scripts/sync-plugin-support.js from the ${entry.agent} contract; edit ENTRY_SKILLS in the generator, not this file. -->\n\n` +
    `Read \`\${CLAUDE_PLUGIN_ROOT}/agents/${entry.agent}.md\` in full and act as that agent for the rest of this session. ` +
    `The Copilot-to-Claude Code mappings at the top of that file are binding. This skill changes session instructions, not host permissions; for an enforced agent tool list launch \`claude --agent ${PLUGIN}:${entry.agent}\` and verify its effective tools.\n\n` +
    `Input: **$ARGUMENTS**\n\n` +
    `Requirement artifacts live under \`${plansRoot}/\` in the project; run \`/${PLUGIN}:al-initialize\` once if that folder does not exist.\n`);
}

function buildWorkflow(prompt, ctx, plansRoot) {
  const sourceRel = `prompts/${prompt}.prompt.md`;
  const raw = ctx.readSource(sourceRel);
  const hash = sha256(raw);
  const { data, body } = split(raw.toString('utf8'));
  const name = workflowSkillName(prompt);
  const description = `${withPeriod(oneLine(data.description || ''))} ALDC workflow (Copilot prompt ${prompt}); invoke explicitly.`;
  // `disable-model-invocation` is what keeps a workflow explicit: the model
  // never fires it on its own, exactly like a Copilot prompt.
  const fm = `---\nname: ${name}\ndescription: ${yamlString(description)}\ndisable-model-invocation: true\n---\n`;
  let text = body;
  // Resolved parameter substitution: the Spec workflow's opening directive.
  text = text.replace('for `${input:req_name}` (complexity `${input:Complexity}`)',
    'with the requirement, complexity and scope in `$ARGUMENTS`');
  // Installing rules into a project is a distribution step, so each surface owns
  // its own Phase 0. The canonical prompt starts at Phase 1 because a Copilot
  // deployment has no installer to run. Copilot CLI and Codex inject their own block directly; the anchor is the contract between the three generators.
  if (name === 'al-initialize') text = injectInitPhase(text, plansRoot);
  ctx.put(`skills/${name}/SKILL.md`,
    `${fm}\n${workflowPreamble(sourceRel, hash, plansRoot)}\n${rewritePaths(text, plansRoot)}`);
}

/**
 * The Claude Code initialization step. The canonical prompt starts at Phase 1
 * because a Copilot deployment installs nothing; every plugin distribution has an
 * installer and injects its own Phase 0 here, against the same `## Phase 1:`
 * anchor used independently by the CLI and Codex initializers.
 */
function injectInitPhase(body, plansRoot) {
  const anchor = body.indexOf('## Phase 1:');
  if (anchor < 0) throw Error('Initialization structure changed: no `## Phase 1:` anchor');
  return `${body.slice(0, anchor)}## Phase 0: ALDC rules injection (plugin mode)

Path-scoped AL rules ship inside the plugin and must be copied into the project's
\`.claude/rules/\` before anything else. Run the installed plugin's initializer with
Node 20+:

\`\`\`bash
node "\${CLAUDE_PLUGIN_ROOT}/scripts/init.js" --project "/path/to/project"
node "\${CLAUDE_PLUGIN_ROOT}/scripts/init.js" --project "/path/to/project" --apply
\`\`\`

The first command previews the complete plan without writing. Review collisions
before applying. Existing customized rules stay intact; \`--force\` replaces reviewed
collisions with a recoverable backup. The initializer copies the AL rules, seeds
\`${plansRoot}/memory.md\` only when missing, and updates only the ALDC managed block
in \`CLAUDE.md\`, preserving surrounding project instructions. \`--verify\` reports
receipt drift; \`--rollback\` restores the preceding initialization and refuses to
overwrite later changes. It installs no software and configures no MCP server.

**Human Review:** confirm the rules are loaded before environment setup.

${body.slice(anchor)}`;
}

/**
 * Cross-host contracts: they compare Claude Code, Copilot CLI and Codex by name
 * and cite each host's own folders. Rewriting their paths would make them
 * circular, so all three distributions ship the identical canonical text.
 */
const NEUTRAL_REFERENCES = ['cli-al-tools.md', 'al18-capabilities.md'];

function buildKnowledgeSkill(skill, rootDir, ctx, plansRoot) {
  for (const rel of walk(rootDir, `skills/${skill}`)) {
    const raw = ctx.readSource(rel);
    if (!rel.endsWith('.md') || NEUTRAL_REFERENCES.includes(path.basename(rel))) { ctx.put(rel, raw); continue; }
    const text = raw.toString('utf8');
    if (!rel.endsWith('/SKILL.md')) { ctx.put(rel, rewritePaths(text, plansRoot)); continue; }
    const { data, body } = split(text);
    const fm = { name: data.name || skill, description: oneLine(rewritePaths(String(data.description || ''), plansRoot)) };
    if (data['argument-hint']) fm['argument-hint'] = oneLine(String(data['argument-hint']));
    ctx.put(rel, `---\n${yaml.dump(fm, { lineWidth: -1 })}---${rewritePaths(body, plansRoot)}`);
  }
}

/**
 * `applyTo` is a selection, not a suggestion: the generated rule declares the
 * globs its canonical instruction declares, and not one more. Widening a rule to
 * every AL file silently applies Codeunit/Query guidance where it does not hold.
 */
function buildRule(file, ctx, plansRoot) {
  const sourceRel = `instructions/${file}`;
  const raw = ctx.readSource(sourceRel);
  const hash = sha256(raw);
  const { data, body } = split(raw.toString('utf8'));
  const applyTo = data.applyTo || '**/*.al';
  const paths = String(applyTo).split(',').map((g) => g.trim()).filter(Boolean);
  const name = file.replace(/\.instructions\.md$/, '');
  const description = `${withPeriod(oneLine(String(data.description || name)))} ALDC always-on AL micro-rules (instruction ${name}); path-scoped.`;
  ctx.put(`rules/${name}.md`,
    `---\ndescription: ${yamlString(description)}\npaths: ${JSON.stringify(paths)}\n---\n\n` +
    `${provenanceLine(sourceRel, hash)}\n\n${rewritePaths(body, plansRoot).replace(/^\n+/, '')}`);
}

/** aldc.yaml for the plugin toolkit root: the canonical file with plans.root retargeted. */
function buildAldcYaml(rootDir, ctx, plansRoot) {
  const sourceRel = 'aldc.yaml';
  const raw = ctx.readSource(sourceRel);
  const text = raw.toString('utf8')
    .replace(/^toolkitRoot:.*$/m, 'toolkitRoot: "."')
    .replace(/^(plans:\n\s+root:\s*)"[^"]*"/m, `$1"${plansRoot}"`);
  ctx.put('aldc.yaml',
    `# ALDC — Claude Code plugin toolkit root configuration.\n` +
    `# Generated by scripts/sync-plugin-support.js from the repository aldc.yaml\n` +
    `# (sha256 ${sha256(raw)}). Do not edit; edit the source and re-run the generator.\n` +
    `#\n` +
    `# Requirement artifacts live under ${plansRoot} in a Claude Code deployment\n` +
    `# (plans.root below). The canonical file keeps .github/plans, which is correct\n` +
    `# for the Copilot deployment and the VS Code extension package.\n\n${text}`);
}

function buildManifest(rootDir, ctx) {
  const sourceRel = 'plugin.json';
  const manifest = JSON.parse(ctx.readSource(sourceRel).toString('utf8'));
  const version = JSON.parse(ctx.readSource('package.json').toString('utf8')).version;
  // The plugin declares its own component roots; the canonical manifest points at
  // the Copilot trees. `commands` is absent: ALDC workflows ship as explicit skills.
  const plugin = {
    name: manifest.name,
    displayName: 'ALDC for Claude Code',
    version,
    description: manifest.description,
    author: manifest.author,
    homepage: manifest.homepage,
    repository: manifest.repository,
    license: manifest.license,
    category: 'development',
    keywords: manifest.keywords,
    mcpServers: manifest.mcpServers,
    userConfig: manifest.userConfig,
  };
  ctx.put('.claude-plugin/plugin.json', `${JSON.stringify(plugin, null, 2)}\n`);
  ctx.put('.claude-plugin/marketplace.json', `${JSON.stringify({
    name: `${PLUGIN}-marketplace`,
    owner: manifest.author,
    metadata: { description: manifest.description },
    plugins: [{
      name: plugin.name,
      displayName: plugin.displayName,
      source: './',
      description: manifest.description,
      version,
      author: manifest.author,
      homepage: manifest.homepage,
      repository: manifest.repository,
      category: plugin.category,
      keywords: manifest.keywords,
    }],
  }, null, 2)}\n`);
  ctx.put('.mcp.json', `${JSON.stringify({ mcpServers: manifest.mcpServers }, null, 2)}\n`);
}

function buildDocs(ctx, plansRoot, counts) {
  const routing = ENTRY_SKILLS
    .map((e) => `| \`/${PLUGIN}:${e.name}\` | \`${PLUGIN}:${e.agent}\` | \`\${CLAUDE_PLUGIN_ROOT}/agents/${e.agent}.md\` |`)
    .join('\n');
  const workflows = WORKFLOWS
    .map((w) => `| \`/${PLUGIN}:${workflowSkillName(w)}\` | \`prompts/${w}.prompt.md\` |`)
    .join('\n');

  ctx.put('CLAUDE.md', `# ALDC Plugin Instructions

<!-- Generated by scripts/sync-plugin-support.js. Do not edit. -->

This plugin runs the canonical ALDC contracts in the **Claude Code harness**. The
contracts were authored for GitHub Copilot Chat; every adapted file carries the
binding Copilot -> Claude Code mapping table at the top, plus the sha256 of the
canonical source it was generated from.

${HOST_CONTRACT} Each agent and workflow links it explicitly, because a
plugin-root CLAUDE.md is not auto-loaded into a subagent.

## Roles

| Entry skill | Agent | Contract |
|---|---|---|
${routing}

The three TDD subagents (\`${PLUGIN}:al-planning-subagent\`, \`${PLUGIN}:al-implement-subagent\`,
\`${PLUGIN}:al-review-subagent\`) are \`user-invocable: false\` in the canonical and have no
entry skill: only \`${PLUGIN}:al-conductor\` launches them, through the \`Task\` tool.

## Workflows

Explicitly invoked; \`disable-model-invocation: true\` keeps the model from firing them.

| Skill | Canonical prompt |
|---|---|
${workflows}

## Rules

Path-scoped AL rules live in \`rules/\`, each declaring exactly the globs its
canonical \`applyTo\` declares. \`/${PLUGIN}:al-initialize\` copies them to the
project's \`.claude/rules/\` for auto-application.

## Plans

Requirement artifacts live under \`${plansRoot}/\` on this surface
(\`aldc.yaml -> plans.root\`). The canonical repository keeps \`.github/plans\`, which
is what the Copilot deployment and the VS Code extension read.

## Mapping

${mappingTable(plansRoot).replace(/^> /gm, '').replace(/^>$/gm, '')}
`);

  ctx.put('README.md', `# ALDC — AL Development Collection for Claude Code

<!-- Generated by scripts/sync-plugin-support.js. Do not edit. -->

AI-Native development toolkit for Microsoft Dynamics 365 Business Central.
Every file in this directory is generated from the canonical ALDC trees at the
repository root; each one cites its canonical source and sha256.

## Installation

From the plugin marketplace:

\`\`\`
/plugin marketplace add javiarmesto/ALDC-AL-Development-Collection
/plugin install ${PLUGIN}@${PLUGIN}-marketplace
\`\`\`

From a clone, register this directory as a local marketplace:

\`\`\`
/plugin marketplace add ./claude-plugin
/plugin install ${PLUGIN}@${PLUGIN}-marketplace
\`\`\`

Verify with \`/plugin\`, \`/agents\` and \`/\`. You should see ${counts.agents} agents,
${counts.entry} role entry skills, ${counts.workflows} workflow skills and
${counts.knowledge} knowledge skills, all prefixed \`${PLUGIN}:\`. Plugin loading,
tool availability and any Business Central operation still need local
verification; installation certifies none of them.

## First-time setup

\`\`\`
/${PLUGIN}:al-initialize
\`\`\`

Initialization runs \`scripts/init.js\`: preview with \`--project <dir>\`, apply with
\`--apply\`, inspect drift with \`--verify\`, restore with \`--rollback\`. Customized
files stay collisions unless a reviewed replacement uses \`--force\`. Node 20+ is
required. It copies the path-scoped AL rules to \`.claude/rules/\`, seeds
\`${plansRoot}/memory.md\` and adds a managed block to the project's \`CLAUDE.md\`.

## Layout

\`\`\`
claude-plugin/
├── .claude-plugin/plugin.json      # manifest (MCP servers, userConfig)
├── .claude-plugin/marketplace.json # marketplace entry
├── agents/                         # ${counts.agents} agent contracts
├── skills/<role>/                  # ${counts.entry} short role entry skills
├── skills/<workflow>/              # ${counts.workflows} explicit workflow skills
├── skills/skill-*/                 # ${counts.knowledge} knowledge skills
├── rules/                          # ${counts.rules} path-scoped AL rules
├── docs/templates/                 # requirement artifact templates
├── tools/                          # Context Doctor, BCQuality, validator
├── hooks/                          # SessionStart context, BCQuality precondition
├── aldc.yaml                       # toolkit root (plans.root: ${plansRoot})
├── CLAUDE.md                       # plugin guidance
└── README.md                       # this file
\`\`\`

## AL language tooling

Read [Claude AL tooling](docs/claude-al-tooling.md) to reuse the existing AL LSP
for Agents companion and verify access from each agent mode. ALDC declares no
second LSP server and does not change user or project provider configuration.

## MCP servers

**al-symbols-mcp** (read-only AL symbol queries), **context7** (library docs) and
**microsoft-docs** (Microsoft Learn). A declaration in the manifest is not proof
of connection: a server that is not loaded is \`unavailable\`, never simulated.

The Microsoft AL MCP is optional and separately configured under user/project
alias \`al\`; see [setup and role grants](docs/claude-al-tooling.md). ALDC grants
its query operations explicitly and compilation/build/restore only to Developer
and Implementer. It does not start that server or grant publish/authentication.
Optional BC29 profiling/snapshot proxies are granted only to Triage after explicit
connection setup; see the same guide for capture scope and runtime acceptance.

## Requirements

Claude Code CLI, Node 20+, and — for AL compilation — the AL command-line tool.
Publishing, running tests and debugging remain human- or CI-gated steps.

## License

MIT · [javiarmesto](https://github.com/javiarmesto)
`);
}

// Build the Claude distribution only.
/** Build every derived plugin file in memory. Returns { files, sources }. */
function build(rootDir = root) {
  const files = new Map();
  const sources = new Set();
  const modes = new Map();
  const ctx = builder(rootDir, files, sources, modes);
  const plansRoot = plansRootFor(rootDir);

  for (const agent of AGENTS) buildAgent(agent, ctx, plansRoot);
  for (const entry of ENTRY_SKILLS) buildEntrySkill(entry, ctx, plansRoot);
  for (const prompt of WORKFLOWS) buildWorkflow(prompt, ctx, plansRoot);

  const knowledge = fs.readdirSync(path.join(rootDir, 'skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('skill-')).map((e) => e.name).sort();
  for (const skill of knowledge) buildKnowledgeSkill(skill, rootDir, ctx, plansRoot);

  const rules = fs.readdirSync(path.join(rootDir, 'instructions')).filter((f) => f.endsWith('.instructions.md')).sort();
  for (const file of rules) buildRule(file, ctx, plansRoot);

  for (const rel of RUNTIME_FILES) ctx.copy(rel);
  for (const [src, dest] of HOOK_FILES) ctx.copy(src, dest);
  for (const name of ['install-transaction.js', 'package-provenance.js']) ctx.copy(`scripts/${name}`);
  ctx.copy('scripts/init-plugin.js', 'scripts/init.js');
  for (const rel of walk(rootDir, 'docs/templates')) ctx.copy(rel);
  ctx.copy('docs/templates/memory-template.md', 'templates/memory-template.md');
  ctx.copy('instructions/copilot-instructions.md', 'docs/copilot-instructions.md');
  ctx.copy('scripts/claude-al-tooling.md', 'docs/claude-al-tooling.md');

  buildAldcYaml(rootDir, ctx, plansRoot);
  buildManifest(rootDir, ctx);
  ctx.put('surface.json', JSON.stringify({ surface: 'claude', plansRoot }, null, 2) + '\n');
  ctx.put('project-guidance.md', projectGuidance('claude', plansRoot));
  buildDocs(ctx, plansRoot, {
    agents: AGENTS.length,
    entry: ENTRY_SKILLS.length,
    workflows: WORKFLOWS.length,
    knowledge: knowledge.length,
    rules: rules.length,
  });

  files.set('provenance.json', provenance(rootDir, [...sources, 'scripts/plugin-runtime.js', 'scripts/generation-utils.js'], files, 'scripts/sync-plugin-support.js'));
  return { files, sources, modes };
}

function sync(check = false, rootDir = root) {
  const dest = path.join(rootDir, DEST);
  const { files, modes } = build(rootDir);
  let drift = 0;
  for (const [rel, content] of files) {
    const p = path.join(dest, rel);
    const mode = modes.get(rel) ?? 0o644;
    const current = fs.existsSync(p) ? fs.statSync(p) : null;
    const sameMode = current && ((current.mode & 0o111) !== 0) === ((mode & 0o111) !== 0);
    if (current && sameMode && normalized(fs.readFileSync(p)).equals(normalized(Buffer.from(content)))) continue;
    drift++;
    if (check) console.error(`drift: ${DEST}/${rel}`);
    else { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content, { mode }); fs.chmodSync(p, mode); }
  }
  // No adoption: a file the generator does not produce is an orphan, not content.
  for (const rel of walk(dest)) {
    if (files.has(rel)) continue;
    drift++;
    if (check) console.error(`orphan: ${DEST}/${rel}`);
    else fs.unlinkSync(path.join(dest, rel));
  }
  if (!check) prune(dest);
  console.log(`Claude Code plugin: ${files.size} generated files; ${drift} ${check ? 'differences' : 'updated/removed'}`);
  return check && drift ? 1 : 0;
}

function prune(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) prune(path.join(dir, e.name));
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

if (require.main === module) process.exitCode = sync(process.argv.includes('--check'));
module.exports = { support, build, sync, AGENTS, ENTRY_SKILLS, WORKFLOWS, workflowSkillName, mappingTable, rewritePaths, plansRootFor, auditsRootFor, PLUGIN };
