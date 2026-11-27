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
- The optional `aldc-extras` plugin (`claude-plugin-extras/`, 5.4.0) is maintained the same way;
  the relock script and the Claude surface tests cover both plugins.
- `tools/tickets/` and `tools/factory/` (5.5.0) are the exception: their host-neutral files are canonical
  under the repository root and copied in verbatim by
  `node scripts/sync-claude-tools.js` (`--check` runs in `npm test`). Edit the root copy, never this one.
