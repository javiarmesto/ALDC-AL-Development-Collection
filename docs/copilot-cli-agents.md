# Using ALDC Agents in GitHub Copilot CLI

> Compatibility analysis and migration guide for running the 10 ALDC `.agent.md` agents as
> [custom agents in GitHub Copilot CLI](https://github.blog/ai-and-ml/github-copilot/from-one-off-prompts-to-workflows-how-to-use-custom-agents-in-github-copilot-cli/).
> Scope: ALDC Core v1.2 agent set. Status: analysis (no agent files changed yet).

## TL;DR

ALDC agents are **already written in the exact file format Copilot CLI consumes** — Markdown with
YAML frontmatter, named `*.agent.md` — and the installer already places them where the CLI looks
(`scripts/install.js` copies `agents/` → `.github/agents/` in consumer repositories). You can run
`copilot`, type `/agent`, and every ALDC agent will be **listed today**.

What does *not* carry over automatically:

1. **Tool identifiers** — the `tools:` lists use VS Code-namespaced tool ids (`vscode/memory`,
   `read/readFile`, `ms-dynamics-smb.al/al_debug`, …). The CLI has its own small tool vocabulary
   (`read`, `edit`, `search`, `execute`, `agent`, `web`, plus `mcp-server/tool`). Unknown entries
   are ignored, which can silently strip an agent down to fewer capabilities than intended.
2. **Prompt size limit** — the body below the frontmatter is capped at **30,000 characters**.
   One agent (`al-conductor`, ~38,400 chars) exceeds it; one (`al-presales`, ~26,400) is close.
3. **VS Code-only frontmatter** — `handoffs`, `argument-hint`, and the `agents:` allowlist are
   ignored outside VS Code (officially "ignored for compatibility"). The agents keep working, but
   the one-click handoff UX becomes prose suggestions.
4. **VS Code extension tools have no CLI equivalent** — AL Language extension tools
   (`ms-dynamics-smb.al/*`: debugging, snapshot, symbol search) and the BC LSP bridge
   (`sshadowsdk.al-lsp-for-agents/bclsp_*`) do not exist in a terminal session. The CLI
   replacements are `execute` (AL compiler CLI: `al compile`) and the `al-symbols-mcp` MCP server.
5. **MCP servers must be configured in the CLI** — `al-symbols-mcp`, `microsoft-learn`, `context7`
   and `github` are referenced by the agents but the CLI only connects MCP servers it knows about
   (`/mcp add`, `~/.copilot/mcp-config.json`, or per-agent `mcp-servers:` frontmatter).

Everything else — the ALDC operating model itself — ports remarkably well: the plans contracts
(`.github/plans/`), file-based memory (`memory.md`), skills loading (Copilot CLI reads
`.github/skills/`, where the installer already puts the 16 ALDC skills), and the
`user-invocable` / `disable-model-invocation` flags on the three subagents are all supported
CLI concepts.

## How Copilot CLI discovers and runs custom agents

| Aspect | Behavior |
|--------|----------|
| Repo-level agents | `.github/agents/*.agent.md` (shared with the team via version control) |
| User-level agents | `~/.copilot/agents/*.agent.md` (personal, all projects) |
| Interactive use | `copilot` → `/agent` → pick from the list; switch or deselect mid-session with `/agent` again |
| Programmatic use | `copilot --agent al-developer --prompt "Add email validation to Customer"` |
| Precedence | Repository-level overrides organization-level, which overrides enterprise-level |
| Built-in agents | The CLI ships `Explore`, `Task`, `Plan`, `Code-review` — the ALDC agents sit alongside them |

In consumer repositories nothing needs to move: `npx aldc install` already writes
`.github/agents/`. In **this framework repository** (where `toolkitRoot: .` keeps agents at the
root `agents/` tree), the CLI will not see them unless you copy/symlink the ones you want into
`.github/agents/` or `~/.copilot/agents/`.

## Frontmatter compatibility matrix

Fields actually used across the 10 ALDC agents, versus what the CLI honors
([reference](https://docs.github.com/en/copilot/reference/custom-agents-configuration)):

| Field | Used by | Copilot CLI | Notes |
|-------|---------|-------------|-------|
| `name` | all 10 | ✅ | Display name; filename is the invocation id (`--agent al-architect`) |
| `description` | all 10 | ✅ (required) | Already present everywhere — no work needed |
| `tools` | all 10 | ⚠️ | Format supported; **most current identifiers are VS Code-specific** (see mapping below) |
| `model` | all 10 | ⚠️ | `Claude Sonnet 4.6 (copilot)` is a VS Code model-picker label. The CLI selects models via `/model`; an unrecognized value falls back to the session default. Harmless, but remove or adapt to avoid confusion |
| `argument-hint` | 8 | ❌ ignored | VS Code-only; safe to keep |
| `handoffs` | 8 | ❌ ignored | VS Code-only; the handoff buttons disappear — agents must *say* the next step (ALDC agents already do this in prose) |
| `agents` (allowlist) | al-conductor | ❌ ignored | Subagent restriction becomes prose-enforced in the CLI |
| `user-invocable: false` | 3 subagents | ✅ | Hides subagents from `/agent` — the ALDC contract survives |
| `disable-model-invocation: true` | 3 subagents | ✅ | Prevents the model from auto-invoking them |
| `mcp-servers` | none yet | ✅ | Opportunity: declare `al-symbols-mcp` per-agent (see caveat below) |
| `target` | none yet | ✅ | `vscode` \| `github-copilot` — lets one repo carry both flavors side by side |

**Prompt body limit: 30,000 characters** (content below the frontmatter):

| Agent | Body size | Verdict |
|-------|-----------|---------|
| al-conductor | ~38,400 | 🔴 **Exceeds limit — must be trimmed or split** |
| al-presales | ~26,400 | 🟡 Close to limit; avoid growth |
| al-architect | ~20,100 | ✅ |
| al-review-subagent | ~16,300 | ✅ |
| dredd | ~12,700 | ✅ |
| al-implement-subagent | ~12,100 | ✅ |
| al-planning-subagent | ~11,200 | ✅ |
| al-developer | ~7,500 | ✅ |
| al-agent-builder | ~7,200 | ✅ |
| al-triage | ~6,100 | ✅ |

The natural fix for al-conductor is the ALDC way: move the embedded phase-report/plan templates
out of the agent body into `docs/templates/` (they mostly exist there already) and have the agent
`read` them at runtime instead of inlining them.

## Tool identifier mapping

The CLI tool vocabulary and its accepted aliases:

| CLI primary | Aliases | Purpose |
|-------------|---------|---------|
| `read` | Read, NotebookRead | File content access |
| `edit` | Edit, MultiEdit, Write, NotebookEdit | File editing |
| `search` | Grep, Glob | File/text search |
| `execute` | shell, Bash, powershell | Terminal commands |
| `agent` | custom-agent, Task | Invoke other custom agents (subagents) |
| `web` | WebSearch, WebFetch | Web search/fetch |
| `server-name/tool` or `server-name/*` | — | MCP server tools |

Mapping the identifiers found in the ALDC agents:

| Current (VS Code) | CLI equivalent | Comment |
|-------------------|----------------|---------|
| `read/readFile`, `read/problems`, `read/viewImage` | `read` | `problems` (live diagnostics) has no CLI feed — use `execute` + `al compile` output instead |
| `read/skill` | *(built-in)* | The CLI loads skills from `.github/skills/` natively — the 16 ALDC skills work as-is |
| `edit`, `edit/createFile`, `edit/editFiles`, `edit/rename`, `edit/createDirectory` | `edit` | |
| `search`, `search/codebase`, `search/textSearch`, `search/fileSearch`, `search/listDirectory`, `search/usages`, `search/changes`, `changes` | `search` (+ `execute` for `git diff`) | `usages`/`changes` semantics via grep + git |
| `execute`, `execute/runInTerminal`, `execute/getTerminalOutput` | `execute` | |
| `agent`, `search/searchSubagent` | `agent` | Subagent orchestration works in the CLI |
| `web`, `web/githubTextSearch`, `ms-vscode.vscode-websearchforcopilot/websearch` | `web` | |
| `todo` | — (VS Code-only) | Drop; the agent can keep a checklist in its plan doc |
| `vscode/memory`, `vscode/resolveMemoryFileUri` | — | ALDC memory is file-based (`.github/plans/memory.md`) → plain `read`/`edit` covers it |
| `vscode/askQuestions` | — | The CLI is conversational; the agent simply asks in chat. HITL gates keep working as prose |
| `vscode/runCommand`, `vscode/switchAgent`, `vscode/extensions`, `vscode/toolSearch`, `vscode/newWorkspace` | — | No equivalent; remove |
| `vscode.mermaid-chat-features/renderMermaidDiagram` | — | Emit fenced ` ```mermaid ` blocks instead (render on GitHub/MkDocs) |
| `ms-dynamics-smb.al/al_downloadsymbols`, `al_symbolsearch`, `al_symbolrelations`, `al_get_diagnostics` | `al-symbols-mcp/*` + `execute` | Symbol queries via the MCP server; diagnostics via `al compile` |
| `ms-dynamics-smb.al/al_debug`, `al_setbreakpoint`, `al_snapshotdebugging` | — | **Interactive debugging stays VS Code-only.** In the CLI, al-triage/al-developer fall back to static analysis + compiler evidence |
| `sshadowsdk.al-lsp-for-agents/bclsp_*` | — (partial: `al-symbols-mcp/*`) | LSP navigation (references, call hierarchy) has no CLI bridge; nearest substitute is al-symbols-mcp + grep |
| `al-symbols-mcp/*`, `microsoft-learn/*`, `upstash/context7/*`, `github/*`, `markitdown/*` | ✅ same syntax | Valid as-is **once the MCP server is configured in the CLI** (note: `upstash/context7` → the server name you register, e.g. `context7/*`) |

## Per-agent readiness

| Agent | CLI readiness | Blockers / degradations |
|-------|---------------|-------------------------|
| **al-developer** | 🟢 High | Loses AL debugger tools → compile-and-validate loop via `execute` (`al compile`), which its prose already describes. Needs tool remap + MCP config |
| **al-architect** | 🟢 High | Read-only design work maps cleanly; Mermaid → fenced blocks; needs tool remap |
| **al-presales** | 🟢 High | `web` + MCP docs tools exist in CLI; watch the 30k limit |
| **al-agent-builder** | 🟢 High | Straightforward remap |
| **dredd** | 🟢 High | `changes` → `git diff` via `execute`; BCQuality multi-root probing works (filesystem access) |
| **al-triage** | 🟡 Medium | Loses snapshot debugging entirely — diagnosis quality drops to static + repro-by-script |
| **al-conductor** | 🟡 Medium | 🔴 Over the 30k body limit; `agents:` allowlist ignored (prose-enforce); orchestration itself works via `agent` tool |
| **al-planning-subagent** | 🟢 High | `user-invocable: false` honored; simple remap |
| **al-implement-subagent** | 🟡 Medium | TDD cycle fine, but "compile per phase" depends on `al` CLI being installed in the terminal environment |
| **al-review-subagent** | 🟡 Medium | Loses `al_get_diagnostics` → compiler output via `execute`; BCQuality citation layer unaffected |

## MCP configuration for the CLI

The agents lean on four MCP servers. In the CLI, register them once globally
(`/mcp add`, persisted in `~/.copilot/mcp-config.json`) or per-agent via `mcp-servers:` frontmatter:

```yaml
---
name: AL Implementation Specialist
description: 'Tactical implementation specialist for Business Central extensions…'
target: github-copilot
tools: ['read', 'edit', 'search', 'execute', 'agent', 'web', 'al-symbols-mcp/*', 'microsoft-learn/*']
mcp-servers:
  al-symbols-mcp:
    type: 'local'
    command: 'npx'
    args: ['-y', 'al-symbols-mcp']
    tools: ['*']
---
```

> ⚠️ **Known issue**: per-agent `mcp-servers` declared in `~/.copilot/agents/` profiles are
> currently not connected when the agent runs as a *sub-agent* or via `--prompt`
> ([copilot-cli#2630](https://github.com/github/copilot-cli/issues/2630)). Until fixed, prefer the
> **global** `~/.copilot/mcp-config.json` so al-conductor's subagents keep their AL symbol tools.

The `github` MCP server is available out of the box in Copilot contexts (read-only by default),
so `github/*` tool references keep working without extra setup.

## What degrades, and the ALDC-native mitigation

| VS Code feature | CLI behavior | Mitigation |
|-----------------|--------------|------------|
| `handoffs` buttons | Ignored | Agents already end with "next step" prose (`@al-conductor`, `al-spec.create`); in the CLI the user runs `/agent` or the agent calls the `agent` tool |
| `askQuestions` tool | Absent | HITL gates are prose-driven ("wait for explicit approval") — they work identically in chat |
| `vscode/memory` | Absent | ALDC memory is already file-based: `.github/plans/memory.md` via `read`/`edit` |
| Prompt files (`prompts/*.prompt.md`, `/al-spec.create`) | Not a CLI concept | Wrap each core workflow as a small custom agent (the pattern the GitHub blog recommends), e.g. an `al-spec` agent whose body is the al-spec.create playbook |
| Skills (`read/skill`) | ✅ native | CLI loads `.github/skills/` — the Skills Evidencing contract carries over unchanged |
| AL debugger / snapshot | Absent | Compiler-evidence loop: `al compile` + tests via `execute`; keep interactive debugging in VS Code |

## Recommended migration path

**Phase 0 — try it (no changes).** In a consumer repo (post-install), run `copilot` → `/agent`
and select `al-developer`. It already loads; unknown tools are ignored. Good for a feel of the gaps.

**Phase 1 — dual-target profiles (low effort, recommended).**
Keep one file per agent and make the `tools:` list product-neutral:

1. Add the CLI aliases alongside — or instead of — the namespaced ids where they are equivalent
   (`read`, `edit`, `search`, `execute`, `agent`, `web`); each product ignores identifiers it
   doesn't know.
2. Keep MCP references (`al-symbols-mcp/*`, `microsoft-learn/*`) — valid in both worlds.
3. Leave `handoffs`/`argument-hint` in place (ignored gracefully outside VS Code).
4. Trim `al-conductor` below 30,000 chars by externalizing its embedded templates to
   `docs/templates/` and reading them at runtime.
5. Document the required global `~/.copilot/mcp-config.json` in the getting-started guide.

**Phase 2 — CLI-specific variants (deterministic).**
If dual-target lists prove noisy, emit CLI flavors at install time: extend `scripts/install.js`
with a `--flavor copilot-cli` transform that (a) remaps tools per the table above, (b) strips
VS Code-only fields, (c) sets `target: github-copilot`, and pair each VS Code original with
`target: vscode` so both can coexist in `.github/agents/` without duplicate `/agent` entries.

**Phase 3 — workflows as agents.**
Port the 6 core prompts (`/al-spec.create`, `/al-build`, `/al-pr-prepare`, …) as thin custom
agents so the full ALDC pipeline — architect → spec → conductor → PR — is runnable end-to-end
from the terminal: `copilot --agent al-spec --prompt "customer loyalty program"`.

## References

- [From one-off prompts to workflows: custom agents in Copilot CLI](https://github.blog/ai-and-ml/github-copilot/from-one-off-prompts-to-workflows-how-to-use-custom-agents-in-github-copilot-cli/) (GitHub Blog)
- [Custom agents configuration reference](https://docs.github.com/en/copilot/reference/custom-agents-configuration) (GitHub Docs)
- [Copilot CLI: custom agents & coding-agent delegation](https://github.blog/changelog/2025-10-28-github-copilot-cli-use-custom-agents-and-delegate-to-copilot-coding-agent/) (Changelog)
- [Copilot CLI: enhanced agents, context management](https://github.blog/changelog/2026-01-14-github-copilot-cli-enhanced-agents-context-management-and-new-ways-to-install/) (Changelog)
- [copilot-cli-for-beginners — lesson 04: agents & custom instructions](https://github.com/github/copilot-cli-for-beginners/blob/main/04-agents-custom-instructions/README.md)
- [awesome-copilot: community agents](https://github.com/github/awesome-copilot)

---

**Framework**: ALDC Core v1.2 | **Analyzed**: 10 agents | **Date**: 2026-07-05
