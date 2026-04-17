# Workflow Process - Data Braider Development

**Purpose**: Guide AI agents to follow our team development workflow and quality gates.

---

## 🏗️ DEVELOPMENT LIFECYCLE WORKFLOW

When implementing features or fixing bugs in Data Braider, follow this structured workflow:

### PHASE 1: REQUIREMENTS CLARIFICATION

**BEFORE writing any code, clarify requirements with stakeholders:**

1. **Identify Gaps in Requirements**
   - What is unclear or underspecified?
   - What assumptions would you need to make?
   - What edge cases haven't been addressed?

2. **Ask Clarifying Questions via Azure DevOps**
   - Post questions as comments on the work item
   - Be specific about what you need to know
   - Explain why the information is needed

3. **Document Decisions**
   - Record stakeholder answers in work item comments
   - Update work item description with clarified requirements
   - Ensure traceability from requirement to implementation

**DO NOT proceed to implementation until key questions are answered.**

---

### PHASE 2: IMPLEMENTATION PLANNING

Once requirements are clear:

1. **Create Implementation Plan**
   - Document in `.aidocs/plans/` folder
   - Use template from `.aidocs/templates/`
   - Include:
     - Affected components
     - Data model changes
     - Integration points
     - Testing approach

2. **Consider Quality Requirements**
   - Error handling strategy
   - Logging and diagnostics
   - Performance implications
   - Security considerations

3. **Plan Testing**
   - What needs to be tested?
   - What test data is required?
   - Manual vs. automated testing

**Get approval on implementation plan before coding.**

---

### PHASE 3: IMPLEMENTATION

Follow AL development best practices:

1. **Code with Quality**
   - Include XML documentation comments
   - Handle errors appropriately
   - Follow Data Braider naming conventions (SPBD prefix)
   - Write clean, readable code

2. **Implement Logging**
   - Use event-based logging patterns
   - Log important operations
   - Include diagnostic information

3. **Write Tests** (when applicable)
   - Unit tests for business logic
   - Integration tests for workflows
   - Test error conditions

---

### PHASE 4: DOCUMENTATION

After implementation is complete:

1. **Update Wiki Documentation**
   - Add to Setup section for configuration
   - Add to Usage section for how-to guides
   - Add to Support section for troubleshooting

2. **Maintain Consistency**
   - Match existing wiki style
   - Use practical examples
   - Include screenshots/diagrams when helpful

3. **Update .aidocs Index**
   - Link implementation plan
   - Document key decisions
   - Record completion status

---

## 🎯 BEHAVIORAL RULES FOR AI AGENTS

### ALWAYS DO:
✅ **Ask clarifying questions** before making assumptions  
✅ **Document decisions** in Azure DevOps  
✅ **Create implementation plans** for non-trivial work  
✅ **Include error handling** in all code  
✅ **Write tests** for new functionality  
✅ **Update documentation** after implementation  
✅ **Follow existing code patterns** in the project

### NEVER DO:
❌ **Start coding without clarifying vague requirements**  
❌ **Make major assumptions without stakeholder input**  
❌ **Skip documentation updates**  
❌ **Ignore testing requirements**  
❌ **Provide code without error handling**  
❌ **Break existing functionality**

---

## 📋 WORK ITEM INTEGRATION

### Work Item States (Simplified)
- **To Do**: Not started, requirements may need clarification
- **Doing**: Active development in progress
- **Done**: Implementation complete, tested, documented

### When Moving to "Doing"
- Requirements are clear
- Implementation plan exists
- You're ready to code

### When Moving to "Done"
- Code is complete and tested
- Documentation is updated
- Work item has traceability to implementation

---

## 🧪 TESTING EXPECTATIONS

### For New Features
- **Write tests** for business logic
- **Test error conditions** and edge cases
- **Verify integration points** with existing features

### For Bug Fixes
- **Create test** that reproduces the bug
- **Verify fix** resolves the issue
- **Test for regressions** in related areas

### Test Data
- Use realistic test scenarios
- Consider BC demo data (CRONUS)
- Document any special test setup required

---

## 📚 DOCUMENTATION EXPECTATIONS

### Wiki Updates Required
When implementing features that users will interact with:

1. **Setup Documentation**
   - How to configure the feature
   - Prerequisites and permissions
   - Initial setup steps

2. **Usage Documentation**
   - How to use the feature
   - Common workflows
   - Examples

3. **Support Documentation**
   - Troubleshooting common issues
   - Error messages and solutions
   - Performance tips

### Documentation Style
- **Practical and actionable** - focus on how-to
- **Use examples** - show, don't just tell
- **Scannable format** - use tables, lists, headers
- **ADO wiki compatible** - use `:::mermaid` for diagrams

---

## 🔄 EXAMPLE WORKFLOW

**Scenario**: Work item says "Add logging support"

### ❌ WRONG APPROACH (Vibe Coding)
1. Look at work item
2. Implement logging based on assumptions
3. Commit code
4. Consider it done

### ✅ CORRECT APPROACH (Knowledge-First)
1. **Review work item** - identify vague areas
2. **Ask questions** in ADO comments:
   - "What should be logged? All API calls or only errors?"
   - "How long should logs be retained?"
   - "Who needs access to view logs?"
   - "What performance impact is acceptable?"
3. **Wait for answers** from stakeholders
4. **Create implementation plan** based on clarified requirements
5. **Implement** with proper logging, error handling, tests
6. **Update wiki** with logging setup, usage, and troubleshooting guides
7. **Move to Done** with full traceability

---

## 📍 REFERENCE MATERIALS

- **Implementation Plan Templates**: `.aidocs/templates/`
- **Azure DevOps Workflow**: `.docs/example-knowledge/.copilot/DevOpsWorkflow/`
- **Testing Guidance**: `.docs/example-knowledge/.copilot/TestingValidation/`
- **Data Braider Wiki**: `.wiki/` folder

---

**Remember**: This workflow ensures quality, traceability, and team collaboration. It may feel slower initially, but it prevents rework and builds institutional knowledge.
