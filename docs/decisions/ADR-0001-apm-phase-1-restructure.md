# ADR-0001 — APM Phase 1: Restructure Repo to packages/

> **Skills applied**: skill-performance (build pipeline analysis, dependency tracing), skill-events (hook topology mapping)
> **Patterns applied**: Source-inventory-before-move, Compatibility-shim via build script, Atomic-block validation

**Date**: 2026-04-28
**Status**: Proposed (awaiting human validation per block)
**Author**: al-architect
**Branch**: feat/apm-phase-1-restructure

---

## 1. Context and Decision

### Why restructure?

ALDC is being prepared for dual distribution:
- **Channel A (live)**: VS Code Marketplace VSIX — must continue producing an identical artifact.
- **Channel B (future)**: Microsoft APM (Agent Package Manager) — added in Phase 2+. NOT touched in this phase.

The current flat layout (`agents/`, `skills/`, `prompts/`, `instructions/` at repo root) conflates framework artefacts of different ownership scopes. Moving to `packages/*/` gives each functional unit an explicit boundary aligned with ALDC Core v1.1 decomposition, making future APM manifests trivial to write (one manifest per `packages/` subdirectory).

### Compatibility constraint

The VSIX extension reads content via `prepare-package.js` (`toolbox/al-coding-agent-collection/prepare-package.js`). That script copies from fixed source paths relative to `repoRoot`. After the restructure, those source paths must be updated to read from `packages/*/` — but the _output_ that goes into the VSIX `templates/` folder and ultimately into consumer `.github/` directories must be byte-for-byte identical.

---

## 2. Scope of This Phase

| In scope | Out of scope |
|----------|-------------|
| Moving artefacts to `packages/*/` | Adding `apm.yml` manifests |
| Updating `prepare-package.js` source paths | Publishing to APM |
| Updating CI path triggers in `aldc-validate.yml` | New features or content changes |
| Fixing ROADMAP-2026.md errata (see §6) | Changing any agent/skill content |
| Updating `validate-al-collection.js` dir checks | Modifying `aldc.yaml` toolkitRoot logic |
| Updating `scripts/test-local-install.js` | Changing VSIX output structure |

---

## 3. Current Artefact Inventory

All paths below are relative to repo root.

### 3.1 Agents

| File | Current path | Destination package | Proposed path |
|------|-------------|---------------------|--------------|
| al-architect.agent.md | `agents/al-architect.agent.md` | conductor | `packages/conductor/agents/al-architect.agent.md` |
| al-conductor.agent.md | `agents/al-conductor.agent.md` | conductor | `packages/conductor/agents/al-conductor.agent.md` |
| al-developer.agent.md | `agents/al-developer.agent.md` | developer | `packages/developer/agents/al-developer.agent.md` |
| al-implement-subagent.agent.md | `agents/al-implement-subagent.agent.md` | implement-subagent | `packages/implement-subagent/agents/al-implement-subagent.agent.md` |
| al-planning-subagent.agent.md | `agents/al-planning-subagent.agent.md` | conductor | `packages/conductor/agents/al-planning-subagent.agent.md` |
| al-presales.agent.md | `agents/al-presales.agent.md` | developer | `packages/developer/agents/al-presales.agent.md` |
| al-review-subagent.agent.md | `agents/al-review-subagent.agent.md` | review-subagent | `packages/review-subagent/agents/al-review-subagent.agent.md` |
| al-agent-builder.agent.md | `agents/al-agent-builder.agent.md` | developer | `packages/developer/agents/al-agent-builder.agent.md` |
| index.md | `agents/index.md` | foundation | `packages/foundation/agents/index.md` |

> **Rationale for al-planning-subagent placement in `conductor`**: The planning subagent is exclusively called by al-conductor. It has no independent existence — its lifecycle is bounded to the conductor pipeline. Placing it in `packages/conductor/` reflects that dependency explicitly.
>
> **Rationale for al-presales placement in `developer`**: al-presales is user-invocable and has no subagent role. It is the closest fit to `developer` as a stand-alone user-facing agent. An alternative would be a top-level `packages/presales/` package — see Decision 3 in §7.

### 3.2 Skills (11 required + 3 optional BC Agents pack)

| Directory | Current path | Destination package | Proposed path |
|-----------|-------------|---------------------|--------------|
| skill-api | `skills/skill-api/` | foundation | `packages/foundation/skills/skill-api/` |
| skill-copilot | `skills/skill-copilot/` | foundation | `packages/foundation/skills/skill-copilot/` |
| skill-debug | `skills/skill-debug/` | foundation | `packages/foundation/skills/skill-debug/` |
| skill-events | `skills/skill-events/` | foundation | `packages/foundation/skills/skill-events/` |
| skill-estimation | `skills/skill-estimation/` | foundation | `packages/foundation/skills/skill-estimation/` |
| skill-migrate | `skills/skill-migrate/` | foundation | `packages/foundation/skills/skill-migrate/` |
| skill-pages | `skills/skill-pages/` | foundation | `packages/foundation/skills/skill-pages/` |
| skill-performance | `skills/skill-performance/` | foundation | `packages/foundation/skills/skill-performance/` |
| skill-permissions | `skills/skill-permissions/` | foundation | `packages/foundation/skills/skill-permissions/` |
| skill-testing | `skills/skill-testing/` | foundation | `packages/foundation/skills/skill-testing/` |
| skill-translate | `skills/skill-translate/` | foundation | `packages/foundation/skills/skill-translate/` |
| skill-agent-instructions | `skills/skill-agent-instructions/` | developer | `packages/developer/skills/skill-agent-instructions/` |
| skill-agent-task-patterns | `skills/skill-agent-task-patterns/` | developer | `packages/developer/skills/skill-agent-task-patterns/` |
| skill-agent-toolkit | `skills/skill-agent-toolkit/` | developer | `packages/developer/skills/skill-agent-toolkit/` |
| skill-manifest | `skills/skill-manifest/` | foundation | `packages/foundation/skills/skill-manifest/` |
| index.md | `skills/index.md` | foundation | `packages/foundation/skills/index.md` |

> **Rationale**: The 11 ALDC core skills are transversal; they are loaded by al-architect, al-developer, and al-conductor alike. `foundation` is the correct owner. The BC Agents pack skills are specific to the agent-builder workflow, which belongs to `developer` (or optionally a future `packages/bc-agents/` package — see Decision 2 in §7).

### 3.3 Prompts / Workflows

| File | Current path | Destination package | Proposed path |
|------|-------------|---------------------|--------------|
| al-spec.create.prompt.md | `prompts/al-spec.create.prompt.md` | conductor | `packages/conductor/prompts/al-spec.create.prompt.md` |
| al-build.prompt.md | `prompts/al-build.prompt.md` | foundation | `packages/foundation/prompts/al-build.prompt.md` |
| al-pr-prepare.prompt.md | `prompts/al-pr-prepare.prompt.md` | foundation | `packages/foundation/prompts/al-pr-prepare.prompt.md` |
| al-context.create.prompt.md | `prompts/al-context.create.prompt.md` | foundation | `packages/foundation/prompts/al-context.create.prompt.md` |
| al-memory.create.prompt.md | `prompts/al-memory.create.prompt.md` | foundation | `packages/foundation/prompts/al-memory.create.prompt.md` |
| al-initialize.prompt.md | `prompts/al-initialize.prompt.md` | foundation | `packages/foundation/prompts/al-initialize.prompt.md` |
| al-agent.create.prompt.md | `prompts/al-agent.create.prompt.md` | developer | `packages/developer/prompts/al-agent.create.prompt.md` |
| al-agent.instructions.prompt.md | `prompts/al-agent.instructions.prompt.md` | developer | `packages/developer/prompts/al-agent.instructions.prompt.md` |
| al-agent.task.prompt.md | `prompts/al-agent.task.prompt.md` | developer | `packages/developer/prompts/al-agent.task.prompt.md` |
| al-agent.test.prompt.md | `prompts/al-agent.test.prompt.md` | developer | `packages/developer/prompts/al-agent.test.prompt.md` |
| index.md | `prompts/index.md` | foundation | `packages/foundation/prompts/index.md` |
| README.md | `prompts/README.md` | foundation | `packages/foundation/prompts/README.md` |

> **Rationale for al-spec.create placement in `conductor`**: `al-spec.create` is the mandatory predecessor step in the MEDIUM/HIGH flow (`al-architect → al-spec.create → al-conductor`). It is architecturally coupled to the conductor pipeline.

### 3.4 Instructions

| File | Current path | Destination package | Proposed path |
|------|-------------|---------------------|--------------|
| al-guidelines.instructions.md | `instructions/al-guidelines.instructions.md` | foundation | `packages/foundation/instructions/al-guidelines.instructions.md` |
| al-code-style.instructions.md | `instructions/al-code-style.instructions.md` | foundation | `packages/foundation/instructions/al-code-style.instructions.md` |
| al-naming-conventions.instructions.md | `instructions/al-naming-conventions.instructions.md` | foundation | `packages/foundation/instructions/al-naming-conventions.instructions.md` |
| al-performance.instructions.md | `instructions/al-performance.instructions.md` | foundation | `packages/foundation/instructions/al-performance.instructions.md` |
| al-error-handling.instructions.md | `instructions/al-error-handling.instructions.md` | foundation | `packages/foundation/instructions/al-error-handling.instructions.md` |
| al-events.instructions.md | `instructions/al-events.instructions.md` | foundation | `packages/foundation/instructions/al-events.instructions.md` |
| al-testing.instructions.md | `instructions/al-testing.instructions.md` | foundation | `packages/foundation/instructions/al-testing.instructions.md` |
| copilot-instructions.md | `instructions/copilot-instructions.md` | foundation | `packages/foundation/instructions/copilot-instructions.md` |
| al-agent-toolkit.instructions.md | `instructions/al-agent-toolkit.instructions.md` | developer | `packages/developer/instructions/al-agent-toolkit.instructions.md` |
| index.md | `instructions/index.md` | foundation | `packages/foundation/instructions/index.md` |

> **Note on hooks**: The hooks (`PostToolUse`, `Stop`) live in TWO places today:
> - `.claude/settings.json` (hooks section, lines 28-52) — Claude Code settings, stays at root
> - `claude-plugin/hooks/hooks.json` — a distributable copy for the Claude plugin channel
>
> Both define identical `PostToolUse` (Write|Edit matcher) and `Stop` hooks. The `claude-plugin/hooks/hooks.json` file is the distributable artefact. It should move to `packages/foundation/hooks/hooks.json`.
> The `.claude/settings.json` is a workspace config and is NOT moved.
>
> **Note on decálogo / 12 norms**: The 12 norms referenced in the task context are the ALDC Core Spec normative section. They live in `docs/framework/ALDC-Core-Spec-v1.1.md` (spec is immutable, stays in `docs/framework/`). The _skills evidencing_ mechanism is documented in that spec and enforced via agent frontmatter. No separate "decálogo file" exists as a standalone artefact today — the norms are embedded in the spec.

### 3.5 Hooks

| File | Current path | Destination package | Proposed path |
|------|-------------|---------------------|--------------|
| hooks.json | `claude-plugin/hooks/hooks.json` | foundation | `packages/foundation/hooks/hooks.json` |

### 3.6 Artefacts NOT moved (stay at current location)

| Artefact | Path | Reason |
|----------|------|--------|
| `docs/framework/` | stays | Normative spec — immutable, not a deployable package |
| `docs/templates/` | stays | Immutable templates referenced by aldc.yaml |
| `docs/decisions/` | stays (new) | ADR home — meta, not a package |
| `aldc.yaml` | stays | Repo root config |
| `collections/` | stays | GitHub Copilot Collections manifest — flat format required |
| `scripts/install.js` | stays | npm CLI entry point |
| `scripts/validate-al-collection.js` | stays | npm validation script |
| `scripts/test-local-install.js` | stays | Local test harness |
| `tools/aldc-validate/` | stays | Standalone validator, referenced by CI |
| `tools/bc-agents/` | stays | Python/shell scaffolders |
| `bcagentpack/` | stays | BC Agents pack distributable (Claude-specific) |
| `.claude/settings.json` | stays | Claude Code workspace settings |
| `claude-plugin/CLAUDE.md` | stays | Claude plugin documentation |
| `claude-plugin/README.md` | stays | Claude plugin documentation |

---

## 4. Movement Blocks (for sequential human validation)

The moves are grouped into 5 atomic blocks. Each block is independently buildable and verifiable before proceeding to the next.

### Block 0 — Scaffolding (no file moves)

Create empty package directories:

```
packages/
  foundation/
    agents/
    instructions/
    prompts/
    skills/
    hooks/
  conductor/
    agents/
    prompts/
  developer/
    agents/
    prompts/
    skills/
    instructions/
  implement-subagent/
    agents/
  review-subagent/
    agents/
```

**Validation**: `ls packages/` shows 5 directories, all empty.

---

### Block 1 — foundation: instructions + hooks

Move all files from `instructions/` to `packages/foundation/instructions/` EXCEPT `al-agent-toolkit.instructions.md` (goes in Block 3).

Files:
- `instructions/al-guidelines.instructions.md`
- `instructions/al-code-style.instructions.md`
- `instructions/al-naming-conventions.instructions.md`
- `instructions/al-performance.instructions.md`
- `instructions/al-error-handling.instructions.md`
- `instructions/al-events.instructions.md`
- `instructions/al-testing.instructions.md`
- `instructions/copilot-instructions.md`
- `instructions/index.md`

Move hooks:
- `claude-plugin/hooks/hooks.json` → `packages/foundation/hooks/hooks.json`

**Scripts to update after Block 1**:
- `prepare-package.js` line 142: `'instructions'` → read from `packages/foundation/instructions` and `packages/developer/instructions` and merge into `templates/instructions/`
- `scripts/test-local-install.js` line 97: `path.join(targetDir, 'instructions', 'copilot-instructions.md')` — no path change since the assembled output is still `templates/instructions/...`
- `.github/workflows/aldc-validate.yml` path trigger: add `packages/foundation/**` alongside existing triggers

**Validation**: `prepare-package.js` runs successfully; assembled `templates/instructions/` contains all 10 instruction files.

---

### Block 2 — foundation: skills (11 core) + prompts (6 core)

Move core skills:
- `skills/skill-api/` → `packages/foundation/skills/skill-api/`
- `skills/skill-copilot/` → `packages/foundation/skills/skill-copilot/`
- `skills/skill-debug/` → `packages/foundation/skills/skill-debug/`
- `skills/skill-events/` → `packages/foundation/skills/skill-events/`
- `skills/skill-estimation/` → `packages/foundation/skills/skill-estimation/`
- `skills/skill-manifest/` → `packages/foundation/skills/skill-manifest/`
- `skills/skill-migrate/` → `packages/foundation/skills/skill-migrate/`
- `skills/skill-pages/` → `packages/foundation/skills/skill-pages/`
- `skills/skill-performance/` → `packages/foundation/skills/skill-performance/`
- `skills/skill-permissions/` → `packages/foundation/skills/skill-permissions/`
- `skills/skill-testing/` → `packages/foundation/skills/skill-testing/`
- `skills/skill-translate/` → `packages/foundation/skills/skill-translate/`
- `skills/index.md` → `packages/foundation/skills/index.md`

Move foundation prompts:
- `prompts/al-build.prompt.md` → `packages/foundation/prompts/al-build.prompt.md`
- `prompts/al-pr-prepare.prompt.md` → `packages/foundation/prompts/al-pr-prepare.prompt.md`
- `prompts/al-context.create.prompt.md` → `packages/foundation/prompts/al-context.create.prompt.md`
- `prompts/al-memory.create.prompt.md` → `packages/foundation/prompts/al-memory.create.prompt.md`
- `prompts/al-initialize.prompt.md` → `packages/foundation/prompts/al-initialize.prompt.md`
- `prompts/index.md` → `packages/foundation/prompts/index.md`
- `prompts/README.md` → `packages/foundation/prompts/README.md`

**Scripts to update after Block 2**:
- `prepare-package.js` line 141: `'skills'` → read from `packages/foundation/skills`, `packages/developer/skills` and merge
- `prepare-package.js` line 143: `'prompts'` → read from `packages/foundation/prompts`, `packages/conductor/prompts`, `packages/developer/prompts` and merge
- `toolbox/al-coding-agent-collection/package.json` `chatSkills` array (lines 73–84): paths will become `./templates/skills/...` — no change required if merge output is correct
- `collections/al-development.collection.yml`: all `path: skills/...` and `path: prompts/...` entries — these are consumer-side paths that reference the _installed_ location (`.github/skills/`, `.github/prompts/`) not the source, so NO change needed if the assembled output stays flat

**Validation**: `node scripts/test-local-install.js` passes (Step 3 skill validation). `npm run validate` passes.

---

### Block 3 — conductor: al-architect + al-conductor + al-planning-subagent + al-spec.create

Move:
- `agents/al-architect.agent.md` → `packages/conductor/agents/al-architect.agent.md`
- `agents/al-conductor.agent.md` → `packages/conductor/agents/al-conductor.agent.md`
- `agents/al-planning-subagent.agent.md` → `packages/conductor/agents/al-planning-subagent.agent.md`
- `prompts/al-spec.create.prompt.md` → `packages/conductor/prompts/al-spec.create.prompt.md`

**Scripts to update after Block 3**:
- `prepare-package.js` line 141: `'agents'` → read from all packages and merge into `templates/agents/`
- `collections/al-development.collection.yml` paths `agents/al-architect.agent.md`, `agents/al-conductor.agent.md`, `agents/al-planning-subagent.agent.md`, `prompts/al-spec.create.prompt.md` — these are _consumer_ paths (post-install), not source paths, so NO change needed if assembly is correct

**Validation**: Assembled `templates/agents/` contains all 8 agents. `npm run validate` passes.

---

### Block 4 — developer: al-developer + al-presales + al-agent-builder + BC agent skills

Move:
- `agents/al-developer.agent.md` → `packages/developer/agents/al-developer.agent.md`
- `agents/al-presales.agent.md` → `packages/developer/agents/al-presales.agent.md`
- `agents/al-agent-builder.agent.md` → `packages/developer/agents/al-agent-builder.agent.md`
- `agents/index.md` → `packages/foundation/agents/index.md`
- `skills/skill-agent-instructions/` → `packages/developer/skills/skill-agent-instructions/`
- `skills/skill-agent-task-patterns/` → `packages/developer/skills/skill-agent-task-patterns/`
- `skills/skill-agent-toolkit/` → `packages/developer/skills/skill-agent-toolkit/`
- `instructions/al-agent-toolkit.instructions.md` → `packages/developer/instructions/al-agent-toolkit.instructions.md`
- `prompts/al-agent.create.prompt.md` → `packages/developer/prompts/al-agent.create.prompt.md`
- `prompts/al-agent.instructions.prompt.md` → `packages/developer/prompts/al-agent.instructions.prompt.md`
- `prompts/al-agent.task.prompt.md` → `packages/developer/prompts/al-agent.task.prompt.md`
- `prompts/al-agent.test.prompt.md` → `packages/developer/prompts/al-agent.test.prompt.md`

**Validation**: `npm run validate` passes. `test-local-install.js` Step 3 and Step 4 pass (skill-agent-instructions assets verified).

---

### Block 5 — subagents

Move:
- `agents/al-implement-subagent.agent.md` → `packages/implement-subagent/agents/al-implement-subagent.agent.md`
- `agents/al-review-subagent.agent.md` → `packages/review-subagent/agents/al-review-subagent.agent.md`

**Validation**: Assembled `templates/agents/` still contains all 8 agents. `npm run validate` passes. Full `node scripts/test-local-install.js` passes end-to-end.

---

## 5. Impact on Build: VSIX (prepare-package.js)

**Script location**: `toolbox/al-coding-agent-collection/prepare-package.js`

**Current behavior** (lines 140–148): The script iterates `directoriesToCopy = ['agents', 'instructions', 'prompts', 'skills', 'docs/templates', 'docs/schema']` and copies each directly from `repoRoot/<dir>` → `templates/<dir>`.

**Required change after restructure**: The script must aggregate artefacts from multiple `packages/*/` subdirectories and merge them into the same flat `templates/<dir>` output. The output structure does NOT change — only the input sources change.

**Conceptual change** (do NOT implement now — describe only):

```
// CURRENT (simplified):
copyDirectorySync(path.join(repoRoot, 'agents'), path.join(templatesDir, 'agents'));

// AFTER RESTRUCTURE — aggregate from packages:
const agentSources = [
  path.join(repoRoot, 'packages', 'foundation', 'agents'),
  path.join(repoRoot, 'packages', 'conductor', 'agents'),
  path.join(repoRoot, 'packages', 'developer', 'agents'),
  path.join(repoRoot, 'packages', 'implement-subagent', 'agents'),
  path.join(repoRoot, 'packages', 'review-subagent', 'agents'),
];
for (const src of agentSources) {
  if (fs.existsSync(src)) copyDirectorySync(src, path.join(templatesDir, 'agents'));
}
```

The same pattern applies for `skills`, `prompts`, and `instructions`. The `docs/templates`, `docs/schema`, and `tools/aldc-validate` paths are unaffected (those artefacts don't move).

**CI impact**: `aldc-validate.yml` currently triggers on paths `agents/**`, `prompts/**`, `skills/**`, `instructions/**`. After restructure, those paths no longer exist at root — the trigger must be updated to `packages/**`.

**`validate-al-collection.js` impact** (line 344–350): `validateDirectoryStructure()` hardcodes `['instructions', 'prompts', 'agents', 'collections']` as `requiredDirs`. After restructure the root-level `instructions/`, `prompts/`, and `agents/` directories will be gone. This check must be updated to either:
- Check `packages/` subdirectories, or
- Remove the check (since the validator is primarily for consumer installs, not the source repo), or
- Add a `--source-mode` flag

**`aldc.yaml` impact**: The `required:` section lists paths relative to `toolkitRoot` (which is `.` for this repo). After restructure, paths like `agents/al-architect.agent.md` will no longer exist at root. `aldc.yaml` will need to be updated OR `aldc.yaml` validation is scoped only to the _installed_ layout (consumer side) and the source-repo `aldc.yaml` becomes a dev-only configuration that points to the assembled output. **This needs a decision from the human maintainer before Block 1 executes.**

---

## 6. ROADMAP-2026.md Errata

**Finding**: The errata described in the original prompt brief (`docs/apm/prompts/phase-1-restructure.md`, line 42) — that ROADMAP-2026.md mentions "2 subagents" when the spec defines 3 — **does NOT currently exist** in the file.

Current state of `docs/framework/ROADMAP-2026.md`, line 9:
```
: 4 agentes + 3 subagents + 6 workflows
```

The spec (`docs/framework/ALDC-Core-Spec-v1.1.md`, line 60) states:
> ALDC Core v1.1 adopts a simplified model of **4 public agents + 3 internal subagents**.

**Assessment**: The errata was present in a previous version and has already been corrected in the current `main`. The value on ROADMAP-2026.md line 9 is already correct. **No change required.**

Action: Document this finding in the commit message so that no one re-opens a ticket for it.

---

## 7. Technical Decisions

### Decision 1: Skills as foundation-only artefacts

**Options**:
- A. All skills in `packages/foundation/` — simpler, single source of truth
- B. Skills distributed across packages (e.g., skill-api in `packages/conductor/`, skill-debug in `packages/developer/`) — reflects primary consumer

**Decision**: Option A for core skills, with BC-agents skills in `packages/developer/`.

**Rationale**: Core skills are transversal by design (ALDC Core Spec §7). `al-architect` loads `skill-api`, `al-developer` loads `skill-debug`, `al-conductor` loads any domain skill. Splitting by primary consumer would create arbitrary boundaries. BC-agent skills are specifically tied to the agent-builder workflow which lives in `developer`.

### Decision 2: BC Agents pack boundary

**Options**:
- A. BC Agents content (`al-agent-builder`, BC-agent skills, BC-agent prompts, `al-agent-toolkit.instructions.md`) in `packages/developer/`
- B. Dedicated `packages/bc-agents/` package

**Decision**: Option A for Phase 1.

**Rationale**: Phase 1 is a restructuring exercise, not a decomposition of new packages. The BC Agents pack already has its own `bcagentpack/` directory for the Claude distribution channel. Merging into `packages/developer/` maintains parity without introducing a new package boundary that APM manifests would need to handle.

### Decision 3: al-presales package placement

**Options**:
- A. `packages/developer/` (current decision)
- B. `packages/foundation/` (it is user-invocable)
- C. Dedicated `packages/presales/`

**Decision**: Option A for Phase 1.

**Rationale**: `al-presales` is optional (`usage: optional` in the collection manifest) and outside the delivery cycle. It is the agent with the least coupling to other artefacts. Placing it in `developer` avoids a one-file package. If APM Phase 2 requires fine-grained manifest control, it can be extracted at that point.

### Decision 4: Source-repo aldc.yaml vs consumer aldc.yaml

**Problem**: After restructure, `aldc.yaml` in the repo root lists paths (`agents/al-architect.agent.md`, etc.) that will no longer exist at root. The `tools/aldc-validate/index.js` validator reads `aldc.yaml` and checks those paths.

**Options**:
- A. Update `aldc.yaml` paths to point to `packages/*/agents/...` (validator passes on source repo)
- B. Keep `aldc.yaml` as consumer-oriented (toolkitRoot: `.`), skip validator on source repo
- C. Add a `packages/` section to `aldc.yaml` schema (new schema concept)

**Decision**: Deferred. **This is a blocking question for the human maintainer.** Recommendation is Option B — the source repo `aldc.yaml` becomes dev metadata, and the canonical validated layout is the _assembled_ consumer install (`templates/` output). The CI `aldc-validate.yml` job would be updated to run against a freshly assembled output rather than the source tree.

---

## 8. Test Impact

### 8.1 scripts/test-local-install.js

This is the primary integration test. It runs `prepare-package.js`, copies `templates/` to a temp dir, and validates the result. All path references in this script are relative to `templatesDir` (the assembled output), NOT to the source tree. Therefore:

- **If `prepare-package.js` correctly assembles from `packages/*/`** → no changes needed in `test-local-install.js`
- The `EXPECTED_SKILLS` array (line 108) references skill folder names, not source paths — unaffected
- The `agentInstrDir` check (line 151) references `skill-agent-instructions` folder name — unaffected

**Risk**: If `prepare-package.js` update introduces a merge ordering issue (two packages contributing to `templates/agents/` with filename collisions), the test will catch it.

### 8.2 toolbox/al-coding-agent-collection/test/extension.test.js

Content (lines 1–15): A minimal stub test that only checks `vscode` API import and `assert.strictEqual` on hardcoded values. It contains **zero path references** to agents, skills, prompts, or instructions.

**Impact**: None. No changes required.

### 8.3 scripts/validate-al-collection.js

`validateDirectoryStructure()` (lines 343–358) checks for `instructions`, `prompts`, `agents`, `collections` at the current working directory. This script is called with `npm run validate` from repo root. After restructure, `agents/`, `instructions/`, `prompts/` will not exist at root.

**Required change**: Update the `requiredDirs` array or add a `--source-mode` flag that skips directory checks and only validates the collection manifest file content (which references post-install consumer paths and is unaffected).

### 8.4 GitHub Actions

| Workflow | File | Current path trigger | Required update |
|----------|------|---------------------|-----------------|
| aldc-validate.yml | `.github/workflows/aldc-validate.yml` | `agents/**`, `prompts/**`, `skills/**`, `instructions/**` | Replace with `packages/**` |
| validate.yml | `.github/workflows/validate.yml` | push to main/develop | No change (runs `npm run validate`) — but see §8.3 |
| release.yml | `.github/workflows/release.yml` | tag push | No change (runs `npm run validate` + packages files) |

---

## 9. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| `prepare-package.js` merge produces wrong file order (later package overwrites earlier) | VSIX delivers wrong file | LOW | Validate with `diff` between old and new `templates/` outputs after Block 2 |
| `aldc.yaml` validator fails on source repo after move | CI red | HIGH | Resolve Decision 4 before Block 1; update CI to use assembled output |
| `validate-al-collection.js` fails on `requiredDirs` check | `npm run validate` fails | HIGH | Patch `requiredDirs` in same commit as Block 1 |
| `collections/al-development.collection.yml` item paths diverge from assembled output | GitHub Copilot Collections feature broken | LOW | Collection manifest references consumer paths (`agents/...`) which are stable — verify after Block 5 |
| CI `aldc-validate.yml` path trigger no longer fires on framework changes | Validation silently skipped | MEDIUM | Update path triggers in Block 1 commit |
| `.claude/settings.json` `al-guidelines.instructions.md` reference path (rules section) | Claude Code rules broken | MEDIUM | `rules/` in `.claude/` is a separate directory from `instructions/` — verify `.claude/rules/` content is independent |
| bcagentpack/ files duplicate content moved to `packages/developer/` | Drift between channels | LOW | Note in commit message that `bcagentpack/` is the Claude-channel copy and stays in sync manually for Phase 1 |

---

## 10. Validation Checklist (post-restructure, before PR)

```
[ ] Block 0: packages/ directory tree scaffolded with 5 empty packages
[ ] Block 1: instructions + hooks moved; prepare-package.js updated; assembled templates/instructions/ = 10 files
[ ] Block 2: 11 core skills moved; 6 foundation prompts moved; test-local-install.js Step 3 passes
[ ] Block 3: conductor agents + al-spec.create moved; assembled templates/agents/ correct count
[ ] Block 4: developer agents + BC-agents skills + prompts moved; test-local-install.js Step 4 passes
[ ] Block 5: subagents moved; full test-local-install.js passes end-to-end
[ ] validate-al-collection.js requiredDirs patched (or --source-mode flag added)
[ ] aldc-validate.yml path triggers updated to packages/**
[ ] Decision 4 (aldc.yaml / validator) resolved and implemented
[ ] npm run validate passes from repo root
[ ] node scripts/test-local-install.js passes (0 errors)
[ ] VSIX build: node prepare-package.js runs without warnings
[ ] Diff of templates/ before vs after restructure: no unexpected changes (content-identical for all moved files)
[ ] collections/al-development.collection.yml: all paths still resolve in consumer install
[ ] ROADMAP-2026.md: already correct (3 subagents) — no change needed, confirmed
[ ] docs/decisions/ADR-0001-apm-phase-1-restructure.md: present and status updated to Approved
```

---

## 11. Appendix: Source Tree Snapshot (current, before moves)

```
repo root
├── agents/                    (8 files + index.md)
├── instructions/              (9 files + index.md)
├── prompts/                   (11 files + index.md + README.md)
├── skills/                    (15 directories + index.md)
│   ├── skill-api/SKILL.md
│   ├── skill-copilot/SKILL.md
│   ├── skill-debug/SKILL.md
│   ├── skill-events/SKILL.md
│   ├── skill-estimation/SKILL.md
│   ├── skill-manifest/        (+ samples/)
│   ├── skill-migrate/SKILL.md
│   ├── skill-pages/SKILL.md
│   ├── skill-performance/SKILL.md
│   ├── skill-permissions/SKILL.md
│   ├── skill-testing/SKILL.md
│   ├── skill-translate/SKILL.md
│   ├── skill-agent-instructions/ (+ examples/ + references/)
│   ├── skill-agent-task-patterns/SKILL.md
│   └── skill-agent-toolkit/SKILL.md
├── claude-plugin/
│   └── hooks/hooks.json       (hooks distributable)
├── tools/
│   ├── aldc-validate/         (stays)
│   └── bc-agents/             (stays)
├── docs/
│   ├── framework/             (stays — normative)
│   ├── templates/             (stays — immutable)
│   ├── decisions/             (NEW — this ADR)
│   └── apm/                   (planning docs)
├── toolbox/al-coding-agent-collection/
│   ├── prepare-package.js     (BUILD SCRIPT — must be updated)
│   ├── extension.js           (VSIX extension — reads from templates/)
│   └── templates/             (generated, not committed)
└── scripts/
    ├── install.js             (npm CLI)
    ├── validate-al-collection.js (npm test — requires patch)
    └── test-local-install.js  (integration test — OK if assembly correct)
```

---

*This ADR is the authoritative plan for Phase 1. No file moves shall be executed until the human maintainer validates each block. The ADR itself is the only new file created in this analysis invocation.*
