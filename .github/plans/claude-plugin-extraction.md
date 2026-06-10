# Plan — Extract `claude-plugin/` into its own clean repo (Option A)

**Status:** PROPOSAL — awaiting confirmation. No code moved yet.
**Decision:** **Option A — hard split.** The Claude Code distribution becomes a standalone repo and stops syncing from the Copilot-native monorepo. Chosen because the goal is to *"work only on the Claude Code version"* — so we pay the one cost (skills knowledge maintained independently) to kill the manual cross-distribution sync that this whole modernization effort had to do by hand (#66–#71).

---

## 1. Why (the problem this solves)

Today **one repo ships two versions** of the same framework:
- **Copilot / VS Code** distribution — top-level `agents/`, `prompts/`, `instructions/`, `packages/foundation/`.
- **Claude Code plugin** — `claude-plugin/`.

Improvements made on the Copilot side do **not** propagate automatically; they are **hand-ported** to `claude-plugin/` (exactly what PR #69 just did for #66–#71). That manual sync is the recurring cost. Splitting removes it: the Claude repo is the only thing you touch.

**Bonus fix — install one-liner.** In the monorepo the marketplace manifest sits at `claude-plugin/.claude-plugin/marketplace.json` (a subfolder), so `/plugin marketplace add owner/repo` can't discover it. When `claude-plugin/` becomes the **root** of the new repo, that manifest is at repo root and the remote one-liner works with **no restructuring**.

---

## 2. Starting point

- `main` @ `debe516` — PR #69 merged, so `claude-plugin/` is fully modernized (Claude Code tool vocabulary) and synced to #66–#71. **Extract from here, not from a branch.**
- `claude-plugin/` is self-contained: **60 files, ~840K**. Hooks already use `${CLAUDE_PLUGIN_ROOT}` (portable — no absolute paths to fix).

---

## 3. What moves vs. what stays

**Moves** (becomes the root of the new repo): everything under `claude-plugin/` —
`.claude-plugin/` (plugin.json + marketplace.json), `agents/`, `commands/`, `skills/`, `hooks/`, `rules-templates/`, `tools/bcquality/`, `.mcp.json`, `CLAUDE.md`, `README.md`.

**Stays in the monorepo, untouched:** the entire Copilot-native distribution (`agents/`, `prompts/`, `instructions/`, `packages/foundation/`, `tools/aldc-validate`, the existing workflows). Its `ms-dynamics-smb.al/*` references are correct there.

---

## 4. Extraction mechanics (preserve history)

Use a subtree split so the new repo keeps the git history of just `claude-plugin/`, with paths rewritten to the root.

```bash
# in a fresh clone of the monorepo, on main
git checkout main && git pull

# 1) split claude-plugin/ into a standalone history on a temp branch
git subtree split --prefix=claude-plugin -b export-claude-plugin
#   (alternative, cleaner if installed: git filter-repo --subdirectory-filter claude-plugin)

# 2) push that history as the new repo's main (repo created empty on GitHub first)
git push git@github.com:<owner>/<new-repo>.git export-claude-plugin:main
```

After this, in the new repo: repo-root `.claude-plugin/marketplace.json` exists (was `claude-plugin/.claude-plugin/...`), `source: "./"` still valid (plugin root = repo root). **The install one-liner works immediately:**

```
/plugin marketplace add <owner>/<new-repo>
/plugin install aldc@aldc-marketplace
```

---

## 5. Cleanup / changes inside the NEW repo (one small PR there)

1. **Fix legacy `.github/skills/` prose → `skills/`.** 7 spots reference the Copilot path that doesn't exist standalone:
   - `agents/al-architect.md`, `al-conductor.md`, `al-developer.md` (×2, incl. line `[Load skill-testing from .github/skills/]`), `al-implement-subagent.md`, `al-presales.md`, `al-review-subagent.md` (the "full path is `.github/skills/...`" note).
   - In a plugin, skills resolve by namespace; prose should say `skills/<name>/SKILL.md` (repo-root) or just "the skill's `SKILL.md`".
2. **README install** → lead with the now-working remote one-liner; keep `--plugin-dir` / local-marketplace as dev/testing.
3. **`plugin.json`** → update `homepage` / `repository` to the new repo URL (version stays `4.1.0` or bump).
4. **Minimal CI** (port only what the plugin needs):
   - JSON validation: `plugin.json`, `marketplace.json`, `.mcp.json` parse.
   - `claude plugin validate` (the official check).
   - Optional: `bcquality-evidence` workflow if you keep dredd's citation-validation (it expects an external BCQuality clone — carry the workflow only if you use it).
5. **LICENSE** (MIT) + a top-level README (the current `claude-plugin/README.md` already serves; promote it).
6. Minor staleness: the `Stop` hook message still says *"Verify Skills Evidencing was declared"* — post-#70 it's a symbolic line; reword to taste (cosmetic).

> The CLI tooling story is unchanged and correct already: build = `al compile` (ALTool), symbols = `al-symbols-mcp`, publish/test/debug = VS Code/CI. No tool prose changes needed beyond the `.github/skills/` path fix.

---

## 6. What to do with `claude-plugin/` left behind in the monorepo

Two choices (decide):
- **(a) Remove it + leave a pointer.** Delete `claude-plugin/` from the monorepo, add a short note in the root README / a stub `claude-plugin/README.md`: *"The Claude Code distribution now lives at `<owner>/<new-repo>`."* Cleanest; no stale copy.
- **(b) Freeze it.** Leave it as-is with a deprecation note. Only if you want the monorepo to keep a (frozen) reference copy.

Recommendation: **(a)** — a stale copy reintroduces the very drift we're removing.

---

## 7. Skills knowledge — the one ongoing cost (Option A stance)

The `skills/` prose is ~the same in both distributions. Under Option A the **new repo owns its copy**; there is **no sync back** to the monorepo's `skills/`. Accept that the two may drift. If that becomes painful later, revisit:
- **B** — a single agnostic source + a generator that emits both distributions (fixes drift at the root; real engineering).
- **C** — a shared skills package/submodule both repos consume.

These are explicitly **out of scope** for Option A; noted only so the trade-off is on record.

---

## 8. Decisions needed from you

1. **New repo name** (e.g. `aldc-claude-code`) — and **you create it empty on GitHub** (my GitHub access in-session is scoped to `aldc-al-development-collection` + `apm-aldc`; I likely can't create a new repo — I can confirm with `list_repos`/`add_repo`).
2. **History:** preserve via subtree split (recommended) vs. fresh start.
3. **Monorepo leftover:** remove + pointer (recommended) vs. freeze.

## 9. Sequencing once confirmed

1. You create the empty repo; give me the name (and add it to session scope if possible).
2. I (or you) run the subtree split + push (§4).
3. I open a small cleanup PR **in the new repo** (§5).
4. I open a PR **in the monorepo** to remove `claude-plugin/` + add the pointer (§6a).
5. Verify install end-to-end: remote one-liner → `/agents` shows the 5 agents → `/aldc:` commands → `/aldc:al-initialize`.

## 10. Risk / rollback

- **Low risk, fully reversible.** Nothing is destroyed at split time — the monorepo keeps everything until step 4. If anything's off, the new repo can be re-split from `main` again.
- The only irreversible-ish step is removing `claude-plugin/` from the monorepo (step 4) — and that's just a revertible commit.
