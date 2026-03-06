---
name: skill-estimation
description: "AL project estimation for Business Central. Use when estimating development effort, creating cost models, SWOT analysis, or structuring project proposals."
---

# Skill: AL Project Estimation

## Purpose

Estimate AL/Business Central projects: complexity scoring, PERT 3-point estimation, SWOT/DAFO risk analysis, cost breakdown by phase, resource allocation, and structured presales documentation.

## When to Load

This skill should be loaded when:
- A new BC/AL project needs time and cost estimation
- A feasibility assessment or SWOT analysis is required before commitment
- A presales proposal or technical assessment document is being created
- Resource allocation and team composition need to be defined
- A project plan with milestones and payment schedule is needed

## Core Patterns

### Pattern 1: Intake Questions (Mandatory)

Before any estimation, gather these parameters:

```markdown
## Project Intake — Required Information

### 1. Project Identity
- Project name (will be used for folder structure)
- Brief description: What problem does it solve?

### 2. Cost Parameters (MANDATORY)
- Hourly rate (e.g., €75/hour, $100/hour)
- Currency (EUR, USD, GBP)
- Contingency buffer: Yes/No (default 15-20%)
- Risk buffer: Low (10%), Medium (20%), High (30%)

### 3. Technical Context
- Target BC version: SaaS, On-Premise, or both?
- Target delivery date
- Existing codebase? (repository URL or workspace path)
- Reference repositories for similar functionality?

### 4. Team (optional)
- Available developers: Junior, Mid, Senior?
- BC experience level: New, Experienced, Expert?
```

**PAUSE — do NOT proceed without cost parameters. Estimation without rates is meaningless.**

### Pattern 2: Complexity Scoring

Score each dimension 1-10 to derive overall project complexity:

```markdown
## Complexity Assessment

| Dimension | Score (1-10) | Criteria |
|---|---|---|
| Data Model | /10 | Tables, relations, migration needs |
| Business Logic | /10 | Codeunits, validations, calculations |
| UI Complexity | /10 | Pages, customizations, RoleCenter |
| Integrations | /10 | External APIs, events, webhooks |
| Reporting | /10 | Reports, queries, analytics |
| Security | /10 | Permissions, data sensitivity, audit |
| Testing | /10 | Test coverage needed, edge cases |
| Migration/Upgrade | /10 | Data migration, version compatibility |

**Overall Complexity**: (sum / 80) × 10 = X/10
```

**Object count estimation:**

| Object Type | Low Complexity | Medium | High |
|---|---|---|---|
| Table | 2-4 hrs | 4-8 hrs | 8-16 hrs |
| Page (Card/List) | 2-4 hrs | 4-8 hrs | 8-16 hrs |
| Page (Document) | 4-8 hrs | 8-16 hrs | 16-32 hrs |
| Codeunit | 2-8 hrs | 8-16 hrs | 16-40 hrs |
| Report | 4-8 hrs | 8-16 hrs | 16-32 hrs |
| Integration | 8-16 hrs | 16-32 hrs | 32-80 hrs |

### Pattern 3: PERT 3-Point Estimation

Use the Program Evaluation and Review Technique for each task:

```markdown
## PERT Formula

E = (O + 4M + P) / 6

Where:
- O = Optimistic (best case, everything goes right)
- M = Most Likely (normal case, typical obstacles)
- P = Pessimistic (worst case, major obstacles)
- E = Expected duration
```

Apply per development phase:

```markdown
## Phase Breakdown

### Phase 1: Analysis & Design
| Task | O (hrs) | M (hrs) | P (hrs) | E (hrs) |
|---|---|---|---|---|
| Requirements analysis | 8 | 16 | 24 | 16 |
| Technical design | 8 | 12 | 20 | 13 |
| Architecture review | 4 | 8 | 12 | 8 |
| **Subtotal** | **20** | **36** | **56** | **37** |

### Phase 2: Development
| Task | O (hrs) | M (hrs) | P (hrs) | E (hrs) |
|---|---|---|---|---|
| Tables & data model | X | X | X | X |
| Pages & UI | X | X | X | X |
| Business logic | X | X | X | X |
| Integrations | X | X | X | X |
| **Subtotal** | **X** | **X** | **X** | **X** |

### Phase 3: Testing & QA
| Task | O (hrs) | M (hrs) | P (hrs) | E (hrs) |
|---|---|---|---|---|
| Unit tests | X | X | X | X |
| Integration tests | X | X | X | X |
| UAT support | X | X | X | X |
| Bug fixes | X | X | X | X |
| **Subtotal** | **X** | **X** | **X** | **X** |

### Phase 4: Deployment & Documentation
| Task | O (hrs) | M (hrs) | P (hrs) | E (hrs) |
|---|---|---|---|---|
| Technical documentation | X | X | X | X |
| Training materials | X | X | X | X |
| Deployment | X | X | X | X |
| Post-go-live support | X | X | X | X |
| **Subtotal** | **X** | **X** | **X** | **X** |
```

### Pattern 4: SWOT/DAFO Analysis

Structured risk and opportunity assessment:

```markdown
## SWOT Analysis

### Strengths (Internal Positive)
| ID | Strength | Impact |
|---|---|---|
| S1 | [e.g., Team has BC experience] | High/Medium/Low |

### Opportunities (External Positive)
| ID | Opportunity | Impact |
|---|---|---|
| O1 | [e.g., Standard BC API available] | High/Medium/Low |

### Weaknesses (Internal Negative)
| ID | Weakness | Impact | Mitigation |
|---|---|---|---|
| W1 | [e.g., No existing test suite] | High | Implement TDD from start |

### Threats (External Negative)
| ID | Threat | Probability | Impact | Mitigation |
|---|---|---|---|---|
| T1 | [e.g., BC version upgrade mid-project] | Medium | High | Pin BC version |

## Feasibility Score

| Criterion | Score (1-10) |
|---|---|
| Technical Feasibility | /10 |
| Resource Feasibility | /10 |
| Timeline Feasibility | /10 |
| Economic Feasibility | /10 |
| **Overall** | **/10** |

### Recommendation
- [ ] **GO** — Project viable, proceed
- [ ] **CAUTION** — Viable with conditions
- [ ] **NO-GO** — Not recommended currently
```

### Pattern 5: Cost Summary and Payment Milestones

Consolidate estimation into a financial summary:

```markdown
## Cost Summary

| Concept | Hours | Rate | Cost |
|---|---|---|---|
| Analysis & Design | X | [RATE] | [TOTAL] |
| Development | X | [RATE] | [TOTAL] |
| Testing & QA | X | [RATE] | [TOTAL] |
| Deployment & Docs | X | [RATE] | [TOTAL] |
| **Subtotal** | **X** | | **[TOTAL]** |
| Contingency ([%]%) | X | | [TOTAL] |
| Risk Buffer ([%]%) | X | | [TOTAL] |
| **TOTAL** | **X** | | **[CURRENCY] [TOTAL]** |

## Payment Milestones

| Milestone | % | Amount | Deliverable |
|---|---|---|---|
| Project Start | 20% | [X] | SOW signed, project plan |
| Design Approved | 20% | [X] | Architecture approved |
| Development Complete | 30% | [X] | Code delivered, tests pass |
| UAT Approved | 20% | [X] | User acceptance sign-off |
| Go-Live | 10% | [X] | Production deployment |
```

## Workflow

### Step 1: Intake

1. Ask mandatory intake questions (Pattern 1)
2. Confirm cost parameters — **do NOT skip this**
3. If reference repositories provided, analyze them for scope comparison

### Step 2: Analyze

1. Score complexity dimensions (Pattern 2)
2. Count estimated objects (tables, pages, codeunits, reports)
3. Identify integration points and external dependencies
4. If existing codebase, use `al_search_objects` to measure current scope

### Step 3: Estimate

1. Apply PERT 3-point estimation per phase (Pattern 3)
2. Use complexity-based hour ranges for object estimation
3. Apply standard ratios:
   - Testing = 30-40% of development
   - Documentation = 10-15% of total
   - Integration = typically underestimated by 50% — adjust accordingly
   - Data migration = 15-20% of total (if applicable)
   - BC version testing = 5-10% for compatibility

### Step 4: Risk Assessment

1. Conduct SWOT analysis (Pattern 4)
2. Calculate feasibility score
3. Provide clear GO / CAUTION / NO-GO recommendation

### Step 5: Deliver Proposal

1. Create cost summary with payment milestones (Pattern 5)
2. Define resource allocation (roles, FTE, duration)
3. Compile all sections into presales documentation
4. Store in `Technical_PreSales/{project-slug}/` folder structure

**PAUSE — present proposal for stakeholder review before commitment.**

## Estimation Guidelines

| Rule | Guideline |
|---|---|
| Testing effort | Always 30-40% of development hours |
| Documentation | Never skip — 10-15% of total hours |
| Integration complexity | Usually underestimated — add 50% buffer |
| Data migration | Add if mentioned — 15-20% of total |
| BC version testing | Add 5-10% for compatibility verification |
| Training | 8-16 hours per user group |
| Contingency | 15-20% standard, 25-30% for high uncertainty |

## References

- [PERT Estimation Technique](https://en.wikipedia.org/wiki/Program_evaluation_and_review_technique)
- [BC Extension Development Guide](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-dev-overview)
- [AppSource Submission Requirements](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/readiness/readiness-checklist-marketing)
- [BC Licensing Model](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/deployment/licensing)

## Constraints

- This skill covers **project estimation, risk analysis, and presales documentation**
- Do NOT estimate without cost parameters (hourly rate, currency) — ask first
- Do NOT build, compile, or deploy code — estimation only
- Do NOT modify production source code — analysis and documentation only
- Do NOT skip the SWOT analysis for any project — risk awareness is mandatory
- Architecture design → al-architect agent | Technical specifications → al-spec.create workflow | Implementation → al-conductor agent
