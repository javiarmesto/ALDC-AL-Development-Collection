# ALDC Extras — optional roles for Claude Code

Pre-sales and Business Central agent building, moved out of the `aldc` core plugin in
5.4.0. Requires `aldc` `^5.4.0` from the same marketplace (declared in
`.claude-plugin/plugin.json`); runtime rules are the core's, see
[docs/claude-runtime.md](docs/claude-runtime.md).

## Installation

```
/plugin marketplace add javiarmesto/ALDC-AL-Development-Collection
/plugin install aldc@aldc-marketplace
/plugin install aldc-extras@aldc-marketplace
```

From a clone, add the repository root as the marketplace (`/plugin marketplace add .`).
Verify with `/plugin`, the Agent catalog and `/`: 2 agents, 2 role entry skills,
4 workflow skills and 4 knowledge skills, all prefixed `aldc-extras:`. Installation
certifies neither plugin loading nor tool availability.

## Contents

| Kind | Items |
|---|---|
| Agents | `al-presales`, `al-agent-builder` |
| Entry skills | `/aldc-extras:presales`, `/aldc-extras:agent-builder` |
| Workflows | `/aldc-extras:al-agent-create`, `/aldc-extras:al-agent-task`, `/aldc-extras:al-agent-instructions`, `/aldc-extras:al-agent-test` |
| Knowledge skills | `skill-estimation`, `skill-agent-toolkit`, `skill-agent-task-patterns`, `skill-agent-instructions` |
| Hook | SessionStart `core-root.js`: states the `aldc` folder (`<aldc-root>`) or warns that `aldc` is missing |

What stays in `aldc`: the `al-agent-toolkit` rule (the core implementer and reviewer
apply it, and fill `review.agent-sdk`, to any app that extends `Agent Metadata Provider`),
the templates, the runtime doc and the hooks. The core `agent-brief` hook also briefs
`aldc-extras:al-agent-builder` subagents (foreground, AL rules including `al-agent-toolkit`).

The `/aldc:presales` and `/aldc:agent-builder` pointers that `aldc` 5.4.x kept were removed in 6.0.0.

## Maintenance

Maintained directly, like `claude-plugin/` (see its `SURFACE.md`). After editing any file
here run `node scripts/relock-claude-surface.js` (it relocks both plugins); tests are in
`node --test scripts/test-claude-surface.js`.

## License

MIT · [javiarmesto](https://github.com/javiarmesto)
