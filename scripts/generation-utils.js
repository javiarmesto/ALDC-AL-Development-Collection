'use strict';
// File-format helpers and canonical workflow inventory, without host permissions.
const yaml = require('js-yaml');

function split(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---([\s\S]*)$/);
  if (!match) throw Error('Missing frontmatter');
  return { data: yaml.load(match[1]) || {}, body: match[2] };
}

const WORKFLOWS = [
  'al-spec.create',
  'al-build',
  'al-pr-prepare',
  'al-memory.create',
  'al-context.create',
  'al-initialize',
  'al-agent.create',
  'al-agent.task',
  'al-agent.instructions',
  'al-agent.build-instructions',
  'al-agent.test',
];
const workflowSkillName = (prompt) => prompt.replace(/\./g, '-');

const oneLine = text => text.replace(/\s*\n\s*/g, ' ').trim();
const withPeriod = text => /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
module.exports = { split, WORKFLOWS, workflowSkillName, oneLine, withPeriod };

// Translate canonical deployment references using paths supplied by the caller.
// This helper has no host names, permissions, model choices or output directory.
function rewritePaths(text, layout) {
  const OPT = '(?:(?:\\.{1,2}\\/)+)?(?:\\.github\\/)?';
  const REQ = '(?:(?:\\.{1,2}\\/)+|\\.github\\/)';
  const re = body => new RegExp('(?<![\\w-])' + body, 'g');
  const rules = [
    [re(`${OPT}instructions\\/copilot-instructions\\.md`), layout.instructions],
    [re(`${OPT}instructions\\/([a-z*-]+)\\.instructions\\.md`), (_, name) => layout.rule(name)],
    [re(`${REQ}instructions\\/`), layout.rules],
    [re(`${OPT}prompts\\/([a-z.-]+)\\.prompt\\.md`), (_, name) => layout.workflow(workflowSkillName(name))],
    [/@workspace use ([a-z][a-z.-]*[a-z])/g, (_, name) => layout.invoke(workflowSkillName(name))],
    [re(`${OPT}agents\\/([a-z-]+)\\.agent\\.md`), (_, name) => layout.agent(name)],
    [re(`${OPT}docs\\/templates\\/`), layout.templates],
    [re(`${REQ}skills\\/`), layout.skills],
    [re(`${OPT}tools\\/(context-doctor|bcquality|aldc-validate)\\/`), (_, name) => layout.tools(name)],
    [/\.github\/plans/g, () => layout.plans],
    [/\$\{input:([A-Za-z_][\w]*)\}/g, '<$1 from $ARGUMENTS>'],
  ];
  for (const [pattern, replacement] of rules) text = text.replace(pattern, replacement);
  return text;
}

// Knowledge entry frontmatter has a smaller schema than canonical authoring files.
// Host-specific rewriting is supplied by each adapter, including description paths.
function knowledgeContent(rel, text, rewrite) {
  if (!rel.endsWith('.md') || ['cli-al-tools.md', 'al18-capabilities.md'].includes(rel.split('/').pop())) return text;
  if (!rel.endsWith('/SKILL.md')) return rewrite(text);
  const { data, body } = split(text);
  const fm = { name: data.name || rel.split('/')[1], description: oneLine(rewrite(String(data.description || ''))) };
  if (data['argument-hint']) fm['argument-hint'] = oneLine(String(data['argument-hint']));
  return `---\n${yaml.dump(fm, { lineWidth: -1 })}---${rewrite(body)}`;
}
module.exports.rewritePaths = rewritePaths;
module.exports.knowledgeContent = knowledgeContent;
