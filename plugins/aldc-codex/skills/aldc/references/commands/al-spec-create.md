## Codex host contract

Resolve .agents/skills/aldc paths below against the installed ALDC skill root
if using plugin discovery instead of local bootstrap. Workflow names below are
reference files in commands/, not automatically registered slash commands.
Packaged domain entrypoints named SKILL.md in the source are stored as GUIDE.md
under references/skills/. This alias applies only when reading packaged guidance;
new discoverable skills must still be created with SKILL.md.

Use only tools actually exposed by this session. Model, reasoning, sandbox and
approval settings inherit from the parent; this profile grants no extra tools.
Role write scopes below are behavioral, not filesystem sandboxes. Discover MCP
providers before using their examples; none are installed by this package.
If delegation is unavailable, report that the affected independent review or
Conductor workflow is pending; do not certify self-review as independent review.

# AL specification entrypoint

Use `al-spec-agent` with the requirement, complexity and scope supplied in the current request.
Read and follow [the canonical specification contract](.agents/skills/aldc/references/agents/al-spec-agent.md)
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
