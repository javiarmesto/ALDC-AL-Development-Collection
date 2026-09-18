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
const observed = extra => ({mode:'plugin',id:'bcquality',skill:'al-code-review', detail:'Fixture only: not a live host execution', ...extra});
try {
  write('app.json', {application:'29.0.0.0',runtime:'18.0'});
  config();
  assert.equal(readConfig(temp).bcquality.url, 'https://github.com/microsoft/BCQuality.git');
  assert.equal(doctor(observed({discovered:true})).bcquality.status, 'discovered-reported');
  assert.equal(doctor(observed({discovered:true})).bcquality.loaded, null);
  assert.equal(doctor(observed({discovered:false})).bcquality.native_fallback, true);
  doctor(observed({loaded:true}), false);
  doctor(observed({discovered:true,loaded:true,executed:true}), false);
  doctor(observed({skill:'al-quality-review',discovered:true}), false); // a differently named review skill, the pre-0.2.0 one included, is an incompatible provider and never an alias
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
  // `prebuilt` is the one index state a reviewer may report without running anything,
  // so it carries the receipt's evidence instead of an invocation's: the generator, the
  // file, its hash, and the corpus revision it was built over. A detail string alone
  // used to be enough, which made it the cheapest status to claim and the least earned.
  const indexSha = crypto.createHash('sha256').update(fs.readFileSync(path.join(temp,'knowledge-index.json'))).digest('hex');
  const receipt = {status:'prebuilt',detail:'Installer receipt',generator:'tools/Build-KnowledgeIndex.ps1',path:path.join(temp,'knowledge-index.json'),sha256:indexSha,corpusSha:'a'.repeat(40)};
  full.index = {status:'prebuilt',detail:'Claimed with no receipt behind it'};
  doctor(full, false);
  full.index = {...receipt, corpusSha:undefined};
  doctor(full, false);
  full.index = {...receipt, generator:undefined};
  doctor(full, false);
  full.index = {...receipt};
  assert.equal(doctor(full).bcquality.index.status,'prebuilt');
  full.index = {...receipt, sha256:'0'.repeat(64)};
  doctor(full, false);
  full.index = {...receipt, corpusSha:'not-a-sha'};
  doctor(full, false);
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
  // The snapshot carries the solution anchor, so Node consumers read one source.
  write('aldc.yaml','toolkitRoot: ".copilot"\nsolution:\n  workspaceFile: "mi.code-workspace"\n  roots:\n    application: "src"\n    test: "test"\n');
  const anchored=readConfig(temp);
  assert.equal(anchored.toolkitRoot,'.copilot');
  assert.deepEqual(anchored.solution,{workspaceFile:'mi.code-workspace',roots:{application:'src',test:'test'}});
  write('aldc.yaml','{}');
  assert.deepEqual(readConfig(temp).solution,{workspaceFile:'aldc.code-workspace',roots:{application:'',test:''}});
  write('aldc.yaml','toolkitRoot: ""\n'); assert.throws(()=>readConfig(temp),/toolkitRoot: must not be empty/);
  write('aldc.yaml','solution: []\n'); assert.throws(()=>readConfig(temp),/solution must be an object/);
  write('aldc.yaml','solution:\n  roots: "x"\n'); assert.throws(()=>readConfig(temp),/solution.roots must be an object/);
  for (const key of ['url','ref','home','entryPoint']) { write('aldc.yaml',{external:{bcquality:{mode:'external-multiroot',[key]:''}}}); assert.throws(()=>readConfig(temp),new RegExp(key+': must not be empty')); }
  write('aldc.yaml',{external:{bcquality:{mode:'external-multiroot',pinnedCommit:'',plugin:{expectedVersion:'',sourceRef:''}}}}); assert.equal(readConfig(temp).bcquality.pinnedCommit,'');
  run('git',['init','--quiet']);
  config();
  const reportDir=path.join(temp,'.github/plans/test');fs.mkdirSync(reportDir,{recursive:true});
  fs.writeFileSync(path.join(reportDir,'test-review-phase-1.json'),JSON.stringify({skill:{id:'al-review-subagent',version:1},outcome:'completed',findings:[{id:'missing.md',references:[{path:'missing.md'}]}]}));
  assert.match(run('python3',[path.join(root,'tools/bcquality/validate_evidence.py')]),/citation resolution UNVERIFIED/);
  fs.mkdirSync(path.join(temp,'corpus/skills'),{recursive:true});write('corpus/skills/entry.md','fixture');
  run('python3',[path.join(root,'tools/bcquality/validate_evidence.py'),'--bcquality-root',path.join(temp,'corpus')],false);
  fs.writeFileSync(path.join(reportDir,'bad-review-phase-2.json'), '[]');
  run('python3',[path.join(root,'tools/bcquality/validate_evidence.py')],false);
  // Presence of the three keys was the whole gate, so a report could carry any
  // value under them and pass. Each of these is refused for one stated reason.
  for (const bad of [
    {skill:123,outcome:'BANANA',findings:{}},
    {skill:{id:'',version:1},outcome:'completed',findings:[]},
    {skill:{id:'r',version:'one'},outcome:'completed',findings:[]},
    {skill:{id:'r',version:1},outcome:'completed',findings:[{references:[{path:''}]}]},
    {skill:{id:'r',version:1},outcome:'completed',findings:[],review:{verdict:'MAGNIFICENT'}},
    {skill:{id:'r',version:1},outcome:'completed',findings:[],review:{coverage:[{check:'x',status:'invented'}]}},
    {skill:{id:'r',version:1},outcome:'completed',findings:[],'sub-results':[{skill:'nested',outcome:'completed',findings:[]}]},
    // A cited finding's id IS its primary knowledge path; anything else breaks
    // occurrence identity across passes.
    {skill:{id:'r',version:1},outcome:'completed',findings:[{id:'wrong.md',references:[{path:'missing.md'}]}]},
    // Agent findings are advisory: they never carry blocker/major.
    {skill:{id:'r',version:1},outcome:'completed',findings:[{id:'agent:multi-turn',severity:'major'}]},
    // Native findings have no article to cite, so their confidence is capped.
    {skill:{id:'r',version:1},outcome:'completed',findings:[{id:'native:events:isolated-storage',confidence:'high'}]},
    // severity/confidence are closed vocabularies, not free text.
    {skill:{id:'r',version:1},outcome:'completed',findings:[{id:'missing.md',references:[{path:'missing.md'}],severity:'BANANA'}]},
    // Neither a citation, a native check nor an agent finding.
    {skill:{id:'r',version:1},outcome:'completed',findings:[{id:'something-invented'}]},
    // Declared criteria are bookkeeping over findings that already exist, so the
    // buckets have to add up to what the spec declared...
    {skill:{id:'r',version:1},outcome:'completed',findings:[{id:'missing.md',references:[{path:'missing.md'}]}],
     review:{criteria:{declared:3,met:1,unmet:[{path:'missing.md',findings:['missing.md']}],'not-evaluated':[],'house-rules-unmet':0}}},
    // ...and an unmet criterion has to be one a retained finding actually cites.
    {skill:{id:'r',version:1},outcome:'completed',findings:[{id:'missing.md',references:[{path:'missing.md'}]}],
     review:{criteria:{declared:1,met:0,unmet:[{path:'never-cited.md'}],'not-evaluated':[],'house-rules-unmet':0}}},
  ]) {
    fs.writeFileSync(path.join(reportDir,'bad-review-phase-2.json'), JSON.stringify(bad));
    run('python3',[path.join(root,'tools/bcquality/validate_evidence.py')],false);
  }
  fs.unlinkSync(path.join(reportDir,'bad-review-phase-2.json'));
  write('corpus/missing.md','fixture citation');
  // B: with the full corpus enabled, Entry can dispatch more than one FIRST-LEVEL
  // skill - the al-code-review super-skill plus the Community al-agents-review leaf.
  // Both reports have to survive in sub-results, with their display domains intact.
  assert.deepEqual(readConfig(temp).bcquality.pilotSkills, []);
  fs.writeFileSync(path.join(reportDir,'two-review-phase-3.json'), JSON.stringify({
    skill:{id:'al-review-subagent',version:1}, outcome:'completed', findings:[],
    // The spec declared two review criteria; one is answered by a finding, one is not.
    // The finding that answers it lives in a sub-result, which is where provider findings
    // actually are - a top-level-only lookup would call every criterion uncited.
    review:{verdict:'APPROVED_WITH_RECOMMENDATIONS', coverage:[
      {check:'al-code-review',status:'completed'},{check:'al-agents-review',status:'completed'}],
      criteria:{declared:2,met:1,unmet:[{path:'missing.md',findings:['missing.md']}],
        'not-evaluated':[],'house-rules-unmet':0}},
    'sub-results':[
      {skill:{id:'al-code-review',version:1},outcome:'completed',findings:[
        {id:'missing.md',domain:'Accessibility',severity:'minor',confidence:'high',references:[{path:'missing.md'}]}]},
      {skill:{id:'al-agents-review',version:1},outcome:'completed',findings:[
        {id:'agent:multi-turn',domain:'Agents',severity:'minor',confidence:'medium'}]},
    ]}));
  assert.match(run('python3',[path.join(root,'tools/bcquality/validate_evidence.py'),'--bcquality-root',path.join(temp,'corpus')]),/citation resolution CHECKED/);
  // --- `ref` has to actually track its branch ------------------------------
  // The promise of `ref` is that the clone follows it. Fetching alone never delivered
  // that: `checkout main` while already on main is a no-op, so a clone created once sat
  // at that commit while origin/main moved on. A real remote, no network.
  const bare = path.join(temp, 'corpus.git');
  const seed = path.join(temp, 'seed');
  const clone = path.join(temp, 'corpus-clone');
  const proj = path.join(temp, 'tracking-project');
  const git = (cwd, ...args) => {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
    if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + r.stderr);
    return r.stdout.trim();
  };
  fs.mkdirSync(proj, { recursive: true });
  fs.mkdirSync(path.join(seed, 'skills'), { recursive: true });
  spawnSync('git', ['init', '--bare', '--initial-branch=main', bare], { encoding: 'utf8' });
  fs.writeFileSync(path.join(seed, 'skills', 'entry.md'), 'v1\n');
  git(seed, 'init', '--quiet', '--initial-branch=main');
  git(seed, 'config', 'user.email', 'fixture@example.invalid');
  git(seed, 'config', 'user.name', 'fixture');
  git(seed, 'remote', 'add', 'origin', bare);
  git(seed, 'add', '-A'); git(seed, 'commit', '--quiet', '-m', 'v1'); git(seed, 'push', '--quiet', 'origin', 'main');

  const yamlFor = url => `external:\n  bcquality:\n    mode: "external-multiroot"\n    enabled: "auto"\n    url: "${url}"\n    ref: "main"\n    pinnedCommit: ""\n    home: "../corpus-clone"\n`;
  fs.writeFileSync(path.join(proj, 'aldc.yaml'), yamlFor(bare));
  const runInstall = () => {
    const r = spawnSync('bash', [path.join(root, 'tools/bcquality/install.sh')],
      { cwd: proj, encoding: 'utf8', env: { ...process.env, BCQUALITY_HOME: clone } });
    if (r.status !== 0) throw new Error('installer failed: ' + r.stdout + r.stderr);
    checks++;
    return r.stdout + r.stderr;
  };
  runInstall();
  assert.equal(fs.readFileSync(path.join(clone, 'skills/entry.md'), 'utf8'), 'v1\n');

  fs.writeFileSync(path.join(seed, 'skills', 'entry.md'), 'v2\n');
  git(seed, 'add', '-A'); git(seed, 'commit', '--quiet', '-m', 'v2'); git(seed, 'push', '--quiet', 'origin', 'main');
  const tracked = runInstall();
  assert.equal(fs.readFileSync(path.join(clone, 'skills/entry.md'), 'utf8'), 'v2\n',
    'a configured ref must actually track its branch, not freeze at the first clone');
  assert.match(tracked, /fast-forwarded/);

  // Local work is reported, never rewritten: a diverged branch keeps its commit.
  fs.writeFileSync(path.join(clone, 'skills', 'entry.md'), 'local\n');
  git(clone, 'config', 'user.email', 'fixture@example.invalid');
  git(clone, 'config', 'user.name', 'fixture');
  git(clone, 'add', '-A'); git(clone, 'commit', '--quiet', '-m', 'local work');
  fs.writeFileSync(path.join(seed, 'skills', 'entry.md'), 'v3\n');
  git(seed, 'add', '-A'); git(seed, 'commit', '--quiet', '-m', 'v3'); git(seed, 'push', '--quiet', 'origin', 'main');
  const diverged = runInstall();
  assert.match(diverged, /diverged/);
  assert.equal(fs.readFileSync(path.join(clone, 'skills/entry.md'), 'utf8'), 'local\n', 'local work survives');

  // A clone whose origin is not the configured source is reported, never repointed.
  fs.writeFileSync(path.join(proj, 'aldc.yaml'), yamlFor(bare + '-elsewhere'));
  const mismatched = runInstall();
  assert.match(mismatched, /origin is/);
  assert.match(mismatched, /not the configured/);
  assert.equal(git(clone, 'remote', 'get-url', 'origin'), bare, 'the developer’s remote is left alone');

  // aldc.yaml is not only this project's configuration: the installer writes it into
  // every consumer project, from the VSIX templates and from the npm package alike. A
  // fork or a pin committed here silently becomes everyone's provider by default, which
  // is how a personal clone nearly shipped as the 4.3.1 default. Pin per project.
  const shipped = readConfig(root).bcquality;
  assert.equal(shipped.url, 'https://github.com/microsoft/BCQuality.git',
    'the shipped provider default must be the upstream, never a fork');
  assert.equal(shipped.pinnedCommit, '',
    'a pin committed here ships as every consumer default; pin in your own project instead');

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
