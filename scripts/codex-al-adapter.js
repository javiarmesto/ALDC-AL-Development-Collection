'use strict';

// Codex owns this vocabulary. Do not consume another surface's generated package.
const QUERIES = ['al_symbolsearch', 'al_getdiagnostics', 'al_getpackagedependencies'];
const IMPLEMENTATION = ['al_compile', 'al_build', 'al_downloadsymbols'];
function alPolicyFor(role) {
  return {
    queries: role !== 'al-conductor' ? QUERIES : [],
    implementation: ['al-developer', 'al-implement-subagent'].includes(role) ? IMPLEMENTATION : [],
    capture: role === 'al-triage',
  };
}
function roleTooling(role) {
  const policy = alPolicyFor(role);
  const preparation = policy.queries.length
    ? 'Project preparation is separate from queries: only with explicit user authorization (including authorization carried by the delegation), an already exposed al_addproject tool and a confirmed existing App/Test folder containing app.json, register that exact folder in this agent\'s own live MCP connection. Inspect the actual schema. On a no-projects-loaded response, allow one authorized registration and one query retry in the same connection; otherwise report the blocker. Do not infer prepared state from the parent or another alias. Do not change filters, credentials or files, scaffold, download symbols, compile or publish as a preparation fallback.'
    : 'Conductor delegates project preparation with the exact App/Test path and any existing user authorization; it does not invoke al_addproject itself. Parent preparation does not prove that a child connection is prepared.';
  return `\n## Codex AL tooling scope\n\nRead .agents/skills/aldc/references/al-tooling.md before AL tool selection.\nThis is a behavioral role contract, not an MCP allowlist. Reading this role\nas a skill does not load its TOML profile or change the session's permissions.\n${policy.queries.length ? `Official AL MCP query operations: ${policy.queries.join(', ')}.` : 'Conductor delegates AL queries and execution; it does not perform them itself.'}\n${preparation}\n${policy.implementation.length ? `With an authorized project: ${policy.implementation.join(', ')}. Compilation is not a test run.` : 'Do not invoke official AL MCP compile, build or symbol-download operations; request implementation evidence from Developer/Implementer.'}\n${policy.capture ? 'Triage may use the dedicated optional profiling/snapshot proxies after target, identity and capture window are authorized. Discover actual tool schemas; stop and collect owned captures and report cleanup state. Snapshot collection does not establish debugger playback.' : 'Do not start profiling/snapshot captures; consume supplied evidence or hand a capture request to Triage/the human.'}\nNo role gains publication, authentication or credential-reset authority from this\npackage. Inspect actual MCP aliases, filters and inherited tools; the filesystem\nsandbox does not constrain remote MCP effects. If role isolation cannot be\nestablished, use a separately configured bounded session and return evidence.\nAL LSP for Agents speaks LSP, not MCP. Its native Codex route remains unresolved;\nuse existing symbol MCP/source evidence and label the fallback accurately.\n\n`;
}

function translateHost(text) {
  text = text
    .replace(/`al_debug` \/ `al_setbreakpoint` \/ `al_snapshotdebugging`/g, 'supplied debugger evidence or an authorized Triage capture')
    .replace(/`al_get_diagnostics` \+ `bclsp_codeQualityDiagnostics`/g, 'the discovered AL MCP diagnostics query')
    .replace(/`bclsp_findReferences` \/ `bclsp_incomingCalls` \/ `bclsp_prepareCallHierarchy`/g, 'available reference/call evidence (record missing semantic coverage)')
    .replace(/## Tool surface \(authoritative[^\n]*\)[\s\S]*?(?=## CAN \/ CANNOT)/,
      '## Tool surface (Codex)\n\nUse only the file, shell, delegation and MCP capabilities actually exposed in\nthis session and permitted by the role. Read .agents/skills/aldc/references/al-tooling.md\nfor AL operations, optional capture and the unresolved native LSP route.\nInspect schemas and the selected App/Test paths; no editor command is implied.\n\n')
    .replace(/\*\*CAN:\*\* create\/edit AL objects[^\n]+/,
      '**CAN:** create/edit AL objects and extensions; implement events, API/integration code, refactor and fix bugs; compile through authorized official AL MCP or a verified project runner; query available symbols and diagnostics; run actual approved tests. Interpret supplied runtime evidence and request captures through Triage/the human. Native AL LSP integration remains unverified.')
    .replace(/4\. \*\*Build & validate\*\*[^\n]+/,
      '4. **Build & validate** — use authorized official AL MCP or the verified project runner; inspect diagnostics, fix and rebuild. Run approved tests with a real runner; fix failures and retest. Stuck after 3 build attempts → pause. For runtime bugs load `skill-debug` and request evidence through Triage/the human; for slow code apply performance rules and `skill-performance`. Keep unexecuted checks explicit.');
  return text
    .replace(/@(?:al-[a-z-]+|dredd)\b/g, s => s.slice(1))
    .replace(/@AL Architecture & Design Specialist/g, 'al-architect')
    .replace(/@AL Implementation Specialist/g, 'al-developer')
    .replace(/@AL Development Conductor/g, 'al-conductor')
    .replace(/@workspace\s+(?:use\s+)?/g, '')
    .replace(/#?runSubagent\b|\bTask tool\b|\bAgent tool\b/g, 'the available native subagent tool')
    .replace(/`(changes|search|edit)`(?= tool| -| —)/g, 'the available $1 capability')
    .replace(/#(?:todos|todo)\b/g, 'plan progress tracking')
    .replace(/#?(?:vscode\/)?askQuestions\b|\bAskUserQuestion\b/g, 'the available question mechanism (or return questions to the caller)')
    .replace(/#usages\b|`usages` tool/g, 'available reference evidence (identify symbol/source fallback)')
    .replace(/#(?:search|codebase)\b/g, 'source search')
    .replace(/#(?:problems|testFailure)\b|\bread\/problems\b/g, 'recorded compiler/test diagnostics')
    .replace(/#changes\b|\bsearch\/changes\b/g, 'the actual git diff or supplied diff')
    .replace(/#githubRepo\b/g, 'available repository files/history')
    .replace(/#?ms-dynamics-smb\.al\/al_get_package_dependencies\b|@?al_get_package_dependencies\b/g, 'the discovered AL MCP dependency query or manifest inspection')
    .replace(/#?ms-dynamics-smb\.al\/al_download_source\b/g, 'available source/symbol inspection')
    .replace(/\bal_get_diagnostics\b|\bbclsp_codeQualityDiagnostics\b/g, 'the discovered AL MCP diagnostics query (not proof of fresh compilation)')
    .replace(/\bal_downloadsymbols\b|\bal_download_symbols\b/g, 'authorized symbol restore through Developer/Implementer')
    .replace(/\bal_download_source\b/g, 'available source/symbol inspection')
    .replace(/\bal_build\b|\bal_package\b|\bal_full_package\b/g, 'authorized build/package through Developer/Implementer')
    .replace(/\bal_publish\b|\bal_incremental_publish\b|\bal_publish_existing_extension\b/g, 'a verified deployment runner with separate human authorization')
    .replace(/\bal_new_project\b|\bal_go\b|\bal_generate_manifest\b/g, 'reviewed project scaffolding through file tools')
    .replace(/\bal_clear_credentials_cache\b/g, 'human credential recovery for the actual provider')
    .replace(/\bal_generatepermissionset\b/g, 'reviewed permission-set authoring')
    .replace(/\bal_symbolsearch\b|\bal_symbolrelations\b/g, 'the discovered symbol query (inspect its supported operations)')
    .replace(/\bal_snapshotdebugging\b/g, 'optional snapshot capture through Triage/the human')
    .replace(/\bal_debug\b|\bal_setbreakpoint\b/g, 'human/editor debugging or supplied runtime evidence')
    .replace(/\bbclsp_\w+\b/g, 'available symbol/source evidence (native LSP route unverified)')
    .replace(/\brunInTerminal\b|`execute`/g, 'the available authorized shell')
    .replace(/\b(?:al-symbols-mcp|upstash\/context7|microsoft-learn)\/\*|\bmcp_(?:github|microsoft_doc|context7|upstash_conte)\/\*|\bmcp_github\/(?:search_repositories|search_code)|\bal-symbols-mcp\/al_search_objects/g, 'the discovered provider tool')
    .replace(/\b(?:web\/)?githubTextSearch\b/g, 'authorized repository search')
    .replace(/\bvscode\/memory\b/g, 'project plan artifacts')
    .replace(/\bvscode\/\*/g, 'editor-only API (not a Codex grant)')
    .replace(/\$\{input:([^}]+)\}/g, '<$1 supplied in the request>')
    .replace(/\$ARGUMENTS\b/g, 'the current request');
}
module.exports = { alPolicyFor, roleTooling, translateHost };
