# MCP providers for ALDC in Codex

ALDC inherits the active Codex session's MCP providers. Neither plugin discovery
nor local bootstrap installs servers or writes MCP configuration. The repository's
root `.mcp.json` and other hosts' manifests are not Codex configuration inputs.

## Configure only missing providers

Inspect `codex mcp list` and the active session's `/mcp` view first. Reuse an
existing working provider even if its name differs (for example,
`microsoftdocs-mcp`). Do not register duplicates just to match ALDC examples.

For Codex CLI / IDE, merge only missing tables into the user's
`~/.codex/config.toml`, or the trusted project's `.codex/config.toml`. Preserve
existing tables, credentials and unrelated settings. The following is an example,
not an automatically installed configuration:

```toml
[mcp_servers.al-symbols-mcp]
command = "npx"
args = ["-y", "al-mcp-server@2.5.0"]
startup_timeout_sec = 60

[mcp_servers.microsoft-docs]
url = "https://learn.microsoft.com/api/mcp"

[mcp_servers.context7]
url = "https://mcp.context7.com/mcp"
```

The symbol package is the published package of StefanMaron's
AL-Dependency-MCP-Server, pinned as in ALDC PR #108. The previously declared
`@nicholasglazer/al-symbols-mcp` is not its package name. Keep the server ID
`al-symbols-mcp` if correcting an existing entry; change only its launch arguments.
The provider needs Node.js, .NET 8+ and the target project's compiled `.app`
packages for symbol extraction. A connection alone does not prove extraction works.
The process must run in the environment that can access those packages. Inspect
the discovered schema and pass the actual project/package paths; do not assume
the plugin cache or current directory is the AL project.

Microsoft Learn uses the HTTP endpoint above without a separate npm package or
VS Code extension. Context7 uses Upstash's endpoint; its npm alternative is
`@upstash/context7-mcp`, not the former presales recommendation under Anthropic's
scope. If Context7 needs authentication or higher limits, configure its API key
using the provider's current instructions. Codex supports
`bearer_token_env_var = "CONTEXT7_API_KEY"` in the Context7 table; keep the key in
the process environment, not in shared project files.

## Bounded smoke check

1. Restart the Codex session after an intentional configuration change. Inspect
   `/mcp` and capture the actual server names, connection state and tool schemas.
   `codex mcp list` lists configuration; it does not establish a successful call.
2. For symbols, use the discovered `al_packages` schema to load/list the target
   project's packages, then search for one known object with `al_search_objects`.
   Record its owning app/version. An empty package list or missing extractor means
   symbol access is not verified, even if initialization succeeded.
3. Perform one Microsoft Learn documentation search. For Context7, resolve one
   relevant library and perform one documentation query using discovered tools
   (current versions use `resolve-library-id` and `query-docs`). Never fabricate
   host-prefixed tool names from these examples.
4. Record configuration, initialization, tool discovery and useful query result
   separately. Missing optional documentation providers do not block unrelated
   AL work; unresolved symbol facts remain explicit uncertainties.

ALDC Doctor currently does not inspect Codex MCP tables. Its success is not MCP
connection evidence. Compilation, symbol downloads, publishing and deployment are
outside this check. The native Microsoft AL MCP server (`almcp`) and BC Code Atlas
are separate capabilities, not replacements installed by this fix. This guide does
not widen agent tool permissions; a filesystem sandbox is not an MCP tool allowlist.

## Sources

- [Codex MCP configuration](https://developers.openai.com/codex/mcp/)
- [AL symbol provider](https://github.com/StefanMaron/AL-Dependency-MCP-Server)
- [Microsoft Learn MCP](https://learn.microsoft.com/en-us/training/support/mcp)
- [Context7 provider and tools](https://github.com/upstash/context7)
- [ALDC PR #108](https://github.com/javiarmesto/ALDC-AL-Development-Collection/pull/108)
