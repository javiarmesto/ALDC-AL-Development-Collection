## Codex host contract

Resolve .agents/skills/aldc paths below against the installed ALDC skill root
if using plugin discovery instead of local bootstrap. Workflow names below are
reference files in commands/, not automatically registered slash commands.
Packaged domain entrypoints named SKILL.md in the source are stored as GUIDE.md
under references/skills/. This alias applies only when reading packaged guidance;
new discoverable skills must still be created with SKILL.md. Role names are
routing destinations, not chat mentions. Use the discovered native delegation
schema and exact custom-agent identity; do not launch nested CLI processes or
substitute a general agent to simulate a missing independent role.

Read the terminal-host contract at
`.agents/skills/aldc/references/skills/skill-migrate/references/cli-al-tools.md`
before choosing AL tools, changing dependencies or reporting BC29 / AL18
validation. Use only tools actually exposed by this session. Model, reasoning and approval
settings inherit from the parent; this profile grants no extra tools. Read
`.agents/skills/aldc/references/al-tooling.md` for Codex-specific AL availability.
It supersedes availability examples in the shared terminal contract. A read-only
filesystem mode is not an MCP tool allowlist. Its
`sandbox_mode` follows canonical write grants, and the session's own permission profile is reapplied over it, so that key
does not establish the effective runtime policy by itself. Inspect the actual
loaded permissions, including parent overrides. The narrower role write scopes stated below are still
behavioral: `sandbox_mode` cannot express them, and honouring them is yours. Discover MCP
providers before using their examples; none are installed by this package.
If delegation is unavailable, report that the affected independent review or
Conductor workflow is pending; do not certify self-review as independent review.

The `handoffs:` entries of the canonical contract, and the `send: false` on some
of them, have no equivalent here. In Copilot a handoff is a button the human
clicks, and `send: false` additionally hands them the prompt to review before it
is sent: the host supplies the approval. Codex has no such step, so the gate is
yours to keep — never auto-delegate. Present your output, get explicit approval,
and only then delegate or switch role.

# Build and Deploy AL Extension

Your goal is to build and deploy the AL extension for `<DeploymentType from the current request>` environment.
## Select Deployment Strategy
Based on source search select the appropriate deployment strategy
Ask and confirm with the user before proceeding.
## Deployment Types

Based on the deployment type, use the appropriate strategy:

### Development Environment
1. **Build**: Use `authorized build/package through Developer/Implementer` to compile the project
2. **Review**: Present build results for human approval
3. **Deploy**: Use `a verified deployment runner with separate human authorization` for rapid iteration (requires approval)
4. **Verify**: Check for any compilation errors

### Testing Environment
1. **Build**: Use `authorized build/package through Developer/Implementer` with full validation
2. **Package**: Create .app file with `authorized build/package through Developer/Implementer`
3. **Review**: Present package details for human approval
4. **Deploy**: Use `a verified deployment runner with separate human authorization` to deploy with debugging enabled (requires approval)
5. **Test**: Ensure all unit tests pass

### Production Environment
1. **Build**: Use `authorized build/package through Developer/Implementer` with strict validation
2. **Package**: Create release package with `authorized build/package through Developer/Implementer`
3. **Validation**: Verify package integrity and dependencies
4. **Documentation**: Generate deployment checklist and present for review
5. **Human Gate**: **MANDATORY** - Manual approval required before any production action
   - **Note**: Automated deployment to production is intentionally disabled as safeguard
   - All production changes require explicit human authorization

### Existing Package Deployment
- Use `a verified deployment runner with separate human authorization` when deploying pre-built .app files
- Verify package compatibility with target environment

### Full Dependency Package
- Use `authorized build/package through Developer/Implementer` when creating packages with all dependencies
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