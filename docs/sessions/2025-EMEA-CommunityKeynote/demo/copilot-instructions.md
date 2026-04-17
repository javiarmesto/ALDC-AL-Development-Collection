# GitHub Copilot Instructions for Data Braider

## Project Overview

**Data Braider** is a Business Central AL extension that provides a no-code API creation tool. This extension allows users to configure API endpoints without writing code, using a visual configuration interface.

---

## 🏗️ Technology Stack

- **Language**: AL (Application Language) for Microsoft Dynamics 365 Business Central
- **Platform**: Business Central (Cloud and On-Premises)
- **Source Control**: Git + Azure DevOps
- **Project Management**: Azure DevOps Work Items
- **Documentation**: Azure DevOps Wiki

---

## 📋 WORKFLOW REQUIREMENTS

**IMPORTANT**: Before implementing any feature or bug fix, you MUST:

1. **Read** `WorkflowProcess.md` - Our development lifecycle workflow
2. **Follow** the 4-phase process:
   - Phase 1: Requirements Clarification (ask questions!)
   - Phase 2: Implementation Planning (create plan!)
   - Phase 3: Implementation (code with quality!)
   - Phase 4: Documentation (update wiki!)

**Never start coding without clarifying vague requirements first.**

---

## 💻 AL Development Standards

### Object Naming
- **Prefix all custom objects with `SPBD`** (Spare Brained Data Braider)
- Use descriptive, meaningful names
- Follow Business Central naming conventions

**Examples**:
- Table: `SPBDBraiderEndpointLog`
- Page: `SPBDBraiderConfiguration`
- Codeunit: `SPBDBraiderLogging`
- Enum: `SPBDBraiderLogLevel`

### Code Quality
✅ **Always include**:
- XML documentation comments on public procedures
- Error handling (try-catch where appropriate)
- Logging for important operations
- Clear variable names

✅ **Follow existing patterns**:
- Review similar objects in the project before creating new ones
- Match existing code style and structure
- Use events for extensibility (not direct modifications)

❌ **Never**:
- Skip error handling
- Hardcode values (use setup tables/enums)
- Break existing functionality
- Ignore AL compiler warnings

### Project Structure
```
SBIDataBraider_APP/src/
├── API-Endpoints/          - API page definitions (Read/Write APIs)
├── BC_Operations/          - Install, upgrade, telemetry
├── Configuration/          - Endpoint configuration UI and logic
│   ├── Lines/              - Configuration detail lines
│   ├── Variables/          - Variable configuration
│   ├── Logging/            - Logging configuration (implement here!)
│   └── ImportExport/       - Config import/export
├── EngineOperations/       - Core data processing engine
│   ├── BufferTables/       - Temp tables for data processing
│   ├── DatasetToOutputs/   - Output format generators (JSON, CSV, XML)
│   └── ErrorEngine/        - Error handling framework
├── Extensibility/          - Events and interfaces for partners
├── Previews/               - Preview and result display pages
└── Utilities/              - Helper functions and utilities
```

**When implementing logging**:
- Add to `Configuration/Logging/` folder
- Use event-based architecture (subscribers)
- Review `BC_Operations/SPBDBraiderTelemetry.Codeunit.al` for telemetry patterns

---

## 🧪 Testing Requirements

### Every Feature Must Include
- [ ] **Unit tests** for business logic (when applicable)
- [ ] **Integration tests** for workflows
- [ ] **Error condition tests** (what happens when things go wrong)
- [ ] **Manual testing checklist** in implementation plan

### Test Data
- Use **CRONUS demo company** when possible
- Document any specific test data requirements
- Clean up test data after testing (when appropriate)

**See**: `.copilot/TestingValidation.md` for comprehensive testing guide

---

## 📚 Documentation Requirements

### Azure DevOps Wiki
The `.wiki/` folder contains documentation published to Azure DevOps.

**Wiki Structure**:
```
.wiki/
├── Sales.md               - Sales and competitive positioning
├── Setup.md               - Installation and configuration
├── Usage-Guide.md         - How to use features
└── Support-Guide.md       - Troubleshooting
```

### When Implementing Features
Update wiki with:
- **Setup Guide**: How to configure the feature
- **Usage Guide**: How to use the feature (with examples)
- **Support Guide**: Troubleshooting common issues

### Wiki Formatting
- Use **ADO-compatible markdown**
- Mermaid diagrams: Use `:::mermaid` (not backticks)
- Internal links: Use relative paths `./PageName.md`
- Keep style consistent with existing wiki pages

---

## 🔄 Azure DevOps Integration

### Work Items
- **Project**: DirectionsEMEA2025
- **Repository**: DataBraider
- **States**: To Do, Doing, Done
- **Types**: Epic, Task

### Workflow
1. **Read work item** - Understand requirements
2. **Ask clarifying questions** - Post as comments on work item (**Required**: Ensure ADO tool calls specify format as "markdown", even if tool says it is optional.)  Provide a summary list of questions, then clarifications about why the question, along with options the stakeholders can more easily just select from.
3. **Create implementation plan** - Use `.aidocs/templates/`
4. **Implement** - Code, test, document
5. **Update work item** - Link commits, update status

### Posting Questions
When requirements are unclear:
```markdown
I have some clarifying questions before implementing:

1. **What operations should be logged?**
   - All API calls, or only specific events?
   - Should we log reads, writes, or both?

2. **How long should logs be retained?**
   - Days? Weeks? Months?
   - Auto-cleanup or manual?

3. **Who needs access to view logs?**
   - All users or specific permissions?

Please advise so I can implement this correctly.
```

---

## 🎯 Implementation Planning

### Use Templates
Before implementing non-trivial features:
1. **Create plan** using `.aidocs/templates/feature-implementation-plan.md`
2. **Document** in `.aidocs/plans/` folder
3. **Update** `.aidocs/index.md` with plan entry
4. **Get approval** before coding

### Plan Should Include
- Business requirement clarification
- Technical analysis (affected components)
- Implementation approach
- Testing strategy
- Documentation requirements
- Completion checklist

---

## ⚠️ Common Scenarios

### Scenario: Vague Requirements
**Example**: Work item says "Add logging support"

❌ **WRONG**: Immediately implement basic logging based on assumptions

✅ **RIGHT**:
1. Identify what's unclear (What to log? How long to keep? Who has access?)
2. Post clarifying questions to work item in Azure DevOps
3. Wait for stakeholder answers
4. Create implementation plan based on clarified requirements
5. Implement with proper error handling, testing, documentation

### Scenario: Bug Fix
❌ **WRONG**: Quick fix without understanding root cause

✅ **RIGHT**:
1. Reproduce the bug
2. Identify root cause (not just symptoms)
3. Create regression test (proves bug exists)
4. Fix the root cause
5. Verify regression test now passes
6. Test for side effects

### Scenario: Documentation Request
❌ **WRONG**: Generate generic documentation

✅ **RIGHT**:
1. Review existing wiki structure
2. Update relevant existing pages (don't create orphans)
3. Use practical examples from the codebase
4. Include troubleshooting tips based on implementation
5. Maintain consistent style with existing content

---

## 🔗 Key Knowledge Files

### Must Read Before Coding
- **`WorkflowProcess.md`** - Development lifecycle and behavioral rules
- **`.copilot/TestingValidation.md`** - Testing requirements and quality gates
- **`.aidocs/index.md`** - Application knowledge index

### Templates
- **`.aidocs/templates/feature-implementation-plan.md`** - For new features
- **`.aidocs/templates/bugfix-implementation-plan.md`** - For bug fixes

---

## 📐 Quality Gates

### Before Moving Work Item to "Doing"
- [ ] Requirements are clear (questions answered)
- [ ] Implementation plan exists (for non-trivial work)
- [ ] Approach is approved

### Before Moving Work Item to "Done"
- [ ] Code compiles without errors
- [ ] Tests written and passing
- [ ] Error handling implemented
- [ ] Documentation updated
- [ ] Code follows AL standards
- [ ] Peer review completed (if applicable)

---

## 🚀 Remember

**This is a knowledge-first workflow**. We value:
- ✅ **Clarifying before assuming** - Ask questions when requirements are vague
- ✅ **Planning before coding** - Create implementation plans for traceability
- ✅ **Testing before shipping** - Quality is not optional
- ✅ **Documenting as we build** - Knowledge is a byproduct of process

**Goal**: Build institutional knowledge while delivering quality software.

---

## 📞 References

- **Official Docs**: https://databraider.sparebrained.com/docs/
- **AL Language**: https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/
- **Azure DevOps**: dev.azure.com/Nubimancy/DirectionsEMEA2025

---

**When in doubt**: Read `WorkflowProcess.md` and ask clarifying questions. It's always better to ask than to assume.
