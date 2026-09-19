# Copilot CLI product adaptation — validation

Date: 2026-09-19. Base: `2a868a9aad1436c0fd76a98edfe619a9077a6b40` (`main`).
Release v5.0.0 at `51c0b4fa5a027656a7efea5df667f5096e4ec097` is untouched.
Candidate branch: `feat/copilot-cli-plugin`. Host: Copilot CLI **1.0.86**, Linux
x64, Node 24.19.0. Consumer is isolated from the source tree and contains no AL
project. No Windows machine or Business Central environment was accessed.

## Result

**Adaptation implemented; not yet certified as a fully supported runtime.**
Authenticated custom-agent acceptance and one cross-generator provenance gate
remain blocked. The PR must not merge as a fully validated CLI release yet.

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
| Other payloads | No tracked changes to Claude, Codex, VSIX/foundation or shared canonical sources |
| Global `npm test` | Fails at the Codex provenance check described below; not reported green |

## Blockers

1. **Copilot authentication is absent.** The GitHub connector is authenticated,
   but that does not authorize the model backend used by the local CLI. The host
   log states: `No model backend (auth, legacy provider, or BYOK registry)
   available, skipping custom agents load`. Both bounded invocations return
   `Error: No authentication information found.` No fallback provider, fabricated
   token or simulated custom agent was used. Complete the two checks in the
   [installation guide](../../copilot-cli-plugin.md) in an authenticated session.

2. **Codex hashes the CLI generator as an input.** Its shared source imports only
   `split` and `stripAdapterPreamble`, whose behavior is unchanged. A read-only
   comparison of all expected Codex outputs against the tracked distribution
   finds **only** `provenance.json` different, specifically the source hash of
   `scripts/sync-copilot-cli.js`. Every payload output hash is identical. The user
   explicitly requested no changes to Codex/Claude/VSIX, so even that metadata file
   was left untouched. Consequently `sync-codex --check` and the enclosing global
   gate remain red. Resolving this requires an explicit exception for the single
   provenance source hash, or a separately agreed refactor of generator coupling.
   Do not weaken the check or falsify the hash to hide this dependency.

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
pre-fix evidence. The two blockers above remain open.

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
