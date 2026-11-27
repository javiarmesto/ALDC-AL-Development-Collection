---
name: tickets
description: Cut an approved Business Central AL specification into vertical tickets with dependencies, reserved object ID ranges and acceptance coverage, validated by a deterministic tool. Use after the spec is approved and before building; al-conductor runs it too.
argument-hint: Requirement name (the folder under .claude/plans/)
---

# /aldc:tickets

> **Claude Code runtime:** `${CLAUDE_PLUGIN_ROOT}/docs/claude-runtime.md` is binding (gates, delegation, paths). You run in the main session.

Input: **$ARGUMENTS**, the requirement name `<req>`. Paths below are under `.claude/plans/` (`aldc.yaml -> plans.root`).

A ticket is the unit of work from here on: one implementer per ticket, nothing carried over in the conversation. When this skill ends, a session that has never seen the requirement must be able to build it from the files alone.

## 1. Inputs

Read `<req>/<req>.spec.md` (or the approved unit specs for multi-spec), `<req>/<req>.architecture.md` when present, `<req>/<req>.test-plan.md`, `<req>/<req>.bcq-criteria.json` when present, `memory.md` and every `app.json` (`idRanges`).

If `<req>/research.md` does not exist, launch `aldc:al-researcher` in the foreground for the structured findings the Conductor asks for (AL objects, dependencies, events, the Standard Flow and AL-Go layout). Write its answer verbatim to `<req>/research.md` under a `# Research: <req>` heading with the date. If it exists, reuse it and do not research again.

No approved spec: stop and say that `/aldc:spec` comes first.

## 2. Criteria

Write `<req>/tickets/criteria.md`, with one line per acceptance criterion of spec §11: `- AC-NN: <the criterion, as the spec states it>`. If the spec already numbers its criteria, keep those numbers. Include negative cases and unchanged behaviour, each as its own criterion. The tickets cite these ids; the tool checks coverage against this file.

## 3. Cut

Write `<req>/tickets/T-NN.md` from `${CLAUDE_PLUGIN_ROOT}/docs/templates/ticket-template.md`, numbered `T-01`, `T-02` and so on.

- **Vertical.** Each ticket crosses every layer it needs (table, codeunit, page, test, permissions) and can be verified on its own once its `depends_on` are done. Do not cut by layer: "all tables" followed by "all pages" is not a cut.
- **Small.** One implementer must finish it in one context window: as a guide, at most about 6 AL objects plus their tests. Split anything larger.
- **Few dependencies.** Make a ticket depend on another only when it uses an object that ticket creates. The data model a feature needs goes into its first ticket, not into a "setup" ticket on its own.
- **IDs.** Reserve each ticket a range inside an `app.json` `idRanges` entry, with no overlap with any other ticket. Use the spec's IDs when it gives them.
  - Give the ticket a range in **every** app it touches, test app included. For example `[71200-71209, 71300-71309]`.
  - At integration, an object whose ID falls outside the ticket's ranges is refused.
- **Shared files.** List under `shared_files` the permission sets, `app.json` and XLF files that several tickets touch, with their paths.
  - Tickets built in parallel never edit these files. Each ticket reports the entries it needs, and the integration step applies them.
  - A shared file has one writer, the integration step. Never cut a ticket whose only deliverable is a shared file, such as "create the permission set": give its criteria to the tickets that need those entries. `tickets.js validate` refuses a ticket whose only objects are permission sets in `shared_files`.
  - A shared file that does not exist yet, such as the extension's permission set, also goes in `shared_files`. The integration step creates it the first time a ticket asks for an entry in it.
- **Independent where possible.** Tickets with no `depends_on` path between them are built at the same time, each in its own worktree. Two such tickets must not change the same file outside `shared_files`. If they would, make one depend on the other.
- **`mode`.** Use `hitl` only for a decision the spec leaves to a human, and name that decision in *Scope*. Everything else is `afk`.
- **`status: ready`** for every ticket.

## 4. Validate

Run `node "${CLAUDE_PLUGIN_ROOT}/tools/tickets/tickets.js" validate <req> --project .` and fix the tickets until it exits 0. Never edit the tool's verdict, and never mark a criterion covered that no ticket closes.

## 5. Gate: approved cut

Present the cut as a table: ticket, title, `depends_on`, `mode`, IDs and criteria. Add the output of `tickets.js status <req>`.

- `human` mode: stop and wait for explicit approval. A change the human asks for goes back to step 3.
- `pre-approved` mode: append the cut and its validation to `<req>/decisions.md` as the approved-cut gate, then continue.

Building is `/aldc:conduct <req>`. With tickets present, the Conductor dispatches them one by one and resumes from their status.
