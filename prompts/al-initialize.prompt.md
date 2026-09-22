---
agent: agent
model: Claude Sonnet 4.5
description: 'Initialize AL development environment and workspace for Business Central.'
tools: [vscode, execute, read, agent, edit, search, web, 'github/*', 'github/*', 'github/*', 'microsoft-docs/*', 'upstash/context7/*', 'al-symbols-mcp/*', al/al_addproject, al/al_symbolsearch, al/al_getdiagnostics, al/al_getpackagedependencies, ms-dynamics-smb.al/al_downloadsymbols, ms-dynamics-smb.al/al_symbolsearch, ms-dynamics-smb.al/al_symbolrelations, todo]
---

# AL Environment Initialization

Your goal is to initialize the AL development environment and workspace for `${input:ProjectName}`.

This workflow covers both initial environment setup (VS Code, GitHub Copilot) and AL workspace configuration (project structure, symbols, dependencies).

## Execution scope — choose before any phase

When the request is to prepare/register an **existing** App or Test for AL MCP,
use **MCP workspace preparation only** below and return its result. Do not run
Phase 0 (plugin bootstrap), Phases 1–5, troubleshooting actions or the full-setup
success checklist. This narrow mode does not install ALDC or change files.
An explicit request to prepare the named existing project authorizes its bounded
registration; reuse that authorization instead of requesting it again.

For full environment initialization, retain the existing phases and material
approvals. Run MCP workspace preparation after the authorized project exists and
before handing it to Architect/Spec/implementation. Do not treat an ordinary
architecture request, plugin installation or a Doctor run as setup authorization.
Doctor remains diagnostic; it never registers projects as a hidden side effect.

## MCP workspace preparation only

This protocol concerns the **official AL MCP**, not AL LSP, the native editor
symbol index, community symbol providers or a Business Central business-data MCP.
Operation names below describe capabilities; inspect actual schemas and aliases
in this host. Never transpose another host's wire prefix or native AL schema.

1. **Resolve the exact project.** Read the current project's `aldc.yaml` and
   `solution.roots`, then confirm the requested existing folder contains
   `app.json`. Resolve relative roots against that configuration file, not the
   first workspace folder. Record absolute path, app identity and target version.
   Prepare App by default when App is the requested scope. Prepare Test only when
   requested/needed within the authorized scope, separately by its own path.
   Never register the solution parent or the BCQuality corpus as an AL project.
   Missing/ambiguous roots require the smallest clarification, not scaffolding.
2. **Inspect the live connection.** Reuse the configured official AL MCP server
   and its real tool catalog. Discover the schemas of `al_getpackagedependencies`
   and `al_addproject`. If the provider or an operation is unavailable, report
   that precise capability as unavailable. Do not install a server, change an
   alias, edit host configuration, broaden tool filters, or use a shell/delegation
   workaround to bypass the executing context's permissions.
3. **Probe before registration.** Query package dependencies for the exact
   project using the provider's supported path selector. If the response confirms
   that project is loaded, report **already-ready** and do not register it again.
   A success envelope, an empty result or another loaded project alone does not
   prove this target is ready. If the schema cannot select/identify the target,
   report ambiguity; do not guess a workspace-wide scope.
4. **Register only when needed and authorized.** For an explicit no-projects-loaded
   or target-not-loaded response (or an authoritative loaded-project listing that
   excludes this target), call the already exposed `al_addproject` on that existing
   absolute folder. The current request must authorize preparation of this project.
   Never use new-project/scaffold operations. Retain the exact call and result.
5. **Verify once.** After successful registration, retry the same dependency query
   once and confirm the returned project identity. Report **registered-and-verified**
   only after that check. Registration success followed by failure is **partial**.
   Registration failure stops this target's preparation. Unrelated errors such as
   authentication, schema, missing packages or version conflicts are not reasons to
   register repeatedly. At most one registration and one post-registration retry
   per target in this invocation; do not loop or restart the server to force success.
6. **State the connection boundary.** Readiness belongs to the executing context's
   live MCP connection. A new/restarted server, alias, session or child agent must
   not be assumed to inherit it. Pass the target and evidence to the next role;
   that role verifies its own access. If its connection is unprepared, use its
   surface's explicitly authorized setup route on that same connection. Preparing
   the parent again is not proof that a child is prepared. This workflow adds no
   setup permission to Architect, Spec, Reviewer or Conductor; Conductor delegates
   and any surface-specific authorized recovery retains its existing boundaries.

### Limits and surface binding

Registration changes the server's workspace state only under the observed
provider contract. It does not authorize compilation/build, symbol restore,
publishing, authentication changes, index generation or edits to sources,
manifests, MCP/LSP settings and credentials. Do not execute those as fallbacks.
Existing full-setup restore permissions do not apply to this narrow mode.

- **Copilot Chat:** this Initialize prompt declares the exact optional selectors
  for registration and dependency lookup. They assume the existing
  alias `al`; verify real tool-picker bindings. A different alias needs an explicit
  reviewed consumer binding, not a duplicate server or wildcard.
- **Claude Code:** run the explicitly invoked Initialize workflow in a setup
  context where the real official AL MCP operations are already exposed. Reading
  a skill does not expand a custom agent's allowed tools.
- **Copilot CLI:** run Initialize in an authorized setup session with the actual
  MCP operations available. A command's instructions do not bypass agent filters.
- **Codex:** use the existing exposed tools and actual executing connection.
  Filesystem sandbox settings do not certify remote MCP isolation. Preserve the
  surface's bounded same-connection recovery where authorized; do not assume
  parent preparation has initialized native child agents.

### Preparation result

Return a compact table, with one row per requested project:

| Project / absolute path | Provider / executing context | Initial probe | Registration | Verification | Status / next action |
|---|---|---|---|---|---|

Retain actual tool identifiers, parameters and responses or transcript references.
Use **already-ready**, **registered-and-verified**, **partial**, **blocked** or
**unavailable**, with reasons. Report only observed dependencies/versions; no
compiler, LSP, analyzer, BCQuality or runtime PASS follows from this check.
In preparation-only mode, stop here even if optional capabilities are unavailable.

## Phase 1: Environment Setup

### Prerequisites Check

Verify the following are available:

**Required Tools:**
- [ ] Visual Studio Code (latest version)
- [ ] AL Language Extension (Microsoft's official extension)
- [ ] GitHub Copilot or compatible AI assistant
- [ ] Git for version control

**Recommended Tools:**
- [ ] AL Test Runner for test management
- [ ] Business Central Docker Container for local development
- [ ] AL Object Designer for navigation
- [ ] GitLens for enhanced git integration

### GitHub Copilot Installation

**Step 1: Install VS Code Extensions**
- Open Visual Studio Code
- Access Extensions marketplace (`Ctrl+Shift+X` or `Cmd+Shift+X`)
- Install:
  - **GitHub Copilot** - Code completion
  - **GitHub Copilot Chat** - Interactive assistance
  - **AL Language** - Business Central development

**Step 2: Authentication**
- Sign in to GitHub when prompted
- Authorize the extension
- Verify connection is active

### VS Code Workspace Configuration

Create or update `.vscode/settings.json` in the workspace root:

```json
{
  // AL Language settings
  "al.enableCodeAnalysis": true,
  "al.codeAnalyzers": ["${CodeCop}", "${PerTenantExtensionCop}", "${UICop}"],

  // GitHub Copilot settings
  "github.copilot.enable": {
    "*": true,
    "al": true
  },

  // Editor settings for better AI integration
  "editor.inlineSuggest.enabled": true,
  "editor.quickSuggestions": {
    "other": true,
    "comments": true,
    "strings": true
  }
}
```

**Configuration Benefits:**
- Code analysis with CodeCop, PerTenantExtensionCop, and UICop
- AI suggestions optimized for AL files
- Enhanced inline completion

## Phase 2: Project Initialization

### Choose Project Type

**For New Projects:**
```
al_new_project
```

**For Existing Folders:**
```
al_go
```

### Project Structure

Implement feature-based organization:

```
${input:ProjectName}/
├── .vscode/
│   ├── settings.json          # Workspace settings
│   └── launch.json            # Debug configurations
├── src/
│   ├── Tables/                # Table objects
│   ├── Pages/                 # Page objects
│   ├── Codeunits/             # Codeunit objects
│   ├── Reports/               # Report objects
│   ├── Queries/               # Query objects
│   ├── XMLports/              # XMLport objects
│   ├── PageExtensions/        # Page extensions
│   ├── TableExtensions/       # Table extensions
│   └── Enums/                 # Enum objects
├── test/
│   ├── TestCodeunits/         # Test codeunits
│   └── TestData/              # Test data and helpers
├── app.json                   # Application manifest
├── .gitignore                 # Git ignore rules
└── README.md                  # Project documentation
```

### Download Symbols

Download required symbols:
```
al_download_symbols
```

Verify all base application dependencies are available.

### Generate Manifest

Create manifest file:
```
al_generate_manifest
```

**Human Review:** Validate manifest contents before proceeding.

## Phase 3: Launch Configuration

### 🔒 Human Gate: Authentication Configuration Review

**SECURITY CHECKPOINT - Configuration contains sensitive information**

Before creating launch.json:
1. **Review authentication method** with stakeholder
2. **Confirm server URLs** are correct for target environment
3. **Verify credentials handling** follows security policies
4. **Obtain approval** before saving configuration

### Configure Debugging

Create `.vscode/launch.json` based on your environment:

**For Cloud Sandbox:**
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "al",
            "request": "launch",
            "name": "Your own server",
            "server": "https://businesscentral.dynamics.com",
            "serverInstance": "BC",
            "authentication": "AAD",
            "startupObjectType": "Page",
            "startupObjectId": 22,
            "schemaUpdateMode": "Synchronize",
            "tenant": "default"
        }
    ]
}
```

**For On-Premises:**
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "al",
            "request": "launch",
            "name": "Local server",
            "server": "http://localhost",
            "serverInstance": "BC210",
            "authentication": "Windows",
            "startupObjectType": "Page",
            "startupObjectId": 22,
            "schemaUpdateMode": "Synchronize"
        }
    ]
}
```

**For Agent Debugging (Copilot features):**
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "al",
            "request": "attach",
            "name": "Attach to agent (Sandbox)",
            "clientType": "Agent",
            "environmentType": "Sandbox",
            "environmentName": "${input:EnvironmentName}",
            "breakOnNext": "WebClient"
        }
    ]
}
```

## Phase 4: Best Practices Setup

### Create .gitignore

Generate appropriate `.gitignore`:

```gitignore
# AL Compiler outputs
.alpackages/
.alcache/
.snapshots/
rad.json
*.app

# VS Code settings (optional)
.vscode/launch.json
.vscode/*.log

# Build artifacts
.netFramework/
bin/
obj/

# Test results
TestResults/
*.trx

# Temporary files
*.tmp
*.bak
*~
```

### Documentation Standards

Create comprehensive `README.md`:

```markdown
# ${input:ProjectName}

## Overview
[Project purpose and business value]

## Key Features
- Feature 1: [Description]
- Feature 2: [Description]

## Architecture
[High-level architecture description]

## Naming Conventions
- Tables: `[BusinessEntity]` (e.g., `CustomerExtended`)
- Pages: `[BusinessEntity][PageType]` (e.g., `CustomerListPage`)
- Codeunits: `[Purpose]` (e.g., `SalesOrderProcessor`)
- ID Range: 50000-50099

## Development Guidelines
- Follow AL coding standards
- Use XML documentation for procedures
- Implement error handling with try-functions
- Write unit tests for business logic

## Dependencies
[List of extension dependencies]

## Setup Instructions
[How to set up the development environment]
```

### XML Documentation Pattern

Demonstrate documentation for procedures:

```al
/// <summary>
/// Calculates the total amount for a sales order including tax
/// </summary>
/// <param name="SalesHeader">The sales header record</param>
/// <returns>The total amount including tax</returns>
procedure CalculateTotalWithTax(var SalesHeader: Record "Sales Header"): Decimal
begin
    // Implementation
end;
```

## Phase 5: Verification

### Test Your Setup

1. **Open an AL File**
   - Navigate to any `.al` file in the project
   - Ensure syntax highlighting is active

2. **Test Code Completion**
   - Start typing a procedure declaration
   - Verify inline suggestions appear from Copilot

3. **Test Copilot Chat**
   - Open Copilot Chat (`Ctrl+Shift+I`)
   - Ask: "Explain this AL code"
   - Verify you receive a response

4. **Verify Code Analysis**
   - Introduce a small code issue
   - Check that warnings appear

5. **Test Build**
   - Run AL: Download Symbols
   - Attempt to compile the project
   - Verify no configuration errors

## Troubleshooting

### Authentication Issues

If authentication fails:
- Use `al_clear_credentials_cache` to clear cached credentials
- Re-authenticate when prompted
- Verify launch.json authentication method is correct

### Symbol Issues

If symbols are missing:
1. Download symbols: `al_download_symbols`
2. If persistent, download source: `al_download_source`
3. Verify app.json dependencies match BC version

### AI Suggestions Not Appearing

Check:
- AI extension is installed and enabled
- You're signed in to AI service
- `editor.inlineSuggest.enabled` is `true`
- Restart VS Code if needed

### Poor Quality Suggestions

Improvements:
- Use descriptive file names
- Add code comments and XML documentation
- Keep related files open for better context
- Follow naming conventions consistently

## Success Criteria

Verify the setup is complete:

- ✅ Visual Studio Code is installed and configured
- ✅ AL Language extension is active
- ✅ GitHub Copilot is installed and authenticated
- ✅ Workspace settings are configured
- ✅ Project structure is organized
- ✅ Symbols downloaded successfully
- ✅ Manifest generated
- ✅ Launch.json configured
- ✅ README.md exists with project documentation
- ✅ Code completion is working
- ✅ Build succeeds without errors

## Next Steps

Once your environment is initialized:

**For Development:**
```
@AL Implementation Specialist                    # Implement features (loads page/event skills on demand)
@workspace use al-build          # Build and deploy
```

**For Architecture:**
```
@AL Architecture & Design Specialist                    # Design solutions
```

**For TDD Orchestration:**
```
@AL Development Conductor                    # Plan → Implement → Review → Commit
```

## Security Considerations

**What Gets Sent to AI Services:**
- Code snippets from your workspace
- Currently open files
- Your prompts and questions

**What You Should NOT Include:**
- Sensitive credentials or passwords
- Customer data or PII
- Security keys or certificates

**Best Practices:**
- Review organization's AI usage policy
- Use `.gitignore` for sensitive files
- Use environment variables for credentials
- Close files with sensitive information when not needed

---

**Environment Initialization Complete! 🎉**

Your AL development environment is ready for Business Central development with optimized AI assistance.
