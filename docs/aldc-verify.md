# aldc-verify — compile and analyzer evidence for ALDC

[Español](aldc-verify-es.md)

ALDC's Claude Code plugin does not compile AL itself. For compile and analyzer
evidence it relies on **aldc-verify**, a separate Claude Code plugin:
[javiarmesto/aldc-verify-plugin](https://github.com/javiarmesto/aldc-verify-plugin).
This page explains what ALDC gets from it, how to install it and what happens
when it is missing. It describes aldc-verify 0.3.0.

---

## Why a separate plugin

Compiling AL well takes real work: finding the compiler on each machine,
installing it in cloud sessions, filtering the symbol cache by Business Central
version, compiling App before Test, serialising concurrent builds and deciding
when a turn changed AL at all. aldc-verify already does all of that and is tested
on its own.

ALDC uses it instead of duplicating it. ALDC keeps the method (roles, plans,
review, gates); aldc-verify supplies the compiler result. Each plugin can be
updated without touching the other.

## What ALDC gets from it

| Piece | What it does for an ALDC run |
| --- | --- |
| **L1 compile** | Compiles every AL project in the repo with the real compiler, in dependency order (App before Test). |
| **L2 analyzers** | Runs CodeCop, UICop and PerTenantExtensionCop by default, or the analyzers and ruleset the project configures. Warnings never block; a rule raised to `Error` does. |
| **Stop / SubagentStop gate** | When Claude, or a code-writing subagent (`implement`, `developer`, `builder`), is about to finish a turn in which it changed AL, the gate compiles. With errors, it sends Claude back to fix them, at most 3 times, then lets it stop with a summary. A turn that did not touch AL is not blocked, even if the tree was already red. |
| **`al-build-validator` agent** | `aldc-verify:al-build-validator` compiles and returns only the diagnostics, grouped by root cause and marked as introduced or pre-existing. It is read-only. The ALDC conductor launches it after each implementation phase and cites its result in the phase-complete file. |
| **`.claude/.aldc-verify/last-report.json`** | The detail of the last compile and analyzer run. It is the build evidence the conductor passes to the reviewer. ALDC reviewers never run builds: they cite real errors and warnings from this report next to BCQuality. If the report is missing or older than the changes, the review says `build: not-run`. |
| **`/aldc-verify:al-go`** | Delivery: verify, BCQuality review if installed, commit file by file, push a `claude/` branch and open a **draft** pull request. It stops if the build is `not-run`. It never merges and never marks the PR ready: a person does. |
| **Guard** | A PreToolUse hook on Bash and PowerShell, active in AL repos. It denies `gh pr merge`, force pushes and delete pushes, pushes to the default branch (`main`, `master`, `dev`, `develop`), mass `git add` (`-A`, `.`, `--all`), `git commit -a`, and `git add` of the paths listed in `guard.protectedPaths`. |
| **SubagentStart overlay** | When an `aldc:*` subagent starts in an AL repo, aldc-verify adds a few lines of context by role, without changing the ALDC plugin (see below). |

### What each ALDC role is told

| Role | Subagents | What the overlay adds |
| --- | --- | --- |
| Write code | implement, developer, agent-builder | "Compiles" is checked with `/aldc-verify:al-verify --l1` (or with `al-build-validator`) and the result is cited, never claimed without it. In TDD, RED means "the test compiles and describes the behaviour". Running tests needs a Business Central v28+ sandbox; without one, tests are `not-run`. |
| Review | review, dredd, triage | Cite the real errors and warnings from `last-report.json` next to BCQuality. If it is missing or old, write `build: not-run` and ask for `al-build-validator`. The review stays read-only. |
| Conductor | conductor | Validate each phase with `al-build-validator`, paste the result into the phase-complete file and pass `last-report.json` to the reviewer. Deliver with `/aldc-verify:al-go`. |
| Plan | planning, architect, spec, presales | Include the "compiles" check with `/aldc-verify:al-verify` in each phase of the plan. |

## Install and update

On your machine, once:

```bash
claude plugin marketplace add javiarmesto/aldc-verify-plugin
claude plugin install aldc-verify@aldc-verify-dev
```

To move to a new version, update the marketplace and the plugin, then restart
Claude Code:

```bash
claude plugin marketplace update aldc-verify-dev
claude plugin update aldc-verify@aldc-verify-dev
```

`claude plugin list` shows `aldc-verify@aldc-verify-dev` and its version. For
cloud sessions, per-repo settings and the CI workflow, see the
[aldc-verify README](https://github.com/javiarmesto/aldc-verify-plugin#readme).

## If it is missing

- **ALDC warns at session start.** In an AL or ALDC project, the ALDC session-start hook
  shows: *aldc-verify is not installed: ALDC has no compile/analyzer evidence for
  its phases.*
- **Phases are recorded as not verified.** The conductor records the build of each
  phase as `not-run`, and reviewers write `build: not-run`. A phase is never
  reported as compiling without a compiler result.
- **Nothing blocks.** ALDC runs as before, with the build marked as not verified.
  There is no compile gate and no guard: those belong to aldc-verify.

The same applies when aldc-verify is installed but cannot compile (no compiler or
no symbols): it reports `not-run` and does not block.

## Who does what

The two plugins register their own hooks and neither overrides the other. They
act on different events or on different tools, so they do not overlap.

| Event | ALDC (`aldc`) | aldc-verify |
| --- | --- | --- |
| SessionStart | Project guidance, autonomy mode, test runner, warnings (rules not initialized, BCQuality or aldc-verify missing); BCQuality precondition | Detects the AL compiler on Windows and macOS; installs it in Linux and cloud sessions |
| UserPromptSubmit | — | Records the tree fingerprint at the start of each turn |
| PreToolUse | `Agent`/`Task`: `agent-brief` (AL rules, autonomy mode, BCQuality selection). Read, search, edit and MCP tools: `flow-scout`. `SendMessage`: `send-guard` | `Bash`/`PowerShell`: the guard (merge, force push, default branch, mass `git add`, protected paths) |
| PostToolUse | `Write`/`Edit`: `artifact-gate` (complete review reports, commented event subscribers) | — |
| SubagentStart | — | Overlay for `aldc:*` subagents: how to verify, by role |
| SubagentStop | — | Compile gate for code-writing subagents |
| Stop | `stop-guard`: no stop with an unfinished plan in pre-approved mode | Compile gate: no stop with AL errors introduced in the turn |

Both plugins use the Stop event for different questions: ALDC asks whether the
plan is finished, aldc-verify asks whether the AL compiles.

## Scope

aldc-verify is a Claude Code plugin, so today it only serves ALDC's Claude Code
surface. The other surfaces (GitHub Copilot in VS Code, Copilot CLI and Codex) do
not use it yet; their build evidence comes from their own AL tooling or is
recorded as `not-run`.
