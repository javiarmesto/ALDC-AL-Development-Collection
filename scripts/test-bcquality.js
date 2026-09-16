#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { readConfig } = require('../tools/bcquality/config');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'aldc-bcq-'));
const write = (p, s) => fs.writeFileSync(path.join(temp, p), typeof s === 'string' ? s : JSON.stringify(s));
let checks = 0;
function run(cmd, args, ok = true) {
  const result = spawnSync(cmd, args, { cwd: temp, encoding: 'utf8', env: {...process.env, PYTHONDONTWRITEBYTECODE:'1'} });
  if (result.error) throw result.error;
  if (ok) assert.equal(result.status, 0, result.stderr + result.stdout);
  else assert.notEqual(result.status, 0, result.stdout);
  checks++;
  return result.stdout;
}
function doctor(obs, ok = true, snapshot = true) {
  if (snapshot) write('config.json', readConfig(temp));
  write('runtime.json', { workspace:temp, host:'claude', operations:{}, ...(obs ? {bcquality:obs} : {}) });
  return JSON.parse(run('python3', [path.join(root, 'tools/context-doctor/aldc_context_doctor.py'), '--workspace',temp,'--host','claude','--operation','compile-app','--bcquality-config',path.join(temp,'config.json'),'--runtime',path.join(temp,'runtime.json'),'--json'], ok));
}
const config = (mode = 'plugin', enabled = 'auto', plugin = {}) => write('aldc.yaml', {external:{other:{url:'WRONG',ref:'WRONG',home:'WRONG'},bcquality:{mode,enabled,plugin}}});
const observed = extra => ({mode:'plugin',id:'bcquality',skill:'bcquality-al-review', detail:'Fixture only: not a live host execution', ...extra});
try {
  write('app.json', {application:'29.0.0.0',runtime:'18.0'});
  config();
  assert.equal(readConfig(temp).bcquality.url, 'https://github.com/microsoft/BCQuality.git');
  assert.equal(doctor(observed({discovered:true})).bcquality.status, 'discovered-reported');
  assert.equal(doctor(observed({discovered:true})).bcquality.loaded, null);
  assert.equal(doctor(observed({discovered:false})).bcquality.native_fallback, true);
  doctor(observed({loaded:true}), false);
  doctor(observed({discovered:true,loaded:true,executed:true}), false);
  doctor(observed({skill:'al-code-review',discovered:true}), false);
  let full = observed({discovered:true,loaded:true,executed:true,outcome:'completed', index:{status:'not-attempted',detail:'No PowerShell in this fixture'}});
  assert.equal(doctor(full).bcquality.status, 'executed-reported');
  assert.equal(doctor(full).bcquality.index.status, 'not-attempted');
  full.index = {status:'failed',detail:'Read-only provider cache; path fallback'};
  assert.equal(doctor(full).bcquality.index.status, 'failed');
  write('knowledge-index.json', {articles:[],articleCount:0});
  full.index = {status:'generated',detail:'Pre-existing file alone is insufficient'};
  doctor(full, false);
  full.index = {status:'generated', detail:'Synthetic output observation',exitCode:0,command:'fixture generator',path:path.join(temp,'knowledge-index.json'),sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(temp,'knowledge-index.json'))).digest('hex'),freshness:'Fixture trace; not a real BCQuality invocation'};
  assert.equal(doctor(full).bcquality.index.status,'generated');
  full.index.sha256='0'.repeat(64); doctor(full,false);
  config('plugin','auto',{expectedVersion:'0.1.0'});
  assert.equal(doctor(observed({discovered:true,observedVersion:'0.2.0'})).bcquality.status,'incompatible-reported');
  assert.equal(doctor(observed({discovered:true})).bcquality.status,'identity-unverified');
  config('plugin',false);
  assert.equal(doctor(observed({loaded:true})).bcquality.status,'disabled');
  config(); doctor(null);
  write('aldc.yaml', 'external: {bcquality: {enabled: false}}');
  doctor(null,false,false);
  for (const mode of ['plugin','external-multiroot']) for (const enabled of [false,'auto']) {
    config(mode,enabled);
    if (mode==='external-multiroot' && enabled==='auto') continue; // No real clone operations.
    const notice = JSON.parse(run('bash',[path.join(root,'tools/bcquality/precondition_hook.sh')]));
    assert.match(notice.hookSpecificOutput.additionalContext,/has not probed/);
    const out=run('bash',[path.join(root,'tools/bcquality/install.sh')]);
    assert.match(out,/no clone|No clone|no Git|no clone/i);
  }
  config('bad-mode'); assert.throws(()=>readConfig(temp),/mode/);
  config('plugin','true'); assert.throws(()=>readConfig(temp),/enabled/);
  config('plugin','auto',{sourceRef:'024a571e'}); assert.throws(()=>readConfig(temp),/full commit/);
  config('external-multiroot'); assert.equal(readConfig(temp).bcquality.entryPoint,'skills/entry.md');
  for (const key of ['url','ref','home','entryPoint']) { write('aldc.yaml',{external:{bcquality:{mode:'external-multiroot',[key]:''}}}); assert.throws(()=>readConfig(temp),new RegExp(key+': must not be empty')); }
  write('aldc.yaml',{external:{bcquality:{mode:'external-multiroot',pinnedCommit:'',plugin:{expectedVersion:'',sourceRef:''}}}}); assert.equal(readConfig(temp).bcquality.pinnedCommit,'');
  run('git',['init','--quiet']);
  config();
  const reportDir=path.join(temp,'.github/plans/test');fs.mkdirSync(reportDir,{recursive:true});
  fs.writeFileSync(path.join(reportDir,'test-review-phase-1.json'),JSON.stringify({skill:'review',outcome:'completed',findings:[{references:[{path:'missing.md'}]}]}));
  assert.match(run('python3',[path.join(root,'tools/bcquality/validate_evidence.py')]),/citation resolution UNVERIFIED/);
  fs.mkdirSync(path.join(temp,'corpus/skills'),{recursive:true});write('corpus/skills/entry.md','fixture');
  run('python3',[path.join(root,'tools/bcquality/validate_evidence.py'),'--bcquality-root',path.join(temp,'corpus')],false);
  fs.writeFileSync(path.join(reportDir,'bad-review-phase-2.json'), '[]');
  run('python3',[path.join(root,'tools/bcquality/validate_evidence.py')],false);
  fs.unlinkSync(path.join(reportDir,'bad-review-phase-2.json'));
  write('corpus/missing.md','fixture citation');
  assert.match(run('python3',[path.join(root,'tools/bcquality/validate_evidence.py'),'--bcquality-root',path.join(temp,'corpus')]),/citation resolution CHECKED/);
  // Generated surfaces carry the same normalizer and exact provider contract.
  for (const base of ['claude-plugin','copilot-cli-plugin','plugins/aldc-codex']) {
    const codex=base.includes('codex');
    const tool=codex ? 'skills/aldc/scripts/bcquality/config.js':'tools/bcquality/config.js';
    assert.equal(fs.readFileSync(path.join(root,base,tool),'utf8'),fs.readFileSync(path.join(root,'tools/bcquality/config.js'),'utf8'));
    const contract=codex?'skills/aldc/references/templates/bcquality-provider-contract.md':'docs/templates/bcquality-provider-contract.md';
    assert.equal(fs.readFileSync(path.join(root,base,contract),'utf8'),fs.readFileSync(path.join(root,'docs/templates/bcquality-provider-contract.md'),'utf8'));
  }
  console.log(`BCQuality: ${checks} command checks plus configuration/packaging assertions passed; synthetic fixtures only.`);
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
