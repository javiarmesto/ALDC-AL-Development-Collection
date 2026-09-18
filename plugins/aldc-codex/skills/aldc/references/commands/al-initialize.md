## Codex host contract

Resolve .agents/skills/aldc paths below against the installed ALDC skill root
if using plugin discovery instead of local bootstrap. Workflow names below are
reference files in commands/, not automatically registered slash commands.
Packaged domain entrypoints named SKILL.md in the source are stored as GUIDE.md
under references/skills/. This alias applies only when reading packaged guidance;
new discoverable skills must still be created with SKILL.md.

Use only tools actually exposed by this session. Model, reasoning and approval
settings inherit from the parent; this profile grants no extra tools. Its
`sandbox_mode` is derived from the write scope the canonical contract grants this
role, and the session's own permission profile is reapplied over it, so that key
narrows and never grants. The narrower role write scopes stated below are still
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

# AL Environment Initialization

Your goal is to initialize the AL development environment and workspace for `<ProjectName from $ARGUMENTS>`.

This workflow covers both initial environment setup (VS Code, GitHub Copilot) and AL workspace configuration (project structure, symbols, dependencies).

## Phase 0: Codex project initialization

Run the installed package scripts/init.js with --project <directory> to preview.
After reviewing the plan, repeat with --apply. Preserve collisions unless the
user authorizes --force replacement. Use --verify for drift and --rollback for
the preceding transaction. Do not combine plugin discovery with local bootstrap
copies of the same ALDC skill. Confirm loaded sources before environment setup.

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
<ProjectName from $ARGUMENTS>/
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
            "environmentName": "<EnvironmentName from $ARGUMENTS>",
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
# <ProjectName from $ARGUMENTS>

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
/al-build          # Build and deploy
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
