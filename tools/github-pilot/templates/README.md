# ALDC GitHub pilot — Customer Review with History

This private pilot runs ALDC custom agents through GitHub issues and pull requests.
It uses the exact Directions v18 participant starter. The feature is not implemented
yet. Source hashes, archive URL and ALDC input identity are in `pilot-lock.json` and
`.github/aldc-cloud-lock.json`.

## First task

Open `.github/pilot-tasks/01-architecture.md` as an issue and start it with the
`al-architect` custom agent. Review the architecture PR before authorizing Spec
Agent. Review its specification before authorizing Conductor. Keep each canonical
phase gate; a new issue/session is not approval of artifacts that do not exist yet.

GitHub CLI can start the bounded task:

```sh
gh agent-task create --repo javiarmesto/aldc-github-lab --custom-agent al-architect --from-file .github/pilot-tasks/01-architecture.md
```

Read `.github/ALDC-CLOUD.md` for host bindings and approval/evidence rules. Twelve
profiles are projected from canonical ALDC inputs; complete role contracts are
mandatory reads. `.github/prompts` contains workflow references, not GitHub slash
commands. The original participant README is preserved in `workshop/README.v18.md`.

## Verification and current limits

`python scripts/verify-fixtures.py` validates frozen contracts, manifests, supplied
tests and the generated ALDC payload. The PR workflow uses the base branch's checker
and locks. It also prevents introducing AL code until architecture, specification
and test plan exist in the reviewed base. Existence does not prove human approval;
the agent must verify the linked human approval and exact revision separately.

Copilot setup restores Microsoft AL Development Tools **18.1.43.24897** with the
repo-local .NET tool manifest. This provisions tooling, not symbols or a sandbox.

Before AL compilation, prepare compatible BC28 symbols for App and Test and record
their source/version. The compiler's supported command forwards normal alc flags:

```sh
dotnet tool restore
dotnet tool run al -- compile /project:App /packagecachepath:App/.alpackages /out:.artifacts/Directions.app
```

Create `.artifacts` first. After implementing the fixed API, activate the supplied
acceptance sources using `tools/Enable-AcceptanceTests.ps1`, compile App, make the
current App package available to Test, then compile Test. Record the actual commands.
AL runtime execution still needs an explicitly selected sandbox/company and a real
runner. The original native route is documented in `test-execution.md`; it is not
an unattended GitHub runner. Never count compilation, test discovery or control-only
execution as sixteen functional tests passing. A14 remains a human UI check.

BCQuality is explicitly disabled in the initial cloud configuration; use the full
native A–G review and report the fallback. Enabling the provider requires a reviewed,
pinned, observable configuration. A declared MCP or skill is not execution evidence.

## Fixed learning case

Read `contract.md`, `api-contract.md`, `A14-CHECKLIST.md` and the original supplied
fixtures. Keep App target **28.0.0.0**, runtime **16.0**, namespace
`Directions.FollowUp` and original object IDs. Do not change the tests to fit an
implementation. Retain the original authors and license scope.
