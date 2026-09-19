# Copilot CLI product adaptation — validation

Date: 2026-09-19. Base: `2a868a9aad1436c0fd76a98edfe619a9077a6b40` (`main`).
Release v5.0.0 at `51c0b4fa5a027656a7efea5df667f5096e4ec097` is untouched.
Candidate branch: `feat/copilot-cli-plugin`. Host: Copilot CLI **1.0.86**, Linux
x64, Node 24.19.0. Consumer is isolated from the source tree and contains no AL
project. No Windows machine or Business Central environment was accessed.

## Result

**Accepted for integration by the project owner on 2026-09-19.** The owner
explicitly accepted the Copilot CLI validation and authorized merging this PR.
This closes the merge blocker; it does not turn the authenticated custom-agent
checks below into executed tests. Their recorded authentication limits remain.
The cross-generator provenance gate was resolved by the authorized refresh below
and regenerated again when integrating #108 and #110. The historical observations
retain their original candidate versions. No release or publication is implied.

| Check | Observed result |
| --- | --- |
| Legacy manifest | Actual CLI install accepts it; no Agent Plugins 1.0 migration |
| Local install/reinstall | Passed; `aldc-cli`, 5.0.0, enabled; source and cached provenance hashes match |
| Plugin JSON fields | `name`, `marketplace`, `version`, `enabled`, `source` emitted; `installedFrom` absent on this host |
| Marketplace main | Registered repository, installed `aldc-cli@aldc-marketplace`; catalog source retained |
| Marketplace candidate | Branch 524596f installed by marketplace; refresh/update passed; cached provenance matches candidate |
| Enable/disable | Actual CLI commands and subsequent JSON listings verify both states |
| Domain skills | 16 discovered with plugin source paths |
| Commands | 11 discovered as commands in skill inventory; not invoked |
| Interactive skills | `/skills list`: 29 including 2 built-ins, 16 domain skills and 11 commands |
| Agent files | 12 generated profiles; no claim that the host loaded them |
| `/agent` | No custom agents loaded without authentication; diagnostic log explicitly explains the skipped load |
| Architect invocation | Actual `--agent al-architect --prompt ...` attempted, exit 1: no authentication; not invoked |
| Conductor → Planning | Actual Conductor attempt blocked by authentication before delegation; no parent/child execution evidence |
| MCP configuration | All 3 exposed by `copilot mcp list --json` |
| MCP session connection | All three connected after PR #108 package fix; original E404 retained as historical evidence |
| Symbol MCP tools | Six tools shown in host Details and returned by a direct tools/list probe |
| MCP business/tool execution | Not performed; connection is not execution |
| Bootstrap | Preview reviewed; apply and verify passed; AGENTS.md + 8 scoped rules discovered by host |
| Consumer safety | Invocation attempts changed no consumer files; bootstrap has no agent/skill/AL/app.json copies |
| Generator | 103 outputs; repeated CLI check reports zero differences |
| CLI regressions | 353 packaging checks plus 5 CLI MCP/bootstrap/permission tests pass |
| Shared acceptance tests | Spec 114 checks; review contract checks; 59 transaction/layout/validator tests pass, 2 skip |
| Other payloads | Claude, Codex runtime payload, VSIX/foundation and shared canonical sources unchanged; only the authorized Codex provenance source hash is refreshed |
| Global `npm test` | Passed locally after the authorized provenance refresh (Node 24.19.0); existing warnings and 2 skipped tests remain |

## Blockers

1. **Copilot authentication is absent.** The GitHub connector is authenticated,
   but that does not authorize the model backend used by the local CLI. The host
   log states: `No model backend (auth, legacy provider, or BYOK registry)
   available, skipping custom agents load`. Both bounded invocations return
   `Error: No authentication information found.` No fallback provider, fabricated
   token or simulated custom agent was used. Complete the two checks in the
   [installation guide](../../copilot-cli-plugin.md) in an authenticated session.

## Resolved provenance blocker — authorized metadata-only refresh

On 2026-09-19 the user approved updating the single Codex provenance source hash,
with generator decoupling left for a separate PR. Running
`node scripts/sync-codex.js` against candidate `eee9c67` changed exactly one
source entry in `plugins/aldc-codex/provenance.json`:

- Source: `scripts/sync-copilot-cli.js`.
- Previous SHA-256: `7fe0624571b1b852e72810e8ca4667370f91f32dc54a65e164d2542dfb4466fe`.
- Current SHA-256: `d86105da383a9a621e7ac79a6621995b472c00fa132994c6362964682fc600d3`.

All 121 Codex payload files remain byte-identical, and every output hash is
unchanged. No generator, check, role, permission, MCP configuration or version
was edited. Claude and VSIX/foundation are unchanged. The original
`isolation.json` records the earlier candidate and remains historical evidence.

Local validation after the refresh (Node 24.19.0):

- `npm ci --offline --ignore-scripts --no-audit --no-fund`: passed.
- `npm test`: passed, including CLI packaging (353 checks), 5 CLI regressions,
  Spec (114 checks), review, BCQuality and generator checks; final Node test
  suite: 59 passed, 2 skipped, 0 failed. Existing collection warnings remain.
- `node scripts/sync-codex.js --check`: 122 generated files, zero differences.
- `git diff --check`: passed.

CI on the resulting commit must also pass before merge. The remaining runtime
checks are the two bounded Architect and Conductor invocations in the
[installation guide](../../copilot-cli-plugin.md#two-bounded-invocation-checks).
Run `copilot login` in the same test profile before starting them. Authentication,
complete role loading and native delegation are not certified by these tests.

## Symbol MCP correction from PR #108

The original npm E404 is resolved for CLI by projecting the exact
`al-mcp-server@2.5.0` package from PR #108 at `c6f57c0`. The generator preserves
server ID `al-symbols-mcp`, role grants, the other two endpoints and version 5.0.0.
Registry identity/version/repository checks pass. The regenerated local plugin
was reinstalled and the cached manifest hash matches. In a new CLI session,
all three MCP servers connected; `/mcp` → symbol server Details showed six tools.
An independent stdio `initialize` + `tools/list` probe returned the same six.

This verifies installation, connection and discovery, **not symbol execution**.
No tool was invoked and no AL corpus was loaded. The provider's first tool call
may install AL prerequisites; the adapter now requires them to be verified first
and prohibits software bootstrap by read-only roles. Its stdio entrypoint is
also an editor installer when run in a TTY; tests used pipes. The server's cwd
is the plugin cache, so the adapter requires an absolute consumer path when
loading packages. See [full evidence](mcp-pr108.json) and the installation guide.

The source PR's Claude `.in_use` provenance exception, shared development config,
ALMCP integration and other-host/version changes were not imported. The original
[host log extracts](host-observations.json) remain unchanged as historical
pre-fix evidence. Only the authenticated custom-agent acceptance blocker remains open.

## Changes and evidence

- Native task delegation contract and strict missing-capability fallback;
  Chat mentions, editor tool calls and Chat initialization requirements removed.
- Complete Conductor workflow moved into a mandatory bundled reference so the
  agent entry remains within documented size guidance. Reading that reference
  completely still needs confirmation in the authenticated execution trace.
- Subagent visibility preserved; commands remain explicit; reviewer/Spec
  execution permissions are not broadened.
- CLI-only bootstrap projection fixes AGENTS.md and reports potential
  precedence collisions. Shared initialization code is byte-identical.
- [Local installation and catalogs](local-install.json),
  [marketplace registration](marketplace-main-marketplace.json),
  [marketplace install listing](marketplace-main-list.json),
  [candidate marketplace install/update](marketplace-candidate.json),
  [bootstrap transactions](bootstrap.json),
  [instruction catalog](instructions.json),
  [bounded invocation attempts](invocation-attempts.json),
  [protected file scope](isolation.json),
  [selected host diagnostics](host-observations.json).

No new release, tag, marketplace version bump, merge or VSIX was produced.
