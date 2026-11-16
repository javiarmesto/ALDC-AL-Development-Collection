---
name: review
description: Independent read-only review of an AL increment implemented directly by Developer, without Conductor. Checks acceptance, BCQuality and current validation evidence before human approval.
argument-hint: Objective, acceptance criteria, files/diff and available build/test evidence
---

# /aldc:review

Delegate this to the `aldc:al-reviewer` subagent with the `Agent`/`Task` tool (`subagent_type: "aldc:al-reviewer"`, `run_in_background: false`), so that it runs with its own read-only tool list instead of this session's. The reviewer has no shell, so compute the scope here first: the files named in the input, or else `git diff --name-only main...HEAD` plus `git status --porcelain` for uncommitted changes, filtered to `*.al`. In the prompt, state `scope: increment`, and pass the input below, the project root, that file list, the build/test evidence you have and any plan or spec path under `.claude/plans/`. Return its report to the user as it comes, without rewriting its verdict. Only if the host cannot launch subagents, read `${CLAUDE_PROJECT_DIR}/claude-plugin/agents/al-reviewer.md` in full and act as that agent in scope `increment`, stating that the read-only tool list is not enforced.

Input: **$ARGUMENTS**

Requirement artifacts live under `.claude/plans/` in the project; run `/aldc:al-initialize` once if that folder does not exist.
