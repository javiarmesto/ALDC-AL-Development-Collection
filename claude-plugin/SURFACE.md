# Claude Code surface — maintained, not generated

Since 5.1.0 this folder is the **aldc-claude** edition of the plugin: it is maintained directly
(agents, skills, rules, hooks) and validated with its own process checks, instead of being
regenerated from the Copilot contracts by `scripts/sync-plugin-support.js`.

- The generator detects this file and treats `claude-plugin/` as its own source, so
  `npm run sync:claude` and `--check` leave it untouched.
- Hook tests: `node --test scripts/test-claude-surface.js`.
- After editing any file here, refresh the payload hashes: `node scripts/relock-claude-surface.js`.
- Improvements that apply to every surface are ported back to the canonical contracts
  (`agents/*.agent.md`, `instructions/`, `skills/`) over time.
