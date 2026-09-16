#!/usr/bin/env node
'use strict';
// Complements the existing Claude source/mirror generator; does not rebuild roles.
const fs = require('fs');
const path = require('path');
const { walk, provenance, normalized } = require('./package-provenance');
const root = path.resolve(__dirname, '..');
function support(surface, rootDir = root) {
  const files = new Map();
  if (surface === 'claude') {
    const yaml = require('js-yaml');
    const parse = rel => {
      const text = fs.readFileSync(path.join(rootDir, rel), 'utf8').replace(/\r\n/g, '\n');
      const m = text.match(/^---\n([\s\S]*?)\n---([\s\S]*)$/);
      if (!m) throw Error(`Invalid Spec source: ${rel}`);
      return { data: yaml.load(m[1]), body: m[2] };
    };
    const role = parse('agents/al-spec-agent.agent.md');
    const tools = 'Read, Glob, Grep, Write, Edit, WebSearch, WebFetch, mcp__al-symbols-mcp__*, mcp__plugin_aldc_al-symbols-mcp__*, mcp__context7__*, mcp__plugin_aldc_context7__*, mcp__microsoft-docs__*, mcp__plugin_aldc_microsoft-docs__*';
    const preface = '\n\n## Terminal host contract\n\nRead [the terminal-host contract](../skills/skill-migrate/references/cli-al-tools.md) before capability decisions. Resolve packaged rules from rules-templates/ or project rules from .claude/rules; read only matching full bodies. The Spec write scope is the assigned .spec.md, regardless of broader editor permissions.\n';
    files.set('agents/al-spec-agent.md', '---\n' + yaml.dump({name:'al-spec-agent',description:role.data.description,tools,model:'sonnet',color:'cyan'}, {lineWidth:-1}) + '---' + preface + role.body.replaceAll('../instructions/', '../rules-templates/'));
    // Review roles share one canonical body; translate only host tool/path vocabulary.
    for (const name of ['al-review-subagent', 'al-developer-reviewer', 'dredd']) {
      const role = parse(`agents/${name}.agent.md`);
      const readTools = 'Read, Glob, Grep, mcp__al-symbols-mcp__*, mcp__plugin_aldc_al-symbols-mcp__*, mcp__context7__*, mcp__plugin_aldc_context7__*, mcp__microsoft-docs__*, mcp__plugin_aldc_microsoft-docs__*';
      const roleTools = name === 'dredd' ? readTools + ', Write' : readTools;
      const host = '\n\n## Terminal host contract\n\nRead [the terminal-host contract](../skills/skill-migrate/references/cli-al-tools.md). Use only tools exposed by this host; missing diagnostics/build evidence remains unverified. Role write scopes are behavioral limits, not filesystem sandboxes. Discover the actual installed role names; the lead sequences independent review when direct handoff is unavailable.\n';
      const body = role.body.replaceAll('../instructions/', '../rules-templates/')
        .replace(/@al-/g, 'al-').replace(/read\/readFile/g, 'Read')
        .replace(/`(?:al_symbolsearch|al_get_diagnostics|al_symbolrelations)`/g, 'the available read-only symbol/diagnostic capability')
        .replace(/`changes`/g, 'available change inspection').replace(/`edit`/g, '`Write`');
      files.set(`agents/${name}.md`, '---\n' + yaml.dump({name, description:role.data.description, tools:roleTools, model:'sonnet', color:'yellow'}, {lineWidth:-1}) + '---' + host + body);
    }
    for (const p of walk(rootDir, 'skills/skill-al-review-pipeline')) files.set(p, fs.readFileSync(path.join(rootDir,p), 'utf8'));
    const prompt = parse('prompts/al-spec.create.prompt.md');
    const body = prompt.body.replace('for `${input:req_name}` (complexity `${input:Complexity}`)', 'with the requirement, complexity and scope in `$ARGUMENTS`')
      .replaceAll('../agents/al-spec-agent.agent.md', '../agents/al-spec-agent.md');
    files.set('commands/al-spec-create.md', '---\n' + yaml.dump({description:prompt.data.description,'allowed-tools':tools}, {lineWidth:-1}) + '---' + body);
  }
  for (const rel of ['aldc_context_doctor.py', 'README.md']) {
    const dest = surface === 'codex' ? (rel.endsWith('.py') ? 'skills/aldc/scripts/' + rel : 'skills/aldc/references/doctor.md') : 'tools/context-doctor/' + rel;
    let body = fs.readFileSync(path.join(rootDir, 'tools/context-doctor', rel), 'utf8');
    if (surface === 'codex' && rel === 'README.md') body = body.replaceAll('../../docs/templates/', 'templates/');
    files.set(dest, body);
  }
  for (const rel of ['bcquality/precondition_hook.sh', 'bcquality/precondition_hook.ps1', 'bcquality/config.js', 'bcquality/validate_evidence.py', 'bcquality/install.sh', 'bcquality/install.ps1', 'aldc-validate/package.json', 'aldc-validate/index.js']) {
    const dest = surface === 'codex' ? 'skills/aldc/scripts/' + rel : 'tools/' + rel;
    files.set(dest, fs.readFileSync(path.join(rootDir, 'tools', rel), 'utf8'));
  }
  if (surface === 'claude') for (const p of walk(rootDir, 'skills/skill-agent-instructions/examples')) files.set(p, fs.readFileSync(path.join(rootDir,p), 'utf8'));
  for (const name of ['install-transaction.js', 'package-provenance.js']) files.set(`scripts/${name}`, fs.readFileSync(path.join(rootDir,'scripts',name), 'utf8'));
  files.set('scripts/init.js', fs.readFileSync(path.join(rootDir, 'scripts/init-plugin.js'), 'utf8'));
  for (const p of walk(rootDir, 'docs/templates')) files.set(p, fs.readFileSync(path.join(rootDir,p), 'utf8'));
  files.set('templates/memory-template.md', fs.readFileSync(path.join(rootDir,'docs/templates/memory-template.md'), 'utf8'));
  files.set('surface.json', JSON.stringify({ surface }, null, 2) + '\n');
  files.set('project-guidance.md', surface === 'codex' ?
    'Use the ALDC skill at .agents/skills/aldc/SKILL.md for Business Central development. Read the relevant role, workflow and AL rules there before acting. Preserve approved plans and .github/plans/memory.md. Human gates and the current session authorization apply.\n' :
    `This project uses the ALDC ${surface === 'claude' ? 'Claude Code' : 'Copilot CLI'} plugin. Discover its installed agents/commands/skills and read their full contracts. Use al-architect for design, al-spec-agent (via al-spec-create) for specification, al-developer for implementation and al-conductor for TDD orchestration. Keep approved artifacts and memory in .github/plans/. Read the ${surface === 'claude' ? '.claude/rules' : '.github/instructions'} AL rules for the affected files. Host loading and tool availability must be observed; installation does not certify them. Preserve material human gates.\n`);
  files.set('project-guidance.md', files.get('project-guidance.md') +
    `At session start or after an environment change, run the read-only ALDC Doctor with an available Python 3.9+ interpreter. Use --workspace for this project and --host ${surface}; --toolkit names the installed plugin root (or this project for Codex local bootstrap). See ${surface === 'codex' ? '.agents/skills/aldc/references/doctor.md; script .agents/skills/aldc/scripts/aldc_context_doctor.py' : 'tools/context-doctor/README.md and aldc_context_doctor.py in the installed plugin'}. Repeat only affected --operation checks. File presence and exit 0 do not certify host loading or execution. Do not install an interpreter automatically.\n`);
  return files;
}
function sync(check = false) {
  const dest = path.join(root,'claude-plugin'), outputs = support('claude');
  for (const rel of walk(dest)) if (rel !== 'provenance.json' && !outputs.has(rel)) outputs.set(rel, normalized(fs.readFileSync(path.join(dest,rel))));
  const sources = [...outputs.keys()].filter(p => !support('claude').has(p)).map(p => 'claude-plugin/' + p);
  sources.push('agents/al-review-subagent.agent.md','agents/al-developer-reviewer.agent.md','agents/dredd.agent.md',...walk(root,'skills/skill-al-review-pipeline'),'scripts/sync-plugin-support.js','agents/al-spec-agent.agent.md','prompts/al-spec.create.prompt.md',...walk(root, 'tools/context-doctor'),...walk(root, 'tools/bcquality'),'tools/aldc-validate/package.json','tools/aldc-validate/index.js','scripts/install-transaction.js','scripts/package-provenance.js','scripts/init-plugin.js',...walk(root, 'docs/templates'), ...walk(root, 'skills/skill-agent-instructions/examples'));
  outputs.set('provenance.json', provenance(root,sources,outputs,'scripts/sync-plugin-support.js'));
  let drift = 0;
  for (const [rel,b] of outputs) {
    const p = path.join(dest,rel);
    if (fs.existsSync(p) && normalized(fs.readFileSync(p)).equals(normalized(Buffer.from(b)))) continue;
    drift++; if (check) console.error(`drift: claude-plugin/${rel}`);
    else { fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b); }
  }
  console.log(`Claude support/provenance: ${drift} differences`); return check && drift ? 1 : 0;
}
if (require.main === module) process.exitCode = sync(process.argv.includes('--check'));
module.exports = { support, sync };
