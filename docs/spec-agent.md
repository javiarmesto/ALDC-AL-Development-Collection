# AL Spec Agent

AL Spec Agent turns approved Business Central requirements into technical contracts
before implementation. The `al-spec.create` entrypoint uses this same role.

For MEDIUM/HIGH work: Architect → Spec Agent → human approval → Conductor.
For LOW work: approved requirement → Spec Agent → human approval → Developer.

## Responsibilities

- Preserve approved architectural decisions and the assigned scope.
- Specify objects, data, procedures, events, permissions and acceptance criteria.
- Research ordinary technical questions using the target sources and symbols.
- Return material contradictions to Architect with the affected decision identified.
- Record the instructions and domain skills actually read, so work can resume from
  the current files and approved revisions.

MEDIUM specifications describe complete applicable contracts without AL implementation
bodies. HIGH adds detail where a concrete risk requires it. A verified event declaration
is not proof of execution order, persistence or runtime behavior.

## Review and implementation

Spec Agent writes its assigned `.spec.md`; it does not change AL, manifests,
approved architecture or shared memory. It does not compile, deploy or approve
its own work. A specification stays pending until the user approves its revision.
Conductor receives the approved specification and its remaining verification needs.

Use the [specification template](templates/spec-template.md) for the document
structure and [architecture template](templates/architecture-template.md) for design.
The role contract governs behavior; templates provide the structure.

## Distribution and compatibility

The canonical role is `agents/al-spec-agent.agent.md`. Foundation and the Claude,
Copilot CLI and Codex adapters are generated from the canonical sources. Relative
references are adapted to the installed host layout.

In Copilot Chat, prompt files require a session type that supports them. If the host
does not expose the prompt, use its supported direct custom-agent entrypoint and
verify discovery. Do not infer host loading from file presence. Doctor recognizes
legacy installations and reports a missing role linked by a newer entrypoint.

## Architecture-led specification decomposition

Architect chooses a single specification or bounded units according to capability
and contract boundaries. Each unit has a stable SPEC-ID, unique output path and
explicit ownership. Shared contracts and resource allocations belong to architecture.

| Dependency | Effect |
| --- | --- |
| `generation_depends_on` | Requires a completed, human-approved predecessor contract before the dependent specification can be finalized. |
| `implementation_depends_on` | Constrains implementation order; does not block authoring from stable approved contracts. |

Architect validates dependency references, cycles, resource allocations and authoring
groups. Parallel authoring is eligible only when required contracts are available
and ownership does not conflict. Eligibility does not prove concurrent execution
or authorize parallel implementation; actual host capabilities govern execution.

Each Spec Agent writes only its assigned file and returns conflicts to Architect.
Architect reviews the actual returned revisions together before the user approves
specific specifications. A changed shared contract reopens affected consumers and
review status, while unrelated approved work is preserved. Conductor's planning
and approval responsibilities remain unchanged.
