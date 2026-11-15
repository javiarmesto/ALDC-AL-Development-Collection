---
name: al-build
description: "Build, package, and deploy AL extensions to Business Central environments. ALDC workflow (Copilot prompt al-build); invoke explicitly."
disable-model-invocation: true
---

> **Claude Code runtime:** read `${CLAUDE_PLUGIN_ROOT}/docs/claude-runtime.md` before running this workflow (gates, tools, paths, `<Name from $ARGUMENTS>` inputs). It runs in the main session.

# Build and Deploy AL Extension

Your goal is to build and deploy the AL extension for `<DeploymentType from $ARGUMENTS>` environment.

**Who does what here.** You build: `mcp__al__al_downloadsymbols`, `mcp__al__al_compile` and `mcp__al__al_build` when the official AL MCP is connected (alias `al`, see `${CLAUDE_PLUGIN_ROOT}/docs/claude-al-tooling.md`), otherwise an installed ALTool/AL-Go runner through `Bash`. Steps marked **[human]** are VS Code commands or CI steps: publishing, BC sign-in, debugging and running tests against Business Central. Prepare them and hand them to the user; never call a publish or authentication tool, even if the session exposes one.

## Select Deployment Strategy
Based on the project (`app.json`, AL-Go settings, existing launch configurations) select the appropriate deployment strategy.
Ask and confirm with the user before proceeding.
## Deployment Types

Based on the deployment type, use the appropriate strategy:

### Development Environment
1. **Build**: compile the project (`mcp__al__al_compile`, or `mcp__al__al_build` to produce the `.app`)
2. **Review**: Present build results for human approval
3. **Deploy [human]**: the user publishes from VS Code (AL: Publish, or rapid application publish for iteration)
4. **Verify**: Check for any compilation errors

### Testing Environment
1. **Build**: `mcp__al__al_build` with full validation (analyzers enabled in the project settings)
2. **Package**: the `.app` file `mcp__al__al_build` produces; report its path
3. **Review**: Present package details for human approval
4. **Deploy [human]**: the user publishes with debugging enabled, after approval
5. **Test [human or runner]**: tests run on Business Central through `aldc.yaml -> testing.runner` when configured, otherwise by the user; report them as not-run until you see their output

### Production Environment 
1. **Build**: `mcp__al__al_build` with strict validation
2. **Package**: the release `.app` produced by the build
3. **Validation**: Verify package integrity and dependencies (`mcp__al__al_getpackagedependencies`, `app.json`)
4. **Documentation**: Generate deployment checklist and present for review
5. **Human Gate**: **MANDATORY** - Manual approval required before any production action
   - **Note**: Automated deployment to production is intentionally disabled as safeguard
   - All production changes require explicit human authorization

### Existing Package Deployment [human]
- The user publishes the pre-built `.app` (VS Code or the admin center)
- Verify package compatibility with the target environment first (`app.json` runtime, platform and dependencies)

### Full Dependency Package [human]
- Packaging an app together with all its dependencies is a VS Code or AL-Go step; list the dependency `.app` files the user needs
- Useful for offline installations or isolated environments

## Error Handling

Monitor the output for:
- Compilation errors
- Dependency conflicts
- Publishing failures (reported by the user)
- Permission issues

## Post-Deployment Verification [human]

After deployment, ask the user to:
1. Verify extension appears in Extension Management
2. Check all functionality works as expected
3. Validate permissions are correctly applied
4. Monitor for any runtime errors
