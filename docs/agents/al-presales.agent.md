# :material-presentation: AL Pre-Sales & Project Estimation Specialist

<div class="agent-card" markdown>

| | |
|---|---|
| **Agent ID** | `al-presales` |
| **Model** | Claude Sonnet 4.5 |
| **Type** | User-facing · Estimation |
| **Invocation** | `@AL Pre-Sales & Project Estimation Specialist` |

</div>

---

## Purpose

Transforms vague project ideas into **actionable, well-documented technical proposals** for Business Central AL projects. Delivers cost estimates, risk analysis, feasibility assessment, and comprehensive documentation.

## When to use

- Evaluating a new BC project before commitment
- Creating cost proposals (time + budget)
- Running feasibility or SWOT analysis
- Structuring project plans for stakeholders

## Activation triggers

Any of these prompts activate the agent:

- *"Estimate this project..."*
- *"Create a proposal for..."*
- *"Analyze feasibility of..."*
- *"How much would it cost to..."*

## Deliverables

The agent creates a `Technical_PreSales/{project-slug}/` folder with:

| Document | Content |
|---|---|
| `00-executive-summary.md` | High-level overview and recommendation |
| `01-requirements.md` | Gathered and structured requirements |
| `02-technical-analysis.md` | Repo/code analysis, patterns found |
| `03-swot-analysis.md` | Strengths, weaknesses, opportunities, threats |
| `04-cost-estimation.md` | PERT estimates, time dedication, budget |
| `05-project-plan.md` | Timeline and milestones |
| `06-risk-mitigation.md` | Risk register and mitigation strategies |
| `07-github-pages-proposal.md` | Documentation site proposal |

## Key capabilities

| Capability | Detail |
|---|---|
| **PERT estimation** | Optimistic / most likely / pessimistic time estimates |
| **SWOT / DAFO** | Structured risk and opportunity analysis |
| **Skill loading** | Loads `skill-estimation` on demand |
| **Codebase analysis** | Scans existing AL code for complexity signals |

## Handoffs

| Destination | When |
|---|---|
| **AL Architecture & Design Specialist** | Proposal approved → design the architecture |
| **AL Development Conductor** | Proposal approved → implement with TDD |

---

<small>Source: [`agents/al-presales.agent.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/agents/al-presales.agent.md)</small>