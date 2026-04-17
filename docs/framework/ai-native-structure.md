---
layout: docs
title: "Getting Started"
display_title: "Getting Started"
permalink: /docs/getting-started/
nav_order: 3
---
---
## This document is a copy from https://danielmeppiel.github.io/awesome-ai-native/docs/concepts/ .
---
Now that you understand the [three-layer framework](./ai-native-concepts.md), it's time to build your first Agent Primitives. This hands-on implementation will give you immediate productivity improvements while establishing the foundation for more advanced workflows.

The setup follows a logical progression: start with instructions that guide AI behavior, add agents that create safe boundaries, build reusable prompts for common tasks, and create specification templates that bridge planning to implementation.

## Instructions Architecture

Instructions form the bedrock of reliable AI behavior: they're the persistent rules that guide the Agent without cluttering your imMEDIUMte context. Rather than repeating the same guidance in every conversation, instructions embed your team's knowledge directly into the AI's reasoning process.

The key insight is modularity: instead of one massive instruction file that applies everywhere, you create targeted files that activate only when working with specific technologies or file types. This context engineering approach keeps your AI focused and your guidance relevant.

**✅ Quick Actions:**
- Create the general [`copilot-instructions.md`](https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilot-instructionsmd-file) file in the `.github` folder for the repository with common rules
- Create modular [`.instructions.md` files](https://code.visualstudio.com/docs/copilot/copilot-customization#_use-instructionsmd-files) in the `.github/instructions/` folder by domain (frontend, backend, testing, docs, specs...)
- Use [`applyTo: "**/*.{js,ts...}"`](https://code.visualstudio.com/docs/copilot/copilot-customization#_instructions-file-structure) patterns for selective application
- Compile to [AGENTS.md standard](https://agents.md) so your context works across all coding agents. See the [Collection Guide](../al-development.md) to understand how ALDC organizes context, workflows, and reusable primitives.

> 💡 **Context Engineering in Action**: Modular instructions preserve context space by loading only relevant guidelines when working on specific file types, leaving maximum buffer for code understanding.

### 🔧 Tools & Files:
```
.github/
├── copilot-instructions.md          # Global repository rules
└── instructions/
    ├── frontend.instructions.md     # applyTo: "**/*.{jsx,tsx,css}"
    ├── backend.instructions.md      # applyTo: "**/*.{py,go,java}"
    └── testing.instructions.md      # applyTo: "**/test/**"

# After context compilation:
# Nested AGENTS.md files auto-generated in optimal locations
```

### Example: Markdown Prompt Engineering in Instructions
Create your `.github/instructions/frontend.instructions.md` file:

```markdown
---
applyTo: "**/*.{ts,tsx}"
description: "TypeScript development guidelines with context engineering"
---
# TypeScript Development Guidelines

## Context Loading
Review [project conventions](../docs/conventions.md) and 
[type definitions](../types/index.ts) before starting.

## Deterministic Requirements
- Use strict TypeScript configuration
- Implement error boundaries for React components
- Apply ESLint TypeScript rules consistently

## Structured Output
Generate code with:
- [ ] JSDoc comments for all public APIs
- [ ] Unit tests in `__tests__/` directory
- [ ] Type exports in appropriate index files
```

**⚠️ Checkpoint:** Instructions are modular, targeted, and ready to compile

## Agents Configuration

With your instruction architecture in place, you need a way to enforce domain boundaries and prevent AI agents from overstepping their expertise. Agents solve this by creating professional boundaries similar to real-world licensing—architects plan but don’t build, engineers execute but don’t set strategy.

**✅ Quick Actions:**
- Define domain-specific [custom agents](https://code.visualstudio.com/docs/copilot/chat/chat-modes) with MCP tool boundaries
- Encapsulate tech stack knowledge and guidelines per mode
- Define the most appropriate [LLM model](https://code.visualstudio.com/docs/copilot/chat/chat-modes#_chat-mode-file-example) for your agent like `Claude Sonnet 4`
- Configure secure [MCP tool access](https://code.visualstudio.com/docs/copilot/chat/chat-modes#_chat-mode-file-example) to prevent cross-domain security breaches

> 💡 **Security Through MCP Tool Boundaries**: Each agent receives only the specific MCP tools needed for their domain - preventing dangerous access escalation and cross-contamination. Like professional licensing, a planning mode can't execute destructive commands, and a frontend mode can't access backend databases.

### 🔧 Tools & Files:
```
.github/
└── agents/
    ├── architect.agent.md                # Planning specialist - designs, cannot execute
    ├── frontend-engineer.agent.md        # UI specialist - builds interfaces, no backend access
    ├── backend-engineer.agent.md         # API specialist - builds services, no UI modification
    └── technical-writer.agent.md         # Documentation specialist - writes docs, cannot run code
```

### Example: MCP Tool Boundary Implementation
Create your `.github/agents/backend-engineer.agent.md` file:

```yaml
---
description: 'Backend development specialist with security focus'
tools: ['changes', 'codebase', 'editFiles', 'runCommands', 'runTasks', 
        'search', 'problems', 'testFailure', 'terminalLastCommand']
model: Claude Sonnet 4.5
---

You are a backend development specialist focused on secure API development, database design, and server-side architecture. You prioritize security-first design patterns and comprehensive testing strategies.

## Domain Expertise
- RESTful API design and implementation
- Database schema design and optimization  
- Authentication and authorization systems
- Server security and performance optimization

You master the backend of this project thanks to you having read all [the backend docs](../../docs/backend).

## Tool Boundaries
- **CAN**: Modify backend code, run server commands, execute tests
- **CANNOT**: Modify client-side assets
```

### Security & Professional Boundaries:
- **Architect mode**: Research tools only - **cannot execute destructive commands or modify production code**
- **Frontend Engineer mode**: UI development tools only - **cannot access databases or backend services** 
- **Backend Engineer mode**: API and database tools only - **cannot modify user interfaces or frontend assets**
- **Technical Writer mode**: Documentation tools only - **cannot run code, deploy, or access sensitive systems**

*Like real-world professional licenses, each mode operates within its area of competence and cannot overstep into dangerous territory.*

**⚠️ Checkpoint:** Each mode has clear boundaries and tool restrictions

## Agentic Workflows

Agents create the safety boundaries, but you still need efficient ways to execute complete development processes. **Agentic Workflows** are implemented as reusable `.prompt.md` files that orchestrate all your primitives into systematic, end-to-end processes.

**✅ Quick Actions:**
- Create [`.prompt.md` files](https://code.visualstudio.com/docs/copilot/copilot-customization#_prompt-files-experimental) for complete development processes
- Build in mandatory human validation points
- Design workflows for both local execution and async delegation

> 💡 **Agentic Workflows**: These `.prompt.md` files are your complete systematic processes that combine all primitives (instructions, modes, specs, context) into repeatable workflows that can be executed locally or delegated to async agents.

### 🔧 Tools & Files:
```
.github/prompts/
├── code-review.prompt.md           # With validation checkpoints
├── feature-spec.prompt.md          # Spec-first methodology
└── async-implementation.prompt.md  # GitHub Coding Agent delegation
```

### Example: Complete Agentic Workflow
Create your `.github/prompts/feature-spec.prompt.md` file:

```markdown
---
mode: agent
model: gpt-4
tools: ['file-search', 'semantic-search', 'github']
description: 'Feature implementation workflow with validation gates'
---
# Feature Implementation from Specification

## Context Loading Phase
1. Review [project specification](${specFile})
2. Analyze [existing codebase patterns](./src/patterns/)
3. Check [API documentation](./docs/api.md)

## Deterministic Execution
Use semantic search to find similar implementations
Use file search to locate test patterns: `**/*.test.{js,ts}`

## Structured Output Requirements
Create implementation with:
- [ ] Feature code in appropriate module
- [ ] Comprehensive unit tests (>90% coverage)
- [ ] Integration tests for API endpoints
- [ ] Documentation updates

## Human Validation Gate
🚨 **STOP**: Review implementation plan before proceeding to code generation.
Confirm: Architecture alignment, test strategy, and breaking change impact.
```

**⚠️ Checkpoint:** Prompts include explicit validation gates

## Specification Templates

The final piece of your foundation addresses the gap between planning and implementation. Specification templates transform high-level ideas into implementation-ready blueprints that work consistently whether executed by humans or AI agents.

These `.spec.md` templates are the foundation of **spec-driven team workflows**. When you scale this approach across a team, product owners can use these templates during sprint planning to create explicit, agent-executable specifications. [Spec-Kit](https://github.com/github/spec-kit) provides `/speckit.specify` commands that generate these files following the constitution → specify → plan → tasks → implement pattern, but understanding the underlying template structure gives you flexibility to customize for your team's needs.

**✅ Quick Actions:**
- Create standardized [`.spec.md` templates](https://docs.github.com/en/copilot/copilot-chat/copilot-chat-cookbook) for feature specifications
- Build implementation-ready blueprints with validation criteria
- Design for deterministic handoff between planning and execution phases

> 💡 **Bridge Primitive**: Specification files transform planning-phase thinking into implementation-ready artifacts that work reliably across different executors (human or AI).

### 🔧 Tools & Files:
```
.github/specs/
├── feature-template.spec.md        # Standard feature specification template
├── api-endpoint.spec.md           # API-specific specification template
└── component.spec.md              # UI component specification template
```

### Example: Implementation-Ready Specification

Create a `.github/specs/jwt-auth.spec.md` file:

```markdown
# Feature: User Authentication System

## Problem Statement
Users need secure access to the application with JWT-based authentication.

## Approach
Implement middleware-based authentication with token validation and refresh capabilities.

## Implementation Requirements
### Core Components
- [ ] JWT middleware (`src/middleware/auth.ts`)
- [ ] Token service (`src/services/token.ts`)
- [ ] User validation (`src/services/user.ts`)

### API Contracts
- `POST /auth/login` - Returns JWT token
- `POST /auth/refresh` - Refreshes expired token
- `GET /auth/verify` - Validates current token

### Validation Criteria
- [ ] Handles malformed tokens with 401 status
- [ ] Token expiration properly managed
- [ ] Refresh token rotation implemented
- [ ] Unit tests >90% coverage
- [ ] Integration tests for all endpoints

## Handoff Checklist
- [ ] Architecture approved by team lead
- [ ] Database schema finalized
- [ ] Security review completed
- [ ] Implementation ready for assignment
```

**⚠️ Checkpoint:** Specifications are implementation-ready before delegation

## Quick Start Checklist

With all primitives in place, you now have a complete foundation for systematic AI development. The checklist below walks through the implementation sequence, building toward creating complete Agentic Workflows.

### Conceptual Foundation
1. **[ ]** Understand **Markdown Prompt Engineering** principles (semantic structure + precision + tools)
2. **[ ]** Grasp **Context Engineering** fundamentals (context window optimization + session strategy)

### Implementation Steps  
4. **[ ]** Create [`.github/copilot-instructions.md`](https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilot-instructionsmd-file) with basic project guidelines (Context Engineering: global rules)
5. **[ ]** Set up domain-specific [`.instructions.md` files](https://code.visualstudio.com/docs/copilot/copilot-customization#_use-instructionsmd-files) with `applyTo` patterns (Context Engineering: selective loading)
6. **[ ]** Compile instructions to `AGENTS.md` standard for universal portability—see the [Collection Guide](../al-development.md)
7. **[ ]** Configure [agents](https://code.visualstudio.com/docs/copilot/copilot-customization#_custom-chat-modes) for your tech stack domains (Context Engineering: domain boundaries)
8. **[ ]** Create your first [`.prompt.md` Agentic Workflow](https://code.visualstudio.com/docs/copilot/copilot-customization#_prompt-files-experimental)
9. **[ ]** Build your first `.spec.md` template for feature specifications (Agent Primitive: deterministic planning-to-implementation bridge)
10. **[ ]** Practice a spec-first approach with two Agentic Workflows (session splitting): plan first, implement second

## What's Next?

**Foundation Complete?** You've built your first Agent Primitives and understand how they work. Before diving into execution strategies, continue to the [Collection Guide](../al-development.md) to understand the structure that makes these primitives reusable across agents, workflows, and validation tooling.

**Want to understand the theory better?** Return to [Core Concepts](./ai-native-concepts.md) for deeper theoretical understanding.

**Ready to jump ahead?** After the Collection Guide, review the [Orchestration Architecture](./orchestration-architecture.md) and the [Complete Development Flow](../workflows/complete-development-flow.md) for execution strategies and team-friendly implementation patterns.

*You now have complete Agent Primitives and your first Agentic Workflow. The next step is understanding the infrastructure that makes these primitives executable, shareable, and production-ready.*
