'use strict';
// ALDC factory host adapter for tests: no model. A script decides what each role does.
//
// The script is a module (path in ALDC_FAKE_SCRIPT, or passed as options.script) that exports
//   (call) => ({ files?: { "<path relative to cwd>": "<text>" }, text?, cost?, exit?, delayMs? })
// where call = { role, agent, prompt, cwd, ticket, attempt }. files are written into cwd before
// the step returns, so a fake implementer can drop AL files into its worktree and a fake
// researcher can write research.md. Every call is appended to options.calls when given.
const fs = require('fs');
const path = require('path');

function create(options = {}) {
  const script = options.script || (process.env.ALDC_FAKE_SCRIPT ? require(path.resolve(process.env.ALDC_FAKE_SCRIPT)) : () => ({}));
  const calls = options.calls || [];
  return {
    name: 'fake',
    describe: () => ({ name: 'fake', model: false, subsessions: 'in-process' }),
    async run(call) {
      const started = Date.now();
      calls.push({ ...call, startedAt: started });
      const out = (await script(call)) || {};
      if (out.delayMs) await new Promise((r) => setTimeout(r, out.delayMs));
      for (const [rel, text] of Object.entries(out.files || {})) {
        const file = path.resolve(call.cwd, rel);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, text);
      }
      const exit = out.exit ?? 0;
      return { ok: exit === 0, exit, cost: out.cost ?? 0, seconds: (Date.now() - started) / 1000, text: out.text || '', session: `fake-${calls.length}` };
    },
  };
}

module.exports = { create };
