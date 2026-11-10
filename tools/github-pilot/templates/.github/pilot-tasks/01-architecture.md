# Design Customer Review with History from the fixed Directions v18 contracts

Use the ALDC al-architect custom agent. This task authorizes architecture work only.
Read .github/ALDC-CLOUD.md, .github/agent-contracts/al-architect.md, contract.md,
api-contract.md, pilot-lock.json and .github/plans/memory.md before acting.

The user selected this lab as the first GitHub-native ALDC pilot. Treat the supplied
business and API contract as fixed requirements; retain BC28/runtime16 and original
test sources. App starts without feature code. Sixteen functional methods plus one
control are supplied; A14 remains manual.

Create .github/plans/customer-review/customer-review.architecture.md in English.
Cover object boundaries, fixed API, persisted Customer reload, duplicate-before-older
validation, one transaction without Commit, UI read-only behavior, permissions,
test mapping A01–A16 and source/evidence limits. Examine the rollback test helpers.
Identify symbol facts that cannot yet be verified. Do not invent publishers, event
signatures, compiler/test results, BCQuality invocation or human approvals.

Record pending symbols, sandbox/company and runtime runner requirements separately
from design decisions. Request only information that changes this architecture.
Do useful design work while an environment prerequisite is unavailable.

Open a draft PR linked to this issue, with a human review checklist and a bounded
next-step handoff. Update memory with actual observations. Stop for architecture
approval before specification. Do not write AL implementation, activate/change
acceptance tests, change App/Test manifests, approve artifacts, merge or deploy.

Acceptance:
- [ ] The architecture references the frozen v18 requirements and API.
- [ ] Duplicate, older-date and atomic rollback behavior are explicit.
- [ ] Original App/Test manifests and supplied tests remain byte-identical.
- [ ] The PR distinguishes structural integrity, AL compilation, BC runtime and A14.
- [ ] No future approval or tool execution is claimed.
- [ ] The PR ends at the human architecture gate.
