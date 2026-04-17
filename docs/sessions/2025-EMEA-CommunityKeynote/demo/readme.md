# Demo 2 Knowledge Files

**Purpose**: Simplified knowledge files for demonstrating workflow process control in AI agent development.

---

## 📁 FOLDER STRUCTURE

```
demo2-knowledge/
├── copilot-instructions.md     # Main instructions for AI agents (READ FIRST!)
├── WorkflowProcess.md          # Development lifecycle workflow
├── .aidocs/                    # Application knowledge index
│   ├── index.md                # Knowledge index and plan tracker
│   ├── plans/                  # Implementation plans (created as needed)
│   └── templates/              # Plan templates
│       ├── feature-implementation-plan.md
│       └── bugfix-implementation-plan.md
└── .copilot/                   # Agent guidance documents
    └── TestingValidation.md    # Testing and quality requirements
```

---

## 🎯 WHAT THIS DEMONSTRATES

### The Problem (Demo 1: "Vibe Coding")
Without these knowledge files, AI agents:
- Jump straight to coding without asking questions
- Make assumptions about vague requirements
- Skip documentation and testing
- Don't follow team workflow

### The Solution (Demo 2: Add Knowledge)
With these knowledge files, AI agents:
- ✅ Ask clarifying questions before coding
- ✅ Create implementation plans
- ✅ Follow quality gates (testing, docs)
- ✅ Maintain traceability in Azure DevOps

---

## 📋 FILE DESCRIPTIONS

### `copilot-instructions.md`
**Primary instructions file** for AI agents working on Data Braider.

**Key Sections**:
- Project overview and technology stack
- **Workflow requirements** (Must read WorkflowProcess.md!)
- AL development standards (naming, code quality, structure)
- Testing requirements
- Documentation requirements (wiki formatting)
- Azure DevOps integration
- Implementation planning
- Common scenarios (vague requirements, bug fixes, documentation)
- Quality gates

**Use Case**: First file agents read to understand project context and workflow expectations.

---

### `WorkflowProcess.md`
**Main workflow guide** for AI agents implementing features or fixing bugs.

**Key Sections**:
- Development Lifecycle Workflow (4 phases)
  - Phase 1: Requirements Clarification
  - Phase 2: Implementation Planning
  - Phase 3: Implementation
  - Phase 4: Documentation
- Behavioral Rules (Always/Never do)
- Work Item Integration
- Testing Expectations
- Documentation Expectations

**Use Case**: Teaches agents to follow team process, ask questions, and maintain quality.

---

### `.aidocs/index.md`
**Application knowledge index** tracking implementation plans and decisions.

**Key Sections**:
- Index structure explanation
- Active plans table
- Completed plans table
- How to use guide
- Plan entry format

**Use Case**: Agents create and track implementation plans here for traceability.

---

### `.aidocs/templates/feature-implementation-plan.md`
**Template** for planning new feature implementation.

**Sections Include**:
- Business requirement and user story
- Acceptance criteria
- Requirements clarification (questions/answers)
- Technical analysis
- Implementation approach
- Testing strategy
- Documentation requirements
- Completion checklist

**Use Case**: Agent uses this template when creating implementation plan for logging feature.

---

### `.aidocs/templates/bugfix-implementation-plan.md`
**Template** for planning bug fix implementation.

**Sections Include**:
- Bug description and reproduction steps
- Root cause analysis
- Fix approach
- Testing strategy (regression test)
- Risks and side effects
- Documentation updates

**Use Case**: Ensures bug fixes are properly analyzed and tested.

---

### `.copilot/TestingValidation.md`
**Testing and quality guide** for AI agents.

**Key Sections**:
- Testing philosophy
- Types of testing (unit, integration, manual)
- Testing checklist
- Test data strategy
- Error handling testing
- Performance testing
- Quality gates

**Use Case**: Ensures agents include testing in their implementation approach.

---

## 🎬 DEMO 2 USAGE

### In Demo 2 Session
1. **Show the contrast**: Reference Demo 1 where agent just coded without asking
2. **Add these files**: Copy demo2-knowledge contents to DemoApp repo
3. **Show the difference**: Same work item, agent now asks questions via ADO comments
4. **Highlight workflow**: Agent follows phases, creates plan, maintains traceability

### What to Show Audience
- **WorkflowProcess.md**: "Here's our team workflow the agent will follow"
- **Templates**: "Agent uses these to create implementation plans"
- **TestingValidation.md**: "Agent knows it needs to include testing"
- **Result**: Agent asks 5-10 clarifying questions before coding

---

## 🔄 COMPARED TO FULL KNOWLEDGE

This is a **simplified version** compared to `.docs/example-knowledge/`:

**Simplified**:
- 3 work item states (To Do, Doing, Done) vs. 10 states
- 2 work item types (Epic, Task) vs. multiple types
- Single workflow guide vs. multiple specialist guides
- Basic testing guide vs. comprehensive test strategy docs
- Feature/bugfix templates only vs. full template library

**Purpose**: Demo-appropriate complexity that's quick to show and explain in live session.

---

## 📊 FILE SIZES

| File | Lines | Purpose |
|------|-------|---------|
| `copilot-instructions.md` | 209 | Primary agent instructions (project context) |
| `WorkflowProcess.md` | 166 | Main workflow and behavioral rules |
| `.aidocs/index.md` | 84 | Knowledge index and plan tracker |
| `.aidocs/templates/feature-implementation-plan.md` | 153 | Feature planning template |
| `.aidocs/templates/bugfix-implementation-plan.md` | 125 | Bug fix planning template |
| `.copilot/TestingValidation.md` | 221 | Testing and quality guide |
| `README.md` | 188 | Presenter guide and demo tips |
| **Total** | **1,146** | **Comprehensive but demo-ready** |

---

## ✅ CHECKLIST FOR DEMO 2

- [x] WorkflowProcess.md created
- [x] .aidocs/index.md created
- [x] Feature implementation template created
- [x] Bugfix implementation template created
- [x] TestingValidation.md created
- [ ] Files tested with agent
- [ ] Files copied to DemoApp for Demo 2
- [ ] Demonstrated in session practice run

---

## 🎯 EXPECTED DEMO OUTCOME

### Before (Demo 1)
- Work item: "Add logging support"
- Agent: *Immediately implements basic logging*
- Result: Works, but wrong (assumptions made)

### After (Demo 2)
- Same work item: "Add logging support"
- Agent: *Reads WorkflowProcess.md*
- Agent: *Posts ADO comment with 8-10 clarifying questions*:
  - What should be logged?
  - How long should logs be retained?
  - Who needs access?
  - What performance impact is acceptable?
  - What fields should be captured?
  - Where should logs be stored?
  - What log levels are needed?
  - Are there compliance requirements?
- Result: **Requirements clarified before coding**

---

## 💡 PRESENTATION TIPS

### When Showing copilot-instructions.md
- Point out the **"WORKFLOW REQUIREMENTS"** section
- Highlight **"Never start coding without clarifying vague requirements first"**
- Show the **common scenarios** section (vague requirements example)

### When Showing WorkflowProcess.md
- Point out the **4-phase workflow**
- Highlight **"Ask questions first" rule**
- Show the **example wrong vs. right approach** at bottom

### When Showing Templates
- Don't read through them - just show they exist
- Point out **"Requirements Clarification"** section
- Mention **"Completion Checklist"** ensures quality

### When Showing TestingValidation.md
- Emphasize **"Testing is not optional"**
- Show the different types of testing
- Point out **quality gates**

---

**Remember**: These files transform an agent from "code monkey" to "collaborative team member" who follows process and asks intelligent questions.
