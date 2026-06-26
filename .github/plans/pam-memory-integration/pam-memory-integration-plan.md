# Implementation Plan: PAM Memory Integration (recall-first / ingest-once)

**Date**: 2026-06-26
**req_name**: `pam-memory-integration`
**Complexity**: MEDIUM
**Author**: ALDC + PAM integration design
**Branch**: `claude/pam-memory-rereads-8f0rc1`
**Status**: 🚧 Plan — pending approval before implementation

---

## 1. Objective

Eliminate the repeated re-reading of transversal documentation (`architecture.md`,
`spec.md`, `*-plan.md`, `*-phase-N-complete.md`, `memory.md`) that is observable
across ALDC agent runs and phases.

**Strategy:** treat **Portable Agent Memory (PAM) as a read-through cache** for ALDC's
plan/memory artifacts.

- A document is **read from disk at most once per change** (the producing agent), then
  **ingested into PAM**.
- Every downstream agent/phase **re-hydrates the relevant slice** from PAM instead of
  re-opening the `.md`.
- A **BLAKE3 content-hash registry** invalidates the cache only when a document actually
  changes.

**Target outcome:** reduce re-reads from `O(phases × agents)` to `O(document-changes)`.

---

## 2. Scope

### In scope
- Two automatic enforcement hooks in the ALDC plugin (`claude-plugin/hooks/hooks.json`):
  - `SessionStart` → **auto-recall** (inject scoped memory as session context).
  - `PostToolUse (Write|Edit)` → **auto-ingest** plan docs on change (+ hash registry).
- A `tools/pam/` script set that drives the PAM **SDK directly** (hooks cannot call MCP).
- Registering the **PAM MCP server** in `.mcp.json` for on-demand agent calls
  (`pam_recall`, `pam_rehydrate`, `pam_remember`).
- A backfill workflow `al-memory.sync` to seed PAM from existing `.github/plans/**.md`.
- A short **"recall-first" protocol** block injected into agent definitions.

### Out of scope (separate follow-ups)
- Improving PAM's ranking engine (embeddings/recency) — tracked separately; current
  salience/keyword ranking is acceptable for v1.
- Replacing the markdown artifacts. They **remain the source of truth**; PAM is the
  hot index, not a replacement.

---

## 3. Prerequisites (must be resolved BEFORE coding)

| # | Prerequisite | Why | Decision needed |
|---|--------------|-----|-----------------|
| **P1** | **Python 3.10+ available in the hook runtime** | Hooks run `tools/pam/*.py` using the PAM SDK. | Confirm runtime (web container ships Python). |
| **P2** | **PAM SDK installed & importable** | `pam-autosave.py` auto-pip-installs at runtime — fragile and slow. | Pin `pam-sdk` to a tagged release (not `@main`); decide vendored vs. pinned pip dependency. |
| **P3** | **PAM store location (`PAM_HOME`)** | ⚠️ **Remote/web sessions are ephemeral** — `~/.pam` is wiped between sessions, so cross-session continuity is lost unless the artifact is durable. | Set `PAM_HOME` to a **repo-relative path** (proposed: `.github/plans/.pam/`) and **commit the `.pam` artifact** so it survives container reclaim. |
| **P4** | **Signing key handling** | PAM signs with Ed25519. Committing `signing.key` (private) is a secret leak. | Choose: (a) **unsigned, integrity-only** (`root_hash` BLAKE3) for the repo-committed store, sign only on `/export-memory`; or (b) keep private key as a CI/user secret (env), commit only `signing.pub` for verification. **Recommended: (a) for v1.** |
| **P5** | **PAM MCP server registered** | Agents call `pam_recall`/`pam_rehydrate` on demand mid-task. Not in `.mcp.json` today. | Add `pam` server entry to `claude-plugin/.mcp.json` **and** `plugin.json.mcpServers`; resolve launch command (path to `pam-server.py` or a pip console-script). |
| **P6** | **Task/scope detection at SessionStart** | Recall must know "for what task". At session start the task is unknown. | Infer from: active git branch + latest `working` entry + active requirement row in `memory.md`. Fallback: recall identity + high-salience semantic only. |
| **P7** | **Hash registry format & location** | Drives cache invalidation. | Store `{relpath: blake3}` map in `.github/plans/.pam/doc-hashes.json` (committed). |
| **P8** | **`.gitignore` policy** | Avoid committing transient working memory / keys. | Commit `memory.pam` + `doc-hashes.json`; ignore `signing.key`, scratch, `*.tmp`. |

> **Critical prerequisite is P3+P4**: the ephemeral-container reality means the store
> must live in the repo, which forces the signing decision. Resolve these two first.

---

## 4. Architecture

Two integration surfaces, deliberately separated:

```
 (A) AUTOMATIC — deterministic, via hooks → PAM SDK directly
 ─────────────────────────────────────────────────────────────
   SessionStart ──► tools/pam/recall.py   ──► rehydrate(task) ──► stdout
                                                                   │
                                          Claude injects as session context (additionalContext)

   PostToolUse  ──► tools/pam/ingest.py   ──► reads tool_input.file_path (stdin JSON)
   (Write|Edit)      │                         │
                     │  filter: .github/plans/**.md only
                     │  compute BLAKE3; compare to doc-hashes.json
                     │  if changed → chunk → pam_remember(entries + provenance) → update hash
                     └─ else → no-op (re-read avoided)

 (B) ON-DEMAND — agent-driven, via MCP
 ─────────────────────────────────────────────────────────────
   agent ──► pam_recall / pam_rehydrate / pam_remember  (mid-task, when it needs a slice)
```

- **Hooks (A)** can only run shell/Python; they use the PAM **SDK** (same pattern as the
  existing `pam-autosave.py`). They do **not** call MCP.
- **MCP (B)** is what agents invoke explicitly when they need something the SessionStart
  recall didn't include.

---

## 5. Hook implementation plan

### 5.1 `SessionStart` → `tools/pam/recall.py`
- **Trigger:** add a `command` hook to the existing `SessionStart` array in
  `claude-plugin/hooks/hooks.json` (append, do not replace the bcquality hook).
- **Behaviour:**
  1. Resolve `PAM_HOME` (P3). If no store → exit 0 silently (first run).
  2. Determine task/scope (P6).
  3. `RehydrationEngine.rehydrate(artifact, task)` → framed, injection-resistant text.
  4. Print to **stdout** → Claude Code injects it as session context.
- **Budget:** cap re-hydrated context (e.g. `max_tokens` modest, ~4–8k) so it never
  bloats the window. Timeout ≤ 15s (matches existing SessionStart timeout).
- **Failure mode:** any error → print nothing, exit 0 (never block a session).

### 5.2 `PostToolUse (Write|Edit)` → `tools/pam/ingest.py`
- **Trigger:** the `PostToolUse` matcher `Write|Edit` already exists; append a second
  hook command alongside the current echo.
- **Behaviour:**
  1. Read hook payload from **stdin** (JSON) → extract `tool_input.file_path`.
  2. **Path filter:** only act on `**/.github/plans/**/*.md` (and `memory.md`). Anything
     else → exit 0.
  3. Compute BLAKE3 of the file; compare with `doc-hashes.json`.
  4. If **unchanged** → exit 0 (the re-read/re-ingest we are eliminating).
  5. If **changed/new** → chunk the doc by section, map to PAM entry types
     (see §6), `pam_remember` each with `provenance = {file, section, hash}`, update
     the hash registry.
- **Idempotency:** re-ingest replaces prior entries for that `{file, section}` (tag by
  provenance) to avoid duplicate accumulation.
- **Timeout:** ≤ 10s. **Failure mode:** error → exit 0, log to `.pam/ingest.log`.

### 5.3 `Stop` (optional, phase 2)
- Reuse/extend the autosave pattern: persist `working` memory (current focus/next steps)
  with a **TTL tag** so it does not pollute future sessions.

---

## 6. Document → PAM entry mapping

| ALDC artifact / section | PAM component | Notes |
|-------------------------|---------------|-------|
| `architecture.md` Design Decisions | `semantic` | subject-predicate-object + confidence |
| ALDC principles / project info | `identity` | persona, policies, custom_instructions |
| `spec.md` requirements | `semantic` | provenance → architecture |
| `*-plan.md`, current phase | `working` | TTL; ephemeral |
| `*-phase-N-complete.md` | `episodic` | salience + timestamp (recency decays) |
| `memory.md` Decisions Log | `semantic` | |
| `memory.md` Lessons / Problem-Solution | `procedural` | `usage_count` for reuse ranking |

### Per-agent recall scope (capability intent)
| Agent | Recall scope | Ingests |
|-------|--------------|---------|
| `al-architect` | identity + semantic | architecture.md |
| `al-spec.create` | semantic (architecture) | spec.md |
| `al-conductor` | semantic + episodic + working | plan + phase-complete |
| `al-implement-subagent` | procedural + semantic(module) + working | new patterns (procedural) |
| `al-planning/review-subagent` | minimal phase slice | — |
| `al-memory.create` | — | decisions/lessons |

---

## 7. Recall-first protocol (agent-facing)

Add a short, shared rule (e.g. a new `claude-plugin/rules-templates/al-memory-recall.md`
referenced from agent prompts):

```
Before opening any .github/plans/**.md document:
1. Call pam_recall / pam_rehydrate scoped to your current task.
2. Open the .md ONLY if recall returns nothing for it (miss) or its hash changed (stale).
3. After producing/updating a plan doc, it is auto-ingested by the PostToolUse hook —
   do not manually re-ingest.
```

The SessionStart hook already injects the common slice, so in steady state agents rarely
need step 1 manually.

---

## 8. Milestones

| Phase | Deliverable | Gate |
|-------|-------------|------|
| **0** | Resolve prerequisites P1–P8 (decisions documented) | HITL approval |
| **1** | `tools/pam/` scripts: `recall.py`, `ingest.py`, `hashes.py` + store bootstrap | unit-tested in isolation |
| **2** | Wire both hooks into `hooks.json` (append, non-destructive) | manual session smoke test |
| **3** | Register PAM MCP server in `.mcp.json` + `plugin.json` | agents can call `pam_recall` |
| **4** | `al-memory.sync` workflow (backfill existing docs) | seeds store from `.github/plans/` |
| **5** | `al-memory-recall.md` rule + reference from agent prompts | recall-first documented |
| **6** | Measurement: re-read count before/after on a sample requirement | re-reads reduced |

---

## 9. Acceptance criteria

- A plan doc unchanged across a phase is **read from disk 0 times** after first ingest
  (verified via hook log + Read tool traces).
- SessionStart injects a **bounded** memory slice (≤ configured token budget).
- Editing `architecture.md` triggers exactly **one** re-ingest; an unrelated `.al` edit
  triggers **none**.
- Integrity: `pam_verify` passes on the committed store (per P4 decision).
- No session is ever blocked by a PAM hook failure (all hooks fail open, exit 0).

---

## 10. Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stale cache (doc edited outside hook, e.g. external git pull) | agent acts on old memory | Hash check on recall: if `blake3(file) ≠ registry` → force re-read+re-ingest |
| Ephemeral container wipes store (P3) | continuity lost | Commit `.pam` to repo; bootstrap from repo on SessionStart |
| Committing private signing key (P4) | secret leak | Integrity-only in repo; sign on export; key never committed |
| Ingest duplicates inflate store | recall noise, larger context | Idempotent re-ingest keyed by `{file, section}` provenance |
| PAM SDK install latency in hook | slow session start | Pre-pin/vendor SDK (P2); recall hook caps work + fails open |
| Over-injection at SessionStart | window bloat | Hard token budget on rehydrate; identity+high-salience only as fallback |

---

## 11. Rollback

All changes are **additive and fail-open**:
- Hooks are appended; removing the added `command` entries restores prior behaviour.
- MCP server entry can be removed from `.mcp.json` with no effect on existing servers.
- The `.pam` store and `tools/pam/` are self-contained; deleting them disables the cache
  with zero impact on the markdown source-of-truth artifacts.

---

## 12. Open decisions for the user (HITL gate before Phase 1)

1. **Target platform** (§13): Claude Code (hooks), GitHub Copilot Chat (instructions + MCP), or **both** — this is the first decision; it changes the enforcement mechanism.
2. **Store location & commit policy** (P3): repo-committed `.github/plans/.pam/memory.pam` — confirm.
3. **Signing** (P4): integrity-only in repo + sign-on-export — confirm or choose key-as-secret.
4. **PAM SDK delivery** (P2): pinned pip release vs. vendored copy.
5. **Recall scope at session start** (P6): branch+working-entry inference — confirm fallback.

---

## 13. Platform applicability — Claude Code vs GitHub Copilot Chat

ALDC ships for **two runtimes**: the Claude Code plugin (`claude-plugin/`) and GitHub
Copilot Chat / VS Code (`prompts/*.prompt.md`). **The hook mechanism in §4–§5 is
Claude-Code-specific.** Copilot Chat has **no lifecycle hooks** (`SessionStart`/
`PostToolUse` do not exist), so "recall-first / ingest-once" must be enforced differently.

| Capability | Claude Code | GitHub Copilot Chat (VS Code) |
|------------|-------------|-------------------------------|
| Auto recall at session start | ✅ `SessionStart` hook → inject context | ❌ no hook → use **always-applied custom instructions** (`.github/copilot-instructions.md`) that tell the model to call `pam_recall` first |
| Auto ingest on doc change | ✅ `PostToolUse(Write\|Edit)` hook | ❌ no equivalent → **instruction-driven** ("after editing a plan doc, call PAM remember") or manual at session end |
| Path-scoped activation | matcher in `hooks.json` | `.instructions.md` with `applyTo: ".github/plans/**"` frontmatter |
| Memory store backend | PAM SDK (hooks) + PAM MCP | **PAM GitHub Copilot extension** (`@pam remember`/`recall`, already shipped) and/or PAM MCP via `.vscode/mcp.json` |
| Deterministic enforcement | **Yes** (code runs regardless of model) | **No** — relies on the model following instructions (best-effort) |

### Implication
- **Claude Code** → the §4–§5 hook plan applies as written (deterministic, the strongest
  guarantee against re-reads).
- **Copilot Chat** → replace hooks with:
  1. An always-on `copilot-instructions.md` "recall-first" rule.
  2. An `.instructions.md` with `applyTo: .github/plans/**` for ingest-on-edit guidance.
  3. The **PAM Copilot extension** (`plugins/github-copilot/`) or PAM MCP in
     `.vscode/mcp.json` for the actual recall/remember calls.
  - **Caveat:** enforcement is best-effort (model-dependent), not deterministic. Re-read
    reduction will be weaker than under Claude Code hooks.
- **Both** → ship the hooks for Claude Code **and** the instruction/MCP layer for Copilot;
  the §6 entry mapping, §7 protocol, and the `.pam` store (§3) are shared between them.

> **Recommendation:** implement the Claude Code hook path first (deterministic, measurable),
> then add the Copilot Chat instruction/MCP layer reusing the same store and mapping.
