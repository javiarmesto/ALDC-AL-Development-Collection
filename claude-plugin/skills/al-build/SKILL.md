---
name: al-build
description: >
  Build, package, and deploy AL extensions to Business Central environments.
  Use when you need to build, compile, package, publish, or deploy an AL extension.
allowed-tools: Read Grep Glob Write Edit Bash
disable-model-invocation: true
---

# Build and Deploy AL Extension

Your goal is to build and deploy the AL extension for `${input:DeploymentType}` environment.
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
