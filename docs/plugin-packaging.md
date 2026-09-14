# ALDC plugins and recoverable installation

ALDC distributes the same role and workflow contracts through host-specific adapters.

## Consumer commands

Use Node 20+ from a checkout or local npm archive. Commands write only to the
chosen project; use separate disposable projects for host acceptance.

| Surface | Preview | Apply | Inspect / restore |
| --- | --- | --- | --- |
| Copilot Chat | `node /path/to/aldc/scripts/install.js install --yes --dry-run` from project root | Repeat without `--dry-run`; select `--profile bc29-native` only when intended | `verify-install` / `rollback` commands from the same project root |
| Claude | `node /path/to/claude-plugin/scripts/init.js --project /path/to/project` | Add `--apply` | Add `--verify` / `--rollback` |
| Copilot CLI | `node /path/to/copilot-cli-plugin/scripts/init.js --project /path/to/project` | Add `--apply` | Add `--verify` / `--rollback` |
| Codex local bootstrap | `node /path/to/plugins/aldc-codex/scripts/init.js --project /path/to/project` | Add `--apply` | Add `--verify` / `--rollback` |

Chat retains BC28 as default and the recorded profile on update. A profile switch
requires `--force`. Custom target directories must be inside the project and must
not cross symlinks. Terminal initialization does not change the Chat profile.
No initializer runs dependency installation. Install the Chat validator's js-yaml
separately with `npm install` in its installed tools/aldc-validate directory when
needed. Node already serves all adapters, so the donor Python resolver is omitted.

Tracked, unedited toolkit files update automatically. Unknown or customized files
remain visible collisions. `--force` authorizes their replacement with backup.
Chat preserves its historical successful exit on skipped collisions; inspect its
output and `verify-install`. Terminal initializers return exit 2 for collisions.
Receipts retain unresolved collisions; a repeated run cannot certify them as clean.
Existing memory is always preserved. App/Test manifests, AL sources, editor
settings and external host configuration are outside the installation plan.

Terminal guidance uses an ALDC managed block. Surrounding user text is preserved.
Codex/CLI choose an existing AGENTS.override.md over AGENTS.md. If an override is
introduced later, the old AGENTS.md remains intact. A locally changed managed
block is a collision. Updating surrounding text may conservatively require review
when the managed block also needs updating.

## Recovery and provenance

The common transaction engine preflights all destinations, saves file preimages
and modes, records a pending journal, then applies writes. Detected write failures
restore the preceding files and receipt. A live/unknown operation lock is never
stolen; a dead local process lock can be recovered. After interruption, run the
matching surface's rollback before another installation.

Backups and receipts live in `.aldc-install/` with a local ignore rule. Keep them
until recovery is no longer needed. Rollback validates all preimages and current
hashes before writing; later edits block restoration rather than being lost.
Changed project memory is preserved even when rolling back a fresh installation.
Rollback restores file content/modes, not arbitrary external effects or directory
timestamps; it can leave empty directories. It does not undo user work performed
since installation. The installer lock excludes other installers, not editors;
stop concurrent edits during install/recovery. This is not a power-loss durability
or adversarial filesystem guarantee.

Each terminal package has provenance.json with source and output SHA-256 digests.
The complete source set records generator dependencies; output hashes verify the
actual packaged payload before initialization. Hashes normalize LF/CRLF only;
other modifications fail. This is drift/integrity evidence, not a publisher signature.
Regenerate with `npm run sync:plugins`; npm validation checks drift and exercises
initialization from the extracted archive. No second Copilot command generator
was introduced.

## Host scope and acceptance

| Surface | Distribution | Host requirements |
| --- | --- | --- |
| Chat | BC28/BC29 fixtures, force switching, custom target, receipts/recovery | VS Code discovery, full role loading and operation-specific AL capability |
| Claude | 11 canonical roles/10 commands; safe rules initialization; read-only SessionStart context for AL workspaces | Plugin reload, hook output injection, rules and full Conductor loading |
| Copilot CLI | 11 canonical roles/10 commands; same generator plus hashes and initializer; no Claude hooks | Reinstall cached plugin, inspect `/agent` and skills, verify provenance and no shadowing |
| Codex | 11 TOML profiles, one ALDC skill with full role/workflow/domain references; managed guidance and bootstrap | Restart host, inspect skills and instruction sources, invoke a bounded role and verify full body loading |

Use either Codex plugin skill discovery or local bootstrap, never both in the same
project. Plugin discovery alone does not install project TOML profiles. Domain
skills are GUIDE.md references inside one discoverable ALDC skill to avoid duplicate
registrations. The full Conductor remains present; independent review still needs
actual delegation. Missing delegation cannot be replaced by a claim of independent
self-review. No model, approval, sandbox or MCP override is installed.

Codex profile format follows [official custom-agent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents).
Guidance precedence follows [AGENTS.md discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
The skill layout follows [local skill discovery](https://learn.chatgpt.com/docs/build-skills).

## Compatibility

Confirm agent discovery and complete instruction loading in the installed host.
Host versions, available tools and authentication determine which operations can
run. A manifest or successful installation does not certify runtime execution.
ALDC inherits host model, permission and MCP settings. See [native AL tools](framework/native-al-tools.md)
for Copilot Chat and the packaged terminal guide for CLI hosts.
