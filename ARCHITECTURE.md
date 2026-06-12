# ALDC — Repository Architecture Map

> One-page guide to what is **source**, what is **generated/derived**, and which
> **distribution channel** consumes each tree. If you are editing a derived tree by hand,
> stop — edit the source and re-derive.

## Sources of truth

| Tree | Role |
|------|------|
| `agents/`, `skills/`, `instructions/`, `prompts/` | **Canonical primitives** (GitHub Copilot format: `.agent.md`, `applyTo` globs). Every other surface derives from here. |
| `docs/` | Source of the public website (MkDocs). |
| `docs/framework/ALDC-Core-Spec-*.md` | Normative specification. |
| `aldc.yaml`, `collections/al-development.collection.yml` | Manifests: what the framework contains and ships. |

## Derived / consumer surfaces

| Surface | Derives from | How | Consumed by |
|---------|--------------|-----|-------------|
| **VS Code extension** (local `toolbox/al-coding-agent-collection/`, gitignored) | `packages/foundation/` + `docs/templates/`, `docs/schema/`, `tools/aldc-validate/`, `aldc.yaml` | `prepare-package.js` copies them into the VSIX at build time | **VS Code Marketplace — primary channel (600+ installs)** |
| `claude-plugin/` | canonical primitives | manual port today → build script planned (`tools-map` VS Code ↔ Claude Code) | Claude Code plugin marketplace |
| `.claude/` | `claude-plugin/` | copy (same primitive format) | developing THIS repo with Claude Code |
| `packages/foundation/` | canonical primitives | manual mirror today → sync script + CI drift check planned. **The VS Code extension packages FROM here** — never delete, never let it drift from the root trees |
| `docs/instructions/` | `instructions/` | manual doc-formatted copies | website navigation |
| `gh-pages` branch | `docs/` | **build output** of `docs.yml` (MkDocs) on every push to `main` — never edit by hand | GitHub Pages site |

## Distribution channels

1. **VS Code Marketplace extension** — primary. `prepare-package.js` (in the local
   extension folder) copies `packages/foundation/` primitives into the VSIX;
   target state: copy pinned to a release tag, with a root↔foundation drift check
   in CI so the VSIX can never ship content that diverged from the canonical trees.
2. **`npx aldc install`** (`scripts/install.js`, npm package `al-development-collection`) —
   copies canonical root trees into a consuming AL project.
3. **Claude Code plugin** (`claude-plugin/` + `.claude-plugin/marketplace.json`) — reaches
   the non-VS Code audience.
4. **Website** (`docs/` → `gh-pages` via `docs.yml`).

## Editing rules

- Change primitives → edit the **root trees only**, then propagate to
  `packages/foundation/` (the extension packages from there) and `claude-plugin/`.
  Until the sync script exists, propagation is manual — run the conformance check
  before building the VSIX.
- Change website → edit `docs/` on `main`; deployment is automatic.
- Never commit to `gh-pages`; never edit `packages/foundation/` directly — it must
  stay byte-identical to the root trees.
