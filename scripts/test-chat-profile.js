'use strict';
const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { project, projectConfiguration, chatModel } = require('./chat-profile');
const root = path.resolve(__dirname, '..');
const queries = ['al/al_symbolsearch', 'al/al_getdiagnostics', 'al/al_getpackagedependencies'];
let count = 0;
for (const profile of ['bc28', 'bc29-native']) {
  for (const dir of ['agents', 'prompts']) {
    for (const name of fs.readdirSync(path.join(root, dir)).filter(n => /\.(agent|prompt)\.md$/.test(n))) {
      const rel = `${dir}/${name}`, original = fs.readFileSync(path.join(root, rel));
      const text = project(rel, original, profile).toString();
      const fm = t => yaml.load(t.split('\n---')[0].slice(4));
      const meta = fm(text), before = fm(original.toString());
      for (const key of Object.keys(before).filter(k => !['tools', 'description', 'model'].includes(k))) assert.deepEqual(meta[key], before[key], `${rel}: preserve ${key}`);
      assert.equal(meta.model, before.model ? chatModel : undefined, `${rel}: Chat model policy`);
      const role = name.replace(/\.(agent|prompt)\.md$/, '');
      const none = ['al-conductor', 'al-memory.create'].includes(role);
      const tools = meta.tools;
      // Installed AL18.1: registration name differs from toolReferenceName.
      // Granting the former made native diagnostics unavailable in the host smoke.
      assert.ok(!tools.includes('ms-dynamics-smb.al/al_getdiagnostics'), `${rel}: registration ID is not a Chat selector`);
      assert.equal(tools.includes('ms-dynamics-smb.al/al_get_diagnostics'), profile === 'bc29-native' && !none && role !== 'al-presales', `${rel}: native diagnostics picker reference`);
      assert.ok(!tools.some(t => /renameSymbol|^al\/\*|al_publish|al_login|al_logout/.test(t)), rel);
      assert.deepEqual(tools.filter(t => queries.includes(t)), none ? [] : queries, rel);
      assert.equal(tools.includes('SShadowSdk.al-lsp-for-agents/bclsp_goToDefinition'), !none, rel);
      assert.equal(tools.includes('SShadowSdk.al-lsp-for-agents/bclsp_findReferences'), !none, rel);
      const impl = ['al-developer', 'al-implement-subagent', 'al-build'].includes(role);
      const creator = ['al-developer', 'al-implement-subagent'].includes(role);
      assert.equal(tools.includes('ms-dynamics-smb.al/al_getnextobjectid'), profile === 'bc29-native' && creator, `${rel}: object allocation stays with native implementation`);
      assert.ok(!tools.includes('al/al_getnextobjectid'), `${rel}: no implicit MCP allocation grant`);
      assert.equal(tools.includes('al/al_compile'), impl, rel);
      assert.equal(tools.includes('al/al_build'), impl, rel);
      assert.equal(tools.includes('al/al_downloadsymbols'), impl || role === 'al-initialize', rel);
      assert.equal(tools.includes('bc-profiling/*'), role === 'al-triage', rel);
      assert.ok(!tools.includes('bc-snapshot/*'), `${rel}: new proxy operations must not widen Triage`);
      assert.deepEqual(tools.filter(t => t.startsWith('bc-snapshot/')), role === 'al-triage' ? [
        'bc-snapshot/initialize_snapshot_debugging', 'bc-snapshot/get_snapshot_status', 'bc-snapshot/stop_snapshot_debugging',
      ] : [], `${rel}: capture only`);
      assert.ok(!tools.some(t => /run_tests|runtests/.test(t)), `${rel}: no implicit snapshot test grant`);
      if (none) assert.ok(!tools.some(t => /^(al\/|bc-|SShadowSdk|ms-dynamics-smb)/.test(t)), rel);
      assert.ok(text.includes(`Profile: **${profile}**`), rel);
      assert.ok(text.includes('../docs/framework/copilot-chat-al-tooling.md'), rel);
      if (role === 'al-implement-subagent') {
        const context = `${profile}/${rel}`;
        assert.ok(!text.includes('24.0.0.0'), `${context}: no fixed test dependency version`);
        assert.ok(!text.includes('if missing, **ADD them**'), `${context}: no unconditional dependency changes`);
        assert.ok(!/^\s*Any: Codeunit Any;/m.test(text), `${context}: no unused Any variable`);
        assert.ok(!text.includes('Assert: Codeunit "Library Assert";'), `${context}: no assumed assertion codeunit`);
        assert.ok(text.includes('owning app ID, publisher, compatible version and codeunit API from the target project\'s manifests and available symbols'), `${context}: resolve the actual dependency contract`);
        assert.ok(text.includes('restore only approved changes') && text.includes('Never copy example IDs or versions into app.json'), `${context}: approval before changing dependencies`);
        assert.ok(text.includes('Add Any only when its API is used by the test') && text.includes('Assert: Codeunit "<resolved assertion codeunit>";'), `${context}: templates use resolved libraries only`);
        assert.ok(text.includes('### Test Object ID Management'), `${context}: preserve the following implementation guidance`);
      }
      if (role === 'al-build') assert.ok(text.includes('Stop after build/package') && text.includes('human gate'));
      if (profile === 'bc29-native') {
        if (creator) assert.ok(text.includes('IDs are not reserved') && text.includes('never use nextOutOfRangeId') && text.includes('rangeStart=rangeEnd=approved ID'), `${rel}: safe allocation preserves approved IDs`);
        if (impl) assert.ok(text.includes('tests created, Test compiled and tests executed separate') && text.includes('a compiler error is not a failing runtime test'), `${rel}: real test evidence`);
        if (['al-architect', 'al-spec-agent', 'al-spec.create'].includes(role)) assert.ok(text.includes('appId/appName/appPublisher/appVersion') && text.includes('Preserve approved architecture'), `${rel}: bounded environment research`);
        if (role === 'al-conductor') assert.ok(text.includes('keep the affected phase pending') && text.includes('without calling AL tools yourself'), `${rel}: coordination gate`);
        if (['al-review-subagent', 'al-developer-reviewer', 'dredd'].includes(role)) assert.ok(text.includes('stale, missing or unexecuted checks as pending'), `${rel}: reviewer evidence limits`);
        if (role === 'al-implement-subagent') {
          assert.ok(!text.includes('(RED State)') && !text.includes('(GREEN State)'), `${rel}: creation does not prove runtime state`);
          assert.ok(!text.includes('use the LAST portion of the main range'), `${rel}: Test allocation stays scoped`);
          assert.ok(text.includes('never borrow App IDs') && text.includes('do not add unused test libraries'), `${rel}: approved dependencies and IDs`);
        }
      } else assert.ok(!text.includes('## Native AL evidence for this role'), `${rel}: native behavior is opt-in`);
      count++;
    }
  }
}
assert.equal(chatModel, 'Claude Sonnet 5.5 (copilot)', 'Confirmed local model ID');
assert.equal(typeof projectConfiguration, 'function', 'Chat configuration has an explicit projection');
{
  const canonical = fs.readFileSync(path.join(root, 'aldc.yaml'), 'utf8');
  const fresh = projectConfiguration(canonical);
  const config = yaml.load(fresh);
  assert.equal(yaml.load(canonical).external.bcquality.mode, 'external-multiroot', 'raw canonical default stays independent');
  assert.equal(config.external.bcquality.mode, 'plugin', 'fresh Chat uses plugin mode');
  assert.equal(config.external.bcquality.enabled, 'auto');
  assert.equal(config.external.bcquality.plugin.expectedVersion, '', 'fresh Chat has no fixed plugin version pin');
  assert.ok(fresh.includes('# Select once per host/configuration;'), 'template comments survive projection');
  for (const previous of ['', 'core:\n  version: "1.2.0"\n', 'external:\n  bcquality:\n    enabled: false\n']) {
    const existing = yaml.load(projectConfiguration(canonical, previous)).external.bcquality;
    assert.equal(existing.mode, 'external-multiroot', 'a prior configuration keeps the existing effective mode even without an explicit key');
    assert.equal(existing.enabled, previous.includes('enabled: false') ? false : 'auto');
  }
  const previous = canonical.replace('enabled: "auto"', 'enabled: false').replace('home: "../bcquality"', 'home: "../chosen corpus"')
    .replace('url: "https://github.com/microsoft/BCQuality.git"', 'url: "https://example.org/chosen-corpus.git"').replace('ref: "main"', 'ref: "approved-corpus"')
    .replace('id: "bcquality"', 'id: "chosen-bcquality"').replace('skill: "al-code-review"', 'skill: "chosen-review"');
  const upgraded = yaml.load(projectConfiguration(canonical, previous));
  assert.deepEqual(upgraded.external.bcquality, yaml.load(previous).external.bcquality, 'existing provider selection and identity survive');
  assert.ok(upgraded.autonomy && upgraded.testing && upgraded.required.instructions.includes('instructions/al-security.instructions.md'), 'updated contract configuration still ships');
}
for (const profile of ['bc28', 'bc29-native']) {
  for (const eol of ['\n', '\r\n']) {
    const source = fs.readFileSync(path.join(root, 'agents/al-architect.agent.md'), 'utf8').replace(/\r\n/g, '\n');
    const withOverride = source.replace('handoffs:', 'handoffs:\n  - label: Model regression\n    agent: al-spec-agent\n    prompt: Keep this prompt\n    model: Claude Sonnet 4.5');
    const output = project('agents/al-architect.agent.md', Buffer.from(withOverride.replace(/\n/g, eol)), profile).toString().replace(/\r\n/g, '\n');
    const metadata = yaml.load(output.slice(4, output.indexOf('\n---', 3)));
    assert.equal(metadata.model, chatModel);
    assert.deepEqual(metadata.handoffs[0], { label: 'Model regression', agent: 'al-spec-agent', prompt: 'Keep this prompt', model: chatModel });
    assert.ok(output.includes('Keep this prompt'));
  }
}
assert.throws(() => project('prompts/future.prompt.md', Buffer.from('---\ntools: [read]\n---\n'), 'bc28'), /assignment missing/);
assert.throws(() => project('agents/al-triage.agent.md', Buffer.from('invalid'), 'bc28'), /frontmatter/);
console.log(`PASS: Chat-only grants, prompt precedence, metadata and gates for ${count} projected files; no runtime claim.`);
