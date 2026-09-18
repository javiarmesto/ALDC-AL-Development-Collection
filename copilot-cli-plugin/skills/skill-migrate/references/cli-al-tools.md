# ALDC terminal-host contract (Claude Code, Copilot CLI and Codex)

Read this reference before choosing AL tools, changing dependencies, or reporting
BC29 / AL18 validation. Agent and command responsibilities still apply. This
contract takes precedence over older examples of tool availability in their bodies;
it does not replace the Conductor workflow or its human gates.

Resolve references to canonical `instructions/al-*.instructions.md` against this
plugin's sibling rules folder when those files are not in the project: `rules/` in
the Claude Code plugin, `rules-templates/` in the generated Copilot CLI distribution.
Claude rules use `.md` and `paths`; the generated CLI templates use `.instructions.md`
and `applyTo`. Codex keeps its readable AL rules in the ALDC skill under
`references/rules/`, without an auto-apply claim. Read the matching rules and pass the relevant content to subagents;
do not assume editor auto-attachment or a plugin-root CLAUDE.md has loaded them.

Canonical `docs/templates/` references resolve against the installed plugin root
when absent in the project. Codex keeps equivalent templates under the ALDC
skill references/templates/. Workflow names are references to the supplied
commands; only use a slash command if the active host actually exposes it.

## Host and capability discovery

These plugins use terminal tools and configured MCP servers. Installing AL in
VS Code does not expose its language-model tools to a terminal host. Never call
`ms-dynamics-smb.al/*` here or rename a community tool to a Microsoft-native tool.
Claude and Copilot CLI ship MCP declarations for al-symbols-mcp, context7 and
microsoft-docs. Codex inherits configured providers from the session and ships no
MCP configuration.
Their presence in a manifest is a declaration, not proof of connection or access.
Use the names and argument schemas actually exposed to the active agent. Claude
plugin tools have a plugin-scoped MCP name; workspace MCP names can differ.
If unavailable, use source/log evidence or state the specific missing capability.
Do not install a bridge, fork, BC Atlas or a replacement server automatically.

The executable name `al` in examples means the installed ALTool command, not a
guaranteed executable on PATH. Developer/Implementer (or initialization/build for
their own setup/build work) first checks its actual path, version and help.
Use that executable's documented arguments and the shell supported by the host.
BC28 remains supported: do not upgrade manifests or enable AL18 flags by default.
Apply BC29 sections only to a requested BC29 target with a compatible toolchain.

| Need | Terminal-host behavior |
| --- | --- |
| Symbols | Query configured al-symbols-mcp using its real schema; identify package, app and version. Text search is only source evidence. |
| Diagnostics | Read compiler logs for the exact project/revision. They are not a live VS Code Problems list. |
| Build | Developer/Implementer or `al-build` executes the available ALTool compile command for authorized App/Test projects. Preserve stdout, stderr, exit status and package path. |
| Download symbols | Implementation/setup owns a required refresh. Use a verified installed command/provider only if it supports the operation; otherwise request the existing VS Code/CI restore and consume its result. |
| Tests | Discover a real installed runner and its help. AL18 announcements alone do not establish a callable verb. Execute only the authorized target or request the existing runner. Compiled tests are not passed tests. |
| Debug/snapshot/profile | No such integration is bundled here. Consume traces or hand off to the configured debugger. Adding a provider requires a separate explicit configuration decision. |
| Publish | No automatic deployment. Keep the existing human gate and the approved VS Code/CI deployment path. Build success is not deployment evidence. |

## Role boundaries and dependency discovery

- Architect, specification and Planning search relevant objects, inspect existing
  diagnostics, propose dependencies and consume pertinent graph evidence. They
  do not build, download packages, run graphs or change manifests as research.
  Record unresolved compatibility in Open Questions; do not block drafting a spec
  on implementation-level declarations. Library versions need not numerically
  equal the application version: check identity, minimum version, runtime and APIs.
- Developer and Implementer apply approved dependency changes, refresh symbols,
  build, run available tests and perform useful bounded graph operations.
- Review and Dredd independently assess the raw evidence; they do not execute
  graphs or infer runtime success. Review is not replaced by a provider verdict.
- Triage diagnoses using sources/logs and any explicitly available authorized
  diagnostic provider, then hands the fix to Developer. Presales assesses feasibility.
  Agent Builder delegates AL execution to Developer/Implementer.
- Conductor coordinates the existing phases and passes evidence references;
  it does not execute AL operations for another role. Its existing git/document
  responsibilities and approval gates remain intact.

Environment search is optional and is not provided by the shipped community
symbol configuration as an assumed equivalent of AL18 native search. If an already
configured provider exposes environment search, check that provider's schema and
target before use. Never copy VS Code `filters.source` into an unrelated MCP call.
Capture owning app identity and version, propose the dependency, let implementation
apply the approved change and refresh packages, then repeat a local symbol query.
If the provider is absent, record environment search as not executed; do not invent
an owner or dependency from an object name.

## Optional AL Graph through the terminal

Only Developer/Implementer performs extraction, queries or export. First inspect
the actual ALTool version and `graph --help`, then help for the installed extraction,
query and export subcommands. Names such as `extract-whole` are supplied research
notes, not a promise that this executable supports them. There is no `al_graph` LM
tool in this plugin. Do not install another orchestrator or require Doctor.

Choose a bounded question: a public entry reaching internal code, an app boundary,
or debuggable/non-debuggable code. Use only the authorized, relevant source corpus;
symbol packages do not guarantee complete bodies. Save the actual command, version,
corpus, result and coverage limits in the existing plan/review/report artifacts.
Export only when the installed format helps review. A static path is not execution,
a data leak or a vulnerability; missing paths do not prove isolation without coverage.
An unavailable or irrelevant graph never blocks unrelated work.

## Evidence and optional quality provider

Distinguish **declared**, **read** and **executed** in existing artifacts, with trace
references. Log tool discovery separately from invocation. For tests distinguish
written, compiled, executed and passed/failed/skipped. Report missing tools precisely.
BCQuality remains optional through the available plugin/provider or existing local
configuration; no fork is required. If absent, perform the complete native review
and state coverage limits. Consult the relevant sections of
[AL18 capabilities](al18-capabilities.md) only when the requirement needs them.

## Sources and local validation

Reviewed 2026-09-11. Documentation is not local runtime verification.

- [Microsoft ALTool](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-al-tool)
- [BC29 announcements](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/whatsnew/whatsnew-update-29-0)
- [Claude subagent tool allowlists](https://code.claude.com/docs/en/sub-agents)
- [Claude plugin components](https://code.claude.com/docs/en/plugins-reference)
- [Anthropic's plugin MCP naming guide](https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/mcp-integration/references/tool-usage.md)
- [Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
- [Copilot CLI agent reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#custom-agents-reference)
