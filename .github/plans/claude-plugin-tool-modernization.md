# Study — claude-plugin tool-prose modernization (Copilot/VS Code → Claude Code)

**Status:** OPEN study — no agent files changed yet. Blocked on one decision (AL CLI availability, §4).
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
