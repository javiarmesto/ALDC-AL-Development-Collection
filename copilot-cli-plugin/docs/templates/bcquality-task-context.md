# BCQuality task-context (construction reference)

The **task-context** is the input a BCQuality consumer hands to `entry.md`. Per
the BCQuality consumption contract, the **orchestrator builds it** and the agent
consumes it — for the TDD loop the orchestrator is `@al-conductor`; for an
on-demand audit the orchestrator is Dredd itself. This file is the single source
of truth for *how* to build it, so the rule lives in one place, not copied into
every agent.

## Shape

```yaml
task-context:
  goal: "<what needs doing>"            # e.g. "review AL source changes" | "audit AL source"
  inputs-available: [pr-diff, file-path] # whichever the orchestrator actually has
  technologies: [al]
  bc-version: <from app.json; OMIT if unknown>
  countries: <from app.json; OMIT if unknown>
  application-area: <union of the changed objects' areas; OMIT if undeterminable>
  enabled-layers: [microsoft, community, custom]
  disabled-skills: [...]                # only when supported by the selected provider
```

Only `goal` and `inputs-available` are required.

## The one rule that matters: OMIT, don't fake

Per READ, an **omitted** filter dimension is `unknown`, **not** a wildcard.
Derive `bc-version`/`countries` from `app.json` and `application-area` from the
*changed objects*; **OMIT anything you cannot determine**. Never substitute
`[all]`/`[w1]` for convenience — it over-matches knowledge files and inflates
confidence. The contract caps findings derived from an `unknown` dimension at
`confidence: medium`, which is the correct, honest outcome.

## Provider routing and scope

Apply [the provider contract](bcquality-provider-contract.md) before constructing
this context. Preserve the real request and actual paths. For multiroot, derive
pilot exclusions from the configured `pilotSkills` and the available Entry
contract; never assume a fixed list of leaves. For plugin mode, load the configured
skill and use its supported inputs/layer controls; do not copy a multiroot denylist
or custom consumer layer. If a requested restriction cannot be expressed, state
that limitation and continue native checks for that scope.

Entry owns routing. Execute only actual active dispatches and preserve their
results; catalog discovery and loading alone are not execution evidence.
