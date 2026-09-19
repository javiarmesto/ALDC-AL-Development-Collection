# Independent surface generation

P0 isolates packaging after PRs #108, #110 and #109, integrated in canonical
`main` at `70d4c67a73608c4c8fa547c2b376b79800cd7b91` (5.0.1). It introduces no
LSP/MCP capability. A review correction narrows CLI Planning to its canonical
research-only permissions; the other role behavior stays unchanged. The surface work planned for 5.1.0
can now change one adapter without propagating through another host's package.
No release or version bump is part of P0.

## Commands and write boundaries

| Command | Inputs | Writes |
| --- | --- | --- |
| `npm run sync:claude` | Canonical trees, Claude adapter, shared packaging helpers | `claude-plugin/` |
| `npm run sync:copilot-cli` | Canonical trees, CLI adapter/bootstrap, shared packaging helpers | `copilot-cli-plugin/` |
| `npm run sync:codex` | Canonical trees, Codex adapter/setup guide, shared packaging helpers | `plugins/aldc-codex/` |
| `npm run sync:plugins` | Explicit invocation of the three commands above | The three distribution directories only |
| `npm run sync:claude-workspace` | Generated Claude package | Repository development mirror `.claude/{agents,skills,rules}/` |
| `npm run sync:foundation` | Canonical agents, prompts, skills, instructions and templates | `packages/foundation/` |

Each individual command accepts `-- --check`. Checks are read-only and fail on
drift. `sync:plugins` is an explicit write command for all three distributions;
use the individual check commands to verify them. The existing foundation and
workspace mirror CI checks remain enabled. The mirror is no longer an implicit
side effect of `sync:plugins`; regenerate it explicitly when committing a Claude
change that affects the development workspace.

## Source and adapter ownership

Agents, workflows, knowledge skills and rules come directly from `agents/`,
`prompts/`, `skills/` and `instructions/`. CLI and Codex neither read
`claude-plugin/` nor import another host's generator. Their generated bodies,
bootstrap behavior and MCP guidance preserve the integrated baseline. CLI Planning
loses edit, execute and delegation permissions that contradicted its canonical
research-only contract; this is the single functional exception.
CLI's permissions are declared in `copilot-cli-adapter.js`; Claude's model and
tool choices remain in its generator. Codex derives its sandbox declarations
from canonical grants and retains its own MCP setup adaptation.

`generation-utils.js` holds frontmatter/format helpers, the existing workflow
inventory and path rewriting parameterized by the caller. `plugin-runtime.js`
holds shared runtime copies and initialization layout support. Neither imports
or executes a host generator. Shared helper changes intentionally affect all
consumers and are recorded in their provenance. CLI-only generator or adapter
changes no longer alter Codex provenance.

Provenance identifies the canonical files, adapter and helpers consumed by that
surface. Runtime payload verification, collision handling and recovery are
unchanged. Source/output hashes continue to detect drift; they do not prove that
a host loaded or executed a role.

## Copilot Chat and VSIX

Copilot Chat continues through the canonical installer and native profile.
The VSIX path remains canonical sources → `packages/foundation/` → the extension's
`prepare-package.js`. The extension also copies canonical tools, templates,
schemas, framework documentation and installer dependencies directly.
Neither that path nor foundation requires a Claude, CLI or Codex distribution,
or the Claude development mirror.

The extension build's version match, clean-source requirement for release
candidates, foundation check and `BUILD-PROVENANCE.json` commit identities remain
in force. P0 does not update the extension repository or create a VSIX. Input
comparison against the extension's pinned preparation script is recorded in
[evidence](evidence/surface-isolation/validation.json).

## Verification

`npm run test:surface-isolation` runs five disposable-repository tests:

- Rebuild each distribution with sibling packages absent, sibling generators
  made un-runnable and unrelated adapter/guide/mirror files changed. Require
  identical payload and provenance, writes confined to its directory, idempotence
  and read-only drift detection.
- Change a shared canonical agent and require all three distributions to carry
  the change. Only explicit mirror generation may update `.claude/`.
- Generate foundation with all plugin distributions and the mirror absent.
  Require only the affected foundation file to change, retaining drift checks.

These tests run in CI alongside the existing permissions, contracts, installers,
Codex TOML, Doctor, archive and conformance checks. The P0 baseline comparison
records byte identity of 336 functional packaged files and the single CLI Planning
frontmatter exception. It is historical evidence,
not a claim of fresh authenticated host execution.

## Later work

Follow-up PRs will address each surface separately. LSP discovery/use and MCP
server/tool use remain distinct work items. Profiling and snapshot workflows
must be considered for each applicable surface without implicitly copying a
host-specific capability into another.

“ALDC Soul” remains an idea: an agnostic container for primitive contracts that
could express ALDC independently of a harness. P0 does not introduce its schema,
DSL, runtime or contract engine. Shared packaging helpers are not that design.

## Review findings and surface follow-up

Review of #111 identified three conditions already present at baseline `70d4c67`.
They are tracked separately from the generation change:

| Finding | P0 disposition | Required follow-up |
| --- | --- | --- |
| Planning inherited edit/execute/delegation from the Claude projection | Fixed for CLI in #111; regression guard covers Planning and both review roles | P1 must narrow the independent Claude grant before adding capabilities |
| Dredd has broad CLI edit for its audit report | Existing canonical contract explicitly permits report persistence, while the package states the path limit is behavioral; no enforced filesystem boundary is claimed | P2 must verify a report-scoped host mechanism or use report output with a separate authorized writer; do not silently break report delivery |
| Codex bodies retain Copilot tool vocabulary | Verified byte-identical to the baseline, including the existing Codex host preface; changing the input source did not introduce these references | P3 must own complete vocabulary translation, capability discovery and regression checks for roles, workflows and knowledge references |

The last two items remain functional limitations. Closing the P0 review does not
certify them as fixed or as tested in an authenticated host. No official AL MCP
write tools may be added to read-only grants through a shared wildcard.
