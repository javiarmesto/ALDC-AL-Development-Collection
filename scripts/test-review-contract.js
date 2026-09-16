#!/usr/bin/env node
'use strict';
// Static installation contracts; this does not simulate model compliance.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {split}=require('./sync-copilot-cli');
const root=path.resolve(__dirname,'..');
const surfaces=[['agents','.agent.md','../skills/skill-al-review-pipeline/SKILL.md'],
 ['packages/foundation/agents','.agent.md','../skills/skill-al-review-pipeline/SKILL.md'],
 ['claude-plugin/agents','.md','../skills/skill-al-review-pipeline/SKILL.md'],
 ['copilot-cli-plugin/agents','.agent.md','../skills/skill-al-review-pipeline/SKILL.md'],
 ['.claude/agents','.md','../skills/skill-al-review-pipeline/SKILL.md'],
 ['plugins/aldc-codex/skills/aldc/references/agents','.md','../skills/skill-al-review-pipeline/GUIDE.md']];
for(const [dir,ext,skill] of surfaces){
 if(!fs.existsSync(path.join(root,dir)))continue;
 for(const name of ['al-review-subagent','al-developer-reviewer','dredd']){
  const file=path.join(root,dir,name+ext),body=fs.readFileSync(file,'utf8');
  assert.ok(body.includes(skill),file+' must reach its bundled procedure');
  const guide=path.resolve(path.dirname(file),skill);
  for(const doc of [file,guide]){
   for(const [,ref] of fs.readFileSync(doc,'utf8').matchAll(/\]\((\.\.\/[^)]+\.md)\)/g))
    assert.ok(fs.existsSync(path.resolve(path.dirname(doc),ref)),doc+': missing '+ref);
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
