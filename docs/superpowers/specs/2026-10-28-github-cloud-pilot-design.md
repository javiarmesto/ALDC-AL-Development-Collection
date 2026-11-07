# ALDC GitHub cloud pilot

The first pilot turns the Directions Customer Review with History v18 starter into a private GitHub repository. GitHub Copilot custom agents consume ALDC's canonical role contracts through a dedicated cloud projection. The user authorized execution after selecting this case and the native GitHub route.

## Scope and decisions

- Preserve the original v18 business contract, API, App/Test manifests and supplied test sources byte-for-byte; record the archive URL and SHA-256.
- Generate cloud profiles from canonical ALDC sources, never from another host's generated output. Profiles target `github-copilot`, use cloud aliases and stay below 30,000 characters. Long contracts are mandatory reference reads.
- Keep specialists' role permissions, independent review, English plan artifacts and human approval gates. GitHub handoffs become explicit task handbacks; no editor API, invented skill invocation or nested CLI substitutes.
- Begin with an architecture PR. A human approves architecture before specification, and the current specification before implementation. A task assignment does not approve artifacts that do not exist yet.
- Prepare deterministic structural/fixture checks and a pinned headless AL toolchain. Symbol acquisition and actual BC test execution require a configured sandbox/runner; absent operations remain pending and cannot count as passing tests.
- Create the isolated private pilot repository and its first issue. Start a bounded architecture task if GitHub permits it. Keep ALDC changes reviewable in a separate draft PR.

## Approaches

Native Copilot custom agents were recommended and accepted for the pilot because GitHub already owns issue-to-PR sessions. Actions invoking a CLI would need an additional authentication/orchestration layer. A standalone GitHub App is deferred until a concrete need exceeds the native route.

## Acceptance

The projector is deterministic, refuses unsafe/colliding destinations without partial writes, includes every referenced canonical role/resource and retains source hashes. The preparation command verifies the exact v18 archive before extraction, rejects traversal/symlinks/duplicate paths, and creates a fixture lock independent of feature implementation. Tests exercise these failure modes. The pilot's first CI run and agent session are reported with observed URLs and outcomes, distinguishing structural checks, AL compilation, runtime tests and manual A14.
