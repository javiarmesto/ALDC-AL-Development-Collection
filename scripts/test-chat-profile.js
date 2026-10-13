'use strict';
const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { project, chatModel } = require('./chat-profile');
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
      if (role === 'al-build') assert.ok(text.includes('Stop after build/package') && text.includes('human gate'));
      if (profile === 'bc29-native') {
        if (creator) assert.ok(text.includes('IDs are not reserved') && text.includes('never use nextOutOfRangeId') && text.includes('rangeStart=rangeEnd=approved ID'), `${rel}: safe allocation preserves approved IDs`);
        if (impl) assert.ok(text.includes('tests created, Test compiled and tests executed separate') && text.includes('a compiler error is not a failing runtime test'), `${rel}: real test evidence`);
        if (['al-architect', 'al-spec-agent', 'al-spec.create'].includes(role)) assert.ok(text.includes('appId/appName/appPublisher/appVersion') && text.includes('Preserve approved architecture'), `${rel}: bounded environment research`);
        if (role === 'al-conductor') assert.ok(text.includes('keep the affected phase pending') && text.includes('without calling AL tools yourself'), `${rel}: coordination gate`);
        if (['al-review-subagent', 'al-developer-reviewer'].includes(role)) assert.ok(text.includes('stale, missing or unexecuted checks as pending'), `${rel}: reviewer evidence limits`);
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
