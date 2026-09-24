# Initialize: bounded preparation of the official AL MCP workspace

Date: 2026-09-22. Canonical base: e21fbf6185ebbcdeed590a2e52022541c11c5cbf.

## Problem and change

An existing App can be visible in the editor while the official AL MCP reports
no projects loaded. Asking Architect to continue then produces repeated setup
handoffs. Initialize now has an explicit **MCP workspace preparation only** mode:
resolve the authorized existing App/Test, probe its dependencies, register only
when the response establishes it is unloaded, and verify once on the same live
connection. Stop before plugin bootstrap and full environment setup.

Invoke the surface's Initialize workflow with this request:

> Prepare only the existing App at <absolute App path> for the current official
> AL MCP connection. Check whether it is loaded; if needed, register that existing
> folder and verify its package dependencies. Do not bootstrap, change files,
> restore symbols, compile or publish. Return the preparation result table.

App and Test are separate targets. A missing provider/tool is unavailable, not
permission to install it or broaden host filters. Initialize's optional Chat
selectors use alias `al`; terminal workflows consume already exposed tools in an
authorized setup context and do not confer additional role permissions.

No-projects-loaded/target-not-loaded permits at most one registration and one
verification retry. Other errors do not trigger retries. Previously loaded App
skips registration. Probe/registration/verification failures retain their precise
status; no successful build or LSP access is inferred.

## Connection boundary and existing surface PRs

This is one cross-surface source change, not an integration of #112–#115. Its
source is `prompts/al-initialize.prompt.md`; existing generators propagate it to
foundation, Claude, CLI, Codex and the Claude workspace mirror. Specialist source
files, Doctor, installers and provider configurations are unchanged.

The Codex follow-up in #114 observed a parent/child workspace-state difference.
Initialize readiness is valid only on its executing live connection. This PR
preserves the possibility of the surface's already-authorized, bounded recovery
inside the actual child connection; it does not reset that policy to parent-only
setup and adds no grants to specialist roles.

When combining with the surface PRs, regenerate their derived outputs from the
combined sources; do not restore older generated plugin files from either side.
Reconcile surface-guide scope tables and assertions that Initialize has no
registration grant: the new optional Chat grant is confined to Initialize.
Keep the distinction between command/skill instructions and effective host
permissions. No whole-server wildcard or server registration is introduced.

## Validation

- Full `npm test` passed before the final addition of two optional query selectors
  to retain #115's deterministic query ordering. Its final Node suite: 61 tests,
  59 passed, 2 skipped; earlier validation stages also passed.
- Final selector set: rerun native-profile and CLI packaging checks plus generator
  checks (see PR validation summary for final result).
- Canonical conformance: 60 passed. Foundation: 87 matching files; Claude mirror:
  72 matching files before the final selector-only regeneration.
- Added 39 assertions inside the existing native-profile suite covering exact
  registration/verification grants, no AL wildcard, preservation of the bounded
  mode before injected Phase 0 in all distributions, and no new specialist grants.
- Disposable integration checks applied the source/test delta, regenerated and
  ran the native-profile suite against #112 8d5b549, #113 a6792a0 and #114 53848cb:
  270 checks each, all passed. These used the initial dependency-only query grant;
  terminal bodies are unaffected by the final Chat query-selector ordering fix.
- #115 4d57c4e: final selector set passed 319 native/installer checks and all 46
  Chat-projection cases. The initial order-sensitive test failure was resolved by
  retaining the same explicit query order; no wildcard or weaker assertion.

These checks establish packaging, projection and instruction-contract properties,
not live model execution or protocol idempotence. Runtime acceptance still needs
one already-loaded and one unloaded App per host, missing/unavailable provider,
registration failure, reconnect/child state, and requested Test preparation.
Retain actual call/result traces. There is no ALTool/BC runtime execution here.

No PR merge, version bump, release, VSIX build, marketplace publication or change
to the owner's installed project is part of this delivery.

## Capability contract and PR integration plan (2026-09-23)

ALDC defines roles, sources, decisions, review and human gates. Provider names are
surface bindings, not product-wide prerequisites. An optional selector in a role
declares an allowed tool; only the executing host can establish discovery, a
successful call and its result. Check a capability when a task needs it, in the
role's live connection, and retain the exact project/version and response. Recheck
after a connection, role or relevant project change; do not turn a Doctor report
or a parent's successful call into child readiness.

| Stage | Minimum evidence for the claim | Missing capability |
| --- | --- | --- |
| Design / architecture | Requirements, project sources and relevant domain rules | Continue with bounded design; mark exact event/member/version claims pending until target-version source or symbols resolve them. AL LSP and any named symbol MCP are optional routes. |
| Spec | Approved decisions, target project/version and evidence for exact signatures | Record the affected signature as an open question; do not assert or invent it. Do not run BCQuality code review before code exists. |
| Implementation | Authorized App/Test sources, dependencies and an actual compiler result to claim compile success | Continue bounded edits if appropriate; report build unverified and request the compiler/symbols needed for the selected project. No requirement for a particular MCP transport. |
| Code review | Actual diff, native review domains and, when claiming BCQuality coverage, the selected provider's completed domain results | Continue native review on absent/incompatible BCQuality; report the missing provider if configured as expected. Reading a skill or entry is only load evidence. |
| Tests / runtime | An actual runner/environment, executed cases and observed results for a functional PASS | Mark tests not run or blocked; a compile or .app file does not establish functional behavior. |

BCQuality's design/spec read path selects contextual articles and cites decisions.
Its code-review path requires dispatched checks and outcomes. Preserve the existing
`enabled: false/auto/true` behavior and native A-G fallback in the BCQuality
provider contract; never claim BCQuality review from corpus discovery or reading.
Doctor remains read-only and its runtime observations remain caller reports.

Bindings to validate when their surface PR is combined: Chat uses its exact
installed extension tool ID for `bclsp_*`, plus the configured official AL MCP
alias; Claude uses the host `LSP` tool and its actual MCP-prefixed operation IDs;
Copilot CLI uses its native LSP integration and actual `al/<operation>` binding;
Codex has official AL MCP operations but no demonstrated AL LSP route. The same
operation name can have a different schema on a native VS Code tool and on the
standalone MCP server. Inspect the real schema in the executing host. Source,
downloaded symbols or compiler output can support narrower claims, but must not
be labelled as an LSP call.

**For 5.0.1:** keep this PR's bounded preparation mode. Merge #112 (Claude),
#113 (Copilot CLI), #114 (Codex), #115 (Chat) one at a time after each PR's
applicable checks, then #116 (Initialize). Regenerate all affected projections
from combined sources and reconcile the older surface-guide statements that
registration is always a separate human setup step. Preserve Codex's observed
same-connection child recovery and Chat's exact tool selectors. Finally repin
the extension PR #4 to the final canonical commit, package and test install,
update, customizations and rollback. Do not advertise AL LSP as working on
Codex; the route is a separate design decision. An optional LSP can remain
unavailable without blocking unrelated design, but any advertised host-specific
LSP capability needs a real semantic invocation before a PASS claim. BCQuality
design selection and code review have distinct evidence gates.

**After 5.0.1:** first make one common, capability-based contract change in
canonical roles/guidance: replace tool-prescriptive examples with the required
evidence and bounded fallbacks; keep exact provider selectors in each surface
adapter. Then take one focused PR per affected terminal surface to remove Chat
editor setup from full Initialize, correct surface-specific config/validator
paths and redundant package content, and validate generated distribution plus
a disposable install. Preserve useful AL/domain skills. Chat needs a separate
PR only if that common change alters its projector. Keep the original product
scope and human approvals; no new runtime, alternate LSP bridge or automatic
provider install is part of this plan.
