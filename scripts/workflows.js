'use strict';
// Canonical ALDC workflows: explicitly invoked skills at skills/<name>/SKILL.md.
// They shipped as prompts/<name>.prompt.md until VS Code Copilot sessions stopped
// loading prompt files. Dependency-free: the installer and the Chat profile
// projectors load it at install time, so it must not require js-yaml.
const WORKFLOWS = [
  'al-spec-create',
  'al-build',
  'al-pr-prepare',
  'al-memory-create',
  'al-context-create',
  'al-initialize',
  'al-agent-create',
  'al-agent-task',
  'al-agent-instructions',
  'al-agent-test',
];
const workflowSource = (name) => `skills/${name}/SKILL.md`;

module.exports = { WORKFLOWS, workflowSource };
