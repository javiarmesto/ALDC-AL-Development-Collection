# Copilot Reference (ALDC Core v1.1)

> Human-facing reference material moved out of `.github/copilot-instructions.md` to keep that file
> a lean, always-on entrypoint. Nothing here is operational routing logic — it is examples,
> workspace layout, links, and troubleshooting. The entrypoint links here under "Further Reference".

## Code Generation Examples

### Table with Validation

```al
// Ask Copilot: "Create a table for customer addresses with validation"
table 50100 "Customer Address"
{
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Customer No."; Code[20])
        {
            TableRelation = Customer."No.";
            NotBlank = true;
        }
        field(2; "Address Line 1"; Text[100])
        {
            Caption = 'Address Line 1';
        }
        field(3; "City"; Text[50])
        {
            Caption = 'City';
        }
        field(4; "Post Code"; Code[20])
        {
            Caption = 'Post Code';
        }
    }

    keys
    {
        key(PK; "Customer No.")
        {
            Clustered = true;
        }
    }
}
```

**Auto-applied** (for `CustomerAddress.Table.al`): al-guidelines, al-code-style, al-naming-conventions

### Event Subscriber

```al
// Ask: "Create event subscriber for customer validation"
[EventSubscriber(ObjectType::Table, Database::Customer, 'OnBeforeValidateEvent', 'Email', false, false)]
local procedure ValidateCustomerEmail(var Rec: Record Customer)
begin
    if Rec.Email <> '' then
        if not Rec.Email.Contains('@') then
            Error('Email must contain @');
end;
```

**Auto-applied** (for `SalesEventHandler.Codeunit.al`): al-guidelines, al-code-style, al-naming-conventions, al-performance, al-error-handling, al-events

## Best Practices for Copilot Interaction

### 1. Start with Context

- **Good**: "I'm building a customer approval workflow that needs to send notifications"
- **Avoid**: "Create a workflow"

### 2. Use the Right Tool

- **Strategic questions** → Use agents (`@AL Architecture & Design Specialist`, `@AL Implementation Specialist`, etc.)
- **Tactical tasks** → Use workflows (`@workspace use al-build`)
- **Normal coding** → Let auto-applied instructions work in background

### 3. Trust the Auto-Instructions

The instruction files work automatically:
- You don't need to ask for proper naming (al-naming-conventions handles it)
- You don't need to request performance optimization (al-performance suggests it)
- Error handling patterns apply automatically (al-error-handling activates)

### 4. Review Generated Code

Always review Copilot suggestions:
- Verify compliance with project guidelines
- Test in sandbox environment
- Check security implications
- Validate performance impact

## Workspace Structure

```
ALDC-Core/
├── instructions/
│   ├── copilot-instructions.md                  # Always-on entrypoint
│   ├── al-guidelines.instructions.md            # Core principles (**/*.al)
│   ├── al-code-style.instructions.md            # Indent, PascalCase, feature folders (**/*.al)
│   ├── al-naming-conventions.instructions.md    # 26-char limit, file pattern (**/*.al)
│   ├── al-performance.instructions.md           # Query/loop rules (**/*.Codeunit.al, **/*.Query.al)
│   ├── al-error-handling.instructions.md        # TryFunctions, Labels (**/*.Codeunit.al)
│   ├── al-events.instructions.md                # Subscribers, no Commit (**/*.Codeunit.al)
│   └── al-testing.instructions.md               # Given/When/Then (**/test/**/*.al)
├── agents/
│   ├── al-architect.agent.md              # Architecture & design
│   ├── al-developer.agent.md              # Tactical implementation
│   ├── al-conductor.agent.md              # TDD orchestrator
│   ├── al-presales.agent.md               # Estimation & planning
│   ├── AL Planning Subagent.agent.md      # Research (internal, user-invocable: false)
│   ├── AL Implementation Subagent.agent.md     # TDD implementation (internal)
│   └── AL Code Review Subagent.agent.md        # Code review (internal)
├── skills/                                # Composable knowledge modules (11)
│   ├── skill-api/SKILL.md
│   ├── skill-copilot/SKILL.md
│   ├── skill-debug/SKILL.md
│   ├── skill-events/SKILL.md
│   ├── skill-estimation/SKILL.md
│   ├── skill-migrate/SKILL.md
│   ├── skill-pages/SKILL.md
│   ├── skill-performance/SKILL.md
│   ├── skill-permissions/SKILL.md
│   ├── skill-testing/SKILL.md
│   └── skill-translate/SKILL.md
├── prompts/                               # Workflows (6)
│   ├── al-spec.create.prompt.md
│   ├── al-build.prompt.md
│   ├── al-pr-prepare.prompt.md
│   ├── al-memory.create.prompt.md
│   ├── al-context.create.prompt.md
│   └── al-initialize.prompt.md
├── docs/
│   ├── framework/
│   │   └── ALDC-Core-Spec-v1.1.md         # Normative specification
│   └── templates/                         # Immutable templates
├── .github/plans/                         # Requirement sets & memory
├── src/                                   # Your AL code
└── app.json
```

## BC Agents Pack (Extension)

For agent development with AI Development Toolkit:
- @AL Agent Builder — standalone agent builder (7-phase workflow)
- skill-agent-task-patterns — 8 SDK integration patterns
- skill-agent-instructions — instruction authoring framework
- al-agent.create / al-agent.task / al-agent.instructions / al-agent.test — workflows

Integrated mode: @AL Architecture & Design Specialist + al-spec.create + @AL Development Conductor
(architect loads skill-agent-task-patterns for design decisions)

## Reference Documentation

### Microsoft Documentation

- [AL Language Reference](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-reference-overview)
- [Business Central Development](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/)
- [VS Code Copilot Guide](https://code.visualstudio.com/docs/copilot)

### This Project's Documentation

- [Instructions Index](../instructions/index.md) — Guide to all instruction files
- [AL Guidelines](../instructions/al-guidelines.instructions.md) — Core principles
- [Skills Creation Guide](skills-creation-guide.md) — How to author new skills

## Troubleshooting Copilot

### No Suggestions Appearing

1. Check Copilot extension is enabled (View → Extensions)
2. Verify file type is `.al`
3. Try reloading VS Code window

### Suggestions Don't Follow Guidelines

1. Ensure instruction files are in correct locations
2. Check file glob patterns in instruction frontmatter
3. Reference specific guidelines: "Follow al-code-style patterns"
