# Application Knowledge Index - Data Braider

**Purpose**: This index tracks application-specific knowledge, decisions, and implementation plans for the Data Braider project.

---

## 📋 ABOUT THIS INDEX

This `.aidocs` folder contains:
- **Implementation plans** for features and bug fixes
- **Technical decisions** and rationale
- **Templates** for consistent planning
- **Links** to related work items and documentation

---

## 🗂️ INDEX STRUCTURE

### Plans Folder (`plans/`)
Contains detailed implementation plans for work items. Each plan documents:
- Business requirements
- Technical analysis
- Implementation approach
- Testing strategy
- Completion status

**Naming Convention**: `{work-item-id}-{short-description}.md`

Example: `12345-add-logging-support.md`

### Templates Folder (`templates/`)
Standardized templates for different types of work:
- `feature-implementation-plan.md` - For new features
- `bugfix-implementation-plan.md` - For bug fixes

---

## 📊 ACTIVE PLANS

<!-- Add entries here as plans are created -->

| Work Item ID | Title | Status | Plan File |
|--------------|-------|--------|-----------|
| *No active plans yet* | | | |

---

## ✅ COMPLETED PLANS

<!-- Move completed plans here for reference -->

| Work Item ID | Title | Completed Date | Plan File |
|--------------|-------|----------------|-----------|
| *No completed plans yet* | | | |

---

## 🔗 RELATED KNOWLEDGE

### Project Documentation
- **Wiki**: `.wiki/` folder - Published to Azure DevOps
- **Workflow Process**: `WorkflowProcess.md` - Development lifecycle guidelines
- **Copilot Instructions**: `.github/copilot-instructions.md` - Agent context

### Azure DevOps
- **Project**: DirectionsEMEA2025
- **Repository**: DataBraider
- **Work Item Types**: Epic, Task
- **States**: To Do, Doing, Done

---

## 📝 HOW TO USE THIS INDEX

### When Starting New Work
1. Check for existing plan in `plans/` folder
2. If none exists, create plan using appropriate template
3. Add entry to "Active Plans" table above
4. Link plan to Azure DevOps work item

### When Completing Work
1. Update plan status to "Complete"
2. Move entry from "Active" to "Completed" table
3. Ensure wiki documentation is updated
4. Archive plan for future reference

### When Making Technical Decisions
1. Document decision in relevant plan file
2. Include rationale and alternatives considered
3. Link to any related discussions or work items

---

## 🎯 PLAN ENTRY FORMAT

When adding a plan to the index, use this format:

```markdown
| 12345 | Add Logging Support | In Progress | [plans/12345-add-logging-support.md](plans/12345-add-logging-support.md) |
```

**Fields**:
- **Work Item ID**: Azure DevOps work item number
- **Title**: Short descriptive title
- **Status**: Draft / In Progress / Complete
- **Plan File**: Relative link to plan markdown file

---

## 💡 TIPS FOR AI AGENTS

- **Always check this index** before starting work
- **Create a plan** for non-trivial features or fixes
- **Update plan status** as work progresses
- **Link plans to work items** for traceability
- **Use templates** for consistent documentation
- **Archive completed plans** - they're valuable reference material

---

**Last Updated**: <!-- Update when adding/completing plans -->
