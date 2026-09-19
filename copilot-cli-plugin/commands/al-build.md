---
description: Build, package, and deploy AL extensions to Business Central environments. ALDC workflow (Copilot prompt al-build); invoke explicitly.
disable-model-invocation: true
---

> **Copilot CLI adapter — generated; do not edit this distribution.**
> Select a role using /agent or copilot --agent <id>. Role names in this contract
> are routing destinations, never chat mentions or evidence of an invocation.
> Delegate only through the native task tool, using the exact discovered agent ID
> as agent_type (for example al-planning-subagent). Inspect list_agents and the
> actual task schema first. Keep all canonical human gates. Pass bounded context
> inline; wait for completion (read_agent for a background task) before consuming
> the result. A delegated role returns questions to its caller for the human gate.
> If task or the requested custom agent is unavailable in this context, return
> the blocked handoff to the caller/user. Never impersonate a missing subagent,
> silently substitute general-purpose, or launch another CLI process to fake it.
> Tool aliases in frontmatter select capabilities; call the actual tools exposed
> by the host: view, glob, grep/rg, edit/create/apply_patch, bash/powershell,
> web_fetch, task. Use a capability only when granted to this role and available.
> Load domain skills through the host's skill mechanism when exposed, otherwise
> read the complete bundled SKILL.md. A read is not a native skill invocation.
> Resolve PLUGIN_ROOT to this installed agent's plugin directory (not the project
> or original checkout). It is a path placeholder here, not a promised global
> shell variable. Read skills/skill-migrate/references/cli-al-tools.md there.
> Project instructions and matching .github/instructions rules remain binding;
> pass the relevant excerpts to delegated roles. Canonical artifacts remain in
> .github/plans/. Role write scopes are behavioral, not filesystem sandboxes.
> AL execution requires a verified terminal command/runner or an actually exposed
> MCP capability. Editor-only debugging/navigation is unavailable in this CLI.
> Symbol MCP: before any tools/call, verify AL CLI prerequisites are already
> provisioned; this provider may auto-install AL tools on first use. A read-only
> role must return that prerequisite to the caller, never bootstrap software.
> Load symbols via al_packages(action: load, path: absolute consumer path).
> The MCP process may run from the plugin cache; never assume its cwd is the
> consumer. Use the discovered schema and report missing .app packages explicitly.
> Record missing capabilities and unexecuted checks explicitly; never simulate.


# Build and Deploy AL Extension

Your goal is to build and deploy the AL extension for `<DeploymentType from $ARGUMENTS>` environment.
## Select Deployment Strategy
Based on glob/grep text search (not semantic AL navigation) select the appropriate deployment strategy
Ask and confirm with the user before proceeding.
## Deployment Types

Based on the deployment type, use the appropriate strategy:

### Development Environment
1. **Build**: Use `verified project build/package command (if available)` to compile the project
2. **Review**: Present build results for human approval
3. **Deploy**: Use `verified deployment command (requires authorization and an available runner)` for rapid iteration (requires approval)
4. **Verify**: Check for any compilation errors

### Testing Environment
1. **Build**: Use `verified project build/package command (if available)` with full validation
2. **Package**: Create .app file with `verified project build/package command (if available)`
3. **Review**: Present package details for human approval
4. **Deploy**: Use `verified deployment command (requires authorization and an available runner)` to deploy with debugging enabled (requires approval)
5. **Test**: Ensure all unit tests pass

### Production Environment
1. **Build**: Use `verified project build/package command (if available)` with strict validation
2. **Package**: Create release package with `verified project build/package command (if available)`
3. **Validation**: Verify package integrity and dependencies
4. **Documentation**: Generate deployment checklist and present for review
5. **Human Gate**: **MANDATORY** - Manual approval required before any production action
   - **Note**: Automated deployment to production is intentionally disabled as safeguard
   - All production changes require explicit human authorization

### Existing Package Deployment
- Use `verified deployment command (requires authorization and an available runner)` when deploying pre-built .app files
- Verify package compatibility with target environment

### Full Dependency Package
- Use `verified project build/package command (if available)` when creating packages with all dependencies
- Useful for offline installations or isolated environments

## Error Handling

Monitor the output for:
- Compilation errors
- Dependency conflicts
- Publishing failures
- Permission issues

## Post-Deployment Verification

After deployment:
1. Verify extension appears in Extension Management
2. Check all functionality works as expected
3. Validate permissions are correctly applied
4. Monitor for any runtime errors