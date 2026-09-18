## Codex host contract

Resolve .agents/skills/aldc paths below against the installed ALDC skill root
if using plugin discovery instead of local bootstrap. Workflow names below are
reference files in commands/, not automatically registered slash commands.
Packaged domain entrypoints named SKILL.md in the source are stored as GUIDE.md
under references/skills/. This alias applies only when reading packaged guidance;
new discoverable skills must still be created with SKILL.md.

Use only tools actually exposed by this session. Model, reasoning, sandbox and
approval settings inherit from the parent; this profile grants no extra tools.
Role write scopes below are behavioral, not filesystem sandboxes. Discover MCP
providers before using their examples; none are installed by this package.
If delegation is unavailable, report that the affected independent review or
Conductor workflow is pending; do not certify self-review as independent review.

# Build and Deploy AL Extension

Your goal is to build and deploy the AL extension for `<DeploymentType from $ARGUMENTS>` environment.
## Select Deployment Strategy
Based on #codebase select the appropriate deployment strategy
Ask and confirm with the user before proceeding.
## Deployment Types

Based on the deployment type, use the appropriate strategy:

### Development Environment
1. **Build**: Use `al_build` to compile the project
2. **Review**: Present build results for human approval
3. **Deploy**: Use `al_incremental_publish` for rapid iteration (requires approval)
4. **Verify**: Check for any compilation errors

### Testing Environment
1. **Build**: Use `al_build` with full validation
2. **Package**: Create .app file with `al_package`
3. **Review**: Present package details for human approval
4. **Deploy**: Use `al_publish` to deploy with debugging enabled (requires approval)
5. **Test**: Ensure all unit tests pass

### Production Environment
1. **Build**: Use `al_build` with strict validation
2. **Package**: Create release package with `al_package`
3. **Validation**: Verify package integrity and dependencies
4. **Documentation**: Generate deployment checklist and present for review
5. **Human Gate**: **MANDATORY** - Manual approval required before any production action
   - **Note**: Automated deployment to production is intentionally disabled as safeguard
   - All production changes require explicit human authorization

### Existing Package Deployment
- Use `al_publish_existing_extension` when deploying pre-built .app files
- Verify package compatibility with target environment

### Full Dependency Package
- Use `al_full_package` when creating packages with all dependencies
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