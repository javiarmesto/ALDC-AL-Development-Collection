# The Claude Code plugin is generated

`claude-plugin/` is a derived view of the canonical trees at the repository root.
No file in it is written by hand. `scripts/sync-plugin-support.js` emits every
one of them, and `node scripts/sync-plugin-support.js --check` fails on drift and
on any orphan the generator no longer produces.

If you find yourself editing a file under `claude-plugin/`, the change belongs
either in the canonical source or in the generator — a missing transform, never a
manual patch.

## What the adapter may change

Exactly four things:

1. **Frontmatter.** The host schema, plus the permission surface frozen in the
   generator's `AGENTS` table (`tools`, `model`, `color`, `maxTurns`). Those are
   Claude Code host facts and are not derivable from a contract that declares
   Copilot tool identifiers and a Copilot model name.
2. **Paths.** The Copilot deployment layout rewritten to the plugin layout
   (`${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PROJECT_DIR}`, `plans.root`).
3. **Tool vocabulary.** Copilot surfaces named as their Claude Code equivalent.
4. **The mapping preamble.** The binding Copilot → Claude Code table that every
   adapted contract carries, together with the sha256 of its canonical source.

Everything else in a contract travels verbatim. A change that does not fit in
those four is a canonical change.

## Primitive mapping

| Canonical | Plugin |
|---|---|
| `agents/<id>.agent.md` | `agents/<id>.md` |
| `agents/<id>.agent.md` (user-invocable roles) | `skills/<role>/SKILL.md` — short entry skill, `/aldc:<role>` |
| `prompts/<wf>.prompt.md` | `skills/<wf>/SKILL.md` with `disable-model-invocation: true` |
| `instructions/<r>.instructions.md` (`applyTo`) | `rules/<r>.md` (`paths:`) |
| `skills/<name>/**` | `skills/<name>/**` |
| `docs/templates/`, `tools/`, `scripts/` | same paths inside the plugin |
| `aldc.yaml`, `plugin.json`, `package.json` | `aldc.yaml`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.mcp.json` |
| `tools/claude-hooks/` | `hooks/` |

Workflows are **skills**, not commands: the verified Claude Code plugin has no
`commands/` directory anywhere. `disable-model-invocation: true` is what keeps a
workflow explicit, exactly like a Copilot prompt that only runs when invoked.

Rules live in `rules/`, and each declares the globs its canonical `applyTo`
declares — not one more. Before this change four of the eight had been widened to
`**/*.al`, which silently applied Codeunit- and Query-scoped guidance to every AL
file.

The three TDD subagents are `user-invocable: false` in the canonical, so they get
no entry skill: only `aldc:al-conductor` launches them, through the `Task` tool.
Giving them a slash command would contradict their own contract.

## Where plans live

`aldc.yaml → plans.root` is now read rather than assumed. The canonical keeps
`.github/plans`, which is correct for the Copilot deployment and the VS Code
extension package; the plugin ships an `aldc.yaml` declaring `.claude/plans` and
records the resolved value in `surface.json`, so `scripts/init.js` needs no YAML
reader at install time. `contracts.archiveFolder` and
`external.bcquality.evidence.persistedReportGlob` are relative to `plans.root`; a
legacy value already anchored at the plans root is still honoured.

**Consequence, deliberate:** a project worked from Claude Code keeps its
requirement artifacts under `.claude/plans/`, where the VS Code extension's viewer
will not find them until that extension reads `plans.root` too. That is a tracked
dependency in another repository, not an oversight.

## Content that disappeared with the hand-written plugin

Regenerating from the canonical drops roughly 2,370 lines that only existed in
the hand-maintained plugin. Nearly all of it is superseded prose: the plugin
copies predate 4.3.1/4.4.0 and restate, in older wording, what the canonical now
says more precisely. Two examples:

- `al-developer` was 525 lines in the plugin against 85 in the canonical. The
  canonical is not thinner, it is factored: tool boundaries, CAN/CANNOT, stopping
  rules, skills evidencing, workflow and response style are all there, and the
  detailed patterns moved to the domain skills.
- The per-agent "BC29 / AL18 terminal contract" preface is now the adapter
  preamble's host-contract line plus the mapping table, which states the same
  boundaries once and declares them binding.

Every rule-like line that disappeared was checked against the canonical corpus.
All of them have an owner there **except one**:

> **CRITICAL: NEVER auto-delegate. Always present your output to the user and wait
> for explicit approval before delegating. This is a HITL gate.**

It was in the hand-written `al-developer`, `al-presales` and `al-conductor`, and
it turned out not to be a missing canonical rule at all. The canonical declares
delegation in frontmatter:

```yaml
handoffs:
  - label: Request Architecture Design
    agent: AL Architecture & Design Specialist
```

In Copilot a handoff is **a button the human clicks**, and `send: false` — which
four of them carry — additionally hands the human the prompt to review before it
is sent. The approval is supplied by the host, so the contract never had to write
it down. Claude Code has no `handoffs:`: an agent delegates through the `Task`
tool, with no click and no review step, and the gate disappears with the
mechanism.

That makes it an adapter concern, not a canonical one, so it is carried as a row
in the mapping table rather than as invented contract text: `handoffs:` and
`send: false` have no equivalent, therefore present your output, get explicit
approval, and only then delegate. The row reaches all twelve agents and all
eleven workflows at once, and the canonical is left alone — writing the rule
there would restate, for Copilot and the VSIX, something their own host already
enforces.

## Regenerating

```bash
node scripts/sync-foundation.js
node scripts/sync-claude-workspace.js
node scripts/sync-copilot-cli.js
node scripts/sync-codex.js
node scripts/sync-plugin-support.js
# repeat until all five report 0 — they do not converge in a single pass
node scripts/check-conformance.js
npm test
```

`copilot-cli-plugin/` and `plugins/aldc-codex/` are generated *from*
`claude-plugin/`, so they move with it. Both strip the Claude Code adapter
preamble — a table mapping Copilot surfaces onto themselves would be circular —
and restate the terminal-host contract in their own host's terms.
