# Study — claude-plugin tool-prose modernization (Copilot/VS Code → Claude Code)

**Status:** RESOLVED & EXECUTED (branch `claude/plugin-prose-modernization-8ggmq5`). §4 decided; §5 done. See "Resolution" at the bottom.
**Scope:** `claude-plugin/` only. The `.github/`/top-level (Copilot) distribution is unaffected.
**Why:** The Claude Code plugin agents were authored referencing **Copilot context-variables** (`#changes`, `#problems`, …) and the **VS Code AL extension MCP** (`ms-dynamics-smb.al/al_build`, `al_publish`, …). Those tools **do not exist in the Claude Code harness**, so the prose is misleading there. This is pre-existing and orthogonal to the FORGE→ALDC upstream port — tracked separately here.

---

## 1. What the plugin actually has at runtime

**MCP servers** (declared in `claude-plugin/.claude-plugin/plugin.json`):
- `al-symbols-mcp` → `al_find_references`, `al_get_object_definition`, `al_get_object_summary`, `al_packages`, `al_search_object_members`, `al_search_objects` (read-only symbol queries).
- `context7` → library/docs lookup.
- `microsoft-docs` → Microsoft Learn search/fetch.

**Native Claude Code tools** (per agent `tools:` frontmatter): `Read, Glob, Grep, Write, Edit, Bash, Task, WebSearch, WebFetch` (subagents drop WebSearch/WebFetch; review-subagent = `Read, Glob, Grep, Bash`).

**Not present:** the VS Code AL extension (`ms-dynamics-smb.al/*`) and Copilot chat context-variables (`#…`).

## 2. Inventory of prose references (distinct tokens, counts across `claude-plugin/agents/*.md`)

```
 9 al_build              5 al_incrementalpublish   4 al_get*            4 al_generatecpuprofile
 4 #problems             3 al_initalizesnapshotdebugging   3 al_generatepermissionset
 3 al_downloadsource     3 #usages   3 #search   3 #changes   3 #Task
 2 al_viewsnapshots      2 al_test   2 al_publish   2 al_package   2 al_finishsnapshotdebugging
 2 al_download           2 al_docs   2 #todos   2 #testFailure
 1 ms-dynamics-smb.al/al_download_source   1 al_publishwithoutdebug   1 al_generatemanifest
 1 al_downloadsymbols    1 al_debug   1 al_clearprofilecodelenses   1 al_clearcredentialscache
 1 al_buildall           1 #githubRepo   1 #edit
```
Heaviest in `al-developer.md`; also `al-architect.md`, `al-planning-subagent.md`, `al-review-subagent.md`, `al-conductor.md`.

## 3. Proposed mapping

### A. Has an equivalent → remap (low risk)
| Prosa (Copilot / VS Code) | Claude Code target |
|---|---|
| `#search`, `al_search*`, `al_get_object*` | `Grep` / `Glob` + **al-symbols-mcp** (`al_search_objects`, `al_get_object_definition`, `al_get_object_summary`, `al_search_object_members`) |
| `#usages` | al-symbols-mcp `al_find_references` |
| `#changes` | `Bash: git diff` / `git status` |
| `#edit` | `Edit` / `Write` |
| `#Task` | `Task` tool |
| `#todos` | native TodoWrite |
| `al_docs`, doc lookups | **microsoft-docs** + **context7** MCP |
| `al_packages` / `al_get_package_dependencies` | al-symbols-mcp `al_packages` (partial) |
| `#githubRepo` | `WebFetch` (or drop) |

### B. No harness equivalent → **decision required** (see §4)
Build/publish: `al_build`, `al_buildall`, `al_package`, `al_publish`, `al_publishwithoutdebug`, `al_incrementalpublish`
Symbols/source: `al_downloadsymbols`, `al_downloadsource`
Generation: `al_generatepermissionset`, `al_generatemanifest`
Test: `al_test`
Debug/profiling: `al_debug`, `al_initalizesnapshotdebugging`, `al_finishsnapshotdebugging`, `al_viewsnapshots`, `al_generatecpuprofile`, `al_clearprofilecodelenses`, `al_clearcredentialscache`

### C. Diagnostics (no native "problems" tool)
`#problems`, `#testFailure` → read compiler / test-runner output (from a Bash invocation or a human-provided log).

## 4. The blocking decision — is there an AL CLI in the target harness?

The bulk of `al-developer` (and parts of conductor/implement-subagent) assumes **build / publish / test / debug via the VS Code AL extension**, which is absent in Claude Code.

- **Option 1 — AL CLI is available via `Bash`** (e.g. an AL compiler `alc`, an AL test runner, symbol download CLI). Then bucket B maps to documented `Bash` commands and the agents keep their "execute" nature.
- **Option 2 — No AL CLI.** Build/publish/test/debug become **human / VS Code steps**: the plugin agents *generate code and instruct the user what to run*, rather than running it. This changes `al-developer`'s nature (codegen + guidance, not execution) and must be stated explicitly in its prose.

**Action:** confirm whether the intended Claude Code environment ships an AL toolchain on `PATH`. The answer selects Option 1 vs 2 and determines how every bucket-B reference is rewritten.

## 5. Proposed execution (once §4 is decided)
1. Rewrite bucket-A references across all `claude-plugin/agents/*.md` (mechanical).
2. Apply the chosen Option (1 or 2) to bucket-B references; update each agent's `tools:` and "Tool Boundaries"/"CAN/CANNOT" sections to match what it can actually do.
3. Rewrite bucket-C diagnostics to read build/test output.
4. Re-validate plugin JSON + a manual read-through per agent.
5. Consider a short "Tooling" note in `claude-plugin/CLAUDE.md` documenting the available MCP servers + native tools so future agents stay consistent.

## 6. Out of scope
- The top-level / `.github/` Copilot distribution (its `ms-dynamics-smb.al/*` references are correct *there*).
- The FORGE→ALDC port itself (done in PR #51); this study is a follow-up modernization.

---

## Resolution (executed)

**§4 decision — Option 1, *where the CLI reaches*.** The target environment ships the **AL command-line tool (ALTool / `al`)** + the AL LSP ([devenv-al-tool](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-al-tool)). Crucially, ALTool **only compiles/packages** — it has no publish, test, download-symbols, or debug verb. So the rewrite split:
- **Compile/build/package** → `Bash: al compile` / `al workspace compile` (true Option 1).
- **Symbol intelligence** → `al-symbols-mcp` (which is the LSP/MCP under the hood).
- **Publish / run tests / download symbols / debug / snapshot / CPU profile** → no CLI verb → VS Code / AL-Go-CI human steps (Option 2 for these). Agents generate code and hand off the runtime step.

**§5 executed** on branch `claude/plugin-prose-modernization-8ggmq5`, prose-only, `claude-plugin/` only (Copilot distribution untouched). Validator stayed `ALDC Core v1.1 COMPLIANT (0 warnings)`; plugin JSON re-validated:
1. **Tool-prose modernization** — all 6 tool-heavy agents (developer, architect, conductor, planning, review, implement), 4 commands (build, context-create, initialize, memory-create), 10 skills; canonical "Tooling" mapping added to `claude-plugin/CLAUDE.md`. Bucket-A remapped; bucket-B per the §4 split; bucket-C diagnostics → read `al compile` / test output.
2. **Sync — #66 token guards** ported to conductor/implement/review/dredd.
3. **Sync — #67 triage guard + #68 spec-as-truth** ported to triage, al-spec-create (§1.3 verify-events, §1.4 ground-in-framework, §5 decision-vs-signature, success criteria), planner, implementer, conductor.
4. **Sync — #70 instructions+skills actually load** (the core runtime fix — even more relevant under Claude Code, no editor-attached auto-apply): conductor injects the 7 always-on instruction micro-rules inline + passes skills as hints; implement/review/dredd load skills on demand (`Read` the `SKILL.md`); symbolic evidencing (`📐 instr ✓ · 🧠 skill·tag` / `{domain, ✓ | ↗bcq | ∅}`) replaces the verbose Skills-Loaded tables; dead "Copilot loads automatically" prose removed from architect/presales/developer.
5. **Sync — #71 checkpoint evidence row** ported to the conductor's checkpoints (adapted to the plugin's existing card format).

> Mid-session, `main` advanced (#67/#68 merged with final wording; #70/#71 landed new). The branch was **rebased onto current main** and the sync re-aligned to the merged wording — the plugin and top-level have diverged structurally, so the intent was adapted, not blind-copied.

**Considered & discarded — `allowed-tools` MCP grants (config, not prose):** plugin command `allowed-tools` frontmatter doesn't list the MCP tools (`al-symbols-mcp`, `microsoft-docs`, `context7`) referenced in prose. **Not a correctness issue** — the Claude Code docs confirm `allowed-tools` is a permission *pre-grant*, not a hard allowlist ("every tool remains callable; permission settings still govern tools not listed"). The prose works as-is; listing them would only skip an approval prompt. Marginal benefit vs. a config change on a strict-branch repo → **dropped**.
