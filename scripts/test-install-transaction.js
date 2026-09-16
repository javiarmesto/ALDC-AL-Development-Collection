#!/usr/bin/env node
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), os = require('os');
const { spawnSync } = require('child_process');
const tx = require('./install-transaction');
const { initialize } = require('./init-plugin');
const { verify } = require('./package-provenance');
const root = path.resolve(__dirname,'..');
const temp = t => { const p=fs.mkdtempSync(path.join(os.tmpdir(),'aldc update á ')); t.after(()=>fs.rmSync(p,{recursive:true,force:true}));return p; };
const write=(r,p,b)=>{fs.mkdirSync(path.dirname(path.join(r,p)),{recursive:true});fs.writeFileSync(path.join(r,p),b);};
const read=(r,p)=>fs.readFileSync(path.join(r,p),'utf8');
const files = value => new Map([['a.md',{content:value}],['b.md',{content:value}],['memory.md',{content:'seed',seed:true}]]);
test('dry run writes nothing; clean install, tracked update and chained rollback',t=>{
 const r=temp(t),opts={root:r,surface:'fixture',files:files('v1')};
 tx.apply({...opts,dryRun:true});assert.deepEqual(fs.readdirSync(r),[]);
 tx.apply(opts);assert.deepEqual(tx.drift(r,'fixture'),[]);assert.equal(tx.apply(opts).transaction,null);
 tx.apply({...opts,files:files('v2')});assert.equal(read(r,'a.md'),'v2');
 tx.rollback(r,'fixture');assert.equal(read(r,'a.md'),'v1');
 write(r,'memory.md','approved memory');tx.rollback(r,'fixture');
 assert.equal(read(r,'memory.md'),'approved memory');assert.equal(fs.existsSync(path.join(r,'a.md')),false);
});
test('all writes and previous receipt restored after partial failure',t=>{
 const r=temp(t),opts={root:r,surface:'fixture',files:files('v1')};tx.apply(opts);
 const receipt=read(r,'.aldc-install/fixture.json');
 assert.throws(()=>tx.apply({...opts,files:files('v2'),failAfter:2}),/previous files restored/);
 assert.equal(read(r,'a.md'),'v1');assert.equal(read(r,'b.md'),'v1');assert.equal(read(r,'.aldc-install/fixture.json'),receipt);
 assert.equal(fs.existsSync(path.join(r,'.aldc-install/pending.json')),false);
});
test('custom collisions stay visible, force is recoverable and later edits block rollback',t=>{
 const r=temp(t),opts={root:r,surface:'fixture',files:files('v1')};write(r,'a.md','custom');
 assert.equal(tx.apply(opts).files.find(f=>f.path==='a.md').action,'collision');assert.equal(read(r,'a.md'),'custom');
 tx.apply({...opts,force:true});assert.equal(read(r,'a.md'),'v1');tx.rollback(r,'fixture');assert.equal(read(r,'a.md'),'custom');
 tx.apply({...opts,force:true});write(r,'a.md','later');const receipt=read(r,'.aldc-install/fixture.json');
 assert.throws(()=>tx.rollback(r,'fixture'),/Changed since installation/);assert.equal(read(r,'.aldc-install/fixture.json'),receipt);
});
test('corrupt backup, live lock and symlink refuse mutation',t=>{
 const r=temp(t),opts={root:r,surface:'fixture',files:files('v1')};write(r,'a.md','custom');
 const result=tx.apply({...opts,force:true});const journal=JSON.parse(read(r,`.aldc-install/backups/${result.transaction}/journal.json`));
 write(r,journal.actions.find(a=>a.backup).backup,'broken');assert.throws(()=>tx.rollback(r,'fixture'),/Backup integrity/);assert.equal(read(r,'a.md'),'v1');
 write(r,'.aldc-install/operation.lock','live');assert.throws(()=>tx.apply(opts),/holds the lock/);
 const other=temp(t);fs.symlinkSync(other,path.join(r,'escape'),'dir');assert.throws(()=>tx.plan({...opts,files:new Map([['escape/a',{content:'x'}]])}),/symlinks/);assert.deepEqual(fs.readdirSync(other),[]);
 for(const p of ['../escape','/absolute','.git/config','AUX.txt'])assert.throws(()=>tx.checked(r,p));
});
test('retired paths remove only recognized files and rollback restores them',t=>{
 const r=temp(t),opts={root:r,surface:'fixture',files:files('v1')};tx.apply(opts);
 tx.apply({...opts,files:new Map([['a.md',{content:'v1'}],['memory.md',{content:'seed',seed:true}]])});assert.equal(fs.existsSync(path.join(r,'b.md')),false);
 tx.rollback(r,'fixture');assert.equal(read(r,'b.md'),'v1');write(r,'b.md','custom');
 assert.throws(()=>tx.plan({...opts,files:new Map([['a.md',{content:'v1'}]])}),/Customized obsolete/);
});
test('managed block preserves CRLF surrounding text and rejects malformed markers',()=>{
 const existing=Buffer.from('before\r\n<!-- BEGIN ALDC CODEX -->\nold\n<!-- END ALDC CODEX -->\r\nafter\r\n');
 assert.equal(tx.managedBlock(existing,'new','CODEX').toString(),'before\r\n<!-- BEGIN ALDC CODEX -->\nnew\n<!-- END ALDC CODEX -->\r\nafter\r\n');
 assert.throws(()=>tx.managedBlock(Buffer.from('<!-- END ALDC CODEX --><!-- BEGIN ALDC CODEX -->'),'x','CODEX'),/markers/);
});
for(const [surface,dir] of [['claude','claude-plugin'],['cli','copilot-cli-plugin'],['codex','plugins/aldc-codex']])test(`${surface}: locked payload, initialization, customized rules, memory and rollback`,t=>{
 const r=temp(t),pluginRoot=path.join(root,dir);verify(pluginRoot);
 write(r,'App/app.json','{"application":"29.0.0.0"}');write(r,'App/Main.al','// project source');write(r,'Test/app.json','{"runtime":"18.0"}');write(r,'.github/plans/memory.md','decisions');
 const guidance=surface==='claude'?'CLAUDE.md':'AGENTS.override.md';write(r,guidance,'Project instruction\r\n');
 if(surface==='codex')write(r,'AGENTS.md','Shadowed instructions preserved');
 initialize({project:r,pluginRoot});assert.equal(fs.existsSync(path.join(r,'.aldc-install')),false);
 const result=initialize({project:r,pluginRoot,apply:true});assert.equal(result.guidance,guidance);
 assert.equal(read(r,guidance).startsWith('Project instruction\r\n'),true);assert.equal(read(r,'.github/plans/memory.md'),'decisions');
 assert.equal(initialize({project:r,pluginRoot,apply:true}).transaction,null);
 const rule=surface==='claude'?'.claude/rules/al-guidelines.md':surface==='cli'?'.github/instructions/al-guidelines.instructions.md':'.agents/skills/aldc/references/rules/al-guidelines.md';
 write(r,rule,'custom rule');assert.deepEqual(initialize({project:r,pluginRoot,check:true}).drift,[rule]);
 const again=initialize({project:r,pluginRoot,apply:true});assert.equal(again.files.find(f=>f.path===rule).action,'collision');assert.equal(read(r,rule),'custom rule');
 assert.deepEqual(initialize({project:r,pluginRoot,check:true}).drift,[rule]);
 initialize({project:r,pluginRoot,apply:true,force:true});initialize({project:r,pluginRoot,rollback:true});assert.equal(read(r,rule),'custom rule');
 assert.equal(read(r,'App/Main.al'),'// project source');assert.equal(read(r,'Test/app.json'),'{"runtime":"18.0"}');
 if(surface==='codex') {assert.equal(fs.readdirSync(path.join(r,'.codex/agents')).length,12);assert.equal(read(r,'AGENTS.md'),'Shadowed instructions preserved');}
});
test('tampered plugin fails before creating project files; CRLF locked checkout is accepted',t=>{
 const r=temp(t),pluginRoot=path.join(r,'plugin'),project=path.join(r,'project');fs.cpSync(path.join(root,'claude-plugin'),pluginRoot,{recursive:true});
 const p='rules-templates/al-guidelines.md',text=read(pluginRoot,p);write(pluginRoot,p,text.replace(/\n/g,'\r\n'));verify(pluginRoot);
 write(pluginRoot,p,'tampered');assert.throws(()=>initialize({project,pluginRoot,apply:true}),/integrity/);assert.equal(fs.existsSync(project),false);
});
test('Claude session hook is silent outside AL and read-only in an AL project',t=>{
 const r=temp(t),{context}=require('../claude-plugin/hooks/session-context');assert.equal(context({cwd:r}),null);assert.equal(context({}),null);
 write(r,'.github/plans/note.md','unrelated plan');assert.equal(context({cwd:r}),null);
 write(r,'App/app.json','{"expo":{}}');assert.equal(context({cwd:r}),null);
 write(r,'App/app.json','{"application":"29.0.0.0"}');assert.match(context({cwd:r}).hookSpecificOutput.additionalContext,/terminal tool contract/);assert.deepEqual(fs.readdirSync(r).sort(),['.github','App']);
});
test('Chat CLI dry-run, verify and rollback operate on actual installed files',t=>{
 const r=temp(t); const run=args=>spawnSync(process.execPath,[path.join(root,'scripts/install.js'),...args],{cwd:r,encoding:'utf8'});
 assert.equal(run(['install','--yes','--dry-run']).status,0);assert.deepEqual(fs.readdirSync(r),[]);
 assert.equal(run(['install','--yes']).status,0);assert.equal(run(['verify-install']).status,0);
 write(r,'.github/agents/al-developer.agent.md','custom');assert.notEqual(run(['verify-install']).status,0);
 assert.equal(run(['install','--yes','--force']).status,0);assert.equal(run(['rollback']).status,0);assert.equal(read(r,'.github/agents/al-developer.agent.md'),'custom');
});

test('new override preserves existing project AGENTS.md and customized managed block collides',t=>{
 const r=temp(t),pluginRoot=path.join(root,'plugins/aldc-codex');write(r,'AGENTS.md','Project text');
 initialize({project:r,pluginRoot,apply:true});const before=read(r,'AGENTS.md');
 write(r,'AGENTS.override.md','New override');initialize({project:r,pluginRoot,apply:true});assert.equal(read(r,'AGENTS.md'),before);
 const edited=read(r,'AGENTS.override.md').replace('Use the ALDC skill','Custom ALDC skill');write(r,'AGENTS.override.md',edited);
 const result=initialize({project:r,pluginRoot,apply:true});assert.equal(result.files.find(f=>f.path==='AGENTS.override.md').action,'collision');assert.equal(read(r,'AGENTS.override.md'),edited);
});

test('interrupted rollback remains recoverable even after the receipt was restored',t=>{
 const r=temp(t),opts={root:r,surface:'fixture',files:files('v1')};tx.apply(opts);tx.apply({...opts,files:files('v2')});
 const rename=fs.renameSync;let injected=false;
 fs.renameSync=(src,dst)=>{if(dst===path.join(r,'a.md')&&!injected){injected=true;throw Error('Simulated restore failure');}return rename(src,dst);};
 try{assert.throws(()=>tx.rollback(r,'fixture'),/Simulated restore failure/);}finally{fs.renameSync=rename;}
 assert.equal(fs.existsSync(path.join(r,'.aldc-install/pending.json')),true);
 assert.throws(()=>tx.apply(opts),/Interrupted operation/);
 tx.rollback(r,'fixture');assert.equal(read(r,'a.md'),'v1');assert.equal(read(r,'b.md'),'v1');assert.deepEqual(tx.drift(r,'fixture'),[]);
 assert.equal(fs.existsSync(path.join(r,'.aldc-install/pending.json')),false);
});

test('Windows path casing and separators cannot bypass plugin-tree isolation',()=>{
 const {overlaps}=require('./init-plugin');
 for(const [a,b] of [['C:/Plugin','c:/plugin'],['C:/PLUGIN/project','c:/plugin'],['c:/','C:/plugin']])assert.equal(overlaps(a,b,'win32'),true);
 assert.equal(overlaps('C:/plugin-other','c:/plugin','win32'),false);
});

test('verify distinguishes absent and corrupt receipts without changing user files', t => {
 const r=temp(t); write(r,'sentinel.al','existing');
 assert.throws(()=>tx.drift(r,'chat'), /No installation receipt/);
 write(r,'.aldc-install/chat.json','{broken');
 assert.throws(()=>tx.drift(r,'chat'), /Invalid installation receipt.*malformed JSON/);
 assert.equal(read(r,'.aldc-install/chat.json'),'{broken');
 write(r,'.aldc-install/chat.json',JSON.stringify({schema:1,surface:'wrong',files:{}}));
 assert.throws(()=>tx.drift(r,'chat'), /Invalid installation receipt/);
 assert.equal(read(r,'sentinel.al'),'existing');
});

test('array receipts and unsafe receipt keys are invalid for planning and inspection alike', t => {
 const r=temp(t);
 write(r,'.aldc-install/fixture.json',JSON.stringify({schema:1,surface:'fixture',transaction:'t',files:[]}));
 assert.throws(()=>tx.plan({root:r,surface:'fixture',files:files('v1')}),/Invalid installation receipt/);
 let s=tx.inspect(r,'fixture');assert.equal(s.receipt,'invalid');assert.match(s.receiptProblem,/schema/);
 write(r,'.aldc-install/fixture.json',JSON.stringify({schema:1,surface:'fixture',transaction:'t',files:{'../outside.md':'0'.repeat(64)}}));
 s=tx.inspect(r,'fixture');assert.equal(s.receipt,'invalid');assert.match(s.receiptProblem,/Unsafe path/);assert.equal(s.managed,0);assert.deepEqual(s.drift,[]);
 assert.throws(()=>tx.plan({root:r,surface:'fixture',files:files('v1')}),/Unsafe path/);
 assert.deepEqual(fs.readdirSync(r),['.aldc-install'],'nothing written');
});
test('inspect reports absent, invalid, valid, drifted and restorable state without writing', t => {
 const r=temp(t),opts={root:r,surface:'fixture',files:files('v1')};
 let s=tx.inspect(r,'fixture');assert.equal(s.receipt,'absent');assert.equal(s.restore.available,false);assert.deepEqual(fs.readdirSync(r),[]);
 write(r,'.aldc-install/fixture.json','{broken');s=tx.inspect(r,'fixture');assert.equal(s.receipt,'invalid');assert.equal(s.receiptProblem,'malformed JSON');
 fs.rmSync(path.join(r,'.aldc-install'),{recursive:true});
 tx.apply(opts);s=tx.inspect(r,'fixture');assert.equal(s.receipt,'valid');assert.equal(s.managed,2);assert.deepEqual(s.drift,[]);
 assert.equal(s.restore.available,true);assert.equal(s.restore.status,'committed');assert.ok(s.restore.changes.includes('a.md'));
 write(r,'a.md','edited');s=tx.inspect(r,'fixture');assert.deepEqual(s.drift,['a.md']);assert.equal(s.restore.available,false);assert.deepEqual(s.restore.blocked,['a.md']);
 assert.throws(()=>tx.rollback(r,'fixture'),/Changed since installation/);
 write(r,'a.md','v1');tx.rollback(r,'fixture');s=tx.inspect(r,'fixture');assert.equal(s.receipt,'absent');assert.equal(s.restore.available,false);assert.equal(fs.existsSync(path.join(r,'a.md')),false);
});
test('preview digest binds apply to the previewed plan',t=>{
 const r=temp(t),opts={root:r,surface:'fixture',files:files('v1')};
 const preview=tx.apply({...opts,dryRun:true});assert.match(preview.digest,/^[0-9a-f]{64}$/);
 write(r,'a.md','custom');assert.throws(()=>tx.apply({...opts,expectDigest:preview.digest}),/plan changed since preview/);
 assert.equal(fs.existsSync(path.join(r,'b.md')),false);
 const fresh=tx.apply({...opts,dryRun:true});assert.notEqual(fresh.digest,preview.digest);
 const applied=tx.apply({...opts,expectDigest:fresh.digest});assert.equal(applied.digest,fresh.digest);assert.equal(read(r,'a.md'),'custom');
 assert.equal(applied.files.find(f=>f.path==='a.md').before,tx.hash(Buffer.from('custom')));assert.equal(applied.files.find(f=>f.path==='a.md').customized,true);
 assert.equal(tx.apply({...opts,dryRun:true,force:true}).files.find(f=>f.path==='a.md').customized,true);assert.equal(tx.apply({...opts,dryRun:true}).files.find(f=>f.path==='b.md').customized,false);
});
test('Chat CLI --json returns structured status, preview, guarded apply, verify and rollback',t=>{
 const r=temp(t); const run=args=>{const p=spawnSync(process.execPath,[path.join(root,'scripts/install.js'),...args,'--json'],{cwd:r,encoding:'utf8'});return {status:p.status,body:JSON.parse(p.stdout)};};
 let s=run(['status']);assert.equal(s.status,0);assert.equal(s.body.receipt,'absent');assert.equal(s.body.profileMarker,'absent');assert.equal(s.body.toolkitPresent,false);
 const preview=run(['install','--dry-run']);assert.equal(preview.status,0);assert.equal(preview.body.dryRun,true);assert.ok(preview.body.summary.add>100);assert.deepEqual(fs.readdirSync(r),[]);
 write(r,'.github/agents/al-developer.agent.md','custom');
 const stale=run(['install','--expect-plan',preview.body.digest]);assert.equal(stale.status,1);assert.match(stale.body.error,/plan changed/);assert.equal(fs.existsSync(path.join(r,'aldc.yaml')),false);
 const again=run(['install','--dry-run']);assert.deepEqual(again.body.collisions,['.github/agents/al-developer.agent.md']);
 assert.deepEqual(again.body.replaced,[]);const forced=run(['install','--dry-run','--force']);assert.deepEqual(forced.body.replaced,['.github/agents/al-developer.agent.md']);assert.deepEqual(forced.body.collisions,[]);
 const applied=run(['install','--expect-plan',again.body.digest]);assert.equal(applied.status,0);assert.match(applied.body.transaction,/^[0-9a-f-]{36}$/);assert.equal(read(r,'.github/agents/al-developer.agent.md'),'custom');
 s=run(['status']);assert.equal(s.body.receipt,'valid');assert.equal(s.body.profile,'bc28');assert.deepEqual(s.body.drift,['.github/agents/al-developer.agent.md']);assert.ok(s.body.doctorScript);
 const other=run(['status','--target-dir','.copilot']);assert.equal(other.status,0);assert.equal(other.body.ok,false);assert.equal(other.body.receiptTarget,'.github');assert.equal(other.body.targetMismatch,'.github');assert.match(other.body.message,/records target "\.github"/);assert.equal(s.body.targetMismatch,null);
 const otherVerify=run(['verify-install','--target-dir','.copilot']);assert.equal(otherVerify.status,1);assert.equal(otherVerify.body.targetMismatch,'.github');
 const verify=run(['verify-install']);assert.equal(verify.status,1);assert.equal(verify.body.command,'verify-install');
 const rollback=run(['rollback']);assert.equal(rollback.status,0);assert.equal(rollback.body.ok,true);assert.equal(fs.existsSync(path.join(r,'aldc.yaml')),false);
 write(r,'.github/aldc-profile.json','{"profile":"unsupported"}');s=run(['status']);assert.equal(s.body.profileMarker,'invalid');
 const blocked=run(['install']);assert.equal(blocked.status,1);assert.equal(blocked.body.code,'invalid-profile-marker');
 const bad=spawnSync(process.execPath,[path.join(root,'scripts/install.js'),'install','--expect-plan','nope','--json'],{cwd:r,encoding:'utf8'});assert.equal(bad.status,1);assert.equal(JSON.parse(bad.stdout).code,'invalid-arguments');
});
