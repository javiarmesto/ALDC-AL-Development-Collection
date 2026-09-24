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

# AL specification entrypoint

Use `al-spec-agent` with the requirement, complexity and scope in `the current request`.
Read and follow [the canonical specification contract](.agents/skills/aldc/references/agents/al-spec-agent.md)
in full before authoring. This entrypoint does not define another specification
workflow. Resolve the role link from this installed prompt's directory.

Pass the approved requirement/architecture, current spec path if revising, and
any Architect-assigned scope. If this host cannot route to the named custom agent,
read that same role contract in the current session and state the routing limit;
do not claim another agent executed. Preserve the role's write scope and approval
gate. For single-spec the output remains `.agents/plans/{req_name}/{req_name}.spec.md`.
For multi-spec pass one assigned SPEC-ID, its exact output path from the approved
architecture, architecture revision and required approved predecessor contracts.
Do not change the root requirement name to the unit slug or write an aggregate
spec. Follow approved authoring groups and preserve both dependency types. Return
the assigned spec for current joint consistency review and human approval.
