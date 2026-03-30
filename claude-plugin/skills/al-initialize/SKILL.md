---
name: al-initialize
description: >
  Initialize AL development environment and workspace for Business Central.
  Use when setting up a new project, initializing the workspace, or configuring
  the development environment.
allowed-tools: Read Grep Glob Write Edit Bash WebSearch
disable-model-invocation: true
---

# AL Environment Initialization

Your goal is to initialize the AL development environment and workspace for `${input:ProjectName}`.

This workflow covers environment setup, AL workspace configuration, and **ALDC rules injection** into your project.

## Phase 0: ALDC Rules Injection (Plugin Mode)

When ALDC is installed as a Claude Code plugin, path-scoped rules must be copied to the project's `.claude/rules/` directory. This phase handles that automatically.

### Rules Installation

Copy the following rule templates from the plugin's `rules-templates/` directory to your project's `.claude/rules/`:

```bash
# Create project rules directory
mkdir -p .claude/rules

# Copy ALDC rule templates to project
cp "${CLAUDE_PLUGIN_ROOT}/rules-templates/"*.md .claude/rules/
```

**Rules installed:**

| Rule | Scope | Purpose |
|------|-------|---------|
| `al-guidelines.md` | `**/*.al`, `**/*.json` | Core AL development principles |
| `al-code-style.md` | `**/*.al` | Code formatting and structure |
| `al-naming-conventions.md` | `**/*.al` | Consistent naming patterns |
| `al-performance.md` | `**/*.al` | Performance optimization |
| `al-error-handling.md` | `**/*.al` | Error handling and telemetry |
| `al-events.md` | `**/*.al` | Event-driven development |
| `al-testing.md` | `**/test/**/*.al` | Test implementation patterns |
| `al-agent-toolkit.md` | `**/*.al` | AI Development Toolkit patterns |

### CLAUDE.md Generation

Generate a project-level `CLAUDE.md` that references ALDC:

```markdown
# ${input:ProjectName} — Claude Code Instructions

## Framework
This project uses **ALDC** (AL Development Collection) plugin for Claude Code.
All agents, skills, and workflows are available via the `aldc:` namespace.

## Quick Start
- `/aldc:al-spec-create` — Create specifications
- `/aldc:al-build` — Build extension
- `agent "aldc:al-architect"` — Architecture design
- `agent "aldc:al-developer"` — Implementation

## Project-Specific Notes
[Add your project-specific instructions here]
```

**Human Review:** Confirm rules were copied correctly before proceeding to environment setup.

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
agent `al-developer`                    # Implement features (loads page/event skills on demand)
/al-build          # Build and deploy
```

**For Architecture:**
```
agent `al-architect`                    # Design solutions
```

**For TDD Orchestration:**
```
agent `al-conductor`                    # Plan → Implement → Review → Commit
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
---

**Environment Initialization Complete! 🎉**

Your AL development environment is ready for Business Central development with optimized AI assistance.
