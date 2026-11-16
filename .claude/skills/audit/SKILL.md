---
name: audit
description: 'Independent, on-demand AL codebase auditor for Business Central. Judges the code against BCQuality (citable knowledge) plus native checks for what BCQuality does not reach. Read-only; advisory verdict. Default scope: objects changed vs main; full codebase on request.'
argument-hint: 'Optional: a module/folder to focus on, or "todo" for a full-codebase audit (default = changes vs main)'
---

# /aldc:audit

Delegate this to the `aldc:al-reviewer` subagent with the `Agent`/`Task` tool (`subagent_type: "aldc:al-reviewer"`, `run_in_background: false`), so that it runs with its own read-only tool list instead of this session's. The reviewer has no shell, so compute the worklist here first: by default `git diff --name-only main...HEAD -- '*.al'` (read-only; local git, not a GitHub tool); the module or files the input names; or, for a full audit ("todo"), the project-owned `*.al` under the source and test roots, excluding `.alpackages` and generated or vendor sources. In the prompt, state `scope: audit` and the target (`changed-vs-main`, `codebase` or the named scope), and pass the input below, the project root and that file list. When it returns, write its `### Audit-Report (JSON)` block verbatim to `.claude/audits/dredd-audit-<YYYY-MM-DD-HHMM>.json` (`aldc.yaml -> audits.root`; create the folder if absent; skip the write only if the user forbids it, and say so) and touch nothing else. Return its report and the saved path to the user as they come, without rewriting its verdict. Only if the host cannot launch subagents, read `${CLAUDE_PROJECT_DIR}/claude-plugin/agents/al-reviewer.md` in full and act as that agent in scope `audit`, stating that the read-only tool list is not enforced.

Input: **$ARGUMENTS**

Requirement artifacts live under `.claude/plans/` in the project; run `/aldc:al-initialize` once if that folder does not exist.
