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
  disabled-skills: [...]                # the non-pilot review leaves (see Pilot below)
```

Only `goal` and `inputs-available` are required.

## The one rule that matters: OMIT, don't fake

Per READ, an **omitted** filter dimension is `unknown`, **not** a wildcard.
Derive `bc-version`/`countries` from `app.json` and `application-area` from the
*changed objects*; **OMIT anything you cannot determine**. Never substitute
`[all]`/`[w1]` for convenience — it over-matches knowledge files and inflates
confidence. The contract caps findings derived from an `unknown` dimension at
`confidence: medium`, which is the correct, honest outcome.

## Pilot scope

`disabled-skills` is the **only** place the pilot is expressed: it lists the
review leaves that are NOT in the pilot. The **source of truth** is
`aldc.yaml` → `external.bcquality.pilotSkills`. Today the pilot is
performance/security/style, so `disabled-skills` disables privacy, upgrade, ui.
When the pilot changes, change `aldc.yaml` and this denylist together (until the
denylist is derived from `aldc.yaml` automatically).

## After building it

Hand the task-context to the BCQuality entry point (`<home>/skills/entry.md`, per `aldc.yaml`) and **execute whatever
`dispatch[]` returns** — do not assume which skills come back. Entry owns
routing; the consumer owns only the convention "invoke entry.md first."
