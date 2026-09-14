# Canonical Spec Agent

`al-spec-agent` owns technical specification. `al-spec.create` (Chat) and
`al-spec-create` (terminal workflow) load that same role contract. For MEDIUM/HIGH:
approved architecture → Spec → human-approved `.spec.md` → Conductor. LOW can use
an approved requirement without an architecture phase when no design decision is
needed, then hand the approved spec to Developer.

The role defines object/data/procedure/event contracts, acceptance and pending
verification. MEDIUM contains complete applicable contracts without implementation
bodies. HIGH adds detail only for a concrete risk. Spec researches ordinary missing
signatures itself and returns only material contradictions to Architect. A known
event signature cannot prove order, persistence or side effects. No AL edits,
dependency setup, builds, tests, self-approval or pre-code BCQuality execution.

Applicable instruction bodies and domain guides are loaded selectively. The spec
records their actual paths so resumed work can reload them. The template is a
section scaffold, not a second behavior contract. Existing plans and approvals are
preserved; material revisions require approval of the changed contract.

## Sources and distribution

| Source | Destination / transformation |
| --- | --- |
| Lab `b2ce9d9f137fc92574261317294ca2d585beb74b`, `.github/agents/al-spec-agent.agent.md` | Adapt responsibility, depth, claim boundaries, selective instruction/skill loading and approval into `agents/al-spec-agent.agent.md` |
| Root Spec Agent + `prompts/al-spec.create.prompt.md` | `sync-plugin-support.js` generates the Claude role/entrypoint; only host metadata, terminal guidance and paths differ |
| Existing Claude projection | Existing CLI and Codex generators produce terminal roles and commands; Codex inherits host model/permissions |
| Claude role → `.claude/` workspace | Existing mirror generator adjusts Spec rule/template links to `.claude/rules/` and root `docs/templates/`; no contract rewrite |
| Root sources + `docs/templates/` | Foundation staging now includes the templates referenced by its roles; external VSIX rebuild remains a separate task |
| Root `docs/templates/spec-template.md` | Installed Chat and all terminal payloads receive the same contract scaffold |

The donor's Evidence/Context pairs, fingerprints, transport validators, DAG,
parallel authoring gates and blanket provider requirements are excluded. The
donor's automatic return of every incomplete architectural signature is replaced
by Spec-owned research and material contradiction routing. No donor model upgrade
or terminal/rename permission is imported.

Doctor remains compatible with old entrypoints without this role. When a new
entrypoint links Spec Agent, a missing role is an incomplete installation. It
reports file presence separately from unobserved loading.

## Verification performed

- `node scripts/test-spec-contract.js`: actual entrypoint/role resolution, loaded
  file references available in each payload, explicit non-execution grants and
  manual handoff metadata. This is artifact validation, not a model behavior test.
- `python3 -B scripts/test-doctor.py`: old/new installation distinction plus the
  existing project/profile fixtures, real Chat installs and Codex bootstrap.
- Existing profile/CLI tests, recovery suite, Foundation/Claude synchronization,
  Codex TOML parser, skill validator and offline extracted npm archive validation.

No usable VS Code, Claude, Copilot CLI or Codex host was available for a real
invocation in this workspace. AL compilation and BC runtime were not executed.
Do not interpret readable files or static checks as instructions actually loaded
by a model, an approved spec or verified functional behavior.

## VS Code prompt compatibility boundary

The [current VS Code prompt-file documentation](https://code.visualstudio.com/docs/agent-customization/prompt-files)
confirms custom agent names in the `agent` field and relative Markdown file links.
It also distinguishes the Local agent, which still loads prompt files, from
Agent Host sessions, which do not load them. The Chat entrypoint in this delivery
is for the existing Local prompt surface. A real Agent Host check must use direct
role discovery or an explicitly scoped prompt-to-skill adaptation; no compatibility
with that session type is inferred from the Local prompt. Record the session type
and VS Code version in the acceptance run. No model override is set on the new
entrypoint; actual host model selection is part of the run record.

## Bounded host acceptance still to execute

Use a separate AL fixture with a confirmed target version, unchanged base/model
and host limits. Business case: require an external reference when releasing a
sales order if the customer has the corresponding option enabled.

Have Architect define two bounded specs: policy administration (option, customer
experience and data contract) and release enforcement (business rule and acceptance).
Prefer a stable shared contract in the approved architecture when the available
sources support it. Both specs can then share one authoring group even though
release implementation depends on the policy capability. If a material technical
contract genuinely needs the first spec's output, declare a generation dependency
and wait instead; never assert parallel eligibility to satisfy the test design.

The architecture owns stable SPEC-IDs, unique .spec.md paths, both dependency types,
shared resource allocations and the justification for each group. Its section 14
also records joint consistency review of actual returned revisions. No DAG runtime,
JSON companions or scheduler is required. Do not assume a standard event or signature.
Supply genuinely approved requirement/architecture inputs, never fabricate approval.

Run once through the specification entrypoint and once through direct Spec Agent
from identical isolated fixture copies. Confirm the full role, matching AL rules,
domain guides and template were loaded. Compare behavior against these criteria:

| Check | Expected observation |
| --- | --- |
| Option off | Existing release behavior preserved |
| Option on, empty reference | Release prevented with a clear message |
| Option on, reference present | Release permitted |
| Unknown target event | Spec investigates; unverified facts remain explicit and are not declared implementation-ready |
| Definition known, persistence unknown | Separate behavioral proof obligation; no inference from signature |
| Corrected contract after resume | Governing paths reloaded; unchanged approved scope preserved; changed material decision presented for approval |
| Eligible parallel group | Two actual separate sessions author distinct assigned spec files using the same approved architecture/shared contracts; record overlap or mark parallel execution untested |
| Generation prerequisite missing | In a separately approved variant, the dependent spec reports the missing/unapproved contract and does not finalize; unaffected work continues |
| Implementation-only dependency | Does not block authoring from stable approved contracts; remains in downstream handoff |
| Shared resource collision | Report to Architect without modifying shared files, allocating conflicting IDs or inventing a semantic dependency |
| Joint consistency | Architect compares actual spec revisions, reports mismatches and affected consumers; approval of one spec does not approve the other |
| Human approval | Selected increment reaches Conductor only with current approved specs and applicable current joint consistency review |
| Write scope | Only assigned `.spec.md` changes; AL/app.json/architecture/memory untouched |

Record host/model, input versions, actual source loading, prompts/interventions,
elapsed time and token counters where the host supplies them. These business
outcomes are specification acceptance criteria here, not executed BC test results.
An actual material contradiction returns only the affected decision to Architect.
Do not open a loop-rewrite increment unless this run exposes concrete friction.

## Recovered decomposition provenance and boundary

The follow-up recovers the Architect/Spec decomposition behavior from Lab
`b2ce9d9f137fc92574261317294ca2d585beb74b`: `.github/agents/al-architect.agent.md`,
`.github/agents/al-spec-agent.agent.md` and the relevant sections of
`.github/contracts/context/spec-decomposition-contract.md` (unit ownership, two
dependency types, necessary-edge test, shared-resource coordination and authoring
groups). The common rules live in section 14 of the existing architecture template;
Spec records only its consumed contracts and resource needs in the existing spec.

Excluded donor behavior: Context/Evidence pairs, machine handoff metadata, runtime
validators, automatic wave scheduling, changed planning/final gates and global
provider requirements. Legacy approved single/decomposed specs preserve their paths
and agreed order; concurrency is not retroactively inferred. Architecture/Spec
frontmatter keeps its existing models/tools, apart from manual role handoff text.
Conductor is unchanged. Static artifact checks cannot establish parallel execution.
