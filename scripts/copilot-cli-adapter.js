'use strict';

// Copilot CLI host vocabulary. Kept separate from canonical role contracts and
// Claude's mapping table: a tool alias in frontmatter is not a callable tool.
const HOST_PREFACE = `

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
> Record missing capabilities and unexecuted checks explicitly; never simulate.

`;

function translateHost(text) {
  text = text
    .replace(/\*\*CAN:\*\* create\/edit AL objects[^\n]+/,
      '**CAN:** create/edit AL extension objects; compile, download symbols and run tests through verified project commands when authorized; inspect loaded symbol MCP tools and actual diagnostics; refactor, fix bugs and implement API/integration code. Interpret supplied debugger/profiler evidence; editor debugging and AL LSP navigation are unavailable here.')
    .replace(/4\. \*\*Build & validate\*\*[^\n]+/,
      '4. **Build & validate** — use the verified terminal build command and its actual diagnostics. Fix and rebuild until clean. Run tests when available and approved; fix failures and retest. Stuck after 3 build attempts → pause. For runtime bugs load `skill-debug` and interpret supplied evidence; request a human debugger capture when needed. For slow code apply `al-performance.instructions.md` and load `skill-performance`. Missing compiler/test/debug runners stay unverified.')
    .replace(/; navigate via AL LSP/g, '; inspect available symbols or text references');
  // This section is exclusively a host tool declaration, not a role workflow.
  text = text.replace(/## Tool surface \(authoritative[^\n]*\)[\s\S]*?(?=## CAN \/ CANNOT)/,
    `## Tool surface (Copilot CLI)\n\nUse the granted file/search/shell tools and the actually loaded al-symbols-mcp,\ncontext7 and microsoft-docs tools. Inspect their current schemas before calling.\nCompile, symbol download, tests and publishing require a verified terminal command\nfor this project and the canonical authorization. No editor debugging or semantic\nAL LSP tool is bundled. Missing runners or tools are unavailable, never inferred.\n\n`);
  return text
    .replace(/@(?:al-[a-z-]+|dredd)\b/g, s => s.slice(1))
    .replace(/@AL Architecture & Design Specialist/g, 'al-architect')
    .replace(/@AL Implementation Specialist/g, 'al-developer')
    .replace(/@AL Development Conductor/g, 'al-conductor')
    .replace(/@workspace\s+/g, '')
    .replace(/#?runSubagent\b|\bTask tool\b|\bAgent tool\b/g, 'task')
    .replace(/`(?:Task|Agent|agent)`/g, '`task`')
    .replace(/#(?:todos|todo)\b/g, 'plan progress tracking')
    .replace(/#?(?:vscode\/)?askQuestions\b|\bAskUserQuestion\b/g, 'ask_user (or return questions to the caller)')
    .replace(/#(?:search|codebase|usages)\b/g, 'glob/grep text search (not semantic AL navigation)')
    .replace(/#(?:problems|testFailure)\b|\bread\/problems\b/g, 'actual compiler/test output (unverified until run)')
    .replace(/#changes\b|\bsearch\/changes\b/g, 'git diff through an available shell (or a supplied diff)')
    .replace(/#githubRepo\b/g, 'repository files/history through available read tools')
    .replace(/#?ms-dynamics-smb\.al\/al_get_package_dependencies\b/g, 'verified manifest/symbol dependency inspection')
    .replace(/@?al_get_package_dependencies\b/g, 'verified manifest/symbol dependency inspection')
    .replace(/#?ms-dynamics-smb\.al\/al_download_source\b/g, 'available source or loaded symbol MCP inspection')
    .replace(/\bal_get_diagnostics\b|\bbclsp_codeQualityDiagnostics\b/g, 'actual compiler diagnostics (only after execution)')
    .replace(/\bal_downloadsymbols\b/g, 'verified terminal symbol-download command (if available)')
    .replace(/\bal_download_symbols\b|\bal_download_source\b/g, 'verified terminal symbol/source-download command (if available)')
    .replace(/\bal_build\b|\bal_package\b|\bal_full_package\b/g, 'verified project build/package command (if available)')
    .replace(/\bal_publish\b|\bal_incremental_publish\b|\bal_publish_existing_extension\b/g, 'verified deployment command (requires authorization and an available runner)')
    .replace(/\bal_new_project\b|\bal_go\b|\bal_generate_manifest\b/g, 'reviewed project scaffolding through file tools')
    .replace(/\bal_clear_credentials_cache\b/g, 'the documented credential recovery procedure for the actual runner (human action)')
    .replace(/\bal_generatepermissionset\b/g, 'reviewed permission-set authoring through file tools')
    .replace(/\bal_symbolsearch\b|\bal_symbolrelations\b/g, 'loaded symbol MCP query (if available)')
    .replace(/\bal_debug\b|\bal_setbreakpoint\b|\bal_snapshotdebugging\b|\bbclsp_\w+\b/g, 'editor-only capability (unavailable in CLI)')
    .replace(/\brunInTerminal\b/g, 'bash/powershell')
    .replace(/`execute`/g, '`bash/powershell`')
    .replace(/`usages` tool/g, 'available text search (not semantic references)')
    .replace(/\bupstash\/context7\//g, 'context7/')
    .replace(/\bmicrosoft-learn\//g, 'microsoft-docs/')
    .replace(/\bweb\/githubTextSearch\b/g, 'available repository search')
    .replace(/\bvscode\/memory\b/g, 'project plan artifacts')
    .replace(/\bvscode\/\*/g, 'unavailable editor API')
    .replace(/\$\{CLAUDE_PROJECT_DIR\}/g, '<project directory>');
}

module.exports = { HOST_PREFACE, translateHost };
