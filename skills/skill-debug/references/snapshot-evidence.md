# Snapshot evidence in a Triage diagnosis

Use this branch only when investigating a snapshot or requesting one. Ordinary
source/log diagnoses do not require a snapshot or this evidence block. The existing
diagnosis, BCQuality consultation and human approval/handoff contracts still apply.

## Four separate milestones

1. **Capture:** retain actual provider/version, target/build, identity, authorized
   window, capture ID, raw result and artifact location. The human owns the scenario
   and reproduction. Confirm MCP availability and required permissions first.
2. **Inspection:** retain the actual readable frames, exception or snappoint and
   relevant variable values. Match app identity/version, source revision and symbols
   to the recording. Record the actual reader and its output; an archive path or a
   successful view command alone does not establish inspected execution state.
3. **Diagnosis:** separate observed facts from causal inferences and cite the
   observation supporting each claim. The human confirms scenario relevance and
   checks the explanation against the expected requirement. Missing state requires
   an explicit uncertainty and the next bounded observation, not a guessed cause.
4. **Validation:** Developer owns the approved correction and regression execution;
   Conductor coordinates and Reviewer independently checks the supplied evidence.
   Retain revision, deployed package, runner and real per-test results separately.
   Triage does not change AL code. A supported diagnosis does not validate a fix.

Native VS Code `al_snapshotdebugging` and the optional ALTool snapshot MCP proxy
have different schemas. Discover them in the selected host. ALTool's workspace
MCP and the Troubleshooting MCP for a paused live debugger are not historical
recording readers. Use a verified decoding/inspection capability or request the
human's debugger evidence. Never invent a reader or infer state from an empty result.
With `snapshotVerbosity=SnapPoint`, observations are bounded to captured snappoints
and exceptions; `Full` is optional for a separately authorized short reproduction.

End and collect owned captures, record cleanup failures and preserve artifacts in
the approved location. Keep customer values out of tracked reports unless explicitly
approved. Capture authorization is separate from diagnosis and publication.

## Machine-readable section in the existing diagnosis

Append exactly one fenced `aldc-triage-evidence` JSON block to the Step 4 report.
Use version 1 and nonempty `incident`, `baseline` (app/revision/symbol identities)
and `target` (environment/build); state unknown identities explicitly and treat
their effect on the conclusion as insufficient. Record human ownership, approval,
relevance confirmation and cleanup in the report prose, with evidence references.

Milestones contain `status` and either `reference` to the observed artifact/result
or `reason` explaining what is pending/unavailable:

| Milestone | Status values | Required detail |
| --- | --- | --- |
| capture | captured, not-captured | reference for captured; reason otherwise |
| inspection | inspected, insufficient | reference for inspected; reason otherwise |
| diagnosis | supported, insufficient | supported claims; reason for insufficient |
| validation | pending, passed, failed, unavailable | result reference for passed/failed; reason otherwise |

Each claim has `statement`, `status` (`supported`, `insufficient`, `not-captured`).
Supported claims require inspected state and an `evidence` array with nonempty
`reference` and `observation` (execution point and relevant value, when captured).
Other claims require `nextObservation`. A supported diagnosis requires all its
claims supported. Keep uncertainty explicit instead of omitting an unresolved claim.

This is a **format example**, not a capture or runtime result:

```aldc-triage-evidence
{
  "version": 1,
  "incident": "Example only: incorrect discount",
  "baseline": "Unknown app/revision/symbol match; request identities",
  "target": "Not connected; environment/build unverified",
  "milestones": {
    "capture": { "status": "not-captured", "reason": "No capture authorized" },
    "inspection": { "status": "insufficient", "reason": "No recorded state supplied" },
    "diagnosis": { "status": "insufficient", "reason": "Cause remains unknown" },
    "validation": { "status": "pending", "reason": "No approved correction" }
  },
  "claims": [{
    "statement": "The cause of the discount mismatch is unknown",
    "status": "not-captured",
    "nextObservation": "Confirm identities and request an authorized bounded reproduction"
  }]
}
```

Locate the bundled `aldc-validate/index.js` in the installed toolkit; the
host-specific AL tooling guide documents its layout. Run with Node:
`node <validator-path>/index.js --diagnosis <report-path>`.
This mode requires no YAML dependencies. Exit 0 means structurally consistent,
including an insufficient diagnosis; exit 1 identifies malformed/uncited claims.
It does not inspect archives, prove causality, enforce host permissions or certify
human approval. Run explicitly before presenting a snapshot diagnosis; no hook or
automatic gate is installed by reading this skill.

## Minimal host smoke (requires separate authorization)

1. Use an isolated App/Test workspace and record host/AL/provider/server versions
   and effective Triage/reviewer tool catalogs. Confirm BC29/runtime18 availability;
   configuration or a version label alone is not evidence of connection.
2. Obtain explicit authorization for **Capsula Sandbox**, identity and capture
   window. Do not use atico or Production. Check environment MCP and both
   D365 Snapshot Debug and D365 ATTACH DEBUG permissions. Do not start a capture
   when a prerequisite or target is unresolved; report it unavailable.
3. Arm once with the discovered schema, let the human reproduce the controlled
   failure, then stop/collect. Retain the actual readable inspection output and
   cleanup result; an opaque archive ends the run at inspection pending.
4. Have Triage produce cited observations and diagnosis, with fix validation
   pending. Give it a second case lacking a needed value: it must return
   insufficient evidence and the next observation. Validate both reports locally.
5. Reviewer consumes the reports without capture/implementation permissions.
   Reuse approved/redacted evidence for CLI/Codex report checks. This does not
   certify that those hosts captured or decoded a recording themselves.

No live capture, decoding, model behaviour or fix validation is established by
the repository's structural fixtures. Publication remains separately authorized.

Sources: [Microsoft snapshot debugging](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-snapshot-debugging),
[ALTool](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-al-tool),
[live Troubleshooting MCP](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-debug-mcp-server).
