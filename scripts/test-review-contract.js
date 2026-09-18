#!/usr/bin/env node
'use strict';
// Static installation contracts; this does not simulate model compliance.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {split}=require('./sync-copilot-cli');
const {resolveRef,refsIn}=require('./surface-refs');
const root=path.resolve(__dirname,'..');
// Each surface reaches the shared procedure through its own anchor; what matters is
// that the reference resolves inside that distribution, not how it is spelled.
const surfaces=[['agents','.agent.md','../skills/skill-al-review-pipeline/SKILL.md'],
 ['packages/foundation/agents','.agent.md','../skills/skill-al-review-pipeline/SKILL.md'],
 ['claude-plugin/agents','.md','${CLAUDE_PLUGIN_ROOT}/skills/skill-al-review-pipeline/SKILL.md'],
 ['copilot-cli-plugin/agents','.agent.md','${PLUGIN_ROOT}/skills/skill-al-review-pipeline/SKILL.md'],
 ['.claude/agents','.md','${CLAUDE_PROJECT_DIR}/.claude/skills/skill-al-review-pipeline/SKILL.md'],
 ['plugins/aldc-codex/skills/aldc/references/agents','.md','.agents/skills/aldc/references/skills/skill-al-review-pipeline/GUIDE.md']];
for(const [dir,ext,skill] of surfaces){
 if(!fs.existsSync(path.join(root,dir)))continue;
 for(const name of ['al-review-subagent','al-developer-reviewer','dredd']){
  const rel=path.posix.join(dir,name+ext),file=path.join(root,rel),body=fs.readFileSync(file,'utf8');
  assert.ok(body.includes(skill),file+' must reach its bundled procedure');
  const guideRel=resolveRef(rel,skill);
  assert.ok(fs.existsSync(path.join(root,guideRel)),file+': bundled procedure '+guideRel);
  for(const doc of [rel,guideRel]){
   for(const ref of refsIn(fs.readFileSync(path.join(root,doc),'utf8')))
    assert.ok(fs.existsSync(path.join(root,resolveRef(doc,ref))),doc+': missing '+ref);
  }
  if(!dir.includes('aldc-codex')&&name!=='dredd'){
   const tools=split(body).data.tools;
   assert.ok(!/\b(edit|Write|Edit|Bash|execute|al_build|al_debug)\b/.test(Array.isArray(tools)?tools.join(','):tools),file+': reviewer cannot gain write/execution tools');
  }
 }
}
const read=n=>split(fs.readFileSync(path.join(root,'agents',n+'.agent.md'),'utf8')).data;
assert.equal(read('al-developer-reviewer')['user-invocable'],true);
assert.ok(read('al-developer').handoffs.some(h=>h.agent===read('al-developer-reviewer').name));
assert.ok(read('al-developer-reviewer').handoffs.every(h=>h.agent===read('al-developer').name));
console.log('Reviewer roles, shared procedure, host references and read-only grants verified. Model behavior remains an interactive test.');
