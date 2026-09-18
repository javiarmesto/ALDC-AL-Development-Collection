---
agent: AL Spec Agent
description: 'Create or revise the canonical AL technical specification through AL Spec Agent, preserving approved architecture and human approval.'
tools: [vscode/askQuestions, vscode/toolSearch, read/readFile, read/skill, edit/createFile, edit/editFiles, search, 'al-symbols-mcp/*', 'microsoft-learn/*', 'upstash/context7/*', ms-dynamics-smb.al/al_symbolsearch, ms-dynamics-smb.al/al_symbolrelations, todo]
---

# AL specification entrypoint

Use `al-spec-agent` for `${input:req_name}` (complexity `${input:Complexity}`).
Read and follow [the canonical specification contract](../agents/al-spec-agent.agent.md)
in full before authoring. This entrypoint does not define another specification
workflow. Resolve the role link from this installed prompt's directory.

Pass the approved requirement/architecture, current spec path if revising, and
any Architect-assigned scope. If this host cannot route to the named custom agent,
read that same role contract in the current session and state the routing limit;
do not claim another agent executed. Preserve the role's write scope and approval
gate. For single-spec the output remains `.github/plans/{req_name}/{req_name}.spec.md`.
For multi-spec pass one assigned SPEC-ID, its exact output path from the approved
architecture, architecture revision and required approved predecessor contracts.
Do not change the root requirement name to the unit slug or write an aggregate
spec. Follow approved authoring groups and preserve both dependency types. Return
the assigned spec for current joint consistency review and human approval.
