# AL Copilot Instructions

This folder contains GitHub Copilot instruction files that provide context-specific guidance for AL (Application Language) development in Microsoft Dynamics 365 Business Central.

## What are Instruction Files?

Instruction files (`.instructions.md`) are specialized markdown documents that enhance GitHub Copilot's capabilities by providing it with domain-specific knowledge and coding patterns. Think of them as a knowledge base that Copilot consults when generating code suggestions.

### Purpose of Instructions

Instructions serve multiple critical functions:

1. **Encode Best Practices**: Capture your organization's coding standards, naming conventions, and architectural patterns in a format Copilot can understand and apply
2. **Domain Knowledge Transfer**: Teach Copilot about Business Central-specific concepts, patterns, and frameworks that aren't part of its general training
3. **Consistency Enforcement**: Ensure all team members get consistent code suggestions that follow the same standards
4. **Onboarding Acceleration**: New developers get expert-level guidance through Copilot without extensive documentation reading
5. **Pattern Library**: Build a reusable library of proven patterns for common scenarios (error handling, integration, testing, etc.)

### What Instructions Contain

Instruction files typically include:
- **Coding Standards**: Naming conventions, file organization, code structure
- **Pattern Examples**: Working code examples showing the right way to solve common problems
- **Anti-Patterns**: Examples of what NOT to do, with explanations of why
- **Framework Knowledge**: Business Central-specific concepts, APIs, and best practices
- **Context Guidance**: When to apply certain patterns and techniques
- **Decision Trees**: Logic for choosing between different approaches

## Available Instruction

### **skill-creation-guide.instructions.md**

A comprehensive guide for creating high-quality GitHub Copilot skills for Business Central AL development.

**Covers:**
- Skill structure and YAML frontmatter formatting
- Business Central-specific patterns and conventions
- Writing effective workflow steps for AL development
- Terminal tool usage patterns
- Error handling and troubleshooting
- Documentation requirements (AUTHORS.md, CHANGELOG.md)
- Testing and validation checklists
- Contribution guidelines

**Use when:** 
- Creating new Copilot skills for AL/BC development
- Contributing skills to the AL-Copilot-Skills extension
- Reviewing or improving existing skills
- Learning how to structure automated AL workflows
- Understanding BC development best practices for skill creation

## How GitHub Copilot Uses This File

When creating or working with Copilot skills, GitHub Copilot:
1. Reads the skill-creation-guide from `.github/instructions/` 
2. Applies the documented patterns and structures when helping you create new skills
3. Ensures generated skills follow AL and Business Central best practices
4. Provides guidance on proper YAML frontmatter, workflow steps, and error handling
5. Helps maintain consistency across all skills in your workspace

## Customizing the Skill Creation Guide

You can modify the skill-creation-guide to match your organization's:
- Company-specific prefixes and naming conventions (default: `BCS`)
- Custom AL development workflows unique to your projects
- Additional skill categories relevant to your domain
- Internal documentation standards and requirements
- Specific Business Central version patterns

This allows contributors to create skills that perfectly align with your organization's standards.

## Adding New Skills (Not Instructions)

### Using the Agent-Customization Skill with the Guide (Recommended)

**The recommended way to create new AL Copilot skills** is to use GitHub Copilot's built-in `agent-customization` skill along with the skill-creation-guide instruction.

#### How to Create a New Skill

Simply ask GitHub Copilot:

```
@workspace /new Create a new Copilot skill for [AL development task]
```

**Examples:**

```
@workspace /new Create a new skill for generating AL report objects with layouts
```

```
@workspace /new Create a skill for BC permission set generation from existing objects
```

```
@workspace /new Create a skill to automate AL test codeunit creation
```

#### What Happens

When you request a new skill, Copilot will:

1. **Read the skill-creation-guide**: Consults the instruction file for BC-specific patterns
2. **Interview you**: Ask clarifying questions about the skill's purpose and requirements
3. **Research your codebase**: Analyze existing skills to maintain consistency
4. **Generate the skill**: Create properly structured SKILL.md with YAML frontmatter
5. **Create supporting files**: Generate AUTHORS.md, CHANGELOG.md, and reference docs
6. **Apply BC patterns**: Ensure AL naming conventions, file organization, and error handling
7. **Validate structure**: Check that all required components are present

#### The Guide Ensures:

- ✅ **Proper YAML frontmatter** with clear descriptions
- ✅ **Business Central naming conventions** (BCS prefix, AL syntax)
- ✅ **Actionable workflow steps** that Copilot can execute
- ✅ **Comprehensive error handling** for common AL development issues
- ✅ **Complete documentation** (AUTHORS.md, CHANGELOG.md, examples)
- ✅ **Terminal tool patterns** for PowerShell script execution
- ✅ **BC-specific patterns** (permission sets, file organization, object naming)

### Manual Skill Creation

To manually create a skill:

1. Create folder: `skills/bc-your-skill-name/`
2. Create `SKILL.md` following the guide's structure
3. Add YAML frontmatter with name and description
4. Write workflow steps as documented in the guide
5. Create `AUTHORS.md` and `CHANGELOG.md`
6. Add reference documentation in `references/` folder
7. Test the skill with real AL projects

Refer to the skill-creation-guide for detailed templates and examples.

## Tips for Effective Instructions

### Content Guidelines

1. **Be Specific**: Provide concrete examples rather than abstract guidelines
   - ✅ Good: "Use `SetLoadFields(Name, "No.")` before `FindSet()`"
   - ❌ Bad: "Optimize your queries"

2. **Show Don't Tell**: Use code examples liberally
   - Include at least one example per major concept
   - Show both correct and incorrect approaches
   - Use real-world scenarios from your domain

3. **Explain Context**: Help Copilot understand when to apply patterns
   - Include "When to Use" sections
   - Describe the problem being solved
   - Note any prerequisites or dependencies

4. **Include Anti-Patterns**: Teach what NOT to do
   - Show common mistakes
   - Explain why they're problematic
   - Provide the correct alternative

5. **Keep Updated**: Revise instructions as standards evolve
   - Review quarterly or when framework versions change
   - Remove outdated patterns
   - Add newly discovered best practices

6. **Stay Focused**: Each file should cover a specific domain
   - Don't mix unrelated topics
   - Keep files under 1000 lines
   - Split large topics into multiple focused files

### Writing Style

- **Use imperative mood**: "Use SetLoadFields" not "You should use SetLoadFields"
- **Be concise**: Each sentence should add value
- **Use formatting**: Bold, code blocks, and lists for clarity
- **Add comments**: Explain WHY in code comments, not just WHAT
- **Link concepts**: Reference related instruction files when relevant

### Quality Checklist

Before finalizing an instruction file, verify:

- [ ] Has clear purpose stated in opening paragraph
- [ ] Includes at least 3-5 concrete code examples
- [ ] Shows both good (✅) and bad (❌) patterns
- [ ] Explains when to use each pattern
- [ ] Uses consistent formatting throughout
- [ ] Code examples are syntactically correct
- [ ] Examples reflect current AL best practices
- [ ] File is organized with logical section flow
- [ ] Technical terms are used correctly
- [ ] No spelling or grammar errors

## Integration with Skills

These instruction files complement the GitHub Copilot skills in `.github/skills/`:

### Instructions vs Skills

| Aspect | Instructions | Skills |
|--------|-------------|--------|
| **Purpose** | Teach Copilot patterns and knowledge | Define specific workflows and tasks |
| **Format** | General markdown with examples | YAML frontmatter + task steps |
| **Usage** | Passive - always consulted by Copilot | Active - explicitly invoked for tasks |
| **Scope** | Broad domain knowledge | Specific automated workflows |
| **Examples** | "How to write performant AL code" | "Generate a Dataverse entity table" |
| **Updates** | Evolves with best practices | Tied to specific tool versions |

### How They Work Together

1. **Instructions provide the foundation**: Copilot learns your patterns and conventions
2. **Skills execute complex tasks**: Copilot applies instruction knowledge while running skills
3. **Instructions inform skill suggestions**: When skills generate code, they follow instruction patterns
4. **Skills can reference instructions**: Workflow steps can direct Copilot to specific instruction sections

### Example Workflow

```
Contributor: "I want to create a skill for generating BC report objects"
↓
Copilot Reads: skill-creation-guide.instructions.md
↓
Copilot Helps:
  - Structure YAML frontmatter correctly
  - Organize workflow steps for AL report generation
  - Include BC-specific naming conventions
  - Add proper error handling
  - Create documentation files (AUTHORS.md, CHANGELOG.md)
↓
Result: Well-structured, maintainable skill following AL-Copilot-Skills standards
```

### Creating Instructions That Support Skills

When creating new instructions, consider how they'll enhance skills:

1. **Document patterns skills will generate**: If you have a skill that creates tables, document table patterns in instructions
2. **Reference conventions skills should follow**: Skills can be told to follow instruction patterns
3. **Provide templates**: Include full code templates that skills can adapt
4. **Cover edge cases**: Document special scenarios skills might encounter

## Getting Started

### For Skill Contributors

Want to add a new skill to AL-Copilot-Skills?

1. **Read the skill-creation-guide**: Understand the structure and requirements
2. **Identify a workflow**: Find a repetitive AL development task to automate
3. **Ask Copilot**: Use `@workspace /new Create a skill for [task]`
4. **Test thoroughly**: Verify in a real BC project
5. **Submit PR**: Follow contribution guidelines in the guide

### For Extension Users

As a BC developer using this extension:

1. **Skills are ready to use**: Just run "AL Copilot: Install Skills"
2. **Skills auto-improve**: New skills created with the guide maintain quality
3. **Request new skills**: Open issues on GitHub for workflows you'd like automated
4. **Contribute**: Use the guide to create skills and contribute back

### For Extension Maintainers

Managing the AL-Copilot-Skills extension:

1. **Enforce the guide**: Ensure all PRs follow skill-creation-guide patterns
2. **Update the guide**: Add new patterns as BC framework evolves
3. **Review contributions**: Use guide's checklist to validate skill quality
4. **Share examples**: Reference existing skills that follow best practices

## Troubleshooting

### Copilot Not Following the Guide When Creating Skills

If Copilot doesn't apply the guide's patterns:

1. **Check file location**: Must be in `.github/instructions/`
2. **Verify file name**: Must be `skill-creation-guide.instructions.md`
3. **Restart VS Code**: Copilot reloads instructions on restart
4. **Be explicit**: Say \"following the skill-creation-guide\" in your request
5. **Check file encoding**: Use UTF-8 encoding
6. **Reference explicitly**: \"@workspace /new Create a BC skill using the skill-creation-guide\"

### Improving the Guide

Use the agent-customization skill to:
- Review the skill-creation-guide for gaps
- Add new BC-specific patterns
- Update for new Business Central versions
- Improve examples based on real skill usage

Simply ask: `@workspace Can you review the skill-creation-guide and suggest improvements for [aspect]?`

### Getting Help

- **For skill structure questions**: Refer to existing skills in `.github/skills/`
- **For AL patterns**: Check Microsoft Learn BC documentation
- **For contribution help**: Open discussion on GitHub repository
- **For guide improvements**: Submit PR with suggested changes

## Additional Resources

- **VS Code Copilot Documentation**: [GitHub Copilot in VS Code](https://code.visualstudio.com/docs/copilot/overview)
- **Copilot Customization**: [Copilot Extensibility](https://code.visualstudio.com/docs/copilot/copilot-customization)
- **Agent Customization Guide**: Available via `@workspace /help agent-customization`
- **AL Language Documentation**: [Microsoft Learn - AL Development](https://learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-dev-overview)
- **Existing Skills**: Browse `.github/skills/` for examples of well-structured skills
- **Skill Creation Guide**: The actual instruction file with comprehensive templates and patterns

---

**Maintained by:** AL Copilot Skills Extension Contributors  
**Version:** 1.0  
**Last Updated:** March 2026

**Contributing:** Want to improve the skill-creation-guide or add a new skill? Submit a PR to the [AL Copilot Skills repository](https://github.com/fernandoartalf/AL-Copilot-Skills)

**Purpose:** This folder contains the instruction that guides skill creation for AL development. Unlike typical instruction files that teach coding patterns, this instruction teaches how to create Copilot skills themselves.
