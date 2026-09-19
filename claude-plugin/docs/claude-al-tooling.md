# Claude Code AL tooling

Claude-specific bindings, reviewed 2026-09-19. This guide overrides older
availability examples in the shared terminal contract; its role responsibilities,
human gates and evidence requirements still apply. Providers remain external and
optional. Missing tooling does not prevent source-based work.

## Reuse AL LSP for Agents

Use the existing [AL LSP for Agents](https://github.com/SShadowS/al-lsp-for-agents)
companion. It wraps Microsoft's AL language server; it is distinct from AL MCP.
Inspect `/plugin` and the active `.al` provider before configuring anything. Record
Claude, companion and AL Language versions. Follow the companion's platform setup
only if absent and installation is requested. ALDC does not ship `.lsp.json`,
install binaries, alter enabled plugins or start another AL language server.

All specialist agent definitions include Claude's `LSP` tool; Conductor delegates
AL investigation. Use only operations exposed in the current session. Test a
definition, App/Test references and a dependency symbol against the consumer
project. The plugin cache is not the workspace. Text search remains useful source
evidence but does not demonstrate semantic navigation.

Verify main-session, foreground-subagent and any used background-subagent access
separately. A declared tool is not proof of availability in every mode. If a mode
cannot access LSP, return that limitation and the unresolved query to the caller;
do not claim semantic success or install a bridge to conceal it.

## Role loading and permissions

`/aldc:<role>` loads instructions into the existing main conversation. Reading an
agent file does not apply its frontmatter as host permissions. For the agent's
explicit tool list use `claude --agent aldc:<agent-id>` or genuine host delegation,
and inspect the resulting tools. Planning and both review roles have no shell,
file-writing or delegation grant. Dredd retains its pre-existing report-writing
grant; its report path remains a behavioral limit, not a filesystem sandbox.

Plugin-agent `mcpServers`, `hooks` and `permissionMode` fields are ignored by Claude.
Do not use those fields to claim a boundary. Session-wide settings and any parent
tool restrictions still apply. Record the loading mode with each permission test.

## Evidence before acceptance

Use existing plan/triage artifacts. Separate configuration detected, connection
observed, invocation performed and functional result. Record provider versions,
project/revision, exact tool names, operation inputs without secrets, and output
references. Static packaging tests do not satisfy this host smoke test.

- Reuse the already enabled companion; confirm a single active `.al` provider.
- From Architect or Spec, resolve a real definition and dependency symbol.
- From a foreground Planning subagent, resolve an App/Test reference. Inspect its
  effective tools and confirm there is no shell, write or delegation access.
- Check a background mode separately if it is part of the intended workflow.
- Initialize/update ALDC and verify existing MCP and LSP settings are unchanged.

No authenticated Claude/LSP invocation has been performed by the packaging tests.

## Sources

- [Claude plugin LSP configuration](https://code.claude.com/docs/en/plugins-reference#lsp-servers)
- [Claude subagents and plugin restrictions](https://code.claude.com/docs/en/sub-agents)
- [AL LSP for Agents source and setup](https://github.com/SShadowS/al-lsp-for-agents)
