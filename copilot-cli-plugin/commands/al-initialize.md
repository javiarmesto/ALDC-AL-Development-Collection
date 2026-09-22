---
description: Initialize AL development environment and workspace for Business Central. ALDC workflow (Copilot prompt al-initialize); invoke explicitly.
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


# AL Environment Initialization

Your goal is to initialize the AL development environment and workspace for `<ProjectName from $ARGUMENTS>`.

This workflow configures Copilot CLI and the approved AL project. Bootstrap alone adds no AL sources or manifest; project scaffolding below requires its own approved scope.

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
- **Copilot CLI:** run the explicitly invoked Initialize workflow in a setup
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

## Phase 0: ALDC instructions (Copilot CLI)

Locate the installed plugin root through the plugin list. Run its scripts/init.js
with Node 20+ and --project <directory> to preview project changes. After reviewing
the plan, repeat with --apply. Existing customized rules remain visible collisions;
use --force only for reviewed replacement, with a recoverable backup. This adds a
managed AGENTS.md block, preserving
surrounding project instructions and .github/plans/memory.md. Use --verify for
receipt drift and --rollback to restore the preceding initialization. Neither
operation installs software or configures MCP servers. Discover command labels in
the installed CLI. Confirm instruction loading and the human review gate.

## Phase 1: Copilot CLI environment

Verify copilot --version, authentication, plugin installation and the actual
/agent, /skills list and /mcp catalogs in a new session. Node 20+ is required by
the bootstrap. Inspect the project's AL compiler, symbol-download and test
commands; record missing operations as unavailable. No Copilot Chat extension
is required. Do not install software or change credentials automatically.

## Phase 2: Project Initialization

### Choose Project Type

**For New Projects:**
```
reviewed project scaffolding through file tools
```

**For Existing Folders:**
```
reviewed project scaffolding through file tools
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
verified terminal symbol/source-download command (if available)
```

Verify all base application dependencies are available.

### Generate Manifest

Create manifest file:
```
reviewed project scaffolding through file tools
```

**Human Review:** Validate manifest contents before proceeding.

## Phase 3: Runtime configuration

Review target environment, authentication and credential handling with the
human before writing runtime configuration or deploying. Use the existing
terminal/CI runner's configuration. Editor launch.json is optional, only when
explicitly requested for editor debugging; it does not configure this CLI.

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
.unavailable editor API.log

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

Inspect loaded project instructions and the selected plugin source. Verify
Doctor readiness and run only the approved available build/test commands.
Distinguish configured, loaded, invoked and result-verified. A successful
bootstrap or compiler run does not certify agents or Business Central runtime.

## Troubleshooting

For authentication, use the host's /login flow. For missing symbols, inspect
the configured terminal runner and actual app.json dependencies. For missing
roles or outdated behavior, check first-found-wins collisions, reinstall the
local plugin or update the marketplace plugin, and restart the session. Never
clear credentials or reinstall software automatically.

## Success Criteria

Report observed CLI version, selected sources, instruction loading, symbol
availability and actual build/test results. List every unverified operation.

## Next Steps

Once your environment is initialized:

**For Development:**
```
al-developer                    # Implement features (loads page/event skills on demand)
/al-build          # Build and deploy
```

**For Architecture:**
```
al-architect                    # Design solutions
```

**For TDD Orchestration:**
```
al-conductor                    # Plan → Implement → Review → Commit
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

**Report initialization results and remaining unavailable operations.**
