---
name: conduct
description: AL Conductor Agent - Orchestrates Planning → Implementation → Review → Commit cycle for AL Development. Enforces TDD and quality gates for Business Central extensions. Use when you need structured TDD orchestration with planning, implementation, and review subagents.
argument-hint: Feature description or requirements for TDD orchestration (e.g., "Add customer loyalty points system")
---

# /aldc:conduct

Read `${CLAUDE_PLUGIN_ROOT}/agents/al-conductor.md` in full and act as that agent for the rest of this session; the runtime line at the top of that file, `${CLAUDE_PLUGIN_ROOT}/docs/claude-runtime.md` and the *Claude Code runtime rules* in that file are binding. You stay the orchestrator in this main session because only the main session can launch subagents. **Orchestrating means delegating:** research goes to `aldc:al-researcher`, each phase to `aldc:al-implementer` (mode `phase`) and each review to `aldc:al-reviewer` (scope `phase`), through the `Agent`/`Task` tool, in the foreground. Never do that work yourself, even when the task looks small. If the host does not let you launch subagents, say so and stop; do not simulate the subagents. For an enforced tool list, launch `claude --agent aldc:al-conductor` instead.

Input: **$ARGUMENTS**

**Resume first.** If `.claude/plans/<req>/tickets/` exists for this requirement, run `node "${CLAUDE_PLUGIN_ROOT}/tools/tickets/tickets.js" status <req> --project .` and continue from what it reports (Conductor rule 12). New requirements follow the Conductor's *Ticket path*.

Requirement artifacts live under `.claude/plans/` in the project; run `/aldc:al-initialize` once if that folder does not exist.
