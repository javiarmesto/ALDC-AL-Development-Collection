---
description: >
  Build, package, and deploy AL extensions to Business Central environments.
  Use when you need to build, compile, package, publish, or deploy an AL extension.
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

# Build and Deploy AL Extension

Your goal is to build (compile + package) the AL extension for the `${input:DeploymentType}` environment and to guide its deployment.

> **What runs where.** In the Claude Code harness you compile and package with the **AL command-line tool (ALTool / `al`)** via `Bash`. ALTool has **no publish/test verb** — deployment and test runs are VS Code (`AL: Publish` / `AL: Run Tests`) or AL-Go/CI pipeline steps. So this command builds the `.app` and then hands off the deploy with a clear, approved checklist.

## Select Deployment Strategy
Inspect the project (`Read` `app.json`, `Grep`/`Glob`, **al-symbols-mcp** for dependencies) and select the appropriate deployment strategy.
Ask and confirm with the user before proceeding.

## Deployment Types

Based on the deployment type, use the appropriate strategy:

### Development Environment
1. **Build**: `Bash: al compile` (single project) or `al workspace compile` (multi-project) to produce the `.app`
2. **Review**: Present compiler results for human approval
3. **Deploy**: hand off to VS Code `AL: Publish with RAD` for rapid iteration (requires approval)
4. **Verify**: Read the compiler output for any errors

### Testing Environment
1. **Build**: `Bash: al compile` with full validation (read all warnings/errors)
2. **Package**: the `.app` is produced by `al compile`
3. **Review**: Present package details for human approval
4. **Deploy**: hand off to VS Code `AL: Publish` (debugging enabled) or the CI pipeline (requires approval)
5. **Test**: ask the human to run VS Code `AL: Run Tests` (or the CI test runner) and confirm all unit tests pass

### Production Environment 
1. **Build**: `Bash: al compile` with strict validation
2. **Package**: take the release `.app` produced by `al compile`
3. **Validation**: Verify package integrity and dependencies (`app.json` + **al-symbols-mcp** `al_packages`)
4. **Documentation**: Generate deployment checklist and present for review
5. **Human Gate**: **MANDATORY** - Manual approval required before any production action
   - **Note**: Automated deployment to production is intentionally disabled as safeguard
   - All production changes require explicit human authorization, run through the AL-Go/CI release pipeline or VS Code

### Existing Package Deployment
- When deploying a pre-built `.app`, hand off to VS Code `AL: Publish` (or the CI pipeline) — there is no ALTool publish verb
- Verify package compatibility with the target environment first

### Full Dependency Package
- For packages bundling all dependencies (offline/isolated installs), drive this through the AL-Go/CI packaging pipeline
- `al compile` produces the extension `.app`; dependency bundling is a pipeline concern

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
